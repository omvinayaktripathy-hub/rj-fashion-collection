// RJ FASHION COLLECTION - SHOPPING BAG CONTROLLER
// Perfectly styled to match the "/wishlist" ("My Saved Collection") visual identity
var escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

const UNIFIED_CART_KEYS = ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'];

let appliedCartCoupon = null;

// Initialize coupon from storage if previously saved
try {
  const savedCoupon = sessionStorage.getItem('rjfc_cart_coupon') || localStorage.getItem('rjfc_cart_coupon') || sessionStorage.getItem('rjfc_cart_promo_code') || localStorage.getItem('rjfc_cart_promo_code');
  if (savedCoupon) {
    if (savedCoupon.startsWith('{')) {
      appliedCartCoupon = JSON.parse(savedCoupon);
    } else {
      appliedCartCoupon = {
        code: savedCoupon,
        discount_type: 'fixed',
        discount_value: 500,
        discount_amount: 500
      };
    }
  }
} catch (_) {}

function formatPriceSafe(amount) {
  if (typeof formatPrice === 'function') {
    return formatPrice(amount);
  }
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

// Normalize a cart item from any backend or local format
function normalizeCartItemSafe(item, idx = 0) {
  if (!item || typeof item !== 'object') return null;
  const pId = item.id || item.product_id || `item_${idx + 1}`;
  const cId = item.cart_id || `cart_${pId}_${item.selected_size || item.size || 'default'}`;
  const price = Number(item.price) || 0;
  const originalPrice = Number(item.original_price || item.originalPrice || price);
  const discount = Number(item.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const size = item.selected_size || item.size || 'Free Size';
  const color = item.color || item.colorway || 'Signature Tone';
  const category = item.category || item.category_name || item.department || 'Luxury Couture';
  const image = item.image || item.thumbnail || (Array.isArray(item.images) && item.images[0]) || '/images/placeholder.jpg';
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const stock = item.stock !== undefined ? Number(item.stock) : 99;

  return {
    id: pId,
    product_id: pId,
    cart_id: cId,
    name: item.name || item.title || 'Artisanal Ensemble',
    category,
    price,
    original_price: originalPrice,
    originalPrice,
    discount,
    image,
    quantity,
    size,
    selected_size: size,
    color,
    sku: item.sku || `RJ-${String(pId).padStart(4, '0')}`,
    stock
  };
}

// Read unified cart from all storage mechanisms
function getUnifiedLocalCart() {
  for (const key of UNIFIED_CART_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeCartItemSafe).filter(Boolean);
          if (normalized.length > 0) return normalized;
        }
      }
    } catch (_) {}
  }

  for (const key of UNIFIED_CART_KEYS) {
    try {
      const sRaw = sessionStorage.getItem(key);
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeCartItemSafe).filter(Boolean);
          if (normalized.length > 0) return normalized;
        }
      }
    } catch (_) {}
  }

  if (typeof window !== 'undefined' && Array.isArray(window._rjfc_memory_cart) && window._rjfc_memory_cart.length > 0) {
    return window._rjfc_memory_cart.map(normalizeCartItemSafe).filter(Boolean);
  }

  return [];
}

// Save unified cart to all storage mechanisms and notify other components
function saveUnifiedLocalCart(cartArray) {
  if (!Array.isArray(cartArray)) cartArray = [];
  const normalized = cartArray.map(normalizeCartItemSafe).filter(Boolean);
  const json = JSON.stringify(normalized);

  if (typeof window !== 'undefined') {
    window._rjfc_memory_cart = normalized;
  }

  for (const key of UNIFIED_CART_KEYS) {
    try { localStorage.setItem(key, json); } catch (_) {}
    try { sessionStorage.setItem(key, json); } catch (_) {}
  }

  try {
    window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: normalized } }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}

  try {
    if (typeof updateCartCount === 'function') {
      updateCartCount();
    }
  } catch (_) {}
}

