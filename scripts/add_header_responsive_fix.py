css_path = r'public\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

rule = """
/* Header Responsive Protection (Laptop and Tablet Landscape) */
@media (max-width: 1200px) {
  .header-main {
    gap: 14px !important;
  }
  .header-search {
    min-width: 120px !important;
  }
  .header-actions {
    gap: 8px !important;
  }
  .luxury-style-switcher {
    padding: 5px 10px !important;
  }
  .luxury-style-switcher .style-switcher-text {
    font-size: 0.72rem !important;
  }
  .theme-switch-container {
    padding: 4px 8px !important;
  }
  .theme-mode-text {
    display: none !important;
  }
  .header-actions .action-btn {
    padding: 6px 8px !important;
    font-size: 0.82rem !important;
  }
}
"""

if "Header Responsive Protection (Laptop and Tablet Landscape)" not in css:
    css += "\n" + rule
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added header responsive protection to style.css")
else:
    print("Already present")
