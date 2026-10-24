import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
VERSION = "20261024-09"

def update_index_html():
    path = os.path.join(BASE_DIR, "public", "index.html")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update supporting copy exactly to match the master implementation brief
    content = content.replace(
        '<p class="grand-hero-subtitle" id="hero-subtitle-text">A new perspective on modern fashion. Discover the signature edit from RJ Fashion Collection.</p>',
        '<p class="grand-hero-subtitle" id="hero-subtitle-text">A considered collection. A contemporary point of view. Discover the signature style of RJ Fashion Collection.</p>'
    )

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated hero subtitle in index.html!")

def update_all_html_files():
    public_dir = os.path.join(BASE_DIR, "public")
    html_files = [f for f in os.listdir(public_dir) if f.endswith(".html")]

    for filename in html_files:
        filepath = os.path.join(public_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        # Bump cache version to v=20261024-09
        html = re.sub(r'(\.(?:js|css))\?v=[a-zA-Z0-9_-]+', rf'\1?v={VERSION}', html)

        with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(html)

    print(f"Updated all HTML files with version {VERSION}!")

if __name__ == '__main__':
    update_index_html()
    update_all_html_files()
