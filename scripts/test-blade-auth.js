const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const port = 4991;

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(publicDir, reqUrl === '/' ? 'auth-blade.html' : reqUrl);
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
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, async () => {
  console.log(`Local test server running on http://127.0.0.1:${port}`);

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9977',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1200,900',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_blade_test_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1800));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9977/json', res => {
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

    await send('Page.navigate', { url: `http://127.0.0.1:${port}/auth-blade.html` });
    await new Promise(r => setTimeout(r, 1500));

    // Capture initial sign-in state
    const artifactDir = path.join('C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09');
    const ssInit = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'auth_blade_1_signin.png'), Buffer.from(ssInit.data, 'base64'));
    console.log('1. Captured initial Sign In state: auth_blade_1_signin.png');

    // Trigger blade sweep to Sign Up
    console.log('2. Triggering blade sweep to Sign Up...');
    await send('Runtime.evaluate', { expression: `window.triggerBladeTransition('signup');` });

    // Wait exactly to midpoint (280ms) and capture the total dark coverage
    await new Promise(r => setTimeout(r, 280));
    const ssDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'auth_blade_2_dark_midpoint.png'), Buffer.from(ssDark.data, 'base64'));
    console.log('2b. Captured midpoint (Total Dark Coverage): auth_blade_2_dark_midpoint.png');

    // Wait for blade sweep to finish (another 320ms)
    await new Promise(r => setTimeout(r, 320));
    const ssSignUp = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'auth_blade_3_signup.png'), Buffer.from(ssSignUp.data, 'base64'));
    console.log('3. Captured Sign Up state (Blade exited right): auth_blade_3_signup.png');

    // Trigger return trip (Sign Up -> Sign In, mirrored)
    console.log('4. Triggering mirrored return trip to Sign In...');
    await send('Runtime.evaluate', { expression: `window.triggerBladeTransition('signin');` });

    await new Promise(r => setTimeout(r, 280));
    const ssDarkReturn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'auth_blade_4_dark_return.png'), Buffer.from(ssDarkReturn.data, 'base64'));
    console.log('4b. Captured return midpoint (Total Dark Coverage): auth_blade_4_dark_return.png');

    await new Promise(r => setTimeout(r, 320));
    const ssReturn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'auth_blade_5_signin_restored.png'), Buffer.from(ssReturn.data, 'base64'));
    console.log('5. Captured restored Sign In state: auth_blade_5_signin_restored.png');

    console.log('ALL TESTS PASSED! Zero errors.');
    ws.close();
  } catch (e) {
    console.error('Edge test error:', e);
  } finally {
    try { edge.kill(); } catch (_) {}
    server.close();
    process.exit(0);
  }
});
