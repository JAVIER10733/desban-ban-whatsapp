/**
 * solicitud.js — Módulo Baneo
 */
'use strict';

// =============================================
// ESTADO GLOBAL
// =============================================
const state = {
  step:      1,
  numero:    '',
  motivo:    '',
  descripcion: '',
  nombre:    '',
  email:     '',
  plan:      'pro',
  precio:    49,
  prefContacto: 'email'
};

// =============================================
// UTILIDADES
// =============================================
const $  = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

function showError(id, show = true) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle('hidden', !show);
}

function markError(inputId, hasError) {
  const el = $(inputId);
  if (!el) return;
  el.classList.toggle('error', hasError);
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v) {
  return /^\d{6,15}$/.test(v.replace(/[\s\-()]/g, ''));
}

// =============================================
// NAVEGACIÓN DE PASOS
// =============================================
function goToStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  $(`step${n}`)?.classList.add('active');
  state.step = n;
  updateNavSteps(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavSteps(n) {
  document.querySelectorAll('.nav-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
}

// =============================================
// PASO 1 — VALIDACIÓN
// =============================================
function validateStep1() {
  let valid = true;

  const numVal = $('numero')?.value.trim();
  const numOk  = isValidPhone(numVal || '');
  showError('errorNumero', !numOk);
  markError('numero', !numOk);
  if (!numOk) valid = false;
  else state.numero = ($('phonePrefix')?.value || '') + ' ' + numVal;

  const motivoOk = !!state.motivo;
  showError('errorMotivo', !motivoOk);
  if (!motivoOk) valid = false;

  if (state.motivo === 'otro') {
    const otro = $('otroMotivo')?.value.trim();
    if (!otro || otro.length < 5) {
      showError('errorDescripcion', true);
      valid = false;
    }
  }

  const desc = $('descripcion')?.value.trim();
  const descOk = desc && desc.length >= 20;
  showError('errorDescripcion', !descOk);
  markError('descripcion', !descOk);
  if (!descOk) valid = false;
  else state.descripcion = desc;

  const aviso = $('aceptaAviso')?.checked;
  showError('errorAviso', !aviso);
  if (!aviso) valid = false;

  return valid;
}

$('nextStep1')?.addEventListener('click', () => {
  if (validateStep1()) {
    updateSummary();
    goToStep(2);
  }
});

// =============================================
// PASO 2 — VALIDACIÓN
// =============================================
function validateStep2() {
  let valid = true;

  const nombre = $('nombre')?.value.trim();
  const nombreOk = nombre && nombre.length >= 2;
  showError('errorNombre', !nombreOk);
  markError('nombre', !nombreOk);
  if (!nombreOk) valid = false;
  else state.nombre = nombre;

  const email = $('email')?.value.trim();
  const emailOk = isValidEmail(email || '');
  showError('errorEmail', !emailOk);
  markError('email', !emailOk);
  if (!emailOk) valid = false;
  else state.email = email;

  return valid;
}

$('nextStep2')?.addEventListener('click', () => {
  if (validateStep2()) {
    updateSummary();
    goToStep(3);
  }
});

$('backStep2')?.addEventListener('click', () => goToStep(1));
$('backStep3')?.addEventListener('click', () => goToStep(2));

// =============================================
// MOTIVOS
// =============================================
document.querySelectorAll('.motivo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.motivo-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.motivo = btn.dataset.value;
    showError('errorMotivo', false);
    const otroGroup = $('otroMotivoGroup');
    if (otroGroup) otroGroup.style.display = state.motivo === 'otro' ? 'flex' : 'none';
  });
});

// =============================================
// CONTADOR DE CARACTERES
// =============================================
$('descripcion')?.addEventListener('input', function() {
  const count = $('charCount');
  if (count) count.textContent = this.value.length;
  if (this.value.length >= 20) {
    showError('errorDescripcion', false);
    markError('descripcion', false);
  }
});

// =============================================
// UPLOAD DE ARCHIVOS
// =============================================
const uploadZone = $('evidenciaUpload');
const fileInput  = $('evidenciaFile');

uploadZone?.addEventListener('click', () => fileInput?.click());

uploadZone?.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--red)';
});

uploadZone?.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '';
});

uploadZone?.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  handleFiles(e.dataTransfer.files);
});

fileInput?.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
  const container = $('uploadFiles');
  if (!container) return;
  Array.from(files).forEach(file => {
    if (file.size > 5 * 1024 * 1024) return;
    const item = document.createElement('div');
    item.className = 'upload-file-item';
    item.innerHTML = `<span>📎 ${file.name}</span><span class="upload-file-remove" onclick="this.parentElement.remove()">✕</span>`;
    container.appendChild(item);
  });
}

// =============================================
// PREFERENCIAS DE CONTACTO
// =============================================
document.querySelectorAll('.pref-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pref-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.prefContacto = btn.dataset.value;
  });
});

