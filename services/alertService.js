/**
 * RJ FASHION COLLECTION — ENTERPRISE ERROR ALERTING & OWNER NOTIFICATION ENGINE
 * 
 * Philosophy:
 * "If anything gets down or any issue occurs, the store owner knows FIRST,
 *  while customers receive an elegant, reassuring luxury experience."
 * 
 * Features:
 * 1. Proactive owner alerts sent directly to omvinayakwork@gmail.com
 * 2. Intelligent alert de-duplication & throttling (prevents mailbox flooding)
 * 3. Sanitized customer-facing error envelopes with unique Incident Reference IDs
 * 4. Persistent circular incident ledger (backups/incidents.json)
 * 5. Full telemetry capture: stack trace, system memory, URL, method, IP, user-agent
 * 6. Admin API integration for real-time dashboard visibility
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const nodemailer = require('nodemailer');

const OWNER_EMAIL = 'omvinayakwork@gmail.com';
const INCIDENTS_FILE = path.join(__dirname, '..', 'backups', 'incidents.json');
const MAX_INCIDENTS_BUFFER = 500;

// In-memory throttling map: signature -> { lastAlertTime: number, count: number }
const throttleMap = new Map();
const THROTTLE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes throttle window

// Circular in-memory incident log
const incidentLedger = [];

// Initialize ledger from disk if present
try {
  if (fs.existsSync(INCIDENTS_FILE)) {
    const raw = fs.readFileSync(INCIDENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      incidentLedger.push(...parsed.slice(-MAX_INCIDENTS_BUFFER));
    }
  }
} catch (_) {}

function saveLedger() {
  try {
    const dir = path.dirname(INCIDENTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidentLedger.slice(-MAX_INCIDENTS_BUFFER), null, 2), 'utf8');
  } catch (err) {
    console.error('[AlertService] Failed to persist incidents ledger:', err.message);
  }
}

function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  return {
    rssMb: (memUsage.rss / 1024 / 1024).toFixed(1),
    heapUsedMb: (memUsage.heapUsed / 1024 / 1024).toFixed(1),
    heapTotalMb: (memUsage.heapTotal / 1024 / 1024).toFixed(1),
    systemFreeMemMb: (os.freemem() / 1024 / 1024).toFixed(1),
    systemTotalMemMb: (os.totalmem() / 1024 / 1024).toFixed(1),
    uptimeSeconds: Math.round(process.uptime()),
    platform: `${os.platform()} ${os.arch()}`,
    nodeVersion: process.version
  };
}

function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = Array.isArray(obj) ? [] : {};
  const redactKeys = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'creditCard', 'cvv', 'secret', 'token'];
  for (const [k, v] of Object.entries(obj)) {
    if (redactKeys.some(rk => k.toLowerCase().includes(rk.toLowerCase()))) {
      clean[k] = '[REDACTED_CONFIDENTIAL]';
    } else if (v && typeof v === 'object') {
      clean[k] = sanitizePayload(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Dispatches urgent email notification to the store owner
 */
