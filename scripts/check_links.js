const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const regex = /href=["']([^"'#]+)["']/g;
const links = new Set();
let m;
while ((m = regex.exec(html)) !== null) {
  links.add(m[1]);
}
console.log('All unique links in index.html:');
let brokenCount = 0;
for (const l of links) {
  if (l.startsWith('http') || l.startsWith('tel:') || l.startsWith('mailto:')) continue;
  let cleanPath = l.split('?')[0];
  if (cleanPath === '/') cleanPath = '/index.html';
  if (!cleanPath.endsWith('.html')) cleanPath += '.html';
  const filePath = 'public' + cleanPath;
  const exists = fs.existsSync(filePath);
  if (!exists) {
    console.error('❌ BROKEN LINK:', l, '-> target missing:', filePath);
    brokenCount++;
  } else {
    console.log('✓', l);
  }
}
console.log(`Total local links: ${links.size}, Broken: ${brokenCount}`);
