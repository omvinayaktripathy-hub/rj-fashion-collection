const crypto = require('node:crypto');

// Base32 Alphabet (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate random Base32 secret (160-bit key = 32 base32 chars)
function generateSecret(length = 32) {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[bytes[i] % 32];
  }
  return secret;
}

// Decode Base32 string to Buffer
function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/[\s-]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// Generate TOTP token for given time step (RFC 6238, step = 30s, digits = 6)
function generateTotp(secret, timeStep = Math.floor(Date.now() / 30000)) {
  const key = base32Decode(secret);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify TOTP token with clock drift window (+/- 1 step = 30s)
function verifyTotp(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = String(token).trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const currentStep = Math.floor(Date.now() / 30000);
  for (let i = -window; i <= window; i++) {
    const expected = generateTotp(secret, currentStep + i);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

// Generate single-use recovery codes
function generateRecoveryCodes(count = 8) {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const code = 'RJFC-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    plainCodes.push(code);
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

// Verify and consume a single-use recovery code
function verifyAndConsumeRecoveryCode(inputCode, hashedCodesList) {
  if (!inputCode || !Array.isArray(hashedCodesList) || hashedCodesList.length === 0) {
    return { valid: false, remainingHashedCodes: hashedCodesList };
  }

  const clean = inputCode.trim().toUpperCase();
  const inputHash = crypto.createHash('sha256').update(clean).digest('hex');

  const index = hashedCodesList.findIndex(h => h === inputHash);
  if (index !== -1) {
    const remaining = [...hashedCodesList];
    remaining.splice(index, 1);
    return { valid: true, remainingHashedCodes: remaining };
  }

  return { valid: false, remainingHashedCodes: hashedCodesList };
}

// Generate OTPAuth URI for QR code generators / Authenticator apps
function getOtpAuthUri(secret, accountName = 'admin@rjfashion.com', issuer = 'RJ Fashion Collection') {
  const encIssuer = encodeURIComponent(issuer);
  const encAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  generateSecret,
  generateTotp,
  verifyTotp,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
  getOtpAuthUri
};
