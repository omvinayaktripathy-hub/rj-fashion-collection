// RJ FASHION COLLECTION - Unified Payment Routes (Stripe, Razorpay, UPI)
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
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
// STRIPE CHECKOUT INTEGRATION
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
router.post('/stripe/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { addressId, address_id, coupon, couponCode, notes = '' } = req.body;

    // 1. Get cart items
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

    // 3. Resolve address
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

    // 4. Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 999 ? 0 : 49;
    const code = (coupon || couponCode || '').trim().toUpperCase();
    let discount = 0;
    if (code === 'ROYAL10' || code === 'FESTIVE10' || code === 'RJFESTIVE') {
      discount = Math.round(subtotal * 0.10);
    } else if (code === 'WELCOME500' && subtotal >= 2999) {
      discount = 500;
    } else if (Number(req.body.discount) > 0) {
      discount = Math.min(Number(req.body.discount), subtotal);
    }
    const total = Math.max(0, subtotal + shipping - discount);

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

    // 9. Call Stripe Checkout Session generator
    const sessionResult = await createStripeCheckoutSession({
      cartItems,
      customerEmail: req.session.user.email,
      orderNumber,
      orderId,
      subtotal,
      discount,
      shipping,
      total,
      successUrl,
      cancelUrl,
      metadata: {
        userId: String(userId),
        customerName
      }
    });

    res.json({
      success: true,
      orderNumber,
      orderId,
      sessionId: sessionResult.sessionId,
      url: sessionResult.url,
      demo: sessionResult.demo
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Stripe Checkout session.' });
  }
});

// POST /api/payment/stripe/verify — Verify completed Stripe session & confirm order
router.post('/stripe/verify', requireAuth, async (req, res) => {
  try {
    const { sessionId, orderNumber } = req.body;
    if (!sessionId || !orderNumber) {
      return res.status(400).json({ success: false, message: 'Session ID and Order Number are required.' });
    }

    const session = await getStripeSession(sessionId);
    if (!session) {
      return res.status(400).json({ success: false, message: 'Unable to retrieve Stripe session.' });
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete' || session.demo;
    if (!isPaid) {
      return res.status(400).json({ success: false, message: 'Stripe payment has not been completed.' });
    }

    // Confirm order in SQLite database
    const updateResult = db.prepare(`
      UPDATE orders
      SET payment_status = 'Paid', status = 'Confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ? AND user_id = ?
    `).run(orderNumber, req.session.user.id);

    if (typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminEmail: req.session.user.email,
        action: 'STRIPE_PAYMENT_VERIFIED',
        entityType: 'order',
        details: { orderNumber, sessionId, status: session.status },
        req
      });
    }

    res.json({
      success: true,
      message: 'Stripe payment verified and order confirmed successfully!',
      orderNumber
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify Stripe payment.' });
  }
});

// ===================================================================
// RAZORPAY PAYMENT ENDPOINTS
// ===================================================================

// POST /api/payment/create-order — create a Razorpay order before checkout
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }
    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rjfc_${Date.now()}`;
    const result = await createRazorpayOrder(amountInPaise, receipt);
    res.json(result);
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
