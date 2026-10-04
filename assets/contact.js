/**
 * Axel Karambizi Portfolio - Contact Form Engine
 * Handles direct email delivery to papilocostaa@gmail.com via FormSubmit AJAX API,
 * with real-time UI feedback, local message archiving, and seamless mailto fallback.
 */
(function () {
  'use strict';

  var RECIPIENT_EMAIL = 'papilocostaa@gmail.com';

  function initContactForms() {
    var forms = document.querySelectorAll('form.framer-Wl1KU, #contact form, .framer-owrpuq form');
    if (!forms.length) return;

    forms.forEach(function (form) {
      // Set native fallback attributes
      if (!form.getAttribute('action') || form.getAttribute('action') === '#') {
        form.setAttribute('action', 'https://formsubmit.co/' + RECIPIENT_EMAIL);
        form.setAttribute('method', 'POST');
      }

      // Add hidden inputs for FormSubmit if not present
      if (!form.querySelector('input[name="_captcha"]')) {
        var captchaInput = document.createElement('input');
        captchaInput.type = 'hidden';
        captchaInput.name = '_captcha';
        captchaInput.value = 'false';
        form.appendChild(captchaInput);
      }

      if (!form.querySelector('input[name="_template"]')) {
        var tmplInput = document.createElement('input');
        tmplInput.type = 'hidden';
        tmplInput.name = '_template';
        tmplInput.value = 'table';
        form.appendChild(tmplInput);
      }

      // Create status message container
      var statusBox = form.querySelector('.contact-status-box');
      if (!statusBox) {
        statusBox = document.createElement('div');
        statusBox.className = 'contact-status-box';
        statusBox.style.cssText = 'display:none;width:100%;margin-top:16px;padding:14px 18px;border-radius:14px;font-size:14px;font-family:sans-serif;line-height:1.5;transition:all 0.3s ease;box-sizing:border-box;';
        
        // Insert right after submit button container
        var btnWrap = form.querySelector('.framer-2o1wbf-container') || form.querySelector('button[type="submit"]');
        if (btnWrap && btnWrap.parentNode) {
          btnWrap.parentNode.insertBefore(statusBox, btnWrap.nextSibling);
        } else {
          form.appendChild(statusBox);
        }
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var nameInput = form.querySelector('input[name="Name"]');
        var emailInput = form.querySelector('input[name="Email"]');
        var serviceInput = form.querySelector('select[name="Service"]');
        var messageInput = form.querySelector('textarea[name="Text Area"]') || form.querySelector('textarea[name="Message"]');
        var submitBtn = form.querySelector('button[type="submit"]');
        var submitText = submitBtn ? (submitBtn.querySelector('h4, span, p') || submitBtn) : null;
        var originalBtnText = submitText ? submitText.textContent : 'Submit';

        var name = nameInput ? nameInput.value.trim() : '';
        var email = emailInput ? emailInput.value.trim() : '';
        var service = serviceInput ? serviceInput.value.trim() : 'General Inquiry';
        var message = messageInput ? messageInput.value.trim() : '';

        if (!name || !email || !message) {
          statusBox.style.display = 'block';
          statusBox.style.background = 'rgba(255, 68, 68, 0.12)';
          statusBox.style.border = '1px solid rgba(255, 68, 68, 0.4)';
          statusBox.style.color = '#ff4444';
          statusBox.innerHTML = '⚠️ Please fill out your name, email and message.';
          return;
        }

        // Loading UI state
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.75';
          if (submitText) submitText.textContent = 'Sending...';
        }
        statusBox.style.display = 'block';
        statusBox.style.background = 'rgba(106, 113, 223, 0.12)';
        statusBox.style.border = '1px solid rgba(106, 113, 223, 0.4)';
        statusBox.style.color = '#5e67e6';
        statusBox.innerHTML = '⏳ Delivering your message to ' + RECIPIENT_EMAIL + '...';

        var subjectText = 'New Portfolio Inquiry from ' + name + ' (' + (service || 'Let’s work together') + ')';
        var payload = {
          _subject: subjectText,
          _replyto: email,
          _template: 'table',
          _captcha: 'false',
          'Sender Name': name,
          'Sender Email': email,
          'Service Needed': service,
          'Message': message,
          'Sent At': new Date().toLocaleString()
        };

        var delivered = false;

        // 1. Deliver to papilocostaa@gmail.com via FormSubmit AJAX
        try {
          var res = await fetch('https://formsubmit.co/ajax/' + RECIPIENT_EMAIL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            delivered = true;
          }
        } catch (err) {
          console.warn('FormSubmit AJAX request notice:', err);
        }

        // 2. Also record locally to server if active (/api/contact)
        try {
          await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name,
              email: email,
              service: service,
              message: message
            })
          });
        } catch (_) {}

        // Reset button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
        }

        if (delivered) {
          statusBox.style.display = 'block';
          statusBox.style.background = 'rgba(11, 222, 102, 0.15)';
          statusBox.style.border = '1px solid #0bde66';
          statusBox.style.color = '#0bde66';
          statusBox.innerHTML = '✅ <strong>Thank you, ' + name + '!</strong> Your message has been sent successfully to <strong>' + RECIPIENT_EMAIL + '</strong>. Axel will review it and reply to your email soon.';
          if (submitText) submitText.textContent = 'Sent Successfully!';
          form.reset();

          setTimeout(function () {
            if (submitText) submitText.textContent = originalBtnText;
          }, 6000);
        } else {
          // Fallback to mailto if external fetch is blocked
          statusBox.style.display = 'block';
          statusBox.style.background = 'rgba(11, 222, 102, 0.15)';
          statusBox.style.border = '1px solid #0bde66';
          statusBox.style.color = '#0bde66';
          statusBox.innerHTML = 'Opening your email client to send to <strong>' + RECIPIENT_EMAIL + '</strong>... If it didn’t open, <a href="mailto:' + RECIPIENT_EMAIL + '?subject=' + encodeURIComponent(subjectText) + '&body=' + encodeURIComponent('Hi Axel,\n\nName: ' + name + '\nEmail: ' + email + '\nService: ' + service + '\n\nMessage:\n' + message) + '" style="color:#6a71df;text-decoration:underline;font-weight:700;">click here to send directly</a>.';

          window.location.href = 'mailto:' + RECIPIENT_EMAIL + '?subject=' + encodeURIComponent(subjectText) + '&body=' + encodeURIComponent('Hi Axel,\n\nName: ' + name + '\nEmail: ' + email + '\nService: ' + service + '\n\nMessage:\n' + message);
          if (submitText) submitText.textContent = originalBtnText;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForms);
  } else {
    initContactForms();
  }
})();
