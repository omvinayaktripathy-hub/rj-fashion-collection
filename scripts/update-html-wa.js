const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const waSnippet = `  <!-- Floating WhatsApp VIP Concierge Button -->
  <a href="https://wa.me/917894093586?text=Hello%20RJ%20Fashion%20Collection!%20I%20would%20like%20assistance%20with%20your%20luxury%20collection." target="_blank" rel="noopener noreferrer" class="whatsapp-float-btn" aria-label="Chat with RJ Fashion Concierge on WhatsApp" title="Chat on WhatsApp with RJ Fashion Concierge">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.03C9.34 7.03 9.03 7.1 8.77 7.38C8.52 7.66 7.8 8.33 7.8 9.71C7.8 11.08 8.8 12.41 8.94 12.6C9.08 12.79 10.9 15.6 13.69 16.8C16.01 17.8 16.49 17.6 17.02 17.55C17.55 17.5 18.73 16.85 18.97 16.16C19.22 15.48 19.22 14.89 19.14 14.77C19.07 14.65 18.89 14.58 18.61 14.44C18.33 14.3 16.98 13.63 16.73 13.54C16.48 13.45 16.3 13.4 16.11 13.68C15.93 13.96 15.4 14.58 15.24 14.77C15.08 14.96 14.92 14.98 14.64 14.84C14.36 14.7 13.47 14.41 12.41 13.47C11.59 12.74 11.03 11.83 10.87 11.55C10.71 11.27 10.85 11.12 10.99 10.98C11.12 10.85 11.28 10.64 11.42 10.47C11.56 10.3 11.61 10.18 11.7 10C11.8 9.81 11.75 9.65 11.68 9.51C11.61 9.37 11.05 8.01 10.82 7.45C10.6 6.91 10.37 6.99 10.2 6.98C10.04 6.97 9.85 6.97 9.67 6.97L9.53 7.03Z"/>
    </svg>
    <span class="whatsapp-label">WhatsApp Concierge</span>
  </a>`;

const excludeFromWA = ['admin.html', '404.html'];

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Cache bust css & js
  html = html.replace(/mobile-nav\.js(\?v=[^"']*)?/g, 'mobile-nav.js?v=20261015-03');
  html = html.replace(/responsive\.css(\?v=[^"']*)?/g, 'responsive.css?v=20261015-03');
  html = html.replace(/style\.css(\?v=[^"']*)?/g, 'style.css?v=20261015-03');

  // Check if WA button should be added
  if (!excludeFromWA.includes(file)) {
    if (!html.includes('whatsapp-float-btn')) {
      if (html.includes('<script src="/js/mobile-nav.js')) {
        html = html.replace('<script src="/js/mobile-nav.js', waSnippet + '\n  <script src="/js/mobile-nav.js');
      } else {
        html = html.replace('</body>', waSnippet + '\n</body>');
      }
      console.log('Added waSnippet to', file);
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log('Successfully updated all HTML files with ?v=20261015-03 cache buster and single WhatsApp button.');
