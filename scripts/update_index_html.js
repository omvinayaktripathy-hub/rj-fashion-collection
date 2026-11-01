const fs = require('fs');

const path = 'public/index.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Update cache busters
content = content.replace('href="/css/style.css?v=20261025-01"', 'href="/css/style.css?v=20261101-home-fix"');
content = content.replace('href="/css/responsive.css?v=20261025-01"', 'href="/css/responsive.css?v=20261101-home-fix"');

// 2. Footer Brand Monogram Lockup
const oldFooterBrand = `        <!-- Column 1: Brand Profile -->
        <div class="footer-brand">
          <h3 class="footer-brand-title">RJ FASHION COLLECTION</h3>
          <p class="footer-brand-desc">India's premier online boutique for royal bridal sarees, intricate Kundan jewelry, and contemporary festive ethnic ensembles designed for celebrations.</p>
        </div>`;

const newFooterBrand = `        <!-- Column 1: Brand Profile -->
        <div class="footer-brand">
          <div class="footer-brand-logo-lockup" style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <div class="brand-logo-mark" style="width: 44px; height: 44px; flex-shrink: 0;">
              <img src="/images/rj-logo-monogram.png" alt="RJ Monogram" class="logo-img-light" width="44" height="44" loading="lazy" onerror="this.onerror=null; this.src='/images/rj-favicon.svg';">
              <img src="/images/rj-logo-monogram-dark.png" alt="RJ Monogram (Dark)" class="logo-img-dark" width="44" height="44" loading="lazy" onerror="this.onerror=null; this.src='/images/rj-favicon.svg';">
            </div>
            <h3 class="footer-brand-title" style="margin: 0;">RJ FASHION COLLECTION</h3>
          </div>
          <p class="footer-brand-desc">India's premier online boutique for royal bridal sarees, intricate Kundan jewelry, and contemporary festive ethnic ensembles designed for celebrations.</p>
        </div>`;

// Normalize CRLF to LF for reliable matching
const isCRLF = content.includes('\r\n');
let normContent = content.replace(/\r\n/g, '\n');

if (!normContent.includes(oldFooterBrand)) {
  console.error('Old footer brand target not found!');
  process.exit(1);
}

normContent = normContent.replace(oldFooterBrand, newFooterBrand);

// 3. Fallback for Unsplash images
const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='16' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ERJ Fashion Collection%3C/text%3E%3C/svg%3E";

// Add onerror to img tags that don't already have one
normContent = normContent.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
  if (/onerror=/i.test(attrs)) return match;
  
  if (/rj-logo-monogram/i.test(attrs)) {
    return `<img ${attrs} onerror="this.onerror=null; this.src='/images/rj-favicon.svg';">`;
  }
  
  return `<img ${attrs} onerror="this.onerror=null; this.src='${fallbackSvg}';">`;
});

if (isCRLF) {
  normContent = normContent.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, normContent, 'utf8');
console.log('Successfully updated public/index.html with footer monogram logo, cache-busters, and image onerror fallbacks!');
