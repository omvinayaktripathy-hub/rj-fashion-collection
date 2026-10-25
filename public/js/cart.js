// RJ FASHION COLLECTION - ULTRA-LUXURY EDITORIAL SHOPPING BAG CONTROLLER
const escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

const FREE_SHIPPING_THRESHOLD = 999;
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
  const summaryBox = document.getElementById('cart-summary-box');
  const priceBreakdown = document.getElementById('cart-price-breakdown');
  const cartLayout = document.getElementById('cart-page-layout');
  const emptyState = document.getElementById('cart-empty-state');
  const headingCount = document.getElementById('cart-heading-count');
  const pincodeDisplay = document.getElementById('cart-pincode-display');
  const shippingFill = document.getElementById('shipping-progress-fill');
  const shippingMsg = document.getElementById('shipping-progress-msg');
  const shippingPercent = document.getElementById('shipping-progress-percent');
  const mobileStickyBar = document.getElementById('mobile-sticky-checkout-bar');
  const mobileStickyPrice = document.getElementById('mobile-sticky-total-price');

  if (!container) return;

  try {
    // 1. Load user default address if available
    try {
      let addrFound = false;
      try {
        const authRes = await fetch(`${API_BASE}/me`);
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.success && authData.user) {
            const addrRes = await fetch(`${API_BASE}/addresses`);
            if (addrRes.ok) {
              const addrData = await addrRes.json();
              if (addrData.success && addrData.addresses && addrData.addresses.length > 0) {
                const def = addrData.addresses.find(a => a.is_default) || addrData.addresses[0];
                if (pincodeDisplay && def) {
                  pincodeDisplay.textContent = `${def.full_name || def.name || 'Delivery Address'}, ${def.pin_code || def.pincode || ''}`;
                  addrFound = true;
                }
              }
            }
            if (!addrFound && pincodeDisplay && authData.user.name) {
              pincodeDisplay.textContent = `${authData.user.name} (Add Delivery Address)`;
              addrFound = true;
            }
          }
        }
      } catch (_) {}

      if (!addrFound) {
        const savedAddrs = JSON.parse(localStorage.getItem('rjfc_saved_addresses') || '[]');
        const selectedId = localStorage.getItem('rjfc_selected_address_id');
        const selectedAddr = savedAddrs.find(a => String(a.id) === String(selectedId)) || savedAddrs[0];
        if (selectedAddr && pincodeDisplay) {
          pincodeDisplay.textContent = `${selectedAddr.name || selectedAddr.full_name || 'Home'}, ${selectedAddr.pincode || selectedAddr.pin_code || ''}`;
          addrFound = true;
        } else {
          const localUser = JSON.parse(localStorage.getItem('rjfc_user') || 'null');
          if (localUser && pincodeDisplay) {
            pincodeDisplay.textContent = `${localUser.name || 'Valued Patron'} (Select Address)`;
            addrFound = true;
          }
        }
      }
    } catch (_) {}

    // 2. Load Cart Data (API with graceful localStorage fallback)
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
        const originalSubtotal = local.reduce((s, i) => s + ((Number(i.original_price) || Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
        const totalSavings = Math.max(0, originalSubtotal - subtotal);
        data = {
          success: true,
          items: local,
          itemCount: count,
          subtotal: subtotal,
          total: subtotal,
          summary: {
            originalSubtotal: originalSubtotal,
            subtotal: subtotal,
            totalSavings: totalSavings,
            delivery: subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : '₹49',
            deliveryAmount: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49,
            total: subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49)
          }
        };
      } catch (_) {}
    }

    const items = (data && Array.isArray(data.items)) ? data.items : [];

    // Empty State Check
    if (items.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (mobileStickyBar) mobileStickyBar.style.display = 'none';
      if (headingCount) headingCount.textContent = '0';
      if (typeof updateCartCount === 'function') updateCartCount();
      return;
    }

    // Active Cart Layout
    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (mobileStickyBar) mobileStickyBar.style.display = 'flex';

    const itemCount = data.itemCount || items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    const subtotal = data.subtotal || items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const originalSubtotal = items.reduce((s, i) => s + ((Number(i.original_price) || Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const catalogSavings = Math.max(0, originalSubtotal - subtotal);

    if (headingCount) headingCount.textContent = String(itemCount);

    // 3. Dynamic Free Shipping Progress Bar
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const shippingPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    if (shippingFill) {
      shippingFill.style.width = `${shippingPct}%`;
    }
    if (shippingPercent) {
      shippingPercent.textContent = `${shippingPct}%`;
    }
    if (shippingMsg) {
      if (remainingForFreeShipping === 0) {
        shippingMsg.innerHTML = `<span class="shipping-unlocked-highlight">✨ <strong>Unlocked!</strong> You qualify for <strong>Complimentary Express Delivery</strong>.</span>`;
      } else {
        shippingMsg.innerHTML = `Add <strong>${formatPriceSafe(remainingForFreeShipping)}</strong> more to unlock <strong>Complimentary Express Delivery</strong>!`;
      }
    }

    // Delivery date calculation (3-4 business days)
    const delivDate = new Date();
    delivDate.setDate(delivDate.getDate() + 3);
    const dateStr = delivDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    // 4. Render 3:4 Vertical Aspect Ratio Luxury Cart Items
    container.innerHTML = items.map(item => {
      const itemId = item.id || item.product_id;
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const origPrice = Number(item.original_price) || price;
      const stock = Number(item.stock) || 99;
      const discount = item.discount || (origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0);
      const isLowStock = stock <= 4;
      const selectedSize = item.size || 'Free Size';

      return `
        <div class="cart-item-editorial-row" id="cart-row-${itemId}">
          <!-- 3:4 Portrait Thumbnail Column -->
          <div class="cart-item-media-col">
            <a href="/product.html?id=${prodId}" class="cart-item-img-anchor">
              <img src="${item.image || '/images/placeholder.jpg'}" alt="${escapeHtml(item.name || 'Designer Ensemble')}" class="cart-item-thumb-3x4" loading="lazy">
            </a>
          </div>

          <!-- Item Details & Stepper Column -->
          <div class="cart-item-details-col">
            <div class="cart-item-header-row">
              <div>
                <div class="cart-item-boutique-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>RJ Fashion Boutique</span>
                </div>
                <h3 class="cart-item-title">
                  <a href="/product.html?id=${prodId}">${escapeHtml(item.name || 'Artisanal Ensemble')}</a>
                </h3>
                <div class="cart-item-specs-row">
                  <span class="spec-pill">Size: <strong>${escapeHtml(selectedSize)}</strong></span>
                  ${isLowStock ? `
                    <span class="spec-pill urgency-pill">⚡ Only ${stock} Left</span>
                  ` : `
                    <span class="spec-pill instock-pill">✓ In Stock</span>
                  `}
                </div>
              </div>

              <!-- Estimated Delivery Tag -->
              <div class="cart-item-deliv-tag">
                <span class="deliv-date">Est. Delivery <strong>${dateStr}</strong></span>
                <span class="deliv-free">${subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : 'EXPRESS'}</span>
              </div>
            </div>

            <!-- Price and Quantity Control Row -->
            <div class="cart-item-pricing-stepper-row">
              <div class="cart-item-price-block">
                <span class="cart-current-price">${formatPriceSafe(price)}</span>
                ${origPrice > price ? `
                  <span class="cart-original-price">${formatPriceSafe(origPrice)}</span>
                  <span class="cart-discount-badge">${discount}% OFF</span>
                ` : ''}
              </div>

              <!-- Quantity Stepper -->
              <div class="qty-stepper-editorial">
                <button class="qty-step-btn" type="button" onclick="changeCartQty('${itemId}', ${qty - 1})" title="Decrease quantity" aria-label="Decrease quantity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <span class="qty-step-val">${qty}</span>
                <button class="qty-step-btn" type="button" onclick="changeCartQty('${itemId}', ${qty + 1})" ${qty >= stock ? 'disabled' : ''} title="Increase quantity" aria-label="Increase quantity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            </div>

            <!-- Action Buttons: Save for Later, Remove -->
            <div class="cart-item-actions-row">
              <button class="btn-cart-action btn-save-later" type="button" onclick="moveToWishlistFromCart('${prodId}', '${itemId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <span>Save for Later</span>
              </button>
              <button class="btn-cart-action btn-remove-item" type="button" onclick="removeCartItem('${itemId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 5. Calculate Discount & Promo Code
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

    const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49;
    const finalTotal = Math.max(0, subtotal - couponDiscountAmount + deliveryFee);
    const overallSavings = catalogSavings + couponDiscountAmount + (subtotal >= FREE_SHIPPING_THRESHOLD ? 49 : 0);

    // Update Applied Coupon Pill UI
    const appliedPillWrap = document.getElementById('applied-coupon-pill-wrap');
    if (appliedPillWrap) {
      if (appliedCartCoupon) {
        appliedPillWrap.style.display = 'block';
        appliedPillWrap.innerHTML = `
          <div class="applied-coupon-pill">
            <span class="coupon-tag-icon">🏷️</span>
            <div class="coupon-tag-info">
              <strong>${escapeHtml(appliedCartCoupon.code)}</strong>
              <span>- ${formatPriceSafe(couponDiscountAmount)} Saved</span>
            </div>
            <button type="button" class="btn-remove-coupon" onclick="removeCartCoupon()" title="Remove coupon">✕</button>
          </div>
        `;
      } else {
        appliedPillWrap.style.display = 'none';
        appliedPillWrap.innerHTML = '';
      }
    }

    // 6. Render Price Breakdown into #cart-price-breakdown
    if (priceBreakdown) {
      priceBreakdown.innerHTML = `
        <div class="price-breakdown-row">
          <span>Items Total (${itemCount} item${itemCount > 1 ? 's' : ''})</span>
          <span>${formatPriceSafe(originalSubtotal)}</span>
        </div>

        ${catalogSavings > 0 ? `
          <div class="price-breakdown-row discount-row">
            <span>Instant Catalog Savings</span>
            <span class="savings-val">− ${formatPriceSafe(catalogSavings)}</span>
          </div>
        ` : ''}

        ${couponDiscountAmount > 0 ? `
          <div class="price-breakdown-row discount-row">
            <span>Promo Coupon (${escapeHtml(appliedCartCoupon.code)})</span>
            <span class="savings-val">− ${formatPriceSafe(couponDiscountAmount)}</span>
          </div>
        ` : ''}

        <div class="price-breakdown-row">
          <span>Express Delivery</span>
          <span>
            ${deliveryFee === 0 ? `
              <span class="strike-fee">₹49</span>
              <span class="free-fee-badge">FREE</span>
            ` : formatPriceSafe(deliveryFee)}
          </span>
        </div>

        <div class="price-breakdown-row total-order-row">
          <div>
            <div class="total-label">Total Amount</div>
            <div class="gst-subtext">Inclusive of all applicable GST taxes</div>
          </div>
          <div class="total-amount-val">${formatPriceSafe(finalTotal)}</div>
        </div>

        ${overallSavings > 0 ? `
          <div class="cart-total-savings-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>You will save <strong>${formatPriceSafe(overallSavings)}</strong> on this order</span>
          </div>
        ` : ''}
      `;
    }

    // 7. Update Mobile Sticky Bottom Checkout Bar
    if (mobileStickyPrice) {
      mobileStickyPrice.textContent = formatPriceSafe(finalTotal);
    }

    if (typeof updateCartCount === 'function') updateCartCount();
  } catch (err) {
    console.error('Error loading cart:', err);
    if (container) {
      container.innerHTML = `<p style="padding: 24px; color: var(--danger); text-align: center;">Unable to load items. <button onclick="loadCart()" style="background: none; border: 1px solid var(--border); padding: 6px 14px; border-radius: 6px; cursor: pointer; margin-left: 8px;">Retry</button></p>`;
    }
  }
}

async function changeCartQty(cartItemId, newQty) {
  if (newQty < 1) {
    removeCartItem(cartItemId);
    return;
  }

  // 1. Try server update
  try {
    await fetch(`${API_BASE}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
  } catch (_) {}

  // 2. Keep localStorage in sync
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

async function removeCartItem(cartItemId) {
  // 1. Try server remove
  try {
    await fetch(`${API_BASE}/cart/${cartItemId}`, { method: 'DELETE' });
  } catch (_) {}

  // 2. Sync with localStorage
  try {
    let local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');
    local = local.filter(i => String(i.id) !== String(cartItemId) && String(i.product_id) !== String(cartItemId));
    if (typeof saveLocalCartSafe === 'function') {
      saveLocalCartSafe(local);
    } else {
      localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
    }
  } catch (_) {}

  if (typeof showToast === 'function') {
    showToast('Item removed from shopping bag', 'info');
  }
  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

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

  await removeCartItem(cartItemId);
  if (typeof showToast === 'function') {
    showToast('Item saved to your Wishlist!', 'success');
  }
  if (typeof updateWishlistCount === 'function') updateWishlistCount();
}

// ─────────────────────────────────────────────────────────────
// Interactive Promo Code System
// ─────────────────────────────────────────────────────────────
async function applyCartCoupon(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('coupon-code-input');
  const code = (input ? input.value : '').trim().toUpperCase();

  if (!code) {
    if (typeof showToast === 'function') showToast('Please enter a promo code', 'warning');
    return;
  }

  // Calculate current subtotal from local cart
  let subtotal = 0;
  try {
    const local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
    subtotal = local.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  } catch (_) {}

  // 1. Try server validation
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
          discount_amount: data.discount_amount,
          description: data.message
        };
        validated = true;
      } else if (data && data.message) {
        if (typeof showToast === 'function') showToast(data.message, 'error');
        return;
      }
    }
  } catch (_) {}

  // 2. Client-side fallback promotional codes
  if (!validated) {
    if (code === 'GRANDRJ') {
      const discountVal = subtotal >= 2000 ? 500 : Math.round(subtotal * 0.15);
      appliedCartCoupon = {
        code: 'GRANDRJ',
        discount_type: 'fixed',
        discount_value: discountVal,
        discount_amount: discountVal,
        description: 'Grand Opening Special Privilege'
      };
      validated = true;
    } else if (code === 'ROYALE10' || code === 'ROYAL10' || code === 'FESTIVE10') {
      const discountVal = Math.round(subtotal * 0.10);
      appliedCartCoupon = {
        code,
        discount_type: 'percentage',
        discount_value: 10,
        discount_amount: discountVal,
        description: '10% Royal Festive Discount'
      };
      validated = true;
    } else if (code === 'WELCOME500' && subtotal >= 2999) {
      appliedCartCoupon = {
        code: 'WELCOME500',
        discount_type: 'fixed',
        discount_value: 500,
        discount_amount: 500,
        description: 'Welcome Privilege (Orders ₹2,999+)'
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
    if (typeof showToast === 'function') {
      showToast(`👑 Promo code "${appliedCartCoupon.code}" applied successfully!`, 'success');
    }
    if (typeof triggerConfetti === 'function') {
      triggerConfetti(35);
    }
    await loadCart();
  } else {
    if (typeof showToast === 'function') {
      showToast('Invalid coupon code or minimum order amount not met', 'error');
    }
  }
}

function removeCartCoupon() {
  appliedCartCoupon = null;
  try {
    sessionStorage.removeItem('rjfc_cart_coupon');
    localStorage.removeItem('rjfc_cart_coupon');
  } catch (_) {}
  if (typeof showToast === 'function') {
    showToast('Promo code removed', 'info');
  }
  loadCart();
}

// ─────────────────────────────────────────────────────────────
// 1-Click Upsell Accessory Quick-Add
// ─────────────────────────────────────────────────────────────
async function quickAddAccessory(id, name, price, image) {
  const newItem = {
    id: 'upsell_' + id,
    product_id: id,
    name: name,
    price: Number(price),
    original_price: Math.round(Number(price) * 1.3),
    image: image,
    quantity: 1,
    size: 'Standard'
  };

  // 1. Try server POST
  try {
    await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
  } catch (_) {}

  // 2. Local storage fallback
  try {
    let local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');
    const existing = local.find(i => String(i.product_id) === String(id) || String(i.id) === String(id));
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + 1;
    } else {
      local.push(newItem);
    }
    if (typeof saveLocalCartSafe === 'function') {
      saveLocalCartSafe(local);
    } else {
      localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
    }
  } catch (_) {}

  if (typeof showToast === 'function') {
    showToast(`✨ Added "${name}" to your shopping bag!`, 'success');
  }
  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

// ─────────────────────────────────────────────────────────────
// Checkout Transition
// ─────────────────────────────────────────────────────────────
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
window.moveToWishlistFromCart = moveToWishlistFromCart;
window.applyCartCoupon = applyCartCoupon;
window.removeCartCoupon = removeCartCoupon;
window.quickAddAccessory = quickAddAccessory;
window.handleCartProceedCheckout = handleCartProceedCheckout;

document.addEventListener('DOMContentLoaded', loadCart);
