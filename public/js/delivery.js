// RJ FASHION COLLECTION - DEDICATED LUXURY DELIVERY ADDRESS CONTROLLER (STEP 2)

let savedAddresses = [];
let selectedAddressId = null;
let currentCartData = null;
let editingAddressId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDeliveryPage();
});

async function initDeliveryPage() {
  try {
    // 1. Check Authentication - If not logged in, redirect to dedicated login page
    let user = null;
    try {
      const authRes = await fetch(`${API_BASE}/me`);
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.success && authData.user) {
          user = authData.user;
        }
      }
    } catch (_) {}

    if (!user) {
      const localUser = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
      if (localUser) {
        try { user = JSON.parse(localUser); } catch (_) {}
      }
    }

    if (!user) {
      window.location.href = '/login.html?redirect=/delivery.html';
      return;
    }

    currentUser = user;

    // Display user in status chip
    const nameEl = document.getElementById('deliv-user-name');
    const emailEl = document.getElementById('deliv-user-email');
    if (nameEl) nameEl.textContent = currentUser.name || 'Valued Customer';
    if (emailEl) emailEl.textContent = `(${currentUser.email || currentUser.phone || ''})`;

    // 2. Load Cart & Price Details + Order Items Preview
    await loadDeliveryCartSummary();

    // 3. Load Saved Delivery Addresses
    await loadDeliveryAddresses();
  } catch (err) {
    console.error('Delivery initialization error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Cart & Price Summary + Order Items Preview
// ─────────────────────────────────────────────────────────────
async function loadDeliveryCartSummary() {
  const priceBody = document.getElementById('fk-price-body');
  const itemsPreview = document.getElementById('delivery-order-items-preview');
  const itemsCountBadge = document.getElementById('deliv-items-count-badge');

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
    showToast('Your shopping bag is empty. Redirecting to collections...', 'info');
    setTimeout(() => { window.location.href = '/shop.html'; }, 1000);
    return;
  }

  currentCartData = cart;

  const items = cart.items || [];
  const itemCount = cart.itemCount || items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const itemsTotal = cart.subtotal || items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  const originalTotal = cart.originalSubtotal || items.reduce((s, i) => s + ((Number(i.original_price) || Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
  const discount = Math.max(0, originalTotal - itemsTotal);
  const finalTotal = itemsTotal;

  if (itemsCountBadge) itemsCountBadge.textContent = itemCount;

  // Render Order Items Bag Preview
  if (itemsPreview) {
    itemsPreview.innerHTML = items.map(item => `
      <div class="deliv-item-card">
        <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" class="deliv-item-thumb">
        <div style="flex: 1; min-width: 0;">
          <h4 class="deliv-item-title">${item.name}</h4>
          <div class="deliv-item-meta">
            <span>Size: <strong>${item.size || 'Free Size'}</strong></span>
            <span>Qty: <strong>${item.quantity || 1}</strong></span>
          </div>
          <div class="deliv-item-price-row">
            <span class="deliv-item-price">${formatPrice(item.price)}</span>
            ${(item.original_price && item.original_price > item.price) ? `
              <span class="deliv-item-orig-price">${formatPrice(item.original_price)}</span>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render Price Details
  if (priceBody) {
    priceBody.innerHTML = `
      <div class="fk-price-row">
        <span>Price (${itemCount} item${itemCount > 1 ? 's' : ''})</span>
        <span>${formatPrice(originalTotal > itemsTotal ? originalTotal : itemsTotal)}</span>
      </div>
      ${discount > 0 ? `
        <div class="fk-price-row savings">
          <span>Special Festive Discount</span>
          <span class="fk-discount-val">− ${formatPrice(discount)}</span>
        </div>
      ` : ''}
      <div class="fk-price-row">
        <span>Express Pan-India Delivery</span>
        <span class="fk-free-val"><span style="text-decoration: line-through; color: var(--muted); font-size: 0.85rem; margin-right: 4px;">₹49</span> FREE</span>
      </div>
      <div class="fk-price-total-row">
        <span>Total Amount Payable</span>
        <span class="total-highlight">${formatPrice(finalTotal)}</span>
      </div>
      ${discount > 0 ? `
        <div class="fk-savings-banner">
          ✨ You will save ${formatPrice(discount)} on this royal festive order!
        </div>
      ` : ''}
    `;
  }
}

// ─────────────────────────────────────────────────────────────
// Saved Addresses Loader
// ─────────────────────────────────────────────────────────────
async function loadDeliveryAddresses() {
  const container = document.getElementById('saved-addresses-list');
  const newFormBox = document.getElementById('new-address-form-box');
  const addToggle = document.getElementById('toggle-new-addr-btn');
  if (!container) return;

  let addresses = [];

  // Try API first
  try {
    const res = await fetch(`${API_BASE}/addresses`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
        addresses = data.addresses;
      }
    }
  } catch (_) {}

  // Fallback to localStorage saved addresses
  if (addresses.length === 0) {
    try {
      const stored = JSON.parse(localStorage.getItem('rjfc_saved_addresses') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        addresses = stored;
      }
    } catch (_) {}
  }

  // Pre-fill sample address if completely brand new customer
  if (addresses.length === 0 && currentUser) {
    addresses = [
      {
        id: 101,
        full_name: currentUser.name || 'Om Vinayak',
        phone: currentUser.phone || '9876543210',
        house_flat: 'Flat No. 402, Royal Palms Residency',
        street: 'MG Road, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pin_code: '500033',
        address_type: 'Home',
        is_default: 1
      }
    ];
    localStorage.setItem('rjfc_saved_addresses', JSON.stringify(addresses));
  }

  savedAddresses = addresses;

  if (savedAddresses.length > 0) {
    const defaultAddr = savedAddresses.find(a => a.is_default === 1) || savedAddresses[0];
    selectedAddressId = defaultAddr.id;

    renderAddressesList();
    if (newFormBox) newFormBox.style.display = 'none';
    if (addToggle) addToggle.style.display = 'flex';
  } else {
    selectedAddressId = null;
    container.innerHTML = `
      <div class="empty-addr-banner">
        📍 <strong>No delivery address found.</strong> Please enter your delivery address below to proceed.
      </div>
    `;
    if (newFormBox) newFormBox.style.display = 'block';
    if (addToggle) addToggle.style.display = 'none';

    prefillNewAddressForm();
  }
}

function renderAddressesList() {
  const container = document.getElementById('saved-addresses-list');
  if (!container) return;

  container.innerHTML = savedAddresses.map(addr => {
    const isSelected = addr.id === selectedAddressId;
    const typeLabel = (addr.address_type || 'HOME').toUpperCase();

    return `
      <div class="addr-select-item ${isSelected ? 'selected' : ''}" onclick="selectAddress(${addr.id})" id="addr-card-${addr.id}">
        <div style="display: flex; gap: 16px; align-items: flex-start;">
          <div class="custom-radio-wrap" style="margin-top: 2px;">
            <input type="radio" name="delivery_address_radio" value="${addr.id}" ${isSelected ? 'checked' : ''} style="display: none;">
            <div class="radio-indicator ${isSelected ? 'checked' : ''}"></div>
          </div>
          
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <span class="addr-person-name">${addr.full_name}</span>
              <span class="addr-tag ${addr.is_default ? 'default-tag' : ''}">${addr.is_default ? 'DEFAULT' : typeLabel}</span>
              <span class="addr-phone-chip">📞 ${addr.phone}</span>
              
              <div class="addr-item-actions">
                <button type="button" class="addr-action-btn edit-btn" onclick="openEditAddress(event, ${addr.id})" title="Edit Address">
                  ✏️ Edit
                </button>
                ${savedAddresses.length > 1 ? `
                  <button type="button" class="addr-action-btn delete-btn" onclick="handleDeleteAddress(event, ${addr.id})" title="Delete Address">
                    🗑️ Delete
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="addr-full-text">
              ${addr.house_flat || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - <strong>${addr.pin_code || ''}</strong>
            </div>

            ${isSelected ? `
              <div class="addr-proceed-dock">
                <button type="button" class="proceed-btn" onclick="confirmAddressAndProceed(event, ${addr.id})">
                  <span>DELIVER TO THIS ADDRESS & PROCEED TO PAYMENT</span>
                  <span style="font-size: 1.1rem; line-height: 1;">➔</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectAddress(id) {
  selectedAddressId = id;
  renderAddressesList();
}

function openEditAddress(e, id) {
  if (e) e.stopPropagation();
  const addr = savedAddresses.find(a => a.id === id);
  if (!addr) return;

  editingAddressId = id;
  const formBox = document.getElementById('new-address-form-box');
  const formTitle = document.getElementById('address-form-title');
  const submitBtn = document.getElementById('deliv-save-btn');

  if (formTitle) formTitle.textContent = 'Edit Delivery Address';
  if (submitBtn) submitBtn.textContent = 'UPDATE & DELIVER TO THIS ADDRESS ➔';

  document.getElementById('deliv-name').value = addr.full_name || '';
  document.getElementById('deliv-phone').value = addr.phone || '';
  document.getElementById('deliv-pincode').value = addr.pin_code || '';
  document.getElementById('deliv-street').value = addr.street || '';
  document.getElementById('deliv-house').value = addr.house_flat || '';
  document.getElementById('deliv-city').value = addr.city || '';
  document.getElementById('deliv-state').value = addr.state || '';

  const typeRadio = document.querySelector(`input[name="address_type"][value="${addr.address_type || 'Home'}"]`);
  if (typeRadio) typeRadio.checked = true;

  if (formBox) {
    formBox.style.display = 'block';
    formBox.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleDeleteAddress(e, id) {
  if (e) e.stopPropagation();
  if (savedAddresses.length <= 1) {
    showToast('At least one delivery address is required', 'warning');
    return;
  }
  if (!confirm('Are you sure you want to delete this address?')) return;

  savedAddresses = savedAddresses.filter(a => a.id !== id);
  localStorage.setItem('rjfc_saved_addresses', JSON.stringify(savedAddresses));

  if (selectedAddressId === id) {
    selectedAddressId = savedAddresses[0].id;
  }
  showToast('Address removed', 'info');
  renderAddressesList();
}

function confirmAddressAndProceed(e, id) {
  if (e) e.stopPropagation();
  const chosen = savedAddresses.find(a => a.id === id);
  if (!chosen) {
    showToast('Please select a valid address', 'error');
    return;
  }

  // Save selected address in session & local storage
  const summaryObj = {
    id: chosen.id,
    name: chosen.full_name,
    phone: chosen.phone,
    text: `${chosen.house_flat || ''}, ${chosen.street || ''}, ${chosen.city || ''}, ${chosen.state || ''} - ${chosen.pin_code || ''}`,
    house_flat: chosen.house_flat,
    street: chosen.street,
    city: chosen.city,
    state: chosen.state,
    pin_code: chosen.pin_code,
    address_type: chosen.address_type || 'Home'
  };

  sessionStorage.setItem('checkout_address_id', chosen.id);
  sessionStorage.setItem('checkout_address_summary', JSON.stringify(summaryObj));
  localStorage.setItem('rjfc_selected_address', JSON.stringify(summaryObj));
  localStorage.setItem('rjfc_selected_address_id', chosen.id);

  showToast('Delivery address confirmed! Proceeding to Payment...', 'success');

  // Navigate to Step 3: Order Summary & Payment
  setTimeout(() => {
    window.location.href = '/checkout.html';
  }, 350);
}

function toggleNewAddressForm() {
  const formBox = document.getElementById('new-address-form-box');
  const formTitle = document.getElementById('address-form-title');
  const submitBtn = document.getElementById('deliv-save-btn');
  if (!formBox) return;

  const isClosed = formBox.style.display === 'none';
  if (isClosed) {
    editingAddressId = null;
    if (formTitle) formTitle.textContent = 'Add New Delivery Address';
    if (submitBtn) submitBtn.textContent = 'SAVE & DELIVER TO THIS ADDRESS ➔';
    prefillNewAddressForm();
    formBox.style.display = 'block';
    formBox.scrollIntoView({ behavior: 'smooth' });
  } else {
    formBox.style.display = 'none';
  }
}

function prefillNewAddressForm() {
  if (currentUser) {
    const nameEl = document.getElementById('deliv-name');
    const phoneEl = document.getElementById('deliv-phone');
    if (nameEl && !nameEl.value) nameEl.value = currentUser.name || '';
    if (phoneEl && !phoneEl.value) phoneEl.value = (currentUser.phone || '').replace(/[^0-9]/g, '').slice(-10);
  }
}

async function handleSaveNewAddress(e) {
  e.preventDefault();
  const fullName = document.getElementById('deliv-name').value.trim();
  const phone = document.getElementById('deliv-phone').value.trim();
  const pinCode = document.getElementById('deliv-pincode').value.trim();
  const street = document.getElementById('deliv-street').value.trim();
  const houseFlat = document.getElementById('deliv-house').value.trim();
  const city = document.getElementById('deliv-city').value.trim();
  const state = document.getElementById('deliv-state').value.trim();
  const addressType = document.querySelector('input[name="address_type"]:checked')?.value || 'Home';
  const saveBtn = document.getElementById('deliv-save-btn');

  if (phone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    return;
  }
  if (pinCode.length < 6) {
    showToast('Please enter a valid 6-digit Pincode', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving Address...';

  if (editingAddressId) {
    // Update existing address
    const existing = savedAddresses.find(a => a.id === editingAddressId);
    if (existing) {
      existing.full_name = fullName;
      existing.phone = phone;
      existing.pin_code = pinCode;
      existing.street = street;
      existing.house_flat = houseFlat;
      existing.city = city;
      existing.state = state;
      existing.address_type = addressType;
    }
    localStorage.setItem('rjfc_saved_addresses', JSON.stringify(savedAddresses));
    confirmAddressAndProceed(null, editingAddressId);
    return;
  }

  // Create new address
  const newAddress = {
    id: Date.now(),
    full_name: fullName,
    phone: phone,
    pin_code: pinCode,
    street: street,
    house_flat: houseFlat,
    city: city,
    state: state,
    address_type: addressType,
    is_default: savedAddresses.length === 0 ? 1 : 0
  };

  // 1. Try persisting to server API if running
  try {
    await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddress)
    });
  } catch (_) {}

  // 2. Persist to local storage
  savedAddresses.unshift(newAddress);
  localStorage.setItem('rjfc_saved_addresses', JSON.stringify(savedAddresses));

  // 3. Confirm and proceed to checkout
  confirmAddressAndProceed(null, newAddress.id);
}
