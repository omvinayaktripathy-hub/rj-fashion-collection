import os

responsive_path = r'public\css\responsive.css'

with open(responsive_path, 'r', encoding='utf-8') as f:
    existing_css = f.read()

# Marker to prevent duplicate appending
marker = '/* === RJ FASHION COLLECTION - COMPREHENSIVE CROSS-DEVICE & SAFARI SUITE === */'
if marker in existing_css:
    print('Enhancement block already present, updating it...')
    existing_css = existing_css.split(marker)[0].strip()

enhancement_css = """

/* === RJ FASHION COLLECTION - COMPREHENSIVE CROSS-DEVICE & SAFARI SUITE === */

/* -------------------------------------------------------------
   1. CORE SAFARI & IOS SAFE-AREA FOUNDATIONS
   ------------------------------------------------------------- */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

/* Eliminate tap delays and iOS blue tap flashes */
*, *::before, *::after {
  -webkit-tap-highlight-color: transparent;
}

a, button, input, select, textarea, [role="button"], .product-card {
  touch-action: manipulation;
}

/* Prevent horizontal overflow on entire page without breaking sticky elements */
html {
  overflow-x: clip;
  width: 100%;
  max-width: 100%;
}

body {
  overflow-x: clip;
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
}

/* Bulletproof iOS Safari Body Scroll Lock when Modal or Drawer is Open */
html.rj-scroll-locked,
body.rj-scroll-locked {
  overflow: hidden !important;
  overscroll-behavior: none !important;
}

/* -------------------------------------------------------------
   2. TOUCH TARGETS (WCAG 2.5.5 / APPLE HIG >= 44x44px)
   ------------------------------------------------------------- */
.rj-hamburger-btn {
  min-width: 44px !important;
  min-height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  touch-action: manipulation;
  -webkit-touch-callout: none;
}

.rj-drawer-close {
  min-width: 44px !important;
  min-height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.action-btn {
  min-width: 44px !important;
  min-height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.bottom-nav-item {
  min-width: 44px !important;
  min-height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.qty-btn,
.quantity-btn {
  min-width: 44px !important;
  min-height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  touch-action: manipulation;
}

.modal-close,
.quick-view-close,
.filter-drawer-close {
  min-width: 44px !important;
  min-height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* -------------------------------------------------------------
   3. IOS SAFARI ANTI-ZOOM: 16PX FONT SIZE ON INPUTS (<= 820px)
   ------------------------------------------------------------- */
@media screen and (max-width: 820px) {
  input,
  input[type="text"],
  input[type="number"],
  input[type="email"],
  input[type="tel"],
  input[type="password"],
  input[type="search"],
  select,
  textarea,
  .form-control,
  .header-search input,
  .rj-drawer-search-form input,
  .coupon-input,
  .newsletter-input,
  .filter-search-input {
    font-size: 16px !important;
    line-height: normal !important;
    -webkit-appearance: none;
    appearance: none;
    border-radius: 6px;
  }
}

/* -------------------------------------------------------------
   4. IPHONE SAFE-AREA INSET COMPLIANCE FOR FIXED & STICKY BARS
   ------------------------------------------------------------- */
.site-header {
  padding-left: max(0px, env(safe-area-inset-left));
  padding-right: max(0px, env(safe-area-inset-right));
}

.bottom-nav {
  height: calc(62px + env(safe-area-inset-bottom, 0px)) !important;
  padding-bottom: max(6px, env(safe-area-inset-bottom, 0px)) !important;
  padding-left: max(12px, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(12px, env(safe-area-inset-right, 0px)) !important;
}

.rj-mobile-drawer {
  height: 100vh;
  height: 100dvh;
  padding-top: max(0px, env(safe-area-inset-top, 0px));
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
  padding-left: max(0px, env(safe-area-inset-left, 0px));
  padding-right: max(0px, env(safe-area-inset-right, 0px));
  max-width: min(86vw, 360px);
}

.fk-mobile-bottom-bar,
.fk-cart-bottom-bar,
.checkout-bottom-bar {
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0px)) !important;
  padding-left: max(14px, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(14px, env(safe-area-inset-right, 0px)) !important;
}

.whatsapp-float-btn {
  bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
  right: max(16px, env(safe-area-inset-right, 0px)) !important;
  z-index: 950;
}

/* -------------------------------------------------------------
   5. NARROW MOBILE PHONES (< 360px: e.g. 320px iPhone SE 1st gen)
   ------------------------------------------------------------- */
@media screen and (max-width: 359px) {
  .container {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .brand-logo .logo-title {
    font-size: 1.05rem !important;
    letter-spacing: 0.5px !important;
  }

  .grand-hero-title,
  .hero-title {
    font-size: 1.35rem !important;
    line-height: 1.22 !important;
  }

  .grand-hero-lead,
  .hero-subtitle {
    font-size: 0.82rem !important;
  }

  /* 2-column product grid with ultra-tight spacing */
  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 6px !important;
  }

  .product-card {
    border-radius: 6px !important;
  }

  .product-card .product-details {
    padding: 6px 4px !important;
  }

  .product-title {
    font-size: 0.74rem !important;
    line-height: 1.2 !important;
    margin-bottom: 2px !important;
  }

  .price-current {
    font-size: 0.84rem !important;
  }

  .price-original {
    font-size: 0.68rem !important;
  }

  .price-discount {
    font-size: 0.65rem !important;
  }

  /* Stack action buttons vertically on <= 359px to prevent text cut-off */
  .product-actions {
    grid-template-columns: 1fr !important;
    gap: 4px !important;
    margin-top: 6px !important;
  }

  .btn-card {
    padding: 6px 4px !important;
    font-size: 0.68rem !important;
    min-height: 32px !important;
    white-space: nowrap !important;
  }

  /* Filter pills scrollbar containment */
  .mobile-dept-pills-scroll {
    gap: 6px !important;
    padding: 6px 4px !important;
  }

  .dept-filter-chip {
    padding: 4px 10px !important;
    font-size: 0.72rem !important;
  }

  .stepper-nav-step {
    font-size: 0.72rem !important;
  }

  .stepper-nav-circle {
    width: 20px !important;
    height: 20px !important;
    font-size: 0.68rem !important;
  }
}

/* -------------------------------------------------------------
   6. STANDARD & LARGE MOBILE PHONES (360px - 599px)
   ------------------------------------------------------------- */
@media screen and (min-width: 360px) and (max-width: 599px) {
  .container {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }

  .product-card .product-details {
    padding: 8px 6px !important;
  }

  .product-title {
    font-size: 0.82rem !important;
  }

  .product-actions {
    grid-template-columns: 1fr 1fr !important;
    gap: 6px !important;
  }

  .btn-card {
    padding: 7px 4px !important;
    font-size: 0.72rem !important;
    min-height: 34px !important;
  }
}

/* -------------------------------------------------------------
   7. SMALL TABLETS & LARGE MOBILE LANDSCAPE (600px - 767px)
   ------------------------------------------------------------- */
@media screen and (min-width: 600px) and (max-width: 767px) {
  .container {
    padding-left: 18px !important;
    padding-right: 18px !important;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 16px !important;
  }

  .grand-hero-title {
    font-size: 1.95rem !important;
  }

  .hero-content {
    padding: 32px 24px !important;
  }
}

/* -------------------------------------------------------------
   8. IPAD & ANDROID TABLETS (768px - 991px: Portrait & Landscape)
   ------------------------------------------------------------- */
@media screen and (min-width: 768px) and (max-width: 991px) {
  .container {
    max-width: 100% !important;
    padding-left: 24px !important;
    padding-right: 24px !important;
  }

  .site-header .header-main {
    padding: 12px 24px !important;
  }

  /* 3-column product grid on tablets */
  .product-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 18px !important;
  }

  .product-card .product-details {
    padding: 12px 10px !important;
  }

  .product-title {
    font-size: 0.88rem !important;
  }

  .shop-catalog-layout {
    grid-template-columns: 1fr !important;
  }

  /* Tablet Category Showcase */
  .category-showcase-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 14px !important;
  }

  .reviews-proof-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 18px !important;
  }

  /* Modals fit tablet screen comfortably */
  .quick-view-modal,
  .cart-modal,
  .size-guide-modal {
    max-width: 88vw !important;
    max-height: 85vh !important;
    max-height: 85dvh !important;
  }
}

/* -------------------------------------------------------------
   9. LAPTOPS & COMPACT DESKTOPS (992px - 1199px)
   ------------------------------------------------------------- */
@media screen and (min-width: 992px) and (max-width: 1199px) {
  .container {
    max-width: 980px !important;
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  .shop-catalog-layout {
    grid-template-columns: 240px 1fr !important;
    gap: 20px !important;
  }

  .product-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 16px !important;
  }

  .category-showcase-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 16px !important;
  }

  .reviews-proof-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 20px !important;
  }
}

/* -------------------------------------------------------------
   10. STANDARD & LARGE DESKTOPS (1200px - 1920px+)
   ------------------------------------------------------------- */
@media screen and (min-width: 1200px) {
  .container {
    max-width: 1380px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding-left: 32px !important;
    padding-right: 32px !important;
  }

  .product-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 24px !important;
  }

  .shop-catalog-layout .product-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 22px !important;
  }

  .category-showcase-grid {
    grid-template-columns: repeat(8, 1fr) !important;
    gap: 16px !important;
  }

  .reviews-proof-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 24px !important;
  }

  /* Limit maximum stretch on ultra-wide monitors (1920px+) */
  @media screen and (min-width: 1600px) {
    .container {
      max-width: 1480px !important;
    }
  }
}

/* -------------------------------------------------------------
   11. ACCESSIBILITY & PREFERS-REDUCED-MOTION
   ------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .rj-mobile-drawer {
    transition: none !important;
  }

  .rj-drawer-backdrop {
    transition: none !important;
  }
}

/* Visible Keyboard Focus Rings */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--gold, #C5A880) !important;
  outline-offset: 2px !important;
}

/* Flexbox & Grid min-width zero containment for Safari text wrapping */
.product-card,
.product-details,
.product-title,
.header-main,
.header-search,
.footer-column {
  min-width: 0;
}
"""

with open(responsive_path, 'w', encoding='utf-8') as f:
    f.write(existing_css + '\n' + enhancement_css)

print('Enhanced public/css/responsive.css successfully.')
