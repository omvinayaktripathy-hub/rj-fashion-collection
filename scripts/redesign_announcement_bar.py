import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
VERSION = "20261025-01"

NEW_ANNOUNCEMENT_HTML = '''  <!-- Premium Luxury Announcement Bar -->
  <aside class="top-bar" id="announcement-bar" aria-label="Announcement">
    <div class="top-bar-inner">
      <span class="top-bar-brand">RJ FASHION COLLECTION</span>
      <span class="top-bar-sep" aria-hidden="true">•</span>
      <span class="top-bar-content" id="announcement-text">
        <span class="top-bar-msg">INTRODUCING THE NEW RJ FASHION COLLECTION</span>
        <span class="top-bar-sep" aria-hidden="true">•</span>
        <span class="top-bar-perk">COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999</span>
        <span class="top-bar-code-pill" onclick="copyPromoCode('GRANDRJ')" title="Click to copy coupon code GRANDRJ" role="button" tabindex="0">
          <span class="code-label">USE CODE:</span>
          <strong class="code-val">GRANDRJ</strong>
          <span class="code-copy-tip" id="code-copy-tip">COPIED</span>
        </span>
      </span>
    </div>
  </aside>'''

def update_style_css():
    path = os.path.join(BASE_DIR, "public", "css", "style.css")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    new_css = '''/* ===================================================================
   PREMIUM LUXURY ANNOUNCEMENT BAR — RJ FASHION COLLECTION
   Refined Deep Espresso / Editorial Black with Champagne Gold Accents
   =================================================================== */
.top-bar {
  background: #171715;
  color: #FFFFFF;
  font-family: var(--font-sans);
  font-size: 0.74rem;
  letter-spacing: 0.8px;
  font-weight: 500;
  padding: 9px 20px;
  border-bottom: 1px solid rgba(189, 164, 119, 0.3);
  position: relative;
  z-index: 100;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.25s ease;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

[data-theme="dark"] .top-bar,
.dark-theme .top-bar {
  background: #11100F;
  border-bottom-color: rgba(189, 164, 119, 0.35);
}

.top-bar-inner {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  text-align: center;
  line-height: 1.4;
}

.top-bar-brand {
  font-family: 'Cinzel', var(--font-serif), Georgia, serif;
  font-weight: 700;
  font-size: 0.77rem;
  letter-spacing: 2px;
  color: #BDA477;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.top-bar-brand::before {
  content: '✦';
  font-size: 0.65rem;
  color: #BDA477;
}

.top-bar-sep {
  color: rgba(189, 164, 119, 0.55);
  font-size: 0.75rem;
  user-select: none;
  margin: 0 2px;
}

.top-bar-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.top-bar-msg {
  color: #FFFFFF;
  font-weight: 600;
  letter-spacing: 0.6px;
}

.top-bar-perk {
  color: #F2EDE4;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.top-bar-code-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(189, 164, 119, 0.12);
  border: 1px solid rgba(189, 164, 119, 0.45);
  padding: 2px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  user-select: none;
  vertical-align: middle;
}

.top-bar-code-pill:hover {
  background: rgba(189, 164, 119, 0.25);
  border-color: #BDA477;
  box-shadow: 0 0 12px rgba(189, 164, 119, 0.35);
  transform: translateY(-1px);
}

.top-bar-code-pill .code-label {
  font-size: 0.64rem;
  color: #E4D7C6;
  font-weight: 600;
  letter-spacing: 0.8px;
}

.top-bar-code-pill .code-val {
  font-size: 0.72rem;
  color: #BDA477;
  font-weight: 800;
  letter-spacing: 1px;
}

.code-copy-tip {
  display: none;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(5px);
  background: #BDA477;
  color: #171715;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  z-index: 10;
}

.code-copy-tip.show {
  display: block;
}

/* Responsive Announcement Bar */
@media (max-width: 992px) {
  .top-bar {
    padding: 8px 14px;
    font-size: 0.72rem;
    letter-spacing: 0.5px;
  }
  .top-bar-inner {
    gap: 8px;
  }
}

@media (max-width: 680px) {
  .top-bar {
    padding: 8px 12px;
  }
  .top-bar-inner {
    flex-direction: column;
    gap: 4px;
  }
  .top-bar-brand {
    font-size: 0.74rem;
    letter-spacing: 1.4px;
  }
  .top-bar-sep {
    display: none;
  }
  .top-bar-content {
    flex-direction: column;
    gap: 4px;
  }
  .top-bar-msg {
    font-size: 0.70rem;
  }
  .top-bar-perk {
    font-size: 0.68rem;
  }
}'''

    # Clean existing top-bar and top-bar-badge definitions in style.css
    content = re.sub(r'\/\* =+ TOP PROMO ANNOUNCEMENT BAR =+ \*\/.*?\.top-bar span \{[^\}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\/\* Grand Opening Announcement Bar \*\/.*?\.top-bar-badge \{[^\}]*\}', '', content, flags=re.DOTALL)

    content += "\n" + new_css

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated style.css with sleek luxury announcement bar styles!")

