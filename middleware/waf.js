/**
 * RJ FASHION COLLECTION — Enterprise Web Application Firewall (WAF)
 * Layer-7 Autonomous Defense System
 *
 * Capabilities:
 * 1. Malicious Vulnerability Scanner & Bot Detection
 * 2. SQL Injection (SQLi) Inspection & Neutralization
 * 3. Cross-Site Scripting (XSS) Sanitization & Blocking
 * 4. Path Traversal & Sensitive File Probe Prevention
 * 5. Remote Code Execution (RCE) / Command Injection Shield
 * 6. Prototype Pollution Lockdown
 * 7. Real-Time WAF Security Incident Audit Ledger
 */

const fs = require('fs');
const path = require('path');

// Circular in-memory incident buffer (last 500 security events)
const WAF_INCIDENT_BUFFER_MAX = 500;
const wafIncidents = [];
let wafStats = {
  totalRequestsInspected: 0,
  threatsBlocked: 0,
  threatsByType: {
    sqli: 0,
    xss: 0,
    traversal: 0,
    rce: 0,
    bad_bot: 0,
    proto_pollution: 0
  },
  lastIncidentTimestamp: null
};

// 1. Hostile Scanner & Bad Bot Patterns
const BAD_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /wpscan/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /acunetix/i,
  /nmap/i,
  /zgrab/i,
  /censys/i,
  /shodan/i,
  /nessus/i,
  /openvas/i,
  /burpcollaborator/i,
  /havij/i,
  /netsparker/i,
  /arachni/i
];

// 2. Sensitive File Probe & Path Traversal Patterns
const PATH_TRAVERSAL_REGEX = /(?:\.\.[\\/]|%2e%2e[%2f%5c]|\/etc\/passwd|\/etc\/shadow|win\.ini|boot\.ini|\.env(?:\b|$)|web\.config|\.git(?:\/|$)|\.svn(?:\/|$)|\.DS_Store|phpinfo\.php|eval-stdin\.php)/i;

// 3. SQL Injection Signatures
const SQLI_PATTERNS = [
  /\bunion\s+(?:all\s+)?select\b/i,
  /\b(?:select|insert|update|delete|drop|alter)\b[\s\S]+\b(?:from|into|table|database)\b/i,
  /\b(?:benchmark|sleep|waitfor\s+delay)\s*\(/i,
  /\bgroup_concat\s*\(/i,
  /\b(?:or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /\b(?:or|and)\s+['"][^'"]+['"]\s*=\s*['"][^'"]+/i,
  /\/\*![\s\S]*?\*\//,
  /--[\s\r\n]/
];

// 4. Cross-Site Scripting (XSS) Signatures
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /(?:javascript|vbscript|livescript)\s*:/i,
  /\bon(?:load|error|click|mouseover|submit|focus|blur|pointerdown)\s*=/i,
  /<(?:iframe|object|embed|applet|base)\b/i,
  /<svg\b[^>]*\bon[a-z]+\s*=/i,
  /document\.(?:cookie|location|write)/i
];

// 5. Remote Code Execution (RCE) & Command Injection
const RCE_PATTERNS = [
  /[;&|]\s*(?:cat|ls|rm|chmod|chown|wget|curl|nc|bash|sh|powershell|cmd\.exe)\b/i,
  /\$\(\s*[\w\s.-]+\s*\)/,
  /`[^`]+`/,
  /base64_decode\s*\(/i,
  /passthru\s*\(/i
];

// Keys excluded from deep recursive SQLi inspection (e.g. valid password hashes/strings)
const EXCLUDED_PARAM_KEYS = new Set([
  'password',
  'current_password',
  'new_password',
  'confirm_password',
  'stripe-signature'
]);

function logWafIncident(ip, type, rule, sample, req) {
  wafStats.threatsBlocked++;
  if (wafStats.threatsByType[type] !== undefined) {
    wafStats.threatsByType[type]++;
  }
  wafStats.lastIncidentTimestamp = new Date().toISOString();

  const incident = {
    id: `WAF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: wafStats.lastIncidentTimestamp,
    ip,
    method: req.method,
    url: req.originalUrl || req.url,
    type,
    rule,
    sample: String(sample || '').slice(0, 160)
  };

  wafIncidents.unshift(incident);
  if (wafIncidents.length > WAF_INCIDENT_BUFFER_MAX) {
    wafIncidents.pop();
  }

  // Security alert log to console
  console.warn(`[WAF_SHIELD_BLOCK] ${incident.timestamp} | IP: ${incident.ip} | Type: ${incident.type} | Rule: ${incident.rule} | URL: ${incident.url}`);
}

function inspectStringForThreats(str, parentKey = '') {
  if (typeof str !== 'string') return null;
  if (EXCLUDED_PARAM_KEYS.has(parentKey.toLowerCase())) return null;

  // Check SQLi
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(str)) {
      return { type: 'sqli', rule: pattern.toString(), sample: str };
    }
  }

  // Check XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(str)) {
      return { type: 'xss', rule: pattern.toString(), sample: str };
    }
  }

  // Check RCE
  for (const pattern of RCE_PATTERNS) {
    if (pattern.test(str)) {
      return { type: 'rce', rule: pattern.toString(), sample: str };
    }
  }

  return null;
}

