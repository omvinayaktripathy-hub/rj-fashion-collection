import os
import glob

public_dir = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public'
html_files = glob.glob(os.path.join(public_dir, '*.html'))

new_banner_url = 'https://rj-fashion-collection.web.app/images/rj-fashion-family-banner.jpg?v=20261109-v2'
new_square_url = 'https://rj-fashion-collection.web.app/images/rj-fashion-family-square.jpg?v=20261109-v2'

count = 0
for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # Replace og:image
    if 'og-preview.jpg' in content:
        import re
        content = re.sub(
            r'https://rj-fashion-collection\.web\.app/images/og-preview\.jpg(\?v=[a-zA-Z0-9_\-]+)?',
            new_banner_url,
            content
        )
        content = re.sub(
            r'/images/og-preview\.jpg(\?v=[a-zA-Z0-9_\-]+)?',
            new_banner_url,
            content
        )
        modified = True

    # Ensure link rel="image_src" exists
    if 'rel="image_src"' not in content and '<head>' in content:
        content = content.replace(
            '<head>',
            f'<head>\n  <link rel="image_src" href="{new_banner_url}">'
        )
        modified = True

    # Update cache buster on auth.js and app.js
    if 'auth.js?v=' in content:
        import re
        content = re.sub(r'auth\.js\?v=[a-zA-Z0-9_\-]+', 'auth.js?v=20261109-auth-fix', content)
        modified = True

    if modified:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Updated metadata in {os.path.basename(fpath)}")

print(f"Total updated HTML files: {count}")
