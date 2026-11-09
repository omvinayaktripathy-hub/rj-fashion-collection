const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 1. Update public/js/app.js
const appJsPath = path.join(root, 'public', 'js', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Inject isStaticHosting right after API_BASE
if (!appJs.includes('window.isStaticHosting')) {
  appJs = appJs.replace(
    "const API_BASE = '/api';",
    `const API_BASE = '/api';\nconst isStaticHosting = (typeof window !== 'undefined' && (window.location.hostname.endsWith('web.app') || window.location.hostname.endsWith('firebaseapp.com') || window.location.protocol === 'file:'));\nwindow.isStaticHosting = isStaticHosting;`
  );
}

// Fix getCsrfToken to skip calling /api/csrf-token on static hosting
appJs = appJs.replace(
  `  if (cachedCsrfToken) return cachedCsrfToken;\n  try {\n    const res = await originalFetch('/api/csrf-token');`,
  `  if (cachedCsrfToken) return cachedCsrfToken;\n  if (isStaticHosting) return '';\n  try {\n    const res = await originalFetch('/api/csrf-token');`
);

// Fix checkAuth to not delete localStorage user and skip /api/me on static hosting
const oldCheckAuthRegex = /async function checkAuth\(\) \{[\s\S]*?const local = localStorage\.getItem\('rjfc_user'\)/;
const newCheckAuthSnippet = `async function checkAuth() {
  ['token', 'session_token', 'auth_token', 'id_token', 'idToken', 'jwt', 'rjfc_token', 'rj_session_token'].forEach(k => {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {}
  });

  if (!isStaticHosting) {
    try {
      const res = await fetch(\`\${API_BASE}/me\`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUser = data.user;
          renderAuthNav(data.user);
          return;
        }
      }
    } catch (_) {}
  }

  // Fallback to Firebase client SDK and localStorage
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const fbUser = firebase.auth().currentUser;
      if (fbUser) {
        currentUser = {
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          uid: fbUser.uid
        };
        renderAuthNav(currentUser);
        return;
      }
    } catch (_) {}
  }

  const local = localStorage.getItem('rjfc_user')`;

appJs = appJs.replace(oldCheckAuthRegex, newCheckAuthSnippet);

// Fix updateCartCount to skip /api/cart on static hosting
appJs = appJs.replace(
  `  try {\n    const res = await fetch(\`\${API_BASE}/cart\`);`,
  `  try {\n    if (isStaticHosting) throw new Error('static');\n    const res = await fetch(\`\${API_BASE}/cart\`);`
);

// Fix updateWishlistCount to skip /api/wishlist on static hosting
appJs = appJs.replace(
  `  try {\n    const res = await fetch(\`\${API_BASE}/wishlist\`);`,
  `  try {\n    if (isStaticHosting) throw new Error('static');\n    const res = await fetch(\`\${API_BASE}/wishlist\`);`
);

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('1. Updated public/js/app.js successfully!');

// 2. Update public/js/wishlist.js line 47: if (items === null) -> if (!items || items.length === 0)
const wishlistJsPath = path.join(root, 'public', 'js', 'wishlist.js');
let wishlistJs = fs.readFileSync(wishlistJsPath, 'utf8');
wishlistJs = wishlistJs.replace('if (items === null) {', 'if (!items || items.length === 0) {');
fs.writeFileSync(wishlistJsPath, wishlistJs, 'utf8');
console.log('2. Updated public/js/wishlist.js successfully!');

// 3. Update public/categories.html to load /data/categories.json directly
const categoriesHtmlPath = path.join(root, 'public', 'categories.html');
let catHtml = fs.readFileSync(categoriesHtmlPath, 'utf8');
const oldCatSnippet = `      try {
        const res = await fetch(\`\${API_BASE}/categories\`);
        const data = await res.json();
        if (data.success && data.categories) {`;

const newCatSnippet = `      try {
        let categories = [];
        try {
          const res = await fetch('/data/categories.json');
          if (res.ok) {
            const data = await res.json();
            categories = Array.isArray(data) ? data : (data.categories || []);
          }
        } catch (_) {}
        if (categories.length > 0) {
          const data = { success: true, categories };`;

if (catHtml.includes(oldCatSnippet)) {
  catHtml = catHtml.replace(oldCatSnippet, newCatSnippet);
  fs.writeFileSync(categoriesHtmlPath, catHtml, 'utf8');
  console.log('3. Updated public/categories.html successfully!');
} else {
  console.log('Note: categories.html already updated or did not match exact snippet.');
}

// 4. Update public/sale.html to load from /data/products.json directly
const saleHtmlPath = path.join(root, 'public', 'sale.html');
let saleHtml = fs.readFileSync(saleHtmlPath, 'utf8');
const oldSaleSnippet = `        // Build query params
        let url = \`\${API_BASE}/products?offer=true&sort=discount&limit=50\`;
        if (minDiscount > 0) {
          url += \`&minDiscount=\${minDiscount}\`;
        }

        const res  = await fetch(url);
        const data = await res.json();

        spinner.style.display = 'none';

        if (!data.success || !data.products || data.products.length === 0) {
          empty.style.display = 'block';
          counter.innerHTML   = 'Showing <strong>0</strong> deals';
          return;
        }

        // Client-side discount range filtering for tab "40-50%" and "50-60%"
        let products = data.products;`;

const newSaleSnippet = `        let products = [];
        try {
          const res = await fetch('/data/products.json');
          if (res.ok) {
            const data = await res.json();
            const all = Array.isArray(data) ? data : (data.products || []);
            products = all.filter(p => (p.discount && p.discount > 0) || (p.original_price && p.original_price > p.price));
            products.forEach(p => {
              if (!p.discount && p.original_price && p.original_price > p.price) {
                p.discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
              }
            });
            products.sort((a, b) => (b.discount || 0) - (a.discount || 0));
          }
        } catch (_) {}

        spinner.style.display = 'none';`;

if (saleHtml.includes(oldSaleSnippet)) {
  saleHtml = saleHtml.replace(oldSaleSnippet, newSaleSnippet);
  fs.writeFileSync(saleHtmlPath, saleHtml, 'utf8');
  console.log('4. Updated public/sale.html successfully!');
} else {
  console.log('Note: sale.html already updated or did not match exact snippet.');
}

// 5. Update public/index.html to skip /api/campaign on static hosting
const indexHtmlPath = path.join(root, 'public', 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
if (!indexHtml.includes('if (window.isStaticHosting) return;')) {
  indexHtml = indexHtml.replace(
    'async function loadCampaignData() {',
    'async function loadCampaignData() {\n      if (window.isStaticHosting) return;'
  );
  fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
  console.log('5. Updated public/index.html successfully!');
}

// 6. Clean up firebase.json rewrites for static JSON files
const fbJsonPath = path.join(root, 'firebase.json');
let fbJson = JSON.parse(fs.readFileSync(fbJsonPath, 'utf8'));

// Filter out fake api rewrites that masked 404s with fake 200s
fbJson.hosting.rewrites = fbJson.hosting.rewrites.filter(r => {
  const s = r.source;
  return s !== '/api/csrf-token' &&
         s !== '/api/me' &&
         s !== '/api/campaign' &&
         s !== '/api/cart' &&
         s !== '/api/wishlist' &&
         s !== '/api/tryon/settings';
});

fs.writeFileSync(fbJsonPath, JSON.stringify(fbJson, null, 2), 'utf8');
console.log('6. Updated firebase.json rewrites cleanly!');

// 7. Delete fake static API JSON files
const fakeApiFiles = [
  path.join(root, 'public', 'api', 'me.json'),
  path.join(root, 'public', 'api', 'cart.json'),
  path.join(root, 'public', 'api', 'wishlist.json'),
  path.join(root, 'public', 'api', 'csrf-token.json'),
  path.join(root, 'public', 'api', 'campaign.json'),
  path.join(root, 'public', 'api', 'tryon', 'settings.json')
];

fakeApiFiles.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log(`Deleted fake static stub: ${path.basename(f)}`);
  }
});

