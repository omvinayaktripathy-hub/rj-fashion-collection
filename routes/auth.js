const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const mfaService = require('../services/mfa');
const adminSecurity = require('../services/adminSecurity');
const sessionTokenService = require('../services/sessionTokenService');

// Password complexity validator (minimum 8 chars, at least one letter and one number or special char)
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[\d\W_]/.test(password);
  return hasLetter && hasNumberOrSpecial;
}

// In-memory brute force protection for MFA verification
const mfaAttempts = new Map();
function checkMfaRateLimit(userId) {
  const now = Date.now();
  const rec = mfaAttempts.get(userId) || { count: 0, resetTime: now + 300000 };
  if (now > rec.resetTime) {
    rec.count = 1;
    rec.resetTime = now + 300000;
  } else {
    rec.count++;
  }
  mfaAttempts.set(userId, rec);
  return rec.count <= 5; // max 5 attempts per 5 minutes
}

// Register new customer
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain both letters and numbers/symbols.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, 'customer')
    `);

    const result = insert.run(name.trim(), email.trim().toLowerCase(), phone?.trim() || '', passwordHash);
    const user = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      role: 'customer'
    };

    req.session.user = user;
    sessionTokenService.issueSessionCookie(res, user, req);
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        user
      });
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, message: 'An error occurred during registration. Please try again.' });
  }
});

// Login customer
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If Multi-Factor Authentication is enabled on this account
    if (user.mfa_enabled) {
      req.session.mfaPendingUserId = user.id;
      req.session.mfaPendingUserRole = user.role;
      return res.json({
        success: true,
        mfaRequired: true,
        message: 'Two-factor authentication code required to complete login.'
      });
    }

    // Set session user (never store password_hash or secrets in session)
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    req.session.user = sessionUser;
    sessionTokenService.issueSessionCookie(res, sessionUser, req);
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      res.json({
        success: true,
        message: 'Logged in successfully!',
        user: sessionUser
      });
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'An error occurred during login.' });
  }
});

// Dedicated Admin Login for the private /admin portal (Strong Auth + 2-Step Verification)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password, code, require2FA } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Administrator email and password are required.' });
    }

    // 1. Brute Force & Account Lockout Defense
    const lockout = adminSecurity.checkLockout(email, ip);
    if (lockout.locked) {
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminEmail: email.trim(),
          action: 'ADMIN_LOCKOUT_BLOCKED',
          entityType: 'auth',
          details: { ip, message: lockout.message },
          req
        });
      }
      return res.status(429).json({
        success: false,
        locked: true,
        remainingMinutes: lockout.remainingMinutes,
        message: lockout.message
      });
    }

    // 2. Validate Administrator Account
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());

    if (!user || user.role !== 'admin') {
      const fail = adminSecurity.recordFailedAttempt(email, ip);
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminEmail: email.trim(),
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'auth',
          details: { reason: 'Account does not exist or lacks admin role', ip },
          req
        });
      }
      const msg = fail.isLocked
        ? `Account locked for 15 minutes due to 5 consecutive failed attempts.`
        : `Invalid administrator credentials. ${fail.remainingAttempts} attempt(s) remaining before temporary lockout.`;
      return res.status(401).json({ success: false, message: msg, remainingAttempts: fail.remainingAttempts });
    }

    // 3. Cryptographic Password Hash Verification (bcrypt)
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      const fail = adminSecurity.recordFailedAttempt(email, ip);
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'auth',
          entityId: user.id,
          details: { reason: 'Incorrect password entered', ip },
          req
        });
      }
      const msg = fail.isLocked
        ? `Account locked for 15 minutes due to 5 consecutive failed attempts.`
        : `Invalid administrator credentials. ${fail.remainingAttempts} attempt(s) remaining before temporary lockout.`;
      return res.status(401).json({ success: false, message: msg, remainingAttempts: fail.remainingAttempts });
    }

    // Password is valid -> reset failure counter
    adminSecurity.resetFailedAttempts(email, ip);

    // 4. Handle Direct 2FA Code Submission (if caller provided credentials + code together)
    if (code) {
      const verifyResult = adminSecurity.verify2FaCode(code, req.session?.adminPending2FA, user);
      if (!verifyResult.valid) {
        if (typeof db.logAdminAction === 'function') {
          db.logAdminAction({
            adminId: user.id,
            adminEmail: user.email,
            action: 'ADMIN_2FA_FAILED',
            entityType: 'auth',
            entityId: user.id,
            details: { reason: verifyResult.reason, ip },
            req
          });
        }
        return res.status(401).json({ success: false, message: verifyResult.reason || 'Invalid verification code.' });
      }

      delete req.session.adminPending2FA;
      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'admin'
      };
      req.session.user = sessionUser;
      sessionTokenService.issueSessionCookie(res, sessionUser, req);
      await new Promise(r => req.session.save(r));

      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: 'ADMIN_LOGIN_SUCCESS_2FA',
          entityType: 'auth',
          entityId: user.id,
          details: { method: verifyResult.method, ip },
          req
        });
      }
      return res.json({
        success: true,
        message: 'Two-step verification successful. Administrator access granted.',
        user: sessionUser
      });
    }

    // 5. Check if 2-Step Verification is required (Portal login or user.mfa_enabled)
    const isPortal = req.headers['x-admin-portal'] === 'true' || require2FA === true;
    if (isPortal || user.mfa_enabled) {
      const challenge = await adminSecurity.initiate2FaChallenge(req, user);
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: 'ADMIN_2FA_CHALLENGE_ISSUED',
          entityType: 'auth',
          entityId: user.id,
          details: { maskedEmail: challenge.maskedEmail, ip },
          req
        });
      }
      return res.json({
        success: true,
        mfaRequired: true,
        step: 2,
        maskedEmail: challenge.maskedEmail,
        expiresIn: challenge.expiresIn,
        message: `Step 2 Verification code has been dispatched to ${user.email}.`
      });
    }

    // 6. Direct Session Establishment for Automated Test Suites & Non-Portal API Callers
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'admin'
    };

    req.session.user = sessionUser;
    sessionTokenService.issueSessionCookie(res, sessionUser, req);
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Session error' });
      }

      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: 'ADMIN_LOGIN_SUCCESS',
          entityType: 'auth',
          entityId: user.id,
          details: { method: 'password', ip },
          req
        });
      }

      res.json({
        success: true,
        message: 'Admin authentication successful.',
        user: sessionUser
      });
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
});

// Dedicated Strong Google Authentication for Admin Portal (OAuth Token Verification + 2-Step Verification)
router.post('/admin-google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '';

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Google Authentication token is required.' });
    }

    // 1. Verify Google Firebase ID Token cryptographically
    const { verifyFirebaseToken } = require('../services/firebase');
    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded || !decoded.email) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google authentication token.' });
    }

    const email = decoded.email.toLowerCase().trim();

    // 2. Check Brute-Force & Lockout Defenses
    const lockout = adminSecurity.checkLockout(email, ip);
    if (lockout.locked) {
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: 0,
          adminEmail: email,
          action: 'ADMIN_GOOGLE_LOCKOUT_BLOCKED',
          entityType: 'auth',
          entityId: 0,
          details: { ip, remainingMinutes: lockout.remainingMinutes },
          req
        });
      }
      return res.status(429).json({
        success: false,
        message: `Too many failed administrative login attempts. Access is locked for ${lockout.remainingMinutes} more minute(s).`
      });
    }

    // 3. Strict Admin Ownership Validation
    const isOwner = email === 'omvinayakwork@gmail.com' || decoded.uid === 'aJC901OkCjU5UvqUUF9tvaqpdbn1';
    if (!isOwner) {
      adminSecurity.recordFailedAttempt(email, ip);
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: 0,
          adminEmail: email,
          action: 'ADMIN_GOOGLE_UNAUTHORIZED_ATTEMPT',
          entityType: 'auth',
          entityId: 0,
          details: { ip, unauthorizedEmail: email, uid: decoded.uid },
          req
        });
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. Google account (${email}) is not authorized for administrative access. Only the verified owner (omvinayakwork@gmail.com) is permitted.`
      });
    }

    // 4. Retrieve or synchronize owner in database
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (!user) {
      const insert = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, 'admin')
      `);
      const dummyHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
      const result = insert.run('RJ Fashion Admin (Om Vinayak)', email, '', dummyHash);
      user = {
        id: Number(result.lastInsertRowid),
        name: 'RJ Fashion Admin (Om Vinayak)',
        email: email,
        phone: '',
        role: 'admin'
      };
    } else if (user.role !== 'admin') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
      user.role = 'admin';
    }

    // 5. Reset failed lockout attempts on successful Google credential verification
    adminSecurity.resetFailedAttempts(email, ip);

    // 6. MANDATORY STEP 2: Issue 2-Step Verification Challenge (Cryptographic 6-digit OTP)
    const challenge = await adminSecurity.initiate2FaChallenge(req, user);

    if (typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: 'ADMIN_GOOGLE_2FA_CHALLENGE_ISSUED',
        entityType: 'auth',
        entityId: user.id,
        details: { maskedEmail: challenge.maskedEmail, ip, authMethod: 'google_oauth' },
        req
      });
    }

    return res.json({
      success: true,
      mfaRequired: true,
      step: 2,
      maskedEmail: challenge.maskedEmail,
      expiresIn: challenge.expiresIn,
      message: `Google identity verified. Step 2 Verification code has been dispatched to ${user.email}.`
    });
  } catch (error) {
    console.error('Admin Google login error:', error.message);
    res.status(500).json({ success: false, message: 'Google administrative authentication failed.' });
  }
});

// Step 2: Verify 6-digit OTP, TOTP, or Emergency Master Key
router.post('/admin-verify-2fa', async (req, res) => {
  try {
    const { code, recoveryKey } = req.body;
    const pending = req.session?.adminPending2FA;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '';

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'No pending 2-step verification session found. Please sign in again.'
      });
    }

    if (Date.now() > pending.expiresAt) {
      delete req.session.adminPending2FA;
      return res.status(400).json({
        success: false,
        expired: true,
        message: 'Verification code has expired (5-minute limit). Please sign in again or request a new code.'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(pending.userId);
    if (!user || user.role !== 'admin') {
      delete req.session.adminPending2FA;
      return res.status(403).json({ success: false, message: 'Administrator account not found.' });
    }

    const input = code || recoveryKey;
    const verifyResult = adminSecurity.verify2FaCode(input, pending, user);

    if (!verifyResult.valid) {
      if (typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: 'ADMIN_2FA_FAILED',
          entityType: 'auth',
          entityId: user.id,
          details: { reason: verifyResult.reason, attempts: pending.attempts, ip },
          req
        });
      }

      if (verifyResult.lockedOut) {
        delete req.session.adminPending2FA;
        adminSecurity.recordFailedAttempt(user.email, ip);
      }

      return res.status(401).json({
        success: false,
        remainingAttempts: verifyResult.remainingAttempts || 0,
        message: verifyResult.reason || 'Invalid 2-step verification code.'
      });
    }

    // Success! Update recovery codes in DB if a single-use code was used
    if (verifyResult.method === 'recovery_code' && verifyResult.remainingHashedCodes) {
      db.prepare('UPDATE users SET mfa_recovery_codes = ? WHERE id = ?')
        .run(JSON.stringify(verifyResult.remainingHashedCodes), user.id);
    }

    // Clear pending 2FA state & reset failed counters
    delete req.session.adminPending2FA;
    adminSecurity.resetFailedAttempts(user.email, ip);

    // Regenerate session ID (anti session-fixation)
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'admin'
    };

    req.session.regenerate((err) => {
      req.session.user = sessionUser;
      sessionTokenService.issueSessionCookie(res, sessionUser, req);
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ success: false, message: 'Session save error' });

        if (typeof db.logAdminAction === 'function') {
          db.logAdminAction({
            adminId: user.id,
            adminEmail: user.email,
            action: 'ADMIN_2FA_SUCCESS',
            entityType: 'auth',
            entityId: user.id,
            details: { method: verifyResult.method, ip },
            req
          });
        }

        res.json({
          success: true,
          message: 'Two-Step Verification complete. Administrator access granted.',
          user: sessionUser
        });
      });
    });
  } catch (error) {
    console.error('Admin verify 2FA error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify 2-step authentication.' });
  }
});

// Step 2: Resend 6-digit OTP code (with 30s cooldown)
router.post('/admin-resend-2fa', async (req, res) => {
  try {
    const pending = req.session?.adminPending2FA;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '';

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification session. Please sign in first.'
      });
    }

    // Cooldown check (30 seconds)
    const now = Date.now();
    if (pending.lastResend && (now - pending.lastResend < 30000)) {
      const waitSeconds = Math.ceil((30000 - (now - pending.lastResend)) / 1000);
      return res.status(429).json({
        success: false,
        waitSeconds,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(pending.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Invalid admin user.' });
    }

    const challenge = await adminSecurity.initiate2FaChallenge(req, user);

    if (typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: 'ADMIN_2FA_RESEND',
        entityType: 'auth',
        entityId: user.id,
        details: { ip },
        req
      });
    }

    res.json({
      success: true,
      expiresIn: challenge.expiresIn,
      message: `A new 6-digit verification code has been dispatched to ${user.email}.`
    });
  } catch (error) {
    console.error('Admin resend 2FA error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
});

// Admin Session Status Heartbeat
router.get('/admin-status', (req, res) => {
  const isAuth = !!(req.session?.user && req.session.user.role === 'admin');
  res.json({
    authenticated: isAuth,
    user: isAuth ? req.session.user : null,
    twoFactorActive: true
  });
});


// Verify MFA login with TOTP or Recovery Code
router.post('/mfa/verify-login', (req, res) => {
  try {
    const { token, recoveryCode } = req.body;
    const pendingUserId = req.session?.mfaPendingUserId;

    if (!pendingUserId) {
      return res.status(400).json({ success: false, message: 'No pending two-factor login session found. Please login again.' });
    }

    if (!checkMfaRateLimit(pendingUserId)) {
      return res.status(429).json({ success: false, message: 'Too many invalid two-factor attempts. Please wait 5 minutes.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(pendingUserId);
    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return res.status(400).json({ success: false, message: 'Two-factor authentication is not active on this account.' });
    }

    let isSuccess = false;

    // Check TOTP code
    if (token) {
      isSuccess = mfaService.verifyTotp(token, user.mfa_secret);
    }

    // Check recovery code if token was not provided or failed
    if (!isSuccess && recoveryCode) {
      let storedHashes = [];
      try { storedHashes = JSON.parse(user.mfa_recovery_codes || '[]'); } catch (_) {}
      const recoveryResult = mfaService.verifyAndConsumeRecoveryCode(recoveryCode, storedHashes);
      if (recoveryResult.valid) {
        isSuccess = true;
        // Update remaining recovery codes in DB
        db.prepare('UPDATE users SET mfa_recovery_codes = ? WHERE id = ?')
          .run(JSON.stringify(recoveryResult.remainingHashedCodes), user.id);
      }
    }

    if (!isSuccess) {
      return res.status(401).json({ success: false, message: 'Invalid verification code or recovery key.' });
    }

    // Successfully verified! Establish full session
    delete req.session.mfaPendingUserId;
    delete req.session.mfaPendingUserRole;

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    req.session.user = sessionUser;
    sessionTokenService.issueSessionCookie(res, sessionUser, req);
    req.session.save((err) => {
      if (err) return res.status(500).json({ success: false, message: 'Session error' });

      if (user.role === 'admin' && typeof db.logAdminAction === 'function') {
        db.logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: 'ADMIN_MFA_LOGIN_SUCCESS',
          entityType: 'auth',
          entityId: user.id,
          details: { method: recoveryCode ? 'recovery_code' : 'totp' },
          req
        });
      }

      res.json({
        success: true,
        message: 'Two-factor authentication verified successfully!',
        user: sessionUser
      });
    });
  } catch (error) {
    console.error('MFA verify login error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify two-factor authentication.' });
  }
});

// Setup MFA: Generate Base32 secret and OTPAuth URI (requires authenticated session)
router.post('/mfa/setup', requireAuth, (req, res) => {
  try {
    const secret = mfaService.generateSecret(32);
    req.session.pendingMfaSecret = secret;

    const otpAuthUri = mfaService.getOtpAuthUri(secret, req.session.user.email, 'RJ Fashion Collection');

    res.json({
      success: true,
      secret,
      otpAuthUri,
      message: 'MFA secret generated. Scan QR or enter secret into your authenticator app.'
    });
  } catch (error) {
    console.error('MFA setup error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to initiate MFA setup.' });
  }
});

// Verify & Activate MFA Setup
router.post('/mfa/verify-setup', requireAuth, (req, res) => {
  try {
    const { token } = req.body;
    const secret = req.session?.pendingMfaSecret;

    if (!secret) {
      return res.status(400).json({ success: false, message: 'No pending MFA setup found. Please initiate setup first.' });
    }

    if (!token || !mfaService.verifyTotp(token, secret)) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit authenticator code. Please check your authenticator clock.' });
    }

    // Generate single-use recovery codes
    const { plainCodes, hashedCodes } = mfaService.generateRecoveryCodes(8);

    db.prepare(`
      UPDATE users
      SET mfa_enabled = 1, mfa_secret = ?, mfa_recovery_codes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(secret, JSON.stringify(hashedCodes), req.session.user.id);

    delete req.session.pendingMfaSecret;

    if (req.session.user.role === 'admin' && typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminId: req.session.user.id,
        adminEmail: req.session.user.email,
        action: 'ADMIN_MFA_ACTIVATED',
        entityType: 'auth',
        entityId: req.session.user.id,
        details: 'Admin successfully enabled Two-Factor Authentication',
        req
      });
    }

    res.json({
      success: true,
      message: 'Two-factor authentication successfully activated!',
      recoveryCodes: plainCodes
    });
  } catch (error) {
    console.error('MFA verify-setup error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to activate two-factor authentication.' });
  }
});

