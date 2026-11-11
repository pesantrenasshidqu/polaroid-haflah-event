/**
 * compress.js - kompresi foto di browser sebelum upload.
 * Menggunakan canvas sehingga orientasi EXIF otomatis diperbaiki.
 * Tidak ada dependensi library.
 */
(function () {
  'use strict';

  /**
   * Kompres satu File/Blob menjadi dua base64 string: display dan thumbnail.
   * @param {File|Blob} file
   * @param {object} cfg - { maxDimension, thumbDimension, quality }
   * @returns {Promise<{display:string, thumb:string, mime:string, width:number, height:number}>}
   */
  async function compressImage(file, cfg) {
    cfg = cfg || {};
    var maxDim   = cfg.maxDimension   || 1600;
    var thumbDim = cfg.thumbDimension || 480;
    var quality  = cfg.quality        || 0.8;

    var bitmap = await createImageBitmap(file); // koreksi rotasi EXIF otomatis
    var w = bitmap.width, h = bitmap.height;

    // Hitung dimensi display
    var dw = w, dh = h;
    if (w > maxDim || h > maxDim) {
      if (w >= h) { dw = maxDim; dh = Math.round(h * maxDim / w); }
      else        { dh = maxDim; dw = Math.round(w * maxDim / h); }
    }

    // Hitung dimensi thumbnail
    var tw, th;
    if (dw >= dh) { tw = thumbDim; th = Math.round(dh * thumbDim / dw); }
    else          { th = thumbDim; tw = Math.round(dw * thumbDim / dh); }

    var dispB64  = await drawToBase64_(bitmap, dw, dh, quality);
    var thumbB64 = await drawToBase64_(bitmap, tw, th, quality);
    bitmap.close();

    return {
      display:  dispB64,
      thumb:    thumbB64,
      mime:    'image/jpeg',
      width:    dw,
      height:   dh
    };
  }

  async function drawToBase64_(bitmap, w, h, quality) {
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error('Canvas toBlob gagal'));
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result.split(',')[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    });
  }

  window.ImageCompressor = { compressImage: compressImage };
})();
