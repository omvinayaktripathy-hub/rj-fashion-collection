// Test delivery page and address flow
const assert = require('assert');

async function testDelivery() {
  console.log('Testing Dedicated Delivery Page & Flow...');

  // 1. Check /delivery endpoint
  const resDeliv = await fetch('http://localhost:3000/delivery');
  assert.strictEqual(resDeliv.status, 200, '/delivery must return 200');
  const html = await resDeliv.text();
  assert(html.includes('DELIVERY ADDRESS'), 'delivery page must contain address title');
  assert(html.includes('fk-new-address-form-box'), 'delivery page must contain new address form');
  console.log('  ✓ PASS: /delivery loads cleanly with Flipkart accordion steps');

  // 2. Check /checkout.html endpoint
  const resCheckout = await fetch('http://localhost:3000/checkout.html');
  assert.strictEqual(resCheckout.status, 200, '/checkout.html must return 200');
  const checkoutHtml = await resCheckout.text();
  assert(checkoutHtml.includes('DELIVERY ADDRESS'), 'checkout page must contain DELIVERY ADDRESS');
  assert(checkoutHtml.includes('PAYMENT OPTIONS'), 'checkout page must contain PAYMENT OPTIONS');
  console.log('  ✓ PASS: /checkout.html loads with Flipkart accordion and PAYMENT OPTIONS');

  // 3. Register a test user and test address management
  const testEmail = `delivuser_${Date.now()}@example.com`;
  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Delivery Test User', email: testEmail, password: 'Password@123', confirmPassword: 'Password@123', phone: '9876543210' })
  });
  const regCookie = regRes.headers.get('set-cookie');
  const regData = await regRes.json();
  assert(regData.success, 'Registration must succeed');

  // 4. Save new address via API (mimicking delivery.html submission)
  const addrRes = await fetch('http://localhost:3000/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': regCookie },
    body: JSON.stringify({
      fullName: 'Pooja Sharma',
      phone: '9876543210',
      houseFlat: 'Penthouse 1204, Royal Crest',
      street: 'Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
      isDefault: true
    })
  });
  const addrData = await addrRes.json();
  assert(addrData.success, 'Address creation must succeed');
  assert(addrData.address.id, 'Address must return an ID');
  console.log('  ✓ PASS: Address created successfully via API with ID:', addrData.address.id);

  // 5. Get saved addresses
  const listRes = await fetch('http://localhost:3000/api/addresses', {
    headers: { 'Cookie': regCookie }
  });
  const listData = await listRes.json();
  assert(listData.success, 'List addresses must succeed');
  assert(listData.addresses.length >= 1, 'Should have at least 1 address');
  assert.strictEqual(listData.addresses[0].full_name, 'Pooja Sharma');
  console.log('  ✓ PASS: Saved address retrieved with correct customer details');

  console.log('\n🎉 ALL DELIVERY FLOW TESTS PASSED!');
}

testDelivery().catch(err => {
  console.error('Delivery test failed:', err);
  process.exit(1);
});
