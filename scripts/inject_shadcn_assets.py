import glob
import re

html_files = glob.glob('public/*.html')
css_tag = '<link rel="stylesheet" href="/css/shadcn-tokens.css?v=20261025-01">\n  '
js_tag = '<script src="/js/shadcn-ui.js?v=20261025-01" defer></script>\n'

updated_css = 0
updated_js = 0

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # Inject CSS
    if 'shadcn-tokens.css' not in content:
        if '<link rel="stylesheet" href="/css/style.css' in content:
            content = content.replace(
                '<link rel="stylesheet" href="/css/style.css',
                css_tag + '<link rel="stylesheet" href="/css/style.css'
            )
            changed = True
            updated_css += 1
        elif '<link rel="stylesheet" href="/css/admin.css' in content:
            content = content.replace(
                '<link rel="stylesheet" href="/css/admin.css',
                css_tag + '<link rel="stylesheet" href="/css/admin.css'
            )
            changed = True
            updated_css += 1

    # Inject JS
    if 'shadcn-ui.js' not in content:
        if '</body>' in content:
            content = content.replace('</body>', js_tag + '</body>')
            changed = True
            updated_js += 1

    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

print(f"Injected shadcn-tokens.css in {updated_css} files, shadcn-ui.js in {updated_js} files.")
