/**
 * Smooth Neon Lime-Green Custom Cursor Follower
 * Matches Portois / Framer visual design from recording 20261001-1537-43.7057040.mp4
 */
(function () {
  'use strict';

  // Do not run on purely touch devices
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    return;
  }

  function initCursor() {
    if (document.getElementById('agy-custom-cursor')) return;

    // Inject styles
    var style = document.createElement('style');
    style.id = 'agy-custom-cursor-styles';
    style.textContent = [
      '#agy-custom-cursor {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  width: 15px;',
      '  height: 15px;',
      '  background-color: #d0ff71;',
      '  border-radius: 50%;',
      '  pointer-events: none !important;',
      '  z-index: 999999 !important;',
      '  transform: translate(-50%, -50%);',
      '  box-shadow: 0 0 12px rgba(208, 255, 113, 0.6);',
      '  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease, background-color 0.2s ease, width 0.2s ease, height 0.2s ease;',
      '  opacity: 0;',
      '  will-change: left, top, transform;',
      '}',
      '#agy-custom-cursor.cursor-active {',
      '  opacity: 1;',
      '}',
      '#agy-custom-cursor.cursor-hover {',
      '  transform: translate(-50%, -50%) scale(2);',
      '  background-color: rgba(208, 255, 113, 0.8);',
      '  box-shadow: 0 0 18px rgba(208, 255, 113, 0.8);',
      '}',
      '#agy-custom-cursor.cursor-hidden {',
      '  opacity: 0 !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    // Create cursor DOM
    var cursor = document.createElement('div');
    cursor.id = 'agy-custom-cursor';
    document.body.appendChild(cursor);

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;
    var isMoving = false;
    var isVisible = false;
    var rafId = null;

    var LERP = 0.22; // smooth trailing speed

    function render() {
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;

      cursor.style.left = currentX.toFixed(2) + 'px';
      cursor.style.top = currentY.toFixed(2) + 'px';

      var dx = Math.abs(targetX - currentX);
      var dy = Math.abs(targetY - currentY);

      if (isMoving || dx > 0.1 || dy > 0.1) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    }

    function onMouseMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        cursor.classList.add('cursor-active');
        cursor.classList.remove('cursor-hidden');
      }

      // Check if hovering over clickable / interactive elements
      var target = e.target;
      if (target) {
        var isClickable = target.closest('a, button, input, textarea, select, .framer-1id3mzr, .framer-xFpDQ, .framer-gBieo, [role="button"], [data-highlight], [tabindex="0"]');
        if (isClickable) {
          cursor.classList.add('cursor-hover');
        } else {
          cursor.classList.remove('cursor-hover');
        }
      }

      isMoving = true;
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });

    document.addEventListener('mouseleave', function () {
      cursor.classList.add('cursor-hidden');
    });

    document.addEventListener('mouseenter', function () {
      if (isVisible) {
        cursor.classList.remove('cursor-hidden');
      }
    });

    window.addEventListener('blur', function () {
      cursor.classList.add('cursor-hidden');
    });

    window.addEventListener('focus', function () {
      if (isVisible) {
        cursor.classList.remove('cursor-hidden');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
  } else {
    initCursor();
  }
})();
