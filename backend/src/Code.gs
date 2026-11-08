/**
 * PROTOTIPE KONEKSI (Tahap 2, langkah 1)
 * Hanya untuk menguji komunikasi GitHub Pages -> Apps Script.
 * Nanti dipecah menjadi Config.gs, Router.gs, Errors.gs, dst.
 *
 * Catatan: GAS selalu membalas HTTP 200. Status sukses/gagal ada di body JSON.
 */
var API_VERSION = 'proto-0.1';

function doGet(e) {
  var p = (e && e.parameter) || {};
  return route_(p.action || 'ping', p, 'GET', null);
}

function doPost(e) {
  var raw = (e && e.postData && e.postData.contents) || '';
  var ctype = (e && e.postData && e.postData.type) || '';
  var body;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    return fail_('BAD_JSON', 'Body bukan JSON yang valid.');
  }
  return route_(body.action || 'ping', body.params || {}, 'POST', { rawLength: raw.length, contentType: ctype });
}

function route_(action, params, method, meta) {
  try {
    switch (action) {
      case 'ping':
        return ok_({
          pong: true,
          method: method,
          apiVersion: API_VERSION,
          serverTime: new Date().toISOString(),
          echo: params.echo === undefined ? null : String(params.echo).slice(0, 200),
          receivedContentType: meta ? meta.contentType : null
        });
      case 'payloadTest':
        // Menguji batas ukuran body POST (untuk memperkirakan batas ukuran foto base64).
        var blob = params.blob || '';
        return ok_({
          receivedChars: blob.length,
          bodyChars: meta ? meta.rawLength : null,
          serverTime: new Date().toISOString()
        });
      default:
        return fail_('UNKNOWN_ACTION', 'Action tidak dikenal: ' + action);
    }
  } catch (err) {
    return fail_('INTERNAL_ERROR', 'Terjadi kesalahan di server.');
  }
}

function ok_(data) {
  return json_({ ok: true, data: data, error: null });
}

function fail_(code, message) {
  return json_({ ok: false, data: null, error: { code: code, message: message } });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
