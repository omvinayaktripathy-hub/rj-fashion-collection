function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// RJ FASHION COLLECTION - PRIVATE ADMIN PANEL CONTROLLER

let adminUser = null;
let currentProducts = [];
let currentCategories = [];
let currentOrders = [];

// Global Session Guard & Expiry Interceptor
const _origFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await _origFetch.apply(this, args);
  const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
  if ((response.status === 401 || response.status === 403) && url.includes('/api/admin/')) {
    sessionStorage.removeItem('rjfc_admin_session');
    adminUser = null;
    if (typeof showAdminLoginScreen === 'function') showAdminLoginScreen();
    const errEl = document.getElementById('admin-login-error');
    if (errEl) {
      errEl.textContent = 'Session expired or administrator authorization required. Please sign in.';
      errEl.style.display = 'block';
    }
  }
  return response;
};

// Ensure Firebase is initialized before ANY auth operation
function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps || !firebase.apps.length) {
      const currentHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
      const resolvedAuthDomain = (currentHost && (currentHost.includes('web.app') || currentHost.includes('firebaseapp.com')))
        ? currentHost
        : "rj-fashion-collection.firebaseapp.com";

      const config = window.firebaseConfig || {
        apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
        authDomain: resolvedAuthDomain,
        projectId: "rj-fashion-collection",
        storageBucket: "rj-fashion-collection.firebasestorage.app",
        messagingSenderId: "136818820501",
        appId: "1:136818820501:web:251f54494df4209854a29c",
        measurementId: "G-LL5KRD9639"
      };
      firebase.initializeApp(config);
      console.log('🔥 [Firebase] Client app initialized in Admin Portal');
    }
    return true;
  }
  return false;
}

// Initialize Admin
async function initAdmin() {
  ensureFirebaseInitialized();

  // If opened as mobile scan authorization (?scan_id=... or ?scan_auth=...), intercept immediately
  if (typeof checkMobileAuthQueryOnLoad === 'function' && checkMobileAuthQueryOnLoad()) {
    return;
  }

  // Purge any tokens from localStorage and sessionStorage
  ['token', 'session_token', 'auth_token', 'id_token', 'idToken', 'jwt', 'rjfc_token', 'rj_session_token'].forEach(k => {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {}
  });

  // 1. Authoritative check: HttpOnly Cookie session from node server
  try {
    if (window.isStaticHosting) throw new Error('static');
    const res = await fetch(`${API_BASE}/me`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        adminUser = data.user;
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        document.getElementById('admin-topbar-username').textContent = adminUser.name;
        setupSidebarCollapseState();
        loadDashboardStats();
        loadCategoriesList();
        loadAdminProducts();
        startRealtimeSync();
        return;
      }
    }
  } catch (err) {}

  // 2. Firebase-only Super Admin session restore (for Firebase Hosting & Google SSO)
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      let fbUser = null;
      try {
        const redirectRes = await firebase.auth().getRedirectResult();
        if (redirectRes && redirectRes.user) {
          fbUser = redirectRes.user;
        }
      } catch (redirErr) {
        const errEl = document.getElementById('admin-login-error');
        if (errEl && redirErr && redirErr.message) {
          errEl.textContent = redirErr.message;
          errEl.style.display = 'block';
        }
      }

      if (!fbUser) {
        fbUser = await new Promise((resolve) => {
          const cur = firebase.auth().currentUser;
          if (cur) return resolve(cur);
          const timer = setTimeout(() => resolve(null), 2000);
          const unsub = firebase.auth().onAuthStateChanged(u => {
            clearTimeout(timer);
            if (typeof unsub === 'function') unsub();
            resolve(u || null);
          });
        });
      }

      const fbEmail = (fbUser && fbUser.email ? fbUser.email.toLowerCase().trim() : '');
      const isSuperAdminIdentity = Boolean(
        fbUser && (
          fbEmail === 'omvinayakwork@gmail.com' ||
          fbUser.uid === 'aJC901OkCjU5UvqUUF9tvaqpdbn1'
        )
      );

      if (isSuperAdminIdentity) {
        adminUser = {
          id: 1,
          name: fbUser.displayName || 'RJ Fashion Admin (Om Vinayak)',
          email: fbUser.email,
          role: 'admin',
          uid: fbUser.uid
        };
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        const topbarEl = document.getElementById('admin-topbar-username');
        if (topbarEl) topbarEl.textContent = adminUser.name;
        setupSidebarCollapseState();
        loadDashboardStats();
        loadCategoriesList();
        loadAdminProducts();
        startRealtimeSync();
        return;
      } else if (fbUser && fbUser.email) {
        const errEl = document.getElementById('admin-login-error');
        if (errEl) {
          errEl.textContent = `Signed-in Google account (${fbUser.email}) is not an administrator. Please authenticate with omvinayakwork@gmail.com.`;
          errEl.style.display = 'block';
        }
        try { await firebase.auth().signOut(); } catch (_) {}
      }
    }
  } catch (err) {}

  // 3. Otherwise require interactive sign-in
  showAdminLoginScreen();
}

// Global CSRF helper for admin mutation requests
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
window.getCsrfToken = getCsrfToken;

// Switch Admin Auth Mode (Google SSO vs Master Password)
function switchAdminAuthMode(mode) {
  const googleTab = document.getElementById('tab-google-auth-btn');
  const passTab = document.getElementById('tab-password-auth-btn');
  const googlePane = document.getElementById('admin-mode-google');
  const passPane = document.getElementById('admin-mode-password');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  if (mode === 'google') {
    if (googleTab) googleTab.classList.add('active');
    if (passTab) passTab.classList.remove('active');
    if (googlePane) googlePane.style.display = 'block';
    if (passPane) passPane.style.display = 'none';
  } else {
    if (googleTab) googleTab.classList.remove('active');
    if (passTab) passTab.classList.add('active');
    if (googlePane) googlePane.style.display = 'none';
    if (passPane) passPane.style.display = 'block';
    const emailInput = document.getElementById('admin-email');
    if (emailInput) setTimeout(() => emailInput.focus(), 100);
  }
}
window.switchAdminAuthMode = switchAdminAuthMode;

async function unusedInitBlock() {
  try {
    const res = await fetch(`${API_BASE}/me`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        adminUser = data.user;
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        document.getElementById('admin-topbar-username').textContent = adminUser.name;
        setupSidebarCollapseState();
        loadDashboardStats();
        loadCategoriesList();
        startRealtimeSync();
        return;
      }
    }
  } catch (err) {}

  showAdminLoginScreen();
}

function showAdminLoginScreen() {
  const screen = document.getElementById('admin-login-overlay');
  if (screen) screen.style.display = 'flex';
}

function hideAdminLoginScreen() {
  const screen = document.getElementById('admin-login-overlay');
  if (screen) screen.style.display = 'none';
}

// ===================================================================
// SEQUENTIAL 2-STEP ADMIN AUTHENTICATION
// Step 1: Administrator Credential Verification
// Step 2: Google Authentication (Strict Owner Verification)
// ===================================================================

let twoFactorCountdownTimer = null;
window._adminPendingEmail = 'omvinayakwork@gmail.com';


function toggleQrCodeModal() {
  const modal = document.getElementById('admin-qr-modal');
  if (!modal) return;
  modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}
window.toggleQrCodeModal = toggleQrCodeModal;

function toggleAdminPasswordVisibility() {
  const input = document.getElementById('admin-password');
  const icon = document.getElementById('pass-eye-icon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
  }
}
window.toggleAdminPasswordVisibility = toggleAdminPasswordVisibility;

function toggleAdminBackupDrawer() {
  const drawer = document.getElementById('admin-backup-drawer');
  if (!drawer) return;
  drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
  if (drawer.style.display === 'block') {
    initOtpDigitInputs();
  }
}
window.toggleAdminBackupDrawer = toggleAdminBackupDrawer;

function returnToAdminLoginForm() {
  const step1 = document.getElementById('admin-step1-container');
  const step2 = document.getElementById('admin-2fa-container');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';
  if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
  if (step2) step2.style.display = 'none';
  if (step1) step1.style.display = 'block';
  const pass = document.getElementById('admin-password');
  if (pass) {
    pass.value = '';
    pass.focus();
  }
}
window.returnToAdminLoginForm = returnToAdminLoginForm;

// Backward-compatibility no-op for any legacy tab switcher
window.switchAdminAuthMode = function() {};

// Step 1: Verify Administrator Credentials & Transition to Step 2
async function handleAdminLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const btn = document.getElementById('admin-login-btn');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) {
    errEl.style.display = 'none';
    errEl.textContent = '';
  }

  const origBtnText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying Credentials...';
  }

  const emailInput = document.getElementById('admin-email');
  const passInput = document.getElementById('admin-password');
  const email = (emailInput ? emailInput.value : '').trim();
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    if (errEl) {
      errEl.textContent = 'Please enter both administrator email and password.';
      errEl.style.display = 'block';
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
    }
    return;
  }

  // 1. First attempt verification via Server API (only when Node backend is running)
  if (!window.isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true'
        },
        body: JSON.stringify({ email, password, require2FA: true })
      });

      const data = await res.json().catch(() => ({}));

      // Account Lockout
      if (res.status === 429 || data.locked) {
        if (errEl) {
          errEl.innerHTML = `<strong>Account Temporarily Locked</strong><br>${escapeHtml(data.message || 'Too many failed login attempts. Please wait 15 minutes.')}`;
          errEl.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
        }
        return;
      }

      // Step 2: 2-Step Verification Challenge Required (Normal Portal Login)
      if (res.ok && (data.mfaRequired || data.step === 2)) {
        window._adminPendingEmail = email;
        showToast('Step 1 credentials verified! Please authenticate with Google 👑', 'info');
        const step1 = document.getElementById('admin-step1-container');
        const step2 = document.getElementById('admin-2fa-container');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';

        const emailDisplay = document.getElementById('admin-2fa-email-display');
        if (emailDisplay) emailDisplay.textContent = email;

        start2FACountdown(data.expiresIn || 300);
        initOtpDigitInputs();
        if (btn) {
          btn.disabled = false;
          btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
        }
        return;
      }

      // Direct Login Grant
      if (res.ok && data.success && data.user?.role === 'admin') {
        adminUser = data.user;
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        const topbar = document.getElementById('admin-topbar-username');
        if (topbar) topbar.textContent = adminUser.name;
        showToast('Administrator access granted! 👑', 'success');
        setupSidebarCollapseState();
        loadDashboardStats();
        loadCategoriesList();
        loadAdminProducts();
        startRealtimeSync();
        return;
      }

      // Explicit 401 Wrong Password from active server
      if (res.status === 401) {
        if (errEl) {
          errEl.textContent = data.message || 'Invalid administrator credentials.';
          errEl.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
        }
        return;
      }
    } catch (err) {
      console.warn('Backend admin login request note, evaluating Firebase Auth:', err);
    }
  }

  // 2. Client-Side Verification (Static CDN on Firebase Hosting web.app)
  const normEmail = email.toLowerCase().trim();
  const isOwnerEmail = normEmail === 'omvinayakwork@gmail.com';
  const isOwnerPass = false; // Plaintext password removed; authenticate via Firebase Auth or backend

  if (isOwnerEmail && isOwnerPass) {
    window._adminPendingEmail = email;
    showToast('Credentials verified! Complete Step 2: Google Authentication 👑', 'info');
    const step1 = document.getElementById('admin-step1-container');
    const step2 = document.getElementById('admin-2fa-container');
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';

    const emailDisplay = document.getElementById('admin-2fa-email-display');
    if (emailDisplay) emailDisplay.textContent = email;

    start2FACountdown(300);
    initOtpDigitInputs();
    if (btn) {
      btn.disabled = false;
      btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
    }
    return;
  }

  // 3. Firebase Authentication SDK Email/Password (Unlocks portal directly for Super Admin)
  ensureFirebaseInitialized();
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = cred.user;
      const userEmail = (user && user.email ? user.email.toLowerCase().trim() : '');
      const isSuperAdminIdentity = Boolean(
        user && (userEmail === 'omvinayakwork@gmail.com' || user.uid === 'aJC901OkCjU5UvqUUF9tvaqpdbn1')
      );

      if (isSuperAdminIdentity) {
        adminUser = {
          id: 1,
          name: user.displayName || 'RJ Fashion Admin (Om Vinayak)',
          email: user.email,
          role: 'admin',
          uid: user.uid
        };
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        const topbar = document.getElementById('admin-topbar-username');
        if (topbar) topbar.textContent = adminUser.name;
        showToast('Welcome, Om Vinayak! Firebase Admin Authentication Successful 👑', 'success');
        setupSidebarCollapseState();
        loadDashboardStats();
        loadCategoriesList();
        loadAdminProducts();
        startRealtimeSync();
        if (btn) {
          btn.disabled = false;
          btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
        }
        return;
      } else {
        try { await firebase.auth().signOut(); } catch (_) {}
      }
    } catch (fbErr) {
      const code = fbErr && fbErr.code ? fbErr.code : '';
      let friendly = 'Invalid administrator email or password.';
      if (code === 'auth/too-many-requests') {
        friendly = 'Too many failed attempts. Please wait a few minutes or sign in using Google above.';
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        friendly = 'Incorrect password or this Google account uses Google Sign-In. Click "Authenticate with Google" above.';
      } else if (code === 'auth/network-request-failed') {
        friendly = 'Network connection error reaching Firebase Authentication.';
      }
      if (errEl) {
        errEl.textContent = friendly;
        errEl.style.display = 'block';
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
      }
      return;
    }
  }

  // Invalid credentials feedback
  if (errEl) {
    errEl.textContent = 'Invalid administrator credentials. Please use Authenticate with Google or verify your password.';
    errEl.style.display = 'block';
  }
  if (btn) {
    btn.disabled = false;
    btn.textContent = origBtnText || 'Verify Credentials & Proceed to Step 2 →';
  }
}
window.handleAdminLogin = handleAdminLogin;

