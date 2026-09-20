// ============================================
// RUNTIME CONFIG LOADER
// ============================================
// This file loads configuration at runtime.
// In development: reads from config.json (gitignored).
// In production: server injects window.__ENV__ via /config.json endpoint.
//
// This file contains NO secrets — it just loads them.

(function () {
  // Default placeholder values — app will fail gracefully if not replaced
  window.__ENV__ = window.__ENV__ || {
    FIREBASE_API_KEY: "REPLACE_ME",
    FIREBASE_AUTH_DOMAIN: "REPLACE_ME",
    FIREBASE_PROJECT_ID: "REPLACE_ME",
    FIREBASE_STORAGE_BUCKET: "REPLACE_ME",
    FIREBASE_MESSAGING_SENDER_ID: "REPLACE_ME",
    FIREBASE_APP_ID: "REPLACE_ME",
    ADMIN_EMAIL: "REPLACE_ME",
    UPI_ID: "REPLACE_ME",
    UPI_PAYEE_NAME: "REPLACE_ME"
  };

  // Try to load config.json synchronously (dev mode / static hosting)
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "config.json", false);
    xhr.send(null);
    if (xhr.status === 200 || xhr.status === 0) {
      const localConfig = JSON.parse(xhr.responseText);
      window.__ENV__ = Object.assign(window.__ENV__, localConfig);
    }
  } catch (e) {
    // config.json not found — expected in production
    // In production, server injects window.__ENV__ before this script runs
  }
})();