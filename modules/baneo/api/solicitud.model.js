/**
 * solicitud.model.js — Queries a la base de datos
 * Módulo: Desbaneo
 */
const { db } = require('../_shared/db');

/**
 * Inserta una nueva solicitud
 */
exports.insertar = async (data) => {
  const query = `
    INSERT INTO solicitudes_desbaneo
      (numero, plan, tipo_baneo, descripcion, nombre, email,
       pref_contacto, payment_intent_id, ip_origen, estado, created_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING id, created_at
  `;
  const values = [
    data.numero, data.plan, data.tipo_baneo, data.descripcion,
    data.nombre, data.email, data.pref_contacto,
    data.payment_intent_id, data.ip_origen, data.estado
  ];
  const { rows } = await db.query(query, values);
  return rows[0];
};

/**
 * Obtiene una solicitud por ID
 */
exports.obtenerPorId = async (id) => {
  const { rows } = await db.query(
    'SELECT * FROM solicitudes_desbaneo WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

/**
 * Obtiene solicitud con su historial de estados
 */
exports.obtenerConTimeline = async (id) => {
  const solicitudQ = await db.query(
    'SELECT * FROM solicitudes_desbaneo WHERE id = $1',
    [id]
  );
  if (!solicitudQ.rows.length) return null;

  const timelineQ = await db.query(
    `SELECT estado, nota, created_at
     FROM estados_desbaneo
     WHERE solicitud_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  return {
    ...solicitudQ.rows[0],
    timeline: timelineQ.rows
  };
};

/**
 * Obtiene solicitudes por email
 */
exports.obtenerPorEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT id, numero, plan, estado, created_at
     FROM solicitudes_desbaneo
     WHERE email = $1
     ORDER BY created_at DESC`,
    [email]
  );
  return rows;
};

/**
 * Actualiza el estado de una solicitud
 */
exports.actualizarEstado = async (id, estado, nota = null) => {
  await db.query(
    'UPDATE solicitudes_desbaneo SET estado = $1, updated_at = NOW() WHERE id = $2',
    [estado, id]
  );
  await db.query(
    `INSERT INTO estados_desbaneo (solicitud_id, estado, nota, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [id, estado, nota]
  );
  return { id, estado };
};

/**
 * Obtiene solicitudes pendientes (para el panel admin)
 */
exports.obtenerPendientes = async () => {
  const { rows } = await db.query(
    `SELECT id, numero, plan, nombre, email, estado, created_at
     FROM solicitudes_desbaneo
     WHERE estado IN ('pendiente_pago', 'en_proceso', 'apelacion_enviada')
     ORDER BY created_at ASC`
  );
  return rows;
};