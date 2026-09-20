// ============================================
// FIREBASE CONFIG LOADER
// ============================================
// This file contains NO secrets.
// It reads from window.__ENV__, which is populated by config.js
// (which reads from the gitignored config.json or server endpoint).

function getEnv(key, fallback = "") {
  return (window.__ENV__ && window.__ENV__[key]) || fallback;
}

export const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("FIREBASE_APP_ID")
};

export const ADMIN_EMAIL = getEnv("ADMIN_EMAIL");
export const UPI_ID = getEnv("UPI_ID");
export const UPI_PAYEE_NAME = getEnv("UPI_PAYEE_NAME", "RJ Fashion");

// Validate config loaded
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "REPLACE_ME") {
  console.error(
    "❌ Firebase config not loaded. " +
    "Create config.json (dev) or set env vars (production). " +
    "See .env.example for required keys."
  );
}