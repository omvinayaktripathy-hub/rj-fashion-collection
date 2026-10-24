import os

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection\public\js"

ESC_FN = """function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
"""

all_files = [f for f in os.listdir(BASE_DIR) if f.endswith('.js')]
for fname in all_files:
    fpath = os.path.join(BASE_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()
    if "function escapeHtml" not in c and "const escapeHtml" not in c:
        with open(fpath, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(ESC_FN + c)
        print(f"Added function escapeHtml to {fname}")
