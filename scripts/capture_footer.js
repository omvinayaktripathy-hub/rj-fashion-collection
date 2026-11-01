const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ARTIFACT_DIR = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';

async function captureFooterProperly() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9335;
  const userDataDir = path.join(os.tmpdir(), 'edge-test-footer-' + Date.now());

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

  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
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

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await call('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
  await new Promise(r => setTimeout(r, 3000));

  // Scroll to footer and wait for lazy load
  await call('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('.site-footer');
      if (footer) footer.scrollIntoView({ block: 'center' });
    })()`
  });

  await new Promise(r => setTimeout(r, 1500));

  const footerData = await call('Runtime.evaluate', {
    expression: `(() => {
      const footerLockup = document.querySelector('.footer-brand-logo-lockup');
      if (!footerLockup) return null;
      const rect = footerLockup.getBoundingClientRect();
      const lightImg = footerLockup.querySelector('.logo-img-light');
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        imgComplete: lightImg ? lightImg.complete : false,
        naturalWidth: lightImg ? lightImg.naturalWidth : 0
      };
    })()`,
    returnByValue: true
  });

  console.log('Footer Lockup Data:', footerData.result.value);

  if (footerData.result.value) {
    const b = footerData.result.value;
    const clip = {
      x: Math.max(0, b.x - 20),
      y: Math.max(0, b.y - 20),
      width: b.width + 100,
      height: b.height + 120,
      scale: 1
    };
    const imgRes = await call('Page.captureScreenshot', { clip });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_footer_brand_logo_verified.png'), Buffer.from(imgRes.data, 'base64'));
    console.log('Saved proper footer screenshot: live_footer_brand_logo_verified.png');
  }

  ws.close();
  edgeProc.kill('SIGKILL');
}

captureFooterProperly().catch(console.error);
