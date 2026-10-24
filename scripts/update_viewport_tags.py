import glob
import re

files = glob.glob('public/*.html')
updated = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    if 'viewport-fit=cover' not in content:
        new_content = re.sub(
            r'<meta\s+name=[\"\']viewport[\"\']\s+content=[\"\']([^\"\']+)[\"\']\s*>',
            r'<meta name="viewport" content="\1, viewport-fit=cover">',
            content
        )
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
            updated += 1
            print(f'Updated {f}')

print(f'Total files updated with viewport-fit=cover: {updated}')
