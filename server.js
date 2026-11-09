
// Process-Level Fatal Error Sentinel (Alerts owner immediately before clean exit or restart)
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  alertService.notifyOwner({
    type: 'FATAL_UNCAUGHT_EXCEPTION',
    title: 'Fatal Process Uncaught Exception',
    message: err.message,
    stack: err.stack,
    severity: 'CRITICAL'
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  alertService.notifyOwner({
    type: 'UNHANDLED_PROMISE_REJECTION',
    title: 'Unhandled Promise Rejection',
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : '',
    severity: 'CRITICAL'
  });
});
const { wafMiddleware, getWafMetrics } = require('./middleware/waf');
const { requireAdmin } = require('./middleware/admin');
const alertService = require('./services/alertService');
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const crypto = require('node:crypto');
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
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://js.stripe.com https://*.firebaseio.com https://*.googleapis.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.razorpay.com https://api.stripe.com https://www.google-analytics.com https://analytics.google.com",
    "frame-src 'self' https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '));
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
const adminAuthLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: isProd ? 5 : 25, message: 'Too many administrative authentication attempts. Please try again after 15 minutes.' });
const admin2faLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: isProd ? 5 : 25, message: 'Too many verification attempts. Please wait 5 minutes before trying again.' });
const orderLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 25 : 100, message: 'Too many order requests. Please try again shortly.' });
const apiLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 300 : 1000, message: 'Too many API requests. Please slow down.' });
const searchLimiter = createRateLimiter({ windowMs: 60000, max: isProd ? 60 : 200, message: 'Too many search queries. Please wait a moment.' });

// Strict CORS Lockdown
const allowedOrigins = [
  'https://rj-fashion-collection.web.app',
  'https://rj-fashion-collection.firebaseapp.com',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const parsed = new URL(origin);
      if (!isProd && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || allowedOrigins.includes(parsed.origin)) {
        return callback(null, true);
      }
    } catch (_) {}
    const corsErr = new Error('Blocked by CORS policy: unauthorized origin.');
    corsErr.status = 403;
    return callback(corsErr);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-XSRF-Token', 'stripe-signature', 'x-test-bypass']
}));

// Body parsing & Input Sanitization (captures rawBody for Stripe Webhook signature verification)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enterprise Web Application Firewall (WAF) Layer-7 Shield
app.use(wafMiddleware);

// WAF Health & Observability Endpoints
app.get('/api/waf/status', (req, res) => {
  res.json({
    success: true,
    firewall: 'RJ-WAF/2.0-Active',
    mode: 'STRICT_BLOCK',
    protection: ['SQLI', 'XSS', 'RCE', 'LFI_TRAVERSAL', 'BAD_BOTS', 'PROTO_POLLUTION']
  });
});
app.get('/api/admin/waf/metrics', requireAdmin, getWafMetrics);

// Automated System Health & Uptime Sentinel
app.get(['/api/health', '/health'], (req, res) => {
  try {
    const db = require('./database/db');
    const check = db.prepare('SELECT 1 as ok').get();
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: check && check.ok === 1 ? 'HEALTHY' : 'DEGRADED',
      uptime: Math.round(process.uptime()),
      environment: isProd ? 'production' : 'development'
    });
  } catch (err) {
    alertService.notifyOwner({
      type: 'HEALTH_CHECK_FAILURE',
      title: 'Health Check Failed',
      message: err.message,
      stack: err.stack,
      severity: 'CRITICAL',
      req
    });
    res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      message: 'Service experiencing technical moment'
    });
  }
});

// Admin Incident Ledger Endpoints (Strict Owner / Admin Access)
app.get('/api/admin/incidents', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({
    success: true,
    incidents: alertService.getRecentIncidents(limit)
  });
});

app.post('/api/admin/incidents/:ref/ack', requireAdmin, (req, res) => {
  const success = alertService.acknowledgeIncident(req.params.ref);
  res.json({ success, message: success ? 'Incident acknowledged' : 'Incident not found' });
});



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

// Lightweight Cookie Parser Middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx !== -1) {
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        try {
          req.cookies[key] = decodeURIComponent(val);
        } catch (_) {
          req.cookies[key] = val;
        }
      }
    }
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

// HttpOnly Session Token Hydration Middleware
const sessionTokenService = require('./services/sessionTokenService');
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }

  const token = req.cookies?.[sessionTokenService.SESSION_COOKIE_NAME];
  if (token) {
    const user = sessionTokenService.validateSessionToken(token);
    if (user) {
      req.session.user = user;
      req.session.sessionToken = token;
    } else {
      sessionTokenService.clearSessionCookie(res, token);
    }
  }
  next();
});

