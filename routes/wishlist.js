const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Get customer wishlist
router.get('/', requireAuth, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT wi.id as wishlist_id, wi.created_at as added_at,
             p.*, c.name as category_name
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC
    `).all(req.session.user.id);

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve wishlist' });
  }
});

// Add product to wishlist
router.post('/', requireAuth, (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = db.prepare('SELECT id, name FROM products WHERE id = ? AND active = 1').get(Number(productId));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = db.prepare('SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?')
      .get(req.session.user.id, product.id);

    if (existing) {
      return res.json({ success: true, message: 'Product is already in your wishlist.' });
    }

    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)')
      .run(req.session.user.id, product.id);

    res.status(201).json({ success: true, message: `Added "${product.name}" to your wishlist!` });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to add product to wishlist' });
  }
});

// Remove product from wishlist
router.delete('/:productId', requireAuth, (req, res) => {
  try {
    const { productId } = req.params;

    const result = db.prepare(`
      DELETE FROM wishlist_items
      WHERE user_id = ? AND (product_id = ? OR id = ?)
    `).run(req.session.user.id, Number(productId), Number(productId));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to remove product from wishlist' });
  }
});

// Move product from wishlist to cart
router.post('/:productId/move-to-cart', requireAuth, (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.user.id;

    const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ? AND active = 1').get(Number(productId));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Product is currently out of stock' });
    }

    // Check if in cart
    const inCart = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, product.id);
    if (inCart) {
      db.prepare('UPDATE cart_items SET quantity = quantity + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(inCart.id);
    } else {
      db.prepare('INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES (?, ?, 1, "Free Size")').run(userId, product.id);
    }

    // Remove from wishlist
    db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?').run(userId, product.id);

    res.json({ success: true, message: `Moved "${product.name}" to cart!` });
  } catch (error) {
    console.error('Error moving wishlist item to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to move product to cart' });
  }
});

module.exports = router;
