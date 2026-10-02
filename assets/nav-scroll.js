/**
 * Nav scroll toggle:
 * - At top (before scrolling, scrollY < 60): displays menu only (Home, About, Projects, Blogs, Contact).
 * - When scrolled down (scrollY >= 60): displays "Available for work" status pill with avatar & indicator.
 * - On desktop hover when scrolled: expands to also reveal the menu links.
 */
(function () {
  'use strict';

  function initNavScroll() {
    var nav = document.querySelector('nav.framer-z7I7P');
    if (!nav) return;

    var THRESHOLD = 60;

    function onScroll() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
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
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavScroll);
  } else {
    initNavScroll();
  }
})();
