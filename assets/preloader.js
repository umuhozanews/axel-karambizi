/**
 * Axel Karambizi — decrypt-style preloader.
 *
 * Covers the page on the first view of a session and scrambles "AXEL KARAMBIZI"
 * into place one letter at a time before fading out. Everything is injected from
 * here, so if this script never runs the visitor simply gets the page with no
 * cover rather than a screen they cannot dismiss.
 */
(function () {
  'use strict';

  var TEXT = 'AXEL KARAMBIZI';
  // scramble using only the name's own letters: every cell is sized to its
  // final glyph, so borrowing from a wider alphabet makes the cipher spill
  // over its neighbours
  var CIPHER = 'AXELKRMBIZ';
  // Tuned slow on purpose so the decrypt is readable rather than a flicker.
  // Total cover time is roughly TICK * FRAMES_PER_LETTER * 13 + HOLD + FADE.
  var TICK = 55;            // ms between scramble frames
  var FRAMES_PER_LETTER = 4; // how long the reveal front takes to cross a letter
  var HOLD = 650;           // ms the finished name holds before the fade
  var FADE = 600;           // ms cover fade-out
  var SAFETY = 9000;        // hard ceiling: uncover no matter what
  var KEY = 'axel-preloader-seen';

  var root = document.documentElement;

  function seen() {
    try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }

  function remember() {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* private mode */ }
  }

  if (seen()) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hide the page before first paint so the cover never flashes in over content.
  var style = document.createElement('style');
  style.textContent = [
    'html.axel-preloading, html.axel-preloading body { overflow: hidden !important; }',
    // paint the cover colour on the root too, so the gap between this rule
    // landing and the overlay being appended is brand dark and not white
    'html.axel-preloading { background: #14140f !important; }',
    'html.axel-preloading body > *:not(#axel-preloader) { visibility: hidden !important; }',
    '#axel-preloader {',
    '  position: fixed; inset: 0; z-index: 2147483647;',
    '  display: flex; align-items: center; justify-content: center;',
    '  background: #14140f;',
    '  opacity: 1; transition: opacity ' + FADE + 'ms ease;',
    '}',
    '#axel-preloader.is-leaving { opacity: 0; }',
    '#axel-preloader .axel-preloader-name {',
    '  font-family: Antonio, "Antonio Placeholder", sans-serif;',
    '  font-weight: 700; text-transform: uppercase;',
    '  font-size: clamp(2.1rem, 11vw, 7rem); line-height: 1;',
    '  letter-spacing: -0.02em; color: #dadada;',
    '  white-space: nowrap; display: flex;',
    '}',
    // each cell is sized by an invisible copy of its final letter and the
    // live glyph is overlaid, so cycling through cipher characters of
    // different widths never shifts the name around
    '#axel-preloader .axel-preloader-name .cell { position: relative; display: inline-block; }',
    '#axel-preloader .axel-preloader-name .sizer,',
    '#axel-preloader .axel-preloader-name .glyph { font-style: normal; }',
    '#axel-preloader .axel-preloader-name .sizer { visibility: hidden; }',
    '#axel-preloader .axel-preloader-name .glyph {',
    '  position: absolute; left: 50%; top: 0; transform: translateX(-50%);',
    '}',
    // a resolved letter always sits above the surrounding cipher noise
    '#axel-preloader .axel-preloader-name .cell:not(.is-cipher) { z-index: 1; }',
    '#axel-preloader .axel-preloader-name .cell.is-cipher .glyph { opacity: 0.45; }',
    '#axel-preloader .axel-preloader-name .space { display: inline-block; width: 0.34em; }',
  ].join('\n');
  (document.head || root).appendChild(style);
  root.classList.add('axel-preloading');

  var done = false;

  function uncover() {
    if (done) return;
    done = true;
    remember();
    var cover = document.getElementById('axel-preloader');
    if (!cover) { root.classList.remove('axel-preloading'); return; }
    cover.classList.add('is-leaving');
    setTimeout(function () {
      root.classList.remove('axel-preloading');
      if (cover.parentNode) cover.parentNode.removeChild(cover);
    }, FADE);
  }

  // Registered before anything else can throw, so the page always comes back.
  setTimeout(uncover, SAFETY);

  function build() {
    try {
      var cover = document.createElement('div');
      cover.id = 'axel-preloader';
      cover.setAttribute('role', 'status');
      cover.setAttribute('aria-live', 'polite');

      var name = document.createElement('div');
      name.className = 'axel-preloader-name';
      name.setAttribute('aria-label', TEXT);

      var letters = [];
      for (var i = 0; i < TEXT.length; i++) {
        if (TEXT[i] === ' ') {
          var gap = document.createElement('span');
          gap.className = 'space';
          gap.setAttribute('aria-hidden', 'true');
          name.appendChild(gap);
          continue;
        }
        var cell = document.createElement('span');
        cell.className = reduced ? 'cell' : 'cell is-cipher';
        cell.setAttribute('aria-hidden', 'true');

        var sizer = document.createElement('i');
        sizer.className = 'sizer';
        sizer.textContent = TEXT[i];

        var glyph = document.createElement('i');
        glyph.className = 'glyph';
        glyph.textContent = reduced ? TEXT[i] : CIPHER[(Math.random() * CIPHER.length) | 0];

        cell.appendChild(sizer);
        cell.appendChild(glyph);
        name.appendChild(cell);
        letters.push({ cell: cell, glyph: glyph, ch: TEXT[i] });
      }

      cover.appendChild(name);
      document.body.appendChild(cover);

      if (reduced) {
        setTimeout(uncover, HOLD);
        return;
      }

      var frame = 0;
      var timer = setInterval(function () {
        frame++;
        var settled = Math.floor(frame / FRAMES_PER_LETTER);
        for (var k = 0; k < letters.length; k++) {
          if (k < settled) {
            if (letters[k].glyph.textContent !== letters[k].ch) {
              letters[k].glyph.textContent = letters[k].ch;
              letters[k].cell.classList.remove('is-cipher');
            }
          } else {
            letters[k].glyph.textContent = CIPHER[(Math.random() * CIPHER.length) | 0];
          }
        }
        if (settled >= letters.length) {
          clearInterval(timer);
          setTimeout(uncover, HOLD);
        }
      }, TICK);
    } catch (e) {
      uncover();
    }
  }

  // <body> exists as soon as its start tag is parsed, long before
  // DOMContentLoaded fires on these large pages, so poll per frame rather than
  // leaving the visitor on a blank cover while the rest of the HTML streams in.
  (function mount() {
    if (document.body) build();
    else requestAnimationFrame(mount);
  })();
})();