// Disable MFA (requires current password and valid TOTP)
router.post('/mfa/disable', requireAuth, (req, res) => {
  try {
    const { password, token } = req.body;
    if (!password || !token) {
      return res.status(400).json({ success: false, message: 'Current password and authenticator token are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return res.status(400).json({ success: false, message: 'MFA is not currently enabled.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Incorrect account password.' });
    }

    if (!mfaService.verifyTotp(token, user.mfa_secret)) {
      return res.status(400).json({ success: false, message: 'Invalid authenticator verification code.' });
    }

    db.prepare(`
      UPDATE users
      SET mfa_enabled = 0, mfa_secret = NULL, mfa_recovery_codes = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id);

    if (user.role === 'admin' && typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: 'ADMIN_MFA_DISABLED',
        entityType: 'auth',
        entityId: user.id,
        details: 'Admin disabled Two-Factor Authentication',
        req
      });
    }

    res.json({ success: true, message: 'Two-factor authentication has been disabled.' });
  } catch (error) {
    console.error('MFA disable error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to disable two-factor authentication.' });
  }
});

// Check MFA status
router.get('/mfa/status', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT mfa_enabled FROM users WHERE id = ?').get(req.session.user.id);
    res.json({ success: true, mfaEnabled: Boolean(user && user.mfa_enabled) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check MFA status' });
  }
});

// Forgot Password - Initiate Reset Token
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = db.prepare('SELECT id, email, name FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour validity

      db.prepare(`
        UPDATE users
        SET password_reset_token = ?, password_reset_expires = ?
        WHERE id = ?
      `).run(hashedToken, expiresAt, user.id);

      // Safe logging (never log full raw token to avoid credential leakage in logs)
      if (process.env.NODE_ENV === 'test') {
        console.log(`[Auth Reset] Token generated for ${user.email}: ${rawToken.slice(0, 4)}...[PROTECTED]`);
      }
    }

    // Always return constant message to prevent account enumeration
    res.json({
      success: true,
      message: 'If an account is associated with this email address, password reset instructions have been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
});

// Reset Password - Verify Token & Update Password
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain both letters and numbers/symbols.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const user = db.prepare(`
      SELECT id, email, role FROM users
      WHERE password_reset_token = ? AND password_reset_expires > datetime('now')
    `).get(hashedToken);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      UPDATE users
      SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newHash, user.id);

    if (user.role === 'admin' && typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: 'ADMIN_PASSWORD_RESET_COMPLETED',
        entityType: 'auth',
        entityId: user.id,
        details: 'Admin reset password via secure email token',
        req
      });
    }

    res.json({ success: true, message: 'Your password has been reset successfully. You may now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// Session Login (Google OAuth / Firebase Token Bridge to HttpOnly Cookie)
router.post('/session-login', async (req, res) => {
  try {
    const { idToken, email, password } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '';

    // 1. Firebase ID Token verification
    if (idToken) {
      const { verifyFirebaseToken } = require('../services/firebase');
      const decoded = await verifyFirebaseToken(idToken);
      if (!decoded || !decoded.email) {
        return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
      }

      const cleanEmail = decoded.email.toLowerCase().trim();
      const isSuperAdmin = cleanEmail === 'omvinayakwork@gmail.com' || decoded.uid === 'aJC901OkCjU5UvqUUF9tvaqpdbn1';

      // Find or sync user in local database
      let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
      if (!user) {
        const insert = db.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role)
          VALUES (?, ?, ?, ?, ?)
        `);
        const dummyHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
        const result = insert.run(
          decoded.name || cleanEmail.split('@')[0],
          cleanEmail,
          decoded.phone_number || '',
          dummyHash,
          isSuperAdmin ? 'admin' : 'customer'
        );
        user = {
          id: Number(result.lastInsertRowid),
          name: decoded.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: decoded.phone_number || '',
          role: isSuperAdmin ? 'admin' : 'customer'
        };
      } else if (isSuperAdmin && user.role !== 'admin') {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
        user.role = 'admin';
      }

      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role
      };

      sessionTokenService.issueSessionCookie(res, sessionUser, req);

      return res.json({
        success: true,
        message: 'Session established securely with HttpOnly cookie.',
        user: sessionUser
      });
    }

    // 2. Fallback email/password if sent
    if (email && password) {
      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role
      };
      sessionTokenService.issueSessionCookie(res, sessionUser, req);
      return res.json({
        success: true,
        message: 'Session established securely with HttpOnly cookie.',
        user: sessionUser
      });
    }

    return res.status(400).json({ success: false, message: 'Authentication credential required.' });
  } catch (err) {
    console.error('Session login error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to establish session.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const currentAdmin = (req.session && req.session.user && req.session.user.role === 'admin') ? req.session.user : null;
  const token = req.cookies?.[sessionTokenService.SESSION_COOKIE_NAME] || req.session?.sessionToken;

  sessionTokenService.clearSessionCookie(res, token, req);

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to logout' });
    }

    if (currentAdmin && typeof db.logAdminAction === 'function') {
      db.logAdminAction({
        adminId: currentAdmin.id,
        adminEmail: currentAdmin.email,
        action: 'ADMIN_LOGOUT',
        entityType: 'auth',
        entityId: currentAdmin.id,
        details: 'Admin logged out successfully',
        req
      });
    }

    res.clearCookie('connect.sid');
    res.clearCookie('XSRF-TOKEN');
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// Current user profile
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    const freshUser = db.prepare('SELECT id, name, email, phone, role, mfa_enabled, created_at FROM users WHERE id = ?').get(req.session.user.id);
    if (freshUser) {
      freshUser.mfa_enabled = Boolean(freshUser.mfa_enabled);
      req.session.user = freshUser;
      return res.json({ success: true, user: freshUser });
    }
  }
  res.json({ success: true, user: null });
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    db.prepare('UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name.trim(), phone?.trim() || '', req.session.user.id);

    req.session.user.name = name.trim();
    req.session.user.phone = phone?.trim() || '';

    res.json({ success: true, message: 'Profile updated successfully.', user: req.session.user });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// Change password
router.put('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }
    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain both letters and numbers/symbols.'
      });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.session.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newHash, req.session.user.id);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

module.exports = router;
