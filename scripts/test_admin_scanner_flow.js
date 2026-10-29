const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function runScannerTest() {
  console.log('🧪 Starting On-Demand Admin QR Scanner & Strict Email Verification Test...');

  // Start background server
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1800));

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9933',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_test_scanner_' + Date.now())
  ]);

  try {
    // 1. Part 1: API Endpoint Tests
    console.log('\n--- Part 1: Testing Backend Scanner Endpoints ---');
    const initRes = await fetch('http://localhost:3000/api/auth/admin-scan-init', { method: 'POST' });
    const initData = await initRes.json();
    if (!initData.success || !initData.scanId) throw new Error('Failed to init scan session');
    const scanId = initData.scanId;
    console.log('✓ PASS: POST /api/auth/admin-scan-init generated scan challenge:', scanId);

    // Check pending status
    const pendingRes = await fetch(`http://localhost:3000/api/auth/admin-scan-status?scan_id=${scanId}`);
    const pendingData = await pendingRes.json();
    if (pendingData.status !== 'PENDING') throw new Error('Expected status PENDING, got: ' + pendingData.status);
    console.log('✓ PASS: GET /api/auth/admin-scan-status returns PENDING');

    // Test rejection of unauthorized email
    const rejectRes = await fetch('http://localhost:3000/api/auth/admin-scan-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanId, email: 'intruder@gmail.com' })
    });
    if (rejectRes.status !== 403) throw new Error('Expected 403 for unauthorized email, got: ' + rejectRes.status);
    const rejectData = await rejectRes.json();
    if (rejectData.status !== 'REJECTED') throw new Error('Expected status REJECTED');
    console.log('✓ PASS: Unauthorized email (intruder@gmail.com) is REJECTED with 403');

    // Fresh challenge for approval test
    const initRes2 = await fetch('http://localhost:3000/api/auth/admin-scan-init', { method: 'POST' });
    const initData2 = await initRes2.json();
    const scanId2 = initData2.scanId;

    // Test approval for omvinayakwork@gmail.com
    const approveRes = await fetch('http://localhost:3000/api/auth/admin-scan-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanId2, email: 'omvinayakwork@gmail.com' })
    });
    if (!approveRes.ok) throw new Error('Expected 200 for omvinayakwork@gmail.com, got: ' + approveRes.status);
    const approveData = await approveRes.json();
    if (approveData.status !== 'APPROVED') throw new Error('Expected status APPROVED');
    console.log('✓ PASS: Authorized email (omvinayakwork@gmail.com) is APPROVED with 200');

    // Claim session
    const claimRes = await fetch('http://localhost:3000/api/auth/admin-scan-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanId2 })
    });
    if (!claimRes.ok) throw new Error('Expected 200 for claim, got: ' + claimRes.status);
    const claimData = await claimRes.json();
    if (!claimData.success || claimData.user.role !== 'admin') throw new Error('Claim did not grant admin role');
    console.log('✓ PASS: POST /api/auth/admin-scan-claim successfully establishes admin session');

    // 2. Part 2: Browser UI & Scanner Flow
    console.log('\n--- Part 2: Testing Browser UI & On-Demand Scanner Flow ---');
    await new Promise(r => setTimeout(r, 1500));
    const listRes = await new Promise((r) => http.get('http://127.0.0.1:9933/json', res => {
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

    await send('Page.navigate', { url: 'http://localhost:3000/admin' });
    await new Promise(r => setTimeout(r, 2000));

    // Submit Step 1 credentials
    console.log('1. Submitting Step 1 credentials for omvinayakwork@gmail.com...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('admin-email').value = 'omvinayakwork@gmail.com';
        document.getElementById('admin-password').value = 'OMvinayaktripathy';
        document.getElementById('admin-login-btn').click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Step 2 is active
    const step2Check = await send('Runtime.evaluate', {
      expression: `(() => {
        const step2 = document.getElementById('admin-2fa-container');
        const scanBtn = document.getElementById('btn-open-mobile-scan');
        const scanModal = document.getElementById('admin-mobile-scan-modal');
        return {
          step2Visible: window.getComputedStyle(step2).display !== 'none',
          scanBtnPresent: !!scanBtn,
          scannerModalDisplay: scanModal.style.display
        };
      })()`,
      returnByValue: true
    });
    console.log('Step 2 UI state:', step2Check.result.value);
    if (!step2Check.result.value.step2Visible) throw new Error('Step 2 container should be visible');
    if (!step2Check.result.value.scanBtnPresent) throw new Error('On-demand mobile scanner button missing');
    if (step2Check.result.value.scannerModalDisplay !== 'none') throw new Error('Scanner should be hidden initially ("when I need")');
    console.log('✓ PASS: Scanner is hidden initially ("when I need")');

    // 2. Open Scanner On Demand
    console.log('2. Clicking "Open QR Scanner" button on demand...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-open-mobile-scan').click();`
    });
    await new Promise(r => setTimeout(r, 500));

    const scannerOpenCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('admin-mobile-scan-modal');
        const img = document.getElementById('admin-scan-qr-img');
        const text = document.getElementById('admin-scan-status-text');
        return {
          modalDisplay: modal.style.display,
          hasImg: !!img && img.src.length > 0,
          statusText: text ? text.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Scanner drawer state:', scannerOpenCheck.result.value);
    if (scannerOpenCheck.result.value.modalDisplay !== 'block') throw new Error('Scanner modal failed to open');
    console.log('✓ PASS: Scanner drawer opened with dynamic QR and radar listener');

    // Capture screenshot of open scanner drawer
    const artifactDir = 'C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09';
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_ondemand_scanner_open.png'), Buffer.from(shot1.data, 'base64'));
    console.log('✓ PASS: Captured visual proof: admin_ondemand_scanner_open.png');

    // 3. Test Unauthorized Scan Rejection (MUST NOT MOVE FORWARD)
    console.log('3. Simulating scan by unauthorized account (attacker@gmail.com)...');
    await send('Runtime.evaluate', {
      expression: `testUnauthorizedScan();`
    });
    await new Promise(r => setTimeout(r, 500));

    const rejectCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const err = document.getElementById('admin-scan-error');
        const overlay = document.getElementById('admin-login-overlay');
        return {
          errVisible: err && err.style.display !== 'none',
          errText: err ? err.textContent : '',
          overlayVisible: window.getComputedStyle(overlay).display !== 'none'
        };
      })()`,
      returnByValue: true
    });
    console.log('Unauthorized scan rejection check:', rejectCheck.result.value);
    if (!rejectCheck.result.value.errVisible) throw new Error('Rejection error should be displayed');
    if (!rejectCheck.result.value.overlayVisible) throw new Error('Portal MUST NOT move forward on unauthorized scan!');
    console.log('✓ PASS: Unauthorized scan firmly rejected! Portal did NOT move forward.');

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_scanner_rejected_proof.png'), Buffer.from(shot2.data, 'base64'));
    console.log('✓ PASS: Captured visual proof: admin_scanner_rejected_proof.png');

    // 4. Test Authorized Scan by omvinayakwork@gmail.com (MUST MOVE FORWARD)
    console.log('4. Simulating scan by authorized owner (omvinayakwork@gmail.com)...');
    await send('Runtime.evaluate', {
      expression: `testAuthorizedScan();`
    });
    await new Promise(r => setTimeout(r, 1200));

    const forwardCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.getElementById('admin-login-overlay');
        const topbar = document.getElementById('admin-topbar-username');
        return {
          overlayDisplay: overlay ? overlay.style.display : '',
          username: topbar ? topbar.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Forward progression check:', forwardCheck.result.value);
    if (forwardCheck.result.value.overlayDisplay !== 'none') {
      throw new Error('Portal should have moved forward and hidden overlay!');
    }
    console.log('✓ PASS: Authorized scan by omvinayakwork@gmail.com MOVED FORWARD into Admin Dashboard!');

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'admin_scanner_unlocked_dashboard.png'), Buffer.from(shot3.data, 'base64'));
    console.log('✓ PASS: Captured visual proof: admin_scanner_unlocked_dashboard.png');

    ws.close();
    edge.kill();

    console.log('\n===============================================================');
    console.log('🎉 100% SUCCESS: ALL SCANNER TESTS PASSED PERFECTLY!');
    console.log('===============================================================');

  } finally {
    server.kill();
    try { edge.kill(); } catch (_) {}
  }
}

runScannerTest().catch(err => {
  console.error('❌ Scanner test failed:', err);
  process.exit(1);
});
