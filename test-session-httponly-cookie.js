// RJ FASHION COLLECTION — HttpOnly Session Cookie Verification Suite
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
            cookies: res.headers['set-cookie'] || [],
            rawCookie: res.headers['set-cookie'] ? res.headers['set-cookie'].join('; ') : '',
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

function parseCookieValue(setCookieHeader, name) {
  for (const c of setCookieHeader) {
    if (c.startsWith(`${name}=`)) {
      const match = c.match(new RegExp(`^${name}=([^;]+)`));
      return match ? match[1] : null;
    }
  }
  return null;
}

function hasHttpOnlyFlag(setCookieHeader, name) {
  for (const c of setCookieHeader) {
    if (c.startsWith(`${name}=`)) {
      return /;\s*httponly/i.test(c);
    }
  }
  return false;
}

async function runTests() {
  console.log('\n====================================================================');
  console.log('🍪 RJ FASHION COLLECTION — HTTPONLY SESSION COOKIE VERIFICATION');
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

  const testEmail = `patron_${Date.now()}@example.com`;
  let customerSessionToken = '';
  let customerCookies = '';

  console.log('--- Phase 1: Customer Registration & Login HttpOnly Cookie ---');
  await test('Registration issues rj_session_token with HttpOnly flag', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Princess Gayatri',
      email: testEmail,
      password: 'RoyalPassword2026!',
      confirmPassword: 'RoyalPassword2026!',
      phone: '+91 9876543210'
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.json.success, true);

    const tokenVal = parseCookieValue(res.cookies, 'rj_session_token');
    assert.ok(tokenVal, 'rj_session_token cookie exists in Set-Cookie');
    assert.ok(tokenVal.length >= 32, 'Session token is high-entropy hex string');
    assert.strictEqual(hasHttpOnlyFlag(res.cookies, 'rj_session_token'), true, 'rj_session_token has HttpOnly flag');
    assert.strictEqual(hasHttpOnlyFlag(res.cookies, 'connect.sid'), true, 'connect.sid has HttpOnly flag');

    customerSessionToken = tokenVal;
    customerCookies = `rj_session_token=${tokenVal}`;
  });

  await test('Login issues fresh rj_session_token with HttpOnly flag', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'RoyalPassword2026!'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);

    const tokenVal = parseCookieValue(res.cookies, 'rj_session_token');
    assert.ok(tokenVal, 'rj_session_token exists in Set-Cookie');
    assert.strictEqual(hasHttpOnlyFlag(res.cookies, 'rj_session_token'), true, 'HttpOnly flag present');

    customerSessionToken = tokenVal;
    customerCookies = `rj_session_token=${tokenVal}`;
  });

  console.log('\n--- Phase 2: Session Hydration & Protected Resource Access ---');
  await test('GET /api/me authenticates exclusively via HttpOnly cookie', async () => {
    const res = await request('GET', '/api/me', null, {
      Cookie: customerCookies
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert.strictEqual(res.json.user.email, testEmail);
    assert.strictEqual(res.json.user.name, 'Princess Gayatri');
  });

  await test('Reject requests without HttpOnly session cookie on protected endpoints', async () => {
    const res = await request('GET', '/api/orders');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.success, false);
  });

  await test('Reject forged or invalid session token in cookie', async () => {
    const res = await request('GET', '/api/me', null, {
      Cookie: 'rj_session_token=forged_fake_token_12345678901234567890123456789012'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.user, null, 'Forged token yields null user');
  });

  console.log('\n--- Phase 3: Admin Authentication & HttpOnly Cookie Isolation ---');
  let adminCookies = '';
  await test('Super Admin login issues rj_session_token with HttpOnly flag', async () => {
    const res = await request('POST', '/api/auth/admin-login', {
      email: 'omvinayakwork@gmail.com',
      password: 'OMvinayak@01092003'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);

    const tokenVal = parseCookieValue(res.cookies, 'rj_session_token');
    assert.ok(tokenVal, 'Admin rj_session_token cookie exists');
    assert.strictEqual(hasHttpOnlyFlag(res.cookies, 'rj_session_token'), true, 'Admin cookie has HttpOnly flag');

    adminCookies = `rj_session_token=${tokenVal}`;
  });

  await test('Admin stats API accessible via Admin HttpOnly session cookie', async () => {
    const res = await request('GET', '/api/admin/stats', null, {
      Cookie: adminCookies
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert.ok(res.json.stats.totalSales >= 0);
  });

  await test('Customer HttpOnly session cookie rejected from Admin API (403)', async () => {
    const res = await request('GET', '/api/admin/stats', null, {
      Cookie: customerCookies
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.json.success, false);
  });

  console.log('\n--- Phase 4: Session Logout & Cookie Invalidation ---');
  await test('POST /api/auth/logout clears HttpOnly session cookie from browser', async () => {
    const logoutRes = await request('POST', '/api/auth/logout', null, {
      Cookie: customerCookies
    });
    assert.strictEqual(logoutRes.statusCode, 200);
    assert.strictEqual(logoutRes.json.success, true);

    // Verify Set-Cookie clears rj_session_token
    const rawSetCookie = logoutRes.rawCookie.toLowerCase();
    assert.ok(rawSetCookie.includes('rj_session_token=;'), 'rj_session_token cookie cleared');
    assert.ok(rawSetCookie.includes('connect.sid=;'), 'connect.sid cookie cleared');

    // Verify subsequent call with old token fails
    const meRes = await request('GET', '/api/me', null, {
      Cookie: customerCookies
    });
    assert.strictEqual(meRes.statusCode, 200);
    assert.strictEqual(meRes.json.user, null, 'Invalidated token no longer authenticates');
  });

  console.log('\n====================================================================');
  console.log(`📊 HTTPONLY COOKIE TEST RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}% SUCCESS)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
