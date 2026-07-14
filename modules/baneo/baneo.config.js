const { validar, ERRORES, LIMITES } = require('./baneo.config');

if (!validar.motivo(body.motivo)) {
  return res.status(400).json({ error: ERRORES.MOTIVO_INVALIDO });
}

if (!validar.descripcion(body.descripcion)) {
  return res.status(400).json({ error: ERRORES.DESCRIPCION_MUY_LARGA });
}

if (validar.esFinal(solicitud.estado)) {
  return res.status(409).json({ error: ERRORES.ESTADO_FINAL });
}