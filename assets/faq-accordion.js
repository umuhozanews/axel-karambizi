/**
 * Interactive FAQ Accordion Controller
 * Axel Karambizi Portfolio
 */
(function() {
  'use strict';

  function initAccordion() {
    var faqItems = document.querySelectorAll('.faq-item, .framer-2k6sY');
    if (!faqItems.length) return;

    faqItems.forEach(function(item, index) {
      // Find toggle trigger (header/top)
      var trigger = item.querySelector('.framer-xyut35, [data-framer-name="Top"], .faq-trigger');
      var content = item.querySelector('.framer-1l7evow, [data-framer-name="Bottom"], .faq-answer');
      var chevron = item.querySelector('.framer-1e2gxyp-container, .faq-chevron');

      if (!trigger || !content) return;

      trigger.style.cursor = 'pointer';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');

      // Set initial state (first item open, others closed)
      if (index === 0) {
        item.classList.add('faq-active');
        trigger.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 30 + 'px';
        content.style.opacity = '1';
        content.style.paddingTop = '12px';
        content.style.paddingBottom = '16px';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      } else {
        item.classList.remove('faq-active');
        trigger.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.paddingTop = '0px';
        content.style.paddingBottom = '0px';
        content.style.overflow = 'hidden';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      }

      function toggle() {
        var isOpen = item.classList.contains('faq-active');
        
        // Optional accordion behavior: close other open items
        faqItems.forEach(function(otherItem) {
          if (otherItem !== item && otherItem.classList.contains('faq-active')) {
            otherItem.classList.remove('faq-active');
            var otherTrigger = otherItem.querySelector('.framer-xyut35, [data-framer-name="Top"], .faq-trigger');
            var otherContent = otherItem.querySelector('.framer-1l7evow, [data-framer-name="Bottom"], .faq-answer');
            var otherChevron = otherItem.querySelector('.framer-1e2gxyp-container, .faq-chevron');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
            if (otherContent) {
              otherContent.style.maxHeight = '0px';
              otherContent.style.opacity = '0';
              otherContent.style.paddingTop = '0px';
              otherContent.style.paddingBottom = '0px';
            }
            if (otherChevron) otherChevron.style.transform = 'rotate(180deg)';
          }
        });

        if (isOpen) {
          item.classList.remove('faq-active');
          trigger.setAttribute('aria-expanded', 'false');
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
          content.style.paddingTop = '0px';
          content.style.paddingBottom = '0px';
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
          item.classList.add('faq-active');
          trigger.setAttribute('aria-expanded', 'true');
          content.style.maxHeight = content.scrollHeight + 30 + 'px';
          content.style.opacity = '1';
          content.style.paddingTop = '12px';
          content.style.paddingBottom = '16px';
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
      }

      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        toggle();
      });

      trigger.addEventListener('keydown', function(e) {
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
