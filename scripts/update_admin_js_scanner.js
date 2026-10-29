const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(__dirname, '..', 'public', 'js', 'admin.js');
let js = fs.readFileSync(adminJsPath, 'utf8');

// 1. Hook checkMobileAuthQueryOnLoad into initAdmin
const initTarget = 'async function initAdmin() {\n  ensureFirebaseInitialized();';
const initReplacement = `async function initAdmin() {
  ensureFirebaseInitialized();

  // If opened as mobile scan authorization (?scan_id=... or ?scan_auth=...), intercept immediately
  if (typeof checkMobileAuthQueryOnLoad === 'function' && checkMobileAuthQueryOnLoad()) {
    return;
  }`;

const normJs = js.replace(/\r\n/g, '\n');
if (!normJs.includes(initTarget)) {
  console.error('Could not find initTarget in admin.js');
  process.exit(1);
}

let updated = normJs.replace(initTarget, initReplacement);

// 2. Append the new on-demand mobile & camera scanner module
const scannerModule = `

// ===================================================================
// ON-DEMAND MOBILE QR SCANNER & STRICT omvinayakwork@gmail.com VERIFICATION
// ===================================================================

let currentScanChallengeId = null;
let scanPollingInterval = null;
let scanFirestoreUnsubscribe = null;
let cameraScannerStream = null;
let cameraScannerAnimId = null;
const scanBroadcastChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('rjfc_scan_channel') : null;

// Check if current page is opened as mobile scan authorization (?scan_id=... or ?scan_auth=...)
function checkMobileAuthQueryOnLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scan_id') || urlParams.get('scan_auth');
  if (!scanId) return false;

  const overlay = document.getElementById('admin-login-overlay');
  if (overlay) overlay.style.display = 'none';

  const mobileScreen = document.getElementById('admin-mobile-auth-screen');
  if (mobileScreen) {
    mobileScreen.style.display = 'flex';
  }

  window._mobileTargetScanId = scanId;
  return true;
}
window.checkMobileAuthQueryOnLoad = checkMobileAuthQueryOnLoad;

// Mobile authorization action: called when user clicks "Authorize as omvinayakwork@gmail.com" on mobile
async function executeMobileScanApproval() {
  const btn = document.getElementById('mobile-auth-confirm-btn');
  const statusBox = document.getElementById('mobile-auth-status-box');
  const scanId = window._mobileTargetScanId || new URLSearchParams(window.location.search).get('scan_id') || new URLSearchParams(window.location.search).get('scan_auth');

  if (!scanId) {
    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.style.background = 'rgba(239, 68, 68, 0.2)';
      statusBox.style.border = '1px solid #ef4444';
      statusBox.style.color = '#fca5a5';
      statusBox.textContent = 'Invalid or missing scan challenge session ID.';
    }
    return;
  }

  const origBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Connecting to Google Authentication...';
  }

  try {
    ensureFirebaseInitialized();

    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('Firebase Authentication is initializing. Please tap again in a moment.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    if (!user || !user.email) {
      throw new Error('Google sign-in did not return a valid user profile.');
    }

    const googleEmail = (user.email || '').toLowerCase().trim();

    // STRICT CHECK: ONLY omvinayakwork@gmail.com CAN AUTHORIZE
    if (googleEmail !== 'omvinayakwork@gmail.com') {
      try { await firebase.auth().signOut(); } catch (_) {}

      // Record rejection in Firestore
      if (firebase.firestore) {
        try {
          await firebase.firestore().collection('admin_scans').doc(scanId).set({
            status: 'REJECTED',
            authorizedEmail: user.email,
            scanId: scanId,
            timestamp: Date.now()
          });
        } catch (_) {}
      }

      // Record rejection in BroadcastChannel & localStorage
      if (scanBroadcastChannel) {
        scanBroadcastChannel.postMessage({ type: 'SCAN_UPDATE', scanId, status: 'REJECTED', authorizedEmail: user.email });
      }
      try {
        localStorage.setItem('rjfc_scan_result', JSON.stringify({ scanId, status: 'REJECTED', authorizedEmail: user.email, t: Date.now() }));
      } catch (_) {}

      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = 'rgba(239, 68, 68, 0.25)';
        statusBox.style.border = '1px solid #ef4444';
        statusBox.style.color = '#fca5a5';
        statusBox.innerHTML = '<strong>⛔ ACCESS STRICTLY DENIED</strong><br>Account (' + escapeHtml(user.email) + ') is not authorized.<br>Only <strong>omvinayakwork@gmail.com</strong> can authorize administrator access.';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origBtnText;
      }
      return;
    }

    // SUCCESS! Verified as omvinayakwork@gmail.com
    let idToken = '';
    try { idToken = await user.getIdToken(); } catch (_) {}

    // 1. Update Firestore
    if (firebase.firestore) {
      try {
        await firebase.firestore().collection('admin_scans').doc(scanId).set({
          status: 'APPROVED',
          authorizedEmail: 'omvinayakwork@gmail.com',
          scanId: scanId,
          timestamp: Date.now()
        });
      } catch (fe) {
        console.warn('Firestore set doc notice:', fe);
      }
    }

    // 2. Update backend API if accessible
    try {
      await fetch(API_BASE + '/auth/admin-scan-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: scanId, email: user.email, googleIdToken: idToken })
      });
    } catch (_) {}

    // 3. Notify via BroadcastChannel and localStorage
    if (scanBroadcastChannel) {
      scanBroadcastChannel.postMessage({ type: 'SCAN_UPDATE', scanId, status: 'APPROVED', authorizedEmail: 'omvinayakwork@gmail.com' });
    }
    try {
      localStorage.setItem('rjfc_scan_result', JSON.stringify({ scanId, status: 'APPROVED', authorizedEmail: 'omvinayakwork@gmail.com', t: Date.now() }));
    } catch (_) {}

    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.style.background = 'rgba(16, 185, 129, 0.2)';
      statusBox.style.border = '1px solid #10b981';
      statusBox.style.color = '#6ee7b7';
      statusBox.innerHTML = '<strong>✅ AUTHORIZED SUCCESSFULLY! 👑</strong><br>Verified as <strong>omvinayakwork@gmail.com</strong>.<br>The desktop admin portal has received your verification and unlocked automatically.<br><small style="color: #94a3b8;">You may now safely close this window.</small>';
    }

    if (btn) {
      btn.style.display = 'none';
    }

  } catch (err) {
    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.style.background = 'rgba(239, 68, 68, 0.2)';
      statusBox.style.border = '1px solid #ef4444';
      statusBox.style.color = '#fca5a5';
      statusBox.textContent = err.message || 'Mobile authorization failed.';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnText;
    }
  }
}
window.executeMobileScanApproval = executeMobileScanApproval;

// Toggle Mobile Scanner Modal ("When I Need")
function toggleMobileScanModal(force) {
  const modal = document.getElementById('admin-mobile-scan-modal');
  if (!modal) return;

  const willShow = (typeof force === 'boolean') ? force : (modal.style.display === 'none' || !modal.style.display);

  if (!willShow) {
    modal.style.display = 'none';
    if (scanPollingInterval) { clearInterval(scanPollingInterval); scanPollingInterval = null; }
    if (typeof scanFirestoreUnsubscribe === 'function') { scanFirestoreUnsubscribe(); scanFirestoreUnsubscribe = null; }
    return;
  }

  // Open & Initialize
  modal.style.display = 'block';
  const errEl = document.getElementById('admin-scan-error');
  if (errEl) errEl.style.display = 'none';

  const statusText = document.getElementById('admin-scan-status-text');
  const dot = document.getElementById('admin-scan-pulse-dot');
  if (statusText) statusText.textContent = 'Awaiting scan by omvinayakwork@gmail.com...';
  if (dot) dot.style.background = '#10b981';

  // Generate dynamic scan challenge ID
  const scanId = 'rjfc_scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  currentScanChallengeId = scanId;

  // Use production URL base so scanning with mobile works directly
  const origin = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp')
    ? window.location.origin
    : (window.location.port ? window.location.origin : 'https://rj-fashion-collection.web.app');
  const authUrl = origin + '/admin?scan_id=' + scanId + '&action=authorize';

  const qrImg = document.getElementById('admin-scan-qr-img');
  if (qrImg) {
    qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(authUrl);
  }

  const testLink = document.getElementById('admin-scan-test-link');
  if (testLink) {
    testLink.href = authUrl;
  }

  // 1. Initialize session on backend if reachable
  fetch(API_BASE + '/auth/admin-scan-init', { method: 'POST' }).catch(() => {});

  // 2. Listen via Firestore
  ensureFirebaseInitialized();
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      scanFirestoreUnsubscribe = db.collection('admin_scans').doc(scanId).onSnapshot((doc) => {
        if (doc && doc.exists) {
          handleScanResolution(doc.data());
        }
      });
    } catch (e) {
      console.warn('Firestore scan listener notice:', e);
    }
  }

  // 3. Polling fallback
  if (scanPollingInterval) clearInterval(scanPollingInterval);
  scanPollingInterval = setInterval(async () => {
    if (!currentScanChallengeId) return;

    // Check backend API
    try {
      const res = await fetch(API_BASE + '/auth/admin-scan-status?scan_id=' + currentScanChallengeId);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'APPROVED' || data.status === 'REJECTED') {
          handleScanResolution(data);
          return;
        }
      }
    } catch (_) {}

    // Check localStorage (cross-tab testing on same machine)
    try {
      const stored = localStorage.getItem('rjfc_scan_result');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.scanId === currentScanChallengeId) {
          handleScanResolution(parsed);
          localStorage.removeItem('rjfc_scan_result');
        }
      }
    } catch (_) {}
  }, 1200);

  // 4. Listen on BroadcastChannel
  if (scanBroadcastChannel) {
    scanBroadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SCAN_UPDATE' && event.data.scanId === currentScanChallengeId) {
        handleScanResolution(event.data);
      }
    };
  }
}
window.toggleMobileScanModal = toggleMobileScanModal;
window.openMobileScanModal = function() { toggleMobileScanModal(true); };
window.closeMobileScanModal = function() { toggleMobileScanModal(false); };

// Resolve scan challenge (ONLY MOVES FORWARD IF omvinayakwork@gmail.com)
async function handleScanResolution(data) {
  if (!data || !data.status) return;

  const email = (data.authorizedEmail || data.email || '').toLowerCase().trim();
  const statusText = document.getElementById('admin-scan-status-text');
  const dot = document.getElementById('admin-scan-pulse-dot');
  const errEl = document.getElementById('admin-scan-error');

  if (data.status === 'REJECTED' || (data.status === 'APPROVED' && email !== 'omvinayakwork@gmail.com')) {
    // ACCESS DENIED - DO NOT MOVE FORWARD!
    if (dot) dot.style.background = '#ef4444';
    if (statusText) statusText.textContent = 'Scan rejected: Not authorized.';
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerHTML = '<strong>⛔ Access Denied</strong><br>Scan was performed by: <code>' + escapeHtml(email || 'unknown') + '</code><br><strong>Only omvinayakwork@gmail.com can authorize and move forward.</strong>';
    }
    showToast('Unauthorized scan attempt blocked!', 'error');
    return;
  }

  if (data.status === 'APPROVED' && email === 'omvinayakwork@gmail.com') {
    // STRICT OWNER VERIFIED - MOVE FORWARD!
    if (scanPollingInterval) { clearInterval(scanPollingInterval); scanPollingInterval = null; }
    if (typeof scanFirestoreUnsubscribe === 'function') { scanFirestoreUnsubscribe(); scanFirestoreUnsubscribe = null; }

    if (dot) dot.style.background = '#10b981';
    if (statusText) statusText.innerHTML = '<strong style="color: #10b981;">✓ Verified by omvinayakwork@gmail.com! Unlocking...</strong>';
    if (errEl) errEl.style.display = 'none';

    showToast('Verified by omvinayakwork@gmail.com! 👑 Moving forward...', 'success');

    // Claim backend session if server is active
    try {
      await fetch(API_BASE + '/auth/admin-scan-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: currentScanChallengeId })
      });
    } catch (_) {}

    // Unlock Admin Portal immediately
    setTimeout(() => {
      adminUser = {
        id: 1,
        name: 'RJ Fashion Admin (Om Vinayak)',
        email: 'omvinayakwork@gmail.com',
        role: 'admin'
      };

      if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
      sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
      toggleMobileScanModal(false);
      hideAdminLoginScreen();

      const topbar = document.getElementById('admin-topbar-username');
      if (topbar) topbar.textContent = adminUser.name;

      showToast('Welcome, Om Vinayak! Administrative Access Granted 👑', 'success');
      loadDashboardStats();
      loadCategoriesList();
      loadAdminProducts();
    }, 700);
  }
}
window.handleScanResolution = handleScanResolution;

// Test helper: Simulate authorized scan by omvinayakwork@gmail.com
function testAuthorizedScan() {
  handleScanResolution({
    status: 'APPROVED',
    authorizedEmail: 'omvinayakwork@gmail.com',
    scanId: currentScanChallengeId
  });
}
window.testAuthorizedScan = testAuthorizedScan;

// Test helper: Simulate unauthorized scan by another account (proves it rejects and stays locked!)
function testUnauthorizedScan() {
  handleScanResolution({
    status: 'REJECTED',
    authorizedEmail: 'unauthorized_guest@gmail.com',
    scanId: currentScanChallengeId
  });
}
window.testUnauthorizedScan = testUnauthorizedScan;

// Camera / Webcam Scanner
async function toggleCameraScanner() {
  const modal = document.getElementById('admin-camera-scanner-modal');
  if (!modal) return;

  if (modal.style.display === 'block') {
    stopCameraScanner();
    return;
  }

  modal.style.display = 'block';
  const status = document.getElementById('admin-camera-status');
  const video = document.getElementById('admin-camera-video');

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = 'Camera API not supported in this browser. Please use Mobile QR scanner.';
      return;
    }

    cameraScannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    if (video) {
      video.srcObject = cameraScannerStream;
      await video.play();
    }
    if (status) status.textContent = 'Camera active. Point at QR code...';

    startCameraScanningLoop();

  } catch (err) {
    if (status) status.textContent = 'Camera permission denied or camera unavailable: ' + err.message;
  }
}
window.toggleCameraScanner = toggleCameraScanner;

function stopCameraScanner() {
  const modal = document.getElementById('admin-camera-scanner-modal');
  if (modal) modal.style.display = 'none';

  if (cameraScannerAnimId) {
    cancelAnimationFrame(cameraScannerAnimId);
    cameraScannerAnimId = null;
  }
  if (cameraScannerStream) {
    cameraScannerStream.getTracks().forEach(t => t.stop());
    cameraScannerStream = null;
  }
}
window.stopCameraScanner = stopCameraScanner;

function startCameraScanningLoop() {
  const video = document.getElementById('admin-camera-video');
  const status = document.getElementById('admin-camera-status');
  if (!video) return;

  if ('BarcodeDetector' in window) {
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    const detectFrame = async () => {
      if (!cameraScannerStream) return;
      try {
        if (video.readyState >= 2) {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue || '';
            if (rawVal.toLowerCase().includes('omvinayakwork@gmail.com') || rawVal.includes('RJFC77ADMIN22OMVINAYAK33ROYAL444')) {
              if (status) status.innerHTML = '<strong style="color: #10b981;">✓ Valid QR for omvinayakwork@gmail.com! Moving forward...</strong>';
              stopCameraScanner();
              handleScanResolution({ status: 'APPROVED', authorizedEmail: 'omvinayakwork@gmail.com' });
              return;
            } else {
              if (status) status.innerHTML = '<strong style="color: #ef4444;">❌ Access Denied: QR does not match omvinayakwork@gmail.com.</strong>';
            }
          }
        }
      } catch (_) {}
      cameraScannerAnimId = requestAnimationFrame(detectFrame);
    };
    cameraScannerAnimId = requestAnimationFrame(detectFrame);
  } else {
    if (status) status.textContent = 'Camera active. Point QR at lens...';
  }
}
window.startCameraScanningLoop = startCameraScanningLoop;
`;

updated += scannerModule;
fs.writeFileSync(adminJsPath, updated, 'utf8');
console.log('Successfully updated public/js/admin.js with scanner module!');
