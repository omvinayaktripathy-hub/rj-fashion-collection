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
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

// Magic Byte Signature Verification for Images
function verifyImageMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    // WebP: RIFF .... WEBP
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
    // AVIF: ftyp
    if (buffer.toString('ascii', 4, 12).includes('ftyp')) return true;

    return false;
  } catch (_) {
    return false;
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Strictly disallow SVG and executable extensions
    if (ext === '.svg' || file.mimetype === 'image/svg+xml') {
      return cb(new Error('SVG uploads are prohibited for security reasons. Please upload JPEG, PNG, WebP, or AVIF.'));
    }
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only authentic JPEG, PNG, WebP, and AVIF images are permitted.'));
    }
  }
});

// Image upload endpoint with cryptographic signature inspection
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload rejected: Only standard static image files (JPEG, PNG, WebP, AVIF) under 5MB are permitted.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Validate magic bytes to prevent renamed binaries / web shells
    if (!verifyImageMagicBytes(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({
        success: false,
        message: 'Invalid file signature: file contents do not match authentic image standards.'
      });
    }

    const relativePath = `/images/uploads/${path.basename(req.file.filename)}`;
    res.json({ success: true, url: relativePath });
  });
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
    const newId = Number(result.lastInsertRowid);
    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'CREATE_PRODUCT',
      entityType: 'product',
      entityId: newId,
      details: { name: name.trim(), price: salePrice, stock },
      req
    });

    res.status(201).json({ success: true, message: 'Product created successfully', id: newId });
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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_PRODUCT',
      entityType: 'product',
      entityId: id,
      details: { name: name.trim(), price: salePrice, stock },
      req
    });

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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_STOCK',
      entityType: 'product',
      entityId: id,
      details: { stock: numStock },
      req
    });

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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'TOGGLE_STOCK',
      entityType: 'product',
      entityId: id,
      details: { stock: newStock },
      req
    });

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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'DELETE_PRODUCT',
      entityType: 'product',
      entityId: id,
      details: { id },
      req
    });

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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'order',
      entityId: id,
      details: { status },
      req
    });

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

// Delete customer
router.delete('/customers/:id', (req, res) => {
  try {
    const param = req.params.id;
    if (isNaN(param)) {
      // param is email
      db.prepare(`DELETE FROM users WHERE email = ? AND role = 'customer'`).run(param);
    } else {
      db.prepare(`DELETE FROM users WHERE id = ? AND role = 'customer'`).run(Number(param));
    }

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'DELETE_CUSTOMER',
      entityType: 'customer',
      entityId: param,
      details: { identifier: param },
      req
    });

    res.json({ success: true, message: 'Customer record deleted' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer' });
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
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, image, active, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), slug, description || '', image || '', active ? 1 : 0, Number(display_order) || 0);

    const catId = Number(result.lastInsertRowid);
    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'CREATE_CATEGORY',
      entityType: 'category',
      entityId: catId,
      details: { name: name.trim() },
      req
    });

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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: { name: name.trim() },
      req
    });

    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const assigned = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(Number(id));
    if (assigned && assigned.count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete category: ${assigned.count} active product(s) are assigned to it. Please reassign or delete the products first.`
      });
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id));

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'DELETE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: { id },
      req
    });

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
    const result = db.prepare(`
      INSERT INTO banners (title, subtitle, image, link, button_text, active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, subtitle || '', image, link || '/shop.html', button_text || 'SHOP NOW', active ? 1 : 0, Number(display_order) || 0);

    const bannerId = Number(result.lastInsertRowid);
    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'CREATE_BANNER',
      entityType: 'banner',
      entityId: bannerId,
      details: { title },
      req
    });

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

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_BANNER',
      entityType: 'banner',
      entityId: id,
      details: { title },
      req
    });

    res.json({ success: true, message: 'Banner updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
});

router.delete('/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM banners WHERE id = ?').run(Number(id));

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'DELETE_BANNER',
      entityType: 'banner',
      entityId: id,
      details: { id },
      req
    });

    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
});

