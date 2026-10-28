import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  X
} from 'lucide-react';
import { useStore, UserProfile } from '../context';

/* =========================================================================
   FIREBASE CLIENT HELPER & CONFIG
   ========================================================================= */

declare global {
  interface Window {
    firebase?: any;
    API_BASE?: string;
  }
}

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
  authDomain: "rj-fashion-collection.firebaseapp.com",
  projectId: "rj-fashion-collection",
  storageBucket: "rj-fashion-collection.firebasestorage.app",
  messagingSenderId: "136818820501",
  appId: "1:136818820501:web:251f54494df4209854a29c",
  measurementId: "G-LL5KRD9639"
};

async function getClientFirebaseAuth(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if (window.firebase && window.firebase.auth) {
    if (!window.firebase.apps || !window.firebase.apps.length) {
      try {
        window.firebase.initializeApp(FIREBASE_CONFIG);
      } catch (_) {}
    }
    return window.firebase.auth();
  }

  const loadScript = (src: string) => {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  };

  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js');
    if (window.firebase && window.firebase.auth) {
      if (!window.firebase.apps || !window.firebase.apps.length) {
        try {
          window.firebase.initializeApp(FIREBASE_CONFIG);
        } catch (_) {}
      }
      return window.firebase.auth();
    }
  } catch (err) {
    console.warn('Firebase dynamic load notification:', err);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Direct Firebase Identity Toolkit REST API fallbacks
// ─────────────────────────────────────────────────────────────
async function restFirebaseSignIn(email: string, password: string): Promise<any> {
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

async function restFirebaseSignUp(email: string, password: string, displayName?: string): Promise<any> {
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

async function restFirebasePasswordReset(email: string): Promise<boolean> {
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

function mapAuthErrorCode(code: string, fallbackMessage?: string): string {
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
    return 'Your password should be at least 6 characters for adequate security.';
  }
  if (clean.includes('INVALID_EMAIL') || clean.includes('INVALID-EMAIL')) {
    return 'Please provide a valid email address.';
  }
  if (clean.includes('TOO_MANY_ATTEMPTS') || clean.includes('TOO-MANY-REQUESTS')) {
    return 'Access temporarily blocked due to repeated failed attempts. Please reset your password or try again later.';
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
    return 'Authentication from this origin is restricted. Please sign in with email and password.';
  }
  if (clean.includes('NETWORK') || clean.includes('FETCH_FAILED')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  return fallbackMessage || 'Authentication failed. Please check your information and try again.';
}

/* =========================================================================
   LOGIN PAGE COMPONENT PROPS
   ========================================================================= */

export interface LoginPageProps {
  initialTab?: 'login' | 'register';
  redirectUrl?: string;
  onSuccess?: (user: UserProfile) => void;
  onNavigateTo?: (tab: 'home' | 'shop' | 'cart' | 'wishlist' | 'account' | 'delivery' | 'payment' | 'checkout') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialTab = 'login',
  redirectUrl,
  onSuccess,
  onNavigateTo
}) => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Password reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if returning from Google redirect flow
  useEffect(() => {
    getClientFirebaseAuth().then(auth => {
      if (auth && auth.getRedirectResult) {
        auth.getRedirectResult().then((result: any) => {
          if (result && result.user) {
            handleAuthSuccess(result.user, false);
          }
        }).catch((err: any) => {
          console.warn('Redirect auth result:', err);
        });
      }
    });
  }, []);

  // Determine redirection target from props or URL query
  const getDestinationUrl = () => {
    if (redirectUrl) return redirectUrl;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRedirect = params.get('redirect');
      if (urlRedirect) return urlRedirect;
    }
    return '/account.html';
  };

  // Perform post-auth state synchronization & redirection
  const handleAuthSuccess = (rawUser: any, isNewUser = false) => {
    const isOwner = (rawUser.email && rawUser.email.toLowerCase() === 'omvinayakwork@gmail.com') || false;
    const displayName = rawUser.displayName || rawUser.name || (rawUser.email ? rawUser.email.split('@')[0] : 'Patron');

    const normalizedUser: UserProfile = {
      name: displayName,
      email: rawUser.email || '',
      phone: rawUser.phoneNumber || rawUser.phone || '',
      role: isOwner ? 'admin' : (rawUser.role || 'customer'),
      avatar: rawUser.photoURL || rawUser.photo || rawUser.avatar || '',
      tier: 'Patron',
      joinedDate: rawUser.joinedDate || new Date().toISOString()
    };

    // Purge any tokens from localStorage and sessionStorage for strict security compliance
    ['token', 'session_token', 'auth_token', 'id_token', 'idToken', 'jwt', 'rjfc_token', 'rj_session_token'].forEach(k => {
      try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {}
    });

    // 1. Persist to dual local storage keys for absolute cross-system compatibility
    try {
      localStorage.setItem('rj_user', JSON.stringify(normalizedUser));
      localStorage.setItem('rjfc_user', JSON.stringify(normalizedUser));
      sessionStorage.setItem('rj_user', JSON.stringify(normalizedUser));
      sessionStorage.setItem('rjfc_user', JSON.stringify(normalizedUser));
    } catch (_) {}

    // 2. Update central React context
    if (store && store.login) {
      store.login(normalizedUser);
    }

    // 3. Dispatch global events for instant reactive header update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rjfc_user_updated', { detail: normalizedUser }));
      window.dispatchEvent(new Event('storage'));
    }

    // 4. Trigger feedback toast
    const welcomeMsg = isNewUser
      ? `Welcome to the Atelier, ${normalizedUser.name}! 👑`
      : `Welcome back, ${normalizedUser.name}! 👑`;
    if (store && store.showToast) {
      store.showToast(welcomeMsg, 'success');
    }

    // 5. Callback or redirect
    if (onSuccess) {
      onSuccess(normalizedUser);
    }

    const dest = getDestinationUrl();
    if (onNavigateTo) {
      if (dest.includes('checkout') || dest.includes('payment')) {
        onNavigateTo('payment');
        return;
      }
      if (dest.includes('delivery')) {
        onNavigateTo('delivery');
        return;
      }
      if (dest.includes('cart')) {
        onNavigateTo('cart');
        return;
      }
      if (dest.includes('account')) {
        onNavigateTo('account');
        return;
      }
    }

    // Window navigation fallback
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = dest;
      }
    }, 600);
  };

  /* ─────────────────────────────────────────────────────────────
     1. EMAIL / PASSWORD SIGN IN
     ───────────────────────────────────────────────────────────── */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    // Tier 1: Firebase Authentication Client SDK
    try {
      const auth = await getClientFirebaseAuth();
      if (auth) {
        const cred = await auth.signInWithEmailAndPassword(trimmedEmail, password);
        if (cred && cred.user) {
          handleAuthSuccess(cred.user, false);
          return;
        }
      }
    } catch (fbErr: any) {
      console.warn('Firebase SDK login:', fbErr);
      const code = fbErr?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/too-many-requests') {
        setErrorMessage(mapAuthErrorCode(code, fbErr?.message));
        setIsLoading(false);
        return;
      }
    }

    // Tier 2: Google Identity Toolkit REST API (bypasses adblockers/CDN blocks)
    try {
      const restUser = await restFirebaseSignIn(trimmedEmail, password);
      if (restUser && restUser.email) {
        handleAuthSuccess(restUser, false);
        return;
      }
    } catch (restErr: any) {
      console.warn('Firebase REST login:', restErr);
      const msg = restErr?.message || '';
      if (msg.includes('INVALID_PASSWORD') || msg.includes('EMAIL_NOT_FOUND') || msg.includes('USER_DISABLED') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
        setErrorMessage(mapAuthErrorCode(msg));
        setIsLoading(false);
        return;
      }
    }

    // Tier 3: Local Server API (if server is active)
    try {
      const apiBase = window.API_BASE || '/api';
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          handleAuthSuccess(data.user, false);
          return;
        }
      }
    } catch (_) {
      // Continue to Tier 4
    }

    // Tier 4: Direct Super Admin Credential Verification
    if (trimmedEmail === 'omvinayakwork@gmail.com' && (password === 'OMvinayak@01092003' || password === 'Omvinayak@01092003')) {
      handleAuthSuccess({
        uid: 'aJC901OkCjU5UvqUUF9tvaqpdbn1',
        email: 'omvinayakwork@gmail.com',
        displayName: 'RJ Fashion Admin (Om Vinayak)',
        role: 'admin'
      }, false);
      return;
    }

    setErrorMessage('Invalid email or password. Please verify your credentials or use Forgot Password.');
    setIsLoading(false);
  };

  /* ─────────────────────────────────────────────────────────────
     2. REGISTRATION
     ───────────────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    setIsLoading(true);
    const trimmedEmail = regEmail.trim().toLowerCase();
    const trimmedName = regName.trim();
    const trimmedPhone = regPhone.trim();

    // Tier 1: Firebase Authentication Client SDK
    try {
      const auth = await getClientFirebaseAuth();
      if (auth) {
        const cred = await auth.createUserWithEmailAndPassword(trimmedEmail, regPassword);
        if (cred && cred.user) {
          if (cred.user.updateProfile) {
            try {
              await cred.user.updateProfile({ displayName: trimmedName });
            } catch (_) {}
          }

          // Optional Firestore patron profile record
          if (window.firebase && window.firebase.firestore) {
            try {
              await window.firebase.firestore().collection('users').doc(cred.user.uid).set({
                uid: cred.user.uid,
                name: trimmedName,
                email: trimmedEmail,
                phone: trimmedPhone,
                role: 'customer',
                tier: 'Patron',
                created_at: new Date().toISOString()
              }, { merge: true });
            } catch (_) {}
          }

          const newUserPayload = {
            uid: cred.user.uid,
            name: trimmedName,
            email: cred.user.email,
            phone: trimmedPhone,
            role: 'customer'
          };
          handleAuthSuccess(newUserPayload, true);
          return;
        }
      }
    } catch (fbErr: any) {
      console.warn('Registration attempt:', fbErr);
      const code = fbErr?.code || '';
      if (code === 'auth/email-already-in-use' || code === 'auth/invalid-email' || code === 'auth/weak-password') {
        setErrorMessage(mapAuthErrorCode(code, fbErr?.message));
        setIsLoading(false);
        return;
      }
    }

    // Tier 2: Google Identity Toolkit REST API
    try {
      const restUser = await restFirebaseSignUp(trimmedEmail, regPassword, trimmedName);
      if (restUser && restUser.email) {
        handleAuthSuccess({
          uid: restUser.uid,
          name: trimmedName,
          email: restUser.email,
          phone: trimmedPhone,
          role: 'customer'
        }, true);
        return;
      }
    } catch (restErr: any) {
      console.warn('REST registration attempt:', restErr);
      const msg = restErr?.message || '';
      if (msg.includes('EMAIL_EXISTS')) {
        setErrorMessage('An account with this email address already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }
    }

    // Tier 3: Local Server API
    try {
      const apiBase = window.API_BASE || '/api';
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password: regPassword,
          confirmPassword: regConfirmPassword
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          handleAuthSuccess(data.user, true);
          return;
        }
      }
    } catch (_) {
      // Continue
    }

    setErrorMessage('Unable to complete patron registration. Please try again.');
    setIsLoading(false);
  };

  /* ─────────────────────────────────────────────────────────────
     3. 1-CLICK GOOGLE SIGN-IN VIA FIREBASE POPUP
     ───────────────────────────────────────────────────────────── */
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);

    try {
      const auth = await getClientFirebaseAuth();
      if (!auth || !window.firebase) {
        throw new Error('Google Sign-In is blocked or unavailable in this browser. Please sign in using your email and password below.');
      }

      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      let result = null;
      try {
        result = await auth.signInWithPopup(provider);
      } catch (popupErr: any) {
        console.warn('Popup error:', popupErr);
        if (popupErr.code === 'auth/popup-blocked') {
          // Fall back to redirect flow
          await auth.signInWithRedirect(provider);
          return;
        }
        throw popupErr;
      }

      if (result && result.user) {
        const u = result.user;

        // Persist to Cloud Firestore if available
        if (window.firebase.firestore) {
          try {
            await window.firebase.firestore().collection('users').doc(u.uid).set({
              uid: u.uid,
              name: u.displayName || u.email.split('@')[0],
              email: u.email,
              photo: u.photoURL || '',
              role: (u.email && u.email.toLowerCase() === 'omvinayakwork@gmail.com') ? 'admin' : 'customer',
              tier: 'Patron',
              last_login: new Date().toISOString()
            }, { merge: true });
          } catch (_) {}
        }

        handleAuthSuccess(u, false);
        return;
      }
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google sign-in was cancelled. Please try again whenever you are ready.');
      } else {
        setErrorMessage(mapAuthErrorCode(err.code, err.message));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     4. PASSWORD RESET EMAIL
     ───────────────────────────────────────────────────────────── */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    const trimmed = resetEmail.trim().toLowerCase();
    if (!trimmed) {
      setResetError('Please enter the email address linked to your patron profile.');
      setResetLoading(false);
      return;
    }

    // Tier 1: Client SDK
    try {
      const auth = await getClientFirebaseAuth();
      if (auth) {
        await auth.sendPasswordResetEmail(trimmed);
        setResetSuccess(`Password reset instructions have been dispatched to ${trimmed}. Please check your inbox.`);
        setResetLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('SDK reset email error:', err);
    }

    // Tier 2: Google Identity Toolkit REST API
    try {
      await restFirebasePasswordReset(trimmed);
      setResetSuccess(`Password reset instructions have been dispatched to ${trimmed}. Please check your inbox.`);
      setResetLoading(false);
      return;
    } catch (restErr: any) {
      console.warn('REST reset error:', restErr);
      setResetError(mapAuthErrorCode(restErr?.message || 'RESET_FAILED'));
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full py-8 sm:py-14 px-4 flex items-center justify-center">
      {/* Luxury Centered Atelier Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#141418] border border-[#E5E0D8] dark:border-white/10 rounded-2xl shadow-xl shadow-black/5 overflow-hidden transition-all duration-300">
        
        {/* Card Header & Crowned Monogram Identity */}
        <div className="pt-8 pb-6 px-8 text-center border-b border-[#E5E0D8]/60 dark:border-white/5 bg-gradient-to-b from-neutral-50/70 to-transparent dark:from-white/[0.02]">
          <div className="flex justify-center mb-4">
            <div className="relative w-14 h-14 flex items-center justify-center transition-transform duration-300 hover:scale-105">
              <img
                src="/images/rj-logo-monogram.png"
                alt="RJ Fashion Collection Official Monogram"
                width={54}
                height={54}
                className="w-full h-full object-contain dark:hidden"
                loading="eager"
              />
              <img
                src="/images/rj-logo-monogram-dark.png"
                alt="RJ Fashion Collection Official Monogram (Dark)"
                width={54}
                height={54}
                className="w-full h-full object-contain hidden dark:block"
                loading="eager"
              />
            </div>
          </div>

          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#C5A880] uppercase block">
            THE ROYAL BRIDAL HOUSE
          </span>
          <h1 className="font-serif text-lg sm:text-xl font-bold tracking-[0.15em] text-neutral-900 dark:text-white uppercase mt-1">
            WELCOME TO THE ATELIER
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Sign in to access your curated orders, saved looks, and bridal concierge services.
          </p>
        </div>

        {/* Dual Tab Navigation */}
        <div className="grid grid-cols-2 border-b border-[#E5E0D8] dark:border-white/10 bg-neutral-50/50 dark:bg-black/20 text-xs font-semibold tracking-wider uppercase">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
            }}
            className={`py-3.5 text-center transition-all relative ${
              activeTab === 'login'
                ? 'text-neutral-900 dark:text-white bg-white dark:bg-[#141418] font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <span>Sign In</span>
            {activeTab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A880]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`py-3.5 text-center transition-all relative ${
              activeTab === 'register'
                ? 'text-neutral-900 dark:text-white bg-white dark:bg-[#141418] font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <span>Create Account</span>
            {activeTab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A880]" />
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">

          {/* Inline Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300 p-0.5"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1-Click Google Sign-In */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold tracking-wider flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" />
                  <span>CONNECTING TO GOOGLE...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>CONTINUE WITH GOOGLE</span>
                </>
              )}
            </button>
          </div>

          {/* Luxury Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-[#E5E0D8] dark:bg-white/10" />
            <span className="px-3 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="flex-1 h-px bg-[#E5E0D8] dark:bg-white/10" />
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patron@example.com"
                    autoComplete="email"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetOpen(true);
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="text-[11px] text-[#8C6D3F] dark:text-[#C5A880] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your confidential password"
                    autoComplete="current-password"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-10 py-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" />
                    <span>AUTHENTICATING PATRON...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO ATELIER</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
                New to RJ Fashion Collection?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage('');
                  }}
                  className="text-neutral-900 dark:text-white font-bold hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Maharani Gayatri"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="patron@example.com"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Password (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create your confidential password"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password to verify"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" />
                    <span>ENROLLING PATRON...</span>
                  </>
                ) : (
                  <>
                    <span>CREATE PATRON ACCOUNT</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage('');
                  }}
                  className="text-neutral-900 dark:text-white font-bold hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Security & Authenticity Trust Assurance */}
          <div className="mt-8 pt-5 border-t border-[#E5E0D8]/70 dark:border-white/5 flex items-center justify-center gap-4 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F382A] dark:text-emerald-400" />
              <span>256-Bit SSL Encryption</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>100% Authentic Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#18181E] border border-[#E5E0D8] dark:border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C5A880]/10 flex items-center justify-center text-[#8C6D3F] dark:text-[#C5A880]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-white">
                  Reset Password
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Patron Confidential Recovery
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              Enter your patron email address. We will dispatch a secure link to reset your account password.
            </p>

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {!resetSuccess ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="patron@example.com"
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black dark:focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Send Link</span>}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
