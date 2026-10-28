const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

async function test() {
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9788',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_test_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9788/json', res => {
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

    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2000));

    // Switch to light theme via app.js
    await send('Runtime.evaluate', { expression: "applyTheme('light')" });
    await new Promise(r => setTimeout(r, 500));

    const lightCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const l = document.querySelector('.logo-img-light');
        const d = document.querySelector('.logo-img-dark');
        return {
          lightDisplay: window.getComputedStyle(l).display,
          lightNaturalWidth: l.naturalWidth,
          lightNaturalHeight: l.naturalHeight,
          lightComplete: l.complete,
          darkDisplay: window.getComputedStyle(d).display
        };
      })()`,
      returnByValue: true
    });
    console.log('LIGHT THEME RESULT:', JSON.stringify(lightCheck.result.value, null, 2));

    // Switch to dark theme via app.js
    await send('Runtime.evaluate', { expression: "applyTheme('dark')" });
    await new Promise(r => setTimeout(r, 500));

    const darkCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const l = document.querySelector('.logo-img-light');
        const d = document.querySelector('.logo-img-dark');
        return {
          lightDisplay: window.getComputedStyle(l).display,
          darkDisplay: window.getComputedStyle(d).display,
          darkNaturalWidth: d.naturalWidth,
          darkNaturalHeight: d.naturalHeight,
          darkComplete: d.complete
        };
      })()`,
      returnByValue: true
    });
    console.log('DARK THEME RESULT:', JSON.stringify(darkCheck.result.value, null, 2));

    ws.close();
    edge.kill();
    server.kill();
  } catch (err) {
    console.error(err);
    edge.kill();
    server.kill();
  }
}
test();
