const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Get all saved addresses for current user
router.get('/', requireAuth, (req, res) => {
  try {
    const addresses = db.prepare(`
      SELECT * FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, id DESC
    `).all(req.session.user.id);

    res.json({ success: true, addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve addresses' });
  }
});

// Create new address
router.post('/', requireAuth, (req, res) => {
  try {
    const { fullName, phone, houseFlat, street, city, state, pinCode, isDefault } = req.body;

    if (!fullName || !phone || !houseFlat || !street || !city || !state || !pinCode) {
      return res.status(400).json({ success: false, message: 'All address fields are required.' });
    }

    const userId = req.session.user.id;

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }

    // If this is the user's first address, make it default automatically
    const count = db.prepare('SELECT COUNT(*) as count FROM addresses WHERE user_id = ?').get(userId).count;
    const defaultFlag = (isDefault || count === 0) ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO addresses (user_id, full_name, phone, house_flat, street, city, state, pin_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, fullName.trim(), phone.trim(), houseFlat.trim(), street.trim(), city.trim(), state.trim(), pinCode.trim(), defaultFlag);

    const newAddress = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(result.lastInsertRowid));

    res.status(201).json({ success: true, message: 'Address saved successfully', address: newAddress });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ success: false, message: 'Failed to save address' });
  }
});

// Delete address
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(Number(id), req.session.user.id);
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

module.exports = router;
