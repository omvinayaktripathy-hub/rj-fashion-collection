const fs = require('fs');
const path = require('path');

const loginHtmlPath = path.join(__dirname, '..', 'public', 'login.html');
const authJsPath = path.join(__dirname, '..', 'public', 'js', 'auth.js');

// 1. Update public/login.html
let html = fs.readFileSync(loginHtmlPath, 'utf8');

// A. Replace switchAuthTab function
const oldSwitchScript = `    // Immediate Tab & Modal Controllers (guaranteed zero-latency UI response)
    window.switchAuthTab = function(tab) {
      var loginForm = document.getElementById('login-form-box');
      var registerForm = document.getElementById('register-form-box');
      var loginTabBtn = document.getElementById('tab-login-btn');
      var registerTabBtn = document.getElementById('tab-register-btn');
      var banner = document.getElementById('auth-error-banner');
      if (banner) banner.style.display = 'none';

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
    };`;

const newSwitchScript = `    // Sliding Blade & Tab Controllers: Zero-Fade GPU Compositor
    window._currentAuthTab = 'login';
    window._isBladeAnimating = false;
    window.switchAuthTab = function(tab) {
      var blade = document.getElementById('auth-blade');
      var isMovingToSignUp = tab === 'register';

      var applyTabState = function(t) {
        var loginForm = document.getElementById('login-form-box');
        var registerForm = document.getElementById('register-form-box');
        var loginTabBtn = document.getElementById('tab-login-btn');
        var registerTabBtn = document.getElementById('tab-register-btn');
        var subtitle = document.getElementById('auth-card-subtitle');
        var banner = document.getElementById('auth-error-banner');
        if (banner) banner.style.display = 'none';

        if (t === 'login') {
          if (loginForm) loginForm.style.display = 'block';
          if (registerForm) registerForm.style.display = 'none';
          if (loginTabBtn) loginTabBtn.classList.add('active');
          if (registerTabBtn) registerTabBtn.classList.remove('active');
          if (subtitle) subtitle.textContent = 'Sign in to access your curated orders, saved looks, and bridal concierge services.';
          window._currentAuthTab = 'login';
        } else {
          if (loginForm) loginForm.style.display = 'none';
          if (registerForm) registerForm.style.display = 'block';
          if (loginTabBtn) loginTabBtn.classList.remove('active');
          if (registerTabBtn) registerTabBtn.classList.add('active');
          if (subtitle) subtitle.textContent = 'Create your account to curate orders, saved looks, and bridal concierge services.';
          window._currentAuthTab = 'register';
        }
      };

      if (blade && window._currentAuthTab !== tab && !window._isBladeAnimating) {
        window._isBladeAnimating = true;
        blade.className = 'auth-blade ' + (isMovingToSignUp ? 'sweep-right' : 'sweep-left');

        // Midpoint (280ms): That dark is where the two states trade places
        setTimeout(function() {
          applyTabState(tab);
        }, 280);

        // Completion (560ms): Park on destination edge ready for mirrored return
        setTimeout(function() {
          blade.className = 'auth-blade ' + (isMovingToSignUp ? 'parked-right' : 'parked-left');
          window._isBladeAnimating = false;
        }, 560);
      } else {
        applyTabState(tab);
      }
    };`;

// Normalize line endings for replacement
const normHtml = html.replace(/\r\n/g, '\n');
const normOldScript = oldSwitchScript.replace(/\r\n/g, '\n');
const normNewScript = newSwitchScript.replace(/\r\n/g, '\n');

if (!normHtml.includes(normOldScript)) {
  console.error('Could not find oldSwitchScript in login.html');
  process.exit(1);
}
let updatedHtml = normHtml.replace(normOldScript, normNewScript);

// B. Add Blade CSS styles inside <style>
const authCardCssTarget = `    .auth-card {
      max-width: 440px;
      margin: 40px auto 60px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E5E0D8;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s ease;
    }`;

