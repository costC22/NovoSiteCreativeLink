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
    document.body.classList.toggle('nav-locked', nav.classList.contains('active'));
  });

  document.querySelectorAll('nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('active');
      menuBtn.classList.remove('active');
      document.body.classList.remove('nav-locked');
    });
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
      nav.classList.remove('active');
      menuBtn.classList.remove('active');
      document.body.classList.remove('nav-locked');
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

// Formulario seguro: validacao no cliente e envio via funcao server-side
function initForm() {
  document.querySelectorAll('form[data-secure-contact]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitSecureContact(form);
    });
  });
}

function submitSecureContact(form) {
  var validation = validateContactForm(form);
  if (!validation.ok) {
    showNotification(validation.message, 'error');
    return;
  }

  var submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
    submitButton.setAttribute('aria-busy', 'true');
  }

  showNotification('Enviando mensagem com seguranca...', 'info');

  fetch(form.getAttribute('action') || '/api/contact', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new FormData(form),
    credentials: 'same-origin'
  })
    .then(function (response) {
      return response
        .json()
        .catch(function () {
          return {};
        })
        .then(function (payload) {
          if (!response.ok || payload.ok === false) {
            throw new Error(payload.message || 'Nao foi possivel enviar agora. Tente novamente em alguns minutos.');
          }
          form.reset();
          showNotification(payload.message || 'Mensagem enviada com seguranca.', 'success');
        });
    })
    .catch(function (error) {
      showNotification(error.message || 'Falha temporaria no envio seguro.', 'error');
    })
    .finally(function () {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
        submitButton.removeAttribute('aria-busy');
      }
    });
}

function validateContactForm(form) {
  var name = form.querySelector('[name="name"]');
  var email = form.querySelector('[name="email"]');
  var message = form.querySelector('[name="message"]');
  var company = form.querySelector('[name="company"]');
  var honeypot = form.querySelector('[name="_gotcha"]');
  var fields = [name, email, company, message].filter(Boolean);
  var suspiciousPattern = /(<\s*script|<\/|javascript:|on\w+\s*=|data:text\/html|<\s*(iframe|object|embed|form|svg|math))/i;
  var maxLengthByName = { name: 80, email: 120, company: 120, message: 1200 };

  if (honeypot && honeypot.value.trim()) {
    return { ok: false, message: 'Envio bloqueado por protecao antispam.' };
  }

  for (var i = 0; i < fields.length; i += 1) {
    var field = fields[i];
    field.value = field.value.trim();
    var maxLength = maxLengthByName[field.name];
    if (maxLength && field.value.length > maxLength) {
      return { ok: false, message: 'Campo muito longo.' };
    }
    if (suspiciousPattern.test(field.value)) {
      return { ok: false, message: 'Conteudo nao permitido no formulario.' };
    }
  }

  if (name && !name.value.trim()) {
    return { ok: false, message: 'Preencha seu nome.' };
  }
  if (email && !email.value.trim()) {
    return { ok: false, message: 'Preencha seu e-mail.' };
  }
  if (message && !message.value.trim()) {
    return { ok: false, message: 'Preencha a mensagem.' };
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email.value)) {
    return { ok: false, message: 'Use um e-mail valido.' };
  }

  return { ok: true };
}

function showNotification(message, type) {
  type = type || 'info';
  var existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.className = 'notification-toast notification-' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.textContent = message;

  document.body.appendChild(el);

  requestAnimationFrame(function () {
    el.classList.add('is-visible');
  });

  setTimeout(function () {
    el.classList.remove('is-visible');
    el.classList.add('is-hiding');
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
