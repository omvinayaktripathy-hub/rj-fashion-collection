# RJ Fashion Collection

Women's fashion e-commerce store built with vanilla JS + Firebase.

## 🚀 Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/rj-fashion-collection.git
cd rj-fashion-collection
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your config

```bash
cp .env.example .env
```

Then edit `.env` with your real Firebase credentials:

```env
FIREBASE_API_KEY=your_actual_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
ADMIN_EMAIL=your_admin_email@example.com
UPI_ID=your_upi_id@bank
UPI_PAYEE_NAME=Your Business Name
```

### 4. Run locally

```bash
npm start
```

Open http://localhost:3000

## 🔐 Security

- **Never commit `.env`** — it's gitignored.
- Firebase API keys are **public by design** — security is enforced by:
  - **Firestore Security Rules** (set in Firebase Console)
  - **API key restrictions** (Google Cloud Console → Credentials)
  - **Firebase App Check**
- Admin access is verified by Firestore Rules, not client-side checks.

## 📦 Deployment

### Vercel / Netlify

1. Connect your GitHub repo
2. Add environment variables in the dashboard (same keys as `.env`)
3. Deploy

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📁 Structure

```
├── index.html          # Homepage
├── admin.html          # Admin panel
├── account.html        # Customer login
├── cart.html           # Shopping cart
├── checkout.html       # Checkout + UPI payment
├── wishlist.html       # Wishlist
├── about.html          # About page
├── help.html           # Help center
├── terms.html          # Terms
├── privacy.html        # Privacy policy
├── style.css           # All styles
├── script.js           # Main app logic
├── config.js           # Runtime config loader
├── firebase-config.js  # Firebase config (loads from config.js)
├── server-http.js      # Dev server (HTTP)
├── server.js           # Dev server (HTTPS, self-signed)
├── .env.example        # Template for env vars
└── .gitignore          # Excludes secrets
```

## 📄 License

ISC