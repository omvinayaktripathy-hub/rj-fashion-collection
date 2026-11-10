const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
process.env.PHONEPE_SIMULATE = 'true';

const phonepe = require('../services/phonepe');
const paymentRoutes = require('../routes/payment');

function findRouteHandler(router, method, routePath) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === routePath && (layer.route.methods[method] || layer.route.methods._all)) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  throw new Error(`Route ${method.toUpperCase()} ${routePath} not found`);
}

function invokeHandler(handler, req = {}) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ statusCode: this.statusCode, body }); },
      redirect(code, url) { resolve({ statusCode: code, redirectUrl: url }); }
    };
    Promise.resolve(handler(req, res, (err) => err ? reject(err) : resolve({ statusCode: res.statusCode }))).catch(reject);
  });
}

async function verify() {
  // 1. Test UPI_INTENT with targetApp
  const resPhonePe = await phonepe.initiatePayment({
    merchantTransactionId: 'MT_RJFC_TEST_INTENT_1',
    merchantUserId: 101,
    amountInPaise: 149900,
    redirectUrl: 'https://rj-fashion-collection.web.app/checkout.html?order_number=RJFC-TEST-1',
    callbackUrl: 'https://rj-fashion-collection.web.app/api/payment/phonepe/callback',
    paymentType: 'UPI_INTENT',
    targetApp: 'PHONEPE',
    deviceOS: 'ANDROID'
  });
  assert.strictEqual(resPhonePe.success, true);
  assert.strictEqual(resPhonePe.data.instrumentResponse.type, 'UPI_INTENT');
  assert.ok(resPhonePe.data.instrumentResponse.intentUrl.includes('MT_RJFC_TEST_INTENT_1'));
  console.log('✓ PASS: PhonePe UPI_INTENT initiation returns server intentUrl cleanly');

  // 2. Test PAY_PAGE with REDIRECT mode
  const resPayPage = await phonepe.initiatePayment({
    merchantTransactionId: 'MT_RJFC_TEST_PAGE_1',
    merchantUserId: 101,
    amountInPaise: 149900,
    redirectUrl: 'https://rj-fashion-collection.web.app/checkout.html?order_number=RJFC-TEST-1',
    callbackUrl: 'https://rj-fashion-collection.web.app/api/payment/phonepe/callback'
  });
  assert.strictEqual(resPayPage.success, true);
  assert.strictEqual(resPayPage.data.instrumentResponse.type, 'PAY_PAGE');
  assert.ok(resPayPage.data.instrumentResponse.redirectInfo.url);
  console.log('✓ PASS: PhonePe PAY_PAGE initiation returns redirectUrl cleanly');

  // 3. Test Express handlers directly in-memory
  const cfgHandler1 = findRouteHandler(paymentRoutes, 'get', '/config');
  const r1 = await invokeHandler(cfgHandler1);
  assert.strictEqual(r1.body.success, true);
  assert.strictEqual(r1.body.upiId, undefined, 'Raw upiId must NOT be exposed in /api/payment/config');
  assert.strictEqual(r1.body.phonepe.terminalId, undefined, 'terminalId must NOT be exposed publicly');
  assert.strictEqual(r1.body.phonepe.isLive, false, 'Sandbox env should report isLive=false');
  console.log('✓ PASS: /api/payment/config hides raw UPI/terminal IDs and reports isLive=false');

  const cfgHandler2 = findRouteHandler(paymentRoutes, 'get', '/phonepe/config');
  const r2 = await invokeHandler(cfgHandler2);
  assert.strictEqual(r2.body.success, true);
  assert.strictEqual(r2.body.upiId, undefined, 'Raw upiId must NOT be exposed in /api/payment/phonepe/config');
  assert.strictEqual(r2.body.isLive, false);
  console.log('✓ PASS: /api/payment/phonepe/config hides raw UPI IDs and exposes isLive flag');

  const redirHandler = findRouteHandler(paymentRoutes, 'get', '/phonepe/redirect');
  const r3 = await invokeHandler(redirHandler, { query: { order_number: 'RJFC-999', phonepe_txn: 'TXN-1' }, body: {} });
  assert.strictEqual(r3.statusCode, 302);
  assert.strictEqual(r3.redirectUrl, '/checkout.html?order_number=RJFC-999&phonepe_txn=TXN-1');
  console.log('✓ PASS: /api/payment/phonepe/redirect handles gateway return safely');

  // 4. Verify client JS syntax & absence of fake payment simulation
  const paymentHtml = fs.readFileSync(path.join(__dirname, '../public/payment.html'), 'utf8');
  assert.ok(!paymentHtml.includes('markOrderAsPaid()'), 'Fake timer confirmation must NEVER exist in payment.html');
  assert.ok(!paymentHtml.includes('renderDesktopQr()'), 'Fake checkerboard canvas QR must NOT exist');
  assert.ok(paymentHtml.includes('/api/payment/phonepe/status/'), 'Must poll real server status endpoint');
  assert.ok(paymentHtml.includes('/api/payment/phonepe/create-payment'), 'Must invoke real POST create-payment endpoint');
  console.log('✓ PASS: public/payment.html has no fake timer confirmations and uses real status polling');

  const checkoutJs = fs.readFileSync(path.join(__dirname, '../public/js/checkout.js'), 'utf8');
  assert.ok(checkoutJs.includes('async function handlePhonePeCallback('), 'handlePhonePeCallback must be defined');
  console.log('✓ PASS: public/js/checkout.js defines handlePhonePeCallback');

  console.log('\n🎉 All payment backend & client hardening checks PASSED!');
}

verify().catch((e) => {
  console.error('❌ Verification failed:', e);
  process.exit(1);
});