// Step 2: Google Authentication for Admin Portal
async function handleAdminGoogle2FA() {
  const btn = document.getElementById('admin-google-auth-btn') || document.getElementById('admin-google-2fa-btn');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  const origBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.8';
    btn.innerHTML = 'Connecting to Google Security...';
  }

  try {
    ensureFirebaseInitialized();

    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('Firebase Authentication is loading. Please try again.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    let result = null;
    try {
      result = await firebase.auth().signInWithPopup(provider);
    } catch (popupErr) {
      const code = popupErr && popupErr.code ? popupErr.code : '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
        await firebase.auth().signInWithRedirect(provider);
        return;
      }
      throw popupErr;
    }
    const user = result.user;

    if (!user || !user.email) {
      throw new Error('Google sign-in did not return a valid user profile.');
    }

    const googleEmail = (user.email || '').toLowerCase().trim();
    const expectedEmail = (window._adminPendingEmail || 'omvinayakwork@gmail.com').toLowerCase().trim();

    // Strict Owner Identity Check
    if (googleEmail !== 'omvinayakwork@gmail.com' && googleEmail !== expectedEmail) {
      if (typeof firebase.auth === 'function') {
        try { await firebase.auth().signOut(); } catch (_) {}
      }
      if (errEl) {
        errEl.textContent = `Access denied. Google account (${user.email}) is not authorized. Only the verified owner (omvinayakwork@gmail.com) is permitted.`;
        errEl.style.display = 'block';
      }
      showToast('Access Denied: Unauthorized Google Account', 'error');
      return;
    }

    if (btn) {
      btn.innerHTML = 'Verifying Security Token & Establishing Session...';
    }

    let idToken = '';
    try {
      idToken = await user.getIdToken();
    } catch (_) {}

    // Verify token with backend only if Node server is active (avoid 404 on static Firebase Hosting)
    if (!window.isStaticHosting) {
      try {
        await fetch(`${API_BASE}/auth/admin-verify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleIdToken: idToken })
        });
      } catch (_) {}
    }

    // Unlock Admin Portal
    adminUser = {
      id: 1,
      name: user.displayName || 'RJ Fashion Admin (Om Vinayak)',
      email: user.email,
      role: 'admin',
      uid: user.uid
    };

    if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
    sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
    hideAdminLoginScreen();

    const topbar = document.getElementById('admin-topbar-username');
    if (topbar) topbar.textContent = adminUser.name;

    showToast('Welcome, Om Vinayak! Google Two-Step Verification Successful 👑', 'success');
    setupSidebarCollapseState();
    loadDashboardStats();
    loadCategoriesList();
    loadAdminProducts();
    startRealtimeSync();

  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Google 2-Step Verification failed.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = origBtnHtml || `
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        <span>Authenticate with Google (omvinayakwork@gmail.com)</span>
      `;
    }
  }
}
window.handleAdminGoogle2FA = handleAdminGoogle2FA;
window.handleAdminGoogleLogin = handleAdminGoogle2FA;

// ===================================================================
// ADMIN 2-STEP VERIFICATION HANDLERS (STEP 2)
// ===================================================================
function initOtpDigitInputs() {
  const digits = document.querySelectorAll('.admin-otp-digit');
  digits.forEach(d => { d.value = ''; d.classList.remove('error'); });

  if (digits[0]) {
    setTimeout(() => digits[0].focus(), 150);
  }

  digits.forEach((input, idx) => {
    // Remove prior event listeners by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val ? val[0] : '';
      if (val && idx < digits.length - 1) {
        document.querySelectorAll('.admin-otp-digit')[idx + 1].focus();
      }
      checkAutoSubmitOtp();
    });

    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        document.querySelectorAll('.admin-otp-digit')[idx - 1].focus();
      }
    });

    newInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      const allBoxes = document.querySelectorAll('.admin-otp-digit');
      for (let i = 0; i < pasteData.length; i++) {
        if (allBoxes[i]) allBoxes[i].value = pasteData[i];
      }
      if (pasteData.length < 6 && allBoxes[pasteData.length]) {
        allBoxes[pasteData.length].focus();
      }
      checkAutoSubmitOtp();
    });
  });
}

function checkAutoSubmitOtp() {
  const code = Array.from(document.querySelectorAll('.admin-otp-digit')).map(d => d.value).join('');
  if (code.length === 6) {
    handleAdmin2FASubmit();
  }
}

function start2FACountdown(durationSeconds) {
  if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);

  let remaining = durationSeconds;
  const display = document.getElementById('admin-2fa-timer-display');

  const update = () => {
    const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    if (display) display.textContent = `${mins}:${secs}`;

    if (remaining <= 0) {
      clearInterval(twoFactorCountdownTimer);
      if (display) display.textContent = 'EXPIRED';
      const errEl = document.getElementById('admin-login-error');
      if (errEl) {
        errEl.textContent = 'Verification code has expired. Please click "Resend Code" to receive a fresh code.';
        errEl.style.display = 'block';
      }
    }
    remaining--;
  };

  update();
  twoFactorCountdownTimer = setInterval(update, 1000);
}

async function handleAdmin2FASubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  const digits = Array.from(document.querySelectorAll('.admin-otp-digit'));
  const code = digits.map(d => d.value).join('');

  if (code.length !== 6) {
    if (errEl) {
      errEl.textContent = 'Please enter all 6 digits of the verification code.';
      errEl.style.display = 'block';
    }
    return;
  }

  const btn = document.getElementById('admin-2fa-verify-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying Code...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/admin-verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.user?.role === 'admin') {
      if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
      adminUser = data.user;
      sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
      hideAdminLoginScreen();
      const topbar = document.getElementById('admin-topbar-username');
      if (topbar) topbar.textContent = adminUser.name;
      showToast('Two-Step Verification complete! Welcome, Administrator 👑', 'success');

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Verify Code & Access Portal';
      }

      loadDashboardStats();
      loadAdminProducts();
      return;
    }

    // Static CDN fallback on Firebase Hosting web.app (where /api is static 404)
    if (res.status === 404) {
      const isValidClientCode = (window._adminSessionOtp && code === window._adminSessionOtp) ||
        false /* 2FA bypass eliminated */;

      if (isValidClientCode) {
        if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
        adminUser = {
          id: 1,
          name: 'RJ Fashion Admin (Om Vinayak)',
          email: window._adminPendingEmail || 'omvinayakwork@gmail.com',
          role: 'admin'
        };
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        const topbar = document.getElementById('admin-topbar-username');
        if (topbar) topbar.textContent = adminUser.name;
        showToast('Two-Step Verification complete! Welcome, Administrator 👑', 'success');

        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Verify Code & Access Portal';
        }

        loadDashboardStats();
        loadAdminProducts();
        return;
      }
    }

    // Verification failed on active server
    digits.forEach(d => {
      d.classList.add('error');
      setTimeout(() => d.classList.remove('error'), 600);
    });

    if (errEl) {
      errEl.textContent = data.message || 'Invalid verification code. Please check and try again.';
      errEl.style.display = 'block';
    }

    digits.forEach(d => d.value = '');
    if (digits[0]) digits[0].focus();

  } catch (err) {
    // Client-side static CDN resilience
    const isValidClientCode = (window._adminSessionOtp && code === window._adminSessionOtp) ||
      false /* 2FA bypass eliminated */;

    if (isValidClientCode) {
      if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
      adminUser = {
        id: 1,
        name: 'RJ Fashion Admin (Om Vinayak)',
        email: window._adminPendingEmail || 'omvinayakwork@gmail.com',
        role: 'admin'
      };
      sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
      hideAdminLoginScreen();
      const topbar = document.getElementById('admin-topbar-username');
      if (topbar) topbar.textContent = adminUser.name;
      showToast('Two-Step Verification complete! Welcome, Administrator 👑', 'success');

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Verify Code & Access Portal';
      }

      loadDashboardStats();
      loadAdminProducts();
      return;
    }

    if (errEl) {
      errEl.textContent = 'Connection error while verifying code. Please try again.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Verify Code & Access Portal';
    }
  }
}

async function handleAdmin2FAResend() {
  const btn = document.getElementById('admin-2fa-resend-btn');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/admin-resend-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showToast('Fresh 6-digit code sent to your email! 📩', 'success');
      start2FACountdown(data.expiresIn || 300);
      initOtpDigitInputs();

      // Enforce 30-second cooldown on the button
      let cooldown = 30;
      btn.disabled = true;
      const cooldownInterval = setInterval(() => {
        btn.textContent = `Resend in ${cooldown}s`;
        cooldown--;
        if (cooldown < 0) {
          clearInterval(cooldownInterval);
          btn.disabled = false;
          btn.textContent = 'Resend Code';
        }
      }, 1000);
    } else {
      if (errEl) {
        errEl.textContent = data.message || 'Could not resend code. Please try again shortly.';
        errEl.style.display = 'block';
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Resend Code';
      }
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Resend Code';
    }
  }
}

function toggleEmergencyKeyInput() {
  const drawer = document.getElementById('admin-emergency-key-drawer');
  if (!drawer) return;
  drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
  if (drawer.style.display === 'block') {
    const input = document.getElementById('admin-emergency-key-input');
    if (input) input.focus();
  }
}

async function submitEmergencyKey() {
  const keyInput = document.getElementById('admin-emergency-key-input');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  const recoveryKey = (keyInput ? keyInput.value : '').trim();
  if (!recoveryKey) {
    if (errEl) {
      errEl.textContent = 'Please enter your Master Recovery Key.';
      errEl.style.display = 'block';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/admin-verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryKey })
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.user?.role === 'admin') {
      if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
      adminUser = data.user;
      sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
      hideAdminLoginScreen();
      document.getElementById('admin-topbar-username').textContent = adminUser.name;
      showToast('Authenticated via Master Recovery Key! 👑', 'success');
      loadDashboardStats();
      loadAdminProducts();
      return;
    }

    if (errEl) {
      errEl.textContent = data.message || 'Invalid Master Recovery Key.';
      errEl.style.display = 'block';
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = 'Error verifying recovery key.';
      errEl.style.display = 'block';
    }
  }
}

function returnToAdminLoginForm() {
  if (twoFactorCountdownTimer) clearInterval(twoFactorCountdownTimer);
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  const step1 = document.getElementById('admin-step1-container');
  const step2 = document.getElementById('admin-2fa-container');
  if (step2) step2.style.display = 'none';
  if (step1) step1.style.display = 'block';

  const passInput = document.getElementById('admin-password');
  if (passInput) passInput.value = '';
}


// Admin Logout
async function handleAdminLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (err) {}
  sessionStorage.removeItem('rjfc_admin_session');
  adminUser = null;
  showToast('Logged out of admin portal', 'info');
  showAdminLoginScreen();
}

// Switch Admin Section
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-section-pane').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-mob-nav-btn').forEach(el => el.classList.remove('active'));

  const activePane = document.getElementById(`pane-${tabName}`);
  const activeNavItem = document.getElementById(`nav-${tabName}`);
  const activeMobBtn = document.getElementById(`mob-nav-${tabName}`);

  if (activePane) activePane.style.display = 'block';
  if (activeNavItem) activeNavItem.classList.add('active');
  if (activeMobBtn) activeMobBtn.classList.add('active');

  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) {
    titleEl.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

  // Close mobile sidebar if open
  toggleMobileSidebar(false);

  // Load section data
  switch (tabName) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'products':
      loadAdminProducts();
      break;
    case 'categories':
      loadAdminCategories();
      break;
    case 'orders':
      loadAdminOrders();
      break;
    case 'customers':
      loadAdminCustomers();
      break;
    case 'banners':
      loadAdminBanners();
      break;
    case 'audit':
      loadAdminAuditLogs();
      break;
    case 'inventory':
      loadAdminInventory();
      break;
    case 'reports':
      loadAdminReports();
      break;
    case 'settings':
      loadAdminSettings();
      break;
    case 'promotions':
      loadAdminPromotions();
      break;
    case 'campaign':
      loadAdminCampaign();
      break;
    case 'reviews':
      loadAdminReviews();
      break;
  }
}

// ─────────────────────────────────────────────────────────────
// Tamper-Evident Admin Action Audit Trail Loader
// ─────────────────────────────────────────────────────────────
async function loadAdminAuditLogs() {
  const tbody = document.getElementById('admin-audit-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">Loading tamper-evident audit logs...</td></tr>';

  try {
    let logs = [];
    if (!window.isStaticHosting) {
      const res = await fetch('/api/admin/audit-logs?limit=150', {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) logs = data.logs;
    } else if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth && firebase.auth().currentUser) {
      const snap = await firebase.firestore().collection('admin_audit_logs').limit(100).get();
      snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      logs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">No admin audit logs recorded yet.</td></tr>';
      return;
    }

    const data = { logs };

    tbody.innerHTML = data.logs.map(log => {
      let badgeColor = '#64748b';
      let badgeBg = '#f1f5f9';
      if (log.action.includes('CREATE')) {
        badgeColor = '#15803d'; badgeBg = '#dcfce7';
      } else if (log.action.includes('UPDATE')) {
        badgeColor = '#0369a1'; badgeBg = '#e0f2fe';
      } else if (log.action.includes('DELETE')) {
        badgeColor = '#b91c1c'; badgeBg = '#fee2e2';
      }

      let parsedDetails = '';
      try {
        const d = JSON.parse(log.details);
        parsedDetails = Object.entries(d).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join(', ');
      } catch (e) {
        parsedDetails = log.details || '—';
      }

      return `
        <tr>
          <td><span style="font-family: monospace; font-size: 0.8rem; font-weight: 700;">#${log.id}</span></td>
          <td style="white-space: nowrap; font-size: 0.82rem; color: #64748b;">${new Date(log.created_at).toLocaleString('en-IN')}</td>
          <td>
            <div style="font-weight: 600; font-size: 0.84rem;">${log.admin_email || 'Super Admin'}</div>
            <div style="font-size: 0.72rem; color: #94a3b8;">ID: ${log.admin_id || 1}</div>
          </td>
          <td>
            <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; background: ${badgeBg}; color: ${badgeColor};">
              ${log.action}
            </span>
          </td>
          <td><span style="font-weight: 600; text-transform: uppercase; font-size: 0.78rem;">${log.entity_type || '—'}</span> #${log.entity_id || '—'}</td>
          <td style="font-family: monospace; font-size: 0.78rem; color: #64748b;">${log.ip_address || '—'}</td>
          <td style="font-size: 0.82rem; max-width: 260px; word-break: break-word;">${parsedDetails}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading audit logs:', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #dc2626;">Failed to load audit logs.</td></tr>';
  }
}

// 1024x500 & Compact Landscape Sidebar Controls
// ─────────────────────────────────────────────────────────────
function setupSidebarCollapseState() {
  try {
    const isSaved = localStorage.getItem('rj_admin_sidebar_collapsed');
    const isCompactScreen = window.innerWidth <= 1024 && window.innerHeight <= 560;
    const shouldCollapse = isSaved === 'true' || (isSaved === null && isCompactScreen);
    
    const sidebar = document.getElementById('main-admin-sidebar');
    const arrow = document.getElementById('collapse-arrow-icon');
    if (sidebar && shouldCollapse && window.innerWidth > 768) {
      sidebar.classList.add('collapsed');
      if (arrow) arrow.textContent = '▶';
    }
  } catch (_) {}
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('main-admin-sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  const arrow = document.getElementById('collapse-arrow-icon');
  if (arrow) arrow.textContent = isCollapsed ? '▶' : '◀';
  try {
    localStorage.setItem('rj_admin_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────
// REAL-TIME ORDER AGGREGATION & SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────────────────────
let lastKnownOrderCount = 0;
let lastKnownLatestOrderId = null;
let realtimeSyncInterval = null;
let lastSyncTimestamp = Date.now();

// Web Audio API Synthesizer Royal Chime
function playRoyalChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz) - Crisp Bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: A5 (880 Hz) - Bright Gold Chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.65);
  } catch (_) {}
}

// Unified Real-Time Orders Fetcher
function fetchAllOrdersRealtime() {
  let orders = [];

  // 1. Primary localStorage key 'rj_orders' (written by checkout.js)
  try {
    const raw = localStorage.getItem('rj_orders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) orders = parsed;
    }
  } catch (_) {}

  // 2. Also check secondary localStorage key 'rjfc_orders'
  try {
    const raw2 = localStorage.getItem('rjfc_orders');
    if (raw2) {
      const parsed2 = JSON.parse(raw2);
      if (Array.isArray(parsed2)) {
        parsed2.forEach(o => {
          if (!orders.some(ex => ex.order_number === o.order_number || String(ex.id) === String(o.id))) {
            orders.push(o);
          }
        });
      }
    }
  } catch (_) {}

  // 3. Merge live Cloud Firestore orders cleanly (if loaded)
  if (Array.isArray(window._firestoreOrders) && window._firestoreOrders.length > 0) {
    const seedIds = new Set(['RJ-2026-9841', 'RJ-2026-9842', 'RJ-2026-9843', 'RJ-2026-9844']);
    const mergedMap = new Map();
    orders.forEach(o => {
      if (o && o.order_number && !seedIds.has(o.order_number)) {
        mergedMap.set(o.order_number, o);
      }
    });
    window._firestoreOrders.forEach(o => {
      if (o && o.order_number) {
        const prev = mergedMap.get(o.order_number) || {};
        mergedMap.set(o.order_number, { ...prev, ...o, id: o.id || o.order_number });
      }
    });
    orders = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else if (orders.length === 0 && !window._firestoreOrdersLoaded) {
    const seed = [
      {
        id: 1727400001,
        order_number: 'RJ-2026-9841',
        customer_name: 'Smt. Sunita Mohanty',
        customer_email: 'sunita.mohanty@gmail.com',
        customer_phone: '+91 94370 12894',
        delivery_address: 'Plot 104, Forest Park, Bhubaneswar, Odisha - 751009',
        shipping_address: 'Plot 104, Forest Park, Bhubaneswar, Odisha - 751009',
        items: [{ name: 'Royal Kanjivaram Pure Silk Zari Saree', price: 3499, quantity: 1, size: 'Free Size' }],
        total: 3499,
        payment_method: 'UPI Instant Pay',
        status: 'Delivered',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 1727400002,
        order_number: 'RJ-2026-9842',
        customer_name: 'Rajesh K. Verma',
        customer_email: 'rajesh.verma@yahoo.com',
        customer_phone: '+91 98301 54782',
        delivery_address: 'Flat 4B, Salt Lake Sector 2, Kolkata, WB - 700091',
        shipping_address: 'Flat 4B, Salt Lake Sector 2, Kolkata, WB - 700091',
        items: [{ name: "Men's Designer Silk Sherwani Set", price: 4999, quantity: 1, size: 'L' }],
        total: 4999,
        payment_method: 'Credit Card',
        status: 'Shipped',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 1727400003,
        order_number: 'RJ-2026-9843',
        customer_name: 'Priya Sharma',
        customer_email: 'priya.sharma92@outlook.com',
        customer_phone: '+91 78940 93586',
        delivery_address: 'Near Sarbhal Chowk, Jharsuguda, Odisha - 768201',
        shipping_address: 'Near Sarbhal Chowk, Jharsuguda, Odisha - 768201',
        items: [{ name: 'Temple Matte Gold Antique Jhumka Earrings', price: 799, quantity: 1, size: 'Standard' }],
        total: 799,
        payment_method: 'Cash on Delivery (COD)',
        status: 'Confirmed',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 1727400004,
        order_number: 'RJ-2026-9844',
        customer_name: 'Ananya Das',
        customer_email: 'ananya.das@gmail.com',
        customer_phone: '+91 99372 61500',
        delivery_address: 'Badambadi Colony, Cuttack, Odisha - 753012',
        shipping_address: 'Badambadi Colony, Cuttack, Odisha - 753012',
        items: [{ name: 'Embroidered Velvet Bridal Lehenga Choli', price: 8499, quantity: 1, size: 'Semi-Stitched' }],
        total: 8499,
        payment_method: 'UPI Pay',
        status: 'Pending',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ];
    try {
      localStorage.setItem('rj_orders', JSON.stringify(seed));
      orders = seed;
    } catch (_) {}
  }

  // Ensure every order has delivery_address
  orders.forEach(o => {
    if (!o.delivery_address && o.shipping_address) o.delivery_address = o.shipping_address;
  });

  return orders;
}

// Real-Time Heartbeat, Cross-Tab Storage & Firebase Firestore Snapshot Listener
let firestoreAdminOrdersUnsub = null;
function startRealtimeSync() {
  if (realtimeSyncInterval) clearInterval(realtimeSyncInterval);

  if (typeof firestoreAdminOrdersUnsub === 'function') {
    try { firestoreAdminOrdersUnsub(); } catch (_) {}
    firestoreAdminOrdersUnsub = null;
  }

  // Attach live Cloud Firestore orders listener for Super Admin
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth && firebase.auth().currentUser) {
      firestoreAdminOrdersUnsub = firebase.firestore().collection('orders').onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, firestoreId: doc.id, ...doc.data() }));
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const prevCount = Array.isArray(window._firestoreOrders) ? window._firestoreOrders.length : 0;
        const wasLoaded = Boolean(window._firestoreOrdersLoaded);
        window._firestoreOrders = list;
        window._firestoreOrdersLoaded = true;

        if (wasLoaded && list.length > prevCount && list[0]) {
          playRoyalChime();
          showToast(`🔔 New Order Received! #${list[0].order_number} by ${list[0].customer_name || 'Customer'} (${formatPrice(list[0].total)})`, 'success');
        }

        lastKnownOrderCount = list.length;
        lastKnownLatestOrderId = list[0]?.order_number || list[0]?.id || null;
        loadDashboardStats();
        if (document.getElementById('pane-orders')?.style.display !== 'none') {
          loadAdminOrders();
        }
        updateSyncStatusIndicator();
      }, err => {
        console.warn('[Firestore Admin Orders Listener]', err && err.message ? err.message : err);
      });
    }
  } catch (_) {}

  // Storage listener for instant cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'rj_orders' || e.key === 'rjfc_orders') {
      syncDashboardRealtime(false);
    }
  });

  // Background 3.5s polling loop
  realtimeSyncInterval = setInterval(() => {
    checkAndSyncOrdersSilently();
  }, 3500);

  // Initial order count registration
  const initial = fetchAllOrdersRealtime();
  lastKnownOrderCount = initial.length;
  lastKnownLatestOrderId = initial[0]?.id || null;
}

// Check if new orders arrived and notify
function checkAndSyncOrdersSilently() {
  const orders = fetchAllOrdersRealtime();
  const currentCount = orders.length;
  const latestId = orders[0]?.id || null;

  if (currentCount > lastKnownOrderCount || (latestId && latestId !== lastKnownLatestOrderId)) {
    const newOrder = orders[0];
    lastKnownOrderCount = currentCount;
    lastKnownLatestOrderId = latestId;

    // Play chime & alert admin
    playRoyalChime();
    showToast(`🔔 Real-Time Order Received! #${newOrder.order_number} by ${newOrder.customer_name} (${formatPrice(newOrder.total)})`, 'success');

    // Smoothly refresh active view
    loadDashboardStats();
    if (document.getElementById('pane-orders')?.style.display !== 'none') {
      loadAdminOrders();
    }
  }

  updateSyncStatusIndicator();
}

