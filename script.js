// Mobile nav toggle
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqMGXR5JMD0ujRlnEdoCqJj0F88GJaRePPMlf0D0SZocbUmAu-LPsUPoLigt61Q7wC/exec";

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('nav.primary');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
    });
  }

  // Booking slot picker
  const slots = document.querySelectorAll('.slot');
  const hidden = document.getElementById('chosen-slot');
  slots.forEach(s => {
    s.addEventListener('click', () => {
      slots.forEach(o => o.classList.remove('selected'));
      s.classList.add('selected');
      if (hidden) hidden.value = s.textContent.trim();
    });
  });

  // Form submissions -> Google Sheet backend
  document.querySelectorAll('form.gs-form').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

      const formData = new FormData(form);

      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData })
        .then(() => {
          form.innerHTML = '<p style="font-family:\'Plus Jakarta Sans\',sans-serif; font-weight:700; color:#171410; font-size:16px; margin:0;">Thank you! We\'ve received your submission and will get back to you soon.</p>';
        })
        .catch(() => {
          if (btn) { btn.disabled = false; btn.textContent = originalText; }
          alert('Something went wrong sending this. Please try again, or reach us directly at talk2ushaldwani@gmail.com or +91 6395763571.');
        });
    });
  });
});
