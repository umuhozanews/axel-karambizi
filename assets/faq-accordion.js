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
      '/* FAQ Accordion Styles & Answer Formatting */',
      '.framer-1wntvpv-container {',
      '  height: auto !important;',
      '  min-height: auto !important;',
      '  max-height: none !important;',
      '  overflow: visible !important;',
      '}',
      '.framer-FNjt9 {',
      '  height: auto !important;',
      '  overflow: visible !important;',
      '}',
      '.framer-2k6sY {',
      '  cursor: pointer !important;',
      '  width: 100% !important;',
      '  max-width: 100% !important;',
      '  height: auto !important;',
      '  overflow: visible !important;',
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
      '  padding: 0px !important;',
      '  pointer-events: none !important;',
      '  display: none !important;',
      '}',
      '.framer-2k6sY:not(.faq-active) .framer-1e2gxyp-container {',
      '  transform: rotate(0deg) !important;',
      '}',
      '/* Open state */',
      '.framer-2k6sY.faq-active .framer-1l7evow,',
      '.framer-2k6sY.faq-active [data-framer-name="Bottom"] {',
      '  max-height: none !important;',
      '  height: auto !important;',
      '  opacity: 1 !important;',
      '  overflow: visible !important;',
      '  padding-top: 10px !important;',
      '  padding-bottom: 24px !important;',
      '  pointer-events: auto !important;',
      '  display: block !important;',
      '}',
      '.framer-2k6sY.faq-active .framer-1e2gxyp-container {',
      '  transform: rotate(180deg) !important;',
      '}',
      '.framer-2k6sY.faq-active h4 {',
      '  color: var(--token-54672876-03f0-4dca-8fdb-32c421a5c4d1, #5e67e6) !important;',
      '}',
      '/* Question Header Layout */',
      '.framer-2k6sY .framer-e6shww {',
      '  display: flex !important;',
      '  flex-direction: row !important;',
      '  align-items: flex-start !important;',
      '  gap: 8px !important;',
      '  width: 100% !important;',
      '  max-width: 90% !important;',
      '}',
      '.framer-2k6sY .framer-e6shww .framer-118mxo5 {',
      '  white-space: nowrap !important;',
      '  flex: none !important;',
      '  width: auto !important;',
      '}',
      '.framer-2k6sY .framer-eqt2pn {',
      '  flex: 1 1 auto !important;',
      '  width: auto !important;',
      '  white-space: normal !important;',
      '  overflow-wrap: break-word !important;',
      '}',
      '.framer-2k6sY .framer-eqt2pn h4 {',
      '  margin: 0 !important;',
      '  white-space: normal !important;',
      '  overflow-wrap: break-word !important;',
      '}',
      '/* Answer Text Flow & Wrap Fix */',
      '.framer-2k6sY .framer-1l7evow .framer-118mxo5,',
      '.framer-2k6sY [data-framer-name="Bottom"] .framer-118mxo5 {',
      '  white-space: normal !important;',
      '  word-break: normal !important;',
      '  overflow-wrap: break-word !important;',
      '  width: 100% !important;',
      '  max-width: 100% !important;',
      '  height: auto !important;',
      '  overflow: visible !important;',
      '  display: block !important;',
      '}',
      '.framer-2k6sY .framer-118mxo5 p,',
      '.framer-2k6sY .framer-1l7evow p,',
      '.framer-2k6sY [data-framer-name="Bottom"] p {',
      '  white-space: normal !important;',
      '  word-break: normal !important;',
      '  overflow-wrap: break-word !important;',
      '  line-height: 1.75 !important;',
      '  font-size: 15px !important;',
      '  margin: 0 !important;',
      '  padding-top: 6px !important;',
      '  padding-bottom: 8px !important;',
      '  display: block !important;',
      '  width: 100% !important;',
      '  max-width: 100% !important;',
      '  height: auto !important;',
      '  overflow: visible !important;',
      '}',
      '.framer-2k6sY .framer-1nypj2-container {',
      '  width: 100% !important;',
      '  height: auto !important;',
      '  overflow: visible !important;',
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

      function updateItemState(el, active) {
        var ch = el.querySelector('.framer-1e2gxyp-container, .faq-chevron');
        var ans = el.querySelector('.framer-1l7evow, [data-framer-name="Bottom"]');
        if (active) {
          el.classList.add('faq-active');
          el.setAttribute('aria-expanded', 'true');
          if (ch) ch.style.transform = 'rotate(180deg)';
          if (ans) {
            ans.style.display = 'block';
            ans.style.maxHeight = 'none';
            ans.style.height = 'auto';
            ans.style.opacity = '1';
            ans.style.overflow = 'visible';
          }
        } else {
          el.classList.remove('faq-active');
          el.setAttribute('aria-expanded', 'false');
          if (ch) ch.style.transform = 'rotate(0deg)';
          if (ans) {
            ans.style.display = 'none';
            ans.style.maxHeight = '0px';
            ans.style.height = '0px';
            ans.style.opacity = '0';
            ans.style.overflow = 'hidden';
          }
        }
      }

      // Set initial state: first item open, others closed
      updateItemState(item, index === 0);

      function toggle() {
        var isOpen = item.classList.contains('faq-active');

        if (isOpen) {
          updateItemState(item, false);
        } else {
          // Close other items
          faqItems.forEach(function (otherItem) {
            if (otherItem !== item) {
              updateItemState(otherItem, false);
            }
          });
          // Open clicked item
          updateItemState(item, true);
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