async function loadCart() {
  const container = document.getElementById('cart-items-list');
  const cartLayout = document.getElementById('cart-page-layout');
  const emptyState = document.getElementById('cart-empty-state');
  const headingCount = document.getElementById('cart-heading-count');
  const subtotalDisplay = document.getElementById('cart-subtotal-display');
  const shippingDisplay = document.getElementById('cart-shipping-display');
  const totalDisplay = document.getElementById('cart-total-display');
  const promoRow = document.getElementById('cart-promo-discount-row');
  const promoVal = document.getElementById('cart-promo-discount-display');
  const promoLabel = document.getElementById('applied-promo-label');
  const appliedPillWrap = document.getElementById('applied-coupon-pill-wrap');
  const mobileStickyBar = document.getElementById('mobile-sticky-checkout-bar');
  const mobileStickyPrice = document.getElementById('mobile-sticky-total-price');
  const btnProceed = document.getElementById('btn-proceed-checkout');

  if (!container) return;

  try {
    // 1. Load Cart Data (API with graceful localStorage fallback)
    let items = [];
    try {
      if (window.isStaticHosting) throw new Error('static');
      const res = await fetch(`${API_BASE}/cart`);
      if (res.ok) {
        const apiData = await res.json();
        if (apiData && apiData.success && Array.isArray(apiData.items) && apiData.items.length > 0) {
          items = apiData.items.map(normalizeCartItemSafe).filter(Boolean);
          // Mirror active server session to local storage
          saveUnifiedLocalCart(items);
        }
      }
    } catch (_) {}

    // Fallback to unified localStorage if API returned nothing or was empty
    if (!items || items.length === 0) {
      items = getUnifiedLocalCart();
    }

    // Empty State Check
    if (items.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (mobileStickyBar) mobileStickyBar.style.display = 'none';
      if (headingCount) headingCount.textContent = '[ 0 Items ]';
      if (subtotalDisplay) subtotalDisplay.textContent = '₹0';
      if (totalDisplay) totalDisplay.textContent = '₹0';
      if (btnProceed) {
        btnProceed.disabled = true;
        btnProceed.style.opacity = '0.5';
        btnProceed.style.cursor = 'not-allowed';
      }
      if (typeof updateCartCount === 'function') updateCartCount();
      return;
    }

    // Active Cart Layout
    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (mobileStickyBar) mobileStickyBar.style.display = 'flex';
    if (btnProceed) {
      btnProceed.disabled = false;
      btnProceed.style.opacity = '1';
      btnProceed.style.cursor = 'pointer';
    }

    const itemCount = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    const subtotal = items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

    if (headingCount) headingCount.textContent = `[ ${itemCount} ${itemCount === 1 ? 'Item' : 'Items'} ]`;

    // 2. Render Minimalist Product Cards with 3:4 Aspect Ratio
    container.innerHTML = items.map((item, index) => {
      const itemId = item.cart_id || item.id || item.product_id;
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const linePrice = price * qty;
      const stock = Number(item.stock) || 99;
      const selectedSize = item.selected_size || item.size || 'Free Size';
      const colorway = item.color || item.colorway || 'Signature Tone';
      const category = item.category || 'Luxury Couture';

      return `
        <div class="cart-item-card" id="cart-row-${itemId}">
          <!-- Tall 3:4 Portrait Thumbnail with Rounded Corners -->
          <div class="cart-item-media">
            <a href="/product.html?id=${prodId}" class="cart-item-thumb-link">
              <img src="${item.image || '/images/placeholder.jpg'}" alt="${escapeHtml(item.name || 'Artisanal Garment')}" class="cart-item-thumb-img" loading="lazy">
            </a>
          </div>

          <!-- Item Details -->
          <div class="cart-item-info">
            <div class="cart-item-top">
              <div class="cart-item-cat-tag">${escapeHtml(category)}</div>
              <h2 class="cart-item-name">
                <a href="/product.html?id=${prodId}">${escapeHtml(item.name || 'Artisanal Ensemble')}</a>
              </h2>
              <div class="cart-item-variant-pill">
                <span>Color: <strong>${escapeHtml(colorway)}</strong></span>
                <span class="variant-sep">•</span>
                <span>Size: <strong>${escapeHtml(selectedSize)}</strong></span>
              </div>
            </div>

            <!-- Bottom Row: Stepper, Line Price, and Discreet Remove -->
            <div class="cart-item-bottom">
              <!-- Minimal Inline Stepper (- 1 +) -->
              <div class="cart-stepper-box">
                <button type="button" class="btn-step" onclick="changeCartQty('${itemId}', ${qty - 1})" aria-label="Decrease quantity">−</button>
                <span class="step-count">${qty}</span>
                <button type="button" class="btn-step" onclick="changeCartQty('${itemId}', ${qty + 1})" ${qty >= stock ? 'disabled' : ''} aria-label="Increase quantity">+</button>
              </div>

              <!-- Price & Remove -->
              <div class="cart-price-remove-wrap">
                <span class="cart-unit-price-bold">${formatPriceSafe(linePrice)}</span>
                <button type="button" class="btn-cart-remove" onclick="animateAndRemoveCartItem('${itemId}')">Remove</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 3. Calculate Shipping & Promo Code
    const isComplimentary = subtotal >= 999;
    const shippingFee = subtotal === 0 || isComplimentary ? 0 : 49;

    let couponDiscountAmount = 0;
    if (appliedCartCoupon) {
      if (appliedCartCoupon.discount_type === 'percentage') {
        couponDiscountAmount = Math.round((subtotal * appliedCartCoupon.discount_value) / 100);
        if (appliedCartCoupon.max_discount_amount && couponDiscountAmount > appliedCartCoupon.max_discount_amount) {
          couponDiscountAmount = appliedCartCoupon.max_discount_amount;
        }
      } else {
        couponDiscountAmount = Math.min(subtotal, Number(appliedCartCoupon.discount_amount || appliedCartCoupon.discount_value || 0));
      }
    }

    const finalTotal = Math.max(0, subtotal - couponDiscountAmount + shippingFee);

    // Update Summary Card
    if (subtotalDisplay) subtotalDisplay.textContent = formatPriceSafe(subtotal);
    if (totalDisplay) totalDisplay.textContent = formatPriceSafe(finalTotal);

    if (shippingDisplay) {
      if (isComplimentary) {
        shippingDisplay.innerHTML = `<span class="shipping-complimentary-tag" style="color: #059669; font-weight: 600;">Complimentary</span>`;
      } else {
        shippingDisplay.textContent = formatPriceSafe(shippingFee);
      }
    }

    if (promoRow && promoVal) {
      if (couponDiscountAmount > 0) {
        promoRow.style.display = 'flex';
        promoVal.textContent = `− ${formatPriceSafe(couponDiscountAmount)}`;
        if (promoLabel) promoLabel.textContent = `Promo (${appliedCartCoupon.code})`;
      } else {
        promoRow.style.display = 'none';
      }
    }

    // Applied Coupon Tag
    if (appliedPillWrap) {
      if (appliedCartCoupon && couponDiscountAmount > 0) {
        appliedPillWrap.style.display = 'flex';
        appliedPillWrap.innerHTML = `
          <div class="applied-coupon-tag" style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #059669; background: rgba(5, 150, 105, 0.08); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(5, 150, 105, 0.2);">
            <span>🏷️ ${escapeHtml(appliedCartCoupon.code)} Applied (−${formatPriceSafe(couponDiscountAmount)})</span>
            <button type="button" class="btn-tag-remove" onclick="removeCartCoupon()" title="Remove coupon" style="background: none; border: none; cursor: pointer; color: #059669; margin-left: 4px;">✕</button>
          </div>
        `;
      } else {
        appliedPillWrap.style.display = 'none';
        appliedPillWrap.innerHTML = '';
      }
    }

    // Update Mobile Sticky Checkout Bar
    if (mobileStickyPrice) {
      mobileStickyPrice.textContent = formatPriceSafe(finalTotal);
    }

    if (typeof updateCartCount === 'function') updateCartCount();
  } catch (err) {
    console.error('Error loading cart:', err);
    if (container) {
      container.innerHTML = `<p style="padding: 32px 0; color: #78716C; text-align: center; font-size: 13px;">Unable to load items. <button onclick="loadCart()" style="background: none; border: none; text-decoration: underline; cursor: pointer; color: #111111; margin-left: 8px;">Retry</button></p>`;
    }
  }
}

async function changeCartQty(cartItemId, newQty) {
  if (newQty < 1) {
    animateAndRemoveCartItem(cartItemId);
    return;
  }

  // 1. Server sync (non-blocking)
  try {
    fetch(`${API_BASE}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    }).catch(() => {});
  } catch (_) {}

  // 2. Unified storage sync
  try {
    const local = getUnifiedLocalCart();
    const item = local.find(i => String(i.cart_id) === String(cartItemId) || String(i.id) === String(cartItemId) || String(i.product_id) === String(cartItemId));
    if (item) {
      item.quantity = Number(newQty);
      saveUnifiedLocalCart(local);
    }
  } catch (_) {}

  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

function animateAndRemoveCartItem(cartItemId) {
  const row = document.getElementById(`cart-row-${cartItemId}`);
  if (row) {
    row.classList.add('item-row-fade-out');
    setTimeout(async () => {
      await executeRemoveCartItem(cartItemId);
    }, 280);
  } else {
    executeRemoveCartItem(cartItemId);
  }
}

async function executeRemoveCartItem(cartItemId) {
  // 1. Server remove (non-blocking)
  try {
    fetch(`${API_BASE}/cart/${cartItemId}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}

  // 2. Unified storage remove
  try {
    let local = getUnifiedLocalCart();
    local = local.filter(i => String(i.cart_id) !== String(cartItemId) && String(i.id) !== String(cartItemId) && String(i.product_id) !== String(cartItemId));
    saveUnifiedLocalCart(local);
  } catch (_) {}

  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

const removeCartItem = animateAndRemoveCartItem;

async function moveToWishlistFromCart(productId, cartItemId) {
  try {
    fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    }).catch(() => {});
  } catch (_) {}

  try {
    let wl = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    if (!wl.includes(productId)) {
      wl.push(productId);
      localStorage.setItem('rjfc_wishlist', JSON.stringify(wl));
    }
  } catch (_) {}

  await animateAndRemoveCartItem(cartItemId);
  if (typeof updateWishlistCount === 'function') updateWishlistCount();
}

async function applyCartCoupon(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('coupon-code-input');
  const code = (input ? input.value : '').trim().toUpperCase();

  if (!code) return;

  let subtotal = 0;
  try {
    const local = getUnifiedLocalCart();
    subtotal = local.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  } catch (_) {}

  try {
    const res = await fetch(`${API_BASE}/promotions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount: subtotal })
    });
    const data = await res.json();
    if (res.ok && data && data.success) {
      appliedCartCoupon = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        discount_amount: data.discount_amount
      };
      try {
        sessionStorage.setItem('rjfc_cart_coupon', JSON.stringify(appliedCartCoupon));
        localStorage.setItem('rjfc_cart_coupon', JSON.stringify(appliedCartCoupon));
        sessionStorage.setItem('rjfc_cart_promo_code', appliedCartCoupon.code);
        localStorage.setItem('rjfc_cart_promo_code', appliedCartCoupon.code);
      } catch (_) {}
      if (input) input.value = '';
      await loadCart();
      if (typeof showToast === 'function') {
        showToast(data.message || `Promo code "${appliedCartCoupon.code}" applied successfully! 🎉`, 'success');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(data?.message || 'Invalid promo code or not eligible.', 'error');
      }
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('Could not validate promo code. Please check your connection.', 'error');
    }
  }
}

