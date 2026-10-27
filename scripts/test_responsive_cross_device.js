const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const VIEWPORTS = [
  { name: '320x568 (iPhone SE 1st gen / Ultra-compact)', width: 320, height: 568, isMobile: true },
  { name: '360x800 (Samsung Galaxy S20 / Android standard)', width: 360, height: 800, isMobile: true },
  { name: '375x812 (iPhone X / 11 Pro / 12/13 mini)', width: 375, height: 812, isMobile: true },
  { name: '390x844 (iPhone 12 / 13 / 14 / 15)', width: 390, height: 844, isMobile: true },
  { name: '430x932 (iPhone 14 / 15 Pro Max / 16 Plus)', width: 430, height: 932, isMobile: true },
  { name: '600x960 (Android Tablet Portrait / Foldable)', width: 600, height: 960, isMobile: true },
  { name: '768x1024 (iPad Mini / iPad 10.2" Portrait)', width: 768, height: 1024, isMobile: true },
  { name: '820x1180 (iPad Air / iPad Pro 11" Portrait)', width: 820, height: 1180, isMobile: true },
  { name: '1024x768 (iPad Landscape / Compact Laptop)', width: 1024, height: 768, isMobile: false },
  { name: '1280x800 (13" Laptop / WXGA)', width: 1280, height: 800, isMobile: false },
  { name: '1366x768 (HD Laptop Display)', width: 1366, height: 768, isMobile: false },
  { name: '1440x900 (MacBook Pro / Desktop)', width: 1440, height: 900, isMobile: false },
  { name: '1920x1080 (Full HD 1080p Desktop)', width: 1920, height: 1080, isMobile: false }
];

