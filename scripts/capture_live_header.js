const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function capture() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9899',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_test_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9899/json', res => {
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

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/?ts=' + Date.now() });
    await new Promise(r => setTimeout(r, 3000));

    // Capture Light Theme Header
    await send('Runtime.evaluate', { expression: "applyTheme('light')" });
    await new Promise(r => setTimeout(r, 600));

    const clipLight = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.brand-logo');
        const rect = el.getBoundingClientRect();
        return { x: rect.x - 10, y: rect.y - 10, width: rect.width + 20, height: rect.height + 20, scale: 1 };
      })()`,
      returnByValue: true
    });

    const shotLight = await send('Page.captureScreenshot', {
      format: 'png',
      clip: clipLight.result.value
    });
    fs.writeFileSync('C:/Users/omvin/.gemini/antigravity/scratch/live_header_light.png', Buffer.from(shotLight.data, 'base64'));
    console.log('Saved live_header_light.png');

    // Capture Dark Theme Header
    await send('Runtime.evaluate', { expression: "applyTheme('dark')" });
    await new Promise(r => setTimeout(r, 600));

    const clipDark = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.brand-logo');
        const rect = el.getBoundingClientRect();
        return { x: rect.x - 10, y: rect.y - 10, width: rect.width + 20, height: rect.height + 20, scale: 1 };
      })()`,
      returnByValue: true
    });

    const shotDark = await send('Page.captureScreenshot', {
      format: 'png',
      clip: clipDark.result.value
    });
    fs.writeFileSync('C:/Users/omvin/.gemini/antigravity/scratch/live_header_dark.png', Buffer.from(shotDark.data, 'base64'));
    console.log('Saved live_header_dark.png');

    ws.close();
    edge.kill();
  } catch (err) {
    console.error(err);
    edge.kill();
  }
}
capture();
