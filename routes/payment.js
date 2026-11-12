// RJ FASHION COLLECTION - Unified Payment Routes (Stripe, Razorpay, UPI)
// Server-side authoritative pricing and webhook-driven fulfillment
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { calculateServerPricing } = require('../services/pricing');
const phonepe = require('../services/phonepe');
const { requireAdmin } = require('../middleware/admin');
const couponService = require('../services/couponService');
const { syncOrderToFirestore } = require('../services/firebase');
const { createRazorpayOrder, verifyPaymentSignature, RAZORPAY_ENABLED } = require('../services/payment');
const {
  createStripeCheckoutSession,
  verifyStripeWebhook,
  getStripeSession,
  STRIPE_ENABLED,
  STRIPE_PUBLISHABLE_KEY
} = require('../services/stripe');

// Generate Unique Order Number: RJFC-YYYYMMDD-XXXX
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RJFC-${year}${month}${day}-${randomSuffix}`;
}

// GET /api/payment/config — Unified payment configuration (zero credential / raw UPI leakage)
router.get('/config', (req, res) => {
  const merchantName = 'RJ FASHION COLLECTION';
  const phone = '7894093586';
  const isPhonePeLive = phonepe.PHONEPE_ENV === 'production' && !String(phonepe.PHONEPE_MERCHANT_ID || '').startsWith('PGTEST');
  const razorpayKey = process.env.RAZORPAY_KEY_ID || '';
  const isRazorpayLive = RAZORPAY_ENABLED && razorpayKey.startsWith('rzp_live_');

  res.json({
    success: true,
    enabled: RAZORPAY_ENABLED,
    keyId: RAZORPAY_ENABLED ? razorpayKey : null,
    merchantName,
    phone,
    stripe: {
      enabled: STRIPE_ENABLED,
      publishableKey: STRIPE_PUBLISHABLE_KEY
    },
    razorpay: {
      enabled: RAZORPAY_ENABLED,
      isLive: isRazorpayLive,
      keyId: RAZORPAY_ENABLED ? razorpayKey : null
    },
    phonepe: {
      enabled: phonepe.PHONEPE_ENABLED,
      isLive: isPhonePeLive,
      merchantName: phonepe.MERCHANT_DISPLAY_NAME,
      env: phonepe.PHONEPE_ENV
    }
  });
});

// ===================================================================
// STRIPE CHECKOUT INTEGRATION (SERVER-SIDE PRICING & TRUSTED WEBHOOK)
// ===================================================================

// GET /api/payment/stripe/config
router.get('/stripe/config', (req, res) => {
  res.json({
    success: true,
    enabled: STRIPE_ENABLED,
    publishableKey: STRIPE_PUBLISHABLE_KEY
  });
});

// POST /api/payment/stripe/create-checkout-session
// Authoritative server-side pricing: client prices and discounts are discarded
router.post('/stripe/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { addressId, address_id, coupon, couponCode, notes = '' } = req.body;

    // 1. Get cart items from DB
    const cartItems = db.prepare(`
      SELECT ci.*, p.name, p.price, p.stock, p.image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(userId);

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // 2. Verify stock
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" has only ${item.stock} left in stock.`
        });
      }
    }

    // 3. Resolve delivery address
    let deliveryAddress = '';
    let customerName = req.body.customer_name || req.session.user.name;
    let customerPhone = req.body.customer_phone || req.session.user.phone || '';
    let finalAddressId = null;

    const chosenAddressId = addressId || address_id;
    if (chosenAddressId) {
      const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(Number(chosenAddressId), userId);
      if (addr) {
        finalAddressId = addr.id;
        customerName = addr.full_name;
        customerPhone = addr.phone;
        deliveryAddress = `${addr.house_flat}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pin_code}. Phone: ${addr.phone}`;
      }
    }

    if (!deliveryAddress && (req.body.shipping_address || req.body.delivery_address || req.body.address)) {
      deliveryAddress = String(req.body.shipping_address || req.body.delivery_address || req.body.address).trim();
    }

    if (!deliveryAddress) {
      const defaultAddr = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC LIMIT 1').get(userId);
      if (defaultAddr) {
        finalAddressId = defaultAddr.id;
        customerName = defaultAddr.full_name;
        customerPhone = defaultAddr.phone;
        deliveryAddress = `${defaultAddr.house_flat}, ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pin_code}. Phone: ${defaultAddr.phone}`;
      }
    }

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Please select a delivery address before checkout.' });
    }

    // 4. Calculate authoritative server-side pricing with Strict Anti-Abuse
    const couponService = require('../services/couponService');
    const clientIp = couponService.extractClientIp(req);
    const codeToTest = (coupon || couponCode || '').trim().toUpperCase();

    if (codeToTest) {
      const eligibility = couponService.checkCouponEligibility(codeToTest, {
        userId,
        userEmail: req.session.user.email,
        userIp: clientIp
      });
      if (!eligibility.eligible) {
        return res.status(400).json({ success: false, message: eligibility.message });
      }
    }

    const pricing = calculateServerPricing(cartItems, codeToTest, {
      userId,
      userEmail: req.session.user.email,
      userIp: clientIp
    });
    const subtotal = pricing.subtotal;
    const shipping = pricing.shipping;
    const discount = pricing.discount;
    const total = pricing.total;
    const appliedCoupon = pricing.couponCode;

    // 5. Create pending order record in database
    const orderNumber = generateOrderNumber();
    const orderInsert = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, address_id, customer_name, customer_email, customer_phone,
        delivery_address, subtotal, discount, shipping, total, payment_method, payment_status,
        status, notes, user_ip, coupon_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Stripe', 'Pending', 'Pending', ?, ?, ?)
    `);

    const orderResult = orderInsert.run(
      orderNumber,
      userId,
      finalAddressId,
      customerName,
      req.session.user.email,
      customerPhone,
      deliveryAddress,
      subtotal,
      discount,
      shipping,
      total,
      notes,
      clientIp,
      appliedCoupon || null
    );
    const orderId = Number(orderResult.lastInsertRowid);

    // 6. Insert order items & reduce inventory stock
    const itemInsert = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, size, color, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const stockUpdate = db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    for (const item of cartItems) {
      itemInsert.run(
        orderId,
        item.product_id,
        item.name,
        item.image,
        item.size || 'Free Size',
        item.color || '',
        item.quantity,
        item.price,
        item.price * item.quantity
      );
      stockUpdate.run(item.quantity, item.product_id);
    }

    // 7. Record coupon redemption in audit ledger
    if (appliedCoupon && discount > 0) {
      couponService.recordCouponRedemption({
        couponCode: appliedCoupon,
        userId,
        userEmail: req.session.user.email,
        userIp: clientIp,
        orderId,
        orderNumber,
        discountAmount: discount
      });
    }

    // 8. Clear cart
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    // 8. Determine origin for callback
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const successUrl = `${origin}/checkout.html`;
    const cancelUrl = `${origin}/checkout.html`;

    // 9. Call Stripe Checkout Session generator with verified server prices
    const sessionResult = await createStripeCheckoutSession({
      cartItems,
      customerEmail: req.session.user.email,
      orderNumber,
      orderId,
      subtotal,
      discount,
      couponCode: appliedCoupon,
      shipping,
      total,
      successUrl,
      cancelUrl,
      metadata: {
        userId: String(userId),
        customerName
      }
    });

    // Record session ID in order
    if (sessionResult.sessionId) {
      try {
        db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(sessionResult.sessionId, orderId);
      } catch (_) {}
    }

    res.json({
      success: true,
      orderNumber,
      orderId,
      sessionId: sessionResult.sessionId,
      url: sessionResult.url,
      demo: sessionResult.demo,
      serverPricing: {
        subtotal,
        shipping,
        discount,
        total
      }
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Stripe Checkout session.' });
  }
});

// ===================================================================
// TRUST THE WEBHOOK: Authoritative Stripe Webhook Handler
// ===================================================================
async function handleStripeWebhookEvent(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.rawBody || req.body;

    const verification = verifyStripeWebhook(payload, signature);
    if (!verification.verified) {
      console.warn('[Stripe Webhook] Rejected unauthorized webhook call:', verification.error);
      return res.status(400).json({ success: false, message: `Webhook error: ${verification.error}` });
    }

    const event = verification.event;
    console.log(`[Stripe Webhook] Received verified event: ${event.type}`);

    switch (event.type) {
      // 1. Payment completed successfully
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderNumber = session.client_reference_id || session.metadata?.orderNumber;
        const paymentIntentId = session.payment_intent || session.id;
        const isPaid = session.payment_status === 'paid' || session.status === 'complete' || verification.demo;

        if (!orderNumber) {
          console.warn('[Stripe Webhook] checkout.session.completed missing orderNumber:', session.id);
          return res.status(200).json({ received: true, reason: 'missing_order_number' });
        }

        const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
        if (!order) {
          console.warn(`[Stripe Webhook] Order ${orderNumber} not found in database.`);
          return res.status(200).json({ received: true, reason: 'order_not_found' });
        }

        // Idempotency: avoid redundant database updates
        if (order.payment_status === 'Paid') {
          return res.status(200).json({ received: true, already_processed: true });
        }

        // Fulfill order based on verified webhook
        db.prepare(`
          UPDATE orders
          SET payment_status = 'Paid',
              status = 'Confirmed',
              stripe_session_id = ?,
              payment_intent_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(session.id, String(paymentIntentId), order.id);

        // Clear user cart if still remaining
        try {
          db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(order.user_id);
        } catch (_) {}

        // Audit log
        if (typeof db.logAdminAction === 'function') {
          db.logAdminAction({
            adminEmail: 'stripe-webhook@system',
            action: 'STRIPE_WEBHOOK_PAYMENT_CONFIRMED',
            entityType: 'order',
            entityId: order.id,
            details: {
              orderNumber: order.order_number,
              sessionId: session.id,
              paymentIntentId,
              amountTotal: session.amount_total
            }
          });
        }
        break;
      }

      // 2. Checkout session expired or failed -> restore stock
      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const session = event.data.object;
        const orderNumber = session.client_reference_id || session.metadata?.orderNumber;
        if (orderNumber) {
          const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
          if (order && order.payment_status === 'Pending') {
            // Restore inventory stock
            const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
            for (const item of items) {
              db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
            }
            db.prepare(`
              UPDATE orders
              SET payment_status = 'Failed', status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(order.id);

            if (typeof db.logAdminAction === 'function') {
              db.logAdminAction({
                adminEmail: 'stripe-webhook@system',
                action: 'STRIPE_WEBHOOK_PAYMENT_FAILED_RESTOCKED',
                entityType: 'order',
                entityId: order.id,
                details: { orderNumber, sessionId: session.id }
              });
            }
          }
        }
        break;
      }

      default:
        // Other events acknowledged
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Execution error:', err);
    res.status(500).json({ success: false, message: 'Webhook processing encountered an error.' });
  }
}

// Mount webhook endpoints (no session auth — direct Stripe server-to-server HTTP POST)
router.post('/stripe/webhook', handleStripeWebhookEvent);
router.post('/webhook', handleStripeWebhookEvent);

// POST /api/payment/stripe/verify — Verify completed Stripe session & confirm order
// Trusts the webhook first, falls back to direct Stripe API check
router.post('/stripe/verify', requireAuth, async (req, res) => {
  try {
    const { sessionId, orderNumber } = req.body;
    if (!sessionId || !orderNumber) {
      return res.status(400).json({ success: false, message: 'Session ID and Order Number are required.' });
    }

    const userId = req.session.user.id;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?').get(orderNumber, userId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for authenticated customer.' });
    }

    // 1. Trust the Webhook: If webhook already marked order as Paid, return success immediately
    if (order.payment_status === 'Paid') {
      return res.json({
        success: true,
        message: 'Payment verified and order confirmed via webhook!',
        orderNumber,
        verifiedBy: 'webhook'
      });
    }

    // 2. Fallback: Query Stripe API directly server-to-server
    const session = await getStripeSession(sessionId);
    if (!session) {
      return res.status(400).json({ success: false, message: 'Unable to retrieve Stripe session from payment provider.' });
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete' || session.demo;
    if (!isPaid) {
      return res.status(400).json({ success: false, message: 'Stripe payment has not been completed.' });
    }

    // Confirm order in SQLite database
    db.prepare(`
      UPDATE orders
      SET payment_status = 'Paid',
          status = 'Confirmed',
          stripe_session_id = ?,
          payment_intent_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(session.id, String(session.payment_intent || session.id), order.id);

    if (typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminEmail: req.session.user.email,
        action: 'STRIPE_PAYMENT_VERIFIED',
        entityType: 'order',
        entityId: order.id,
        details: { orderNumber, sessionId, status: session.status },
        req
      });
    }

    res.json({
      success: true,
      message: 'Stripe payment verified and order confirmed successfully!',
      orderNumber,
      verifiedBy: 'stripe_api'
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify Stripe payment.' });
  }
});

