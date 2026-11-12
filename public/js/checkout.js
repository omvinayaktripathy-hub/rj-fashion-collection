var escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

// RJ FASHION COLLECTION - DEDICATED ORDER REVIEW & PAYMENT CONTROLLER (STEP 3)
const CART_STORAGE_KEYS = ['rj_fashion_cart', 'rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'];
const ADDRESS_STORAGE_KEYS = ['rj_selected_address', 'checkout_address_summary', 'rjfc_selected_address'];

let activeAddressData = null;
let currentCartItems = [];
let currentCartTotal = 0;
let appliedDiscount = 0;
let couponCodeApplied = (function() { try { return sessionStorage.getItem('rjfc_cart_promo_code') || localStorage.getItem('rjfc_cart_promo_code') || ''; } catch(_) { return ''; } })();
let checkoutUser = null;

function formatPrice(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// ─────────────────────────────────────────────────────────────
// Storage Unification Helpers
// ─────────────────────────────────────────────────────────────

function getUnifiedLocalCart() {
  for (const key of CART_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  return [];
}

function clearUnifiedCart() {
  for (const key of CART_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (_) {}
  }
  try {
    fetch('/api/cart/clear', { method: 'POST' }).catch(() => {});
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: [] } }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}
  if (typeof updateCartCount === 'function') updateCartCount();
}

function getUnifiedSelectedAddress() {
  for (const key of ADDRESS_STORAGE_KEYS) {
    try {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && (parsed.name || parsed.fullName || parsed.full_name)) {
          return {
            id: parsed.id || parsed.address_id || null,
            name: parsed.name || parsed.fullName || parsed.full_name,
            phone: parsed.phone || parsed.customer_phone || '',
            house_flat: parsed.house_flat || parsed.houseFlat || '',
            street: parsed.street || '',
            city: parsed.city || '',
            state: parsed.state || '',
            pin_code: parsed.pin_code || parsed.pinCode || '',
            text: parsed.text || `${parsed.house_flat || parsed.houseFlat || ''}, ${parsed.street || ''}, ${parsed.city || ''}, ${parsed.state || ''} - ${parsed.pin_code || parsed.pinCode || ''}`,
            address_type: (parsed.address_type || parsed.addressType || 'HOME').toUpperCase()
          };
        }
      }
    } catch (_) {}
  }

  // Fallback to rjfc_saved_addresses
  try {
    const raw = localStorage.getItem('rjfc_saved_addresses');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        const def = list.find(a => a.is_default || a.isDefault) || list[0];
        return {
          id: def.id || null,
          name: def.full_name || def.fullName || def.name,
          phone: def.phone || '',
          house_flat: def.house_flat || def.houseFlat || '',
          street: def.street || '',
          city: def.city || '',
          state: def.state || '',
          pin_code: def.pin_code || def.pinCode || '',
          text: def.text || `${def.house_flat || def.houseFlat || ''}, ${def.street || ''}, ${def.city || ''}, ${def.state || ''} - ${def.pin_code || def.pinCode || ''}`,
          address_type: (def.address_type || def.addressType || 'HOME').toUpperCase()
        };
      }
    }
  } catch (_) {}

  return null;
}

// ─────────────────────────────────────────────────────────────
// Page Lifecycle & Initialization
// ─────────────────────────────────────────────────────────────

