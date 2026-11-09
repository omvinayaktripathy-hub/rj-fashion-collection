const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 1. orders.js
const ordersPath = path.join(root, 'public', 'js', 'orders.js');
let ordersJs = fs.readFileSync(ordersPath, 'utf8').replace(/\r\n/g, '\n');
ordersJs = ordersJs.replace(
  '  // 1. Try server API\n  try {\n    const res = await fetch(`${API_BASE}/orders`);',
  '  // 1. Try server API\n  if (!window.isStaticHosting) {\n    try {\n      const res = await fetch(`${API_BASE}/orders`);'
);
ordersJs = ordersJs.replace(
  '      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {\n        orders = data.orders;\n      }\n    }\n  } catch (_) {}',
  '      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {\n        orders = data.orders;\n      }\n    }\n    } catch (_) {}\n  }'
);
fs.writeFileSync(ordersPath, ordersJs, 'utf8');
console.log('orders.js guarded successfully!');

// 2. tryon.js (skip /api/tryon/settings on static hosting)
const tryonPath = path.join(root, 'public', 'js', 'tryon.js');
let tryonJs = fs.readFileSync(tryonPath, 'utf8').replace(/\r\n/g, '\n');
tryonJs = tryonJs.replace(
  '    try {\n      const res = await fetch(\'/api/tryon/settings\');',
  '    try {\n      if (window.isStaticHosting) throw new Error(\'static\');\n      const res = await fetch(\'/api/tryon/settings\');'
);
fs.writeFileSync(tryonPath, tryonJs, 'utf8');
console.log('tryon.js guarded successfully!');

// 3. account.js (skip /api/me and /api/orders on static hosting)
const accountPath = path.join(root, 'public', 'js', 'account.js');
let accountJs = fs.readFileSync(accountPath, 'utf8').replace(/\r\n/g, '\n');
accountJs = accountJs.replace(
  '      const res = await fetch(`${API_BASE}/me`);',
  '      if (window.isStaticHosting) throw new Error(\'static\');\n      const res = await fetch(`${API_BASE}/me`);'
);
accountJs = accountJs.replace(
  '      const res = await fetch(`${API_BASE}/orders`);',
  '      if (window.isStaticHosting) throw new Error(\'static\');\n      const res = await fetch(`${API_BASE}/orders`);'
);
fs.writeFileSync(accountPath, accountJs, 'utf8');
console.log('account.js guarded successfully!');

// 4. checkout.js (skip /api/me and /api/cart on static hosting)
const checkoutPath = path.join(root, 'public', 'js', 'checkout.js');
let checkoutJs = fs.readFileSync(checkoutPath, 'utf8').replace(/\r\n/g, '\n');
checkoutJs = checkoutJs.replace(
  '      const authRes = await fetch(\'/api/me\');',
  '      if (window.isStaticHosting) throw new Error(\'static\');\n      const authRes = await fetch(\'/api/me\');'
);
checkoutJs = checkoutJs.replace(
  '    const res = await fetch(\'/api/cart\');',
  '    if (window.isStaticHosting) throw new Error(\'static\');\n    const res = await fetch(\'/api/cart\');'
);
fs.writeFileSync(checkoutPath, checkoutJs, 'utf8');
console.log('checkout.js guarded successfully!');
