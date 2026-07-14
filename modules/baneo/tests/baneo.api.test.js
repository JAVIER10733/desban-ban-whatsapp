/**
 * Tests — baneo.api.js
 */
'use strict';

const {
  mockFetchResponse,
  respuestaSolicitud201,
  respuestaEstado200
} = require('./baneo.fixture.js');

describe('BaneoApi', () => {
  beforeEach(() => {
    jest.resetModules();
    delete global.BaneoApi;
    delete global.BaneoApiError;
    global.fetch = jest.fn();
    require('../services/baneo.api.js');
    global.BaneoApi.setBase('http://test.local/api/baneo');
  });

  test('request POST /solicitud envía JSON y devuelve cuerpo parseado', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaSolicitud201 }));

    const out = await global.BaneoApi.request('POST', '/solicitud', {
      body: { plan: 'pro' }
    });

    expect(out.success).toBe(true);
    expect(out.data.caso_numero).toBe('BAN-test01');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('http://test.local/api/baneo/solicitud');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ plan: 'pro' });
  });

  test('request GET /estado añade query string', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaEstado200 }));

    const out = await global.BaneoApi.request('GET', '/estado', {
      query: { id: 'BAN-x' }
    });

    expect(out.success).toBe(true);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('id=BAN-x');
  });

  test('request omite query params vacíos', async () => {
    global.fetch = jest.fn(mockFetchResponse({ body: respuestaEstado200 }));

    await global.BaneoApi.request('GET', '/estado', {
      query: { id: 'BAN-1', email: '', foo: null }
    });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('id=BAN-1');
    expect(url).not.toContain('email');
  });

  test('respuesta HTTP error lanza BaneoApiError con status y body', async () => {
    global.fetch = jest.fn(
      mockFetchResponse({
        ok: false,
        status: 422,
        body: { errors: ['Campo inválido'] }
      })
    );

    await expect(
      global.BaneoApi.request('POST', '/solicitud', { body: {} })
    ).rejects.toMatchObject({
      name: 'BaneoApiError',
      status: 422
    });
  });

  test('setBase cambia la URL base', async () => {
    global.BaneoApi.setBase('https://api.example.com/v1/baneo');
    global.fetch = jest.fn(mockFetchResponse({ body: { ok: true } }));

    await global.BaneoApi.request('GET', '/planes', {});

    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/v1/baneo/planes');
  });
});
