/**
 * Interactive FAQ Accordion Controller
 * Axel Karambizi Portfolio
 */
(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('faq-accordion-styles')) return;
    var style = document.createElement('style');
    style.id = 'faq-accordion-styles';
    style.textContent = [
      '/* FAQ Accordion Styles */',
      '.framer-2k6sY {',
      '  cursor: pointer !important;',
      '  width: 100% !important;',
      '  max-width: 600px;',
      '  box-sizing: border-box !important;',
      '}',
      '.framer-2k6sY .framer-xyut35,',
      '.framer-2k6sY [data-framer-name="Top"] {',
      '  cursor: pointer !important;',
      '  user-select: none;',
      '  width: 100% !important;',
      '  display: flex !important;',
      '  justify-content: space-between !important;',
      '  align-items: center !important;',
      '}',
      '.framer-2k6sY .framer-1e2gxyp-container {',
      '  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;',
      '  transform-origin: center center;',
      '}',
      '.framer-2k6sY .framer-1l7evow,',
      '.framer-2k6sY [data-framer-name="Bottom"] {',
      '  transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, padding 0.3s ease !important;',
      '  box-sizing: border-box;',
      '  width: 100% !important;',
      '}',
      '/* Closed state */',
      '.framer-2k6sY:not(.faq-active) .framer-1l7evow,',
      '.framer-2k6sY:not(.faq-active) [data-framer-name="Bottom"] {',
      '  max-height: 0px !important;',
      '  height: 0px !important;',
      '  opacity: 0 !important;',
      '  overflow: hidden !important;',
      '  padding-top: 0px !important;',
      '  padding-bottom: 0px !important;',
      '  pointer-events: none !important;',
      '}',
      '.framer-2k6sY:not(.faq-active) .framer-1e2gxyp-container {',
      '  transform: rotate(0deg) !important;',
      '}',
      '/* Open state */',
      '.framer-2k6sY.faq-active .framer-1l7evow,',
      '.framer-2k6sY.faq-active [data-framer-name="Bottom"] {',
      '  max-height: 600px !important;',
      '  height: auto !important;',
      '  opacity: 1 !important;',
      '  overflow: visible !important;',
      '  padding-top: 10px !important;',
      '  padding-bottom: 24px !important;',
      '  pointer-events: auto !important;',
      '}',
      '.framer-2k6sY.faq-active .framer-1e2gxyp-container {',
      '  transform: rotate(180deg) !important;',
      '}',
      '.framer-2k6sY.faq-active h4 {',
      '  color: var(--token-54672876-03f0-4dca-8fdb-32c421a5c4d1, #5e67e6) !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function initAccordion() {
    injectStyles();

    var faqItems = Array.from(document.querySelectorAll('.framer-2k6sY, .faq-item'));
    if (!faqItems.length) return;

    faqItems.forEach(function (item, index) {
      var trigger = item.querySelector('.framer-xyut35, [data-framer-name="Top"], .faq-trigger') || item;
      var chevron = item.querySelector('.framer-1e2gxyp-container, .faq-chevron');

      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      // Set initial state: first item open, others closed
      if (index === 0) {
        item.classList.add('faq-active');
        item.setAttribute('aria-expanded', 'true');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      } else {
        item.classList.remove('faq-active');
        item.setAttribute('aria-expanded', 'false');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }

      function toggle() {
        var isOpen = item.classList.contains('faq-active');

        if (isOpen) {
          item.classList.remove('faq-active');
          item.setAttribute('aria-expanded', 'false');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        } else {
          // Close other items
          faqItems.forEach(function (otherItem) {
            if (otherItem !== item && otherItem.classList.contains('faq-active')) {
              otherItem.classList.remove('faq-active');
              otherItem.setAttribute('aria-expanded', 'false');
              var otherChevron = otherItem.querySelector('.framer-1e2gxyp-container, .faq-chevron');
              if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
            }
          });

          // Open clicked item
          item.classList.add('faq-active');
          item.setAttribute('aria-expanded', 'true');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      }

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });

      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordion);
  } else {
    initAccordion();
  }
})();
