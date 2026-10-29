const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(__dirname, '..', 'public', 'js', 'admin.js');
let js = fs.readFileSync(adminJsPath, 'utf8');

// 1. Update toggleMobileScanModal
const oldInitCall = `  // 1. Initialize session on backend if reachable
  fetch(API_BASE + '/auth/admin-scan-init', { method: 'POST' }).catch(() => {});`;
const newInitCall = `  // 1. Initialize session on backend if reachable
  fetch(API_BASE + '/auth/admin-scan-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId })
  }).catch(() => {});`;

// 2. Update handleScanResolution claim call
const oldClaimCall = `    // Claim backend session if server is active
    try {
      await fetch(API_BASE + '/auth/admin-scan-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: currentScanChallengeId })
      });
    } catch (_) {}`;

const newClaimCall = `    // Claim backend session if server is active (sets HttpOnly cookie)
    try {
      await fetch(API_BASE + '/auth/admin-scan-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: currentScanChallengeId, email: 'omvinayakwork@gmail.com' })
      });
    } catch (_) {}`;

const normJs = js.replace(/\r\n/g, '\n');
if (!normJs.includes(oldInitCall.replace(/\r\n/g, '\n'))) {
  console.error('oldInitCall not found in admin.js');
  process.exit(1);
}
if (!normJs.includes(oldClaimCall.replace(/\r\n/g, '\n'))) {
  console.error('oldClaimCall not found in admin.js');
  process.exit(1);
}

let updated = normJs.replace(oldInitCall.replace(/\r\n/g, '\n'), newInitCall.replace(/\r\n/g, '\n'));
updated = updated.replace(oldClaimCall.replace(/\r\n/g, '\n'), newClaimCall.replace(/\r\n/g, '\n'));

fs.writeFileSync(adminJsPath, updated, 'utf8');
console.log('Successfully updated admin.js with robust claim calls!');
