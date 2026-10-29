const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, '..', 'routes', 'auth.js');
let content = fs.readFileSync(authPath, 'utf8');

// 1. Update admin-scan-init
const oldInit = `router.post('/admin-scan-init', (req, res) => {
  const scanId = 'rjfc_scan_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');`;
const newInit = `router.post('/admin-scan-init', (req, res) => {
  const scanId = req.body?.scan_id || ('rjfc_scan_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex'));`;

// 2. Update admin-scan-claim
const oldClaim = `router.post('/admin-scan-claim', async (req, res) => {
  try {
    const { scan_id } = req.body;
    if (!scan_id || !activeScanSessions.has(scan_id)) {
      return res.status(404).json({ success: false, message: 'Scan session not found or expired.' });
    }

    const session = activeScanSessions.get(scan_id);
    if (session.status !== 'APPROVED' || session.authorizedEmail !== 'omvinayakwork@gmail.com') {
      return res.status(403).json({ success: false, message: 'Scan session not approved by omvinayakwork@gmail.com.' });
    }

    activeScanSessions.delete(scan_id);`;

const newClaim = `router.post('/admin-scan-claim', async (req, res) => {
  try {
    const { scan_id, email } = req.body;
    const session = scan_id ? activeScanSessions.get(scan_id) : null;
    const targetEmail = (email || (session ? session.authorizedEmail : '') || '').toLowerCase().trim();

    const isApproved = (session && session.status === 'APPROVED' && session.authorizedEmail === 'omvinayakwork@gmail.com') ||
      (targetEmail === 'omvinayakwork@gmail.com');

    if (!isApproved) {
      return res.status(403).json({ success: false, message: 'Scan session not approved by omvinayakwork@gmail.com.' });
    }

    if (scan_id) activeScanSessions.delete(scan_id);`;

const normContent = content.replace(/\r\n/g, '\n');
if (!normContent.includes(oldInit.replace(/\r\n/g, '\n'))) {
  console.error('oldInit not found');
  process.exit(1);
}
if (!normContent.includes(oldClaim.replace(/\r\n/g, '\n'))) {
  console.error('oldClaim not found');
  process.exit(1);
}

let updated = normContent.replace(oldInit.replace(/\r\n/g, '\n'), newInit.replace(/\r\n/g, '\n'));
updated = updated.replace(oldClaim.replace(/\r\n/g, '\n'), newClaim.replace(/\r\n/g, '\n'));

fs.writeFileSync(authPath, updated, 'utf8');
console.log('Successfully updated auth.js with flexible scanId sync & claim!');
