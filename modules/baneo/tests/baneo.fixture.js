/**
 * baneo.fixture.js — Datos y helpers compartidos para tests del módulo baneo
 */
'use strict';

/** Payload válido según api-baneo.md */
const solicitudPayloadValida = {
  numero: '+52 55 1234 5678',
  motivo: 'acoso',
  descripcion: 'Descripción de prueba con al menos veinte caracteres.',
  plan: 'pro',
  nombre: 'Ana López',
  email: 'ana@test.com',
  aceptaAviso: true,
  prefContacto: 'email',
  otroMotivo: null
};

const respuestaSolicitud201 = {
  success: true,
  data: {
    id: 'uuid-test',
    caso_numero: 'BAN-test01',
    estado: 'pendiente_pago'
  }
};

const respuestaEstado200 = {
  success: true,
  data: {
    id: 'BAN-test01',
    numero: '+52 55 ···· 5678',
    plan: 'Pro',
    estado: 'reporte_enviado',
    fecha_inicio: '19 mar 2025',
    progreso: 3,
    timeline: []
  }
};

const respuestaPlanes200 = {
  success: true,
  data: [
    {
      slug: 'pro',
      nombre: 'Pro',
      precio: 49,
      popular: true
    }
  ]
};

/**
 * Crea una respuesta compatible con fetch() para los servicios baneo.
 * @param {{ ok?: boolean, status?: number, body?: object|string }} opts
 */
function mockFetchResponse(opts) {
  const ok = opts.ok !== false;
  const status = opts.status != null ? opts.status : ok ? 200 : 400;
  const raw =
    typeof opts.body === 'string'
      ? opts.body
      : JSON.stringify(opts.body != null ? opts.body : { error: 'Error' });
  return function mockFetch() {
    return Promise.resolve({
      ok,
      status,
      text: function () {
        return Promise.resolve(raw);
      }
    });
  };
}

module.exports = {
  solicitudPayloadValida,
  respuestaSolicitud201,
  respuestaEstado200,
  respuestaPlanes200,
  mockFetchResponse
};
