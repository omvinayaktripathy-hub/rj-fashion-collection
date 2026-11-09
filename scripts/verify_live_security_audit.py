import urllib.request
import urllib.error
import ssl
import sys

ctx = ssl.create_default_context()

BASE_URL = "https://rj-fashion-collection.web.app"

tests = [
    {
        "name": "Live Storefront Root Homepage",
        "url": f"{BASE_URL}/",
        "expected_status": [200],
        "check_headers": True
    },
    {
        "name": "Admin 2FA QR Code Leaked Image (Must be 404 / 302 redirect)",
        "url": f"{BASE_URL}/images/google-authenticator-qr.png",
        "expected_status": [404, 302],
        "check_headers": False
    },
    {
        "name": "Prototype auth-blade.html (Must be 404 / 302 redirect)",
        "url": f"{BASE_URL}/auth-blade.html",
        "expected_status": [404, 302],
        "check_headers": False
    },
    {
        "name": "Residual Uploads Directory (Must be 404 / 302 redirect)",
        "url": f"{BASE_URL}/uploads/tryon/temp/user_test_delete_1792565489817.jpg",
        "expected_status": [404, 302],
        "check_headers": False
    },
    {
        "name": "Git Repository Probe /.git/HEAD (Must be 404 / 302 redirect)",
        "url": f"{BASE_URL}/.git/HEAD",
        "expected_status": [404, 302],
        "check_headers": False
    },
    {
        "name": "Environment Secrets Probe /.env (Must be 404 / 302 redirect)",
        "url": f"{BASE_URL}/.env",
        "expected_status": [404, 302],
        "check_headers": False
    },
    {
        "name": "Service Account Key Probe /serviceAccountKey.json (Must be 404 / 302 redirect)",
        "url": f"{BASE_URL}/serviceAccountKey.json",
        "expected_status": [404, 302],
        "check_headers": False
    }
]

print("=" * 65)
print("[LIVE PRODUCTION PROBE] RJ FASHION COLLECTION SECURITY AUDIT")
print(f"Target: {BASE_URL}")
print("=" * 65)

passed = 0
failed = 0

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        return fp
    def http_error_301(self, req, fp, code, msg, headers):
        return fp

opener = urllib.request.build_opener(NoRedirectHandler)

for t in tests:
    req = urllib.request.Request(t["url"], headers={"User-Agent": "SecurityAuditClient/2.0"})
    status = None
    headers = {}
    try:
        res = opener.open(req, timeout=10)
        status = res.status
        headers = dict(res.headers)
    except urllib.error.HTTPError as e:
        status = e.code
        headers = dict(e.headers)
    except Exception as ex:
        print(f"  [FAIL] {t['name']} -> Error: {ex}")
        failed += 1
        continue

    if status in t["expected_status"]:
        print(f"  [PASS] {t['name']} -> HTTP {status}")
        passed += 1

        if t.get("check_headers"):
            waf_header = headers.get("x-waf-protection") or headers.get("X-WAF-Protection")
            csp = headers.get("content-security-policy") or headers.get("Content-Security-Policy")
            hsts = headers.get("strict-transport-security") or headers.get("Strict-Transport-Security")
            print(f"     Security Headers: WAF={waf_header} | HSTS={'YES' if hsts else 'NO'} | CSP={'YES' if csp else 'NO'}")
    else:
        print(f"  [FAIL] {t['name']} -> Got HTTP {status}, expected {t['expected_status']}")
        failed += 1

print("=" * 65)
print(f"LIVE AUDIT SUMMARY: {passed} PASSED, {failed} FAILED")
print("=" * 65)

if failed > 0:
    sys.exit(1)
