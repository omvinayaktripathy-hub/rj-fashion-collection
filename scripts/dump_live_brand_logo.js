const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

async function test() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9888',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_test_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9888/json', res => {
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

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/?nocache=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    // Switch to light theme via app.js
    await send('Runtime.evaluate', { expression: "applyTheme('light')" });
    await new Promise(r => setTimeout(r, 500));

    const lightCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const l = document.querySelector('.logo-img-light');
        const d = document.querySelector('.logo-img-dark');
        return {
          lightSrc: l ? l.src : null,
          lightDisplay: l ? window.getComputedStyle(l).display : null,
          lightNaturalWidth: l ? l.naturalWidth : null,
          lightComplete: l ? l.complete : null,
          darkDisplay: d ? window.getComputedStyle(d).display : null
        };
      })()`,
      returnByValue: true
    });
    console.log('LIVE LIGHT THEME RESULT:', JSON.stringify(lightCheck.result.value, null, 2));

    // Switch to dark theme via app.js
    await send('Runtime.evaluate', { expression: "applyTheme('dark')" });
    await new Promise(r => setTimeout(r, 500));

    const darkCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const l = document.querySelector('.logo-img-light');
        const d = document.querySelector('.logo-img-dark');
        return {
          darkSrc: d ? d.src : null,
          darkDisplay: d ? window.getComputedStyle(d).display : null,
          darkNaturalWidth: d ? d.naturalWidth : null,
          darkComplete: d ? d.complete : null,
          lightDisplay: l ? window.getComputedStyle(l).display : null
        };
      })()`,
      returnByValue: true
    });
    console.log('LIVE DARK THEME RESULT:', JSON.stringify(darkCheck.result.value, null, 2));

    ws.close();
    edge.kill();
  } catch (err) {
    console.error(err);
    edge.kill();
  }
}
test();
