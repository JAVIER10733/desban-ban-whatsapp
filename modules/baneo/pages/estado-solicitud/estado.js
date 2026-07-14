/**
 * estado.js — Módulo Shared / Estado de solicitud
 */
'use strict';

// NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// =============================================
// DATOS MOCK — simulan respuesta de la API
// =============================================
const MOCK_CASOS = {
  'DES-4821': {
    num: '#DES-4821', tipo: 'desbaneo', numero: '+52 55 ···· 4782',
    plan: 'Pro', fecha: '18 mar 2025', estado: 'en-proceso',
    progreso: 3,
    timeline: [
      { estado: 'done',    titulo: 'Solicitud recibida',    desc: 'Tu caso fue registrado correctamente.',          tiempo: 'Hace 2 días' },
      { estado: 'done',    titulo: 'Diagnóstico completado',desc: 'Confirmamos que el número puede ser recuperado.', tiempo: 'Hace 2 días' },
      { estado: 'active',  titulo: 'Apelación enviada',     desc: 'Enviamos la solicitud formal a Meta.',           tiempo: 'Hace 1 día'  },
      { estado: 'pending', titulo: 'Esperando respuesta',   desc: 'Meta está revisando la apelación.',              tiempo: 'Pendiente'   },
      { estado: 'pending', titulo: 'Número recuperado',     desc: 'Acceso restaurado.',                            tiempo: 'Pendiente'   },
    ]
  },
  'BAN-1203': {
    num: '#BAN-1203', tipo: 'baneo', numero: '+57 31 ···· 9901',
    plan: 'Básico', fecha: '17 mar 2025', estado: 'completado',
    progreso: 5,
    timeline: [
      { estado: 'done', titulo: 'Solicitud recibida',    desc: 'Reporte registrado.',                          tiempo: 'Hace 3 días' },
      { estado: 'done', titulo: 'Revisión del caso',     desc: 'Reporte verificado como legítimo.',            tiempo: 'Hace 3 días' },
      { estado: 'done', titulo: 'Reporte enviado',       desc: 'Reporte formal enviado a Meta.',               tiempo: 'Hace 2 días' },
      { estado: 'done', titulo: 'Meta procesó el caso',  desc: 'Meta confirmó la recepción del reporte.',      tiempo: 'Hace 1 día'  },
      { estado: 'done', titulo: 'Número baneado',        desc: 'El número fue baneado exitosamente.',          tiempo: 'Hace 6 horas'},
    ]
  },
  'DES-3390': {
    num: '#DES-3390', tipo: 'desbaneo', numero: '+34 61 ···· 3344',
    plan: 'Business', fecha: '15 mar 2025', estado: 'pendiente',
    progreso: 1,
    timeline: [
      { estado: 'done',    titulo: 'Solicitud recibida', desc: 'Caso registrado. Esperamos pago.', tiempo: 'Hace 5 días' },
      { estado: 'pending', titulo: 'Diagnóstico',        desc: 'Pendiente.',                       tiempo: 'Pendiente'  },
      { estado: 'pending', titulo: 'Apelación',          desc: 'Pendiente.',                       tiempo: 'Pendiente'  },
      { estado: 'pending', titulo: 'Respuesta Meta',     desc: 'Pendiente.',                       tiempo: 'Pendiente'  },
      { estado: 'pending', titulo: 'Completado',         desc: 'Pendiente.',                       tiempo: 'Pendiente'  },
    ]
  }
};

const EMAIL_CASOS = {
  'usuario@email.com': ['DES-4821', 'DES-3390']
};

// =============================================
// TOGGLE PREFIJO
// =============================================
document.querySelectorAll('.prefix-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.prefix-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('caseInput');
    if (input) {
      input.placeholder = btn.dataset.type === 'desban' ? 'Ej: DES-4821' : 'Ej: BAN-1203';
      input.value = '';
      input.focus();
    }
  });
});

// =============================================
// FORMAT INPUT
// =============================================
document.getElementById('caseInput')?.addEventListener('input', function () {
  let v = this.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  this.value = v;
  const err = document.getElementById('searchError');
  if (err) err.classList.add('hidden');
});

document.getElementById('caseInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('searchBtn')?.click();
});

// =============================================
// BUSCAR CASO
// =============================================
document.getElementById('searchBtn')?.addEventListener('click', () => {
  const input = document.getElementById('caseInput');
  const val   = input?.value.trim().toUpperCase();
  const err   = document.getElementById('searchError');

  if (!val || val.length < 5) {
    err?.classList.remove('hidden');
    return;
  }

  err?.classList.add('hidden');
  buscar(val);
});

