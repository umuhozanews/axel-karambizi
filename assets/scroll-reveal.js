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
  var WORD_MS = 520;       // how long one word takes to resolve
  var STAGGER = 34;        // ms between consecutive words
  var MAX_STAGGER = 900;   // cap so long paragraphs do not crawl

  function wrapWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var texts = [];
    var node;
    while ((node = walker.nextNode())) if (node.nodeValue.trim()) texts.push(node);

    var words = [];
    texts.forEach(function (text) {
      var frag = document.createDocumentFragment();
      // keep the separators so wrapping and pre-wrap behaviour are unchanged
      text.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
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

  function inView(el) {
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * 0.92 && r.bottom > 0;
  }

  function init() {
    var targets = [];
    BLOCKS.forEach(function (sel) {
      // /about/ ships one copy of the block per breakpoint variant
      [].forEach.call(document.querySelectorAll(sel), function (block) {
        var el = block.matches(TEXT_NODES) ? block : block.querySelector(TEXT_NODES);
        if (!el || el.dataset.srReady) return;
        var words = wrapWords(el);
        if (!words.length) return;
        el.dataset.srReady = '1';
        targets.push(el);

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
      '[data-sr-ready].sr-in { transform: none; }',
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