const newAuthCardCss = `    .auth-card {
      max-width: 440px;
      margin: 40px auto 60px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E5E0D8;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      position: relative; /* Bounds the sliding blade */
      transition: all 0.3s ease;
    }

    /* ==========================================================
       THE BLADE: ONE RECTANGLE. ONE TRANSLATEX.
       Travels across the card. Midpoint (0%) covers card completely.
       That dark is where the two states trade places.
       Zero dependencies. Transform and opacity only.
       ========================================================== */
    .auth-blade {
      position: absolute;
      top: 0;
      bottom: 0;
      left: -3%;
      width: 106%;
      height: 100%;
      background: radial-gradient(ellipse at center, #0F172A 0%, #060913 70%, #020408 100%);
      z-index: 50;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: 
        inset 0 0 70px rgba(0, 0, 0, 0.95),
        0 0 50px rgba(0, 0, 0, 0.98);
      transform: translate3d(-105%, 0, 0);
      will-change: transform;
    }

    .auth-blade::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2.5px;
      background: linear-gradient(180deg, transparent 0%, #D4AF37 50%, transparent 100%);
      box-shadow: 0 0 18px #D4AF37, 0 0 30px rgba(212, 175, 55, 0.5);
    }

    .auth-blade.sweep-right::before {
      right: 0;
    }

    .auth-blade.sweep-left::before {
      left: 0;
    }

    .blade-seal {
      width: 52px;
      height: 52px;
      opacity: 0.9;
      filter: drop-shadow(0 0 14px rgba(212, 175, 55, 0.6));
    }

    .blade-tag {
      font-size: 0.66rem;
      letter-spacing: 0.38em;
      text-transform: uppercase;
      color: #F4E5B8;
      font-weight: 700;
      opacity: 0.85;
    }

    /* SWEEP ANIMATIONS: Pure GPU Transform
       44% to 56% is the impenetrable dark coverage where states trade places */
    .auth-blade.sweep-right {
      animation: bladeSweepRight 0.56s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes bladeSweepRight {
      0% {
        transform: translate3d(-105%, 0, 0);
      }
      44% {
        transform: translate3d(0%, 0, 0);
      }
      56% {
        transform: translate3d(0%, 0, 0);
      }
      100% {
        transform: translate3d(105%, 0, 0);
      }
    }

    .auth-blade.sweep-left {
      animation: bladeSweepLeft 0.56s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes bladeSweepLeft {
      0% {
        transform: translate3d(105%, 0, 0);
      }
      44% {
        transform: translate3d(0%, 0, 0);
      }
      56% {
        transform: translate3d(0%, 0, 0);
      }
      100% {
        transform: translate3d(-105%, 0, 0);
      }
    }

    .auth-blade.parked-left {
      transform: translate3d(-105%, 0, 0);
    }
    .auth-blade.parked-right {
      transform: translate3d(105%, 0, 0);
    }`;

if (!updatedHtml.includes(authCardCssTarget)) {
  console.error('Could not find authCardCssTarget in login.html');
  process.exit(1);
}
updatedHtml = updatedHtml.replace(authCardCssTarget, newAuthCardCss);

// C. Insert the Blade inside .auth-card and give subtitle an ID
const oldCardHeader = `  <!-- Main Content: Login & Register -->
  <main class="container">
    <div class="auth-card">
      
      <!-- Crowned Atelier Identity Header with Official Brand Monogram -->
      <div class="auth-header-lockup">
        <div class="auth-monogram-wrap" style="width: 54px; height: 54px; margin: 0 auto 12px;">
          <img src="/images/rj-logo-monogram.png" alt="RJ Fashion Collection Official Monogram" class="auth-monogram auth-monogram-light" width="54" height="54" style="object-fit: contain;">
          <img src="/images/rj-logo-monogram-dark.png" alt="RJ Fashion Collection Official Monogram (Dark)" class="auth-monogram auth-monogram-dark" width="54" height="54" style="object-fit: contain;">
        </div>
        <div class="auth-pre-title">THE ROYAL BRIDAL HOUSE</div>
        <h1 class="auth-title">WELCOME TO THE ATELIER</h1>
        <p class="auth-subtitle">Sign in to access your curated orders, saved looks, and bridal concierge services.</p>
      </div>`;

