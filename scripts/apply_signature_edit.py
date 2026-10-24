import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
VERSION = "20261024-08"

def update_style_css():
    path = os.path.join(BASE_DIR, "public", "css", "style.css")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update Core Design Tokens
    old_root_pattern = re.compile(r':root\s*\{.*?\/\* Neutrals \*\/', re.DOTALL)
    new_root_tokens = ''':root {
  /* RJ SIGNATURE CORE COLORS */
  --bg-page: #FAF8F4;          /* Porcelain Ivory */
  --bg-subtle: #F2EDE4;        /* Soft Cream */
  --bg-sand: #E4D7C6;          /* Sand Beige */
  --bg-white: #FFFFFF;         /* Pure White */
  --bg-card: #FFFFFF;

  --dark: #171715;             /* Editorial Black */
  --dark-espresso: #302720;    /* Deep Espresso */
  --dark-light: #302720;
  --dark-subtle: #5A524A;
  --taupe: #A49685;            /* Warm Taupe */

  --primary: #302720;          /* Deep Espresso */
  --primary-hover: #171715;    /* Editorial Black */
  --primary-gradient: linear-gradient(135deg, #302720 0%, #171715 100%);
  --primary-light: #F2EDE4;
  --primary-subtle: rgba(48, 39, 32, 0.08);

  --accent-burgundy: #72132A;  /* Royal Heritage Accent */
  --gold: #BDA477;             /* Champagne Accent */
  --gold-hover: #A98F61;
  --gold-gradient: linear-gradient(135deg, #BDA477 0%, #D8C296 100%);
  --gold-light: #FAF6ED;
  --gold-subtle: rgba(189, 164, 119, 0.16);

  --champagne: #BDA477;
  --champagne-light: #FBF8F2;
  --champagne-border: #E8DECE;

  /* Neutrals */'''

    if old_root_pattern.search(content):
        content = old_root_pattern.sub(new_root_tokens, content, count=1)

    # 2. Add Experience Modal CSS if not present
    exp_modal_css = '''
/* ===================================================================
   RJ SIGNATURE - CHOOSE YOUR EXPERIENCE (MODAL & THEME CONTROLS)
   =================================================================== */
.exp-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(23, 23, 21, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.exp-modal-backdrop.is-open {
  opacity: 1;
  visibility: visible;
}

.exp-modal-card {
  background: #FAF8F4;
  border: 1px solid #E4D7C6;
  border-radius: 14px;
  max-width: 760px;
  width: 100%;
  padding: 36px 32px;
  position: relative;
  box-shadow: 0 24px 60px rgba(23, 23, 21, 0.3);
  transform: translateY(16px) scale(0.98);
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.exp-modal-backdrop.is-open .exp-modal-card {
  transform: translateY(0) scale(1);
}

.exp-modal-header {
  text-align: center;
  margin-bottom: 28px;
  position: relative;
}

.exp-modal-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 2px;
  font-weight: 800;
  color: #BDA477;
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}

.exp-modal-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 2.1rem;
  font-weight: 700;
  color: #171715;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.exp-modal-desc {
  font-size: 0.88rem;
  color: #6B6259;
  max-width: 540px;
  margin: 0 auto;
  line-height: 1.55;
}

.exp-modal-close {
  position: absolute;
  top: -12px;
  right: -8px;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #6B6259;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  transition: color 0.2s;
}

.exp-modal-close:hover {
  color: #171715;
}

.exp-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 640px) {
  .exp-options-grid {
    grid-template-columns: 1fr;
  }
  .exp-modal-card {
    padding: 24px 18px;
  }
}

.exp-card {
  background: #FFFFFF;
  border: 2px solid #E4D7C6;
  border-radius: 10px;
  padding: 24px 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.exp-card:hover {
  border-color: #BDA477;
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(48, 39, 32, 0.08);
}

.exp-card.is-selected {
  border-color: #BDA477;
  background: #FCFAF7;
  box-shadow: 0 0 0 3px rgba(189, 164, 119, 0.25);
}

.exp-card-badge {
  font-size: 0.68rem;
  letter-spacing: 1.5px;
  font-weight: 800;
  color: #BDA477;
  margin-bottom: 12px;
}

.exp-card-preview {
  height: 48px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #E4D7C6;
}

.quiet-luxury-preview {
  background: #FAF8F4;
}

.editorial-impact-preview {
  background: #171715;
}

.preview-palette {
  display: flex;
  gap: 8px;
}

.preview-palette span {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

.exp-card-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 1.45rem;
  font-weight: 700;
  color: #171715;
  margin: 0 0 8px 0;
}

.exp-card-sub {
  font-size: 0.82rem;
  color: #6B6259;
  line-height: 1.5;
  margin-bottom: 18px;
  flex: 1;
}

.exp-card-btn {
  background: #F2EDE4;
  border: 1px solid #E4D7C6;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #302720;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.exp-card:hover .exp-card-btn,
.exp-card.is-selected .exp-card-btn {
  background: #171715;
  color: #FFFFFF;
  border-color: #171715;
}
'''

    if ".exp-modal-backdrop" not in content:
        content += "\n" + exp_modal_css

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated style.css with RJ SIGNATURE design system & experience modal!")

