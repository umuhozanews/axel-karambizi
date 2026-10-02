/**
 * Navigation Scroll & Interactive Hover Engine
 * - At top (before scroll, scrollY < 60): Displays menu only (Home, About, Projects, Blogs, Contact).
 * - Scrolled down (scrollY >= 60): Shows "Available for work" avatar pill with pulsing status indicator.
 * - Scrolled hover (desktop): Expands seamlessly to reveal the entire navigation menu.
 * - Interactive 3D Roll: Adds hover class on mouseenter for 3D flip animation across all links.
 */
(function () {
  'use strict';

  function initNavScroll() {
    var navs = document.querySelectorAll('nav.framer-z7I7P');
    if (!navs.length) {
      navs = document.querySelectorAll('nav');
    }
    if (!navs.length) return;

    var THRESHOLD = 60;

    function onScroll() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      navs.forEach(function (nav) {
        if (scrollY >= THRESHOLD) {
          if (!nav.classList.contains('nav-scrolled')) {
            nav.classList.add('nav-scrolled');
            nav.classList.remove('nav-at-top');
          }
        } else {
          if (!nav.classList.contains('nav-at-top')) {
            nav.classList.add('nav-at-top');
            nav.classList.remove('nav-scrolled');
          }
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    // 3D Rolling Hover listeners for all nav link elements
    navs.forEach(function (nav) {
      var links = nav.querySelectorAll('.framer-xFpDQ, .framer-gBieo');
      links.forEach(function (link) {
        link.addEventListener('mouseenter', function () {
          link.classList.add('hover');
        });
        link.addEventListener('mouseleave', function () {
          link.classList.remove('hover');
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavScroll);
  } else {
    initNavScroll();
  }
})();
