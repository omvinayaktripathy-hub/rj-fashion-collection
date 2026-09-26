const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../services/email');

// Generate Unique Order Number: RJFC-YYYYMMDD-XXXX
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RJFC-${year}${month}${day}-${randomSuffix}`;
}

// Create / Place a new order
router.post('/', requireAuth, (req, res) => {
  try {
    const userId = req.session.user.id;
    const { addressId, newAddress, paymentMethod = 'Cash on Delivery', notes = '' } = req.body;

    // 1. Get user cart items
    const cartItems = db.prepare(`
      SELECT ci.*, p.name, p.price, p.stock, p.image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(userId);

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // 2. Stock verification
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" has only ${item.stock} left in stock. Please adjust your cart.`
        });
      }
    }

    // 3. Resolve address
    let deliveryAddress = '';
    let customerName = req.session.user.name;
    let customerPhone = req.session.user.phone || '';
    let finalAddressId = null;

    if (addressId) {
      const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(Number(addressId), userId);
      if (addr) {
        finalAddressId = addr.id;
        customerName = addr.full_name;
        customerPhone = addr.phone;
        deliveryAddress = `${addr.house_flat}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pin_code}. Phone: ${addr.phone}`;
      }
    }

    if (!deliveryAddress && newAddress) {
      const { fullName, phone, houseFlat, street, city, state, pinCode, saveAddress } = newAddress;
      if (!fullName || !phone || !houseFlat || !street || !city || !state || !pinCode) {
        return res.status(400).json({ success: false, message: 'Complete delivery address is required.' });
      }

      customerName = fullName;
      customerPhone = phone;
      deliveryAddress = `${houseFlat}, ${street}, ${city}, ${state} - ${pinCode}. Phone: ${phone}`;

      if (saveAddress) {
        const addrRes = db.prepare(`
          INSERT INTO addresses (user_id, full_name, phone, house_flat, street, city, state, pin_code, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(userId, fullName, phone, houseFlat, street, city, state, pinCode);
        finalAddressId = Number(addrRes.lastInsertRowid);
      }
    }

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Please provide or select a delivery address.' });
    }

    // 4. Calculate financial totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 999 ? 0 : 49;
    const discount = 0; // Can be coupon or promo
    const total = subtotal + shipping - discount;

    const orderNumber = generateOrderNumber();

    // 5. Insert into orders table
    const orderInsert = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, address_id, customer_name, customer_email, customer_phone,
        delivery_address, subtotal, discount, shipping, total, payment_method, payment_status,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
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
      paymentMethod,
      paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      notes
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // 6. Insert order items & reduce stock
    const itemInsert = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, size, color, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stockUpdate = db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const orderItemsForEmail = [];
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

      // Collect for confirmation email
      orderItemsForEmail.push({
        product_name: item.name,
        size: item.size || 'Free Size',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      });
    }

    // 7. Clear customer cart
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    // 8. Send order confirmation email (non-blocking — never delays response)
    sendOrderConfirmation({
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: req.session.user.email,
      subtotal,
      discount,
      shipping,
      total,
      payment_method: paymentMethod,
      delivery_address: deliveryAddress
    }, orderItemsForEmail).catch(err => console.error('[Orders] Email send error:', err));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderNumber,
      orderId,
      total
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
  }
});

// Get user orders list
router.get('/', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.session.user.id);

    // Attach items to each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(order => ({
      ...order,
      items: getItems.all(order.id)
    }));

    res.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
  }
});

// Get single order details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    let order;

    if (id.startsWith('RJFC-')) {
      order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?').get(id, req.session.user.id);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(id), req.session.user.id);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    order.items = items;

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error retrieving order details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve order details' });
  }
});

// Cancel an order (by customer)
router.post('/:id/cancel', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;
    const userId = req.session.user.id;

    let order;
    if (id.startsWith('RJFC-')) {
      order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?').get(id, userId);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(id), userId);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This order has already been cancelled.' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled.' });
    }

    // Update status to Cancelled
    const cancelNote = ` [Cancelled by customer: ${reason}]`;
    db.prepare(`
      UPDATE orders
      SET status = 'Cancelled', notes = COALESCE(notes, '') || ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(cancelNote, order.id);

    // Restock order items
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
    const restockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of items) {
      restockStmt.run(item.quantity, item.product_id);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully. Stock has been restored.',
      orderNumber: order.order_number
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order. Please try again.' });
  }
});

module.exports = router;

