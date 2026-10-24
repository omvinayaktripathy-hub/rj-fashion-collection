import os

# 1. Update public/css/responsive.css with tablet header wrapping, main-nav hide, and checkout card rules
resp_path = r'public\css\responsive.css'
with open(resp_path, 'r', encoding='utf-8') as f:
    resp = f.read()

targeted_css = """
/* ===================================================================
   TABLET & MOBILE HEADER TWO-ROW REFINEMENT (< 992px)
   =================================================================== */
@media screen and (max-width: 991px) {
  /* Replace desktop category bar with mobile drawer */
  .site-header .main-nav,
  .main-nav,
  nav.main-nav {
    display: none !important;
  }

  .site-header .header-main,
  .header-main {
    flex-wrap: wrap !important;
    gap: 8px 12px !important;
    padding: 10px 14px !important;
    box-sizing: border-box !important;
    max-width: 100% !important;
  }

  /* Two-row layout: Row 1 = Hamburger + Brand Logo + Actions; Row 2 = Full-width Search */
  .header-search {
    order: 10 !important;
    flex-basis: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-top: 4px !important;
    box-sizing: border-box !important;
  }

  .header-search form {
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .header-search input {
    font-size: 16px !important;
    width: 100% !important;
  }

  /* Checkout card responsive wrapping */
  .checkout-section-card {
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  .checkout-card-header {
    flex-wrap: wrap !important;
    gap: 8px !important;
    padding: 12px 14px !important;
    box-sizing: border-box !important;
  }

  .checkout-card-header h2 {
    font-size: 1rem !important;
  }

  .checkout-card-body {
    padding: 14px 12px !important;
    box-sizing: border-box !important;
  }

  .change-link-btn {
    font-size: 0.76rem !important;
  }
}
"""

with open(resp_path, 'a', encoding='utf-8') as f:
    f.write('\n' + targeted_css)

print('Updated public/css/responsive.css with tablet header wrapping, main-nav hide, and checkout rules.')
