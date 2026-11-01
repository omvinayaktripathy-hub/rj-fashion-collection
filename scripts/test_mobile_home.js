const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function testMobileHome() {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9993',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_mobile_home_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9993/json', res => {
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

    // Set mobile viewport (iPhone 14 / Pixel)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
    await new Promise(r => setTimeout(r, 4000));

    // Check overflow, horizontal scrolling, hamburger menu, logo, hero banner, bottom nav
    const mobileAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const hasHorizontalScroll = scrollWidth > docWidth;

        // Elements causing overflow
        const overflowElements = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > docWidth + 2) {
            overflowElements.push({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              right: rect.right,
              scrollWidth
            });
          }
        });

        const logo = document.querySelector('.brand-logo');
        const hamburger = document.querySelector('.mobile-menu-btn, .menu-toggle, .hamburger');
        const bottomNav = document.querySelector('.bottom-nav');

        return {
          docWidth,
          scrollWidth,
          hasHorizontalScroll,
          overflowCount: overflowElements.length,
          overflowElements: overflowElements.slice(0, 10),
          logoVisible: logo ? logo.offsetWidth > 0 && logo.offsetHeight > 0 : false,
          hasHamburger: !!hamburger,
          hamburgerVisible: hamburger ? window.getComputedStyle(hamburger).display !== 'none' : false,
          bottomNavVisible: bottomNav ? window.getComputedStyle(bottomNav).display !== 'none' : false
        };
      })()`,
      returnByValue: true
    });

    console.log('Mobile Home Audit:');
    console.log(JSON.stringify(mobileAudit.result.value, null, 2));

    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'mobile_home_screen.png'), Buffer.from(shot.data, 'base64'));
    console.log('✓ Captured mobile homepage screenshot: mobile_home_screen.png');

    ws.close();
    edge.kill();
  } catch (err) {
    console.error('Mobile test failed:', err);
    try { edge.kill(); } catch (_) {}
  }
}

testMobileHome();
