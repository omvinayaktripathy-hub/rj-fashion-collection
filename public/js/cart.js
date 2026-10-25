// RJ FASHION COLLECTION - ULTRA-MINIMALIST EDITORIAL SHOPPING BAG CONTROLLER
// Inspired by The Row, SSENSE, and Acne Studios
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

function toggleCartPromoField(show) {
  const linkWrap = document.getElementById('promo-toggle-link-wrap');
  const form = document.getElementById('cart-coupon-form');
  const input = document.getElementById('coupon-code-input');

  if (linkWrap && form) {
    if (show) {
      linkWrap.style.display = 'none';
      form.style.display = 'flex';
      if (input) {
        input.focus();
      }
    } else {
      linkWrap.style.display = 'block';
      form.style.display = 'none';
      if (input) {
        input.value = '';
      }
    }
  }
}

async function loadCart() {
  const container = document.getElementById('cart-items-list');
  const cartLayout = document.getElementById('cart-page-layout');
  const emptyState = document.getElementById('cart-empty-state');
  const headingCount = document.getElementById('cart-heading-count');
  const subtotalDisplay = document.getElementById('cart-subtotal-display');
  const totalDisplay = document.getElementById('cart-total-display');
  const promoRow = document.getElementById('cart-promo-discount-row');
  const promoVal = document.getElementById('cart-promo-discount-display');
  const promoLabel = document.getElementById('applied-promo-label');
  const appliedPillWrap = document.getElementById('applied-coupon-pill-wrap');
  const promoToggleWrap = document.getElementById('promo-toggle-link-wrap');
  const promoForm = document.getElementById('cart-coupon-form');
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
      if (headingCount) headingCount.textContent = '(0)';
      if (typeof updateCartCount === 'function') updateCartCount();
      return;
    }

    // Active Cart Layout
    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (mobileStickyBar) mobileStickyBar.style.display = 'flex';

    const itemCount = data.itemCount || items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    const subtotal = data.subtotal || items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

    if (headingCount) headingCount.textContent = `(${itemCount})`;

    // 2. Render Spacious 3:4 Vertical Items with Hairline Dividers
    container.innerHTML = items.map((item, index) => {
      const itemId = item.id || item.product_id;
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const linePrice = price * qty;
      const stock = Number(item.stock) || 99;
      const selectedSize = item.size || 'Standard';
      const colorway = item.color || item.colorway || 'Signature Tone';
      const sku = item.sku || `ITEM: RJ-${String(prodId || index + 100).padStart(4, '0')}`;

      return `
        <div class="cart-item-minimal-row" id="cart-row-${itemId}">
          <!-- Large 3:4 Vertical Portrait Thumbnail -->
          <div class="cart-item-thumb-wrapper">
            <a href="/product.html?id=${prodId}" class="cart-thumb-anchor">
              <img src="${item.image || '/images/placeholder.jpg'}" alt="${escapeHtml(item.name || 'Artisanal Garment')}" class="cart-thumb-img" loading="lazy">
            </a>
          </div>

          <!-- Product Details & Controls -->
          <div class="cart-item-content-wrapper">
            <div class="cart-item-specs-header">
              <span class="cart-item-sku">${escapeHtml(sku)}</span>
              <h2 class="cart-item-headline">
                <a href="/product.html?id=${prodId}">${escapeHtml(item.name || 'Artisanal Ensemble')}</a>
              </h2>
              <div class="cart-item-meta-details">
                <span class="meta-color">Color: ${escapeHtml(colorway)}</span>
                <span class="meta-sep">•</span>
                <span class="meta-size">Size: ${escapeHtml(selectedSize)}</span>
              </div>
            </div>

            <!-- Bottom Row: Inline Minimal Stepper, Line Price, and Understated Remove Link -->
            <div class="cart-item-bottom-bar">
              <!-- Minimalist Text Stepper (No heavy button boxes) -->
              <div class="qty-stepper-minimal">
                <button type="button" class="qty-stepper-btn" onclick="changeCartQty('${itemId}', ${qty - 1})" aria-label="Decrease quantity">−</button>
                <span class="qty-stepper-count">${qty}</span>
                <button type="button" class="qty-stepper-btn" onclick="changeCartQty('${itemId}', ${qty + 1})" ${qty >= stock ? 'disabled' : ''} aria-label="Increase quantity">+</button>
              </div>

              <!-- Price & Remove -->
              <div class="cart-item-pricing-action">
                <span class="cart-item-line-price">${formatPriceSafe(linePrice)}</span>
                <button type="button" class="btn-item-remove-link" onclick="animateAndRemoveCartItem('${itemId}')">Remove</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 3. Calculate Promo Discount
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

    const finalTotal = Math.max(0, subtotal - couponDiscountAmount);

    // Update Summary Displays
    if (subtotalDisplay) subtotalDisplay.textContent = formatPriceSafe(subtotal);
    if (totalDisplay) totalDisplay.textContent = formatPriceSafe(finalTotal);

    if (promoRow && promoVal) {
      if (couponDiscountAmount > 0) {
        promoRow.style.display = 'flex';
        promoVal.textContent = `− ${formatPriceSafe(couponDiscountAmount)}`;
        if (promoLabel) promoLabel.textContent = `Promo (${appliedCartCoupon.code})`;
      } else {
        promoRow.style.display = 'none';
      }
    }

    // Applied Promo Tag
    if (appliedPillWrap) {
      if (appliedCartCoupon && couponDiscountAmount > 0) {
        appliedPillWrap.style.display = 'flex';
        appliedPillWrap.innerHTML = `
          <span class="applied-code-badge">${escapeHtml(appliedCartCoupon.code)} Applied</span>
          <button type="button" class="btn-clear-code" onclick="removeCartCoupon()" title="Remove promo code">✕</button>
        `;
        if (promoToggleWrap) promoToggleWrap.style.display = 'none';
        if (promoForm) promoForm.style.display = 'none';
      } else {
        appliedPillWrap.style.display = 'none';
        appliedPillWrap.innerHTML = '';
        if (promoToggleWrap) promoToggleWrap.style.display = 'block';
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
      container.innerHTML = `<p style="padding: 32px 0; color: #707070; text-align: center; font-size: 13px;">Unable to load items. <button onclick="loadCart()" style="background: none; border: none; text-decoration: underline; cursor: pointer; color: #0f0f0f; margin-left: 8px;">Retry</button></p>`;
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

// Micro-fade removal animation
function animateAndRemoveCartItem(cartItemId) {
  const row = document.getElementById(`cart-row-${cartItemId}`);
  if (row) {
    row.classList.add('item-row-fade-out');
    setTimeout(async () => {
      await executeRemoveCartItem(cartItemId);
    }, 320);
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

// Keep removeCartItem pointing to animateAndRemoveCartItem for backwards compatibility
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

// Minimal Collapsible Promo Code
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
    toggleCartPromoField(false);
    await loadCart();
  } else {
    if (typeof showToast === 'function') {
      showToast('Invalid promo code', 'error');
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
window.toggleCartPromoField = toggleCartPromoField;

document.addEventListener('DOMContentLoaded', loadCart);
