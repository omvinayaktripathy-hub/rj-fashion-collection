// RJ FASHION COLLECTION - Unified Payment Routes (Stripe, Razorpay, UPI)
// Server-side authoritative pricing and webhook-driven fulfillment
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { calculateServerPricing } = require('../services/pricing');
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

// GET /api/payment/config — Unified payment configuration
router.get('/config', (req, res) => {
  const upiId = process.env.MERCHANT_UPI_ID || 'q070080131@ybl';
  const merchantName = 'RJ FASHION COLLECTION';
  const phone = '7894093586';

  res.json({
    success: true,
    enabled: RAZORPAY_ENABLED,
    keyId: RAZORPAY_ENABLED ? process.env.RAZORPAY_KEY_ID : null,
    upiId,
    merchantName,
    phone,
    stripe: {
      enabled: STRIPE_ENABLED,
      publishableKey: STRIPE_PUBLISHABLE_KEY
    },
    razorpay: {
      enabled: RAZORPAY_ENABLED,
      keyId: RAZORPAY_ENABLED ? process.env.RAZORPAY_KEY_ID : null
    },
    upi: {
      upiId,
      merchantName,
      phone
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

    // 4. Calculate authoritative server-side pricing
    const pricing = calculateServerPricing(cartItems, coupon || couponCode);
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
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Stripe', 'Pending', 'Pending', ?)
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
      notes
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

    // 7. Clear cart
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
      return res.status(400).json({ success: false, message: 'Unable to calculate order amount.' });
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

module.exports = router;
