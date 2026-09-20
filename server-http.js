const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ============================================
// LOAD .env FILE (no dotenv dependency)
// ============================================
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  No .env file found. Create one from .env.example");
    return {};
  }
  const env = {};
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  });
  return env;
}

const ENV = loadEnv();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============================================
// RUNTIME CONFIG ENDPOINT
// ============================================
// This endpoint serves config values from .env
// The config.js file fetches this at runtime.
// Secrets stay on the server — never in git.
app.get('/config.json', (req, res) => {
  res.json({
    FIREBASE_API_KEY: ENV.FIREBASE_API_KEY || '',
    FIREBASE_AUTH_DOMAIN: ENV.FIREBASE_AUTH_DOMAIN || '',
    FIREBASE_PROJECT_ID: ENV.FIREBASE_PROJECT_ID || '',
    FIREBASE_STORAGE_BUCKET: ENV.FIREBASE_STORAGE_BUCKET || '',
    FIREBASE_MESSAGING_SENDER_ID: ENV.FIREBASE_MESSAGING_SENDER_ID || '',
    FIREBASE_APP_ID: ENV.FIREBASE_APP_ID || '',
    ADMIN_EMAIL: ENV.ADMIN_EMAIL || '',
    UPI_ID: ENV.UPI_ID || '',
    UPI_PAYEE_NAME: ENV.UPI_PAYEE_NAME || ''
  });
});

// ============================================
// STATIC FILE SERVING
// ============================================
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (/\.(js|css|html)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ HTTP Server is running!');
  console.log('═══════════════════════════════════════════');
  console.log(`💻 On your laptop:  http://localhost:${PORT}`);
  console.log(`📱 On your phone:   http://${ip}:${PORT}`);
  console.log('═══════════════════════════════════════════');
  console.log('🔒 Config endpoint: /config.json (loads from .env)');
  console.log('═══════════════════════════════════════════\n');
});