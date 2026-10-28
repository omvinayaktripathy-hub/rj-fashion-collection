import glob
import re

html_files = sorted(glob.glob('public/*.html'))

composite_logo_html = '''<a href="/" class="brand-logo" aria-label="RJ Fashion Collection - Haute Couture &amp; Bridal">
        <div class="brand-logo-mark">
          <img src="/images/rj-logo-monogram.png" alt="RJ Monogram" class="logo-img-light" width="44" height="44" loading="eager">
          <img src="/images/rj-logo-monogram-dark.png" alt="RJ Monogram (Dark)" class="logo-img-dark" width="44" height="44" loading="eager">
        </div>
        <div class="brand-logo-text">
          <span class="logo-title">RJ Fashion Collection</span>
          <span class="logo-subtitle">Haute Couture &amp; Bridal</span>
        </div>
      </a>'''

pattern = re.compile(r'<a href="/" class="brand-logo"[^>]*>[\s\S]*?</a>')

updated = []
for filepath in html_files:
    if 'admin.html' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    match = pattern.search(content)
    if match:
        new_content = pattern.sub(composite_logo_html, content, count=1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        updated.append(filepath)
        print(f"Updated logo in: {filepath}")

# Update admin.html sidebar brand
admin_path = 'public/admin.html'
with open(admin_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

admin_pattern = re.compile(r'<div class="admin-brand">\s*(?:<img[^>]*>|<div[^>]*>.*?</div>)')
admin_replacement = '<div class="admin-brand">\n      <img src="/images/rj-logo-monogram-dark.png" alt="RJ Monogram" width="36" height="36" style="object-fit: contain; flex-shrink: 0;" loading="eager">'
if admin_pattern.search(admin_content):
    admin_content = admin_pattern.sub(admin_replacement, admin_content, count=1)
    with open(admin_path, 'w', encoding='utf-8') as f:
        f.write(admin_content)
    print("Updated admin.html logo.")

# Update login.html auth card monogram
login_path = 'public/login.html'
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

login_content = login_content.replace('/images/rj-logo-monogram.svg', '/images/rj-logo-monogram.png')
login_content = login_content.replace('/images/rj-logo-monogram-dark.svg', '/images/rj-logo-monogram-dark.png')
with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)
print("Updated login.html auth card monogram.")

print(f"Done. Processed {len(updated)} files.")
