/* =============================================================================
 *  紫白飛星  引擎  zibai.js
 *
 *  與「玄空陽宅」(xuankong.js) 同樣設計成「純函式引擎」：
 *    ‧ 所有資料與算法集中於此，作為單一真相來源（script.js 只負責 DOM／繪圖）。
 *    ‧ 不依賴 DOM，node 可直接 require 測試（檔末有 module.exports）。
 *    ‧ 對外暴露 window.ZiBai（瀏覽器）或 module.exports（node）。
 *
 *  五層飛星：① 宅星 ② 元運 ③ 流年 ④ 流月 ⑤ 命星(甲/乙)
 *  飛星一律順飛（紫白年月運命皆順，陰陽遁只用於玄空山向，不在此檔）。
 *
 *  ── 版本 ──────────────────────────────────────────────────────────────────
 *   v1.0.0  自 script.js 抽出純引擎：節氣換年月、流年/流月/元運/命卦、九宮順飛、
 *           五行五氣（旺生退死殺）、八宅遊星。三項升級一併收入：
 *             1. 命卦立春校正：mingGua(year, gender, month?, day?) —— 給月日且在立春前
 *                （國曆 < 2/4）自動歸前一年，月日省略則維持原行為（以「年」為三元年）。
 *             2. 斷語擴充：COMBINATION_RULES 由 6 條 → 20 條（紫白訣／玄空生剋）。
 *             3. detectCombos(stars) 純函式：兩兩比對回傳命中的格局，供 UI 與測試共用。
 * ===========================================================================*/
