const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

// 1. Update HTML files
htmlFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove <span class="logo-subtitle">Luxury Indian Ethnic Wear</span> (including possible whitespace/newlines)
  const prevLength = html.length;
  html = html.replace(/\s*<span class="logo-subtitle">Luxury Indian Ethnic Wear<\/span>/g, '');
  if (html.length !== prevLength) {
    console.log(`Removed logo-subtitle from ${file}`);
  }

  // Update shop.html meta tags if present
  if (file === 'shop.html') {
    html = html.replace(/Shop luxury Indian ethnic wear at RJ Fashion Collection/g, 'Shop at RJ Fashion Collection');
  }

  // Increment cache buster to ?v=20261015-05
  html = html.replace(/app\.js(\?v=[^"']*)?/g, 'app.js?v=20261015-05');
  html = html.replace(/mobile-nav\.js(\?v=[^"']*)?/g, 'mobile-nav.js?v=20261015-05');
  html = html.replace(/responsive\.css(\?v=[^"']*)?/g, 'responsive.css?v=20261015-05');
  html = html.replace(/style\.css(\?v=[^"']*)?/g, 'style.css?v=20261015-05');

  fs.writeFileSync(filePath, html, 'utf8');
});

// 2. Update style.css & responsive.css to defensively hide .logo-subtitle
const stylePath = path.join(publicDir, 'css', 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');
if (!styleCss.includes('.logo-subtitle { display: none !important; }')) {
  styleCss += '\n\n/* Ensure logo-subtitle is permanently hidden */\n.logo-subtitle {\n  display: none !important;\n}\n';
  fs.writeFileSync(stylePath, styleCss, 'utf8');
  console.log('Updated style.css with defensive .logo-subtitle hide rule');
}

const respPath = path.join(publicDir, 'css', 'responsive.css');
let respCss = fs.readFileSync(respPath, 'utf8');
if (!respCss.includes('.logo-subtitle { display: none !important; }')) {
  respCss += '\n\n/* Ensure logo-subtitle is permanently hidden */\n.logo-subtitle {\n  display: none !important;\n}\n';
  fs.writeFileSync(respPath, respCss, 'utf8');
  console.log('Updated responsive.css with defensive .logo-subtitle hide rule');
}

// 3. Update admin.js invoice and fallback
const adminPath = path.join(publicDir, 'js', 'admin.js');
let adminJs = fs.readFileSync(adminPath, 'utf8');
adminJs = adminJs.replace(/Luxury Indian Ethnic Wear • /g, '');
adminJs = adminJs.replace(/'Luxury Indian Ethnic Wear'/g, "'RJ Fashion Collection'");
fs.writeFileSync(adminPath, adminJs, 'utf8');
console.log('Updated admin.js');

console.log('All updates completed successfully.');
