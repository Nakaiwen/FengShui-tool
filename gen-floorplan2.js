/* 原型②：線稿戶型平面（牆/門/窗/家具/房間名），玄空角色擺位。九運坐巽向乾。 */
const fs = require('fs');
global.window = {};
global.document = { createElementNS: () => ({ setAttribute() {}, appendChild() {}, set textContent(v) {} }) };
require('./xuankong.js');
const XK = global.window.XuanKong;

const r = XK.compute(9, '乾', '巽', 9);
const rob = r.advanced.robbery.success ? r.advanced.robbery.palaces : [];
const gates = r.advanced.castleGate.filter(c => c.valid).map(c => c.palace);
const sitG = r.sitting.gua, facG = r.facing.gua;

const GRID = [['巽', '離', '坤'], ['震', '中', '兌'], ['艮', '坎', '乾']];
const DIR = { 坎: '北', 坤: '西南', 震: '東', 巽: '東南', 乾: '西北', 兌: '西', 艮: '東北', 離: '南', 中: '中宮' };
// 房間配置（依玄空角色擺位）
const ROOM = {
  巽: { name: '主臥室', fn: 'bed' },        // 坐·靠山，床靠實牆
  離: { name: '餐廳',   fn: 'dining' },     // 真打劫·通氣，南面採光
  坤: { name: '廚房',   fn: 'kitchen' },
  震: { name: '書房',   fn: 'desk' },       // 真打劫·通氣
  中: { name: '中庭/廊', fn: 'none' },
  兌: { name: '衛浴',   fn: 'bath' },
  艮: { name: '儲藏室', fn: 'store' },
  坎: { name: '玄關',   fn: 'entry' },      // 城門·門路
  乾: { name: '客廳',   fn: 'living' },     // 向首·大門採光
};

const S = 760, M = 96, G = S - 2 * M, cell = G / 3, paper = '#fbf7ee';
const cellX = c => M + c * cell, cellY = rr => M + rr * cell;
let out = '';
const A = s => { out += s; };

// 底色（真打劫三宮淡金、坐淡黃、城門淡綠）
GRID.forEach((row, rr) => row.forEach((g, c) => {
  let f = null;
  if (g === sitG) f = '#efe2c0'; else if (rob.includes(g)) f = '#f6ead0'; else if (gates.includes(g)) f = '#e7f1e4';
  if (f) A(`<rect x="${cellX(c)}" y="${cellY(rr)}" width="${cell}" height="${cell}" fill="${f}"/>`);
}));

// 家具（先畫，牆後畫蓋住邊界）
GRID.forEach((row, rr) => row.forEach((g, c) => {
  const x = cellX(c), y = cellY(rr), mx = x + cell / 2, my = y + cell / 2;
  A(furniture(ROOM[g].fn, mx, my));
}));

// 內牆（中等粗）：3×3 分隔
const WIN = '#1a1a1a';
for (let i = 1; i < 3; i++) {
  A(line(M + i * cell, M, M + i * cell, M + G, 4));
  A(line(M, M + i * cell, M + G, M + i * cell, 4));
}
// 外牆（粗）
A(`<rect x="${M}" y="${M}" width="${G}" height="${G}" fill="none" stroke="${WIN}" stroke-width="8"/>`);

// ── 開口（門/窗）：用紙色矩形「切牆」，再畫門弧或窗 ──
function gapH(xc, yc, w) { A(`<rect x="${xc - w / 2}" y="${yc - 6}" width="${w}" height="12" fill="${paper}"/>`); }
function gapV(xc, yc, h) { A(`<rect x="${xc - 6}" y="${yc - h / 2}" width="12" height="${h}" fill="${paper}"/>`); }
function doorArc(xc, yc, len, dir) { // dir: 'up/down/left/right' 開門方向
  let leaf, arc;
  if (dir === 'down') { leaf = line(xc - len / 2, yc, xc - len / 2, yc + len, 2); arc = `<path d="M ${xc - len / 2} ${yc + len} A ${len} ${len} 0 0 1 ${xc + len / 2} ${yc}" fill="none" stroke="${WIN}" stroke-width="2"/>`; }
  else if (dir === 'up') { leaf = line(xc - len / 2, yc, xc - len / 2, yc - len, 2); arc = `<path d="M ${xc - len / 2} ${yc - len} A ${len} ${len} 0 0 0 ${xc + len / 2} ${yc}" fill="none" stroke="${WIN}" stroke-width="2"/>`; }
  else if (dir === 'right') { leaf = line(xc, yc - len / 2, xc + len, yc - len / 2, 2); arc = `<path d="M ${xc + len} ${yc - len / 2} A ${len} ${len} 0 0 1 ${xc} ${yc + len / 2}" fill="none" stroke="${WIN}" stroke-width="2"/>`; }
  else { leaf = line(xc, yc - len / 2, xc - len, yc - len / 2, 2); arc = `<path d="M ${xc - len} ${yc - len / 2} A ${len} ${len} 0 0 0 ${xc} ${yc + len / 2}" fill="none" stroke="${WIN}" stroke-width="2"/>`; }
  A(leaf + arc);
}
function windowH(xc, yc, w) { gapH(xc, yc, w); A(line(xc - w / 2, yc - 3, xc + w / 2, yc - 3, 1.5) + line(xc - w / 2, yc + 3, xc + w / 2, yc + 3, 1.5)); }
function windowV(xc, yc, h) { gapV(xc, yc, h); A(line(xc - 3, yc - h / 2, xc - 3, yc + h / 2, 1.5) + line(xc + 3, yc - h / 2, xc + 3, yc + h / 2, 1.5)); }

