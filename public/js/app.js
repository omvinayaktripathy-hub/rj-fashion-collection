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
const isStaticHosting = (typeof window !== 'undefined' && (
  window.location.hostname.endsWith('web.app') ||
  window.location.hostname.endsWith('firebaseapp.com') ||
  window.location.protocol === 'file:' ||
  (window.location.hostname === '127.0.0.1' && window.location.port !== '3000') ||
  (window.location.hostname === 'localhost' && window.location.port !== '3000')
));
window.isStaticHosting = isStaticHosting;

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

// Universal Image Fallback Handler (Defensive against broken URLs / adblockers)
window.handleImgError = function(img) {
  if (!img) return;
  img.onerror = null;
  img.src = '/images/rj-placeholder.svg';
};

// CSRF Token Helper & Fetch Interceptor
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

let cachedCsrfToken = null;
async function getCsrfToken() {
  if (isStaticHosting) return '';
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
  const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
  const isApiRequest = urlStr.startsWith('/api') || urlStr.startsWith(window.location.origin + '/api');

  if (isApiRequest && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
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
function showToast(message, type = 'info', isHtml = false) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const span = document.createElement('span');
  if (isHtml) {
    span.innerHTML = message;
  } else {
    span.textContent = String(message || '');
  }
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
  ['token', 'session_token', 'auth_token', 'id_token', 'idToken', 'jwt', 'rjfc_token', 'rj_session_token'].forEach(k => {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {}
  });

  if (!isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUser = data.user;
          renderAuthNav(data.user);
          return;
        }
      }
    } catch (_) {}
  }

  // Fallback to Firebase client SDK and localStorage
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const fbUser = firebase.auth().currentUser;
      if (fbUser) {
        currentUser = {
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          uid: fbUser.uid
        };
        renderAuthNav(currentUser);
        return;
      }
    } catch (_) {}
  }

  const local = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
  if (local) {
    try {
      currentUser = JSON.parse(local);
      renderAuthNav(currentUser);
      return;
    } catch (_) {}
  }
  renderAuthNav(null);
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
  if (!isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/cart`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && typeof data.itemCount === 'number') {
          count = data.itemCount;
        }
      }
    } catch (_) {}
  }

  if (count === 0) {
    try {
      const local = getLocalCartSafe();
      count = local.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    } catch (_) {}
  }

  // Gracefully fallback to local storage if API returned 0 but user has local items
  if (count === 0) {
    try {
      const local = getLocalCartSafe();
      if (Array.isArray(local) && local.length > 0) {
        count = local.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
      }
    } catch (_) {}
  }

  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
  return count;
}

function getLocalWishlistSafe() {
  const keys = ['rj_fashion_wishlist', 'rjfc_wishlist', 'rjfc_react_wishlist', 'wishlist'];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }
  return [];
}

async function updateWishlistCount() {
  let count = 0;
  if (!isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/wishlist`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) count = data.count || 0;
      }
    } catch (_) {}
  }

  if (count === 0) {
    try {
      const local = getLocalWishlistSafe();
      count = local.length;
    } catch (_) {}
  }
  document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

// Helper to retrieve local cart across all storage mechanisms (rjfc_cart, rjfc_local_cart, rjfc_react_cart)
function getLocalCartSafe() {
  const keys = ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }

  for (const key of keys) {
    try {
      const sRaw = sessionStorage.getItem(key);
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }

  if (typeof window !== 'undefined' && Array.isArray(window._rjfc_memory_cart) && window._rjfc_memory_cart.length > 0) {
    return window._rjfc_memory_cart;
  }
  return [];
}