// 8. Purge plain-text master passwords from public/js/admin.js and public/js/auth.js
const adminJsPath = path.join(root, 'public', 'js', 'admin.js');
let adminJs = fs.readFileSync(adminJsPath, 'utf8');
adminJs = adminJs.replace(
  "const isOwnerPass = password === 'OMvinayaktripathy' || password === 'OMvinayak@01092003';",
  "const isOwnerPass = false; // Plaintext password removed; authenticate via Firebase Auth or backend"
);
// Remove 2FA bypass regex
adminJs = adminJs.replace(/code === '123456' \|\| code === '010903' \|\| \/\^\\d\{6\}\$\/\.test\(code\)/g, "false /* 2FA bypass eliminated */");
fs.writeFileSync(adminJsPath, adminJs, 'utf8');
console.log('7. Purged plaintext passwords and 2FA bypass from public/js/admin.js!');

const authJsPath = path.join(root, 'public', 'js', 'auth.js');
let authJs = fs.readFileSync(authJsPath, 'utf8');
authJs = authJs.replace(
  "if (email === 'omvinayakwork@gmail.com' && (password === 'OMvinayak@01092003' || password === 'Omvinayak@01092003' || password === 'OMvinayaktripathy' || password === 'omvinayaktripathy')) {",
  "if (false && email === 'omvinayakwork@gmail.com') { // Plaintext password removed"
);
fs.writeFileSync(authJsPath, authJs, 'utf8');
console.log('8. Purged plaintext passwords from public/js/auth.js!');

console.log('\nALL REMEDIATIONS APPLIED CLEANLY!');
