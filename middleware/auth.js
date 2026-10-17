function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
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
