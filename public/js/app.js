// RJ FASHION COLLECTION - GLOBAL APP LOGIC

// Ensure subtitle is removed from DOM immediately
try {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.logo-subtitle').forEach(el => el.remove());
    const curYear = new Date().getFullYear();
    document.querySelectorAll('.current-year, #copyright-year').forEach(el => el.textContent = curYear);
  });
} catch (e) {}

const API_BASE = '/api';

// HTML Escape Sanitizer (Defensive against XSS)
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

// CSRF Token Helper & Fetch Interceptor
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

let cachedCsrfToken = null;
async function getCsrfToken() {
  const cookieVal = getCookie('XSRF-TOKEN');
  if (cookieVal) return cookieVal;
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await originalFetch('/api/csrf-token');
    if (res.ok) {
      const data = await res.json();
      if (data && data.csrfToken) {
        cachedCsrfToken = data.csrfToken;
        return cachedCsrfToken;
      }
    }
  } catch (_) {}
  return '';
}

const originalFetch = window.fetch;
window.fetch = async function(resource, init) {
  init = init || {};
  const method = (init.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      if (init.headers instanceof Headers) {
        if (!init.headers.has('X-CSRF-Token')) {
          init.headers.set('X-CSRF-Token', token);
        }
      } else if (Array.isArray(init.headers)) {
        if (!init.headers.some(([k]) => k.toLowerCase() === 'x-csrf-token')) {
          init.headers.push(['X-CSRF-Token', token]);
        }
      } else {
        init.headers = init.headers || {};
        if (!init.headers['X-CSRF-Token'] && !init.headers['x-csrf-token']) {
          init.headers['X-CSRF-Token'] = token;
        }
      }
    }
    if (!init.credentials) {
      init.credentials = 'same-origin';
    }
  }
  return originalFetch(resource, init);
};

// Currency Formatter
function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

