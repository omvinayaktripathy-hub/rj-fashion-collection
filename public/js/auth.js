// RJ FASHION COLLECTION - CUSTOMER AUTHENTICATION CONTROLLER

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

// Handle Customer Login
async function handleCustomerLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('customer-login-submit');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Logged in successfully!', 'success');
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 700);
    } else {
      showToast(data.message || 'Invalid email or password', 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  } catch (err) {
    showToast('Login failed. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

// Handle Customer Registration
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
    btn.textContent = 'Create Account';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, confirmPassword })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Welcome to RJ Fashion Collection! Account created.', 'success');
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 800);
    } else {
      showToast(data.message || 'Registration failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  } catch (err) {
    showToast('Registration failed. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
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
