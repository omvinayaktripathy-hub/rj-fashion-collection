// RJ FASHION COLLECTION - GLOBAL APP LOGIC

const API_BASE = '/api';

// Currency Formatter
function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

// Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global Auth State
let currentUser = null;

async function checkAuth() {
  const local = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
  if (local) {
    try {
      currentUser = JSON.parse(local);
      renderAuthNav(currentUser);
      return;
    } catch (_) {}
  }

  try {
    const res = await fetch(`${API_BASE}/me`);
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      renderAuthNav(data.user);
    } else {
      currentUser = null;
      renderAuthNav(null);
    }
  } catch (err) {
    renderAuthNav(null);
  }
}

function renderAuthNav(user) {
  const accountNavContainers = document.querySelectorAll('.auth-nav-slot');
  accountNavContainers.forEach(container => {
    if (user) {
      container.innerHTML = `
        <div class="user-dropdown-wrap" style="position: relative; display: inline-block;">
          <a href="/account.html" class="action-btn" title="My Account">
            <span>👤 ${user.name.split(' ')[0]}</span>
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="/login.html" class="action-btn">
          <span>👤 Login / Account</span>
        </a>
      `;
    }
  });

  const mobileAccountLink = document.getElementById('mobile-account-link');
  if (mobileAccountLink) {
    mobileAccountLink.href = user ? '/account.html' : '/login.html';
  }
}

// Update Badges
async function updateCartCount() {
  let count = 0;
  try {
    const res = await fetch(`${API_BASE}/cart`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        count = data.itemCount || 0;
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    try {
      const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
      count = local.reduce((s, i) => s + (i.quantity || 1), 0);
    } catch(e) {}
  }
  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

async function updateWishlistCount() {
  let count = 0;
  try {
    const res = await fetch(`${API_BASE}/wishlist`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) count = data.count || 0;
    } else {
      throw new Error();
    }
  } catch (_) {
    try {
      const local = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
      count = local.length;
    } catch (_) {}
  }
  document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

// Global Add to Cart
async function addToCart(productId, quantity = 1, size = 'Free Size') {
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, size })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Added to cart!', 'success');
        updateCartCount();
        return true;
      }
    }
    throw new Error('API cart failed');
  } catch (err) {
    // Netlify static fallback using localStorage
    try {
      const fbRes = await fetch('/data/products.json');
      const fbData = await fbRes.json();
      const product = (fbData.products || []).find(p => String(p.id) === String(productId));
      if (product) {
        const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
        const existing = local.find(i => String(i.product_id) === String(productId) && i.size === size);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + quantity;
        } else {
          local.push({
            id: Date.now(),
            product_id: product.id,
            name: product.name,
            price: product.price,
            original_price: product.original_price,
            discount: product.discount,
            image: product.image,
            brand: product.brand,
            size: size,
            quantity: quantity,
            stock: product.stock
          });
        }
        localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
        showToast('Added to cart!', 'success');
        updateCartCount();
        return true;
      }
    } catch(e2) {}
    showToast('Failed to add item to cart', 'error');
    return false;
  }
}

// Global Toggle Wishlist
async function toggleWishlist(productId, btnElement) {
  let isSaved = btnElement && btnElement.classList.contains('active');
  let localIds = [];
  try {
    localIds = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
  } catch (_) {}

  if (isSaved || localIds.some(id => String(id) === String(productId))) {
    // Remove
    try {
      await fetch(`${API_BASE}/wishlist/${productId}`, { method: 'DELETE' });
    } catch (_) {}
    localIds = localIds.filter(id => String(id) !== String(productId));
    localStorage.setItem('rjfc_wishlist', JSON.stringify(localIds));
    if (btnElement) {
      btnElement.classList.remove('active');
      btnElement.innerHTML = '♡';
    }
    showToast('Removed from wishlist', 'info');
    updateWishlistCount();
  } else {
    // Add
    try {
      await fetch(`${API_BASE}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
    } catch (_) {}
    if (!localIds.some(id => String(id) === String(productId))) {
      localIds.push(productId);
      localStorage.setItem('rjfc_wishlist', JSON.stringify(localIds));
    }
    if (btnElement) {
      btnElement.classList.add('active');
      btnElement.innerHTML = '♥';
    }
    showToast('Added to wishlist! ❤️', 'success');
    updateWishlistCount();
  }
}

// ================= THEME MANAGER (DARK / LIGHT MODE) =================
function initTheme() {
  const saved = localStorage.getItem('rjfc_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('rjfc_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('rjfc_theme', 'light');
  }
  updateThemeToggleUI(theme);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(isDark ? 'light' : 'dark');
}

function updateThemeToggleUI(theme) {
  const isDark = theme === 'dark';

  // 1. Update all header theme switch slider containers
  const switchContainers = document.querySelectorAll('.theme-switch-container');
  switchContainers.forEach(container => {
    const text = container.querySelector('.theme-mode-text');
    if (text) text.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    container.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    container.setAttribute('aria-checked', isDark ? 'true' : 'false');
  });

  // 2. Update floating theme quick toggles
  const floatingBtns = document.querySelectorAll('.floating-theme-toggle');
  floatingBtns.forEach(btn => {
    const icon = btn.querySelector('.floating-theme-icon');
    const text = btn.querySelector('.floating-theme-text');
    if (isDark) {
      if (icon) icon.textContent = '☀️';
      if (text) text.textContent = 'Light Mode';
      btn.setAttribute('title', 'Switch to Light Mode');
    } else {
      if (icon) icon.textContent = '🌙';
      if (text) text.textContent = 'Dark Mode';
      btn.setAttribute('title', 'Switch to Dark Mode');
    }
  });

  // 3. Fallback for any legacy buttons
  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    const iconSpan = btn.querySelector('.theme-toggle-icon');
    const textSpan = btn.querySelector('.theme-toggle-text');
    if (isDark) {
      if (iconSpan) iconSpan.textContent = '☀️';
      if (textSpan) textSpan.textContent = 'Light Mode';
      btn.setAttribute('title', 'Switch to Light Mode');
    } else {
      if (iconSpan) iconSpan.textContent = '🌙';
      if (textSpan) textSpan.textContent = 'Dark Mode';
      btn.setAttribute('title', 'Switch to Dark Mode');
    }
  });
}

// Run immediately
initTheme();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth().then(() => {
    updateCartCount();
    updateWishlistCount();
  });

  // Global search form listener
  const searchForms = document.querySelectorAll('.header-search-form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="search"]');
      const val = input ? input.value.trim() : '';
      if (val) {
        window.location.href = `/shop.html?search=${encodeURIComponent(val)}`;
      } else {
        window.location.href = '/shop.html';
      }
    });
  });
});

