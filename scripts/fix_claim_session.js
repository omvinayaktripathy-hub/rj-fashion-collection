const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, '..', 'routes', 'auth.js');
let content = fs.readFileSync(authPath, 'utf8');

const target = `    req.session.regenerate((err) => {
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
    });`;

const replacement = `    const finalizeSession = () => {
      if (req.session) {
        req.session.user = sessionUser;
        if (typeof req.session.save === 'function') {
          req.session.save(() => {});
        }
      }
      if (sessionTokenService && typeof sessionTokenService.issueSessionCookie === 'function') {
        sessionTokenService.issueSessionCookie(res, sessionUser, req);
      }
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
      return res.json({
        success: true,
        message: 'Mobile scan verified! Welcome Om Vinayak 👑',
        user: sessionUser
      });
    };

    if (req.session && typeof req.session.regenerate === 'function') {
      req.session.regenerate((err) => {
        finalizeSession();
      });
    } else {
      finalizeSession();
    }`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('Target not found in auth.js');
  process.exit(1);
}

const updated = normContent.replace(normTarget, replacement);
fs.writeFileSync(authPath, updated, 'utf8');
console.log('Successfully updated finalizeSession in auth.js!');
