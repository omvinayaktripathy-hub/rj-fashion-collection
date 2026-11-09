import os
import re

# ==============================================================================
# 1. OPTIMIZE public/checkout.html
# ==============================================================================
checkout_html_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/checkout.html'
with open(checkout_html_path, 'r', encoding='utf-8') as f:
    checkout_html = f.read()

# Remove artificial animation delays
old_anim = """.anim-delay-1 { animation-delay: 0.08s; opacity: 0; }
    .anim-delay-2 { animation-delay: 0.16s; opacity: 0; }
    .anim-delay-3 { animation-delay: 0.24s; opacity: 0; }
    .anim-delay-4 { animation-delay: 0.32s; opacity: 0; }"""

new_anim = """.anim-delay-1 { animation-delay: 0s; opacity: 1; }
    .anim-delay-2 { animation-delay: 0s; opacity: 1; }
    .anim-delay-3 { animation-delay: 0s; opacity: 1; }
    .anim-delay-4 { animation-delay: 0s; opacity: 1; }
    .anim-fade-in { animation: none !important; opacity: 1 !important; }"""

for sep in ['\n', '\r\n']:
    t = old_anim if sep == '\n' else old_anim.replace('\n', '\r\n')
    r = new_anim if sep == '\n' else new_anim.replace('\n', '\r\n')
    if t in checkout_html:
        checkout_html = checkout_html.replace(t, r)
        print("Updated animation delays in checkout.html")
        break

# Add zero-delay inline bootstrapper right after card 2 (order summary)
inline_boot_marker = '<!-- CARD 3: FESTIVE COUPON & PROMO CODE -->'
inline_boot_script = '''<script>
        // Instant Zero-Delay First Paint: Synchronously populate address & bag from storage in 0ms
        (function() {
          try {
            var addrKeys = ['rj_selected_address', 'checkout_address_summary', 'rjfc_selected_address'];
            var addr = null;
            for (var i = 0; i < addrKeys.length; i++) {
              var raw = sessionStorage.getItem(addrKeys[i]) || localStorage.getItem(addrKeys[i]);
              if (raw) {
                try {
                  var p = JSON.parse(raw);
                  if (p && (p.name || p.fullName || p.full_name)) { addr = p; break; }
                } catch(_) {}
              }
            }
            var addrEl = document.getElementById('confirmed-address-content');
            if (addrEl && addr) {
              var name = addr.name || addr.fullName || addr.full_name || '';
              var phone = addr.phone || addr.customer_phone || '';
              var text = addr.text || ((addr.house_flat || '') + ', ' + (addr.street || '') + ', ' + (addr.city || '') + ' - ' + (addr.pin_code || ''));
              var type = (addr.address_type || addr.addressType || 'HOME').toUpperCase();
              addrEl.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;">' +
                '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
                '<strong style="font-size:1.08rem;color:var(--deliv-text-primary);font-family:serif;">' + name + '</strong>' +
                '<span class="addr-tag default-tag" style="background:#0F382A;color:#ffffff;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;">' + type + '</span>' +
                (phone ? '<span style="color:var(--deliv-text-secondary);font-size:0.9rem;font-weight:600;">📞 ' + phone + '</span>' : '') +
                '</div><div style="color:var(--deliv-text-secondary);font-size:0.92rem;line-height:1.6;">' + text + '</div>' +
                '<div style="margin-top:6px;font-size:0.8rem;font-weight:600;color:#0F382A;display:flex;align-items:center;gap:6px;"><span>🚚</span><span>Arrives in 3–5 Business Days via Express Insured Courier</span></div></div>';
            }

            var cartKeys = ['rj_fashion_cart', 'rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'];
            var items = [];
            for (var j = 0; j < cartKeys.length; j++) {
              var rawC = localStorage.getItem(cartKeys[j]) || sessionStorage.getItem(cartKeys[j]);
              if (rawC) {
                try {
                  var pC = JSON.parse(rawC);
                  if (Array.isArray(pC) && pC.length > 0) { items = pC; break; }
                } catch(_) {}
              }
            }
            var itemsEl = document.getElementById('checkout-cart-items');
            var countEl = document.getElementById('checkout-items-count');
            if (itemsEl && items.length > 0) {
              var totalQty = 0;
              var subtotal = 0;
              var html = '';
              for (var k = 0; k < items.length; k++) {
                var it = items[k];
                var q = Math.max(1, Number(it.quantity) || 1);
                var pr = Number(it.price) || 0;
                totalQty += q;
                subtotal += pr * q;
                var img = it.image || it.thumbnail || (Array.isArray(it.images) && it.images[0]) || '/images/placeholder.jpg';
                var itName = it.name || it.title || 'Artisanal Ensemble';
                var itSize = it.size || it.selected_size || 'Free Size';
                html += '<div class="checkout-item-row" style="display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid var(--deliv-card-border);">' +
                  '<img src="' + img + '" alt="' + itName + '" class="checkout-item-thumb" style="width:56px;height:74px;aspect-ratio:3/4;object-fit:cover;border-radius:6px;background:#F7F4F0;flex-shrink:0;">' +
                  '<div style="flex:1;min-width:0;"><h4 style="font-size:0.92rem;font-weight:600;font-family:serif;color:var(--deliv-text-primary);margin:0 0 4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + itName + '</h4>' +
                  '<div style="font-size:0.8rem;color:var(--deliv-text-secondary);display:flex;gap:10px;"><span>Size: <strong>' + itSize + '</strong></span><span>Qty: <strong>' + q + '</strong></span></div></div>' +
                  '<div style="font-weight:700;font-family:monospace;font-size:0.96rem;color:var(--deliv-text-primary);text-align:right;">₹' + Math.round(pr * q).toLocaleString('en-IN') + '</div></div>';
              }
              itemsEl.innerHTML = html;
              if (countEl) countEl.textContent = totalQty + (totalQty === 1 ? ' item' : ' items');
              var ctaBtn = document.getElementById('confirm-order-btn-label');
              if (ctaBtn) ctaBtn.textContent = 'PAY & COMPLETE ORDER • ₹' + Math.round(subtotal).toLocaleString('en-IN');
            }
          } catch(e) {}
        })();
        </script>
        <!-- CARD 3: FESTIVE COUPON & PROMO CODE -->'''

