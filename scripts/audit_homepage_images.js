const fs = require('fs');

const s = fs.readFileSync('public/index.html', 'utf8');
const imgs = s.match(/<img[^>]+>/gi) || [];
console.log('Total img tags in public/index.html:', imgs.length);

let missingOnError = 0;
let missingFiles = 0;

imgs.forEach((img, idx) => {
  const srcMatch = img.match(/src=["']([^"']+)["']/i);
  const src = srcMatch ? srcMatch[1] : null;
  const hasOnError = /onerror=/i.test(img);
  
  let existsOnDisk = true;
  if (src && !src.startsWith('http') && !src.startsWith('data:')) {
    const cleanPath = 'public' + (src.startsWith('/') ? src : '/' + src).split('?')[0];
    existsOnDisk = fs.existsSync(cleanPath);
    if (!existsOnDisk) missingFiles++;
  }
  
  if (!hasOnError) missingOnError++;
  
  console.log(`[${idx + 1}] src="${src}" | onDisk: ${existsOnDisk} | onerror: ${hasOnError}`);
});

console.log(`\nSummary: Total: ${imgs.length}, Missing onError: ${missingOnError}, Missing on disk: ${missingFiles}`);
