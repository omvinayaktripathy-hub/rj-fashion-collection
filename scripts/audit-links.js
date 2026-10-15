const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const knownPages = new Set(htmlFiles.map(f => f.replace('.html', '')));
htmlFiles.forEach(f => knownPages.add(f));
knownPages.add('favicon.svg');
knownPages.add('favicon.ico');

let brokenLinks = 0;
let forbiddenFound = 0;
let telLinks = 0;
let mailtoLinks = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(publicDir, file), 'utf8');

  // Check forbidden texts
  if (content.includes('10% off your first order') || content.includes('newsletter') && file === 'index.html') {
    console.warn(`[Forbidden] Newsletter or 10% promo found in ${file}`);
    forbiddenFound++;
  }

  // Find all hrefs
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('tel:')) {
      telLinks++;
    } else if (href.startsWith('mailto:')) {
      mailtoLinks++;
    } else if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
      // External or anchor
    } else {
      // Internal link e.g. /shop.html, /shop, /cart, /cart.html, shop.html
      let clean = href.split('?')[0].split('#')[0].replace(/^\//, '');
      if (clean === '' || clean === '/') clean = 'index.html';
      const cleanNoExt = clean.replace('.html', '');

      if (!knownPages.has(clean) && !knownPages.has(cleanNoExt) && !clean.startsWith('images/') && !clean.startsWith('css/') && !clean.startsWith('js/')) {
        console.error(`[Broken Link] In ${file}: href="${href}" -> target not found!`);
        brokenLinks++;
      }
    }
  }
});

console.log('--- LINK AUDIT SUMMARY ---');
console.log(`Broken internal links: ${brokenLinks}`);
console.log(`Forbidden promos: ${forbiddenFound}`);
console.log(`Clickable tel: links: ${telLinks}`);
console.log(`Clickable mailto: links: ${mailtoLinks}`);
