const http = require('http');
const { spawn } = require('child_process');

async function runTests() {
  console.log('--- STARTING WAF TEST SUITE ---');

  // Launch local server
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '3099', NODE_ENV: 'test' },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', d => {
    // console.log('[SERVER]', d.toString().trim());
  });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));

  const testCases = [
    {
      name: 'Legitimate Request: Valid Product Search',
      path: '/api/products',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      expectedStatus: 200
    },
    {
      name: 'WAF Status Endpoint Check',
      path: '/api/waf/status',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      expectedStatus: 200
    },
    {
      name: 'Hostile Scanner: sqlmap blocked',
      path: '/api/products',
      method: 'GET',
      headers: { 'User-Agent': 'sqlmap/1.7.2#stable' },
      expectedStatus: 403
    },
    {
      name: 'Hostile Scanner: Nikto blocked',
      path: '/api/products',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Nikto/2.1.6)' },
      expectedStatus: 403
    },
    {
      name: 'SQL Injection: UNION SELECT in Query String blocked',
      path: '/api/products?search=%27%20UNION%20SELECT%201,2,3--',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      expectedStatus: 403
    },
    {
      name: 'SQL Injection: OR 1=1 in Body blocked',
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ name: "admin' OR 1=1--", email: "test@example.com", message: "Hello" }),
      expectedStatus: 403
    },
    {
      name: 'XSS Injection: <script> tag in Query String blocked',
      path: '/api/products?search=%3Cscript%3Ealert(document.cookie)%3C/script%3E',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      expectedStatus: 403
    },
    {
      name: 'XSS Injection: onerror event in Body blocked',
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ name: "Alice", email: "test@example.com", message: "<img src=x onerror=alert(1)>" }),
      expectedStatus: 403
    },
    {
      name: 'Path Traversal: /etc/passwd in URL blocked',
      path: '/api/products/..%2f..%2fetc%2fpasswd',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      expectedStatus: 403
    },
    {
      name: 'Command Injection: RCE payload in Body blocked',
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ name: "Alice", email: "test@example.com", message: "; cat /etc/shadow" }),
      expectedStatus: 403
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const res = await new Promise((resolve) => {
      const options = {
        hostname: '127.0.0.1',
        port: 3099,
        path: tc.path,
        method: tc.method,
        headers: tc.headers || {}
      };

      const req = http.request(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body }));
      });

      req.on('error', (err) => resolve({ error: err.message }));
      if (tc.body) req.write(tc.body);
      req.end();
    });

    if (res.status === tc.expectedStatus) {
      console.log(`[PASS] ${tc.name} -> HTTP ${res.status}`);
      passed++;
    } else {
      console.error(`[FAIL] ${tc.name} -> Expected HTTP ${tc.expectedStatus}, got ${res.status} (${res.error || res.body})`);
      failed++;
    }
  }

  console.log(`\n--- WAF TEST RESULTS: ${passed} Passed, ${failed} Failed ---`);
  serverProcess.kill();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
