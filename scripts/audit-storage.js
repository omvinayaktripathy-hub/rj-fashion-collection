const fs = require('fs');
const jsFiles = fs.readdirSync('public/js').filter(f => f.endsWith('.js'));
jsFiles.forEach(f => {
  const content = fs.readFileSync('public/js/' + f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('localStorage') || l.includes('sessionStorage')) {
      if (/token|auth|password|secret|jwt|user/i.test(l)) {
        console.log(`[${f}:${i+1}] ${l.trim()}`);
      }
    }
  });
});
