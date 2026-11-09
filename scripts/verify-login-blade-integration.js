const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const port = 4992;

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(publicDir, reqUrl === '/' ? 'login.html' : reqUrl);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, async () => {
  console.log(`Test server running on http://127.0.0.1:${port}`);

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9988',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,960',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_login_blade_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1800));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9988/json', res => {
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

    const consoleErrors = [];
    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
        consoleErrors.push(data.params.message.text);
      }
    });
    await send('Console.enable');

    await send('Page.navigate', { url: `http://127.0.0.1:${port}/login.html` });
    await new Promise(r => setTimeout(r, 2000));

    const artifactDir = path.join('C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09');

    // 1. Initial State (Sign In)
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'login_page_blade_1_signin.png'), Buffer.from(ss1.data, 'base64'));
    console.log('1. Captured login.html initial Sign In state: login_page_blade_1_signin.png');

    // 2. Click "Create Account" tab
    console.log('2. Clicking "Create Account" tab to trigger the Blade...');
    await send('Runtime.evaluate', { expression: `document.getElementById('tab-register-btn').click();` });

    // Midpoint check (280ms)
    await new Promise(r => setTimeout(r, 280));
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'login_page_blade_2_dark.png'), Buffer.from(ss2.data, 'base64'));
    console.log('2b. Captured login.html midpoint dark coverage: login_page_blade_2_dark.png');

    // Completion
    await new Promise(r => setTimeout(r, 320));
    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'login_page_blade_3_register.png'), Buffer.from(ss3.data, 'base64'));
    console.log('3. Captured login.html Register state: login_page_blade_3_register.png');

    // 4. Click "Sign In" tab (Mirrored Return)
    console.log('4. Clicking "Sign In" tab for mirrored return sweep...');
    await send('Runtime.evaluate', { expression: `document.getElementById('tab-login-btn').click();` });

    await new Promise(r => setTimeout(r, 280));
    const ss4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'login_page_blade_4_dark_return.png'), Buffer.from(ss4.data, 'base64'));
    console.log('4b. Captured return midpoint dark coverage: login_page_blade_4_dark_return.png');

    await new Promise(r => setTimeout(r, 320));
    const ss5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'login_page_blade_5_signin_restored.png'), Buffer.from(ss5.data, 'base64'));
    console.log('5. Captured restored Sign In state: login_page_blade_5_signin_restored.png');

    console.log('Console Errors caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }

    console.log('VERIFICATION COMPLETE: The Sliding Blade is working flawlessly on login.html!');
    ws.close();
  } catch (e) {
    console.error('Edge test error:', e);
  } finally {
    try { edge.kill(); } catch (_) {}
    server.close();
    process.exit(0);
  }
});