// =============================================
// SELECCIÓN DE PLANES
// =============================================
document.querySelectorAll('.plan-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.plan-option').forEach(o => {
      o.classList.remove('selected');
      o.querySelector('.plan-radio')?.classList.remove('checked');
    });
    option.classList.add('selected');
    option.querySelector('.plan-radio')?.classList.add('checked');
    state.plan   = option.dataset.plan;
    state.precio = parseInt(option.dataset.price, 10);
    updateSummary();
    const payBtn = $('payBtnText');
    if (payBtn) payBtn.textContent = `Pagar $${state.precio} USD →`;
  });
});

// =============================================
// RESUMEN
// =============================================
function updateSummary() {
  const motivoLabels = {
    acoso:'Acoso o amenazas', spam:'Spam masivo', estafa:'Estafa o fraude',
    suplantacion:'Suplantación', 'contenido-ilegal':'Contenido ilegal', otro:'Otro motivo'
  };
  const planLabels = { basico:'Básico', pro:'Pro', enterprise:'Enterprise' };

  if ($('summaryNumero')) $('summaryNumero').textContent = state.numero || '—';
  if ($('summaryMotivo'))  $('summaryMotivo').textContent  = motivoLabels[state.motivo] || '—';
  if ($('summaryPlan'))   $('summaryPlan').textContent   = planLabels[state.plan] || '—';
  if ($('summaryTotal'))  $('summaryTotal').textContent  = `$${state.precio} USD`;
}

// =============================================
// TARJETA — FORMAT
// =============================================
$('cardNumber')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '').substring(0, 16);
  this.value = v.replace(/(.{4})/g, '$1 ').trim();
  const visa = $('brandVisa');
  const mc   = $('brandMC');
  if (visa) visa.classList.toggle('active', v.startsWith('4'));
  if (mc)   mc.classList.toggle('active', v.startsWith('5'));
});

$('cardExpiry')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + ' / ' + v.substring(2);
  this.value = v;
});

$('cardCvc')?.addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '').substring(0, 4);
});

// =============================================
// PAYLOAD API BANEO
// =============================================
function buildBaneoSolicitudPayload() {
  const ap = $('apellido')?.value.trim();
  const nombreFull = [state.nombre, ap].filter(Boolean).join(' ').trim() || state.nombre;
  return {
    numero: state.numero,
    motivo: state.motivo,
    descripcion: state.descripcion,
    plan: state.plan,
    nombre: nombreFull,
    email: state.email,
    aceptaAviso: true,
    prefContacto: state.prefContacto || 'email',
    otroMotivo: state.motivo === 'otro' ? ($('otroMotivo')?.value.trim() || null) : null
  };
}

function formatCasoNumero(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (s.startsWith('#')) return s;
  return '#' + s.replace(/^#/, '');
}

// =============================================
// PAGO
// =============================================
$('btnPay')?.addEventListener('click', async () => {
  const name   = $('cardName')?.value.trim();
  const number = $('cardNumber')?.value.replace(/\s/g, '');
  const expiry = $('cardExpiry')?.value.trim();
  const cvc    = $('cardCvc')?.value.trim();

  if (!name || number.length < 15 || !expiry || cvc.length < 3) {
    alert('Completa todos los datos de pago.');
    return;
  }

  const btn = $('btnPay');
  const txt = $('payBtnText');
  const spinner = $('paySpinner');

  btn.disabled = true;
  txt.textContent = 'Procesando...';
  spinner?.classList.remove('hidden');

  let caseNum = null;

  if (window.BaneoService) {
    try {
      const out = await window.BaneoService.crearSolicitud(buildBaneoSolicitudPayload());
      if (out && out.success && out.data) {
        caseNum =
          formatCasoNumero(out.data.caso_numero || out.data.id) ||
          formatCasoNumero(out.data.numero_caso);
      }
    } catch (e) {
      console.warn('[BaneoService] crearSolicitud:', e.message || e);
    }
  }

  if (!caseNum) {
    await new Promise(r => setTimeout(r, 2200));
    caseNum = '#BAN-' + Math.floor(1000 + Math.random() * 9000);
  }

  if ($('caseNumber')) $('caseNumber').textContent = caseNum;
  if ($('successNumero')) $('successNumero').textContent = state.numero || '—';
  if ($('successPlan')) $('successPlan').textContent = state.plan.charAt(0).toUpperCase() + state.plan.slice(1);
  if ($('successEmail')) $('successEmail').textContent = state.email || '—';

  spinner?.classList.add('hidden');

  goToStep(4);
});

// =============================================
// LEER ?plan= DE LA URL
// =============================================
(function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');
  if (plan) {
    const option = document.querySelector(`.plan-option[data-plan="${plan}"]`);
    if (option) option.click();
  }
  const motivo = params.get('motivo');
  if (motivo) {
    const btn = document.querySelector(`.motivo-btn[data-value="${motivo}"]`);
    if (btn) btn.click();
  }
})();