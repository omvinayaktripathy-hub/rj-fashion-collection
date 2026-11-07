const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          data: data.slice(0, 100)
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function verifyAll() {
  console.log('--- 1. Testing API Endpoints on Live Firebase ---');
  const endpoints = [
    'https://rj-fashion-collection.web.app/api/me',
    'https://rj-fashion-collection.web.app/api/campaign',
    'https://rj-fashion-collection.web.app/api/cart',
    'https://rj-fashion-collection.web.app/api/wishlist',
    'https://rj-fashion-collection.web.app/api/csrf-token'
  ];

  for (const ep of endpoints) {
    const res = await checkUrl(ep);
    console.log(`URL: ${ep} -> Status: ${res.status} | Content-Type: ${res.contentType}`);
  }

  console.log('\n--- 2. Inspecting Live Browser Console via Edge CDP ---');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9338;
  const userDataDir = path.join(os.tmpdir(), 'edge-test-console-' + Date.now());

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const tabData = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const list = JSON.parse(d);
        resolve(list.find(t => t.type === 'page') || list[0]);
      });
    }).on('error', reject);
  });

  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let idSeq = 1;
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idSeq++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const consoleLogs = [];
  const networkErrors = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value) });
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleLogs.push({ type: 'error', exception: msg.params.exceptionDetails.text, desc: msg.params.exceptionDetails.exception?.description });
    } else if (msg.method === 'Network.responseReceived') {
      const resp = msg.params.response;
      if (resp.status >= 400) {
        networkErrors.push({ url: resp.url, status: resp.status });
      }
    }
  });

  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');

  console.log('Navigating to https://rj-fashion-collection.web.app/ ...');
  await call('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n--- Console Logs Recorded ---');
  console.log(consoleLogs);

  console.log('\n--- Network Status >= 400 Recorded ---');
  console.log(networkErrors);

  ws.close();
  edgeProc.kill('SIGKILL');
  console.log('\nVerification complete!');
}

verifyAll().catch(console.error);
