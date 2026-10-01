/**
 * Interactive Services Accordion & 3D Preview Card Controller
 * Axel Karambizi Portfolio
 * Supports:
 * - Hover / mouseenter to expand service items & reveal sub-items
 * - Click & keyboard toggle for mobile / touch accessibility
 * - Dynamic 3D perspective preview card on the right displaying matching imagery
 * - Responsive layout across Desktop, Tablet & Mobile
 */
(function () {
  'use strict';

  var IMAGES = [
    './assets/service-hover-1.jpeg',
    './assets/service-hover-2.jpeg',
    './assets/service-hover-3.jpeg',
    './assets/service-hover-4.jpeg'
  ];

  // Resolve base path for nested subpages like /about/
  var BASE = (function () {
    var self = document.currentScript || document.querySelector('script[src*="services-accordion.js"]');
    if (self && self.src) {
      return self.src.replace(/[^/]+$/, '');
    }
    return '/assets/';
  })();

  function getImgSrc(index) {
    return BASE + 'service-hover-' + (index + 1) + '.jpeg';
  }

  function injectStyles() {
    if (document.getElementById('services-accordion-styles')) return;
    var style = document.createElement('style');
    style.id = 'services-accordion-styles';
    style.textContent = [
      '/* Container Layout for Services Section */',
      '.framer-cby2j3 {',
      '  display: flex !important;',
      '  flex-direction: row !important;',
      '  align-items: center !important;',
      '  justify-content: space-between !important;',
      '  gap: 40px !important;',
      '  width: 100% !important;',
      '  max-width: 1200px !important;',
      '  position: relative !important;',
      '  overflow: visible !important;',
      '}',
      '.framer-aukzsn {',
      '  width: 52% !important;',
      '  max-width: 600px !important;',
      '  flex: 1 1 52% !important;',
      '}',
      '.ssr-variant:has(.framer-1id3mzr),',
      '.services-accordion-wrap {',
      '  display: block !important;',
      '  width: 100% !important;',
      '}',
      '.framer-1pu3wi0-container {',
      '  height: auto !important;',
      '  min-height: 332px;',
      '  width: 100% !important;',
      '}',
      '.framer-1yzos42 {',
      '  height: auto !important;',
      '  width: 100% !important;',
      '  max-width: 600px;',
      '}',
      '',
      '/* Service row header cursor & transitions */',
      '.framer-1id3mzr {',
      '  cursor: pointer !important;',
      '  width: 100% !important;',
      '  transition: border-color 0.3s ease, background-color 0.25s ease !important;',
      '}',
      '.framer-1id3mzr .framer-nrx7op,',
      '.framer-1id3mzr [data-framer-name="Top"] {',
      '  cursor: pointer !important;',
      '  user-select: none;',
      '}',
      '.framer-1id3mzr h3 {',
      '  transition: color 0.25s ease !important;',
      '}',
      '.framer-1id3mzr:hover h3,',
      '.framer-1id3mzr.service-open h3 {',
      '  color: #d0ff71 !important;',
      '  --framer-text-color: #d0ff71 !important;',
      '  --extracted-a0htzi: #d0ff71 !important;',
      '}',
      '.framer-1id3mzr .framer-i1pcpi-container {',
      '  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;',
      '  transform-origin: center center;',
      '}',
      '.framer-1id3mzr .framer-of9a55,',
      '.framer-1id3mzr [data-framer-name="Bottom"] {',
      '  transition: max-height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease, padding 0.3s ease !important;',
      '  box-sizing: border-box;',
      '  width: 100% !important;',
      '}',
      '',
      '/* Closed state */',
      '.framer-1id3mzr:not(.service-open) .framer-of9a55,',
      '.framer-1id3mzr:not(.service-open) [data-framer-name="Bottom"] {',
      '  max-height: 0px !important;',
      '  height: 0px !important;',
      '  opacity: 0 !important;',
      '  overflow: hidden !important;',
      '  padding-top: 0px !important;',
      '  padding-bottom: 0px !important;',
      '  pointer-events: none;',
      '}',
      '.framer-1id3mzr:not(.service-open) .framer-i1pcpi-container {',
      '  transform: rotate(180deg) !important;',
      '}',
      '',
      '/* Open state */',
      '.framer-1id3mzr.service-open .framer-of9a55,',
      '.framer-1id3mzr.service-open [data-framer-name="Bottom"] {',
      '  max-height: 600px !important;',
      '  height: auto !important;',
      '  opacity: 1 !important;',
      '  overflow: visible !important;',
      '  padding-top: 10px !important;',
      '  padding-bottom: 24px !important;',
      '  pointer-events: auto;',
      '}',
      '.framer-1id3mzr.service-open .framer-i1pcpi-container {',
      '  transform: rotate(0deg) !important;',
      '}',
      '',
      '/* Service sub-items styling */',
      '.framer-1id3mzr .framer-eaudrf {',
      '  transition: transform 0.25s ease, opacity 0.25s ease !important;',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 12px !important;',
      '}',
      '.framer-1id3mzr .framer-eaudrf:hover {',
      '  transform: translateX(8px) !important;',
      '}',
      '.framer-1id3mzr .framer-1ls9u1z-container svg {',
      '  color: #d0ff71 !important;',
      '  stroke: #d0ff71 !important;',
      '}',
      '',
      '/* 3D Preview Card on Right Column (Desktop) */',
      '.services-3d-card-column {',
      '  width: 44% !important;',
      '  max-width: 500px !important;',
      '  flex: 0 0 44% !important;',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  justify-content: center !important;',
      '  perspective: 1200px !important;',
      '  position: relative !important;',
      '  z-index: 2 !important;',
      '}',
      '.services-3d-card {',
      '  width: 100% !important;',
      '  aspect-ratio: 16 / 11 !important;',
      '  max-height: 420px !important;',
      '  border-radius: 24px !important;',
      '  position: relative !important;',
      '  overflow: hidden !important;',
      '  background-color: #1a1a1c !important;',
      '  transform: perspective(1200px) rotateY(-8deg) rotateX(4deg) scale(0.96);',
      '  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;',
      '  transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease !important;',
      '  will-change: transform;',
      '}',
      '.services-3d-card:hover {',
      '  transform: perspective(1200px) rotateY(-4deg) rotateX(2deg) scale(0.99) !important;',
      '  box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(208, 255, 113, 0.3) !important;',
      '}',
      '.services-3d-image-layer {',
      '  position: absolute !important;',
      '  inset: 0 !important;',
      '  width: 100% !important;',
      '  height: 100% !important;',
      '  object-fit: cover !important;',
      '  object-position: center !important;',
      '  opacity: 0 !important;',
      '  transform: scale(1.05);',
      '  transition: opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) !important;',
      '  pointer-events: none !important;',
      '}',
      '.services-3d-image-layer.image-active {',
      '  opacity: 1 !important;',
      '  transform: scale(1) !important;',
      '}',
      '',
      '/* Responsive Breakpoints */',
      '@media (max-width: 959.98px) {',
      '  .services-3d-card-column {',
      '    display: none !important;',
      '  }',
      '  .framer-cby2j3 {',
      '    flex-direction: column !important;',
      '    gap: 20px !important;',
      '  }',
      '  .framer-aukzsn {',
      '    width: 100% !important;',
      '    max-width: 100% !important;',
      '    flex: 1 1 100% !important;',
      '  }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setup3DCard(container) {
    if (!container) return null;
    var existing = container.querySelector('.services-3d-card-column');
    if (existing) return existing;

    var column = document.createElement('div');
    column.className = 'services-3d-card-column';

    var card = document.createElement('div');
    card.className = 'services-3d-card';

    // Build image layers for each service
    for (var i = 0; i < 4; i++) {
      var img = document.createElement('img');
      img.className = 'services-3d-image-layer' + (i === 0 ? ' image-active' : '');
      img.src = getImgSrc(i);
      img.alt = 'Service Preview ' + (i + 1);
      img.loading = 'eager';
      card.appendChild(img);
    }

    column.appendChild(card);
    container.appendChild(column);

    // Subtle parallax mouse tracking over services section
    var targetRotY = -8;
    var targetRotX = 4;
    var currentRotY = -8;
    var currentRotX = 4;
    var rafTilt = null;

    function renderTilt() {
      currentRotY += (targetRotY - currentRotY) * 0.12;
      currentRotX += (targetRotX - currentRotX) * 0.12;

      card.style.transform = 'perspective(1200px) rotateY(' + currentRotY.toFixed(2) + 'deg) rotateX(' + currentRotX.toFixed(2) + 'deg) scale(0.96)';

      if (Math.abs(targetRotY - currentRotY) > 0.05 || Math.abs(targetRotX - currentRotX) > 0.05) {
        rafTilt = requestAnimationFrame(renderTilt);
      } else {
        rafTilt = null;
      }
    }

    container.addEventListener('mousemove', function (e) {
      var rect = container.getBoundingClientRect();
      var xRatio = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      var yRatio = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

      targetRotY = -8 + xRatio * 10;
      targetRotX = 4 - yRatio * 8;

      if (!rafTilt) rafTilt = requestAnimationFrame(renderTilt);
    }, { passive: true });

    container.addEventListener('mouseleave', function () {
      targetRotY = -8;
      targetRotX = 4;
      if (!rafTilt) rafTilt = requestAnimationFrame(renderTilt);
    });

    return column;
  }

  function setActiveImage(column, activeIndex) {
    if (!column) return;
    var layers = column.querySelectorAll('.services-3d-image-layer');
    layers.forEach(function (layer, idx) {
      if (idx === activeIndex) {
        layer.classList.add('image-active');
      } else {
        layer.classList.remove('image-active');
      }
    });
  }

  function initServicesAccordion() {
    injectStyles();

    // Adjust any containers with fixed height
    document.querySelectorAll('.framer-1pu3wi0-container').forEach(function (c) {
      c.style.height = 'auto';
    });

    // Make sure parent variant is visible
    document.querySelectorAll('.ssr-variant').forEach(function (v) {
      if (v.querySelector('.framer-1id3mzr')) {
        v.classList.add('services-accordion-wrap');
      }
    });

    var rows = Array.from(document.querySelectorAll('.framer-1id3mzr'));
    if (!rows.length) return;

    // Attach 3D preview card to the main services container on desktop
    var servicesContainer = document.querySelector('.framer-cby2j3');
    var cardColumn = setup3DCard(servicesContainer);

    // Group rows by their common parent so that desktop and mobile variants operate cleanly
    var rowGroups = [];
    var seenParents = new Set();

    rows.forEach(function (row) {
      var parent = row.closest('.framer-1yzos42') || row.closest('.ssr-variant') || row.parentElement;
      if (!seenParents.has(parent)) {
        seenParents.add(parent);
        var groupRows = Array.from(parent.querySelectorAll('.framer-1id3mzr'));
        if (groupRows.length) rowGroups.push(groupRows);
      }
    });

    if (!rowGroups.length) rowGroups = [rows];

    rowGroups.forEach(function (group) {
      group.forEach(function (row, idx) {
        var trigger = row.querySelector('.framer-nrx7op, [data-framer-name="Top"]') || row;
        var chevron = row.querySelector('.framer-i1pcpi-container');

        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');

        // First item (1. ui/ux design) open by default
        if (idx === 0) {
          row.classList.add('service-open');
          row.classList.add('framer-v-1t0b5g1');
          row.classList.remove('framer-v-1id3mzr');
          row.setAttribute('aria-expanded', 'true');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        } else {
          row.classList.remove('service-open');
          row.classList.remove('framer-v-1t0b5g1');
          row.classList.add('framer-v-1id3mzr');
          row.setAttribute('aria-expanded', 'false');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }

        function openThisRow() {
          // Close other rows in this group
          group.forEach(function (other, otherIdx) {
            if (other !== row) {
              other.classList.remove('service-open');
              other.classList.remove('framer-v-1t0b5g1');
              other.classList.add('framer-v-1id3mzr');
              other.setAttribute('aria-expanded', 'false');
              var otherChevron = other.querySelector('.framer-i1pcpi-container');
              if (otherChevron) otherChevron.style.transform = 'rotate(180deg)';
            }
          });

          // Open target row
          row.classList.add('service-open');
          row.classList.add('framer-v-1t0b5g1');
          row.classList.remove('framer-v-1id3mzr');
          row.setAttribute('aria-expanded', 'true');
          if (chevron) chevron.style.transform = 'rotate(0deg)';

          // Update 3D card image
          setActiveImage(cardColumn, idx % 4);
        }

        function toggleRow() {
          var isOpen = row.classList.contains('service-open');
          if (isOpen && group.length > 1) {
            // Keep at least one open or toggle
            row.classList.remove('service-open');
            row.classList.remove('framer-v-1t0b5g1');
            row.classList.add('framer-v-1id3mzr');
            row.setAttribute('aria-expanded', 'false');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
          } else {
            openThisRow();
          }
        }

        // HOVER (mouseenter): Automatically expand and reveal sub-items & update preview image!
        row.addEventListener('mouseenter', function () {
          openThisRow();
        });

        // CLICK: For touch, mobile, and explicit interaction
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          toggleRow();
        });

        // KEYBOARD: Enter / Space
        row.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleRow();
          }
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServicesAccordion);
  } else {
    initServicesAccordion();
  }
})();
