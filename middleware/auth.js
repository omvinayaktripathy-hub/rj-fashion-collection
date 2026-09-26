function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
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
