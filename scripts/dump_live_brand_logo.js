const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

async function test() {
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9666',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_test_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9666/json', res => {
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
    await new Promise(r => setTimeout(r, 3000));

    const imgDetails = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('.brand-logo img')).map(img => ({
          src: img.src,
          className: img.className,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.width,
          height: img.height,
          computedDisplay: window.getComputedStyle(img).display
        }))
      `,
      returnByValue: true
    });

    console.log('LOGO IMAGES IN BROWSER:', JSON.stringify(imgDetails.result.value, null, 2));

    // Also test light theme
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.removeAttribute('data-theme');
      `
    });

    const lightCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const lightImg = document.querySelector('.logo-img-light');
          return {
            src: lightImg.src,
            naturalWidth: lightImg.naturalWidth,
            naturalHeight: lightImg.naturalHeight,
            complete: lightImg.complete,
            display: window.getComputedStyle(lightImg).display
          };
        })()
      `,
      returnByValue: true
    });
    console.log('LIGHT MODE LOGO CHECK:', JSON.stringify(lightCheck.result.value, null, 2));

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
