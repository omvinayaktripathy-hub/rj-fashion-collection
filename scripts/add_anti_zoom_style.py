css_path = r'public\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

rule = """
/* Anti-Zoom Mobile Input Protection (<= 820px) */
@media screen and (max-width: 820px) {
  input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),
  select,
  textarea,
  .vip-input,
  .header-search input {
    font-size: 16px !important;
    line-height: normal !important;
  }
}
"""

if "Anti-Zoom Mobile Input Protection (<= 820px)" not in css:
    css += "\n" + rule
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added anti-zoom mobile input rule to style.css")
else:
    print("Already present")
