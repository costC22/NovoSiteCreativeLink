document.addEventListener('DOMContentLoaded', function () {
  initMenu();
  initDropdowns();
  initSmoothScroll();
  initForm();
  initScrollEffects();
  initCounters();
  initReveal();
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

// Legacy dropdown disabled: Soluções now opens its own page.
function initDropdowns() {
  return;
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
    var company = form.querySelector('[name="company"]');
    var honeypot = form.querySelector('[name="_gotcha"]');
    var fields = [name, email, company, message].filter(Boolean);
    var suspiciousPattern = /(<\s*script|<\/|javascript:|on\w+\s*=|data:text\/html|<\s*(iframe|object|embed|form))/i;
    var maxLengthByName = { name: 80, email: 120, company: 120, message: 1200 };

    if (honeypot && honeypot.value.trim()) {
      e.preventDefault();
      return;
    }

    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      field.value = field.value.trim();
      var maxLength = maxLengthByName[field.name];
      if (maxLength && field.value.length > maxLength) {
        e.preventDefault();
        showNotification('Campo muito longo.', 'error');
        return;
      }
      if (suspiciousPattern.test(field.value)) {
        e.preventDefault();
        showNotification('Conteudo nao permitido no formulario.', 'error');
        return;
      }
    }
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

// Contadores animados (hero stats)
function initCounters() {
  var counters = document.querySelectorAll('.stat-num[data-count]');
  if (!counters.length) return;

  var animated = false;

  function animateCounters() {
    if (animated) return;
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var duration = 1800;
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        el.textContent = Math.floor(progress * target);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }

      requestAnimationFrame(step);
    });
    animated = true;
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounters();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(counters[0].closest('.hero-stats') || counters[0]);
  } else {
    animateCounters();
  }
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

// Reveal discreto para cards e secoes
function initReveal() {
  var items = document.querySelectorAll(
    '.service-box, .service-item, .workflow-step, .automacao-card, .tech-item, .value-item, .testimonial-item, .contact-item, .ops-console'
  );

  if (!items.length) return;

  items.forEach(function (item) {
    item.classList.add('reveal-ready');
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (item) {
      item.classList.add('is-visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(function (item) {
    observer.observe(item);
  });
}
