/**
 * Tests — estado.service.js
 */
'use strict';

const { mockFetchResponse, respuestaEstado200 } = require('./baneo.fixture.js');

describe('EstadoBaneoService', () => {
  beforeEach(() => {
    jest.resetModules();
    delete global.BaneoApi;
    delete global.BaneoApiError;
    delete global.EstadoBaneoService;
    global.fetch = jest.fn();
    require('../services/baneo.api.js');
    require('../services/estado.service.js');
    global.BaneoApi.setBase('http://test.local/api/baneo');
  });

  test('consultar rechaza si faltan id y email', async () => {
    await expect(global.EstadoBaneoService.consultar({})).rejects.toThrow(
      'id (número de caso) o email'
    );
  });

  test('porCaso rechaza string vacío', async () => {
    await expect(global.EstadoBaneoService.porCaso('  ')).rejects.toThrow('vacío');
  });

  test('porEmail rechaza vacío', async () => {
    await expect(global.EstadoBaneoService.porEmail('')).rejects.toThrow('vacío');
  });

  test('porCaso llama a /estado con id', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaEstado200 }));

    await global.EstadoBaneoService.porCaso('BAN-abc');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('estado');
    expect(url).toContain('id=BAN-abc');
  });

  test('porEmail normaliza a minúsculas en query', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: { success: true, data: [] } }));

    await global.EstadoBaneoService.porEmail('User@Test.COM');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('email=user%40test.com');
  });
});
