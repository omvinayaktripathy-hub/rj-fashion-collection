// RJ FASHION COLLECTION - CUSTOMER AUTHENTICATION CONTROLLER
// Supports 1-Click Google Sign-In, Firebase Auth & Local Sessions

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
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('Firebase client init:', err.message);
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

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginTabBtn.classList.add('active');
    registerTabBtn.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginTabBtn.classList.remove('active');
    registerTabBtn.classList.add('active');
  }
}

// ─────────────────────────────────────────────────────────────
// 1-Click Google Sign-In via Firebase Authentication
// ─────────────────────────────────────────────────────────────
async function handleGoogleSignIn() {
  const btn = document.getElementById('google-signin-btn');
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

    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    const isOwner = user.email && user.email.toLowerCase() === 'omvinayakwork@gmail.com';
    const sessionUser = {
      id: user.uid,
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      phone: user.phoneNumber || '',
      role: isOwner ? 'admin' : 'customer',
      photo: user.photoURL || ''
    };

    localStorage.setItem('rjfc_user', JSON.stringify(sessionUser));
    sessionStorage.setItem('rjfc_user', JSON.stringify(sessionUser));

    // Save profile to Cloud Firestore
    try {
      if (firebase.firestore) {
        const db = firebase.firestore();
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          name: sessionUser.name,
          email: sessionUser.email,
          role: sessionUser.role,
          photo: sessionUser.photo,
          last_login: new Date().toISOString()
        }, { merge: true });
      }
    } catch (_) {}

    showToast(`Welcome ${sessionUser.name}! Signed in with Google 👑`, 'success');
    setTimeout(() => {
      window.location.href = getRedirectUrl();
    }, 700);
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    showToast(error.message || 'Google Sign-In failed. Please try again.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Continue with Google</span>
      `;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Handle Customer Email/Password Login
// ─────────────────────────────────────────────────────────────
async function handleCustomerLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('customer-login-submit');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  // 1. Try local server API
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('rjfc_user', JSON.stringify(data.user));
        showToast('Logged in successfully!', 'success');
        setTimeout(() => {
          window.location.href = getRedirectUrl();
        }, 700);
        return;
      }
    }
  } catch (_) {}

  // 2. Fallback to Firebase Authentication
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = cred.user;
      const isOwner = email.toLowerCase() === 'omvinayakwork@gmail.com';
      const sessionUser = {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email,
        role: isOwner ? 'admin' : 'customer'
      };
      localStorage.setItem('rjfc_user', JSON.stringify(sessionUser));
      showToast('Signed in successfully!', 'success');
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 700);
      return;
    } catch (fbErr) {
      showToast(fbErr.message || 'Invalid email or password', 'error');
      btn.disabled = false;
      btn.textContent = 'SIGN IN';
      return;
    }
  }

  showToast('Invalid email or password. Please try again.', 'error');
  btn.disabled = false;
  btn.textContent = 'SIGN IN';
}

// ─────────────────────────────────────────────────────────────
// Handle Customer Registration
// ─────────────────────────────────────────────────────────────
async function handleCustomerRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('customer-register-submit');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    btn.disabled = false;
    btn.textContent = 'CREATE ACCOUNT';
    return;
  }

  // 1. Try local server API
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, confirmPassword })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('rjfc_user', JSON.stringify(data.user));
        showToast('Welcome to RJ Fashion Collection! Account created.', 'success');
        setTimeout(() => {
          window.location.href = getRedirectUrl();
        }, 800);
        return;
      }
    }
  } catch (_) {}

  // 2. Fallback to Firebase Authentication
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      await user.updateProfile({ displayName: name });
      const sessionUser = {
        id: user.uid,
        uid: user.uid,
        name: name,
        email: user.email,
        phone: phone,
        role: 'customer'
      };
      localStorage.setItem('rjfc_user', JSON.stringify(sessionUser));

      if (firebase.firestore) {
        await firebase.firestore().collection('users').doc(user.uid).set({
          uid: user.uid,
          name,
          email,
          phone,
          role: 'customer',
          created_at: new Date().toISOString()
        }, { merge: true });
      }

      showToast('Account created successfully! Welcome to RJ Collection.', 'success');
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 800);
      return;
    } catch (fbErr) {
      showToast(fbErr.message || 'Registration failed', 'error');
      btn.disabled = false;
      btn.textContent = 'CREATE ACCOUNT';
      return;
    }
  }

  showToast('Registration failed. Please try again.', 'error');
  btn.disabled = false;
  btn.textContent = 'CREATE ACCOUNT';
}

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
