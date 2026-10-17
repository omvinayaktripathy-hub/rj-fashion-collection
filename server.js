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
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Disable fingerprinting header
app.disable('x-powered-by');

// Force HTTPS in production
if (isProd) {
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Enhanced Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://*.firebaseio.com https://*.googleapis.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.razorpay.com https://www.google-analytics.com https://analytics.google.com; frame-src 'self' https://api.razorpay.com;");
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Production-ready In-Memory Rate Limiter
function createRateLimiter({ windowMs = 60000, max = 60, message = 'Too many requests, please try again later.' }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) hits.delete(key);
    }
  }, 300000).unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

const authLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 15 : 60, message: 'Too many authentication attempts. Please try again in a minute.' });
const orderLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 25 : 100, message: 'Too many order requests. Please try again shortly.' });
const apiLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 300 : 1000, message: 'Too many API requests. Please slow down.' });
const searchLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 60 : 200, message: 'Too many search queries. Please wait a moment.' });

// CORS Lockdown
const allowedOrigins = [
  'https://rj-fashion-collection.web.app',
  'https://rj-fashion-collection.firebaseapp.com',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: unauthorized origin.'));
    }
  },
  credentials: true
}));

// Body parsing & Input Sanitization (captures rawBody for Stripe Webhook signature verification)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (val) => {
      if (typeof val === 'string') {
        return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
      }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        for (const k of Object.keys(val)) val[k] = sanitize(val[k]);
      } else if (Array.isArray(val)) {
        return val.map(sanitize);
      }
      return val;
    };
    req.body = sanitize(req.body);
  }
  next();
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'rj_fashion_super_secret_session_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

const publicDir = path.join(__dirname, 'public');

// Serve static frontend assets (with clean HTML URL extension support and smart caching)
app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (/\.(jpe?g|png|webp|avif|gif|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    } else if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  }
}));

// Apply Rate Limits & Mount API Routes
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/payment', orderLimiter);

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
app.use('/api/products', (req, res, next) => {
  if (req.query && req.query.search) {
    return searchLimiter(req, res, next);
  }
  next();
}, productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', authLimiter, contactRoutes);

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

// 404 handler for Storefront pages
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile('404.html', { root: publicDir }, (err) => {
      if (err) res.status(404).send('Page not found');
    });
  }
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global error handler (Debug mode suppressed in prod)
app.use((err, req, res, next) => {
  if (!isProd) {
    console.error('Unhandled application error:', err);
  } else {
    console.error('Unhandled error:', err.message);
  }
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Internal server error occurred. Please try again later.' : (err.message || 'Internal server error')
  });
});

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🛍️  RJ FASHION COLLECTION Server is Running!`);
  console.log(`🌐 Public Storefront: http://localhost:${PORT}`);
  console.log(`🔒 Private Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`🛡️  Environment: ${isProd ? 'Production (Debug OFF)' : 'Development (Debug ON)'}`);
  console.log('========================================================');

  // Automated Daily Backup Schedule (24 hours)
  try {
    const { performBackup } = require('./scripts/backup-db');
    setInterval(performBackup, 24 * 60 * 60 * 1000).unref();
  } catch (e) {}
});
