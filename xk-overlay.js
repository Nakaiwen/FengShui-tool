/* 玄空疊圖模組：把九宮飛星半透明疊到上傳的平面圖上。
 * 幾何（格線/底色/打劫框）用 CSS transform 旋轉縮放；文字恆正（另以座標換算定位）。
 * 對外：window.XKOverlay.render(result) / .reset()
 */
(function () {
  'use strict';
  const GRID = [['巽', '離', '坤'], ['震', '中', '兌'], ['艮', '坎', '乾']];
  const DIR = { 坎: '北', 坤: '西南', 震: '東', 巽: '東南', 乾: '西北', 兌: '西', 艮: '東北', 離: '南', 中: '中宮' };
  const CN = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };
  const SZ = 360, cell = SZ / 3;
  const $ = id => document.getElementById(id);
  let st = { cx: 0, cy: 0, scale: 1, rot: 0, op: 0.8 };
  let labels = [];      // {el, lx, ly}
  let lastR = null, inited = false;

  function stage() { return $('ov-stage'); }

  function ensureInit() {
    if (inited) return; inited = true;
    const sg = stage();
    // 拖曳格線＝移動
    let drag = null;
    $('ov-grid').addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY }; $('ov-grid').setPointerCapture(e.pointerId); e.preventDefault();
    });
    $('ov-grid').addEventListener('pointermove', e => {
      if (!drag) return; st.cx += e.clientX - drag.x; st.cy += e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; apply();
    });
    $('ov-grid').addEventListener('pointerup', e => { drag = null; });
    // 拖曳旋轉鈕
    let rotating = false;
    $('ov-knob').addEventListener('pointerdown', e => { rotating = true; $('ov-knob').setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    $('ov-knob').addEventListener('pointermove', e => {
      if (!rotating) return;
      const r = sg.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top;
      st.rot = Math.atan2(py - st.cy, px - st.cx) * 180 / Math.PI + 90; apply();
    });
    $('ov-knob').addEventListener('pointerup', () => { rotating = false; });
    // 滾輪縮放
    sg.addEventListener('wheel', e => { e.preventDefault(); st.scale *= (e.deltaY < 0 ? 1.08 : 0.926); st.scale = Math.max(0.2, Math.min(4, st.scale)); apply(); }, { passive: false });
    // 按鈕
    $('ov-zin').addEventListener('click', () => { st.scale = Math.min(4, st.scale * 1.1); apply(); });
    $('ov-zout').addEventListener('click', () => { st.scale = Math.max(0.2, st.scale / 1.1); apply(); });
    $('ov-reset').addEventListener('click', reset);
    $('ov-png').addEventListener('click', exportPNG);
    $('ov-op').addEventListener('input', e => { st.op = e.target.value / 100; apply(); });
    // 上傳圖
    $('ov-file').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const img = $('ov-img'); img.onload = () => { $('ov-empty').style.display = 'none'; }; img.src = URL.createObjectURL(f);
    });
  }

  function reset() {
    const sg = stage();
    st.scale = 1; st.rot = 0; st.cx = sg.clientWidth / 2; st.cy = sg.clientHeight / 2; apply();
  }

  function buildGrid(r) {
    const rob = r.advanced.robbery.success ? r.advanced.robbery.palaces : [];
    const gates = r.advanced.castleGate.filter(c => c.valid).map(c => c.palace);
    const sg = r.sitting.gua, fg = r.facing.gua;
    let svg = `<svg width="${SZ}" height="${SZ}" viewBox="0 0 ${SZ} ${SZ}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="1" y="1" width="${SZ - 2}" height="${SZ - 2}" fill="none" stroke="#1a1a1a" stroke-width="2" opacity="0.7"/>`;
    GRID.forEach((row, rr) => row.forEach((g, c) => {
      const x = c * cell, y = rr * cell;
      let tint = null;
      if (g === sg) tint = 'rgba(139,90,43,.22)';
      else if (rob.includes(g)) tint = 'rgba(184,134,11,.20)';
      else if (gates.includes(g)) tint = 'rgba(30,125,52,.18)';
      else if (g === fg) tint = 'rgba(192,57,43,.18)';
      if (tint) svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${tint}"/>`;
      svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.5"/>`;
      if (rob.includes(g)) svg += `<rect x="${x + 5}" y="${y + 5}" width="${cell - 10}" height="${cell - 10}" fill="none" stroke="#b8860b" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    }));
    svg += '</svg>';
    $('ov-grid').innerHTML = svg;
  }

  function buildLabels(r) {
    const wrap = $('ov-labels'); wrap.innerHTML = ''; labels = [];
    const rob = r.advanced.robbery.success ? r.advanced.robbery.palaces : [];
    const gates = r.advanced.castleGate.filter(c => c.valid).map(c => c.palace);
    const sg = r.sitting.gua, fg = r.facing.gua;
    GRID.forEach((row, rr) => row.forEach((g, c) => {
      const lx = c * cell + cell / 2, ly = rr * cell + cell / 2;
      let lab = (g === '中' ? '中宮' : DIR[g] + g), dc = '#1a1a1a';
      if (g === sg) { lab = '坐 ' + lab; dc = '#8B5A2B'; }
      else if (g === fg) { lab = '向 ' + lab; dc = '#c0392b'; }
      else if (gates.includes(g)) { lab = '城門 ' + lab; dc = '#1e7d34'; }
      else if (rob.includes(g)) { dc = '#b8860b'; }
      const shan = r.plates.shan[g], xiang = r.plates.xiang[g], yun = CN[r.plates.yun[g]];
      const el = document.createElement('div');
      el.className = 'ovlbl';
      el.innerHTML = `<div class="d" style="color:${dc}">${lab}</div>` +
        `<div class="n"><b style="color:#8B5A2B">${shan}</b> <b style="color:#c0392b">${xiang}</b></div>` +
        `<div class="y">運${yun}</div>`;
      wrap.appendChild(el);
      labels.push({ el, lx, ly, lab, dc, shan, xiang, yun });
    }));
  }

  function tpoint(lx, ly) {
    const dx = (lx - SZ / 2) * st.scale, dy = (ly - SZ / 2) * st.scale;
    const a = st.rot * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    return { x: st.cx + dx * cos - dy * sin, y: st.cy + dx * sin + dy * cos };
  }

  function apply() {
    const grid = $('ov-grid');
    grid.style.transform = `translate(${st.cx - SZ / 2}px, ${st.cy - SZ / 2}px) rotate(${st.rot}deg) scale(${st.scale})`;
    grid.style.opacity = st.op;
    $('ov-labels').style.opacity = Math.min(1, st.op + 0.15);
    labels.forEach(o => { const p = tpoint(o.lx, o.ly); o.el.style.left = p.x + 'px'; o.el.style.top = p.y + 'px'; o.el.style.transform = `translate(-50%,-50%) scale(${Math.max(0.7, Math.min(1.4, st.scale))})`; });
    const k = tpoint(SZ / 2, -26); $('ov-knob').style.left = k.x + 'px'; $('ov-knob').style.top = k.y + 'px';
  }

  // 匯出 PNG：把平面圖＋九宮幾何＋恆正文字合成到 canvas 下載
  function dtext(ctx, x, y, t, size, color, weight) {
    ctx.font = `${weight} ${size}px "Noto Serif TC","Songti TC","STKaiti",serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.32; ctx.strokeStyle = '#fff'; ctx.strokeText(t, x, y);
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  }
  async function exportPNG() {
    const sg = stage(), sr = sg.getBoundingClientRect();
    const W = sg.clientWidth, H = sg.clientHeight, dpr = 2;
    const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const img = $('ov-img');
    if (img.src && img.naturalWidth) {
      const ir = img.getBoundingClientRect();
      ctx.drawImage(img, ir.left - sr.left, ir.top - sr.top, ir.width, ir.height);
    }
    const svgEl = $('ov-grid').querySelector('svg');
    if (svgEl) {
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svgEl));
      await new Promise(res => { const im = new Image(); im.onload = () => {
        ctx.save(); ctx.globalAlpha = st.op; ctx.translate(st.cx, st.cy); ctx.rotate(st.rot * Math.PI / 180); ctx.scale(st.scale, st.scale);
        ctx.drawImage(im, -SZ / 2, -SZ / 2, SZ, SZ); ctx.restore(); res();
      }; im.onerror = res; im.src = url; });
    }
    const s = Math.max(0.7, Math.min(1.4, st.scale));
    labels.forEach(o => { const p = tpoint(o.lx, o.ly);
      dtext(ctx, p.x, p.y - 13 * s, o.lab, 12 * s, o.dc, 700);
      dtext(ctx, p.x - 12 * s, p.y + 5 * s, String(o.shan), 18 * s, '#8B5A2B', 800);
      dtext(ctx, p.x + 12 * s, p.y + 5 * s, String(o.xiang), 18 * s, '#c0392b', 800);
      dtext(ctx, p.x, p.y + 21 * s, '運' + o.yun, 11 * s, '#1a1a1a', 600);
    });
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '玄空疊圖.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100); }, 'image/png');
  }

  function render(r) {
    ensureInit();
    lastR = r;
    if (!r || !r.ok) { $('ov-grid').innerHTML = ''; $('ov-labels').innerHTML = ''; labels = []; return; }
    buildGrid(r); buildLabels(r);
    if (!st.cx && !st.cy) { const sg = stage(); st.cx = sg.clientWidth / 2; st.cy = sg.clientHeight / 2; }
    apply();
  }

  window.XKOverlay = { render, reset, exportPNG };
})();
