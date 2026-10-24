const escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
/**
 * RJ FASHION COLLECTION - LUXURY MOBILE NAVIGATION DRAWER & MOTION CONTROLLER
 * Full touch gesture support, accordion categories, live badge sync & bulletproof iOS scroll locking.
 */

(function () {
  'use strict';

  // Clean legacy subtitle elements from DOM
  try {
    document.querySelectorAll('.logo-subtitle').forEach(function(el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  } catch (e) {}

  // Bulletproof iOS Safari Body Scroll Lock
  let scrollLockPosition = 0;
  function lockBodyScroll() {
    scrollLockPosition = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add('rj-scroll-locked');
    document.body.classList.add('rj-scroll-locked');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollLockPosition}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    document.documentElement.classList.remove('rj-scroll-locked');
    document.body.classList.remove('rj-scroll-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollLockPosition);
  }

  window.rjLockScroll = lockBodyScroll;
  window.rjUnlockScroll = unlockBodyScroll;

  function initMobileNav() {
    // Avoid double initialization
    if (document.getElementById('rj-mobile-drawer')) return;

    // 1. Create Drawer Backdrop
    const drawerBackdrop = document.createElement('div');
    drawerBackdrop.id = 'rj-drawer-backdrop';
    drawerBackdrop.className = 'rj-drawer-backdrop';
    drawerBackdrop.setAttribute('aria-hidden', 'true');

    // 2. Create Mobile Drawer Aside
    const drawer = document.createElement('aside');
    drawer.id = 'rj-mobile-drawer';
    drawer.className = 'rj-mobile-drawer';
    drawer.setAttribute('aria-label', 'Mobile Navigation');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');

    drawer.innerHTML = `
      <div class="rj-drawer-header">
        <a href="/" class="rj-drawer-brand" aria-label="RJ Fashion Collection Home">
          <svg class="rj-drawer-crown" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"></path>
          </svg>
          <span class="rj-drawer-title">RJ FASHION COLLECTION</span>
        </a>
        <button type="button" class="rj-drawer-close" id="rj-drawer-close-btn" aria-label="Close Navigation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="rj-drawer-search">
        <form action="/shop.html" method="GET" class="rj-drawer-search-form" role="search">
          <input type="search" name="search" placeholder="Search sarees, lehengas, kurtis..." autocomplete="off" aria-label="Search Collection">
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
            <button class="rj-accordion-header" type="button" aria-expanded="false">
              <span>
                <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                Women's Ethnic & Western
              </span>
              <span class="rj-acc-arrow">›</span>
            </button>
            <div class="rj-accordion-content">
              <a href="/shop.html?department=women&subcategory=sarees">Banarasi & Silk Sarees</a>
              <a href="/shop.html?department=women&subcategory=lehenga-choli">Bridal & Festive Lehengas</a>
              <a href="/shop.html?department=women&subcategory=kurtis">Designer Kurtis & Tunics</a>
              <a href="/shop.html?department=women&subcategory=anarkali-suits">Anarkali & Salwar Suits</a>
              <a href="/shop.html?department=women&subcategory=co-ord-sets">Modern Co-ord Sets</a>
              <a href="/shop.html?department=women&subcategory=gowns">Evening Party Gowns</a>
              <a href="/shop.html?department=women&newArrival=true" class="rj-highlight-sublink">★ New In: Women</a>
            </div>
          </div>

          <!-- Jewellery Accordion -->
          <div class="rj-accordion-item">
            <button class="rj-accordion-header" type="button" aria-expanded="false">
              <span>
                <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Royal Jewellery & Accessories
              </span>
              <span class="rj-acc-arrow">›</span>
            </button>
            <div class="rj-accordion-content">
              <a href="/shop.html?department=jewellery&subcategory=kundan">Kundan & Polki Necklaces</a>
              <a href="/shop.html?department=jewellery&subcategory=temple">Temple Jewellery Chokers</a>
              <a href="/shop.html?department=jewellery&subcategory=jhumkas">Designer Jhumkas & Earrings</a>
              <a href="/shop.html?department=jewellery&subcategory=bangles">Bridal Bangles & Kadas</a>
              <a href="/shop.html?department=jewellery&newArrival=true" class="rj-highlight-sublink">★ The Kundan Vault</a>
            </div>
          </div>

          <!-- Men Accordion -->
          <div class="rj-accordion-item">
            <button class="rj-accordion-header" type="button" aria-expanded="false">
              <span>
                <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Men's Celebration Wear
              </span>
              <span class="rj-acc-arrow">›</span>
            </button>
            <div class="rj-accordion-content">
              <a href="/shop.html?department=men&subcategory=kurtas">Royal Kurta Sets</a>
              <a href="/shop.html?department=men&subcategory=sherwanis">Wedding Sherwanis</a>
              <a href="/shop.html?department=men&subcategory=nehru-jackets">Nehru & Modi Jackets</a>
              <a href="/shop.html?department=men&subcategory=shirts">Linen & Silk Shirts</a>
              <a href="/shop.html?department=men&newArrival=true" class="rj-highlight-sublink">★ New In: Men</a>
            </div>
          </div>

          <!-- Kids Accordion -->
          <div class="rj-accordion-item">
            <button class="rj-accordion-header" type="button" aria-expanded="false">
              <span>
                <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Kids Collection
              </span>
              <span class="rj-acc-arrow">›</span>
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
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              All Collections
            </span>
          </a>
          <a href="/sale.html" class="rj-drawer-link rj-highlight-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Festive Mega Sale (Up to 70% OFF)
            </span>
          </a>
          <a href="/categories.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Browse by Category
            </span>
          </a>
          <a href="/wishlist.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              My Wishlist
            </span>
            <span class="rj-pill-badge" id="rj-drawer-wishlist-badge">0</span>
          </a>
          <a href="/cart.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Shopping Cart
            </span>
            <span class="rj-pill-badge" id="rj-drawer-cart-badge">0</span>
          </a>
          <a href="/orders.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Track My Orders
            </span>
          </a>
          <a href="/account.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Profile & Addresses
            </span>
          </a>
        </div>

        <div class="rj-drawer-section">
          <span class="rj-drawer-section-title">BOUTIQUE CONCIERGE</span>
          <a href="https://wa.me/917894093586?text=Hi%20RJ%20Fashion%2C%20I%20am%20interested%20in%20your%20collection" target="_blank" rel="noopener" class="rj-drawer-link rj-wa-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WhatsApp Personal Shopper
            </span>
          </a>
          <a href="tel:+917894093586" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Call Us: +91 78940 93586
            </span>
          </a>
          <a href="mailto:rjfashioncollection@gmail.com" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              rjfashioncollection@gmail.com
            </span>
          </a>
          <a href="/size-guide.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="1"/><line x1="7" y1="8" x2="7" y2="12"/><line x1="11" y1="8" x2="11" y2="11"/><line x1="15" y1="8" x2="15" y2="12"/><line x1="19" y1="8" x2="19" y2="11"/></svg>
              Royal Fit & Size Guide
            </span>
          </a>
          <a href="/faq.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Frequently Asked Questions
            </span>
          </a>
          <a href="/about.html" class="rj-drawer-link">
            <span>
              <svg class="rj-nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              About RJ Heritage
            </span>
          </a>
        </div>
      </div>

      <div class="rj-drawer-footer">
        <div class="rj-drawer-theme-toggle" role="button" tabindex="0" onclick="if(window.toggleLuxuryStyle) window.toggleLuxuryStyle();" style="margin-bottom: 8px;">
          <span id="rj-mobile-style-text">✦ Style: Editorial Impact</span>
        </div>
        <div class="rj-drawer-theme-toggle" role="button" tabindex="0" onclick="if(window.toggleTheme) window.toggleTheme();">
          <span>◐ Switch Dark / Light Theme</span>
        </div>
        <p class="rj-drawer-copyright">© 2026 RJ Fashion Collection. Premium Indian Elegance.</p>
      </div>
    `;

    document.body.appendChild(drawerBackdrop);
    document.body.appendChild(drawer);

    // 3. Insert Hamburger Button into Header
    injectHamburgerButton();

    // 4. Bind Drawer Open/Close Events
    function openDrawer() {
      drawer.classList.add('active');
      drawerBackdrop.classList.add('active');
      lockBodyScroll();
      syncBadges();
      // Accessibility focus management
      const firstFocusable = drawer.querySelector('button, [href], input');
      if (firstFocusable) firstFocusable.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('active');
      drawerBackdrop.classList.remove('active');
      unlockBodyScroll();
      const hamburger = document.getElementById('rj-hamburger-btn');
      if (hamburger) hamburger.focus();
    }

    drawerBackdrop.addEventListener('click', closeDrawer);
    // Prevent iOS background touch bounce on backdrop
    drawerBackdrop.addEventListener('touchmove', function (e) {
      e.preventDefault();
    }, { passive: false });

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
    let touchStartY = 0;
    drawer.addEventListener('touchstart', function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
      }
    }, { passive: true });

    drawer.addEventListener('touchend', function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = Math.abs(touchStartY - touchEndY);
        // Horizontal swipe to left (diffX > 60 and not predominantly vertical)
        if (diffX > 60 && diffX > diffY) {
          closeDrawer();
        }
      }
    }, { passive: true });

    // 5. Accordion Toggle
    const accHeaders = drawer.querySelectorAll('.rj-accordion-header');
    accHeaders.forEach(function (header) {
      header.addEventListener('click', function () {
        const parent = this.parentElement;
        const isOpen = parent.classList.contains('active');
        // Close siblings
        accHeaders.forEach(function (h) {
          h.parentElement.classList.remove('active');
          h.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          parent.classList.add('active');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // 6. Sync Wishlist and Cart badges
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

    // Clean duplicate floating WhatsApp buttons
    try {
      document.querySelectorAll('#rj-floating-wa-btn, .rj-floating-wa-btn, .rj-wa-badge, .rj-wa-pulse').forEach(function(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      const waButtons = document.querySelectorAll('.whatsapp-float-btn');
      if (waButtons.length > 1) {
        for (let i = 1; i < waButtons.length; i++) {
          if (waButtons[i] && waButtons[i].parentNode) {
            waButtons[i].parentNode.removeChild(waButtons[i]);
          }
        }
      }
    } catch (err) {}
  }

  function injectHamburgerButton() {
    const siteHeader = document.querySelector('.site-header .header-main') || document.querySelector('.site-header .container') || document.querySelector('.site-header');
    if (!siteHeader) return;

    if (document.getElementById('rj-hamburger-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rj-hamburger-btn';
    btn.className = 'rj-hamburger-btn';
    btn.setAttribute('aria-label', 'Open Navigation Menu');
    btn.setAttribute('aria-haspopup', 'dialog');
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

    siteHeader.insertBefore(btn, siteHeader.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
