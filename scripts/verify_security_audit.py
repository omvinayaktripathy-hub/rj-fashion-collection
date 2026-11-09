import os
import sys
import json
import re

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")

print("=" * 60)
print("[SECURITY AUDIT] RJ FASHION COLLECTION COMPREHENSIVE SCAN")
print("=" * 60)

passed = 0
failed = 0

def check(name, condition, error_msg=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} - {error_msg}")
        failed += 1

# 1. Verify deleted sensitive files from public/
check(
    "2FA QR code removed from public/images/",
    not os.path.exists(os.path.join(PUBLIC_DIR, "images", "google-authenticator-qr.png")),
    "google-authenticator-qr.png still exists in public/images/!"
)

check(
    "Uploads directory removed from public/",
    not os.path.exists(os.path.join(PUBLIC_DIR, "uploads")),
    "public/uploads still exists!"
)

check(
    "auth-blade.html removed from public/",
    not os.path.exists(os.path.join(PUBLIC_DIR, "auth-blade.html")),
    "auth-blade.html still exists in public/!"
)

check(
    "public/api directory removed",
    not os.path.exists(os.path.join(PUBLIC_DIR, "api")),
    "public/api still exists!"
)

check(
    "public/images/uploads directory removed",
    not os.path.exists(os.path.join(PUBLIC_DIR, "images", "uploads")),
    "public/images/uploads still exists!"
)

# 2. Verify no plain text admin password or static secret bypass in public/
sensitive_patterns = [
    r"OMvinayaktripathy",
    r"RJFC77ADMIN22OMVINAYAK33ROYAL444",
    r"testAuthorizedScan",
    r"sk_live_[0-9a-zA-Z]{24}",
    r"-----BEGIN (RSA|EC|PRIVATE) KEY-----"
]

found_leaks = []
for root, _, files in os.walk(PUBLIC_DIR):
    for f in files:
        if f.endswith((".js", ".html", ".json", ".css")):
            fp = os.path.join(root, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                for pat in sensitive_patterns:
                    if re.search(pat, content):
                        found_leaks.append(f"{os.path.relpath(fp, ROOT_DIR)} matched '{pat}'")

check(
    "Zero secrets, plain passwords, or test bypasses in public/",
    len(found_leaks) == 0,
    f"Found leaks: {found_leaks}"
)

# 3. Verify firebase.json ignore configuration
with open(os.path.join(ROOT_DIR, "firebase.json"), "r", encoding="utf-8") as f:
    fb_config = json.load(f)

hosting_ignore = fb_config.get("hosting", {}).get("ignore", [])
critical_ignores = [
    "**/*.sqlite*",
    "**/*.env*",
    "**/serviceAccountKey*.json",
    "**/database/**",
    "**/uploads/**"
]
has_critical_ignores = all(ig in hosting_ignore for ig in critical_ignores)
check("firebase.json contains critical private ignore rules", has_critical_ignores)

# 4. Verify firebase.json security redirects
redirects = fb_config.get("hosting", {}).get("redirects", [])
redirect_sources = [r.get("source") for r in redirects]
has_git_redirect = "/.git{,/**}" in redirect_sources
has_env_redirect = "/.env{,/**}" in redirect_sources
has_qr_redirect = "/images/google-authenticator-qr.png" in redirect_sources
check("firebase.json contains security redirects for .git, .env, and QR code", has_git_redirect and has_env_redirect and has_qr_redirect)

# 5. Verify firestore.rules hardening
with open(os.path.join(ROOT_DIR, "firestore.rules"), "r", encoding="utf-8") as f:
    fs_rules = f.read()

check("firestore.rules blocks tryon collections", "allow read, write: if false;" in fs_rules and "tryon" in fs_rules)
check("firestore.rules requires owner authentication for admin_scans approval", "request.auth.token.email.lower() == 'omvinayakwork@gmail.com'" in fs_rules)

# 6. Verify storage.rules hardening
with open(os.path.join(ROOT_DIR, "storage.rules"), "r", encoding="utf-8") as f:
    st_rules = f.read()

check("storage.rules blocks tryon uploads", "allow read, write, delete: if false;" in st_rules and "tryon" in st_rules)

# 7. Verify robots.txt hardening
with open(os.path.join(PUBLIC_DIR, "robots.txt"), "r", encoding="utf-8") as f:
    robots = f.read()

check("robots.txt disallows sensitive paths (/admin, /checkout, /account, /orders, /uploads/)", "Disallow: /admin" in robots and "Disallow: /checkout" in robots and "Disallow: /orders" in robots and "Disallow: /uploads/" in robots)

# 8. Verify server.js dotfiles deny
with open(os.path.join(ROOT_DIR, "server.js"), "r", encoding="utf-8") as f:
    server_js = f.read()

check("server.js sets dotfiles: 'deny'", "dotfiles: 'deny'" in server_js)

print("=" * 60)
print(f"AUDIT SUMMARY: {passed} PASSED, {failed} FAILED")
print("=" * 60)

if failed > 0:
    sys.exit(1)
