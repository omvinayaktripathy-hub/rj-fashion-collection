import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"

# ===================================================================
# 1. UPDATE public/index.html
# ===================================================================
index_path = os.path.join(BASE_DIR, "public", "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

# Update Announcement Bar Message
old_announcement_content = '''      <span class="top-bar-content" id="announcement-text">
        <span class="top-bar-msg">INTRODUCING THE NEW RJ FASHION COLLECTION</span>
        <span class="top-bar-sep" aria-hidden="true">•</span>
        <span class="top-bar-perk">COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999</span>
        <span class="top-bar-code-pill" onclick="copyPromoCode('GRANDRJ')" title="Click to copy coupon code GRANDRJ" role="button" tabindex="0">
          <span class="code-label">USE CODE:</span>
          <strong class="code-val">GRANDRJ</strong>
          <span class="code-copy-tip" id="code-copy-tip">COPIED</span>
        </span>
      </span>'''

new_announcement_content = '''      <span class="top-bar-content" id="announcement-text">
        <span class="top-bar-msg">Discover the New Season — Explore the RJ Fashion Collection</span>
        <span class="top-bar-sep" aria-hidden="true">•</span>
        <span class="top-bar-perk">Complimentary Express Shipping on Orders Above ₹999</span>
        <span class="top-bar-code-pill" onclick="copyPromoCode('GRANDRJ')" title="Click to copy coupon code GRANDRJ" role="button" tabindex="0">
          <span class="code-label">USE CODE:</span>
          <strong class="code-val">GRANDRJ</strong>
          <span class="code-copy-tip" id="code-copy-tip">COPIED</span>
        </span>
      </span>'''

if old_announcement_content in html:
    html = html.replace(old_announcement_content, new_announcement_content)
    print("Updated announcement bar message!")

# Update Hero Section Headline and Subtitle
hero_target = '''          <h1 class="grand-hero-title" id="hero-headline-text">STYLE, REDEFINED.</h1>
          <p class="grand-hero-subtitle" id="hero-subtitle-text">A considered collection. A contemporary point of view. Discover the signature style of RJ Fashion Collection.</p>
          <div class="grand-hero-actions">
            <a href="/shop.html" class="grand-btn-primary" id="hero-cta-prim">
              <span>EXPLORE THE COLLECTION</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
            <a href="#our-story" class="grand-btn-secondary" id="hero-cta-sec">
              <span>DISCOVER OUR STORY</span>
            </a>
          </div>'''

hero_replacement = '''          <h1 class="grand-hero-title" id="hero-headline-text">Style That Speaks Without Words.</h1>
          <p class="grand-hero-subtitle" id="hero-subtitle-text">Discover timeless silhouettes and contemporary Indian fashion. An exquisite curation by RJ Fashion Collection.</p>
          <div class="grand-hero-actions">
            <a href="/shop.html" class="grand-btn-primary" id="hero-cta-prim">
              <span>Explore Collection</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
            <a href="/shop.html?newArrival=true" class="grand-btn-secondary" id="hero-cta-sec">
              <span>Discover New Arrivals</span>
            </a>
          </div>'''

if hero_target in html:
    html = html.replace(hero_target, hero_replacement)
    print("Updated Hero Headline, Subtitle, and CTAs!")

# Add Section 6 (Bestsellers), Section 8 (Signature Collection Tabs), and Section 10 (Customer Reviews)
# Locate after New Arrivals section
new_arrivals_end = '''      <div class="product-grid" id="homepage-new-grid">
        <!-- Rendered dynamically -->
      </div>
    </section>'''

additional_sections = '''      <div class="product-grid" id="homepage-new-grid">
        <!-- Rendered dynamically -->
      </div>
    </section>

    <!-- SECTION 6: Trending Bestsellers -->
    <section class="section">
      <div class="section-header">
        <div>
          <span class="section-eyebrow">Client Favorites</span>
          <h2 class="section-title">Trending Bestsellers</h2>
        </div>
        <a href="/shop.html?sort=rating" class="view-all-link">View All Bestsellers →</a>
      </div>
      <div class="product-grid" id="homepage-bestsellers-grid">
        <!-- Rendered dynamically -->
      </div>
    </section>

    <!-- SECTION 8: Signature Category Showcase Tabs -->
    <section class="section signature-tabs-section">
      <div class="section-header" style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <span class="section-eyebrow">Curated Edits</span>
        <h2 class="section-title" style="margin: 0;">Signature Collections</h2>
        <p style="font-size: 0.92rem; color: var(--muted); max-width: 540px; margin: 0 auto;">Explore handloom sarees, celebratory kurtis, evening dresses, and heritage jewelry.</p>
        <div class="collection-tabs-nav" role="tablist">
          <button class="col-tab-btn is-active" onclick="switchCollectionTab('sarees', this)" role="tab">Sarees</button>
          <button class="col-tab-btn" onclick="switchCollectionTab('kurtis', this)" role="tab">Kurtis</button>
          <button class="col-tab-btn" onclick="switchCollectionTab('dresses', this)" role="tab">Dresses</button>
          <button class="col-tab-btn" onclick="switchCollectionTab('jewelry', this)" role="tab">Jewellery</button>
        </div>
      </div>
      <div class="product-grid" id="homepage-tabs-grid">
        <!-- Dynamic Category Showcase -->
      </div>
    </section>'''

if new_arrivals_end in html and "Trending Bestsellers" not in html:
    html = html.replace(new_arrivals_end, additional_sections)
    print("Added Section 6 (Trending Bestsellers) & Section 8 (Signature Collection Tabs)!")

# Add Section 10: Customer Reviews & Social Proof before VIP invitation
vip_section_start = '<!-- VIP Launch Invitation Section -->'
reviews_section = '''<!-- SECTION 10: Verified Customer Social Proof & Testimonials -->
    <section class="section reviews-social-proof-section">
      <div class="section-header" style="text-align: center; margin-bottom: 36px;">
        <span class="section-eyebrow">Client Reflections</span>
        <h2 class="section-title">Love from Our Patrons</h2>
        <p style="font-size: 0.92rem; color: var(--muted); max-width: 540px; margin: 0 auto;">Read genuine impressions from verified patrons of RJ Fashion Collection.</p>
      </div>
      <div class="reviews-proof-grid">
        <div class="review-proof-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-quote">“The zari work on this Kanjivaram saree is magnificent! Looked royal on my cousin’s wedding.”</p>
          <div class="review-author-row">
            <div class="review-avatar">AD</div>
            <div>
              <div class="review-author-name">Ananya Desai</div>
              <div class="review-author-meta">Verified Buyer • Mumbai</div>
            </div>
          </div>
        </div>
        <div class="review-proof-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-quote">“Exceptional quality silk, feels rich and heavy. Exactly like the pictures and arrived within 2 days.”</p>
          <div class="review-author-row">
            <div class="review-avatar">MN</div>
            <div>
              <div class="review-author-name">Meera Nair</div>
              <div class="review-author-meta">Verified Buyer • Bengaluru</div>
            </div>
          </div>
        </div>
        <div class="review-proof-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-quote">“The Kundan choker set exceeded my expectations. So many compliments received during Diwali celebrations!”</p>
          <div class="review-author-row">
            <div class="review-avatar">SP</div>
            <div>
              <div class="review-author-name">Sneha Patel</div>
              <div class="review-author-meta">Verified Buyer • Ahmedabad</div>
            </div>
          </div>
        </div>
        <div class="review-proof-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-quote">“Stunning Banarasi weave with pure gold zari finish. The packaging and personal note felt truly luxurious.”</p>
          <div class="review-author-row">
            <div class="review-avatar">PS</div>
            <div>
              <div class="review-author-name">Priyanka Sharma</div>
              <div class="review-author-meta">Verified Buyer • New Delhi</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- VIP Launch Invitation Section -->'''

if vip_section_start in html and "Love from Our Patrons" not in html:
    html = html.replace(vip_section_start, reviews_section)
    print("Added Section 10 (Customer Reviews Social Proof)!")

# Update JS in index.html to populate Bestsellers and Collection Tabs
old_js_render = '''        if (featGrid && featProducts.length > 0) {
          featGrid.innerHTML = featProducts.map(createProductCard).join('');
        }

        if (newGrid && newProducts.length > 0) {
          newGrid.innerHTML = newProducts.map(createProductCard).join('');
        }'''

new_js_render = '''        if (featGrid && featProducts.length > 0) {
          featGrid.innerHTML = featProducts.map(createProductCard).join('');
        }

        if (newGrid && newProducts.length > 0) {
          newGrid.innerHTML = newProducts.map(createProductCard).join('');
        }

        const bestGrid = document.getElementById('homepage-bestsellers-grid');
        if (bestGrid) {
          const bestList = sortedList.filter(p => (Number(p.rating) >= 4.5 || p.featured)).slice(0, 4);
          bestGrid.innerHTML = (bestList.length ? bestList : sortedList.slice(0, 4)).map(createProductCard).join('');
        }

        window.homepageFullCatalog = sortedList;
        renderCollectionTab('sarees');

        if (window.MotionSystem && window.MotionSystem.observeAll) {
          window.MotionSystem.observeAll();
        }'''

if old_js_render in html:
    html = html.replace(old_js_render, new_js_render)
    print("Updated dynamic render logic in index.html!")

# Add switchCollectionTab helper
if "function switchCollectionTab" not in html:
    tab_script = '''
    function renderCollectionTab(catSlug) {
      const tabsGrid = document.getElementById('homepage-tabs-grid');
      if (!tabsGrid || !window.homepageFullCatalog) return;
      const filtered = window.homepageFullCatalog.filter(p => {
        const cat = String(p.category_name || p.category || p.category_id || '').toLowerCase();
        return cat.includes(catSlug.toLowerCase());
      }).slice(0, 4);
      tabsGrid.innerHTML = (filtered.length ? filtered : window.homepageFullCatalog.slice(0, 4)).map(createProductCard).join('');
      if (window.MotionSystem && window.MotionSystem.observeAll) {
        window.MotionSystem.observeAll();
      }
    }

    function switchCollectionTab(catSlug, btnEl) {
      document.querySelectorAll('.col-tab-btn').forEach(b => b.classList.remove('is-active'));
      if (btnEl) btnEl.classList.add('is-active');
      renderCollectionTab(catSlug);
    }
    window.switchCollectionTab = switchCollectionTab;
    window.renderCollectionTab = renderCollectionTab;
'''
    html = html.replace('document.addEventListener(\'DOMContentLoaded\', loadHomepageSections);', tab_script + '\n    document.addEventListener(\'DOMContentLoaded\', loadHomepageSections);')
    print("Added switchCollectionTab and renderCollectionTab scripts!")

with open(index_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(html)
print("Saved updated index.html!")
