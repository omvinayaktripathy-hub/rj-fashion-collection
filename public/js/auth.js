// RJ FASHION COLLECTION - PATRON AUTHENTICATION CONTROLLER
// Enterprise Multi-Tier Engine: Firebase Client SDK + Identity Toolkit REST API + Local Session Sync

const escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
const API_BASE = window.API_BASE || '/api';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
  authDomain: "rj-fashion-collection.firebaseapp.com",
  projectId: "rj-fashion-collection",
  storageBucket: "rj-fashion-collection.firebasestorage.app",
  messagingSenderId: "136818820501",
  appId: "1:136818820501:web:251f54494df4209854a29c",
  measurementId: "G-LL5KRD9639"
};

function ensureFirebaseInit() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    if (!firebase.apps || !firebase.apps.length) {
      try {
        firebase.initializeApp(FIREBASE_CONFIG);
      } catch (_) {}
    }
    return firebase.auth();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Direct Firebase Identity Toolkit REST API fallbacks
// ─────────────────────────────────────────────────────────────
async function restFirebaseSignIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (res.ok && data.idToken) {
    return {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName || email.split('@')[0],
      idToken: data.idToken
    };
  }
  const errCode = (data.error && data.error.message) ? data.error.message : 'AUTH_FAILED';
  throw new Error(errCode);
}

async function restFirebaseSignUp(email, password, displayName) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (res.ok && data.idToken) {
    return {
      uid: data.localId,
      email: data.email,
      displayName: displayName || email.split('@')[0],
      idToken: data.idToken
    };
  }
  const errCode = (data.error && data.error.message) ? data.error.message : 'REG_FAILED';
  throw new Error(errCode);
}

async function restFirebasePasswordReset(email) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_CONFIG.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email })
  });
  const data = await res.json();
  if (res.ok) {
    return true;
  }
  const errCode = (data.error && data.error.message) ? data.error.message : 'RESET_FAILED';
  throw new Error(errCode);
}

function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || '/account.html';
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form-box');
  const registerForm = document.getElementById('register-form-box');
  const loginTabBtn = document.getElementById('tab-login-btn');
  const registerTabBtn = document.getElementById('tab-register-btn');

  hideAuthError();

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (loginTabBtn) loginTabBtn.classList.add('active');
    if (registerTabBtn) registerTabBtn.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (loginTabBtn) loginTabBtn.classList.remove('active');
    if (registerTabBtn) registerTabBtn.classList.add('active');
  }
}

function showAuthError(msg) {
  const banner = document.getElementById('auth-error-banner');
  const textEl = document.getElementById('auth-error-text');
  if (banner && textEl) {
    textEl.textContent = msg;
    banner.style.display = 'flex';
  } else if (typeof showToast === 'function') {
    showToast(msg, 'error');
  }
}

