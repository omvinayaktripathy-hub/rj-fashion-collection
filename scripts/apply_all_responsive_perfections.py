import os

resp_path = r'public\css\responsive.css'
with open(resp_path, 'r', encoding='utf-8') as f:
    resp = f.read()

perfection_css = """
/* ===================================================================
   RJ FASHION COLLECTION - COMPREHENSIVE RESPONSIVE PERFECTION
   Addresses: Motion transform clips, flex blowout, and tab navigation
   =================================================================== */

/* 1. Prevent animated elements (MotionSystem transform: translateX) from overflowing viewport */
.grand-hero,
.brand-story-section,
.editorial-campaign-section,
.featured-campaigns-section,
.signature-collections-section,
.section,
.site-main,
main {
  overflow-x: clip !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 2. Horizontal scrollbar styling for collection tabs on mobile */
.collection-tabs-nav {
  display: flex !important;
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  max-width: 100% !important;
  padding: 4px 6px !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
  gap: 8px !important;
}

.collection-tabs-nav::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.col-tab-btn {
  flex-shrink: 0 !important;
  font-size: 0.80rem !important;
  padding: 7px 12px !important;
  white-space: nowrap !important;
}

/* 3. Product Detail page gallery blowout containment */
.fk-product-layout,
.fk-gallery-wrapper,
.fk-gallery-sticky,
.fk-main-image-container,
.fk-thumbnails-strip {
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.fk-thumbnails-strip {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: thin !important;
  max-width: 100% !important;
}

.fk-expand-pill {
  max-width: 92% !important;
  white-space: normal !important;
  text-align: center !important;
  padding: 5px 10px !important;
}

.fk-expand-text {
  font-size: 0.72rem !important;
}

/* 4. Checkout page cards and payment options containment */
.fk-checkout-layout,
.fk-checkout-layout > div,
.checkout-section-card,
.checkout-card-header,
.checkout-card-body,
.payment-option-box {
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.checkout-card-header {
  flex-wrap: wrap !important;
  gap: 8px !important;
  padding: 12px 14px !important;
}

.payment-option-box {
  padding: 12px 10px !important;
  box-sizing: border-box !important;
  max-width: 100% !important;
}

.payment-option-box * {
  min-width: 0;
  word-break: break-word;
}

/* 5. Compact Product Cards for <= 400px mobile phones */
@media screen and (max-width: 400px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px !important;
    padding: 0 !important;
  }

  .product-card {
    min-width: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  .product-details {
    padding: 8px 6px !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  .product-title {
    font-size: 0.78rem !important;
    line-height: 1.22 !important;
  }

  .price-current {
    font-size: 0.88rem !important;
  }

  .product-actions {
    grid-template-columns: 1fr 1fr !important;
    gap: 4px !important;
    min-width: 0 !important;
  }

  .btn-card {
    font-size: 0.68rem !important;
    padding: 6px 2px !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    white-space: nowrap !important;
  }
}
"""

with open(resp_path, 'a', encoding='utf-8') as f:
    f.write('\n' + perfection_css)

print('Appended perfection CSS rules to public/css/responsive.css successfully.')
