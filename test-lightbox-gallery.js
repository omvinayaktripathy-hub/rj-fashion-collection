const http = require('http');
const assert = require('assert');
const fs = require('fs');

console.log('🧪 Testing Multi-Angle Gallery & Big Lightbox System...');

// 1. Verify products.json data has multi-angle images
const rawProducts = fs.readFileSync('public/data/products.json', 'utf8');
const productsData = JSON.parse(rawProducts);
const products = productsData.products || productsData;

assert(Array.isArray(products) && products.length > 0, 'Products list must exist');
console.log(`  ✓ PASS: Found ${products.length} products in catalog`);

let productsWithAngles = 0;
for (const p of products) {
  let addImgs = p.additional_images;
  if (typeof addImgs === 'string') {
    try { addImgs = JSON.parse(addImgs); } catch(_) { addImgs = []; }
  }
  if (Array.isArray(addImgs) && addImgs.length > 0) {
    productsWithAngles++;
  }
}

assert.strictEqual(productsWithAngles, products.length, 'All products must have multi-angle additional_images');
console.log(`  ✓ PASS: All ${productsWithAngles} products have high-resolution multi-angle view images populated`);

// 2. Verify product.html has the Lightbox modal, CSS classes, and zoom pill
const html = fs.readFileSync('public/product.html', 'utf8');
assert(html.includes('id="rjfc-lightbox-modal"'), 'product.html must include id="rjfc-lightbox-modal"');
assert(html.includes('.rjfc-lightbox-modal'), 'product.html must include .rjfc-lightbox-modal CSS');
assert(html.includes('.fk-expand-pill'), 'product.html must include .fk-expand-pill CSS');
assert(html.includes('.fk-angle-switcher-row'), 'product.html must include .fk-angle-switcher-row CSS');
assert(html.includes('.fk-thumb-angle-tag'), 'product.html must include .fk-thumb-angle-tag CSS');
assert(html.includes('id="rjfc-lightbox-viewport"'), 'product.html must include #rjfc-lightbox-viewport');
assert(html.includes('id="rjfc-lightbox-pills"'), 'product.html must include #rjfc-lightbox-pills');
assert(html.includes('id="rjfc-lightbox-filmstrip"'), 'product.html must include #rjfc-lightbox-filmstrip');
console.log('  ✓ PASS: product.html contains complete Lightbox modal markup and multi-angle styles');

// 3. Verify product-detail.js has all controller functions
const js = fs.readFileSync('public/js/product-detail.js', 'utf8');
assert(js.includes('function switchClothingAngle('), 'product-detail.js must have switchClothingAngle');
assert(js.includes('function openProductLightbox('), 'product-detail.js must have openProductLightbox');
assert(js.includes('function closeProductLightbox('), 'product-detail.js must have closeProductLightbox');
assert(js.includes('function lightboxNext('), 'product-detail.js must have lightboxNext');
assert(js.includes('function lightboxPrev('), 'product-detail.js must have lightboxPrev');
assert(js.includes('function toggleLightboxZoom('), 'product-detail.js must have toggleLightboxZoom');
assert(js.includes('ANGLE_CONFIG'), 'product-detail.js must define ANGLE_CONFIG for clothes angles');
console.log('  ✓ PASS: product-detail.js has all angle switching, zoom, and lightbox navigation functions');

// 4. Test live server serving product.html and products.json
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/product.html?id=20',
  method: 'GET'
};

const req = http.request(options, (res) => {
  assert.strictEqual(res.statusCode, 200, 'Server should respond with 200 for product.html');
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    assert(data.includes('rjfc-lightbox-modal'), 'Live response must contain rjfc-lightbox-modal');
    console.log('  ✓ PASS: Live server serves product.html with multi-angle lightbox successfully');
    console.log('\n🎉 ALL MULTI-ANGLE LIGHTBOX TESTS PASSED WITH 100% SUCCESS!');
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
  process.exit(1);
});

req.end();
