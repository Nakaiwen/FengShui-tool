/* 原型產生器：真打劫戶型示意圖（依引擎資料畫房屋格局示意，非實測平面）。 */
const fs = require('fs');
global.window = {};
global.document = { createElementNS: () => ({ setAttribute() {}, appendChild() {}, set textContent(v) {} }) };
require('./xuankong.js');
const XK = global.window.XuanKong;

const PERIOD = 9, SIT = '巽', FAC = '乾';
const r = XK.compute(PERIOD, FAC, SIT, 9);
const rob = (r.advanced.robbery.success ? r.advanced.robbery.palaces : []);
const robSub = r.advanced.robbery.subtype || '';
const gates = r.advanced.castleGate.filter(c => c.valid).map(c => c.palace);
const sitG = r.sitting.gua, facG = r.facing.gua;

// 上南下北、左東右西的 3×3 佈局
const GRID = [['巽', '離', '坤'], ['震', '中', '兌'], ['艮', '坎', '乾']];
const DIRNAME = { 坎: '北', 坤: '西南', 震: '東', 巽: '東南', 乾: '西北', 兌: '西', 艮: '東北', 離: '南', 中: '中宮' };

const S = 660, M = 78, G = S - 2 * M, cell = G / 3;
const NS = 'http://www.w3.org/2000/svg';
let svg = '';
const add = s => { svg += s; };
const cx = c => M + (c + 0.5) * cell, cy = rr => M + (rr + 0.5) * cell;

// 外框（宅體）
add(`<rect x="${M}" y="${M}" width="${G}" height="${G}" rx="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="4"/>`);

