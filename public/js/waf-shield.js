/**
 * RJ FASHION COLLECTION — Client-Side Web Application Firewall (WAF) Shield
 * Active Client-Side Runtime Defense:
 * - DOM XSS & URI Parameter Sanitization
 * - Frame Busting / Clickjacking Defense
 * - Form Input Malicious Pattern Neutralizer
 * - Real-Time Integrity Shield
 */

(function () {
  'use strict';

  // 1. Frame-Busting / Anti-Clickjacking Defense
  try {
    if (window.top !== window.self) {
      const allowedHosts = [
        'rj-fashion-collection.web.app',
        'rj-fashion-collection.firebaseapp.com',
        'localhost',
        '127.0.0.1'
      ];
      let isAllowedAncestor = false;
      try {
        const topHost = window.top.location.hostname;
        isAllowedAncestor = allowedHosts.some(h => topHost === h || topHost.endsWith('.' + h));
      } catch (_) {
        // Cross-origin framing access denied -> hostile iframe!
        isAllowedAncestor = false;
      }

      if (!isAllowedAncestor) {
        window.top.location = window.self.location.href;
      }
    }
  } catch (_) {}

  // 2. Client-Side Malicious URI Payload Sanitizer
  const DANGEROUS_URI_PATTERNS = [
    /<script\b/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /\bunion\s+select\b/i,
    /\.\.[/\\]/
  ];

  function sanitizeUriParameters() {
    try {
      const search = window.location.search;
      if (!search) return;

      const params = new URLSearchParams(search);
      let wasModified = false;

      for (const [key, value] of params.entries()) {
        for (const pattern of DANGEROUS_URI_PATTERNS) {
          if (pattern.test(value) || pattern.test(key)) {
            console.warn('[WAF_CLIENT_SHIELD] Malicious URI parameter neutralized:', key);
            params.delete(key);
            wasModified = true;
            break;
          }
        }
      }

      if (wasModified) {
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState(null, '', newUrl);
      }
    } catch (_) {}
  }

  sanitizeUriParameters();

  // 3. Client-Side Input Sanitizer for Forms
  document.addEventListener('submit', function (e) {
    try {
      const form = e.target;
      if (!form || !form.elements) return;

      for (let i = 0; i < form.elements.length; i++) {
        const el = form.elements[i];
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          // Never tamper with password fields
          if (el.type === 'password') continue;

          const val = el.value || '';
          // Strip inline executable script tags if pasted
          if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val)) {
            el.value = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
            console.warn('[WAF_CLIENT_SHIELD] Neutralized malicious script payload from input:', el.name || el.id);
          }
        }
      }
    } catch (_) {}
  }, true);

  // 4. Expose WAF Telemetry API on Window
  window.RJ_WAF_SHIELD = Object.freeze({
    active: true,
    version: '2.0.0',
    mode: 'STRICT_BLOCK',
    protection: ['DOM_XSS', 'CLICKJACKING', 'SQLI_NEUTRALIZE', 'URI_SANITIZER']
  });

})();
