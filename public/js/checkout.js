// RJ FASHION COLLECTION - CHECKOUT CONTROLLER

// currentUser inherited from app.js
let savedAddresses = [];
let selectedAddressId = null;
let activeAddressData = null;
let razorpayConfig = { enabled: false, keyId: null }; // populated by initPaymentConfig()

async function initCheckout() {
  // Check auth first
  try {
    const authRes = await fetch(`${API_BASE}/me`);
    const authData = await authRes.json();
    if (!authData.success || !authData.user) {
      window.location.href = `/login.html?redirect=/checkout.html`;
      return;
    }
    currentUser = authData.user;

    // Load cart items & summary
    await loadCheckoutCart();

    // Load or resolve delivery address
    await resolveDeliveryAddress();

    // Fetch Razorpay config & render payment option
    await initPaymentConfig();
  } catch (err) {
    console.error('Checkout initialization error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Resolve Delivery Address (from sessionStorage, query, or backend)
// ─────────────────────────────────────────────────────────────
async function resolveDeliveryAddress() {
  const urlParams = new URLSearchParams(window.location.search);
  const queryAddrId = urlParams.get('addressId');
  const storedSummary = sessionStorage.getItem('checkout_address_summary');

  let chosenAddress = null;

  // 1. Try from sessionStorage summary
  if (storedSummary) {
    try {
      chosenAddress = JSON.parse(storedSummary);
      if (chosenAddress && chosenAddress.id && !isNaN(chosenAddress.id)) {
        selectedAddressId = parseInt(chosenAddress.id, 10);
      }
      activeAddressData = chosenAddress;
    } catch (e) {
      console.warn('Could not parse stored address summary:', e);
    }
  }

  // 2. Load addresses from API to verify or resolve
  try {
    const res = await fetch(`${API_BASE}/addresses`);
    const data = await res.json();
    if (data.success && Array.isArray(data.addresses)) {
      savedAddresses = data.addresses;

      // If query param addressId specified, prioritize it
      if (queryAddrId && !isNaN(queryAddrId)) {
        const found = savedAddresses.find(a => a.id === parseInt(queryAddrId, 10));
        if (found) {
          selectedAddressId = found.id;
          chosenAddress = {
            id: found.id,
            name: found.full_name,
            phone: found.phone,
            text: `${found.house_flat}, ${found.street}, ${found.city}, ${found.state} - ${found.pin_code}`
          };
          activeAddressData = chosenAddress;
        }
      }

      // If no address selected yet, check if any saved address exists
      if (!chosenAddress && savedAddresses.length > 0) {
        const defaultAddr = savedAddresses.find(a => a.is_default === 1) || savedAddresses[0];
        selectedAddressId = defaultAddr.id;
        chosenAddress = {
          id: defaultAddr.id,
          name: defaultAddr.full_name,
          phone: defaultAddr.phone,
          text: `${defaultAddr.house_flat}, ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pin_code}`
        };
        activeAddressData = chosenAddress;
      }
    }
  } catch (err) {
    console.error('Error fetching addresses:', err);
  }

  // 3. If still no address found, redirect user to dedicated /delivery.html
  if (!chosenAddress) {
    window.location.href = '/delivery.html';
    return;
  }

  // Render the confirmed address card
  renderConfirmedAddress(chosenAddress);
}

function renderConfirmedAddress(addr) {
  const container = document.getElementById('confirmed-address-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
      <div>
        <div style="font-weight: 700; font-size: 1.05rem; color: var(--dark); display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span>${addr.name || 'Recipient'}</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: #4b5563; background: #e5e7eb; padding: 2px 10px; border-radius: 12px;">
            📞 ${addr.phone || ''}
          </span>
        </div>
        <p style="margin: 8px 0 0; color: #374151; font-size: 0.93rem; line-height: 1.6;">
          ${addr.text || ''}
        </p>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Payment Config — load from backend and render option in UI
// ─────────────────────────────────────────────────────────────
async function initPaymentConfig() {
  try {
    const res = await fetch(`${API_BASE}/payment/config`);
    const data = await res.json();
    if (data.success) {
      razorpayConfig = { enabled: data.enabled, keyId: data.keyId };
    }
  } catch (err) {
    console.warn('[Checkout] Could not fetch payment config:', err.message);
  }
  renderRazorpayOption();
}

function renderRazorpayOption() {
  const container = document.getElementById('razorpay-option-container');
  if (!container) return;

  if (razorpayConfig.enabled) {
    // Razorpay is live — show a selectable radio option
    container.innerHTML = `
      <label style="display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: #fafafa;">
        <input type="radio" name="payment_method" value="Online Payment (Razorpay)">
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">
            💳 UPI / Cards / Net Banking
            <span style="font-size: 0.72rem; background: #22c55e; color: #fff; padding: 2px 7px; border-radius: 4px; margin-left: 6px;">LIVE</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--muted); margin-top: 2px;">GPay, PhonePe, Paytm, Credit/Debit cards &amp; Net Banking — powered by Razorpay.</div>
        </div>
      </label>
    `;
  } else {
    // Demo mode — show disabled option with setup note
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px dashed var(--border); border-radius: 8px; background: #fafafa; opacity: 0.75; cursor: not-allowed;">
        <input type="radio" name="payment_method" value="Online Payment (Razorpay)" disabled>
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">
            💳 UPI / Cards / Net Banking
            <span style="font-size: 0.72rem; background: var(--gold); color: #111; padding: 2px 7px; border-radius: 4px; margin-left: 6px;">DEMO MODE</span>
          </div>
          <div style="font-size: 0.81rem; color: var(--muted); margin-top: 3px;">
            GPay, PhonePe, Paytm, Credit/Debit &amp; Net Banking.
            <span style="color: #b45309;">Set <code>RAZORPAY_ENABLED=true</code> in <code>.env</code> to activate.</span>
          </div>
        </div>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────────────────────
// Cart & Order Items Summary
// ─────────────────────────────────────────────────────────────
async function loadCheckoutCart() {
  const container = document.getElementById('checkout-cart-items');
  const summaryBox = document.getElementById('checkout-summary');

  try {
    const res = await fetch(`${API_BASE}/cart`);
    const data = await res.json();

    if (!data.success || !data.items || data.items.length === 0) {
      alert('Your cart is empty. Please add items to checkout.');
      window.location.href = '/shop.html';
      return;
    }

    if (container) {
      container.innerHTML = data.items.map(item => `
        <div style="display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); align-items: center;">
          <img src="${item.image}" alt="${item.name}" style="width: 64px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--dark); line-height: 1.4;">${item.name}</div>
            <div style="font-size: 0.82rem; color: var(--muted); margin: 4px 0;">Qty: <strong>${item.quantity}</strong> • Size: <strong>${item.size || 'Free Size'}</strong></div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">${formatPrice(item.item_total)}</div>
          </div>
        </div>
      `).join('');
    }

    if (summaryBox) {
      const { summary } = data;
      summaryBox.innerHTML = `
        <div class="summary-row">
          <span>Subtotal (${data.itemCount} item${data.itemCount > 1 ? 's' : ''})</span>
          <span>${formatPrice(summary.originalSubtotal || summary.subtotal)}</span>
        </div>
        ${summary.totalSavings > 0 ? `
          <div class="summary-row savings">
            <span>Special Discount</span>
            <span>-${formatPrice(summary.totalSavings)}</span>
          </div>
        ` : ''}
        <div class="summary-row">
          <span>Delivery</span>
          <span style="color: ${summary.delivery === 'FREE' ? 'var(--success)' : 'inherit'}; font-weight: 600;">
            ${summary.delivery === 'FREE' ? 'FREE' : formatPrice(summary.deliveryAmount)}
          </span>
        </div>
        <div class="summary-total">
          <span>Total Payable</span>
          <span>${formatPrice(summary.total)}</span>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading checkout cart:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Collect address payload (shared by COD and Razorpay flows)
// ─────────────────────────────────────────────────────────────
function collectAddressPayload() {
  if (selectedAddressId) {
    return { addressId: selectedAddressId, error: null };
  }

  if (activeAddressData && activeAddressData.raw) {
    return {
      addressId: null,
      newAddress: activeAddressData.raw,
      error: null
    };
  }

  // Fallback to inline form inputs if present
  const fullName = document.getElementById('addr-name')?.value?.trim();
  const phone = document.getElementById('addr-phone')?.value?.trim();
  const houseFlat = document.getElementById('addr-house')?.value?.trim();
  const street = document.getElementById('addr-street')?.value?.trim();
  const city = document.getElementById('addr-city')?.value?.trim();
  const state = document.getElementById('addr-state')?.value?.trim();
  const pinCode = document.getElementById('addr-pincode')?.value?.trim();
  const saveAddress = document.getElementById('addr-save-check')?.checked || false;

  if (fullName && phone && houseFlat && street && city && state && pinCode) {
    return {
      addressId: null,
      newAddress: { fullName, phone, houseFlat, street, city, state, pinCode, saveAddress },
      error: null
    };
  }

  return { addressId: null, error: 'Please choose or provide a delivery address.' };
}

// ─────────────────────────────────────────────────────────────
// Place Order (COD path)
// ─────────────────────────────────────────────────────────────
async function placeOrder() {
  const selectedMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'Cash on Delivery';

  // Route to Razorpay flow if online payment selected and gateway enabled
  if (selectedMethod === 'Online Payment (Razorpay)' && razorpayConfig.enabled) {
    return initiateRazorpayPayment();
  }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Processing Order...';

  try {
    const addrPayload = collectAddressPayload();
    if (addrPayload.error) {
      showToast(addrPayload.error, 'error');
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
      return;
    }

    const payload = {
      paymentMethod: selectedMethod,
      notes: document.getElementById('order-notes')?.value || '',
      ...addrPayload
    };
    delete payload.error;

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      // Clear checkout address from session
      sessionStorage.removeItem('checkout_address_id');
      sessionStorage.removeItem('checkout_address_summary');
      showOrderSuccessModal(data.orderNumber, data.total);
      updateCartCount();
    } else {
      showToast(data.message || 'Failed to place order', 'error');
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
    }
  } catch (err) {
    console.error('Order error:', err);
    showToast('Failed to place order. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'PLACE ORDER';
  }
}

// ─────────────────────────────────────────────────────────────
// Razorpay Online Payment Flow
// ─────────────────────────────────────────────────────────────
async function initiateRazorpayPayment() {
  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Opening Payment Gateway...';

  try {
    const addrPayload = collectAddressPayload();
    if (addrPayload.error) {
      showToast(addrPayload.error, 'error');
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
      return;
    }

    // Step 1: Get cart total
    const cartRes = await fetch(`${API_BASE}/cart`);
    const cartData = await cartRes.json();
    if (!cartData.success || !cartData.summary) {
      showToast('Unable to fetch cart total. Please refresh.', 'error');
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
      return;
    }
    const totalAmount = cartData.summary.total;

    // Step 2: Create Razorpay order via backend
    const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalAmount })
    });
    const orderData = await orderRes.json();
    if (!orderData.success) {
      showToast('Could not create payment order. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
      return;
    }

    // Step 3: Load Razorpay script dynamically
    await loadRazorpayScript();

    // Step 4: Open Razorpay checkout popup
    const rzpOrder = orderData.order;
    const options = {
      key: razorpayConfig.keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || 'INR',
      name: 'RJ Fashion Collection',
      description: 'Secure Online Payment',
      order_id: rzpOrder.id,
      prefill: {
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        contact: currentUser?.phone || ''
      },
      theme: { color: '#700037' },
      handler: async function (response) {
        // Step 5: Verify payment signature on backend
        try {
          const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            showToast('Payment verification failed. Contact support.', 'error');
            btn.disabled = false;
            btn.textContent = 'PLACE ORDER';
            return;
          }

          // Step 6: Place the order with Razorpay payment method
          const placepayload = {
            paymentMethod: 'Online Payment (Razorpay)',
            notes: document.getElementById('order-notes')?.value || '',
            razorpayPaymentId: response.razorpay_payment_id,
            ...addrPayload
          };
          delete placepayload.error;

          const placeRes = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(placepayload)
          });
          const placeData = await placeRes.json();
          if (placeData.success) {
            sessionStorage.removeItem('checkout_address_id');
            sessionStorage.removeItem('checkout_address_summary');
            showOrderSuccessModal(placeData.orderNumber, placeData.total);
            updateCartCount();
          } else {
            showToast(placeData.message || 'Order placement failed after payment. Contact support.', 'error');
            btn.disabled = false;
            btn.textContent = 'PLACE ORDER';
          }
        } catch (err) {
          console.error('Post-payment order error:', err);
          showToast('Order placement failed after payment. Please contact support.', 'error');
          btn.disabled = false;
          btn.textContent = 'PLACE ORDER';
        }
      },
      modal: {
        ondismiss: function () {
          btn.disabled = false;
          btn.textContent = 'PLACE ORDER';
          showToast('Payment cancelled. Choose a payment method to continue.', 'error');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error('Razorpay initiation error:', err);
    showToast('Failed to open payment gateway. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'PLACE ORDER';
  }
}

// Dynamically load Razorpay checkout.js script (idempotent)
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.head.appendChild(script);
  });
}

// ─────────────────────────────────────────────────────────────
// Order Success Modal
// ─────────────────────────────────────────────────────────────
function showOrderSuccessModal(orderNumber, total) {
  const modal = document.getElementById('order-success-modal');
  document.getElementById('modal-order-number').textContent = orderNumber;
  document.getElementById('modal-order-total').textContent = formatPrice(total);
  if (modal) {
    modal.style.display = 'flex';
  }
}

document.addEventListener('DOMContentLoaded', initCheckout);
