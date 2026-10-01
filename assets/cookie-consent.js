/**
 * Axel Karambizi Portfolio — Professional Cookie & Privacy Consent
 * Created by Gacondo Labs.
 * Wide, elegant layout, no emojis, full light & dark theme responsiveness.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'axel_cookie_consent';

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

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ||
           document.body.getAttribute('data-theme') === 'light' ||
           document.body.classList.contains('theme-light');
  }

  function injectStyles() {
    if (document.getElementById('axel-cookie-styles')) return;
    var style = document.createElement('style');
    style.id = 'axel-cookie-styles';
    style.textContent = `
      :root {
        --acb-bg: rgba(18, 19, 25, 0.96);
        --acb-text: #f3f1ec;
        --acb-muted: #9c9a92;
        --acb-border: rgba(255, 255, 255, 0.12);
        --acb-card-bg: rgba(255, 255, 255, 0.04);
        --acb-card-border: rgba(255, 255, 255, 0.08);
        --acb-btn-sec-bg: rgba(255, 255, 255, 0.08);
        --acb-btn-sec-text: #f3f1ec;
        --acb-btn-sec-border: rgba(255, 255, 255, 0.16);
        --acb-btn-sec-hover: rgba(255, 255, 255, 0.14);
        --acb-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
        --acb-accent: #5e67e6;
        --acb-accent-hover: #6e77f0;
        --acb-badge-bg: rgba(94, 103, 230, 0.15);
        --acb-badge-border: rgba(94, 103, 230, 0.35);
        --acb-badge-text: #8b95f6;
      }

      [data-theme="light"], .theme-light {
        --acb-bg: rgba(255, 255, 255, 0.97);
        --acb-text: #141412;
        --acb-muted: #62605b;
        --acb-border: rgba(0, 0, 0, 0.12);
        --acb-card-bg: rgba(0, 0, 0, 0.03);
        --acb-card-border: rgba(0, 0, 0, 0.08);
        --acb-btn-sec-bg: rgba(0, 0, 0, 0.05);
        --acb-btn-sec-text: #141412;
        --acb-btn-sec-border: rgba(0, 0, 0, 0.14);
        --acb-btn-sec-hover: rgba(0, 0, 0, 0.1);
        --acb-shadow: 0 24px 60px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06);
        --acb-badge-bg: rgba(94, 103, 230, 0.1);
        --acb-badge-border: rgba(94, 103, 230, 0.25);
        --acb-badge-text: #4f59df;
      }

      #axel-cookie-banner {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(40px);
        max-width: 860px;
        width: calc(100% - 40px);
        background: var(--acb-bg);
        color: var(--acb-text);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid var(--acb-border);
        border-radius: 24px;
        padding: 26px 32px;
        box-shadow: var(--acb-shadow);
        z-index: 999999;
        opacity: 0;
        visibility: hidden;
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, visibility 0.3s, background 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        box-sizing: border-box;
      }

      #axel-cookie-banner.is-visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .acb-inner {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .acb-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .acb-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .acb-icon-shield {
        width: 22px;
        height: 22px;
        color: var(--acb-accent);
        flex-shrink: 0;
      }

      .acb-title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin: 0;
        color: var(--acb-text);
      }

      .acb-badge {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 4px 10px;
        border-radius: 99px;
        background: var(--acb-badge-bg);
        border: 1px solid var(--acb-badge-border);
        color: var(--acb-badge-text);
      }

      .acb-desc {
        font-size: 14.5px;
        line-height: 1.6;
        color: var(--acb-muted);
        margin: 0;
      }

      .acb-details-box {
        display: none;
        background: var(--acb-card-bg);
        border: 1px solid var(--acb-card-border);
        border-radius: 14px;
        padding: 16px 20px;
        margin-top: 4px;
        animation: acbFadeIn 0.25s ease;
      }

      @keyframes acbFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .acb-details-box.is-open {
        display: block;
      }

      .acb-cat-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding: 10px 0;
        border-bottom: 1px solid var(--acb-card-border);
      }

      .acb-cat-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .acb-cat-item:first-child {
        padding-top: 0;
      }

      .acb-cat-info h4 {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--acb-text);
        margin: 0 0 3px 0;
      }

      .acb-cat-info p {
        font-size: 12.5px;
        color: var(--acb-muted);
        line-height: 1.5;
        margin: 0;
      }

      .acb-cat-status {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 3px 8px;
        border-radius: 6px;
        background: var(--acb-card-bg);
        color: var(--acb-muted);
        border: 1px solid var(--acb-card-border);
        flex-shrink: 0;
      }

      .acb-cat-status.is-required {
        color: var(--acb-accent);
        border-color: var(--acb-badge-border);
      }

      .acb-bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-top: 4px;
        flex-wrap: wrap;
      }

      .acb-toggle-link {
        background: none;
        border: none;
        color: var(--acb-muted);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        padding: 6px 0;
        text-decoration: underline;
        transition: color 0.2s ease;
      }

      .acb-toggle-link:hover {
        color: var(--acb-text);
      }

      .acb-btn-group {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .acb-btn {
        padding: 11px 24px;
        border-radius: 99px;
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
      }

      .acb-btn-primary {
        background: var(--acb-accent);
        color: #ffffff;
      }

      .acb-btn-primary:hover {
        background: var(--acb-accent-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(94, 103, 230, 0.45);
      }

      .acb-btn-secondary {
        background: var(--acb-btn-sec-bg);
        color: var(--acb-btn-sec-text);
        border: 1px solid var(--acb-btn-sec-border);
      }

      .acb-btn-secondary:hover {
        background: var(--acb-btn-sec-hover);
        transform: translateY(-1px);
      }

      @media (max-width: 680px) {
        #axel-cookie-banner {
          bottom: 12px;
          left: 12px;
          right: 12px;
          width: calc(100% - 24px);
          max-width: none;
          transform: translateY(30px);
          padding: 20px 20px;
          border-radius: 18px;
        }
        #axel-cookie-banner.is-visible {
          transform: translateY(0);
        }
        .acb-bottom-row {
          flex-direction: column-reverse;
          align-items: stretch;
          gap: 12px;
        }
        .acb-btn-group {
          flex-direction: column;
          width: 100%;
        }
        .acb-btn {
          width: 100%;
          padding: 12px 18px;
        }
        .acb-toggle-link {
          text-align: center;
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
    banner.setAttribute('aria-label', 'Privacy and Cookie Consent');

    banner.innerHTML = `
      <div class="acb-inner">
        <div class="acb-top-row">
          <div class="acb-title-group">
            <svg class="acb-icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h3 class="acb-title">Privacy & Cookies</h3>
          </div>
          <span class="acb-badge">Consent Preferences</span>
        </div>

        <p class="acb-desc">
          We respect your privacy. This site uses essential cookies to remember your system theme preferences, and optional performance analytics to measure speed and reader engagement.
        </p>

        <div id="acb-details-box" class="acb-details-box">
          <div class="acb-cat-item">
            <div class="acb-cat-info">
              <h4>Strictly Necessary</h4>
              <p>Essential for basic functionality, page routing, and dark/light mode preference persistence.</p>
            </div>
            <span class="acb-cat-status is-required">Always Active</span>
          </div>
          <div class="acb-cat-item">
            <div class="acb-cat-info">
              <h4>Analytics & Performance</h4>
              <p>Anonymous visitor metrics to understand content reading time, device viewports, and navigation speed.</p>
            </div>
            <span class="acb-cat-status">Optional</span>
          </div>
        </div>

        <div class="acb-bottom-row">
          <button type="button" class="acb-toggle-link" id="acb-toggle-details">View Details</button>
          <div class="acb-btn-group">
            <button type="button" class="acb-btn acb-btn-secondary" id="acb-necessary-only">Necessary Only</button>
            <button type="button" class="acb-btn acb-btn-primary" id="acb-accept-all">Accept All</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in after tiny delay
    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 450);

    var detailsBox = document.getElementById('acb-details-box');
    var toggleBtn = document.getElementById('acb-toggle-details');
    var acceptAllBtn = document.getElementById('acb-accept-all');
    var necOnlyBtn = document.getElementById('acb-necessary-only');

    toggleBtn.addEventListener('click', function () {
      var isOpen = detailsBox.classList.contains('is-open');
      if (isOpen) {
        detailsBox.classList.remove('is-open');
        toggleBtn.textContent = 'View Details';
      } else {
        detailsBox.classList.add('is-open');
        toggleBtn.textContent = 'Hide Details';
      }
    });

    acceptAllBtn.addEventListener('click', function () {
      setConsent('all');
      closeBanner();
    });

    necOnlyBtn.addEventListener('click', function () {
      setConsent('necessary');
      closeBanner();
    });

    function closeBanner() {
      banner.classList.remove('is-visible');
      setTimeout(function () {
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
      }, 400);
    }
  }

  // Public method to reopen preferences from footer
  window.openCookiePreferences = function () {
    var existing = document.getElementById('axel-cookie-banner');
    if (existing) {
      existing.classList.add('is-visible');
      var details = document.getElementById('acb-details-box');
      if (details) details.classList.add('is-open');
      var btn = document.getElementById('acb-toggle-details');
      if (btn) btn.textContent = 'Hide Details';
      return;
    }
    renderBanner();
    setTimeout(function () {
      var details = document.getElementById('acb-details-box');
      if (details) details.classList.add('is-open');
      var btn = document.getElementById('acb-toggle-details');
      if (btn) btn.textContent = 'Hide Details';
    }, 500);
  };

  function init() {
    var consent = getConsent();
    if (!consent) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderBanner);
      } else {
        renderBanner();
      }
    }
  }

  init();
})();
