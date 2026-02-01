document.addEventListener('DOMContentLoaded', function () {
  initMenu();
  initDropdowns();
  initSmoothScroll();
  initForm();
  initScrollEffects();
});

// Menu mobile
function initMenu() {
  var menuBtn = document.querySelector('.menu-button');
  var nav = document.querySelector('nav');

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener('click', function () {
    nav.classList.toggle('active');
    menuBtn.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
  });

  document.querySelectorAll('nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('active');
      menuBtn.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
      nav.classList.remove('active');
      menuBtn.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Dropdowns (mobile: clique para abrir)
function initDropdowns() {
  var hasDropdown = document.querySelectorAll('.has-dropdown');

  hasDropdown.forEach(function (item) {
    var link = item.querySelector('a');
    if (!link) return;

    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        item.classList.toggle('active');
      }
    });
  });
}

// Scroll suave para âncoras
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var header = document.querySelector('header');
        var topBar = document.querySelector('.top-bar');
        var offset = (header ? header.offsetHeight : 0) + (topBar ? topBar.offsetHeight : 0);
        var pos = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
          top: pos,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Formulário: validação e notificação (envio real via Formspree)
function initForm() {
  var form = document.querySelector('form[action*="formspree"]');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    var name = form.querySelector('[name="name"]');
    var email = form.querySelector('[name="email"]');
    var message = form.querySelector('[name="message"]');

    if (name && !name.value.trim()) {
      e.preventDefault();
      showNotification('Preencha seu nome.', 'error');
      return;
    }
    if (email && !email.value.trim()) {
      e.preventDefault();
      showNotification('Preencha seu e-mail.', 'error');
      return;
    }
    if (message && !message.value.trim()) {
      e.preventDefault();
      showNotification('Preencha a mensagem.', 'error');
      return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email.value)) {
      e.preventDefault();
      showNotification('Use um e-mail válido.', 'error');
      return;
    }

    showNotification('Enviando mensagem...', 'info');
    // Formspree processa o envio; a página de sucesso do Formspree ou redirect exibirá confirmação
  });
}

function showNotification(message, type) {
  type = type || 'info';
  var existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.className = 'notification-toast notification-' + type;
  el.textContent = message;
  el.style.cssText =
    'position:fixed;top:20px;right:20px;padding:1rem 1.5rem;border-radius:8px;color:#fff;font-weight:500;z-index:10000;' +
    'max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.3s ease;';

  var colors = {
    success: '#00c0a3',
    error: '#e74c3c',
    info: '#1a1f33'
  };
  el.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(el);

  requestAnimationFrame(function () {
    el.style.transform = 'translateX(0)';
  });

  setTimeout(function () {
    el.style.transform = 'translateX(120%)';
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }, 4500);
}

// Efeito de header no scroll (opcional)
function initScrollEffects() {
  var header = document.querySelector('header');
  if (!header) return;

  var lastScroll = 0;
  window.addEventListener(
    'scroll',
    function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y <= 0) {
        header.classList.remove('scroll-up');
        return;
      }
      if (y > lastScroll) {
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
      } else {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
      }
      lastScroll = y;
    },
    { passive: true }
  );
}
