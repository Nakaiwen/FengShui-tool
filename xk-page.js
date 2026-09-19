/* ── 玄空模式：頁面配線（與紫白共用坐向，獨立於 script.js） ───────────── */
(function () {
  const btnZi = document.getElementById('mode-zibai');
  const btnXk = document.getElementById('mode-xuankong');
  const plate = document.getElementById('xk-plate');
  const info  = document.getElementById('xk-info');
  const periodSel = document.getElementById('xk-period');
  const adv   = document.getElementById('xk-advanced');
  // 當前元運（依現今年份；下元九運 2024–2043＝9）
  function xkCurrentPeriod() {
    const y = new Date().getFullYear();
    return ((Math.floor((y - 1864) / 20)) % 9) + 1;
  }
  const elSit = document.getElementById('current-mountain'); // 坐山（由 script.js 更新）
  const elFac = document.getElementById('current-facing');   // 向山

  function renderAdvanced(r) {
    if (!r || !r.ok || !r.advanced) { adv.innerHTML = ''; return; }
    const lines = [];
    // 全盤伏吟／反吟（主大凶）——放最前面提醒
    const ff = r.fanFu;
    if (ff && ff.shan) lines.push('<div class="adv-line adv-danger">⚠ 全盤山星' + ff.shan + '（五黃入中）：主大凶，影響人丁、健康，宜避或大力化解。</div>');
    if (ff && ff.xiang) lines.push('<div class="adv-line adv-danger">⚠ 全盤向星' + ff.xiang + '（五黃入中）：主大凶，影響財富、功名，宜避或大力化解。</div>');
    const rob = r.advanced.robbery;
    if (rob && rob.applicable) {
      if (rob.success) {
        lines.push('<div class="adv-line adv-rob">🌟 七星打劫・' + rob.subtype + '：' +
          rob.palaces.join('、') + ' 三宮向星 ' + rob.stars.join('、') + ' 成三般卦</div>');
        lines.push('<div class="adv-line adv-note">' + rob.warning + '</div>');
        (rob.tips || []).forEach((t, i) => lines.push('<div class="adv-line adv-tip">' + (i + 1) + '. ' + t + '</div>'));
      } else {
        lines.push('<div class="adv-line adv-fail">七星打劫：不成立（' + rob.reason + '）</div>');
      }
    }
    const gates = (r.advanced.castleGate || []).filter(c => c.valid);
    if (gates.length) {
      lines.push('<div class="adv-line adv-gate">🚪 城門訣可用：' +
        gates.map(c => c.dir + c.palace + '（飛星 ' + c.arriving + '）').join('、') + '</div>');
      lines.push('<div class="adv-line adv-note">' + gates[0].recommendation + '</div>');
    } else if (r.advanced.castleGate && r.advanced.castleGate.length) {
      lines.push('<div class="adv-line adv-fail">城門訣：左右相鄰宮目前皆非當令，無可用城門。</div>');
    }
    // 連珠格（大吉）／連茹格（大凶）：滿盤格局
    const cb = r.combos;
    if (cb && cb.pearl) {
      lines.push('<div class="adv-line adv-gate">🔵 連珠格（大吉）：滿盤俱見河圖同道（一六、二七、三八、四九），主大吉。</div>');
    }
    if (cb && cb.ru) {
      lines.push('<div class="adv-line adv-qiu">🔴 連茹格（大凶）：滿盤俱見連續八組（一二…八九），主大凶。</div>');
    }
    // 入囚（中宮山星/向星＝當前元運）
    const im = r.imprisonment;
    if (im) {
      lines.push('<div class="adv-line ' + (im.shanQiu ? 'adv-qiu' : 'adv-note') + '">🔒 山星入囚於 ' + im.shanCenter + ' 運' + (im.shanQiu ? '（現運・已入囚）' : '') + '：影響人丁、健康</div>');
      lines.push('<div class="adv-line ' + (im.xiangQiu ? 'adv-qiu' : 'adv-note') + '">🔒 向星入囚於 ' + im.xiangCenter + ' 運' + (im.xiangQiu ? '（現運・已入囚）' : '') + '：影響財富、功名升遷</div>');
    }
    // 逐宮山向組合斷語（放在入囚下方）
    const pm = r.palaceMeanings;
    if (pm && pm.length) {
      lines.push('<div class="adv-sub">各宮山向組合（山星─向星）</div>');
      pm.forEach(c => {
        lines.push('<div class="adv-combo c-' + c.tone + '">' +
          '<b class="cdir">' + c.dir + c.gua + '</b>' +
          '<span class="cnum">' + c.shan + '–' + c.xiang + '</span>' +
          '<span class="cname">' + (c.name || '—') + '</span>' +
          '<span class="cdesc">' + (c.desc || '') + '</span></div>');
      });
    }
    adv.innerHTML = lines.join('');
  }

  let lastKey = null, pendingKey = null, pendingTimer = null, overlayActive = false;
  function chartKey() { return [periodSel.value, curSel.value, elSit.textContent, elFac.textContent].join('|'); }
  function recompute(force = false) {
    if (!document.body.classList.contains('mode-xk')) return;
    clearTimeout(pendingTimer); pendingKey = null;
    const key = chartKey();
    if (!force && key === lastKey) return;
    lastKey = key;
    const sitting = (elSit && elSit.textContent || '').trim();
    const facing  = (elFac && elFac.textContent || '').trim();
    const period  = parseInt(periodSel.value, 10);
    const curPeriod = curSel ? parseInt(curSel.value, 10) : xkCurrentPeriod();
    const r = window.XuanKong.compute(period, facing, sitting, curPeriod);
    window.XKDashboard.render(r, !overlayActive);
    if (overlayActive && window.XKOverlay) window.XKOverlay.render(r);
    if (r.ok) {
      const tone = { good: 'good', mild: 'mild', bad: 'bad' }[r.pattern.tone] || 'mild';
      info.innerHTML =
        '<div class="xk-title">' + ['上元','中元','下元'][Math.floor((period - 1) / 3)] + ['','一','二','三','四','五','六','七','八','九'][period] +
        '運　坐' + r.sitting.mtn + '（' + r.sitting.dir + '）向' + r.facing.mtn + '（' + r.facing.dir + '）</div>' +
        '<div class="xk-pattern xk-' + tone + '">【' + r.pattern.name + '】' + r.pattern.desc + '</div>';
    } else {
      info.innerHTML = '<div class="xk-pattern">' + (r.reason || '坐向尚未設定') + '</div>';
    }
    renderAdvanced(r);
  }

  function setMode(xk) {
    document.body.classList.toggle('mode-xk', xk);
    btnXk.classList.toggle('active', xk);
    btnZi.classList.toggle('active', !xk);
    document.getElementById('xuankong-view').setAttribute('aria-hidden', xk ? 'false' : 'true');
    document.getElementById('xuankong-info').setAttribute('aria-hidden', xk ? 'false' : 'true');
    btnXk.setAttribute('aria-pressed', String(xk));
    btnZi.setAttribute('aria-pressed', String(!xk));
    clearTimeout(pendingTimer); pendingKey = null;
    if (xk) { window.XKDashboard.updateHeading(Number(document.getElementById('facing-degree').textContent)); recompute(true); }
    else window.XKDashboard.stopAnimation();
  }

  const verEl = document.getElementById('xk-version');
  if (verEl && window.XuanKong) verEl.textContent = '玄空 ' + window.XuanKong.VERSION;

  // 當前元運下拉：預設帶出現今實際元運（下元九運 2024–2043），可手動切換推演
  const curSel = document.getElementById('xk-current-period');
  if (curSel) curSel.value = String(xkCurrentPeriod());

  btnZi.addEventListener('click', () => setMode(false));
  btnXk.addEventListener('click', () => setMode(true));
  periodSel.addEventListener('change', () => recompute(true));
  if (curSel) curSel.addEventListener('change', () => recompute(true));

  // 玄空子模式：九宮方盤 / 平面疊圖
  const btnSubPlate = document.getElementById('xk-sub-plate');
  const btnSubOverlay = document.getElementById('xk-sub-overlay');
  function setSub(overlay) {
    overlayActive = overlay;
    window.XKDashboard.stopAnimation();
    btnSubOverlay.classList.toggle('active', overlay);
    btnSubPlate.classList.toggle('active', !overlay);
    document.getElementById('xk-plate').style.display = overlay ? 'none' : 'grid';
    document.getElementById('xk-overlay').style.display = overlay ? 'block' : 'none';
    document.getElementById('xk-replay').disabled = overlay;
    document.querySelector('.xk-number-legend').hidden = overlay;
    document.getElementById('xk-flight-summary').hidden = overlay;
    btnSubOverlay.setAttribute('aria-pressed', String(overlay));
    btnSubPlate.setAttribute('aria-pressed', String(!overlay));
    recompute(true);
  }
  btnSubPlate.addEventListener('click', () => setSub(false));
  btnSubOverlay.addEventListener('click', () => setSub(true));

  // Commit a new mountain only after 220 ms in that sector. High-frequency
  // sensor samples keep the dial live without replacing 27 numbers every frame.
  window.addEventListener('fengshui:heading', event => {
    if (!document.body.classList.contains('mode-xk')) return;
    window.XKDashboard.updateHeading(event.detail.heading);
    const key = chartKey();
    if (key === lastKey) {
      if (pendingKey) { clearTimeout(pendingTimer); pendingKey = null; document.getElementById('xk-chart-status').textContent = '坐向同步'; }
      return;
    }
    if (key === pendingKey) return;
    clearTimeout(pendingTimer);
    pendingKey = key;
    document.getElementById('xk-chart-status').textContent = '方位穩定後更新';
    pendingTimer = setTimeout(() => recompute(), 220);
  });
  [['xk-minus', -1], ['xk-plus', 1], ['xk-flip', 180]].forEach(([id, delta]) => {
    document.getElementById(id).addEventListener('click', () => {
      if (window.setDegree) window.setDegree(Number(document.getElementById('facing-degree').textContent) + delta);
    });
  });
  // A manual move within one mountain keeps the same chart; replay on release.
  document.getElementById('degree-slider').addEventListener('change', () => {
    if (document.body.classList.contains('mode-xk') && !pendingKey && !overlayActive) window.XKDashboard.animate();
  });
  document.addEventListener('DOMContentLoaded', () => {
    setMode(location.hash === '#xuankong');
  });
  window.addEventListener('hashchange', () => setMode(location.hash === '#xuankong'));
  window.XKPageState = {
    snapshot: () => ({period:Number(periodSel.value), currentPeriod:Number(curSel.value), view:overlayActive?'overlay':'plate', detailsOpen:document.getElementById('xk-reading').open}),
    restore(state, mode) {
      periodSel.value = String(state.period); curSel.value = String(state.currentPeriod);
      setMode(mode === 'xuankong'); setSub(state.view === 'overlay');
      document.getElementById('xk-reading').open = state.detailsOpen;
    }
  };
})();
