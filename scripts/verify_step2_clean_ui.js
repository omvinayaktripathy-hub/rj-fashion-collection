const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function testCleanUI() {
  console.log('Testing Clean Step 2 UI (without scanner buttons)...');
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1800));

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9955',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_clean_step2_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9955/json', res => {
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

    await send('Page.navigate', { url: 'http://localhost:3000/admin' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('1. Submitting Step 1 credentials...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('admin-email').value = 'omvinayakwork@gmail.com';
        document.getElementById('admin-password').value = 'OMvinayaktripathy';
        document.getElementById('admin-login-btn').click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Check Step 2 UI
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
    console.log('Step 2 UI check:', step2Check.result.value);

    if (step2Check.result.value.scanBtnPresent) throw new Error('Scan button should NOT be present!');
    if (step2Check.result.value.webcamModalPresent) throw new Error('Webcam modal should NOT be present!');
    if (step2Check.result.value.otpBoxesCount !== 6) throw new Error('Expected 6 OTP boxes');

    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_step2_clean_no_scanner.png'), Buffer.from(shot.data, 'base64'));
    console.log('✓ PASS: Captured visual proof: admin_step2_clean_no_scanner.png');

    ws.close();
    edge.kill();
    server.kill();
    console.log('🎉 Clean Step 2 UI verification passed 100%!');
  } finally {
    server.kill();
    try { edge.kill(); } catch (_) {}
  }
}

testCleanUI().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
