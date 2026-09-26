// RJ FASHION COLLECTION - DEDICATED ORDER REVIEW & PAYMENT CONTROLLER (STEP 3)

let activeAddressData = null;
let currentCartItems = [];
let currentCartTotal = 0;

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();

  // Payment radio card styling
  document.querySelectorAll('input[name="checkout_payment_method"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option-box').forEach(box => box.classList.remove('selected'));
      radio.closest('.payment-option-box')?.classList.add('selected');
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

  // If no delivery address found, send customer to dedicated /delivery.html page
  if (!activeAddressData || !activeAddressData.name) {
    window.location.href = '/delivery.html';
    return false;
  }

  // Render confirmed address card
  const container = document.getElementById('confirmed-address-content');
  if (container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <strong style="font-size: 1.05rem; color: #1e293b;">${activeAddressData.name}</strong>
          <span style="font-size: 0.75rem; background: #ecfdf5; color: #047857; font-weight: 700; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">
            ${activeAddressData.address_type || 'HOME'}
          </span>
          <span style="color: #64748b; font-size: 0.88rem; font-weight: 600;">
            📞 ${activeAddressData.phone}
          </span>
        </div>
        <div style="color: #475569; font-size: 0.92rem; line-height: 1.5; margin-top: 4px;">
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
  const priceBody = document.getElementById('checkout-price-body');

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
        const count = local.reduce((s, i) => s + (i.quantity || 1), 0);
        const subtotal = local.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
        cart = {
          items: local,
          itemCount: count,
          subtotal: subtotal,
          total: subtotal,
          discount: Math.round(subtotal * 0.1)
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
  const itemsTotal = cart.subtotal || cart.total || 0;
  const discount = cart.discount || Math.round(itemsTotal * 0.08);
  const finalTotal = Math.max(0, itemsTotal - discount);
  currentCartTotal = finalTotal;

  if (countEl) countEl.textContent = cart.itemCount || cart.items.length;

  if (container) {
    container.innerHTML = cart.items.map(item => `
      <div style="display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; align-items: center;">
        <img src="${item.image}" alt="${item.name}" style="width: 54px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 4px; font-size: 0.95rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.name}
          </h4>
          <div style="font-size: 0.8rem; color: #64748b;">
            Size: <strong style="color: #1e293b;">${item.size || 'Free Size'}</strong> • Qty: <strong>${item.quantity || 1}</strong>
          </div>
        </div>
        <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; text-align: right;">
          ${formatPrice((item.price || 0) * (item.quantity || 1))}
        </div>
      </div>
    `).join('');
  }

  if (priceBody) {
    priceBody.innerHTML = `
      <div class="fk-price-row">
        <span>Price (${cart.itemCount || cart.items.length} items)</span>
        <span>${formatPrice(itemsTotal)}</span>
      </div>
      <div class="fk-price-row">
        <span>Special Festive Discount</span>
        <span class="fk-discount-val">− ${formatPrice(discount)}</span>
      </div>
      <div class="fk-price-row">
        <span>Express Delivery</span>
        <span class="fk-free-val">FREE</span>
      </div>
      <div class="fk-price-total-row">
        <span>Total Amount Payable</span>
        <span>${formatPrice(finalTotal)}</span>
      </div>
      <div class="fk-savings-banner">
        ✨ You will save ${formatPrice(discount)} on this royal ethnic order!
      </div>
    `;
  }
}

// ─────────────────────────────────────────────────────────────
// Execute Place Order
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
  btn.innerHTML = '<span>Processing Order...</span>';

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
  updateCartCount();

  // 4. Show Success Modal
  document.getElementById('modal-order-number').textContent = placedOrderNumber;
  document.getElementById('modal-order-total').textContent = formatPrice(currentCartTotal);
  document.getElementById('order-success-modal').classList.add('active');

  showToast('Order placed successfully! 👑', 'success');
}