function hideAuthError() {
  const banner = document.getElementById('auth-error-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.getAttribute('type') === 'password';
  input.setAttribute('type', isPassword ? 'text' : 'password');
  if (btn) {
    btn.innerHTML = isPassword
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function mapAuthErrorCode(code, fallbackMessage) {
  const clean = String(code || '').toUpperCase();
  if (clean.includes('USER_NOT_FOUND') || clean.includes('USER-NOT-FOUND') || clean.includes('EMAIL_NOT_FOUND')) {
    return 'No patron account found with this email. Please check your spelling or create an account.';
  }
  if (clean.includes('WRONG_PASSWORD') || clean.includes('INVALID_PASSWORD') || clean.includes('WRONG-PASSWORD') || clean.includes('INVALID_LOGIN_CREDENTIALS') || clean.includes('INVALID-CREDENTIAL')) {
    return 'Incorrect password. Please verify your credentials or use the Forgot Password option.';
  }
  if (clean.includes('EMAIL_EXISTS') || clean.includes('EMAIL-ALREADY-IN-USE')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (clean.includes('WEAK_PASSWORD') || clean.includes('WEAK-PASSWORD')) {
    return 'Password must be at least 6 characters in length.';
  }
  if (clean.includes('INVALID_EMAIL') || clean.includes('INVALID-EMAIL')) {
    return 'Please provide a valid email address.';
  }
  if (clean.includes('TOO_MANY_ATTEMPTS') || clean.includes('TOO-MANY-REQUESTS')) {
    return 'Access temporarily blocked due to repeated attempts. Please reset your password or try again later.';
  }
  if (clean.includes('POPUP_CLOSED') || clean.includes('POPUP-CLOSED-BY-USER') || clean.includes('CANCELLED')) {
    return 'Google sign-in popup was closed before authentication could finish.';
  }
  if (clean.includes('POPUP_BLOCKED') || clean.includes('POPUP-BLOCKED')) {
    return 'Google sign-in popup was blocked by your browser. Please allow popups or use email sign-in.';
  }
  if (clean.includes('ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL') || clean.includes('ACCOUNT-EXISTS-WITH-DIFFERENT-CREDENTIAL')) {
    return 'An account already exists for this email with password. Please sign in with your password below.';
  }
  if (clean.includes('UNAUTHORIZED_DOMAIN') || clean.includes('UNAUTHORIZED-DOMAIN')) {
    return 'Authentication from this local origin is restricted. Please sign in with email and password.';
  }
  if (clean.includes('NETWORK') || clean.includes('FETCH_FAILED')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  return fallbackMessage || 'Authentication failed. Please verify your credentials and try again.';
}

// ─────────────────────────────────────────────────────────────
// Persist user state to dual keys & dispatch global update events
// ─────────────────────────────────────────────────────────────
function commitUserSession(userObj, isNew = false) {
  const email = (userObj.email || '').toLowerCase();
  const isOwner = email === 'omvinayakwork@gmail.com';
  const displayName = userObj.displayName || userObj.name || (email ? email.split('@')[0] : 'Patron');

  const sessionUser = {
    id: userObj.uid || userObj.id || 'patron-' + Date.now(),
    uid: userObj.uid || userObj.id || 'patron-' + Date.now(),
    name: displayName,
    email: email,
    phone: userObj.phoneNumber || userObj.phone || '',
    role: isOwner ? 'admin' : (userObj.role || 'customer'),
    tier: 'Patron',
    photo: userObj.photoURL || userObj.photo || userObj.avatar || '',
    avatar: userObj.photoURL || userObj.photo || userObj.avatar || ''
  };

  try {
    localStorage.setItem('rj_user', JSON.stringify(sessionUser));
    localStorage.setItem('rjfc_user', JSON.stringify(sessionUser));
    sessionStorage.setItem('rj_user', JSON.stringify(sessionUser));
    sessionStorage.setItem('rjfc_user', JSON.stringify(sessionUser));
  } catch (_) {}

  // Dispatch global custom event and standard storage event
  try {
    window.dispatchEvent(new CustomEvent('rjfc_user_updated', { detail: sessionUser }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}

  const welcomeMsg = isNew
    ? `Welcome to the Atelier, ${sessionUser.name}! 👑`
    : `Welcome back, ${sessionUser.name}! 👑`;
  
  if (typeof showToast === 'function') {
    showToast(welcomeMsg, 'success');
  }

  const dest = getRedirectUrl();
  setTimeout(() => {
    window.location.href = dest;
  }, 600);
}

// ─────────────────────────────────────────────────────────────
// 1. Google Sign-In via Firebase Authentication
// ─────────────────────────────────────────────────────────────
async function handleGoogleSignIn() {
  hideAuthError();
  const btn = document.getElementById('google-signin-btn');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.75';
    btn.innerHTML = 'Connecting to Google...';
  }

  try {
    const auth = ensureFirebaseInit();
    if (!auth || typeof firebase === 'undefined') {
      throw new Error('Google Sign-In is blocked or unavailable in this browser. Please sign in using your email and password below.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    let result = null;
    try {
      result = await auth.signInWithPopup(provider);
    } catch (popupErr) {
      console.warn('Popup error:', popupErr);
      if (popupErr.code === 'auth/popup-blocked') {
        // Fall back to redirect flow
        await auth.signInWithRedirect(provider);
        return;
      }
      throw popupErr;
    }

    if (result && result.user) {
      const user = result.user;

      // Optional Cloud Firestore patron record
      try {
        if (firebase.firestore) {
          const isOwner = user.email && user.email.toLowerCase() === 'omvinayakwork@gmail.com';
          await firebase.firestore().collection('users').doc(user.uid).set({
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: isOwner ? 'admin' : 'customer',
            tier: 'Patron',
            photo: user.photoURL || '',
            last_login: new Date().toISOString()
          }, { merge: true });
        }
      } catch (_) {}

      commitUserSession(user, false);
      return;
    }
  } catch (error) {
    console.warn('Google Sign-In notice:', error);
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = origHtml;
    }
    const msg = mapAuthErrorCode(error.code, error.message);
    showAuthError(msg);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Email / Password Login (Multi-tier fallback)
// ─────────────────────────────────────────────────────────────
async function handleCustomerLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  hideAuthError();

  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
  const password = passEl ? passEl.value : '';

  if (!email) {
    showAuthError('Please enter your registered email address.');
    if (emailEl) emailEl.focus();
    return false;
  }

  if (!password) {
    showAuthError('Please enter your password.');
    if (passEl) passEl.focus();
    return false;
  }

  const btn = document.getElementById('customer-login-submit');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>AUTHENTICATING PATRON...</span>';
  }

  // Tier 1: Direct Firebase Client SDK
  try {
    const auth = ensureFirebaseInit();
    if (auth) {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      if (cred && cred.user) {
        commitUserSession(cred.user, false);
        return false;
      }
    }
  } catch (fbErr) {
    console.warn('Firebase SDK login error:', fbErr);
    const code = fbErr.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/too-many-requests') {
      if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
      showAuthError(mapAuthErrorCode(code, fbErr.message));
      return false;
    }
  }

  // Tier 2: Direct Google Identity Toolkit REST API
  try {
    const userRecord = await restFirebaseSignIn(email, password);
    if (userRecord && userRecord.email) {
      commitUserSession(userRecord, false);
      return false;
    }
  } catch (restErr) {
    console.warn('Firebase REST login error:', restErr);
    const msg = restErr.message || '';
    if (msg.includes('INVALID_PASSWORD') || msg.includes('EMAIL_NOT_FOUND') || msg.includes('USER_DISABLED') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
      if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
      showAuthError(mapAuthErrorCode(msg));
      return false;
    }
  }

  // Tier 3: Local Server API (if server is running)
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        commitUserSession(data.user, false);
        return false;
      }
    }
  } catch (_) {}

  // Tier 4: Super Admin Credential Direct Verification
  if (email === 'omvinayakwork@gmail.com' && (password === 'OMvinayak@01092003' || password === 'Omvinayak@01092003')) {
    commitUserSession({
      uid: 'aJC901OkCjU5UvqUUF9tvaqpdbn1',
      email: 'omvinayakwork@gmail.com',
      displayName: 'RJ Fashion Admin (Om Vinayak)',
      role: 'admin'
    }, false);
    return false;
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
  showAuthError('Invalid email or password. Please verify your credentials or use Forgot Password.');
  return false;
}

// ─────────────────────────────────────────────────────────────
// 3. Customer Registration (Multi-tier fallback)
// ─────────────────────────────────────────────────────────────
async function handleCustomerRegister(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  hideAuthError();

  const name = (document.getElementById('reg-name').value || '').trim();
  const email = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  const phone = (document.getElementById('reg-phone').value || '').trim();
  const password = document.getElementById('reg-password').value || '';
  const confirmPassword = document.getElementById('reg-confirm-password').value || '';

  if (!name) { showAuthError('Please enter your full name.'); return false; }
  if (!email) { showAuthError('Please enter a valid email address.'); return false; }
  if (password !== confirmPassword) { showAuthError('Passwords do not match. Please re-enter.'); return false; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters in length.'); return false; }

  const btn = document.getElementById('customer-register-submit');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>ENROLLING PATRON...</span>';
  }

  // Tier 1: Firebase Client SDK
  try {
    const auth = ensureFirebaseInit();
    if (auth) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (cred && cred.user) {
        if (cred.user.updateProfile) {
          try { await cred.user.updateProfile({ displayName: name }); } catch (_) {}
        }

        if (firebase.firestore) {
          try {
            await firebase.firestore().collection('users').doc(cred.user.uid).set({
              uid: cred.user.uid,
              name,
              email,
              phone,
              role: 'customer',
              tier: 'Patron',
              created_at: new Date().toISOString()
            }, { merge: true });
          } catch (_) {}
        }

        commitUserSession({ uid: cred.user.uid, name, email, phone, role: 'customer' }, true);
        return false;
      }
    }
  } catch (fbErr) {
    console.warn('Firebase registration error:', fbErr);
    const code = fbErr.code || '';
    if (code === 'auth/email-already-in-use' || code === 'auth/weak-password' || code === 'auth/invalid-email') {
      if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
      showAuthError(mapAuthErrorCode(code, fbErr.message));
      return false;
    }
  }

  // Tier 2: Firebase REST API
  try {
    const userRecord = await restFirebaseSignUp(email, password, name);
    if (userRecord && userRecord.email) {
      commitUserSession(userRecord, true);
      return false;
    }
  } catch (restErr) {
    console.warn('Firebase REST registration error:', restErr);
    const msg = restErr.message || '';
    if (msg.includes('EMAIL_EXISTS')) {
      if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
      showAuthError('An account with this email address already exists. Please sign in instead.');
      return false;
    }
  }

  // Tier 3: Local Server API
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, confirmPassword })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        commitUserSession(data.user, true);
        return false;
      }
    }
  } catch (_) {}

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
  showAuthError('Registration could not be completed. Please try again.');
  return false;
}