const newCardHeader = `  <!-- Main Content: Login & Register -->
  <main class="container">
    <div class="auth-card" id="auth-card">
      
      <!-- The Blade: One rectangle. One translateX. -->
      <div class="auth-blade" id="auth-blade" aria-hidden="true">
        <img src="/images/rj-logo-monogram-dark.png" alt="RJ Emblem" class="blade-seal" width="52" height="52">
        <span class="blade-tag">The Royal House</span>
      </div>

      <!-- Crowned Atelier Identity Header with Official Brand Monogram -->
      <div class="auth-header-lockup">
        <div class="auth-monogram-wrap" style="width: 54px; height: 54px; margin: 0 auto 12px;">
          <img src="/images/rj-logo-monogram.png" alt="RJ Fashion Collection Official Monogram" class="auth-monogram auth-monogram-light" width="54" height="54" style="object-fit: contain;">
          <img src="/images/rj-logo-monogram-dark.png" alt="RJ Fashion Collection Official Monogram (Dark)" class="auth-monogram auth-monogram-dark" width="54" height="54" style="object-fit: contain;">
        </div>
        <div class="auth-pre-title">THE ROYAL BRIDAL HOUSE</div>
        <h1 class="auth-title">WELCOME TO THE ATELIER</h1>
        <p class="auth-subtitle" id="auth-card-subtitle">Sign in to access your curated orders, saved looks, and bridal concierge services.</p>
      </div>`;

if (!updatedHtml.includes(oldCardHeader)) {
  console.error('Could not find oldCardHeader in login.html');
  process.exit(1);
}
updatedHtml = updatedHtml.replace(oldCardHeader, newCardHeader);

fs.writeFileSync(loginHtmlPath, updatedHtml, 'utf8');
console.log('Successfully updated public/login.html with the Sliding Blade!');

// 2. Update public/js/auth.js switchAuthTab to maintain parity
let js = fs.readFileSync(authJsPath, 'utf8');
const oldJsSwitch = `function switchAuthTab(tab) {
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
}`;

const newJsSwitch = `function switchAuthTab(tab) {
  const blade = document.getElementById('auth-blade');
  const isMovingToSignUp = tab === 'register';

  const applyState = () => {
    const loginForm = document.getElementById('login-form-box');
    const registerForm = document.getElementById('register-form-box');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const registerTabBtn = document.getElementById('tab-register-btn');
    const subtitle = document.getElementById('auth-card-subtitle');

    hideAuthError();

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
      if (loginTabBtn) loginTabBtn.classList.add('active');
      if (registerTabBtn) registerTabBtn.classList.remove('active');
      if (subtitle) subtitle.textContent = 'Sign in to access your curated orders, saved looks, and bridal concierge services.';
      window._currentAuthTab = 'login';
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
      if (loginTabBtn) loginTabBtn.classList.remove('active');
      if (registerTabBtn) registerTabBtn.classList.add('active');
      if (subtitle) subtitle.textContent = 'Create your account to curate orders, saved looks, and bridal concierge services.';
      window._currentAuthTab = 'register';
    }
  };

  if (blade && window._currentAuthTab !== tab && !window._isBladeAnimating) {
    window._isBladeAnimating = true;
    blade.className = 'auth-blade ' + (isMovingToSignUp ? 'sweep-right' : 'sweep-left');

    // Midpoint (280ms): That dark is where the two states trade places
    setTimeout(() => {
      applyState();
    }, 280);

    // Completion (560ms)
    setTimeout(() => {
      blade.className = 'auth-blade ' + (isMovingToSignUp ? 'parked-right' : 'parked-left');
      window._isBladeAnimating = false;
    }, 560);
  } else {
    applyState();
  }
}`;

const normJs = js.replace(/\r\n/g, '\n');
const normOldJs = oldJsSwitch.replace(/\r\n/g, '\n');
const normNewJs = newJsSwitch.replace(/\r\n/g, '\n');

if (normJs.includes(normOldJs)) {
  const updatedJs = normJs.replace(normOldJs, normNewJs);
  fs.writeFileSync(authJsPath, updatedJs, 'utf8');
  console.log('Successfully updated public/js/auth.js with the Sliding Blade support!');
} else {
  console.warn('Could not match oldJsSwitch in auth.js, checking if already modified');
}
