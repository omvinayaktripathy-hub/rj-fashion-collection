const { verifyFirebaseToken } = require('../services/firebase');
const sessionTokenService = require('../services/sessionTokenService');

async function requireAuth(req, res, next) {
  // 1. Existing verified session
  if (req.session && req.session.user) {
    return next();
  }

  // 2. HttpOnly Cookie Session Token validation fallback
  const sessionCookie = req.cookies?.[sessionTokenService.SESSION_COOKIE_NAME];
  if (sessionCookie) {
    const user = sessionTokenService.validateSessionToken(sessionCookie);
    if (user) {
      if (!req.session) req.session = {};
      req.session.user = user;
      req.session.sessionToken = sessionCookie;
      return next();
    }
  }

  // 3. Firebase Admin ID token authentication support (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = await verifyFirebaseToken(token);
      if (decoded) {
        req.firebaseUser = decoded;
        if (!req.session) req.session = {};
        if (!req.session.user) {
          req.session.user = {
            id: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email,
            role: decoded.admin || decoded.role === 'admin' ? 'admin' : 'customer'
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
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login to continue.'
    });
  }

  const redirectUrl = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/login.html?redirect=${redirectUrl}`);
}

function optionalAuth(req, res, next) {
  // Sets user context if available, otherwise continues
  next();
}

module.exports = { requireAuth, optionalAuth };
