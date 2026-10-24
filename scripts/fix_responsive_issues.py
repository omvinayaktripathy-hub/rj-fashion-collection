import os

# 1. Update public/css/admin.css with 16px input rule on mobile & tablet
admin_css_path = r'public\css\admin.css'
with open(admin_css_path, 'r', encoding='utf-8') as f:
    admin_css = f.read()

admin_rule = """
/* Mobile & Tablet iOS Safari Anti-Zoom Guarantee (>= 16px) */
@media screen and (max-width: 820px) {
  input,
  select,
  textarea,
  .form-group input,
  .form-group select,
  .form-group textarea,
  .search-box input,
  #admin-product-search,
  #admin-email,
  #admin-password,
  .form-control {
    font-size: 16px !important;
  }
}
"""

if 'Mobile & Tablet iOS Safari Anti-Zoom Guarantee' not in admin_css:
    with open(admin_css_path, 'a', encoding='utf-8') as f:
        f.write('\n' + admin_rule)
    print('Updated public/css/admin.css with 16px input rules.')

# 2. Update public/css/responsive.css to fix .top-bar wrapping & hide .luxury-style-switcher on mobile
responsive_css_path = r'public\css\responsive.css'
with open(responsive_css_path, 'r', encoding='utf-8') as f:
    resp_css = f.read()

# Replace the white-space: nowrap on .top-bar inside @media (max-width: 768px)
old_top_bar = """  .top-bar {
    font-size: 0.74rem;
    padding: 6px 12px;
    white-space: nowrap;
    overflow-x: auto;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }"""

new_top_bar = """  .top-bar {
    font-size: 0.70rem;
    padding: 6px 10px !important;
    white-space: normal !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    max-width: 100% !important;
  }

  .top-bar-inner {
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 4px 8px !important;
    max-width: 100% !important;
  }

  .top-bar-content {
    flex-wrap: wrap !important;
    justify-content: center !important;
    max-width: 100% !important;
    text-align: center !important;
  }

  .top-bar-msg,
  .top-bar-perk {
    display: inline !important;
    font-size: 0.68rem !important;
    letter-spacing: 0.3px !important;
  }

  .top-bar-code-pill {
    margin-top: 2px !important;
  }

  .luxury-style-switcher {
    display: none !important;
  }"""

if old_top_bar in resp_css:
    resp_css = resp_css.replace(old_top_bar, new_top_bar)
    with open(responsive_css_path, 'w', encoding='utf-8') as f:
        f.write(resp_css)
    print('Updated .top-bar and .luxury-style-switcher in responsive.css')
else:
    print('Note: old_top_bar pattern not matched directly, appending targeted rules...')
    with open(responsive_css_path, 'a', encoding='utf-8') as f:
        f.write('\n' + new_top_bar)

print('Fixes applied successfully.')