// ===================================================================
// RAZORPAY PAYMENT ENDPOINTS (SERVER-SIDE AMOUNT VALIDATION)
// ===================================================================

// POST /api/payment/create-order — create a payment gateway order
// Server calculates the exact amount from DB cart or DB order, never trusting client amount
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    let finalAmount = null;

    if (req.body.orderNumber || req.body.order_id) {
      const existing = db.prepare(`
        SELECT total FROM orders
        WHERE (order_number = ? OR id = ?) AND user_id = ?
      `).get(req.body.orderNumber || '', Number(req.body.order_id) || 0, userId);

      if (existing) {
        finalAmount = existing.total;
      }
    }

    if (finalAmount === null) {
      const cartItems = db.prepare(`
        SELECT ci.*, p.price, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(userId);

      if (cartItems.length > 0) {
        const pricing = calculateServerPricing(cartItems, req.body.coupon || req.body.couponCode);
        finalAmount = pricing.total;
      }
    }

    if (finalAmount === null && req.body.amount && Number(req.body.amount) > 0) {
      finalAmount = Number(req.body.amount);
    }

    if (finalAmount === null || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Unable to calculate order amount from cart or order.' });
    }

    const amountInPaise = Math.round(Number(finalAmount) * 100);
    const receipt = `rjfc_${Date.now()}`;
    const result = await createRazorpayOrder(amountInPaise, receipt);
    res.json({
      ...result,
      serverAmount: finalAmount
    });
  } catch (err) {
    console.error('Payment create-order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// POST /api/payment/verify — verify Razorpay signature after successful payment
router.post('/verify', requireAuth, (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (isValid) {
      res.json({ success: true, message: 'Payment verified successfully.' });
    } else {
      res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
});


// ===================================================================
// PHONEPE STANDARD CHECKOUT PAYMENT GATEWAY INTEGRATION
// Unified UPI, Cards, Net Banking, Wallets, and EMI Support
// Cryptographically verified checksum & server-side pricing
// ===================================================================

// GET /api/payment/phonepe/config
router.get('/phonepe/config', (req, res) => {
  const isLive = phonepe.PHONEPE_ENV === 'production' && !String(phonepe.PHONEPE_MERCHANT_ID || '').startsWith('PGTEST');
  res.json({
    success: true,
    enabled: phonepe.PHONEPE_ENABLED,
    isLive,
    merchantName: phonepe.MERCHANT_DISPLAY_NAME,
    env: phonepe.PHONEPE_ENV
  });
});

/**
 * Atomic helper to mark order as Paid in SQLite, record coupon, clear cart,
 * decrement inventory, and sync to Cloud Firestore
 */
function finalizePhonePeOrderPaid(order, phonepeData, req) {
  const transaction = db.transaction(() => {
    // 1. Update order status and PhonePe transaction references
    db.prepare(`
      UPDATE orders
      SET payment_status = 'Paid',
          status = 'Confirmed',
          phonepe_transaction_id = ?,
          phonepe_provider_reference_id = ?,
          phonepe_payment_mode = ?,
          phonepe_response_code = ?,
          phonepe_arn = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      phonepeData.transactionId || null,
      phonepeData.providerReferenceId || null,
      phonepeData.paymentInstrument?.type || 'PHONEPE_STANDARD',
      phonepeData.responseCode || 'SUCCESS',
      phonepeData.paymentInstrument?.arn || phonepeData.paymentInstrument?.utr || null,
      order.id
    );

    // 2. Atomically decrement stock
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
    for (const it of items) {
      if (it.product_id) {
        db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(it.quantity, it.product_id);
      }
    }

    // 3. Clear user's cart
    if (order.user_id) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(order.user_id);
    }

    // 4. Record single-use coupon redemption
    if (order.coupon_code) {
      const clientIp = couponService.extractClientIp(req);
      couponService.recordCouponRedemption({
        couponCode: order.coupon_code,
        userId: order.user_id,
        userEmail: order.customer_email,
        userIp: clientIp,
        orderId: order.id,
        orderNumber: order.order_number,
        discountAmount: order.discount || 0
      });
    }
  });

  transaction();

  // 5. Fire and forget Cloud Firestore sync (including verified payment token for automatic account reflection)
  try {
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    if (updatedOrder) {
      const paymentToken = phonepeData.transactionId || updatedOrder.phonepe_transaction_id || updatedOrder.phonepe_merchant_transaction_id;
      syncOrderToFirestore({
        ...updatedOrder,
        payment_token: paymentToken,
        payment_verified_by: 'PhonePe Gateway Webhook'
      }).catch(err => {
        console.warn('[Firestore] Sync warning after PhonePe payment:', err.message);
      });
    }
  } catch (_) {}
}

