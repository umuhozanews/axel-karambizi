/**
 * Interactive Services Accordion Controller
 * Axel Karambizi Portfolio - Gacondo Labs
 * Enables expanding/collapsing service categories on Desktop, Tablet & Mobile.
 */
(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('services-accordion-styles')) return;
    var style = document.createElement('style');
    style.id = 'services-accordion-styles';
    style.textContent = [
      '/* Ensure Services section displays properly on all viewports */',
      '.ssr-variant:has(.framer-1id3mzr),',
      '.services-accordion-wrap {',
      '  display: block !important;',
      '}',
      '.framer-1pu3wi0-container {',
      '  height: auto !important;',
      '  min-height: 332px;',
      '}',
      '.framer-1yzos42 {',
      '  height: auto !important;',
      '  width: 100% !important;',
      '  max-width: 600px;',
      '}',
      '/* Service row header cursor & transitions */',
      '.framer-1id3mzr {',
      '  cursor: pointer !important;',
      '  width: 100% !important;',
      '}',
      '.framer-1id3mzr .framer-nrx7op,',
      '.framer-1id3mzr [data-framer-name="Top"] {',
      '  cursor: pointer !important;',
      '  user-select: none;',
      '}',
      '.framer-1id3mzr .framer-i1pcpi-container {',
      '  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;',
      '  transform-origin: center center;',
      '}',
      '.framer-1id3mzr .framer-of9a55,',
      '.framer-1id3mzr [data-framer-name="Bottom"] {',
      '  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, padding 0.3s ease !important;',
      '  box-sizing: border-box;',
      '  width: 100% !important;',
      '}',
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
      '/* Open state */',
      '.framer-1id3mzr.service-open .framer-of9a55,',
      '.framer-1id3mzr.service-open [data-framer-name="Bottom"] {',
      '  max-height: 800px !important;',
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
      '.framer-1id3mzr.service-open h3 {',
      '  color: var(--token-54672876-03f0-4dca-8fdb-32c421a5c4d1, #5e67e6) !important;',
      '}',
      '/* Hover effects on individual service items */',
      '.framer-1id3mzr .framer-eaudrf {',
      '  transition: transform 0.2s ease, opacity 0.2s ease;',
      '}',
      '.framer-1id3mzr .framer-eaudrf:hover {',
      '  transform: translateX(6px);',
      '}'
    ].join('\n');
    document.head.appendChild(style);
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

    // Group rows by their common parent so that desktop and mobile variants operate independently
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
        var content = row.querySelector('.framer-of9a55, [data-framer-name="Bottom"]');
        var chevron = row.querySelector('.framer-i1pcpi-container');

        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');

        // First item open by default
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

        function toggleRow() {
          var isOpen = row.classList.contains('service-open');

          if (isOpen) {
            // Close this row
            row.classList.remove('service-open');
            row.classList.remove('framer-v-1t0b5g1');
            row.classList.add('framer-v-1id3mzr');
            row.setAttribute('aria-expanded', 'false');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
          } else {
            // Close other rows in this group
            group.forEach(function (other) {
              if (other !== row) {
                other.classList.remove('service-open');
                other.classList.remove('framer-v-1t0b5g1');
                other.classList.add('framer-v-1id3mzr');
                other.setAttribute('aria-expanded', 'false');
                var otherChevron = other.querySelector('.framer-i1pcpi-container');
                if (otherChevron) otherChevron.style.transform = 'rotate(180deg)';
              }
            });

            // Open clicked row
            row.classList.add('service-open');
            row.classList.add('framer-v-1t0b5g1');
            row.classList.remove('framer-v-1id3mzr');
            row.setAttribute('aria-expanded', 'true');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
          }
        }

        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          toggleRow();
        });

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