async function sendUrgentEmailToOwner(incident) {
  const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

  const subject = `🚨 URGENT: RJ Fashion Incident [${incident.type}] — Ref: ${incident.referenceId}`;
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 30px 15px;">
      <tr><td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background: #111827; border: 1px solid #ef4444; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <!-- Header Strip -->
          <tr><td style="background: linear-gradient(135deg, #7f1d1d, #991b1b); padding: 20px 32px; border-bottom: 2px solid #ef4444;">
            <div style="font-size: 11px; font-weight: 800; color: #fecaca; letter-spacing: 2px; text-transform: uppercase;">RJ FASHION COLLECTION — AUTONOMOUS SECURITY DEFENSE</div>
            <h1 style="color: #ffffff; font-size: 22px; margin: 6px 0 0; font-weight: 800;">🚨 SYSTEM INCIDENT DETECTED</h1>
          </td></tr>

          <!-- Summary Box -->
          <tr><td style="padding: 24px 32px;">
            <div style="background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 4px; margin-bottom: 22px;">
              <div style="font-size: 14px; color: #fca5a5; font-weight: 700; margin-bottom: 4px;">Incident Reference: ${incident.referenceId}</div>
              <div style="font-size: 16px; color: #ffffff; font-weight: 600;">${incident.title || incident.message}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Detected at: <strong>${incident.timestamp}</strong> | Severity: <strong style="color: #ef4444;">${incident.severity}</strong></div>
            </div>

            <!-- Customer Protection Notice -->
            <div style="background: rgba(16, 185, 129, 0.12); border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px; margin-bottom: 22px; font-size: 13px; color: #6ee7b7;">
              🛡️ <strong>Customer Experience Shielded:</strong> The customer received a polite, luxury apology without any technical details or internal error leaks.
            </div>

            <!-- Technical Details -->
            <h3 style="color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; border-bottom: 1px solid #374151; padding-bottom: 6px;">Incident Telemetry</h3>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
              <tr><td style="width: 140px; color: #94a3b8;">Type:</td><td><code>${incident.type}</code></td></tr>
              ${incident.url ? `<tr><td style="color: #94a3b8;">Request URL:</td><td><code>${incident.method || 'GET'} ${incident.url}</code></td></tr>` : ''}
              ${incident.ip ? `<tr><td style="color: #94a3b8;">Client IP:</td><td><code>${incident.ip}</code></td></tr>` : ''}
              ${incident.userAgent ? `<tr><td style="color: #94a3b8;">User Agent:</td><td><small>${incident.userAgent}</small></td></tr>` : ''}
              <tr><td style="color: #94a3b8;">Heap Memory:</td><td>${incident.metrics ? `${incident.metrics.heapUsedMb} MB / ${incident.metrics.heapTotalMb} MB` : 'N/A'}</td></tr>
              <tr><td style="color: #94a3b8;">Node Uptime:</td><td>${incident.metrics ? `${incident.metrics.uptimeSeconds}s` : 'N/A'}</td></tr>
            </table>

            <!-- Stack Trace -->
            ${incident.stack ? `
            <h3 style="color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; border-bottom: 1px solid #374151; padding-bottom: 6px;">Stack Trace</h3>
            <pre style="background: #030712; color: #f87171; padding: 14px; border-radius: 6px; font-size: 11px; overflow-x: auto; line-height: 1.5; border: 1px solid #1f2937; margin: 0 0 24px;">${incident.stack}</pre>
            ` : ''}

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 26px 0 10px;">
              <a href="https://rj-fashion-collection.web.app/admin" style="background: #d4af37; color: #070a12; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; display: inline-block;">OPEN ADMIN PORTAL</a>
            </div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background: #030712; padding: 14px 20px; text-align: center; border-top: 1px solid #1f2937; font-size: 11px; color: #64748b;">
            Confidential Owner Alert dispatched to <strong>${OWNER_EMAIL}</strong>. RJ Fashion Collection Autonomous Defense Engine.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  console.log(`[ALERT-DISPATCH] 🚨 Dispatched urgent alert [${incident.referenceId}] to Owner (${OWNER_EMAIL})`);

  if (!EMAIL_ENABLED) {
    console.log(`[ALERT-DISPATCH] EMAIL_ENABLED=false: Alert logged locally to incident ledger.`);
    return { success: true, logged: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"RJFC Security Sentinel" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'alerts@rj-fashion-collection.web.app'}>`,
      to: OWNER_EMAIL,
      subject,
      html
    });

    return { success: true, sent: true };
  } catch (err) {
    console.error('[ALERT-DISPATCH] Failed to send alert email:', err.message);
    return { success: false, error: err.message };
  }
}

class AlertService {
  /**
   * Primary Entry Point: Record and notify the owner of any application or system issue
   */
  notifyOwner({ type = 'SERVER_ERROR', title, message, severity = 'HIGH', stack = '', req = null, extra = {} }) {
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    const referenceId = `RJFC-ERR-${Math.floor(100000 + Math.random() * 900000)}`;

    const signature = `${type}:${(title || message || '').substring(0, 100)}`;
    const throttle = throttleMap.get(signature) || { lastAlertTime: 0, count: 0 };
    throttle.count++;

    const isThrottled = (now - throttle.lastAlertTime) < THROTTLE_WINDOW_MS;
    if (!isThrottled) {
      throttle.lastAlertTime = now;
    }
    throttleMap.set(signature, throttle);

    const incident = {
      referenceId,
      type,
      severity,
      title: title || message,
      message,
      stack,
      timestamp,
      url: req ? req.originalUrl || req.url : null,
      method: req ? req.method : null,
      ip: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : null,
      userAgent: req ? req.headers['user-agent'] : null,
      body: req && req.body ? sanitizePayload(req.body) : null,
      metrics: getSystemMetrics(),
      occurrenceCount: throttle.count,
      acknowledged: false,
      extra
    };

    // Store in circular ledger
    incidentLedger.push(incident);
    if (incidentLedger.length > MAX_INCIDENTS_BUFFER) incidentLedger.shift();
    saveLedger();

    // Alert owner if not throttled
    if (!isThrottled || throttle.count === 1) {
      sendUrgentEmailToOwner(incident).catch(e => console.error('[AlertService] Error sending email:', e.message));
    } else {
      console.log(`[ALERT-THROTTLED] Similar incident [${signature}] throttled. Total occurrences in current window: ${throttle.count}`);
    }

    return incident;
  }

  /**
   * Express error handler helper: generates polite customer response & notifies owner
   */
  handleExpressError(err, req, res) {
    const statusCode = err.status || err.statusCode || 500;
    const isClientError = statusCode >= 400 && statusCode < 500;

    // 4xx errors are client errors (invalid input, etc.) - don't spam owner unless repeated
    if (isClientError) {
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Request could not be processed.'
      });
    }

    // 5xx Server Error: Notify owner FIRST!
    const incident = this.notifyOwner({
      type: '500_SERVER_ERROR',
      title: err.message || 'Internal Server Error',
      message: err.message,
      stack: err.stack,
      severity: 'CRITICAL',
      req
    });

    // Customer receives luxury, polite response with reference ID
    const customerMessage = 'We are currently experiencing a brief technical moment. Our engineering team has been notified. Please try again in a few moments.';

    if (req.accepts('html') && !req.xhr && !req.path.startsWith('/api/')) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RJ Fashion Collection — Momentary Update</title>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg">
          <style>
            body { margin: 0; padding: 0; background: #070a12; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
            .card { background: #0e1322; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 48px 36px; max-width: 520px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
            .brand { color: #d4af37; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin-bottom: 12px; }
            h1 { font-size: 24px; margin: 0 0 16px; color: #ffffff; font-family: Georgia, serif; }
            p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
            .btn { background: #d4af37; color: #070a12; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.9; }
            .ref { font-size: 11px; color: #64748b; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">RJ FASHION COLLECTION</div>
            <h1>Boutique System Update</h1>
            <p>${customerMessage}</p>
            <a href="/" class="btn">Return to Storefront</a>
            <div class="ref">Support Reference: ${incident.referenceId}</div>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(500).json({
      success: false,
      message: customerMessage,
      referenceId: incident.referenceId
    });
  }

  /**
   * Retrieve recent incidents for the admin portal
   */
  getRecentIncidents(limit = 50) {
    return incidentLedger.slice(-limit).reverse();
  }

  /**
   * Acknowledge an incident
   */
  acknowledgeIncident(referenceId) {
    const inc = incidentLedger.find(i => i.referenceId === referenceId);
    if (inc) {
      inc.acknowledged = true;
      saveLedger();
      return true;
    }
    return false;
  }
}

const alertServiceInstance = new AlertService();
module.exports = alertServiceInstance;
