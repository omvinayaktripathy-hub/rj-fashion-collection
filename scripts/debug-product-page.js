const http = require('http');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const port = 4997;

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(publicDir, reqUrl === '/' ? 'index.html' : reqUrl);
  if (!fs.existsSync(filePath)) {
    console.log('[SERVER 404]:', req.method, req.url);
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
  const { spawn } = require('child_process');
  const os = require('os');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9997',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_debug_' + Date.now())
  ]);

  await new Promise(r => setTimeout(r, 2000));
  try {
    const listRes = await new Promise((r, j) => {
      http.get('http://127.0.0.1:9997/json', res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
      }).on('error', j);
    });
    const ws = new WebSocket(listRes[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (m, p={}) => new Promise(r => {
      const cur = id++;
      const h = msg => { const data = JSON.parse(msg.data); if (data.id === cur) { ws.removeEventListener('message', h); r(data.result); } };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

    await send('Console.enable');
    await send('Network.enable');

    ws.addEventListener('message', msg => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Console.messageAdded') {
        console.log('[CONSOLE]', data.params.message.level, data.params.message.text);
      }
      if (data.method === 'Network.requestWillBeSent') {
        if (data.params.request.url.includes('/api/')) {
          console.log('[API REQUEST]', data.params.request.method, data.params.request.url);
          console.log('[STACK]', JSON.stringify(data.params.initiator, null, 2));
        }
      }
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${port}/product.html?id=1` });
    await new Promise(r => setTimeout(r, 3000));
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    try { edge.kill(); } catch (_) {}
    server.close();
    process.exit(0);
  }
});
