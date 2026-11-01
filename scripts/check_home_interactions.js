const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function checkConsoleAndInteractions() {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9991',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_debug_home_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9991/json', res => {
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

    const errors = [];
    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push(data.params.exceptionDetails);
      }
      if (data.method === 'Log.entryAdded' && data.params.entry.level === 'error') {
        errors.push(data.params.entry);
      }
    });

    await send('Runtime.enable');
    await send('Log.enable');

    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
    await new Promise(r => setTimeout(r, 3500));

    // Test clicking tabs: 'sarees', 'mens', 'kids', 'accessories', 'jewelry', 'gifts'
    const tabResults = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('.col-tab-btn'));
        const tabNames = tabs.map(t => t.innerText.trim());
        return { count: tabs.length, tabNames };
      })()`,
      returnByValue: true
    });
    console.log('Tabs on page:', tabResults.result.value);

    // Test dark mode toggle
    console.log('Testing Dark Mode Toggle...');
    const themeTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const before = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        if (typeof toggleTheme === 'function') toggleTheme();
        const after = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        return { before, after };
      })()`,
      returnByValue: true
    });
    console.log('Theme toggle test:', themeTest.result.value);

    // Test product cards Add to Cart and Quick View
    const productCards = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = document.querySelectorAll('.product-card');
        return {
          totalCards: cards.length,
          firstCardTitle: cards[0] ? cards[0].querySelector('.product-title, h3, h4')?.innerText : null,
          hasAddToCart: cards[0] ? !!cards[0].querySelector('.add-to-cart-btn, .btn-add-to-cart, [onclick*="addToCart"]') : false
        };
      })()`,
      returnByValue: true
    });
    console.log('Product cards check:', productCards.result.value);

    console.log('Errors captured:', errors);

    ws.close();
    edge.kill();
  } catch (e) {
    console.error(e);
    try { edge.kill(); } catch (_) {}
  }
}

checkConsoleAndInteractions();
