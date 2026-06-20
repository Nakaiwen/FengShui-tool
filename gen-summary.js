/* 一次性產生器：產出「玄空坐向吉凶總表」HTML（八運／九運）。 */
const fs = require('fs');
global.window = {};
global.document = { createElementNS: () => ({ setAttribute() {}, appendChild() {}, set textContent(v) {} }) };
require('./xuankong.js');
const XK = global.window.XuanKong;

const ORDER = ['子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥','壬'];
const opp = m => ORDER[(ORDER.indexOf(m) + 12) % 24];
const BASE = { '旺山旺向': 100, '雙星到向': 40, '雙星到坐': 35, '一般格局': 10, '上山下水': -100 };
const CUR = 9; // 現運：下元九運

function gradeOf(sc) {
  if (sc >= 90) return ['大吉', 'g-vg'];
  if (sc >= 70) return ['吉', 'g-good'];
  if (sc >= 40) return ['平', 'g-mid'];
  if (sc >= 1)  return ['偏弱', 'g-weak'];
  return ['凶', 'g-bad'];
}

function rows(p) {
  const out = [];
  for (const s of ORDER) {
    const f = opp(s);
    const r = XK.compute(p, f, s, CUR);
    let sc = BASE[r.pattern.name] || 0;
    // 七星打劫
    const b = r.advanced.robbery;
    let rob = '—';
    if (b.applicable) {
      if (b.success) { rob = b.subtype; sc += (b.subtype === '真打劫' ? 30 : 20); }
      else rob = '打劫失敗';
    }
    // 城門
    const gates = r.advanced.castleGate.filter(c => c.valid);
    let gate = '—';
    if (gates.length) { gate = gates.map(g => g.dir + g.palace).join('、'); sc += 12 * gates.length; }
    // 全盤伏吟反吟
    const ff = [];
    if (r.fanFu.shan) { ff.push('山' + r.fanFu.shan); sc -= 50; }
    if (r.fanFu.xiang) { ff.push('向' + r.fanFu.xiang); sc -= 50; }
    // 入囚（現運）
    const qiu = [];
    if (r.imprisonment.shanQiu) { qiu.push('山'); sc -= 20; }
    if (r.imprisonment.xiangQiu) { qiu.push('向'); sc -= 20; }
    const [grade, gcls] = gradeOf(sc);
    out.push({
      zx: '坐' + s + '向' + f, ge: r.pattern.name, rob, gate,
      ff: ff.join('、') || '—', qiu: qiu.length ? qiu.join('、') + '星' : '—',
      sc, grade, gcls,
    });
  }
  out.sort((a, b) => b.sc - a.sc);
  return out;
}

function tableHTML(p, label) {
  const rs = rows(p);
  const body = rs.map(r => `      <tr class="${r.gcls}">
        <td class="zx">${r.zx}</td>
        <td>${r.ge}</td>
        <td>${r.rob}</td>
        <td>${r.gate}</td>
        <td>${r.ff}</td>
        <td>${r.qiu}</td>
        <td class="grade">${r.grade}</td>
      </tr>`).join('\n');
  return `  <h2>${label}</h2>
  <table>
    <thead>
      <tr><th>坐向</th><th>格局</th><th>七星打劫</th><th>城門訣可用</th><th>全盤伏吟/反吟</th><th>入囚<br>(現運九運)</th><th>吉凶</th></tr>
    </thead>
    <tbody>
${body}
    </tbody>
  </table>`;
}

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>玄空坐向吉凶總表（八運／九運）</title>
<style>
  :root{ --bg:#f6f1e7; --paper:#fbf7ee; --ink:#1a1a1a; --line:#cdbfa0; --yang:#8B5A2B; --hl:#c0392b; --muted:#8a7d63; }
  *{box-sizing:border-box}
  body{ margin:0; padding:24px; background:var(--bg); color:var(--ink);
        font-family:"Noto Serif TC","Songti TC","STKaiti","KaiTi","SimSun",serif; }
  h1{ text-align:center; font-size:22px; letter-spacing:2px; margin:0 0 4px; }
  .sub{ text-align:center; color:var(--muted); font-size:13px; margin-bottom:18px; line-height:1.7; }
  h2{ font-size:18px; color:var(--yang); border-left:5px solid var(--yang); padding-left:10px; margin:24px 0 10px; }
  table{ width:100%; border-collapse:collapse; background:var(--paper); box-shadow:0 2px 10px rgba(0,0,0,.08);
         margin-bottom:8px; font-size:13.5px; }
  th,td{ border:1px solid var(--line); padding:7px 8px; text-align:center; }
  thead th{ background:#efe6d2; color:var(--ink); font-weight:700; }
  td.zx{ font-weight:700; white-space:nowrap; }
  td.grade{ font-weight:800; }
  /* 吉凶整列底色 */
  tr.g-vg   { background:#e3f1e1; } tr.g-vg   td.grade{ color:#1e7d34; }
  tr.g-good { background:#eef6ea; } tr.g-good td.grade{ color:#2e7d32; }
  tr.g-mid  { background:transparent; } tr.g-mid td.grade{ color:var(--muted); }
  tr.g-weak { background:#fbf0e2; } tr.g-weak td.grade{ color:#b8860b; }
  tr.g-bad  { background:#f7dcd6; } tr.g-bad  td.grade{ color:var(--hl); }
  .legend{ font-size:12px; color:var(--muted); line-height:1.9; margin:6px 0 18px; }
  .legend b{ color:var(--ink); }
  @media print{ body{ background:#fff; padding:0; } table{ box-shadow:none; } h2{ break-after:avoid; } tr{ break-inside:avoid; } }
</style>
</head>
<body>
  <h1>玄空陽宅・坐向吉凶總表</h1>
  <div class="sub">八運（2004–2043，按 2004–2023 起造）／九運（2024–2043 起造）　·　入囚以「現運下元九運（2024–2043）」評估<br>本表為理氣參考，實際吉凶仍須配合外巒頭（山水、門路、氣口）與屋型，並非單看坐向。</div>

${tableHTML(8, '八運起造（下元八運 2004–2023）')}
${tableHTML(9, '九運起造（下元九運 2024–2043）')}

  <div class="legend">
    <b>吉凶分級（玄空理氣加權，已扣入囚/反吟、加計打劫/城門）：</b><br>
    大吉＝旺山旺向（丁財兩旺）　吉＝雙星到向＋七星打劫可催旺　平＝雙星到向/到坐（偏枯）　偏弱＝帶入囚或反吟　凶＝上山下水（丁財兩敗）<br>
    <b>七星打劫</b>＝隱藏催財吉格，須該三宮實體通氣（門/窗/陽台）方生效。　<b>城門訣</b>＝向首側方可借當令旺氣，該方宜有門/路/水。<br>
    <b>入囚</b>＝中宮山星/向星＝當令九運，山星主人丁健康、向星主財富功名，當運入囚主退氣。　<b>全盤伏吟/反吟</b>＝五黃入中，主大凶。
  </div>
</body>
</html>`;

fs.writeFileSync('玄空坐向吉凶總表.html', html, 'utf8');
console.log('written: 玄空坐向吉凶總表.html');
