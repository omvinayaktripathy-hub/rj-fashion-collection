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
    // Load user default address if available
  try {
    const authRes = await fetch(`${API_BASE}/me`);
    const authData = await authRes.json();
    if (authData.success && authData.user) {
      const addrRes = await fetch(`${API_BASE}/addresses`);
      const addrData = await addrRes.json();
      if (addrData.success && addrData.addresses && addrData.addresses.length > 0) {
        const def = addrData.addresses.find(a => a.is_default) || addrData.addresses[0];
        if (pincodeDisplay) {
          pincodeDisplay.textContent = `${def.full_name}, ${def.pin_code}`;
        }
      } else if (pincodeDisplay && authData.user.name) {
        pincodeDisplay.textContent = `${authData.user.name} (Add Delivery Address)`;
      }
    }
  } catch (e) {
    // Non-fatal
  }

  let data;
  try {
    const res = await fetch(`${API_BASE}/cart`);
    if (res.ok) {
      data = await res.json();
    } else {
      throw new Error();
    }
  } catch (err) {
    try {
      const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
      const count = local.reduce((s, i) => s + (i.quantity || 1), 0);
      const subtotal = local.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
      data = {
        success: true,
        items: local,
        itemCount: count,
        subtotal: subtotal,
        total: subtotal,
        discount: 0
      };
    } catch(e) {}
  }

  if (!data || !data.success || !data.items || data.items.length === 0) {
    if (cartLayout) cartLayout.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (headingCount) headingCount.textContent = '0';
    updateCartCount();
    return;
  }

    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (headingCount) headingCount.textContent = data.itemCount;

    // Delivery date calculation (e.g. 3-4 days from today)
    const delivDate = new Date();
    delivDate.setDate(delivDate.getDate() + 3);
    const dateStr = delivDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    // Render Flipkart-style Cart Items
    container.innerHTML = data.items.map(item => `
      <div style="padding: 24px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 24px; align-items: flex-start;" id="cart-row-${item.id}">
        <!-- Thumbnail & Stepper Column -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 14px; width: 110px;">
          <a href="/product.html?id=${item.product_id}">
            <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 120px; object-fit: cover; border-radius: 2px; border: 1px solid #e0e0e0;">
          </a>
          <div class="qty-stepper">
            <button class="qty-btn" onclick="changeCartQty(${item.id}, ${item.quantity - 1})" title="Decrease">-</button>
            <input type="text" class="qty-input" value="${item.quantity}" readonly>
            <button class="qty-btn" onclick="changeCartQty(${item.id}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''} title="Increase">+</button>
          </div>
        </div>

        <!-- Info Column -->
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0 0 6px 0; color: #212121; line-height: 1.4;">
                <a href="/product.html?id=${item.product_id}" style="color: inherit; text-decoration: none;">
                  ${item.name}
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
            <span style="font-size: 1.25rem; font-weight: 800; color: #212121;">${formatPrice(item.price)}</span>
            ${item.original_price > item.price ? `
              <span style="font-size: 0.9rem; color: #878787; text-decoration: line-through;">${formatPrice(item.original_price)}</span>
            ` : ''}
            ${item.discount > 0 ? `
              <span style="font-size: 0.85rem; font-weight: 700; color: #388e3c;">${item.discount}% off</span>
              <span style="font-size: 0.78rem; font-weight: 600; color: #388e3c; background: #e8f5e9; padding: 2px 6px; border-radius: 2px;">1 offer applied</span>
            ` : ''}
          </div>

          <!-- Action Links (SAVE FOR LATER, REMOVE) -->
          <div style="display: flex; align-items: center; gap: 20px; font-size: 0.95rem; font-weight: 700;">
            <button class="cart-action-link" style="text-transform: uppercase; font-size: 0.9rem; color: #212121;" onclick="moveToWishlistFromCart(${item.product_id}, ${item.id})">
              SAVE FOR LATER
            </button>
            <button class="cart-action-link" style="text-transform: uppercase; font-size: 0.9rem; color: #212121;" onclick="removeCartItem(${item.id})">
              REMOVE
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Render Flipkart-style Price Details
    const { summary } = data;
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="fk-price-header">PRICE DETAILS</div>
        <div class="fk-price-body">
          <div class="fk-price-row">
            <span>Price (${data.itemCount} item${data.itemCount > 1 ? 's' : ''})</span>
            <span>${formatPrice(summary.originalSubtotal || summary.subtotal)}</span>
          </div>

          ${summary.totalSavings > 0 ? `
            <div class="fk-price-row savings">
              <span>Discount</span>
              <span>− ${formatPrice(summary.totalSavings)}</span>
            </div>
          ` : ''}

          <div class="fk-price-row">
            <span>Delivery Charges</span>
            <span style="color: ${summary.delivery === 'FREE' ? '#388e3c' : '#212121'}; font-weight: 700;">
              ${summary.delivery === 'FREE' ? '<span style="text-decoration: line-through; color: #878787; font-weight: 400; margin-right: 4px;">₹49</span> FREE' : formatPrice(summary.deliveryAmount)}
            </span>
          </div>

          <div class="fk-price-total">
            <span>Total Amount</span>
            <span>${formatPrice(summary.total)}</span>
          </div>

          ${summary.totalSavings > 0 ? `
            <div class="fk-savings-banner">
              You will save ${formatPrice(summary.totalSavings)} on this order
            </div>
          ` : ''}
        </div>

        <div class="fk-trust-badge">
          <span style="font-size: 1.4rem;">🛡️</span>
          <div>Safe and Secure Payments. Easy checkout. 100% Authentic Handcrafted Wear.</div>
        </div>
      `;
    }

    updateCartCount();
  } catch (err) {
    console.error('Error loading cart:', err);
    if (container) container.innerHTML = `<p style="padding: 20px; color: var(--danger);">Error loading cart items. Please refresh.</p>`;
  }
}

async function changeCartQty(cartItemId, newQty) {
  if (newQty < 1) {
    removeCartItem(cartItemId);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
    const data = await res.json();
    if (data.success) {
      loadCart();
    } else {
      showToast(data.message || 'Could not update quantity', 'error');
    }
  } catch (err) {
    showToast('Failed to update quantity', 'error');
  }
}

async function removeCartItem(cartItemId) {
  try {
    const res = await fetch(`${API_BASE}/cart/${cartItemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Item removed from cart', 'info');
      loadCart();
    } else {
      showToast(data.message || 'Could not remove item', 'error');
    }
  } catch (err) {
    showToast('Failed to remove item', 'error');
  }
}

async function moveToWishlistFromCart(productId, cartItemId) {
  try {
    await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    await removeCartItem(cartItemId);
    showToast('Item moved to wishlist!', 'success');
  } catch (err) {
    showToast('Failed to move item to wishlist', 'error');
  }
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
