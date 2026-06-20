/* 一次性產生器：產出「玄空 216 局全表」HTML（9 運 × 24 坐向，依坐山排序）。 */
const fs = require('fs');
global.window = {};
global.document = { createElementNS: () => ({ setAttribute() {}, appendChild() {}, set textContent(v) {} }) };
require('./xuankong.js');
const XK = global.window.XuanKong;

const ORDER = ['子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥','壬'];
const opp = m => ORDER[(ORDER.indexOf(m) + 12) % 24];
const PNAME = { 1:'一', 2:'二', 3:'三', 4:'四', 5:'五', 6:'六', 7:'七', 8:'八', 9:'九' };
const BASE = { '旺山旺向': 100, '雙星到向': 40, '雙星到坐': 35, '上山下水': -100, '一般格局': 10 };

function gradeOf(sc) {
  if (sc >= 90) return ['大吉', 'g-vg'];
  if (sc >= 60) return ['吉', 'g-good'];
  if (sc >= 30) return ['平', 'g-mid'];
  if (sc >= 1)  return ['偏弱', 'g-weak'];
  return ['凶', 'g-bad'];
}

function rowFor(p, s) {
  const f = opp(s);
  const r = XK.compute(p, f, s, p); // 入囚以「該建宅運」自身評估時的中宮數呈現（即入囚運）
  let sc = BASE[r.pattern.name] || 0;
  const b = r.advanced.robbery;
  let rob = '—';
  if (b.applicable && b.success) { rob = b.subtype; sc += (b.subtype === '真打劫' ? 30 : 20); }
  else if (b.applicable) rob = '打劫失敗';
  const gates = r.advanced.castleGate.filter(c => c.valid);
  let gate = '—';
  if (gates.length) { gate = gates.map(g => g.dir + g.palace).join('、'); sc += 12 * gates.length; }
  const ff = [];
  if (r.fanFu.shan) { ff.push('山' + r.fanFu.shan); sc -= 50; }
  if (r.fanFu.xiang) { ff.push('向' + r.fanFu.xiang); sc -= 50; }
  let combo = '—', ccls = '';
  if (r.combos.pearl) { combo = '連珠·大吉'; ccls = 'c-good'; sc += 40; }
  else if (r.combos.ru) { combo = '連茹·大凶'; ccls = 'c-bad'; sc -= 60; }
  // 入囚運：中宮山星/向星數字 = 各自入囚之元運
  const qiu = '山' + r.plates.shan['中'] + '運·向' + r.plates.xiang['中'] + '運';
  const [grade, gcls] = gradeOf(sc);
  return { zx: '坐' + s + '向' + f, ge: r.pattern.name, rob, gate, ff: ff.join('、') || '—', combo, ccls, qiu, grade, gcls };
}

function tableHTML(p) {
  const body = ORDER.map(s => {
    const r = rowFor(p, s);
    return `      <tr class="${r.gcls}">
        <td class="zx">${r.zx}</td>
        <td>${r.ge}</td>
        <td>${r.rob}</td>
        <td>${r.gate}</td>
        <td>${r.ff}</td>
        <td class="${r.ccls}">${r.combo}</td>
        <td class="qiu">${r.qiu}</td>
        <td class="grade">${r.grade}</td>
      </tr>`;
  }).join('\n');
  const yuan = ['', '上元一運', '上元二運', '上元三運', '中元四運', '中元五運', '中元六運', '下元七運', '下元八運', '下元九運'][p];
  return `  <h2>${yuan}起造（${p}運）</h2>
  <table>
    <thead>
      <tr><th>坐向</th><th>格局</th><th>七星打劫</th><th>城門訣可用</th><th>全盤伏吟/反吟</th><th>連珠/連茹</th><th>入囚之運</th><th>吉凶</th></tr>
    </thead>
    <tbody>
${body}
    </tbody>
  </table>`;
}

const sections = [];
for (let p = 1; p <= 9; p++) sections.push(tableHTML(p));

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>玄空 216 局全表（一運至九運 × 二十四坐向）</title>
<style>
  :root{ --bg:#f6f1e7; --paper:#fbf7ee; --ink:#1a1a1a; --line:#cdbfa0; --yang:#8B5A2B; --hl:#c0392b; --muted:#8a7d63; }
  *{box-sizing:border-box}
  body{ margin:0; padding:24px; background:var(--bg); color:var(--ink);
        font-family:"Noto Serif TC","Songti TC","STKaiti","KaiTi","SimSun",serif; }
  h1{ text-align:center; font-size:22px; letter-spacing:2px; margin:0 0 4px; }
  .sub{ text-align:center; color:var(--muted); font-size:13px; margin-bottom:16px; line-height:1.7; }
  h2{ font-size:17px; color:var(--yang); border-left:5px solid var(--yang); padding-left:10px; margin:22px 0 8px; }
  table{ width:100%; border-collapse:collapse; background:var(--paper); box-shadow:0 2px 8px rgba(0,0,0,.07);
         margin-bottom:6px; font-size:12.5px; }
  th,td{ border:1px solid var(--line); padding:5px 6px; text-align:center; }
  thead th{ background:#efe6d2; font-weight:700; }
  td.zx{ font-weight:700; white-space:nowrap; }
  td.grade{ font-weight:800; }
  td.qiu{ color:var(--muted); white-space:nowrap; }
  td.c-good{ color:#1e7d34; font-weight:700; }
  td.c-bad{ color:var(--hl); font-weight:700; }
  tr.g-vg   { background:#e3f1e1; } tr.g-vg   td.grade{ color:#1e7d34; }
  tr.g-good { background:#eef6ea; } tr.g-good td.grade{ color:#2e7d32; }
  tr.g-mid  { background:transparent; } tr.g-mid td.grade{ color:var(--muted); }
  tr.g-weak { background:#fbf0e2; } tr.g-weak td.grade{ color:#b8860b; }
  tr.g-bad  { background:#f7dcd6; } tr.g-bad  td.grade{ color:var(--hl); }
  .legend{ font-size:12px; color:var(--muted); line-height:1.9; margin:10px 0 24px; }
  .legend b{ color:var(--ink); }
  @media print{ body{ background:#fff; padding:0; } table{ box-shadow:none; } h2{ break-after:avoid; } tr,table{ break-inside:avoid; } }
</style>
</head>
<body>
  <h1>玄空陽宅・216 局全表</h1>
  <div class="sub">一運至九運 × 二十四坐向（共 216 局）　·　依坐山排序，整列底色＝吉凶分級<br>
    「入囚之運」＝中宮山星/向星數字，即各自於該元運入囚（山星主人丁健康、向星主財富功名）。<br>
    本表為理氣參考，實際吉凶仍須配合外巒頭（山水、門路、氣口）與屋型，並非單看坐向。</div>

${sections.join('\n')}

  <div class="legend">
    <b>吉凶分級（理氣加權）：</b>大吉＝旺山旺向／連珠　吉＝雙星到向＋打劫可催　平＝雙星偏枯　偏弱＝帶伏吟反吟　凶＝上山下水／連茹。<br>
    <b>七星打劫</b>＝隱藏催財吉格（須三宮實體通氣）。　<b>城門訣</b>＝向首側方借當令旺氣（該方宜有門/路/水）。<br>
    <b>全盤伏吟/反吟</b>＝五黃入中，主大凶。　<b>連珠</b>＝滿盤河圖同道一六二七三八四九（大吉）；<b>連茹</b>＝滿盤連續八組（大凶）。
  </div>
</body>
</html>`;

fs.writeFileSync('玄空216局全表.html', html, 'utf8');
console.log('written: 玄空216局全表.html');
