/**
 * Axel Karambizi — Navigation Scroll, 3D Roll & Green Pointer Engine
 * Matches Portavia & Framer interactive specs:
 * 1. Scroll states (menu at top, status pill when scrolled, expand on hover)
 * 2. 3D cube rolling flip on menu links
 * 3. Smooth green trailing cursor follower with hover-target scaling and glow
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

    // 3D Rolling Hover listeners for nav link elements
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

  function initGreenPointer() {
    // Only enable on pointer-fine desktop devices
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    var cursor = document.querySelector('.framer-SsumL');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.className = 'framer-SsumL framer-pointer-events-none';
      document.body.appendChild(cursor);
    }

    var mouseX = -100;
    var mouseY = -100;
    var currentX = -100;
    var currentY = -100;
    var isVisible = false;
    var isHovering = false;

    // Direct cursor styling guarantee
    cursor.style.opacity = '0';
    cursor.style.pointerEvents = 'none';

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        cursor.style.opacity = '1';
        currentX = mouseX;
        currentY = mouseY;
      }

      // Check if hovering over clickable element
      var target = e.target;
      var clickable = target && (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="button"]') ||
        target.closest('.framer-gBieo') ||
        target.closest('.framer-xFpDQ') ||
        target.closest('.framer-1fin31n-container') ||
        target.closest('.framer-1978dwj-container')
      );

      if (clickable && !isHovering) {
        isHovering = true;
        cursor.classList.add('cursor-hover');
      } else if (!clickable && isHovering) {
        isHovering = false;
        cursor.classList.remove('cursor-hover');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      isVisible = false;
      cursor.style.opacity = '0';
      cursor.classList.remove('cursor-hover');
      isHovering = false;
    });

    document.addEventListener('mouseenter', function () {
      if (mouseX >= 0 && mouseY >= 0) {
        isVisible = true;
        cursor.style.opacity = '1';
      }
    });

    // Smooth LERP animation loop (matches Framer spring physics)
    function renderLoop() {
      if (isVisible) {
        var ease = 0.22;
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;
        cursor.style.transform = 'translate3d(' + currentX.toFixed(2) + 'px, ' + currentY.toFixed(2) + 'px, 0)';
      }
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initNavScroll();
      initGreenPointer();
    });
  } else {
    initNavScroll();
    initGreenPointer();
  }
})();
