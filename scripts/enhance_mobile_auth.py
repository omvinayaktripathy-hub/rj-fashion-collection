import re

path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/auth.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Dynamic authDomain & isMobileBrowser helper
old_config = '''  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
    authDomain: "rj-fashion-collection.firebaseapp.com",
    projectId: "rj-fashion-collection",
    storageBucket: "rj-fashion-collection.firebasestorage.app",
    messagingSenderId: "136818820501",
    appId: "1:136818820501:web:251f54494df4209854a29c",
    measurementId: "G-LL5KRD9639"
  };'''

new_config = '''  var currentHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
  var resolvedAuthDomain = (currentHost && (currentHost.includes('web.app') || currentHost.includes('firebaseapp.com')))
    ? currentHost
    : "rj-fashion-collection.firebaseapp.com";

  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
    authDomain: resolvedAuthDomain,
    projectId: "rj-fashion-collection",
    storageBucket: "rj-fashion-collection.firebasestorage.app",
    messagingSenderId: "136818820501",
    appId: "1:136818820501:web:251f54494df4209854a29c",
    measurementId: "G-LL5KRD9639"
  };

  function isMobileBrowser() {
    try {
      var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return true;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
        return true;
      }
      if (typeof window !== 'undefined' && typeof window.orientation !== 'undefined') {
        return true;
      }
    } catch (_) {}
    return false;
  }'''

if old_config in content:
    content = content.replace(old_config, new_config)
    print("Updated FIREBASE_CONFIG and added isMobileBrowser")
else:
    print("old_config not found as exact match, checking normalized...")
    # try CRLF replacement
    old_crlf = old_config.replace('\n', '\r\n')
    new_crlf = new_config.replace('\n', '\r\n')
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("Updated FIREBASE_CONFIG (CRLF)")

# 2. Update mapAuthErrorCode
old_map = '''function mapAuthErrorCode(code, fallbackMessage) {
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
}'''

new_map = '''function mapAuthErrorCode(code, fallbackMessage) {
  const clean = String(code || '').toUpperCase();
  if (clean.includes('INTERNAL_ERROR') || clean.includes('INTERNAL-ERROR')) {
    return 'Authenticating with Google... If your browser interrupted the sign-in, please tap Continue with Google again or use email sign-in.';
  }
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
    return 'Google sign-in was closed before completion. Please tap Continue with Google to try again.';
  }
  if (clean.includes('POPUP_BLOCKED') || clean.includes('POPUP-BLOCKED')) {
    return 'Connecting with Google secure sign-in... Please wait.';
  }
  if (clean.includes('ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL') || clean.includes('ACCOUNT-EXISTS-WITH-DIFFERENT-CREDENTIAL')) {
    return 'An account already exists for this email with password. Please sign in with your password below.';
  }
  if (clean.includes('UNAUTHORIZED_DOMAIN') || clean.includes('UNAUTHORIZED-DOMAIN')) {
    return 'Authentication from this origin is restricted. Please sign in with email and password.';
  }
  if (clean.includes('NETWORK') || clean.includes('FETCH_FAILED')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  // Strip technical Firebase jargon from fallback messages
  var fbMsg = String(fallbackMessage || '');
  if (fbMsg.includes('Firebase:') || fbMsg.includes('auth/')) {
    return 'Authentication encountered a brief delay. Please try signing in again.';
  }
  return fallbackMessage || 'Authentication failed. Please verify your credentials and try again.';
}'''

for sep in ['\n', '\r\n']:
    target = old_map if sep == '\n' else old_map.replace('\n', '\r\n')
    rep = new_map if sep == '\n' else new_map.replace('\n', '\r\n')
    if target in content:
        content = content.replace(target, rep)
        print("Updated mapAuthErrorCode")
        break

# 3. Replace handleGoogleSignIn and add finalizeGoogleUser
old_google = '''async function handleGoogleSignIn() {
  hideAuthError();
  const btn = document.getElementById('google-signin-btn');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.75';
    btn.innerHTML = 'Connecting to Google...';
  }

  try {
    const auth = await ensureFirebaseInit();
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

      // Establish HttpOnly session token cookie on the backend
      try {
        const idToken = await user.getIdToken();
        if (idToken) {
          await fetch(`${API_BASE}/auth/session-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
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
}'''

