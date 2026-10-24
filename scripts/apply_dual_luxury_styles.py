import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
VERSION = "20261024-07"

def update_style_css():
    path = os.path.join(BASE_DIR, "public", "css", "style.css")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    dual_style_css = '''
/* ===================================================================
   DUAL-STYLE LUXURY EXPERIENCE:
   STYLE A (QUIET LUXURY - IVORY & BEIGE) & STYLE B (EDITORIAL IMPACT - BOLD MODERN)
   =================================================================== */

/* Common Luxury Style Switcher Pill */
.luxury-style-switcher {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--dark);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.4px;
  user-select: none;
  white-space: nowrap;
}

.luxury-style-switcher:hover {
  border-color: var(--gold);
  background: var(--bg-white);
  box-shadow: 0 4px 14px rgba(194, 168, 120, 0.2);
  transform: translateY(-1px);
}

.style-switcher-icon {
  color: var(--gold);
  font-size: 0.82rem;
}

/* STYLE A: QUIET LUXURY (Minimal Ivory & Soft Beige) */
[data-luxury-style="quiet-luxury"],
body.style-quiet-luxury {
  --bg-page: #FAF8F3;
  --bg-subtle: #F5EFEB;
  --bg-card: #FFFFFF;
  --border: #E8DECE;
  --border-subtle: rgba(48, 39, 32, 0.06);
  --dark: #2B2520;
  --muted: #82786F;
  --primary: #3A3028;
  --primary-hover: #211B16;
  --gold: #C2A878;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}

[data-luxury-style="quiet-luxury"] .grand-hero-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.9rem;
  font-weight: 600;
  letter-spacing: -0.2px;
}

[data-luxury-style="quiet-luxury"] .section-title {
  font-family: 'Playfair Display', Georgia, serif;
  letter-spacing: 0.2px;
  text-transform: none;
}

[data-luxury-style="quiet-luxury"] .product-card {
  border-radius: 10px;
  border-color: #E8DECE;
  box-shadow: 0 2px 8px rgba(48, 39, 32, 0.03);
}

/* STYLE B: EDITORIAL IMPACT (Bold Modern Fashion Editorial) */
[data-luxury-style="editorial-impact"],
body.style-editorial-impact {
  --bg-page: #FAF8F3;
  --bg-subtle: #F2EDE4;
  --bg-card: #FFFFFF;
  --border: #D8CABE;
  --border-subtle: rgba(23, 23, 21, 0.12);
  --dark: #171715;
  --muted: #6B6259;
  --primary: #171715;
  --primary-hover: #302720;
  --gold: #C2A878;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
}

[data-luxury-style="editorial-impact"] .grand-hero-title {
  font-family: 'Cormorant Garamond', 'Cinzel', Georgia, serif;
  font-size: 3.6rem;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.05;
  text-transform: uppercase;
}

[data-luxury-style="editorial-impact"] .grand-opening-tag {
  letter-spacing: 3px;
  background: rgba(23, 23, 21, 0.7);
  border-color: #C2A878;
  color: #FBF8F2;
}

[data-luxury-style="editorial-impact"] .section-title {
  font-family: 'Cormorant Garamond', 'Cinzel', Georgia, serif;
  font-size: 2.1rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

[data-luxury-style="editorial-impact"] .product-card {
  border: 1px solid #D8CABE;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(23, 23, 21, 0.05);
}

[data-luxury-style="editorial-impact"] .product-card:hover {
  border-color: #C2A878;
  box-shadow: 0 12px 28px rgba(23, 23, 21, 0.12);
  transform: translateY(-4px);
}

[data-luxury-style="editorial-impact"] .our-story-title {
  font-family: 'Cormorant Garamond', 'Cinzel', serif;
  letter-spacing: 2px;
  font-size: 2.8rem;
}
'''

    if "/* ===================================================================\n   DUAL-STYLE LUXURY EXPERIENCE" not in content:
        content += "\n" + dual_style_css
        with open(path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(content)
        print("Appended Dual-Style Luxury Experience CSS to style.css!")
    else:
        print("Dual-Style Luxury Experience CSS already present in style.css!")

def update_app_js():
    path = os.path.join(BASE_DIR, "public", "js", "app.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    dual_style_js = '''
// ===================================================================
// DUAL-STYLE LUXURY EXPERIENCE CONTROLLER
// Style A: Quiet Luxury (Minimal Ivory & Soft Beige)
// Style B: Editorial Impact (Bold Modern Fashion Editorial)
// ===================================================================

function initLuxuryStyle() {
  let saved = 'editorial-impact';
  try {
    saved = localStorage.getItem('rjfc_luxury_style') || 'editorial-impact';
  } catch (_) {}
  applyLuxuryStyle(saved, false);
}

function applyLuxuryStyle(styleName, showNotification = true) {
  const isEditorial = styleName === 'editorial-impact';
  const targetStyle = isEditorial ? 'editorial-impact' : 'quiet-luxury';

  document.documentElement.setAttribute('data-luxury-style', targetStyle);
  if (document.body) {
    if (isEditorial) {
      document.body.classList.add('style-editorial-impact');
      document.body.classList.remove('style-quiet-luxury');
    } else {
      document.body.classList.add('style-quiet-luxury');
      document.body.classList.remove('style-editorial-impact');
    }
  }

  try {
    localStorage.setItem('rjfc_luxury_style', targetStyle);
  } catch (_) {}

  // Update UI indicators
  document.querySelectorAll('.style-switcher-text, #luxury-style-text').forEach(el => {
    el.textContent = isEditorial ? 'Editorial Impact' : 'Quiet Luxury';
  });
  document.querySelectorAll('#rj-mobile-style-text').forEach(el => {
    el.textContent = isEditorial ? '✦ Style: Editorial Impact' : '✦ Style: Quiet Luxury';
  });
  document.querySelectorAll('.luxury-style-switcher').forEach(el => {
    el.setAttribute('title', isEditorial ? 'Switch to Quiet Luxury (Minimal Ivory & Beige)' : 'Switch to Editorial Impact (Bold Modern)');
    el.setAttribute('data-current-style', targetStyle);
  });

  if (showNotification && typeof showToast === 'function') {
    showToast(isEditorial ? '✨ Editorial Impact style activated' : '🕊️ Quiet Luxury style activated', 'info');
  }
}

function toggleLuxuryStyle() {
  const current = document.documentElement.getAttribute('data-luxury-style') || 'editorial-impact';
  const next = current === 'editorial-impact' ? 'quiet-luxury' : 'editorial-impact';
  applyLuxuryStyle(next, true);
}

window.initLuxuryStyle = initLuxuryStyle;
window.applyLuxuryStyle = applyLuxuryStyle;
window.toggleLuxuryStyle = toggleLuxuryStyle;

// Run initial check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLuxuryStyle);
} else {
  initLuxuryStyle();
}
'''

    if "DUAL-STYLE LUXURY EXPERIENCE CONTROLLER" not in content:
        content += "\n" + dual_style_js
        with open(path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(content)
        print("Appended Dual-Style Luxury Controller to app.js!")
    else:
        print("Dual-Style Luxury Controller already present in app.js!")

def update_mobile_nav_js():
    path = os.path.join(BASE_DIR, "public", "js", "mobile-nav.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_footer_drawer = '''      <div class="rj-drawer-footer">
        <div class="rj-drawer-theme-toggle" onclick="if(window.toggleTheme) window.toggleTheme();">
          <span>🌓 Switch Dark / Light Theme</span>
        </div>'''

    new_footer_drawer = '''      <div class="rj-drawer-footer">
        <div class="rj-drawer-theme-toggle" onclick="if(window.toggleLuxuryStyle) window.toggleLuxuryStyle();" style="margin-bottom: 8px;">
          <span id="rj-mobile-style-text">✦ Style: Editorial Impact</span>
        </div>
        <div class="rj-drawer-theme-toggle" onclick="if(window.toggleTheme) window.toggleTheme();">
          <span>🌓 Switch Dark / Light Theme</span>
        </div>'''

    if old_footer_drawer in content:
        content = content.replace(old_footer_drawer, new_footer_drawer)
        with open(path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(content)
        print("Updated mobile-nav.js drawer footer with luxury style switcher!")
    else:
        print("mobile-nav.js already contains or matches new footer pattern.")

def update_html_header_actions():
    public_dir = os.path.join(BASE_DIR, "public")
    html_files = [f for f in os.listdir(public_dir) if f.endswith(".html")]

    switcher_html = '''        <!-- Dual-Style Luxury Experience Toggle (Option A: Quiet Luxury / Option B: Editorial Impact) -->
        <div class="luxury-style-switcher" onclick="toggleLuxuryStyle()" role="button" tabindex="0" title="Switch between Quiet Luxury and Editorial Impact styles">
          <span class="style-switcher-icon">✦</span>
          <span class="style-switcher-text" id="luxury-style-text">Editorial Impact</span>
        </div>\n'''

    count = 0
    for filename in html_files:
        filepath = os.path.join(public_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        # Insert switcher before theme-switch-container if not already present
        if "luxury-style-switcher" not in html and '<div class="theme-switch-container"' in html:
            html = html.replace('<div class="theme-switch-container"', switcher_html + '        <div class="theme-switch-container"', 1)
            count += 1

        # Also bump cache version query string
        html = re.sub(r'(\.(?:js|css))\?v=[a-zA-Z0-9_-]+', rf'\1?v={VERSION}', html)

        with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(html)

    print(f"Added luxury-style-switcher to {count} HTML files and bumped version to {VERSION}!")

if __name__ == '__main__':
    update_style_css()
    update_app_js()
    update_mobile_nav_js()
    update_html_header_actions()
