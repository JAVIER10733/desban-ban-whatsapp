/**
 * Tests — baneo.service.js
 */
'use strict';

const {
  mockFetchResponse,
  solicitudPayloadValida,
  respuestaSolicitud201,
  respuestaEstado200,
  respuestaPlanes200
} = require('./baneo.fixture.js');

describe('BaneoService', () => {
  beforeEach(() => {
    jest.resetModules();
    delete global.BaneoApi;
    delete global.BaneoApiError;
    delete global.BaneoService;
    global.fetch = jest.fn();
    require('../services/baneo.api.js');
    require('../services/baneo.service.js');
    global.BaneoService.setBase('http://test.local/api/baneo');
  });

  test('crearSolicitud delega en POST /solicitud', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaSolicitud201 }));

    const out = await global.BaneoService.crearSolicitud(solicitudPayloadValida);

    expect(out.success).toBe(true);
    expect(global.fetch.mock.calls[0][0]).toContain('/solicitud');
  });

  test('getEstado delega en GET /estado', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaEstado200 }));

    const out = await global.BaneoService.getEstado({ id: 'BAN-1' });

    expect(out.data.id).toBe('BAN-test01');
  });

  test('getPlanes usa tipo personal por defecto', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaPlanes200 }));

    await global.BaneoService.getPlanes();

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('tipo=personal');
  });

  test('setBase actualiza BASE vía BaneoService', () => {
    global.BaneoService.setBase('http://x/api/baneo');
    expect(global.BaneoService.BASE).toBe('http://x/api/baneo');
  });
});