function startCheckout() {
  // 1. INSTANT FIRST PAINT: Synchronously hydrate address, items & price card from local storage (0ms)
  resolveDeliveryAddress();
  loadCheckoutCartSync();

  // 2. Resolve User Session synchronously from local storage
  let user = null;
  const localUser = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user') || localStorage.getItem('rj_user') || sessionStorage.getItem('rj_user');
  if (localUser) {
    try { user = JSON.parse(localUser); } catch (_) {}
  }
  checkoutUser = user || { name: 'Valued Client', email: 'guest@example.com', phone: '+91 9876543210' };

  // 3. Attach interactive UI listeners
  const notesInput = document.getElementById('order-delivery-notes');
  if (notesInput && !notesInput.__notesBound) {
    notesInput.addEventListener('input', () => {
      const counter = document.getElementById('delivery-notes-count');
      if (counter) counter.textContent = String(notesInput.value.length) + ' / 200';
    });
    notesInput.__notesBound = true;
  }

  // Payment radio card styling & animated toggle
  document.querySelectorAll('input[name="checkout_payment_method"]').forEach(radio => {
    if (radio.__radioBound) return;
    radio.addEventListener('change', () => syncPaymentBoxSelection(radio));
    radio.__radioBound = true;
  });
  const initiallyChecked = document.querySelector('input[name="checkout_payment_method"]:checked');
  if (initiallyChecked) syncPaymentBoxSelection(initiallyChecked);

  // Listen for storage cart updates
  window.addEventListener('storage', () => {
    loadCheckoutCartSync();
  });
  window.addEventListener('rjfc_cart_updated', () => {
    loadCheckoutCartSync();
  });

  // 4. Asynchronous gateway returns (PhonePe / Stripe) handled non-blocking
  handleAsyncGatewayCallbacks();
}

async function handleAsyncGatewayCallbacks() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const phonepeTxn = urlParams.get('phonepe_txn') || urlParams.get('merchantTransactionId');
    const phonepeOrderNumber = urlParams.get('order_number');

    if (phonepeTxn && phonepeOrderNumber) {
      const verified = await handlePhonePeCallback(phonepeOrderNumber, phonepeTxn);
      if (verified) return;
    }
    const stripeSessionId = urlParams.get('session_id');
    const stripeOrderNumber = urlParams.get('order_number');
    const stripeCancelled = urlParams.get('cancelled');

    if (stripeCancelled) {
      if (typeof showToast === 'function') {
        showToast('Stripe checkout was cancelled. You can review your bag and choose another payment method.', 'warning');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (stripeSessionId && stripeOrderNumber) {
      const verified = await handleStripeCallback(stripeSessionId, stripeOrderNumber);
      if (verified) return;
    }
  } catch (err) {
    console.warn('Gateway callback check notice:', err);
  }
}

// Immediate zero-delay trigger: if DOM is interactive/complete, run immediately; otherwise on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startCheckout);
} else {
  startCheckout();
}

async function initCheckoutPage() {
  startCheckout();
}

