import { FIELDS, GROUPS, fieldError, FILE_TYPES, MAX_FILES, MAX_FILE_BYTES, MAX_FILES_BYTES } from './briefing-schema.js';

const form = document.getElementById('briefingForm');
const steps = [...document.querySelectorAll('.step')];
const indicators = [...document.querySelectorAll('.step-indicator')];
const next = document.getElementById('nextBtn');
const back = document.getElementById('backBtn');
const status = document.getElementById('briefingStatus');
const fileInput = document.getElementById('referencias_arquivos');
const upload = fileInput.closest('.upload');
const done = document.getElementById('done');
let current = 0;
let furthest = 0;
let sending = false;
let dirty = false;
let files = [];
let submissionId = crypto.randomUUID();
let completedSummary = '';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function controls(name) {
  return [...form.elements].filter(control => control.name === name);
}

function setFieldError(name, message) {
  const inputs = controls(name);
  const field = inputs[0].closest('.field');
  let error = field.querySelector('.error');
  if (!error) { error = element('p', '', 'error'); field.append(error); }
  error.id = name + '-error';
  error.textContent = message;
  error.hidden = !message;
  field.classList.toggle('invalid', !!message);
  for (const input of inputs) {
    input.setAttribute('aria-invalid', String(!!message));
    const ids = new Set((input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    ids.add(error.id);
    input.setAttribute('aria-describedby', [...ids].join(' '));
  }
}

function validateStep(index, focus = true) {
  const data = new FormData(form);
  let first = '';
  for (const [name, field] of Object.entries(FIELDS)) {
    if (field.step !== index) continue;
    const error = fieldError(field, data.getAll(name));
    setFieldError(name, error);
    if (error && !first) first = name;
  }
  if (first && focus) controls(first)[0].focus();
  return !first;
}

function summaryGroups() {
  const data = new FormData(form);
  return GROUPS.map(group => ({
    ...group,
    text: group.names.map(name => `${FIELDS[name].label}: ${data.getAll(name).map(value => value.trim()).filter(Boolean).join(', ') || 'Não informado'}`).join('\n\n')
  }));
}

function renderReview() {
  const review = document.getElementById('review');
  review.replaceChildren();
  for (const group of summaryGroups()) {
    const card = element('section', '', 'review-card');
    const edit = element('button', 'Editar esta etapa');
    edit.type = 'button';
    edit.addEventListener('click', () => showStep(FIELDS[group.names[0]].step));
    card.append(element('h3', group.title), element('p', group.text), edit);
    review.append(card);
  }
  const attachments = element('section', '', 'review-card');
  attachments.append(element('h3', 'Anexos'), element('p', files.map(file => file.name).join('\n') || 'Nenhum arquivo anexado'));
  review.append(attachments);
}

function showStep(index, focus = true) {
  current = index;
  furthest = Math.max(furthest, index);
  steps.forEach((step, i) => step.classList.toggle('active', i === index));
  indicators.forEach((button, i) => {
    button.classList.toggle('active', i === index);
    button.classList.toggle('done', i < index);
    button.disabled = sending || i > furthest;
    if (i === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  back.disabled = index === 0 || sending;
  next.textContent = index === 0 ? 'Começar' : index === 7 ? 'Enviar briefing' : 'Continuar';
  next.disabled = sending;
  if (index === 7) renderReview();
  if (focus) {
    steps[index].querySelector('h2').focus();
    const wrap = document.querySelector('.stepper-wrap');
    wrap.scrollLeft = Math.max(0, indicators[index].offsetLeft - wrap.offsetLeft - wrap.clientWidth / 2);
  }
}

function message(text) {
  status.textContent = text;
  status.hidden = !text;
}

function changed() {
  dirty = true;
  submissionId = crypto.randomUUID();
  message('');
}

function renderFiles() {
  const list = document.getElementById('fileList');
  list.replaceChildren();
  files.forEach((file, index) => {
    const item = element('li');
    const remove = element('button');
    remove.type = 'button';
    remove.title = 'Remover ' + file.name;
    remove.setAttribute('aria-label', remove.title);
    const icon = element('i', '', 'fas fa-trash-can');
    icon.setAttribute('aria-hidden', 'true');
    remove.append(icon);
    remove.addEventListener('click', () => {
      files.splice(index, 1);
      changed();
      renderFiles();
      document.getElementById('uploadError').hidden = true;
      fileInput.focus();
    });
    item.append(element('span', `${file.name} (${Math.ceil(file.size / 1024)} KB)`), remove);
    list.append(item);
  });
}

function addFiles(incoming) {
  const proposed = [...files];
  for (const file of incoming) {
    if (!proposed.some(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified)) proposed.push(file);
  }
  let error = '';
  if (proposed.length > MAX_FILES) error = 'Anexe no máximo 3 arquivos.';
  else if (proposed.some(file => !file.size || file.size > MAX_FILE_BYTES)) error = 'Cada arquivo precisa ter conteúdo e no máximo 1 MB.';
  else if (proposed.some(file => !FILE_TYPES.includes(file.name.split('.').pop().toLowerCase()))) error = 'Use arquivos PNG, JPG, WEBP, PDF ou ZIP.';
  else if (proposed.reduce((sum, file) => sum + file.size, 0) > MAX_FILES_BYTES) error = 'Os anexos juntos podem ter até 2 MB.';
  const output = document.getElementById('uploadError');
  output.textContent = error;
  output.hidden = !error;
  fileInput.value = '';
  if (error) return;
  files = proposed;
  changed();
  renderFiles();
}

async function submit() {
  if (sending) return;
  for (let index = 1; index < 7; index++) {
    if (!validateStep(index, false)) { showStep(index); validateStep(index); return; }
  }
  const consent = document.getElementById('consentimento');
  const consentError = document.getElementById('consent-error');
  consentError.textContent = consent.checked ? '' : 'Confirme a autorização para enviar o briefing.';
  consentError.hidden = consent.checked;
  consent.setAttribute('aria-describedby', 'consent-error');
  consent.setAttribute('aria-invalid', String(!consent.checked));
  if (!consent.checked) { consent.focus(); return; }

  const data = new FormData(form);
  data.delete('referencias_arquivos');
  files.forEach(file => data.append('referencias_arquivos', file));
  data.set('submission_id', submissionId);
  const summary = ['BRIEFING - BYTESTORM TECH', ...summaryGroups().map(group => `${group.title}\n${group.text}`), 'Anexos: ' + (files.map(file => file.name).join(', ') || 'Nenhum')].join('\n\n');
  sending = true;
  message('');
  const activeControls = [...form.elements].filter(control => !control.disabled);
  activeControls.forEach(control => { control.disabled = true; });
  indicators.forEach(button => { button.disabled = true; });
  form.setAttribute('aria-busy', 'true');
  next.textContent = 'Enviando...';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !/^[a-f0-9-]{36}$/.test(result.receipt || '')) {
      if (result?.field && FIELDS[result.field]) {
        showStep(FIELDS[result.field].step);
        setFieldError(result.field, result.message);
      }
      throw new Error(response.status === 429 ? 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.' : result?.message || 'Não foi possível confirmar o recebimento. Tente novamente.');
    }
    completedSummary = `${summary}\n\nProtocolo: ${result.receipt}`;
    dirty = false;
    form.hidden = true;
    document.querySelector('.stepper-wrap').hidden = true;
    done.classList.add('active');
    document.getElementById('receipt').textContent = 'Protocolo: ' + result.receipt;
    document.getElementById('doneMessage').textContent = 'Recebemos suas respostas e anexos. A equipe da ByteStorm Tech entrará em contato pelos dados informados.';
    done.querySelector('h2').focus();
  } catch (error) {
    message((error.name === 'AbortError' ? 'O envio demorou mais que o esperado. Tente novamente para confirmar o recebimento.' : error.message) + ' Suas respostas continuam nesta aba.');
    status.scrollIntoView({ block: 'center' });
  } finally {
    clearTimeout(timeout);
    sending = false;
    form.removeAttribute('aria-busy');
    activeControls.forEach(control => { control.disabled = false; });
    if (!form.hidden) showStep(current, false);
  }
}

next.addEventListener('click', () => {
  if (current === 7) return submit();
  if (validateStep(current)) showStep(current + 1);
});
back.addEventListener('click', () => showStep(current - 1));
indicators.forEach((button, index) => button.addEventListener('click', () => {
  if (index <= current || validateStep(current)) showStep(index);
}));
form.addEventListener('submit', event => { event.preventDefault(); next.click(); });
form.addEventListener('input', event => {
  changed();
  const name = event.target.name;
  if (FIELDS[name] && event.target.closest('.field').classList.contains('invalid')) setFieldError(name, fieldError(FIELDS[name], new FormData(form).getAll(name)));
  if (name === 'consentimento') document.getElementById('consent-error').hidden = event.target.checked;
});
fileInput.addEventListener('change', () => addFiles([...fileInput.files]));
upload.addEventListener('dragover', event => { event.preventDefault(); if (!sending) upload.classList.add('dragging'); });
upload.addEventListener('dragleave', () => upload.classList.remove('dragging'));
upload.addEventListener('drop', event => { event.preventDefault(); upload.classList.remove('dragging'); if (!sending) addFiles([...event.dataTransfer.files]); });
window.addEventListener('beforeunload', event => { if (dirty && !form.hidden) { event.preventDefault(); event.returnValue = ''; } });

const copyStatus = element('p');
copyStatus.id = 'copyStatus';
copyStatus.setAttribute('role', 'status');
done.querySelector('.done-inner').append(copyStatus);
document.getElementById('downloadBtn').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([completedSummary], { type: 'text/plain;charset=utf-8' }));
  const link = element('a');
  link.href = url;
  link.download = 'briefing-bytestorm.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById('copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(completedSummary); copyStatus.textContent = 'Resumo copiado.'; }
  catch { copyStatus.textContent = 'Não foi possível copiar. Use Baixar resumo para guardar o arquivo.'; }
});
document.getElementById('newBtn').addEventListener('click', () => {
  form.reset();
  form.querySelectorAll('.field.invalid').forEach(field => field.classList.remove('invalid'));
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  document.getElementById('consent-error').hidden = true;
  document.getElementById('uploadError').hidden = true;
  files = [];
  completedSummary = '';
  submissionId = crypto.randomUUID();
  furthest = 0;
  renderFiles();
  message('');
  copyStatus.textContent = '';
  done.classList.remove('active');
  form.hidden = false;
  document.querySelector('.stepper-wrap').hidden = false;
  showStep(0);
});
showStep(0, false);
