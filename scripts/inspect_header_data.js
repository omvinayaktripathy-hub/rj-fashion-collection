const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function inspectHeader() {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9995',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_inspect_header_' + Date.now())
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9995/json', res => {
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

    // 1. Desktop View (1280px)
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'https://rj-fashion-collection.web.app/' });
    await new Promise(r => setTimeout(r, 3500));

    const desktopData = await send('Runtime.evaluate', {
      expression: `(() => {
        const logo = document.querySelector('.brand-logo');
        const lightImg = document.querySelector('.logo-img-light');
        const darkImg = document.querySelector('.logo-img-dark');
        const search = document.querySelector('.header-search');
        const actions = document.querySelector('.header-actions');
        const nav = document.querySelector('.main-nav');
        const theme = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark-theme') ? 'dark' : 'light');

        return {
          theme,
          logoBox: logo.getBoundingClientRect(),
          lightImg: {
            src: lightImg.src,
            display: window.getComputedStyle(lightImg).display,
            width: lightImg.offsetWidth,
            height: lightImg.offsetHeight,
            naturalWidth: lightImg.naturalWidth,
            naturalHeight: lightImg.naturalHeight
          },
          darkImg: {
            src: darkImg.src,
            display: window.getComputedStyle(darkImg).display,
            width: darkImg.offsetWidth,
            height: darkImg.offsetHeight,
            naturalWidth: darkImg.naturalWidth,
            naturalHeight: darkImg.naturalHeight
          },
          navDisplay: window.getComputedStyle(nav).display,
          searchBox: search.getBoundingClientRect(),
          actionsBox: actions.getBoundingClientRect()
        };
      })()`,
      returnByValue: true
    });

    console.log('Desktop Header Data:');
    console.log(JSON.stringify(desktopData.result.value, null, 2));

    // 2. Mobile View (390px)
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 1000));

    const mobileData = await send('Runtime.evaluate', {
      expression: `(() => {
        const logo = document.querySelector('.brand-logo');
        const lightImg = document.querySelector('.logo-img-light');
        const darkImg = document.querySelector('.logo-img-dark');
        const search = document.querySelector('.header-search');
        const actions = document.querySelector('.header-actions');
        const nav = document.querySelector('.main-nav');
        const theme = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark-theme') ? 'dark' : 'light');

        return {
          theme,
          logoBox: logo.getBoundingClientRect(),
          lightImgDisplay: window.getComputedStyle(lightImg).display,
          darkImgDisplay: window.getComputedStyle(darkImg).display,
          lightImgWidth: lightImg.offsetWidth,
          darkImgWidth: darkImg.offsetWidth,
          navDisplay: window.getComputedStyle(nav).display,
          searchBox: search.getBoundingClientRect(),
          actionsBox: actions.getBoundingClientRect()
        };
      })()`,
      returnByValue: true
    });

    console.log('\nMobile Header Data:');
    console.log(JSON.stringify(mobileData.result.value, null, 2));

    ws.close();
    edge.kill();
  } catch (err) {
    console.error(err);
    try { edge.kill(); } catch (_) {}
  }
}

inspectHeader();
