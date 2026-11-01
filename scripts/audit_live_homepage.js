const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function auditLiveHomePage() {
  console.log('🔍 Auditing live homepage: https://rj-fashion-collection.web.app/ ...');

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9977',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_audit_home_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9977/json', res => {
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

    // Listen to console logs and network failures
    const consoleLogs = [];
    const networkFailures = [];

    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: data.params.type, text: data.params.args.map(a => a.value || JSON.stringify(a)).join(' ') });
      }
      if (data.method === 'Log.entryAdded') {
        consoleLogs.push({ level: data.params.entry.level, text: data.params.entry.text });
      }
      if (data.method === 'Network.responseReceived') {
        const status = data.params.response.status;
        const url = data.params.response.url;
        if (status >= 400) {
          networkFailures.push({ url, status });
        }
      }
      if (data.method === 'Network.loadingFailed') {
        networkFailures.push({ url: data.params.canceled ? null : 'Failed to load', errorText: data.params.errorText });
      }
    });

    await send('Network.enable');
    await send('Log.enable');
    await send('Runtime.enable');

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
    await new Promise(r => setTimeout(r, 4000));

    // Audit page content
    const pageAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const brokenImages = [];
        document.querySelectorAll('img').forEach(img => {
          if (!img.complete || img.naturalWidth === 0) {
            brokenImages.push({ src: img.src, alt: img.alt, id: img.id, class: img.className });
          }
        });

        const logoImg = document.querySelector('.logo-img, .brand-logo img, header img');
        const brokenLinks = [];
        document.querySelectorAll('a').forEach(a => {
          if (a.href.includes('undefined') || a.href.includes('null')) {
            brokenLinks.push({ text: a.textContent.trim(), href: a.href });
          }
        });

        // Check products rendering
        const productCards = document.querySelectorAll('.product-card, .featured-product, [data-product-id]');
        const categories = document.querySelectorAll('.category-card, [data-category]');

        return {
          title: document.title,
          brokenImagesCount: brokenImages.length,
          brokenImages,
          logoImg: logoImg ? { src: logoImg.src, naturalWidth: logoImg.naturalWidth, naturalHeight: logoImg.naturalHeight } : null,
          productCount: productCards.length,
          categoryCount: categories.length,
          hasHeroBanner: !!document.querySelector('.hero-section, .hero-slider, .hero-banner, .hero'),
          footerPresent: !!document.querySelector('footer')
        };
      })()`,
      returnByValue: true
    });

    console.log('--- Page Audit Results ---');
    console.log(JSON.stringify(pageAudit.result.value, null, 2));

    console.log('\n--- Network Failures (4xx / 5xx) ---');
    console.log(JSON.stringify(networkFailures, null, 2));

    console.log('\n--- Console Logs / Errors ---');
    console.log(JSON.stringify(consoleLogs.filter(l => l.type === 'error' || l.level === 'error' || l.type === 'warning'), null, 2));

    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'live_home_audit.png'), Buffer.from(shot.data, 'base64'));
    console.log('✓ Saved live homepage screenshot: live_home_audit.png');

    ws.close();
    edge.kill();
  } catch (err) {
    console.error('Audit failed:', err);
    try { edge.kill(); } catch (_) {}
  }
}

auditLiveHomePage();
