/**
 * RJ FASHION COLLECTION — ERROR SHIELDING & OWNER ALERTING TEST SUITE
 * 
 * Verifies:
 * 1. Customer Error Shielding: Zero technical leaks, stack traces, or internal paths
 * 2. Incident Reference ID: Generated and delivered to customer for support tracking
 * 3. Owner-First Alerting: Full diagnostic telemetry dispatched to omvinayakwork@gmail.com
 * 4. Incident Ledger: Persisted to backups/incidents.json with circular buffer
 * 5. Alert Throttling: Prevents inbox flooding on high-frequency recurring errors
 */

const fs = require('fs');
const path = require('path');
const alertService = require('../services/alertService');

let passed = 0;
let failed = 0;

function assert(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name} -> ${errorMsg}`);
    failed++;
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('🛡️  ERROR SHIELDING & OWNER-FIRST ALERTING AUDIT');
  console.log('============================================================\n');

  // 1. Simulate an unhandled database / backend error
  const syntheticError = new Error('Database disk I/O simulated fault: table lock timeout at /var/data/users.db');
  syntheticError.status = 500;
  syntheticError.stack = 'Error: Database disk I/O simulated fault\n    at fakeQueryFunction (/app/routes/orders.js:142:11)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)';

  const fakeReq = {
    method: 'POST',
    url: '/api/orders/place',
    originalUrl: '/api/orders/place',
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      'x-forwarded-for': '203.0.113.42'
    },
    body: {
      items: [{ id: 1, qty: 2 }],
      password: 'ShouldBeRedactedPassword123'
    },
    accepts: () => false,
    xhr: true
  };

  let customerResponseData = null;
  let customerStatusCode = 0;

  const fakeRes = {
    status: (code) => {
      customerStatusCode = code;
      return {
        json: (data) => {
          customerResponseData = data;
        },
        send: (html) => {
          customerResponseData = { html };
        }
      };
    }
  };

  // Process error through alertService
  alertService.handleExpressError(syntheticError, fakeReq, fakeRes);

  // 2. Verify Customer Experience
  assert('HTTP Status is 500', customerStatusCode === 500);
  assert('Customer response contains success: false', customerResponseData && customerResponseData.success === false);
  assert(
    'Customer message is polite and reassuring with NO technical leaks',
    customerResponseData.message &&
    customerResponseData.message.includes('experiencing a brief technical moment') &&
    !customerResponseData.message.includes('Database') &&
    !customerResponseData.message.includes('I/O') &&
    !customerResponseData.message.includes('/var/data')
  );
  assert(
    'Customer response provides unique Support Reference ID',
    customerResponseData.referenceId && customerResponseData.referenceId.startsWith('RJFC-ERR-')
  );
  assert(
    'Customer response DOES NOT include stack trace',
    customerResponseData.stack === undefined
  );

  // 3. Verify Owner Telemetry in Incident Ledger
  const incidents = alertService.getRecentIncidents(10);
  const matchedIncident = incidents.find(i => i.referenceId === customerResponseData.referenceId);

  assert('Incident recorded in circular incident ledger', Boolean(matchedIncident));
  assert('Owner telemetry captures full error title & message', matchedIncident.message.includes('Database disk I/O simulated fault'));
  assert('Owner telemetry captures full stack trace', matchedIncident.stack.includes('fakeQueryFunction'));
  assert('Owner telemetry captures request URL and HTTP method', matchedIncident.url === '/api/orders/place' && matchedIncident.method === 'POST');
  assert('Owner telemetry captures client IP (203.0.113.42)', matchedIncident.ip === '203.0.113.42');
  assert('Sensitive request body passwords redacted in telemetry', matchedIncident.body && matchedIncident.body.password === '[REDACTED_CONFIDENTIAL]');
  assert('System memory & uptime metrics captured', Boolean(matchedIncident.metrics && matchedIncident.metrics.heapUsedMb));

  // 4. Verify Throttling prevents email flooding
  const duplicateIncident = alertService.notifyOwner({
    type: '500_SERVER_ERROR',
    title: syntheticError.message,
    message: syntheticError.message,
    severity: 'CRITICAL',
    req: fakeReq
  });
  assert('Duplicate error within 15 min window increments counter', duplicateIncident.occurrenceCount >= 2);

  // 5. Verify Persistent Ledger File
  const ledgerPath = path.join(__dirname, '..', 'backups', 'incidents.json');
  assert('Incidents ledger file persisted to disk', fs.existsSync(ledgerPath));

  console.log('\n============================================================');
  console.log(`ERROR ALERTING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('[ALERT-TEST] Unexpected error:', err);
  process.exit(1);
});
