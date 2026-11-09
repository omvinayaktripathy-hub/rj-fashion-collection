const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');

// 1. updateCartCount
const oldCartFn = `async function updateCartCount() {
  let count = 0;
  try {
    const res = await fetch(\`\${API_BASE}/cart\`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && typeof data.itemCount === 'number') {
        count = data.itemCount;
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    try {
      const local = getLocalCartSafe();
      count = local.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    } catch(e) {}
  }`;

const newCartFn = `async function updateCartCount() {
  let count = 0;
  if (!isStaticHosting) {
    try {
      const res = await fetch(\`\${API_BASE}/cart\`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && typeof data.itemCount === 'number') {
          count = data.itemCount;
        }
      }
    } catch (_) {}
  }

  if (count === 0) {
    try {
      const local = getLocalCartSafe();
      count = local.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    } catch (_) {}
  }`;

if (appJs.includes(oldCartFn)) {
  appJs = appJs.replace(oldCartFn, newCartFn);
  console.log('updateCartCount patched!');
} else {
  console.error('oldCartFn not found');
}

// 2. updateWishlistCount
const oldWishFn = `async function updateWishlistCount() {
  let count = 0;
  try {
    const res = await fetch(\`\${API_BASE}/wishlist\`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) count = data.count || 0;
    } else {
      throw new Error();
    }
  } catch (_) {
    try {
      const local = getLocalWishlistSafe();
      count = local.length;
    } catch (_) {}
  }`;

const newWishFn = `async function updateWishlistCount() {
  let count = 0;
  if (!isStaticHosting) {
    try {
      const res = await fetch(\`\${API_BASE}/wishlist\`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) count = data.count || 0;
      }
    } catch (_) {}
  }

  if (count === 0) {
    try {
      const local = getLocalWishlistSafe();
      count = local.length;
    } catch (_) {}
  }`;

if (appJs.includes(oldWishFn)) {
  appJs = appJs.replace(oldWishFn, newWishFn);
  console.log('updateWishlistCount patched!');
} else {
  console.error('oldWishFn not found');
}

// Also in delivery.js: line 21 authRes /api/me and line 70 /api/cart
const deliveryJsPath = path.join(__dirname, '..', 'public', 'js', 'delivery.js');
let delJs = fs.readFileSync(deliveryJsPath, 'utf8').replace(/\r\n/g, '\n');
delJs = delJs.replace(
  '      const authRes = await fetch(`${API_BASE}/me`);',
  '      if (window.isStaticHosting) throw new Error(\'static\');\n      const authRes = await fetch(`${API_BASE}/me`);'
);
delJs = delJs.replace(
  '    const res = await fetch(`${API_BASE}/cart`);',
  '    if (window.isStaticHosting) throw new Error(\'static\');\n    const res = await fetch(`${API_BASE}/cart`);'
);
fs.writeFileSync(deliveryJsPath, delJs, 'utf8');
console.log('delivery.js patched!');

// Also in admin.js: line 67 and 123 fetch(/api/me)
const adminJsPath = path.join(__dirname, '..', 'public', 'js', 'admin.js');
let admJs = fs.readFileSync(adminJsPath, 'utf8').replace(/\r\n/g, '\n');
admJs = admJs.replace(
  '    const res = await fetch(`${API_BASE}/me`);',
  '    if (window.isStaticHosting) throw new Error(\'static\');\n    const res = await fetch(`${API_BASE}/me`);'
);
fs.writeFileSync(adminJsPath, admJs, 'utf8');
console.log('admin.js patched!');

// Also in cart.js: line 152 fetch(/api/cart)
const cartJsPath = path.join(__dirname, '..', 'public', 'js', 'cart.js');
let cartJs = fs.readFileSync(cartJsPath, 'utf8').replace(/\r\n/g, '\n');
cartJs = cartJs.replace(
  '      const res = await fetch(`${API_BASE}/cart`);',
  '      if (window.isStaticHosting) throw new Error(\'static\');\n      const res = await fetch(`${API_BASE}/cart`);'
);
fs.writeFileSync(cartJsPath, cartJs, 'utf8');
console.log('cart.js patched!');

// Also in wishlist.js: line 37 fetch(/api/wishlist)
const wishJsPath = path.join(__dirname, '..', 'public', 'js', 'wishlist.js');
let wishJs = fs.readFileSync(wishJsPath, 'utf8').replace(/\r\n/g, '\n');
wishJs = wishJs.replace(
  '    const res = await fetch(`${API_BASE}/wishlist`);',
  '    if (window.isStaticHosting) throw new Error(\'static\');\n    const res = await fetch(`${API_BASE}/wishlist`);'
);
fs.writeFileSync(wishJsPath, wishJs, 'utf8');
console.log('wishlist.js patched!');

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('app.js saved successfully!');
