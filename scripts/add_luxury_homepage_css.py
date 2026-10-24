import os

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
css_path = os.path.join(BASE_DIR, "public", "css", "style.css")

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

luxury_styles = '''
/* ===================================================================
   LUXURY REDESIGN ENHANCEMENTS — RJ FASHION COLLECTION
   Editorial Eyebrows, Signature Collection Tabs, Verified Reviews, Sticky Header
   =================================================================== */

.section-eyebrow {
  display: block;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  letter-spacing: 2.5px;
  font-weight: 700;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 6px;
}

/* Category Showcase Tabs */
.collection-tabs-nav {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  background: rgba(234, 227, 219, 0.4);
  padding: 5px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.col-tab-btn {
  padding: 8px 22px;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--dark);
  background: transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
}

.col-tab-btn:hover {
  color: var(--gold);
}

.col-tab-btn.is-active {
  background: #121110;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(18, 17, 16, 0.2);
}

[data-theme="dark"] .col-tab-btn.is-active,
.dark-theme .col-tab-btn.is-active {
  background: var(--gold);
  color: #121110;
}

/* Verified Customer Reviews Grid */
.reviews-proof-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 22px;
  margin-top: 24px;
}

.review-proof-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.review-proof-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: rgba(197, 160, 89, 0.4);
}

.review-stars {
  color: #d97706;
  font-size: 1rem;
  letter-spacing: 3px;
  margin-bottom: 12px;
}

.review-quote {
  font-family: var(--font-serif);
  font-size: 0.96rem;
  line-height: 1.6;
  color: var(--dark);
  margin: 0 0 18px 0;
  flex: 1;
  font-style: italic;
}

.review-author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .review-author-row,
.dark-theme .review-author-row {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.review-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c5a059 0%, #e2c589 100%);
  color: #121013;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.review-author-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--dark);
}

.review-author-meta {
  font-size: 0.74rem;
  color: var(--muted);
}

/* Scrolled Sticky Header Enhancements */
.site-header.is-scrolled {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.98);
}

[data-theme="dark"] .site-header.is-scrolled,
.dark-theme .site-header.is-scrolled {
  background: rgba(18, 17, 16, 0.98) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

/* Mega Menu Elevation & Timing */
.mega-menu-dropdown {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s;
}

/* Ensure Product Cards are immediately accessible and animate on entrance */
.product-card {
  opacity: 1;
}
'''

if "LUXURY REDESIGN ENHANCEMENTS — RJ FASHION COLLECTION" not in css:
    css += "\n" + luxury_styles
    with open(css_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(css)
    print("Added luxury redesign CSS enhancements to style.css!")
else:
    print("Luxury redesign CSS already present in style.css.")
