const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/admin');

// All endpoints in this router require Admin authorization
router.use(requireAdmin);

// Multer setup for product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted.'));
    }
  }
});

// Image upload endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  const relativePath = `/images/uploads/${req.file.filename}`;
  res.json({ success: true, url: relativePath });
});

// Dashboard Statistics
router.get('/stats', (req, res) => {
  try {
    const totalSalesRow = db.prepare(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'Cancelled'`).get();
    const totalOrdersRow = db.prepare(`SELECT COUNT(*) as count FROM orders`).get();
    const totalProductsRow = db.prepare(`SELECT COUNT(*) as count FROM products`).get();
    const totalCustomersRow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'customer'`).get();
    const pendingOrdersRow = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('Pending', 'Confirmed', 'Packed')`).get();
    const lowStockRow = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock > 0 AND stock <= 4`).get();
    const outOfStockRow = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock <= 0`).get();
    const inStockRow = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock > 0`).get();

    // Recent 5 orders
    const recentOrders = db.prepare(`
      SELECT o.id, o.order_number, o.customer_name, o.total, o.payment_method, o.status, o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all();

    // Low stock items list
    const lowStockItems = db.prepare(`
      SELECT id, name, stock, price, image
      FROM products
      WHERE stock <= 4
      ORDER BY stock ASC
      LIMIT 8
    `).all();

    res.json({
      success: true,
      stats: {
        totalSales: totalSalesRow.total,
        totalOrders: totalOrdersRow.count,
        totalProducts: totalProductsRow.count,
        totalCustomers: totalCustomersRow.count,
        pendingOrders: pendingOrdersRow.count,
        lowStockCount: lowStockRow.count,
        outOfStockCount: outOfStockRow.count,
        inStockCount: inStockRow.count
      },
      recentOrders,
      lowStockItems
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin stats' });
  }
});

// Product Management: List all products with optional filters
router.get('/products', (req, res) => {
  try {
    const { search, category, department, stockStatus } = req.query;
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.subcategory LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category) {
      query += ` AND p.category_id = ?`;
      params.push(Number(category));
    }

    if (department && department.trim()) {
      query += ` AND LOWER(p.department) = LOWER(?)`;
      params.push(department.trim());
    }

    if (stockStatus === 'in_stock') {
      query += ` AND p.stock > 0`;
    } else if (stockStatus === 'out_of_stock') {
      query += ` AND p.stock <= 0`;
    } else if (stockStatus === 'low_stock') {
      query += ` AND p.stock > 0 AND p.stock <= 4`;
    }

    query += ` ORDER BY p.id DESC`;

    const products = db.prepare(query).all(...params);
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
});

// Create product
router.post('/products', (req, res) => {
  try {
    const {
      name, category_id, department, subcategory, description, material, pattern, care_instructions,
      price, original_price, discount, stock, image, brand,
      featured, new_arrival, offer, active, available_sizes, available_colors
    } = req.body;

    if (!name || !price || !image) {
      return res.status(400).json({ success: false, message: 'Name, price, and primary image are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const origPrice = Number(original_price) || Number(price);
    const salePrice = Number(price);
    const calcDiscount = discount ? Number(discount) : Math.round(((origPrice - salePrice) / origPrice) * 100);

    const insert = db.prepare(`
      INSERT INTO products (
        name, slug, category_id, department, subcategory, description, material, pattern, care_instructions,
        price, original_price, discount, stock, image, brand,
        featured, new_arrival, offer, active, available_sizes, available_colors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      slug,
      category_id ? Number(category_id) : null,
      department?.trim() || 'women',
      subcategory?.trim() || '',
      description || '',
      material || '',
      pattern || '',
      care_instructions || '',
      salePrice,
      origPrice,
      calcDiscount > 0 ? calcDiscount : 0,
      stock !== undefined ? Number(stock) : 10,
      image.trim(),
      brand?.trim() || 'RJ Collection',
      featured ? 1 : 0,
      new_arrival ? 1 : 0,
      offer ? 1 : 0,
      active !== undefined ? (active ? 1 : 0) : 1,
      available_sizes ? (typeof available_sizes === 'string' ? available_sizes : JSON.stringify(available_sizes)) : '["Free Size"]',
      available_colors ? (typeof available_colors === 'string' ? available_colors : JSON.stringify(available_colors)) : '["Maroon"]'
    );

    res.status(201).json({ success: true, message: 'Product created successfully', id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category_id, department, subcategory, description, material, pattern, care_instructions,
      price, original_price, discount, stock, image, brand,
      featured, new_arrival, offer, active, available_sizes, available_colors
    } = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const salePrice = Number(price);
    const origPrice = Number(original_price) || salePrice;
    const calcDiscount = discount !== undefined ? Number(discount) : Math.round(((origPrice - salePrice) / origPrice) * 100);

    db.prepare(`
      UPDATE products SET
        name = ?, category_id = ?, department = ?, subcategory = ?, description = ?, material = ?, pattern = ?, care_instructions = ?,
        price = ?, original_price = ?, discount = ?, stock = ?, image = ?, brand = ?,
        featured = ?, new_arrival = ?, offer = ?, active = ?,
        available_sizes = ?, available_colors = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(),
      category_id ? Number(category_id) : null,
      department?.trim() || 'women',
      subcategory?.trim() || '',
      description || '',
      material || '',
      pattern || '',
      care_instructions || '',
      salePrice,
      origPrice,
      calcDiscount > 0 ? calcDiscount : 0,
      Number(stock),
      image.trim(),
      brand?.trim() || 'RJ Collection',
      featured ? 1 : 0,
      new_arrival ? 1 : 0,
      offer ? 1 : 0,
      active ? 1 : 0,
      typeof available_sizes === 'string' ? available_sizes : JSON.stringify(available_sizes || []),
      typeof available_colors === 'string' ? available_colors : JSON.stringify(available_colors || []),
      Number(id)
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Quick stock update
router.patch('/products/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
    }

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(numStock, Number(id));

    res.json({
      success: true,
      message: numStock > 0 ? `Stock updated to ${numStock} (In Stock)` : 'Product marked Out of Stock (0 units)',
      stock: numStock,
      inStock: numStock > 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
});

// Quick 1-click stock toggle: In Stock <-> Out of Stock
router.patch('/products/:id/toggle-stock', (req, res) => {
  try {
    const { id } = req.params;
    const p = db.prepare('SELECT stock FROM products WHERE id = ?').get(Number(id));
    if (!p) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // If currently in stock (>0), set to 0 (Out of Stock). If out of stock (<=0), set to 15 (In Stock)
    const newStock = p.stock > 0 ? 0 : 15;
    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStock, Number(id));

    res.json({
      success: true,
      message: newStock > 0 ? 'Product marked In Stock (15 units)' : 'Product marked Out of Stock (0 units)',
      stock: newStock,
      inStock: newStock > 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle stock status' });
  }
});

// Delete product
router.delete('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// Orders Management: List all orders
router.get('/orders', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      query += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY o.created_at DESC`;

    const orders = db.prepare(query).all(...params);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.id)
    }));

    res.json({ success: true, orders: enriched });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
  }
});

