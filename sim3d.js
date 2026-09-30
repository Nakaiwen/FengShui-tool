/* =============================================================================
 *  室內 3D 方位模擬  sim3d.js
 *
 *  FengShui-tool 的第三個分頁。本檔「不排盤」，只讀共用設定與引擎：
 *    ‧ 命主甲乙、觀測日期、宅卦、星氣疊加層：window.ZiBaiPageState.snapshot()
 *    ‧ 向方角度：window.ZiBaiPageState.heading() 與 'fengshui:heading' 事件
 *    ‧ 飛星、元運、流年流月、命卦、遊星、五氣、二星斷語、節氣換月：window.ZiBai
 *      （zibai.js 為單一真相來源；引擎升版後本頁自動跟著變準）
 *  本檔只負責：3D 場景與家具、方位幾何（屋內一點落在哪一宮）、顯示文案。
 *  凶格古法原文不在此顯示，一律改用現代語的留意與化解說明。
 *
 *  three.js r128 在第一次開啟本分頁時才載入（vendor/three.min.js）。
 *
 *  ── 版本 ──────────────────────────────────────────────────────────────────
 *   v0.1.0  初版：範例屋、八宮地板著色（宅卦遊星／流年飛星／命主甲乙）、
 *           家具拖曳與旋轉、宮位五層星＋五氣＋二星格局、宅卦與向方不一致提醒、
 *           一鍵跳到紫白分頁的完整解析。家具擺位存 localStorage（尚未進存檔 JSON）。
 *   v0.2.0  飛星時間軸：九運 2024–2043 逐月預覽，年星、月星以光球沿洛書路徑
 *           （中→乾→兌→艮→離→坎→坤→震→巽）在屋內飛動；可選星、可播放；
 *           預覽不改動觀測日期，按「設為觀測日」才寫回排盤設定。
 * ===========================================================================*/
