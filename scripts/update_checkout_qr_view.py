path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/checkout.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''                  <div style="font-size: 0.82rem; color: var(--deliv-text-secondary); line-height: 1.5;">
                    Upon clicking <strong>Pay &amp; Complete Order</strong>, you will be securely redirected to PhonePe's official hosted checkout to complete payment via UPI app, scanned QR code, cards, net banking, or wallets.
                  </div>'''

replacement = '''                  <div style="font-size: 0.82rem; color: var(--deliv-text-secondary); line-height: 1.5;">
                    Upon clicking <strong>Pay &amp; Complete Order</strong>, you will be securely redirected to PhonePe's official hosted checkout to complete payment via UPI app, scanned QR code, cards, net banking, or wallets.
                  </div>
                  <div style="margin-top: 4px;">
                    <button type="button" onclick="var q=document.getElementById('phonepe-qr-preview-box'); if(q){q.style.display=q.style.display==='none'?'block':'none';}" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #ffffff; border: 1px solid rgba(95, 37, 159, 0.25); border-radius: 6px; font-size: 0.76rem; font-weight: 700; color: #5f259f; cursor: pointer; transition: all 0.2s ease;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      <span>Show Terminal QR Code</span>
                    </button>
                    <div id="phonepe-qr-preview-box" style="display: none; margin-top: 10px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                      <img src="/images/phonepe-merchant-qr.jpg" alt="RJ Fashion Official PhonePe QR" style="max-width: 220px; width: 100%; border-radius: 6px; border: 1px solid #cbd5e1; margin: 0 auto; display: block;" loading="lazy">
                      <div style="font-size: 0.72rem; color: #64748b; margin-top: 6px; font-weight: 600;">Scan with PhonePe, GPay, Paytm or any UPI app</div>
                    </div>
                  </div>'''

for sep in ['\n', '\r\n']:
    t = target if sep == '\n' else target.replace('\n', '\r\n')
    r = replacement if sep == '\n' else replacement.replace('\n', '\r\n')
    if t in content:
        content = content.replace(t, r)
        print("Added PhonePe QR preview toggle to checkout.html")
        break

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
