# RJ FASHION COLLECTION — PRODUCTION DEPLOYMENT GUIDE

**Target Firebase Project:** `rj-fashion-collection` (Project Number: `136818820501`)  
**Production URL:** https://rj-fashion-collection.web.app/  
**Preview Channel URL:** https://rj-fashion-collection--preview-rm2impts.web.app/  

This guide provides exact, tested step-by-step instructions for deploying updates safely to production.

---

## 1. Local Pre-Deployment Verification

Always execute the complete 118-test automated suite locally before initiating any production deployment:

```powershell
# Navigate to project directory
cd C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection

# Run full test suite (E2E, Security, Checkout, Delivery, Lightbox, RBAC, Firebase Rules)
npm test
```
*Requirement: 100% of all 118 tests must pass before proceeding.*

```powershell
# Verify zero package vulnerabilities
npm audit
```

---

## 2. Deploying to Firebase Preview Channel (Smoke Testing)

Deploy to an isolated temporary preview URL to verify formatting, responsive layouts, and routing before modifying the public live site:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection\serviceAccountKey.json"

# Deploy to preview channel
npx --yes firebase-tools hosting:channel:deploy preview --project rj-fashion-collection
```

### Preview Channel Verification Checklist:
- [ ] Open the output preview URL (e.g. `https://rj-fashion-collection--preview-xxxx.web.app`).
- [ ] Test clean URL routes: `/delivery`, `/checkout`, `/shop`, `/cart`, `/categories`.
- [ ] Confirm product multi-angle lightbox images load cleanly without 404s.
- [ ] Confirm no horizontal scrolling on mobile viewports.

---

## 3. Deploying to Production Live Site

Once preview verification is complete, push the static assets to the production CDN:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection\serviceAccountKey.json"

# Deploy Hosting to production
npx --yes firebase-tools deploy --only hosting --project rj-fashion-collection
```

---

## 4. Deploying Firestore & Storage Security Rules

The security rules protect cloud databases from unauthorized access and IDOR attacks.

### Option A: Firebase Web Console (Recommended & Instant)
1. **Firestore Rules**:
   - Open [Firebase Console &rarr; Firestore &rarr; Rules](https://console.firebase.google.com/project/rj-fashion-collection/firestore/rules).
   - Paste contents of `firestore.rules`.
   - Click **Publish**.
2. **Storage Rules**:
   - Open [Firebase Console &rarr; Storage &rarr; Rules](https://console.firebase.google.com/project/rj-fashion-collection/storage/rules).
   - Paste contents of `storage.rules`.
   - Click **Publish**.

### Option B: CLI Deployment (Requires Project Owner Login)
```powershell
npx --yes firebase-tools login
npx --yes firebase-tools deploy --only firestore:rules,storage --project rj-fashion-collection
```

---

## 5. Post-Deployment Verification & Smoke Tests

After deploying, verify the live production endpoints:

```powershell
# Verify live homepage returns HTTP 200
node -e "fetch('https://rj-fashion-collection.web.app').then(r => console.log('Homepage status:', r.status))"

# Verify clean rewrite for delivery page
node -e "fetch('https://rj-fashion-collection.web.app/delivery').then(r => console.log('Delivery page status:', r.status))"

# Verify clean rewrite for shop catalog
node -e "fetch('https://rj-fashion-collection.web.app/shop').then(r => console.log('Shop page status:', r.status))"
```
*Expected output for all endpoints:* `200`
