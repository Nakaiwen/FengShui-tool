(function () {
  'use strict';
  let promptEvent = null, registration = null, updating = false;
  const $ = id => document.getElementById(id);
  const standalone = () => !!window.navigator.standalone || !!window.matchMedia?.('(display-mode: standalone)').matches;
  const installed = () => { $('pwa-install-btn').hidden=standalone(); };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); promptEvent=event;
    $('pwa-install-btn').hidden=false; $('pwa-install-btn').textContent='安裝工具';
  });
  window.addEventListener('appinstalled', () => { promptEvent=null; $('pwa-install-btn').hidden=true; });
  function showUpdate() {
    if (!registration?.waiting) return;
    $('pwa-update-btn').hidden=false;
    $('pwa-status').textContent='新版已就緒；請先存檔，再點更新。';
  }
  document.addEventListener('DOMContentLoaded', () => {
    installed();
    $('pwa-install-btn').addEventListener('click', async () => {
      if (promptEvent) {
        const event=promptEvent; promptEvent=null;
        try { await event.prompt(); await event.userChoice; } catch (_) {}
        installed();
      } else {
        const dialog=$('pwa-install-dialog');
        if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','');
      }
    });
    $('pwa-update-btn').addEventListener('click', () => {
      if (!registration?.waiting) return;
      updating=true; $('pwa-update-btn').disabled=true;
      $('pwa-status').textContent='正在更新…';
      registration.waiting.postMessage({type:'SKIP_WAITING'});
    });
    // Standalone preview files deliberately disable service-worker registration.
    if (window.FENGSHUI_PREVIEW || !/^https?:$/.test(location.protocol)) {
      $('pwa-status').textContent='預覽版・安裝與離線功能請使用上線網址'; return;
    }
    if (!window.isSecureContext || !('serviceWorker' in navigator)) {
      $('pwa-status').textContent='此瀏覽器未支援離線安裝，排盤與存讀檔仍可使用'; return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updating) location.reload();
    });
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg => {
      registration=reg; showUpdate();
      reg.addEventListener('updatefound', () => {
        const worker=reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state==='installed') {
            if (navigator.serviceWorker.controller) showUpdate();
            else $('pwa-status').textContent='離線已就緒';
          }
          if (worker.state==='redundant' && !reg.active) $('pwa-status').textContent='離線準備未完成，請連網後重新開啟';
        });
      });
      navigator.serviceWorker.ready.then(() => {
        $('pwa-status').textContent=navigator.onLine===false ? '離線使用中' : '離線已就緒'; showUpdate();
      });
      window.addEventListener('online', () => { if (reg.active) { $('pwa-status').textContent='離線已就緒'; showUpdate(); reg.update().catch(() => {}); } });
      window.addEventListener('offline', () => { $('pwa-status').textContent=reg.active?'離線使用中':'尚未準備好離線資料'; showUpdate(); });
    }).catch(() => { $('pwa-status').textContent=navigator.serviceWorker.controller?'離線使用中':'離線準備失敗，請連網後重新整理'; });
  });
})();
