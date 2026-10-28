const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

async function auditAdmin() {
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9911',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_audit_admin_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9911/json', res => {
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

    const consoleLogs = [];
    const pageErrors = [];

    await send('Console.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Console.messageAdded') {
        consoleLogs.push(data.params.message);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        pageErrors.push(data.params.exceptionDetails);
      }
    });

    await send('Page.navigate', { url: 'http://localhost:3000/admin' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('--- ADMIN CONSOLE LOGS ---');
    consoleLogs.forEach(l => console.log(`[${l.level}] ${l.text}`));

    console.log('\n--- ADMIN PAGE ERRORS ---');
    pageErrors.forEach(e => console.log(`[ERROR] ${e.text} at ${e.url}:${e.lineNumber}:${e.columnNumber}`));

    // Check overlay presence and interactive forms
    const overlayStatus = await send('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.getElementById('admin-login-overlay');
        const email = document.getElementById('admin-email');
        const pass = document.getElementById('admin-password');
        const btn = document.getElementById('admin-login-btn');
        return {
          overlayVisible: overlay ? window.getComputedStyle(overlay).display : 'missing',
          hasEmail: !!email,
          hasPass: !!pass,
          hasBtn: !!btn
        };
      })()`,
      returnByValue: true
    });
    console.log('\nOVERLAY STATUS:', JSON.stringify(overlayStatus.result.value, null, 2));

    ws.close();
    edge.kill();
    server.kill();
  } catch (err) {
    console.error(err);
    edge.kill();
    server.kill();
  }
}

auditAdmin();
