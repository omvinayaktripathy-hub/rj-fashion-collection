import subprocess
import re
import os

patterns = {
    "AWS Access Key": r"\b(AKIA[0-9A-Z]{16})\b",
    "AWS Secret Key": r"\b([0-9a-zA-Z/+]{40})\b",
    "Stripe Live Key": r"\b(sk_live_[0-9a-zA-Z]{24,})\b",
    "Stripe Restricted Key": r"\b(rk_live_[0-9a-zA-Z]{24,})\b",
    "Stripe Live Webhook": r"\b(whsec_[0-9a-zA-Z]{24,})\b",
    "GitHub Token": r"\b(gh[pousr]_[0-9a-zA-Z]{36,})\b",
    "Private Key": r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "Generic Password Assignment": r"(?:password|secret|passwd|token)\s*=\s*['\"][^'\"]{8,}['\"]",
}

# Get list of tracked files
tracked_files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()

findings = []

for f in tracked_files:
    if not os.path.exists(f):
        continue
    # Skip binary files or lock files
    if f.endswith(('.sqlite', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.pdf', '.zip', '.woff', '.woff2')):
        continue
    
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            for idx, line in enumerate(fp, 1):
                # Check for explicit test/example/placeholder files
                for rule, rx in patterns.items():
                    m = re.search(rx, line, re.IGNORECASE)
                    if m:
                        val = m.group(0)
                        # Filter out common false positives and placeholders
                        if any(fp_word in line.lower() for fp_word in [
                            'placeholder', 'example', 'your_', 'test_', 'dummy', 'change_me',
                            'localhost', 'password_hash', 'input type="password"', 'enter password',
                            'password_reset', 'validatestrength', 'super_secret', 'schema',
                            'npm', 'license', 'integrity', 'sha512', 'sha256', 'hash', 'buffer'
                        ]):
                            continue
                        if rule == "Generic Password Assignment" and any(k in line.lower() for k in [
                            'validate', 'confirm', 'type=', 'placeholder=', 'label', 'err'
                        ]):
                            continue
                        findings.append({
                            "file": f,
                            "line": idx,
                            "rule": rule,
                            "match_preview": f"{val[:4]}...[MASKED]"
                        })
    except Exception as e:
        pass

print(f"Total files scanned: {len(tracked_files)}")
print(f"Potential secrets found: {len(findings)}")
for item in findings:
    print(f"  [{item['rule']}] {item['file']}:{item['line']} -> {item['match_preview']}")
