// Mobile nav toggle
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
});
