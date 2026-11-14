(function(){
  'use strict';
  var slug    = new URLSearchParams(location.search).get('e') || '';
  var since   = '';
  var photos  = {};
  var pollTimer;
  var cfg     = window.APP_CONFIG;
  var POLL_MS = 20000;

  var grid     = document.getElementById('grid');
  var spinner  = document.getElementById('spinner');
  var empty    = document.getElementById('empty');
  var title    = document.getElementById('event-title');
  var loc      = document.getElementById('event-loc');
  var countEl  = document.getElementById('photo-count');
  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lb-img');
  var lbSender = document.getElementById('lb-sender');
  var lbCaption= document.getElementById('lb-caption');

  document.getElementById('lb-close').onclick = closeLb;
  lightbox.onclick = function(e){ if(e.target===lightbox) closeLb(); };
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeLb(); });

  function closeLb(){ lightbox.classList.remove('open'); }

  function openLb(p){
    lbImg.src     = p.display_url;
    lbSender.textContent  = p.uploader_name || 'Tamu';
    lbCaption.textContent = p.caption || '';
    lightbox.classList.add('open');
  }

  function formatDate(iso){
    try{ return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }
    catch(e){ return ''; }
  }

  function addCard(p, isNew){
    if(photos[p.photo_id]) return;
    photos[p.photo_id] = p;
    var card = document.createElement('div');
    card.className = 'polaroid' + (isNew ? ' new-photo' : '');
    card.innerHTML =
      '<img src="' + p.thumb_url + '" alt="Foto ' + escHtml(p.uploader_name||'Tamu') + '" loading="lazy">' +
      '<div class="sender">' + escHtml(p.uploader_name||'Tamu') + '</div>' +
      '<div class="caption">' + escHtml(p.caption||formatDate(p.uploaded_at)) + '</div>';
    card.onclick = function(){ openLb(p); };
    if(isNew) grid.prepend(card); else grid.appendChild(card);
    updateCount();
  }

  function updateCount(){
    var n = Object.keys(photos).length;
    countEl.textContent = n + ' foto';
    empty.style.display = n === 0 ? 'block' : 'none';
  }

  function escHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function load(initial){
    try{
      var data = await ApiClient.request('getGallery',{slug:slug, since:since},{method:'GET'});
      if(initial){
        title.textContent = '📸 ' + data.event_name;
        spinner.style.display = 'none';
      }
      if(data.photos && data.photos.length){
        data.photos.forEach(function(p){ addCard(p, !initial); });
        since = data.server_time;
      }
      if(initial) updateCount();
    }catch(e){
      if(initial){
        spinner.style.display='none';
        title.textContent='Gagal memuat galeri';
        empty.style.display='block';
        empty.querySelector('p').textContent = e.message;
      }
    }
  }

  function startPoll(){
    if(pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function(){
      if(!document.hidden) load(false);
    }, POLL_MS);
  }

  if(!slug){ spinner.style.display='none'; empty.style.display='block'; }
  else { load(true).then(startPoll); }

  document.addEventListener('visibilitychange',function(){
    if(!document.hidden) load(false);
  });
})();
