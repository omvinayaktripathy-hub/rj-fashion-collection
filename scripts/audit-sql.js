const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      scanDir(full);
    } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('test-') && !full.includes('scripts')) {
      checkSQL(full);
    }
  }
}

function checkSQL(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    // Check if db.prepare or query has template string with ${...}
    if ((l.includes('db.prepare(') || l.includes('SELECT ') || l.includes('INSERT INTO ') || l.includes('UPDATE ') || l.includes('DELETE FROM ')) && l.includes('${')) {
      console.log(`[SQL WARNING] ${file}:${i+1} -> ${l.trim()}`);
    }
    // Check string concatenation with +
    if ((l.includes('db.prepare(') || l.includes('SELECT ') || l.includes('UPDATE ') || l.includes('DELETE FROM ')) && (l.includes(' + ') || l.includes('+req.') || l.includes('+ req.'))) {
      console.log(`[SQL CONCAT WARNING] ${file}:${i+1} -> ${l.trim()}`);
    }
  });
}

scanDir('.');
console.log('SQL Injection scan completed.');
