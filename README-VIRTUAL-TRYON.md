# RJ Fashion Collection — Free AI Virtual Try-On Integration

> **Luxury Virtual Fitting Room** designed exclusively for RJ Fashion Collection Indian ethnic wear and modern gowns. 
> Built on a **100% Free-First Architecture** with Zero API token fees, Zero GPU lock-in, and strict GDPR-grade customer privacy.

---

## 💎 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Hardware & Free-First Strategy](#-hardware--free-first-strategy)
3. [Windows Installation & Quick Start](#-windows-installation--quick-start)
4. [Customer Shopping Experience](#-customer-shopping-experience)
5. [Privacy & Security Guarantee](#-privacy--security-guarantee)
6. [Admin Dashboard Controls](#-admin-dashboard-controls)
7. [Automated Verification & Testing](#-automated-verification--testing)
8. [Connecting Custom or Future Models](#-connecting-custom-or-future-models)

---

## 🏛️ Architecture Overview

The system strictly decouples the storefront backend from the AI inference service:

```
[ Customer Browser ]
       │
       ▼ (HTTPS / Session Protected)
[ Node.js Express Storefront (:3000) ]
       │
       ├── SQLite Database (`tryon_settings`, `tryon_logs`)
       ├── Magic Byte & Mime-Type Sanitizer
       ├── CSRF & Rate-Limiting Protection
       ├── Secure Temporary Private Cache (`public/uploads/tryon/temp/`)
       │
       ▼ (Private Internal HTTP Proxy)
[ Python AI Microservice (:5000) ]
       ├── Mode 1: Free Hugging Face ZeroGPU (`yisol/IDM-VTON` via Gradio Client)
       ├── Mode 2: Local PyTorch (if 12GB+ NVIDIA VRAM available)
       └── Mode 3: High-Fidelity Resilient Edge & Silhouette Pipeline (Offline Fallback)
```

---

## 🖥️ Hardware & Free-First Strategy

### Hardware Assessment
Full unquantized diffusion try-on pipelines (such as `IDM-VTON` or `CatVTON` weights) require **12 GB to 16 GB of dedicated VRAM**. On consumer systems with 4 GB to 8 GB VRAM, local diffusion causes immediate CUDA Out-Of-Memory (OOM) errors.

### The Zero-Cost Solution
1. **Free Hugging Face ZeroGPU (`gradio_free`)**:
   - The microservice connects via the free, official open-source Hugging Face Space `yisol/IDM-VTON` at **zero cost** and with **zero paid API subscriptions**.
   - Optional: Add a free Hugging Face User Access Token (`HF_TOKEN`) in `ai-service/.env` to bypass anonymous public queues.
2. **Resilient Local Pipeline (`hybrid_offline`)**:
   - If the network drops or the cloud ZeroGPU queue is temporarily full, the service automatically engages an edge-aware silhouette and ambient lighting composition engine so customers never experience a broken UI or 500 error.

---

## 🚀 Windows Installation & Quick Start

### Step 1: Start the E-Commerce Storefront
From the project root:
```powershell
# Install Node dependencies (if not already installed)
npm install

# Start the Storefront and Backend API
npm start
```
Storefront runs at `http://localhost:3000`  
Private Admin Portal runs at `http://localhost:3000/admin`

---

### Step 2: Start the AI Try-On Microservice
Open a new PowerShell terminal:
```powershell
cd ai-service

# Create and activate Python virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install free dependencies
pip install -r requirements.txt

# Start the AI Inference Microservice
python app.py
```
AI Microservice runs on `http://127.0.0.1:5000`.  
Health check endpoint: `http://127.0.0.1:5000/health`

> **Note**: Even if you do not run `pip install` immediately, `app.py` contains a built-in Python standard library fallback server that starts without third-party dependencies!

---

## ✨ Customer Shopping Experience

1. **Eligible Apparel Categories**: Sarees, Kurtis, Indo-Western Dresses, Bridal Lehengas, and Ethnic Wear.
2. **Prominent Try-On Button**: Displayed on product detail pages:
   ```
   ✨ Try It On with AI   [VIRTUAL FITTING ROOM]
   ```
3. **Luxury Virtual Dressing Room**:
   - Styled with royal burgundy (`#700037`), champagne gold (`#c5a059`), ivory, and rose pink with dark-mode support.
   - Upload personal photo via drag-and-drop or file picker with instant preview, replace, and remove controls.
   - Clear guidelines (lighting, posture, background) to ensure optimal drape.
   - Explicit informed consent checkbox.
4. **Real AI Progress Status**:
   - Real-time animated status cycling through silhouette detection, drape alignment, and lighting harmonization.
5. **Result Studio**:
   - **Interactive Split Slider**: Drag the champagne gold handle across the photo to compare before & after try-on.
   - **Add Outfit to Cart**: Adds the apparel directly into the shopping cart.
   - **Download Preview**: Saves high-resolution result image to customer device.
   - **Change Outfit / Try Another**: Switch clothing without re-uploading your photo.
   - **Delete My Photos**: Instant GDPR erasure.

---

## 🔒 Privacy & Security Guarantee

- **Zero Photo Retention in User Profiles**: Uploaded photos are never saved to user profiles or databases.
- **No Training on Customer Photos**: Explicit policy guarantees customer photos are never used for AI training.
- **Session Token Isolation**: Results are tied to a cryptographically random session token; other users cannot access private try-ons.
- **Instant Erasure Button**: Customers can click `🗑️ Delete My Photos` to immediately destroy their files on the server.
- **Hourly Auto-Purge Cron**: An automatic server cron purges any temporary files older than `retention_hours` (default: 2 hours).
- **Git Protection**: `public/uploads/tryon/` and `ai-service/temp_ai_cache/` are excluded in `.gitignore`.

---

## 🛠️ Admin Dashboard Controls

Log in to `http://localhost:3000/admin` and select the **✨ Virtual Try-On** tab:

1. **Master Enable / Disable Switch**: Turn virtual try-on on or off instantly across the store.
2. **AI Inference Endpoint Configuration**: Switch between `http://localhost:5000` or a remote custom server.
3. **Live AI Service Health Ping**: View live latency and active inference mode.
4. **Apparel Category Selectors**: Check or uncheck eligible clothing types.
5. **Resource Limits**: Configurable upload max size (MB) and daily limit per IP/user.
6. **Auto-Purge & Manual Storage Clean**: View temporary disk usage and click `Purge Cached Photos Now` to free space.
7. **Telemetry Logs**: Monitor live customer sessions, processing duration, and model engines with zero PII exposure.

---

## 🧪 Automated Verification & Testing

Run the automated test suite anytime:
```powershell
node test-tryon-suite.js
```

### Verified Test Cases:
- [x] `GET /api/tryon/settings` returns active config and supported apparel.
- [x] `POST /api/tryon/process` rejects requests without consent (`HTTP 400`).
- [x] Magic byte verification rejects fake or corrupted image uploads.
- [x] Rejection of non-existent product IDs.
- [x] Full try-on pipeline with session token isolation and disk caching.
- [x] `DELETE /api/tryon/delete` immediately removes customer files from disk and marks DB records as deleted.
- [x] Unauthorized access to admin try-on endpoints is blocked (`HTTP 403`).

---

## 🔄 Connecting Custom or Future Models

To route to a different model (e.g., CatVTON, OOTDiffusion, or a dedicated RunPod/Colab instance):

1. **In `ai-service/.env`**:
   ```env
   TRYON_MODE=gradio_free
   HF_SPACE_NAME=your-username/your-custom-vton-space
   HF_TOKEN=hf_your_free_read_token
   ```
2. **Or point the Express server directly**:
   Update `inference_url` in the Admin Dashboard (`http://localhost:3000/admin`) to your remote API URL.
