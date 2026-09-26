// RJ FASHION COLLECTION - DEDICATED DELIVERY ADDRESS CONTROLLER (STEP 2)

let savedAddresses = [];
let selectedAddressId = null;
let currentCartData = null;

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
      // User requested: "i want login different page"
      window.location.href = '/login.html?redirect=/delivery.html';
      return;
    }

    currentUser = user;

    // Display user in status chip
    const nameEl = document.getElementById('deliv-user-name');
    const emailEl = document.getElementById('deliv-user-email');
    if (nameEl) nameEl.textContent = currentUser.name || 'Valued Customer';
    if (emailEl) emailEl.textContent = `(${currentUser.email || currentUser.phone || ''})`;

    // 2. Load Cart & Price Details
    await loadDeliveryCartSummary();

    // 3. Load Saved Delivery Addresses
    await loadDeliveryAddresses();
  } catch (err) {
    console.error('Delivery initialization error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Cart & Price Summary
// ─────────────────────────────────────────────────────────────
async function loadDeliveryCartSummary() {
  const priceBody = document.getElementById('fk-price-body');
  if (!priceBody) return;

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
          discount: Math.round(subtotal * 0.1) // 10% festive savings
        };
      }
    } catch (_) {}
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    alert('Your shopping bag is empty. Please add items before choosing delivery.');
    window.location.href = '/shop.html';
    return;
  }

  currentCartData = cart;

  const itemsTotal = cart.subtotal || cart.total || 0;
  const discount = cart.discount || Math.round(itemsTotal * 0.08);
  const finalTotal = Math.max(0, itemsTotal - discount);

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
      <span>Express Pan-India Delivery</span>
      <span class="fk-free-val">FREE</span>
    </div>
    <div class="fk-price-total-row">
      <span>Total Amount Payable</span>
      <span>${formatPrice(finalTotal)}</span>
    </div>
    <div class="fk-savings-banner">
      ✨ You will save ${formatPrice(discount)} on this royal festive order!
    </div>
  `;
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

  // Pre-fill default sample address if completely brand new customer
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
      <div style="background: #fdfaf6; border: 1.5px dashed var(--primary); padding: 18px; border-radius: 6px; font-size: 0.92rem; color: #475569; margin-bottom: 16px;">
        📍 <strong>No delivery address found.</strong> Please enter your address below to proceed to checkout.
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
    return `
      <div class="addr-select-item ${isSelected ? 'selected' : ''}" onclick="selectAddress(${addr.id})" id="addr-card-${addr.id}">
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <input type="radio" name="delivery_address_radio" value="${addr.id}" ${isSelected ? 'checked' : ''} style="margin-top: 4px; accent-color: var(--primary); width: 18px; height: 18px; cursor: pointer;">
          
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: 1rem; color: #1e293b;">${addr.full_name}</span>
              <span class="addr-tag ${addr.is_default ? 'default-tag' : ''}">${addr.is_default ? 'DEFAULT' : (addr.address_type || 'HOME')}</span>
              <span style="color: #64748b; font-size: 0.88rem; font-weight: 600; margin-left: auto;">📞 ${addr.phone}</span>
            </div>

            <div style="color: #475569; font-size: 0.92rem; line-height: 1.5; margin-bottom: 12px;">
              ${addr.house_flat}, ${addr.street}, ${addr.city}, ${addr.state} - <strong>${addr.pin_code}</strong>
            </div>

            ${isSelected ? `
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                <button type="button" class="proceed-btn" onclick="confirmAddressAndProceed(event, ${addr.id})">
                  DELIVER TO THIS ADDRESS & PROCEED TO PAYMENT ➔
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
    text: `${chosen.house_flat}, ${chosen.street}, ${chosen.city}, ${chosen.state} - ${chosen.pin_code}`,
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

  showToast('Delivery address confirmed! Proceeding to Payment & Order Review...', 'success');

  // Navigate to dedicated Order Summary & Payment page
  setTimeout(() => {
    window.location.href = '/checkout.html';
  }, 350);
}

function toggleNewAddressForm() {
  const formBox = document.getElementById('new-address-form-box');
  if (!formBox) return;

  const isClosed = formBox.style.display === 'none';
  formBox.style.display = isClosed ? 'block' : 'none';
  if (isClosed) {
    formBox.scrollIntoView({ behavior: 'smooth' });
    prefillNewAddressForm();
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