(function () {
  'use strict';

  const VERSION = '1.0.0';

  /* ---------- 1. 基礎資料 ---------- */

  const TWENTY_FOUR_MOUNTAINS = [
    '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙',
    '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'
  ];

  // 九星：名、義、五行直覺配色
  const FLYING_STARS_INFO = {
    1: { name: '一白貪狼', meaning: '桃花星', color: '#004ad2ff' },
    2: { name: '二黑巨門', meaning: '病符星', color: '#000000' },
    3: { name: '三碧蚩尤', meaning: '強盜星', color: '#2e7d32' },
    4: { name: '四綠文曲', meaning: '破財星', color: '#388e3c' },
    5: { name: '五黃廉貞', meaning: '毒癌星', color: '#a76400ff' },
    6: { name: '六白武曲', meaning: '偏財星', color: '#555555' },
    7: { name: '七赤破軍', meaning: '賊盜星', color: '#555555' },
    8: { name: '八白左輔', meaning: '財帛星', color: '#a76400ff' },
    9: { name: '九紫右弼', meaning: '喜慶星', color: '#af1010ff' }
  };

  const STAR_NAMES_SHORT = { 1: '一白', 2: '二黑', 3: '三碧', 4: '四綠', 5: '五黃', 6: '六白', 7: '七赤', 8: '八白', 9: '九紫' };

  // 順飛路徑（中宮起，依此序填八方）
  const LUO_SHU_PATH = ['乾', '兌', '艮', '離', '坎', '坤', '震', '巽'];

  const TWELVE_SHAS_SEQUENCE = ['太歲', '太陽', '喪門', '太陰', '官符', '死符', '歲破', '龍德', '白虎', '福德', '吊客', '病符'];

  // 八宅：乾坤生六子（代表家人、身體部位）＋八遊星（伏位/生氣/天醫/延年/六煞/禍害/五鬼/絕命）
  const GUA_DATA = {
    1: { name: '坎', number: 1, member: '中男(二子)', body: '耳、腎、血液、泌尿系統', stars: { '坎':'伏位', '巽':'生氣/吉', '震':'天醫', '離':'延年/吉', '乾':'六煞', '兌':'禍害', '艮':'五鬼', '坤':'絕命' } },
    2: { name: '坤', number: 2, member: '老母(女主人)', body: '腹、脾胃、肉、皮膚', stars: { '坤':'伏位', '艮':'生氣/吉', '兌':'天醫', '乾':'延年/吉', '離':'六煞', '震':'禍害', '巽':'五鬼', '坎':'絕命' } },
    3: { name: '震', number: 3, member: '長男(大子)', body: '足、肝臟、神經系統', stars: { '震':'伏位', '離':'生氣/吉', '坎':'天醫', '巽':'延年/吉', '艮':'六煞', '坤':'禍害', '乾':'五鬼', '兌':'絕命' } },
    4: { name: '巽', number: 4, member: '長女(大女)', body: '股(腿)、膽、呼吸系統', stars: { '巽':'伏位', '坎':'生氣/吉', '離':'天醫', '震':'延年/吉', '兌':'六煞', '乾':'禍害', '坤':'五鬼', '艮':'絕命' } },
    6: { name: '乾', number: 6, member: '老父(男主人)', body: '頭、面、骨骼、大腸', stars: { '乾':'伏位', '兌':'生氣/吉', '艮':'天醫', '坤':'延年/吉', '坎':'六煞', '巽':'禍害', '震':'五鬼', '離':'絕命' } },
    7: { name: '兌', number: 7, member: '少女(三女)', body: '口、舌、肺、呼吸道', stars: { '兌':'伏位', '乾':'生氣/吉', '坤':'天醫', '艮':'延年/吉', '巽':'六煞', '坎':'禍害', '離':'五鬼', '震':'絕命' } },
    8: { name: '艮', number: 8, member: '少男(三子)', body: '手、背、鼻、脾胃', stars: { '艮':'伏位', '坤':'生氣/吉', '乾':'天醫', '兌':'延年/吉', '震':'六煞', '離':'禍害', '坎':'五鬼', '巽':'絕命' } },
    9: { name: '離', number: 9, member: '中女(二女)', body: '目(眼)、心、血液循環', stars: { '離':'伏位', '震':'生氣/吉', '巽':'天醫', '坎':'延年/吉', '坤':'六煞', '艮':'禍害', '兌':'五鬼', '乾':'絕命' } }
  };

  // 八宮對沖（用於判定宅星「關」方＝氣口）
  const OPPOSITE_GUA = {
    '坎': '離', '離': '坎',
    '震': '兌', '兌': '震',
    '巽': '乾', '乾': '巽',
    '艮': '坤', '坤': '艮'
  };

  // 五行（單一來源，取代散落各處的重複表）
  const STAR_WUXING = { 1: 'Water', 2: 'Earth', 3: 'Wood', 4: 'Wood', 5: 'Earth', 6: 'Metal', 7: 'Metal', 8: 'Earth', 9: 'Fire' };
  const STAR_WUXING_ZH = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' };
  const GUA_WUXING_ZH = { '坎': '水', '坤': '土', '震': '木', '巽': '木', '乾': '金', '兌': '金', '艮': '土', '離': '火' };
  const GENERATE = { 'Wood': 'Fire', 'Fire': 'Earth', 'Earth': 'Metal', 'Metal': 'Water', 'Water': 'Wood' };
  const DESTROY = { 'Wood': 'Earth', 'Earth': 'Water', 'Water': 'Fire', 'Fire': 'Metal', 'Metal': 'Wood' };

  /* ---------- 2. 斷語庫：6 → 20 條（紫白訣／玄空二星生剋） ----------
   *  type: good/bad；stars: 兩星（順序不拘，detectCombos 會雙向比對）；
   *  desc: 象義；boost: 趨吉佈局（吉格才顯示）。
   */
  const COMBINATION_RULES = [
    // ── 吉格 ──
    { type: 'good', stars: [4, 1], name: '四一同宮', desc: '利文昌、考試、升遷與桃花。', boost: '建議佈局：放置四支水種萬年青或掛上四隻毛筆，引動文昌氣場。' },
    { type: 'good', stars: [1, 6], name: '一六共宗', desc: '水金相生，利文職顯貴、貴人提攜與添丁旺財。', boost: '建議佈局：放置金屬文具或六枚銅錢配清水一杯，催動官貴文名。' },
    { type: 'good', stars: [6, 8], name: '六八武科', desc: '大利武職、偏財、事業爆發。', boost: '建議佈局：放置金屬聚寶盆或銅製飾品，並鋪設黃色地墊催財。' },
    { type: 'good', stars: [8, 9], name: '八九同宮', desc: '大吉慶、婚喜、財運亨通。', boost: '建議佈局：放置紅色中國結或點亮紅燈，引動喜慶財氣。' },
    { type: 'good', stars: [4, 9], name: '四九合十', desc: '木火通明，主文章科名、聰明顯達。', boost: '建議佈局：書桌置綠植配暖燈，木火相生助讀書考運。' },
    // ── 凶格 ──
    { type: 'bad', stars: [2, 5], name: '二五交加', desc: '土氣過旺、病符遇五黃，主重病、血光、意外。' },
    { type: 'bad', stars: [5, 9], name: '五九增煞', desc: '九火助五黃，毒上加毒，防火災、血光、目疾。' },
    { type: 'bad', stars: [2, 3], name: '鬥牛煞', desc: '二三鬥牛，主是非、官非、口舌與家宅不和。' },
    { type: 'bad', stars: [6, 7], name: '交劍煞', desc: '金金相鬥，主官非爭鬥、刀傷、手術。' },
    { type: 'bad', stars: [7, 9], name: '九七穿途', desc: '注意火災、心血管疾病或官非。' },
    { type: 'bad', stars: [3, 7], name: '三七疊臨', desc: '注意遭竊盜、金屬所傷或劫財破財。' },
    { type: 'bad', stars: [6, 9], name: '火燒天門', desc: '九火剋六金，主老父咳嗽、頭疾、官非與火災。' },
    { type: 'bad', stars: [2, 7], name: '二七同道', desc: '先天火數，防火災、心血、婦科血光。' },
    { type: 'bad', stars: [5, 7], name: '五七化毒', desc: '主中毒、口舌、桃花劫與暗疾。' },
    { type: 'bad', stars: [4, 6], name: '四六受剋', desc: '六金剋四木，主肝膽、股腿不適，長女不利。' },
    { type: 'bad', stars: [2, 4], name: '二四不和', desc: '四木剋二土，主脾胃腹疾、婆媳口角。' },
    { type: 'bad', stars: [3, 6], name: '三六受剋', desc: '六金剋三木，主長男手足、肝病與官非。' },
    { type: 'bad', stars: [4, 7], name: '四七受剋', desc: '七金剋四木，主長女股疾、桃花是非。' },
    { type: 'bad', stars: [1, 5], name: '一五犯毒', desc: '五土剋一水，主中男腎、泌尿與中毒之患。' },
    { type: 'bad', stars: [3, 5], name: '三五激煞', desc: '三木剋五土反激五黃，主脾胃、肝病與是非。' }
  ];

  /* ---------- 3. 純函式 ---------- */

  // 節氣換年月：回傳 { fsYear, fsMonth(1=正月…12), termName }
  function getSolarTermMonth(targetDate) {
    const d0 = targetDate || new Date();
    const y = d0.getFullYear();
    const m = d0.getMonth() + 1;
    const d = d0.getDate();
    const md = m * 100 + d;

    const terms = [
      { name: '小寒', md: 105, month: 12, yearOffset: -1 },
      { name: '立春', md: 204, month: 1, yearOffset: 0 },
      { name: '驚蟄', md: 305, month: 2, yearOffset: 0 },
      { name: '清明', md: 405, month: 3, yearOffset: 0 },
      { name: '立夏', md: 505, month: 4, yearOffset: 0 },
      { name: '芒種', md: 605, month: 5, yearOffset: 0 },
      { name: '小暑', md: 707, month: 6, yearOffset: 0 },
      { name: '立秋', md: 807, month: 7, yearOffset: 0 },
      { name: '白露', md: 907, month: 8, yearOffset: 0 },
      { name: '寒露', md: 1008, month: 9, yearOffset: 0 },
      { name: '立冬', md: 1107, month: 10, yearOffset: 0 },
      { name: '大雪', md: 1207, month: 11, yearOffset: 0 }
    ];

    let currentTerm = terms[0];
    for (let i = terms.length - 1; i >= 0; i--) {
      if (md >= terms[i].md) { currentTerm = terms[i]; break; }
    }

    let fsYear = y + currentTerm.yearOffset;
    if (md < 204) fsYear = y - 1;
    return { fsYear, fsMonth: currentTerm.month, termName: currentTerm.name };
  }

  // 流月紫白：子午卯酉起八白、辰戌丑未起五黃、寅申巳亥起二黑，逐月降
  function calculateMonthStar(fsYear, fsMonth) {
    const yearBranchIndex = (fsYear - 4) % 12;
    let startStar;
    if ([0, 3, 6, 9].includes(yearBranchIndex)) { startStar = 8; }
    else if ([1, 4, 7, 10].includes(yearBranchIndex)) { startStar = 5; }
    else { startStar = 2; }

    let star = startStar - (fsMonth - 1);
    while (star <= 0) star += 9;
    return star;
  }

  // 元運：1864 上元一運起算，每運 20 年
  function calculatePeriodStar(fsYear) {
    let period = ((Math.floor((fsYear - 1864) / 20) + 1) % 9);
    return period === 0 ? 9 : period;
  }

  // 流年紫白（下元，逐年降）
  function annualStar(fsYear) {
    return (11 - (fsYear % 9)) % 9 || 9;
  }

  // 三元命卦。month/day 省略 → 以 birthYear 為三元年（維持舊行為）；
  // 給月日且國曆早於立春(< 2/4) → 歸前一年。回傳 GUA_DATA 物件。
  function mingGua(birthYear, gender, month, day) {
    let y = birthYear;
    if (month != null && day != null && (month * 100 + day) < 204) y = birthYear - 1;

    let sum = y.toString().split('').map(Number).reduce((a, b) => a + b, 0);
    while (sum > 9) sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);

    let kua = (gender === 'male') ? (11 - sum) : (4 + sum);
    while (kua > 9) kua -= 9;
    if (kua === 5) kua = (gender === 'male') ? 2 : 8;
    return GUA_DATA[kua];
  }

  function getGanzhiYear(fsYear) {
    const stems = ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'];
    const branches = ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'];
    return stems[fsYear % 10] + branches[fsYear % 12];
  }

  // 九宮順飛：中宮數入中，回傳指定卦方的星
  function getStarInGua(centerNum, targetGua) {
    const index = LUO_SHU_PATH.indexOf(targetGua);
    let num = (centerNum + index + 1) % 9;
    return num === 0 ? 9 : num;
  }

  function getWuXing(starNum) {
    return STAR_WUXING[starNum];
  }

  // 五氣：以中宮(主)對宮位(客)論生剋 → 旺/生/退/死/殺（含配色）
  function getFiveQi(centerStar, palaceStar) {
    const cElem = STAR_WUXING[centerStar];
    const pElem = STAR_WUXING[palaceStar];

    if (cElem === pElem) return { qi: '旺', color: '#e91700ff' };
    if (GENERATE[pElem] === cElem) return { qi: '生', color: '#e91700ff' }; // 客生主
    if (GENERATE[cElem] === pElem) return { qi: '退', color: '#004ad2ff' }; // 主生客
    if (DESTROY[pElem] === cElem) return { qi: '殺', color: '#000000' };   // 客剋主
    if (DESTROY[cElem] === pElem) return { qi: '死', color: '#000000' };   // 主剋客
    return { qi: '', color: '' };
  }

  // 兩兩比對活躍星，回傳命中的格局（純資料，UI 與測試共用）
  //   stars: [{ name, val }, ...]
  //   回傳: [{ rule, s1, s2 }, ...]（已去重，同一對星同一格局只回一次）
  function detectCombos(stars) {
    const hits = [];
    const seen = new Set();
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const s1 = stars[i];
        const s2 = stars[j];
        COMBINATION_RULES.forEach(rule => {
          const [v1, v2] = rule.stars;
          const isMatch = (s1.val === v1 && s2.val === v2) || (s1.val === v2 && s2.val === v1);
          if (!isMatch) return;
          const key = `${s1.name}-${s2.name}-${rule.name}`;
          if (seen.has(key)) return;
          seen.add(key);
          hits.push({ rule, s1, s2 });
        });
      }
    }
    return hits;
  }

  /* ---------- 4. 對外介面 ---------- */
  const ZiBai = {
    VERSION,
    // 資料
    TWENTY_FOUR_MOUNTAINS, FLYING_STARS_INFO, STAR_NAMES_SHORT, LUO_SHU_PATH,
    TWELVE_SHAS_SEQUENCE, GUA_DATA, OPPOSITE_GUA, COMBINATION_RULES,
    STAR_WUXING, STAR_WUXING_ZH, GUA_WUXING_ZH,
    // 函式
    getSolarTermMonth, calculateMonthStar, calculatePeriodStar, annualStar,
    mingGua, getGanzhiYear, getStarInGua, getWuXing, getFiveQi, detectCombos
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = ZiBai;
  if (typeof window !== 'undefined') window.ZiBai = ZiBai;
})();
