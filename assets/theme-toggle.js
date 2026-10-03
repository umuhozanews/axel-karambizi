/**
 * Axel Karambizi Portfolio — Theme Toggle Controller (Dark / Light Mode)
 * Permanently visible, floating at bottom-center across all devices and viewports.
 * Synchronizes palette tokens, transitions switch knob, and persists preference.
 */
(function () {
  'use strict';

  var CONTAINER_SELECTOR = '.framer-1978dwj-container';

  var DARK = { variant: 'framer-v-ts09mz', name: 'Light', knob: '3px' };
  var LIGHT = { variant: 'framer-v-10g3uoh', name: 'Dark', knob: '23px' };

  var LIGHT_TOKENS = {
    '--token-1e4a4a22-afd8-42f6-ae69-95001aaf48ae': '#8f8f8f',
    '--token-37ca97ef-81c7-4731-ba05-2bafe1f2a4f5': '#000000',
    '--token-4795dafb-4261-43d3-aa0c-b3831681376e': '#ffffff',
    '--token-54672876-03f0-4dca-8fdb-32c421a5c4d1': '#5e67e6',
    '--token-621c2752-e263-492f-8440-f4105a55d3f1': '#dadada',
    '--token-7d1fd828-621c-47fc-b270-6f2c2fff9ca2': '#8f8f8f',
    '--token-861b2ae9-dee3-4143-a255-6faa9a39d943': '#ffffff',
    '--token-a228d207-519c-4c30-ace3-fe8c17413ec0': '#dadada',
    '--token-a3859f8f-41d4-4be1-a56e-27b66efaa3e1': 'rgba(255, 255, 255, 0)',
    '--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf': '#303030',
    '--token-cb6b9558-1df0-4f97-98cb-2fe80cc3b90c': '#f5f5f5',
    '--token-dd08076e-6859-4f97-84b7-c05dcc1e773f': 'rgba(255, 255, 255, 0.9)'
  };

  var DARK_TOKENS = {
    '--token-1e4a4a22-afd8-42f6-ae69-95001aaf48ae': '#8f8f8f',
    '--token-37ca97ef-81c7-4731-ba05-2bafe1f2a4f5': '#ffffff',
    '--token-4795dafb-4261-43d3-aa0c-b3831681376e': '#14140f',
    '--token-54672876-03f0-4dca-8fdb-32c421a5c4d1': '#6a71df',
    '--token-621c2752-e263-492f-8440-f4105a55d3f1': '#2b2b2b',
    '--token-7d1fd828-621c-47fc-b270-6f2c2fff9ca2': '#8f8f8f',
    '--token-861b2ae9-dee3-4143-a255-6faa9a39d943': '#14140f',
    '--token-a228d207-519c-4c30-ace3-fe8c17413ec0': '#262626',
    '--token-a3859f8f-41d4-4be1-a56e-27b66efaa3e1': 'rgba(20, 20, 15, 0)',
    '--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf': '#dadada',
    '--token-cb6b9558-1df0-4f97-98cb-2fe80cc3b90c': '#1c1c16',
    '--token-dd08076e-6859-4f97-84b7-c05dcc1e773f': 'rgba(20, 20, 15, 0.9)'
  };

  var isLight = false;
  try {
    var saved = localStorage.getItem('site_theme');
    if (saved === 'light') {
      isLight = true;
    } else if (saved === 'dark') {
      isLight = false;
    }
  } catch (e) {}

  function ensureFloatingSwitch() {
    var containers = document.querySelectorAll(CONTAINER_SELECTOR);
    if (!containers.length) {
      var div = document.createElement('div');
      div.className = 'framer-1978dwj-container';
      div.innerHTML = [
        '<div class="framer-fidmwm framer-Yj9la framer-1t0b5g1 framer-v-ts09mz" data-framer-name="Light" style="width:100%">',
        '  <div class="framer-1ls9u1z-container">',
        '    <div class="framer-5y8r2q" data-framer-name="Switch" role="switch" aria-label="Toggle light and dark mode" tabindex="0">',
        '      <div class="framer-6w89s2" data-framer-name="Knob"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');
      document.body.appendChild(div);
    }
  }

  function applyTheme() {
    var state = isLight ? LIGHT : DARK;
    var activeTokens = isLight ? LIGHT_TOKENS : DARK_TOKENS;

    // Apply tokens to body and :root
    Object.keys(activeTokens).forEach(function (token) {
      document.body.style.setProperty(token, activeTokens[token]);
      document.documentElement.style.setProperty(token, activeTokens[token]);
    });

    var themeName = isLight ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);

    if (isLight) {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }

    // Update all switch instances
    var containers = document.querySelectorAll(CONTAINER_SELECTOR);
    containers.forEach(function (cnt) {
      var root = cnt.querySelector('.framer-fidmwm') || cnt.firstElementChild;
      var control = cnt.querySelector('[data-framer-name="Switch"], .framer-5y8r2q');
      var knob = cnt.querySelector('[data-framer-name="Knob"], .framer-6w89s2');

      if (root) {
        root.classList.remove(DARK.variant, LIGHT.variant);
        root.classList.add(state.variant);
        root.setAttribute('data-framer-name', state.name);
      }

      if (knob) {
        knob.style.right = 'unset';
        knob.style.left = state.knob;
        knob.style.transition = 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      }

      if (control) {
        control.setAttribute('aria-checked', String(isLight));
        control.setAttribute('role', 'switch');
        control.setAttribute('aria-label', 'Toggle light and dark mode');
        control.setAttribute('tabindex', '0');
      }
    });

    try {
      localStorage.setItem('site_theme', themeName);
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('theme_changed', { detail: { theme: themeName } }));
  }

  function toggleTheme() {
    isLight = !isLight;
    applyTheme();
  }

  function init() {
    ensureFloatingSwitch();
    applyTheme();

    // Document-level event delegation catches clicks on any switch anywhere
    document.addEventListener('click', function (e) {
      var switchEl = e.target.closest('[data-framer-name="Switch"], .framer-fidmwm, .framer-5y8r2q, .framer-1978dwj-container');
      if (switchEl) {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        var switchEl = e.target.closest('[data-framer-name="Switch"], .framer-fidmwm, .framer-5y8r2q');
        if (switchEl) {
          e.preventDefault();
          e.stopPropagation();
          toggleTheme();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