// User or Event-Triggered Realtime Sync
function syncDashboardRealtime(userInitiated = false) {
  lastSyncTimestamp = Date.now();
  loadDashboardStats();

  const activePane = document.querySelector('.admin-section-pane:not([style*="display: none"])');
  if (activePane && activePane.id === 'pane-orders') {
    loadAdminOrders();
  }

  updateSyncStatusIndicator();

  if (userInitiated) {
    const icon = document.getElementById('refresh-spinner-icon');
    if (icon) {
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => icon.style.transform = 'rotate(0deg)', 500);
    }
    showToast('Real-time store metrics & orders synchronized! ⚡', 'success');
  }
}

// Update Topbar Status Text with Relative Time
function updateSyncStatusIndicator() {
  const textEl = document.getElementById('sync-status-text');
  const subEl = document.getElementById('sync-status-sub');
  if (!textEl) return;

  const sec = Math.round((Date.now() - lastSyncTimestamp) / 1000);
  textEl.textContent = 'Live Sync Active';
  if (subEl) {
    subEl.textContent = sec <= 3 ? '• Just now' : `• ${sec}s ago`;
  }
}

// Fast Action: Simulate Live Customer Order
function simulateLiveOrder() {
  const names = ['Meera Patel', 'Rohan Sengupta', 'Deepika Mishra', 'Vikramaditya Roy', 'Pooja Agarwal', 'Kavita Nair', 'Siddharth Patnaik'];
  const cities = [
    'Saheed Nagar, Bhubaneswar, Odisha - 751007',
    'Park Street, Kolkata, WB - 700016',
    'Civil Lines, Delhi - 110054',
    'Bandra West, Mumbai - 400050',
    'Indiranagar, Bengaluru - 560038',
    'Biju Patnaik Chowk, Rourkela, Odisha - 769001',
    'Sarbhal Main Road, Jharsuguda, Odisha - 768201'
  ];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const orderNum = `RJ-2026-${randNum}`;

  // Pick random product
  const p = (currentProducts && currentProducts.length > 0)
    ? currentProducts[Math.floor(Math.random() * currentProducts.length)]
    : { name: 'Royal Kanjivaram Pure Silk Zari Saree', price: 3499, image: '' };

  const newOrder = {
    id: Date.now(),
    order_number: orderNum,
    customer_name: randomName,
    customer_email: randomName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com',
    customer_phone: '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
    delivery_address: randomCity,
    shipping_address: randomCity,
    items: [{ name: p.name, price: p.price, quantity: 1, image: p.image, size: 'Free Size' }],
    total: p.price,
    payment_method: Math.random() > 0.4 ? 'UPI Instant Pay' : 'Cash on Delivery (COD)',
    status: 'Confirmed',
    created_at: new Date().toISOString()
  };

  // Prepend to orders
  const existing = fetchAllOrdersRealtime();
  existing.unshift(newOrder);
  try {
    localStorage.setItem('rj_orders', JSON.stringify(existing));
  } catch (_) {}

  // Play chime & celebrate
  playRoyalChime();
  showToast(`🔔 New Live Order #${orderNum} from ${randomName} (${formatPrice(p.price)})!`, 'success');

  // Trigger instant sync
  syncDashboardRealtime(false);
}

// ─────────────────────────────────────────────────────────────
// 1. Dashboard Stats (Unified Real-Time Aggregator)
// ─────────────────────────────────────────────────────────────
async function loadDashboardStats() {
  try {
    // 1. Load catalog products
    let prods = [];
    try {
      const pRes = await fetch('/data/products.json');
      if (pRes.ok) {
        const pData = await pRes.json();
        prods = pData.products || [];
        currentProducts = prods;
      }
    } catch (_) {}

    // 2. Fetch all orders unified
    const allOrders = fetchAllOrdersRealtime();
    currentOrders = allOrders;

    // Filter by active dashboard date range
    const filteredOrders = typeof filterOrdersByDateRange === 'function' 
      ? filterOrdersByDateRange(allOrders, typeof currentDashboardDateRange !== 'undefined' ? currentDashboardDateRange : 'all')
      : allOrders;

    // Calculate live business metrics
    const nonCancelledOrders = filteredOrders.filter(o => !['cancelled', 'refunded'].includes((o.status || '').toLowerCase()));
    const totalSales = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const pendingOrders = allOrders.filter(o => ['pending', 'confirmed', 'processing'].includes((o.status || '').toLowerCase())).length;

    // Today's orders
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrdersCount = allOrders.filter(o => new Date(o.created_at || Date.now()) >= startOfToday).length;

    // Inventory metrics
    const inStock = prods.filter(p => Number(p.stock || 0) > 0);
    const lowStock = prods.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 4);
    const outOfStock = prods.filter(p => Number(p.stock || 0) <= 0);

    // Operational Alert Banners
    const alertsBanner = document.getElementById('dashboard-alerts-banner');
    if (alertsBanner) {
      const alerts = [];
      if (outOfStock.length > 0) {
        alerts.push(`
          <div class="alert-box alert-danger">
            <span>🚨 <strong>${outOfStock.length} Product(s) Out of Stock:</strong> Immediate restock recommended to prevent lost customer orders.</span>
            <button onclick="switchAdminTab('inventory'); filterInventoryByStatus('out_of_stock');" class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; border-color: #ef4444; color: #dc2626;">View OOS</button>
          </div>
        `);
      }
      if (lowStock.length > 0) {
        alerts.push(`
          <div class="alert-box alert-warning">
            <span>⚠️ <strong>${lowStock.length} Product(s) Low in Stock:</strong> 4 or fewer units remaining.</span>
            <button onclick="switchAdminTab('inventory'); filterInventoryByStatus('low_stock');" class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; border-color: #f59e0b; color: #b45309;">Restock Now</button>
          </div>
        `);
      }
      if (pendingOrders > 0) {
        alerts.push(`
          <div class="alert-box alert-info">
            <span>📦 <strong>${pendingOrders} Pending Order(s):</strong> Awaiting fulfillment & dispatch.</span>
            <button onclick="switchAdminTab('orders')" class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; border-color: #0284c7; color: #0369a1;">Process Orders</button>
          </div>
        `);
      }
      alertsBanner.innerHTML = alerts.join('');
    }

    // Customer count
    const uniqueCustomers = new Set(allOrders.map(o => (o.customer_email || o.customer_phone || o.customer_name || '').toLowerCase())).size;

    // Update Metric Cards
    const salesEl = document.getElementById('stat-total-sales');
    if (salesEl) salesEl.textContent = formatPrice(totalSales);

    const ordersEl = document.getElementById('stat-total-orders');
    if (ordersEl) ordersEl.textContent = totalOrders;

    const todayOrdersEl = document.getElementById('stat-today-orders');
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrdersCount;

    const prodsEl = document.getElementById('stat-total-products');
    if (prodsEl) prodsEl.textContent = prods.length;

    const custEl = document.getElementById('stat-total-customers');
    if (custEl) custEl.textContent = Math.max(1, uniqueCustomers);

    const pendingEl = document.getElementById('stat-pending-orders');
    if (pendingEl) pendingEl.textContent = pendingOrders;

    const lowStockEl = document.getElementById('stat-low-stock');
    if (lowStockEl) lowStockEl.textContent = lowStock.length;

    const outOfStockEl = document.getElementById('stat-out-of-stock');
    if (outOfStockEl) outOfStockEl.textContent = outOfStock.length;

    // Update Mobile Orders Badge
    const mobBadge = document.getElementById('mob-orders-badge');
    if (mobBadge) {
      mobBadge.textContent = pendingOrders;
      mobBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
    }

    // Render Recent Orders Table
    const ordersTbody = document.getElementById('dashboard-recent-orders-tbody');
    if (ordersTbody) {
      if (allOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 24px;">No customer orders recorded yet.</td></tr>`;
      } else {
        ordersTbody.innerHTML = allOrders.slice(0, 6).map(o => {
          const cleanPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
          const waMsg = encodeURIComponent(`Hello ${o.customer_name}! Thank you for shopping with RJ Fashion Collection. We are updating you regarding order #${o.order_number} (${o.status}).`);
          const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${waMsg}` : `https://wa.me/917894093586?text=${waMsg}`;

          return `
            <tr>
              <td style="font-weight:700; color:var(--admin-primary);">${o.order_number}</td>
              <td>
                <div style="font-weight:700; color:#1e293b;">${o.customer_name}</div>
                <div style="font-size:0.75rem; color:#64748b;">${o.customer_phone || ''}</div>
              </td>
              <td>${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Today'}</td>
              <td style="font-weight:700; color:#1e293b;">${formatPrice(o.total)}</td>
              <td><span class="status-pill status-${(o.status || 'pending').toLowerCase().replace(/\s+/g, '-')}">${o.status}</span></td>
              <td>
                <div style="display:flex; gap:6px;">
                  <button onclick="viewOrderModal('${o.id}')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">View</button>
                  <button onclick="openPrintOrderInvoice('${o.id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" title="Download / Print Invoice">🖨️</button>
                  <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; text-decoration:none;" title="Chat with Customer">💬</a>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Low Stock items
    const lowStockContainer = document.getElementById('dashboard-low-stock-list');
    if (lowStockContainer) {
      if (lowStock.length === 0) {
        lowStockContainer.innerHTML = `<p style="color:#059669; font-size:0.88rem; font-weight:600;">✓ All products are well stocked! 👍</p>`;
      } else {
        lowStockContainer.innerHTML = lowStock.slice(0, 5).map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9;">
            <div style="display:flex; gap:10px; align-items:center;">
              <img src="${p.image}" style="width:36px; height:45px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0;">
              <div>
                <div style="font-weight:600; font-size:0.82rem; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
                <div style="font-size:0.72rem; color:#ef4444; font-weight:700;">Only ${p.stock} remaining</div>
              </div>
            </div>
            <button onclick="quickAdjustStock('${p.id}', 10)" class="btn btn-outline-primary" style="padding:3px 8px; font-size:0.72rem; font-weight:700;">+10</button>
          </div>
        `).join('');
      }
    }

    // Render Realtime Analytics & Fulfillment breakdown
    renderDashboardAnalytics(allOrders, { totalSales, totalOrders });

  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Real-Time Analytics Bar Chart & Pipeline Distribution
// ─────────────────────────────────────────────────────────────
function renderDashboardAnalytics(orders, stats) {
  const chartContainer = document.getElementById('analytics-sales-chart');
  const statusContainer = document.getElementById('analytics-status-breakdown');

  // 1. 7-Day Sales Trend Bar Chart (Dynamic Calculation)
  if (chartContainer) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toLocaleDateString();

      // Sum orders matching this day
      let dayTotal = 0;
      let dayCount = 0;
      (orders || []).forEach(o => {
        if (!o.created_at) return;
        const od = new Date(o.created_at).toLocaleDateString();
        if (od === dateStr && (o.status || '').toLowerCase() !== 'cancelled') {
          dayTotal += Number(o.total || 0);
          dayCount++;
        }
      });

      dailyData.push({ day: dayName, date: dateStr, total: dayTotal, count: dayCount });
    }

    const maxVal = Math.max(...dailyData.map(d => d.total), 4000);

    chartContainer.innerHTML = dailyData.map(d => {
      const heightPercent = Math.max(12, Math.round((d.total / maxVal) * 100));
      return `
        <div class="chart-col">
          <div class="chart-bar" style="height: ${heightPercent}%;" title="${d.date}: ${formatPrice(d.total)} (${d.count} orders)">
            <span class="chart-bar-tooltip">${formatPrice(d.total)}</span>
          </div>
          <span class="chart-col-label">${d.day}</span>
        </div>
      `;
    }).join('');
  }

  // 2. Order Fulfillment Status Pipeline (Dynamic Percentages)
  if (statusContainer) {
    const total = (orders || []).length || 1;
    const countStatus = (st) => (orders || []).filter(o => (o.status || '').toLowerCase() === st.toLowerCase()).length;

    const delivered = countStatus('Delivered');
    const shipped = countStatus('Shipped') + countStatus('Out for Delivery');
    const packed = countStatus('Packed') + countStatus('Confirmed');
    const pending = countStatus('Pending') + countStatus('Processing');

    const pDelivered = Math.round((delivered / total) * 100);
    const pShipped = Math.round((shipped / total) * 100);
    const pPacked = Math.round((packed / total) * 100);
    const pPending = Math.round((pending / total) * 100);

    const pipeline = [
      { label: 'Delivered', count: delivered, color: '#10b981', pct: pDelivered },
      { label: 'Shipped / Out for Delivery', count: shipped, color: '#3b82f6', pct: pShipped },
      { label: 'Packed & Confirmed', count: packed, color: '#8b5cf6', pct: pPacked },
      { label: 'Pending Processing', count: pending, color: '#f59e0b', pct: pPending }
    ];

    statusContainer.innerHTML = pipeline.map(item => `
      <div class="status-progress-item">
        <div class="status-progress-meta">
          <span>${item.label} (${item.count})</span>
          <span>${item.pct}%</span>
        </div>
        <div class="status-progress-track">
          <div class="status-progress-fill" style="width: ${item.pct}%; background: ${item.color};"></div>
        </div>
      </div>
    `).join('');
  }
}

let adminProductSearchTimeout = null;

function debounceAdminProductFilter() {
  clearTimeout(adminProductSearchTimeout);
  adminProductSearchTimeout = setTimeout(() => {
    loadAdminProducts();
  }, 300);
}

function resetAdminProductFilters() {
  const s = document.getElementById('admin-product-search');
  const sf = document.getElementById('admin-product-stock-filter');
  const df = document.getElementById('admin-product-dept-filter');
  if (s) s.value = '';
  if (sf) sf.value = '';
  if (df) df.value = '';
  loadAdminProducts();
}

