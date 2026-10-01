/**
 * Axel Karambizi Portfolio — Professional Cookie Consent & Privacy Banner
 * Created by Gacondo Labs.
 * GDPR/ePrivacy compliant, accessible, responsive, with dark/light mode integration.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'axel_cookie_consent';

  // Check if consent has already been recorded
  function getConsent() {
    try {
      var item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  function setConsent(choice) {
    try {
      var record = {
        necessary: true,
        analytics: choice === 'all' || choice.analytics === true,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: record }));
    } catch (e) {
      console.warn('Unable to persist cookie consent to localStorage', e);
    }
  }

  function injectStyles() {
    if (document.getElementById('axel-cookie-styles')) return;
    var style = document.createElement('style');
    style.id = 'axel-cookie-styles';
    style.textContent = `
      #axel-cookie-banner {
        position: fixed;
        bottom: 24px;
        right: 24px;
        max-width: 440px;
        width: calc(100% - 48px);
        background: rgba(18, 19, 26, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        padding: 22px 24px;
        color: #f3f1ec;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05);
        z-index: 999999;
        transform: translateY(30px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease, visibility 0.4s;
        line-height: 1.5;
        box-sizing: border-box;
      }
      #axel-cookie-banner.is-visible {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }
      .acb-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .acb-icon {
        font-size: 20px;
        line-height: 1;
      }
      .acb-title {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: #fff;
        margin: 0;
      }
      .acb-desc {
        font-size: 13px;
        color: #b0afab;
        margin: 0 0 18px 0;
        line-height: 1.55;
      }
      .acb-desc a {
        color: #8b95f6;
        text-decoration: underline;
        cursor: pointer;
      }
      .acb-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .acb-btn {
        flex: 1;
        min-width: 120px;
        padding: 10px 16px;
        border-radius: 99px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        outline: none;
        transition: all 0.2s ease;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .acb-btn-primary {
        background: #5e67e6;
        color: #ffffff;
      }
      .acb-btn-primary:hover {
        background: #6e77f0;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(94, 103, 230, 0.4);
      }
      .acb-btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #e4e3df;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .acb-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
      }
      .acb-custom-toggle {
        width: 100%;
        text-align: center;
        margin-top: 10px;
        font-size: 12px;
        color: #8a8880;
        cursor: pointer;
        background: none;
        border: none;
        padding: 4px;
        transition: color 0.2s ease;
      }
      .acb-custom-toggle:hover {
        color: #d1cfc7;
        text-decoration: underline;
      }
      .acb-details {
        display: none;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 12px;
      }
      .acb-details.is-open {
        display: block;
      }
      .acb-category {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        color: #d1cfc7;
      }
      .acb-category strong {
        color: #fff;
      }
      .acb-category span {
        font-size: 11px;
        color: #8a8880;
      }
      @media (max-width: 600px) {
        #axel-cookie-banner {
          bottom: 12px;
          right: 12px;
          left: 12px;
          width: calc(100% - 24px);
          max-width: none;
          padding: 18px 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderBanner() {
    if (document.getElementById('axel-cookie-banner')) return;
    injectStyles();

    var banner = document.createElement('div');
    banner.id = 'axel-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie Consent Preferences');

    banner.innerHTML = `
      <div class="acb-header">
        <span class="acb-icon">🍪</span>
        <h3 class="acb-title">Cookie Preferences</h3>
      </div>
      <p class="acb-desc">
        We use essential cookies to maintain system theme settings and optional performance analytics to improve your experience.
      </p>
      <div id="acb-details-box" class="acb-details">
        <div class="acb-category">
          <span><strong>Necessary:</strong> Session & dark/light theme tokens</span>
          <span>Required</span>
        </div>
        <div class="acb-category">
          <span><strong>Analytics:</strong> Aggregated anonymous site statistics</span>
          <span>Optional</span>
        </div>
      </div>
      <div class="acb-actions">
        <button type="button" class="acb-btn acb-btn-primary" id="acb-accept-all">Accept All</button>
        <button type="button" class="acb-btn acb-btn-secondary" id="acb-necessary-only">Necessary Only</button>
      </div>
      <button type="button" class="acb-custom-toggle" id="acb-toggle-details">View Cookie Details</button>
    `;

    document.body.appendChild(banner);

    // Fade in
    requestAnimationFrame(function () {
      setTimeout(function () {
        banner.classList.add('is-visible');
      }, 300);
    });

    // Button event listeners
    document.getElementById('acb-accept-all').addEventListener('click', function () {
      setConsent('all');
      closeBanner();
    });

    document.getElementById('acb-necessary-only').addEventListener('click', function () {
      setConsent('necessary');
      closeBanner();
    });

    document.getElementById('acb-toggle-details').addEventListener('click', function () {
      var details = document.getElementById('acb-details-box');
      var isOpen = details.classList.toggle('is-open');
      this.textContent = isOpen ? 'Hide Cookie Details' : 'View Cookie Details';
    });
  }

  function closeBanner() {
    var banner = document.getElementById('axel-cookie-banner');
    if (!banner) return;
    banner.classList.remove('is-visible');
    setTimeout(function () {
      if (banner && banner.parentElement) {
        banner.parentElement.removeChild(banner);
      }
    }, 450);
  }

  // Allow reopening cookie banner from footer
  window.openCookiePreferences = function () {
    renderBanner();
  };

  // Auto initialize if consent not yet granted
  function init() {
    var consent = getConsent();
    if (!consent) {
      renderBanner();
    } else {
      window.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: consent }));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
