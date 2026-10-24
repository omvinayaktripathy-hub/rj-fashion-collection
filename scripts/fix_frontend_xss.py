import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection\public\js"

ESC_HEADER = "const escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;'));\n"

def process_file(filename, replacements):
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename}: not found")
        return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Ensure escapeHtml is declared at top if not present
    if "escapeHtml" not in content:
        content = ESC_HEADER + content

    for target, repl in replacements:
        if target in content:
            content = content.replace(target, repl)
            print(f"[{filename}] Replaced: {target[:40]}...")
        else:
            print(f"[{filename}] Warning: target not found: {target[:40]}...")

    with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print(f"Finished {filename}")

# 1. cart.js
process_file("cart.js", [
    ('alt="${item.name || \'Product\'}"', 'alt="${escapeHtml(item.name || \'Product\')}"'),
    ('${item.name || \'Designer Ethnic Wear\'}', '${escapeHtml(item.name || \'Designer Ethnic Wear\')}')
])

# 2. checkout.js
process_file("checkout.js", [
    ('${item.name}', '${escapeHtml(item.name)}')
])

# 3. delivery.js
process_file("delivery.js", [
    ('${item.name}', '${escapeHtml(item.name)}'),
    ('${addr.address_type || \'Home\'}', '${escapeHtml(addr.address_type || \'Home\')}')
])

# 4. wishlist.js
process_file("wishlist.js", [
    ('${p.name}', '${escapeHtml(p.name)}')
])

# 5. product-detail.js
process_file("product-detail.js", [
    ('${p.name}', '${escapeHtml(p.name)}')
])

# 6. admin.js
process_file("admin.js", [
    ('${p.name}', '${escapeHtml(p.name)}'),
    ("${r.user_name || 'Verified Buyer'}", "${escapeHtml(r.user_name || 'Verified Buyer')}"),
    ("${r.comment || ''}", "${escapeHtml(r.comment || '')}")
])

all_files = [f for f in os.listdir(BASE_DIR) if f.endswith('.js')]
for fname in all_files:
    fpath = os.path.join(BASE_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()
    if "escapeHtml" not in c:
        with open(fpath, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(ESC_HEADER + c)
        print(f"Added escapeHtml helper to {fname}")