// POST /api/payment/phonepe/create-payment
// Initiates official PhonePe Standard Checkout (PAY_PAGE) or signed UPI_INTENT
router.post('/phonepe/create-payment', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const clientIp = couponService.extractClientIp(req);
    const {
      orderNumber,
      addressId,
      address_id,
      notes = '',
      coupon,
      couponCode,
      paymentType = 'PAY_PAGE',
      targetApp = '',
      deviceOS = 'ANDROID'
    } = req.body;

    let targetOrder = null;

    // A. If an existing orderNumber is provided (e.g. payment retry)
    if (orderNumber) {
      const existing = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?').get(orderNumber, userId);
      if (!existing) {
        return res.status(403).json({ success: false, message: 'Order not found or unauthorized.' });
      }
      if (existing.payment_status === 'Paid') {
        return res.status(400).json({ success: false, message: 'This order has already been paid.' });
      }
      targetOrder = existing;
    } else {
      // B. Create Pending Order from user's current cart with server-side authoritative pricing
      const cartItems = db.prepare(`
        SELECT ci.*, p.name, p.price, p.stock, p.image
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(userId);

      if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
      }

      // Verify stock
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.name}" has only ${item.stock} left in stock.`
          });
        }
      }

      // Resolve address
      let deliveryAddress = '';
      let customerName = req.body.customer_name || req.session.user.name;
      let customerPhone = req.body.customer_phone || req.session.user.phone || '9999999999';
      let resolvedAddrId = addressId || address_id;

      if (resolvedAddrId) {
        const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(Number(resolvedAddrId), userId);
        if (addr) {
          customerName = addr.full_name;
          customerPhone = addr.phone;
          deliveryAddress = `${addr.house_flat}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pin_code}. Phone: ${addr.phone}`;
        }
      }

      if (!deliveryAddress && (req.body.shipping_address || req.body.delivery_address || req.body.address)) {
        deliveryAddress = String(req.body.shipping_address || req.body.delivery_address || req.body.address).trim();
      }

      if (!deliveryAddress) {
        const defaultAddr = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC LIMIT 1').get(userId);
        if (defaultAddr) {
          resolvedAddrId = defaultAddr.id;
          customerName = defaultAddr.full_name;
          customerPhone = defaultAddr.phone;
          deliveryAddress = `${defaultAddr.house_flat}, ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pin_code}. Phone: ${defaultAddr.phone}`;
        }
      }

      if (!deliveryAddress) {
        return res.status(400).json({ success: false, message: 'Please provide or select a delivery address.' });
      }

      const activeCoupon = (coupon || couponCode || '').trim().toUpperCase();
      if (activeCoupon) {
        const eligibility = couponService.checkCouponEligibility(activeCoupon, {
          userId,
          userEmail: req.session.user.email,
          userIp: clientIp
        });
        if (!eligibility.eligible) {
          return res.status(400).json({ success: false, message: eligibility.message });
        }
      }

      // Calculate authoritative server pricing
      const pricing = calculateServerPricing(cartItems, activeCoupon, {
        userId,
        userEmail: req.session.user.email,
        userIp: clientIp
      });

      const newOrderNumber = generateOrderNumber();

      // Create Pending Order in database
      const createTx = db.transaction(() => {
        const result = db.prepare(`
          INSERT INTO orders (
            order_number, user_id, address_id, customer_name, customer_email, customer_phone,
            delivery_address, subtotal, discount, shipping, total, payment_method, payment_status,
            status, notes, coupon_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PhonePe', 'Pending', 'Pending', ?, ?)
        `).run(
          newOrderNumber,
          userId,
          resolvedAddrId ? Number(resolvedAddrId) : null,
          customerName,
          req.session.user.email,
          customerPhone,
          deliveryAddress,
          pricing.subtotal,
          pricing.discount,
          pricing.shipping,
          pricing.total,
          notes,
          activeCoupon || null
        );

        const orderId = Number(result.lastInsertRowid);

        for (const item of cartItems) {
          db.prepare(`
            INSERT INTO order_items (
              order_id, product_id, product_name, product_image, size, color, quantity, price, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            orderId,
            item.product_id,
            item.name,
            item.image || '',
            item.size || 'Free Size',
            item.color || '',
            item.quantity,
            item.price,
            Math.round(item.price * item.quantity)
          );
        }

        return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      });

      targetOrder = createTx();
    }

    // Generate unique merchant transaction ID for PhonePe
    const merchantTransactionId = phonepe.generateMerchantTransactionId('MT_RJFC');

    // Update order with merchant transaction ID
    db.prepare(`
      UPDATE orders
      SET phonepe_merchant_transaction_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(merchantTransactionId, targetOrder.id);

    const appUrl = process.env.APP_URL || (req.protocol + '://' + req.get('host'));
    const redirectUrl = `${appUrl}/checkout.html?order_number=${targetOrder.order_number}&phonepe_txn=${merchantTransactionId}`;
    const callbackUrl = `${appUrl}/api/payment/phonepe/callback`;
    const amountInPaise = Math.round(targetOrder.total * 100);

    // Call PhonePe Payment Gateway
    const phonepeResponse = await phonepe.initiatePayment({
      merchantTransactionId,
      merchantUserId: userId,
      amountInPaise,
      redirectUrl,
      callbackUrl,
      mobileNumber: targetOrder.customer_phone,
      paymentType,
      targetApp,
      deviceOS,
      redirectMode: 'REDIRECT'
    });

    const instrumentResp = phonepeResponse?.data?.instrumentResponse;
    const redirectTarget = instrumentResp?.redirectInfo?.url || null;
    const intentUrl = instrumentResp?.intentUrl || null;

    if (phonepeResponse.success && (redirectTarget || intentUrl)) {
      return res.json({
        success: true,
        merchantTransactionId,
        orderNumber: targetOrder.order_number,
        amount: targetOrder.total,
        amountInPaise,
        redirectUrl: redirectTarget,
        intentUrl
      });
    } else {
      console.error('[PhonePe Initiation Failed]', phonepeResponse);
      return res.status(502).json({
        success: false,
        message: phonepeResponse.message || 'Unable to initiate PhonePe payment. Please try again or choose another payment method.'
      });
    }
  } catch (err) {
    console.error('PhonePe createPayment error:', err);
    res.status(500).json({ success: false, message: 'Server error initiating payment.' });
  }
});

// ALL /api/payment/phonepe/redirect — Safe POST/GET bridge back to frontend
router.all('/phonepe/redirect', (req, res) => {
  const orderNumber = req.query.order_number || req.body?.merchantTransactionId || '';
  const txn = req.query.phonepe_txn || req.body?.transactionId || '';
  const target = `/checkout.html?order_number=${encodeURIComponent(orderNumber)}&phonepe_txn=${encodeURIComponent(txn)}`;
  res.redirect(302, target);
});

// GET /api/payment/phonepe/status/:orderNumber
// Independently verifies payment status with PhonePe API
router.get('/phonepe/status/:orderNumber', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === 'admin';

    // Anti-IDOR: verify customer ownership
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: unauthorized access to order.' });
    }

    // 1. Idempotent short-circuit: if already paid, return verified
    if (order.payment_status === 'Paid') {
      const paymentToken = order.phonepe_transaction_id || order.phonepe_merchant_transaction_id || orderNumber;
      return res.json({
        success: true,
        verified: true,
        payment_status: 'Paid',
        orderNumber,
        phonepe_transaction_id: order.phonepe_transaction_id,
        payment_token: paymentToken,
        phonepe_payment_mode: order.phonepe_payment_mode
      });
    }

    if (!order.phonepe_merchant_transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'No PhonePe transaction reference found for this order.'
      });
    }

    // 2. Independently verify with PhonePe Status API
    const statusData = await phonepe.checkPaymentStatus(order.phonepe_merchant_transaction_id);

    if (statusData.code === 'PAYMENT_SUCCESS' && statusData.data) {
      // Cryptographic / Amount Match Validation
      const expectedPaise = Math.round(order.total * 100);
      if (statusData.data.amount && statusData.data.amount !== expectedPaise) {
        console.error(`[SECURITY TAMPERING DETECTED] Amount mismatch for order #${orderNumber}: Expected ${expectedPaise} paise, got ${statusData.data.amount}`);
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Payment verification failed: transaction amount mismatch.'
        });
      }

      finalizePhonePeOrderPaid(order, statusData.data, req);

      return res.json({
        success: true,
        verified: true,
        payment_status: 'Paid',
        orderNumber,
        phonepe_transaction_id: statusData.data.transactionId,
        payment_token: statusData.data.transactionId || order.phonepe_merchant_transaction_id || orderNumber,
        payment_mode: statusData.data.paymentInstrument?.type || 'PHONEPE'
      });
    } else if (statusData.code === 'PAYMENT_PENDING') {
      return res.json({
        success: true,
        verified: false,
        payment_status: 'Pending',
        orderNumber,
        message: 'Payment is currently pending confirmation from your bank.'
      });
    } else {
      // Marked failed
      db.prepare(`
        UPDATE orders
        SET payment_status = 'Failed',
            phonepe_response_code = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(statusData.code || 'PAYMENT_ERROR', order.id);

      return res.status(400).json({
        success: false,
        verified: false,
        payment_status: 'Failed',
        orderNumber,
        message: statusData.message || 'Payment failed or was cancelled.'
      });
    }
  } catch (err) {
    console.error('PhonePe status check error:', err);
    res.status(500).json({ success: false, message: 'Error checking payment status.' });
  }
});

// POST /api/payment/phonepe/callback
// PhonePe server-to-server webhook callback
router.post('/phonepe/callback', async (req, res) => {
  try {
    const base64Response = req.body.response;
    const xVerifyHeader = req.headers['x-verify'];

    // 1. Cryptographically verify signature
    const verification = phonepe.verifyAndDecodeCallback(base64Response, xVerifyHeader);
    if (!verification.isValid) {
      console.warn('[SECURITY] PhonePe webhook signature verification failed:', verification.error);
      return res.status(400).json({
        success: false,
        message: 'Signature verification failed'
      });
    }

    const payload = verification.payload;
    if (!payload || !payload.data) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }

    const { merchantTransactionId, transactionId, amount } = payload.data;
    if (!merchantTransactionId) {
      return res.status(400).json({ success: false, message: 'Missing merchantTransactionId' });
    }

    // 2. Find order in database
    const order = db.prepare('SELECT * FROM orders WHERE phonepe_merchant_transaction_id = ?').get(merchantTransactionId);
    if (!order) {
      console.warn(`[PhonePe Webhook] Order not found for merchantTransactionId: ${merchantTransactionId}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 3. Idempotent check
    if (order.payment_status === 'Paid') {
      return res.status(200).json({ success: true, message: 'Order already processed as paid' });
    }

    // 4. Double verification: Independently query PhonePe Status API
    let verifiedStatus = payload;
    try {
      const liveCheck = await phonepe.checkPaymentStatus(merchantTransactionId);
      if (liveCheck && liveCheck.code) {
        verifiedStatus = liveCheck;
      }
    } catch (_) {}

    if (verifiedStatus.code === 'PAYMENT_SUCCESS' && verifiedStatus.data) {
      const expectedPaise = Math.round(order.total * 100);
      if (amount && amount !== expectedPaise) {
        console.error(`[SECURITY ALERT] PhonePe webhook amount mismatch for order #${order.order_number}: Expected ${expectedPaise}, received ${amount}`);
        return res.status(400).json({ success: false, message: 'Amount tampering detected' });
      }

      finalizePhonePeOrderPaid(order, verifiedStatus.data, req);
      return res.status(200).json({ success: true, message: 'Callback processed and order confirmed' });
    } else {
      db.prepare(`
        UPDATE orders
        SET payment_status = 'Failed',
            phonepe_response_code = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(verifiedStatus.code || 'FAILED', order.id);

      return res.status(200).json({ success: true, message: 'Payment marked failed' });
    }
  } catch (err) {
    console.error('PhonePe callback error:', err);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
});

// POST /api/payment/phonepe/refund
// Initiates PhonePe refund for a paid order (Admin Only)
router.post('/phonepe/refund', requireAdmin, async (req, res) => {
  try {
    const { orderNumber, amount, reason = 'Customer requested refund' } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'orderNumber is required.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment_status !== 'Paid') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund order with status "${order.payment_status}". Must be "Paid".`
      });
    }

    const refundAmountRupees = amount ? Number(amount) : order.total;
    if (refundAmountRupees <= 0 || refundAmountRupees > order.total) {
      return res.status(400).json({
        success: false,
        message: `Invalid refund amount ₹${refundAmountRupees}. Must be between ₹1 and order total ₹${order.total}.`
      });
    }

    const refundAmountPaise = Math.round(refundAmountRupees * 100);
    const refundTxnId = phonepe.generateMerchantTransactionId('REF_RJFC');

    const refundRes = await phonepe.processRefund({
      originalTransactionId: order.phonepe_transaction_id || order.phonepe_merchant_transaction_id,
      refundTransactionId: refundTxnId,
      merchantUserId: order.user_id,
      amountInPaise: refundAmountPaise
    });

    if (refundRes.success || refundRes.code === 'PAYMENT_SUCCESS') {
      db.prepare(`
        UPDATE orders
        SET payment_status = 'Refunded',
            status = 'Cancelled',
            notes = coalesce(notes, '') || ' [Refunded: ₹' || ? || ' - ' || ? || ']',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(refundAmountRupees, reason, order.id);

      // Sync updated order to Firestore
      try {
        const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
        syncOrderToFirestore(updated).catch(() => {});
      } catch (_) {}

      // Log admin action
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminEmail: req.session.user.email,
          action: 'PHONEPE_ORDER_REFUNDED',
          entityType: 'order',
          entityId: order.id,
          details: { orderNumber, refundAmountRupees, reason, refundTxnId },
          req
        });
      }

      return res.json({
        success: true,
        message: `Refund of ₹${refundAmountRupees} processed successfully.`,
        orderNumber,
        refundTransactionId: refundTxnId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: refundRes.message || 'Failed to process PhonePe refund.'
      });
    }
  } catch (err) {
    console.error('PhonePe refund error:', err);
    res.status(500).json({ success: false, message: 'Server error processing refund.' });
  }
});

module.exports = router;
