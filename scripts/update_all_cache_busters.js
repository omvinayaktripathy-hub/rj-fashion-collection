const fs = require('fs');
const path = require('path');

const publicDir = path.resolve('public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

let totalReplacements = 0;

for (const f of htmlFiles) {
  const p = path.join(publicDir, f);
  let content = fs.readFileSync(p, 'utf8');
  
  const before = content;
  content = content.replace(/v=20261025-01/g, 'v=20261108-clean');
  content = content.replace(/v=20261101-home-fix/g, 'v=20261108-clean');
  content = content.replace(/v=20261107-console-fix/g, 'v=20261108-clean');
  
  if (content !== before) {
    fs.writeFileSync(p, content, 'utf8');
    totalReplacements++;
    console.log(`Updated cache-busters in: ${f}`);
  }
}

console.log(`\nUpdated ${totalReplacements} HTML files with v=20261108-clean.`);