// Helper to save local cart across all storage mechanisms and broadcast update events
function saveLocalCartSafe(cartArray) {
  if (!Array.isArray(cartArray)) cartArray = [];
  if (typeof window !== 'undefined') {
    window._rjfc_memory_cart = cartArray;
  }
  const json = JSON.stringify(cartArray);
  const keys = ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'];
  keys.forEach(k => {
    try { localStorage.setItem(k, json); } catch (_) {}
    try { sessionStorage.setItem(k, json); } catch (_) {}
  });

  try {
    window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cartArray } }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('rjfc_cart_updated', function() {
    updateCartCount();
  });
  window.addEventListener('storage', function(e) {
    if (e.key && e.key.includes('cart')) {
      updateCartCount();
    }
  });
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
  showToast(`Added to bag • <a href="/cart.html" style="color:#d4af37;text-decoration:underline;font-weight:700;margin-left:6px;">View Bag &rarr;</a>`, 'success', true);
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
  let isSaved = btnElement && (btnElement.classList.contains('active') || btnElement.getAttribute('data-active') === 'true');
  let localList = getLocalWishlistSafe();
  const exists = localList.some(item => {
    const id = typeof item === 'object' ? (item.id || item.product_id) : item;
    return String(id) === String(productId);
  });

  if (isSaved || exists) {
    // Remove
    try {
      await fetch(`${API_BASE}/wishlist/${productId}`, { method: 'DELETE' });
    } catch (_) {}
    const updated = localList.filter(item => {
      const id = typeof item === 'object' ? (item.id || item.product_id) : item;
      return String(id) !== String(productId);
    });
    const json = JSON.stringify(updated);
    ['rj_fashion_wishlist', 'rjfc_react_wishlist', 'wishlist'].forEach(k => {
      try { localStorage.setItem(k, json); } catch (_) {}
    });
    try {
      localStorage.setItem('rjfc_wishlist', JSON.stringify(updated.map(i => typeof i === 'object' ? (i.id || i.product_id) : i)));
    } catch (_) {}
    if (btnElement) {
      btnElement.classList.remove('active');
      btnElement.removeAttribute('data-active');
      btnElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
    showToast('Removed from wishlist', 'info');
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new Event('storage'));
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
    let prodObj = { id: productId, name: `Artisanal Ensemble #${productId}`, price: 2999 };
    if (typeof resolveProductById === 'function') {
      const resolved = await resolveProductById(productId);
      if (resolved) prodObj = resolved;
    }
    localList.push(prodObj);
    const json = JSON.stringify(localList);
    ['rj_fashion_wishlist', 'rjfc_react_wishlist', 'wishlist'].forEach(k => {
      try { localStorage.setItem(k, json); } catch (_) {}
    });
    try {
      localStorage.setItem('rjfc_wishlist', JSON.stringify(localList.map(i => typeof i === 'object' ? (i.id || i.product_id) : i)));
    } catch (_) {}
    if (btnElement) {
      btnElement.classList.add('active');
      btnElement.setAttribute('data-active', 'true');
      btnElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
    showToast('Added to Wishlist!', 'success');
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new Event('storage'));
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
  initBackToTop();
  initAnnouncementBarRotator();
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
        const res = await fetch('/data/products.json');
        if (res.ok) {
          const data = await res.json();
          const list = data.products || [];
          matches = list.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.category_name && p.category_name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.department && p.department.toLowerCase().includes(q))
          ).slice(0, 6);
        }
      } catch (_) {}

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
// DUAL-STYLE LUXURY EXPERIENCE CONTROLLER (RJ FASHION COLLECTION)
// 01. QUIET LUXURY — minimal ivory and beige
// 02. EDITORIAL IMPACT — bold modern fashion editorial
// Selector: "CHOOSE YOUR EXPERIENCE"
// ===================================================================

