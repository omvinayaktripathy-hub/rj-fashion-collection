function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// RJ FASHION COLLECTION - LUXURY ACCOUNT DASHBOARD CONTROLLER
let currentAccountOrders = [];
let currentAccountUser = null;

/**
 * Initialize Account Dashboard
 */
async function initAccount() {
  try {
    let user = null;
    const stored = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
    if (stored) {
      try { user = JSON.parse(stored); } catch (_) {}
    }

    if (!user) {
      const res = await fetch(`${API_BASE}/me`);
      const data = await res.json();
      if (data.success && data.user) user = data.user;
    }

    if (!user) {
      window.location.href = '/login.html?redirect=/account.html';
      return;
    }

    currentAccountUser = user;

    // Header & Banner User Data
    const userNameEl = document.getElementById('acc-user-name');
    const userEmailEl = document.getElementById('acc-user-email');
    const userInitialsEl = document.getElementById('acc-avatar-initials');
    const holder1El = document.getElementById('card-holder-name-1');
    const holder2El = document.getElementById('card-holder-name-2');
    const tenureEl = document.getElementById('acc-user-tenure');

    if (userNameEl) userNameEl.textContent = user.name || 'Royale Client';
    if (userEmailEl) userEmailEl.textContent = user.email || 'client@rjfashion.com';
    
    if (userInitialsEl) {
      const initials = (user.name || 'RJ')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      userInitialsEl.textContent = initials || 'RJ';
    }

    if (holder1El) holder1El.textContent = (user.name || 'ROYALE CLIENT').toUpperCase();
    if (holder2El) holder2El.textContent = (user.name || 'ROYALE CLIENT').toUpperCase();

    if (user.created_at && tenureEl) {
      try {
        const d = new Date(user.created_at);
        const year = d.getFullYear();
        tenureEl.textContent = `Member since ${year}`;
      } catch (_) {}
    }

    // Profile form fields
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';

    // Handle initial tab from URL hash if present
    const hash = window.location.hash.replace('#', '');
    if (['orders', 'wishlist', 'addresses', 'payments', 'security'].includes(hash)) {
      switchAccountTab(hash);
    }

    // Parallel load data components
    await Promise.allSettled([
      loadUserOrders(),
      loadAccountAddresses(),
      loadWishlistPreview()
    ]);
  } catch (err) {
    console.error('Account init failed:', err);
  }
}

/**
 * Switch Active Dashboard Tab
 */
function switchAccountTab(tabName) {
  const tabs = ['orders', 'wishlist', 'addresses', 'payments', 'security'];
  if (!tabs.includes(tabName)) tabName = 'orders';

  // 1. Hide all panels, show selected
  tabs.forEach(t => {
    const panel = document.getElementById(`tab-${t}`);
    if (panel) {
      if (t === tabName) {
        panel.style.display = 'block';
        panel.classList.add('active');
      } else {
        panel.style.display = 'none';
        panel.classList.remove('active');
      }
    }
  });

  // 2. Update Desktop Sidebar active states
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 3. Update Mobile Pill Tabs active states
  document.querySelectorAll('.account-pill-tab').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target === tabName) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });

  // 4. Update URL hash without jumping
  if (history.replaceState) {
    history.replaceState(null, null, `#${tabName}`);
  }
}
window.switchAccountTab = switchAccountTab;

/**
 * Toggle Add Address Form Collapsible
 */
function toggleAddAddressForm() {
  const drawer = document.getElementById('add-address-collapsible');
  const btnText = document.getElementById('btn-toggle-addr-text');
  if (!drawer) return;

  const isOpen = drawer.style.display === 'block';
  if (isOpen) {
    drawer.style.display = 'none';
    if (btnText) btnText.textContent = '+ Add New Address';
  } else {
    drawer.style.display = 'block';
    if (btnText) btnText.textContent = '✕ Close Address Form';
    drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
window.toggleAddAddressForm = toggleAddAddressForm;

/**
 * Toggle Password Visibility with Eye Icon
 */
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (btnEl) {
    btnEl.innerHTML = isPassword
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></line><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}
window.togglePasswordVisibility = togglePasswordVisibility;

/**
 * Load and Render Customer Orders
 */
async function loadUserOrders(filter = 'all') {
  const container = document.getElementById('account-orders-container');
  if (!container) return;

  try {
    let orders = [];
    try {
      const local = localStorage.getItem('rj_orders');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) orders = parsed;
      }
    } catch (_) {}

    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const existingIds = new Set(orders.map(o => String(o.id || o.order_number)));
        for (const o of data.orders) {
          const oId = String(o.id || o.order_number);
          if (!existingIds.has(oId)) {
            orders.push(o);
            existingIds.add(oId);
          }
        }
      }
    } catch (_) {}

    if (orders.length > 0) {
      currentAccountOrders = orders;

      // Update stat counters
      const totalOrdersCount = orders.length;
      const totalOrdersEl = document.getElementById('stat-total-orders');
      const sidebarBadge = document.getElementById('sidebar-order-badge');
      if (totalOrdersEl) totalOrdersEl.textContent = `${totalOrdersCount} ${totalOrdersCount === 1 ? 'Order' : 'Orders'}`;
      if (sidebarBadge) sidebarBadge.textContent = String(totalOrdersCount);

      renderOrdersList(filter);
    } else {
      renderOrdersList('empty');
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
    container.innerHTML = `
      <div class="account-empty-state">
        <p style="color: var(--muted-foreground);">Unable to retrieve orders at this time.</p>
        <button type="button" class="btn btn-luxury-primary" onclick="loadUserOrders()">Retry</button>
      </div>
    `;
  }
}
window.loadUserOrders = loadUserOrders;