const PAGES_TO_TEST = [
  { name: 'Homepage', url: 'http://localhost:3000/' },
  { name: 'Shop Catalog', url: 'http://localhost:3000/shop.html' },
  { name: 'Product Detail', url: 'http://localhost:3000/product.html?id=1' },
  { name: 'Cart Page', url: 'http://localhost:3000/cart.html' },
  { name: 'Wishlist Page', url: 'http://localhost:3000/wishlist.html' },
  { name: 'Checkout Page', url: 'http://localhost:3000/checkout.html' },
  { name: 'Delivery Page', url: 'http://localhost:3000/delivery.html' },
  { name: 'Login Page', url: 'http://localhost:3000/login.html' },
  { name: 'Account Dashboard', url: 'http://localhost:3000/account.html' },
  { name: 'Admin Dashboard', url: 'http://localhost:3000/admin.html' }
];

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('====================================================================');
  console.log('📱 RJ FASHION COLLECTION — CROSS-DEVICE & RESPONSIVE AUDIT ENGINE');
  console.log('====================================================================\n');

  // 1. Verify / Launch Server
  let serverProcess = null;
  let isServerRunning = false;
  try {
    const res = await fetch('http://localhost:3000/');
    if (res.ok) isServerRunning = true;
  } catch (e) {}

  if (!isServerRunning) {
    console.log('Starting local Express server on port 3000...');
    serverProcess = spawn('node', ['server.js'], { cwd: process.cwd(), stdio: 'pipe' });
    serverProcess.stderr.on('data', d => console.error('[Server Stderr]', d.toString()));
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch('http://localhost:3000/');
        if (res.ok) {
          isServerRunning = true;
          break;
        }
      } catch (e) {}
    }
  }

  if (!isServerRunning) {
    console.error('❌ Could not start Express server.');
    process.exit(1);
  }
  console.log('✅ Express server active on http://localhost:3000\n');

  // 2. Launch Headless Edge
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const profileDir = path.join(os.tmpdir(), 'edge_resp_' + Date.now());
  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + profileDir
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!versionData) {
    console.error('❌ Could not connect to Edge browser on port 9222');
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }

  console.log(`✅ Headless Browser ready: ${versionData.Browser}\n`);

  // 3. Connect to page target
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const issues = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`📐 TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`-------------------------------------------------------------`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.isMobile
    });

    for (const page of PAGES_TO_TEST) {
      await cdp.send('Page.navigate', { url: page.url });
      await new Promise(r => setTimeout(r, 900)); // wait for layout & dynamic load

      // Evaluate layout metrics in browser
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
            const hasHorizontalOverflow = scrollWidth > (docWidth + 1.5) || bodyScrollWidth > (docWidth + 1.5);

            // Find overflowing elements if any
            let overflowingElements = [];
            if (hasHorizontalOverflow) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                // Ignore elements hidden or inside overflow-hidden containers
                if (el.offsetParent === null && el.tagName !== 'BODY' && el.tagName !== 'HTML') continue;
                const rect = el.getBoundingClientRect();
                if (rect.right > (docWidth + 2)) {
                  const tag = el.tagName.toLowerCase();
                  const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
                  const id = el.id ? '#' + el.id : '';
                  overflowingElements.push(tag + id + cls + ' (right=' + Math.round(rect.right) + 'px, docWidth=' + docWidth + 'px)');
                  if (overflowingElements.length >= 3) break;
                }
              }
            }

            // Input font size check on mobile (prevent iOS Safari zoom)
            let smallInputs = [];
            if (window.innerWidth <= 820) {
              const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
              for (const inp of inputs) {
                const fs = parseFloat(window.getComputedStyle(inp).fontSize);
                if (fs < 15.5) {
                  smallInputs.push((inp.name || inp.id || inp.className) + ' (fs=' + fs + 'px)');
                  if (smallInputs.length >= 3) break;
                }
              }
            }

            // Check mobile hamburger existence on mobile
            const hamburger = document.getElementById('rj-hamburger-btn');
            const hamburgerVisible = hamburger ? (window.getComputedStyle(hamburger).display !== 'none') : false;

            return {
              docWidth,
              scrollWidth,
              bodyScrollWidth,
              hasHorizontalOverflow,
              overflowingElements,
              smallInputs,
              hamburgerVisible
            };
          })()
        `,
        returnByValue: true
      });

      const res = evalRes.result.value;
      totalChecks++;

      if (!res.hasHorizontalOverflow && res.smallInputs.length === 0) {
        passedChecks++;
        console.log(`  ✓ PASS: [${page.name}] Zero overflow (docWidth=${res.docWidth}px, scrollWidth=${res.scrollWidth}px)`);
      } else {
        failedChecks++;
        const failDetails = [];
        if (res.hasHorizontalOverflow) {
          failDetails.push(`Overflow: scrollWidth=${res.scrollWidth}px, bodyScroll=${res.bodyScrollWidth}px > docWidth=${res.docWidth}px [Elements: ${res.overflowingElements.join(', ')}]`);
        }
        if (res.smallInputs.length > 0) {
          failDetails.push(`Inputs < 16px: ${res.smallInputs.join(', ')}`);
        }
        console.log(`  ❌ FAIL: [${page.name}] ${failDetails.join(' | ')}`);
        issues.push({
          viewport: vp.name,
          page: page.name,
          details: failDetails.join(' | ')
        });
      }
    }
  }

  // Close Edge & CDP
  cdp.close();
  edgeProcess.kill();
  if (serverProcess) serverProcess.kill();

  console.log(`\n=============================================================`);
  console.log(`📊 CROSS-DEVICE AUDIT RESULTS:`);
  console.log(`   TOTAL CHECKS: ${totalChecks}`);
  console.log(`   PASSED: ${passedChecks}`);
  console.log(`   FAILED: ${failedChecks}`);
  console.log(`=============================================================`);

  if (issues.length > 0) {
    console.log(`\n🚨 FOUND ${issues.length} ISSUE(S) TO FIX:`);
    for (const issue of issues) {
      console.log(` - [${issue.viewport}] ${issue.page}: ${issue.details}`);
    }
    process.exit(1);
  } else {
    console.log(`\n🎉 100% PERFECT CROSS-DEVICE COMPATIBILITY ACROSS ALL 13 VIEWPORTS!`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Audit script exception:', err);
  process.exit(1);
});
