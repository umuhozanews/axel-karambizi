/**
 * Axel Karambizi — word-by-word reveal for the "About me" block.
 *
 * Each word fades up from a low opacity and a soft blur while the block
 * straightens out of a slight rotation. The block sits above the fold on
 * /about/, so the reveal is triggered when it enters the viewport rather than
 * scrubbed against scroll position, which would leave it already resolved by
 * the time the page finishes loading.
 *
 * Words are wrapped at runtime so the admin sync can keep rewriting the copy.
 */
(function () {
  'use strict';

  // the heading, the name and the two paragraphs of the About me block
  var BLOCKS = ['.framer-ixi9fg', '.framer-d5arnx', '.framer-k1r16h', '.framer-1137aoi'];
  var TEXT_NODES = 'h1, h2, h3, h4, p';

  var BASE_OPACITY = 0.1;
  var BASE_ROTATION = 3;   // deg, straightens to 0
  var BLUR = 4;            // px, clears to 0
  // Deliberately unhurried: the blur and the lift should be readable.
  var WORD_MS = 1800;      // how long one word takes to resolve
  var STAGGER = 160;       // ms between consecutive words
  var MAX_STAGGER = 4200;  // cap so long paragraphs do not crawl

  function isPainted(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function wrapWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var texts = [];
    var node;
    while ((node = walker.nextNode())) if (node.nodeValue.trim()) texts.push(node);

    var words = [];
    texts.forEach(function (text) {
      var frag = document.createDocumentFragment();
      // keep the separators so wrapping and pre-wrap behaviour are unchanged
      // Keep the trailing space inside the span. A space sitting between two
      // filtered/inline-block words is dropped and "About me" becomes ABOUTME.
      var chunks = text.nodeValue.match(/\S+\s*/g) || [text.nodeValue];
      chunks.forEach(function (part) {
        var span = document.createElement('span');
        span.className = 'sr-word';
        span.textContent = part;
        frag.appendChild(span);
        words.push(span);
      });
      text.parentNode.replaceChild(frag, text);
    });
    return words;
  }

  // True once the block has risen into the viewport, and it stays true after
  // the block has scrolled off the top: a jump scroll or an anchor link can
  // skip clean over a block, which must not leave it stuck in its base state.
  function inView(el) {
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * 0.92;
  }

  function init() {
    var targets = [];
    BLOCKS.forEach(function (sel) {
      // /about/ ships one copy of the block per breakpoint variant — only
      // wrap the painted copy so hidden variants cannot leak overlapping text
      [].forEach.call(document.querySelectorAll(sel), function (block) {
        if (!isPainted(block)) return;
        var el = block.matches(TEXT_NODES) ? block : block.querySelector(TEXT_NODES);
        if (!el) el = block;
        if (!el || el.dataset.srReady) return;
        el.dataset.srReady = '1';
        targets.push(el);

        // Display headings use tight letter-spacing; splitting them into
        // inline-block words collapses "About me" into ABOUTME. Fade the
        // whole line and keep word-by-word for body copy only.
        if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') return;

        var words = wrapWords(el);
        if (!words.length) return;
        var step = Math.min(STAGGER, MAX_STAGGER / words.length);
        words.forEach(function (w, i) { w.style.transitionDelay = Math.round(i * step) + 'ms'; });
      });
    });
    if (!targets.length) return;

    var style = document.createElement('style');
    style.textContent = [
      '[data-sr-ready] {',
      '  transform-origin: 0% 50%;',
      '  transform: rotate(' + BASE_ROTATION + 'deg);',
      '  transition: transform ' + (WORD_MS + 320) + 'ms cubic-bezier(0.16, 1, 0.3, 1);',
      '}',
      'h1[data-sr-ready], h2[data-sr-ready], h3[data-sr-ready] {',
      '  transform: none;',
      '  opacity: ' + BASE_OPACITY + ';',
      '  filter: blur(' + BLUR + 'px);',
      '  transition: opacity ' + WORD_MS + 'ms ease-out, filter ' + WORD_MS + 'ms ease-out;',
      '}',
      '[data-sr-ready].sr-in { transform: none; }',
      'h1[data-sr-ready].sr-in, h2[data-sr-ready].sr-in, h3[data-sr-ready].sr-in {',
      '  opacity: 1; filter: none;',
      '}',
      '.sr-word {',
      '  display: inline-block;',
      '  opacity: ' + BASE_OPACITY + ';',
      '  filter: blur(' + BLUR + 'px);',
      '  will-change: opacity, filter;',
      '  transition: opacity ' + WORD_MS + 'ms ease-out, filter ' + WORD_MS + 'ms ease-out;',
      '}',
      '.sr-in .sr-word { opacity: 1; filter: blur(0); }',
      '@media (prefers-reduced-motion: reduce) {',
      '  [data-sr-ready] { transform: none; }',
      '  .sr-word { opacity: 1; filter: none; transition: none; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);

    function reveal(el) {
      if (el.dataset.srDone) return;
      el.dataset.srDone = '1';
      el.classList.add('sr-in');
      // stop compositing the blur once every word has landed
      var total = WORD_MS + el.querySelectorAll('.sr-word').length * STAGGER + 200;
      setTimeout(function () {
        [].forEach.call(el.querySelectorAll('.sr-word'), function (w) {
          w.style.filter = 'none';
          w.style.willChange = 'auto';
        });
      }, total);
    }

    function sweep() {
      var pending = false;
      targets.forEach(function (el) {
        if (el.dataset.srDone) return;
        if (inView(el)) reveal(el); else pending = true;
      });
      return pending;
    }

    // let the base state paint once so the transition actually runs
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        setTimeout(function () {
          if (!sweep()) return;
          var onScroll = function () {
            if (!sweep()) {
              window.removeEventListener('scroll', onScroll);
              window.removeEventListener('resize', onScroll);
            }
          };
          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll);
        }, 120);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
