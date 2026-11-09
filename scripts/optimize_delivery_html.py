import re

path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/delivery.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '<!-- CARD 3: EXPRESS COURIER & TRANSIT GUARANTEE -->'
replacement = '''<script>
        // Instant Zero-Delay First Paint for Delivery Bag Preview
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
            var itemsEl = document.getElementById('delivery-order-items-preview');
            var badgeEl = document.getElementById('deliv-items-count-badge');
            if (itemsEl && items.length > 0) {
              var totalQty = 0;
              var html = '';
              for (var k = 0; k < items.length; k++) {
                var it = items[k];
                var q = Math.max(1, Number(it.quantity) || 1);
                var pr = Number(it.price) || 0;
                totalQty += q;
                var img = it.image || it.thumbnail || (Array.isArray(it.images) && it.images[0]) || '/images/placeholder.jpg';
                var itName = it.name || it.title || 'Artisanal Ensemble';
                var itSize = it.size || it.selected_size || 'Free Size';
                html += '<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--deliv-card-border);">' +
                  '<img src="' + img + '" alt="' + itName + '" style="width:48px;height:64px;aspect-ratio:3/4;object-fit:cover;border-radius:4px;flex-shrink:0;">' +
                  '<div style="flex:1;min-width:0;"><div style="font-size:0.88rem;font-weight:600;color:var(--deliv-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + itName + '</div>' +
                  '<div style="font-size:0.78rem;color:var(--deliv-text-secondary);">Size: ' + itSize + ' • Qty: ' + q + '</div></div>' +
                  '<div style="font-weight:700;font-family:monospace;font-size:0.9rem;color:var(--deliv-text-primary);">₹' + Math.round(pr * q).toLocaleString('en-IN') + '</div></div>';
              }
              itemsEl.innerHTML = html;
              if (badgeEl) badgeEl.textContent = totalQty;
            }
          } catch(e) {}
        })();
        </script>
        <!-- CARD 3: EXPRESS COURIER & TRANSIT GUARANTEE -->'''

if target in content and 'Instant Zero-Delay First Paint for Delivery Bag Preview' not in content:
    content = content.replace(target, replacement)
    print("Added instant bootstrapper to delivery.html")

content = re.sub(r'delivery\.js\?v=[a-zA-Z0-9_\-]+', 'delivery.js?v=20261109-fast-boot', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated delivery.html successfully")