// 2. Admin Products Listing & Stock Management
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  const summaryEl = document.getElementById('admin-product-count-summary');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">Loading inventory products...</td></tr>`;

  const search = document.getElementById('admin-product-search')?.value.trim() || '';
  const stockStatus = document.getElementById('admin-product-stock-filter')?.value || '';
  const department = document.getElementById('admin-product-dept-filter')?.value || '';

  const q = new URLSearchParams();
  if (search) q.append('search', search);
  if (stockStatus) q.append('stockStatus', stockStatus);
  if (department) q.append('department', department);

  try {
    let prods = null;
    // 1. Try Express API (Only when running Node backend)
    if (!window.isStaticHosting) {
      try {
        const res = await fetch(`${API_BASE}/admin/products?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            prods = data.products;
          }
        }
      } catch (_) {}
    }

    // 2. Try Cloud Firestore (Direct live database on Firebase Hosting)
    if (!prods && typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        const snap = await db.collection('products').get();
        if (!snap.empty) {
          prods = [];
          snap.forEach(doc => {
            const data = doc.data();
            prods.push({
              ...data,
              id: data.id || doc.id,
              docId: doc.id
            });
          });
        }
      } catch (fsErr) {
        console.warn('Firestore products fetch notice:', fsErr);
      }
    }

    // 3. Fallback to /data/products.json
    if (!prods || prods.length === 0) {
      try {
        const pRes = await fetch('/data/products.json');
        const pData = await pRes.json();
        prods = pData.products || [];
      } catch (_) {
        prods = [];
      }
    }

    // 4. Merge any locally cached custom products
    try {
      const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
      if (customLocal.length > 0) {
        customLocal.forEach(cp => {
          const idx = prods.findIndex(p => String(p.id) === String(cp.id));
          if (idx >= 0) {
            prods[idx] = { ...prods[idx], ...cp };
          } else {
            prods.unshift(cp);
          }
        });
      }
    } catch (_) {}

    // 5. Filter locally
    if (search) {
      const sLower = search.toLowerCase();
      prods = prods.filter(p => 
        (p.name && p.name.toLowerCase().includes(sLower)) ||
        (p.brand && p.brand.toLowerCase().includes(sLower)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(sLower)) ||
        (p.department && p.department.toLowerCase().includes(sLower))
      );
    }
    if (department) {
      prods = prods.filter(p => (p.department || '').toLowerCase() === department.toLowerCase());
    }
    if (stockStatus === 'in') {
      prods = prods.filter(p => (p.stock || 0) > 0);
    } else if (stockStatus === 'low') {
      prods = prods.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 4);
    } else if (stockStatus === 'out') {
      prods = prods.filter(p => (p.stock || 0) <= 0);
    }

    // Sort newest products first
    prods.sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idB - idA;
    });

    currentProducts = prods;

    if (summaryEl) {
      const inStockCount = currentProducts.filter(p => p.stock > 0).length;
      const outStockCount = currentProducts.filter(p => p.stock <= 0).length;
      summaryEl.innerHTML = `Showing <strong>${currentProducts.length}</strong> items (${inStockCount} In Stock, <span style="color:#ef4444;">${outStockCount} Out of Stock</span>)`;
    }

    if (currentProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No products match the selected criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentProducts.map(p => {
      const isInStock = p.stock > 0;
      const isLowStock = p.stock > 0 && p.stock <= 4;
      const deptName = (p.department || 'women').toUpperCase();

      return `
        <tr>
          <td>
            <img src="${p.image}" style="width:44px; height:56px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0; ${!isInStock ? 'filter:grayscale(60%); opacity:0.75;' : ''}" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
          </td>
          <td>
            <div style="font-weight:700; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#1e293b;" title="${escapeHtml(p.name)}">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
              Brand: <strong>${p.brand || 'RJ Collection'}</strong>
              ${p.subcategory ? ` • <span style="color:var(--admin-primary); font-weight:600;">${p.subcategory}</span>` : ''}
            </div>
          </td>
          <td>
            <span style="font-size:0.72rem; background:#f1f5f9; padding:2px 7px; border-radius:12px; font-weight:700; color:#334155; text-transform:uppercase;">
              ${deptName}
            </span>
            <div style="font-size:0.78rem; color:#64748b; margin-top:3px;">${p.category_name || '-'}</div>
          </td>
          <td style="font-weight:700; color:#1e293b;">${formatPrice(p.price)}</td>
          <td>
            <div class="stock-control-col">
              <span class="stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}" id="stock-pill-${p.id}">
                ${isInStock ? (isLowStock ? `⚠️ Low (${p.stock})` : `🟢 In Stock (${p.stock})`) : `🔴 Out of Stock (0)`}
              </span>
              <div class="compact-stock-stepper" title="Fast click +/- to adjust stock">
                <button type="button" class="stepper-btn" onclick="quickAdjustStock('${p.id}', -1)" title="Reduce 1">−</button>
                <span class="stepper-val" id="stock-val-${p.id}">${p.stock}</span>
                <button type="button" class="stepper-btn" onclick="quickAdjustStock('${p.id}', 1)" title="Add 1">+</button>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; gap:6px; align-items:center;">
              <button onclick="toggleProductStock('${p.id}', ${p.stock})"
                id="stock-toggle-btn-${p.id}"
                class="btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}"
                style="padding:5px 9px; font-size:0.75rem; font-weight:700; white-space:nowrap;"
                title="${isInStock ? 'Click to mark product as Out of Stock' : 'Click to mark product as In Stock'}">
                ${isInStock ? 'Mark Out 🚫' : 'Mark In ✅'}
              </button>
              <button onclick="quickUpdateStockPrompt('${p.id}', ${p.stock})"
                style="padding:5px 8px; border:1px solid #cbd5e1; border-radius:4px; background:#fff; cursor:pointer; font-size:0.75rem; color:#475569;"
                title="Edit exact stock quantity">
                ✏️ Qty
              </button>
            </div>
          </td>
          <td>
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${p.active ? '#10b981' : '#94a3b8'}; margin-right:4px;"></span>
            <span style="font-size:0.8rem; font-weight:600; color:${p.active ? '#047857' : '#64748b'};">${p.active ? 'Active' : 'Hidden'}</span>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button onclick="openEditProductModal('${p.id}')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">Edit</button>
              <button onclick="deleteProduct('${p.id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching admin products:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Error loading products. Please try again.</td></tr>`;
  }
}

// 1-Click Quick Toggle: In Stock <-> Out of Stock (Instant Optimistic UI)
async function toggleProductStock(productId, currentStock) {
  const p = currentProducts.find(item => item.id === productId);
  const currentVal = p ? p.stock : currentStock;
  const newStock = currentVal > 0 ? 0 : 15;
  if (p) p.stock = newStock;

  // In-place instant DOM update
  const valEl = document.getElementById(`stock-val-${productId}`);
  if (valEl) valEl.textContent = newStock;

  const pillEl = document.getElementById(`stock-pill-${productId}`);
  const toggleBtn = document.getElementById(`stock-toggle-btn-${productId}`);
  const isInStock = newStock > 0;
  const isLowStock = newStock > 0 && newStock <= 4;

  if (pillEl) {
    pillEl.className = `stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}`;
    pillEl.innerHTML = isInStock ? (isLowStock ? `⚠️ Low (${newStock})` : `🟢 In Stock (${newStock})`) : `🔴 Out of Stock (0)`;
  }
  if (toggleBtn) {
    toggleBtn.className = `btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}`;
    toggleBtn.textContent = isInStock ? 'Mark Out 🚫' : 'Mark In ✅';
  }

  // Update summary counts
  const summaryEl = document.getElementById('admin-product-count-summary');
  if (summaryEl && currentProducts) {
    const inStockCount = currentProducts.filter(item => item.stock > 0).length;
    const outStockCount = currentProducts.filter(item => item.stock <= 0).length;
    summaryEl.innerHTML = `Showing <strong>${currentProducts.length}</strong> items (${inStockCount} In Stock, <span style="color:#ef4444;">${outStockCount} Out of Stock</span>)`;
  }

  // Sync to Express API
  try {
    await fetch(`${API_BASE}/admin/products/${productId}/toggle-stock`, { method: 'PATCH' });
  } catch (_) {}

  // Sync to Cloud Firestore
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      await db.collection('products').doc(String(productId)).set({
        stock: newStock,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore stock sync err:', fsErr);
    }
  }

  // Sync to localStorage
  try {
    const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
    const existingIdx = customLocal.findIndex(p => String(p.id) === String(productId));
    if (existingIdx >= 0) {
      customLocal[existingIdx].stock = newStock;
    } else {
      customLocal.push({ id: productId, stock: newStock });
    }
    localStorage.setItem('rjfc_custom_products', JSON.stringify(customLocal));
  } catch (_) {}

  showToast(newStock > 0 ? 'Product marked In Stock ✅' : 'Product marked Out of Stock 🚫', newStock > 0 ? 'success' : 'info');
  loadDashboardStats();
}

function updateImagePreview(url) {
  const preview = document.getElementById('prod-image-preview');
  if (!preview) return;
  if (url && url.trim()) {
    preview.src = url.trim();
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

// Client-side image compression for blazing fast uploads & sub-100KB Firestore documents
function compressImageFile(file, maxWidth = 1000, maxHeight = 1000, quality = 0.78) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve({ blob: file, dataUrl: null });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve({ blob: file, dataUrl: null });
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve({ blob: file, dataUrl: e.target.result });
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ blob: file, dataUrl: e.target.result });
            return;
          }
          const reader2 = new FileReader();
          reader2.onloadend = () => {
            resolve({ blob, dataUrl: reader2.result });
          };
          reader2.readAsDataURL(blob);
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleProductImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const statusEl = document.getElementById('prod-upload-status');
  if (statusEl) {
    statusEl.textContent = '⏳ Optimizing image...';
    statusEl.style.color = '#0284c7';
  }

  // Compress image client-side to ensure it is always under 100KB
  let fileToUpload = file;
  let compressedDataUrl = null;
  try {
    const compressed = await compressImageFile(file);
    if (compressed.blob) fileToUpload = compressed.blob;
    if (compressed.dataUrl) compressedDataUrl = compressed.dataUrl;
  } catch (_) {}

  if (statusEl) {
    statusEl.textContent = '⏳ Uploading image to cloud...';
  }

  // 1. Try Express API if server is running locally
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        document.getElementById('prod-form-image').value = data.url;
        updateImagePreview(data.url);
        if (statusEl) {
          statusEl.textContent = '✅ Image uploaded successfully!';
          statusEl.style.color = '#15803d';
        }
        showToast('Image uploaded successfully', 'success');
        input.value = '';
        return;
      }
    }
  } catch (_) {}

  // 2. Direct Cloud Storage Upload (Production Firebase Hosting)
  try {
    if (typeof firebase !== 'undefined' && firebase.storage) {
      if (statusEl) statusEl.textContent = '☁️ Uploading to Firebase Cloud Storage...';
      const storage = firebase.storage();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = storage.ref(`products/${Date.now()}_${cleanFileName}`);
      const uploadTask = await storageRef.put(file, { contentType: file.type || 'image/jpeg' });
      const downloadUrl = await uploadTask.ref.getDownloadURL();
      if (downloadUrl) {
        document.getElementById('prod-form-image').value = downloadUrl;
        updateImagePreview(downloadUrl);
        if (statusEl) {
          statusEl.textContent = '✅ Image uploaded to Cloud Storage!';
          statusEl.style.color = '#15803d';
        }
        showToast('Image uploaded successfully to Cloud Storage!', 'success');
        input.value = '';
        return;
      }
    }
  } catch (storageErr) {
    console.warn('Firebase Storage upload error:', storageErr);
  }

  // 3. Fallback: Local Data URL (compressed) so uploading never blocks admin
  try {
    const dataUrl = compressedDataUrl || (await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(fileToUpload);
    }));
    document.getElementById('prod-form-image').value = dataUrl;
    updateImagePreview(dataUrl);
    if (statusEl) {
      statusEl.textContent = '✅ Image ready (optimized)!';
      statusEl.style.color = '#15803d';
    }
    showToast('Image optimized & ready', 'success');
    input.value = '';
    return;
  } catch (readErr) {
    if (statusEl) {
      statusEl.textContent = '❌ Failed to read image file';
      statusEl.style.color = '#dc2626';
    }
    showToast('Failed to read image file', 'error');
  } finally {
    input.value = '';
  }
}

// Modal In-Stock vs Out-of-Stock Radio Handlers
function handleModalStockStatusChange(isInStock) {
  const stockInput = document.getElementById('prod-form-stock');
  const hintEl = document.getElementById('prod-stock-status-hint');
  if (isInStock) {
    if (Number(stockInput.value) <= 0) stockInput.value = 15;
    if (hintEl) {
      hintEl.textContent = '✓ Product will show as AVAILABLE for shopping';
      hintEl.style.color = '#15803d';
    }
  } else {
    stockInput.value = 0;
    if (hintEl) {
      hintEl.textContent = '⚠️ Product marked OUT OF STOCK on website (Buy buttons disabled)';
      hintEl.style.color = '#dc2626';
    }
  }
}

function handleModalStockInput(val) {
  const num = Number(val);
  const inRadio = document.getElementById('stock-radio-in');
  const outRadio = document.getElementById('stock-radio-out');
  const hintEl = document.getElementById('prod-stock-status-hint');

  if (num > 0) {
    if (inRadio) inRadio.checked = true;
    if (hintEl) {
      hintEl.textContent = `✓ Product will show as AVAILABLE (${num} units in stock)`;
      hintEl.style.color = '#15803d';
    }
  } else {
    if (outRadio) outRadio.checked = true;
    if (hintEl) {
      hintEl.textContent = '⚠️ Product marked OUT OF STOCK on website (Buy buttons disabled)';
      hintEl.style.color = '#dc2626';
    }
  }
}

function openAddProductModal() {
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('prod-form-id').value = '';
  document.getElementById('prod-form-department').value = 'women';
  document.getElementById('prod-form-subcategory').value = '';
  document.getElementById('prod-form-stock').value = 15;
  const skuAddEl = document.getElementById('prod-form-sku');
  if (skuAddEl) skuAddEl.value = 'RJ-' + Math.floor(1000 + Math.random() * 9000);
  const sizesAddEl = document.getElementById('prod-form-sizes');
  if (sizesAddEl) sizesAddEl.value = 'S, M, L, XL, XXL';
  const colorsAddEl = document.getElementById('prod-form-colors');
  if (colorsAddEl) colorsAddEl.value = '';
  document.getElementById('stock-radio-in').checked = true;
  handleModalStockStatusChange(true);
  updateImagePreview('');
  const statusEl = document.getElementById('prod-upload-status');
  if (statusEl) statusEl.textContent = '';
  populateCategorySelect('prod-form-category');
  document.getElementById('product-modal').classList.add('active');
}

function openEditProductModal(id) {
  const p = currentProducts.find(item => item.id === id);
  if (!p) return;

  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('prod-form-id').value = p.id;
  document.getElementById('prod-form-name').value = p.name;
  document.getElementById('prod-form-department').value = p.department || 'women';
  document.getElementById('prod-form-subcategory').value = p.subcategory || '';
  document.getElementById('prod-form-price').value = p.price;
  document.getElementById('prod-form-orig-price').value = p.original_price;
  document.getElementById('prod-form-stock').value = p.stock;
  const skuEditEl = document.getElementById('prod-form-sku');
  if (skuEditEl) skuEditEl.value = p.sku || '';
  const sizesEditEl = document.getElementById('prod-form-sizes');
  if (sizesEditEl) sizesEditEl.value = p.sizes || '';
  const colorsEditEl = document.getElementById('prod-form-colors');
  if (colorsEditEl) colorsEditEl.value = p.colors || '';

  if (p.stock > 0) {
    document.getElementById('stock-radio-in').checked = true;
    handleModalStockInput(p.stock);
  } else {
    document.getElementById('stock-radio-out').checked = true;
    handleModalStockStatusChange(false);
  }

  document.getElementById('prod-form-image').value = p.image;
  updateImagePreview(p.image);
  const statusEl = document.getElementById('prod-upload-status');
  if (statusEl) statusEl.textContent = '';
  document.getElementById('prod-form-brand').value = p.brand || 'RJ Collection';
  document.getElementById('prod-form-desc').value = p.description || '';
  document.getElementById('prod-form-material').value = p.material || '';
  document.getElementById('prod-form-pattern').value = p.pattern || '';
  document.getElementById('prod-form-care').value = p.care_instructions || '';
  document.getElementById('prod-form-active').checked = p.active === 1;
  document.getElementById('prod-form-featured').checked = p.featured === 1;
  document.getElementById('prod-form-new').checked = p.new_arrival === 1;

  populateCategorySelect('prod-form-category', p.category_id);
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const idInput = document.getElementById('prod-form-id').value;
  const isEditing = !!idInput;

  const catSelect = document.getElementById('prod-form-category');
  const catName = catSelect && catSelect.options[catSelect.selectedIndex] ? catSelect.options[catSelect.selectedIndex].text : '';

  const prodId = isEditing ? (isNaN(idInput) ? idInput : Number(idInput)) : Date.now();

  const payload = {
    id: prodId,
    name: document.getElementById('prod-form-name').value.trim(),
    department: document.getElementById('prod-form-department').value,
    subcategory: document.getElementById('prod-form-subcategory').value.trim(),
    category_id: Number(catSelect?.value) || 1,
    category_name: catName,
    price: Number(document.getElementById('prod-form-price').value),
    original_price: Number(document.getElementById('prod-form-orig-price').value) || Number(document.getElementById('prod-form-price').value),
    stock: Number(document.getElementById('prod-form-stock').value),
    sku: document.getElementById('prod-form-sku')?.value?.trim() || '',
    sizes: document.getElementById('prod-form-sizes')?.value?.trim() || '',
    colors: document.getElementById('prod-form-colors')?.value?.trim() || '',
    image: document.getElementById('prod-form-image').value.trim() || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    brand: document.getElementById('prod-form-brand').value.trim() || 'RJ Collection',
    description: document.getElementById('prod-form-desc').value.trim(),
    material: document.getElementById('prod-form-material').value.trim(),
    pattern: document.getElementById('prod-form-pattern').value.trim(),
    care_instructions: document.getElementById('prod-form-care').value.trim(),
    active: document.getElementById('prod-form-active').checked ? 1 : 0,
    featured: document.getElementById('prod-form-featured').checked ? 1 : 0,
    new_arrival: document.getElementById('prod-form-new').checked ? 1 : 0,
    updated_at: new Date().toISOString()
  };

  let savedSuccessfully = false;

  // 1. Try Express API
  try {
    const url = isEditing ? `${API_BASE}/admin/products/${prodId}` : `${API_BASE}/admin/products`;
    const method = isEditing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) savedSuccessfully = true;
    }
  } catch (_) {}

  // 2. Direct Cloud Firestore Save (Production Firebase Hosting)
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      // Check auth state
      const authUser = firebase.auth && firebase.auth().currentUser;
      if (!authUser && !window.__dev_mode) {
        // If not signed in to Firebase Auth, prompt sign in
        showToast('⚠️ Please sign in to your Super Admin account to save to live Firestore.', 'error');
        showAdminLoginScreen();
        return;
      }

      const db = firebase.firestore();
      await db.collection('products').doc(String(prodId)).set({
        ...payload,
        active: payload.active === 1 || payload.active === true,
        featured: payload.featured === 1 || payload.featured === true,
        new_arrival: payload.new_arrival === 1 || payload.new_arrival === true
      }, { merge: true });
      savedSuccessfully = true;
    } catch (fsErr) {
      console.error('Firestore product write error:', fsErr);
      showToast('Firestore Error: ' + (fsErr.message || 'Permission denied'), 'error');
      // Do not silently pretend it succeeded if Firestore failed
      return;
    }
  }

  // 3. Fallback: Save to LocalStorage cache
  try {
    const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
    const existingIdx = customLocal.findIndex(p => String(p.id) === String(prodId));
    if (existingIdx >= 0) {
      customLocal[existingIdx] = { ...customLocal[existingIdx], ...payload };
    } else {
      customLocal.unshift(payload);
    }
    localStorage.setItem('rjfc_custom_products', JSON.stringify(customLocal));
    savedSuccessfully = true;
  } catch (_) {}

  if (savedSuccessfully) {
    showToast(isEditing ? 'Product updated successfully! ✅' : 'Product added successfully! 🎉', 'success');
    closeProductModal();
    loadAdminProducts();
    loadDashboardStats();
  } else {
    showToast('Failed to save product. Please try again.', 'error');
  }
}

async function quickUpdateStockPrompt(productId, currentStock) {
  const newStock = prompt(`Update Stock Quantity for Product #${productId}:`, currentStock);
  if (newStock !== null && !isNaN(newStock)) {
    const num = Number(newStock);
    if (num < 0) {
      showToast('Stock quantity cannot be negative', 'error');
      return;
    }

    // 1. Try Express API
    try {
      await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: num })
      });
    } catch (_) {}

    // 2. Try Firestore
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        await db.collection('products').doc(String(productId)).set({
          stock: num,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore stock prompt err:', fsErr);
      }
    }

    // 3. LocalStorage
    try {
      const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
      const existingIdx = customLocal.findIndex(p => String(p.id) === String(productId));
      if (existingIdx >= 0) {
        customLocal[existingIdx].stock = num;
      } else {
        customLocal.push({ id: productId, stock: num });
      }
      localStorage.setItem('rjfc_custom_products', JSON.stringify(customLocal));
    } catch (_) {}

    showToast('Stock quantity updated to ' + num, 'success');
    loadAdminProducts();
    loadDashboardStats();
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to permanently remove this product from the catalog?')) return;
  
  // 1. Try Express API
  try {
    await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' });
  } catch (_) {}

  // 2. Direct Cloud Firestore Delete
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      await db.collection('products').doc(String(id)).delete();
    } catch (fsErr) {
      console.warn('Firestore delete product err:', fsErr);
    }
  }

  // 3. LocalStorage Cache
  try {
    let customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
    customLocal = customLocal.filter(p => String(p.id) !== String(id));
    localStorage.setItem('rjfc_custom_products', JSON.stringify(customLocal));
  } catch (_) {}

  showToast('Product removed from catalog', 'info');
  loadAdminProducts();
  loadDashboardStats();
}

// 3. Admin Orders
let adminOrdersSearchTimeout = null;
function debounceAdminOrdersFilter() {
  clearTimeout(adminOrdersSearchTimeout);
  adminOrdersSearchTimeout = setTimeout(() => {
    loadAdminOrders();
  }, 250);
}

function resetAdminOrderFilters() {
  const searchInput = document.getElementById('admin-orders-search');
  const statusSelect = document.getElementById('admin-orders-filter-status');
  if (searchInput) searchInput.value = '';
  if (statusSelect) statusSelect.value = 'All';
  loadAdminOrders();
}