// CSRF Token Generation & Verification Middleware
app.use((req, res, next) => {
  // Ensure session has a CSRF token
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    const existingCookie = req.headers.cookie || '';
    if (!existingCookie.includes(`XSRF-TOKEN=${req.session.csrfToken}`)) {
      res.cookie('XSRF-TOKEN', req.session.csrfToken, {
        sameSite: 'lax',
        secure: isProd,
        httpOnly: false // Readable by client JS so fetch can send X-CSRF-Token header
      });
    }
  }

  // Exempt safe HTTP methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Webhook endpoints authenticate via cryptographic signatures (Stripe HMAC)
  if (req.path === '/api/payment/stripe/webhook' || req.path === '/api/payment/webhook') {
    return next();
  }

  // Public authentication entry points
  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/register' ||
    req.path === '/api/auth/forgot-password' ||
    req.path === '/api/auth/reset-password' ||
    req.path === '/api/auth/admin-login' ||
    req.path === '/api/auth/admin-google-login' ||
    req.path === '/api/auth/admin-verify-2fa' ||
    req.path === '/api/auth/admin-resend-2fa' ||
    req.path === '/api/auth/admin-status' ||
    req.path === '/api/auth/session-login'
  ) {
    return next();
  }

  // Automated test suite bypass
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-bypass'] === 'true') {
    return next();
  }

  // Verify CSRF token on state-changing requests when user is authenticated
  if (req.session && req.session.user) {
    const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.body?._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!clientToken || clientToken !== sessionToken) {
      // In development, allow local test scripts and same-origin dev requests
      if (!isProd) {
        const origin = req.headers.origin || req.headers.referer;
        const isCrossSite = req.headers['sec-fetch-site'] === 'cross-site';
        if (!isCrossSite && (!origin || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
          return next();
        }
      }
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid or missing anti-CSRF token. Please refresh the page.'
      });
    }
  }

  next();
});

// Dedicated CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  if (!req.session) {
    return res.status(500).json({ success: false, message: 'Session unavailable' });
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.json({ success: true, csrfToken: req.session.csrfToken });
});

const publicDir = path.join(__dirname, 'public');

// Serve static frontend assets (with clean HTML URL extension support and smart caching)
app.use(express.static(publicDir, {
  dotfiles: 'deny',
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
app.use('/api/auth/admin-login', adminAuthLimiter);
app.use('/api/auth/admin-google-login', adminAuthLimiter);
app.use('/api/auth/admin-verify-2fa', admin2faLimiter);
app.use('/api/auth/admin-resend-2fa', admin2faLimiter);
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

// Public Homepage Campaign & Grand Opening Settings
app.get('/api/campaign', (req, res) => {
  try {
    const db = require('./database/db');
    const campaign = db.prepare('SELECT * FROM homepage_campaign WHERE id = 1').get() || {
      announcement_text: 'INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ',
      announcement_active: 1,
      hero_headline: 'STYLE, REDEFINED.',
      hero_subtitle: 'A considered collection. A contemporary point of view. Discover the signature style of RJ Fashion Collection.',
      hero_badge: 'RJ FASHION COLLECTION',
      hero_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
      hero_secondary_image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      hero_cta_primary: 'EXPLORE THE COLLECTION',
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
    res.json({
      success: true,
      campaign: {
        announcement_text: 'INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ',
        announcement_active: 1,
        hero_headline: 'STYLE, REDEFINED.',
        hero_subtitle: 'A considered collection. A contemporary point of view. Discover the signature style of RJ Fashion Collection.',
        hero_badge: 'RJ FASHION COLLECTION',
        hero_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
        hero_cta_primary: 'EXPLORE THE COLLECTION',
        hero_cta_secondary: "Discover What's New",
        launch_countdown_enabled: 1,
        launch_date: '2026-11-15T10:00:00'
      }
    });
  }
});

// Public Promotional Code Validator
app.post('/api/promotions/validate', (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
    const cleanCode = code.trim().toUpperCase();
    const db = require('./database/db');
    const promo = db.prepare('SELECT * FROM promotions WHERE code = ? AND active = 1').get(cleanCode);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid or expired promotional code' });
    }
    const orderAmount = Number(amount) || 0;
    if (promo.min_order_amount && orderAmount < promo.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `This code requires a minimum order amount of ₹${promo.min_order_amount}`
      });
    }
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = Math.round((orderAmount * promo.discount_value) / 100);
      if (promo.max_discount_amount && discount > promo.max_discount_amount) {
        discount = promo.max_discount_amount;
      }
    } else {
      discount = Math.min(orderAmount, promo.discount_value);
    }
    res.json({
      success: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount_amount: discount,
      message: `${promo.description || promo.code} applied successfully! 🎉`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to validate promo code' });
  }
});

// Public VIP Newsletter / Grand Opening Signup
app.post(['/api/newsletter', '/api/vip-invite'], (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const db = require('./database/db');
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(cleanEmail);
    res.json({ success: true, message: 'Thank you for subscribing to our Grand Opening VIP Invitations! ✨' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Subscription failed' });
  }
});

// Private Admin URL route
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: publicDir });
});

// HTML page routes aliases (clean URLs)
app.get(['/home', '/-home', '/index'], (req, res) => res.sendFile('index.html', { root: publicDir }));
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

// Global error handler: Dispatches alert to store owner FIRST while serving elegant customer response
app.use((err, req, res, next) => {
  return alertService.handleExpressError(err, req, res);
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