function deepInspectObject(obj, parentKey = '') {
  if (!obj || typeof obj !== 'object') return null;

  // Check prototype pollution
  if (Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
      Object.prototype.hasOwnProperty.call(obj, 'constructor')) {
    return { type: 'proto_pollution', rule: '__proto__ injection', sample: parentKey };
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'prototype') {
      return { type: 'proto_pollution', rule: 'prototype key injection', sample: key };
    }

    if (typeof val === 'string') {
      const threat = inspectStringForThreats(val, key);
      if (threat) return threat;
    } else if (typeof val === 'object' && val !== null) {
      const threat = deepInspectObject(val, key);
      if (threat) return threat;
    }
  }
  return null;
}

/**
 * Express WAF Middleware
 */
function wafMiddleware(req, res, next) {
  wafStats.totalRequestsInspected++;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

  // 1. Check Bad Bot / Scanner User-Agent
  const userAgent = req.headers['user-agent'] || '';
  for (const botRegex of BAD_USER_AGENTS) {
    if (botRegex.test(userAgent)) {
      logWafIncident(clientIp, 'bad_bot', botRegex.toString(), userAgent, req);
      return res.status(403).json({
        success: false,
        error: 'WAF_FORBIDDEN',
        message: 'Request blocked by Web Application Firewall (Hostile User-Agent Policy).'
      });
    }
  }

  // 2. Check Path Traversal & Sensitive File Probing in URL
  const rawUrl = req.originalUrl || req.url || '';
  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch (_) {}
  if (PATH_TRAVERSAL_REGEX.test(rawUrl) || PATH_TRAVERSAL_REGEX.test(decodedUrl)) {
    logWafIncident(clientIp, 'traversal', 'PATH_TRAVERSAL_REGEX', decodedUrl, req);
    return res.status(403).json({
      success: false,
      error: 'WAF_FORBIDDEN',
      message: 'Request blocked by Web Application Firewall (URI Inspection Policy).'
    });
  }

  // 3. Inspect Query Parameters
  if (req.query && typeof req.query === 'object') {
    const threat = deepInspectObject(req.query, 'query');
    if (threat) {
      logWafIncident(clientIp, threat.type, threat.rule, threat.sample, req);
      return res.status(403).json({
        success: false,
        error: 'WAF_FORBIDDEN',
        message: 'Request blocked by Web Application Firewall (Query String Policy).'
      });
    }
  }

  // 4. Inspect Request Body (if parsed)
  if (req.body && typeof req.body === 'object') {
    const threat = deepInspectObject(req.body, 'body');
    if (threat) {
      logWafIncident(clientIp, threat.type, threat.rule, threat.sample, req);
      return res.status(403).json({
        success: false,
        error: 'WAF_FORBIDDEN',
        message: 'Request blocked by Web Application Firewall (Payload Security Policy).'
      });
    }
  }

  // Attach WAF metrics reader to response headers for observability
  res.setHeader('X-WAF-Protection', 'RJ-Firewall/2.0-Active');
  next();
}

/**
 * WAF Telemetry API Handlers
 */
function getWafMetrics(req, res) {
  res.json({
    success: true,
    firewall: 'RJ Fashion Collection Enterprise WAF',
    status: 'ACTIVE',
    mode: 'BLOCKING',
    stats: wafStats,
    recentIncidents: wafIncidents.slice(0, 50)
  });
}

module.exports = {
  wafMiddleware,
  getWafMetrics,
  wafStats,
  wafIncidents
};
