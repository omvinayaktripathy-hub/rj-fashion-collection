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

const pagesToTest = [
  '/',
  '/shop.html',
  '/categories.html',
  '/product.html?id=1',
  '/cart.html',
  '/wishlist.html',
  '/checkout.html',
  '/delivery.html',
  '/login.html',
  '/register.html',
  '/account.html',
  '/orders.html',
  '/admin.html',
  '/faq.html',
  '/sale.html',
  '/size-guide.html',
  '/about.html',
  '/contact.html',
  '/404.html'
];

server.listen(port, async () => {
  console.log(`Auditor local server running on http://127.0.0.1:${port}`);

  const userDataDir = path.join(os.tmpdir(), 'edge_full_audit_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    '--user-data-dir=' + userDataDir
  ]);

  try {
    const activePortFile = path.join(userDataDir, 'DevToolsActivePort');
    let assignedPort = null;
    for (let attempt = 1; attempt <= 25; attempt++) {
      await new Promise(r => setTimeout(r, 400));
      if (fs.existsSync(activePortFile)) {
        try {
          const lines = fs.readFileSync(activePortFile, 'utf8').trim().split('\n');
          assignedPort = parseInt(lines[0].trim(), 10);
          if (assignedPort > 0) break;
        } catch (_) {}
      }
    }
    if (!assignedPort) throw new Error('Could not read DevToolsActivePort from Edge');

    const listRes = await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${assignedPort}/json`, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
    });
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

    await send('Console.enable');
    await send('Network.enable');

    const auditResults = [];

    for (const pageUrl of pagesToTest) {
      const pageErrors = [];
      const networkFails = [];

      const msgHandler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
          pageErrors.push(data.params.message.text);
        }
        if (data.method === 'Network.responseReceived') {
          const resp = data.params.response;
          if (resp.status >= 400 && !resp.url.includes('favicon.ico')) {
            networkFails.push({ status: resp.status, url: resp.url });
          }
        }
      };

      ws.addEventListener('message', msgHandler);

      process.stdout.write(`Scanning ${pageUrl} ... `);
      await send('Page.navigate', { url: `http://127.0.0.1:${port}${pageUrl}` });
      await new Promise(r => setTimeout(r, 1500));

      const titleRes = await send('Runtime.evaluate', { expression: `document.title` });
      const title = titleRes && titleRes.result ? titleRes.result.value : 'Unknown';

      ws.removeEventListener('message', msgHandler);

      const status = (pageErrors.length === 0 && networkFails.length === 0) ? 'PASS' : 'FAIL';
      console.log(`[${status}] - Title: "${title}" | Errors: ${pageErrors.length} | 404s: ${networkFails.length}`);

      auditResults.push({
        url: pageUrl,
        title,
        status,
        errors: pageErrors,
        networkFails
      });
    }

    const reportPath = path.join(__dirname, '..', 'FULL_WEBSITE_AUDIT_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`\nAudit finished! Wrote results to FULL_WEBSITE_AUDIT_REPORT.json`);

    ws.close();
  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    try { edge.kill(); } catch (_) {}
    server.close();
    process.exit(0);
  }
});
