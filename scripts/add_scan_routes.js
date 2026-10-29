const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, '..', 'routes', 'auth.js');
let content = fs.readFileSync(authPath, 'utf8');

const target = '// Admin Session Status Heartbeat';
if (!content.includes(target)) {
  console.error('Target not found in auth.js');
  process.exit(1);
}

if (content.includes('admin-scan-init')) {
  console.log('admin-scan-init already exists in auth.js');
  process.exit(0);
}

const addition = `// ===================================================================
// ON-DEMAND ADMIN QR SCAN AUTHORIZATION (STRICTLY omvinayakwork@gmail.com)
// ===================================================================
const activeScanSessions = new Map();

// 1. Initialize an on-demand scan session
router.post('/admin-scan-init', (req, res) => {
  const scanId = 'rjfc_scan_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  const sessionData = {
    scanId,
    status: 'PENDING',
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '',
    authorizedEmail: null
  };
  activeScanSessions.set(scanId, sessionData);
  setTimeout(() => activeScanSessions.delete(scanId), 6 * 60 * 1000);

  res.json({
    success: true,
    scanId,
    authUrl: '/admin?scan_id=' + scanId + '&action=authorize',
    expiresIn: 300
  });
});

// 2. Poll status of an on-demand scan
router.get('/admin-scan-status', (req, res) => {
  const { scan_id } = req.query;
  if (!scan_id || !activeScanSessions.has(scan_id)) {
    return res.status(404).json({ success: false, message: 'Scan session not found or expired.' });
  }
  const session = activeScanSessions.get(scan_id);
  if (Date.now() > session.expiresAt) {
    activeScanSessions.delete(scan_id);
    return res.status(400).json({ success: false, message: 'Scan session expired.' });
  }

  res.json({
    success: true,
    status: session.status,
    authorizedEmail: session.authorizedEmail
  });
});

// 3. Approve scan from mobile device (STRICT omvinayakwork@gmail.com check)
router.post('/admin-scan-approve', async (req, res) => {
  try {
    const { scan_id, email, googleIdToken } = req.body;
    if (!scan_id || !activeScanSessions.has(scan_id)) {
      return res.status(404).json({ success: false, message: 'Invalid or expired scan challenge.' });
    }

    const session = activeScanSessions.get(scan_id);
    if (Date.now() > session.expiresAt) {
      activeScanSessions.delete(scan_id);
      return res.status(400).json({ success: false, message: 'Scan session expired.' });
    }

    let verifiedEmail = (email || '').toLowerCase().trim();

    if (googleIdToken) {
      try {
        const { verifyFirebaseToken } = require('../services/firebase');
        const decoded = await verifyFirebaseToken(googleIdToken);
        if (decoded && decoded.email) {
          verifiedEmail = decoded.email.toLowerCase().trim();
        }
      } catch (_) {}
    }

    // STRICT CHECK: ONLY omvinayakwork@gmail.com CAN AUTHORIZE
    if (verifiedEmail !== 'omvinayakwork@gmail.com') {
      session.status = 'REJECTED';
      session.authorizedEmail = verifiedEmail;
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        message: 'Unauthorized Google Account. Only omvinayakwork@gmail.com is authorized.'
      });
    }

    session.status = 'APPROVED';
    session.authorizedEmail = verifiedEmail;

    res.json({
      success: true,
      status: 'APPROVED',
      message: 'Authorized successfully as omvinayakwork@gmail.com.'
    });
  } catch (err) {
    console.error('admin-scan-approve error:', err);
    res.status(500).json({ success: false, message: 'Server error during scan authorization.' });
  }
});

// 4. Claim approved session on desktop to obtain HttpOnly cookie and enter Admin Panel
router.post('/admin-scan-claim', async (req, res) => {
  try {
    const { scan_id } = req.body;
    if (!scan_id || !activeScanSessions.has(scan_id)) {
      return res.status(404).json({ success: false, message: 'Scan session not found or expired.' });
    }

    const session = activeScanSessions.get(scan_id);
    if (session.status !== 'APPROVED' || session.authorizedEmail !== 'omvinayakwork@gmail.com') {
      return res.status(403).json({ success: false, message: 'Scan session not approved by omvinayakwork@gmail.com.' });
    }

    activeScanSessions.delete(scan_id);

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = "admin"').get('omvinayakwork@gmail.com');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Super admin user account not found.' });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'admin'
    };

    req.session.regenerate((err) => {
      req.session.user = sessionUser;
      sessionTokenService.issueSessionCookie(res, sessionUser, req);
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ success: false, message: 'Session save error' });

        if (typeof db.logAdminAction === 'function') {
          db.logAdminAction({
            adminId: user.id,
            adminEmail: user.email,
            action: 'ADMIN_LOGIN_SUCCESS_MOBILE_QR_SCAN',
            entityType: 'auth',
            entityId: user.id,
            details: { method: 'mobile_qr_scanner', authorizedEmail: session.authorizedEmail },
            req
          });
        }

        res.json({
          success: true,
          message: 'Mobile scan verified! Welcome Om Vinayak 👑',
          user: sessionUser
        });
      });
    });
  } catch (err) {
    console.error('admin-scan-claim error:', err);
    res.status(500).json({ success: false, message: 'Server error claiming scan session.' });
  }
});

`;

content = content.replace(target, addition + target);
fs.writeFileSync(authPath, content, 'utf8');
console.log('Successfully updated routes/auth.js with on-demand QR scan routes!');
