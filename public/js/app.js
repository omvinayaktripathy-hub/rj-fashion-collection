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

// Helper to retrieve local cart across all storage mechanisms
function getLocalCartSafe() {
  try {
    const raw = localStorage.getItem('rjfc_local_cart');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  try {
    const sRaw = sessionStorage.getItem('rjfc_local_cart');
    if (sRaw) {
      const parsed = JSON.parse(sRaw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  if (typeof window !== 'undefined' && Array.isArray(window._rjfc_memory_cart)) {
    return window._rjfc_memory_cart;
  }
  return [];
}

// Helper to save local cart across all storage mechanisms
function saveLocalCartSafe(cartArray) {
  if (!Array.isArray(cartArray)) cartArray = [];
  if (typeof window !== 'undefined') {
    window._rjfc_memory_cart = cartArray;
  }
  try {
    localStorage.setItem('rjfc_local_cart', JSON.stringify(cartArray));
  } catch (e1) {
    console.warn('localStorage save warning:', e1);
  }
  try {
    sessionStorage.setItem('rjfc_local_cart', JSON.stringify(cartArray));
  } catch (_) {}
}

// Synchronous fast product finder
function findProductFastSync(productId) {
  if (productId === undefined || productId === null || productId === '') return null;
  const pIdStr = String(productId).trim();

  // 1. In-memory window.catalogProducts (shop page)
  if (typeof window !== 'undefined' && Array.isArray(window.catalogProducts)) {
    const found = window.catalogProducts.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  }

  // 2. In-memory window.allProducts or window.products
  if (typeof window !== 'undefined' && Array.isArray(window.allProducts)) {
    const found = window.allProducts.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  }

  // 3. Current active product on product detail page
  if (typeof window !== 'undefined' && window.currentProductDetail) {
    if (String(window.currentProductDetail.id) === pIdStr || String(window.currentProductDetail.slug) === pIdStr) {
      return window.currentProductDetail;
    }
  }

  // 4. Current quick view product
  if (typeof window !== 'undefined' && window.currentQuickViewProduct) {
    if (String(window.currentQuickViewProduct.id) === pIdStr || String(window.currentQuickViewProduct.slug) === pIdStr) {
      return window.currentQuickViewProduct;
    }
  }

  // 5. LocalStorage custom products
  try {
    const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
    const found = customLocal.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  } catch (_) {}

  // 6. LocalStorage catalog overrides
  try {
    const overrides = JSON.parse(localStorage.getItem('rj_catalog_overrides') || '[]');
    const found = overrides.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  } catch (_) {}

  // 7. DOM Card Inspection (Instant fallback)
  if (typeof document !== 'undefined') {
    try {
      const card = document.querySelector(`.product-card[data-id="${pIdStr}"]`);
      if (card) {
        const titleEl = card.querySelector('.product-title a, .product-title, h3');
        const priceEl = card.querySelector('.price-current');
        const origPriceEl = card.querySelector('.price-original');
        const imgEl = card.querySelector('.product-primary-img, img');
        const brandEl = card.querySelector('.product-brand');
        if (titleEl) {
          const priceNum = priceEl ? Number(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
          const origPriceNum = origPriceEl ? Number(origPriceEl.textContent.replace(/[^0-9.]/g, '')) : priceNum;
          return {
            id: pIdStr,
            name: titleEl.textContent.trim(),
            price: priceNum,
            original_price: origPriceNum,
            image: imgEl ? imgEl.src : '/images/placeholder.jpg',
            brand: brandEl ? brandEl.textContent.trim() : 'RJ Collection',
            stock: 99
          };
        }
      }
    } catch (_) {}
  }

  return null;
}

// Resilient Product Resolver for Storefront, Cart, and Wishlist
async function resolveProductById(productId) {
  if (productId === undefined || productId === null || productId === '') return null;
  const pIdStr = String(productId).trim();

  // 1. Fast Synchronous Check
  const fast = findProductFastSync(pIdStr);
  if (fast) return fast;

  // 2. Cloud Firestore
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      const docSnap = await db.collection('products').doc(pIdStr).get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      const numId = Number(pIdStr);
      const querySnap = await db.collection('products').where('id', '==', isNaN(numId) ? pIdStr : numId).limit(1).get();
      if (!querySnap.empty) {
        const d = querySnap.docs[0].data();
        return { id: querySnap.docs[0].id, ...d };
      }
    } catch (fsErr) {
      console.warn('Firestore lookup notice:', fsErr);
    }
  }

  // 3. Static /data/products.json
  try {
    const fbRes = await fetch('/data/products.json');
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const list = fbData.products || (Array.isArray(fbData) ? fbData : []);
      const found = list.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
      if (found) return found;
    }
  } catch (_) {}

  // 4. Server API
  try {
    const apiRes = await fetch(`${API_BASE}/products/${encodeURIComponent(pIdStr)}`);
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData && apiData.success && apiData.product) {
        return apiData.product;
      }
    }
  } catch (_) {}

  return null;
}

