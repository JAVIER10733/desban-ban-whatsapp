/**
 * Tests — planes.service.js
 */
'use strict';

const { mockFetchResponse, respuestaPlanes200 } = require('./baneo.fixture.js');

describe('PlanesBaneoService', () => {
  beforeEach(() => {
    jest.resetModules();
    delete global.BaneoApi;
    delete global.BaneoApiError;
    delete global.PlanesBaneoService;
    global.fetch = jest.fn();
    require('../services/baneo.api.js');
    require('../services/planes.service.js');
    global.BaneoApi.setBase('http://test.local/api/baneo');
  });

  test('listar usa tipo personal por defecto', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaPlanes200 }));

    await global.PlanesBaneoService.listar();

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/planes');
    expect(url).toContain('tipo=personal');
  });

  test('business pide tipo=business', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaPlanes200 }));

    await global.PlanesBaneoService.business();

    expect(global.fetch.mock.calls[0][0]).toContain('tipo=business');
  });

  test('personal pide tipo=personal', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaPlanes200 }));

    await global.PlanesBaneoService.personal();

    expect(global.fetch.mock.calls[0][0]).toContain('tipo=personal');
  });

  test('respuesta incluye planes en data', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaPlanes200 }));

    const out = await global.PlanesBaneoService.listar({ tipo: 'personal' });

    expect(out.success).toBe(true);
    expect(out.data[0].slug).toBe('pro');
  });
});
