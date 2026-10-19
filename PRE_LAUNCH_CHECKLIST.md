# RJ FASHION COLLECTION — PRE-LAUNCH PRODUCTION CHECKLIST

This checklist outlines all verified automated controls and remaining manual configuration tasks required before opening the store to public paying customers.

---

## 1. Automated Security & Code Controls (Status: 100% VERIFIED ✅)

- [x] **No Public Admin Links**: Verified homepage and navigation contain zero public admin links or credentials.
- [x] **Password Protection**: Passwords hashed with bcrypt (cost factor 10); hashes never exposed in APIs.
- [x] **Multi-Persona Authorization**: Customer A cannot read, cancel, or delete Customer B's orders or addresses.
- [x] **Server-Side Pricing**: Order totals and discounts calculated strictly on backend; client tampering rejected.
- [x] **SQL Injection Defense**: Parameterized queries on 100% of SQLite database calls; sort columns whitelisted.
- [x] **XSS Sanitization**: Dangerous HTML/script tags stripped server-side before database storage.
- [x] **Anti-CSRF Tokens**: Double-submit cookie with `X-CSRF-Token` validation on authenticated mutations.
- [x] **Rate Limiting**: In-memory rate limiting active for auth (60 req/min), orders (100 req/min), and APIs.
- [x] **Stripe Webhook Verification**: Cryptographic HMAC-SHA256 signature verification enforced using raw body.
- [x] **File Upload Security**: Magic byte inspection and MIME whitelist (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`).
- [x] **Firestore Security Rules**: Deployed with default deny, catalog public read, and anti-IDOR isolation.
- [x] **Firebase Storage Rules**: Published with customer isolation, 10MB photo cap, and MIME validation.
- [x] **Clean URL Rewrites**: Firebase Hosting maps `/delivery`, `/checkout`, `/admin`, `/shop`, `/cart` seamlessly.
- [x] **Zero Vulnerabilities**: `npm audit` reports 0 vulnerabilities.

---

## 2. Store Owner Pre-Launch Action Items (Pending Owner Action ⚠️)

### A. Payment Gateway Production Keys
- [ ] **Razorpay Live Activation**:
  - Replace `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` with live keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).
  - Verify bank account KYC is active for Indian rupee settlements.
- [ ] **Stripe Live Activation** (Optional if using Razorpay as primary):
  - Replace `pk_test_...` and `sk_test_...` with live production keys from Stripe Dashboard.
  - Register production webhook endpoint: `https://your-domain.com/api/payment/stripe/webhook`.
  - Add production `STRIPE_WEBHOOK_SECRET` to `.env`.
- [ ] **Merchant UPI ID**:
  - Confirm `MERCHANT_UPI_ID` (default: `q070080131@ybl`) is the active store UPI account.

### B. Automated Transactional Emails (Nodemailer SMTP)
- [ ] **Email SMTP Setup**:
  - Generate a 16-character **Google App Password** for `orders@rjfashion.com` (or store Gmail account).
  - Update `.env`:
    ```env
    EMAIL_USER=orders@rjfashion.com
    EMAIL_PASS=your_16_character_app_password
    EMAIL_ENABLED=true
    ```
  - Test order confirmation email delivery.

### C. Change Default Administrator Password
- [ ] **Default Admin Credentials Rotation**:
  - Log in to `/admin` using default credentials.
  - Immediately rotate administrator password to a strong 16+ character password.
  - Enable TOTP Multi-Factor Authentication (MFA) in the Admin Profile settings.

### D. Custom Domain & DNS Mapping (Optional)
- [ ] **Custom Domain Setup**:
  - If using a custom domain (e.g. `rjfashion.com`):
    - Open **Firebase Console &rarr; Hosting &rarr; Custom Domains**.
    - Add `rjfashion.com` and `www.rjfashion.com`.
    - Update DNS records (A Records / TXT records) at your domain registrar.
    - Wait for Google automatic SSL certificate provisioning (usually 15–60 minutes).

### E. Backup & Recovery Schedule
- [ ] **Production Database Backup**:
  - Ensure daily automated copies of `database/database.sqlite` are stored off-server.
  - Follow instructions in [`ROLLBACK_AND_BACKUP.md`](file:///C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/ROLLBACK_AND_BACKUP.md).
