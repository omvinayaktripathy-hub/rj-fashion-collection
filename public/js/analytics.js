/**
 * RJ FASHION COLLECTION - GOOGLE ANALYTICS (GA4) CONNECTOR
 * Replace window.GA_MEASUREMENT_ID with your Google Analytics ID (e.g., G-XXXXXXXXXX)
 */

(function () {
  'use strict';

  // Can be set globally or configured via data attribute
  const GA_ID = window.GA_MEASUREMENT_ID || 'G-RJFASHION26';

  // Do not track localhost test requests unless explicitly enabled
  if (window.location.hostname === 'localhost' && !window.ENABLE_LOCAL_ANALYTICS) {
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID, {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure'
  });
})();
