const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

// Target the existing QR modal button and drawer in Step 2
const oldBlock = `          <div style="text-align: center; margin-top: 14px;">
            <button type="button" onclick="toggleQrCodeModal()" class="btn-link-gold" style="background: rgba(212, 175, 55, 0.08); border: 1px dashed rgba(212, 175, 55, 0.45); border-radius: 6px; padding: 7px 14px; color: #D4AF37; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>Scan QR Code for Google Authenticator</span>
            </button>
          </div>

          <!-- QR Code Scanner Modal / Drawer -->
          <div id="admin-qr-modal" style="display: none; margin-top: 14px; padding: 16px; background: #070e1e; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 10px; text-align: center;">
            <div style="font-size: 0.82rem; font-weight: 700; color: #D4AF37; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
              Google Authenticator Setup
            </div>
            <p style="font-size: 0.76rem; color: #cbd5e1; margin: 0 0 12px; line-height: 1.4;">
              Scan with your phone camera in <strong>Google Authenticator</strong> (or Authy / 1Password):
            </p>
            <div style="background: #ffffff; padding: 12px; border-radius: 8px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
              <img src="/images/google-authenticator-qr.png" alt="Google Authenticator QR Code" width="180" height="180" style="display: block; object-fit: contain;">
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; text-align: left;">
              <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Can't scan? Enter Key Manually:</div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <code style="font-family: monospace; font-size: 0.78rem; color: #D4AF37; word-break: break-all;">RJFC77ADMIN22OMVINAYAK33ROYAL444</code>
                <button type="button" onclick="navigator.clipboard.writeText('RJFC77ADMIN22OMVINAYAK33ROYAL444'); showToast('Secret key copied! 📋', 'success');" style="background: #334155; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; flex-shrink: 0;">Copy</button>
              </div>
            </div>
            <button type="button" onclick="toggleQrCodeModal()" style="background: none; border: none; color: #94a3b8; font-size: 0.76rem; cursor: pointer; text-decoration: underline;">
              Hide QR Code
            </button>
          </div>`;

const newBlock = `          <!-- On-Demand Mobile QR Scanner Button ("When I Need") -->
          <div style="margin-top: 14px;">
            <button type="button" id="btn-open-mobile-scan" onclick="toggleMobileScanModal()" class="btn btn-block" style="background: linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%); border: 1px solid rgba(212, 175, 55, 0.6); color: #D4AF37; padding: 11px 14px; border-radius: 8px; font-weight: 700; font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.35); transition: all 0.2s ease;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              <span>📱 Open QR Scanner (Strict: omvinayakwork@gmail.com)</span>
            </button>
          </div>

          <!-- On-Demand Mobile QR Scanner Drawer -->
          <div id="admin-mobile-scan-modal" style="display: none; margin-top: 14px; padding: 16px; background: #070e1e; border: 1px solid rgba(212, 175, 55, 0.5); border-radius: 10px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.82rem; font-weight: 800; color: #D4AF37; letter-spacing: 1px; text-transform: uppercase;">
                👑 Mobile Scanner Authorization
              </span>
              <button type="button" onclick="toggleMobileScanModal(false)" style="background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 0 4px;" title="Hide Scanner">✕</button>
            </div>
            <p style="font-size: 0.76rem; color: #cbd5e1; margin: 0 0 10px; line-height: 1.4;">
              Scan with your phone camera or Google app.<br>
              <strong>Only moves forward if scanned by <span style="color: #D4AF37;">omvinayakwork@gmail.com</span></strong>.
            </p>
            <div style="background: #ffffff; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
              <img id="admin-scan-qr-img" src="/images/google-authenticator-qr.png" alt="Dynamic Authorization QR Code" width="190" height="190" style="display: block; object-fit: contain;">
            </div>
            <div id="admin-scan-status-wrap" style="display: flex; align-items: center; justify-content: center; gap: 8px; margin: 4px 0 8px; font-size: 0.78rem; color: #cbd5e1;">
              <span class="pulse-dot" id="admin-scan-pulse-dot"></span>
              <span id="admin-scan-status-text">Awaiting scan by omvinayakwork@gmail.com...</span>
            </div>
            <div id="admin-scan-error" style="display: none; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; margin-bottom: 8px;"></div>
            
            <div style="display: flex; gap: 6px; justify-content: center; margin-top: 6px;">
              <button type="button" onclick="testAuthorizedScan()" style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #6ee7b7; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
                ✓ Test omvinayakwork@gmail.com
              </button>
              <button type="button" onclick="testUnauthorizedScan()" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
                ✕ Test Other Account
              </button>
            </div>

            <a id="admin-scan-test-link" href="#" target="_blank" style="display: block; font-size: 0.72rem; color: #94a3b8; margin-top: 8px; text-decoration: underline;">
              Open authorization link in new tab ↗
            </a>
            <div style="margin-top: 8px;">
              <button type="button" onclick="toggleMobileScanModal(false)" style="background: none; border: none; color: #94a3b8; font-size: 0.74rem; cursor: pointer; text-decoration: underline;">
                Hide Scanner
              </button>
            </div>
          </div>

          <!-- Secondary Scanner & Setup Options -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.76rem;">
            <button type="button" onclick="toggleCameraScanner()" class="btn-link-gold" style="background: none; border: none; cursor: pointer; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <span>Webcam Scanner</span>
            </button>
            <button type="button" onclick="toggleQrCodeModal()" class="btn-link-gold" style="background: none; border: none; cursor: pointer; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>Authenticator Key</span>
            </button>
          </div>

          <!-- Camera / Webcam Scanner Drawer -->
          <div id="admin-camera-scanner-modal" style="display: none; margin-top: 14px; padding: 14px; background: #070e1e; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 10px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #D4AF37; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
              📷 Device Camera QR Scanner
            </div>
            <p style="font-size: 0.74rem; color: #cbd5e1; margin: 0 0 8px;">
              Point camera at your Admin QR code. Strict verification: <strong>omvinayakwork@gmail.com</strong>
            </p>
            <div style="position: relative; max-width: 240px; margin: 0 auto 8px; border-radius: 8px; overflow: hidden; background: #000; border: 1px solid #334155;">
              <video id="admin-camera-video" width="240" height="180" autoplay playsinline style="display: block; width: 100%; object-fit: cover;"></video>
              <div style="position: absolute; inset: 15px; border: 2px dashed #D4AF37; border-radius: 6px; pointer-events: none; opacity: 0.75;"></div>
            </div>
            <div id="admin-camera-status" style="font-size: 0.74rem; color: #94a3b8; margin-bottom: 8px;">
              Camera active. Point at QR code...
            </div>
            <button type="button" onclick="stopCameraScanner()" style="background: none; border: none; color: #94a3b8; font-size: 0.74rem; cursor: pointer; text-decoration: underline;">
              Close Camera Scanner
            </button>
          </div>

          <!-- QR Code Setup Modal / Drawer (Google Authenticator) -->
          <div id="admin-qr-modal" style="display: none; margin-top: 14px; padding: 16px; background: #070e1e; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 10px; text-align: center;">
            <div style="font-size: 0.82rem; font-weight: 700; color: #D4AF37; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
              Google Authenticator Setup Key
            </div>
            <p style="font-size: 0.76rem; color: #cbd5e1; margin: 0 0 12px; line-height: 1.4;">
              Scan with your phone in <strong>Google Authenticator</strong> (or Authy / 1Password):
            </p>
            <div style="background: #ffffff; padding: 12px; border-radius: 8px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
              <img src="/images/google-authenticator-qr.png" alt="Google Authenticator QR Code" width="180" height="180" style="display: block; object-fit: contain;">
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; text-align: left;">
              <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Can't scan? Enter Key Manually:</div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <code style="font-family: monospace; font-size: 0.78rem; color: #D4AF37; word-break: break-all;">RJFC77ADMIN22OMVINAYAK33ROYAL444</code>
                <button type="button" onclick="navigator.clipboard.writeText('RJFC77ADMIN22OMVINAYAK33ROYAL444'); showToast('Secret key copied! 📋', 'success');" style="background: #334155; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; flex-shrink: 0;">Copy</button>
              </div>
            </div>
            <button type="button" onclick="toggleQrCodeModal()" style="background: none; border: none; color: #94a3b8; font-size: 0.76rem; cursor: pointer; text-decoration: underline;">
              Hide Key
            </button>
          </div>`;

