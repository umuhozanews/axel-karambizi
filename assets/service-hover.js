/**
 * Hover previews for the services list.
 * Framer leaves the follower element in the markup but the bundle that would fill
 * it in and track the pointer is disabled here, so the image strip, its geometry
 * and the pointer tracking are all rebuilt in this file.
 */
(function () {
  'use strict';

  var FOLLOWER = '.framer-1j656b0';
  var ROW = '.framer-1id3mzr';
  var STRIP = 'framer-1wtfhaz';

  // Each variant slides the strip up by one slot to expose that row's image.
  var VARIANTS = ['framer-v-15hp34x', 'framer-v-gj9knl', 'framer-v-eyovw6', 'framer-v-qcy7gm'];
  var SLOTS = ['framer-1ert66i', 'framer-ccvy4h', 'framer-1x2r26g', 'framer-48vyo6'];
  var IDLE_VARIANT = 'framer-v-1j656b0';

  var WIDTH = 195;
  var HEIGHT = 114;
  var ACCENT = 'var(--token-54672876-03f0-4dca-8fdb-32c421a5c4d1, #d0ff71)';
  var OFFSET_X = 20;
  var OFFSET_Y = 20;
  var TILT = 8;
  // Fraction of the remaining distance covered per frame at 60fps, so the card
  // trails the pointer instead of being pinned to it.
  var FOLLOW = 0.16;

  // Resolved from this script's own URL so nested pages load the right files.
  var BASE = (function () {
    var self = document.currentScript;
    return self ? self.src.replace(/[^/]+$/, '') : './assets/';
  })();

  var follower = document.querySelector(FOLLOWER);
  var rows = [].slice.call(document.querySelectorAll(ROW)).slice(0, SLOTS.length);
  if (!follower || !rows.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The stylesheet carrying these rules is not loaded in this replica, so the
  // follower's geometry is declared alongside the markup that depends on it.
  function addStyles() {
    var shown = VARIANTS.map(function (v) { return FOLLOWER + '.' + v; }).join(', ');
    var slots = SLOTS.map(function (s) { return FOLLOWER + ' .' + s; }).join(', ');
    var rules = [
      shown + ' { width: ' + WIDTH + 'px; height: ' + HEIGHT + 'px; overflow: hidden; }',
      FOLLOWER + ' .' + STRIP + ' { position: absolute; left: 50%; top: 0; z-index: 1;' +
        ' display: flex; flex-flow: column nowrap; align-items: center; justify-content: center;' +
        ' gap: 0; padding: 0; width: ' + WIDTH + 'px; height: min-content; }',
      slots + ' { position: relative; flex: 0 0 auto; width: ' + WIDTH + 'px; height: ' + HEIGHT + 'px; }'
    ];
    VARIANTS.forEach(function (variant, i) {
      rules.push(FOLLOWER + '.' + variant + ' .' + STRIP + ' { top: ' + -HEIGHT * i + 'px; }');
    });
    if (!reduced) {
      rules.push(ROW + ' h3, ' + ROW + ' h3 * { transition: color 0.2s ease; }');
    }

    var sheet = document.createElement('style');
    sheet.textContent = rules.join('\n');
    document.head.appendChild(sheet);
  }

  function buildStrip() {
    var strip = document.createElement('div');
    strip.className = STRIP;
    strip.setAttribute('data-framer-name', 'Image Wrap');
    strip.style.transform = 'translateX(-50%)';
    if (!reduced) strip.style.transition = 'top 0.45s cubic-bezier(0.22, 1, 0.36, 1)';

    rows.forEach(function (row, i) {
      var slot = document.createElement('div');
      slot.className = SLOTS[i];

      var wrap = document.createElement('div');
      wrap.setAttribute('data-framer-background-image-wrapper', 'true');
      wrap.style.cssText = 'position:absolute;border-radius:inherit;inset:0';

      var img = document.createElement('img');
      img.src = BASE + 'service-hover-' + (i + 1) + '.jpeg';
      img.alt = 'Service Hover Image - ' + (i + 1);
      img.decoding = 'async';
      img.style.cssText = 'display:block;width:100%;height:100%;border-radius:inherit;' +
        'object-position:center center;object-fit:cover';

      wrap.appendChild(img);
      slot.appendChild(wrap);
      strip.appendChild(slot);
    });
    return strip;
  }

  addStyles();
  follower.appendChild(buildStrip());
  follower.style.willChange = 'transform';
  if (!reduced) follower.style.transition = 'opacity 0.3s ease';

  // Set inline so it outranks the heading's own colour rule without !important.
  function paint(row, color) {
    var nodes = row.querySelectorAll('h3, h3 *');
    for (var i = 0; i < nodes.length; i++) nodes[i].style.color = color;
  }

  function setVariant(variant) {
    follower.classList.remove(IDLE_VARIANT);
    VARIANTS.forEach(function (v) { follower.classList.remove(v); });
    follower.classList.add(variant);
  }

  var active = -1;
  var targetX = 0;
  var targetY = 0;
  var x = 0;
  var y = 0;
  var visible = false;
  var raf = 0;
  var last = 0;

  function track(event) {
    targetX = event.clientX + OFFSET_X;
    targetY = event.clientY + OFFSET_Y;
  }

  function place() {
    follower.style.transform = 'translate(0%, -50%)' +
      ' translateX(' + x.toFixed(2) + 'px)' +
      ' translateY(' + y.toFixed(2) + 'px)' +
      ' rotate(' + TILT + 'deg)';
  }

  function frame(now) {
    var dt = last ? Math.min(now - last, 64) : 16.667;
    last = now;
    var k = reduced ? 1 : 1 - Math.pow(1 - FOLLOW, dt / 16.667);
    x += (targetX - x) * k;
    y += (targetY - y) * k;
    place();
    if (active >= 0) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      last = 0;
    }
  }

  function activate(i, event) {
    track(event);
    // Fade in at the pointer rather than sliding in from wherever it was left.
    if (!visible) {
      x = targetX;
      y = targetY;
      visible = true;
      place();
    }
    active = i;
    setVariant(VARIANTS[i]);
    follower.style.backgroundColor = 'transparent';
    follower.style.borderRadius = '10px';
    follower.style.opacity = '1';
    paint(rows[i], ACCENT);
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function deactivate(i) {
    paint(rows[i], '');
    if (active !== i) return;
    active = -1;
    visible = false;
    follower.style.opacity = '0';
  }

  document.addEventListener('mousemove', track, { passive: true });

  rows.forEach(function (row, i) {
    row.addEventListener('mouseenter', function (event) { activate(i, event); });
    row.addEventListener('mouseleave', function () { deactivate(i); });
  });
})();
