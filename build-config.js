// build-config.js
const fs = require('fs');

const config = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  UPI_ID: process.env.UPI_ID || "",
  UPI_PAYEE_NAME: process.env.UPI_PAYEE_NAME || ""
};

fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
console.log('✅ config.json generated');