def update_app_js():
    path = os.path.join(BASE_DIR, "public", "js", "app.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    new_controller_code = '''// ===================================================================
// DUAL-STYLE LUXURY EXPERIENCE CONTROLLER (RJ SIGNATURE)
// 01. QUIET LUXURY — minimal ivory and beige
// 02. EDITORIAL IMPACT — bold modern fashion editorial
// Selector: "CHOOSE YOUR EXPERIENCE"
// ===================================================================

function openExperienceModal() {
  let modal = document.getElementById('experience-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'experience-modal';
    modal.className = 'exp-modal-backdrop';
    modal.onclick = function(e) { if (e.target === modal) closeExperienceModal(); };
    modal.innerHTML = `
      <div class="exp-modal-card" onclick="event.stopPropagation()">
        <div class="exp-modal-header">
          <span class="exp-modal-eyebrow">THE SIGNATURE EDIT</span>
          <h3 class="exp-modal-title">CHOOSE YOUR EXPERIENCE</h3>
          <p class="exp-modal-desc">Explore two distinct aesthetic expressions of RJ Fashion Collection. Switch anytime without losing your cart or browsing state.</p>
          <button type="button" class="exp-modal-close" onclick="closeExperienceModal()">&times;</button>
        </div>
        <div class="exp-options-grid">
          <!-- Option 1: Quiet Luxury -->
          <div class="exp-card" id="exp-card-quiet-luxury" onclick="selectExperience('quiet-luxury')">
            <div class="exp-card-badge">THEME 01</div>
            <div class="exp-card-preview quiet-luxury-preview">
              <div class="preview-palette">
                <span style="background: #FAF8F4;" title="Porcelain Ivory"></span>
                <span style="background: #F2EDE4;" title="Soft Cream"></span>
                <span style="background: #E4D7C6;" title="Sand Beige"></span>
                <span style="background: #BDA477;" title="Champagne Accent"></span>
              </div>
            </div>
            <h4 class="exp-card-title">Quiet Luxury</h4>
            <p class="exp-card-sub">Minimal Porcelain Ivory, soft cream surfaces, refined serif typography, and understated champagne accents. Serene and timeless.</p>
            <button type="button" class="exp-card-btn">Select Quiet Luxury</button>
          </div>

          <!-- Option 2: Editorial Impact -->
          <div class="exp-card" id="exp-card-editorial-impact" onclick="selectExperience('editorial-impact')">
            <div class="exp-card-badge">THEME 02</div>
            <div class="exp-card-preview editorial-impact-preview">
              <div class="preview-palette">
                <span style="background: #171715;" title="Editorial Black"></span>
                <span style="background: #302720;" title="Deep Espresso"></span>
                <span style="background: #FAF8F4;" title="Porcelain Ivory"></span>
                <span style="background: #BDA477;" title="Champagne Accent"></span>
              </div>
            </div>
            <h4 class="exp-card-title">Editorial Impact</h4>
            <p class="exp-card-sub">Bold display headlines, high-impact fashion photography, split-screen compositions, and high-contrast editorial drama.</p>
            <button type="button" class="exp-card-btn">Select Editorial Impact</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const current = document.documentElement.getAttribute('data-luxury-style') || 'editorial-impact';
  const cardQuiet = modal.querySelector('#exp-card-quiet-luxury');
  const cardEdit = modal.querySelector('#exp-card-editorial-impact');
  if (cardQuiet) cardQuiet.classList.toggle('is-selected', current === 'quiet-luxury');
  if (cardEdit) cardEdit.classList.toggle('is-selected', current === 'editorial-impact');

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeExperienceModal() {
  const modal = document.getElementById('experience-modal');
  if (modal) modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

function selectExperience(styleName) {
  applyLuxuryStyle(styleName, true);
  closeExperienceModal();
}

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
  const displayName = isEditorial ? 'Editorial Impact' : 'Quiet Luxury';

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
    el.innerHTML = `CHOOSE YOUR EXPERIENCE: <strong>${displayName}</strong>`;
  });
  document.querySelectorAll('#rj-mobile-style-text').forEach(el => {
    el.textContent = `✦ Experience: ${displayName}`;
  });
  document.querySelectorAll('.luxury-style-switcher').forEach(el => {
    el.setAttribute('title', `Choose Your Experience (Current: ${displayName})`);
    el.setAttribute('data-current-style', targetStyle);
  });

  if (showNotification && typeof showToast === 'function') {
    showToast(isEditorial ? '✨ Theme: Editorial Impact activated' : '🕊️ Theme: Quiet Luxury activated', 'info');
  }
}

function toggleLuxuryStyle() {
  openExperienceModal();
}

window.openExperienceModal = openExperienceModal;
window.closeExperienceModal = closeExperienceModal;
window.selectExperience = selectExperience;
window.initLuxuryStyle = initLuxuryStyle;
window.applyLuxuryStyle = applyLuxuryStyle;
window.toggleLuxuryStyle = toggleLuxuryStyle;

// Run initial check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLuxuryStyle);
} else {
  initLuxuryStyle();
}'''

    # Replace existing DUAL-STYLE block in app.js
    pattern = re.compile(r'\/\/ ===================================================================\s*\/\/ DUAL-STYLE LUXURY EXPERIENCE CONTROLLER.*?(?=\n\n|\Z)', re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(new_controller_code, content)
        print("Replaced Dual-Style Controller in app.js!")
    else:
        content += "\n" + new_controller_code
        print("Appended Dual-Style Controller to app.js!")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)

def update_index_html():
    path = os.path.join(BASE_DIR, "public", "index.html")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update announcement bar badge to RJ SIGNATURE
    content = content.replace(
        '<span class="top-bar-badge">GRAND OPENING</span>',
        '<span class="top-bar-badge">RJ SIGNATURE</span>'
    )

    # 2. Update Hero Campaign Label, Headline, and Supporting Copy
    old_hero = '''          <div class="grand-opening-tag">
            <span class="pulse-dot"></span>
            <span id="hero-badge-text">GRAND OPENING</span>
          </div>
          <h1 class="grand-hero-title" id="hero-headline-text">STYLE, REDEFINED.</h1>
          <p class="grand-hero-subtitle" id="hero-subtitle-text">A considered collection. A timeless point of view. Discover the next chapter of RJ Fashion Collection.</p>'''

    new_hero = '''          <div class="grand-opening-tag">
            <span class="pulse-dot"></span>
            <span id="hero-badge-text">INTRODUCING RJ SIGNATURE</span>
          </div>
          <h1 class="grand-hero-title" id="hero-headline-text">STYLE, REDEFINED.</h1>
          <p class="grand-hero-subtitle" id="hero-subtitle-text">A new perspective on modern fashion. Discover the signature edit from RJ Fashion Collection.</p>'''

    if old_hero in content:
        content = content.replace(old_hero, new_hero)
        print("Updated Hero badge and copy in index.html!")

    # 3. Update style switcher text to "CHOOSE YOUR EXPERIENCE"
    content = content.replace(
        '<span class="style-switcher-text" id="luxury-style-text">Editorial Impact</span>',
        '<span class="style-switcher-text" id="luxury-style-text">CHOOSE YOUR EXPERIENCE: <strong>Editorial Impact</strong></span>'
    )

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)

def update_all_html_files():
    public_dir = os.path.join(BASE_DIR, "public")
    html_files = [f for f in os.listdir(public_dir) if f.endswith(".html")]

    for filename in html_files:
        filepath = os.path.join(public_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        # Update style switcher text across all pages
        html = re.sub(
            r'<span class="style-switcher-text" id="luxury-style-text">[^<]+</span>',
            '<span class="style-switcher-text" id="luxury-style-text">CHOOSE YOUR EXPERIENCE: <strong>Editorial Impact</strong></span>',
            html
        )

        # Bump cache version
        html = re.sub(r'(\.(?:js|css))\?v=[a-zA-Z0-9_-]+', rf'\1?v={VERSION}', html)

        with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(html)

    print(f"Updated all HTML files with version {VERSION}!")

if __name__ == '__main__':
    update_style_css()
    update_app_js()
    update_index_html()
    update_all_html_files()