async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  const statusFilter = document.getElementById('admin-orders-filter-status')?.value || 'All';
  const searchTerm = document.getElementById('admin-orders-search')?.value.trim().toLowerCase() || '';
  const summaryEl = document.getElementById('admin-orders-count-summary');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Loading customer orders...</td></tr>`;

  try {
    // 1. Pull live Cloud Firestore orders first if signed into Firebase Auth
    if (!window._firestoreOrdersLoaded && typeof firebase !== 'undefined' && firebase.firestore && firebase.auth && firebase.auth().currentUser) {
      try {
        const snap = await firebase.firestore().collection('orders').get();
        const fsOrders = [];
        snap.forEach(doc => fsOrders.push({ id: doc.id, firestoreId: doc.id, ...doc.data() }));
        fsOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        window._firestoreOrders = fsOrders;
        window._firestoreOrdersLoaded = true;
      } catch (fsErr) {
        console.warn('[Firestore Admin Orders]', fsErr && fsErr.message ? fsErr.message : fsErr);
      }
    }

    // 2. Fetch from unified real-time store (Firestore + non-seed local)
    let ordersList = fetchAllOrdersRealtime();

    // 3. Also try API if available
    if (!window.isStaticHosting) {
      try {
        const url = statusFilter !== 'All' ? `${API_BASE}/admin/orders?status=${encodeURIComponent(statusFilter)}` : `${API_BASE}/admin/orders`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
            ordersList = data.orders;
          }
        }
      } catch (_) {}
    }

    // Apply Client-Side Search Filter
    if (searchTerm) {
      ordersList = ordersList.filter(o => 
        (o.order_number && o.order_number.toLowerCase().includes(searchTerm)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(searchTerm)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(searchTerm)) ||
        (o.delivery_address && o.delivery_address.toLowerCase().includes(searchTerm)) ||
        (o.shipping_address && o.shipping_address.toLowerCase().includes(searchTerm))
      );
    }

    if (statusFilter !== 'All') {
      ordersList = ordersList.filter(o => (o.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    currentOrders = ordersList;

    if (summaryEl) {
      const totalRev = ordersList.reduce((acc, o) => acc + Number(o.total || 0), 0);
      summaryEl.innerHTML = `Showing <strong>${ordersList.length}</strong> orders (Total Value: <strong>${formatPrice(totalRev)}</strong>)`;
    }

    if (currentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No orders found matching the filter criteria.</td></tr>`;
      return;
    }

    const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    tbody.innerHTML = currentOrders.map(o => {
      const safeOrderNum = escapeHtml(o.order_number || '');
      const safeName = escapeHtml(o.customer_name || 'Customer');
      const safePhone = escapeHtml(o.customer_phone || '');
      const safeEmail = escapeHtml(o.customer_email || '');
      const cleanPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent(`Hello ${o.customer_name}! Thank you for shopping with RJ Fashion Collection. We are updating you regarding your order #${o.order_number} (Status: ${o.status}). Total: ${formatPrice(o.total)}. Let us know if you need assistance!`);
      const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${waMsg}` : `https://wa.me/917894093586?text=${waMsg}`;

      const payMethod = o.payment_method || 'Online';
      const payStatus = o.payment_status || (payMethod.toLowerCase().includes('cash') ? 'Pay on Delivery' : 'Pending');
      const isPaid = payStatus === 'Paid';
      const isCancelled = (o.status || '').toLowerCase() === 'cancelled';
      const isCod = payMethod.toLowerCase().includes('cash');
      const orderRefId = o.order_number || String(o.id || '');
      const payBadgeHtml = isPaid
        ? `<span style="display:inline-block; margin-top:3px; padding:2px 7px; font-size:0.7rem; font-weight:700; border-radius:999px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;">✓ Paid</span>`
        : (isCod
          ? `<span style="display:inline-block; margin-top:3px; padding:2px 7px; font-size:0.7rem; font-weight:700; border-radius:999px; background:#f1f5f9; color:#475569;">COD</span>`
          : `<span style="display:inline-block; margin-top:3px; padding:2px 7px; font-size:0.7rem; font-weight:700; border-radius:999px; background:#fef3c7; color:#b45309; border:1px solid #fde68a;">⏳ Pending</span>`);

      return `
        <tr>
          <td style="font-weight:700; color:var(--admin-primary);">${safeOrderNum}</td>
          <td>
            <div style="font-weight:700; color:#1e293b;">${safeName}</div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
              ${safePhone ? `📞 ${safePhone}` : ''}
              ${safeEmail ? ` • ${safeEmail}` : ''}
            </div>
            <div style="margin-top: 4px;">
              <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" title="Send WhatsApp order update to customer">
                <span>💬</span> WhatsApp
              </a>
            </div>
          </td>
          <td>${o.created_at ? escapeHtml(new Date(o.created_at).toLocaleDateString()) : 'Today'}</td>
          <td style="font-weight:700; color:#1e293b;">${formatPrice(o.total)}</td>
          <td>
            <div style="font-size:0.78rem; font-weight:600; color:#475569;">${escapeHtml(payMethod)}</div>
            <div>${payBadgeHtml}</div>
            ${(!isPaid && !isCod && !isCancelled && orderRefId) ? `
              <button onclick="confirmOrderPaymentReceived('${escapeHtml(orderRefId)}')" style="margin-top:5px; padding:4px 8px; font-size:0.72rem; font-weight:700; border:none; border-radius:5px; background:#047857; color:#ffffff; cursor:pointer;" title="Mark UPI/Online payment as received in your bank account & confirm customer order automatically">
                ✓ Confirm Payment
              </button>
            ` : ''}
          </td>
          <td>
            <select onchange="updateOrderStatus('${escapeHtml(String(o.order_number || o.id))}', this.value)" style="padding:5px 8px; font-size:0.8rem; border-radius:6px; border:1px solid #cbd5e1; font-weight:700; background:#fff; cursor:pointer;">
              ${statuses.map(st => `<option value="${st}" ${o.status === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button onclick="viewOrderModal('${escapeHtml(String(o.order_number || o.id))}')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;" title="View ordered items">View</button>
              <button onclick="openPrintOrderInvoice('${escapeHtml(String(o.order_number || o.id))}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" title="Print Packing Slip / Branded Invoice">🖨️ Invoice</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">Failed to load orders.</td></tr>`;
  }
}

async function confirmOrderPaymentReceived(orderNumber) {
  if (!orderNumber) return;
  let updated = false;
  const nowIso = new Date().toISOString();

  // 1. Update Cloud Firestore immediately (syncs automatically to customer's /payment and /orders UI!)
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth && firebase.auth().currentUser) {
      await firebase.firestore().collection('orders').doc(String(orderNumber)).set({
        payment_status: 'Paid',
        status: 'Confirmed',
        payment_verified_by: 'admin_firebase',
        verified_at: nowIso,
        updated_at: nowIso
      }, { merge: true });
      updated = true;
    }
  } catch (fsErr) {
    showToast('Firestore error: ' + (fsErr && fsErr.message ? fsErr.message : 'Permission denied'), 'error');
    return;
  }

  // 2. Update local cache & localStorage
  if (Array.isArray(window._firestoreOrders)) {
    const fMatch = window._firestoreOrders.find(o => o.order_number === orderNumber || String(o.id) === String(orderNumber));
    if (fMatch) {
      fMatch.payment_status = 'Paid';
      fMatch.status = 'Confirmed';
      fMatch.updated_at = nowIso;
    }
  }
  try {
    let orders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    const match = orders.find(o => String(o.order_number) === String(orderNumber) || String(o.id) === String(orderNumber));
    if (match) {
      match.payment_status = 'Paid';
      match.status = 'Confirmed';
      match.updated_at = nowIso;
      localStorage.setItem('rj_orders', JSON.stringify(orders));
      updated = true;
    }
  } catch (_) {}

  // 3. Also notify backend API if online
  if (!window.isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'Paid', status: 'Confirmed' })
      });
      if (res.ok) updated = true;
    } catch (_) {}
  }

  if (updated) {
    showToast(`✓ Payment marked Received for #${orderNumber}! Customer account confirmed automatically.`, 'success');
    loadDashboardStats();
    loadAdminOrders();
  } else {
    showToast('Could not confirm payment. Check Firebase Admin sign-in.', 'error');
  }
}
window.confirmOrderPaymentReceived = confirmOrderPaymentReceived;

async function updateOrderStatus(orderId, newStatus) {
  let updated = false;
  const nowIso = new Date().toISOString();

  // 1. Update Cloud Firestore directly when signed in as Super Admin
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth && firebase.auth().currentUser) {
      await firebase.firestore().collection('orders').doc(String(orderId)).update({
        status: newStatus,
        updated_at: nowIso
      });
      updated = true;
    }
  } catch (fsErr) {
    console.warn('[Firestore] Order status update notice:', fsErr && fsErr.message ? fsErr.message : fsErr);
  }

  // 2. Update in local cache & storage
  if (Array.isArray(window._firestoreOrders)) {
    const fMatch = window._firestoreOrders.find(o => String(o.order_number) === String(orderId) || String(o.id) === String(orderId));
    if (fMatch) {
      fMatch.status = newStatus;
      fMatch.updated_at = nowIso;
      updated = true;
    }
  }
  try {
    let orders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    const match = orders.find(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
    if (match) {
      match.status = newStatus;
      match.updated_at = nowIso;
      localStorage.setItem('rj_orders', JSON.stringify(orders));
      updated = true;
    }
  } catch (_) {}

  // 3. Also try API
  if (!window.isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) updated = true;
      }
    } catch (_) {}
  }

  if (updated) {
    showToast(`Order status updated to "${newStatus}"`, 'success');
    loadDashboardStats();
    if (document.getElementById('pane-orders')?.style.display !== 'none') {
      loadAdminOrders();
    }
  } else {
    showToast('Failed to update status', 'error');
  }
}

function viewOrderModal(orderId) {
  const o = currentOrders.find(ord => String(ord.id) === String(orderId) || String(ord.order_number) === String(orderId));
  if (!o) return;

  const cleanPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
  const waMsg = encodeURIComponent(`Hello ${o.customer_name}! Thank you for shopping with RJ Fashion Collection. We are updating you regarding your order #${o.order_number} (Status: ${o.status}).`);
  const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${waMsg}` : `https://wa.me/917894093586?text=${waMsg}`;

  const content = document.getElementById('order-detail-modal-body');
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
      <div>
        <div style="font-size:1.2rem; font-weight:800; color:var(--admin-primary);">${o.order_number}</div>
        <div style="font-size:0.85rem; color:#475569; margin-top:2px;">Customer: <strong>${o.customer_name}</strong></div>
        <div style="font-size:0.82rem; color:#64748b;">Phone: <strong>${o.customer_phone || 'N/A'}</strong> | Email: ${o.customer_email || 'N/A'}</div>
        <div style="font-size:0.82rem; color:#64748b; margin-top:4px;">Address: ${o.delivery_address || 'Standard Address'}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" style="padding:6px 12px; font-size:0.82rem;">
          <span>💬</span> WhatsApp Buyer
        </a>
        <button onclick="openPrintOrderInvoice('${o.id}')" class="btn btn-primary" style="padding:6px 12px; font-size:0.82rem;">
          <span>🖨️</span> Invoice (PDF / Print)
        </button>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:16px;">
      <thead>
        <tr style="border-bottom:1px solid #e2e8f0; text-align:left; background:#f8fafc;">
          <th style="padding:8px 10px;">Item</th>
          <th style="padding:8px 10px;">Size</th>
          <th style="padding:8px 10px; text-align:center;">Qty</th>
          <th style="padding:8px 10px; text-align:right;">Price</th>
          <th style="padding:8px 10px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(o.items && o.items.length > 0 ? o.items : [{ product_name: 'RJ Fashion Collection', quantity: 1, price: o.total, total: o.total }]).map(it => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 10px; font-weight:600;">${it.product_name}</td>
            <td style="padding:8px 10px;">${it.size || '-'}</td>
            <td style="padding:8px 10px; text-align:center;">${it.quantity || 1}</td>
            <td style="padding:8px 10px; text-align:right;">${formatPrice(it.price || it.total)}</td>
            <td style="padding:8px 10px; text-align:right; font-weight:700;">${formatPrice(it.total || it.price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:6px; border:1px solid #e2e8f0;">
      <div>
        <span style="font-size:0.82rem; color:#64748b;">Payment Method: <strong>${o.payment_method || 'Online'}</strong></span> • 
        <span style="font-size:0.82rem; color:#64748b;">Current Status: <strong>${o.status}</strong></span>
      </div>
      <div style="font-size:1.1rem; font-weight:800; color:#1e293b;">
        Grand Total: <span style="color:var(--admin-primary);">${formatPrice(o.total)}</span>
      </div>
    </div>
  `;

  document.getElementById('order-detail-modal').classList.add('active');
}

// 4. Admin Customers
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Loading registered customers...</td></tr>`;

  try {
    const deletedList = JSON.parse(localStorage.getItem('rj_deleted_customers') || '[]');

    let customers = [];
    if (!window.isStaticHosting) {
      try {
        const res = await fetch(`${API_BASE}/admin/customers`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.customers) && data.customers.length > 0) {
            customers = data.customers;
          }
        }
      } catch (_) {}
    }

    // Fallback: If static hosting or API offline, fetch /data/customers.json
    if (!customers || customers.length === 0) {
      try {
        const cRes = await fetch('/data/customers.json');
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.customers && Array.isArray(cData.customers)) {
            customers = cData.customers;
          }
        }
      } catch (_) {}
    }

    // Merge any real customers from unified orders (Cloud Firestore + local)
    const localOrders = fetchAllOrdersRealtime();
    const customerMap = new Map();
    
    (customers || []).forEach(c => {
      const em = (c.email || '').toLowerCase();
      if (!deletedList.includes(em)) {
        customerMap.set(em, { ...c });
      }
    });

    localOrders.forEach(o => {
      const email = (o.customer_email || o.email || '').toLowerCase();
      if (!email || deletedList.includes(email)) return;
      if (customerMap.has(email)) {
        const existing = customerMap.get(email);
        existing.order_count = (existing.order_count || 1) + 1;
        existing.total_spent = (existing.total_spent || 0) + Number(o.total || 0);
      } else {
        customerMap.set(email, {
          id: 'cust-' + Date.now(),
          name: o.customer_name || o.name || 'Valued Customer',
          email: email,
          phone: o.customer_phone || o.phone || '+91 98765 43210',
          created_at: o.created_at || new Date().toISOString(),
          order_count: 1,
          total_spent: Number(o.total || 0)
        });
      }
    });

    const finalCustomers = Array.from(customerMap.values());

    if (finalCustomers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No registered customers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = finalCustomers.map(c => `
      <tr>
        <td style="font-weight:600; color:#1e293b;">${c.name}</td>
        <td><a href="mailto:${c.email}" style="color:var(--admin-primary); text-decoration:none; font-weight:500;">${c.email}</a></td>
        <td>${c.phone || '-'}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td><span style="font-weight:600; background:#f1f5f9; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${c.order_count} orders</span></td>
        <td style="font-weight:700; color:#1e293b;">${formatPrice(c.total_spent)}</td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button onclick="openCustomerOrdersModal('${c.email}', '${(c.name || '').replace(/'/g, "\\'")}')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;" title="View all orders by this customer">
              Orders
            </button>
            <button onclick="deleteCustomer('${c.email}', ${c.id ? `'${c.id}'` : 'null'})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;" title="Remove this customer record">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error in loadAdminCustomers:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">Customer records will automatically populate as orders are placed.</td></tr>`;
  }
}

async function deleteCustomer(email, id) {
  if (!confirm(`Are you sure you want to remove customer record (${email})?`)) return;

  try {
    await fetch(`${API_BASE}/admin/customers/${id || encodeURIComponent(email)}`, { method: 'DELETE' });
  } catch (_) {}

  // Track deleted customers in localStorage so they stay deleted on Firebase static hosting
  const deletedList = JSON.parse(localStorage.getItem('rj_deleted_customers') || '[]');
  const normEmail = (email || '').toLowerCase();
  if (!deletedList.includes(normEmail)) {
    deletedList.push(normEmail);
    localStorage.setItem('rj_deleted_customers', JSON.stringify(deletedList));
  }

  // Remove corresponding orders from localStorage if any
  try {
    let orders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    orders = orders.filter(o => (o.customer_email || o.email || '').toLowerCase() !== normEmail);
    localStorage.setItem('rj_orders', JSON.stringify(orders));
  } catch (_) {}

  showToast('Customer record deleted successfully', 'info');
  loadAdminCustomers();
}

// 5. Admin Categories
async function loadCategoriesList() {
  try {
    let cats = null;
    if (!window.isStaticHosting) {
      try {
        const res = await fetch(`${API_BASE}/admin/categories`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories)) cats = data.categories;
        }
      } catch (_) {}
    }

    if (!cats || cats.length === 0) {
      const savedCats = localStorage.getItem('rj_custom_categories');
      if (savedCats) {
        try { cats = JSON.parse(savedCats); } catch (_) {}
      }
    }

    if (!cats || cats.length === 0) {
      try {
        const res = await fetch('/data/categories.json');
        if (res.ok) {
          const data = await res.json();
          cats = data.categories || [];
        }
      } catch (_) {}
    }

    if (cats) currentCategories = cats;
  } catch (err) {
    console.error('Failed to load categories list:', err);
  }
}

function populateCategorySelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Category --</option>' +
    currentCategories.map(cat => `
      <option value="${cat.id}" ${selectedId === cat.id ? 'selected' : ''}>${cat.name}</option>
    `).join('');
}

async function loadAdminCategories() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Loading categories...</td></tr>`;

  try {
    let cats = null;
    if (!window.isStaticHosting) {
      try {
        const res = await fetch(`${API_BASE}/admin/categories`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            cats = data.categories;
          }
        }
      } catch (_) {}
    }

    if (!cats || cats.length === 0) {
      const savedCats = localStorage.getItem('rj_custom_categories');
      if (savedCats) {
        try { cats = JSON.parse(savedCats); } catch (_) {}
      }
    }

    if (!cats || cats.length === 0) {
      try {
        const res = await fetch('/data/categories.json');
        if (res.ok) {
          const data = await res.json();
          cats = data.categories || [];
        }
      } catch (_) {}
    }

    currentCategories = cats || [];

    if (currentCategories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No categories found.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentCategories.map(cat => `
      <tr>
        <td>
          <img src="${cat.image}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
        </td>
        <td style="font-weight:700; color:#1e293b;">${cat.name}</td>
        <td><code>${cat.slug}</code></td>
        <td>${cat.product_count || 0} products</td>
        <td>${cat.display_order || 1}</td>
        <td>
          <button onclick="deleteCategory('${cat.id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching categories:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Error loading categories.</td></tr>`;
  }
}

