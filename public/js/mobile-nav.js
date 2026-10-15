/**
 * RJ FASHION COLLECTION - LUXURY MOBILE NAVIGATION DRAWER & MOTION CONTROLLER
 * Full touch gesture support, accordion categories, live badge sync & Framer-Motion style easing.
 */

(function () {
  'use strict';

  function initMobileNav() {
    // Avoid double initialization
    if (document.getElementById('rj-mobile-drawer')) return;

    // 1. Create Drawer HTML Elements
    const drawerBackdrop = document.createElement('div');
    drawerBackdrop.id = 'rj-drawer-backdrop';
    drawerBackdrop.className = 'rj-drawer-backdrop';

    const drawer = document.createElement('aside');
    drawer.id = 'rj-mobile-drawer';
    drawer.className = 'rj-mobile-drawer';
    drawer.setAttribute('aria-label', 'Mobile Navigation');

    drawer.innerHTML = `
      <div class="rj-drawer-header">
        <a href="/" class="rj-drawer-brand">
          <span class="rj-drawer-crown">👑</span>
          <span class="rj-drawer-title">RJ COLLECTION</span>
        </a>
        <button type="button" class="rj-drawer-close" id="rj-drawer-close-btn" aria-label="Close Navigation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="rj-drawer-search">
        <form action="/shop.html" method="GET" class="rj-drawer-search-form">
          <input type="text" name="search" placeholder="Search sarees, lehengas, kurtis..." autocomplete="off">
          <button type="submit" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>
      </div>

      <div class="rj-drawer-body">
        <div class="rj-drawer-section">
          <span class="rj-drawer-section-title">DEPARTMENTS</span>
          
          <!-- Women Accordion -->
          <div class="rj-accordion-item">
            <button class="rj-accordion-header" type="button">
              <span><span class="rj-acc-icon">🥻</span> Women's Ethnic & Western</span>
              <span class="rj-acc-arrow">▾</span>
            </button>
            <div class="rj-accordion-content">
              <a href="/shop.html?department=women&subcategory=sarees">Banarasi & Silk Sarees</a>
              <a href="/shop.html?department=women&subcategory=lehenga-choli">Bridal & Festive Lehengas</a>
              <a href="/shop.html?department=women&subcategory=kurtis">Designer Kurtis & Tunics</a>
              <a href="/shop.html?department=women&subcategory=anarkali-suits">Anarkali & Salwar Suits</a>
              <a href="/shop.html?department=women&subcategory=co-ord-sets">Modern Co-ord Sets</a>
              <a href="/shop.html?department=women&subcategory=gowns">Evening Party Gowns</a>
              <a href="/shop.html?department=women&newArrival=true">✨ New In: Women</a>
            </div>
          </div>

          <!-- Men Accordion -->
          <div class="rj-accordion-item">
            <button class="rj-accordion-header" type="button">
              <span><span class="rj-acc-icon">👔</span> Men's Celebration Wear</span>
              <span class="rj-acc-arrow">▾</span>
            </button>
            <div class="rj-accordion-content">
              <a href="/shop.html?department=men&subcategory=kurtas">Royal Kurta Sets</a>
              <a href="/shop.html?department=men&subcategory=sherwanis">Wedding Sherwanis</a>
              <a href="/shop.html?department=men&subcategory=nehru-jackets">Nehru & Modi Jackets</a>
              <a href="/shop.html?department=men&subcategory=shirts">Linen & Silk Shirts</a>
              <a href="/shop.html?department=men&newArrival=true">✨ New In: Men</a>
            </div>
          </div>

          <!-- Kids Accordion -->
          <div class="rj-accordion-item">
            <button class="rj-accordion-header" type="button">
              <span><span class="rj-acc-icon">🧒</span> Kids Collection</span>
              <span class="rj-acc-arrow">▾</span>
            </button>
            <div class="rj-accordion-content">
              <a href="/shop.html?department=kids&subcategory=girls-lehengas">Girls Lehengas & Frocks</a>
              <a href="/shop.html?department=kids&subcategory=boys-kurtas">Boys Kurta Pajama Sets</a>
              <a href="/shop.html?department=kids&subcategory=infant-wear">Infant & Toddler Ethnic</a>
            </div>
          </div>
        </div>

        <div class="rj-drawer-section">
          <span class="rj-drawer-section-title">QUICK SHOPPING</span>
          <a href="/shop.html" class="rj-drawer-link">
            <span>🛍️ All Collections</span>
          </a>
          <a href="/sale.html" class="rj-drawer-link rj-highlight-link">
            <span>🔥 Festive Mega Sale (Up to 70% OFF)</span>
          </a>
          <a href="/categories.html" class="rj-drawer-link">
            <span>📂 Browse by Category</span>
          </a>
          <a href="/wishlist.html" class="rj-drawer-link">
            <span>♡ My Wishlist</span>
            <span class="rj-pill-badge" id="rj-drawer-wishlist-badge">0</span>
          </a>
          <a href="/cart.html" class="rj-drawer-link">
            <span>🛒 Shopping Cart</span>
            <span class="rj-pill-badge" id="rj-drawer-cart-badge">0</span>
          </a>
          <a href="/orders.html" class="rj-drawer-link">
            <span>📦 Track My Orders</span>
          </a>
          <a href="/account.html" class="rj-drawer-link">
            <span>👤 My Profile & Addresses</span>
          </a>
        </div>

        <div class="rj-drawer-section">
          <span class="rj-drawer-section-title">BOUTIQUE CONCIERGE</span>
          <a href="https://wa.me/917894093586?text=Hi%20RJ%20Fashion%2C%20I%20am%20interested%20in%20your%20collection" target="_blank" rel="noopener" class="rj-drawer-link rj-wa-link">
            <span>💬 WhatsApp Personal Shopper</span>
          </a>
          <a href="tel:+917894093586" class="rj-drawer-link">
            <span>📞 Call Us: +91 78940 93586</span>
          </a>
          <a href="mailto:rjfashioncollection@gmail.com" class="rj-drawer-link">
            <span>✉️ rjfashioncollection@gmail.com</span>
          </a>
          <a href="/size-guide.html" class="rj-drawer-link">
            <span>📏 Royal Fit & Size Guide</span>
          </a>
          <a href="/faq.html" class="rj-drawer-link">
            <span>❓ Frequently Asked Questions</span>
          </a>
          <a href="/about.html" class="rj-drawer-link">
            <span>🏛️ About RJ Heritage</span>
          </a>
        </div>
      </div>

      <div class="rj-drawer-footer">
        <div class="rj-drawer-theme-toggle" onclick="if(window.toggleTheme) window.toggleTheme();">
          <span>🌓 Switch Dark / Light Theme</span>
        </div>
        <p class="rj-drawer-copyright">© 2026 RJ Fashion Collection. Handcrafted Indian Elegance.</p>
      </div>
    `;

    document.body.appendChild(drawerBackdrop);
    document.body.appendChild(drawer);

    // 2. Insert Hamburger Button into Header if not already present
    injectHamburgerButton();

    // 3. Bind Drawer Open/Close Events
    function openDrawer() {
      drawer.classList.add('active');
      drawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      syncBadges();
    }

    function closeDrawer() {
      drawer.classList.remove('active');
      drawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    drawerBackdrop.addEventListener('click', closeDrawer);
    const closeBtn = document.getElementById('rj-drawer-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    window.openRJMobileNav = openDrawer;
    window.closeRJMobileNav = closeDrawer;

    // ESC key closes drawer
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('active')) {
        closeDrawer();
      }
    });

    // Touch Swipe Left to Close
    let touchStartX = 0;
    drawer.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    drawer.addEventListener('touchend', function (e) {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 70) {
        closeDrawer();
      }
    }, { passive: true });

    // 4. Accordion Toggle
    const accHeaders = drawer.querySelectorAll('.rj-accordion-header');
    accHeaders.forEach(function (header) {
      header.addEventListener('click', function () {
        const parent = this.parentElement;
        const isOpen = parent.classList.contains('active');
        // Close siblings
        accHeaders.forEach(function (h) {
          h.parentElement.classList.remove('active');
        });
        if (!isOpen) {
          parent.classList.add('active');
        }
      });
    });

    // 5. Sync Wishlist and Cart badges
    function syncBadges() {
      try {
        const cartBadge = document.querySelector('.cart-count-badge');
        const wishBadge = document.querySelector('.wishlist-count-badge');
        const drawerCartBadge = document.getElementById('rj-drawer-cart-badge');
        const drawerWishBadge = document.getElementById('rj-drawer-wishlist-badge');

        if (drawerCartBadge && cartBadge) {
          const val = parseInt(cartBadge.textContent, 10) || 0;
          drawerCartBadge.textContent = val;
          drawerCartBadge.style.display = val > 0 ? 'inline-block' : 'none';
        }
        if (drawerWishBadge && wishBadge) {
          const val = parseInt(wishBadge.textContent, 10) || 0;
          drawerWishBadge.textContent = val;
          drawerWishBadge.style.display = val > 0 ? 'inline-block' : 'none';
        }
      } catch (err) {}
    }

    syncBadges();
    document.addEventListener('cartUpdated', syncBadges);
    document.addEventListener('wishlistUpdated', syncBadges);
  }

  function injectHamburgerButton() {
    const siteHeader = document.querySelector('.site-header .header-main') || document.querySelector('.site-header .container') || document.querySelector('.site-header');
    if (!siteHeader) return;

    // Check if hamburger already exists
    if (document.getElementById('rj-hamburger-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rj-hamburger-btn';
    btn.className = 'rj-hamburger-btn';
    btn.setAttribute('aria-label', 'Open Menu');
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.openRJMobileNav) window.openRJMobileNav();
    });

    // Prepend hamburger right before the logo or at header start
    siteHeader.insertBefore(btn, siteHeader.firstChild);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
