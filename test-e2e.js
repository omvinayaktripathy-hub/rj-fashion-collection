// Comprehensive End-to-End Automated Test Suite for RJ Fashion Collection

const http = require('node:http');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqBody = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}

        const setCookie = res.headers['set-cookie'];
        let cookie = null;
        if (setCookie) {
          cookie = setCookie.map(c => c.split(';')[0]).join('; ');
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
          cookie
        });
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting RJ Fashion Collection Full-Stack Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Static HTML Pages
    console.log('--- Testing Public HTML Pages & Forbidden Section Checks ---');
    const indexRes = await request('GET', '/');
    assert(indexRes.statusCode === 200, 'Homepage loads successfully (Status 200)');
    assert(indexRes.data.includes('RJ Fashion Collection'), 'Homepage has correct brand title');
    assert(!indexRes.data.includes('Admin Login'), 'Homepage has NO public Admin Login link');
    assert(!indexRes.data.includes('Admin Dashboard'), 'Homepage has NO public Admin Dashboard link');
    assert(!indexRes.data.includes('10% off your first order'), 'Homepage has NO "10% off your first order" text');
    assert(!indexRes.data.includes('newsletter'), 'Homepage has NO newsletter section');
    assert(!indexRes.data.includes('Returns'), 'Homepage has NO Returns section');

    const shopRes = await request('GET', '/shop.html');
    assert(shopRes.statusCode === 200, 'Shop page loads (Status 200)');

    const cartPageRes = await request('GET', '/cart.html');
    assert(cartPageRes.statusCode === 200, 'Cart page loads (Status 200)');

    const wishlistPageRes = await request('GET', '/wishlist.html');
    assert(wishlistPageRes.statusCode === 200, 'Wishlist page loads (Status 200)');

    // 2. Categories API
    console.log('\n--- Testing Categories API ---');
    const catRes = await request('GET', '/api/categories');
    assert(catRes.statusCode === 200 && catRes.json.success, 'Categories API returns success');
    assert(catRes.json.categories.length >= 7, `Categories count is ${catRes.json.categories.length}`);
    const hasSarees = catRes.json.categories.some(c => c.name.toLowerCase().includes('saree'));
    assert(hasSarees, 'Categories contains Sarees');

    // 3. Products API: Catalog, Search, Filtering
    console.log('\n--- Testing Products API (Catalog, Search, Filtering) ---');
    const prodsRes = await request('GET', '/api/products');
    assert(prodsRes.statusCode === 200 && prodsRes.json.success, 'Products API returns success');
    assert(prodsRes.json.products.length > 0, `Products loaded: ${prodsRes.json.products.length} items`);

    const searchRes = await request('GET', '/api/products?search=saree');
    assert(searchRes.json.products.length > 0, 'Database search for "saree" finds matching products');

    const singleProdId = prodsRes.json.products[0].id;
    const detailRes = await request('GET', `/api/products/${singleProdId}`);
    assert(detailRes.statusCode === 200 && detailRes.json.product.name, `Product detail API works for ID #${singleProdId} (${detailRes.json.product.name})`);

    // 4. Customer Registration & Login
    console.log('\n--- Testing Customer Authentication ---');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Anjali Sharma',
      email: testEmail,
      phone: '+91 98765 00000',
      password: 'Password@123',
      confirmPassword: 'Password@123'
    });
    assert(regRes.statusCode === 201 && regRes.json.success, `Customer registration succeeded for ${testEmail}`);
    let customerCookie = regRes.cookie;

    // Login with registered customer
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'Password@123'
    }, { Cookie: customerCookie });
    assert(loginRes.statusCode === 200 && loginRes.json.user.role === 'customer', 'Customer login verified');
    customerCookie = loginRes.cookie || customerCookie;

    const meRes = await request('GET', '/api/me', null, { Cookie: customerCookie });
    assert(meRes.json.user && meRes.json.user.email === testEmail, 'GET /api/me returns logged-in customer');

    // 5. Shopping Cart Operations
    console.log('\n--- Testing Shopping Cart Operations ---');
    const addToCartRes = await request('POST', '/api/cart', {
      productId: singleProdId,
      quantity: 2,
      size: 'Free Size'
    }, { Cookie: customerCookie });
    assert(addToCartRes.statusCode === 200 && addToCartRes.json.success, 'Added product to cart');

    const getCartRes = await request('GET', '/api/cart', null, { Cookie: customerCookie });
    assert(getCartRes.json.items.length === 1, 'Cart contains 1 line item');
    assert(getCartRes.json.itemCount === 2, 'Cart item quantity is 2');
    const cartItemId = getCartRes.json.items[0].id;

    // Update quantity
    const updateQtyRes = await request('PUT', `/api/cart/${cartItemId}`, { quantity: 1 }, { Cookie: customerCookie });
    assert(updateQtyRes.statusCode === 200 && updateQtyRes.json.success, 'Cart quantity updated to 1');

    // 6. Wishlist Operations
    console.log('\n--- Testing Wishlist Operations ---');
    const addWishRes = await request('POST', '/api/wishlist', { productId: singleProdId }, { Cookie: customerCookie });
    assert(addWishRes.json.success, 'Product added to customer wishlist');

    const getWishRes = await request('GET', '/api/wishlist', null, { Cookie: customerCookie });
    assert(getWishRes.json.items.length >= 1, 'Wishlist contains items');

    // 7. Checkout & Order Placement
    console.log('\n--- Testing Checkout & Order Placement ---');
    const placeOrderRes = await request('POST', '/api/orders', {
      newAddress: {
        fullName: 'Anjali Sharma',
        phone: '+91 98765 00000',
        houseFlat: 'Flat 101, Silk Residency',
        street: 'Commercial Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560001',
        saveAddress: true
      },
      paymentMethod: 'Cash on Delivery',
      notes: 'Please deliver in evening'
    }, { Cookie: customerCookie });

    assert(placeOrderRes.statusCode === 201 && placeOrderRes.json.success, 'Order placed successfully');
    assert(placeOrderRes.json.orderNumber.startsWith('RJFC-'), `Order ID format is correct: ${placeOrderRes.json.orderNumber}`);

    // Verify order shows in customer orders list
    const myOrdersRes = await request('GET', '/api/orders', null, { Cookie: customerCookie });
    assert(myOrdersRes.json.orders.length >= 1, 'Order appears in customer My Orders');
    const createdOrder = myOrdersRes.json.orders[0];
    assert(createdOrder.status === 'Confirmed', 'Order status is Confirmed');

    // Verify cart is now empty after checkout
    const cartAfterOrder = await request('GET', '/api/cart', null, { Cookie: customerCookie });
    assert(cartAfterOrder.json.items.length === 0, 'Cart cleared after order placement');

    // 8. Admin Security & Forbidden Access Check
    console.log('\n--- Testing Admin Security & Authorization ---');
    // Normal customer tries to access admin API -> should get 403 Forbidden!
    const unauthAdminApi = await request('GET', '/api/admin/stats', null, { Cookie: customerCookie });
    assert(unauthAdminApi.statusCode === 403, 'Normal customer receives 403 Forbidden on /api/admin/stats');

    // 9. Admin Authentication & Dashboard
    console.log('\n--- Testing Admin Authentication & Management ---');
    const adminLoginRes = await request('POST', '/api/auth/admin-login', {
      email: 'admin@rjfashion.com',
      password: 'Admin@123'
    });
    assert(adminLoginRes.statusCode === 200 && adminLoginRes.json.user.role === 'admin', 'Super Admin authentication succeeded');
    const adminCookie = adminLoginRes.cookie;

    // Admin Stats
    const adminStatsRes = await request('GET', '/api/admin/stats', null, { Cookie: adminCookie });
    assert(adminStatsRes.statusCode === 200 && adminStatsRes.json.stats.totalOrders >= 1, `Admin dashboard stats working (Total Orders: ${adminStatsRes.json.stats.totalOrders}, Total Sales: ₹${adminStatsRes.json.stats.totalSales})`);

    // Admin Order Status Update
    const updateStatusRes = await request('PATCH', `/api/admin/orders/${createdOrder.id}`, {
      status: 'Shipped'
    }, { Cookie: adminCookie });
    assert(updateStatusRes.statusCode === 200 && updateStatusRes.json.success, 'Admin successfully updated order status to "Shipped"');

    // Verify customer sees new status "Shipped"
    const customerOrderCheck = await request('GET', `/api/orders/${createdOrder.id}`, null, { Cookie: customerCookie });
    assert(customerOrderCheck.json.order.status === 'Shipped', 'Customer immediately sees updated status "Shipped"');

    // Admin Customer List
    const adminCustRes = await request('GET', '/api/admin/customers', null, { Cookie: adminCookie });
    assert(adminCustRes.json.customers.length >= 1, `Admin can view registered customers (Count: ${adminCustRes.json.customers.length})`);
    assert(adminCustRes.json.customers[0].password_hash === undefined, 'Customer password hashes are NEVER exposed to admin API');

    // Admin Product Management: Add a test product
    const newProdRes = await request('POST', '/api/admin/products', {
      name: 'Bridal Zari Tissue Saree Test',
      category_id: 1,
      price: 2999,
      original_price: 5999,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80',
      brand: 'RJ Royal',
      description: 'Exclusive tissue silk saree with golden border'
    }, { Cookie: adminCookie });
    assert(newProdRes.statusCode === 201 && newProdRes.json.success, 'Admin created new product in database');
    const newProdId = newProdRes.json.id;

    // Admin Product Management: Update Stock
    const stockUpdateRes = await request('PATCH', `/api/admin/products/${newProdId}/stock`, {
      stock: 25
    }, { Cookie: adminCookie });
    assert(stockUpdateRes.json.success, 'Admin updated product stock');

    // Admin Product Management: Delete Product
    const deleteProdRes = await request('DELETE', `/api/admin/products/${newProdId}`, null, { Cookie: adminCookie });
    assert(deleteProdRes.json.success, 'Admin deleted test product');

    console.log('\n========================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================================\n');

    if (failed === 0) {
      console.log('🎉 ALL FULL-STACK E-COMMERCE TESTS PASSED WITH 100% SUCCESS!');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