// Normalize line endings to avoid CRLF differences
const normHtml = html.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');

if (!normHtml.includes(normOld)) {
  console.error('Could not find oldBlock in admin.html!');
  process.exit(1);
}

let updated = normHtml.replace(normOld, newBlock.replace(/\r\n/g, '\n'));

// Now add the dedicated mobile authorization overlay right after the login overlay
const overlayTarget = '<!-- Admin Sidebar Navigation -->';
const mobileAuthScreen = `  <!-- Dedicated Mobile Authorization Screen (Displayed when scanned on phone with ?scan_id=...) -->
  <div id="admin-mobile-auth-screen" style="display: none; position: fixed; inset: 0; background: #0b1120; z-index: 99999; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
    <div style="background: #1e293b; border: 1px solid rgba(212,175,55,0.45); border-radius: 14px; max-width: 420px; width: 100%; padding: 26px 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
      <img src="/images/rj-logo-monogram-dark.png" alt="RJ Monogram" width="50" height="50" style="margin: 0 auto 10px; display: block; object-fit: contain;">
      <span style="color: var(--admin-gold); font-size: 0.72rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Administrator Scan Verification</span>
      <h2 style="font-family: var(--font-serif); font-size: 1.45rem; color: #fff; margin: 4px 0 10px;">RJ Fashion Collection</h2>
      <p style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5; margin-bottom: 18px;">
        A desktop computer is requesting Admin Portal access. Authorize with your verified Google Account:
      </p>
      
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 18px; text-align: left; font-size: 0.78rem;">
        <div style="color: #64748b; margin-bottom: 3px;">Strict Owner Enforcement:</div>
        <div style="color: #f1f5f9; font-weight: 600;">Authorized Account: <span style="color: #D4AF37;">omvinayakwork@gmail.com</span></div>
        <div style="color: #fca5a5; font-size: 0.72rem; margin-top: 4px;">⚠️ Any other Google account will be strictly blocked.</div>
      </div>

      <div id="mobile-auth-status-box" style="display: none; margin-bottom: 16px; padding: 12px; border-radius: 8px; font-size: 0.82rem; line-height: 1.4;"></div>

      <button type="button" id="mobile-auth-confirm-btn" onclick="executeMobileScanApproval()" class="btn btn-primary btn-block" style="padding: 12px; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        <span>Authorize as omvinayakwork@gmail.com</span>
      </button>

      <div style="font-size: 0.74rem; color: #64748b; margin-top: 14px;">
        RJ Fashion Collection • Private Administrative Security • © 2026
      </div>
    </div>
  </div>

  <!-- Admin Sidebar Navigation -->`;

if (!updated.includes('admin-mobile-auth-screen')) {
  updated = updated.replace(overlayTarget, mobileAuthScreen);
}

fs.writeFileSync(adminHtmlPath, updated, 'utf8');
console.log('Successfully updated public/admin.html with on-demand mobile & camera scanners!');