// 真打劫三宮外牆開窗（通氣口）：離=南(上)、震=東(左)、乾=西(右)
windowH(cellX(1) + cell / 2, M, 70);          // 離 南窗
windowV(M, cellY(1) + cell / 2, 70);          // 震 東窗
windowV(M + G, cellY(2) + cell / 2, 64);      // 乾 西窗（向首採光）
// 大門：向首乾，開在下緣（北側）
gapH(cellX(2) + cell / 2, M + G, 56); doorArc(cellX(2) + cell / 2, M + G, 40, 'up');
// 城門：坎，下緣次入口
gapH(cellX(1) + cell / 2, M + G, 50); doorArc(cellX(1) + cell / 2, M + G, 36, 'up');
// 室內門（連通）：主臥-書房、餐廳-客廳一側、衛浴
gapV(cellX(1), cellY(0) + cell / 2, 44); doorArc(cellX(1), cellY(0) + cell / 2, 32, 'left');   // 巽主臥 ↔ 離餐廳
gapH(cellX(0) + cell / 2, cellY(1), 44); doorArc(cellX(0) + cell / 2, cellY(1), 32, 'down');   // 巽 ↔ 震書房
gapV(cellX(2), cellY(1) + cell / 2, 40); doorArc(cellX(2), cellY(1) + cell / 2, 30, 'left');   // 兌衛浴

// 文字（房間名、角色、飛星）放最上層
GRID.forEach((row, rr) => row.forEach((g, c) => {
  const x = cellX(c), y = cellY(rr), mx = x + cell / 2;
  A(txt(mx, y + 20, ROOM[g].name, 15, '#1a1a1a', 700));
  A(txt(mx, y + 38, DIR[g] + (g === '中' ? '' : ' ' + g), 11.5, '#8a7d63'));
  let role = '', rc = '#8a7d63';
  if (g === facG) { role = '向首·大門·旺'; rc = '#c0392b'; }
  else if (rob.includes(g)) { role = '真打劫·通氣'; rc = '#b8860b'; }
  if (gates.includes(g)) { role = '城門·門路'; rc = '#1e7d34'; }
  if (g === sitG) { role = '坐·靠山'; rc = '#8B5A2B'; }
  if (role) A(txt(mx, y + cell - 30, role, 12, rc, 700));
  A(txt(mx, y + cell - 13, '山' + r.plates.shan[g] + ' 向' + r.plates.xiang[g] + ' 運' + numCN(r.plates.yun[g]), 11, '#a99884'));
}));
// 方位
A(txt(S / 2, M - 36, '南', 19, '#c0392b', 800) + txt(S / 2, S - M + 36, '北', 19, '#1a1a1a', 800) + txt(M - 40, S / 2, '東', 19, '#1a1a1a', 800) + txt(S - M + 40, S / 2, '西', 19, '#1a1a1a', 800));

function line(x1, y1, x2, y2, w) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WIN}" stroke-width="${w}"/>`; }
function txt(x, y, t, s, f, w) { return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${s}" fill="${f}"${w ? ' font-weight="' + w + '"' : ''}>${t}</text>`; }
function numCN(n) { return ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][n]; }