function removeCartCoupon() {
  appliedCartCoupon = null;
  try {
    sessionStorage.removeItem('rjfc_cart_coupon');
    localStorage.removeItem('rjfc_cart_coupon');
    sessionStorage.removeItem('rjfc_cart_promo_code');
    localStorage.removeItem('rjfc_cart_promo_code');
  } catch (_) {}
  loadCart();
}

function handleCartProceedCheckout() {
  let user = null;
  const localUser = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
  if (localUser) {
    try { user = JSON.parse(localUser); } catch (_) {}
  }
  if (!user) {
    window.location.href = '/login.html?redirect=/delivery.html';
  } else {
    window.location.href = '/delivery.html';
  }
}

// Global Exports
window.loadCart = loadCart;
window.changeCartQty = changeCartQty;
window.removeCartItem = removeCartItem;
window.animateAndRemoveCartItem = animateAndRemoveCartItem;
window.moveToWishlistFromCart = moveToWishlistFromCart;
window.applyCartCoupon = applyCartCoupon;
window.removeCartCoupon = removeCartCoupon;
window.handleCartProceedCheckout = handleCartProceedCheckout;
window.getUnifiedLocalCart = getUnifiedLocalCart;
window.saveUnifiedLocalCart = saveUnifiedLocalCart;

// Real-time synchronization listeners
if (typeof window !== 'undefined') {
  window.addEventListener('rjfc_cart_updated', function() {
    loadCart();
  });
  window.addEventListener('storage', function(e) {
    if (e.key && (e.key.includes('cart') || e.key.includes('promo'))) {
      loadCart();
    }
  });
}

document.addEventListener('DOMContentLoaded', loadCart);
