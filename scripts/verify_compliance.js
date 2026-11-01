const fs = require('fs');

const s = fs.readFileSync('public/index.html', 'utf8').toLowerCase();
console.log('24k:', s.includes('24k'));
console.log('handloom:', s.includes('handloom'));
console.log('newsletter:', s.includes('newsletter'));
console.log('returns section:', s.includes('returns section') || s.includes('easy returns'));
console.log('10% off:', s.includes('10% off'));
console.log('admin link:', s.includes('/admin.html') || s.includes('href="/admin"'));

const copyrightMatches = s.match(/©\s*202\d/g) || [];
console.log('Copyright count:', copyrightMatches.length, copyrightMatches);
