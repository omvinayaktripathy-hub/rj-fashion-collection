const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

async function testUI() {
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9922',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_test_2fa_ui_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9922/json', res => {
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

    console.log('1. Page loaded. Filling credentials in Step 1...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('admin-email').value = 'omvinayakwork@gmail.com';
        document.getElementById('admin-password').value = 'OMvinayak@01092003';
      `
    });

    console.log('2. Submitting Step 1 form...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('admin-login-btn').click();`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Check if Step 2 is now visible
    const step2Check = await send('Runtime.evaluate', {
      expression: `(() => {
        const step1 = document.getElementById('admin-login-form');
        const step2 = document.getElementById('admin-2fa-container');
        const digits = document.querySelectorAll('.admin-otp-digit');
        const timer = document.getElementById('admin-2fa-timer-display');
        return {
          step1Display: window.getComputedStyle(step1).display,
          step2Display: window.getComputedStyle(step2).display,
          digitsCount: digits.length,
          timerText: timer ? timer.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Step 2 UI status:', JSON.stringify(step2Check.result.value, null, 2));

    console.log('3. Authenticating with Emergency Master Key...');
    await send('Runtime.evaluate', {
      expression: `
        toggleEmergencyKeyInput();
        document.getElementById('admin-emergency-key-input').value = 'RJFC-ROYAL-ADMIN-2026';
        submitEmergencyKey();
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check if overlay is now hidden and admin panel is active
    const postAuthCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.getElementById('admin-login-overlay');
        const username = document.getElementById('admin-topbar-username');
        const statsOrders = document.getElementById('stat-total-orders');
        return {
          overlayDisplay: window.getComputedStyle(overlay).display,
          username: username ? username.textContent : '',
          statsOrdersText: statsOrders ? statsOrders.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Post-auth status:', JSON.stringify(postAuthCheck.result.value, null, 2));

    ws.close();
    edge.kill();
    server.kill();
  } catch (err) {
    console.error(err);
    edge.kill();
    server.kill();
  }
}

testUI();
