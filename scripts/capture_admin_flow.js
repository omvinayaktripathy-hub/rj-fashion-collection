const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function capture() {
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9924',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_capture_admin_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9924/json', res => {
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

    // Capture Step 1 screenshot
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    fs.writeFileSync(path.join(artifactDir, 'admin_step1_credentials.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved admin_step1_credentials.png');

    // Fill credentials and click button to trigger Step 2
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('admin-email').value = 'omvinayakwork@gmail.com';
        document.getElementById('admin-password').value = 'OMvinayaktripathy';
        document.getElementById('admin-login-btn').click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture Step 2 screenshot (6-Digit Authenticator Code)
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_step2_authenticator_code.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved admin_step2_authenticator_code.png');

    ws.close();
    edge.kill();
    server.kill();
    console.log('Finished capturing screenshots successfully!');
  } catch (e) {
    console.error(e);
    edge.kill();
    server.kill();
  }
}

capture();
