// RJ FASHION COLLECTION - DEDICATED ORDER REVIEW & PAYMENT CONTROLLER (STEP 3)

let activeAddressData = null;
let currentCartItems = [];
let currentCartTotal = 0;
let appliedDiscount = 0;
let couponCodeApplied = null;
let countdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
  initDispatchCountdown();

  // Payment radio card styling & animated toggle
  document.querySelectorAll('input[name="checkout_payment_method"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option-box').forEach(box => {
        box.classList.remove('selected');
        const detail = box.querySelector('.payment-extra-detail');
        if (detail) detail.style.display = 'none';
      });
      const selectedBox = radio.closest('.payment-option-box');
      if (selectedBox) {
        selectedBox.classList.add('selected');
        const detail = selectedBox.querySelector('.payment-extra-detail');
        if (detail) detail.style.display = 'block';
      }
    });
  });
});

async function initCheckoutPage() {
  try {
    // 1. Check Authentication - If not logged in, redirect to login page
    let user = null;
    try {
      const authRes = await fetch(`${API_BASE}/me`);
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.success && authData.user) user = authData.user;
      }
    } catch (_) {}

    if (!user) {
      const localUser = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
      if (localUser) {
        try { user = JSON.parse(localUser); } catch (_) {}
      }
    }

    if (!user) {
      window.location.href = '/login.html?redirect=/checkout.html';
      return;
    }

    currentUser = user;

    // 2. Resolve Delivery Address - If no address selected, redirect to dedicated delivery.html
    const addressOk = resolveDeliveryAddress();
    if (!addressOk) return;

    // 3. Load Cart & Price Details
    await loadCheckoutCart();
  } catch (err) {
    console.error('Checkout initialization error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Live Dispatch Countdown Timer
// ─────────────────────────────────────────────────────────────
function initDispatchCountdown() {
  const timerEl = document.getElementById('dispatch-countdown-timer');
  if (!timerEl) return;

  // Set target to end of dispatch window (e.g. 2 hours 45 mins from session)
  let targetTime = sessionStorage.getItem('rjfc_dispatch_deadline');
  if (!targetTime) {
    targetTime = Date.now() + (2 * 60 * 60 * 1000) + (38 * 60 * 1000) + (45 * 1000);
    sessionStorage.setItem('rjfc_dispatch_deadline', targetTime);
  } else {
    targetTime = Number(targetTime);
  }

  function updateTimer() {
    const diff = Math.max(0, targetTime - Date.now());
    const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
    timerEl.textContent = `${h}h : ${m}m : ${s}s`;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      timerEl.textContent = 'Guaranteed Tomorrow';
    }
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

// ─────────────────────────────────────────────────────────────
// Resolve Delivery Address
// ─────────────────────────────────────────────────────────────
function resolveDeliveryAddress() {
  const storedSummary = sessionStorage.getItem('checkout_address_summary') || localStorage.getItem('rjfc_selected_address');

  if (storedSummary) {
    try {
      activeAddressData = JSON.parse(storedSummary);
    } catch (e) {
      console.warn('Could not parse stored address:', e);
    }
  }

  // Fallback to first saved address if any
  if (!activeAddressData || !activeAddressData.name) {
    try {
      const addrs = JSON.parse(localStorage.getItem('rjfc_saved_addresses') || '[]');
      if (addrs.length > 0) {
        const def = addrs.find(a => a.is_default) || addrs[0];
        activeAddressData = {
          id: def.id,
          name: def.full_name,
          phone: def.phone,
          text: `${def.house_flat || ''}, ${def.street || ''}, ${def.city || ''}, ${def.state || ''} - ${def.pin_code || ''}`,
          address_type: def.address_type || 'Home'
        };
      }
    } catch (_) {}
  }

  // If still no delivery address found, send customer to dedicated /delivery.html page
  if (!activeAddressData || !activeAddressData.name) {
    window.location.href = '/delivery.html';
    return false;
  }

  // Render confirmed address card
  const container = document.getElementById('confirmed-address-content');
  if (container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <strong style="font-size: 1.08rem; color: var(--deliv-text-primary);">${activeAddressData.name}</strong>
          <span class="addr-tag default-tag">
            ${(activeAddressData.address_type || 'HOME').toUpperCase()}
          </span>
          <span style="color: var(--deliv-text-secondary); font-size: 0.9rem; font-weight: 600;">
            📞 ${activeAddressData.phone}
          </span>
        </div>
        <div style="color: var(--deliv-text-secondary); font-size: 0.95rem; line-height: 1.6;">
          ${activeAddressData.text || `${activeAddressData.house_flat || ''}, ${activeAddressData.street || ''}, ${activeAddressData.city || ''}, ${activeAddressData.state || ''} - ${activeAddressData.pin_code || ''}`}
        </div>
      </div>
    `;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Cart & Order Items Summary
// ─────────────────────────────────────────────────────────────
async function loadCheckoutCart() {
  const container = document.getElementById('checkout-cart-items');
  const countEl = document.getElementById('checkout-items-count');

  let cart = null;
  try {
    const res = await fetch(`${API_BASE}/cart`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.items && data.items.length > 0) {
        cart = data;
      }
    }
  } catch (_) {}

  if (!cart) {
    try {
      const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
      if (local.length > 0) {
        const count = local.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
        const subtotal = local.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
        const origSubtotal = local.reduce((s, i) => s + ((Number(i.original_price) || Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
        const savings = Math.max(0, origSubtotal - subtotal);
        cart = {
          items: local,
          itemCount: count,
          subtotal: subtotal,
          originalSubtotal: origSubtotal,
          total: subtotal,
          discount: savings
        };
      }
    } catch (_) {}
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    alert('Your shopping bag is empty. Please add items to checkout.');
    window.location.href = '/shop.html';
    return;
  }

  currentCartItems = cart.items;
  if (countEl) countEl.textContent = cart.itemCount || cart.items.length;

  if (container) {
    container.innerHTML = cart.items.map(item => `
      <div class="checkout-item-row">
        <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" class="checkout-item-thumb">
        <div style="flex: 1; min-width: 0;">
          <h4 class="checkout-item-title">${item.name}</h4>
          <div class="checkout-item-meta">
            <span>Size: <strong>${item.size || 'Free Size'}</strong></span>
            <span>Qty: <strong>${item.quantity || 1}</strong></span>
          </div>
        </div>
        <div class="checkout-item-price">
          ${formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}
        </div>
      </div>
    `).join('');
  }

  renderPriceDetails(cart);
}

function renderPriceDetails(cart) {
  const priceBody = document.getElementById('checkout-price-body');
  if (!priceBody) return;

  const items = currentCartItems || [];
  const itemCount = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const itemsTotal = items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  const origTotal = items.reduce((s, i) => s + ((Number(i.original_price) || Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  const baseDiscount = Math.max(0, origTotal - itemsTotal);

  const totalDiscount = baseDiscount + appliedDiscount;
  const finalTotal = Math.max(0, itemsTotal - appliedDiscount);
  currentCartTotal = finalTotal;

  priceBody.innerHTML = `
    <div class="fk-price-row">
      <span>Price (${itemCount} item${itemCount > 1 ? 's' : ''})</span>
      <span>${formatPrice(origTotal > itemsTotal ? origTotal : itemsTotal)}</span>
    </div>
    ${baseDiscount > 0 ? `
      <div class="fk-price-row savings">
        <span>Special Festive Discount</span>
        <span class="fk-discount-val">− ${formatPrice(baseDiscount)}</span>
      </div>
    ` : ''}
    ${appliedDiscount > 0 ? `
      <div class="fk-price-row savings" style="color: #c59b27;">
        <span>Promo Coupon (${couponCodeApplied})</span>
        <span class="fk-discount-val" style="color: #c59b27;">− ${formatPrice(appliedDiscount)}</span>
      </div>
    ` : ''}
    <div class="fk-price-row">
      <span>Express Pan-India Delivery</span>
      <span class="fk-free-val"><span style="text-decoration: line-through; color: var(--deliv-text-muted); font-size: 0.85rem; margin-right: 4px;">₹49</span> FREE</span>
    </div>
    <div class="fk-price-total-row">
      <span>Total Amount Payable</span>
      <span class="total-highlight">${formatPrice(finalTotal)}</span>
    </div>
    ${totalDiscount > 0 ? `
      <div class="fk-savings-banner">
        ✨ You will save ${formatPrice(totalDiscount)} on this royal ethnic order!
      </div>
    ` : ''}
  `;
}

// ─────────────────────────────────────────────────────────────
// Interactive Coupon Code System
// ─────────────────────────────────────────────────────────────
function applyPromoCode(codeOverride) {
  const input = document.getElementById('coupon-input');
  const code = (codeOverride || input?.value || '').trim().toUpperCase();

  if (!code) {
    showToast('Please enter a coupon code', 'warning');
    return;
  }

  if (couponCodeApplied === code) {
    showToast(`Coupon ${code} is already applied!`, 'info');
    return;
  }

  const itemsTotal = currentCartItems.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

  if (code === 'ROYAL10' || code === 'FESTIVE10' || code === 'RJFESTIVE') {
    appliedDiscount = Math.round(itemsTotal * 0.10); // 10% instant extra discount
    couponCodeApplied = code;
    if (input) input.value = code;
    showToast(`👑 Promo code "${code}" applied! You saved ${formatPrice(appliedDiscount)} extra!`, 'success');
    triggerConfetti(30);
    renderPriceDetails();
  } else if (code === 'WELCOME500' && itemsTotal >= 2999) {
    appliedDiscount = 500;
    couponCodeApplied = code;
    if (input) input.value = code;
    showToast(`🎉 Promo code "${code}" applied! You saved ₹500 extra!`, 'success');
    triggerConfetti(30);
    renderPriceDetails();
  } else {
    showToast('Invalid coupon code or minimum order amount not met', 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// Execute Place Order with Celebration
// ─────────────────────────────────────────────────────────────
async function executePlaceOrder() {
  if (!activeAddressData) {
    showToast('Please confirm your delivery address first', 'error');
    window.location.href = '/delivery.html';
    return;
  }

  if (!currentCartItems || currentCartItems.length === 0) {
    showToast('Your shopping bag is empty', 'error');
    window.location.href = '/shop.html';
    return;
  }

  const btn = document.getElementById('confirm-order-btn');
  btn.disabled = true;
  btn.innerHTML = `
    <span class="spinner-inline"></span>
    <span>SECURING & CONFIRMING ORDER...</span>
  `;

  const paymentMethod = document.querySelector('input[name="checkout_payment_method"]:checked')?.value || 'Cash on Delivery';
  const notes = document.getElementById('order-delivery-notes')?.value.trim() || '';

  const orderPayload = {
    customer_name: activeAddressData.name || currentUser.name || 'Valued Customer',
    customer_email: currentUser.email || 'customer@example.com',
    customer_phone: activeAddressData.phone || currentUser.phone || '',
    shipping_address: activeAddressData.text || `${activeAddressData.house_flat || ''}, ${activeAddressData.street || ''}, ${activeAddressData.city || ''}, ${activeAddressData.state || ''} - ${activeAddressData.pin_code || ''}`,
    items: currentCartItems,
    total: currentCartTotal,
    payment_method: paymentMethod,
    coupon: couponCodeApplied,
    notes: notes,
    status: 'Confirmed',
    created_at: new Date().toISOString()
  };

  let placedOrderNumber = `RJFC-${Date.now().toString().slice(-6)}`;

  // 1. Try server API
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.orderNumber) {
        placedOrderNumber = data.orderNumber;
      }
    }
  } catch (_) {}

  // 2. Persist order in local storage
  const existingOrders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
  orderPayload.order_number = placedOrderNumber;
  orderPayload.id = Date.now();
  existingOrders.unshift(orderPayload);
  localStorage.setItem('rj_orders', JSON.stringify(existingOrders));

  // 3. Clear shopping cart
  localStorage.removeItem('rjfc_local_cart');
  try {
    await fetch(`${API_BASE}/cart/clear`, { method: 'POST' });
  } catch (_) {}

  // Update navbar cart badge
  if (typeof updateCartCount === 'function') updateCartCount();

  // 4. Trigger Grand Celebration Confetti
  triggerConfetti(120);

  // 5. Show Success Modal with Animation
  document.getElementById('modal-order-number').textContent = placedOrderNumber;
  document.getElementById('modal-order-total').textContent = formatPrice(currentCartTotal);
  
  const modal = document.getElementById('order-success-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }

  showToast('Order placed successfully! 👑 Thank you for shopping!', 'success');
}

// ─────────────────────────────────────────────────────────────
// Grand Confetti Particle System
// ─────────────────────────────────────────────────────────────
function triggerConfetti(count = 80) {
  const container = document.getElementById('confetti-canvas-wrap') || document.body;
  const colors = ['#c59b27', '#e2be67', '#700037', '#910047', '#10b981', '#3b82f6', '#f59e0b', '#ffffff'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 9 + 6;
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
