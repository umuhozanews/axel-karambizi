/**
 * Google Analytics 4 Integration Wrapper with Privacy Consent Support
 * Axel Karambizi Portfolio — Created by Gacondo Labs.
 */
(function () {
  'use strict';

  function getMeasurementId() {
    var meta = document.querySelector('meta[name="google-analytics-id"]');
    if (meta && meta.content && meta.content !== 'G-XXXXXXXXXX') {
      return meta.content.trim();
    }
    if (window.GA_MEASUREMENT_ID && window.GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      return window.GA_MEASUREMENT_ID.trim();
    }
    return null;
  }

  function hasAnalyticsConsent() {
    try {
      var item = localStorage.getItem('axel_cookie_consent');
      if (!item) return false;
      var parsed = JSON.parse(item);
      return parsed.analytics === true;
    } catch (e) {
      return false;
    }
  }

  var initialized = false;

  function loadGA4(id) {
    if (initialized) return;
    initialized = true;

    // Load gtag.js asynchronously
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', id, {
      anonymize_ip: true,
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }

  function checkAndInit() {
    var id = getMeasurementId();
    if (id && hasAnalyticsConsent()) {
      loadGA4(id);
    }
  }

  window.addEventListener('cookie_consent_updated', function (e) {
    if (e.detail && e.detail.analytics) {
      var id = getMeasurementId();
      if (id) loadGA4(id);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }
})();