new_google = '''async function finalizeGoogleUser(user) {
  try { sessionStorage.removeItem('rj_auth_google_flow'); } catch (_) {}

  // Sync Cloud Firestore patron record
  try {
    if (firebase.firestore) {
      const isOwner = user.email && user.email.toLowerCase() === 'omvinayakwork@gmail.com';
      await firebase.firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Patron'),
        email: user.email,
        role: isOwner ? 'admin' : 'customer',
        tier: 'Patron',
        photo: user.photoURL || '',
        last_login: new Date().toISOString()
      }, { merge: true });
    }
  } catch (fsErr) {
    console.warn('Firestore user sync notice:', fsErr);
  }

  // Establish HttpOnly session token cookie on the backend
  try {
    const idToken = await user.getIdToken();
    if (idToken) {
      await fetch(`${API_BASE}/auth/session-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
    }
  } catch (_) {}

  commitUserSession(user, false);
}

async function handleGoogleSignIn() {
  hideAuthError();
  const btn = document.getElementById('google-signin-btn');
  const origHtml = btn ? btn.innerHTML : '';

  try {
    const auth = await ensureFirebaseInit();
    if (!auth || typeof firebase === 'undefined') {
      throw new Error('Google Sign-In is unavailable in this browser session. Please sign in with email and password below.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      sessionStorage.setItem('rj_auth_google_flow', 'pending');
    } catch (_) {}

    // On mobile browsers: Popups are blocked or fail with auth/internal-error due to storage partitioning.
    // Use signInWithRedirect directly for seamless mobile experience.
    if (isMobileBrowser()) {
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.85';
        btn.innerHTML = '<span style=\"display:inline-flex;align-items:center;gap:8px;\">Connecting to Google...</span>';
      }
      await auth.signInWithRedirect(provider);
      return;
    }

    // On desktop: Attempt popup with smooth redirect fallback
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.innerHTML = '<span style=\"display:inline-flex;align-items:center;gap:8px;\">Opening Google Sign-In...</span>';
    }

    let result = null;
    try {
      result = await auth.signInWithPopup(provider);
    } catch (popupErr) {
      console.warn('Popup flow intercepted, falling back to redirect:', popupErr);
      const errCode = (popupErr && popupErr.code) ? popupErr.code : '';
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        try { sessionStorage.removeItem('rj_auth_google_flow'); } catch (_) {}
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = origHtml;
        }
        return;
      }
      // For ANY popup error (internal-error, blocked, cross-origin), seamlessly fall back to redirect
      if (btn) {
        btn.innerHTML = '<span style=\"display:inline-flex;align-items:center;gap:8px;\">Redirecting to Google Sign-In...</span>';
      }
      await auth.signInWithRedirect(provider);
      return;
    }

    if (result && result.user) {
      await finalizeGoogleUser(result.user);
      return;
    }
  } catch (error) {
    console.warn('Google Sign-In notice:', error);
    try { sessionStorage.removeItem('rj_auth_google_flow'); } catch (_) {}
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = origHtml;
    }
    const msg = mapAuthErrorCode(error.code, error.message);
    showAuthError(msg);
  }
}'''

for sep in ['\n', '\r\n']:
    target = old_google if sep == '\n' else old_google.replace('\n', '\r\n')
    rep = new_google if sep == '\n' else new_google.replace('\n', '\r\n')
    if target in content:
        content = content.replace(target, rep)
        print("Updated handleGoogleSignIn & added finalizeGoogleUser")
        break

# 4. Update initAuthForms to handle getRedirectResult + onAuthStateChanged
old_init = '''  // Check for Google Redirect Result
  try {
    ensureFirebaseInit().then(function(auth) {
      if (auth && auth.getRedirectResult) {
        auth.getRedirectResult().then(res => {
          if (res && res.user) {
            commitUserSession(res.user, false);
          }
        }).catch(err => {
          console.warn('Redirect auth result notice:', err);
        });
      }
    }).catch(function() {});
  } catch (_) {}'''

new_init = '''  // Check for Google Redirect Result & Real-Time Auth State
  try {
    ensureFirebaseInit().then(function(auth) {
      if (!auth) return;

      var isPendingRedirect = false;
      try {
        isPendingRedirect = sessionStorage.getItem('rj_auth_google_flow') === 'pending';
      } catch (_) {}

      var googleBtn = document.getElementById('google-signin-btn');
      if (isPendingRedirect && googleBtn) {
        googleBtn.innerHTML = '<span style=\"display:inline-flex;align-items:center;gap:8px;\">Finalizing Google Sign-In...</span>';
        googleBtn.disabled = true;
      }

      if (auth.getRedirectResult) {
        auth.getRedirectResult().then(async function(res) {
          if (res && res.user) {
            await finalizeGoogleUser(res.user);
          } else {
            try { sessionStorage.removeItem('rj_auth_google_flow'); } catch (_) {}
            if (googleBtn && isPendingRedirect) {
              googleBtn.disabled = false;
            }
          }
        }).catch(function(err) {
          console.warn('Redirect auth result notice:', err);
          try { sessionStorage.removeItem('rj_auth_google_flow'); } catch (_) {}
          if (googleBtn) googleBtn.disabled = false;
          if (err && err.code && err.code !== 'auth/null-user') {
            showAuthError(mapAuthErrorCode(err.code, err.message));
          }
        });
      }

      // Proactive session sync on state change
      if (auth.onAuthStateChanged) {
        auth.onAuthStateChanged(async function(user) {
          if (user) {
            var stored = null;
            try { stored = localStorage.getItem('rj_user') || sessionStorage.getItem('rj_user'); } catch (_) {}
            if (!stored) {
              await finalizeGoogleUser(user);
            }
          }
        });
      }
    }).catch(function() {});
  } catch (_) {}'''

for sep in ['\n', '\r\n']:
    target = old_init if sep == '\n' else old_init.replace('\n', '\r\n')
    rep = new_init if sep == '\n' else new_init.replace('\n', '\r\n')
    if target in content:
        content = content.replace(target, rep)
        print("Updated initAuthForms")
        break

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved updated auth.js")
