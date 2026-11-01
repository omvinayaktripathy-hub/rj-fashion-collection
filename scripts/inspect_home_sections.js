const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function inspectSections() {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9988',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_inspect_home_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9988/json', res => {
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
    await new Promise(r => setTimeout(r, 4000));

    // Inspect visible text, headers, navigation items, sections
    const details = await send('Runtime.evaluate', {
      expression: `(() => {
        const navLinks = Array.from(document.querySelectorAll('nav a, header a')).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href')
        }));

        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName,
          text: h.innerText.trim(),
          visible: h.offsetParent !== null
        }));

        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayed: img.offsetWidth > 0 && img.offsetHeight > 0,
          broken: img.naturalWidth === 0
        }));

        return {
          navLinks,
          headings,
          totalImages: images.length,
          brokenImagesCount: images.filter(i => i.broken).length,
          brokenImagesSample: images.filter(i => i.broken).slice(0, 10),
          workingImagesSample: images.filter(i => !i.broken).slice(0, 5)
        };
      })()`,
      returnByValue: true
    });

    console.log('Page Structure Details:');
    console.log(JSON.stringify(details.result.value, null, 2));

    // Full page screenshot
    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(artifactDir, 'home_full_page.png'), Buffer.from(shot.data, 'base64'));
    console.log('✓ Captured full page screenshot: home_full_page.png');

    ws.close();
    edge.kill();
  } catch (err) {
    console.error('Inspection error:', err);
    try { edge.kill(); } catch (_) {}
  }
}

inspectSections();
