/**
 * Scroll-linked 3D flip for the pinned portrait card.
 * The Framer bundle that normally drives this is disabled in this replica, so the
 * transform is rebuilt here from the curve measured on the live site.
 */
(function () {
  'use strict';

  var CARD = '.framer-43x9nz';
  var STICKY = '.framer-m09soj';
  var PERSPECTIVE = 1200;

  // Keyframes at 0%, 50% and 100% of the pin. The midpoint is a real stop, not
  // an interpolation artifact — every channel changes direction or slope there.
  var TRANSLATE_X = [0, 340, 340];
  var SCALE = [1, 0.9, 1];
  var ROTATE_Z = [0, 10, 5];
  var ROTATE_Y = [0, 150, 340];

  var card = document.querySelector(CARD);
  var sticky = card && document.querySelector(STICKY);
  var track = sticky && sticky.parentElement;
  if (!card || !track) return;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // Two linear segments joined at the midpoint keyframe.
  function at(keys, p) {
    return p <= 0.5
      ? keys[0] + (keys[1] - keys[0]) * (p / 0.5)
      : keys[1] + (keys[2] - keys[1]) * ((p - 0.5) / 0.5);
  }

  var trackTop = 0;
  var travel = 0;

  function measure() {
    trackTop = track.getBoundingClientRect().top + window.pageYOffset;
    travel = track.offsetHeight - sticky.offsetHeight;
  }

  function transformAnimations() {
    if (!card.getAnimations) return [];
    return card.getAnimations().filter(function (anim) {
      var frames = anim.effect && anim.effect.getKeyframes ? anim.effect.getKeyframes() : [];
      return frames.some(function (f) { return 'transform' in f; });
    });
  }

  // The intro appear animation is filled `both` and never handed off, because the
  // runtime that would take it over is disabled. A finished effect still outranks
  // inline styles, so it has to be dropped before the card will accept a transform.
  function releaseAppearAnimation() {
    transformAnimations().forEach(function (anim) { anim.cancel(); });
  }

  function transformAt(p) {
    return 'perspective(' + PERSPECTIVE + 'px)' +
      ' translateX(' + at(TRANSLATE_X, p).toFixed(2) + 'px)' +
      ' scale(' + at(SCALE, p).toFixed(4) + ')' +
      ' rotateZ(' + at(ROTATE_Z, p).toFixed(3) + 'deg)' +
      ' rotateY(' + at(ROTATE_Y, p).toFixed(3) + 'deg)';
  }

  function apply() {
    var p = travel > 0 ? clamp((window.pageYOffset - trackTop) / travel, 0, 1) : 0;
    card.style.transform = transformAt(p);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    releaseAppearAnimation();
    card.style.transform = transformAt(1);
    return;
  }

  var ticking = false;
  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      apply();
    });
  }

  function remeasure() {
    releaseAppearAnimation();
    measure();
    apply();
  }

  function start() {
    remeasure();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    // The pin length depends on text reflow, so re-measure once webfonts land.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  }

  var started = false;
  function startOnce() {
    if (started) return;
    started = true;
    start();
  }

  window.addEventListener('scroll', function onEarlyScroll() {
    if (window.pageYOffset > 5) {
      window.removeEventListener('scroll', onEarlyScroll);
      startOnce();
    }
  }, { passive: true });

  // Let the card's intro flip play out before taking the transform over, otherwise
  // cancelling the effect cuts the entry animation short.
  var intro = transformAnimations().map(function (anim) { return anim.finished; });
  if (intro.length) {
    Promise.race([
      Promise.all(intro).catch(function () {}),
      new Promise(function (res) { setTimeout(res, 1200); })
    ]).then(startOnce);
  } else {
    startOnce();
  }
})();
