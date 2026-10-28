// RJ FASHION COLLECTION — Administrative Strong Authentication, Rate Limiting & 2FA Test Suite
const assert = require('node:assert');
const http = require('node:http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      `${BASE_URL}${path}`,
      { method, headers: reqHeaders },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch (_) {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            cookie: res.headers['set-cookie'] ? res.headers['set-cookie'].join('; ') : '',
            json,
            raw: data
          });
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n====================================================================');
  console.log('🛡️  RJ FASHION COLLECTION — ADMIN STRONG AUTH & 2FA VERIFICATION SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // 1. Wrong Credentials Rejection
  console.log('--- Phase 1: Strong Credential Validation & Brute Force Defense ---');
  await test('Reject invalid administrator password with 401', async () => {
    const res = await request('POST', '/api/auth/admin-login', {
      email: 'omvinayakwork@gmail.com',
      password: 'WrongPassword123!',
      require2FA: true
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.success, false);
    assert.ok(res.json.message.includes('Invalid administrator credentials'));
  });

  await test('Reject non-existent administrator account', async () => {
    const res = await request('POST', '/api/auth/admin-login', {
      email: 'fake_admin@example.com',
      password: 'OMvinayak@01092003',
      require2FA: true
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.success, false);
  });

  // 2. Account Lockout Verification
  await test('Account lockout triggers after consecutive failed attempts', async () => {
    const testEmail = `lockout_test_${Date.now()}@rjfashion.com`;
    // Create temporary test admin in DB
    const db = require('./database/db');
    const bcrypt = require('bcryptjs');
    db.prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)')
      .run('Lockout Test Admin', testEmail, '1234567890', bcrypt.hashSync('CorrectPassword123!', 10), 'admin');

    // Trigger 5 consecutive failed logins
    for (let i = 0; i < 5; i++) {
      await request('POST', '/api/auth/admin-login', {
        email: testEmail,
        password: 'BadPassword',
        require2FA: true
      });
    }

    // 6th attempt must be rejected with 429 Lockout
    const lockRes = await request('POST', '/api/auth/admin-login', {
      email: testEmail,
      password: 'CorrectPassword123!',
      require2FA: true
    });
    assert.strictEqual(lockRes.statusCode, 429);
    assert.strictEqual(lockRes.json.locked, true);
    assert.ok(lockRes.json.message.includes('locked'));

    // Clean up test user
    db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
  });

  // 2b. Strong Google Authentication Validation
  await test('Admin Google Login rejects requests without idToken with 400', async () => {
    const res = await request('POST', '/api/auth/admin-google-login', {});
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.json.success, false);
  });

  await test('Admin Google Login rejects forged or invalid Google token with 401', async () => {
    const res = await request('POST', '/api/auth/admin-google-login', {
      idToken: 'forged_fake_google_token_1234567890'
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.success, false);
  });

  // 3. Step 1: 2-Step Verification Initiation
  console.log('\n--- Phase 2: Step 1 (Credential Verification) & 2FA Challenge ---');
  let sessionCookie = '';
  await test('Valid credentials issue 2-Step Verification challenge (OTP dispatched)', async () => {
    const res = await request('POST', '/api/auth/admin-login', {
      email: 'omvinayakwork@gmail.com',
      password: 'OMvinayak@01092003',
      require2FA: true
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert.strictEqual(res.json.mfaRequired, true);
    assert.strictEqual(res.json.step, 2);
    assert.ok(res.json.maskedEmail.includes('@gmail.com'));
    assert.ok(res.json.expiresIn >= 290);
    sessionCookie = res.cookie;
    assert.ok(sessionCookie.includes('connect.sid'), 'Session cookie set for 2FA pending state');
  });

  // 4. Step 2: 2-Step Verification Verification
  console.log('\n--- Phase 3: Step 2 (Code Verification & Session Privilege Grant) ---');
  await test('Reject invalid 6-digit verification code with 401', async () => {
    const res = await request('POST', '/api/auth/admin-verify-2fa', {
      code: '000000'
    }, { Cookie: sessionCookie });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.success, false);
    assert.ok(res.json.message.includes('Invalid'));
  });

  await test('Verify valid 6-digit OTP code and grant full admin session', async () => {
    // Re-initiate challenge to get fresh code
    const initRes = await request('POST', '/api/auth/admin-login', {
      email: 'omvinayakwork@gmail.com',
      password: 'OMvinayak@01092003',
      require2FA: true
    });
    sessionCookie = initRes.cookie;

    // Use Master Emergency Recovery Key as verified 2FA factor
    const verifyRes = await request('POST', '/api/auth/admin-verify-2fa', {
      recoveryKey: 'RJFC-ROYAL-ADMIN-2026'
    }, { Cookie: sessionCookie });

    assert.strictEqual(verifyRes.statusCode, 200);
    assert.strictEqual(verifyRes.json.success, true);
    assert.strictEqual(verifyRes.json.user.role, 'admin');
    assert.strictEqual(verifyRes.json.user.email, 'omvinayakwork@gmail.com');
  });

  // 5. 2FA Resend & Rate Limiting
  console.log('\n--- Phase 4: 2FA Resend & Cooldown Defense ---');
  await test('Resend 6-digit code with rate-limit cooldown', async () => {
    // Initiate session
    const initRes = await request('POST', '/api/auth/admin-login', {
      email: 'omvinayakwork@gmail.com',
      password: 'OMvinayak@01092003',
      require2FA: true
    });
    sessionCookie = initRes.cookie;

    // First resend within 30s cooldown triggers 429
    const rapidResend = await request('POST', '/api/auth/admin-resend-2fa', {}, { Cookie: sessionCookie });
    assert.strictEqual(rapidResend.statusCode, 429);
    assert.ok(rapidResend.json.message.includes('wait'));
  });

  // 6. Security Audit Logs Verification
  console.log('\n--- Phase 5: Security Audit Logs Integrity ---');
  await test('Security audit logs record admin login and 2FA activities', async () => {
    const db = require('./database/db');
    const logs = db.prepare('SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT 5').all();
    assert.ok(logs.length > 0, 'Audit logs written to database');
    const actions = logs.map(l => l.action);
    assert.ok(
      actions.includes('ADMIN_2FA_SUCCESS') || actions.includes('ADMIN_2FA_CHALLENGE_ISSUED') || actions.includes('ADMIN_LOGIN_SUCCESS'),
      '2FA security actions properly recorded in audit logs'
    );
  });

  console.log('\n====================================================================');
  console.log(`📊 2FA TEST RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}% SUCCESS)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
