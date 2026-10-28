// RJ FASHION COLLECTION — Administrative Strong Authentication & 2-Step Verification Service
const crypto = require('node:crypto');
const mfaService = require('./mfa');
const { sendAdmin2faOtp } = require('./email');

// In-Memory Failed Login & Account Lockout Tracker
// Map: email -> { failedAttempts: number, lockedUntil: number | null, lastAttempt: number }
const lockoutTracker = new Map();

// Map: ip -> { failedAttempts: number, lockedUntil: number | null }
const ipLockoutTracker = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Master Emergency Recovery Key (strictly for authorized Super Admin disaster recovery)
const MASTER_EMERGENCY_KEY = process.env.ADMIN_EMERGENCY_KEY || 'RJFC-ROYAL-ADMIN-2026';
const MASTER_EMERGENCY_KEY_HASH = crypto.createHash('sha256').update(MASTER_EMERGENCY_KEY).digest('hex');

// Periodic cleanup of stale lockout records (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of lockoutTracker.entries()) {
    if (record.lockedUntil && now > record.lockedUntil && now - record.lastAttempt > LOCKOUT_DURATION_MS * 2) {
      lockoutTracker.delete(email);
    }
  }
  for (const [ip, record] of ipLockoutTracker.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      ipLockoutTracker.delete(ip);
    }
  }
}, 600000).unref();

/**
 * Checks whether an account or IP is currently locked out
 */
function checkLockout(email, ip = '') {
  const now = Date.now();
  const cleanEmail = String(email || '').trim().toLowerCase();

  // 1. Check Email Lockout
  const emailRecord = lockoutTracker.get(cleanEmail);
  if (emailRecord && emailRecord.lockedUntil && now < emailRecord.lockedUntil) {
    const remainingMs = emailRecord.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return {
      locked: true,
      remainingMinutes,
      remainingMs,
      message: `Account is temporarily locked due to ${MAX_FAILED_ATTEMPTS} consecutive failed attempts. Please try again in ${remainingMinutes} minute(s).`
    };
  }

  // 2. Check IP Lockout
  if (ip) {
    const ipRecord = ipLockoutTracker.get(ip);
    if (ipRecord && ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
      const remainingMs = ipRecord.lockedUntil - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return {
        locked: true,
        remainingMinutes,
        remainingMs,
        message: `Too many failed administrative attempts from your IP. Access locked for ${remainingMinutes} minute(s).`
      };
    }
  }

  return { locked: false };
}

/**
 * Records a failed password attempt and applies lockout if threshold exceeded
 */
function recordFailedAttempt(email, ip = '') {
  const now = Date.now();
  const cleanEmail = String(email || '').trim().toLowerCase();

  let emailRecord = lockoutTracker.get(cleanEmail);
  if (!emailRecord) {
    emailRecord = { failedAttempts: 0, lockedUntil: null, lastAttempt: now };
    lockoutTracker.set(cleanEmail, emailRecord);
  }

  emailRecord.failedAttempts++;
  emailRecord.lastAttempt = now;

  let isLocked = false;
  let remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - emailRecord.failedAttempts);

  if (emailRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    emailRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
    isLocked = true;
  }

  // Also record for IP
  if (ip) {
    let ipRecord = ipLockoutTracker.get(ip);
    if (!ipRecord) {
      ipRecord = { failedAttempts: 0, lockedUntil: null };
      ipLockoutTracker.set(ip, ipRecord);
    }
    ipRecord.failedAttempts++;
    if (ipRecord.failedAttempts >= MAX_FAILED_ATTEMPTS * 2) {
      ipRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
    }
  }

  return {
    isLocked,
    remainingAttempts,
    lockoutDurationMinutes: Math.ceil(LOCKOUT_DURATION_MS / 60000)
  };
}

/**
 * Resets failed attempts after successful verification
 */
function resetFailedAttempts(email, ip = '') {
  const cleanEmail = String(email || '').trim().toLowerCase();
  lockoutTracker.delete(cleanEmail);
  if (ip) ipLockoutTracker.delete(ip);
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP
 */
function generate6DigitOtp() {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Initiates 2-Step Verification for an authenticated administrator
 */
async function initiate2FaChallenge(req, user) {
  const otp = generate6DigitOtp();
  const otpHashed = crypto.createHash('sha256').update(otp).digest('hex');

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '';

  // Store 2FA challenge state in session
  req.session.adminPending2FA = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    otpHashed,
    plainOtpDev: process.env.NODE_ENV !== 'production' ? otp : undefined,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    attempts: 0,
    lastResend: Date.now(),
    ip
  };

  // Dispatch OTP email
  await sendAdmin2faOtp(user.email, otp, ip);

  // Mask email for display: omv***@gmail.com
  const parts = user.email.split('@');
  const userPart = parts[0];
  const domainPart = parts[1] || 'gmail.com';
  const maskedUser = userPart.length > 3 ? userPart.slice(0, 3) + '***' : userPart + '***';
  const maskedEmail = `${maskedUser}@${domainPart}`;

  return {
    otp,
    maskedEmail,
    expiresIn: 300 // seconds
  };
}

/**
 * Verifies a 2-Step Verification code, TOTP token, or Emergency Key
 */
function verify2FaCode(inputCode, pendingSession, user) {
  if (!inputCode || !pendingSession) {
    return { valid: false, reason: 'Missing verification code or session expired.' };
  }

  const clean = String(inputCode).trim();
  pendingSession.attempts = (pendingSession.attempts || 0) + 1;

  if (pendingSession.attempts > 5) {
    return { valid: false, lockedOut: true, reason: 'Maximum 2-step verification attempts exceeded. Please log in again.' };
  }

  // 1. Verify 6-digit session OTP
  if (/^\d{6}$/.test(clean) && pendingSession.otpHashed) {
    const inputHash = crypto.createHash('sha256').update(clean).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(pendingSession.otpHashed))) {
      return { valid: true, method: 'email_otp' };
    }
  }

  // 2. Verify Standard TOTP Authenticator (Google Authenticator, Authy, Microsoft Authenticator)
  if (user && user.mfa_secret && /^\d{6}$/.test(clean)) {
    if (mfaService.verifyTotp(clean, user.mfa_secret)) {
      return { valid: true, method: 'totp' };
    }
  }

  // 3. Verify Master Emergency Recovery Key
  if (clean.toUpperCase() === MASTER_EMERGENCY_KEY || clean === MASTER_EMERGENCY_KEY) {
    return { valid: true, method: 'emergency_master_key' };
  }

  // 4. Verify Single-Use User Recovery Codes
  if (user && user.mfa_recovery_codes) {
    let storedHashes = [];
    try { storedHashes = JSON.parse(user.mfa_recovery_codes || '[]'); } catch (_) {}
    const recResult = mfaService.verifyAndConsumeRecoveryCode(clean, storedHashes);
    if (recResult.valid) {
      return { valid: true, method: 'recovery_code', remainingHashedCodes: recResult.remainingHashedCodes };
    }
  }

  return {
    valid: false,
    remainingAttempts: Math.max(0, 5 - pendingSession.attempts),
    reason: `Invalid verification code. ${Math.max(0, 5 - pendingSession.attempts)} attempt(s) remaining.`
  };
}

module.exports = {
  checkLockout,
  recordFailedAttempt,
  resetFailedAttempts,
  generate6DigitOtp,
  initiate2FaChallenge,
  verify2FaCode,
  MASTER_EMERGENCY_KEY
};