// Toast Notification (XSS-safe textContent)
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const span = document.createElement('span');
  span.textContent = String(message || '');
  toast.appendChild(span);

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
      const safeFirstName = escapeHtml((user.name || '').split(' ')[0] || 'User');
      container.innerHTML = `
        <div class="user-dropdown-wrap" style="position: relative; display: inline-block;">
          <a href="/account.html" class="action-btn" title="My Account">
            <span><svg class="action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${safeFirstName}</span>
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="/login.html" class="action-btn">
          <span><svg class="action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Account</span>
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
      btnElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
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
      btnElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
    showToast('Added to Wishlist!', 'success');
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
  const isDark = theme === 'dark';
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark-theme');
    if (document.body) document.body.classList.add('dark-theme');
    try { localStorage.setItem('rjfc_theme', 'dark'); } catch(e){}
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');
    if (document.body) document.body.classList.remove('dark-theme');
    try { localStorage.setItem('rjfc_theme', 'light'); } catch(e){}
  }
  updateThemeToggleUI(theme);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark-theme');
  applyTheme(isDark ? 'light' : 'dark');
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.updateAllThemeToggles = updateThemeToggleUI;

function updateThemeToggleUI(theme) {
  const isDark = theme === 'dark';
  const sunSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  const moonSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  document.querySelectorAll('.theme-mode-text').forEach(el => {
    el.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  });
  document.querySelectorAll('.theme-label-icon').forEach(el => {
    el.innerHTML = isDark ? sunSvg : moonSvg;
  });
  document.querySelectorAll('.theme-switch-container').forEach(el => {
    el.setAttribute('aria-checked', isDark ? 'true' : 'false');
    el.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
}

// Run initial check
if (typeof initTheme === "function") initTheme();

// ===================================================================
// AUTOMATIC DEVICE & SCREEN ADAPTATION SYSTEM (MOBILE, TAB, PC)
// Automatically senses device form factor, screen orientation, and input method
// ===================================================================
const AdaptiveDevice = {
  detect() {
    const width = window.innerWidth || document.documentElement.clientWidth || 360;
    const height = window.innerHeight || document.documentElement.clientHeight || 640;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const orientation = width >= height ? 'landscape' : 'portrait';
    
    let device = 'desktop';
    if (width < 768) {
      device = 'mobile';
    } else if (width <= 1024) {
      if (height <= 560 && isTouch) {
        device = 'mobile-landscape';
      } else {
        device = 'tablet';
      }
    } else if (width <= 1180 && isTouch) {
      device = 'tablet';
    } else {
      device = 'desktop';
    }

    const state = {
      device,
      orientation,
      isTouch,
      width,
      height,
      isShortScreen: height <= 560
    };

    this.applyState(state);
    return state;
  },

  applyState(state) {
    const root = document.documentElement;
    const body = document.body;
    if (root) {
      root.setAttribute('data-device', state.device);
      root.setAttribute('data-orientation', state.orientation);
      root.setAttribute('data-input', state.isTouch ? 'touch' : 'mouse');
      root.setAttribute('data-short-screen', state.isShortScreen ? 'true' : 'false');
    }

    if (body) {
      body.classList.toggle('is-mobile', state.device === 'mobile' || state.device === 'mobile-landscape');
      body.classList.toggle('is-tablet', state.device === 'tablet');
      body.classList.toggle('is-desktop', state.device === 'desktop');
      body.classList.toggle('is-touch', state.isTouch);
      body.classList.toggle('is-landscape', state.orientation === 'landscape');
      body.classList.toggle('is-short-screen', state.isShortScreen);
    }

    window.deviceState = state;
  },

  init() {
    this.detect();
    let resizeTimer = null;
    const update = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const state = this.detect();
        window.dispatchEvent(new CustomEvent('deviceStateChange', { detail: state }));
      }, 80);
    };

    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
  }
};

// Run immediately for instant zero-flicker detection
AdaptiveDevice.init();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  AdaptiveDevice.detect();
  checkAuth().then(() => {
    updateCartCount();
    updateWishlistCount();
  });

  // Global search form & live suggestions listener
  const searchForms = document.querySelectorAll('.header-search-form');
  searchForms.forEach(form => {
    const input = form.querySelector('input[name="search"]');
    if (!input) return;

    // Create suggestions container
    let suggestionsBox = form.parentElement.querySelector('.search-suggestions-box');
    if (!suggestionsBox) {
      suggestionsBox = document.createElement('div');
      suggestionsBox.className = 'search-suggestions-box';
      form.parentElement.appendChild(suggestionsBox);
    }

    let debounceTimer = null;
    let selectedIndex = -1;

    async function fetchSuggestions(query) {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        suggestionsBox.classList.remove('is-visible');
        suggestionsBox.innerHTML = '';
        return;
      }

      let matches = [];
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            matches = data.products;
          }
        }
      } catch (_) {}

      // Fallback to static products.json if needed
      if (matches.length === 0) {
        try {
          const res = await fetch('/data/products.json');
          if (res.ok) {
            const data = await res.json();
            const list = data.products || [];
            matches = list.filter(p => 
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
              (p.brand && p.brand.toLowerCase().includes(q))
            ).slice(0, 6);
          }
        } catch (_) {}
      }

      if (matches.length === 0) {
        suggestionsBox.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--muted); font-size: 0.85rem;">
            No matching styles found for "<strong>${escapeHtml(query)}</strong>"
          </div>
          <a class="suggestion-footer" href="/shop.html">Browse All Collections &rarr;</a>
        `;
        suggestionsBox.classList.add('is-visible');
        return;
      }

      selectedIndex = -1;
      suggestionsBox.innerHTML = `
        ${matches.map(p => `
          <a class="suggestion-item" href="/product.html?id=${p.id}">
            <img class="suggestion-thumb" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
            <div class="suggestion-info">
              <div class="suggestion-title">${escapeHtml(p.name)}</div>
              <div class="suggestion-meta">
                <span>${escapeHtml(p.category_name || p.subcategory || p.department || 'Fashion')}</span>
                <span class="suggestion-price">${formatPrice(p.price)}</span>
              </div>
            </div>
          </a>
        `).join('')}
        <a class="suggestion-footer" href="/shop.html?search=${encodeURIComponent(query)}">
          View all results for "${escapeHtml(query)}" &rarr;
        </a>
      `;
      suggestionsBox.classList.add('is-visible');
    }

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchSuggestions(input.value);
      }, 180);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) {
        fetchSuggestions(input.value);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (!suggestionsBox.classList.contains('is-visible')) return;
      const items = suggestionsBox.querySelectorAll('.suggestion-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        items.forEach((it, i) => it.classList.toggle('is-selected', i === selectedIndex));
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle('is-selected', i === selectedIndex));
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          items[selectedIndex].click();
        }
      } else if (e.key === 'Escape') {
        suggestionsBox.classList.remove('is-visible');
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      suggestionsBox.classList.remove('is-visible');
      const val = input.value.trim();
      if (val) {
        window.location.href = `/shop.html?search=${encodeURIComponent(val)}`;
      } else {
        window.location.href = '/shop.html';
      }
    });

    document.addEventListener('click', (e) => {
      if (!form.parentElement.contains(e.target)) {
        suggestionsBox.classList.remove('is-visible');
      }
    });
  });
});





// Global Gifting Option Handler & Persistence
function toggleGiftOption(checkbox) {
  const msgBox = document.getElementById('gift-message-box');
  if (msgBox) {
    msgBox.style.display = checkbox.checked ? 'block' : 'none';
  }
  try {
    sessionStorage.setItem('rjfc_gift_packaging', checkbox.checked ? 'true' : 'false');
    const msgText = document.getElementById('gift-message-text');
    if (msgText && checkbox.checked) {
      msgText.focus();
    }
  } catch (_) {}
}

function saveGiftMessage(val) {
  try {
    sessionStorage.setItem('rjfc_gift_message', val || '');
  } catch (_) {}
}

function initGiftOptionUI() {
  try {
    const isGift = sessionStorage.getItem('rjfc_gift_packaging') === 'true';
    const giftMsg = sessionStorage.getItem('rjfc_gift_message') || '';
    const checkbox = document.getElementById('gift-wrap-checkbox');
    const msgBox = document.getElementById('gift-message-box');
    const msgText = document.getElementById('gift-message-text');

    if (checkbox && isGift) {
      checkbox.checked = true;
      if (msgBox) msgBox.style.display = 'block';
      if (msgText && giftMsg) msgText.value = giftMsg;
    }
  } catch (_) {}
}

window.toggleGiftOption = toggleGiftOption;
window.saveGiftMessage = saveGiftMessage;
document.addEventListener('DOMContentLoaded', initGiftOptionUI);
