// RJ FASHION COLLECTION - SHOPPING BAG CONTROLLER
// Perfectly styled to match the "/wishlist" ("My Saved Collection") visual identity
const escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

let appliedCartCoupon = null;

// Initialize coupon from storage if previously saved
try {
  const savedCoupon = sessionStorage.getItem('rjfc_cart_coupon') || localStorage.getItem('rjfc_cart_coupon');
  if (savedCoupon) {
    appliedCartCoupon = JSON.parse(savedCoupon);
  }
} catch (_) {}

function formatPriceSafe(amount) {
  if (typeof formatPrice === 'function') {
    return formatPrice(amount);
  }
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
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

  if (!container) return;

  try {
    // 1. Load Cart Data (API with graceful localStorage fallback)
    let data = null;
    try {
      const res = await fetch(`${API_BASE}/cart`);
      if (res.ok) {
        const apiData = await res.json();
        if (apiData && apiData.success && Array.isArray(apiData.items) && apiData.items.length > 0) {
          data = apiData;
        }
      }
    } catch (_) {}

    // Fallback to localStorage if API returned nothing or failed
    if (!data || !data.items || data.items.length === 0) {
      try {
        const local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');
        const count = local.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
        const subtotal = local.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
        data = {
          success: true,
          items: local,
          itemCount: count,
          subtotal: subtotal,
          total: subtotal
        };
      } catch (_) {}
    }

    const items = (data && Array.isArray(data.items)) ? data.items : [];

    // Empty State Check
    if (items.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (mobileStickyBar) mobileStickyBar.style.display = 'none';
      if (headingCount) headingCount.textContent = '[ 0 Items ]';
      if (typeof updateCartCount === 'function') updateCartCount();
      return;
    }

    // Active Cart Layout
    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (mobileStickyBar) mobileStickyBar.style.display = 'flex';

    const itemCount = data.itemCount || items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    const subtotal = data.subtotal || items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

    if (headingCount) headingCount.textContent = `[ ${itemCount} ${itemCount === 1 ? 'Item' : 'Items'} ]`;

    // 2. Render Minimalist Product Cards with 3:4 Aspect Ratio
    container.innerHTML = items.map((item, index) => {
      const itemId = item.id || item.product_id;
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const linePrice = price * qty;
      const stock = Number(item.stock) || 99;
      const selectedSize = item.size || 'Free Size';
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
    const shippingFee = isComplimentary ? 0 : 49;

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
        shippingDisplay.innerHTML = `<span class="shipping-complimentary-tag">Complimentary</span>`;
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
          <div class="applied-coupon-tag">
            <span>🏷️ ${escapeHtml(appliedCartCoupon.code)} Applied (−${formatPriceSafe(couponDiscountAmount)})</span>
            <button type="button" class="btn-tag-remove" onclick="removeCartCoupon()" title="Remove coupon">✕</button>
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

  // 1. Server sync
  try {
    await fetch(`${API_BASE}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
  } catch (_) {}

  // 2. LocalStorage sync
  try {
    const local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');
    const item = local.find(i => String(i.id) === String(cartItemId) || String(i.product_id) === String(cartItemId));
    if (item) {
      item.quantity = Number(newQty);
      if (typeof saveLocalCartSafe === 'function') {
        saveLocalCartSafe(local);
      } else {
        localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
      }
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
  // 1. Server remove
  try {
    await fetch(`${API_BASE}/cart/${cartItemId}`, { method: 'DELETE' });
  } catch (_) {}

  // 2. LocalStorage remove
  try {
    let local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');
    local = local.filter(i => String(i.id) !== String(cartItemId) && String(i.product_id) !== String(cartItemId));
    if (typeof saveLocalCartSafe === 'function') {
      saveLocalCartSafe(local);
    } else {
      localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
    }
  } catch (_) {}

  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

const removeCartItem = animateAndRemoveCartItem;

async function moveToWishlistFromCart(productId, cartItemId) {
  try {
    await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
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
    const local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
    subtotal = local.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  } catch (_) {}

  let validated = false;
  try {
    const res = await fetch(`${API_BASE}/promotions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount: subtotal })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        appliedCartCoupon = {
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          discount_amount: data.discount_amount
        };
        validated = true;
      }
    }
  } catch (_) {}

  if (!validated) {
    if (code === 'GRANDRJ') {
      const discountVal = subtotal >= 2000 ? 500 : Math.round(subtotal * 0.15);
      appliedCartCoupon = {
        code: 'GRANDRJ',
        discount_type: 'fixed',
        discount_value: discountVal,
        discount_amount: discountVal
      };
      validated = true;
    } else if (code === 'ROYALE10' || code === 'ROYAL10' || code === 'FESTIVE10') {
      const discountVal = Math.round(subtotal * 0.10);
      appliedCartCoupon = {
        code,
        discount_type: 'percentage',
        discount_value: 10,
        discount_amount: discountVal
      };
      validated = true;
    } else if (code === 'WELCOME500' && subtotal >= 2999) {
      appliedCartCoupon = {
        code: 'WELCOME500',
        discount_type: 'fixed',
        discount_value: 500,
        discount_amount: 500
      };
      validated = true;
    }
  }

  if (validated && appliedCartCoupon) {
    try {
      sessionStorage.setItem('rjfc_cart_coupon', JSON.stringify(appliedCartCoupon));
      localStorage.setItem('rjfc_cart_coupon', JSON.stringify(appliedCartCoupon));
    } catch (_) {}
    if (input) input.value = '';
    await loadCart();
  } else {
    if (typeof showToast === 'function') {
      showToast('Invalid promo code or minimum order amount not met', 'error');
    }
  }
}

function removeCartCoupon() {
  appliedCartCoupon = null;
  try {
    sessionStorage.removeItem('rjfc_cart_coupon');
    localStorage.removeItem('rjfc_cart_coupon');
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

document.addEventListener('DOMContentLoaded', loadCart);
