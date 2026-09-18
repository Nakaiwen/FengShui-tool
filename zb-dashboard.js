/* Presentation only. Reuse the shared heading and sensor status, with no new
   device listeners and no changes to ZiBai's calculation engine. */
(function () {
  'use strict';
  const heading = document.getElementById('zb-heading-value');
  const help = document.createElement('p');
  help.id = 'zb-sensor-help';
  help.className = 'zb-sensor-help zb-only';
  document.querySelector('#controls .control-panel').appendChild(help);
  const source = document.getElementById('xk-compass-help');
  const status = document.getElementById('xk-sensor-status');
  function syncHelp() {
    const state = status.dataset.state || 'manual';
    help.dataset.state = state;
    help.textContent = state === 'manual'
      ? '拖曳滑桿調整盤面角度，或啟動電子羅盤。屋宅坐向與命卦可在上方設定。'
      : state === 'active'
        ? '保持裝置平放，以螢幕上緣指向向方；點「固定目前角度」可停住羅盤。'
        : state === 'pending'
          ? '正在等待羅盤權限與方位讀值…'
          : source.textContent;
  }
  window.addEventListener('fengshui:heading', event => {
    heading.textContent = event.detail.heading.toFixed(1) + '°';
  });
  const observer = new MutationObserver(syncHelp);
  observer.observe(source, {childList:true, characterData:true, subtree:true});
  observer.observe(status, {attributes:true, attributeFilter:['data-state']});
  document.addEventListener('DOMContentLoaded', syncHelp);
  syncHelp();
})();