// ─────────────────────────────────────────────────────────────
// 4. Password Recovery Flow
// ─────────────────────────────────────────────────────────────
function openResetPasswordModal() {
  const modal = document.getElementById('reset-password-modal');
  const err = document.getElementById('reset-modal-error');
  const succ = document.getElementById('reset-modal-success');
  const emailInput = document.getElementById('reset-email');
  const loginEmail = document.getElementById('login-email');

  if (err) err.style.display = 'none';
  if (succ) succ.style.display = 'none';
  if (emailInput && loginEmail) emailInput.value = loginEmail.value.trim();
  if (modal) modal.style.display = 'flex';
}

function closeResetPasswordModal() {
  const modal = document.getElementById('reset-password-modal');
  if (modal) modal.style.display = 'none';
}

async function handleSendPasswordReset(e) {
  if (e && e.preventDefault) e.preventDefault();
  const errEl = document.getElementById('reset-modal-error');
  const succEl = document.getElementById('reset-modal-success');
  const submitBtn = document.getElementById('reset-submit-btn');
  const email = (document.getElementById('reset-email').value || '').trim().toLowerCase();

  if (errEl) errEl.style.display = 'none';
  if (succEl) succEl.style.display = 'none';

  if (!email) {
    if (errEl) {
      errEl.textContent = 'Please enter your registered patron email.';
      errEl.style.display = 'block';
    }
    return false;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
  }

  // Try Firebase Client SDK
  try {
    const auth = ensureFirebaseInit();
    if (auth) {
      await auth.sendPasswordResetEmail(email);
      if (succEl) {
        succEl.textContent = `Password reset instructions dispatched to ${email}. Please check your inbox.`;
        succEl.style.display = 'block';
      }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'SEND LINK'; }
      return false;
    }
  } catch (err) {
    console.warn('SDK reset notice:', err);
  }

  // Try Direct REST API
  try {
    await restFirebasePasswordReset(email);
    if (succEl) {
      succEl.textContent = `Password reset instructions dispatched to ${email}. Please check your inbox.`;
      succEl.style.display = 'block';
    }
  } catch (err) {
    console.warn('REST reset notice:', err);
    if (errEl) {
      errEl.textContent = mapAuthErrorCode(err.message);
      errEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND LINK';
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// Expose functions globally for immediate HTML event binding
// ─────────────────────────────────────────────────────────────
window.handleCustomerLogin = handleCustomerLogin;
window.handleCustomerRegister = handleCustomerRegister;
window.handleGoogleSignIn = handleGoogleSignIn;
window.switchAuthTab = switchAuthTab;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.handleSendPasswordReset = handleSendPasswordReset;
window.hideAuthError = hideAuthError;

// ─────────────────────────────────────────────────────────────
// Dual Immediate & DOMContentLoaded initialization
// ─────────────────────────────────────────────────────────────
function initAuthForms() {
  const loginForm = document.getElementById('customer-login-form');
  const registerForm = document.getElementById('customer-register-form');

  if (loginForm && !loginForm.__authBound) {
    loginForm.addEventListener('submit', handleCustomerLogin);
    loginForm.__authBound = true;
  }
  if (registerForm && !registerForm.__authBound) {
    registerForm.addEventListener('submit', handleCustomerRegister);
    registerForm.__authBound = true;
  }

  // Check URL params for register mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'register') {
    switchAuthTab('register');
  }

  // Check for Google Redirect Result
  try {
    const auth = ensureFirebaseInit();
    if (auth && auth.getRedirectResult) {
      auth.getRedirectResult().then(res => {
        if (res && res.user) {
          commitUserSession(res.user, false);
        }
      }).catch(err => {
        console.warn('Redirect auth result notice:', err);
      });
    }
  } catch (_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthForms);
} else {
  initAuthForms();
}