function openAddCategoryModal() {
  document.getElementById('category-form').reset();
  document.getElementById('category-modal').classList.add('active');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('active');
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('cat-form-name').value.trim();
  const image = document.getElementById('cat-form-image').value.trim();
  const description = document.getElementById('cat-form-desc').value.trim();
  const display_order = Number(document.getElementById('cat-form-order').value) || (currentCategories.length + 1);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = {
    id: Date.now(),
    name,
    slug,
    image: image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=500&q=80',
    description,
    display_order,
    product_count: 0,
    active: 1
  };

  try {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image, description, display_order, active: 1 })
    });
    if (res.ok) {
      showToast('Category added successfully', 'success');
      closeCategoryModal();
      loadAdminCategories();
      loadCategoriesList();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  currentCategories.push(newCat);
  localStorage.setItem('rj_custom_categories', JSON.stringify(currentCategories));
  showToast('Category added successfully', 'success');
  closeCategoryModal();
  loadAdminCategories();
  loadCategoriesList();
}

async function deleteCategory(id) {
  const assigned = (currentProducts || []).filter(p => Number(p.category_id) === Number(id));
  if (assigned.length > 0) {
    showToast(`Cannot delete category: ${assigned.length} active products are currently assigned to it. Please reassign or delete them first.`, 'error');
    return;
  }
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Category deleted', 'info');
      loadAdminCategories();
      loadCategoriesList();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  currentCategories = currentCategories.filter(c => c.id !== id);
  localStorage.setItem('rj_custom_categories', JSON.stringify(currentCategories));
  showToast('Category deleted', 'info');
  loadAdminCategories();
  loadCategoriesList();
}

// 6. Admin Banners
let adminBanners = [];

async function loadAdminBanners() {
  const tbody = document.getElementById('admin-banners-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Loading promotional banners...</td></tr>`;

  try {
    let banners = null;
    if (!window.isStaticHosting) {
      try {
        const res = await fetch(`${API_BASE}/admin/banners`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
            banners = data.banners;
          }
        }
      } catch (_) {}
    }

    if (!banners || banners.length === 0) {
      const savedBanners = localStorage.getItem('rj_custom_banners');
      if (savedBanners) {
        try { banners = JSON.parse(savedBanners); } catch (_) {}
      }
    }

    if (!banners || banners.length === 0) {
      try {
        const bRes = await fetch('/data/banners.json');
        if (bRes.ok) {
          const bData = await bRes.json();
          banners = bData.banners || [];
        }
      } catch (_) {}
    }

    if (!banners || banners.length === 0) {
      banners = [
        {
          id: 1,
          title: "Discover Your Style",
          subtitle: "Elegant Fashion for Every Occasion • Pure Kanjivaram Silks & Kundan",
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html",
          active: 1
        },
        {
          id: 2,
          title: "Bridal & Heritage Kundan Jewelry",
          subtitle: "Royal Temple & Royal Polki sets for extraordinary moments",
          image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html?category=jewelry",
          active: 1
        },
        {
          id: 3,
          title: "Festive Lehenga & Anarkali Cholis",
          subtitle: "Exquisite zari, sequins & velvet embroidery crafted to perfection",
          image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html?category=lehengas",
          active: 1
        },
        {
          id: 4,
          title: "Men's Royal Sherwanis & Kurtas",
          subtitle: "Regal bandhgalas, raw silk kurtas, and designer Nehru jackets",
          image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html?department=men",
          active: 1
        }
      ];
    }

    adminBanners = banners;

    tbody.innerHTML = adminBanners.map(b => `
      <tr>
        <td><img src="${b.image}" style="width:100px; height:50px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'"></td>
        <td style="font-weight:600; color:#1e293b;">${b.title}</td>
        <td style="color:#64748b;">${b.subtitle || '-'}</td>
        <td><code>${b.link}</code></td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; font-weight:600; color:${b.active ? '#047857' : '#64748b'};">
            <span style="width:7px; height:7px; border-radius:50%; background:${b.active ? '#10b981' : '#94a3b8'};"></span>
            ${b.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button onclick="deleteBanner('${b.id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching banners:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No banners available. Click "+ Add Banner" above.</td></tr>`;
  }
}

function openAddBannerModal() {
  document.getElementById('banner-form').reset();
  document.getElementById('banner-modal').classList.add('active');
}

function closeBannerModal() {
  document.getElementById('banner-modal').classList.remove('active');
}

async function handleBannerFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('banner-form-title').value.trim();
  const subtitle = document.getElementById('banner-form-subtitle').value.trim();
  const image = document.getElementById('banner-form-image').value.trim();
  const link = document.getElementById('banner-form-link').value.trim();
  const button_text = document.getElementById('banner-form-btn-text')?.value.trim() || 'SHOP NOW';

  const newBanner = {
    id: Date.now(),
    title,
    subtitle,
    image,
    link,
    button_text,
    active: 1
  };

  try {
    const res = await fetch(`${API_BASE}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subtitle, image, link, button_text, active: 1 })
    });
    if (res.ok) {
      showToast('Banner added successfully', 'success');
      closeBannerModal();
      loadAdminBanners();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  adminBanners.push(newBanner);
  localStorage.setItem('rj_custom_banners', JSON.stringify(adminBanners));
  showToast('Banner added successfully', 'success');
  closeBannerModal();
  loadAdminBanners();
}

async function deleteBanner(id) {
  if (!confirm('Delete this banner?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/banners/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Banner deleted', 'info');
      loadAdminBanners();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  adminBanners = adminBanners.filter(b => b.id !== id);
  localStorage.setItem('rj_custom_banners', JSON.stringify(adminBanners));
  showToast('Banner deleted', 'info');
  loadAdminBanners();
}

// Global modal close handlers
function closeOrderDetailModal() {
  document.getElementById('order-detail-modal').classList.remove('active');
}

// ===================================================================
// ADMIN ADAPTIVE VIEW MODE (MOBILE / TABLET / PC DETECTION & TOGGLE)
// ===================================================================
function initAdminMobileAdaptive() {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const isSmallScreen = window.innerWidth <= 1024;
  const savedPref = localStorage.getItem('rj_admin_view_preference');

  // Default: mobile mode if touch or screen <= 1024px, unless user explicitly chose 'desktop'
  const shouldBeMobile = savedPref ? (savedPref === 'mobile') : (isTouch || isSmallScreen);

  applyAdminViewMode(shouldBeMobile);

  window.addEventListener('resize', () => {
    if (!localStorage.getItem('rj_admin_view_preference')) {
      const isMobileNow = window.innerWidth <= 1024;
      applyAdminViewMode(isMobileNow);
    }
  }, { passive: true });
}

function applyAdminViewMode(isMobile) {
  if (document.body) {
    document.body.classList.toggle('admin-mobile-mode', isMobile);
  }
  document.documentElement.setAttribute('data-admin-view', isMobile ? 'mobile' : 'desktop');
  
  const toggleBtnText = document.getElementById('admin-view-toggle-text');
  const toggleBtnIcon = document.getElementById('admin-view-toggle-icon');
  if (toggleBtnText) toggleBtnText.textContent = isMobile ? 'Mobile UI' : 'Desktop UI';
  if (toggleBtnIcon) toggleBtnIcon.textContent = isMobile ? '📱' : '💻';
}

function toggleAdminViewMode() {
  const currentlyMobile = document.body.classList.contains('admin-mobile-mode');
  const newMode = !currentlyMobile;
  localStorage.setItem('rj_admin_view_preference', newMode ? 'mobile' : 'desktop');
  applyAdminViewMode(newMode);
  showToast(`Switched to ${newMode ? 'Mobile' : 'Desktop'} Admin View`, 'info');
}

// Run immediately for instant zero delay
initAdminMobileAdaptive();

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
  initAdminMobileAdaptive();

  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) loginForm.addEventListener('submit', handleAdminLogin);

  const productForm = document.getElementById('product-form');
  if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);

  const categoryForm = document.getElementById('category-form');
  if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);

  const bannerForm = document.getElementById('banner-form');
  if (bannerForm) bannerForm.addEventListener('submit', handleBannerFormSubmit);
});

// ─────────────────────────────────────────────────────────────
// Firebase Cloud Messaging Notification Handlers
// ─────────────────────────────────────────────────────────────
async function handleSendAdminNotification(e) {
  e.preventDefault();
  const title = document.getElementById('notif-title').value.trim();
  const body = document.getElementById('notif-body').value.trim();
  const url = document.getElementById('notif-url').value.trim();

  try {
    showToast('Sending Firebase push notification...', 'info');
    const res = await fetch(`${API_BASE}/notifications/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Push notification dispatched! 🚀', 'success');
      triggerBrowserNotification(title, body, url);
    } else {
      showToast(data.message || 'Notification queued.', 'info');
    }
  } catch (err) {
    showToast('Error triggering notification: ' + err.message, 'error');
  }
}

async function triggerDeviceTestNotification() {
  if (!('Notification' in window)) {
    showToast('This browser does not support desktop notifications', 'warning');
    return;
  }

  const title = document.getElementById('notif-title')?.value || 'RJ Fashion Collection ✨';
  const body = document.getElementById('notif-body')?.value || 'Your festive royal collection order has been dispatched!';
  const url = document.getElementById('notif-url')?.value || '/orders.html';

  if (Notification.permission === 'granted') {
    triggerBrowserNotification(title, body, url);
    showToast('Notification displayed on your device! 🔔', 'success');
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      triggerBrowserNotification(title, body, url);
      showToast('Notification displayed on your device! 🔔', 'success');
    } else {
      showToast('Notification permission was blocked in browser settings.', 'warning');
    }
  } else {
    showToast('Please enable notifications in your browser address bar permissions.', 'warning');
  }
}

function triggerBrowserNotification(title, body, url) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, {
      body: body,
      icon: '/images/favicon.png'
    });
    n.onclick = () => {
      window.focus();
      window.location.href = url || '/';
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Executive Dashboard Helper Functions & Tools
// ─────────────────────────────────────────────────────────────

// 1. Mobile Sidebar Drawer Toggle
function toggleMobileSidebar(forceState) {
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  const newState = typeof forceState === 'boolean' ? forceState : !isOpen;
  if (newState) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

// 2. Fast Refresh
function refreshAdminData() {
  const icon = document.getElementById('refresh-spinner-icon');
  if (icon) {
    icon.style.display = 'inline-block';
    icon.style.transition = 'transform 0.6s ease';
    icon.style.transform = 'rotate(360deg)';
  }
  loadDashboardStats();
  const activePane = document.querySelector('.admin-section-pane:not([style*="display: none"])');
  if (activePane) {
    const paneId = activePane.id.replace('pane-', '');
    switchAdminTab(paneId);
  }
  setTimeout(() => {
    if (icon) icon.style.transform = 'rotate(0deg)';
    showToast('Admin data synced & updated live! 🔄', 'success');
  }, 600);
}

// 3. Jump and Filter Handlers
function filterAndJumpOrders(status) {
  switchAdminTab('orders');
  const select = document.getElementById('admin-orders-filter-status');
  if (select) {
    select.value = status;
    loadAdminOrders();
  }
}

function filterAndJumpProducts(stockStatus) {
  switchAdminTab('products');
  const select = document.getElementById('admin-product-stock-filter');
  if (select) {
    select.value = stockStatus;
    loadAdminProducts();
  }
}

// 4. Fast Inline Stock Quantity Adjuster (+/-) (Instant Optimistic In-Place Update)
async function quickAdjustStock(productId, delta) {
  const p = currentProducts.find(item => item.id === productId);
  if (!p) return;
  const oldStock = p.stock || 0;
  const newStock = Math.max(0, oldStock + delta);
  p.stock = newStock;

  // In-place instant DOM update (zero flicker, zero table re-render)
  const valEl = document.getElementById(`stock-val-${productId}`);
  if (valEl) valEl.textContent = newStock;

  const pillEl = document.getElementById(`stock-pill-${productId}`);
  const toggleBtn = document.getElementById(`stock-toggle-btn-${productId}`);
  const isInStock = newStock > 0;
  const isLowStock = newStock > 0 && newStock <= 4;

  if (pillEl) {
    pillEl.className = `stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}`;
    pillEl.innerHTML = isInStock ? (isLowStock ? `⚠️ Low (${newStock})` : `🟢 In Stock (${newStock})`) : `🔴 Out of Stock (0)`;
  }
  if (toggleBtn) {
    toggleBtn.className = `btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}`;
    toggleBtn.textContent = isInStock ? 'Mark Out 🚫' : 'Mark In ✅';
  }

  // Update summary counts
  const summaryEl = document.getElementById('admin-product-count-summary');
  if (summaryEl && currentProducts) {
    const inStockCount = currentProducts.filter(item => item.stock > 0).length;
    const outStockCount = currentProducts.filter(item => item.stock <= 0).length;
    summaryEl.innerHTML = `Showing <strong>${currentProducts.length}</strong> items (${inStockCount} In Stock, <span style="color:#ef4444;">${outStockCount} Out of Stock</span>)`;
  }

  // 1. Try Express API
  try {
    await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock })
    });
  } catch (_) {}

  // 2. Direct Cloud Firestore Sync
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      await db.collection('products').doc(String(productId)).set({
        stock: newStock,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore quickAdjustStock sync err:', fsErr);
    }
  }

  // 3. LocalStorage Sync
  try {
    const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
    const existingIdx = customLocal.findIndex(p => String(p.id) === String(productId));
    if (existingIdx >= 0) {
      customLocal[existingIdx].stock = newStock;
    } else {
      customLocal.push({ id: productId, stock: newStock });
    }
    localStorage.setItem('rjfc_custom_products', JSON.stringify(customLocal));
  } catch (_) {}

  showToast(`Stock updated to ${newStock} units`, 'success');
  loadDashboardStats();
}

// Helper: Neutralize CSV Formula Injection (=, +, -, @, \t, \r)
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let s = String(val);
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s; // Prepend apostrophe to neutralize formula execution in Excel/Calc
  }
  return `"${s.replace(/"/g, '""')}"`;
}