(function () {
  'use strict';

  const VERSION = '0.2.0';
  const THREE_SRC = 'vendor/three.min.js';
  const STORE_KEY = 'xiaoliu-fengshui:sim3d:layout';
  const PREF_KEY = 'xiaoliu-fengshui:sim3d:prefs';

  /* ---------- 方位幾何（本檔唯一自有的計算：屋內座標 → 宮位） ---------- */
  const GUAS = [
    { g: '坎', dir: '正北', b: 0 },   { g: '艮', dir: '東北', b: 45 },
    { g: '震', dir: '正東', b: 90 },  { g: '巽', dir: '東南', b: 135 },
    { g: '離', dir: '正南', b: 180 }, { g: '坤', dir: '西南', b: 225 },
    { g: '兌', dir: '正西', b: 270 }, { g: '乾', dir: '西北', b: 315 }
  ];
  const BY_G = {}; GUAS.forEach(x => { BY_G[x.g] = x; });
  const W = 12, D = 9, CR = 1.1, PX = 50;   // 屋寬 12m、深 9m、中宮半徑、地板貼圖每公尺像素

  // 屋子的「向」朝本地 +z；面向 +z 時右手為 −x，所以方位角＝向方 − atan2(x, z)
  function bearingAt(x, z, F) { return ((F - Math.atan2(x, z) * 180 / Math.PI) % 360 + 360) % 360; }
  function guaOfBearing(b) { return GUAS[Math.floor((((b % 360) + 360 + 22.5) % 360) / 45)].g; }
  function sectorAt(x, z, F) { return Math.hypot(x, z) < CR ? '中' : guaOfBearing(bearingAt(x, z, F)); }
  function localDir(b, F) { const a = (b - F) * Math.PI / 180; return { x: -Math.sin(a), z: Math.cos(a) }; }
  function sittingGuaOf(F) { return guaOfBearing(F + 180); }

  /* ---------- 顯示文案（不含古法凶斷原文） ---------- */
  const STAR_NOTE = {
    1: { tone: 'good', t: '一白進氣星到，利讀書、文書與人緣，適合安排書桌或工作角。' },
    2: { tone: 'care', t: '二黑到此，宜保持乾燥、整潔、通風，少擺紅色與陶土重物。' },
    3: { tone: 'mid',  t: '三碧主口舌，此處宜少爭執；放一盞暖色燈就能緩和。' },
    4: { tone: 'good', t: '四綠文昌到，適合讀書、寫作、準備考試。' },
    5: { tone: 'care', t: '五黃到此，宜靜不宜動：不動土、不敲打、不大整修。如果心裡掛念，可以放一只銅鈴或頌缽。' },
    6: { tone: 'good', t: '六白到，利工作權責與偏財，保持明亮即可。' },
    7: { tone: 'mid',  t: '七赤到，留意言語分寸，刀剪收好；可放一盆水種植物。' },
    8: { tone: 'good', t: '八白財星到，保持整潔明亮，適合聚財擺設。' },
    9: { tone: 'good', t: '九紫當令旺星到，此處宜多活動、開窗採光，是旺氣所在。' }
  };
  // 凶格：名稱取自引擎 COMBINATION_RULES，說明改寫為現代語的留意與化解（通關五行對照 cure-table）
  const COMBO_CARE = {
    '二五交加': '兩顆土星同宮，古法視為最需照顧的組合；放到現代來看，就是這段時間此方土氣偏重，宜靜不宜動，用金屬之聲化、少擺紅火與陶土。',
    '五九增煞': '火生土讓五黃更旺，此處少用紅色與明火，保持安靜整潔。',
    '鬥牛煞': '木土相爭，家中說話容易起口角，宜少爭；一盞暖色燈可以通關。',
    '交劍煞': '兩金相碰，說話留分寸、刀剪收好；一盆水種植物可以洩金。',
    '九七穿途': '火金相碰，用火用電多留心；陶瓷擺件可以通關。',
    '三七疊臨': '門窗與財物多留心；水種植物可以在金木之間通關。',
    '火燒天門': '火剋金，此方宜靜，陶瓷擺件可以通關；家中長輩作息規律些就好，有不適請找專業。',
    '二七同道': '火氣偏旺，用火用電多留心，保持通風。',
    '五七化毒': '口舌容易起，此處起居宜清爽整潔；水種植物可以洩金。',
    '四六受剋': '金剋木，水種植物可以通關。',
    '二四不和': '木剋土，一盞暖色燈可以通關；家人說話多體諒。',
    '三六受剋': '金剋木，水種植物可以通關。',
    '四七受剋': '金剋木，水種植物可以通關，少捲入是非。',
    '一五犯毒': '土剋水，金屬之聲可以通關；這段時間多喝水、作息規律。',
    '三五激煞': '木土相激，此處宜靜，一盞暖色燈可以通關。'
  };
  const YX_INFO = {
    '生氣': { good: 2, use: '大門、客廳、工作區' }, '延年': { good: 2, use: '主臥、安床' },
    '天醫': { good: 2, use: '臥房、廚房、休養' },   '伏位': { good: 1, use: '書房、靜處' },
    '禍害': { good: -1, use: '廁所、儲藏' },         '六煞': { good: -1, use: '廁所、雜物' },
    '五鬼': { good: -2, use: '廁所、儲藏' },         '絕命': { good: -2, use: '廁所、儲藏' }
  };
  const ITEM_USE = {
    bed: { label: '床', good: ['延年', '天醫', '生氣', '伏位'], avoid: ['五鬼', '絕命', '六煞'], person: true },
    desk: { label: '書桌', good: ['伏位', '生氣', '延年', '天醫'], avoid: ['五鬼', '絕命'], wen: true, person: true },
    sofa: { label: '沙發', good: ['生氣', '延年'], avoid: [] },
    dining: { label: '餐桌', good: ['生氣', '延年', '天醫'], avoid: [] },
    stove: { label: '爐灶', good: ['天醫', '生氣'], avoid: ['五鬼', '絕命'] }
  };
  const BRANCH_GUA = { '子': '坎', '丑': '艮', '寅': '艮', '卯': '震', '辰': '巽', '巳': '巽', '午': '離', '未': '坤', '申': '坤', '酉': '兌', '戌': '乾', '亥': '乾' };
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const MONTH_CN = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const EAST4 = { '坎': 1, '離': 1, '震': 1, '巽': 1 };
  const LUOSHU_PATH = ['中', '乾', '兌', '艮', '離', '坎', '坤', '震', '巽'];
  const JIE_NAME = ['', '立春', '驚蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
  const MONTH_ZHI = ['', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  const JIE_APPROX_MD = [0, 204, 306, 405, 505, 606, 707, 807, 907, 1008, 1107, 1207, 106];  // 無精確節氣表時的概略交節日
  const TL_Y0 = 2024, TL_Y1 = 2043, TL_N = (TL_Y1 - TL_Y0 + 1) * 12;                         // 九運 240 個月
  const ORB_STARS = {
    5: { color: 0xc2412c, css: '#c2412c' }, 9: { color: 0x7a5fa8, css: '#7a5fa8' }, 2: { color: 0x55524c, css: '#55524c' },
    1: { color: 0x4f8fa0, css: '#4f8fa0' }, 4: { color: 0x5f9a62, css: '#5f9a62' }, 8: { color: 0xc4a045, css: '#b08a2e' }
  };
  const tlIdxOf = (fy, fm) => (fy - TL_Y0) * 12 + (fm - 1);
  const tlOf = i => ({ fsYear: TL_Y0 + Math.floor(i / 12), fsMonth: (i % 12) + 1 });

  /* ---------- 小工具 ---------- */
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const yxName = s => (s ? String(s).split('/')[0] : null);
  const reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  /* ---------- 開機自測：引擎與幾何任一不符即鎖定 ---------- */
  function selfTest() {
    const e = [];
    const Z = window.ZiBai;
    if (!Z || typeof Z.getStarInGua !== 'function' || !Z.GUA_DATA) return ['找不到 zibai.js 引擎'];
    const base = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兌': 7, '艮': 8, '離': 9 };
    Object.keys(base).forEach(g => { if (Z.getStarInGua(5, g) !== base[g]) e.push('洛書 ' + g); });
    // 大遊年歌逐句核對引擎的遊星表
    const ORDER = ['乾', '坎', '艮', '震', '巽', '離', '坤', '兌'];
    const FULL = { '生': '生氣', '天': '天醫', '延': '延年', '絕': '絕命', '五': '五鬼', '六': '六煞', '禍': '禍害' };
    ['乾六天五禍絕延生', '坎五天生延絕禍六', '艮六絕禍生延天五', '震延生禍絕五天六',
     '巽天五六禍生絕延', '離六五絕延禍生天', '坤天延絕生禍五六', '兌生禍延絕六五天'].forEach(line => {
      const self = line[0], data = Object.values(Z.GUA_DATA).find(x => x.name === self), i0 = ORDER.indexOf(self);
      if (!data) { e.push('宅卦 ' + self); return; }
      for (let j = 1; j <= 7; j++) { const t = ORDER[(i0 + j) % 8]; if (yxName(data.stars[t]) !== FULL[line[j]]) e.push('遊星 ' + self + t); }
    });
    // 幾何：坐北向南時，前方為南、右手邊（畫面右、+x）為東
    if (sectorAt(0, 3, 180) !== '離' || sectorAt(0, -3, 180) !== '坎' || sectorAt(3, 0, 180) !== '震' ||
        sectorAt(3, 0, 0) !== '兌' || sectorAt(0, 0.2, 180) !== '中') e.push('分宮方向');
    if (sittingGuaOf(180) !== '坎' || sittingGuaOf(225) !== '艮' || sittingGuaOf(135) !== '乾' || sittingGuaOf(0) !== '離') e.push('坐山換算');
    let bad = 0; [0, 37.5, 90, 180, 222.4, 315].forEach(F => GUAS.forEach(x => { const v = localDir(x.b, F); if (sectorAt(v.x * 3, v.z * 3, F) !== x.g) bad++; }));
    if (bad) e.push('方位往返');
    return e;
  }

  /* ---------- 讀共用設定並用引擎計算 ---------- */
  function readShared() {
    const P = window.ZiBaiPageState;
    const snap = P ? P.snapshot() : null;
    const heading = P ? Number(P.heading()) : 180;
    return { snap, heading: Number.isFinite(heading) ? heading : 180 };
  }
  function parseDate(v) {
    // 與紫白分頁相同：取觀測日當地 00:00；留空為今天
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    return new Date();
  }
  function compute(shared, ov) {
    const Z = window.ZiBai, s = shared.snap;
    const date = parseDate(s && s.date);
    const obs = Z.getSolarTermMonth(date);
    const t = ov ? { fsYear: ov.fsYear, fsMonth: ov.fsMonth, termName: JIE_NAME[ov.fsMonth] } : obs;
    const ys = Z.annualStar(t.fsYear), ms = Z.calculateMonthStar(t.fsYear, t.fsMonth), ps = Z.calculatePeriodStar(t.fsYear);
    const zhai = Object.values(Z.GUA_DATA).find(g => g.name === (s && s.houseGua)) || Z.GUA_DATA[1];
    const person = p => (p && p.year != null) ? Z.mingGua(p.year, p.gender, p.month, p.day) : null;
    const ma = person(s && s.personA), mb = person(s && s.personB);
    const layersOn = new Set(s && Array.isArray(s.layers) ? s.layers : [1, 2, 3, 4, 5]);
    const layerDefs = [
      { key: 'zhai', label: '宅星', center: zhai.number, layer: 1 },
      { key: 'yun', label: '運星', center: ps, layer: 2 },
      { key: 'year', label: '流年', center: ys, layer: 3 },
      { key: 'month', label: '流月', center: ms, layer: 4 }
    ];
    if (ma) layerDefs.push({ key: 'a', label: '命甲', center: ma.number, layer: 5 });
    if (mb) layerDefs.push({ key: 'b', label: '命乙', center: mb.number, layer: 5 });
    const palaces = {};
    ['中'].concat(GUAS.map(x => x.g)).forEach(g => {
      const layers = layerDefs.map(L => {
        const star = g === '中' ? L.center : Z.getStarInGua(L.center, g);
        const qi = g === '中' ? { qi: '' } : Z.getFiveQi(L.center, star);
        return { key: L.key, label: L.label, star, qi: qi.qi, on: layersOn.has(L.layer) };
      });
      const active = layers.filter(l => l.on).map(l => ({ name: l.label, val: l.star }));
      palaces[g] = {
        g, layers,
        star: k => (layers.find(l => l.key === k) || {}).star,
        yx: g === '中' ? null : yxName(zhai.stars[g]),
        yxA: ma && g !== '中' ? yxName(ma.stars[g]) : null,
        yxB: mb && g !== '中' ? yxName(mb.stars[g]) : null,
        combos: Z.detectCombos(active)
      };
    });
    const branch = Z.getGanzhiYear(t.fsYear)[1], bi = BRANCHES.indexOf(branch);
    const sansha = '申子辰'.includes(branch) ? '離' : '寅午戌'.includes(branch) ? '坎' : '巳酉丑'.includes(branch) ? '震' : '兌';
    return {
      date, t, obs, preview: !!ov, ys, ms, ps, zhai, ma, mb, palaces, layersOn,
      ganzhi: Z.getGanzhiYear(t.fsYear),
      sha: { taisui: BRANCH_GUA[branch], suipo: BRANCH_GUA[BRANCHES[(bi + 6) % 12]], sansha },
      heading: shared.heading, sitFromHeading: sittingGuaOf(shared.heading)
    };
  }

  /* ---------- DOM：分頁按鈕、刊頭、主畫面 ---------- */
  let M = null;                 // 最近一次計算結果
  let LOCKED = false, LOCK_MSG = '';
  let active = false, sceneReady = null;
  const prefs = Object.assign({ mode: 'zhai', wallHigh: false, labels: true, orbStars: [5, 9], orbYear: true, orbMonth: true, path: true }, store.get(PREF_KEY, {}));
  let previewIdx = null;        // 時間軸預覽的月份索引；null＝跟隨觀測日期
  let selection = null;         // {kind:'item', id} | {kind:'sector', g}

  function buildDom() {
    const toggle = document.querySelector('.mode-toggle');
    const container = $('compass-container');
    if (!toggle || !container) return false;

    const btn = document.createElement('button');
    btn.id = 'mode-sim3d'; btn.className = 'mode-btn'; btn.type = 'button'; btn.textContent = '室內 3D';
    btn.setAttribute('aria-pressed', 'false');
    toggle.appendChild(btn);

    const head = document.createElement('header');
    head.className = 'zb-masthead s3-only';
    head.innerHTML = '<div><span class="zb-eyebrow">小六太乙 · 陽宅風水</span><h1>室內<span>方位</span></h1></div>' +
      '<p>觀擺設，順宅氣。<span>家具與八宮，一屋參看。</span></p>';
    toggle.parentNode.insertBefore(head, toggle);

    const view = document.createElement('section');
    view.id = 'sim3d-view'; view.className = 's3-only'; view.setAttribute('aria-label', '室內 3D 方位模擬'); view.setAttribute('aria-hidden', 'true');
    view.innerHTML =
      '<div class="zb-panel-top"><div><span class="zb-eyebrow">八宮 · 家具擺位</span><h2>室內模擬</h2></div>' +
      '<span class="zb-bearing">向方 <output id="s3-heading">180.0°</output></span></div>' +
      '<div id="s3-warn" class="s3-warn" hidden></div>' +
      '<div class="s3-stage" id="s3-stage">' +
        '<canvas id="s3-canvas" aria-label="3D 室內模型：拖曳旋轉，家具可直接拖動"></canvas>' +
        '<div class="s3-labels" id="s3-labels"></div>' +
        '<div class="s3-toolbar" role="toolbar" aria-label="視角與顯示">' +
          '<button type="button" id="s3-top">俯視</button><button type="button" id="s3-persp">斜視</button>' +
          '<button type="button" id="s3-wall" aria-pressed="false">牆面拉高</button>' +
          '<button type="button" id="s3-lbl" aria-pressed="true">方位標籤</button>' +
          '<button type="button" id="s3-reset">家具歸位</button></div>' +
        '<div class="s3-hint"><span class="s3-hint-l">拖曳旋轉・滾輪或雙指縮放・右鍵拖曳平移・直接拖家具可移動</span><span class="s3-hint-s">拖曳旋轉・雙指縮放・拖家具可移動</span></div>' +
        '<div class="s3-loading" id="s3-loading">載入 3D 中…</div>' +
      '</div>' +
      '<div class="s3-timeline" id="s3-tl-box">' +
        '<div class="s3-tl-head"><div><span class="zb-eyebrow">飛星時間軸 · 九運</span><strong id="s3-tl-label">—</strong></div>' +
          '<span class="s3-tl-note" id="s3-tl-note"></span></div>' +
        '<div class="s3-tl-row">' +
          '<button type="button" id="s3-tl-prev" aria-label="上個月">◀</button>' +
          '<button type="button" id="s3-tl-play" aria-label="播放">播放</button>' +
          '<button type="button" id="s3-tl-next" aria-label="下個月">▶</button>' +
          '<div class="s3-tl-track"><input type="range" id="s3-tl" min="0" max="' + (TL_N - 1) + '" step="1" value="0" aria-label="飛星時間軸（月）">' +
          '<div class="s3-tl-ticks" aria-hidden="true"><span>2024</span><span>2029</span><span>2034</span><span>2039</span><span>2043</span></div></div>' +
        '</div>' +
        '<div class="s3-tl-opts" id="s3-tl-opts">' +
          [5, 9, 2, 1, 4, 8].map(n => '<button type="button" class="s3-chip" data-orb="' + n + '" style="--c:' + ORB_STARS[n].css + '">' + ['', '一白', '二黑', '', '四綠', '五黃', '', '', '八白', '九紫'][n] + '</button>').join('') +
          '<span class="s3-tl-sep"></span>' +
          '<button type="button" class="s3-chip" data-layer="year">流年</button><button type="button" class="s3-chip" data-layer="month">流月</button>' +
          '<button type="button" class="s3-chip" data-layer="path">洛書路徑</button>' +
        '</div>' +
        '<div class="s3-tl-actions"><span id="s3-tl-state" class="s3-tl-state"></span>' +
          '<button type="button" class="s3-btn" id="s3-tl-back">回到觀測日</button><button type="button" class="s3-btn" id="s3-tl-set">設為觀測日</button></div>' +
      '</div>' +
      '<div class="s3-seg" role="radiogroup" aria-label="地板著色依據" id="s3-seg">' +
        '<button type="button" role="radio" data-mode="zhai">宅卦遊星</button>' +
        '<button type="button" role="radio" data-mode="star">流年飛星</button>' +
        '<button type="button" role="radio" data-mode="a">命主甲</button>' +
        '<button type="button" role="radio" data-mode="b">家人乙</button></div>' +
      '<div class="s3-legend" id="s3-legend"></div>' +
      '<div class="s3-card" id="s3-detail" aria-live="polite"></div>' +
      '<div class="s3-card" id="s3-summary"></div>' +
      '<p class="zb-dial-note">範例屋：三房兩廳，約 32 坪。分宮用放射線法（從屋子中心分八方，各 45°）。飛星、遊星、五氣、格局與節氣換月都取自 zibai.js，完整評分請看紫白分頁的八宮解析。理氣為輔，實際門窗、動線與現場羅盤為先。<br><span id="s3-ver"></span></p>';
    container.insertBefore(view, container.firstChild);
    return btn;
  }

  /* ---------- 分頁切換（不改動其他分頁的程式） ---------- */
  function setupMode(btn) {
    const toggle = btn.parentNode;
    const others = () => [...toggle.querySelectorAll('.mode-btn')].filter(b => b !== btn);
    function enter() {
      if (active) return;
      const zi = $('mode-zibai');
      if (zi && (document.body.classList.contains('mode-xk') || !zi.classList.contains('active'))) zi.click();
      active = true;
      document.body.classList.add('mode-3d');
      others().forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      $('sim3d-view').setAttribute('aria-hidden', 'false');
      ensureScene().then(ok => { if (ok && active) { onResize(); refresh(true); } });
      startPoll();
    }
    function exit() {
      if (!active) return;
      active = false;
      document.body.classList.remove('mode-3d');
      btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false');
      $('sim3d-view').setAttribute('aria-hidden', 'true');
      stopPoll(); stopPlay();
    }
    btn.addEventListener('click', enter);
    others().forEach(b => b.addEventListener('click', exit));
    // 讀檔或其他程式把別的分頁設為 active 時，本分頁自動退出
    const mo = new MutationObserver(() => { if (active && others().some(b => b.classList.contains('active'))) exit(); });
    others().forEach(b => mo.observe(b, { attributes: true, attributeFilter: ['class'] }));
    window.addEventListener('hashchange', () => { if (location.hash === '#sim3d') enter(); });
    if (location.hash === '#sim3d') enter();
    return { enter, exit };
  }

  /* ---------- 共用設定的變動偵測 ---------- */
  let pollTimer = null, lastKey = '', rafPending = false;
  function stateKey() {
    const sh = readShared(); const s = sh.snap || {};
    return JSON.stringify([Math.round(sh.heading * 10), s.personA, s.personB, s.houseGua, s.date, s.layers, previewIdx]);
  }
  function startPoll() { stopPoll(); pollTimer = setInterval(() => { if (active && stateKey() !== lastKey) schedule(); }, 700); }
  function stopPoll() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }
  function schedule() { if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; refresh(false); }); }

  /* ======================= three.js 場景 ======================= */
  let THREE, renderer, scene, camera, floorCanvas, fctx, floorTex, walls = [], items = [], pickables = [];
  let selHelper, compassNeedle, compassTicks = [], labels = [], sectorLabels = {}, compassLabels = [];
  let orbs = [], pathLine = null, lastPathF = null;
  let needs = true;
  const cam = { theta: 0.35, phi: 0.92, r: 19, target: null };

  function loadThree() {
    if (window.THREE) return Promise.resolve(true);
    return new Promise(resolve => {
      const sc = document.createElement('script'); sc.src = THREE_SRC; sc.async = true;
      sc.onload = () => resolve(!!window.THREE); sc.onerror = () => resolve(false);
      document.head.appendChild(sc);
    });
  }
  function ensureScene() {
    if (sceneReady) return sceneReady;
    sceneReady = loadThree().then(ok => {
      const ld = $('s3-loading');
      if (!ok) { ld.textContent = '3D 元件載入失敗，請確認網路或重新整理後再試。'; return false; }
      THREE = window.THREE;
      try { initScene(); ld.hidden = true; return true; }
      catch (err) { ld.textContent = '這台裝置無法開啟 3D 顯示（需要 WebGL）。'; if (window.console) console.warn('[sim3d]', err); return false; }
    });
    return sceneReady;
  }
  function requestRender() { needs = true; }
  function cssVar(n, d) { const v = getComputedStyle(document.body).getPropertyValue(n).trim(); return v || d; }

  function box(w, h, d, color, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m;
  }

  const DEFAULT_ITEMS = [
    { id: 'bed1', name: '主臥床', type: 'bed', x: -3.75, z: -3.43, w: 1.8, d: 2.0, h: 0.5, rot: 0, color: 0xD6CBB4 },
    { id: 'ward', name: '衣櫃', type: 'wardrobe', x: -5.62, z: -2.2, w: 1.8, d: 0.6, h: 2.0, rot: 1, color: 0xB49B78 },
    { id: 'bed2', name: '次臥床', type: 'bed', x: 1.6, z: -3.43, w: 1.5, d: 2.0, h: 0.5, rot: 0, color: 0xD6CBB4 },
    { id: 'desk', name: '書桌', type: 'desk', x: 4.6, z: -4.08, w: 1.4, d: 0.7, h: 0.75, rot: 0, color: 0xA88A62 },
    { id: 'shelf', name: '書櫃', type: 'shelf', x: 5.7, z: -2.0, w: 1.2, d: 0.36, h: 1.8, rot: 1, color: 0xA88A62 },
    { id: 'sofa', name: '沙發', type: 'sofa', x: -2.9, z: 3.95, w: 2.4, d: 0.9, h: 0.42, rot: 0, color: 0x7F9480 },
    { id: 'coffee', name: '茶几', type: 'table', x: -2.9, z: 2.75, w: 1.1, d: 0.6, h: 0.4, rot: 0, color: 0xA88A62 },
    { id: 'tv', name: '電視櫃', type: 'tv', x: -2.9, z: 0.85, w: 2.0, d: 0.45, h: 0.5, rot: 0, color: 0x7D6851 },
    { id: 'dining', name: '餐桌', type: 'dining', x: 2.35, z: 2.3, w: 1.6, d: 0.9, h: 0.75, rot: 0, color: 0xA88A62 },
    { id: 'stove', name: '爐灶', type: 'stove', x: 1.4, z: 4.15, w: 0.75, d: 0.58, h: 0.93, rot: 0, color: 0x3A3C3A },
    { id: 'fridge', name: '冰箱', type: 'fridge', x: 3.75, z: 4.1, w: 0.72, d: 0.7, h: 1.8, rot: 0, color: 0xDCDDD8 }
  ];
  const ROOMS = [
    { n: '主臥', x: -3.75, z: -1.35 }, { n: '主衛', x: -0.75, z: -2.3 }, { n: '次臥', x: 1.6, z: -1.35 },
    { n: '書房', x: 4.6, z: -1.35 }, { n: '客廳', x: -5.0, z: 2.3 }, { n: '餐廚', x: 2.3, z: 1.0 },
    { n: '客衛', x: 5.1, z: 3.1 }, { n: '儲藏', x: 5.1, z: 1.25 }, { n: '玄關', x: -0.4, z: 3.3 }
  ];

  function initScene() {
    const canvas = $('s3-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(cssVar('--zb-wash', '#f1eadb'));
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    cam.target = new THREE.Vector3(0, 0, 0.4);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbdb3a0, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(-5, 14, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
    sun.shadow.bias = -0.0006; scene.add(sun);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: new THREE.Color(cssVar('--zb-line', '#e3d9c3')), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);

    floorCanvas = document.createElement('canvas'); floorCanvas.width = W * PX; floorCanvas.height = D * PX;
    fctx = floorCanvas.getContext('2d');
    floorTex = new THREE.CanvasTexture(floorCanvas); floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    // 牆（頂面深墨綠，俯視時看得出隔間）
    const T = 0.12, side = new THREE.MeshStandardMaterial({ color: 0xF6F1E6, roughness: 0.9 }), top = new THREE.MeshStandardMaterial({ color: 0x283a2f, roughness: 0.9 });
    const mats = [side, side, top, side, side, side];
    function addWall(x1, z1, x2, z2) {
      const len = Math.hypot(x2 - x1, z2 - z1); if (len < 0.01) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(len + T, 1, T), mats);
      m.position.set((x1 + x2) / 2, 0.5, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      m.castShadow = true; m.receiveShadow = true; scene.add(m); walls.push(m);
    }
    const hwall = (z, x1, x2, gaps = []) => { let c = x1; gaps.forEach(g => { addWall(c, z, g[0], z); c = g[1]; }); addWall(c, z, x2, z); };
    const vwall = (x, z1, z2, gaps = []) => { let c = z1; gaps.forEach(g => { addWall(x, c, x, g[0]); c = g[1]; }); addWall(x, c, x, z2); };
    hwall(-4.5, -6, 6); hwall(4.5, -6, 6, [[-0.9, 0.1]]); vwall(-6, -4.5, 4.5); vwall(6, -4.5, 4.5);
    hwall(-0.5, -6, 6, [[-2.7, -1.9], [0.3, 1.1], [3.5, 4.3]]);
    vwall(-1.5, -4.5, -0.5, [[-1.8, -1.0]]); vwall(0, -4.5, -0.5); vwall(3.2, -4.5, -0.5);
    vwall(4.2, 0.5, 4.5, [[0.8, 1.6], [2.9, 3.7]]); hwall(2.0, 4.2, 6); hwall(0.5, 4.2, 6);

    box(2.4, 0.9, 0.6, 0xE8E1D2, 2.1, 0.45, 4.15);
    box(0.4, 0.4, 0.62, 0xFBFAF6, -0.45, 0.2, -4.12);
    box(1.2, 0.5, 0.75, 0xFBFAF6, -0.75, 0.25, -2.9);
    box(0.4, 0.4, 0.62, 0xFBFAF6, 5.6, 0.2, 4.12);
    box(0.55, 0.8, 0.45, 0xFBFAF6, 4.55, 0.4, 4.2);

    // 羅盤外環與指北
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xb99b62, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(8.05, 8.13, 128), ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005; scene.add(ring);
    const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(-0.22, -0.1); sh.lineTo(0.22, -0.1); sh.lineTo(0, 0.55);
    const needle = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: 0xb3402f, side: THREE.DoubleSide }));
    needle.rotation.x = -Math.PI / 2; compassNeedle = new THREE.Group(); compassNeedle.add(needle); scene.add(compassNeedle);
    for (let k = 0; k < 8; k++) {
      const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.45), ringMat); tk.rotation.x = -Math.PI / 2;
      const g = new THREE.Group(); g.add(tk); scene.add(g); compassTicks.push(g);
    }

    // 家具
    const saved = store.get(STORE_KEY, []) || [], byId = {};
    (Array.isArray(saved) ? saved : []).forEach(p => { if (p && typeof p.id === 'string') byId[p.id] = p; });
    DEFAULT_ITEMS.forEach(d0 => {
      const d = Object.assign({}, d0), p = byId[d.id];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.z)) { d.x = p.x; d.z = p.z; d.rot = (p.rot | 0) % 4; }
      items.push(buildItem(d));
    });
    selHelper = new THREE.BoxHelper(undefined, 0xb3402f); selHelper.visible = false; scene.add(selHelper);

    // HTML 標籤
    const holder = $('s3-labels');
    const mk = (cls, html, pos) => { const el = document.createElement('div'); el.className = 's3-lbl'; el.innerHTML = '<div class="' + cls + '">' + html + '</div>'; holder.appendChild(el); const l = { el, inner: el.firstChild, pos }; labels.push(l); return l; };
    ['中'].concat(GUAS.map(x => x.g)).forEach(g => { sectorLabels[g] = mk('s3-sec', '', new THREE.Vector3()); sectorLabels[g].sector = true; });
    compassLabels = GUAS.map(x => { const l = mk('s3-cmp' + (x.g === '坎' ? ' n' : ''), x.dir.replace('正', ''), new THREE.Vector3()); l.b = x.b; return l; });
    mk('s3-door', '大門', new THREE.Vector3(-0.4, 0, 5.05));
    initOrbs(mk);

    setupControls(canvas);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe($('s3-stage')); else window.addEventListener('resize', onResize);
    setWallHeight(prefs.wallHigh ? 2.6 : 1.0);
    const loop = now => { if (active && stepOrbs(now || performance.now())) needs = true; if (active && needs) { needs = false; renderer.render(scene, camera); placeLabels(); } requestAnimationFrame(loop); };
    loop();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (M) paintFloor(); });
  }

  function buildItem(def) {
    const g = new THREE.Group(), w = def.w, d = def.d, h = def.h;
    if (def.type === 'desk' || def.type === 'dining') {
      box(w, 0.04, d, def.color, 0, h - 0.02, 0, g);
      if (def.type === 'desk') { box(0.04, h - 0.04, d, def.color, -w / 2 + 0.02, (h - 0.04) / 2, 0, g); box(0.04, h - 0.04, d, def.color, w / 2 - 0.02, (h - 0.04) / 2, 0, g); }
      else [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(0.05, h - 0.04, 0.05, 0x7D6851, p[0] * (w / 2 - 0.08), (h - 0.04) / 2, p[1] * (d / 2 - 0.08), g));
    } else if (def.type === 'sofa') {
      box(w, h, d, def.color, 0, h / 2, 0, g);
      box(w, 0.42, 0.22, def.color, 0, h + 0.21, d / 2 - 0.11, g);
      box(0.18, 0.62, d, 0x6E8270, -w / 2 + 0.09, 0.31, 0, g); box(0.18, 0.62, d, 0x6E8270, w / 2 - 0.09, 0.31, 0, g);
    } else {
      box(w, h, d, def.color, 0, h / 2, 0, g);
      if (def.type === 'bed') {
        box(w, 0.95, 0.08, 0x8C7458, 0, 0.475, -d / 2 + 0.04, g);
        box(w * 0.8, 0.1, 0.32, 0xFBF8F0, 0, h + 0.05, -d / 2 + 0.32, g);
        box(w - 0.04, 0.05, d * 0.62, 0xE9E0CC, 0, h + 0.025, d * 0.18, g);
      } else if (def.type === 'tv') box(w * 0.75, 0.5, 0.04, 0x232523, 0, h + 0.3, 0, g);
      else if (def.type === 'stove') {
        box(w, 0.02, d, 0x1E201F, 0, h + 0.01, 0, g);
        [-0.17, 0.17].forEach(bx => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0x6d6f6e })); c.position.set(bx, h + 0.03, 0); g.add(c); });
      } else if (def.type === 'fridge') box(0.02, 0.9, 0.02, 0x9aa09e, w / 2 - 0.12, 1.1, d / 2 + 0.01, g);
    }
    g.userData.item = def;
    g.traverse(o => { if (o.isMesh) { o.userData.root = g; pickables.push(o); } });
    scene.add(g); def.obj = g; applyItem(def);
    return def;
  }
  function footprint(d) { return (d.rot % 2) ? { hw: d.d / 2, hd: d.w / 2 } : { hw: d.w / 2, hd: d.d / 2 }; }
  function applyItem(d) {
    const f = footprint(d), m = 0.07;
    d.x = Math.min(W / 2 - m - f.hw, Math.max(-W / 2 + m + f.hw, d.x));
    d.z = Math.min(D / 2 - m - f.hd, Math.max(-D / 2 + m + f.hd, d.z));
    d.obj.position.set(d.x, 0, d.z); d.obj.rotation.y = d.rot * Math.PI / 2;
  }
  function saveItems() { store.set(STORE_KEY, items.map(d => ({ id: d.id, x: +d.x.toFixed(2), z: +d.z.toFixed(2), rot: d.rot }))); }
  function itemById(id) { return items.find(d => d.id === id) || null; }
  function setWallHeight(h) { walls.forEach(m => { m.scale.y = h; m.position.y = h / 2; }); requestRender(); }
  function updateSelHelper() {
    if (selection && selection.kind === 'item') { selHelper.setFromObject(itemById(selection.id).obj); selHelper.visible = true; }
    else if (selHelper) selHelper.visible = false;
    requestRender();
  }

  /* ---------- 飛星光球（年星、月星沿洛書路徑飛動） ---------- */
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function anchorOf(g) {
    if (g === '中') return { x: 0, z: 0 };
    const F = M ? M.heading : 180, d = localDir(BY_G[g].b, F);
    const tx = Math.abs(d.x) > 1e-6 ? (W / 2) / Math.abs(d.x) : 1e9, tz = Math.abs(d.z) > 1e-6 ? (D / 2) / Math.abs(d.z) : 1e9;
    const t = Math.min(tx, tz) * 0.5;
    return { x: d.x * t, z: d.z * t };
  }
  function initOrbs(mk) {
    const tex = glowTexture();
    Object.keys(ORB_STARS).forEach(k => {
      ['year', 'month'].forEach(layer => {
        const n = +k, col = ORB_STARS[k].color, big = layer === 'year';
        const grp = new THREE.Group();
        const core = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.34 : 0.24, 32, 20),
          new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.35 }));
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.scale.set(big ? 2.0 : 1.4, big ? 2.0 : 1.4, 1);
        grp.add(core); grp.add(glow);
        if (big) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 48), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = Math.PI / 2; grp.add(ring); }
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 }));
        const spot = new THREE.Mesh(new THREE.RingGeometry(big ? 0.42 : 0.3, big ? 0.62 : 0.46, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
        spot.rotation.x = -Math.PI / 2;
        scene.add(grp); scene.add(beam); scene.add(spot);
        const name = window.ZiBai.STAR_NAMES_SHORT[n];
        const lbl = mk('s3-orb' + (big ? ' y' : ''), (big ? '年' : '月') + name, new THREE.Vector3());
        lbl.inner.style.setProperty('--c', ORB_STARS[k].css); lbl.orb = true;
        orbs.push({ n, layer, big, grp, beam, spot, lbl, h: big ? 1.15 : 0.8, off: big ? -0.34 : 0.34,
                    g: null, pos: { x: 0, z: 0 }, from: null, to: null, t0: 0, dur: 0 });
      });
    });
    const pm = new THREE.LineDashedMaterial({ color: 0xb99b62, dashSize: 0.28, gapSize: 0.18, transparent: true, opacity: 0.95 });
    pathLine = new THREE.Line(new THREE.BufferGeometry(), pm); pathLine.position.y = 0.05; scene.add(pathLine);
  }
  function orbVisible(o) {
    return !LOCKED && !!M && prefs.orbStars.includes(o.n) && (o.big ? prefs.orbYear : prefs.orbMonth);
  }
  function placeOrb(o, x, z, lift) {
    const y = o.h + (lift || 0);
    o.grp.position.set(x, y, z);
    o.beam.position.set(x, y / 2, z); o.beam.scale.y = y;
    o.spot.position.set(x, 0.03 + (o.big ? 0.01 : 0), z);
    o.lbl.pos.set(x, y + (o.big ? 0.55 : 0.42), z);
  }
  function stepsAlongPath(a, b) { return (LUOSHU_PATH.indexOf(b) - LUOSHU_PATH.indexOf(a) + 9) % 9; }
  /* 依目前的 M 決定每顆光球該在哪一宮；animate 為 true 且只差一步時沿路徑跳過去 */
  function updateOrbs(animate) {
    if (!orbs.length) return;
    const F = M ? M.heading : 180, headingMoved = lastPathF !== F;
    orbs.forEach(o => {
      const vis = orbVisible(o);
      [o.grp, o.beam, o.spot].forEach(m => { m.visible = vis; });
      o.lbl.el.style.display = vis ? '' : 'none';
      if (!vis) { o.g = null; return; }
      const layer = o.big ? 'year' : 'month';
      const g = ['中'].concat(GUAS.map(x => x.g)).find(q => M.palaces[q].star(layer) === o.n);
      const a = anchorOf(g), target = { x: a.x + o.off, z: a.z };
      const hop = animate && !headingMoved && o.g && o.g !== g && !reduced.matches;
      if (hop) {
        const steps = stepsAlongPath(o.g, g);
        o.from = { x: o.pos.x, z: o.pos.z }; o.to = target; o.t0 = performance.now(); o.dur = steps === 1 ? 900 : 520;
      } else { o.from = null; o.pos = target; placeOrb(o, target.x, target.z, 0); }
      o.g = g;
    });
    if (headingMoved) {
      const pts = LUOSHU_PATH.concat(['中']).map(g => { const a = anchorOf(g); return new THREE.Vector3(a.x, 0, a.z); });
      pathLine.geometry.dispose(); pathLine.geometry = new THREE.BufferGeometry().setFromPoints(pts); pathLine.computeLineDistances();
      lastPathF = F;
    }
    pathLine.visible = !LOCKED && !!M && prefs.path;
    requestRender();
  }
  function stepOrbs(now) {
    let moving = false;
    orbs.forEach(o => {
      if (!o.from) return;
      const t = Math.min(1, (now - o.t0) / o.dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = o.from.x + (o.to.x - o.from.x) * e, z = o.from.z + (o.to.z - o.from.z) * e;
      o.pos = { x, z }; placeOrb(o, x, z, Math.sin(Math.PI * t) * 1.2);
      if (t >= 1) o.from = null; else moving = true;
    });
    return moving;
  }

  /* ---------- 時間軸 ---------- */
  function jieDateOf(fy, fm) {
    // 回傳該節氣月「交節隔天」的 YYYY-MM-DD；有 solarLunar 精確表就用，否則用概略日
    const y = fm === 12 ? fy + 1 : fy;
    const SL = window.solarLunar;
    let d;
    if (SL && typeof SL.getTerm === 'function') {
      const n = fm === 12 ? 1 : 2 * fm + 1, t = SL.getTerm(y, n);
      if (t) { const x = new Date(t + 86400000); d = [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; }
    }
    if (!d) { const md = JIE_APPROX_MD[fm]; d = [y, Math.floor(md / 100), (md % 100) + 3]; }
    return d[0] + '-' + String(d[1]).padStart(2, '0') + '-' + String(d[2]).padStart(2, '0');
  }
  function jieLabel(fy, fm) {
    const SL = window.solarLunar, y = fm === 12 ? fy + 1 : fy;
    if (SL && typeof SL.getTerm === 'function') {
      const t = SL.getTerm(y, fm === 12 ? 1 : 2 * fm + 1);
      if (t) { const x = new Date(t); return ' ' + (x.getUTCMonth() + 1) + '/' + x.getUTCDate(); }
    }
    return '';
  }
  function obsIdx() { return M ? tlIdxOf(M.obs.fsYear, M.obs.fsMonth) : 0; }
  function renderTimeline() {
    const r = $('s3-tl'); if (!r || !M) return;
    const idx = previewIdx != null ? previewIdx : obsIdx(), inRange = idx >= 0 && idx < TL_N;
    if (inRange && document.activeElement !== r) r.value = String(idx);
    const Z = window.ZiBai;
    $('s3-tl-label').textContent = M.t.fsYear + '・' + Z.getGanzhiYear(M.t.fsYear) + '年 ' + MONTH_CN[M.t.fsMonth] + ' ' + MONTH_ZHI[M.t.fsMonth] + '月（' + JIE_NAME[M.t.fsMonth] + jieLabel(M.t.fsYear, M.t.fsMonth) + '）';
    $('s3-tl-note').textContent = '年 ' + starShort(M.ys) + '入中・月 ' + starShort(M.ms) + '入中';
    $('s3-tl-state').textContent = M.preview ? '預覽中，未改動觀測日期' : (inRange ? '跟隨觀測日期' : '觀測日期不在九運範圍');
    $('s3-tl-back').disabled = !M.preview; $('s3-tl-set').disabled = !M.preview;
    $('s3-tl-play').textContent = playTimer ? '暫停' : '播放';
    $('s3-tl-play').setAttribute('aria-label', playTimer ? '暫停' : '播放');
    $('s3-tl-opts').querySelectorAll('.s3-chip').forEach(b => {
      const on = b.dataset.orb ? prefs.orbStars.includes(+b.dataset.orb) : b.dataset.layer === 'year' ? prefs.orbYear : b.dataset.layer === 'month' ? prefs.orbMonth : prefs.path;
      b.setAttribute('aria-pressed', String(on));
    });
  }
  let playTimer = null;
  function setPreview(i) { previewIdx = Math.max(0, Math.min(TL_N - 1, i)); refresh(true, true); }
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; renderTimeline(); } }
  function togglePlay() {
    if (playTimer) { stopPlay(); return; }
    if (previewIdx == null) previewIdx = Math.max(0, Math.min(TL_N - 1, obsIdx()));
    if (previewIdx >= TL_N - 1) previewIdx = 0;
    playTimer = setInterval(() => { if (!active || previewIdx >= TL_N - 1) { stopPlay(); return; } setPreview(previewIdx + 1); }, 1300);
    renderTimeline();
  }

  /* ---------- 地板（八宮著色） ---------- */
  const BASE = [242, 236, 222];
  const YXCOL = { '生氣': [95, 135, 100], '延年': [120, 154, 118], '天醫': [150, 174, 138], '伏位': [186, 196, 164],
                  '禍害': [202, 193, 176], '六煞': [188, 179, 164], '五鬼': [160, 152, 141], '絕命': [148, 140, 132] };
  const STARCOL = { 9: [185, 150, 88], 1: [108, 146, 152], 4: [128, 160, 118], 8: [204, 182, 128], 6: [210, 205, 192],
                    3: [182, 176, 160], 7: [174, 168, 156], 2: [218, 168, 142], 5: [179, 64, 47] };
  const NEUTRAL = [222, 214, 198], CENTERCOL = [250, 246, 236];

  function floorMode() {
    if (prefs.mode === 'a' && !(M && M.ma)) return 'zhai';
    if (prefs.mode === 'b' && !(M && M.mb)) return 'zhai';
    return prefs.mode;
  }
  function sectorYx(g, mode) { const p = M.palaces[g]; return mode === 'a' ? p.yxA : mode === 'b' ? p.yxB : p.yx; }
  function sectorColor(g) {
    if (LOCKED || !M) return NEUTRAL;
    if (g === '中') return CENTERCOL;
    const mode = floorMode();
    if (mode === 'star') return STARCOL[M.palaces[g].star('year')];
    return YXCOL[sectorYx(g, mode)] || NEUTRAL;
  }
  function paintFloor() {
    const F = M ? M.heading : 180, mode = floorMode();
    const cols = {}, hatch = {};
    ['中'].concat(GUAS.map(x => x.g)).forEach(g => {
      cols[g] = sectorColor(g);
      const m = M && !LOCKED ? M.palaces[g].star('month') : 0;
      hatch[g] = mode === 'star' && (m === 5 || m === 2);
    });
    const cw = floorCanvas.width, ch = floorCanvas.height, img = fctx.createImageData(cw, ch), data = img.data, a = 0.58;
    for (let py = 0; py < ch; py++) {
      const z = (py + 0.5) / PX - D / 2;
      for (let px = 0; px < cw; px++) {
        const x = (px + 0.5) / PX - W / 2, g = sectorAt(x, z, F), c = cols[g], i = (py * cw + px) * 4;
        let r = BASE[0] * (1 - a) + c[0] * a, gg = BASE[1] * (1 - a) + c[1] * a, b = BASE[2] * (1 - a) + c[2] * a;
        if (hatch[g] && ((px + py) % 14) < 3) { r = r * 0.7 + 179 * 0.3; gg = gg * 0.7 + 64 * 0.3; b = b * 0.7 + 47 * 0.3; }
        data[i] = r; data[i + 1] = gg; data[i + 2] = b; data[i + 3] = 255;
      }
    }
    fctx.putImageData(img, 0, 0);
    const cx = cw / 2, cy = ch / 2;
    fctx.save();
    fctx.strokeStyle = 'rgba(40,58,47,.38)'; fctx.lineWidth = 2; fctx.setLineDash([10, 8]);
    for (let k = 0; k < 8; k++) {
      const d = localDir(22.5 + 45 * k, F);
      fctx.beginPath(); fctx.moveTo(cx + d.x * CR * PX, cy + d.z * CR * PX); fctx.lineTo(cx + d.x * 20 * PX, cy + d.z * 20 * PX); fctx.stroke();
    }
    fctx.setLineDash([]); fctx.beginPath(); fctx.arc(cx, cy, CR * PX, 0, Math.PI * 2); fctx.stroke();
    const hx = (0.1 + W / 2) * PX, hy = (4.5 + D / 2) * PX;
    fctx.strokeStyle = 'rgba(179,64,47,.85)'; fctx.lineWidth = 3;
    fctx.beginPath(); fctx.arc(hx, hy, PX, Math.PI, 1.5 * Math.PI); fctx.stroke();
    fctx.beginPath(); fctx.moveTo(hx, hy); fctx.lineTo(hx, hy - PX); fctx.stroke();
    fctx.fillStyle = 'rgba(40,58,47,.62)'; fctx.font = '500 25px "STKaiti","KaiTi","Songti TC",serif';
    fctx.textAlign = 'center'; fctx.textBaseline = 'middle';
    ROOMS.forEach(r => fctx.fillText(r.n, (r.x + W / 2) * PX, (r.z + D / 2) * PX));
    fctx.restore();
    floorTex.needsUpdate = true; requestRender();
  }
  function placeCompass() {
    const F = M ? M.heading : 180, n = localDir(0, F);
    compassNeedle.position.set(n.x * 8.55, 0.01, n.z * 8.55); compassNeedle.rotation.y = Math.atan2(n.x, n.z);
    compassTicks.forEach((t, k) => { const d = localDir(22.5 + 45 * k, F); t.position.set(d.x * 8.09, 0.008, d.z * 8.09); t.rotation.y = Math.atan2(d.x, d.z); });
    compassLabels.forEach(l => { const d = localDir(l.b, F); l.pos.set(d.x * 9.15, 0, d.z * 9.15); });
  }

  /* ---------- 標籤 ---------- */
  function toneOf(g) {
    if (LOCKED || !M) return '';
    const mode = floorMode();
    if (mode === 'star') return STAR_NOTE[M.palaces[g].star('year')].tone;
    if (g === '中') return '';
    const v = (YX_INFO[sectorYx(g, mode)] || {}).good || 0;
    return v >= 1 ? 'good' : v <= -2 ? 'care' : 'mid';
  }
  function renderLabels() {
    const F = M ? M.heading : 180, mode = floorMode();
    const compact = !!camera && narrow() && orbs.some(o => orbVisible(o));
    Object.keys(sectorLabels).forEach(g => {
      const l = sectorLabels[g];
      if (g === '中') l.pos.set(0, 0.05, 0);
      else {
        const d = localDir(BY_G[g].b, F);
        const tx = Math.abs(d.x) > 1e-6 ? (W / 2) / Math.abs(d.x) : 1e9, tz = Math.abs(d.z) > 1e-6 ? (D / 2) / Math.abs(d.z) : 1e9;
        const t = Math.min(tx, tz) * 0.66; l.pos.set(d.x * t, 0.05, d.z * t);
      }
      let html;
      if (LOCKED || !M) html = '<b>' + (g === '中' ? '中宮' : g) + '</b>';
      else {
        const p = M.palaces[g], y = starShort(p.star('year')), m = starShort(p.star('month'));
        if (g === '中') html = '<b>中宮</b><span class="l3">年' + y + '・月' + m + '</span>';
        else {
          const line2 = mode === 'star' ? '年 ' + y : mode === 'a' ? '甲・' + p.yxA : mode === 'b' ? '乙・' + p.yxB : '宅・' + p.yx;
          const line3 = mode === 'star' ? '月 ' + m : '年' + y + '・月' + m;
          html = '<span class="l1"><b>' + BY_G[g].dir + '</b>' + g + '</span><span class="l2">' + line2 + '</span><span class="l3">' + line3 + '</span>';
        }
      }
      l.inner.className = 's3-sec ' + toneOf(g) + (compact ? ' compact' : '') + (selection && selection.kind === 'sector' && selection.g === g ? ' sel' : '');
      l.inner.innerHTML = html;
      l.el.style.display = prefs.labels ? '' : 'none';
    });
    requestRender();
  }
  let _v = null;
  function placeLabels() {
    const st = $('s3-stage'), w = st.clientWidth, h = st.clientHeight; _v = _v || new THREE.Vector3();
    labels.forEach(l => {
      if ((l.sector || l.orb) && l.el.style.display === 'none') return;
      _v.copy(l.pos).project(camera);
      if (_v.z > 1) { l.el.style.visibility = 'hidden'; return; }
      l.el.style.visibility = '';
      l.el.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-_v.y * 0.5 + 0.5) * h).toFixed(1) + 'px) translate(-50%,-50%)';
    });
  }
  function starShort(n) { return window.ZiBai.STAR_NAMES_SHORT[n] || ''; }

  /* ---------- 相機與操作 ---------- */
  function narrow() { return camera.aspect < 0.95; }
  function fitR() { return narrow() ? 27 : 19; }
  function updateCam() {
    const sp = Math.sin(cam.phi);
    camera.position.set(cam.target.x + cam.r * sp * Math.sin(cam.theta), cam.target.y + cam.r * Math.cos(cam.phi), cam.target.z + cam.r * sp * Math.cos(cam.theta));
    camera.lookAt(cam.target); requestRender();
  }
  let fitted = false;
  function onResize() {
    if (!renderer) return;
    const st = $('s3-stage'), w = st.clientWidth, h = st.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!fitted) { fitted = true; cam.r = fitR(); if (narrow()) { cam.phi = 0.5; cam.theta = 0.15; } }
    updateCam();
  }

  function setupControls(canvas) {
    $('s3-top').addEventListener('click', () => { cam.phi = 0.02; cam.theta = 0; cam.r = fitR() + 1; cam.target.set(0, 0, 0); updateCam(); });
    $('s3-persp').addEventListener('click', () => { cam.phi = narrow() ? 0.5 : 0.92; cam.theta = narrow() ? 0.15 : 0.35; cam.r = fitR(); cam.target.set(0, 0, 0.4); updateCam(); });
    const bWall = $('s3-wall'), bLbl = $('s3-lbl');
    const syncT = () => { bWall.setAttribute('aria-pressed', String(prefs.wallHigh)); bLbl.setAttribute('aria-pressed', String(prefs.labels)); };
    syncT();
    bWall.addEventListener('click', () => { prefs.wallHigh = !prefs.wallHigh; store.set(PREF_KEY, prefs); syncT(); setWallHeight(prefs.wallHigh ? 2.6 : 1.0); updateSelHelper(); });
    bLbl.addEventListener('click', () => { prefs.labels = !prefs.labels; store.set(PREF_KEY, prefs); syncT(); renderLabels(); });
    $('s3-reset').addEventListener('click', () => {
      items.forEach(d => { const d0 = DEFAULT_ITEMS.find(x => x.id === d.id); d.x = d0.x; d.z = d0.z; d.rot = d0.rot; applyItem(d); });
      saveItems(); updateSelHelper(); renderPanels();
    });

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const setNdc = e => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
    const pickItem = e => { setNdc(e); const h = ray.intersectObjects(pickables, false); return h.length ? h[0].object.userData.root.userData.item : null; };
    const floorPt = e => { setNdc(e); const p = new THREE.Vector3(); return ray.ray.intersectPlane(plane, p) ? p : null; };
    const pointers = new Map();
    let mode = null, down = null, last = null, moved = false, dragItem = null, dragOff = null, pinch0 = 0, r0 = 0;
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) { const p = [...pointers.values()]; pinch0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); r0 = cam.r; mode = 'pinch'; dragItem = null; moved = true; return; }
      down = { x: e.clientX, y: e.clientY }; last = { ...down }; moved = false;
      const it = e.button === 0 ? pickItem(e) : null;
      if (it) { mode = 'drag'; dragItem = it; const fp = floorPt(e); dragOff = fp ? { x: it.x - fp.x, z: it.z - fp.z } : { x: 0, z: 0 }; canvas.classList.add('dragging'); }
      else mode = (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit';
    });
    canvas.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === 'pinch' && pointers.size === 2) { const p = [...pointers.values()]; const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); if (pinch0 > 0) { cam.r = Math.min(34, Math.max(6, r0 * pinch0 / d)); updateCam(); } return; }
      if (!down) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) moved = true;
      if (!moved) return;
      if (mode === 'orbit') { cam.theta -= dx * 0.008; cam.phi = Math.min(1.45, Math.max(0.02, cam.phi - dy * 0.006)); updateCam(); }
      else if (mode === 'pan') {
        const s = cam.r * 0.0016, ct = Math.cos(cam.theta), stt = Math.sin(cam.theta);
        cam.target.x = Math.max(-8, Math.min(8, cam.target.x - (dx * ct - dy * stt) * s));
        cam.target.z = Math.max(-8, Math.min(8, cam.target.z - (-dx * stt - dy * ct) * s)); updateCam();
      } else if (mode === 'drag' && dragItem) {
        const fp = floorPt(e); if (!fp) return;
        dragItem.x = Math.round((fp.x + dragOff.x) * 20) / 20; dragItem.z = Math.round((fp.z + dragOff.z) * 20) / 20;
        applyItem(dragItem); selection = { kind: 'item', id: dragItem.id }; updateSelHelper(); renderDetail();
      }
    });
    const end = e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (mode === 'pinch') { if (!pointers.size) { mode = null; down = null; } return; }
      if (mode === 'drag' && dragItem) { selection = { kind: 'item', id: dragItem.id }; if (moved) saveItems(); }
      else if (!moved && e.type === 'pointerup') {
        const fp = floorPt(e);
        selection = fp && Math.abs(fp.x) <= W / 2 && Math.abs(fp.z) <= D / 2 ? { kind: 'sector', g: sectorAt(fp.x, fp.z, M ? M.heading : 180) } : null;
      }
      canvas.classList.remove('dragging'); mode = null; down = null; dragItem = null;
      updateSelHelper(); renderLabels(); renderDetail();
    };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', e => { e.preventDefault(); cam.r = Math.min(34, Math.max(6, cam.r * Math.exp(e.deltaY * 0.001))); updateCam(); }, { passive: false });
    window.addEventListener('keydown', e => {
      if (!active || !selection || selection.kind !== 'item') return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const d = itemById(selection.id); let hit = true;
      if (e.key === 'r' || e.key === 'R') d.rot = (d.rot + 1) % 4;
      else if (e.key === 'ArrowLeft') d.x -= 0.1; else if (e.key === 'ArrowRight') d.x += 0.1;
      else if (e.key === 'ArrowUp') d.z -= 0.1; else if (e.key === 'ArrowDown') d.z += 0.1;
      else if (e.key === 'Escape') selection = null; else hit = false;
      if (hit) { e.preventDefault(); if (selection) { applyItem(d); saveItems(); } updateSelHelper(); renderLabels(); renderDetail(); }
    });
  }

  /* ======================= 面板 ======================= */
  function dirOf(g) { return g === '中' ? '中宮' : BY_G[g].dir; }
  function whereStar(layer, n) { return ['中'].concat(GUAS.map(x => x.g)).filter(g => M.palaces[g].star(layer) === n).map(dirOf); }
  function yxTone(yx) { const v = (YX_INFO[yx] || {}).good || 0; return v >= 1 ? 'good' : v <= -2 ? 'care' : 'mid'; }
  function li(tone, text) { return '<li class="' + tone + '">' + text + '</li>'; }

  function comboLines(p) {
    return p.combos.map(h => {
      const pair = '（' + h.s1.name + '×' + h.s2.name + '）';
      if (h.rule.type === 'good') return li('good', h.rule.name + pair + '：' + esc(h.rule.desc) + (h.rule.boost ? esc(h.rule.boost) : ''));
      return li('care', h.rule.name + pair + '：' + (COMBO_CARE[h.rule.name] || '此方這段時間宜靜，保持整潔通風。'));
    });
  }
  function personLines(p, withUse) {
    const out = [];
    [['甲', p.yxA, M.ma], ['乙', p.yxB, M.mb]].forEach(([who, yx, mg]) => {
      if (!yx) return;
      let t = '對命主' + who + '（' + mg.name + '命）來說是' + yx + '方。';
      if (p.yx && (YX_INFO[p.yx].good >= 1) !== (YX_INFO[yx].good >= 1)) t += '宅卦與命主看法不同，兩者分開參考' + (withUse ? '，不必硬要同時滿足' : '') + '。';
      out.push(li(YX_INFO[yx].good >= 1 ? 'good' : 'mid', t));
    });
    return out;
  }
  function yearLines(g, p) {
    const out = [], y = p.star('year'), m = p.star('month');
    out.push(li(STAR_NOTE[y].tone, '今年' + STAR_NOTE[y].t));
    if (m !== y) out.push(li(STAR_NOTE[m].tone, '這個月' + STAR_NOTE[m].t));
    const tags = [];
    if (M.sha.taisui === g) tags.push('太歲'); if (M.sha.suipo === g) tags.push('歲破'); if (M.sha.sansha === g) tags.push('三煞');
    if (tags.length) out.push(li('mid', '今年' + tags.join('、') + '在此方：這一年此方不宜動土、大修或施工，日常起居照舊。'));
    return out;
  }
  function layerTable(p) {
    return '<table class="s3-layers"><thead><tr><th>層</th><th>星</th><th>五氣</th></tr></thead><tbody>' +
      p.layers.map(l => '<tr class="' + (l.on ? '' : 'off') + '"><td>' + l.label + '</td><td>' + starShort(l.star) + '</td><td>' + (l.qi || '—') + '</td></tr>').join('') +
      '</tbody></table>';
  }
  function reportButton(g) {
    return g === '中' ? '' : '<button type="button" class="s3-btn" data-report="' + g + '">看紫白解析：' + g + '宮</button>';
  }

  function itemLines(d, g, p) {
    const out = [], use = ITEM_USE[d.type], y = p.star('year'), m = p.star('month');
    if (g === '中') out.push(li(d.h >= 1.5 ? 'mid' : '', d.name + '落在中宮。' + (d.h >= 1.5 ? '中宮宜明亮通暢，高大的櫃體若能靠邊擺，全屋會更開闊。' : '保持周圍通暢即可。')));
    else if (use) {
      if (use.good.includes(p.yx)) out.push(li('good', use.label + '在宅卦' + p.yx + '方，這個位置合適。'));
      else if (use.avoid.includes(p.yx)) {
        const alt = GUAS.filter(x => use.good.includes(M.palaces[x.g].yx)).slice(0, 3).map(x => x.dir + '（' + M.palaces[x.g].yx + '）');
        out.push(li('care', use.label + '落在宅卦' + p.yx + '方，傳統上此方較適合作' + YX_INFO[p.yx].use + '。若方便調整，可以考慮' + alt.join('、') + '。'));
      } else out.push(li('mid', use.label + '在宅卦' + p.yx + '方，不算首選，也無大礙。'));
    }
    if (use && use.wen) {
      if (y === 4 || y === 1) out.push(li('good', '今年' + starShort(y) + '到此，讀書寫作正好。'));
      if (m === 4 || m === 1) out.push(li('good', '這個月' + starShort(m) + '到此，適合專心的工作。'));
    }
    if (y === 5) out.push(li('care', '今年五黃在這個方位。' + d.name + '照常使用，只是這一年此處不宜動工敲打。'));
    if (m === 5 && y !== 5) out.push(li('care', '這個月五黃飛到這裡，宜靜，換月後就移走。'));
    if (use && use.person && g !== '中') out.push(...personLines(p, true));
    return out;
  }

  function renderDetail() {
    const el = $('s3-detail');
    if (LOCKED) { el.innerHTML = '<h3>目前選取</h3><p class="s3-empty">' + esc(LOCK_MSG) + '</p>'; return; }
    if (!M || !selection) { el.innerHTML = '<h3>目前選取</h3><p class="s3-empty">點地板任一處，或點一件家具，看那個位置落在哪一宮、適合做什麼。</p>'; return; }
    let g, title, sub, lines;
    if (selection.kind === 'sector') {
      g = selection.g; const p = M.palaces[g];
      title = g === '中' ? '中宮' : g + '宮・' + BY_G[g].dir; sub = '地板區塊';
      lines = [];
      if (g === '中') lines.push(li('', '中宮是全屋的心，宜明亮通暢，少堆重物雜物。'));
      else lines.push(li(yxTone(p.yx), '宅卦看是' + p.yx + '方，傳統上適合作' + YX_INFO[p.yx].use + '。'));
      lines.push(...yearLines(g, p), ...comboLines(p), ...(g === '中' ? [] : personLines(p, false)));
    } else {
      const d = itemById(selection.id); g = sectorAt(d.x, d.z, M.heading); const p = M.palaces[g];
      title = d.name; sub = '位在' + (g === '中' ? '中宮' : g + '宮・' + BY_G[g].dir) + '（以家具中心點判定）';
      lines = itemLines(d, g, p).concat(comboLines(p));
    }
    const p = M.palaces[g];
    el.innerHTML = '<h3>目前選取</h3><p class="s3-title">' + title + '</p><p class="s3-sub">' + sub + '</p>' +
      '<div class="s3-detail-grid">' + layerTable(p) + '<ul class="s3-notes">' + lines.join('') + '</ul></div>' +
      '<div class="s3-btnrow">' + (selection.kind === 'item' ? '<button type="button" class="s3-btn" data-act="rot">旋轉 90°</button>' : '') +
      reportButton(g) + '<button type="button" class="s3-btn" data-act="clear">取消選取</button></div>';
  }

  function renderSummary() {
    const el = $('s3-summary');
    if (LOCKED || !M) { el.innerHTML = ''; return; }
    const two5 = ['中'].concat(GUAS.map(x => x.g)).filter(g => { const a = M.palaces[g].star('year'), b = M.palaces[g].star('month'); return (a === 2 && b === 5) || (a === 5 && b === 2); }).map(dirOf);
    const lines = [
      li('', (M.preview ? '（時間軸預覽）' : '') + M.zhai.name + '宅，屬' + (EAST4[M.zhai.name] ? '東四宅' : '西四宅') + '。' + M.ganzhi + '年' + MONTH_CN[M.t.fsMonth] + '（' + M.t.termName + '後），流年' + starShort(M.ys) + '、流月' + starShort(M.ms) + '入中，當前' + ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][M.ps] + '運。'),
      li('good', '九紫旺星：今年在' + whereStar('year', 9).join('、') + '，這個月在' + whereStar('month', 9).join('、') + '。這些方位宜多活動、開窗採光。'),
      li('good', '四綠文昌今年在' + whereStar('year', 4).join('、') + '，適合書桌與讀書角。'),
      li('care', '今年五黃在' + whereStar('year', 5).join('、') + '、二黑在' + whereStar('year', 2).join('、') + '；這個月五黃在' + whereStar('month', 5).join('、') + '。這幾處宜靜，保持整潔通風。' + (two5.length ? '其中' + two5.join('、') + '年月二五同宮，這段時間最宜安靜。' : '')),
      li('mid', '今年太歲在' + dirOf(M.sha.taisui) + '、歲破在' + dirOf(M.sha.suipo) + '、三煞在' + dirOf(M.sha.sansha).replace('正', '') + '方：這些方位這一年不宜動土大修。')
    ];
    [['甲', M.ma], ['乙', M.mb]].forEach(([who, mg]) => {
      if (!mg) return;
      const same = !!EAST4[mg.name] === !!EAST4[M.zhai.name];
      lines.push(li(same ? 'good' : 'mid', '命主' + who + '為' + mg.name + '命，屬' + (EAST4[mg.name] ? '東四命' : '西四命') + '，' + (same ? '與宅同組，方位用法大致一致。' : '與宅分屬東西四，宅與人的吉方分開參考。')));
    });
    el.innerHTML = '<h3>全屋此刻</h3><ul class="s3-notes">' + lines.join('') + '</ul><p class="s3-empty">流年流月會走，化解與擺設也跟著調整，換月後再看一次。</p>';
  }

  function renderLegend() {
    const el = $('s3-legend'), mode = floorMode();
    const sw = (c, t) => '<span><i style="background:rgb(' + c.join(',') + ')"></i>' + t + '</span>';
    if (mode === 'star') el.innerHTML = sw(STARCOL[9], '九紫旺') + sw(STARCOL[1], '一白') + sw(STARCOL[4], '四綠') + sw(STARCOL[8], '八白') + sw(STARCOL[6], '六白') + sw(STARCOL[3], '三碧・七赤') + sw(STARCOL[2], '二黑') + sw(STARCOL[5], '五黃') + '<span>斜紋＝本月二黑或五黃到</span>';
    else el.innerHTML = sw(YXCOL['生氣'], '生氣') + sw(YXCOL['延年'], '延年') + sw(YXCOL['天醫'], '天醫') + sw(YXCOL['伏位'], '伏位') + sw(YXCOL['禍害'], '禍害・六煞') + sw(YXCOL['五鬼'], '五鬼・絕命');
    const segs = $('s3-seg').querySelectorAll('button');
    segs.forEach(b => {
      const m = b.dataset.mode, dis = (m === 'a' && !M.ma) || (m === 'b' && !M.mb);
      b.disabled = dis; b.setAttribute('aria-checked', String(m === mode));
      b.title = dis ? '請先在排盤設定填寫出生年' : '';
    });
    if (prefs.mode !== mode) el.innerHTML += '<span>' + (prefs.mode === 'a' ? '命主甲' : '家人乙') + '尚未填寫，先以宅卦顯示</span>';
  }

  function renderWarn() {
    const el = $('s3-warn');
    if (LOCKED || !M) { el.hidden = true; return; }
    const sit = M.sitFromHeading;
    if (sit === M.zhai.name) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '向方 ' + M.heading.toFixed(1) + '° 對應坐' + dirOf(sit).replace('正', '') + '（' + sit + '宅），排盤設定的宅卦是' + M.zhai.name + '宅。屋子依向方角度擺放，遊星與宅星依宅卦計算。' +
      '<button type="button" class="s3-btn" data-sync="' + sit + '">把宅卦改成' + sit + '宅</button>';
  }

  function renderPanels() { renderLegend(); renderWarn(); renderDetail(); renderSummary(); }

  function refresh(force, animate) {
    const key = stateKey();
    if (!force && key === lastKey) return;
    lastKey = key;
    if (!LOCKED) { try { M = compute(readShared(), previewIdx != null ? tlOf(previewIdx) : null); } catch (err) { LOCKED = true; LOCK_MSG = '計算時發生錯誤，暫停顯示方位資料。'; M = null; } }
    const out = $('s3-heading'); if (out && M) out.textContent = M.heading.toFixed(1) + '°';
    if (renderer) { paintFloor(); placeCompass(); renderLabels(); updateSelHelper(); updateOrbs(!!animate); }
    renderPanels(); renderTimeline();
  }

  /* ---------- 面板事件（委派） ---------- */
  function setupPanelEvents() {
    $('s3-seg').addEventListener('click', e => {
      const b = e.target.closest('button[data-mode]'); if (!b || b.disabled) return;
      prefs.mode = b.dataset.mode; store.set(PREF_KEY, prefs); refresh(true);
    });
    $('sim3d-view').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act === 'rot' && selection && selection.kind === 'item') { const d = itemById(selection.id); d.rot = (d.rot + 1) % 4; applyItem(d); saveItems(); updateSelHelper(); renderDetail(); }
      else if (b.dataset.act === 'clear') { selection = null; updateSelHelper(); renderLabels(); renderDetail(); }
      else if (b.dataset.report) {
        const g = b.dataset.report; $('mode-zibai').click();
        requestAnimationFrame(() => { const r = document.getElementById('report-' + g); if (r) { r.open = true; r.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' }); } });
      } else if (b.dataset.sync) {
        const sel = $('house-gua'); if (sel) { sel.value = b.dataset.sync; sel.dispatchEvent(new Event('change', { bubbles: true })); refresh(true); }
      }
    });
    const r = $('s3-tl');
    r.addEventListener('input', () => { stopPlay(); setPreview(+r.value); });
    $('s3-tl-prev').addEventListener('click', () => { stopPlay(); setPreview((previewIdx != null ? previewIdx : obsIdx()) - 1); });
    $('s3-tl-next').addEventListener('click', () => { stopPlay(); setPreview((previewIdx != null ? previewIdx : obsIdx()) + 1); });
    $('s3-tl-play').addEventListener('click', togglePlay);
    $('s3-tl-back').addEventListener('click', () => { stopPlay(); previewIdx = null; refresh(true, true); });
    $('s3-tl-set').addEventListener('click', () => {
      if (previewIdx == null) return; stopPlay();
      const o = tlOf(previewIdx), inp = $('target-date');
      if (inp) { inp.value = jieDateOf(o.fsYear, o.fsMonth); inp.dispatchEvent(new Event('change', { bubbles: true })); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      previewIdx = null; refresh(true, false);
    });
    $('s3-tl-opts').addEventListener('click', e => {
      const b = e.target.closest('.s3-chip'); if (!b) return;
      if (b.dataset.orb) { const n = +b.dataset.orb, i = prefs.orbStars.indexOf(n); if (i >= 0) prefs.orbStars.splice(i, 1); else prefs.orbStars.push(n); }
      else if (b.dataset.layer === 'year') prefs.orbYear = !prefs.orbYear;
      else if (b.dataset.layer === 'month') prefs.orbMonth = !prefs.orbMonth;
      else prefs.path = !prefs.path;
      store.set(PREF_KEY, prefs); updateOrbs(false); renderLabels(); renderTimeline();
    });
    window.addEventListener('fengshui:heading', () => { if (active) schedule(); });
    const controls = $('controls');
    if (controls) ['input', 'change', 'click'].forEach(t => controls.addEventListener(t, () => { if (active) setTimeout(schedule, 0); }));
  }

  /* ---------- 啟動 ---------- */
  function init() {
    const btn = buildDom(); if (!btn) return;
    const errs = selfTest();
    if (errs.length) { LOCKED = true; LOCK_MSG = '自測未通過，暫停顯示方位資料（' + errs.join('、') + '）。'; }
    const ver = $('s3-ver'); if (ver) ver.textContent = '室內 3D ' + VERSION + '・紫白引擎 ' + ((window.ZiBai && window.ZiBai.VERSION) || '—');
    setupPanelEvents();
    setupMode(btn);
  }
  window.Sim3D = { VERSION, selfTest, sectorAt, sittingGuaOf, tlOf, tlIdxOf, jieDateOf,
    _orbState: () => orbs.map(o => ({ n: o.n, layer: o.layer, g: o.g, visible: o.grp.visible })), _preview: () => previewIdx, _M: () => M };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
