// Klien API: POST text/plain (tanpa preflight) agar respons bisa dibaca lintas domain.
(function () {
  'use strict';

  function ApiError(code, message, detail) {
    this.name = 'ApiError';
    this.code = code;
    this.message = message;
    this.detail = detail || null;
  }
  ApiError.prototype = Object.create(Error.prototype);

  async function parseEnvelope(res) {
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Biasanya halaman login Google / halaman error HTML => deployment salah.
      throw new ApiError(
        'NOT_JSON',
        'Server tidak mengembalikan JSON. Periksa deployment: akses harus "Anyone" dan URL harus berakhiran /exec.',
        text.slice(0, 160)
      );
    }
    if (!json.ok) {
      const err = json.error || {};
      throw new ApiError(err.code || 'UNKNOWN', err.message || 'Terjadi kesalahan.');
    }
    return json.data;
  }

  async function request(action, params, options) {
    const cfg = window.APP_CONFIG;
    const opts = options || {};
    const method = (opts.method || 'POST').toUpperCase();
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, opts.timeoutMs || cfg.REQUEST_TIMEOUT_MS);
    try {
      let res;
      if (method === 'GET') {
        const qs = new URLSearchParams(Object.assign({ action: action }, params || {}));
        res = await fetch(cfg.API_URL + '?' + qs.toString(), { method: 'GET', signal: ctrl.signal });
      } else {
        res = await fetch(cfg.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // sengaja BUKAN application/json
          body: JSON.stringify({ action: action, params: params || {} }),
          signal: ctrl.signal
        });
      }
      return await parseEnvelope(res);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e.name === 'AbortError') throw new ApiError('TIMEOUT', 'Server terlalu lama merespons.');
      // TypeError dari fetch = jaringan putus ATAU CORS/redirect gagal
      throw new ApiError('NETWORK_OR_CORS', 'Tidak dapat terhubung ke server (jaringan atau CORS).', String(e));
    } finally {
      clearTimeout(timer);
    }
  }

  window.ApiClient = { request: request, ApiError: ApiError };
})();
