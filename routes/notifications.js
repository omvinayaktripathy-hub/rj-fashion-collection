const express = require('express');
const router = express.Router();
const { sendPushNotification, FIREBASE_PROJECT_ID } = require('../services/firebase');
const db = require('../database/db');

// In-memory or database token store
const registeredTokens = new Set();

// GET /api/notifications/config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    projectId: FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '1068297491024'
  });
});

// POST /api/notifications/register-token
router.post('/register-token', (req, res) => {
  const { token, userId } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'FCM token required' });
  }

  registeredTokens.add(token);
  console.log(`[FCM] Registered token for user ${userId || 'anonymous'}: ${token.slice(0, 16)}...`);

  res.json({ success: true, message: 'Notification token registered successfully.' });
});

// POST /api/notifications/test-push
router.post('/test-push', async (req, res) => {
  const { token, title, body } = req.body;
  const targetToken = token || Array.from(registeredTokens)[0];

  if (!targetToken) {
    return res.json({
      success: true,
      message: 'No device token registered yet. Enable notifications in your browser first.',
      simulated: true
    });
  }

  const result = await sendPushNotification(
    targetToken,
    title || 'RJ Fashion Collection ✨',
    body || 'Your order is being handcrafted with royal care. Thank you for shopping with us!',
    { url: '/orders.html' }
  );

  res.json(result);
});

module.exports = router;