function buscar(val) {
  hideAll();

  // Buscar por número de caso
  if (MOCK_CASOS[val]) {
    renderCaso(MOCK_CASOS[val]);
    return;
  }

  // Buscar por email
  if (EMAIL_CASOS[val.toLowerCase()]) {
    renderMisCasos(val.toLowerCase());
    return;
  }

  // No encontrado
  document.getElementById('emptySection')?.classList.remove('hidden');
}

// =============================================
// RENDER CASO
// =============================================
function renderCaso(caso) {
  const section = document.getElementById('resultadoSection');
  if (!section) return;

  setText('casoNum', caso.num);
  setText('casoTipoTxt', caso.tipo === 'desbaneo' ? 'Desbaneo' : 'Baneo');
  const tipoDot = document.querySelector('.tipo-dot');
  if (tipoDot) tipoDot.className = `tipo-dot ${caso.tipo === 'desbaneo' ? 'green' : 'red'}`;
  setText('casoNumero', caso.numero);
  setText('casoPlan', caso.plan);
  setText('casoFecha', caso.fecha);

  // Badge estado
  const badge = document.getElementById('casoEstadoBadge');
  if (badge) {
    const map = {
      'en-proceso': ['En proceso',  'badge-en-proceso'],
      'completado': ['Completado',  'badge-completado'],
      'pendiente':  ['Pendiente',   'badge-pendiente'],
      'fallido':    ['No resuelto', 'badge-fallido'],
    };
    const [txt, cls] = map[caso.estado] || ['Desconocido', 'badge-pendiente'];
    badge.textContent = txt;
    badge.className   = `caso-estado-badge ${cls}`;
  }

  // Timeline
  const tl = document.getElementById('timeline');
  if (tl) {
    tl.innerHTML = caso.timeline.map(item => `
      <div class="tl-item">
        <div class="tl-dot-wrap">
          <div class="tl-dot ${item.estado}"></div>
        </div>
        <div class="tl-body">
          <div class="tl-title">${item.titulo}</div>
          <div class="tl-desc">${item.desc}</div>
        </div>
        <div class="tl-time">${item.tiempo}</div>
      </div>
    `).join('');
  }

  // Progreso
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`ps${i}`);
    if (!el) continue;
    el.className = 'ps-item' + (i < caso.progreso ? ' done' : i === caso.progreso ? ' active' : '');
  }

  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============================================
// RENDER MIS CASOS
// =============================================
function renderMisCasos(email) {
  const section = document.getElementById('misCasosSection');
  const lista   = document.getElementById('mcLista');
  const emailEl = document.getElementById('mcEmail');
  if (!section || !lista) return;

  if (emailEl) emailEl.textContent = email;

  const casos = EMAIL_CASOS[email] || [];
  lista.innerHTML = casos.map(id => {
    const c = MOCK_CASOS[id];
    if (!c) return '';
    const estadoMap = {
      'en-proceso': ['En proceso',  'badge-en-proceso'],
      'completado': ['Completado',  'badge-completado'],
      'pendiente':  ['Pendiente',   'badge-pendiente'],
    };
    const [txt, cls] = estadoMap[c.estado] || ['—', ''];
    return `
      <div class="mc-item" onclick="seleccionarCaso('${id}')">
        <div class="mc-item-num">${c.num}</div>
        <div class="mc-item-info">
          <div>${c.tipo === 'desbaneo' ? 'Desbaneo' : 'Baneo'} · ${c.numero}</div>
          <div class="mc-item-tipo">${c.plan}</div>
        </div>
        <div class="mc-item-fecha">${c.fecha}</div>
        <div class="mc-item-badge ${cls}">${txt}</div>
      </div>
    `;
  }).join('');

  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.seleccionarCaso = function(id) {
  hideAll();
  const caso = MOCK_CASOS[id];
  if (caso) renderCaso(caso);
};

// =============================================
// BOTONES SECUNDARIOS
// =============================================
['btnNewSearch', 'btnNewSearch2', 'btnRetry'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    hideAll();
    const input = document.getElementById('caseInput');
    if (input) { input.value = ''; input.focus(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

document.getElementById('btnContact')?.addEventListener('click', () => {
  window.location.href = '../../../../modules/shared/pages/contacto/';
});

// =============================================
// HELPERS
// =============================================
function hideAll() {
  ['resultadoSection', 'misCasosSection', 'emptySection'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// =============================================
// LEER ?caso= DE LA URL
// =============================================
(function initFromUrl() {
  const caso = new URLSearchParams(window.location.search).get('caso');
  if (!caso) return;
  const input = document.getElementById('caseInput');
  if (input) input.value = caso.toUpperCase();
  buscar(caso.toUpperCase());
})();