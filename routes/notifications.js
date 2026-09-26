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
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "rj-fashion-collection.firebaseapp.com",
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "rj-fashion-collection.firebasestorage.app",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "136818820501",
      appId: process.env.FIREBASE_APP_ID || "1:136818820501:web:251f54494df4209854a29c",
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-LL5KRD9639"
    }
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