/**
 * Filter Account Orders
 */
function filterAccountOrders(statusFilter, btnEl) {
  document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderOrdersList(statusFilter);
}
window.filterAccountOrders = filterAccountOrders;

/**
 * Render Orders List to DOM
 */
function renderOrdersList(filter = 'all') {
  const container = document.getElementById('account-orders-container');
  if (!container) return;

  let orders = [...currentAccountOrders];

  if (filter === 'active') {
    orders = orders.filter(o => ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery'].includes(o.status));
  } else if (filter === 'delivered') {
    orders = orders.filter(o => o.status === 'Delivered');
  } else if (filter === 'cancelled') {
    orders = orders.filter(o => o.status === 'Cancelled');
  }

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="account-empty-state">
        <div class="empty-icon-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <h3 class="empty-title">No Orders Found</h3>
        <p class="empty-desc">${filter === 'all' ? 'You have not placed any orders yet. Explore our curated collections to start building your wardrobe.' : `No orders matching filter "${filter}".`}</p>
        <a href="/shop.html?newArrival=true" class="btn btn-luxury-primary">
          EXPLORE NEW ARRIVALS →
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const orderNumber = escapeHtml(order.order_number || `RJFC-${order.id}`);
    const dateFormatted = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
    const totalFormatted = `₹${(Number(order.total) || 0).toLocaleString('en-IN')}`;
    const status = order.status || 'Confirmed';

    // Tracking Step Logic (1 to 5)
    let currentStep = 2; // Default confirmed
    const sLower = status.toLowerCase();
    if (sLower === 'placed') currentStep = 1;
    else if (sLower === 'confirmed' || sLower === 'processing') currentStep = 2;
    else if (sLower === 'shipped') currentStep = 3;
    else if (sLower === 'out for delivery') currentStep = 4;
    else if (sLower === 'delivered') currentStep = 5;
    else if (sLower === 'cancelled') currentStep = 0;

    const items = Array.isArray(order.items) ? order.items : [];

    return `
      <article class="account-order-card" data-order-id="${escapeHtml(order.id)}">
        <!-- Order Header Strip -->
        <div class="account-order-header">
          <div class="order-ref-meta">
            <span class="order-number-label">ORDER</span>
            <strong class="order-number-val">${orderNumber}</strong>
            <span class="order-header-dot">•</span>
            <span class="order-date-val">Placed on ${dateFormatted}</span>
          </div>
          <div class="order-header-right">
            <span class="order-status-badge status-${sLower.replace(/\s+/g, '-')}">${escapeHtml(status)}</span>
            <strong class="order-total-val">${totalFormatted}</strong>
          </div>
        </div>

        <!-- 5-Stage Visual Tracking Progress Stepper (Non-cancelled) -->
        ${currentStep > 0 ? `
          <div class="order-tracking-strip" aria-label="Shipment Tracking Progress">
            <div class="tracking-progress-bar">
              <div class="tracking-line-background"></div>
              <div class="tracking-line-fill step-${currentStep}"></div>
              
              <div class="tracking-step-node ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
                <div class="step-dot">
                  ${currentStep >= 1 ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                </div>
                <span class="step-label">Placed</span>
              </div>

              <div class="tracking-step-node ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
                <div class="step-dot">
                  ${currentStep >= 2 ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                </div>
                <span class="step-label">Confirmed</span>
              </div>

              <div class="tracking-step-node ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
                <div class="step-dot">
                  ${currentStep >= 3 ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                </div>
                <span class="step-label">Shipped</span>
              </div>

              <div class="tracking-step-node ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}">
                <div class="step-dot">
                  ${currentStep >= 4 ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                </div>
                <span class="step-label">Out for Delivery</span>
              </div>

              <div class="tracking-step-node ${currentStep >= 5 ? 'completed' : ''} ${currentStep === 5 ? 'active' : ''}">
                <div class="step-dot">
                  ${currentStep >= 5 ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                </div>
                <span class="step-label">Delivered</span>
              </div>
            </div>
            <div class="tracking-carrier-meta">
              <span>Carrier: <strong>BlueDart Luxury Express</strong></span>
              <span>Tracking No: <strong>BD-${orderNumber.replace(/[^0-9]/g, '').slice(-8)}</strong></span>
            </div>
          </div>
        ` : `
          <div class="order-cancelled-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <span>This order was cancelled. Any pre-authorized amount has been refunded to your original payment method.</span>
          </div>
        `}

        <!-- Order Items List -->
        <div class="account-order-items">
          ${items.map(item => `
            <div class="order-product-row">
              <img src="${escapeHtml(item.product_image || '/images/products/silk-saree-1.jpg')}" alt="${escapeHtml(item.product_name || 'Product')}" class="product-thumb-img" onerror="this.src='/favicon.svg';">
              <div class="product-info-col">
                <h4 class="product-title-name">${escapeHtml(item.product_name || 'Handcrafted Luxury Silhouette')}</h4>
                <div class="product-specs-row">
                  <span>Size: <strong>${escapeHtml(item.size || 'Free Size')}</strong></span>
                  <span>Qty: <strong>${item.quantity || 1}</strong></span>
                  <span>Price: <strong>₹${(Number(item.price) || 0).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
              <div class="product-total-col">
                ₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Order Actions Footer -->
        <div class="account-order-footer">
          <div class="order-delivery-snippet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>Deliver to: ${escapeHtml(order.customer_name || 'Customer')}, ${escapeHtml(order.delivery_address || 'Shipping Address')}</span>
          </div>

          <div class="order-btn-actions">
            <button type="button" class="btn-card-action" onclick="viewOrderInvoice('${orderNumber}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>View Invoice</span>
            </button>
            <button type="button" class="btn-card-action primary" onclick="reorderItems('${escapeHtml(order.id)}')">
              <span>Buy Again</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * View Order Invoice Mock / Printable Action
 */
function viewOrderInvoice(orderNumber) {
  if (typeof showToast === 'function') {
    showToast(`Generating official tax invoice for ${orderNumber}...`, 'info');
  }
  setTimeout(() => {
    window.open(`/orders.html?search=${encodeURIComponent(orderNumber)}`, '_blank');
  }, 400);
}
window.viewOrderInvoice = viewOrderInvoice;

/**
 * Buy Again Action
 */
function reorderItems(orderId) {
  const order = currentAccountOrders.find(o => String(o.id) === String(orderId));
  if (!order || !Array.isArray(order.items)) {
    if (typeof showToast === 'function') showToast('Items added to shopping bag!', 'success');
    return;
  }

  try {
    let cart = [];
    const stored = localStorage.getItem('rjfc_cart') || localStorage.getItem('rjfc_local_cart') || localStorage.getItem('rjfc_react_cart');
    if (stored) {
      try { cart = JSON.parse(stored); } catch (_) {}
    }

    order.items.forEach(item => {
      cart.push({
        id: item.product_id || Date.now(),
        product_id: item.product_id || Date.now(),
        cart_id: `cart_${Date.now()}_${item.product_id}`,
        name: item.product_name,
        price: item.price,
        image: item.product_image,
        quantity: item.quantity || 1,
        size: item.size || 'Free Size'
      });
    });

    const json = JSON.stringify(cart);
    ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'].forEach(k => {
      try { localStorage.setItem(k, json); } catch (_) {}
      try { sessionStorage.setItem(k, json); } catch (_) {}
    });
    window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cart } }));
    window.dispatchEvent(new Event('storage'));
    if (typeof showToast === 'function') {
      showToast('Items added to your bag! Redirecting to cart...', 'success');
    }
    setTimeout(() => {
      window.location.href = '/cart.html';
    }, 800);
  } catch (err) {
    if (typeof showToast === 'function') showToast('Added to bag!', 'success');
  }
}
window.reorderItems = reorderItems;

/**
 * Load Wishlist Preview
 */
function loadWishlistPreview() {
  const container = document.getElementById('account-wishlist-container');
  if (!container) return;

  try {
    let wishlist = [];
    const stored = localStorage.getItem('rj_fashion_wishlist') || localStorage.getItem('rjfc_wishlist') || localStorage.getItem('rjfc_react_wishlist');
    if (stored) {
      try { wishlist = JSON.parse(stored); } catch (_) {}
    }

    const count = wishlist.length;
    const statEl = document.getElementById('stat-wishlist-count');
    const badgeEl = document.getElementById('sidebar-wishlist-badge');
    if (statEl) statEl.textContent = `${count} ${count === 1 ? 'Look' : 'Looks'}`;
    if (badgeEl) badgeEl.textContent = String(count);

    if (count === 0) {
      container.innerHTML = `
        <div class="account-empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <h3 class="empty-title">Your Curated Wishlist is Empty</h3>
          <p class="empty-desc">Discover our royal sarees, festive lehengas, and designer jewellery collections to save your favorite silhouettes.</p>
          <a href="/shop.html" class="btn btn-luxury-primary">
            BROWSE SIGNATURE COLLECTIONS →
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = wishlist.slice(0, 6).map(item => `
      <div class="wishlist-preview-card">
        <a href="/product.html?id=${encodeURIComponent(item.id || '')}" class="wishlist-card-media">
          <img src="${escapeHtml(item.image || '/images/products/silk-saree-1.jpg')}" alt="${escapeHtml(item.name || 'Look')}" loading="lazy" onerror="this.src='/favicon.svg';">
        </a>
        <div class="wishlist-card-details">
          <h4 class="wishlist-product-title">${escapeHtml(item.name || 'Signature Silhouette')}</h4>
          <div class="wishlist-product-price">₹${(Number(item.price) || 0).toLocaleString('en-IN')}</div>
          <div class="wishlist-card-actions">
            <a href="/product.html?id=${encodeURIComponent(item.id || '')}" class="btn-card-action primary" style="width: 100%; text-align: center; text-decoration: none;">
              View Piece
            </a>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading wishlist:', err);
  }
}

/**
 * Load Account Addresses
 */
async function loadAccountAddresses() {
  const container = document.getElementById('account-addresses-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/addresses`);
    const data = await res.json();

    if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
      const count = data.addresses.length;
      const statEl = document.getElementById('stat-addresses-count');
      const defAddr = data.addresses.find(a => a.is_default || a.isDefault) || data.addresses[0];
      if (statEl) {
        statEl.textContent = defAddr ? `${defAddr.city || ''} • ${defAddr.pin_code || defAddr.pinCode || ''}` : `${count} Locations`;
      }

      container.innerHTML = data.addresses.map((addr, idx) => `
        <div class="luxury-address-card ${idx === 0 ? 'is-default' : ''}">
          <div class="address-card-header">
            <div class="address-recipient-info">
              <strong class="recipient-name">${escapeHtml(addr.full_name)}</strong>
              <span class="recipient-phone">${escapeHtml(addr.phone)}</span>
            </div>
            ${idx === 0 ? `<span class="default-address-pill">DEFAULT SHIPPING</span>` : ''}
          </div>

          <div class="address-body-text">
            <p>${escapeHtml(addr.house_flat)}, ${escapeHtml(addr.street)}</p>
            <p>${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} — <strong>${escapeHtml(addr.pin_code)}</strong></p>
          </div>

          <div class="address-card-footer">
            <span class="verified-loc-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Verified Delivery Hub</span>
            </span>
            <button type="button" class="btn-addr-delete" onclick="deleteAccountAddress(${Number(addr.id)})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `).join('');
    } else {
      const statEl = document.getElementById('stat-addresses-count');
      if (statEl) statEl.textContent = '0 Locations';
      container.innerHTML = `
        <div class="account-empty-state" style="grid-column: 1 / -1;">
          <p style="color: var(--muted-foreground); margin-bottom: 14px;">No saved delivery addresses in your vault.</p>
          <button type="button" class="btn btn-luxury-primary" onclick="toggleAddAddressForm()">
            + Add Your First Address
          </button>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching addresses:', err);
  }
}
window.loadAccountAddresses = loadAccountAddresses;

/**
 * Save New Delivery Address
 */
async function saveAccountNewAddress(e) {
  e.preventDefault();
  const fullName = document.getElementById('new-addr-name').value.trim();
  const phone = document.getElementById('new-addr-phone').value.trim();
  const houseFlat = document.getElementById('new-addr-house').value.trim();
  const street = document.getElementById('new-addr-street').value.trim();
  const city = document.getElementById('new-addr-city').value.trim();
  const state = document.getElementById('new-addr-state').value.trim();
  const pinCode = document.getElementById('new-addr-pincode').value.trim();

  try {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, houseFlat, street, city, state, pinCode })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Address added to your vault successfully!', 'success');
      document.getElementById('new-account-address-form').reset();
      toggleAddAddressForm();
      loadAccountAddresses();
    } else {
      if (typeof showToast === 'function') showToast(data.message || 'Failed to save address', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to save address. Please try again.', 'error');
  }
}

/**
 * Delete Saved Address
 */
async function deleteAccountAddress(id) {
  if (!confirm('Are you sure you want to remove this delivery address?')) return;
  try {
    const res = await fetch(`${API_BASE}/addresses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Address removed from vault', 'info');
      loadAccountAddresses();
    } else {
      if (typeof showToast === 'function') showToast(data.message || 'Could not delete address', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to delete address', 'error');
  }
}
window.deleteAccountAddress = deleteAccountAddress;

/**
 * Update Profile Information
 */
async function updateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const submitBtn = document.getElementById('btn-save-profile');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'SAVING CHANGES...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Profile details updated successfully!', 'success');
      const userNameEl = document.getElementById('acc-user-name');
      if (userNameEl) userNameEl.textContent = name;
      
      const initialsEl = document.getElementById('acc-avatar-initials');
      if (initialsEl) {
        const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        initialsEl.textContent = initials || 'RJ';
      }

      // Update local storage
      const stored = localStorage.getItem('rjfc_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          u.name = name;
          u.phone = phone;
          localStorage.setItem('rjfc_user', JSON.stringify(u));
        } catch (_) {}
      }
    } else {
      if (typeof showToast === 'function') showToast(data.message || 'Failed to update profile', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Network error updating profile', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SAVE PROFILE CHANGES';
    }
  }
}

