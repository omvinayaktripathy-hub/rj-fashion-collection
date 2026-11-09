path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/checkout.html'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

old_inline = '''            if (itemsEl && items.length > 0) {
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
            }'''

new_inline = '''            if (itemsEl && items.length > 0) {
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
            } else if (itemsEl) {
              itemsEl.innerHTML = '<div style="padding: 24px 16px; text-align: center;"><div style="font-size: 2rem; margin-bottom: 8px;">🛍️</div><p style="font-size: 0.95rem; font-weight: 600; color: var(--deliv-text-primary); margin: 0 0 6px 0;">Your bag is currently empty</p><p style="font-size: 0.82rem; color: var(--deliv-text-secondary); margin: 0 0 16px 0;">Please select your couture pieces before proceeding to checkout.</p><a href="/shop.html" style="display: inline-flex; align-items: center; gap: 8px; background: #111111; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none;"><span>Explore Couture Catalog →</span></a></div>';
              if (countEl) countEl.textContent = '0 items';
            }'''

# Also update addr fallback in inline script
old_addr_inline = '''            if (addrEl && addr) {
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
            }'''

new_addr_inline = '''            if (addrEl && addr) {
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
            } else if (addrEl) {
              addrEl.innerHTML = '<div style="background: rgba(0,0,0,0.02); border: 1.5px dashed var(--deliv-card-border); border-radius: 12px; padding: 22px 18px; text-align: center;"><div style="font-size: 1.6rem; margin-bottom: 6px;">📍</div><p style="font-size: 0.95rem; font-weight: 600; color: var(--deliv-text-primary); margin: 0 0 6px 0;">Please select or add a delivery address to complete your order</p><p style="font-size: 0.82rem; color: var(--deliv-text-secondary); margin: 0 0 16px 0;">Your haute couture en route requires a verified recipient name, doorstep address, and contact number.</p><a href="/delivery.html" style="display: inline-flex; align-items: center; gap: 8px; background: #111111; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none;"><span>Select or Add Delivery Address →</span></a></div>';
            }'''

for sep in ['\n', '\r\n']:
    t_i = old_inline if sep == '\n' else old_inline.replace('\n', '\r\n')
    r_i = new_inline if sep == '\n' else new_inline.replace('\n', '\r\n')
    if t_i in c:
        c = c.replace(t_i, r_i)
        print("Updated inline empty bag handler in checkout.html")
        break

for sep in ['\n', '\r\n']:
    t_a = old_addr_inline if sep == '\n' else old_addr_inline.replace('\n', '\r\n')
    r_a = new_addr_inline if sep == '\n' else new_addr_inline.replace('\n', '\r\n')
    if t_a in c:
        c = c.replace(t_a, r_a)
        print("Updated inline addr fallback in checkout.html")
        break

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("checkout.html zero-delay bootstrapper enhanced!")
