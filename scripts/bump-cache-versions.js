const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const NEW_VERSION = '20261109-live-all-pass';

let totalReplacements = 0;

for (const file of htmlFiles) {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(/\?v=2026[a-zA-Z0-9_-]+/g, `?v=${NEW_VERSION}`);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    totalReplacements++;
    console.log(`Bumped cache version in: ${file}`);
  }
}

console.log(`Successfully bumped cache versions in ${totalReplacements} files!`);
