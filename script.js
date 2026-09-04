document.addEventListener('DOMContentLoaded', function () {
  initMenu();
  initPlanSelection();
  initForm();
});

function initMenu() {
  var button = document.querySelector('.menu-button');
  var nav = document.querySelector('header nav');
  if (!button || !nav) return;
  var mobile = window.matchMedia('(max-width: 1100px)');
  var icon = button.querySelector('i');
  nav.id = nav.id || 'primary-navigation';
  nav.setAttribute('aria-label', 'Navegação principal');
  button.setAttribute('aria-controls', nav.id);

  function setOpen(value, returnFocus) {
    var open = Boolean(value && mobile.matches);
    nav.classList.toggle('active', open);
    button.classList.toggle('active', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('nav-locked', open);
    if (mobile.matches) nav.setAttribute('aria-hidden', String(!open));
    else nav.removeAttribute('aria-hidden');
    if (icon) {
      icon.classList.toggle('fa-bars', !open);
      icon.classList.toggle('fa-times', open);
    }
    if (!open && returnFocus) button.focus();
  }

  var page = window.location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  nav.querySelectorAll('a[href]').forEach(function (link) {
    var target = link.getAttribute('href').split('#')[0].replace(/\.html$/, '');
    if (target === page) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', function () { setOpen(false, false); });
  });
  button.addEventListener('click', function () { setOpen(!nav.classList.contains('active'), false); });
  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target) && !button.contains(event.target)) setOpen(false, false);
  });
  document.addEventListener('keydown', function (event) {
    if (!nav.classList.contains('active')) return;
    if (event.key === 'Escape') setOpen(false, true);
    // Keep keyboard navigation within the expanded mobile navigation.
    if (event.key === 'Tab') {
      var links = nav.querySelectorAll('a[href]');
      var last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === button) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        button.focus();
      }
    }
  });
  var sync = function () { setOpen(false, false); };
  if (mobile.addEventListener) mobile.addEventListener('change', sync);
  else mobile.addListener(sync);
  setOpen(false, false);
}

function initPlanSelection() {
  var select = document.querySelector('select[name="service"]');
  if (!select) return;
  var plans = { starter: 'site-starter', business: 'site-business', premium: 'site-premium', enterprise: 'site-enterprise' };
  var params = new URLSearchParams(window.location.search);
  var value = plans[params.get('plan')];
  var service = params.get('service');
  var options = Array.from(select.options).map(function (option) { return option.value; });
  if (service && options.includes(service)) value = service;
  if (options.includes(value)) select.value = value;
}

function initForm() {
  document.querySelectorAll('form[data-secure-contact]').forEach(function (form, index) {
    form.noValidate = true;
    var status = document.createElement('p');
    status.className = 'form-status';
    status.id = 'contact-status-' + index;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    form.appendChild(status);
    form.querySelectorAll('input:not([type="hidden"]):not(.hp-field), textarea, select').forEach(function (field) {
      var error = document.createElement('span');
      error.className = 'field-error';
      error.id = 'contact-error-' + index + '-' + field.name;
      field.setAttribute('aria-describedby', error.id);
      field.after(error);
      field.addEventListener('input', function () {
        field.removeAttribute('aria-invalid');
        error.textContent = '';
      });
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (form.getAttribute('aria-busy') === 'true') return;
      submitSecureContact(form, status);
    });
  });
}

function contactStatus(status, message, type) {
  status.className = 'form-status is-' + type;
  status.textContent = message;
}

async function submitSecureContact(form, status) {
  form.querySelectorAll('[aria-invalid]').forEach(function (field) { field.removeAttribute('aria-invalid'); });
  form.querySelectorAll('.field-error').forEach(function (error) { error.textContent = ''; });
  var validation = validateContactForm(form);
  if (!validation.ok) {
    contactStatus(status, 'Revise os campos indicados antes de enviar.', 'error');
    if (validation.field) {
      validation.field.setAttribute('aria-invalid', 'true');
      document.getElementById(validation.field.getAttribute('aria-describedby')).textContent = validation.message;
      validation.field.focus();
    } else contactStatus(status, validation.message, 'error');
    return;
  }
  var button = form.querySelector('button[type="submit"]');
  var label = button.textContent;
  var data = new FormData(form);
  var controls = Array.from(form.elements).filter(function (control) { return control !== button; });
  var disabled = controls.map(function (control) { return control.disabled; });
  controls.forEach(function (control) { control.disabled = true; });
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, 20000);
  form.setAttribute('aria-busy', 'true');
  button.disabled = true;
  button.textContent = 'Enviando...';
  contactStatus(status, 'Enviando sua mensagem.', 'pending');
  try {
    var response = await fetch(form.getAttribute('action') || '/api/contact', {
      method: 'POST', headers: { Accept: 'application/json' }, body: data,
      credentials: 'same-origin', signal: controller.signal
    });
    var payload = await response.json().catch(function () { return {}; });
    if (!response.ok || payload.ok !== true) {
      throw new Error(payload.message || 'Não foi possível confirmar o recebimento. Seus dados foram mantidos.');
    }
    form.reset();
    contactStatus(status, 'Mensagem recebida. Retornaremos em até 24 horas úteis.', 'success');
  } catch (error) {
    var message = error.name === 'AbortError'
      ? 'O servidor demorou a responder. Não foi possível confirmar o envio. Seus dados foram mantidos; confirme o recebimento com a equipe antes de reenviar.'
      : (error instanceof TypeError ? 'Sem conexão com o atendimento. Verifique sua internet e tente novamente. Seus dados foram mantidos.' : error.message);
    contactStatus(status, message, 'error');
  } finally {
    clearTimeout(timeout);
    form.removeAttribute('aria-busy');
    controls.forEach(function (control, index) { control.disabled = disabled[index]; });
    button.disabled = false;
    button.textContent = label;
  }
}

function validateContactForm(form) {
  var fields = ['name', 'email', 'company', 'message'].map(function (name) { return form.elements.namedItem(name); }).filter(Boolean);
  var honeypot = form.elements.namedItem('_gotcha');
  if (honeypot && honeypot.value.trim()) return { ok: false, message: 'Envio bloqueado pela proteção antispam.' };
  var suspicious = /(<\s*script|<\/|javascript:|on\w+\s*=|data:text\/html|<\s*(iframe|object|embed|form|svg|math))/i;
  var required = { name: 'Preencha seu nome.', email: 'Preencha seu e-mail.', message: 'Conte um pouco sobre seu projeto ou dúvida.' };
  var limits = { name: 80, email: 120, company: 120, message: 1200 };
  for (var field of fields) {
    field.value = field.value.trim();
    if (required[field.name] && !field.value) return { ok: false, field: field, message: required[field.name] };
    if (field.value.length > limits[field.name]) return { ok: false, field: field, message: 'Use até ' + limits[field.name] + ' caracteres.' };
    if (suspicious.test(field.value)) return { ok: false, field: field, message: 'Use apenas texto, sem código HTML.' };
    if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) return { ok: false, field: field, message: 'Informe um e-mail válido.' };
  }
  return { ok: true };
}
