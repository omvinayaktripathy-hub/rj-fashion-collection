const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const port = 4995;

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(publicDir, reqUrl === '/' ? 'index.html' : reqUrl);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, async () => {
  console.log(`Server running on http://127.0.0.1:${port}`);

  const userDataDir = path.join(os.tmpdir(), 'edge_tryon_test_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,960',
    '--user-data-dir=' + userDataDir
  ]);

  try {
    const activePortFile = path.join(userDataDir, 'DevToolsActivePort');
    let assignedPort = null;
    for (let attempt = 1; attempt <= 25; attempt++) {
      await new Promise(r => setTimeout(r, 400));
      if (fs.existsSync(activePortFile)) {
        try {
          const lines = fs.readFileSync(activePortFile, 'utf8').trim().split('\n');
          assignedPort = parseInt(lines[0].trim(), 10);
          if (assignedPort > 0) break;
        } catch (_) {}
      }
    }
    if (!assignedPort) throw new Error('Could not read DevToolsActivePort from Edge');

    const listRes = await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${assignedPort}/json`, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
    });
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
    ws.addEventListener('message', msg => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
        errors.push(data.params.message.text);
      }
    });

    await send('Console.enable');
    await send('Network.enable');

    console.log('Navigating to product page...');
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/product.html?id=1` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Opening AI Virtual Dressing Room Studio...');
    await send('Runtime.evaluate', {
      expression: `new Promise(resolve => {
        const check = () => {
          const btn = document.getElementById('btnOpenTryonStudio');
          if (btn) {
            btn.click();
            resolve(true);
          } else if (window.currentProduct) {
            window.openRjTryonStudio(window.currentProduct);
            resolve(true);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      })`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('Injecting sample customer portrait and agreeing to terms...');
    const testImgBase64 = fs.readFileSync(path.join(publicDir, 'images', 'og-preview.jpg')).toString('base64');
    const injectRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('rjTryonModal');
        const isActive = modal && modal.classList.contains('active');
        
        const samplePhoto = 'data:image/jpeg;base64,${testImgBase64}';
        
        // Convert base64 to File
        const byteCharacters = atob('${testImgBase64}');
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], 'my_portrait.jpg', { type: 'image/jpeg' });
        const dt = new DataTransfer();
        dt.items.add(file);
        
        const input = document.getElementById('rjTryonFileInput');
        if (input) {
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const consent = document.getElementById('rjTryonConsentCheck');
        if (consent) {
          consent.checked = true;
          consent.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const submitBtn = document.getElementById('rjTryonSubmitBtn');
        return {
          modalActive: isActive,
          submitDisabled: submitBtn ? submitBtn.disabled : true
        };
      })()`,
      returnByValue: true
    });
    console.log('Upload state:', injectRes.result.value);

    console.log('Clicking Generate AI Virtual Try-On button...');
    await send('Runtime.evaluate', {
      expression: `
        const submitBtn = document.getElementById('rjTryonSubmitBtn');
        if (submitBtn) submitBtn.click();
      `
    });

    console.log('Waiting for AI generation pipeline (processing stage)...');
    await new Promise(r => setTimeout(r, 1000));

    const processingState = await send('Runtime.evaluate', {
      expression: `(() => {
        const stProc = document.getElementById('rjTryonStageProcessing');
        const prog = document.getElementById('rjTryonProgressBar');
        return {
          isProcessingVisible: stProc ? stProc.style.display !== 'none' : false,
          progressWidth: prog ? prog.style.width : '0%'
        };
      })()`,
      returnByValue: true
    });
    console.log('Processing state:', processingState.result.value);

    console.log('Waiting for Result Studio to render...');
    await new Promise(r => setTimeout(r, 2500));

    const resultState = await send('Runtime.evaluate', {
      expression: `(() => {
        const stResult = document.getElementById('rjTryonStageResult');
        const resultImg = document.getElementById('rjTryonResultImg');
        const origImg = document.getElementById('rjTryonOriginalImg');
        const sliderHandle = document.getElementById('rjTryonSliderHandle');
        return {
          isResultVisible: stResult ? stResult.style.display !== 'none' : false,
          hasResultImg: resultImg && !!resultImg.src && resultImg.src.length > 50,
          hasOrigImg: origImg && !!origImg.src && origImg.src.length > 50,
          sliderHandleLeft: sliderHandle ? sliderHandle.style.left : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Final Result Studio state:', resultState.result.value);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(__dirname, '..', 'tryon_result_studio_verified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified screenshot to:', shotPath);

    console.log('Errors logged during flow:', errors.length);
    if (errors.length > 0) console.error('Errors:', errors);

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { edge.kill(); } catch (_) {}
    server.close();
    process.exit(0);
  }
});