if inline_boot_marker in checkout_html and 'Instant Zero-Delay First Paint' not in checkout_html:
    checkout_html = checkout_html.replace(inline_boot_marker, inline_boot_script)
    print("Added inline zero-delay bootstrapper to checkout.html")

# Update cache buster for checkout.js
checkout_html = re.sub(r'checkout\.js\?v=[a-zA-Z0-9_\-]+', 'checkout.js?v=20261109-fast-boot', checkout_html)

with open(checkout_html_path, 'w', encoding='utf-8') as f:
    f.write(checkout_html)

# ==============================================================================
# 2. OPTIMIZE public/js/checkout.js
# ==============================================================================
checkout_js_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/checkout.js'
with open(checkout_js_path, 'r', encoding='utf-8') as f:
    checkout_js = f.read()

# Replace Page Lifecycle in checkout.js to run immediately with zero delays
old_lifecycle = '''document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();

  const notesInput = document.getElementById('order-delivery-notes');
  if (notesInput) {
    notesInput.addEventListener('input', () => {
      const counter = document.getElementById('delivery-notes-count');
      if (counter) counter.textContent = String(notesInput.value.length) + ' / 200';
    });
  }

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

  // Listen for storage cart updates
  window.addEventListener('storage', () => {
    loadCheckoutCart();
  });
  window.addEventListener('rjfc_cart_updated', () => {
    loadCheckoutCart();
  });
});

async function initCheckoutPage() {
  try {
    // 1. Resolve User Session (allow guest or logged in)
    let user = null;
    try {
      if (window.isStaticHosting) throw new Error('static');
      const authRes = await fetch('/api/me');
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

    currentUser = user || { name: 'Valued Client', email: 'guest@example.com', phone: '+91 9876543210' };

    // Check PhonePe & Stripe return query params
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

    // 2. Resolve Delivery Address
    resolveDeliveryAddress();

    // 3. Load Cart & Price Details
    await loadCheckoutCart();
  } catch (err) {
    console.error('Checkout initialization error:', err);
  }
}'''