// Update order status
router.patch('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, Number(id));

    res.json({ success: true, message: `Order status changed to "${status}"` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// Customers Management: View registered customers
router.get('/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
             COUNT(o.id) as order_count,
             COALESCE(SUM(o.total), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'Cancelled'
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({ success: true, customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve customers' });
  }
});

// Categories Management
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `).all();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories' });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, description, image, active, display_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.prepare(`
      INSERT INTO categories (name, slug, description, image, active, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), slug, description || '', image || '', active ? 1 : 0, Number(display_order) || 0);

    res.status(201).json({ success: true, message: 'Category created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

router.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, active, display_order } = req.body;

    db.prepare(`
      UPDATE categories
      SET name = ?, description = ?, image = ?, active = ?, display_order = ?
      WHERE id = ?
    `).run(name.trim(), description || '', image || '', active ? 1 : 0, Number(display_order) || 0, Number(id));

    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// Banners Management
router.get('/banners', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners ORDER BY display_order ASC').all();
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve banners' });
  }
});

router.post('/banners', (req, res) => {
  try {
    const { title, subtitle, image, link, button_text, active, display_order } = req.body;
    db.prepare(`
      INSERT INTO banners (title, subtitle, image, link, button_text, active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, subtitle || '', image, link || '/shop.html', button_text || 'SHOP NOW', active ? 1 : 0, Number(display_order) || 0);
    res.status(201).json({ success: true, message: 'Banner created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
});

router.put('/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, link, button_text, active, display_order } = req.body;
    db.prepare(`
      UPDATE banners
      SET title = ?, subtitle = ?, image = ?, link = ?, button_text = ?, active = ?, display_order = ?
      WHERE id = ?
    `).run(title, subtitle || '', image, link || '/shop.html', button_text || 'SHOP NOW', active ? 1 : 0, Number(display_order) || 0, Number(id));
    res.json({ success: true, message: 'Banner updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
});

router.delete('/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM banners WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
});

module.exports = router;
