/**
 * RJ FASHION COLLECTION — COUPON ANTI-ABUSE & SINGLE-USE PER IP VERIFICATION SUITE
 * 
 * Validates the core business security requirement:
 * 1. Single redemption per customer ID
 * 2. Single redemption per IP address
 * 3. Multi-accounting prevention (User B on User A's IP is rejected)
 * 4. IP roaming prevention (User A on a new IP is rejected if already used)
 * 5. Minimum order threshold enforcement
 * 6. Non-existent coupon rejection
 */

const db = require('../database/db');
const couponService = require('../services/couponService');
const bcrypt = require('bcryptjs');

let passed = 0;
let failed = 0;

function assert(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name} -> ${errorMsg}`);
    failed++;
  }
}

async function runCouponAntiAbuseTests() {
  console.log('============================================================');
  console.log('🎟️  COUPON ANTI-ABUSE & SINGLE-USE PER IP AUDIT');
  console.log('============================================================\n');

  // Test setup: clean any previous test data
  const testEmail1 = 'coupon_user1_test@rjfashion.test';
  const testEmail2 = 'coupon_user2_test@rjfashion.test';
  const testIp1 = '203.0.113.101';
  const testIp2 = '203.0.113.202';
  const testCoupon = 'GRANDRJ';

  db.prepare('DELETE FROM coupon_redemptions WHERE coupon_code = ?').run(testCoupon);
  db.prepare('DELETE FROM orders WHERE coupon_code = ?').run(testCoupon);
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run(testEmail1, testEmail2);

  const pwHash = bcrypt.hashSync('TestSecretPassword123!', 10);
  const u1 = db.prepare("INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'customer')").run('User Alpha', testEmail1, '9000000001', pwHash);
  const user1 = { id: Number(u1.lastInsertRowid), email: testEmail1 };

  const u2 = db.prepare("INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'customer')").run('User Beta', testEmail2, '9000000002', pwHash);
  const user2 = { id: Number(u2.lastInsertRowid), email: testEmail2 };

  // -------------------------------------------------------------
  // Test 1: Fresh User 1 from IP 1 tests GRANDRJ (Should be eligible)
  // -------------------------------------------------------------
  const t1 = couponService.checkCouponEligibility(testCoupon, {
    userId: user1.id,
    userEmail: user1.email,
    userIp: testIp1,
    orderAmount: 1500
  });

  assert(
    'Fresh Customer 1 from IP 1 is eligible for coupon',
    t1.eligible === true && t1.discount_amount > 0,
    `Message: ${t1.message}`
  );

  // User 1 completes Order 1 with GRANDRJ
  couponService.recordCouponRedemption({
    couponCode: testCoupon,
    userId: user1.id,
    userEmail: user1.email,
    userIp: testIp1,
    orderId: 99901,
    orderNumber: 'RJFC-TEST-CPN-001',
    discountAmount: t1.discount_amount
  });

  // -------------------------------------------------------------
  // Test 2: User 1 tries to use GRANDRJ again from the SAME IP
  // (Must be REJECTED - already used by this customer)
  // -------------------------------------------------------------
  const t2 = couponService.checkCouponEligibility(testCoupon, {
    userId: user1.id,
    userEmail: user1.email,
    userIp: testIp1,
    orderAmount: 1500
  });

  assert(
    'User 1 reusing coupon from same IP is REJECTED',
    t2.eligible === false && (t2.reason === 'ALREADY_USED_BY_USER' || t2.reason === 'ALREADY_USED_BY_EMAIL'),
    `Result: ${JSON.stringify(t2)}`
  );

  // -------------------------------------------------------------
  // Test 3: User 1 switches to a DIFFERENT IP (IP 2)
  // (Must be REJECTED - customer identity already redeemed it)
  // -------------------------------------------------------------
  const t3 = couponService.checkCouponEligibility(testCoupon, {
    userId: user1.id,
    userEmail: user1.email,
    userIp: testIp2,
    orderAmount: 1500
  });

  assert(
    'User 1 reusing coupon from a DIFFERENT IP is REJECTED',
    t3.eligible === false && (t3.reason === 'ALREADY_USED_BY_USER' || t3.reason === 'ALREADY_USED_BY_EMAIL'),
    `Result: ${JSON.stringify(t3)}`
  );

  // -------------------------------------------------------------
  // Test 4: User 2 (DIFFERENT account / new ID) on SAME IP 1
  // (Must be REJECTED - IP address already claimed the offer!)
  // -------------------------------------------------------------
  const t4 = couponService.checkCouponEligibility(testCoupon, {
    userId: user2.id,
    userEmail: user2.email,
    userIp: testIp1, // SAME IP as User 1!
    orderAmount: 1500
  });

  assert(
    'User 2 (different ID) on User 1 IP is REJECTED (Multi-accounting blocked)',
    t4.eligible === false && t4.reason === 'ALREADY_USED_BY_IP',
    `Result: ${JSON.stringify(t4)}`
  );

  // -------------------------------------------------------------
  // Test 5: Anonymous / Unregistered guest on SAME IP 1
  // (Must be REJECTED - IP address already claimed the offer!)
  // -------------------------------------------------------------
  const t5 = couponService.checkCouponEligibility(testCoupon, {
    userId: null,
    userEmail: 'unregistered_guest@gmail.com',
    userIp: testIp1, // SAME IP as User 1!
    orderAmount: 1500
  });

  assert(
    'Guest user on previously used IP is REJECTED (IP lock enforced)',
    t5.eligible === false && t5.reason === 'ALREADY_USED_BY_IP',
    `Result: ${JSON.stringify(t5)}`
  );

  // -------------------------------------------------------------
  // Test 6: User 2 from a FRESH, UNUSED IP 2
  // (Should be ELIGIBLE - User 2 has never used it and IP 2 is clean!)
  // -------------------------------------------------------------
  const t6 = couponService.checkCouponEligibility(testCoupon, {
    userId: user2.id,
    userEmail: user2.email,
    userIp: testIp2, // FRESH IP!
    orderAmount: 1500
  });

  assert(
    'User 2 from fresh IP 2 is ELIGIBLE for single redemption',
    t6.eligible === true && t6.discount_amount > 0,
    `Result: ${JSON.stringify(t6)}`
  );

  // User 2 completes order from IP 2
  couponService.recordCouponRedemption({
    couponCode: testCoupon,
    userId: user2.id,
    userEmail: user2.email,
    userIp: testIp2,
    orderId: 99902,
    orderNumber: 'RJFC-TEST-CPN-002',
    discountAmount: t6.discount_amount
  });

  // Now IP 2 is also consumed
  const t6_reuse = couponService.checkCouponEligibility(testCoupon, {
    userId: null,
    userEmail: 'random_person@example.com',
    userIp: testIp2,
    orderAmount: 1500
  });
  assert('Fresh attempt on IP 2 now blocked after User 2 redemption', t6_reuse.eligible === false && t6_reuse.reason === 'ALREADY_USED_BY_IP');

  // -------------------------------------------------------------
  // Test 7: Minimum spend condition
  // WELCOME500 requires >= 2999
  // -------------------------------------------------------------
  const t7 = couponService.checkCouponEligibility('WELCOME500', {
    userId: null,
    userEmail: 'clean_user@example.com',
    userIp: '203.0.113.250',
    orderAmount: 1000 // below 2999 threshold
  });
  assert(
    'Minimum spend threshold properly enforced',
    t7.eligible === false && t7.reason === 'MIN_ORDER_NOT_MET',
    `Result: ${JSON.stringify(t7)}`
  );

  // -------------------------------------------------------------
  // Test 8: Non-existent coupon rejection
  // -------------------------------------------------------------
  const t8 = couponService.checkCouponEligibility('NONEXISTENT_FAKE_COUPON', {
    userId: user1.id,
    userEmail: user1.email,
    userIp: '203.0.113.251',
    orderAmount: 5000
  });
  assert(
    'Invalid / non-existent coupon code rejected',
    t8.eligible === false && t8.message.includes('invalid or has expired'),
    `Result: ${JSON.stringify(t8)}`
  );

  // Teardown test fixtures
  db.prepare('DELETE FROM coupon_redemptions WHERE coupon_code = ?').run(testCoupon);
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run(testEmail1, testEmail2);
  console.log('[COUPON-TEST] Cleaned up temporary test fixtures.');

  console.log('\n============================================================');
  console.log(`COUPON ANTI-ABUSE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runCouponAntiAbuseTests().catch(err => {
  console.error('[COUPON-TEST] Unexpected error:', err);
  process.exit(1);
});
