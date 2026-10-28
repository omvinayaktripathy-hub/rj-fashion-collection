const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = path.join(os.tmpdir(), 'edge_debug_logo_' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9444',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + profileDir
]);

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  await new Promise(r => setTimeout(r, 1200));

  const listRes = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9444/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const wsUrl = listRes[0].webSocketDebuggerUrl;
  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Network.enable');

  await cdp.send('Page.navigate', { url: 'https://rj-fashion-collection.web.app' });
  await new Promise(r => setTimeout(r, 3000));

  const result = await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const light = document.querySelector('.logo-img-light');
        const dark = document.querySelector('.logo-img-dark');
        return {
          light: light ? {
            src: light.src,
            complete: light.complete,
            naturalWidth: light.naturalWidth,
            naturalHeight: light.naturalHeight,
            currentSrc: light.currentSrc,
            offsetWidth: light.offsetWidth,
            offsetHeight: light.offsetHeight
          } : null,
          dark: dark ? {
            src: dark.src,
            complete: dark.complete,
            naturalWidth: dark.naturalWidth,
            naturalHeight: dark.naturalHeight,
            currentSrc: dark.currentSrc
          } : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log('EVAL RESULT:', JSON.stringify(result.result.value, null, 2));

  cdp.close();
  edge.kill();
}

run().catch(err => {
  console.error(err);
  edge.kill();
});
