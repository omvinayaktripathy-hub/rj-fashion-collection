const escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
// RJ FASHION COLLECTION - PATRON AUTHENTICATION CONTROLLER
// Supports 1-Click Google Sign-In, Firebase Auth, Password Recovery & Dual-Key State Sync

const API_BASE = window.API_BASE || '/api';

const firebaseConfig = {
  apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
  authDomain: "rj-fashion-collection.firebaseapp.com",
  projectId: "rj-fashion-collection",
  storageBucket: "rj-fashion-collection.firebasestorage.app",
  messagingSenderId: "136818820501",
  appId: "1:136818820501:web:251f54494df4209854a29c",
  measurementId: "G-LL5KRD9639"
};

// Initialize Firebase client SDK
if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('Firebase client init notification:', err.message);
  }
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
  switch (code) {
    case 'auth/user-not-found':
      return 'No patron account found with this email. Please check your spelling or register.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify your credentials or reset your password.';
    case 'auth/invalid-credential':
      return 'Invalid credentials provided. Please check your email and password, or sign in with Google.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to repeated failed attempts. Please reset your password or try again later.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in popup was closed before authentication could finish.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return fallbackMessage || 'Authentication failed. Please verify your information and try again.';
  }
}

// Persist user state to all storage keys & dispatch global update events
function commitUserSession(userObj, isNew = false) {
  const isOwner = (userObj.email && userObj.email.toLowerCase() === 'omvinayakwork@gmail.com') || false;
  const displayName = userObj.displayName || userObj.name || (userObj.email ? userObj.email.split('@')[0] : 'Patron');

  const sessionUser = {
    id: userObj.uid || userObj.id || 'patron-' + Date.now(),
    uid: userObj.uid || userObj.id || 'patron-' + Date.now(),
    name: displayName,
    email: userObj.email || '',
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

  setTimeout(() => {
    window.location.href = getRedirectUrl();
  }, 700);
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
    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('Firebase Authentication is loading. Please try again.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    // Save profile to Cloud Firestore if available
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
// 2. Email / Password Login
// ─────────────────────────────────────────────────────────────
async function handleCustomerLogin(e) {
  e.preventDefault();
  hideAuthError();

  const btn = document.getElementById('customer-login-submit');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'AUTHENTICATING PATRON...';
  }

  const email = (document.getElementById('login-email').value || '').trim().toLowerCase();
  const password = document.getElementById('login-password').value || '';

  // Step A: Local Server API
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
        return;
      }
    }
  } catch (_) {}

  // Step B: Firebase Authentication
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      if (cred && cred.user) {
        commitUserSession(cred.user, false);
        return;
      }
    } catch (fbErr) {
      console.warn('Firebase login check:', fbErr);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
      showAuthError(mapAuthErrorCode(fbErr.code, fbErr.message));
      return;
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
  showAuthError('Invalid email or password. Please verify your patron credentials.');
}

// ─────────────────────────────────────────────────────────────
// 3. Customer Registration
// ─────────────────────────────────────────────────────────────
async function handleCustomerRegister(e) {
  e.preventDefault();
  hideAuthError();

  const name = (document.getElementById('reg-name').value || '').trim();
  const email = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  const phone = (document.getElementById('reg-phone').value || '').trim();
  const password = document.getElementById('reg-password').value || '';
  const confirmPassword = document.getElementById('reg-confirm-password').value || '';

  if (password !== confirmPassword) {
    showAuthError('Passwords do not match. Please re-enter.');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters in length.');
    return;
  }

  const btn = document.getElementById('customer-register-submit');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'ENROLLING PATRON...';
  }

  // Step A: Local Server API
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
        return;
      }
    }
  } catch (_) {}

  // Step B: Firebase Authentication
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      if (user.updateProfile) {
        try {
          await user.updateProfile({ displayName: name });
        } catch (_) {}
      }

      if (firebase.firestore) {
        try {
          await firebase.firestore().collection('users').doc(user.uid).set({
            uid: user.uid,
            name,
            email,
            phone,
            role: 'customer',
            tier: 'Patron',
            created_at: new Date().toISOString()
          }, { merge: true });
        } catch (_) {}
      }

      commitUserSession({
        uid: user.uid,
        name,
        email: user.email,
        phone,
        role: 'customer'
      }, true);
      return;
    } catch (fbErr) {
      console.warn('Firebase registration check:', fbErr);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
      showAuthError(mapAuthErrorCode(fbErr.code, fbErr.message));
      return;
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
  showAuthError('Registration could not be completed. Please try again.');
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
  e.preventDefault();
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
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
  }

  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      await firebase.auth().sendPasswordResetEmail(email);
      if (succEl) {
        succEl.textContent = `Password reset instructions dispatched to ${email}. Please check your inbox.`;
        succEl.style.display = 'block';
      }
    } else {
      throw new Error('Authentication services are initializing.');
    }
  } catch (err) {
    console.warn('Password reset notice:', err);
    if (errEl) {
      errEl.textContent = mapAuthErrorCode(err.code, err.message);
      errEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND LINK';
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DOM Event Listeners Initialization
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('customer-login-form');
  const registerForm = document.getElementById('customer-register-form');

  if (loginForm) loginForm.addEventListener('submit', handleCustomerLogin);
  if (registerForm) registerForm.addEventListener('submit', handleCustomerRegister);

  // Check URL params for register mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'register') {
    switchAuthTab('register');
  }
});
