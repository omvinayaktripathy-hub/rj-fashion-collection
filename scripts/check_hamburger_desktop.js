const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

async function checkHamburgerOnDesktop() {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9996',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_inspect_btn_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9996/json', res => {
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

    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
    await new Promise(r => setTimeout(r, 3500));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('rj-hamburger-btn');
        if (!btn) return { exists: false };
        const cs = window.getComputedStyle(btn);
        return {
          exists: true,
          display: cs.display,
          visibility: cs.visibility,
          width: btn.offsetWidth,
          height: btn.offsetHeight,
          box: btn.getBoundingClientRect()
        };
      })()`,
      returnByValue: true
    });

    console.log('Desktop Hamburger check:', check.result.value);

    ws.close();
    edge.kill();
  } catch (err) {
    console.error(err);
    try { edge.kill(); } catch (_) {}
  }
}

checkHamburgerOnDesktop();
