/**
 * estado.controller.js — Lógica de negocio
 * Módulo: Desbaneo / Estado
 */
const model = require('./estado.model');

/**
 * Obtiene el estado completo de una solicitud con timeline
 */
exports.obtenerEstado = async (id) => {
  const rawId = id.replace(/^DES-/i, '');
  const caso  = await model.obtenerConTimeline(rawId);
  if (!caso) return null;

  return {
    id:           `DES-${caso.id}`,
    numero:       maskNumero(caso.numero),
    plan:         capitalizarPlan(caso.plan),
    estado:       caso.estado,
    fecha_inicio: formatFecha(caso.created_at),
    progreso:     calcularProgreso(caso.estado),
    timeline:     caso.timeline.map(t => ({
      estado:  t.estado,
      titulo:  getTituloEstado(t.estado),
      desc:    t.nota || getDescDefault(t.estado),
      tiempo:  formatTiempoRelativo(t.created_at)
    }))
  };
};

/**
 * Obtiene todos los casos asociados a un email
 */
exports.obtenerPorEmail = async (email) => {
  const casos = await model.obtenerPorEmail(email);
  return casos.map(c => ({
    id:     `DES-${c.id}`,
    numero: maskNumero(c.numero),
    plan:   capitalizarPlan(c.plan),
    estado: c.estado,
    fecha:  formatFecha(c.created_at)
  }));
};

// =============================================
// HELPERS PRIVADOS
// =============================================

function maskNumero(numero) {
  if (!numero) return '—';
  const clean = numero.replace(/\s/g, '');
  return clean.slice(0, -4).replace(/\d/g, '·') + clean.slice(-4);
}

function capitalizarPlan(plan) {
  if (!plan) return '—';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function calcularProgreso(estado) {
  const map = {
    pendiente_pago:     1,
    en_proceso:         2,
    apelacion_enviada:  3,
    esperando_meta:     4,
    completado:         5,
    fallido:            5
  };
  return map[estado] || 1;
}

function getTituloEstado(estado) {
  const map = {
    pendiente_pago:    'Solicitud recibida',
    diagnostico:       'Diagnóstico completado',
    apelacion_enviada: 'Apelación enviada',
    esperando_meta:    'Esperando respuesta de Meta',
    completado:        'Número recuperado',
    fallido:           'No fue posible recuperar'
  };
  return map[estado] || estado;
}

function getDescDefault(estado) {
  const map = {
    pendiente_pago:    'Tu solicitud fue registrada correctamente.',
    diagnostico:       'Confirmamos que el número puede ser recuperado.',
    apelacion_enviada: 'Enviamos la solicitud formal a Meta.',
    esperando_meta:    'Meta está revisando la apelación.',
    completado:        'Tu número fue restaurado exitosamente.',
    fallido:           'Procesando devolución según garantía.'
  };
  return map[estado] || '';
}

function formatFecha(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatTiempoRelativo(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `Hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (mins > 0)  return `Hace ${mins} minuto${mins > 1 ? 's' : ''}`;
  return 'Hace un momento';
}