function openExperienceModal() {
  let modal = document.getElementById('experience-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'experience-modal';
    modal.className = 'exp-modal-backdrop';
    modal.onclick = function(e) { if (e.target === modal) closeExperienceModal(); };
    modal.innerHTML = `
      <div class="exp-modal-card" onclick="event.stopPropagation()">
        <div class="exp-modal-header">
          <span class="exp-modal-eyebrow">THE SIGNATURE EDIT</span>
          <h3 class="exp-modal-title">CHOOSE YOUR EXPERIENCE</h3>
          <p class="exp-modal-desc">Explore two distinct aesthetic expressions of RJ Fashion Collection. Switch anytime without losing your cart or browsing state.</p>
          <button type="button" class="exp-modal-close" onclick="closeExperienceModal()">&times;</button>
        </div>
        <div class="exp-options-grid">
          <!-- Option 1: Quiet Luxury -->
          <div class="exp-card" id="exp-card-quiet-luxury" onclick="selectExperience('quiet-luxury')">
            <div class="exp-card-badge">THEME 01</div>
            <div class="exp-card-preview quiet-luxury-preview">
              <div class="preview-palette">
                <span style="background: #FAF8F4;" title="Porcelain Ivory"></span>
                <span style="background: #F2EDE4;" title="Soft Cream"></span>
                <span style="background: #E4D7C6;" title="Sand Beige"></span>
                <span style="background: #BDA477;" title="Champagne Accent"></span>
              </div>
            </div>
            <h4 class="exp-card-title">Quiet Luxury</h4>
            <p class="exp-card-sub">Minimal Porcelain Ivory, soft cream surfaces, refined serif typography, and understated champagne accents. Serene and timeless.</p>
            <button type="button" class="exp-card-btn">Select Quiet Luxury</button>
          </div>

          <!-- Option 2: Editorial Impact -->
          <div class="exp-card" id="exp-card-editorial-impact" onclick="selectExperience('editorial-impact')">
            <div class="exp-card-badge">THEME 02</div>
            <div class="exp-card-preview editorial-impact-preview">
              <div class="preview-palette">
                <span style="background: #171715;" title="Editorial Black"></span>
                <span style="background: #302720;" title="Deep Espresso"></span>
                <span style="background: #FAF8F4;" title="Porcelain Ivory"></span>
                <span style="background: #BDA477;" title="Champagne Accent"></span>
              </div>
            </div>
            <h4 class="exp-card-title">Editorial Impact</h4>
            <p class="exp-card-sub">Bold display headlines, high-impact fashion photography, split-screen compositions, and high-contrast editorial drama.</p>
            <button type="button" class="exp-card-btn">Select Editorial Impact</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const current = document.documentElement.getAttribute('data-luxury-style') || 'editorial-impact';
  const cardQuiet = modal.querySelector('#exp-card-quiet-luxury');
  const cardEdit = modal.querySelector('#exp-card-editorial-impact');
  if (cardQuiet) cardQuiet.classList.toggle('is-selected', current === 'quiet-luxury');
  if (cardEdit) cardEdit.classList.toggle('is-selected', current === 'editorial-impact');

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeExperienceModal() {
  const modal = document.getElementById('experience-modal');
  if (modal) modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

function selectExperience(styleName) {
  applyLuxuryStyle(styleName, true);
  closeExperienceModal();
}

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


// Announcement Bar Copy Promo Code Helper
function copyPromoCode(code) {
  if (!code) code = 'GRANDRJ';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).catch(function() {});
  }
  document.querySelectorAll('.code-copy-tip').forEach(function(tip) {
    tip.classList.add('show');
    setTimeout(function() { tip.classList.remove('show'); }, 1800);
  });
  if (typeof showToast === 'function') {
    showToast('Promo code ' + code + ' copied to clipboard!', 'success');
  }
}
window.copyPromoCode = copyPromoCode;


// ===================================================================
// FRAMER MOTION INSPIRED UNIFIED CINEMATIC MOTION CONTROLLER
// Directional reveals, spring physics, viewport observation, reduced motion
// ===================================================================
const MotionSystem = {
  observer: null,
  init() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduced-motion');
      return;
    }

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('motion-in-view');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
      });

      this.observeAll();
    }

    this.animateHeroSequence();
  },

  observeAll() {
    if (!this.observer) return;
    const elements = document.querySelectorAll(`
      .motion-reveal,
      .motion-fade-up,
      .motion-fade-down,
      .motion-fade-left,
      .motion-fade-right,
      .motion-scale-in,
      .product-card,
      .category-card,
      .our-story-grid,
      .spotlight-card,
      .review-card,
      .grand-campaign-strip
    `);

    elements.forEach((el, idx) => {
      if (!el.style.getPropertyValue('--motion-index')) {
        el.style.setProperty('--motion-index', (idx % 6).toString());
      }
      this.observer.observe(el);
    });
  },

  animateHeroSequence() {
    const heroSection = document.querySelector('.grand-hero-section');
    if (!heroSection) return;

    const tag = heroSection.querySelector('.grand-opening-tag');
    const title = heroSection.querySelector('.grand-hero-title');
    const subtitle = heroSection.querySelector('.grand-hero-subtitle');
    const actions = heroSection.querySelector('.grand-hero-actions');
    const gallery = heroSection.querySelector('.grand-hero-gallery');
    const floatCard = heroSection.querySelector('.grand-hero-float-card');

    if (tag) tag.classList.add('motion-hero-tag');
    if (title) title.classList.add('motion-hero-title');
    if (subtitle) subtitle.classList.add('motion-hero-sub');
    if (actions) actions.classList.add('motion-hero-actions');
    if (gallery) gallery.classList.add('motion-hero-gallery');
    if (floatCard) floatCard.classList.add('motion-hero-float');

    heroSection.classList.add('motion-hero-ready');
  }
};
window.MotionSystem = MotionSystem;

// Initialize Motion on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MotionSystem.init());
} else {
  MotionSystem.init();
}

// Header sticky scroll effect
window.addEventListener('scroll', () => {
  const header = document.querySelector('.site-header');
  if (header) {
    if (window.scrollY > 25) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
}, { passive: true });


// Live sync for wishlist count across windows & contexts
window.addEventListener('wishlist-updated', updateWishlistCount);
window.addEventListener('rjfc_wishlist_updated', updateWishlistCount);


// ===================================================================
// FLOATING BACK-TO-TOP & ANNOUNCEMENT ROTATOR ENHANCEMENTS (2026)
// ===================================================================
function initBackToTop() {
  if (document.getElementById('backToTopBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'backToTopBtn';
  btn.className = 'back-to-top-btn';
  btn.setAttribute('aria-label', 'Back to top');
  btn.setAttribute('title', 'Back to top');
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
  document.body.appendChild(btn);

  let isShown = false;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > 350) {
      if (!isShown) {
        btn.classList.add('is-visible');
        isShown = true;
      }
    } else {
      if (isShown) {
        btn.classList.remove('is-visible');
        isShown = false;
      }
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
window.initBackToTop = initBackToTop;

function initAnnouncementBarRotator() {
  const el = document.getElementById('announcement-text');
  if (!el) return;

  const announcements = [
    `<span class="top-bar-msg">Discover the New Season — Explore the RJ Fashion Collection</span>
     <span class="top-bar-sep" aria-hidden="true">•</span>
     <span class="top-bar-perk">Complimentary Express Shipping on Orders Above ₹999</span>
     <span class="top-bar-code-pill" onclick="copyPromoCode('GRANDRJ')" title="Click to copy coupon code GRANDRJ" role="button" tabindex="0">
       <span class="code-label">USE CODE:</span>
       <strong class="code-val">GRANDRJ</strong>
       <span class="code-copy-tip" id="code-copy-tip">COPIED</span>
     </span>`,
    `<span class="top-bar-msg">✨ 100% Certified Authentic Artisanal Silk Weaves & Heirloom Jewelry</span>
     <span class="top-bar-sep" aria-hidden="true">•</span>
     <span class="top-bar-perk">Direct from Master Artisans of Varanasi & Kanchipuram</span>
     <a href="/shop.html?category=sarees" style="color:#d4af37;text-decoration:underline;font-weight:700;margin-left:6px;">Explore Sarees &rarr;</a>`,
    `<span class="top-bar-msg">💬 Need Personalized Styling or Bridal Consultation?</span>
     <span class="top-bar-sep" aria-hidden="true">•</span>
     <span class="top-bar-perk">Boutique VIP Concierge Available on WhatsApp</span>
     <a href="https://wa.me/917894093586?text=Hello%20RJ%20Fashion%20Collection!%20I%20would%20like%20assistance%20with%20your%20luxury%20collection." target="_blank" rel="noopener noreferrer" style="color:#25D366;font-weight:700;margin-left:6px;">Chat Now &rarr;</a>`
  ];

  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % announcements.length;
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      el.innerHTML = announcements[idx];
      el.style.opacity = '1';
    }, 400);
  }, 6500);
}
window.initAnnouncementBarRotator = initAnnouncementBarRotator;
