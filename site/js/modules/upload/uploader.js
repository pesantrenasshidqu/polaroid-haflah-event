/**
 * uploader.js - kelola proses upload: kompres, kirim, retry.
 */
(function () {
  'use strict';

  function generateUploadId() {
    return 'uid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  function getDeviceId() {
    var key = 'phv_device_id';
    try {
      var id = localStorage.getItem(key);
      if (!id) { id = 'dev_' + Math.random().toString(36).slice(2, 12); localStorage.setItem(key, id); }
      return id;
    } catch (e) { return 'dev_fallback'; }
  }

  /**
   * Upload satu foto.
   * @param {File} file
   * @param {object} meta - { event_id, qr_id, uploader_name, caption }
   * @param {object} cfg  - konfigurasi kompresi dari getPublicConfig
   * @param {function} onProgress - callback(pct 0-100, pesan)
   */
  async function uploadPhoto(file, meta, cfg, onProgress) {
    onProgress = onProgress || function () {};
    onProgress(10, 'Mengompres foto…');

    var compressed = await window.ImageCompressor.compressImage(file, {
      maxDimension:   cfg.image_max_dimension  || 1600,
      thumbDimension: cfg.thumbnail_dimension  || 480,
      quality:        cfg.image_quality        || 0.8
    });

    onProgress(40, 'Mengirim foto…');

    var params = {
      event_id:      meta.event_id,
      qr_id:         meta.qr_id,
      upload_id:     generateUploadId(),
      device_id:     getDeviceId(),
      uploader_name: meta.uploader_name || '',
      caption:       meta.caption       || '',
      display_b64:   compressed.display,
      thumb_b64:     compressed.thumb
    };

    var data = await window.ApiClient.request('uploadPhoto', params, { timeoutMs: 60000 });
    onProgress(100, 'Selesai');
    return data;
  }

  window.PhotoUploader = { uploadPhoto: uploadPhoto };
})();
