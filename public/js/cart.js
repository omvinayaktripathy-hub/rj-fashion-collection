// RJ FASHION COLLECTION - SHOPPING CART CONTROLLER (FLIPKART STYLE)

async function loadCart() {
  const container = document.getElementById('cart-items-list');
  const summaryBox = document.getElementById('cart-summary-box');
  const cartLayout = document.getElementById('cart-page-layout');
  const emptyState = document.getElementById('cart-empty-state');
  const headingCount = document.getElementById('cart-heading-count');
  const pincodeDisplay = document.getElementById('cart-pincode-display');

  if (!container) return;

  try {
    // 1. Load user default address if available (API + Local Storage fallback)
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
        // LocalStorage fallback for address
        const savedAddrs = JSON.parse(localStorage.getItem('rjfc_saved_addresses') || '[]');
        const selectedId = localStorage.getItem('rjfc_selected_address_id');
        const selectedAddr = savedAddrs.find(a => String(a.id) === String(selectedId)) || savedAddrs[0];
        if (selectedAddr && pincodeDisplay) {
          pincodeDisplay.textContent = `${selectedAddr.name || selectedAddr.full_name || 'Home'}, ${selectedAddr.pincode || selectedAddr.pin_code || ''}`;
          addrFound = true;
        } else {
          const localUser = JSON.parse(localStorage.getItem('rjfc_user') || 'null');
          if (localUser && pincodeDisplay) {
            pincodeDisplay.textContent = `${localUser.name || 'Valued Customer'} (Select Address)`;
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

    // If API returned nothing or failed, load from localStorage
    if (!data || !data.items || data.items.length === 0) {
      try {
        const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
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
            delivery: 'FREE',
            deliveryAmount: 0,
            total: subtotal
          }
        };
      } catch (_) {}
    }

    const items = (data && Array.isArray(data.items)) ? data.items : [];

    // Empty State check
    if (items.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (headingCount) headingCount.textContent = '0';
      if (typeof updateCartCount === 'function') updateCartCount();
      return;
    }

    const itemCount = data.itemCount || items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    const subtotal = data.subtotal || items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const originalSubtotal = items.reduce((s, i) => s + ((Number(i.original_price) || Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const totalSavings = Math.max(0, originalSubtotal - subtotal);

    // Guaranteed Summary Object
    const summary = (data && data.summary) ? data.summary : {
      originalSubtotal: originalSubtotal,
      subtotal: subtotal,
      totalSavings: totalSavings,
      delivery: 'FREE',
      deliveryAmount: 0,
      total: subtotal
    };

    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (headingCount) headingCount.textContent = itemCount;

    // Delivery date calculation (3-4 days from today)
    const delivDate = new Date();
    delivDate.setDate(delivDate.getDate() + 3);
    const dateStr = delivDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    // Render Flipkart-style Cart Items
    container.innerHTML = items.map(item => {
      const itemId = item.id || item.product_id;
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const origPrice = Number(item.original_price) || price;
      const stock = Number(item.stock) || 99;
      const discount = item.discount || (origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0);

      return `
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 24px; align-items: flex-start;" id="cart-row-${itemId}">
          <!-- Thumbnail & Stepper Column -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 14px; width: 110px;">
            <a href="/product.html?id=${prodId}">
              <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name || 'Product'}" style="width: 100px; height: 120px; object-fit: cover; border-radius: 2px; border: 1px solid #e0e0e0;">
            </a>
            <div class="qty-stepper">
              <button class="qty-btn" type="button" onclick="changeCartQty('${itemId}', ${qty - 1})" title="Decrease">-</button>
              <input type="text" class="qty-input" value="${qty}" readonly>
              <button class="qty-btn" type="button" onclick="changeCartQty('${itemId}', ${qty + 1})" ${qty >= stock ? 'disabled' : ''} title="Increase">+</button>
            </div>
          </div>

          <!-- Info Column -->
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0 0 6px 0; color: #212121; line-height: 1.4;">
                  <a href="/product.html?id=${prodId}" style="color: inherit; text-decoration: none;">
                    ${item.name || 'Handcrafted Luxury Wear'}
                  </a>
                </h3>
                <div style="font-size: 0.85rem; color: #878787; margin-bottom: 8px;">
                  Size: <strong style="color: #212121;">${item.size || 'Free Size'}</strong> • Seller: <span style="color: var(--primary); font-weight: 600;">RJ Fashion Collection</span>
                </div>
              </div>

              <!-- Delivery Estimate -->
              <div style="font-size: 0.85rem; text-align: right; white-space: nowrap; color: #212121;">
                Delivery by <strong>${dateStr}</strong> | <span style="color: #388e3c; font-weight: 700;">FREE</span>
              </div>
            </div>

            <!-- Price Row -->
            <div style="display: flex; align-items: baseline; gap: 10px; margin: 8px 0 16px;">
              <span style="font-size: 1.25rem; font-weight: 800; color: #212121;">${formatPrice(price)}</span>
              ${origPrice > price ? `
                <span style="font-size: 0.9rem; color: #878787; text-decoration: line-through;">${formatPrice(origPrice)}</span>
              ` : ''}
              ${discount > 0 ? `
                <span style="font-size: 0.85rem; font-weight: 700; color: #388e3c;">${discount}% off</span>
                <span style="font-size: 0.78rem; font-weight: 600; color: #388e3c; background: #e8f5e9; padding: 2px 6px; border-radius: 2px;">Special Offer</span>
              ` : ''}
            </div>

            <!-- Action Links (SAVE FOR LATER, REMOVE) -->
            <div style="display: flex; align-items: center; gap: 20px; font-size: 0.95rem; font-weight: 700;">
              <button class="cart-action-link" type="button" style="text-transform: uppercase; font-size: 0.9rem; color: #212121; background: none; border: none; cursor: pointer; font-weight: 700;" onclick="moveToWishlistFromCart('${prodId}', '${itemId}')">
                SAVE FOR LATER
              </button>
              <button class="cart-action-link" type="button" style="text-transform: uppercase; font-size: 0.9rem; color: #212121; background: none; border: none; cursor: pointer; font-weight: 700;" onclick="removeCartItem('${itemId}')">
                REMOVE
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render Flipkart-style Price Details
    if (summaryBox) {
      const origPriceTotal = summary.originalSubtotal || summary.subtotal || subtotal;
      const savingsTotal = summary.totalSavings !== undefined ? summary.totalSavings : totalSavings;
      const orderTotal = summary.total !== undefined ? summary.total : subtotal;
      const isFreeDelivery = summary.delivery === 'FREE' || !summary.deliveryAmount || summary.deliveryAmount === 0;

      summaryBox.innerHTML = `
        <div class="fk-price-header">PRICE DETAILS</div>
        <div class="fk-price-body">
          <div class="fk-price-row">
            <span>Price (${itemCount} item${itemCount > 1 ? 's' : ''})</span>
            <span>${formatPrice(origPriceTotal)}</span>
          </div>

          ${savingsTotal > 0 ? `
            <div class="fk-price-row savings">
              <span>Discount</span>
              <span>− ${formatPrice(savingsTotal)}</span>
            </div>
          ` : ''}

          <div class="fk-price-row">
            <span>Delivery Charges</span>
            <span style="color: ${isFreeDelivery ? '#388e3c' : '#212121'}; font-weight: 700;">
              ${isFreeDelivery ? '<span style="text-decoration: line-through; color: #878787; font-weight: 400; margin-right: 4px;">₹49</span> FREE' : formatPrice(summary.deliveryAmount)}
            </span>
          </div>

          <div class="fk-price-total">
            <span>Total Amount</span>
            <span>${formatPrice(orderTotal)}</span>
          </div>

          ${savingsTotal > 0 ? `
            <div class="fk-savings-banner">
              You will save ${formatPrice(savingsTotal)} on this order
            </div>
          ` : ''}
        </div>

        <div class="fk-trust-badge">
          <span style="font-size: 1.4rem;">🛡️</span>
          <div>Safe and Secure Payments. Easy checkout. 100% Authentic Handcrafted Wear.</div>
        </div>
      `;
    }

    if (typeof updateCartCount === 'function') updateCartCount();
  } catch (err) {
    console.error('Error loading cart:', err);
    if (container) {
      container.innerHTML = `<p style="padding: 20px; color: var(--danger); text-align: center;">Unable to load items. <button onclick="loadCart()" style="background: none; border: 1px solid var(--border); padding: 4px 12px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Retry</button></p>`;
    }
  }
}

async function changeCartQty(cartItemId, newQty) {
  if (newQty < 1) {
    removeCartItem(cartItemId);
    return;
  }

  // 1. Try server update
  let apiSuccess = false;
  try {
    const res = await fetch(`${API_BASE}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        apiSuccess = true;
      }
    }
  } catch (_) {}

  // 2. Always keep localStorage in sync as fallback
  try {
    const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
    const item = local.find(i => String(i.id) === String(cartItemId) || String(i.product_id) === String(cartItemId));
    if (item) {
      item.quantity = Number(newQty);
      localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
    }
  } catch (_) {}

  // Reload cart view and header badge
  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

async function removeCartItem(cartItemId) {
  // 1. Try server remove
  try {
    const res = await fetch(`${API_BASE}/cart/${cartItemId}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
    }
  } catch (_) {}

  // 2. Always remove from localStorage
  try {
    let local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
    local = local.filter(i => String(i.id) !== String(cartItemId) && String(i.product_id) !== String(cartItemId));
    localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
  } catch (_) {}

  showToast('Item removed from cart', 'info');
  await loadCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

async function moveToWishlistFromCart(productId, cartItemId) {
  try {
    // Try API
    await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
  } catch (_) {}

  // Local Wishlist sync
  try {
    let wl = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    if (!wl.includes(productId)) {
      wl.push(productId);
      localStorage.setItem('rjfc_wishlist', JSON.stringify(wl));
    }
  } catch (_) {}

  // Remove from cart
  await removeCartItem(cartItemId);
  showToast('Item moved to wishlist!', 'success');
  if (typeof updateWishlistCount === 'function') updateWishlistCount();
}

document.addEventListener('DOMContentLoaded', loadCart);

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
