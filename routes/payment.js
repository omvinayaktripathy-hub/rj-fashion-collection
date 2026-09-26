// RJ FASHION COLLECTION - Payment Routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createRazorpayOrder, verifyPaymentSignature, RAZORPAY_ENABLED } = require('../services/payment');

// GET /api/payment/config — send Razorpay key to frontend
router.get('/config', (req, res) => {
  res.json({
    success: true,
    enabled: RAZORPAY_ENABLED,
    keyId: RAZORPAY_ENABLED ? process.env.RAZORPAY_KEY_ID : null
  });
});

// POST /api/payment/create-order — create a Razorpay order before checkout
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR rupees
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
