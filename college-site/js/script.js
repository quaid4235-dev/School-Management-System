// ============================================
// Mobile nav toggle
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when a link is tapped (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ============================================
  // Mark current page link as active
  // ============================================
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(function (link) {
    var linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // ============================================
  // Contact / Admission form handling (demo)
  // No backend is wired up — replace the fetch()
  // call below with your real form endpoint.
  // ============================================
  var form = document.querySelector('[data-form="contact"]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var requiredFields = form.querySelectorAll('[required]');
      var valid = true;

      requiredFields.forEach(function (field) {
        if (!field.value.trim()) valid = false;
      });

      if (!valid) {
        status.textContent = 'Please fill in all required fields.';
        status.className = 'form-status error';
        return;
      }

      // Placeholder success state — wire this to your real backend,
      // e.g. a POST to your hosting provider's form-handling script.
      status.textContent = 'Thank you — your message has been received. We will respond shortly.';
      status.className = 'form-status success';
      form.reset();
    });
  }
});
