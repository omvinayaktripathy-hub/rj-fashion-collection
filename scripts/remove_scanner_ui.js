const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

// The block to remove starts right after the Emergency Key button div
const startMarker = `            <button type="button" onclick="toggleEmergencyKeyInput()" class="btn-link-gold" style="background: none; border: none; cursor: pointer; color: #94a3b8;">
              Emergency Key
            </button>
          </div>`;

const endMarker = `          <!-- Emergency Master Recovery Key Drawer -->
          <div id="admin-emergency-key-drawer"`;

const normHtml = html.replace(/\r\n/g, '\n');
const normStart = startMarker.replace(/\r\n/g, '\n');
const normEnd = endMarker.replace(/\r\n/g, '\n');

const startIndex = normHtml.indexOf(normStart);
if (startIndex === -1) {
  console.error('startMarker not found');
  process.exit(1);
}

const endIndex = normHtml.indexOf(normEnd, startIndex);
if (endIndex === -1) {
  console.error('endMarker not found');
  process.exit(1);
}

// Slice out everything between startMarker end and endMarker start
const before = normHtml.slice(0, startIndex + normStart.length);
const after = normHtml.slice(endIndex);

const updated = before + '\n\n' + after;
fs.writeFileSync(adminHtmlPath, updated, 'utf8');
console.log('Successfully removed the scanner buttons and drawers from public/admin.html!');