// 5. Export Products Catalog as CSV Spreadsheet (Formula-Injection Safe)
function exportProductsCSV() {
  if (!currentProducts || currentProducts.length === 0) {
    showToast('No products available to export', 'error');
    return;
  }
  const headers = ['ID', 'Product Name', 'SKU', 'Brand', 'Department', 'Subcategory', 'Category', 'Price (INR)', 'Original MRP', 'Stock Quantity', 'Stock Status', 'Active', 'Image URL'];
  const rows = currentProducts.map(p => [
    sanitizeCsvCell(p.id),
    sanitizeCsvCell(p.name),
    sanitizeCsvCell(p.sku || ''),
    sanitizeCsvCell(p.brand || 'RJ Collection'),
    sanitizeCsvCell(p.department || 'women'),
    sanitizeCsvCell(p.subcategory || ''),
    sanitizeCsvCell(p.category_name || ''),
    p.price || 0,
    p.original_price || p.price || 0,
    p.stock || 0,
    sanitizeCsvCell(p.stock > 0 ? (p.stock <= 4 ? 'Low Stock' : 'In Stock') : 'Out of Stock'),
    sanitizeCsvCell(p.active ? 'Active' : 'Hidden'),
    sanitizeCsvCell(p.image || '')
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RJ_Fashion_Products_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Products catalog exported to CSV safely! 📥', 'success');
}

// 6. Export Orders Ledger as CSV Spreadsheet (Formula-Injection Safe)
function exportOrdersCSV() {
  if (!currentOrders || currentOrders.length === 0) {
    showToast('No orders available to export', 'error');
    return;
  }
  const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Email', 'Delivery Address', 'Total (INR)', 'Payment Method', 'Status', 'Item Count'];
  const rows = currentOrders.map(o => [
    sanitizeCsvCell(o.order_number),
    sanitizeCsvCell(new Date(o.created_at).toLocaleDateString()),
    sanitizeCsvCell(o.customer_name || ''),
    sanitizeCsvCell(o.customer_phone || ''),
    sanitizeCsvCell(o.customer_email || ''),
    sanitizeCsvCell(o.delivery_address || ''),
    o.total || 0,
    sanitizeCsvCell(o.payment_method || 'Online'),
    sanitizeCsvCell(o.status || 'Pending'),
    (o.items || []).length
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RJ_Fashion_Orders_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Orders ledger exported to CSV safely! 📊', 'success');
}

// ─────────────────────────────────────────────────────────────
// 7. Printable Packing Slip & Full Invoice Engine
// ─────────────────────────────────────────────────────────────
let currentInvoiceOrder = null;

// Helper: Robust Order Lookup
function findOrderById(orderId) {
  if (!orderId) return null;
  const idStr = String(orderId).trim();
  const all = (currentOrders && currentOrders.length > 0) ? currentOrders : fetchAllOrdersRealtime();
  
  let found = all.find(o => 
    String(o.id) === idStr || 
    String(o.order_number) === idStr ||
    (o.order_number && o.order_number.toLowerCase() === idStr.toLowerCase())
  );

  // If not found in current list, search directly in localStorage
  if (!found) {
    try {
      const local = JSON.parse(localStorage.getItem('rj_orders') || '[]');
      found = local.find(o => 
        String(o.id) === idStr || 
        String(o.order_number) === idStr ||
        (o.order_number && o.order_number.toLowerCase() === idStr.toLowerCase())
      );
    } catch (_) {}
  }

  return found || null;
}

// Generate Standalone, High-Res Luxury Tax Invoice HTML
function buildInvoiceHTML(o, forDownload = false) {
  const address = o.delivery_address || o.shipping_address || o.address || 'Standard Address on file';
  const cleanPhone = o.customer_phone || 'N/A';
  const cleanEmail = o.customer_email || 'N/A';
  const orderDate = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today';
  const items = (o.items && o.items.length > 0) ? o.items : [{ name: 'Luxury Indian Ethnic Ensemble', quantity: 1, price: o.total, total: o.total, size: 'Free Size' }];

  return `
    <div class="invoice-sheet" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px; background: #ffffff; color: #0f172a; max-width: 760px; margin: 0 auto; box-sizing: border-box;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7a003c; padding-bottom: 18px; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #7a003c; letter-spacing: 0.5px;">RJ FASHION COLLECTION</div>
          <div style="font-size: 0.85rem; color: #b45309; font-weight: 700; margin-top: 2px;">Bridal Sarees • Royal Craft</div>
          <div style="font-size: 0.78rem; color: #64748b; margin-top: 6px; line-height: 1.5;">
            📍 Sarbhal Chowk, Jharsuguda, Odisha - 768201<br>
            📞 +91 78940 93586 | ✉️ rjfashioncollection@gmail.com
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.25rem; font-weight: 900; color: #1e293b;">TAX INVOICE / RECEIPT</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #7a003c; margin-top: 4px;">Order #${o.order_number}</div>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Date: <strong>${orderDate}</strong></div>
          <div style="display: inline-block; padding: 3px 10px; border-radius: 4px; background: #ecfdf5; color: #065f46; font-size: 0.78rem; font-weight: 700; margin-top: 6px; border: 1px solid #a7f3d0;">
            ${o.payment_method || 'Online'} • ${o.status || 'Confirmed'}
          </div>
        </div>
      </div>

      <!-- Customer / Delivery Info Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 22px;">
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Billed To / Customer:</div>
          <div style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-top: 4px;">${o.customer_name}</div>
          <div style="font-size: 0.85rem; color: #475569; margin-top: 2px;">Phone: <strong>${cleanPhone}</strong></div>
          <div style="font-size: 0.82rem; color: #475569;">Email: ${cleanEmail}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address:</div>
          <div style="font-size: 0.88rem; color: #334155; margin-top: 4px; line-height: 1.5; font-weight: 500;">
            ${address}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 0.88rem;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; background: #f1f5f9; text-align: left;">
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; width: 36px;">#</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155;">Product Description</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; width: 90px;">Size</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; text-align: center; width: 50px;">Qty</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; text-align: right; width: 110px;">Price</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; text-align: right; width: 110px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const title = it.name || it.product_name || it.title || 'Royal Ethnic Ensembles';
            const price = Number(it.price || it.total || o.total);
            const qty = Number(it.quantity || 1);
            const lineTotal = price * qty;
            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 12px; font-weight: 600; color: #1e293b;">
                  <div>${title}</div>
                  <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Premium Quality Guaranteed</div>
                </td>
                <td style="padding: 12px; color: #475569;">${it.size || 'Free Size'}</td>
                <td style="padding: 12px; text-align: center; font-weight: 700;">${qty}</td>
                <td style="padding: 12px; text-align: right; color: #475569;">${formatPrice(price)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e293b;">${formatPrice(lineTotal)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Totals & Notes -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 18px; border-top: 2px solid #e2e8f0; flex-wrap: wrap; gap: 16px;">
        <div style="font-size: 0.8rem; color: #64748b; max-width: 360px; line-height: 1.5;">
          <strong style="color: #1e293b;">Thank you for shopping with RJ Fashion Collection! 👑</strong><br>
          For personalized customer care, blouse tailoring queries, or delivery updates, message our VIP WhatsApp Concierge at <strong>+91 78940 93586</strong>.
        </div>
        <div style="text-align: right; min-width: 240px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem; color: #64748b;">
            <span>Subtotal:</span>
            <span>${formatPrice(o.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem; color: #64748b;">
            <span>Express Delivery:</span>
            <span style="color: #15803d; font-weight: 700;">FREE</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 8px; font-size: 1.25rem; font-weight: 900; color: #7a003c;">
            <span>Grand Total:</span>
            <span>${formatPrice(o.total)}</span>
          </div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px;">(Inclusive of all applicable taxes)</div>
        </div>
      </div>

      <!-- Footer / Auth Sign -->
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8;">
        <div>Computer generated invoice • 100% Genuine Designer Ethnic Wear</div>
        <div style="font-weight: 700; color: #7a003c;">RJ FASHION COLLECTION DIRECT</div>
      </div>
    </div>
  `;
}

// Open Invoice Modal
function openPrintOrderInvoice(orderId) {
  const o = findOrderById(orderId);
  if (!o) {
    showToast('Order details could not be found for invoice generation.', 'error');
    return;
  }

  currentInvoiceOrder = o;
  const bodyEl = document.getElementById('invoice-modal-body');
  if (!bodyEl) return;

  bodyEl.innerHTML = buildInvoiceHTML(o, false);
  const modal = document.getElementById('invoice-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

// Close Invoice Modal
function closeInvoiceModal() {
  const modal = document.getElementById('invoice-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// 1-Click Direct Download of Invoice as File
function downloadCurrentInvoice() {
  if (!currentInvoiceOrder) {
    showToast('No active invoice to download', 'error');
    return;
  }
  downloadOrderInvoiceFile(currentInvoiceOrder.id);
}

function downloadOrderInvoiceFile(orderId) {
  const o = findOrderById(orderId);
  if (!o) {
    showToast('Order not found for download', 'error');
    return;
  }

  const invoiceContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${o.order_number} - RJ Fashion Collection</title>
  <style>
    body { margin: 0; padding: 20px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .invoice-sheet { box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px; border: 1px solid #e2e8f0; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-sheet { box-shadow: none; border: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 760px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 18px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <span style="font-weight: 700; color: #7a003c; font-size: 0.9rem;">RJ Fashion Collection Tax Invoice #${o.order_number}</span>
    <button onclick="window.print()" style="padding: 8px 18px; background: #7a003c; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  ${buildInvoiceHTML(o, true)}
</body>
</html>`;

  const blob = new Blob([invoiceContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RJ_Fashion_Invoice_${o.order_number}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`📥 Invoice downloaded for #${o.order_number}!`, 'success');
}

// Dedicated Print / Save as PDF Popup Window
function printCurrentInvoice() {
  if (!currentInvoiceOrder) {
    showToast('No active invoice to print', 'error');
    return;
  }

  const o = currentInvoiceOrder;
  const printWindow = window.open('', '_blank', 'width=840,height=900');
  if (!printWindow) {
    // Popup blocked: fallback to window.print()
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${o.order_number} - RJ Fashion Collection</title>
  <style>
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${buildInvoiceHTML(o, false)}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}




// ─────────────────────────────────────────────────────────────
// 8. Dashboard Date Filter & Operational Alert Banners
// ─────────────────────────────────────────────────────────────
let currentDashboardDateRange = 'all';

function setDashboardDateRange(range) {
  currentDashboardDateRange = range;
  document.querySelectorAll('.date-range-pills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
  loadDashboardStats();
}

// Filter orders by selected timeframe
function filterOrdersByDateRange(orders, range) {
  if (!orders || orders.length === 0) return [];
  if (range === 'all') return orders;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'today') {
    return orders.filter(o => new Date(o.created_at || Date.now()) >= startOfDay);
  } else if (range === '7d') {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return orders.filter(o => new Date(o.created_at || Date.now()) >= cutoff);
  } else if (range === '30d') {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return orders.filter(o => new Date(o.created_at || Date.now()) >= cutoff);
  }
  return orders;
}

// ─────────────────────────────────────────────────────────────
// 9. Real-Time Inventory & Restock Hub
// ─────────────────────────────────────────────────────────────
let invCategoryFilter = 'all';
let invStatusFilter = 'all';
let invSearchQuery = '';

async function loadAdminInventory() {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  // Make sure products are loaded
  if (!currentProducts || currentProducts.length === 0) {
    try {
      const res = await fetch('/data/products.json');
      if (res.ok) {
        const data = await res.json();
        currentProducts = data.products || [];
      }
    } catch (_) {}
  }

  // Populate inventory category dropdown filter if empty
  const catSelect = document.getElementById('inv-category-filter');
  if (catSelect && catSelect.children.length <= 1) {
    (currentCategories || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
  }

  // Compute stock counters
  const totalSkus = currentProducts.length;
  const totalUnits = currentProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowSkus = currentProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 4).length;
  const outSkus = currentProducts.filter(p => Number(p.stock) <= 0).length;

  if (document.getElementById('inv-total-skus')) document.getElementById('inv-total-skus').textContent = totalSkus;
  if (document.getElementById('inv-total-units')) document.getElementById('inv-total-units').textContent = totalUnits;
  if (document.getElementById('inv-low-skus')) document.getElementById('inv-low-skus').textContent = lowSkus;
  if (document.getElementById('inv-out-skus')) document.getElementById('inv-out-skus').textContent = outSkus;

  // Update nav badge
  const navBadge = document.getElementById('nav-badge-stock') || document.getElementById('nav-inv-badge');
  if (navBadge) {
    const urgentCount = lowSkus + outSkus;
    navBadge.textContent = urgentCount;
    navBadge.style.display = urgentCount > 0 ? 'inline-block' : 'none';
  }

  // Filter products
  let filtered = [...currentProducts];
  if (invCategoryFilter !== 'all') {
    filtered = filtered.filter(p => String(p.category_id) === String(invCategoryFilter));
  }
  if (invStatusFilter === 'low_stock') {
    filtered = filtered.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 4);
  } else if (invStatusFilter === 'out_of_stock') {
    filtered = filtered.filter(p => Number(p.stock) <= 0);
  } else if (invStatusFilter === 'in_stock') {
    filtered = filtered.filter(p => Number(p.stock) > 4);
  }

  if (invSearchQuery) {
    const q = invSearchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.subcategory || '').toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 28px; color: #64748b;">No products match the selected inventory filters.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const stock = Number(p.stock) || 0;
    let badgeClass = 'status-delivered';
    let badgeLabel = 'In Stock';
    if (stock <= 0) {
      badgeClass = 'status-cancelled';
      badgeLabel = 'Out of Stock';
    } else if (stock <= 4) {
      badgeClass = 'status-pending';
      badgeLabel = 'Low Stock';
    }

    const skuDisplay = p.sku ? `<span style="font-family: monospace; font-size: 0.78rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${p.sku}</span>` : '<span style="color:#94a3b8; font-size:0.75rem;">None</span>';

    return `
      <tr>
        <td>
          <div style="display: flex; gap: 10px; align-items: center;">
            <img src="${p.image}" alt="${escapeHtml(p.name)}" style="width: 38px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0;">
            <div>
              <div style="font-weight: 700; color: #1e293b; font-size: 0.86rem; line-height: 1.3;">${escapeHtml(p.name)}</div>
              <div style="font-size: 0.72rem; color: #64748b;">${p.department || ''} &bull; ${p.subcategory || ''}</div>
            </div>
          </div>
        </td>
        <td>${skuDisplay}</td>
        <td style="font-size: 0.82rem; color: #475569;">${p.category_name || '-'}</td>
        <td style="font-weight: 700; color: #1e293b;">${formatPrice(p.price)}</td>
        <td>
          <div style="display: inline-flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #fff;">
            <button onclick="adjustProductStock('${p.id}', -1)" style="border: none; background: #f8fafc; padding: 4px 8px; cursor: pointer; font-weight: bold; color: #475569;" title="Decrease stock">-</button>
            <input type="number" min="0" value="${stock}" onchange="setDirectProductStock('${p.id}', this.value)" style="width: 50px; text-align: center; border: none; font-weight: bold; font-size: 0.85rem; padding: 4px 0; -moz-appearance: textfield;">
            <button onclick="adjustProductStock('${p.id}', 1)" style="border: none; background: #f8fafc; padding: 4px 8px; cursor: pointer; font-weight: bold; color: #475569;" title="Increase stock">+</button>
          </div>
        </td>
        <td><span class="status-pill ${badgeClass}">${badgeLabel}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button onclick="toggleProductAvailability('${p.id}')" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" title="${stock > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}">
              ${stock > 0 ? '🔴 OOS' : '🟢 Restock'}
            </button>
            <button onclick="openEditProductModal('${p.id}')" class="btn btn-outline-primary" style="padding: 4px 8px; font-size: 0.75rem;">Edit</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterInventoryByCategory(val) {
  invCategoryFilter = val;
  loadAdminInventory();
}

function filterInventoryByStatus(val) {
  invStatusFilter = val;
  loadAdminInventory();
}

function searchInventory(query) {
  invSearchQuery = query;
  loadAdminInventory();
}

async function adjustProductStock(prodId, delta) {
  const p = currentProducts.find(item => Number(item.id) === Number(prodId));
  if (!p) return;
  const newStock = Math.max(0, (Number(p.stock) || 0) + delta);
  await saveQuickStockUpdate(prodId, newStock);
}

async function setDirectProductStock(prodId, value) {
  const num = Math.max(0, parseInt(value, 10) || 0);
  await saveQuickStockUpdate(prodId, num);
}

async function toggleProductAvailability(prodId) {
  const p = currentProducts.find(item => Number(item.id) === Number(prodId));
  if (!p) return;
  const newStock = (Number(p.stock) || 0) > 0 ? 0 : 15;
  await saveQuickStockUpdate(prodId, newStock);
}

async function saveQuickStockUpdate(prodId, newStock) {
  const p = currentProducts.find(item => Number(item.id) === Number(prodId));
  if (!p) return;
  const oldStock = p.stock;
  p.stock = newStock;

  try {
    const res = await fetch(`${API_BASE}/admin/products/${prodId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, stock: newStock })
    });
    if (res.ok) {
      showToast(`Stock updated to ${newStock} units`, 'success');
      loadAdminInventory();
      loadAdminProducts();
      loadDashboardStats();
      return;
    }
  } catch (_) {}

  // Fallback for client/static
  localStorage.setItem('rj_catalog_overrides', JSON.stringify(currentProducts));
  showToast(`Stock updated to ${newStock} units`, 'success');
  loadAdminInventory();
  loadAdminProducts();
  loadDashboardStats();
}

// ─────────────────────────────────────────────────────────────
// 10. Financial & Business Intelligence Reports Module
// ─────────────────────────────────────────────────────────────
let currentReportsRange = '30d';

function setReportsDateRange(range) {
  currentReportsRange = range;
  document.querySelectorAll('#pane-reports .date-range-pills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
  loadAdminReports();
}

function loadAdminReports() {
  const allOrders = fetchAllOrdersRealtime() || [];
  const filteredOrders = filterOrdersByDateRange(allOrders, currentReportsRange);

  // Exclude cancelled and refunded orders for trustworthy gross revenue
  const validOrders = filteredOrders.filter(o => !['cancelled', 'refunded'].includes((o.status || '').toLowerCase()));
  const grossRev = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const paidCount = validOrders.length;
  const aov = paidCount > 0 ? Math.round(grossRev / paidCount) : 0;
  const deliveredCount = validOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  const fulfillRate = paidCount > 0 ? Math.round((deliveredCount / paidCount) * 100) : 0;

  if (document.getElementById('rep-gross-revenue')) document.getElementById('rep-gross-revenue').textContent = formatPrice(grossRev);
  if (document.getElementById('rep-order-count')) document.getElementById('rep-order-count').textContent = paidCount;
  if (document.getElementById('rep-aov')) document.getElementById('rep-aov').textContent = formatPrice(aov);
  if (document.getElementById('rep-fulfillment-rate')) document.getElementById('rep-fulfillment-rate').textContent = fulfillRate + '%';

  // Category breakdown
  const categorySales = {};
  validOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const cat = item.category_name || item.department || 'Fashion';
      if (!categorySales[cat]) categorySales[cat] = { units: 0, revenue: 0 };
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      categorySales[cat].units += qty;
      categorySales[cat].revenue += (price * qty);
    });
  });

  const catContainer = document.getElementById('reports-category-breakdown');
  if (catContainer) {
    const catKeys = Object.keys(categorySales);
    if (catKeys.length === 0) {
      catContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem; padding: 16px; text-align: center;">No category sales data for selected period.</p>';
    } else {
      catContainer.innerHTML = `
        <table class="admin-table" style="font-size: 0.82rem;">
          <thead>
            <tr>
              <th>Category</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            ${catKeys.sort((a,b) => categorySales[b].revenue - categorySales[a].revenue).map(cat => {
              const data = categorySales[cat];
              const share = grossRev > 0 ? Math.round((data.revenue / grossRev) * 100) : 0;
              return `
                <tr>
                  <td style="font-weight: 700; color: #1e293b;">${cat}</td>
                  <td>${data.units}</td>
                  <td style="font-weight: 700; color: #831843;">${formatPrice(data.revenue)}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${share}%; height: 100%; background: #be123c;"></div>
                      </div>
                      <span style="font-size: 0.75rem; font-weight: 700; color: #64748b;">${share}%</span>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // Best Selling Products
  const prodSales = {};
  validOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const pid = item.id || item.product_id || item.name;
      if (!prodSales[pid]) {
        prodSales[pid] = {
          name: item.name || 'Unnamed Saree / Apparel',
          image: item.image || '',
          units: 0,
          revenue: 0
        };
      }
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      prodSales[pid].units += qty;
      prodSales[pid].revenue += (price * qty);
    });
  });

  const bestTbody = document.getElementById('reports-bestsellers-tbody');
  if (bestTbody) {
    const sortedProds = Object.values(prodSales).sort((a,b) => b.units - a.units);
    if (sortedProds.length === 0) {
      bestTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 24px;">No product sales recorded in this timeframe.</td></tr>';
    } else {
      bestTbody.innerHTML = sortedProds.slice(0, 8).map((p, idx) => `
        <tr>
          <td>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="font-weight: 800; font-size: 0.9rem; color: #c59b27; width: 20px;">#${idx + 1}</span>
              ${p.image ? `<img src="${p.image}" style="width: 32px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;">` : ''}
              <span style="font-weight: 700; color: #1e293b; font-size: 0.84rem;">${escapeHtml(p.name)}</span>
            </div>
          </td>
          <td style="font-weight: 700;">${p.units}</td>
          <td style="font-weight: 700; color: #831843;">${formatPrice(p.revenue)}</td>
          <td><span class="status-pill status-delivered">Top Seller</span></td>
        </tr>
      `).join('');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 11. Active Store Settings Module (Persistence & Firestore sync)
// ─────────────────────────────────────────────────────────────
async function loadAdminSettings() {
  if (!window.isStaticHosting) {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          applySettingsToForm(data.settings);
          return;
        }
      }
    } catch (_) {}
  }

  // Fallback to localStorage
  const saved = localStorage.getItem('rj_store_settings');
  if (saved) {
    try {
      applySettingsToForm(JSON.parse(saved));
    } catch (_) {}
  }
}

function applySettingsToForm(s) {
  const el = (a, b) => document.getElementById(a) || (b ? document.getElementById(b) : null);
  if (el('set-store-name')) el('set-store-name').value = s.store_name || 'RJ Fashion Collection';
  if (el('set-store-phone', 'set-support-phone')) el('set-store-phone', 'set-support-phone').value = s.store_phone || '+91 78940 93586';
  if (el('set-store-email', 'set-support-email')) el('set-store-email', 'set-support-email').value = s.store_email || 'omvinayakwork@gmail.com';
  if (el('set-store-address')) el('set-store-address').value = s.store_address || 'Bhubaneswar, Odisha, India';
  if (el('set-store-upi', 'set-upi-id')) el('set-store-upi', 'set-upi-id').value = s.upi_id || 'Q070080131@ybl';
  if (el('set-store-whatsapp')) el('set-store-whatsapp').value = s.whatsapp_number || '+91 78940 93586';
  if (el('set-shipping-threshold', 'set-free-shipping')) el('set-shipping-threshold', 'set-free-shipping').value = s.free_shipping_threshold || 999;
  if (el('set-shipping-fee')) el('set-shipping-fee').value = s.shipping_fee || 99;
}

async function handleSettingsFormSubmit(e) {
  if (e) e.preventDefault();
  const val = (a, b, fb) => (document.getElementById(a)?.value || (b ? document.getElementById(b)?.value : '') || fb).toString().trim();

  const settingsPayload = {
    store_name: val('set-store-name', null, 'RJ Fashion Collection'),
    store_phone: val('set-store-phone', 'set-support-phone', '+91 78940 93586'),
    store_email: val('set-store-email', 'set-support-email', 'omvinayakwork@gmail.com'),
    store_address: val('set-store-address', null, 'Bhubaneswar, Odisha, India'),
    upi_id: val('set-store-upi', 'set-upi-id', 'Q070080131@ybl'),
    whatsapp_number: val('set-store-whatsapp', null, '+91 78940 93586'),
    free_shipping_threshold: Number(val('set-shipping-threshold', 'set-free-shipping', '999')) || 999,
    shipping_fee: Number(val('set-shipping-fee', null, '99')) || 99
  };

  if (!window.isStaticHosting) {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload)
      });
      if (res.ok) {
        localStorage.setItem('rj_store_settings', JSON.stringify(settingsPayload));
        showToast('Store settings saved successfully! ⚙️', 'success');
        return;
      }
    } catch (_) {}
  }

  localStorage.setItem('rj_store_settings', JSON.stringify(settingsPayload));
  showToast('Store settings saved locally! ⚙️', 'success');
}

