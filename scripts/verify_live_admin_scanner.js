const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function verifyLive() {
  console.log('🌐 Verifying Live Production Portal at https://rj-fashion-collection.web.app/admin ...');

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9944',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_live_scanner_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9944/json', res => {
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

    // Open Mobile Scanner on demand
    console.log('2. Opening Mobile Scanner on demand on live production...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-open-mobile-scan').click();`
    });
    await new Promise(r => setTimeout(r, 1000));

    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_live_ondemand_scanner.png'), Buffer.from(shot1.data, 'base64'));
    console.log('✓ PASS: Captured live screenshot admin_live_ondemand_scanner.png');

    // Test unauthorized scan on live
    console.log('3. Testing unauthorized scan attempt on live...');
    await send('Runtime.evaluate', { expression: `testUnauthorizedScan();` });
    await new Promise(r => setTimeout(r, 600));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_live_unauthorized_scan_rejected.png'), Buffer.from(shot2.data, 'base64'));
    console.log('✓ PASS: Captured live screenshot admin_live_unauthorized_scan_rejected.png');

    // Test authorized scan on live
    console.log('4. Testing authorized scan by omvinayakwork@gmail.com on live...');
    await send('Runtime.evaluate', { expression: `testAuthorizedScan();` });
    await new Promise(r => setTimeout(r, 1500));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_live_scanner_unlocked_dashboard.png'), Buffer.from(shot3.data, 'base64'));
    console.log('✓ PASS: Captured live screenshot admin_live_scanner_unlocked_dashboard.png');

    ws.close();
    edge.kill();
    console.log('🎉 Live verification completed successfully!');
  } finally {
    try { edge.kill(); } catch (_) {}
  }
}

verifyLive().catch(err => {
  console.error('Live verification error:', err);
  process.exit(1);
});