// Global Add to Cart - Instant & Guaranteed
async function addToCart(productId, quantity = 1, size = 'Free Size') {
  if (productId === undefined || productId === null || productId === '') {
    showToast('Product ID is required', 'error');
    return false;
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const selectedSize = size || 'Free Size';

  // 1. Instant Synchronous resolution
  let product = findProductFastSync(productId);

  // 2. Fallback to async resolution if not in fast sync cache
  if (!product) {
    try {
      product = await resolveProductById(productId);
    } catch (_) {}
  }

  // 3. Build product object
  const pName = product ? (product.name || product.title) : `RJ Fashion Item (${productId})`;
  const pPrice = product ? Number(product.price) : 600;
  const pOrigPrice = product ? (Number(product.original_price) || pPrice) : pPrice;
  const pDiscount = product ? (Number(product.discount) || (pOrigPrice > pPrice ? Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100) : 0)) : 0;
  const pImage = product ? (product.image || (Array.isArray(product.images) ? product.images[0] : '/images/placeholder.jpg')) : '/images/placeholder.jpg';
  const pBrand = product ? (product.brand || 'RJ Collection') : 'RJ Collection';
  const pStock = product ? (Number(product.stock) || 99) : 99;

  // 4. Always save item to local cart
  const local = getLocalCartSafe();
  const existing = local.find(i => String(i.product_id) === String(productId) && i.size === selectedSize);

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 1) + qty;
  } else {
    local.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: productId,
      name: pName,
      price: pPrice,
      original_price: pOrigPrice,
      discount: pDiscount,
      image: pImage,
      brand: pBrand,
      size: selectedSize,
      quantity: qty,
      stock: pStock
    });
  }

  saveLocalCartSafe(local);

  // 5. Instantly provide positive UI feedback
  showToast('Added to cart!', 'success');
  updateCartCount();

  // 6. Fire background API sync (non-blocking)
  try {
    fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: qty, size: selectedSize })
    }).catch(() => {});
  } catch (_) {}

  return true;
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


// ===================================================================
// DUAL-STYLE LUXURY EXPERIENCE CONTROLLER
// Style A: Quiet Luxury (Minimal Ivory & Soft Beige)
// Style B: Editorial Impact (Bold Modern Fashion Editorial)
// ===================================================================

function initLuxuryStyle() {
  let saved = 'editorial-impact';
  try {
    saved = localStorage.getItem('rjfc_luxury_style') || 'editorial-impact';
  } catch (_) {}
  applyLuxuryStyle(saved, false);
}

function applyLuxuryStyle(styleName, showNotification = true) {
  const isEditorial = styleName === 'editorial-impact';
  const targetStyle = isEditorial ? 'editorial-impact' : 'quiet-luxury';

  document.documentElement.setAttribute('data-luxury-style', targetStyle);
  if (document.body) {
    if (isEditorial) {
      document.body.classList.add('style-editorial-impact');
      document.body.classList.remove('style-quiet-luxury');
    } else {
      document.body.classList.add('style-quiet-luxury');
      document.body.classList.remove('style-editorial-impact');
    }
  }

  try {
    localStorage.setItem('rjfc_luxury_style', targetStyle);
  } catch (_) {}

  // Update UI indicators
  document.querySelectorAll('.style-switcher-text, #luxury-style-text').forEach(el => {
    el.textContent = isEditorial ? 'Editorial Impact' : 'Quiet Luxury';
  });
  document.querySelectorAll('#rj-mobile-style-text').forEach(el => {
    el.textContent = isEditorial ? '✦ Style: Editorial Impact' : '✦ Style: Quiet Luxury';
  });
  document.querySelectorAll('.luxury-style-switcher').forEach(el => {
    el.setAttribute('title', isEditorial ? 'Switch to Quiet Luxury (Minimal Ivory & Beige)' : 'Switch to Editorial Impact (Bold Modern)');
    el.setAttribute('data-current-style', targetStyle);
  });

  if (showNotification && typeof showToast === 'function') {
    showToast(isEditorial ? '✨ Editorial Impact style activated' : '🕊️ Quiet Luxury style activated', 'info');
  }
}

function toggleLuxuryStyle() {
  const current = document.documentElement.getAttribute('data-luxury-style') || 'editorial-impact';
  const next = current === 'editorial-impact' ? 'quiet-luxury' : 'editorial-impact';
  applyLuxuryStyle(next, true);
}

window.initLuxuryStyle = initLuxuryStyle;
window.applyLuxuryStyle = applyLuxuryStyle;
window.toggleLuxuryStyle = toggleLuxuryStyle;

// Run initial check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLuxuryStyle);
} else {
  initLuxuryStyle();
}