def update_app_js():
    path = os.path.join(BASE_DIR, "public", "js", "app.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    copy_promo_func = '''
// Announcement Bar Copy Promo Code Helper
function copyPromoCode(code) {
  if (!code) code = 'GRANDRJ';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).catch(function() {});
  }
  document.querySelectorAll('.code-copy-tip').forEach(function(tip) {
    tip.classList.add('show');
    setTimeout(function() { tip.classList.remove('show'); }, 1800);
  });
  if (typeof showToast === 'function') {
    showToast('Promo code ' + code + ' copied to clipboard!', 'success');
  }
}
window.copyPromoCode = copyPromoCode;
'''

    if "function copyPromoCode" not in content:
        content += "\n" + copy_promo_func
        with open(path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(content)
        print("Added copyPromoCode to app.js!")

def update_index_html():
    path = os.path.join(BASE_DIR, "public", "index.html")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace old announcement bar
    old_announcement_pattern = re.compile(r'<!-- Top Announcement Bar -->\s*<div class="top-bar"[^>]*>.*?<\/div>', re.DOTALL)
    if old_announcement_pattern.search(content):
        content = old_announcement_pattern.sub(NEW_ANNOUNCEMENT_HTML, content)
        print("Replaced announcement bar in index.html!")

    # Replace any RJ SIGNATURE in hero badge
    content = content.replace(
        '<span id="hero-badge-text">INTRODUCING RJ SIGNATURE</span>',
        '<span id="hero-badge-text">RJ FASHION COLLECTION</span>'
    )
    content = content.replace(
        '<span class="top-bar-badge">RJ SIGNATURE</span>',
        ''
    )

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated index.html!")

def update_all_html_announcement_bars():
    public_dir = os.path.join(BASE_DIR, "public")
    html_files = [f for f in os.listdir(public_dir) if f.endswith(".html") and f != "index.html"]

    for filename in html_files:
        filepath = os.path.join(public_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        # Match top-bar divs
        old_pattern = re.compile(r'<!-- Top Announcement Bar -->\s*<div class="top-bar"[^>]*>.*?<\/div>|<div class="top-bar"[^>]*>.*?<\/div>', re.DOTALL)
        if old_pattern.search(html):
            html = old_pattern.sub(NEW_ANNOUNCEMENT_HTML, html, count=1)

        # Bump cache version
        html = re.sub(r'(\.(?:js|css))\?v=[a-zA-Z0-9_-]+', rf'\1?v={VERSION}', html)

        with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(html)
        print(f"Updated announcement bar & version in {filename}")

def update_admin_files():
    # admin.js
    admin_js_path = os.path.join(BASE_DIR, "public", "js", "admin.js")
    with open(admin_js_path, "r", encoding="utf-8") as f:
        admin_js = f.read()

    admin_js = admin_js.replace(
        "announcement_text: 'THE GRAND OPENING — COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ'",
        "announcement_text: 'INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ'"
    )
    admin_js = admin_js.replace(
        '<span style="background: #c5a059; color: #111; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 3px;">GRAND OPENING</span>',
        '<span style="color: #BDA477; font-weight: 700; letter-spacing: 1.8px;">✦ RJ FASHION COLLECTION</span> •'
    )
    with open(admin_js_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(admin_js)
    print("Updated admin.js defaults!")

    # admin.html
    admin_html_path = os.path.join(BASE_DIR, "public", "admin.html")
    with open(admin_html_path, "r", encoding="utf-8") as f:
        admin_html = f.read()
    admin_html = admin_html.replace(
        'value="THE GRAND OPENING - COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ?999 | CODE: GRANDRJ"',
        'value="INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ"'
    )
    with open(admin_html_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(admin_html)
    print("Updated admin.html defaults!")

if __name__ == '__main__':
    update_style_css()
    update_app_js()
    update_index_html()
    update_all_html_announcement_bars()
    update_admin_files()
