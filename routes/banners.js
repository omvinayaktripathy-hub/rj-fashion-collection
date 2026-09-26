const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners WHERE active = 1 ORDER BY display_order ASC').all();
    res.json({ success: true, banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve banners' });
  }
});

module.exports = router;
