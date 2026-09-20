const express = require('express');
const https = require('https');
const selfsigned = require('selfsigned');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (/\.(js|css|html)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Generate cert with modern key
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
      ],
    },
  ],
});

// Force modern TLS ciphers that Chrome accepts
const options = {
  key: pems.private,
  cert: pems.cert,
  minVersion: 'TLSv1.2',
  ciphers: [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
  ].join(':'),
  honorCipherOrder: true,
};

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ HTTPS Server is running!');
  console.log('═══════════════════════════════════════════');
  console.log(`💻 On your laptop:  https://localhost:${PORT}`);
  console.log(`📱 On your phone:   https://${ip}:${PORT}`);
  console.log('═══════════════════════════════════════════');
  console.log('⚠️  Browser will warn about certificate.');
  console.log('    Click "Advanced" → "Proceed" to continue.');
  console.log('═══════════════════════════════════════════\n');
});