// Audit Logs: Retrieve tamper-evident admin action log
router.get('/audit-logs', (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = db.prepare(`
      SELECT * FROM admin_audit_logs
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// Database Backups: Trigger manual backup snapshot
router.post('/backup', (req, res) => {
  try {
    const { performBackup } = require('../scripts/backup-db');
    const backup = performBackup();
    if (backup) {
      db.logAdminAction({
        adminId: req.session?.user?.id,
        adminEmail: req.session?.user?.email,
        action: 'TRIGGER_DATABASE_BACKUP',
        entityType: 'database',
        entityId: backup.fileName,
        details: { fileName: backup.fileName, sizeBytes: backup.sizeBytes },
        req
      });
      return res.json({ success: true, message: 'Database backup created successfully', backup });
    }
    res.status(500).json({ success: false, message: 'Failed to create database backup' });
  } catch (error) {
    console.error('Error triggering backup:', error);
    res.status(500).json({ success: false, message: 'Backup error occurred' });
  }
});

// Store & System Settings
router.get('/settings', (req, res) => {
  try {
    const storeSettings = db.prepare('SELECT * FROM store_settings WHERE id = 1').get() || {
      store_name: 'RJ Fashion Collection',
      support_phone: '+91 78940 93586',
      support_whatsapp: '917894093586',
      support_email: 'omvinayakwork@gmail.com',
      upi_id: 'q070080131@ybl',
      store_address: 'Sarbhal, Jharsuguda, ODISHA - 768201',
      store_timings: 'Mon to Sat: 10:00 AM - 5:00 PM',
      free_shipping_threshold: 999
    };
    const tryonSettings = db.prepare('SELECT * FROM tryon_settings WHERE id = 1').get() || {
      enabled: 1,
      retention_hours: 2
    };
    res.json({ success: true, settings: { ...storeSettings, tryon: tryonSettings } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

router.post('/settings', (req, res) => {
  try {
    const {
      store_name,
      support_phone,
      support_whatsapp,
      support_email,
      upi_id,
      store_address,
      store_timings,
      free_shipping_threshold,
      tryon_enabled,
      tryon_retention_hours
    } = req.body;

    db.prepare(`
      UPDATE store_settings SET
        store_name = COALESCE(?, store_name),
        support_phone = COALESCE(?, support_phone),
        support_whatsapp = COALESCE(?, support_whatsapp),
        support_email = COALESCE(?, support_email),
        upi_id = COALESCE(?, upi_id),
        store_address = COALESCE(?, store_address),
        store_timings = COALESCE(?, store_timings),
        free_shipping_threshold = COALESCE(?, free_shipping_threshold),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      store_name?.trim() || null,
      support_phone?.trim() || null,
      support_whatsapp?.trim() || null,
      support_email?.trim() || null,
      upi_id?.trim() || null,
      store_address?.trim() || null,
      store_timings?.trim() || null,
      Number(free_shipping_threshold) || null
    );

    if (tryon_enabled !== undefined || tryon_retention_hours !== undefined) {
      db.prepare(`
        UPDATE tryon_settings SET
          enabled = COALESCE(?, enabled),
          retention_hours = COALESCE(?, retention_hours),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        tryon_enabled !== undefined ? (tryon_enabled ? 1 : 0) : null,
        tryon_retention_hours ? Number(tryon_retention_hours) : null
      );
    }

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_STORE_SETTINGS',
      entityType: 'settings',
      entityId: 1,
      details: { store_name, support_phone, upi_id, tryon_enabled },
      req
    });

    res.json({ success: true, message: 'Store settings saved successfully' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// ─────────────────────────────────────────────────────────────
// Homepage & Grand Opening Campaign Controls
// ─────────────────────────────────────────────────────────────
router.get('/campaign', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM homepage_campaign WHERE id = 1').get() || {
      announcement_text: 'THE GRAND OPENING — COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ',
      announcement_active: 1,
      hero_headline: 'A New Era of Style Begins.',
      hero_subtitle: 'Discover your style. Elevate every moment.',
      hero_badge: 'GRAND OPENING',
      hero_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
      hero_secondary_image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      hero_cta_primary: 'Explore the Collection',
      hero_cta_secondary: "Discover What's New",
      launch_countdown_enabled: 1,
      launch_date: '2026-11-15T10:00:00',
      spotlight_badge: 'Curated Bridal Atelier',
      spotlight_title: 'The Royal Heritage Edit',
      spotlight_desc: 'Heirloom Kanjivaram silks woven with pure gold zari and imperial bridal ensembles handcrafted for modern royalty.',
      spotlight_image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85',
      spotlight_link: '/shop.html?category=sarees'
    };
    res.json({ success: true, campaign });
  } catch (err) {
    console.error('Fetch campaign error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve campaign data' });
  }
});

router.post('/campaign', (req, res) => {
  try {
    const {
      announcement_text,
      announcement_active,
      hero_headline,
      hero_subtitle,
      hero_badge,
      hero_image,
      hero_secondary_image,
      hero_cta_primary,
      hero_cta_secondary,
      launch_countdown_enabled,
      launch_date,
      spotlight_badge,
      spotlight_title,
      spotlight_desc,
      spotlight_image,
      spotlight_link
    } = req.body;

    db.prepare(`
      UPDATE homepage_campaign SET
        announcement_text = COALESCE(?, announcement_text),
        announcement_active = COALESCE(?, announcement_active),
        hero_headline = COALESCE(?, hero_headline),
        hero_subtitle = COALESCE(?, hero_subtitle),
        hero_badge = COALESCE(?, hero_badge),
        hero_image = COALESCE(?, hero_image),
        hero_secondary_image = COALESCE(?, hero_secondary_image),
        hero_cta_primary = COALESCE(?, hero_cta_primary),
        hero_cta_secondary = COALESCE(?, hero_cta_secondary),
        launch_countdown_enabled = COALESCE(?, launch_countdown_enabled),
        launch_date = COALESCE(?, launch_date),
        spotlight_badge = COALESCE(?, spotlight_badge),
        spotlight_title = COALESCE(?, spotlight_title),
        spotlight_desc = COALESCE(?, spotlight_desc),
        spotlight_image = COALESCE(?, spotlight_image),
        spotlight_link = COALESCE(?, spotlight_link),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      announcement_text?.trim() || null,
      announcement_active !== undefined ? (announcement_active ? 1 : 0) : null,
      hero_headline?.trim() || null,
      hero_subtitle?.trim() || null,
      hero_badge?.trim() || null,
      hero_image?.trim() || null,
      hero_secondary_image?.trim() || null,
      hero_cta_primary?.trim() || null,
      hero_cta_secondary?.trim() || null,
      launch_countdown_enabled !== undefined ? (launch_countdown_enabled ? 1 : 0) : null,
      launch_date?.trim() || null,
      spotlight_badge?.trim() || null,
      spotlight_title?.trim() || null,
      spotlight_desc?.trim() || null,
      spotlight_image?.trim() || null,
      spotlight_link?.trim() || null
    );

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'UPDATE_HOMEPAGE_CAMPAIGN',
      entityType: 'campaign',
      entityId: 1,
      details: { hero_headline, launch_date, announcement_text },
      req
    });

    res.json({ success: true, message: 'Homepage & Grand Opening Campaign saved and published!' });
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ success: false, message: 'Failed to update campaign' });
  }
});

