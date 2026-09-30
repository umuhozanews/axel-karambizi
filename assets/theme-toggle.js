/**
 * Light/dark switch at the foot of the page.
 * The palette is a set of design tokens inherited from <body>; switching themes
 * overrides the ones that differ and slides the knob across.
 */
(function () {
  'use strict';

  var CONTAINER = '.framer-1978dwj-container';

  // Framer's variant names read backwards here: the "Light" variant is the one
  // that paints the dark palette.
  var DARK = { variant: 'framer-v-ts09mz', name: 'Light', knob: '3px' };
  var LIGHT = { variant: 'framer-v-10g3uoh', name: 'Dark', knob: '23px' };

  // Twelve of the sixteen palette tokens differ between the two themes.
  var LIGHT_TOKENS = {
    '--token-1e4a4a22-afd8-42f6-ae69-95001aaf48ae': '#8f8f8f',
    '--token-37ca97ef-81c7-4731-ba05-2bafe1f2a4f5': '#000',
    '--token-4795dafb-4261-43d3-aa0c-b3831681376e': '#fff',
    '--token-54672876-03f0-4dca-8fdb-32c421a5c4d1': '#5e67e6',
    '--token-621c2752-e263-492f-8440-f4105a55d3f1': '#dadada',
    '--token-7d1fd828-621c-47fc-b270-6f2c2fff9ca2': '#8f8f8f',
    '--token-861b2ae9-dee3-4143-a255-6faa9a39d943': '#fff',
    '--token-a228d207-519c-4c30-ace3-fe8c17413ec0': '#dadada',
    '--token-a3859f8f-41d4-4be1-a56e-27b66efaa3e1': '#fff0',
    '--token-a9f688eb-778b-4a71-929e-ebf8a014b4cf': '#303030',
    '--token-cb6b9558-1df0-4f97-98cb-2fe80cc3b90c': '#f5f5f5',
    '--token-dd08076e-6859-4f97-84b7-c05dcc1e773f': '#ffffffe6'
  };

  var container = document.querySelector(CONTAINER);
  var root = container && container.firstElementChild;
  var control = container && container.querySelector('[data-framer-name="Switch"]');
  var knob = container && container.querySelector('[data-framer-name="Knob"]');
  if (!root || !control || !knob) return;

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    knob.style.transition = 'left 0.25s ease';
  }

  var light = false;

  function apply() {
    var state = light ? LIGHT : DARK;

    root.classList.remove(DARK.variant, LIGHT.variant);
    root.classList.add(state.variant);
    root.setAttribute('data-framer-name', state.name);

    // Pinned inline because the two variants anchor the knob to opposite edges,
    // which cannot be transitioned.
    knob.style.right = 'unset';
    knob.style.left = state.knob;

    Object.keys(LIGHT_TOKENS).forEach(function (token) {
      if (light) document.body.style.setProperty(token, LIGHT_TOKENS[token]);
      else document.body.style.removeProperty(token);
    });

    control.setAttribute('aria-checked', String(light));
  }

  function toggle() {
    light = !light;
    apply();
  }

  control.setAttribute('role', 'switch');
  control.setAttribute('aria-label', 'Toggle light and dark mode');
  apply();

  control.addEventListener('click', toggle);
  control.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      toggle();
    }
  });
})();