// ─────────────────────────────────────────────────────────────
// Resolve Delivery Address
// ─────────────────────────────────────────────────────────────
function resolveDeliveryAddress() {
  const container = document.getElementById('confirmed-address-content');
  activeAddressData = getUnifiedSelectedAddress();

  if (!container) return;

  if (!activeAddressData || !activeAddressData.name) {
    // Render clear fallback prompting card linking to Step 2
    container.innerHTML = `
      <div style="background: rgba(0,0,0,0.02); border: 1.5px dashed var(--deliv-card-border); border-radius: 12px; padding: 22px 18px; text-align: center;">
        <div style="font-size: 1.6rem; margin-bottom: 6px;">📍</div>
        <p style="font-size: 0.95rem; font-weight: 600; color: var(--deliv-text-primary); margin: 0 0 6px 0;">
          Please select or add a delivery address to complete your order
        </p>
        <p style="font-size: 0.82rem; color: var(--deliv-text-secondary); margin: 0 0 16px 0;">
          Your haute couture en route requires a verified recipient name, doorstep address, and contact number.
        </p>
        <a href="/delivery.html" style="display: inline-flex; align-items: center; gap: 8px; background: #111111; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
          <span>Select or Add Delivery Address →</span>
        </a>
      </div>
    `;
    return false;
  }

  // Render confirmed address card with clean editorial styling
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <strong style="font-size: 1.08rem; color: var(--deliv-text-primary); font-family: serif;">${escapeHtml(activeAddressData.name)}</strong>
        <span class="addr-tag default-tag" style="background: #0F382A; color: #ffffff; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
          ${escapeHtml(activeAddressData.address_type || 'HOME')}
        </span>
        <span style="color: var(--deliv-text-secondary); font-size: 0.9rem; font-weight: 600;">
          📞 ${escapeHtml(activeAddressData.phone)}
        </span>
      </div>
      <div style="color: var(--deliv-text-secondary); font-size: 0.92rem; line-height: 1.6;">
        ${escapeHtml(activeAddressData.text)}
      </div>
      <div style="margin-top: 6px; font-size: 0.8rem; font-weight: 600; color: #0F382A; display: flex; align-items: center; gap: 6px;">
        <span>🚚</span>
        <span>Arrives in 3–5 Business Days via Express Insured Courier</span>
      </div>
    </div>
  `;
  return true;
}

// ─────────────────────────────────────────────────────────────
// Cart & Order Items Summary (Step 3 Review)
// ─────────────────────────────────────────────────────────────
function loadCheckoutCartSync() {
  const container = document.getElementById('checkout-cart-items');
  const countEl = document.getElementById('checkout-items-count');

  // Direct zero-delay synchronous read from local storage
  const rawItems = getUnifiedLocalCart();

  // Normalize items
  currentCartItems = rawItems.map((item, idx) => {
    const price = Number(item.price) || 0;
    const origPrice = Number(item.original_price || item.originalPrice || price);
    return {
      id: item.id || item.product_id || `item_${idx + 1}`,
      name: item.name || item.title || 'Artisanal Ensemble',
      price: price,
      original_price: origPrice,
      quantity: Math.max(1, Number(item.quantity) || 1),
      size: item.size || item.selected_size || 'Free Size',
      color: item.color || item.selected_color || '',
      image: item.image || item.thumbnail || (Array.isArray(item.images) && item.images[0]) || '/images/placeholder.jpg'
    };
  });

  const itemCount = currentCartItems.reduce((s, i) => s + i.quantity, 0);

  // Update Header Item Count
  if (countEl) {
    countEl.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  }

  if (!container) return;

  // Empty Bag Handling
  if (currentCartItems.length === 0) {
    container.innerHTML = `
      <div style="padding: 28px 16px; text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🛍️</div>
        <p style="font-size: 0.95rem; font-weight: 600; color: var(--deliv-text-primary); margin: 0 0 6px 0;">
          Your bag is currently empty
        </p>
        <p style="font-size: 0.82rem; color: var(--deliv-text-secondary); margin: 0 0 16px 0;">
          Please select your couture pieces before proceeding to checkout.
        </p>
        <a href="/shop.html" style="display: inline-flex; align-items: center; gap: 8px; background: #111111; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none;">
          <span>Explore Couture Catalog →</span>
        </a>
      </div>
    `;

    renderPriceDetails();
    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }

  // Render Compact 3:4 Portrait Item Rows
  container.innerHTML = currentCartItems.map(item => `
    <div class="checkout-item-row" style="display: flex; gap: 14px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--deliv-card-border);">
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.name)}"
        class="checkout-item-thumb"
        style="width: 56px; height: 74px; aspect-ratio: 3/4; object-fit: cover; border-radius: 6px; background: #F7F4F0; flex-shrink: 0;"
        onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'"
      >
      <div style="flex: 1; min-width: 0;">
        <h4 class="checkout-item-title" style="font-size: 0.92rem; font-weight: 600; font-family: serif; color: var(--deliv-text-primary); margin: 0 0 4px 0; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(item.name)}
        </h4>
        <div class="checkout-item-meta" style="font-size: 0.8rem; color: var(--deliv-text-secondary); display: flex; gap: 10px; flex-wrap: wrap;">
          <span>Size: <strong>${escapeHtml(item.size)}</strong></span>
          ${item.color ? `<span>Color: <strong>${escapeHtml(item.color)}</strong></span>` : ''}
          <span>Qty: <strong>${item.quantity}</strong></span>
        </div>
      </div>
      <div class="checkout-item-price" style="font-weight: 700; font-family: monospace; font-size: 0.96rem; color: var(--deliv-text-primary); text-align: right; flex-shrink: 0;">
        ${formatPrice(item.price * item.quantity)}
      </div>
    </div>
  `).join('');

  const confirmBtn = document.getElementById('confirm-order-btn');
  if (confirmBtn) confirmBtn.disabled = false;

  renderPriceDetails();
}

async function loadCheckoutCart() {
  loadCheckoutCartSync();
}

function updateCheckoutButtonLabel(grandTotal) {
  const confirmBtnLabel = document.getElementById('confirm-order-btn-label');
  if (!confirmBtnLabel) return;
  const radio = document.querySelector('input[name="checkout_payment_method"]:checked');
  const method = radio ? radio.value : 'PhonePe';
  const totalTxt = formatPrice(grandTotal);
  if (method === 'Cash on Delivery') {
    confirmBtnLabel.textContent = `CONFIRM COD ORDER • ${totalTxt}`;
  } else {
    confirmBtnLabel.textContent = `PAY & COMPLETE ORDER • ${totalTxt}`;
  }
}

function syncPaymentBoxSelection(radio) {
  document.querySelectorAll('.payment-option-box').forEach(box => {
    box.classList.remove('selected');
    const detail = box.querySelector('.payment-extra-detail');
    if (detail) detail.style.display = 'none';
  });
  const selectedBox = radio ? radio.closest('.payment-option-box') : null;
  if (selectedBox) {
    selectedBox.classList.add('selected');
    const detail = selectedBox.querySelector('.payment-extra-detail');
    if (detail) detail.style.display = 'block';
  }
  updateCheckoutButtonLabel(currentCartTotal);
}

window.selectPaymentBox = function(box, event) {
  if (!box) return;
  if (event && event.target && (event.target.tagName === 'INPUT' && event.target.type !== 'radio' || event.target.tagName === 'BUTTON' || event.target.closest('button'))) {
    return;
  }
  const radio = box.querySelector('input[type="radio"][name="checkout_payment_method"]');
  if (radio) {
    radio.checked = true;
    syncPaymentBoxSelection(radio);
  }
};

// ─────────────────────────────────────────────────────────────
// Hydrate Sticky Price Details Card
// ─────────────────────────────────────────────────────────────
function renderPriceDetails() {
  const priceBody = document.getElementById('checkout-price-body');
  if (!priceBody) return;

  const items = currentCartItems || [];
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const itemsSubtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const itemsMRP = items.reduce((s, i) => s + (i.original_price * i.quantity), 0);
  const catalogSavings = Math.max(0, itemsMRP - itemsSubtotal);

  // Auto-apply promo discount
  let promoDiscount = 0;
  if (couponCodeApplied === 'GRANDRJ') {
    promoDiscount = Math.min(500, Math.round(itemsSubtotal * 0.15));
  } else if (couponCodeApplied === 'ROYAL10') {
    promoDiscount = Math.round(itemsSubtotal * 0.10);
  } else if (couponCodeApplied === 'WELCOME500' && itemsSubtotal >= 2999) {
    promoDiscount = 500;
  }

  appliedDiscount = promoDiscount;
  const shippingFee = (itemsSubtotal >= 999 || itemsSubtotal === 0) ? 0 : 99;
  const grandTotal = Math.max(0, itemsSubtotal - promoDiscount + shippingFee);
  currentCartTotal = grandTotal;

  // Hydrate Primary CTA Button
  updateCheckoutButtonLabel(grandTotal);

  if (items.length === 0) {
    priceBody.innerHTML = `
      <div style="padding: 16px 0; text-align: center; color: var(--deliv-text-secondary); font-size: 0.85rem;">
        No items in bag to calculate summary.
      </div>
    `;
    return;
  }

  priceBody.innerHTML = `
    <div class="fk-price-row" style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--deliv-text-secondary); margin-bottom: 10px;">
      <span>Bag Total (MRP) (${itemCount} ${itemCount === 1 ? 'item' : 'items'})</span>
      <span style="font-family: monospace; font-weight: 600;">${formatPrice(itemsMRP > itemsSubtotal ? itemsMRP : itemsSubtotal)}</span>
    </div>

    ${catalogSavings > 0 ? `
      <div class="fk-price-row savings" style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #047857; margin-bottom: 10px;">
        <span>Festive Catalog Discount</span>
        <span class="fk-discount-val" style="font-family: monospace; font-weight: 700;">− ${formatPrice(catalogSavings)}</span>
      </div>
    ` : ''}

    ${promoDiscount > 0 ? `
      <div class="fk-price-row savings" style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #B38B22; margin-bottom: 10px;">
        <span>Coupon Savings (${couponCodeApplied})</span>
        <span class="fk-discount-val" style="font-family: monospace; font-weight: 700;">− ${formatPrice(promoDiscount)}</span>
      </div>
    ` : ''}

    <div class="fk-price-row" style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--deliv-text-secondary); margin-bottom: 14px;">
      <span>Express Insured Shipping</span>
      <span style="font-family: monospace; font-weight: 600; color: ${shippingFee === 0 ? '#047857' : 'inherit'};">
        ${shippingFee === 0 ? '<span style="text-decoration: line-through; color: var(--deliv-text-muted); font-size: 0.8rem; margin-right: 4px;">₹99</span> COMPLIMENTARY' : formatPrice(shippingFee)}
      </span>
    </div>

    <div class="fk-price-total-row" style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: var(--deliv-text-primary); padding-top: 14px; border-top: 1.5px solid var(--deliv-card-border); margin-top: 10px;">
      <span>Total Amount Payable</span>
      <span class="total-highlight" style="font-family: monospace; color: #111111;">${formatPrice(grandTotal)}</span>
    </div>

    ${(catalogSavings + promoDiscount) > 0 ? `
      <div class="fk-savings-banner" style="margin-top: 14px; padding: 8px 12px; background: #ecfdf5; border: 1px solid rgba(167, 243, 208, 0.6); border-radius: 8px; font-size: 0.78rem; font-weight: 700; color: #065f46; text-align: center;">
        ✨ You are saving ${formatPrice(catalogSavings + promoDiscount)} on this royal couture order!
      </div>
    ` : ''}
  `;
}

// ─────────────────────────────────────────────────────────────
// Interactive Coupon Code System
// ─────────────────────────────────────────────────────────────
async function applyPromoCode(codeOverride) {
  const input = document.getElementById('coupon-input');
  const code = (codeOverride || input?.value || '').trim().toUpperCase();

  if (!code) {
    if (typeof showToast === 'function') showToast('Please enter a coupon code', 'warning');
    return;
  }

  const itemsSubtotal = currentCartItems.reduce((s, i) => s + (i.price * i.quantity), 0);

  try {
    const res = await fetch('/api/promotions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount: itemsSubtotal })
    });
    const data = await res.json();
    if (res.ok && data && data.success) {
      couponCodeApplied = data.code;
      if (input) input.value = data.code;
      try {
        sessionStorage.setItem('rjfc_cart_promo_code', data.code);
        localStorage.setItem('rjfc_cart_promo_code', data.code);
      } catch (_) {}
      if (typeof showToast === 'function') {
        showToast(data.message || `👑 Promo code "${data.code}" applied successfully!`, 'success');
      }
      triggerConfetti(35);
      renderPriceDetails();
    } else {
      if (typeof showToast === 'function') {
        showToast(data?.message || 'Invalid promo code or not eligible.', 'error');
      }
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('Could not validate coupon. Please check connection.', 'error');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Execute Place Order with Instant Validation & Confirmation
// ─────────────────────────────────────────────────────────────
async function persistOrderToFirestore(orderObj, overridePayStatus) {
  try {
    if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.auth) return false;
    const fbUser = firebase.auth().currentUser;
    if (!fbUser || !fbUser.uid) return false;

    const cleanItems = (Array.isArray(orderObj.items) ? orderObj.items : []).map(it => ({
      product_id: it.product_id || it.id || null,
      product_name: it.product_name || it.name || 'RJ Fashion Piece',
      product_image: it.product_image || it.image || '',
      size: it.size || 'Free Size',
      color: it.color || '',
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      total: (Number(it.price) || 0) * (Number(it.quantity) || 1)
    }));
    if (cleanItems.length === 0) return false;

    const docData = {
      order_number: String(orderObj.order_number),
      userId: fbUser.uid,
      customer_name: String(orderObj.customer_name || fbUser.displayName || 'Customer'),
      customer_email: String(orderObj.customer_email || fbUser.email || ''),
      customer_phone: String(orderObj.customer_phone || ''),
      delivery_address: String(orderObj.delivery_address || orderObj.shipping_address || ''),
      shipping_address: String(orderObj.shipping_address || orderObj.delivery_address || ''),
      items: cleanItems,
      total: Number(orderObj.total) || 0,
      payment_method: String(orderObj.payment_method || 'Cash on Delivery'),
      payment_sub_method: String(orderObj.payment_sub_method || ''),
      payment_status: overridePayStatus || 'Pending',
      status: String(orderObj.status || 'Pending'),
      coupon: String(orderObj.coupon || ''),
      notes: String(orderObj.notes || ''),
      created_at: orderObj.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await firebase.firestore().collection('orders').doc(docData.order_number).set(docData, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Order save notice:', err && err.message ? err.message : err);
    return false;
  }
}

async function executePlaceOrder() {
  if (!activeAddressData || !activeAddressData.name) {
    if (typeof showToast === 'function') {
      showToast('Please select or add a delivery address to complete your order', 'warning');
    }
    window.location.href = '/delivery.html';
    return;
  }

  if (!currentCartItems || currentCartItems.length === 0) {
    if (typeof showToast === 'function') {
      showToast('Your bag is currently empty. Please select your couture pieces before proceeding.', 'warning');
    }
    window.location.href = '/shop.html';
    return;
  }

  const btn = document.getElementById('confirm-order-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="spinner-inline" style="display: inline-block; width: 14px; height: 14px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 8px;"></span>
      <span>SECURING &amp; CONFIRMING ORDER...</span>
    `;
  }

  const paymentRadio = document.querySelector('input[name="checkout_payment_method"]:checked');
  const paymentMethod = paymentRadio ? paymentRadio.value : 'Cash on Delivery';
  const paymentSubMethod = paymentRadio ? (paymentRadio.getAttribute('data-sub') || '') : '';
  const notes = document.getElementById('order-delivery-notes')?.value.trim() || '';
  const customerUpiId = document.getElementById('customer-upi-id-input')?.value.trim() || '';
  const fbCurrentUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;

  const orderPayload = {
    addressId: activeAddressData.id || null,
    address_id: activeAddressData.id || null,
    userId: fbCurrentUser ? fbCurrentUser.uid : null,
    customer_name: activeAddressData.name,
    customer_email: (checkoutUser && checkoutUser.email) || (fbCurrentUser && fbCurrentUser.email) || 'customer@example.com',
    customer_phone: activeAddressData.phone,
    delivery_address: activeAddressData.text,
    shipping_address: activeAddressData.text,
    items: currentCartItems,
    total: currentCartTotal,
    paymentMethod: paymentMethod,
    payment_method: paymentMethod,
    payment_sub_method: paymentSubMethod,
    customer_upi_id: customerUpiId,
    coupon: couponCodeApplied,
    notes: notes,
    created_at: new Date().toISOString()
  };

  // PHONEPE & UPI DIRECT INTENT GATEWAY FLOW (Flipkart Style)
  if (paymentMethod === 'PhonePe' || paymentMethod === 'UPI') {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="spinner-inline" style="display: inline-block; width: 14px; height: 14px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 8px;"></span>
        <span>OPENING UPI APP LAUNCHER...</span>
      `;
    }

    const tempRefNumber = `RJFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    orderPayload.order_number = tempRefNumber;
    orderPayload.id = Date.now();
    orderPayload.payment_status = 'Pending';
    orderPayload.status = 'Pending';

    try {
      sessionStorage.setItem('rj_pending_order', JSON.stringify(orderPayload));
      localStorage.setItem('rj_pending_order', JSON.stringify(orderPayload));
      const existing = JSON.parse(localStorage.getItem('rj_orders') || '[]');
      if (!existing.some(o => o.order_number === tempRefNumber)) {
        existing.unshift(orderPayload);
        localStorage.setItem('rj_orders', JSON.stringify(existing));
      }
    } catch (_) {}

    await persistOrderToFirestore(orderPayload, 'Pending');

    if (typeof showToast === 'function') {
      showToast('Opening UPI app payment screen...', 'info');
    }

    const payUrl = `/payment.html?order_number=${encodeURIComponent(tempRefNumber)}&amount=${encodeURIComponent(currentCartTotal)}&name=${encodeURIComponent(activeAddressData.name)}&phone=${encodeURIComponent(activeAddressData.phone)}`;
    window.location.href = payUrl;
    return;
  }

  // STRIPE CHECKOUT FLOW (Strict: never mark unpaid card order complete if API is offline)
  if (paymentMethod === 'Stripe') {
    try {
      const res = await fetch('/api/payment/stripe/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          if (typeof showToast === 'function') showToast('Redirecting to Stripe secure checkout...', 'info');
          window.location.href = data.url;
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      if (typeof showToast === 'function') {
        showToast(errData.message || 'Online card gateway is currently unavailable. Please choose Cash on Delivery.', 'error');
      }
    } catch (_) {
      if (typeof showToast === 'function') {
        showToast('Unable to reach card payment server. Please choose Cash on Delivery.', 'error');
      }
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span id="confirm-order-btn-label">PAY &amp; COMPLETE ORDER • ${formatPrice(currentCartTotal)}</span><span style="font-size: 1.1rem; line-height: 1;">➔</span>`;
    }
    return;
  }

  // STANDARD / UPI / COD ORDER FLOW
  let placedOrderNumber = `RJFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && (data.orderNumber || data.orderId)) {
        placedOrderNumber = data.orderNumber || `RJFC-${data.orderId}`;
      }
    }
  } catch (_) {}

  // 1. Persist in local storage orders & Cloud Firestore
  orderPayload.order_number = placedOrderNumber;
  orderPayload.id = Date.now();
  orderPayload.payment_status = 'Pending';
  orderPayload.status = 'Confirmed';
  try {
    const existing = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    existing.unshift(orderPayload);
    localStorage.setItem('rj_orders', JSON.stringify(existing));
  } catch (_) {}

  await persistOrderToFirestore(orderPayload, 'Pending');

  // 2. Clear shopping cart across all unified storage keys
  clearUnifiedCart();

  // 3. Trigger Grand Celebration Confetti
  triggerConfetti(120);

  // 4. Update Success Modal and Display
  const modalNum = document.getElementById('modal-order-number');
  const modalTotal = document.getElementById('modal-order-total');
  if (modalNum) modalNum.textContent = placedOrderNumber;
  if (modalTotal) modalTotal.textContent = formatPrice(currentCartTotal);

  const modal = document.getElementById('order-success-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  } else {
    // Graceful redirect to account orders
    setTimeout(() => {
      window.location.href = `/account.html?tab=orders&placed=${placedOrderNumber}`;
    }, 1200);
  }

  if (typeof showToast === 'function') {
    showToast('Order confirmed successfully! 👑 Thank you for shopping with RJ Fashion Collection!', 'success');
  }
}

