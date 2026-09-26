const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to get cart owner condition
function getCartOwner(req) {
  if (req.session && req.session.user) {
    return { field: 'user_id', value: req.session.user.id };
  }
  return { field: 'session_id', value: req.sessionID };
}

// Get cart items with full product details and summary
router.get('/', (req, res) => {
  try {
    const owner = getCartOwner(req);
    
    // If logged in, optionally merge guest session items
    if (owner.field === 'user_id' && req.sessionID) {
      db.prepare(`
        UPDATE cart_items
        SET user_id = ?, session_id = NULL
        WHERE session_id = ? AND user_id IS NULL
      `).run(owner.value, req.sessionID);
    }

    const items = db.prepare(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color,
             p.name, p.price, p.original_price, p.discount, p.stock, p.image,
             (ci.quantity * p.price) as item_total,
             c.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.${owner.field} = ?
      ORDER BY ci.created_at DESC
    `).all(owner.value);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.item_total, 0);
    const originalSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.original_price), 0);
    const totalSavings = Math.max(0, originalSubtotal - subtotal);
    const delivery = subtotal > 999 || items.length === 0 ? 0 : 49;
    const total = subtotal + delivery;

    res.json({
      success: true,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      summary: {
        subtotal,
        originalSubtotal,
        totalSavings,
        delivery: delivery === 0 ? 'FREE' : delivery,
        deliveryAmount: delivery,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shopping cart' });
  }
});

// Add item to cart
router.post('/', (req, res) => {
  try {
    const { productId, quantity = 1, size = 'Free Size', color } = req.body;
    const owner = getCartOwner(req);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ? AND active = 1').get(Number(productId));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product is unavailable or out of stock' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Sorry, this product is currently out of stock' });
    }

    const requestedQty = Math.max(1, Number(quantity));

    // Check if item already exists in cart with same size/color
    const existing = db.prepare(`
      SELECT id, quantity FROM cart_items
      WHERE ${owner.field} = ? AND product_id = ? AND size = ?
    `).get(owner.value, product.id, size);

    if (existing) {
      const newQty = existing.quantity + requestedQty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} items available in stock.`
        });
      }

      db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newQty, existing.id);
    } else {
      if (requestedQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock.`
        });
      }

      if (owner.field === 'user_id') {
        db.prepare(`
          INSERT INTO cart_items (user_id, product_id, quantity, size, color)
          VALUES (?, ?, ?, ?, ?)
        `).run(owner.value, product.id, requestedQty, size, color || '');
      } else {
        db.prepare(`
          INSERT INTO cart_items (session_id, product_id, quantity, size, color)
          VALUES (?, ?, ?, ?, ?)
        `).run(owner.value, product.id, requestedQty, size, color || '');
      }
    }

    res.json({ success: true, message: `Added "${product.name}" to cart!` });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
});

// Update item quantity
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const owner = getCartOwner(req);

    const item = db.prepare(`
      SELECT ci.*, p.stock, p.name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND ci.${owner.field} = ?
    `).get(Number(id), owner.value);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const newQty = Number(quantity);

    if (newQty <= 0) {
      db.prepare(`DELETE FROM cart_items WHERE id = ?`).run(item.id);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    if (newQty > item.stock) {
      return res.status(400).json({
        success: false,
        message: `Maximum available quantity in stock is ${item.stock}.`
      });
    }

    db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newQty, item.id);

    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(500).json({ success: false, message: 'Failed to update quantity' });
  }
});

// Remove item from cart
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const owner = getCartOwner(req);

    const result = db.prepare(`
      DELETE FROM cart_items WHERE id = ? AND ${owner.field} = ?
    `).run(Number(id), owner.value);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// Clear cart
router.delete('/', (req, res) => {
  try {
    const owner = getCartOwner(req);
    db.prepare(`DELETE FROM cart_items WHERE ${owner.field} = ?`).run(owner.value);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;
