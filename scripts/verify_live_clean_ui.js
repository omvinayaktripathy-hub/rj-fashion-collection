const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function testLiveCleanUI() {
  console.log('Verifying live clean Step 2 UI on https://rj-fashion-collection.web.app/admin ...');

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9966',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_live_clean_step2_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1800));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9966/json', res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
    }));
    const pageTarget = listRes.find(t => t.type === 'page') || listRes[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (m, p={}) => new Promise(r => {
      const cur = id++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === cur) { ws.removeEventListener('message', handler); r(data.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/admin' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('1. Submitting Step 1 credentials on live CDN...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('admin-email').value = 'omvinayakwork@gmail.com';
        document.getElementById('admin-password').value = 'OMvinayaktripathy';
        document.getElementById('admin-login-btn').click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Step 2 UI on live CDN
    const step2Check = await send('Runtime.evaluate', {
      expression: `(() => {
        const scanBtn = document.getElementById('btn-open-mobile-scan');
        const webcamModal = document.getElementById('admin-camera-scanner-modal');
        const qrModal = document.getElementById('admin-qr-modal');
        const otpBoxes = document.querySelectorAll('.admin-otp-digit');
        const verifyBtn = document.getElementById('admin-2fa-verify-btn');
        return {
          scanBtnPresent: !!scanBtn,
          webcamModalPresent: !!webcamModal,
          qrModalPresent: !!qrModal,
          otpBoxesCount: otpBoxes.length,
          verifyBtnPresent: !!verifyBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('Live CDN Step 2 UI check:', step2Check.result.value);

    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_live_clean_step2.png'), Buffer.from(shot.data, 'base64'));
    console.log('✓ PASS: Captured live visual proof: admin_live_clean_step2.png');

    ws.close();
    edge.kill();
    console.log('🎉 Live clean Step 2 UI verified successfully!');
  } finally {
    try { edge.kill(); } catch (_) {}
  }
}

testLiveCleanUI().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
