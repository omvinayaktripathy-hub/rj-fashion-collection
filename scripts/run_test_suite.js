const { spawn } = require('child_process');
const http = require('http');

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(true);
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return true;
    } catch (_) {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n================== RUNNING: ${cmd} ${args.join(' ')} ==================`);
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process ${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log('Starting background Express server (server.js)...');
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });

  try {
    await waitForServer('http://localhost:3000');
    console.log('✅ Server is alive and responding on http://localhost:3000!\n');

    const tests = [
      'test-e2e.js',
      'test-delivery-flow.js',
      'test-full-checkout.js',
      'test-lightbox-gallery.js',
      'test-security-suite.js',
      'scripts/test-rbac-idor.js',
      'test-admin-auth-2fa.js',
      'scripts/test-firebase-rules.js',
      'test-tryon-suite.js'
    ];

    for (const test of tests) {
      await runCommand('node', [test]);
    }

    console.log('\n🎉 ALL 9 TEST SUITES PASSED 100%!');
  } finally {
    console.log('\nShutting down test server...');
    server.kill();
  }
}

main().catch((err) => {
  console.error('\n❌ Test run failed:', err.message);
  process.exit(1);
});
