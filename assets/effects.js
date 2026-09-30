/**
 * Scroll-driven effects runtime.
 * Every scroll-linked read/write is batched into one rAF loop to avoid layout thrash.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  // Must match the `top` value on .panel in styles.css, or the stack math drifts.
  var STICK_TOP = window.matchMedia('(max-width: 860px)').matches ? 74 : 88;

  /* ---------------------------------------------------------
     Word-mask split — each word gets its own clipped line so
     headings can rise in with a stagger.
     --------------------------------------------------------- */
  function initSplit() {
    var els = document.querySelectorAll('[data-split]');
    if (!els.length) return;

    els.forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      el.classList.add('split');

      words.forEach(function (word, i) {
        var outer = document.createElement('span');
        outer.className = 'w';
        var inner = document.createElement('span');
        inner.className = 'w__in';
        inner.textContent = word;
        outer.style.setProperty('--i', i);
        outer.appendChild(inner);
        el.appendChild(outer);
      });

      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
    });

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Clip reveal — art blocks wipe open on entry
     --------------------------------------------------------- */
  function initClip() {
    var els = document.querySelectorAll('.clip');
    if (!els.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Magnetic buttons — pull toward the cursor on approach
     --------------------------------------------------------- */
  function initMagnetic() {
    if (reduced || window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.classList.add('is-mag');

      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        btn.style.transform =
          'translate(' + (mx * 0.18).toFixed(2) + 'px,' + (my * 0.28).toFixed(2) + 'px)';
      });

      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    els.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
    });

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Counters — run once when the stat scrolls into view
     --------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) {
        n.textContent = n.getAttribute('data-count') + (n.getAttribute('data-suffix') || '');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1500;
        var start = performance.now();

        (function tick(now) {
          var p = clamp((now - start) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
     Scroll spy — highlight the nav link for the section in view
     --------------------------------------------------------- */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { threshold: 0.4, rootMargin: '-20% 0px -40% 0px' });

    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  /* ---------------------------------------------------------
     Scroll-linked layer — progress bar, nav state, panels,
     parallax and marquee all share one rAF pass.
     --------------------------------------------------------- */
  function initScrollLayer() {
    var bar = document.querySelector('.progress__bar');
    var nav = document.getElementById('nav');
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
    var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var marquee = document.querySelector('[data-marquee]');
    var hero = document.querySelector('[data-hero]');

    var lastY = window.pageYOffset;
    var marqueeX = 0;
    var half = 0;
    var ticking = false;
    var dirty = true;

    // The track is two identical halves; looping at its midpoint needs a width
    // measured in the real font, so re-measure once webfonts settle.
    function measure() {
      if (marquee) half = marquee.scrollWidth / 2;
      dirty = true;
    }
    measure();
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);

    function frame() {
      ticking = false;

      var y = window.pageYOffset;
      var vh = window.innerHeight;
      var delta = y - lastY;
      var max = document.documentElement.scrollHeight - vh;

      // The marquee drifts every frame, but the scroll-linked layers only
      // change when the page actually moves — skip their reads when it hasn't.
      if (delta === 0 && !dirty) {
        stepMarquee(0);
        return;
      }
      dirty = false;

      /* progress */
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';

      /* nav: frost after the fold, retract when scrolling down */
      if (nav) {
        nav.classList.toggle('is-stuck', y > 40);
        nav.classList.toggle('is-hidden', y > 420 && delta > 4);
      }

      /* hero drifts up and fades as it leaves */
      if (hero && !reduced) {
        var p = clamp(y / vh, 0, 1);
        hero.style.transform = 'translate3d(0,' + (p * 72).toFixed(1) + 'px,0)';
        hero.style.opacity = (1 - p * 0.85).toFixed(3);
      }

      /* sticky stack: a panel shrinks and dims as the next one covers it */
      if (!reduced) {
        for (var i = 0; i < panels.length - 1; i++) {
          var next = panels[i + 1].getBoundingClientRect();
          var travel = vh - STICK_TOP;
          var prog = clamp(1 - (next.top - STICK_TOP) / travel, 0, 1);
          panels[i].style.transform = 'scale(' + (1 - prog * 0.06).toFixed(4) + ')';
          panels[i].style.filter = 'brightness(' + (1 - prog * 0.3).toFixed(3) + ')';
        }
      }

      /* parallax */
      if (!reduced) {
        for (var j = 0; j < parallax.length; j++) {
          var el = parallax[j];
          var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
          var r = el.getBoundingClientRect();
          var off = (r.top + r.height / 2 - vh / 2) * speed;
          el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
        }
      }

      stepMarquee(delta);

      lastY = y;
    }

    /* drifts on its own, and scroll velocity nudges it along */
    function stepMarquee(delta) {
      if (!marquee || half <= 0 || reduced) return;
      marqueeX -= 0.45 + delta * 0.22;
      if (marqueeX <= -half) marqueeX += half;
      if (marqueeX > 0) marqueeX -= half;
      marquee.style.transform = 'translate3d(' + marqueeX.toFixed(2) + 'px,0,0)';
    }

    function request() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);

    /* keep the marquee drifting even when the page is still */
    (function loop() { request(); requestAnimationFrame(loop); })();
  }

  /* ---------------------------------------------------------
     Misc
     --------------------------------------------------------- */
  function initYear() {
    var el = document.querySelector('[data-year]');
    if (el) el.textContent = new Date().getFullYear();
  }

  function init() {
    initSplit();
    initClip();
    initMagnetic();
    initReveal();
    initCounters();
    initScrollSpy();
    initScrollLayer();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