// ─────────────────────────────────────────────────────────────
// 12. Customer Order History Modal (Safe Customer Inspector)
// ─────────────────────────────────────────────────────────────
function openCustomerOrdersModal(customerEmail, customerName) {
  const modal = document.getElementById('customer-orders-modal');
  if (!modal) return;

  const titleEl = document.getElementById('cust-modal-name');
  if (titleEl) titleEl.textContent = customerName || customerEmail || 'Customer';

  const allOrders = fetchAllOrdersRealtime() || [];
  const custOrders = allOrders.filter(o => 
    (customerEmail && (o.customer_email || '').toLowerCase() === customerEmail.toLowerCase()) ||
    (customerName && (o.customer_name || '').toLowerCase() === customerName.toLowerCase())
  );

  const tbody = document.getElementById('customer-orders-tbody') || document.getElementById('cust-orders-tbody');
  if (tbody) {
    if (custOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No previous orders found for this customer.</td></tr>';
    } else {
      tbody.innerHTML = custOrders.map(o => `
        <tr>
          <td style="font-weight: 700; color: #831843;">${o.order_number}</td>
          <td>${new Date(o.created_at || Date.now()).toLocaleDateString()}</td>
          <td style="font-weight: 700;">${formatPrice(o.total)}</td>
          <td><span class="status-pill status-${(o.status || 'pending').toLowerCase()}">${o.status}</span></td>
          <td>
            <button onclick="closeCustomerOrdersModal(); viewOrderModal('${o.id}');" class="btn btn-outline-primary" style="padding: 4px 8px; font-size: 0.75rem;">View Order</button>
          </td>
        </tr>
      `).join('');
    }
  }

  modal.classList.add('active');
}

function closeCustomerOrdersModal() {
  const modal = document.getElementById('customer-orders-modal');
  if (modal) modal.classList.remove('active');
}


// ─────────────────────────────────────────────────────────────
// 13. Promotions & Coupons Management Module
// ─────────────────────────────────────────────────────────────
let currentPromotions = [];

async function loadAdminPromotions() {
  const tbody = document.getElementById('admin-promotions-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Loading promotional campaigns...</td></tr>';

  if (!window.isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/admin/promotions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.promotions)) {
          currentPromotions = data.promotions;
          renderPromotionsTable(currentPromotions);
          return;
        }
      }
    } catch (_) {}
  }

  // Fallback defaults
  currentPromotions = [
    { id: 1, code: 'GRANDRJ', description: 'Inaugural Grand Opening 10% Privilege', discount_type: 'percentage', discount_value: 10, min_order_amount: 500, times_used: 14, usage_limit: 500, active: 1 },
    { id: 2, code: 'ROYAL100', description: 'Flat ₹100 Off on Celebration Wear', discount_type: 'fixed', discount_value: 100, min_order_amount: 999, times_used: 8, usage_limit: 500, active: 1 }
  ];
  renderPromotionsTable(currentPromotions);
}

function renderPromotionsTable(promos) {
  const tbody = document.getElementById('admin-promotions-tbody');
  if (!tbody) return;
  if (!promos || promos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No promotional codes created yet.</td></tr>';
    return;
  }

  tbody.innerHTML = promos.map(p => `
    <tr>
      <td><span style="font-family: monospace; font-weight: 800; font-size: 0.92rem; background: #fdf2f4; color: #be123c; padding: 4px 10px; border-radius: 4px; border: 1px solid #fecdd3;">${p.code}</span></td>
      <td style="font-size: 0.84rem; color: #334155;">${p.description || '-'}</td>
      <td style="font-weight: 700; color: #1e293b;">${p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `₹${p.discount_value} FLAT`}</td>
      <td>₹${p.min_order_amount || 0}</td>
      <td style="font-size: 0.82rem; color: #64748b;">${p.times_used || 0} / ${p.usage_limit || '∞'}</td>
      <td><span class="status-pill ${p.active ? 'status-delivered' : 'status-cancelled'}">${p.active ? 'Active' : 'Disabled'}</span></td>
      <td>
        <button onclick="deletePromotion('${p.id}')" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: #fca5a5;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openPromoModal() {
  document.getElementById('promo-form').reset();
  document.getElementById('promo-modal').classList.add('active');
}

function closePromoModal() {
  document.getElementById('promo-modal').classList.remove('active');
}

async function handleCreatePromoSubmit(e) {
  if (e) e.preventDefault();
  const payload = {
    code: document.getElementById('promo-form-code')?.value?.trim(),
    description: document.getElementById('promo-form-desc')?.value?.trim(),
    discount_type: document.getElementById('promo-form-type')?.value,
    discount_value: Number(document.getElementById('promo-form-val')?.value),
    min_order_amount: Number(document.getElementById('promo-form-min')?.value) || 0,
    usage_limit: Number(document.getElementById('promo-form-limit')?.value) || 200,
    active: 1
  };

  try {
    const res = await fetch(`${API_BASE}/admin/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      closePromoModal();
      loadAdminPromotions();
      return;
    }
    showToast(data.message || 'Failed to create promo code', 'error');
  } catch (_) {
    payload.id = Date.now();
    currentPromotions.unshift(payload);
    renderPromotionsTable(currentPromotions);
    closePromoModal();
    showToast(`Promo code ${payload.code} created locally!`, 'success');
  }
}

async function deletePromotion(id) {
  if (!confirm('Are you sure you want to delete this promotional code?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/promotions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Promotion removed', 'info');
      loadAdminPromotions();
      return;
    }
  } catch (_) {}
  currentPromotions = currentPromotions.filter(p => p.id !== id);
  renderPromotionsTable(currentPromotions);
  showToast('Promotion removed', 'info');
}

// ─────────────────────────────────────────────────────────────
// 14. Homepage & Grand Opening Campaign Controls
// ─────────────────────────────────────────────────────────────
let cachedCampaign = null;

async function loadAdminCampaign() {
  try {
    const res = await fetch(`${API_BASE}/admin/campaign`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.campaign) {
        cachedCampaign = data.campaign;
        applyCampaignToAdminForm(cachedCampaign);
        return;
      }
    }
  } catch (_) {}

  // Fallback
  cachedCampaign = {
    announcement_text: 'INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ',
    announcement_active: 1,
    hero_headline: 'A New Era of Style Begins.',
    hero_subtitle: 'Discover your style. Elevate every moment with handcrafted Banarasi silks, bridal lehengas, and royal Kundan jewelry.',
    hero_badge: 'GRAND OPENING',
    hero_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
    hero_secondary_image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
    hero_cta_primary: 'Explore the Collection',
    hero_cta_secondary: "Discover What's New",
    launch_countdown_enabled: 1,
    launch_date: '2026-11-15T10:00:00',
    spotlight_title: 'The Royal Heritage Edit',
    spotlight_image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85'
  };
  applyCampaignToAdminForm(cachedCampaign);
}

function applyCampaignToAdminForm(c) {
  if (document.getElementById('cmp-announcement-text')) document.getElementById('cmp-announcement-text').value = c.announcement_text || '';
  if (document.getElementById('cmp-announcement-active')) document.getElementById('cmp-announcement-active').checked = c.announcement_active !== 0;
  if (document.getElementById('cmp-hero-badge')) document.getElementById('cmp-hero-badge').value = c.hero_badge || 'GRAND OPENING';
  if (document.getElementById('cmp-hero-headline')) document.getElementById('cmp-hero-headline').value = c.hero_headline || 'A New Era of Style Begins.';
  if (document.getElementById('cmp-hero-subtitle')) document.getElementById('cmp-hero-subtitle').value = c.hero_subtitle || '';
  if (document.getElementById('cmp-hero-image')) document.getElementById('cmp-hero-image').value = c.hero_image || '';
  if (document.getElementById('cmp-hero-sec-img')) document.getElementById('cmp-hero-sec-img').value = c.hero_secondary_image || '';
  if (document.getElementById('cmp-launch-date')) {
    const raw = c.launch_date || '2026-11-15T10:00';
    document.getElementById('cmp-launch-date').value = raw.slice(0, 16);
  }
  if (document.getElementById('cmp-spotlight-title')) document.getElementById('cmp-spotlight-title').value = c.spotlight_title || 'The Royal Heritage Edit';
  if (document.getElementById('cmp-spotlight-img')) document.getElementById('cmp-spotlight-img').value = c.spotlight_image || '';
}

async function saveAdminCampaign(e) {
  if (e) e.preventDefault();
  const payload = {
    announcement_text: document.getElementById('cmp-announcement-text')?.value?.trim(),
    announcement_active: document.getElementById('cmp-announcement-active')?.checked ? 1 : 0,
    hero_badge: document.getElementById('cmp-hero-badge')?.value?.trim(),
    hero_headline: document.getElementById('cmp-hero-headline')?.value?.trim(),
    hero_subtitle: document.getElementById('cmp-hero-subtitle')?.value?.trim(),
    hero_image: document.getElementById('cmp-hero-image')?.value?.trim(),
    hero_secondary_image: document.getElementById('cmp-hero-sec-img')?.value?.trim(),
    launch_date: document.getElementById('cmp-launch-date')?.value,
    spotlight_title: document.getElementById('cmp-spotlight-title')?.value?.trim(),
    spotlight_image: document.getElementById('cmp-spotlight-img')?.value?.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/admin/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Grand Opening & Homepage Campaign saved and published! 🚀', 'success');
      cachedCampaign = payload;
      return;
    }
  } catch (_) {}

  localStorage.setItem('rj_campaign_settings', JSON.stringify(payload));
  cachedCampaign = payload;
  showToast('Grand Opening Campaign settings saved locally! 🚀', 'success');
}

function previewCampaignModal() {
  const modal = document.getElementById('campaign-preview-modal');
  const body = document.getElementById('campaign-preview-body');
  if (!modal || !body) return;

  const annText = document.getElementById('cmp-announcement-text')?.value || 'THE GRAND OPENING PRIVILEGE';
  const badge = document.getElementById('cmp-hero-badge')?.value || 'GRAND OPENING';
  const headline = document.getElementById('cmp-hero-headline')?.value || 'A New Era of Style Begins.';
  const subtitle = document.getElementById('cmp-hero-subtitle')?.value || 'Discover your style.';
  const heroImg = document.getElementById('cmp-hero-image')?.value || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85';
  const secImg = document.getElementById('cmp-hero-sec-img')?.value || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80';

  body.innerHTML = `
    <!-- Top Announcement Bar Preview -->
    <div style="background: #0f0f11; color: #f5efe6; font-size: 0.76rem; letter-spacing: 1.5px; font-weight: 600; padding: 10px 16px; text-align: center; border-bottom: 1px solid rgba(197, 160, 89, 0.35); display: flex; align-items: center; justify-content: center; gap: 10px;">
      <span style="color: #BDA477; font-weight: 700; letter-spacing: 1.8px;">✦ RJ FASHION COLLECTION</span> •
      <span>${annText}</span>
    </div>

    <!-- Cinematic Hero Preview -->
    <div style="background: linear-gradient(135deg, #121013 0%, #1c1319 60%, #150f14 100%); padding: 48px; color: #fff; margin: 20px; border-radius: 12px; border: 1px solid rgba(197, 160, 89, 0.35); display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; align-items: center;">
      <div>
        <span style="background: rgba(197, 160, 89, 0.16); border: 1px solid rgba(197, 160, 89, 0.55); color: #e5cb9c; padding: 4px 14px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px; display: inline-block; margin-bottom: 14px;">${badge}</span>
        <h1 style="font-family: Georgia, serif; font-size: 2.4rem; font-weight: 700; margin: 0 0 12px 0; line-height: 1.15;">${headline}</h1>
        <p style="font-size: 0.94rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">${subtitle}</p>
        <div style="display: flex; gap: 12px;">
          <span style="background: linear-gradient(135deg, #c5a059 0%, #e2c589 100%); color: #111; padding: 10px 22px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px;">EXPLORE THE COLLECTION →</span>
          <span style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 10px 20px; border-radius: 4px; font-weight: 600; font-size: 0.8rem;">DISCOVER WHAT'S NEW</span>
        </div>
      </div>
      <div style="position: relative;">
        <img src="${heroImg}" style="width: 100%; height: 280px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(197, 160, 89, 0.4);">
        <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(18,16,19,0.92); border: 1px solid rgba(197,160,89,0.4); border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
          <img src="${secImg}" style="width: 32px; height: 40px; object-fit: cover; border-radius: 4px;">
          <div>
            <div style="font-weight: 700; font-size: 0.78rem; color: #fff;">The Signature Vault</div>
            <div style="font-size: 0.68rem; color: #c5a059; font-weight: 700;">FINE ARTISANAL ACCENTS</div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeCampaignPreviewModal() {
  const modal = document.getElementById('campaign-preview-modal');
  if (modal) modal.classList.remove('active');
}

// ─────────────────────────────────────────────────────────────
// 15. Customer Reviews Moderation Module
// ─────────────────────────────────────────────────────────────
let currentReviews = [];

async function loadAdminReviews() {
  const tbody = document.getElementById('admin-reviews-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Loading customer reviews...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/admin/reviews`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        currentReviews = data.reviews;
        renderReviewsTable(currentReviews);
        return;
      }
    }
  } catch (_) {}

  // Fallback demo reviews for empty store
  currentReviews = [
    { id: 1, user_name: 'Ananya Deshmukh', rating: 5, comment: 'The Kanjivaram zari work is absolutely breathtaking. Pure royal elegance!', product_name: 'Royal Kanjivaram Pure Silk Saree', created_at: new Date().toISOString(), verified: 1 },
    { id: 2, user_name: 'Pooja Singhania', rating: 5, comment: 'The Kundan choker arrived in luxury velvet packaging. Truly heirloom quality.', product_name: 'Heritage Gold Finished Kundan Choker', created_at: new Date().toISOString(), verified: 1 }
  ];
  renderReviewsTable(currentReviews);
}

function renderReviewsTable(reviews) {
  const tbody = document.getElementById('admin-reviews-tbody');
  if (!tbody) return;
  if (!reviews || reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No reviews submitted yet.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(r => `
    <tr>
      <td style="font-weight: 700; color: #1e293b; font-size: 0.85rem;">${r.product_name || 'Boutique Apparel'}</td>
      <td style="font-weight: 600;">${escapeHtml(r.user_name || 'Verified Buyer')}</td>
      <td><span style="color: #f59e0b; font-weight: 800;">★ ${r.rating || 5}.0</span></td>
      <td style="font-size: 0.82rem; color: #475569; max-width: 260px;">"${escapeHtml(r.comment || '')}"</td>
      <td style="font-size: 0.78rem; color: #64748b;">${new Date(r.created_at || Date.now()).toLocaleDateString()}</td>
      <td><span class="status-pill ${r.verified ? 'status-delivered' : 'status-pending'}">${r.verified ? 'Verified Buyer' : 'Pending'}</span></td>
      <td>
        <button onclick="toggleReviewVerification('${r.id}', ${r.verified ? 1 : 0})" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">
          ${r.verified ? 'Unverify' : 'Verify'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleReviewVerification(id, currentStatus) {
  const newStatus = currentStatus ? 0 : 1;
  try {
    await fetch(`${API_BASE}/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: newStatus })
    });
    showToast('Review status updated', 'success');
    loadAdminReviews();
  } catch (_) {
    const r = currentReviews.find(item => item.id === id);
    if (r) r.verified = newStatus;
    renderReviewsTable(currentReviews);
    showToast('Review status updated locally', 'success');
  }
}


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
  fetch(API_BASE + '/auth/admin-scan-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId })
  }).catch(() => {});

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

    // Claim backend session if server is active (sets HttpOnly cookie)
    try {
      await fetch(API_BASE + '/auth/admin-scan-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: currentScanChallengeId, email: 'omvinayakwork@gmail.com' })
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

// Verification test helpers removed for security

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
            if (rawVal.toLowerCase().includes('omvinayakwork@gmail.com')) {
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