// ─────────────────────────────────────────────────────────────
// Confetti Particle System
// ─────────────────────────────────────────────────────────────
function triggerConfetti(count = 80) {
  const container = document.getElementById('confetti-canvas-wrap') || document.body;
  const colors = ['#C5A880', '#D4AF37', '#0F382A', '#111111', '#10b981', '#ffffff'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 6;
    const startX = Math.random() * 100;
    const animDuration = Math.random() * 2.5 + 1.8;
    const delay = Math.random() * 0.4;
    const rot = Math.random() * 360;

    p.style.cssText = `
      position: fixed;
      top: -20px;
      left: ${startX}vw;
      width: ${size}px;
      height: ${size * (Math.random() > 0.5 ? 1.6 : 1)}px;
      background: ${color};
      border-radius: ${Math.random() > 0.4 ? '2px' : '50%'};
      z-index: 99999;
      pointer-events: none;
      transform: rotate(${rot}deg);
      box-shadow: 0 0 6px ${color}88;
      animation: confettiFall ${animDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), (animDuration + delay) * 1000 + 500);
  }
}

// ─────────────────────────────────────────────────────────────
// Handle PhonePe Server-Verified Return Callback
// ─────────────────────────────────────────────────────────────
async function handlePhonePeCallback(orderNumber, merchantTxnId) {
  try {
    if (!orderNumber) return false;
    const res = await fetch(`/api/payment/phonepe/status/${encodeURIComponent(orderNumber)}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (typeof showToast === 'function') {
        showToast(errData.message || 'Payment verification pending or failed. Please retry.', 'warning');
      }
      return false;
    }
    const data = await res.json();
    if (data && data.verified && data.payment_status === 'Paid') {
      clearUnifiedCart();
      window.history.replaceState({}, document.title, window.location.pathname);
      triggerConfetti(140);
      const modal = document.getElementById('order-success-modal');
      const numEl = document.getElementById('modal-order-number');
      const totalEl = document.getElementById('modal-order-total');
      if (numEl) numEl.textContent = orderNumber;
      if (totalEl && currentCartTotal) totalEl.textContent = formatPrice(currentCartTotal);
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
      if (typeof showToast === 'function') {
        showToast('PhonePe payment verified! Your order is confirmed 👑', 'success');
      }
      return true;
    }
    if (data && data.payment_status === 'Pending') {
      window.location.href = `/payment.html?order_number=${encodeURIComponent(orderNumber)}&txn=${encodeURIComponent(merchantTxnId || '')}`;
      return true;
    }
  } catch (err) {
    console.warn('PhonePe callback check notice:', err);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// Handle Stripe Callback
// ─────────────────────────────────────────────────────────────
async function handleStripeCallback(sessionId, orderNumber) {
  try {
    const res = await fetch('/api/payment/stripe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, orderNumber })
    });
    const data = await res.json();
    if (data.success) {
      clearUnifiedCart();
      window.history.replaceState({}, document.title, window.location.pathname);
      triggerConfetti(140);
      const modal = document.getElementById('order-success-modal');
      const numEl = document.getElementById('modal-order-number');
      if (numEl) numEl.textContent = orderNumber;
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
      if (typeof showToast === 'function') {
        showToast('Stripe payment verified! Your order is confirmed 👑', 'success');
      }
      return true;
    }
  } catch (_) {}
  return false;
}