// ── 家具（簡易線稿）──
function furniture(fn, mx, my) {
  const ST = ' fill="none" stroke="#6b6b6b" stroke-width="1.6"';
  const FILL = ' fill="#efe9dc" stroke="#6b6b6b" stroke-width="1.6"';
  if (fn === 'bed') return `<g><rect x="${mx - 45}" y="${my - 20}" width="90" height="70"${FILL}/><rect x="${mx - 40}" y="${my - 14}" width="36" height="22" rx="3"${ST}/><rect x="${mx + 4}" y="${my - 14}" width="36" height="22" rx="3"${ST}/></g>`;
  if (fn === 'dining') return `<g><rect x="${mx - 34}" y="${my - 22}" width="68" height="44" rx="8"${FILL}/><circle cx="${mx - 48}" cy="${my}" r="8"${ST}/><circle cx="${mx + 48}" cy="${my}" r="8"${ST}/><circle cx="${mx}" cy="${my - 36}" r="8"${ST}/><circle cx="${mx}" cy="${my + 36}" r="8"${ST}/></g>`;
  if (fn === 'kitchen') return `<g><rect x="${mx - 50}" y="${my + 18}" width="100" height="20"${FILL}/><rect x="${mx - 50}" y="${my - 38}" width="22" height="56"${FILL}/><circle cx="${mx - 6}" cy="${my + 28}" r="6"${ST}/><circle cx="${mx + 14}" cy="${my + 28}" r="6"${ST}/></g>`;
  if (fn === 'desk') return `<g><rect x="${mx - 45}" y="${my - 16}" width="90" height="28"${FILL}/><rect x="${mx - 14}" y="${my + 16}" width="28" height="22" rx="4"${ST}/></g>`;
  if (fn === 'bath') return `<g><ellipse cx="${mx - 26}" cy="${my}" rx="14" ry="18"${FILL}/><rect x="${mx + 4}" y="${my - 26}" width="44" height="56" rx="10"${FILL}/><circle cx="${mx - 26}" cy="${my - 22}" r="9"${ST}/></g>`;
  if (fn === 'living') return `<g><rect x="${mx - 50}" y="${my + 16}" width="100" height="26" rx="8"${FILL}/><rect x="${mx - 50}" y="${my - 34}" width="26" height="50" rx="8"${FILL}/><rect x="${mx - 12}" y="${my - 14}" width="44" height="26" rx="5"${ST}/></g>`;
  if (fn === 'store') return `<g><rect x="${mx - 40}" y="${my - 30}" width="80" height="60"${ST}/><line x1="${mx - 40}" y1="${my}" x2="${mx + 40}" y2="${my}" stroke="#6b6b6b" stroke-width="1.2"/></g>`;
  if (fn === 'entry') return `<g><rect x="${mx - 20}" y="${my - 30}" width="40" height="14" rx="3"${ST}/></g>`;
  return '';
}

const html = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>真打劫戶型平面・九運坐巽向乾</title>
<style>
  body{ margin:0; padding:24px; background:#f6f1e7; color:#1a1a1a; font-family:"Noto Serif TC","Songti TC","STKaiti","KaiTi",serif; }
  .card{ max-width:720px; margin:0 auto; }
  h1{ text-align:center; font-size:21px; margin:0 0 2px; }
  .tag{ text-align:center; color:#c0392b; font-weight:700; font-size:15px; }
  .sub{ text-align:center; color:#8a7d63; font-size:12.5px; margin-bottom:12px; }
  svg{ width:100%; height:auto; background:${paper}; border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.1); }
  .legend{ display:flex; flex-wrap:wrap; gap:6px 16px; justify-content:center; font-size:12.5px; margin:12px 0; }
  .legend span{ position:relative; padding-left:18px; } .legend i{ position:absolute; left:0; top:2px; width:12px; height:12px; border-radius:3px; }
  .copy{ background:${paper}; border-left:5px solid #c0392b; padding:12px 14px; border-radius:8px; font-size:13px; line-height:1.8; } .copy b{ color:#c0392b; }
  .disc{ color:#8a7d63; font-size:11.5px; margin-top:10px; line-height:1.7; }
  @media print{ body{ background:#fff; padding:0 } svg{ box-shadow:none } }
</style></head><body><div class="card">
  <h1>真打劫旺財戶型・平面示意</h1>
  <div class="tag">下元九運　坐巽（東南）向乾（西北）　雙星到向・真打劫</div>
  <div class="sub">示範戶型（非實測平面）　·　上南下北、左東右西</div>
  <svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">${out}</svg>
  <div class="legend">
    <span><i style="background:#f6ead0"></i>真打劫三宮·通氣</span>
    <span><i style="background:#efe2c0"></i>坐·靠山</span>
    <span><i style="background:#e7f1e4"></i>城門</span>
    <span><i style="background:#c0392b"></i>向首·大門</span>
  </div>
  <div class="copy"><b>九運「坐巽向乾・真打劫」旺財格局。</b>向首乾宮（客廳/大門）山向雙九當令，財氣到向；南(餐廳)、東(書房)、西北(客廳)三宮開窗陽台互相通氣，可提前引動旺氣。北(玄關)為城門宜留門路。坐方巽宮(主臥)靠實牆穩丁。</div>
  <div class="disc">※ 房間配置為依玄空角色之「建議擺位」，非你實際的家；牆、門、窗、家具僅示意。實際套盤須以真實平面定中宮、分二十四山，並現場巒頭驗證通氣是否成立。</div>
</div></body></html>`;

fs.writeFileSync('真打劫戶型平面-九運巽乾.html', html, 'utf8');
console.log('written: 真打劫戶型平面-九運巽乾.html');
