const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const targetAnnText = '<span>COMPLIMENTARY EXPRESS SHIPPING</span> ON ORDERS ABOVE ₹999 | 100% HANDCRAFTED INDIAN HERITAGE';

// Storefront pages where top-bar should match the luxury announcement
const storefrontPages = [
  'about.html',
  'account.html',
  'cart.html',
  'categories.html',
  'contact.html',
  'faq.html',
  'login.html',
  'orders.html',
  'product.html',
  'shop.html',
  'size-guide.html',
  'wishlist.html'
];

let modifiedCount = 0;

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Update top-bar for storefront pages
  if (storefrontPages.includes(file)) {
    const oldTopBarRegex = /<div class="top-bar"[^>]*>[\s\S]*?<\/div>/;
    if (oldTopBarRegex.test(content)) {
      content = content.replace(oldTopBarRegex, `<div class="top-bar">\n    ${targetAnnText}\n  </div>`);
      changed = true;
    }
  }

  // 2. Standardize phone link to tel:+917894093586
  if (content.includes('href="tel:7894093586"')) {
    content = content.replace(/href="tel:7894093586"/g, 'href="tel:+917894093586"');
    changed = true;
  }

  // 3. Bump CSS / JS versions to ?v=20261016-01
  const newStyle = 'href="/css/style.css?v=20261016-01"';
  const newResp = 'href="/css/responsive.css?v=20261016-01"';
  const newAppJs = 'src="/js/app.js?v=20261016-01"';

  if (content.includes('/css/style.css')) {
    content = content.replace(/href="\/css\/style\.css(\?[^"]*)?"/g, newStyle);
    changed = true;
  }
  if (content.includes('/css/responsive.css')) {
    content = content.replace(/href="\/css\/responsive\.css(\?[^"]*)?"/g, newResp);
    changed = true;
  }
  if (content.includes('/js/app.js')) {
    content = content.replace(/src="\/js\/app\.js(\?[^"]*)?"/g, newAppJs);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nSuccessfully standardized ${modifiedCount} files.`);
