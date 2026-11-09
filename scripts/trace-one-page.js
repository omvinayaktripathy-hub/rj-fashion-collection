const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const port = 4995;

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(publicDir, reqUrl === '/' ? 'index.html' : reqUrl);
  if (!fs.existsSync(filePath)) {
    console.log('[404]', req.method, req.url);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, async () => {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9995',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_trace_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9995/json', res => {
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

    await send('Network.enable');

    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Network.requestWillBeSent') {
        const req = data.params.request;
        if (req.url.includes('/api/')) {
          console.log('[API REQUEST]', req.method, req.url);
          console.log('[INITIATOR]', JSON.stringify(data.params.initiator, null, 2));
        }
      }
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${port}/product.html?id=1` });
    await new Promise(r => setTimeout(r, 2500));
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    try { edge.kill(); } catch (_) {}
    server.close();
    process.exit(0);
  }
});