GRID.forEach((row, rr) => row.forEach((g, c) => {
  const x = M + c * cell, y = M + rr * cell, mx = cx(c), my = cy(rr);
  const isSit = g === sitG, isFac = g === facG, isRob = rob.includes(g), isGate = gates.includes(g);
  // 底色
  let fill = 'none';
  if (isSit) fill = 'var(--sit-bg)';
  else if (isRob) fill = '#f5e8c6';
  else if (isGate) fill = '#e3f1e1';
  if (fill !== 'none') add(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}"/>`);
  // 格線
  add(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="var(--line)" stroke-width="1.5"/>`);
  // 真打劫三宮：金色虛線內框＋通氣口符號
  if (isRob) {
    add(`<rect x="${x + 6}" y="${y + 6}" width="${cell - 12}" height="${cell - 12}" fill="none" stroke="var(--rob)" stroke-width="2.5" stroke-dasharray="6 4"/>`);
  }
  if (g === '中') {
    add(txt(mx, my - 14, '中宮', 16, 'var(--muted)', 700));
    add(txt(mx, my + 12, '山' + r.plates.shan[g] + '·向' + r.plates.xiang[g] + '·運' + numCN(r.plates.yun[g]), 12, 'var(--muted)'));
    return;
  }
  // 方位卦
  add(txt(mx, y + 22, DIRNAME[g] + ' ' + g, 14, 'var(--ink)', 700));
  // 角色徽章 + 圖示
  let role = '建議房間', rcolor = 'var(--muted)';
  if (isFac) { role = '向首·大門採光'; rcolor = 'var(--hl)'; }
  else if (isRob) { role = '通氣口·宜門窗陽台'; rcolor = '#b8860b'; }
  if (isGate) { role = '城門·宜門路水'; rcolor = 'var(--gate)'; }
  if (isSit) { role = '坐·靠山(實牆)'; rcolor = 'var(--yang)'; }
  add(txt(mx, my + 4, role, 12.5, rcolor, 700));
  // 圖示
  if (isFac) add(doorIcon(mx, my + 34));            // 大門
  else if (isRob) add(windowIcon(mx, my + 34));      // 通氣窗
  if (isGate) add(doorIcon(mx, my + 34, 'var(--gate)')); // 城門
  if (isSit) add(wallIcon(mx, my + 34));             // 靠山實牆
  // 山-向-運
  add(txt(mx, y + cell - 14, '山' + r.plates.shan[g] + ' 向' + r.plates.xiang[g] + ' 運' + numCN(r.plates.yun[g]), 12, 'var(--muted)'));
  // 旺星標記（向首雙9）
  if (isFac) add(`<circle cx="${x + cell - 20}" cy="${y + 20}" r="13" fill="var(--hl)"/>` + txt(x + cell - 20, y + 20, '旺', 13, '#fff', 800));
}));

// 外圈方位
add(txt(S / 2, M - 30, '南', 20, 'var(--hl)', 800));
add(txt(S / 2, S - M + 30, '北', 20, 'var(--ink)', 800));
add(txt(M - 34, S / 2, '東', 20, 'var(--ink)', 800));
add(txt(S - M + 34, S / 2, '西', 20, 'var(--ink)', 800));

function txt(x, y, t, size, fill, weight) {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${size}" fill="${fill}"${weight ? ' font-weight="' + weight + '"' : ''}>${t}</text>`;
}
function numCN(n) { return ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][n]; }
function doorIcon(x, y, color) {
  color = color || 'var(--hl)';
  return `<g stroke="${color}" stroke-width="2.5" fill="none"><line x1="${x - 14}" y1="${y}" x2="${x + 6}" y2="${y}"/><path d="M ${x + 6} ${y} A 20 20 0 0 0 ${x + 6} ${y - 20}"/></g>`;
}
function windowIcon(x, y) {
  return `<g stroke="#b8860b" stroke-width="2.5" fill="none"><rect x="${x - 16}" y="${y - 7}" width="32" height="14"/><line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}"/></g>`;
}
function wallIcon(x, y) {
  return `<rect x="${x - 18}" y="${y - 5}" width="36" height="10" fill="var(--yang)"/>`;
}

const html = `<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>真打劫戶型示意圖・九運坐巽向乾</title>
<style>
  :root{ --bg:#f6f1e7; --paper:#fbf7ee; --ink:#1a1a1a; --line:#cdbfa0; --yang:#8B5A2B; --hl:#c0392b; --muted:#8a7d63; --rob:#b8860b; --gate:#1e7d34; --sit-bg:#ecdcb6; }
  body{ margin:0; padding:24px; background:var(--bg); color:var(--ink); font-family:"Noto Serif TC","Songti TC","STKaiti","KaiTi",serif; }
  .card{ max-width:680px; margin:0 auto; }
  h1{ text-align:center; font-size:22px; letter-spacing:1px; margin:0 0 2px; }
  .tag{ text-align:center; color:var(--hl); font-weight:700; font-size:15px; margin-bottom:4px; }
  .sub{ text-align:center; color:var(--muted); font-size:12.5px; margin-bottom:14px; }
  svg{ width:100%; height:auto; display:block; filter:drop-shadow(0 4px 16px rgba(0,0,0,.1)); }
  .legend{ display:flex; flex-wrap:wrap; gap:6px 16px; justify-content:center; font-size:12.5px; margin:14px 0; }
  .legend span{ position:relative; padding-left:18px; }
  .legend i{ position:absolute; left:0; top:2px; width:12px; height:12px; border-radius:3px; }
  .copy{ background:var(--paper); border-left:5px solid var(--hl); padding:12px 14px; border-radius:8px; font-size:13.5px; line-height:1.8; }
  .copy b{ color:var(--hl); }
  .disc{ color:var(--muted); font-size:11.5px; margin-top:10px; line-height:1.7; }
  @media print{ body{ background:#fff; padding:0; } svg{ filter:none; } }
</style></head>
<body><div class="card">
  <h1>真打劫旺財戶型・示意圖</h1>
  <div class="tag">下元九運　坐巽（東南）向乾（西北）　雙星到向・${robSub}</div>
  <div class="sub">理氣示意圖（非實測平面）　·　上南下北、左東右西</div>
  <svg viewBox="0 0 ${S} ${S}" xmlns="${NS}">${svg}</svg>
  <div class="legend">
    <span><i style="background:#f5e8c6;border:1.5px dashed var(--rob)"></i>真打劫三宮（通氣口）</span>
    <span><i style="background:var(--sit-bg)"></i>坐·靠山</span>
    <span><i style="background:#e3f1e1"></i>城門</span>
    <span><i style="background:var(--hl)"></i>向首·大門/旺</span>
  </div>
  <div class="copy">
    <b>本案為下元九運「坐巽向乾・真打劫」旺財格局。</b>向首乾宮山向雙九當令，財氣到向；
    更逢七星真打劫——<b>南(離)、東(震)、西北(乾)三宮</b>若互相通氣（門、窗、走道、陽台相連不阻），
    可提前引動下元一運旺氣，發財極速。北方(坎)為<b>城門</b>，宜設門路或見水，輔助納氣。
    坐方巽宮(東南)宜厚實靠山、忌空蕩。
  </div>
  <div class="disc">※ 此為玄空理氣示意，房屋須先在實際平面定中宮、分二十四山後套宮；三宮「通氣」是否生效，仍須現場巒頭（確有門窗陽台、非封閉實牆或陰暗廁所儲藏）驗證。本圖供格局溝通與佈局參考，不構成建築設計或交易保證。</div>
</div></body></html>`;

fs.writeFileSync('真打劫戶型示意-九運巽乾.html', html, 'utf8');
console.log('written: 真打劫戶型示意-九運巽乾.html');