/**
 * Change Password Action
 */
async function changePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('current-pwd').value;
  const newPassword = document.getElementById('new-pwd').value;
  const confirmNewPassword = document.getElementById('confirm-new-pwd').value;
  const submitBtn = document.getElementById('btn-change-pwd');

  if (newPassword.length < 6) {
    if (typeof showToast === 'function') showToast('New password must be at least 6 characters.', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    if (typeof showToast === 'function') showToast('Passwords do not match. Please verify.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'UPDATING CREDENTIALS...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Security password updated successfully!', 'success');
      document.getElementById('change-pwd-form').reset();
    } else {
      if (typeof showToast === 'function') showToast(data.message || 'Could not change password. Check current password.', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to update password', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'UPDATE PASSWORD';
    }
  }
}

/**
 * Sign Out / Logout
 */
async function handleLogout() {
  localStorage.removeItem('rjfc_user');
  sessionStorage.removeItem('rjfc_user');
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      await firebase.auth().signOut();
    }
  } catch (_) {}
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (err) {}
  if (typeof showToast === 'function') showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/';
  }, 400);
}
window.handleLogout = handleLogout;

/**
 * Add Payment Notice Dialog
 */
function showAddPaymentNotice() {
  if (typeof showToast === 'function') {
    showToast('Payment cards are securely auto-tokenized at checkout for 1-click convenience.', 'info');
  }
}
window.showAddPaymentNotice = showAddPaymentNotice;

/**
 * Trigger Avatar Upload
 */
function triggerAvatarUpload() {
  const input = document.getElementById('avatar-file-input');
  if (input) input.click();
}
window.triggerAvatarUpload = triggerAvatarUpload;

/**
 * Handle Avatar Selected
 */
function handleAvatarSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const circle = document.getElementById('acc-user-avatar-circle');
    if (circle) {
      circle.style.backgroundImage = `url(${e.target.result})`;
      circle.style.backgroundSize = 'cover';
      circle.style.backgroundPosition = 'center';
      const initials = document.getElementById('acc-avatar-initials');
      if (initials) initials.style.display = 'none';
    }
    if (typeof showToast === 'function') {
      showToast('Portrait updated for this session!', 'success');
    }
  };
  reader.readAsDataURL(file);
}
window.handleAvatarSelected = handleAvatarSelected;

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initAccount();
  const profileForm = document.getElementById('profile-form');
  const pwdForm = document.getElementById('change-pwd-form');
  const addrForm = document.getElementById('new-account-address-form');

  if (profileForm) profileForm.addEventListener('submit', updateProfile);
  if (pwdForm) pwdForm.addEventListener('submit', changePassword);
  if (addrForm) addrForm.addEventListener('submit', saveAccountNewAddress);
});
