/**
 * RJ FASHION COLLECTION — HIGH-AVAILABILITY UPTIME WATCHDOG
 * 
 * Philosophy:
 * "If the website gets down or encounters any issue, the store owner knows FIRST,
 *  before any customer experiences a disruption."
 * 
 * Monitored Endpoints:
 * 1. Live Storefront: https://rj-fashion-collection.web.app/
 * 2. Backend Health: http://localhost:3000/api/health
 * 
 * Capabilities:
 * - Checks HTTP status, latency, database health
 * - Dispatches immediate alert to omvinayakwork@gmail.com on failure
 * - Tracks consecutive failure count and downtime duration
 * - Emits recovery alert when service is restored
 */

const http = require('http');
const https = require('https');
const alertService = require('../services/alertService');

const PROD_URL = 'https://rj-fashion-collection.web.app/';
const LOCAL_HEALTH_URL = 'http://localhost:3000/api/health';

let lastStatus = 'HEALTHY';
let failureCount = 0;
let downSince = null;

function probeUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const startTime = Date.now();

    const req = client.get(url, {
      timeout: timeoutMs,
      headers: { 'User-Agent': 'RJFC-Uptime-Watchdog/2.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          latency,
          data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, statusCode: 408, error: 'TIMEOUT' });
    });

    req.on('error', (err) => {
      resolve({ ok: false, statusCode: 503, error: err.message });
    });
  });
}

async function runWatchdogCycle() {
  const timestamp = new Date().toISOString();
  console.log(`[WATCHDOG] [${timestamp}] Running proactive health & uptime scan...`);

  const prodResult = await probeUrl(PROD_URL);
  console.log(`[WATCHDOG] Production Edge (${PROD_URL}): HTTP ${prodResult.statusCode} (${prodResult.latency || 0}ms)`);

  let isHealthy = prodResult.ok;
  let failureReason = '';

  if (!prodResult.ok) {
    failureReason = `Production edge returned HTTP ${prodResult.statusCode}: ${prodResult.error || 'Non-200 response'}`;
  }

  // Also probe local health endpoint if running locally
  try {
    const localResult = await probeUrl(LOCAL_HEALTH_URL, 3000);
    if (localResult.ok) {
      try {
        const body = JSON.parse(localResult.data);
        if (body.database !== 'HEALTHY') {
          isHealthy = false;
          failureReason += ` Database status: ${body.database}`;
        }
      } catch (_) {}
    }
  } catch (_) {}

  if (!isHealthy) {
    failureCount++;
    if (!downSince) downSince = new Date();

    console.error(`[WATCHDOG] 🚨 DOWNTIME / DEGRADATION DETECTED! Failures: ${failureCount}. Reason: ${failureReason}`);

    // Alert store owner FIRST!
    alertService.notifyOwner({
      type: 'SITE_DOWNTIME_DETECTED',
      title: 'CRITICAL: RJ Fashion Collection Site Downtime Detected',
      message: `The uptime watchdog detected an issue on ${PROD_URL}. ${failureReason}`,
      severity: 'CRITICAL',
      extra: {
        failureCount,
        downSince: downSince.toISOString(),
        statusCode: prodResult.statusCode,
        latency: prodResult.latency
      }
    });

    lastStatus = 'DOWN';
  } else {
    if (lastStatus === 'DOWN') {
      console.log(`[WATCHDOG] ✅ SERVICE RESTORED! Site is back online.`);
      alertService.notifyOwner({
        type: 'SITE_RESTORED',
        title: 'RESOLVED: RJ Fashion Collection is Back Online',
        message: `Service has fully recovered and is responding with HTTP 200 OK. Total downtime events resolved.`,
        severity: 'LOW',
        extra: {
          downtimeDurationMs: downSince ? (Date.now() - downSince.getTime()) : 0
        }
      });
      downSince = null;
      failureCount = 0;
    }
    lastStatus = 'HEALTHY';
    console.log(`[WATCHDOG] ✅ Health check OK: Storefront is fully operational and responsive.`);
  }

  return { isHealthy, statusCode: prodResult.statusCode, latency: prodResult.latency };
}

// If run from CLI
if (require.main === module) {
  runWatchdogCycle().then((res) => {
    process.exit(res.isHealthy ? 0 : 1);
  });
}

module.exports = { runWatchdogCycle };