function toggleDeliveryInstructions() {
  const drawer = document.getElementById('delivery-instructions-drawer');
  const arrow = document.getElementById('delivery-instructions-arrow');
  if (drawer) {
    const isHidden = drawer.style.display === 'none' || !drawer.style.display;
    drawer.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.textContent = isHidden ? '▴' : '▾';
  }
}

function toggleGiftOption(el) {
  const msgBox = document.getElementById('gift-message-box');
  if (msgBox) {
    msgBox.style.display = el.checked ? 'block' : 'none';
  }
}

function saveGiftMessage(val) {
  sessionStorage.setItem('rj_gift_message', val);
}

// ─────────────────────────────────────────────────────────────
// Customer UPI ID Verification (Flipkart / Enterprise Style)
// ─────────────────────────────────────────────────────────────
window.validateCustomerUpiInput = function(el) {
  const val = (el.value || '').trim();
  const feedback = document.getElementById('customer-upi-feedback');
  if (!val && feedback) {
    feedback.style.display = 'none';
  }
};

window.verifyCustomerUpi = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  const input = document.getElementById('customer-upi-id-input');
  const feedback = document.getElementById('customer-upi-feedback');
  if (!input || !feedback) return;
  const val = input.value.trim();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

  if (!val) {
    feedback.style.display = 'block';
    feedback.style.color = '#dc2626';
    feedback.textContent = 'Please enter your UPI ID (e.g. 9876543210@paytm or name@okhdfcbank)';
    return;
  }

  if (upiRegex.test(val)) {
    feedback.style.display = 'block';
    feedback.style.color = '#059669';
    feedback.innerHTML = `✓ Valid UPI ID Format (<strong>${escapeHtml(val)}</strong>). Click Pay &amp; Complete Order to proceed.`;
    if (typeof showToast === 'function') {
      showToast('UPI ID format verified!', 'success');
    }
  } else {
    feedback.style.display = 'block';
    feedback.style.color = '#dc2626';
    feedback.textContent = 'Please enter a valid UPI format with @ handle (e.g. yourname@okhdfcbank)';
  }
};

window.executePlaceOrder = executePlaceOrder;
window.applyPromoCode = applyPromoCode;
window.toggleDeliveryInstructions = toggleDeliveryInstructions;
window.toggleGiftOption = toggleGiftOption;
window.saveGiftMessage = saveGiftMessage;
