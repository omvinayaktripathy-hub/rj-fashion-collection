import re

# 1. Update public/cart.html
cart_html_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/cart.html'
with open(cart_html_path, 'r', encoding='utf-8') as f:
    cart_html = f.read()

inline_cart_marker = '<aside class="cart-right-column">'
inline_cart_boot = '''<script>
        // Instant Zero-Delay First Paint for Shopping Cart
        (function() {
          try {
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
            var listEl = document.getElementById('cart-items-list');
            var subtotalEl = document.getElementById('cart-subtotal-display');
            var totalEl = document.getElementById('cart-grand-total-display');
            var countEl = document.getElementById('cart-heading-item-count');
            if (listEl && items.length > 0) {
              var subtotal = 0;
              var totalQty = 0;
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
                html += '<div class="cart-item-card" style="display:flex;gap:16px;padding:16px;border-bottom:1px solid #e5e0d8;align-items:center;">' +
                  '<img src="' + img + '" alt="' + itName + '" style="width:80px;height:106px;aspect-ratio:3/4;object-fit:cover;border-radius:6px;flex-shrink:0;">' +
                  '<div style="flex:1;min-width:0;"><h3 style="font-size:0.98rem;font-weight:600;font-family:serif;margin:0 0 4px 0;">' + itName + '</h3>' +
                  '<div style="font-size:0.82rem;color:#6b7280;">Size: ' + itSize + ' • Qty: ' + q + '</div>' +
                  '<div style="font-weight:700;font-family:monospace;font-size:1.05rem;color:#111;margin-top:6px;">₹' + Math.round(pr * q).toLocaleString('en-IN') + '</div></div></div>';
              }
              listEl.innerHTML = html;
              if (subtotalEl) subtotalEl.textContent = '₹' + Math.round(subtotal).toLocaleString('en-IN');
              if (totalEl) totalEl.textContent = '₹' + Math.round(subtotal).toLocaleString('en-IN');
              if (countEl) countEl.textContent = '[ ' + totalQty + (totalQty === 1 ? ' Item ]' : ' Items ]');
            }
          } catch(e) {}
        })();
        </script>
        <aside class="cart-right-column">'''

if inline_cart_marker in cart_html and 'Instant Zero-Delay First Paint for Shopping Cart' not in cart_html:
    cart_html = cart_html.replace(inline_cart_marker, inline_cart_boot)
    print("Added instant bootstrapper to cart.html")

cart_html = re.sub(r'cart\.js\?v=[a-zA-Z0-9_\-]+', 'cart.js?v=20261109-fast-boot', cart_html)

with open(cart_html_path, 'w', encoding='utf-8') as f:
    f.write(cart_html)

# 2. Update public/js/cart.js to render local items synchronously first
cart_js_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/cart.js'
with open(cart_js_path, 'r', encoding='utf-8') as f:
    cart_js = f.read()

old_cart_fetch = '''    // 1. Load Cart Data (API with graceful localStorage fallback)
    let items = [];
    try {
      if (window.isStaticHosting) throw new Error('static');
      const res = await fetch(`${API_BASE}/cart`);
      if (res.ok) {
        const apiData = await res.json();
        if (apiData && apiData.success && Array.isArray(apiData.items) && apiData.items.length > 0) {
          items = apiData.items.map(normalizeCartItemSafe).filter(Boolean);
          // Mirror active server session to local storage
          saveUnifiedLocalCart(items);
        }
      }
    } catch (_) {}

    // Fallback to unified localStorage if API returned nothing or was empty
    if (!items || items.length === 0) {
      items = getUnifiedLocalCart();
    }'''

new_cart_fetch = '''    // 1. Instant Zero-Delay Local Storage First (0ms)
    let items = getUnifiedLocalCart();

    // In background on dynamic server, mirror server state if available
    if (!window.isStaticHosting && items.length === 0) {
      try {
        const res = await fetch(`${API_BASE}/cart`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && apiData.success && Array.isArray(apiData.items) && apiData.items.length > 0) {
            items = apiData.items.map(normalizeCartItemSafe).filter(Boolean);
            saveUnifiedLocalCart(items);
          }
        }
      } catch (_) {}
    }'''

for sep in ['\n', '\r\n']:
    t = old_cart_fetch if sep == '\n' else old_cart_fetch.replace('\n', '\r\n')
    r = new_cart_fetch if sep == '\n' else new_cart_fetch.replace('\n', '\r\n')
    if t in cart_js:
        cart_js = cart_js.replace(t, r)
        print("Updated cart.js to local-storage-first zero delay")
        break

with open(cart_js_path, 'w', encoding='utf-8') as f:
    f.write(cart_js)

print("Cart speed optimizations complete")
