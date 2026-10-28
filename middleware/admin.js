const { verifyFirebaseToken } = require('../services/firebase');
const sessionTokenService = require('../services/sessionTokenService');

async function requireAdmin(req, res, next) {
  // 1. Existing verified admin session
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  // 2. HttpOnly Cookie Session Token validation fallback
  const sessionCookie = req.cookies?.[sessionTokenService.SESSION_COOKIE_NAME];
  if (sessionCookie) {
    const user = sessionTokenService.validateSessionToken(sessionCookie);
    if (user && user.role === 'admin') {
      if (!req.session) req.session = {};
      req.session.user = user;
      req.session.sessionToken = sessionCookie;
      return next();
    }
  }

  // 3. Firebase Admin ID token authentication support
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = await verifyFirebaseToken(token);
      if (decoded && (decoded.admin === true || decoded.role === 'admin' || decoded.email === 'omvinayakwork@gmail.com' || decoded.uid === 'aJC901OkCjU5UvqUUF9tvaqpdbn1')) {
        req.firebaseUser = decoded;
        if (!req.session) req.session = {};
        if (!req.session.user) {
          req.session.user = {
            id: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email,
            role: 'admin'
          };
        }
        return next();
      }
    } catch (_) {}
  }

  const isApi = (req.baseUrl && req.baseUrl.startsWith('/api')) ||
                (req.originalUrl && req.originalUrl.startsWith('/api')) ||
                req.path.startsWith('/api/') ||
                req.xhr ||
                req.headers.accept?.includes('json');

  if (isApi) {
    return res.status(403).json({
      success: false,
      message: '403 Forbidden: Administrator privileges required.'
    });
  }

  // If requesting the admin page directly without admin session
  return res.status(403).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>403 Forbidden - Access Denied</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1117; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { background: #1a1e29; border: 1px solid #2a3142; border-radius: 12px; padding: 40px; text-align: center; max-width: 460px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { color: #e53e3e; font-size: 48px; margin: 0 0 10px; }
        p { color: #a0aec0; line-height: 1.6; margin-bottom: 25px; }
        .btn { display: inline-block; background: #8b0046; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>403</h1>
        <h2>Access Denied</h2>
        <p>This is a protected administrative portal. You do not have permission to view this resource.</p>
        <a href="/" class="btn">Return to Storefront</a>
      </div>
    </body>
    </html>
  `);
}

module.exports = { requireAdmin };
