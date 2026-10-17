// ===================================================================
// RJ FASHION COLLECTION - COMPREHENSIVE END-TO-END CHECKOUT TEST SUITE
// Tests all payment methods (COD, UPI, Razorpay), address resolution,
// stock deduction, cart clearing, coupon discounts, order tracking,
// customer cancellation & restock, and admin fulfillment.
// ===================================================================

const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch (_) {}

  return {
    statusCode: res.status,
    headers: res.headers,
    cookie: res.headers.get('set-cookie'),
    json,
    text
  };
}

async function runFullCheckoutTests() {
  console.log('\n====================================================================');
  console.log('🛍️  STARTING COMPREHENSIVE END-TO-END CHECKOUT VERIFICATION SUITE');
  console.log('====================================================================\n');

  // STEP 1: Verify Page Endpoints Availability
  console.log('--- Phase 1: Checkout Frontend & Asset Delivery ---');
  const cartPage = await request('GET', '/cart.html');
  assert.strictEqual(cartPage.statusCode, 200, 'cart.html must return 200');
  console.log('  ✓ PASS: /cart.html loaded cleanly (Status 200)');

  const deliveryPage = await request('GET', '/delivery');
  assert.strictEqual(deliveryPage.statusCode, 200, '/delivery alias must return 200');
  assert(deliveryPage.text.includes('DELIVERY ADDRESS'), 'Delivery page must contain delivery address header');
  console.log('  ✓ PASS: /delivery loaded cleanly with address steps (Status 200)');

  const checkoutPage = await request('GET', '/checkout.html');
  assert.strictEqual(checkoutPage.statusCode, 200, '/checkout.html must return 200');
  assert(checkoutPage.text.includes('PAYMENT OPTIONS'), 'Checkout page must contain payment options');
  console.log('  ✓ PASS: /checkout.html loaded cleanly with payment options (Status 200)');

  // STEP 2: Authentication & Security Boundaries
  console.log('\n--- Phase 2: Checkout Security & Authentication Guards ---');
  // Cart supports seamless guest browsing via sessionID
  const guestCart = await request('GET', '/api/cart');
  assert.strictEqual(guestCart.statusCode, 200, 'Guest cart operates cleanly without login');
  console.log('  ✓ PASS: GET /api/cart supports seamless guest shopping sessions (Status 200)');

  // Protected checkout endpoints require authentication
  const unauthOrder = await request('POST', '/api/orders', { paymentMethod: 'Cash on Delivery' });
  assert.strictEqual(unauthOrder.statusCode, 401, 'Unauthenticated order placement must be 401 Unauthorized');
  console.log('  ✓ PASS: POST /api/orders requires authentication (401)');

  const unauthAddr = await request('POST', '/api/addresses', { fullName: 'Test' });
  assert.strictEqual(unauthAddr.statusCode, 401, 'Unauthenticated address creation must be 401 Unauthorized');
  console.log('  ✓ PASS: POST /api/addresses requires authentication (401)');

  // Register a dedicated customer for checkout testing
  const customerEmail = `buyer_${Date.now()}@example.com`;
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Ananya Deshmukh',
    email: customerEmail,
    password: 'Password@2026',
    confirmPassword: 'Password@2026',
    phone: '9876543210'
  });
  assert(registerRes.json.success, 'Customer registration must succeed');
  const customerCookie = registerRes.cookie;
  console.log(`  ✓ PASS: Customer registered and authenticated (${customerEmail})`);

  // STEP 3: Address Book Management
  console.log('\n--- Phase 3: Address Management & Validation ---');
  const addrRes = await request('POST', '/api/addresses', {
    fullName: 'Ananya Deshmukh',
    phone: '9876543210',
    houseFlat: 'Villa 14, Royal Palm Meadows',
    street: 'Kalyani Nagar, Main Boulevard',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411006',
    isDefault: true
  }, { Cookie: customerCookie });

  assert(addrRes.json.success, 'Address creation must succeed');
  const savedAddressId = addrRes.json.address.id;
  assert(savedAddressId, 'Address must return an ID');
  console.log(`  ✓ PASS: Delivery address saved with ID: ${savedAddressId}`);

  // Fetch saved addresses
  const listAddrRes = await request('GET', '/api/addresses', null, { Cookie: customerCookie });
  assert(listAddrRes.json.success && listAddrRes.json.addresses.length >= 1, 'Address list must return saved address');
  const activeAddress = listAddrRes.json.addresses[0];
  assert.strictEqual(activeAddress.city, 'Pune');
  console.log(`  ✓ PASS: Confirmed delivery address retrieved: ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.pin_code}`);

  // STEP 4: Catalog & Cart Operations
  console.log('\n--- Phase 4: Cart Operations & Inventory Availability ---');
  const productsRes = await request('GET', '/api/products');
  assert(productsRes.json.success && productsRes.json.products.length > 0, 'Products catalog must have items');
  const testProduct = productsRes.json.products[0];
  const initialStock = testProduct.stock;
  console.log(`  ✓ Selected test product: "${testProduct.name}" (Price: ₹${testProduct.price}, Current Stock: ${initialStock})`);

  // Add product to cart with custom size
  const addCartRes = await request('POST', '/api/cart', {
    productId: testProduct.id,
    quantity: 1,
    size: 'Saree with Unstitched Blouse'
  }, { Cookie: customerCookie });
  assert(addCartRes.json.success, 'Add to cart must succeed');

  // Verify cart item
  const getCartRes = await request('GET', '/api/cart', null, { Cookie: customerCookie });
  assert(getCartRes.json.items.length === 1, 'Cart must contain 1 item');
  assert.strictEqual(getCartRes.json.items[0].product_id, testProduct.id);
  assert.strictEqual(getCartRes.json.items[0].size, 'Saree with Unstitched Blouse');
  console.log(`  ✓ PASS: Item added to cart with custom size: "${getCartRes.json.items[0].size}"`);

  // STEP 5: Full Checkout Scenario 1 — Cash on Delivery (COD)
  console.log('\n--- Phase 5: Checkout Flow 1 — Cash on Delivery (COD) ---');
  const codOrderPayload = {
    addressId: savedAddressId,
    paymentMethod: 'Cash on Delivery',
    notes: 'Please call before delivery'
  };

  const codOrderRes = await request('POST', '/api/orders', codOrderPayload, { Cookie: customerCookie });
  assert.strictEqual(codOrderRes.statusCode, 201, 'Order placement must return 201 Created');
  assert(codOrderRes.json.success, 'Order must succeed');
  assert(codOrderRes.json.orderNumber.startsWith('RJFC-'), `Order number must be formatted: ${codOrderRes.json.orderNumber}`);
  const codOrderNumber = codOrderRes.json.orderNumber;
  const codOrderId = codOrderRes.json.orderId;
  console.log(`  ✓ PASS: Order placed successfully via Cash on Delivery! Order: ${codOrderNumber} (ID: ${codOrderId})`);

  // Verify cart is now empty
  const cartAfterCod = await request('GET', '/api/cart', null, { Cookie: customerCookie });
  assert.strictEqual(cartAfterCod.json.items.length, 0, 'Cart must be completely cleared after checkout');
  console.log('  ✓ PASS: Customer cart automatically cleared after order placement');

  // Verify stock is decremented in database
  const productAfterCod = await request('GET', `/api/products/${testProduct.id}`);
  assert.strictEqual(productAfterCod.json.product.stock, initialStock - 1, 'Inventory stock must decrement by 1');
  console.log(`  ✓ PASS: Inventory stock correctly decremented from ${initialStock} to ${productAfterCod.json.product.stock}`);

  // Verify order details in customer order history
  const myOrdersRes = await request('GET', '/api/orders', null, { Cookie: customerCookie });
  assert(myOrdersRes.json.orders.length >= 1, 'Order must appear in customer order history');
  const retrievedCodOrder = myOrdersRes.json.orders.find(o => o.order_number === codOrderNumber);
  assert(retrievedCodOrder, 'Placed order must exist in customer orders');
  assert.strictEqual(retrievedCodOrder.status, 'Confirmed');
  assert.strictEqual(retrievedCodOrder.payment_method, 'Cash on Delivery');
  assert.strictEqual(retrievedCodOrder.payment_status, 'Pending');
  console.log(`  ✓ PASS: Order history verified: Status="${retrievedCodOrder.status}", Payment="${retrievedCodOrder.payment_method}" (Payment Status="${retrievedCodOrder.payment_status}")`);

  // STEP 6: Full Checkout Scenario 2 — UPI / Online with Promo Coupon Discount
  console.log('\n--- Phase 6: Checkout Flow 2 — Online / UPI with Promo Coupon Discount ---');
  // Add item back to cart
  await request('POST', '/api/cart', {
    productId: testProduct.id,
    quantity: 1,
    size: 'Standard'
  }, { Cookie: customerCookie });

  // Place order with coupon ROYAL10 (10% discount) and UPI payment method
  const upiOrderPayload = {
    addressId: savedAddressId,
    paymentMethod: 'UPI / QR Code',
    coupon: 'ROYAL10',
    notes: 'Fast delivery requested'
  };

  const upiOrderRes = await request('POST', '/api/orders', upiOrderPayload, { Cookie: customerCookie });
  assert.strictEqual(upiOrderRes.statusCode, 201, 'UPI Order must return 201 Created');
  assert(upiOrderRes.json.success, 'UPI Order must succeed');
  const upiOrderNumber = upiOrderRes.json.orderNumber;
  const upiOrderId = upiOrderRes.json.orderId;

  // Retrieve single order details to inspect discount calculation
  const singleOrderRes = await request('GET', `/api/orders/${upiOrderNumber}`, null, { Cookie: customerCookie });
  assert(singleOrderRes.json.success, 'Get single order must succeed');
  const orderDetails = singleOrderRes.json.order;
  assert.strictEqual(orderDetails.payment_method, 'UPI / QR Code');
  assert.strictEqual(orderDetails.payment_status, 'Paid');
  const expectedDiscount = Math.round(testProduct.price * 0.10);
  assert.strictEqual(orderDetails.discount, expectedDiscount, `10% promo discount must be applied (Expected: ₹${expectedDiscount}, Actual: ₹${orderDetails.discount})`);
  console.log(`  ✓ PASS: Promo code "ROYAL10" applied server-side! Subtotal: ₹${orderDetails.subtotal}, Discount: -₹${orderDetails.discount}, Total: ₹${orderDetails.total}`);
  console.log(`  ✓ PASS: UPI Payment status automatically set to "${orderDetails.payment_status}"`);

  // STEP 7: Payment Gateway API (Razorpay Config & Orders)
  console.log('\n--- Phase 7: Payment Gateway Configuration & Razorpay Handlers ---');
  const payConfigRes = await request('GET', '/api/payment/config');
  assert(payConfigRes.json.success, 'Payment config must return 200');
  assert(payConfigRes.json.upiId, 'Payment config must contain merchant UPI ID');
  assert.strictEqual(payConfigRes.json.merchantName, 'RJ FASHION COLLECTION');
  console.log(`  ✓ PASS: Payment config verified: Merchant="${payConfigRes.json.merchantName}", UPI="${payConfigRes.json.upiId}"`);

  // Create Razorpay payment order
  const razorpayOrderRes = await request('POST', '/api/payment/create-order', {
    amount: 1499
  }, { Cookie: customerCookie });
  assert(razorpayOrderRes.json.success, 'Razorpay order creation must succeed');
  console.log(`  ✓ PASS: Razorpay payment order created with ID: ${razorpayOrderRes.json.orderId || razorpayOrderRes.json.id || 'MOCK_RAZORPAY_ID'}`);

  // Test invalid payment signature rejection
  const invalidVerifyRes = await request('POST', '/api/payment/verify', {
    razorpay_order_id: 'order_test_123',
    razorpay_payment_id: 'pay_test_456',
    razorpay_signature: 'invalid_forged_signature_token'
  }, { Cookie: customerCookie });
  assert.strictEqual(invalidVerifyRes.statusCode, 400, 'Forged signature must be rejected with 400 Bad Request');
  console.log('  ✓ PASS: Tampered/forged payment signatures strictly rejected (HTTP 400)');

  // STEP 8: Customer Order Cancellation & Inventory Restock
  console.log('\n--- Phase 8: Customer Order Cancellation & Inventory Restock ---');
  const stockBeforeCancel = (await request('GET', `/api/products/${testProduct.id}`)).json.product.stock;
  
  const cancelRes = await request('POST', `/api/orders/${codOrderId}/cancel`, {
    reason: 'Ordered wrong color variant'
  }, { Cookie: customerCookie });
  assert(cancelRes.json.success, 'Cancellation must succeed');
  console.log(`  ✓ PASS: Order ${codOrderNumber} cancelled successfully`);

  // Verify stock is restored to original quantity
  const stockAfterCancel = (await request('GET', `/api/products/${testProduct.id}`)).json.product.stock;
  assert.strictEqual(stockAfterCancel, stockBeforeCancel + 1, 'Product stock must be restored by +1');
  console.log(`  ✓ PASS: Inventory stock restored from ${stockBeforeCancel} to ${stockAfterCancel}`);

  // STEP 9: Admin Order Fulfillment & Status Pipeline
  console.log('\n--- Phase 9: Admin Fulfillment Pipeline & Audit Trail ---');
  const adminLoginRes = await request('POST', '/api/auth/admin-login', {
    email: 'omvinayakwork@gmail.com',
    password: 'OMvinayak@01092003'
  });
  assert(adminLoginRes.json.success && adminLoginRes.json.user.role === 'admin', 'Super admin login must succeed');
  const adminCookie = adminLoginRes.cookie;

  // Retrieve admin orders list
  const adminOrdersRes = await request('GET', '/api/admin/orders', null, { Cookie: adminCookie });
  assert(adminOrdersRes.json.success && adminOrdersRes.json.orders.length > 0, 'Admin can view all orders');
  console.log(`  ✓ PASS: Admin retrieved all store orders (Count: ${adminOrdersRes.json.orders.length})`);

  // Update UPI order through lifecycle: Confirmed -> Packed -> Shipped -> Delivered
  const statuses = ['Packed', 'Shipped', 'Delivered'];
  for (const newStatus of statuses) {
    const updateRes = await request('PATCH', `/api/admin/orders/${upiOrderId}`, {
      status: newStatus
    }, { Cookie: adminCookie });
    assert(updateRes.json.success, `Order status update to "${newStatus}" must succeed`);
    
    // Customer checks their order to verify realtime sync
    const checkCustOrder = await request('GET', `/api/orders/${upiOrderNumber}`, null, { Cookie: customerCookie });
    assert.strictEqual(checkCustOrder.json.order.status, newStatus, `Customer must see updated status "${newStatus}"`);
    console.log(`  ✓ PASS: Order status transitioned to "${newStatus}" (Customer & Admin confirmed)`);
  }

  // Verify tamper-evident audit logs record all actions
  const auditLogsRes = await request('GET', '/api/admin/audit-logs', null, { Cookie: adminCookie });
  assert(auditLogsRes.json.success && auditLogsRes.json.logs.length > 0, 'Audit logs must contain records');
  const statusAuditLog = auditLogsRes.json.logs.find(l => l.action === 'UPDATE_ORDER_STATUS');
  assert(statusAuditLog, 'Order status updates must be recorded in admin audit logs');
  console.log(`  ✓ PASS: Admin audit trail recorded status change by ${statusAuditLog.admin_email}`);

  console.log('\n====================================================================');
  console.log('🎉 100% CHECKOUT SUCCESS: ALL 9 TEST PHASES PASSED FLAWLESSLY!');
  console.log('====================================================================\n');
}

runFullCheckoutTests().catch(err => {
  console.error('\n❌ Checkout Test Suite Failed:', err);
  process.exit(1);
});
