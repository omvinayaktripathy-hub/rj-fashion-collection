// RJ FASHION COLLECTION — HttpOnly Session Token Service
// Cryptographically secure server-managed session tokens stored in SQLite and HttpOnly cookies

const crypto = require('crypto');
const db = require('../database/db');

const isProd = process.env.NODE_ENV === 'production';
const SESSION_COOKIE_NAME = 'rj_session_token';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Initialize session_tokens table in database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      ip_address TEXT,
      user_agent TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_session_tokens_lookup ON session_tokens (token, expires_at);
  `);
} catch (err) {
  console.error('[SessionTokenService] Table init error:', err.message);
}

/**
 * Generate a cryptographically secure 256-bit session token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Issue and persist a secure session token into an HttpOnly cookie
 * @param {object} res Express response object
 * @param {object} user User object { id, email, role }
 * @param {object} req Optional Express request object for IP and session binding
 * @returns {string} The raw session token
 */
function issueSessionCookie(res, user, req = null) {
  const token = generateToken();
  const userId = Number(user.id || user.uid);
  const email = (user.email || '').toLowerCase().trim();
  const role = user.role || 'customer';
  const ip = req ? (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '') : '';
  const userAgent = req ? (req.headers['user-agent'] || '').slice(0, 255) : '';

  try {
    // Delete any expired session tokens for hygiene
    db.prepare("DELETE FROM session_tokens WHERE expires_at < datetime('now')").run();

    // Store new session token (valid for 7 days)
    db.prepare(`
      INSERT OR REPLACE INTO session_tokens (token, user_id, email, role, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
    `).run(token, userId, email, role, ip, userAgent);
  } catch (err) {
    console.error('[SessionTokenService] DB token insert error:', err.message);
  }

  // Set the HttpOnly cookie on response
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // Inaccessible to JavaScript (XSS immune)
    secure: isProd,  // HTTPS only in production
    sameSite: 'lax', // CSRF defense while allowing standard navigation
    path: '/',
    maxAge: SESSION_MAX_AGE_MS
  });

  // Also bind to Express session if available
  if (req && req.session) {
    req.session.sessionToken = token;
    req.session.user = {
      id: userId,
      email: email,
      name: user.name || (email ? email.split('@')[0] : 'Patron'),
      phone: user.phone || '',
      role: role
    };
  }

  return token;
}

/**
 * Validate session token against database
 * @param {string} token
 * @returns {object|null}
 */
function validateSessionToken(token) {
  if (!token || typeof token !== 'string' || token.length < 32) return null;

  try {
    const row = db.prepare(`
      SELECT st.token, st.user_id, st.role, st.expires_at,
             u.id, u.name, u.email, u.phone, u.role as db_role, u.mfa_enabled
      FROM session_tokens st
      JOIN users u ON u.id = st.user_id
      WHERE st.token = ? AND st.expires_at > datetime('now')
    `).get(token);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.db_role || row.role || 'customer',
      mfa_enabled: Boolean(row.mfa_enabled)
    };
  } catch (err) {
    console.error('[SessionTokenService] Validation error:', err.message);
    return null;
  }
}

/**
 * Destroy session token from DB and clear all auth cookies from browser
 * @param {object} res Express response object
 * @param {string} token Optional session token to delete from DB
 * @param {object} req Optional Express request object
 */
function clearSessionCookie(res, token = null, req = null) {
  if (token) {
    try {
      db.prepare('DELETE FROM session_tokens WHERE token = ?').run(token);
    } catch (_) {}
  }

  if (req && req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    try {
      db.prepare('DELETE FROM session_tokens WHERE token = ?').run(req.cookies[SESSION_COOKIE_NAME]);
    } catch (_) {}
  }

  // Clear HttpOnly session cookie
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  });

  // Clear Express session cookie
  res.clearCookie('connect.sid', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  });

  // Clear CSRF cookie
  res.clearCookie('XSRF-TOKEN', {
    path: '/'
  });
}

module.exports = {
  SESSION_COOKIE_NAME,
  issueSessionCookie,
  validateSessionToken,
  clearSessionCookie
};