new_lifecycle = '''function startCheckout() {
  // 1. INSTANT FIRST PAINT: Synchronously hydrate address, items & price card from local storage (0ms)
  resolveDeliveryAddress();
  loadCheckoutCartSync();

  // 2. Resolve User Session synchronously from local storage
  let user = null;
  const localUser = localStorage.getItem('rjfc_user') || sessionStorage.getItem('rjfc_user');
  if (localUser) {
    try { user = JSON.parse(localUser); } catch (_) {}
  }
  currentUser = user || { name: 'Valued Client', email: 'guest@example.com', phone: '+91 9876543210' };

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
    radio.__radioBound = true;
  });

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
}'''

for sep in ['\n', '\r\n']:
    t = old_lifecycle if sep == '\n' else old_lifecycle.replace('\n', '\r\n')
    r = new_lifecycle if sep == '\n' else new_lifecycle.replace('\n', '\r\n')
    if t in checkout_js:
        checkout_js = checkout_js.replace(t, r)
        print("Updated lifecycle & instant boot in checkout.js")
        break

# Now update loadCheckoutCart to have loadCheckoutCartSync
old_load = '''async function loadCheckoutCart() {
  const container = document.getElementById('checkout-cart-items');
  const countEl = document.getElementById('checkout-items-count');

  let rawItems = [];

  // 1. Try server API
  try {
    if (window.isStaticHosting) throw new Error('static');
    const res = await fetch('/api/cart');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        rawItems = data.items;
      }
    }
  } catch (_) {}

  // 2. Fallback to unified local storage
  if (rawItems.length === 0) {
    rawItems = getUnifiedLocalCart();
  }'''

new_load = '''function loadCheckoutCartSync() {
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
  loadCheckoutCartSync();'''

for sep in ['\n', '\r\n']:
    t = old_load if sep == '\n' else old_load.replace('\n', '\r\n')
    r = new_load if sep == '\n' else new_load.replace('\n', '\r\n')
    if t in checkout_js:
        checkout_js = checkout_js.replace(t, r)
        print("Updated loadCheckoutCart to loadCheckoutCartSync")
        break

with open(checkout_js_path, 'w', encoding='utf-8') as f:
    f.write(checkout_js)

# ==============================================================================
# 3. OPTIMIZE public/js/delivery.js
# ==============================================================================
delivery_js_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/delivery.js'
with open(delivery_js_path, 'r', encoding='utf-8') as f:
    delivery_js = f.read()

# Make delivery initialization immediate
old_deliv_boot = '''document.addEventListener('DOMContentLoaded', () => {
  initDeliveryPage();
});'''

new_deliv_boot = '''if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDeliveryPage);
} else {
  initDeliveryPage();
}'''

for sep in ['\n', '\r\n']:
    t = old_deliv_boot if sep == '\n' else old_deliv_boot.replace('\n', '\r\n')
    r = new_deliv_boot if sep == '\n' else new_deliv_boot.replace('\n', '\r\n')
    if t in delivery_js:
        delivery_js = delivery_js.replace(t, r)
        print("Updated delivery.js immediate boot")
        break

# Remove 350ms artificial delay in confirmDeliveryAddress
old_timeout = '''  // Navigate to Step 3: Order Summary & Payment
  setTimeout(() => {
    window.location.href = '/checkout.html';
  }, 350);'''

new_timeout = '''  // Navigate immediately to Step 3: Order Summary & Payment (Zero delay)
  window.location.href = '/checkout.html';'''

for sep in ['\n', '\r\n']:
    t = old_timeout if sep == '\n' else old_timeout.replace('\n', '\r\n')
    r = new_timeout if sep == '\n' else new_timeout.replace('\n', '\r\n')
    if t in delivery_js:
        delivery_js = delivery_js.replace(t, r)
        print("Removed artificial 350ms delay in delivery.js")
        break

with open(delivery_js_path, 'w', encoding='utf-8') as f:
    f.write(delivery_js)

# ==============================================================================
# 4. OPTIMIZE public/js/cart.js
# ==============================================================================
cart_js_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/cart.js'
with open(cart_js_path, 'r', encoding='utf-8') as f:
    cart_js = f.read()

old_cart_boot = "document.addEventListener('DOMContentLoaded', loadCart);"
new_cart_boot = "if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', loadCart); } else { loadCart(); }"

if old_cart_boot in cart_js:
    cart_js = cart_js.replace(old_cart_boot, new_cart_boot)
    print("Updated cart.js immediate boot")

with open(cart_js_path, 'w', encoding='utf-8') as f:
    f.write(cart_js)

print("All super-fast loading optimizations successfully applied!")
