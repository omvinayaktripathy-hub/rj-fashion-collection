const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ARTIFACT_DIR = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          hasHomeTitle: data.includes('RJ Fashion Collection'),
          length: data.length
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function main() {
  console.log('--- 1. Testing Route Availability on Firebase Production ---');
  const urls = [
    'https://rj-fashion-collection.web.app/',
    'https://rj-fashion-collection.web.app/home',
    'https://rj-fashion-collection.web.app/-home'
  ];

  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(`URL: ${u} => Status: ${res.status} | Has Brand: ${res.hasHomeTitle} | Length: ${res.length}`);
  }

  console.log('\n--- 2. Visual & Computed CSS Verification via Headless Edge ---');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9334;
  const userDataDir = path.join(os.tmpdir(), 'edge-test-profile-' + Date.now());

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const tabData = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const list = JSON.parse(d);
        resolve(list.find(t => t.type === 'page') || list[0]);
      });
    }).on('error', reject);
  });

  const wsEndpoint = tabData.webSocketDebuggerUrl;
  console.log('Connected to Edge CDP at:', wsEndpoint);

  // Native global WebSocket in Node.js 22/24
  const ws = new WebSocket(wsEndpoint);
  await new Promise(r => ws.onopen = r);

  let idSeq = 1;
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idSeq++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await call('Page.enable');
  await call('Runtime.enable');

  // --- DESKTOP VIEWPORT TEST (1280x800) ---
  console.log('\nTesting Desktop Viewport (1280x800)...');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await call('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
  await new Promise(r => setTimeout(r, 4000));

  const desktopAudit = await call('Runtime.evaluate', {
    expression: `(() => {
      const hamburger = document.querySelector('.rj-hamburger-btn');
      const hamburgerDisplay = hamburger ? window.getComputedStyle(hamburger).display : 'not_found';
      const desktopNav = document.querySelector('.site-nav');
      const desktopNavDisplay = desktopNav ? window.getComputedStyle(desktopNav).display : 'not_found';
      const footerMonogram = document.querySelector('.footer-brand-logo-lockup img');
      const footerMonogramVisible = !!(footerMonogram && footerMonogram.offsetWidth > 0 && footerMonogram.offsetHeight > 0);
      const docOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        hamburgerDisplay,
        desktopNavDisplay,
        footerMonogramExists: !!footerMonogram,
        footerMonogramVisible,
        hasHorizontalOverflow: docOverflow,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    })()`,
    returnByValue: true
  });

  console.log('Desktop Audit Results:', desktopAudit.result.value);

  // Screenshot desktop header
  const desktopHeaderShot = await call('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 1280, height: 260, scale: 1 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_desktop_header_verified.png'), Buffer.from(desktopHeaderShot.data, 'base64'));
  console.log('Saved desktop header screenshot: live_desktop_header_verified.png');

  // Screenshot footer brand
  const footerShot = await call('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('.footer-brand');
      if (!footer) return null;
      const rect = footer.getBoundingClientRect();
      return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height };
    })()`,
    returnByValue: true
  });

  if (footerShot.result.value) {
    const fBox = footerShot.result.value;
    const footerImg = await call('Page.captureScreenshot', {
      clip: { x: Math.max(0, fBox.x - 10), y: Math.max(0, fBox.y - 10), width: fBox.width + 20, height: fBox.height + 20, scale: 1 }
    });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_footer_brand_logo_verified.png'), Buffer.from(footerImg.data, 'base64'));
    console.log('Saved footer brand screenshot: live_footer_brand_logo_verified.png');
  }

  // --- MOBILE VIEWPORT TEST (390x844) ---
  console.log('\nTesting Mobile Viewport (390x844)...');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await call('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
  await new Promise(r => setTimeout(r, 4000));

  const mobileAudit = await call('Runtime.evaluate', {
    expression: `(() => {
      const hamburger = document.querySelector('.rj-hamburger-btn');
      const hamburgerDisplay = hamburger ? window.getComputedStyle(hamburger).display : 'not_found';
      const logoTitle = document.querySelector('.brand-logo .logo-title');
      const logoRect = logoTitle ? logoTitle.getBoundingClientRect() : null;
      const docOverflow = document.documentElement.scrollWidth > window.innerWidth;
      
      return {
        hamburgerDisplay,
        hasHorizontalOverflow: docOverflow,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        logoRight: logoRect ? Math.round(logoRect.right) : null,
        fitsInViewport: logoRect ? logoRect.right <= 390 : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Mobile Audit Results:', mobileAudit.result.value);

  const mobileHeaderShot = await call('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 390, height: 160, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_mobile_header_verified.png'), Buffer.from(mobileHeaderShot.data, 'base64'));
  console.log('Saved mobile header screenshot: live_mobile_header_verified.png');

  ws.close();
  edgeProc.kill('SIGKILL');
  console.log('\n🎉 ALL LIVE VERIFICATION CHECKS COMPLETE!');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
