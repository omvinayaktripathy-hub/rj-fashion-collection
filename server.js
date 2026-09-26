require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const cors = require('cors');

// Ensure database is initialized
require('./database/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const addressRoutes = require('./routes/addresses');
const orderRoutes = require('./routes/orders');
const bannerRoutes = require('./routes/banners');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'rj_fashion_super_secret_session_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

const publicDir = path.join(__dirname, 'public');

// Serve static frontend assets (with clean HTML URL extension support)
app.use(express.static(publicDir, { extensions: ['html'] }));

// Mount API Routes
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    const db = require('./database/db');
    const freshUser = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.session.user.id);
    if (freshUser) {
      req.session.user = freshUser;
      return res.json({ success: true, user: freshUser });
    }
  }
  res.json({ success: true, user: null });
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Private Admin URL route
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: publicDir });
});

// HTML page routes aliases (clean URLs)
app.get('/shop', (req, res) => res.sendFile('shop.html', { root: publicDir }));
app.get('/cart', (req, res) => res.sendFile('cart.html', { root: publicDir }));
app.get('/delivery', (req, res) => res.sendFile('delivery.html', { root: publicDir }));
app.get('/wishlist', (req, res) => res.sendFile('wishlist.html', { root: publicDir }));
app.get('/checkout', (req, res) => res.sendFile('checkout.html', { root: publicDir }));
app.get('/orders', (req, res) => res.sendFile('orders.html', { root: publicDir }));
app.get('/account', (req, res) => res.sendFile('account.html', { root: publicDir }));
app.get('/login', (req, res) => res.sendFile('login.html', { root: publicDir }));
app.get('/categories', (req, res) => res.sendFile('categories.html', { root: publicDir }));
app.get('/product', (req, res) => res.sendFile('product.html', { root: publicDir }));
app.get('/about', (req, res) => res.sendFile('about.html', { root: publicDir }));
app.get('/contact', (req, res) => res.sendFile('contact.html', { root: publicDir }));
app.get('/sale', (req, res) => res.sendFile('sale.html', { root: publicDir }));
app.get('/faq', (req, res) => res.sendFile('faq.html', { root: publicDir }));
app.get('/size-guide', (req, res) => res.sendFile('size-guide.html', { root: publicDir }));

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🛍️  RJ FASHION COLLECTION Server is Running!`);
  console.log(`🌐 Public Storefront: http://localhost:${PORT}`);
  console.log(`🔒 Private Admin Portal: http://localhost:${PORT}/admin`);
  console.log('========================================================');
});
