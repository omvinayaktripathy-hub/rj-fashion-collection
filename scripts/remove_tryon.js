const fs = require('fs');
const path = require('path');

// 1. Clean public/product.html
console.log('Cleaning public/product.html...');
let prodHtml = fs.readFileSync('public/product.html', 'utf8');
prodHtml = prodHtml.split('\n').filter(line => {
  return !line.includes('/css/tryon.css') && !line.includes('/js/tryon.js');
}).join('\n');
fs.writeFileSync('public/product.html', prodHtml, 'utf8');
console.log('✓ Cleaned public/product.html');

// 2. Clean public/js/product-detail.js
console.log('Cleaning public/js/product-detail.js...');
let prodDetailJs = fs.readFileSync('public/js/product-detail.js', 'utf8');

// Remove isTryOnEligible check and tryon buttons
prodDetailJs = prodDetailJs.replace(/\s*\/\/\s*Virtual Try-On Category Eligibility[\s\S]*?const isTryOnEligible = [^;]+;/g, '');
prodDetailJs = prodDetailJs.replace(/\$\{isTryOnEligible \? `[\s\S]*?` : ''\}/g, '');
fs.writeFileSync('public/js/product-detail.js', prodDetailJs, 'utf8');
console.log('✓ Cleaned public/js/product-detail.js');

// 3. Clean public/admin.html
console.log('Cleaning public/admin.html...');
let adminHtml = fs.readFileSync('public/admin.html', 'utf8');

// Remove Virtual Try-On nav tab
adminHtml = adminHtml.replace(/<li class="admin-nav-item" id="nav-tryon">[\s\S]*?<\/li>/g, '');

// Remove Virtual Try-On section pane
adminHtml = adminHtml.replace(/<section id="pane-tryon" class="admin-section-pane"[\s\S]*?<\/section>/g, '');
fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log('✓ Cleaned public/admin.html');

// 4. Clean server.js
console.log('Cleaning server.js...');
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/const tryonRoutes = require\(['"]\.\/routes\/tryon['"]\);?\r?\n/g, '');
serverJs = serverJs.replace(/app\.use\(['"]\/api\/tryon['"],\s*tryonRoutes\);?\r?\n/g, '');
fs.writeFileSync('server.js', serverJs, 'utf8');
console.log('✓ Cleaned server.js');

console.log('All AI Try-On elements removed cleanly!');