// ─────────────────────────────────────────────────────────────
// Promotions & Discount Campaigns
// ─────────────────────────────────────────────────────────────
router.get('/promotions', (req, res) => {
  try {
    const promotions = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all();
    res.json({ success: true, promotions });
  } catch (err) {
    console.error('Fetch promotions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch promotions' });
  }
});

router.post('/promotions', (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order_amount, usage_limit, active } = req.body;
    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: 'Code and discount value are required' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const stmt = db.prepare(`
      INSERT INTO promotions (code, description, discount_type, discount_value, min_order_amount, usage_limit, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      cleanCode,
      description?.trim() || '',
      discount_type === 'fixed' ? 'fixed' : 'percentage',
      Number(discount_value),
      Number(min_order_amount) || 0,
      Number(usage_limit) || 100,
      active !== undefined ? (active ? 1 : 0) : 1
    );

    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'CREATE_PROMOTION',
      entityType: 'promotion',
      entityId: result.lastInsertRowid,
      details: { code: cleanCode, discount_value },
      req
    });

    res.json({ success: true, message: `Promo code ${cleanCode} created successfully` });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'A promotional code with this name already exists' });
    }
    console.error('Create promo error:', err);
    res.status(500).json({ success: false, message: 'Failed to create promotion' });
  }
});

router.delete('/promotions/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM promotions WHERE id = ?').run(Number(id));
    db.logAdminAction({
      adminId: req.session?.user?.id,
      adminEmail: req.session?.user?.email,
      action: 'DELETE_PROMOTION',
      entityType: 'promotion',
      entityId: id,
      details: { id },
      req
    });
    res.json({ success: true, message: 'Promotion removed' });
  } catch (err) {
    console.error('Delete promo error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete promotion' });
  }
});

// ─────────────────────────────────────────────────────────────
// Customer Reviews Moderation
// ─────────────────────────────────────────────────────────────
router.get('/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.image as product_image
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Fetch reviews error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

router.patch('/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    db.prepare(`
      UPDATE reviews SET
        verified = COALESCE(?, verified)
      WHERE id = ?
    `).run(
      verified !== undefined ? (verified ? 1 : 0) : null,
      Number(id)
    );

    res.json({ success: true, message: 'Review updated successfully' });
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ success: false, message: 'Failed to update review' });
  }
});

module.exports = router;
