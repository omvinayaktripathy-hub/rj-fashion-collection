const fs = require('fs');

const path = 'public/index.html';
let content = fs.readFileSync(path, 'utf8');

// Replace all broken onerror attributes
// Look for onerror="this.onerror=null; this.src='data:image/svg+xml...';"
const beforeCount = (content.match(/xmlns='http/g) || []).length;
console.log('Matches for broken xmlns=\'http before:', beforeCount);

content = content.replace(/onerror="this\.onerror=null;\s*this\.src='data:image\/svg\+xml,[^"]*"/gi, 'onerror="handleImgError(this)"');

// Also check any other onerror on monogram logos
content = content.replace(/onerror="this\.onerror=null;\s*this\.src='\/images\/rj-favicon\.svg';"/gi, 'onerror="handleImgError(this)"');

const afterCount = (content.match(/xmlns='http/g) || []).length;
console.log('Matches for broken xmlns=\'http after:', afterCount);

// Ensure handleImgError is defined in head or inline script if needed early
if (!content.includes('function handleImgError')) {
  // Add early in head script
  const earlyScript = `<script>
    window.handleImgError = function(img) {
      if (!img) return;
      img.onerror = null;
      img.src = '/images/rj-placeholder.svg';
    };
  </script>`;
  content = content.replace('<head>', '<head>\n  ' + earlyScript);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Updated public/index.html successfully!');
