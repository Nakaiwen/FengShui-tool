/* =============================================================================
 *  玄空陽宅飛星排盤系統  xuankong.js
 *
 *  與既有「紫白飛星」(script.js) 完全分離，互不污染。
 *  對外只暴露 window.XuanKong。
 *
 *  ── 設計重點 ──────────────────────────────────────────────────────────────
 *   1. 引擎為純函式：compute(period, facingMtn, sittingMtn, currentPeriod) → 結果物件。
 *      不依賴 DOM，方便單獨測試。
 *   2. 繪圖採「九宮方盤」（上南下北、3×3、外周二十四山），便於套住宅平面圖：
 *        ‧ 每格 → 山星左上、向星右上、運星下中、方位卦名在底
 *        ‧ 數字 → 運星國字、山星/向星阿拉伯（同師承）
 *   3. 配色沿用 bazi-circle-chart：宣紙底、墨色、褐色、朱砂紅高亮。
 *      （CSS 變數定義在 #xuankong-view，SVG 內以 var(--…) 取用。）
 *
 *  座向約定：與 script.js 一致 —— 角度滑桿值＝「向」(facing) 度數，
 *           坐山＝(向+180)°。本檔直接吃「坐山名 / 向山名」字串。
 * ===========================================================================*/
(function () {
  'use strict';

  /* ---------- 版本 ----------
   *  v1.0.0  玄空引擎（運/山/向盤＋四大格局：旺山旺向/雙星到向/雙星到坐/上山下水）
   *          ＋兩圈圍繞圓心圓盤（國字、bazi 配色）＋當令旺星高亮＋坐/向宮位底色。
   *  v1.1.0  進階法訣：七星打劫（真＝離震乾／假＝坎巽兌）＋城門訣（向首相鄰宮動態飛星）。
   *          盤面：打劫三宮金色虛線框、可用城門綠字標註；資訊區列出細節與巒頭提示。
   *  v1.1.1  七星打劫條件三：伏吟/反吟改以「山星＋向星」判斷。
   *  v1.2.0  新增「九宮方盤」畫法（上南下北、3×3、外周二十四山，便於套住宅平面圖）；玄空內可圓盤/方盤切換。
   *          數字呈現：運星國字、山星/向星阿拉伯（同師承）；圓盤山/向改正立以利辨識。
   *  v1.2.1  七星打劫：真／假以「真優先」（離震乾先成三般卦＝真，否則坎巽兌＝假）。
   *  v1.2.2  七星打劫條件三（伏吟/反吟）改為「向首宮」判斷：向首山星向星(＝當令元運數)
   *          與向首宮洛書數相同(伏吟)或相加為10(反吟)則打劫失敗。
   *  v1.2.3  七星打劫條件二改為「向首閘門」：向首在離震乾→查離震乾(真)、向首在坎巽兌→查坎巽兌(假)。
   *          （八運丙山壬向＝假打劫；九運巳山亥向＝真打劫。）
   *  v1.3.0  新增「入囚」判斷：中宮山星/向星數字＝當前元運 → 入囚（山星主人丁健康、向星主財富功名）。
   *          當前元運依現今日期自動推算（下元九運 2024–2043＝9）。
   *  v1.3.1  移除「玄空圓盤」，只保留九宮方盤（套平面圖較直覺）。
   *  v1.3.2  新增「全盤山星/向星 伏吟・反吟」判斷（五黃入中時整盤＝洛書或對沖盤，主大凶）。
   *  v1.3.3  新增山向二星組合判斷。
   *  v1.4.0  新增「逐宮山向組合斷語」(45 組對照，COMBO 表)，列於入囚下方。
   *  v1.4.1  連珠格/連茹格改為「滿盤格局」：四組河圖同道全現＝連珠(大吉)、連續八組全現＝連茹(大凶)。
   */
  const VERSION = 'v1.4.1';

  /* ---------- 1. 基礎常量 ---------- */

  // 八卦 ↔ 洛書元旦盤數字（中宮 5）
  const GUA_NUM = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 中: 5, 乾: 6, 兌: 7, 艮: 8, 離: 9 };
  const NUM_GUA = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兌', 8: '艮', 9: '離' };

  // 二十四山資料：所屬卦、三元龍（天/地/人）、玄空陰陽（陽順 / 陰逆）
  const MTN = {
    壬: { gua: '坎', dragon: '地', yy: '陽' },
    子: { gua: '坎', dragon: '天', yy: '陰' },
    癸: { gua: '坎', dragon: '人', yy: '陰' },
    丑: { gua: '艮', dragon: '地', yy: '陰' },
    艮: { gua: '艮', dragon: '天', yy: '陽' },
    寅: { gua: '艮', dragon: '人', yy: '陽' },
    甲: { gua: '震', dragon: '地', yy: '陽' },
    卯: { gua: '震', dragon: '天', yy: '陰' },
    乙: { gua: '震', dragon: '人', yy: '陰' },
    辰: { gua: '巽', dragon: '地', yy: '陰' },
    巽: { gua: '巽', dragon: '天', yy: '陽' },
    巳: { gua: '巽', dragon: '人', yy: '陽' },
    丙: { gua: '離', dragon: '地', yy: '陽' },
    午: { gua: '離', dragon: '天', yy: '陰' },
    丁: { gua: '離', dragon: '人', yy: '陰' },
    未: { gua: '坤', dragon: '地', yy: '陰' },
    坤: { gua: '坤', dragon: '天', yy: '陽' },
    申: { gua: '坤', dragon: '人', yy: '陽' },
    庚: { gua: '兌', dragon: '地', yy: '陽' },
    酉: { gua: '兌', dragon: '天', yy: '陰' },
    辛: { gua: '兌', dragon: '人', yy: '陰' },
    戌: { gua: '乾', dragon: '地', yy: '陰' },
    乾: { gua: '乾', dragon: '天', yy: '陽' },
    亥: { gua: '乾', dragon: '人', yy: '陽' },
  };

  // 由「卦 + 龍別」反查二十四山（判定陰陽用）
  function mountainOf(gua, dragon) {
    for (const m in MTN) {
      if (MTN[m].gua === gua && MTN[m].dragon === dragon) return m;
    }
    return null;
  }

  // 九宮飛星路徑（以宮名表示）。值沿路徑每步 +1（mod 9）。
  //   順飛：中 → 乾 → 兌 → 艮 → 離 → 坎 → 坤 → 震 → 巽
  //   逆飛：中 → 巽 → 震 → 坤 → 坎 → 離 → 艮 → 兌 → 乾
  //   （逆飛＝順飛路徑反向；數學上與「固定路徑、值 -1」同餘，等價。）
  const PATH_FWD = ['中', '乾', '兌', '艮', '離', '坎', '坤', '震', '巽'];
  const PATH_REV = ['中', '巽', '震', '坤', '坎', '離', '艮', '兌', '乾'];

  // 八卦對應方位（後天八卦）
  const GUA_DIR = { 坎: '正北', 坤: '西南', 震: '正東', 巽: '東南', 乾: '西北', 兌: '正西', 艮: '東北', 離: '正南' };

  // 紫白星名（顯示用）
  const STAR_NAME = { 1: '一白', 2: '二黑', 3: '三碧', 4: '四綠', 5: '五黃', 6: '六白', 7: '七赤', 8: '八白', 9: '九紫' };

  // 運星以國字呈現（同師承與參考圖）；山星/向星用阿拉伯數字
  const NUM_CN = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };

  // 山向二星組合斷語（以無序數對 min-max 為 key；tone: good/bad/mixed）。
  const COMBO = {
    '11': { name: '一一比和', tone: 'mixed', desc: '雙水比和，當令主吉旺，失令主水患、血光。' },
    '12': { name: '中男滅絕', tone: 'bad', desc: '土剋水，中男受剋、受年長女性壓制，主腎、耳之疾。' },
    '13': { name: '震坎乍交', tone: 'bad', desc: '水生木乏交媾，男性口角是非、結社衝突。' },
    '14': { name: '四一同宮', tone: 'good', desc: '當令主科甲文昌；失令「四蕩一淫」主沉迷情慾。' },
    '15': { name: '一五廉貞', tone: 'bad', desc: '土剋水，主腎病、腸病、性病、婦女病、潰瘍。' },
    '16': { name: '水淫天門', tone: 'mixed', desc: '金生水過旺，精力旺盛而傾肉慾，家庭關係易亂。' },
    '17': { name: '金水多情', tone: 'bad', desc: '貪花戀酒、白虎墮胎煞，主桃花、孕婦不利、水厄。' },
    '18': { name: '中男受剋', tone: 'bad', desc: '土剋水，中男受剋，主耳鳴、耳疾。' },
    '19': { name: '離壬合十', tone: 'good', desc: '水火交會，得媒介則位高權重、利求子；失調則相衝。' },
    '22': { name: '二二寡婦', tone: 'bad', desc: '比和寡婦屋，退運主重病，主孤寡。' },
    '23': { name: '鬥牛煞', tone: 'bad', desc: '木剋土，長男剋母，滿室鬥氣爭執、胃病，夫易病。' },
    '24': { name: '欺姑之媳', tone: 'bad', desc: '木剋土，婆媳不睦、婆婆受欺壓。' },
    '25': { name: '二五交加', tone: 'bad', desc: '必損主！雙凶星聚，主橫禍、重病甚至死亡。' },
    '26': { name: '富比陶朱', tone: 'good', desc: '土生金，妻助夫合力發財；亦宜作神房。' },
    '27': { name: '二七合火', tone: 'bad', desc: '純陰，不正桃花/母女相爭，合火主火災、癌症。' },
    '28': { name: '寡婦虛空', tone: 'bad', desc: '寡母撫幼，尼姑庵格局。' },
    '29': { name: '火見土絕', tone: 'bad', desc: '火生土成熱泥，出愚頑之夫，性情變蠢惡。' },
    '33': { name: '蚩尤煞', tone: 'bad', desc: '雙木比和，鬥爭死纏、性格惡劣不仁。' },
    '34': { name: '碧綠風塵', tone: 'bad', desc: '雙木交會，頹廢、乞丐、盜賊，易引賊入屋。' },
    '35': { name: '寒戶遭瘟', tone: 'bad', desc: '木剋土，主瘟疫、傳染病、嚴重精神疾病。' },
    '36': { name: '天門受煞', tone: 'bad', desc: '金剋木，長者手腳刀傷、肝病、開刀。' },
    '37': { name: '三七疊至', tone: 'bad', desc: '賊匪官災，盜賊黑道，下屬反骨。' },
    '38': { name: '傷小口', tone: 'bad', desc: '木剋土，幼童易遭意外傷害。' },
    '39': { name: '木火通明', tone: 'good', desc: '木生火，孕育聰明出眾之才，惟個性較刻薄。' },
    '44': { name: '瘋瘟之症', tone: 'bad', desc: '雙風星，呼吸不順、濕重、水腫風寒。' },
    '45': { name: '廉貞風魔', tone: 'bad', desc: '木剋土，主瘋瘟、瘟疫、精神異常。' },
    '46': { name: '鼓盆之歎', tone: 'bad', desc: '金剋木剋妻，懸樑之犯，主婦易意外傷害。' },
    '47': { name: '刀傷之險', tone: 'bad', desc: '金剋木，主婦或女性刀傷、金屬意外。' },
    '48': { name: '小口也瘋', tone: 'bad', desc: '木剋土傷小口，孩童風寒、嚴重者精神異常。' },
    '49': { name: '風吹火動', tone: 'mixed', desc: '木生火主聰明，惟風助火易引火災。' },
    '55': { name: '五黃五傷', tone: 'bad', desc: '凶性極烈，主血光，孕婦小孩極不利，忌火土生旺。' },
    '56': { name: '土埋絕症', tone: 'bad', desc: '土生金，頭痛骨病、癌症，或入獄、山泥傾瀉。' },
    '57': { name: '紫黃毒藥', tone: 'bad', desc: '兌口休嘗，主癌症、食物中毒、服錯藥。' },
    '58': { name: '小口遭殃', tone: 'bad', desc: '雙土交會，小孩嚴重問題、骨痛。' },
    '59': { name: '土鈍執拗', tone: 'bad', desc: '火炎土燥，主愚鈍執拗；凶星需動氣方發。' },
    '66': { name: '乾為天', tone: 'mixed', desc: '雙金比和，當令升官發財；失令骨折、官非。' },
    '67': { name: '交劍煞', tone: 'bad', desc: '金金相交，刀光劍影、開刀、武鬥意外。' },
    '68': { name: '富比陶朱', tone: 'good', desc: '土生金，極佳財星，財富豐盈。' },
    '69': { name: '火燒天門', tone: 'bad', desc: '火熔金，父/長子意外、頸疾，肺病咳血。' },
    '77': { name: '醫卜興家', tone: 'mixed', desc: '雙金比和，可憑醫卜興家；惟口腔毛病、主婦孕婦不利。' },
    '78': { name: '生財置業', tone: 'good', desc: '土生金，財運亨通，利置產、不動產。' },
    '79': { name: '七九回祿', tone: 'bad', desc: '火剋金，財因火災/虧損歸還，主嚴重破財。' },
    '88': { name: '八八到會', tone: 'good', desc: '雙土比和，八運最佳，大旺田產、人丁。' },
    '89': { name: '婚喜重來', tone: 'good', desc: '火生土，喜事重重大旺發；遇尖角煞易眼疾。' },
    '99': { name: '青雲之路', tone: 'good', desc: '雙火比和，名利雙全、步步高升、高智慧；遇尖煞主眼疾。' },
  };
  // 逐宮取山向組合斷語
  function palaceCombos(plates) {
    const order = ['離', '坤', '兌', '乾', '坎', '艮', '震', '巽', '中'];
    return order.map(g => {
      const s = plates.shan[g], x = plates.xiang[g];
      const key = '' + Math.min(s, x) + Math.max(s, x);
      const m = COMBO[key] || { name: '', tone: 'mixed', desc: '' };
      return { gua: g, dir: (g === '中' ? '中宮' : GUA_DIR[g]), shan: s, xiang: x, name: m.name, tone: m.tone, desc: m.desc };
    });
  }

  /* ---------- 2. 排盤引擎 ---------- */

  // 某數入中、順/逆飛，回傳 { 宮名: 數值 }
  function fly(centerNum, forward) {
    const path = forward ? PATH_FWD : PATH_REV;
    const plate = {};
    for (let i = 0; i < 9; i++) {
      plate[path[i]] = ((centerNum - 1 + i) % 9) + 1; // 值每步 +1
    }
    return plate;
  }

  // 決定山盤/向盤的順逆飛
  //   centerNum：入中之運星數字
  //   dragon   ：坐山(或向山)的三元龍
  //   originMtn：坐山(或向山)本身（五黃入中時取用）
  function decideForward(centerNum, dragon, originMtn) {
    if (centerNum === 5) {
      // 五黃入中特殊規則：以坐山(或向山)本身的陰陽決定順逆
      return MTN[originMtn].yy === '陽';
    }
    const oGua = NUM_GUA[centerNum];          // 該運星數字在洛書的原宮
    const m = mountainOf(oGua, dragon);       // 原宮中同龍別的山
    return MTN[m].yy === '陽';                 // 陽→順飛(true)、陰→逆飛(false)
  }

  // 格局判定
  function detectPattern(period, plates, sittingGua, facingGua) {
    const shanAtSit = plates.shan[sittingGua] === period;
    const shanAtFac = plates.shan[facingGua] === period;
    const xiangAtSit = plates.xiang[sittingGua] === period;
    const xiangAtFac = plates.xiang[facingGua] === period;

    if (shanAtSit && xiangAtFac) {
      return {
        name: '旺山旺向', tone: 'good',
        desc: '丁財兩旺。坐方宜見高樓、靠山；向方宜見開闊馬路或水景。',
      };
    }
    if (shanAtFac && xiangAtFac) {
      return {
        name: '雙星到向', tone: 'mild',
        desc: '旺財損丁。大門或向方宜有開闊空間或水，且水外要有高樓襯托。',
      };
    }
    if (shanAtSit && xiangAtSit) {
      return {
        name: '雙星到坐', tone: 'mild',
        desc: '旺丁破財。坐方需同時具備水（近景）與山（遠景）之巒頭。',
      };
    }
    if (shanAtFac && xiangAtSit) {
      return {
        name: '上山下水', tone: 'bad',
        desc: '丁財兩敗，主凶。除非外部地形為顛山倒水（坐方低窪見水、向方高亢見山）方能化解。',
      };
    }
    return { name: '一般格局', tone: 'mild', desc: '非四大典型格局，需依各宮飛星組合與外巒頭細斷。' };
  }

  /* ---------- 進階法訣：七星打劫、城門訣 ---------- */

  // 三般卦有效集合
  const SANBAN_SETS = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
  // 真打劫局：檢查離震乾三宮；假打劫局：檢查坎巽兌三宮
  const TRIO_TRUE = ['離', '震', '乾'];
  const TRIO_FALSE = ['坎', '巽', '兌'];

  // 三宮的向星是否「恰好組成」某一組三般卦（順序不拘、需三數皆異）
  function trioFormsSanban(palaces, plate) {
    const set = new Set(palaces.map(g => plate[g]));
    if (set.size !== 3) return false;
    return SANBAN_SETS.some(vs => vs.every(n => set.has(n)));
  }
  // 山向二星「滿盤格局」：
  //   連珠格(大吉)＝整盤九宮的山向對中，河圖同道四組「一六、二七、三八、四九」全部出現。
  //   連茹格(大凶)＝整盤中，連續八組「一二、二三…八九」全部出現。
  const PEARL_SETS = ['1-6', '2-7', '3-8', '4-9'];
  const RU_SETS = ['1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9'];
  function detectStarCombos(plates) {
    const pairs = new Set();
    for (const g in GUA_NUM) {
      const s = plates.shan[g], x = plates.xiang[g];
      pairs.add(Math.min(s, x) + '-' + Math.max(s, x));
    }
    return {
      pearl: PEARL_SETS.every(p => pairs.has(p)),
      ru: RU_SETS.every(p => pairs.has(p)),
    };
  }

  // 全盤伏吟/反吟：整盤每宮的星＝洛書數(伏吟) 或 ＝對沖數10-洛書(反吟)。只有五黃入中才會發生。
  function fullPlateFuFan(plate) {
    let fu = true, fan = true;
    for (const g in GUA_NUM) {
      if (plate[g] !== GUA_NUM[g]) fu = false;
      if (plate[g] !== 10 - GUA_NUM[g]) fan = false;
    }
    return fu ? '伏吟' : fan ? '反吟' : null;
  }

  // 七星打劫判定（僅在「雙星到向」基礎格局下啟動）
  function detectRobbery(plates, patternName, period, facingGua) {
    if (patternName !== '雙星到向') return { applicable: false };
    const x = plates.xiang;
    // 條件二：依向首所在卦組判真假——向首在離震乾→查離震乾(真)；向首在坎巽兌→查坎巽兌(假)
    let subtype = null, palaces = null;
    if (TRIO_TRUE.includes(facingGua)) { subtype = '真打劫'; palaces = TRIO_TRUE; }
    else if (TRIO_FALSE.includes(facingGua)) { subtype = '假打劫'; palaces = TRIO_FALSE; }
    else return { applicable: true, success: false, reason: '向首在坤／艮，不在父母三般卦線上，無七星打劫' };
    if (!trioFormsSanban(palaces, x)) {
      return { applicable: true, success: false, subtype, reason: '向首屬' + palaces.join('') + '組，但該組向星未組成三般卦' };
    }
    const stars = palaces.map(g => x[g]);
    // 條件三：向首宮的山星向星(＝當令元運數)若與向首宮洛書數伏吟(相同)或反吟(相加為10)，打劫失敗
    const baseFac = GUA_NUM[facingGua];
    if (period === baseFac || period + baseFac === 10) {
      const kind = (period === baseFac) ? '伏吟' : '反吟';
      return {
        applicable: true, success: false, subtype, palaces: palaces.slice(), stars,
        reason: kind + '盤（向首' + facingGua + '宮洛書數' + baseFac + '、當令' + period + '），氣場卡死，打劫失敗',
      };
    }
    return {
      applicable: true, success: true, subtype, palaces: palaces.slice(), stars,
      warning: '巒頭必須配合：此三宮須互相通氣（門/窗/走道/陽台），不可為封閉實牆、無窗廁所或陰暗儲藏室，否則打劫無效。',
    };
  }

  // 城門訣：向首左右相鄰兩宮（後天八卦順逆相鄰）
  const ADJACENT = {
    坎: ['乾', '艮'], 艮: ['坎', '震'], 震: ['艮', '巽'], 巽: ['震', '離'],
    離: ['巽', '坤'], 坤: ['離', '兌'], 兌: ['坤', '乾'], 乾: ['兌', '坎'],
  };
  // 城門訣判定：對向首相鄰兩宮，取同向山元龍之落點山，動態飛星，看是否飛回當令元運數
  function computeCastleGate(period, yun, facingGua, facingDragon) {
    const cands = ADJACENT[facingGua] || [];
    return cands.map(pg => {
      const mtn = mountainOf(pg, facingDragon);     // 開門落點山（同向山元龍）
      const X = yun[pg];                            // 該宮運盤星
      const fwd = decideForward(X, facingDragon, mtn); // 含五黃以落點山陰陽 fallback
      const arriving = fly(X, fwd)[pg];             // 飛回該宮的數字
      return {
        palace: pg, dir: GUA_DIR[pg], mountain: mtn,
        arriving, valid: arriving === period,
        recommendation: arriving === period
          ? '此方具城門訣條件。若有大門、陽台、水景或十字路口等氣口，可大旺財氣。'
          : '非當令，城門不可用。',
      };
    });
  }

  /**
   * 主排盤
   * @param {number} period    建宅元運 1~9
   * @param {string} facingMtn 向山（二十四山之一）
   * @param {string} sittingMtn 坐山（二十四山之一）
   * @param {number} [currentPeriod] 當前元運（判入囚用；不傳則不計入囚）
   * @returns {object} 結果
   */
  function compute(period, facingMtn, sittingMtn, currentPeriod) {
    if (!MTN[facingMtn] || !MTN[sittingMtn]) {
      return { ok: false, reason: '坐向尚未設定' };
    }
    const sittingGua = MTN[sittingMtn].gua;
    const facingGua = MTN[facingMtn].gua;

    // 步驟1：運盤 —— 元運入中、一律順飛
    const yun = fly(period, true);

    // 步驟2：山盤 —— 坐山宮的運星入中，依坐山龍別陰陽定順逆
    const shanCenter = yun[sittingGua];
    const shanFwd = decideForward(shanCenter, MTN[sittingMtn].dragon, sittingMtn);
    const shan = fly(shanCenter, shanFwd);

    // 步驟3：向盤 —— 向山宮的運星入中，依向山龍別陰陽定順逆
    const xiangCenter = yun[facingGua];
    const xiangFwd = decideForward(xiangCenter, MTN[facingMtn].dragon, facingMtn);
    const xiang = fly(xiangCenter, xiangFwd);

    const plates = { yun, shan, xiang };
    const pattern = detectPattern(period, plates, sittingGua, facingGua);

    // 全盤伏吟／反吟：整盤每宮的星與該宮洛書數全相同(伏吟)或全對沖(反吟)。主大凶。
    const fanFu = { shan: fullPlateFuFan(shan), xiang: fullPlateFuFan(xiang) };

    // 山向二星組合（連珠格／連茹格）
    const combos = detectStarCombos(plates);
    // 逐宮山向組合斷語（81/45 組）
    const palaceMeanings = palaceCombos(plates);

    // 進階法訣
    const robbery = detectRobbery(plates, pattern.name, period, facingGua);
    const castleGate = computeCastleGate(period, yun, facingGua, MTN[facingMtn].dragon);

    // 入囚：中宮山星/向星數字 ＝ 當前元運 → 入囚（山星影響人丁健康、向星影響財富功名）
    let imprisonment = null;
    if (currentPeriod) {
      imprisonment = {
        currentPeriod,
        shanCenter, xiangCenter,
        shanQiu: shanCenter === currentPeriod,
        xiangQiu: xiangCenter === currentPeriod,
      };
    }

    return {
      ok: true,
      period,
      sitting: { mtn: sittingMtn, gua: sittingGua, dir: GUA_DIR[sittingGua] },
      facing: { mtn: facingMtn, gua: facingGua, dir: GUA_DIR[facingGua] },
      plates,
      pattern,
      fanFu,
      combos,
      palaceMeanings,
      advanced: { robbery, castleGate },
      imprisonment,
      center: { shan: shanCenter, shanFwd, xiang: xiangCenter, xiangFwd },
    };
  }

  /* ---------- 3. SVG 繪圖工具 ---------- */

  const SVGNS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const e = document.createElementNS(SVGNS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  // 畫一個數字；旺星(=當令)以朱砂紅圓底＋白字標出。
  function drawNumber(parent, x, y, num, kind, period, fontSize) {
    const g = el('g', null, parent);
    const isWang = (num === period);
    if (isWang) {
      el('circle', { cx: x, cy: y, r: fontSize * 0.78, fill: 'var(--hl)' }, g);
    }
    const colorByKind = { yun: 'var(--ink)', shan: 'var(--yang)', xiang: 'var(--hl)' };
    const attrs = {
      x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': fontSize, 'font-weight': isWang ? 800 : 600,
      fill: isWang ? '#fff' : colorByKind[kind],
    };
    const t = el('text', attrs, g);
    t.textContent = (kind === 'yun') ? (NUM_CN[num] || num) : num; // 運星國字、山/向阿拉伯
    return g;
  }

  // 小標籤（山/向/運）
  function drawTag(parent, x, y, text) {
    const t = el('text', {
      x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': 12, fill: 'var(--muted)',
    }, parent);
    t.textContent = text;
    return t;
  }

  /* ---------- 3. 九宮方盤繪圖（套住宅平面圖用；上南下北、左東右西） ---------- */
  // 3×3 格的卦位佈局（與圓盤方位一致）
  const SQUARE_GRID = [
    ['巽', '離', '坤'], // 上排：東南 / 南 / 西南
    ['震', '中', '兌'], // 中排：東 / 中宮 / 西
    ['艮', '坎', '乾'], // 下排：東北 / 北 / 西北
  ];

  function renderSquare(container, result) {
    container.innerHTML = '';
    if (!result || !result.ok) {
      const p = document.createElement('p');
      p.className = 'xk-empty';
      p.textContent = '請先以下方角度滑桿或電子羅盤設定坐向，玄空方盤會即時排出。';
      container.appendChild(p);
      return;
    }

    const S = 600, M = 62, G = S - 2 * M, cell = G / 3; // M 留給外周二十四山
    const svg = el('svg', { viewBox: `0 0 ${S} ${S}`, xmlns: SVGNS });

    const { plates, period } = result;
    const adv = result.advanced || {};
    const gateSet = new Set((adv.castleGate || []).filter(c => c.valid).map(c => c.palace));
    const robPalaces = (adv.robbery && adv.robbery.success) ? adv.robbery.palaces : [];

    el('rect', { x: M, y: M, width: G, height: G, fill: 'var(--paper)', stroke: 'var(--line)', 'stroke-width': 2 }, svg);

    SQUARE_GRID.forEach((row, r) => row.forEach((gua, c) => {
      const x = M + c * cell, y = M + r * cell, cx = x + cell / 2;
      const isSit = (gua === result.sitting.gua), isFac = (gua === result.facing.gua), isGate = gateSet.has(gua);

      // 坐/向宮底色
      if (isSit) el('rect', { x, y, width: cell, height: cell, fill: 'var(--sit-bg)' }, svg);
      else if (isFac) el('rect', { x, y, width: cell, height: cell, fill: 'var(--fac-bg)' }, svg);
      // 格線
      el('rect', { x, y, width: cell, height: cell, fill: 'none', stroke: 'var(--line)', 'stroke-width': 1 }, svg);
      // 打劫三宮金色虛線框
      if (robPalaces.includes(gua)) {
        el('rect', { x: x + 5, y: y + 5, width: cell - 10, height: cell - 10, fill: 'none', stroke: 'var(--rob)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, svg);
      }

      if (gua === '中') {
        drawTag(svg, cx, y + cell * 0.20, '中宮');
        drawNumber(svg, cx - cell * 0.22, y + cell * 0.44, plates.shan['中'], 'shan', period, 26);
        drawNumber(svg, cx + cell * 0.22, y + cell * 0.44, plates.xiang['中'], 'xiang', period, 26);
        drawNumber(svg, cx, y + cell * 0.74, plates.yun['中'], 'yun', period, 24);
        return;
      }

      // 山星左上、向星右上、運星下中
      drawNumber(svg, x + cell * 0.27, y + cell * 0.30, plates.shan[gua], 'shan', period, 28);
      drawNumber(svg, x + cell * 0.73, y + cell * 0.30, plates.xiang[gua], 'xiang', period, 28);
      drawNumber(svg, cx, y + cell * 0.60, plates.yun[gua], 'yun', period, 23);

      // 方位卦名（底部，標出坐/向/城門）
      let label = GUA_DIR[gua].replace('正', '') + gua;
      if (isSit) label = '坐 ' + label;
      else if (isFac) label = '向 ' + label;
      else if (isGate) label = '城門 ' + label;
      const lt = el('text', {
        x: cx, y: y + cell * 0.86, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-size': 13, 'font-weight': (isSit || isFac || isGate) ? 800 : 500,
        fill: isSit ? 'var(--yang)' : isFac ? 'var(--hl)' : isGate ? 'var(--gate)' : 'var(--muted)',
      }, svg);
      lt.textContent = label;
    }));

    // 外周二十四山（坐山＝褐底、向山＝朱底，比照盤面坐/向配色）
    const sit = result.sitting.mtn, fac = result.facing.mtn;
    function drawMtn(x, y, ch) {
      const isSit = ch === sit, isFac = ch === fac;
      if (isSit || isFac) {
        el('rect', { x: x - 11, y: y - 12, width: 22, height: 24, rx: 4, fill: isSit ? 'var(--yang)' : 'var(--hl)' }, svg);
      }
      const t = el('text', {
        x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-size': 17, 'font-weight': (isSit || isFac) ? 800 : 500,
        fill: (isSit || isFac) ? '#fff' : 'var(--muted)',
      }, svg);
      t.textContent = ch;
    }
    const colC = c => M + (c + 0.5) * cell;            // 第 c 欄中心 x
    const rowC = r => M + (r + 0.5) * cell;            // 第 r 列中心 y
    const sub = (start, k) => start + (k + 0.5) / 3 * cell; // 格邊三等分位置
    const topY = M - 30, botY = M + 3 * cell + 30, leftX = M - 30, rightX = M + 3 * cell + 30;
    // 上邊（南）：巳 ｜ 丙午丁 ｜ 未
    drawMtn(colC(0), topY, '巳');
    ['丙', '午', '丁'].forEach((m, k) => drawMtn(sub(M + cell, k), topY, m));
    drawMtn(colC(2), topY, '未');
    // 左邊（東）：辰 ｜ 乙卯甲 ｜ 寅
    drawMtn(leftX, rowC(0), '辰');
    ['乙', '卯', '甲'].forEach((m, k) => drawMtn(leftX, sub(M + cell, k), m));
    drawMtn(leftX, rowC(2), '寅');
    // 右邊（西）：申 ｜ 庚酉辛 ｜ 戌
    drawMtn(rightX, rowC(0), '申');
    ['庚', '酉', '辛'].forEach((m, k) => drawMtn(rightX, sub(M + cell, k), m));
    drawMtn(rightX, rowC(2), '戌');
    // 下邊（北）：丑 ｜ 癸子壬 ｜ 亥
    drawMtn(colC(0), botY, '丑');
    ['癸', '子', '壬'].forEach((m, k) => drawMtn(sub(M + cell, k), botY, m));
    drawMtn(colC(2), botY, '亥');
    // 四角（天元龍）：巽 坤 艮 乾
    drawMtn(leftX, topY, '巽');
    drawMtn(rightX, topY, '坤');
    drawMtn(leftX, botY, '艮');
    drawMtn(rightX, botY, '乾');

    container.appendChild(svg);
  }

  /* ---------- 4. 對外介面 ---------- */
  window.XuanKong = {
    VERSION,
    compute,
    renderSquare,
    STAR_NAME,
    MTN,
    _internal: { fly, decideForward, detectPattern },
  };
})();
