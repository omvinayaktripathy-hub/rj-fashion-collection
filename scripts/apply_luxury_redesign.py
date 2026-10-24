import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
VERSION = "20261024-06"

def upgrade_style_css():
    path = os.path.join(BASE_DIR, "public", "css", "style.css")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update Google Fonts import to include Cormorant Garamond
    old_font_import = "@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');"
    new_font_import = "@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');"
    if old_font_import in content:
        content = content.replace(old_font_import, new_font_import)

    # Replace root design tokens with exact quiet luxury tokens
    old_root_pattern = re.compile(r':root\s*\{.*?\/\* Neutrals \*\/', re.DOTALL)
    new_root_tokens = ''':root {
  /* Signature Quiet Luxury Palette Tokens */
  --bg-page: #FAF8F3;          /* Warm Ivory */
  --bg-subtle: #F2EDE4;        /* Soft Cream */
  --bg-sand: #E5D8C8;          /* Sand Beige */
  --bg-white: #FFFFFF;         /* Pure White */
  --bg-card: #FFFFFF;

  --dark: #171715;             /* Editorial Black */
  --dark-espresso: #302720;    /* Deep Espresso */
  --dark-light: #302720;
  --dark-subtle: #5A524A;
  --taupe: #A59685;            /* Warm Taupe */

  --primary: #302720;          /* Deep Espresso Primary Accent */
  --primary-hover: #171715;    /* Editorial Black Hover */
  --primary-gradient: linear-gradient(135deg, #302720 0%, #171715 100%);
  --primary-light: #F2EDE4;
  --primary-subtle: rgba(48, 39, 32, 0.08);

  --accent-burgundy: #72132A;  /* Heritage Royal Burgundy Accent */
  --gold: #C2A878;             /* Restrained Champagne Accent */
  --gold-hover: #B09562;
  --gold-gradient: linear-gradient(135deg, #C2A878 0%, #DFBA73 100%);
  --gold-light: #FAF6ED;
  --gold-subtle: rgba(194, 168, 120, 0.16);

  --champagne: #C2A878;
  --champagne-light: #FBF8F2;
  --champagne-border: #E8DECE;

  /* Neutrals */'''

    if old_root_pattern.search(content):
        content = old_root_pattern.sub(new_root_tokens, content, count=1)
        print("Updated :root color tokens in style.css!")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Saved upgraded style.css!")

def upgrade_admin_css():
    path = os.path.join(BASE_DIR, "public", "css", "admin.css")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update admin design tokens to match Quiet Luxury SaaS Palette
    old_admin_root = re.compile(r':root\s*\{.*?\/\* Admin Sidebar \*\/', re.DOTALL)
    new_admin_root = ''':root {
  --admin-bg: #FAF8F3;          /* Warm Ivory Canvas */
  --admin-sidebar: #171715;     /* Editorial Black Sidebar */
  --admin-sidebar-hover: #302720; /* Deep Espresso Hover */
  --admin-card: #FFFFFF;
  --admin-card-border: #E5D8C8; /* Sand Beige Border */
  --admin-card-shadow: 0 2px 10px rgba(48, 39, 32, 0.04), 0 1px 3px rgba(48, 39, 32, 0.02);
  --admin-text-main: #171715;
  --admin-text-muted: #7A7067;
  --admin-primary: #302720;     /* Deep Espresso */
  --admin-primary-hover: #171715;
  --admin-rose: #72132A;        /* Heritage Accent */
  --admin-rose-light: #FDF2F4;
  --admin-rose-subtle: #FFF1F2;
  --admin-gold: #C2A878;        /* Restrained Champagne Gold */
  --admin-gold-light: #FAF6ED;
  --admin-gold-border: #E8DECE;
  --admin-ivory: #FAF8F3;
  --admin-success: #1E6B37;
  --admin-success-light: #EFF7F2;
  --admin-warning: #B8860B;
  --admin-warning-light: #FFFBEB;
  --admin-danger: #A71D2A;
  --admin-danger-light: #FDF2F3;
}

body.admin-body {
  background-color: var(--admin-bg);
  color: var(--admin-text-main);
  display: flex !important;
  flex-direction: row !important;
  min-height: 100vh;
  margin: 0;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Admin Sidebar */'''

    if old_admin_root.search(content):
        content = old_admin_root.sub(new_admin_root, content, count=1)
        print("Updated admin.css design tokens!")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Saved upgraded admin.css!")

def upgrade_index_html():
    path = os.path.join(BASE_DIR, "public", "index.html")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update announcement text
    content = content.replace(
        '<span id="announcement-text">COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | USE CODE: <strong>GRANDRJ</strong></span>',
        '<span id="announcement-text">INTRODUCING THE NEW RJ FASHION COLLECTION | COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: <strong>GRANDRJ</strong></span>'
    )

    # 2. Update Hero Section Headline and Subtitle
    old_hero = '''          <h1 class="grand-hero-title" id="hero-headline-text">A New Era of Style Begins.</h1>
          <p class="grand-hero-subtitle" id="hero-subtitle-text">Discover your style. Elevate every moment with handcrafted Banarasi silks, bridal lehengas, and royal Kundan jewelry.</p>
          <div class="grand-hero-actions">
            <a href="/shop.html" class="grand-btn-primary" id="hero-cta-prim">
              <span>EXPLORE THE COLLECTION</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
            <a href="/shop.html?newArrival=true" class="grand-btn-secondary" id="hero-cta-sec">
              <span>DISCOVER WHAT'S NEW</span>
            </a>
          </div>'''

    new_hero = '''          <h1 class="grand-hero-title" id="hero-headline-text">STYLE, REDEFINED.</h1>
          <p class="grand-hero-subtitle" id="hero-subtitle-text">A considered collection. A timeless point of view. Discover the next chapter of RJ Fashion Collection.</p>
          <div class="grand-hero-actions">
            <a href="/shop.html" class="grand-btn-primary" id="hero-cta-prim">
              <span>EXPLORE THE COLLECTION</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
            <a href="#our-story" class="grand-btn-secondary" id="hero-cta-sec">
              <span>DISCOVER OUR STORY</span>
            </a>
          </div>'''

    if old_hero in content:
        content = content.replace(old_hero, new_hero)
        print("Updated Hero section in index.html!")

    # 3. Update Brand Story Section Title to "BEYOND THE ORDINARY."
    content = content.replace(
        '<section class="our-story-section">',
        '<section class="our-story-section" id="our-story">'
    )
    content = content.replace(
        '<h2 class="our-story-title">Crafting Memories for Indian Celebrations</h2>',
        '<h2 class="our-story-title">BEYOND THE ORDINARY.</h2>'
    )

    # 4. Update Campaign Strip Privilege Text
    content = content.replace(
        '<h2 class="campaign-title">Grand Opening Privileges</h2>',
        '<h2 class="campaign-title">The Grand Opening Campaign</h2>'
    )

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Saved upgraded index.html!")

def update_all_html_version_tags():
    public_dir = os.path.join(BASE_DIR, "public")
    html_files = [f for f in os.listdir(public_dir) if f.endswith(".html")]

    for filename in html_files:
        filepath = os.path.join(public_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        new_html = re.sub(r'(\.(?:js|css))\?v=[a-zA-Z0-9_-]+', rf'\1?v={VERSION}', html)

        if new_html != html:
            with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
                f.write(new_html)
            print(f"Busted cache on {filename} with v={VERSION}")

if __name__ == '__main__':
    upgrade_style_css()
    upgrade_admin_css()
    upgrade_index_html()
    update_all_html_version_tags()
