document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定 (★ 包含您的專屬記憶庫)
    // =================================================================
    
    const RADIAL_LAYOUT = {
        center: { x: 280.36, y: 280.36 }, 
        
        combinationsRadius: 100,// ★ 吉凶格局星號 (半徑 100)
        starRadius: 122,        // 1. 八宅吉凶星 (半徑 122)
        personMingRadius: 200,  // 2. 人命紫白 & 宅紫白 (共用圈)
        monthlyRadius: 200,     // 3. 流月飛星 
        annualRadius: 228,      // 4. 流年飛星 & 元運飛星 (共用圈)
        twelveShasRadius: 255,  // 5. 太歲十二神煞 & 戊己都天煞 & 三煞 (共用圈)

        sealOffset: 0,
        sealSize: 10,   
        defaultRotation: 0 
    };

    // ★ 資料與算法已抽至純引擎 zibai.js（單一真相來源，node 可測）。
    //    以下從 window.ZiBai 取別名，行為與舊版完全一致；斷語已由 6 條擴充為 20 條。
    const ZB = window.ZiBai;
    const {
        TWENTY_FOUR_MOUNTAINS, FLYING_STARS_INFO, STAR_NAMES_SHORT, LUO_SHU_PATH,
        TWELVE_SHAS_SEQUENCE, COMBINATION_RULES, GUA_DATA, OPPOSITE_GUA
    } = ZB;

    
    // 將原本的 userSettings 替換為支援雙人的版本
    let userSettings = {
    genderA: 'male',
    genderB: 'male'
    };

    let isQiMode = false; // ★ 五氣視角模式開關

    // =================================================================
    //  SECTION 2: 節氣、流年、飛星邏輯與推算引擎（已抽至 zibai.js）
    // =================================================================
    const {
        getSolarTermMonth, calculateMonthStar, calculatePeriodStar,
        getGanzhiYear, getStarInGua, getWuXing, getFiveQi
    } = ZB;

    // =================================================================
    //  SECTION 3: 動態預測大腦 (積分量化系統)
    // =================================================================
    
    // 將五氣轉為指定分數
    // 將五氣轉為指定分數 (已更新旺、退、死、殺，並新增「關」)
    function getQiScore(qiString) {
        switch(qiString) {
            case '生': return 20; 
            case '旺': return 20;   // 提升至 20
            case '退': return 0;    // 調整為 0
            case '死': return -10; 
            case '殺': return -20; 
            case '關': return -20;  // 新增關方扣分
            default: return 0;
        }
    }
    
    // 將八宅轉為指定分數 (目前權重全數歸零)
    function getBzScore(bzString) {
        switch(bzString) {
            case '生氣': 
            case '延年': 
            case '伏位': 
            case '天醫': 
            case '五鬼': 
            case '六煞': 
            case '禍害': 
            case '絕命': 
                return 0;
            default: return 0;
        }
    }

    // 建立動態面板 UI
    function setupDiagnosticPanel() {
        let panel = document.getElementById('ai-diagnostic-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'ai-diagnostic-panel';
            panel.className = 'control-panel'; 
            panel.style.cssText = 'margin-top: 15px; text-align: left; width: 100%; box-sizing: border-box; z-index: 100; position: relative;';
            
            panel.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #da7800; display: flex; align-items: center; justify-content: center;">
                    🔮 動態吉凶預測
                </h3>
                <div style="font-size: 13px; margin-bottom: 10px; background: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
                    <strong style="display:block; margin-bottom:6px;">選擇星氣疊加層 (打勾自動結算)：</strong>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        <label><input type="checkbox" id="chk-layer-1" class="layer-chk" value="1" checked> 1.宅星</label>
                        <label><input type="checkbox" id="chk-layer-2" class="layer-chk" value="2" checked> 2.運星</label>
                        <label><input type="checkbox" id="chk-layer-3" class="layer-chk" value="3" checked> 3.流年</label>
                        <label><input type="checkbox" id="chk-layer-4" class="layer-chk" value="4" checked> 4.流月</label>
                        <label><input type="checkbox" id="chk-layer-5" class="layer-chk" value="5" checked> 5.命星</label>
                    </div>
                </div>
                <div id="diagnostic-output" style="font-size: 14px; max-height: 420px; overflow-y: auto; padding-right: 5px; border-bottom: 1px solid #eee;"></div>
                
                <div id="diagnostic-footer" style="padding-top: 4px; text-align: center;"></div>
            `;
            const controls = document.getElementById('controls');
            if(controls) { 
                controls.appendChild(panel); 
            } else { 
                document.body.appendChild(panel); 
            }
            
            // 綁定勾選框事件
            document.querySelectorAll('.layer-chk').forEach(chk => {
                chk.addEventListener('change', updateAll);
            });
        }
    }

    // =================================================================
    //  SECTION 4: 繪圖核心與 SVG 輔助函式
    // =================================================================
    const svgPlate = document.getElementById('FengShui-plate');
    const SVG_NS = "http://www.w3.org/2000/svg";
    
    function getLayer(id) {
        let layer = document.getElementById(id);
        if (!layer && svgPlate) {
            layer = document.createElementNS(SVG_NS, 'g');
            layer.setAttribute('id', id);
            svgPlate.appendChild(layer);
        }
        return layer;
    }

    function getSvgAngle(gua) {
        switch(gua) {
            case '坎': return 90; case '艮': return 135; case '震': return 180; case '巽': return 225; 
            case '離': return 270; case '坤': return 315; case '兌': return 0; case '乾': return 45;  
        }
        return 0;
    }

    // 繪製扇形色塊的工具函式 (用來畫背景隔離區)
    function drawAnnularSector(layer, cx, cy, rIn, rOut, startAngle, endAngle, color) {
        const startOut = { x: cx + rOut * Math.cos(endAngle * Math.PI / 180), y: cy + rOut * Math.sin(endAngle * Math.PI / 180) };
        const endOut = { x: cx + rOut * Math.cos(startAngle * Math.PI / 180), y: cy + rOut * Math.sin(startAngle * Math.PI / 180) };
        const startIn = { x: cx + rIn * Math.cos(endAngle * Math.PI / 180), y: cy + rIn * Math.sin(endAngle * Math.PI / 180) };
        const endIn = { x: cx + rIn * Math.cos(startAngle * Math.PI / 180), y: cy + rIn * Math.sin(startAngle * Math.PI / 180) };
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const d = [
            "M", startOut.x, startOut.y,
            "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y,
            "L", endIn.x, endIn.y,
            "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y,
            "Z"
        ].join(" ");
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", color);
        layer.appendChild(path);
    }

    function drawLabel(layer, text, angle, radius, color, fontSize, isDouble = false, subText = "", subColor = "") {
        if (!layer) return;
        const rad = angle * (Math.PI / 180);
        const x = RADIAL_LAYOUT.center.x + radius * Math.cos(rad);
        const y = RADIAL_LAYOUT.center.y + radius * Math.sin(rad);

        const textEl = document.createElementNS(SVG_NS, 'text');
        textEl.setAttribute('x', x); 
        textEl.setAttribute('y', y);
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'central');
        textEl.setAttribute('font-family', '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif');
        textEl.setAttribute('font-weight', 'bold');
        textEl.setAttribute('fill', color);
        
        textEl.setAttribute('transform', `rotate(${angle + 90}, ${x}, ${y})`);

        if (isDouble) {
            const t1 = document.createElementNS(SVG_NS, 'tspan');
            t1.setAttribute('x', x); 
            t1.setAttribute('dy', '-0.5em'); 
            t1.setAttribute('font-size', '11'); 
            t1.textContent = text;
            
            const t2 = document.createElementNS(SVG_NS, 'tspan');
            t2.setAttribute('x', x); 
            t2.setAttribute('dy', '1.3em'); 
            t2.setAttribute('font-size', '10'); 
            if (subColor) t2.setAttribute('fill', subColor); 
            t2.textContent = subText;
            
            textEl.appendChild(t1); 
            textEl.appendChild(t2);
        } else {
            textEl.setAttribute('font-size', fontSize);
            textEl.textContent = text;
        }
        layer.appendChild(textEl);
    }

    // ★ 全新繪製 SVG 星等評分符號函式 (支援精緻半顆星)
    function drawScoreStar(layer, angle, radius, type, isHalf = false) {
        const rad = angle * (Math.PI / 180);
        const cx = RADIAL_LAYOUT.center.x + radius * Math.cos(rad);
        const cy = RADIAL_LAYOUT.center.y + radius * Math.sin(rad);
        
        const color = type === 'good' ? '#e91700ff' : '#000000'; // 紅吉黑凶
        
        // 建立群組並進行旋轉與縮放定位
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('transform', `translate(${cx}, ${cy}) rotate(${angle + 90}) scale(1.1)`);
        
        if (isHalf) {
            // 繪製半顆星的左半邊實心
            const pathLeft = document.createElementNS(SVG_NS, 'path');
            pathLeft.setAttribute('d', 'M 0,-5 L 0,2 L -2.93,4.04 L -1.85,0.58 L -4.75,-1.54 L -1.17,-1.61 Z');
            pathLeft.setAttribute('fill', color);
            g.appendChild(pathLeft);
            
            // 繪製半顆星的右半邊空心外框
            const pathRight = document.createElementNS(SVG_NS, 'path');
            pathRight.setAttribute('d', 'M 0,-5 L 1.17,-1.61 L 4.75,-1.54 L 1.85,0.58 L 2.93,4.04 L 0,2');
            pathRight.setAttribute('fill', 'none');
            pathRight.setAttribute('stroke', color);
            pathRight.setAttribute('stroke-width', '0.6');
            g.appendChild(pathRight);
        } else {
            // 繪製完整的實心五角星
            const pathFull = document.createElementNS(SVG_NS, 'path');
            pathFull.setAttribute('d', 'M 0,-5 L 1.17,-1.61 L 4.75,-1.54 L 1.85,0.58 L 2.93,4.04 L 0,2 L -2.93,4.04 L -1.85,0.58 L -4.75,-1.54 L -1.17,-1.61 Z');
            pathFull.setAttribute('fill', color);
            g.appendChild(pathFull);
        }
        
        layer.appendChild(g);
    }

    // ★ 新增：繪製吉格光暈工具
    function drawLuckyGlow(layer, gua, type) {
    const angle = getSvgAngle(gua);
    
    // 設定扇形光暈的範圍（建議略大於或重疊於原本的背景層）
    const rIn = 135;  // 內半徑
    const rOut = 240; // 外半徑
    const startAngle = angle - 22.5;
    const endAngle = angle + 22.5;

    // 根據吉格類型設定顏色 (例如文昌綠、財位金)
    const color = (type === '四一') ? 'rgba(114, 235, 118, 0.4)' : 'rgba(250, 236, 135, 0.4)';

    // ★ 核心修改：呼叫原本的扇形繪製工具
    const glowPath = drawAnnularSector(
        layer, 
        RADIAL_LAYOUT.center.x, 
        RADIAL_LAYOUT.center.y, 
        rIn, rOut, 
        startAngle, endAngle, 
        color
    );

    // 為扇形路徑加上濾鏡與呼吸動畫類別 [cite: 2, 4]
    if (glowPath) {
        // ★ 關鍵：必須加入這行類別綁定，CSS 動畫才會生效
        glowPath.classList.add("lucky-pulse"); 
        
        // 確保濾鏡正確套用
        glowPath.setAttribute("filter", "url(#blurFilter)"); 
    }
    }

    // ★ 更新：完全沿用 renderPersonMingStars 字型與排版設定的通用紫白繪製函式
    function renderRichStars(baseStar, radius, layerId, badgeText, angleOffset = 0, guanGua = null) {
    const layer = getLayer(layerId);
    if (!layer) return;
    layer.innerHTML = '';

    LUO_SHU_PATH.forEach(gua => {
        let star = getStarInGua(baseStar, gua);
        // 計算加上偏移量後的最終角度 (如偏左 -15, 置中 0)
        const finalAngle = getSvgAngle(gua) + angleOffset;

        // 處理「宅紫白」獨有的對宮 (氣口/關位)
        if (guanGua && gua === guanGua) {
            // 關位顯示：例如「宅-關」，副標為「氣口」
            drawLabel(layer, `${badgeText}-關`, finalAngle, radius, '#555555ff', 15, true, '氣口');
            return; // 畫完關位就跳出換下一個宮位
        }

        // 判斷是否開啟了五氣模式 (生旺退殺死)
        if (typeof isQiMode !== 'undefined' && isQiMode) {
            const qiData = getFiveQi(baseStar, star);
            // 五氣模式顯示：例如「宅生」、「命旺」
            drawLabel(layer, `${badgeText}${qiData.qi}`, finalAngle, radius, qiData.color, 15);
        } else {
            const info = FLYING_STARS_INFO[star];
            // 飛星模式顯示：例如「宅-1白」或「命-8白」
            const mainText = `${badgeText}-${STAR_NAMES_SHORT[star]}`;
            
            // ★ 核心修改：使用原生的 drawLabel，帶入字型大小 15，並加上 info.meaning (毒癌/喜慶等)
            drawLabel(layer, mainText, finalAngle, radius, info.color, 15, true, info.meaning);
        }
    });
    }

    function renderStarsShort(centerNum, radius, layerId, prefix, fontSize = 14, angleOffset = 0, qiPrefix = '', guanGua = null) {
        const layer = getLayer(layerId);
        layer.innerHTML = '';
        LUO_SHU_PATH.forEach((gua, index) => {
            let num = (centerNum + index + 1) % 9;
            if (num === 0) num = 9;

            let text, textColor;
            if (isQiMode) {
                // ★ 邏輯更新：在五氣模式下，判定是否為關方
                const qiData = getFiveQi(centerNum, num);
                let currentQiPrefix = qiPrefix;
                
                // 如果是宅氣層且目前宮位是關方，將「宅」改為「宅關」
                if (qiPrefix === '宅' && gua === guanGua) {
                    currentQiPrefix = '宅關';
                    text = currentQiPrefix; // 關方通常不標註生旺退死，直接標註「宅關」
                } else {
                    text = `${currentQiPrefix}${qiData.qi}`;
                }
                
                textColor = qiData.color;
            } else {
                // 紫白模式：判定是否為關方
                let currentPrefix = prefix;
                if (prefix === '宅' && gua === guanGua) {
                    currentPrefix = '宅-關';
                }
                text = `${currentPrefix}-${STAR_NAMES_SHORT[num]}`;
                textColor = FLYING_STARS_INFO[num].color;
            }
            drawLabel(layer, text, getSvgAngle(gua) + angleOffset, radius, textColor, fontSize);
        });
    }

    // =================================================================
    //  SECTION 5: 結算邏輯與更新文字圖層
    // =================================================================
    function updateAll() {
    const inputYearA = document.getElementById('input-year-a');
    const inputYearB = document.getElementById('input-year-b');
    
    // 防呆機制：如果甲的年份還沒填，就不跑羅盤
    if (!inputYearA || !inputYearA.value) return; 

    const birthYearA = parseInt(inputYearA.value);
    const birthYearB = parseInt(inputYearB.value);

    // 取得使用者設定的性別 (預設為男)
    const genderA = (typeof userSettings !== 'undefined' && userSettings.genderA) ? userSettings.genderA : 'male';
    const genderB = (typeof userSettings !== 'undefined' && userSettings.genderB) ? userSettings.genderB : 'male';

    // 讀取選填的生日月/日（供命卦立春校正；留空則以「年」為三元年，行為與舊版一致）
    const readNum = (id) => { const el = document.getElementById(id); const v = el ? parseInt(el.value) : NaN; return isNaN(v) ? null : v; };
    const monthA = readNum('input-month-a'), dayA = readNum('input-day-a');
    const monthB = readNum('input-month-b'), dayB = readNum('input-day-b');

    // --- 計算命主 (甲) 命卦（引擎含立春校正） ---
    let mingGuaA = null;
    if (!isNaN(birthYearA)) {
        mingGuaA = ZB.mingGua(birthYearA, genderA, monthA, dayA);
    } else {
        return; // 命主必填，否則停止渲染
    }

    // --- 計算家人 (乙) 命卦 (若有填寫) ---
    let mingGuaB = null;
    if (!isNaN(birthYearB)) {
        mingGuaB = ZB.mingGua(birthYearB, genderB, monthB, dayB);
    }

    const selectHouse = document.getElementById('house-gua');
    const houseGuaName = selectHouse ? selectHouse.value : '坎';
    const zhaiGua = Object.values(GUA_DATA).find(g => g.name === houseGuaName) || GUA_DATA[1];

    // 讀取使用者選擇的日期
    const dateInput = document.getElementById('target-date');
    let selectedDate = new Date();
    if (dateInput && dateInput.value) {
        const parts = dateInput.value.split('-');
        if (parts.length === 3) {
            selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
        }
    }
        

    // 取得流年流月資料
    const termData = getSolarTermMonth(selectedDate);
    const annualStar = ZB.annualStar(termData.fsYear);
    const monthStar = calculateMonthStar(termData.fsYear, termData.fsMonth);
    const periodStar = calculatePeriodStar(termData.fsYear);

    // 確保 UI 面板存在
    setupDiagnosticPanel();

    // 取得使用者勾選的疊加層級 (1~5)
    let activeLayers = [];
    document.querySelectorAll('.layer-chk').forEach(chk => {
        if (chk.checked) activeLayers.push(parseInt(chk.value));
    });

    let reports = []; 
    const bzLayer = getLayer('bz-layer');
    bzLayer.innerHTML = '';
    const comboLayer = getLayer('combinations-layer');
    comboLayer.innerHTML = '';

    // ★ 核心掃描：迴圈跑 8 宮位
    LUO_SHU_PATH.forEach(gua => {
    const guaInfo = Object.values(GUA_DATA).find(g => g.name === gua);
    
    const bzName = zhaiGua.stars[gua];
    const pZhai = getStarInGua(zhaiGua.number, gua);
    const pPeriod = getStarInGua(periodStar, gua);
    const pYear = getStarInGua(annualStar, gua);
    const pMonth = getStarInGua(monthStar, gua);
    
    // 取得甲與乙的命星
    const pMingA = mingGuaA ? getStarInGua(mingGuaA.number, gua) : null;
    const pMingB = mingGuaB ? getStarInGua(mingGuaB.number, gua) : null;

    let sharedScore = 0;
    let extraScoreA = 0; // 儲存甲與其他星產生的組合分
    let extraScoreB = 0; // 儲存乙與其他星產生的組合分
    let triggerEvents = [];
    let hasDrawnGlowInThisGua = false; // ★ 新增：確保每個宮位特效只畫一次

    // 第一步：空間共用 - 宅卦八宅基礎分 (目前 getBzScore 回傳 0)
    sharedScore += getBzScore(bzName);

    // 第二步：收集環境五氣分 (宅、運、年、月)
    if (activeLayers.includes(1)) { 
        const qiData = getFiveQi(zhaiGua.number, pZhai);
        let finalQi = qiData.qi;
        if (gua === OPPOSITE_GUA[zhaiGua.name]) { finalQi = '關'; }
        sharedScore += getQiScore(finalQi); 
    }
    if (activeLayers.includes(2)) sharedScore += getQiScore(getFiveQi(periodStar, pPeriod).qi);
    if (activeLayers.includes(3)) sharedScore += getQiScore(getFiveQi(annualStar, pYear).qi);
    if (activeLayers.includes(4)) sharedScore += getQiScore(getFiveQi(monthStar, pMonth).qi);

    // =========================================================
    // ★ 第三步：全方位矩陣組合掃描器 (修正原本只比對流月的 BUG)
    // =========================================================
    
    // 1. 蒐集當前宮位所有「已啟動」的星，並貼上標籤
    const activeStarsList = [];
    if (activeLayers.includes(1)) activeStarsList.push({ name: '宅星', val: pZhai });
    if (activeLayers.includes(2)) activeStarsList.push({ name: '元運', val: pPeriod });
    if (activeLayers.includes(3)) activeStarsList.push({ name: '流年', val: pYear });
    if (activeLayers.includes(4)) activeStarsList.push({ name: '流月', val: pMonth });
    if (activeLayers.includes(5)) {
        if (pMingA) activeStarsList.push({ name: '命主(甲)', val: pMingA });
        if (pMingB) activeStarsList.push({ name: '家人(乙)', val: pMingB });
    }

    // 2. 進行兩兩交叉比對
    const triggeredCombos = new Set(); 

    for (let i = 0; i < activeStarsList.length; i++) {
        for (let j = i + 1; j < activeStarsList.length; j++) {
            const s1 = activeStarsList[i];
            const s2 = activeStarsList[j];

            COMBINATION_RULES.forEach(rule => {
                if (rule.stars.length === 2) {
                    const [v1, v2] = rule.stars;
                    const isMatch = (s1.val === v1 && s2.val === v2) || (s1.val === v2 && s2.val === v1);

                    if (isMatch) {
                        const eventKey = `${s1.name}-${s2.name}-${rule.name}`;
                        if (!triggeredCombos.has(eventKey)) {
                            triggeredCombos.add(eventKey);
                            
                            const isGood = rule.type === 'good';
                            const titleColor = isGood ? '#2e7d32' : '#e91700';
                            const bgColor = isGood ? '#f4fbf4' : '#fff5f5';
                            const borderCol = isGood ? '#2e7d32' : '#e91700';

                            triggerEvents.push(`
                                <div style="margin-bottom:8px; padding:8px; background:${bgColor}; border-left:4px solid ${borderCol}; border-radius:4px;">
                                    <b style="color:${titleColor}; font-size:13.5px;">[${isGood ? '吉' : '凶'}] ${rule.name}</b>
                                    <span style="font-size:12px; color:#666;"> (${s1.name}${s1.val} + ${s2.name}${s2.val})</span>
                                    <div style="font-size:12px; color:#444; margin-top:2px; line-height:1.4;">${rule.desc}</div>
                                    ${(isGood && rule.boost) ? `
                                        <div style="font-size:11.5px; color:#1b5e20; background:#e8f5e9; padding:5px; border-radius:4px; margin-top:5px; border-left:3px solid #2e7d32;">
                                            🚀 <b>趨吉佈局：</b>${rule.boost}
                                        </div>` : ''}
                                </div>
                            `);

                            // 分數結算邏輯
                            const ruleScore = isGood ? 15 : -20;
                            const isS1Person = s1.name.includes('('); // 判斷是否為甲或乙
                            const isS2Person = s2.name.includes('(');

                            if (!isS1Person && !isS2Person) {
                                sharedScore += ruleScore; // 純環境組合
                            } else {
                                if (s1.name === '命主(甲)' || s2.name === '命主(甲)') extraScoreA += ruleScore;
                                if (s1.name === '家人(乙)' || s2.name === '家人(乙)') extraScoreB += ruleScore;
                            }

                            // --- 修改後的繪製發光特效邏輯 ---
                            if (isGood && (!isS1Person || s1.name === '命主(甲)' || s2.name === '命主(甲)')) {
                                // ★ 檢查是否已經畫過發光特效，若沒畫過才執行
                                if (!hasDrawnGlowInThisGua) {
                                    drawLuckyGlow(bzLayer, gua, rule.name.includes('四一') ? '四一' : '財位');
                                    hasDrawnGlowInThisGua = true; // 標記為已繪製
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // =========================================================
    // ★ 進階受剋判定與通關化解 (空間環境比對)
    // =========================================================
    const starWuxingMap = { 1:'水', 2:'土', 3:'木', 4:'木', 5:'土', 6:'金', 7:'金', 8:'土', 9:'火' };
    const guaWuxingMap = { '坎':'水', '坤':'土', '震':'木', '巽':'木', '乾':'金', '兌':'金', '艮':'土', '離':'火' };
    const destroyMap = { '火':'金', '金':'木', '木':'土', '土':'水', '水':'火' };
    const bridgeMap = { '火_金':'土', '金_木':'水', '木_土':'火', '土_水':'金', '水_火':'木' };
    const drainMap = { '金':'水', '水':'木', '木':'火', '火':'土', '土':'金' };
    
    const REMEDY_MAP = {
        '土': '放置陶瓷擺件、黃色地墊或天然礦石，以土元素化解。複數數量以5、10為主。',
        '水': '放置水種植物、魚缸或黑色地墊，以水元素化解。複數數量以1、6為主。',
        '火': '開盞長明燈、紅色掛畫或紅色地墊，以火元素化解。複數數量以2、7為主。',
        '金': '放置金屬擺件、銅製飾品或白色地毯，以金元素化解。複數數量以4、9為主。',
        '木': '放置綠色植物或木質傢俱，以木元素化解。複數數量以3、8為主。'
    };

    const currentGuaWuxing = guaWuxingMap[gua];
    let presentWuxings = new Set();
    // 收集目前所有活躍星的五行
    activeStarsList.forEach(s => presentWuxings.add(starWuxingMap[s.val]));

    let injuryNote = "";
    let isHealed = false;
    let healerStar = null;
    let destroyCount = 0; 
    let drainCount = 0;   

    // 僅針對「環境星」進行受剋檢查
    const envStars = activeStarsList.filter(s => !s.name.includes('(')).map(s => s.val);
    envStars.forEach(s => {
        const sWuxing = starWuxingMap[s];
        if (destroyMap[sWuxing] === currentGuaWuxing) {
            destroyCount++;
            const needBridge = bridgeMap[`${sWuxing}_${currentGuaWuxing}`];
            if (presentWuxings.has(needBridge)) {
                isHealed = true;
                healerStar = Array.from(activeStarsList).find(star => starWuxingMap[star.val] === needBridge)?.val;
            } else {
                const remedyText = REMEDY_MAP[needBridge] || '請尋求專業老師指導。';
                injuryNote = `
                    <div style="background:#fff0f0; border-left:4px solid #b30000; padding:8px 10px; margin:5px 0; color:#b30000; font-size:12.5px;">
                        💥 <b>【受剋預警】</b>：<br>
                        ${STAR_NAMES_SHORT[s]}屬<b>${sWuxing}</b>，剋入本宮(<b>${currentGuaWuxing}</b>)，<br>
                        <b>${guaInfo.member}</b> 受傷！需嚴防：<b>${guaInfo.body}</b>。<br>
                        <div style="margin-top:6px; color:#444; font-size:12px; background:#fff; padding:6px; border-radius:4px; border:1px dashed #b30000; line-height:1.5;">
                            🛠️ <b>佈局建議：</b>${remedyText}
                        </div>
                    </div>
                `;
            }
        }
        if (drainMap[currentGuaWuxing] === sWuxing) drainCount++;
    });

    if (destroyCount > 0 && drainCount > 0 && !isHealed) {
        sharedScore -= 30; 
        const BOOST_REMEDY = {
            '金': '建議擇吉日吉時，大量補充金元素：放置 4 或 9 件銅製錢幣、白色地毯。',
            '木': '建議擇吉日吉時，大量補充木元素：放置 3 或 8 盆長青植物、綠色裝飾。',
            '水': '建議擇吉日吉時，大量補充水元素：放置 1 或 6 件動水擺件、黑色裝飾。',
            '火': '建議擇吉日吉時，大量補充火元素：點亮 2 或 7 盞暖色長明燈、紅色掛畫。',
            '土': '建議擇吉日吉時，大量補充土元素：放置陶藝或是石雕擺件、聚寶盆。'
        };
        triggerEvents.push(`
            <div style="background:#4a0000; border-left:5px solid #ff0000; padding:10px; margin:5px 0; color:#fff; font-size:13px; border-radius:4px; line-height:1.6;">
                🚨 <b>【特級預警：剋洩交加】</b><br>
                此方位能量耗損過度！請注意此方位內部能量(<b>${currentGuaWuxing}</b>)正遭受大量剋洩耗損。<br>
                這對 <b>${guaInfo.member}</b> 的影響較為明顯。<br>
                <div style="margin-top:8px; color:#ffeb3b; font-size:12.5px; background:rgba(255,255,255,0.1); padding:8px; border-radius:4px; border:1px dashed #ffeb3b;">
                    🛠️ <b>緊急佈局方案：</b><br>${BOOST_REMEDY[currentGuaWuxing] || ''}
                </div>
            </div>
        `);
    } else if (isHealed && !injuryNote) {
        sharedScore += 20; 
        triggerEvents.push(`
            <div style="background:#f0fff4; border-left:4px solid #2e7d32; padding:8px 10px; margin:5px 0; color:#2e7d32; font-size:12.5px;">
                🌿 <b>【通關化解】</b>：<br>
                本有剋戰凶象，幸得同宮轉化氣場，化凶為吉！
            </div>
        `);
    } else if (injuryNote) {
        sharedScore -= 20;
        triggerEvents.push(injuryNote);
    }

    // 最終個人分數加總
    let scoreA = sharedScore + extraScoreA;
    let scoreB = mingGuaB ? (sharedScore + extraScoreB) : null;
    let pA_HTML = '';
    let pB_HTML = '';

    const avatarA = (genderA === 'female') ? '👩' : '👨';
    const avatarB = (genderB === 'female') ? '👩' : '👨';

    if (mingGuaA) {
        const bzA = mingGuaA.stars[gua];
        let qiText = '';
        if (activeLayers.includes(5)) {
            const qA = getFiveQi(mingGuaA.number, pMingA).qi;
            scoreA += getQiScore(qA);
            qiText = ` / 命氣:${qA}`;
        }
        pA_HTML = `<div style="color:#d35400; font-size:13.5px; margin-bottom:5px;">${avatarA} <b>命主(甲)：</b>命盤八宅[${bzA}]${qiText} ➔ 總評: <b>${scoreA}</b>分</div>`;
    }

    if (mingGuaB) {
        const bzB = mingGuaB.stars[gua];
        let qiText = '';
        if (activeLayers.includes(5)) {
            const qB = getFiveQi(mingGuaB.number, pMingB).qi;
            scoreB += getQiScore(qB);
            qiText = ` / 命氣:${qB}`;
        }
        pB_HTML = `<div style="color:#2980b9; font-size:13.5px; margin-bottom:10px;">${avatarB} <b>家人(乙)：</b>命盤八宅[${bzB}]${qiText} ➔ 總評: <b>${scoreB}</b>分</div>`;
    }

    // =========================================================
// ★ 核心顏色引擎：根據分數對應新的五色標
// =========================================================
function getStateAndColor(sc) {
    // 🔴 大吉 (Score >= 40)
    if (sc >= 40) {
        return { state: '極其祥和', color: 'rgba(243, 29, 21, 0.55)' }; // #f31d15
    }
    // 🟠 吉 (Score >= 20)
    if (sc >= 20) {
        return { state: '氣場趨吉', color: 'rgba(249, 139, 83, 0.45)' }; // #f98b53
    }
    // 🔘 大凶 (Score <= -40)
    if (sc <= -40) {
        return { state: '能量受阻', color: 'rgba(153, 158, 148, 0.55)' }; // #999e94
    }
    // 🟢 凶 (Score <= -20)
    if (sc <= -20) {
        return { state: '氣場波動', color: 'rgba(165, 203, 123, 0.45)' }; // #a5cb7b
    }
    // 🟡 平 (氣場中和)
    return { state: '氣場中和', color: 'rgba(245, 192, 75, 0.4)' };     // #f5c04b
}

    const resA = getStateAndColor(scoreA);
    const resB = mingGuaB ? getStateAndColor(scoreB) : resA;

    let centerAngle = getSvgAngle(gua);
    drawAnnularSector(bzLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 110, 135, centerAngle - 22.5, centerAngle, resA.color);
    drawAnnularSector(bzLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 110, 135, centerAngle, centerAngle + 22.5, resB.color);

    // 星等繪製
    const avgScore = mingGuaB ? Math.round((scoreA + scoreB) / 2) : scoreA;
    const absScore = Math.abs(avgScore);
    const fullStars = Math.floor(absScore / 10);
    const hasHalfStar = (absScore % 10) >= 5;
    const starType = avgScore > 0 ? 'good' : 'bad';

    if (fullStars + (hasHalfStar ? 1 : 0) > 0) {
        const STAR_SPACING = 6;
        let starsToDraw = Array(fullStars).fill(false);
        if (hasHalfStar) starsToDraw.push(true);
        let currentAngle = centerAngle - ((starsToDraw.length - 1) * STAR_SPACING) / 2;
        starsToDraw.forEach(isHalf => {
            drawScoreStar(comboLayer, currentAngle, RADIAL_LAYOUT.combinationsRadius, starType, isHalf);
            currentAngle += STAR_SPACING;
        });
    }

    drawLabel(bzLayer, bzName, centerAngle, RADIAL_LAYOUT.starRadius, '#252525ff', 16);

    // 產出最後報告陣列
    const finalStateDisplay = mingGuaB ? `甲:${resA.state} / 乙:${resB.state}` : resA.state;
    const finalScoreDisplay = mingGuaB ? `甲:${scoreA} / 乙:${scoreB}` : scoreA;
    
    reports.push({ 
        gua: gua, 
        score: finalScoreDisplay, 
        rawScoreA: scoreA,
        state: finalStateDisplay, 
        bz: bzName, 
        events: triggerEvents, 
        member: guaInfo.member, 
        body: guaInfo.body,
        memberScores: pA_HTML + pB_HTML
    });
    });

    // 渲染外圈凶煞 (24山) 邏輯維持不變...
    const shasLayer = getLayer('twelve-shas-layer');
    if (shasLayer) shasLayer.innerHTML = '';
    const labels24 = Array(24).fill(null).map(() => ({ main: '', sub: '', color: '', subColor: '' }));
    const ybIdx = (termData.fsYear - 4) % 12;
    for (let i = 0; i < 12; i++) {
        const mIdx = i * 2;
        const shaIdx = (i - ybIdx + 12) % 12;
        const sName = TWELVE_SHAS_SEQUENCE[shaIdx];
        labels24[mIdx].main = sName; labels24[mIdx].color = (sName === '太歲') ? '#b42616ff' : '#6421c3ff';
    }
    const stemIdx = termData.fsYear % 10;
    const DU_TIAN_MAP = { 0: [4, 5, 6], 1: [20, 21, 22], 2: [16, 17, 18], 3: [12, 13, 14], 4: [8, 9, 10], 5: [4, 5, 6], 6: [20, 21, 22], 7: [16, 17, 18], 8: [12, 13, 14], 9: [8, 9, 10] };
    const dtIndices = DU_TIAN_MAP[stemIdx];
    for (let i = 0; i < 3; i++) {
        const idx = dtIndices[i]; const dn = ['戊己都天', '夾煞都天', '戊己都天'][i];
        if (labels24[idx].main) { labels24[idx].sub = dn; labels24[idx].subColor = '#b42616ff'; }
        else { labels24[idx].main = dn; labels24[idx].color = '#b42616ff'; }
    }
    let ssIdx = [];
    if ([6, 10, 2].includes(ybIdx)) ssIdx = [23, 0, 1];
    else if ([4, 8, 0].includes(ybIdx)) ssIdx = [11, 12, 13];
    else if ([3, 7, 11].includes(ybIdx)) ssIdx = [17, 18, 19];
    else if ([9, 1, 5].includes(ybIdx)) ssIdx = [5, 6, 7];
    ssIdx.forEach(idx => {
        if (!labels24[idx].main) { labels24[idx].main = "三煞"; labels24[idx].color = "#b42616ff"; }
        else if (!labels24[idx].sub) { labels24[idx].sub = "三煞"; labels24[idx].subColor = "#b42616ff"; }
        else labels24[idx].sub += "·三煞";
    });
    for (let i = 0; i < 24; i++) {
        if (labels24[i].color === '#b42616ff' || labels24[i].subColor === '#b42616ff') {
            drawAnnularSector(shasLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 240, 267, 90 + (i * 15) - 7.5, 90 + (i * 15) + 7.5, 'rgba(153, 158, 148, 0.55)');
        }
        if (labels24[i].main) {
            drawLabel(shasLayer, labels24[i].main, 90 + (i * 15), RADIAL_LAYOUT.twelveShasRadius, labels24[i].color, 12, !!labels24[i].sub, labels24[i].sub, labels24[i].subColor);
        }
    }

    // =================================================================
//  中心資訊更新 (純斷行與文字邏輯，不變更 CSS 樣式)
// =================================================================
const centerBg = document.getElementById('center-bg');

if (centerBg) {
    // 1. 第一行：年份與干支 (例如：2026 丙午年)
    let yearRow = document.getElementById('center-year-text');
    if (!yearRow) {
        yearRow = document.createElement('div');
        yearRow.id = 'center-year-text';
        // 確保放在最上面
        centerBg.prepend(yearRow);
    }
    yearRow.textContent = `${termData.fsYear} ${getGanzhiYear(termData.fsYear)}年`;

    // 2. 第二行：屋宅名稱 (例如：離宅)
    const houseRow = document.getElementById('center-main-text');
    if (houseRow) {
        houseRow.textContent = `${zhaiGua.name}宅`;
    }

    // 3. 第三行：命卦資訊 (例如：甲命：兑   乙命：離)
    let mingRow = document.getElementById('center-ming-text');
    if (!mingRow) {
        mingRow = document.createElement('div');
        mingRow.id = 'center-ming-text';
        // 插入在屋宅名稱之後，日期資訊之前
        centerBg.insertBefore(mingRow, document.getElementById('center-sub-text'));
    }
    if (mingGuaB) {
        mingRow.textContent = `甲命:${mingGuaA.name}   乙命:${mingGuaB.name}`;
    } else {
        mingRow.textContent = `甲命:${mingGuaA.name}`;
    }

    // 4. 第四行：節氣與月份 (例如：清明後-3月)
    const subRow = document.getElementById('center-sub-text');
    if (subRow) {
        subRow.textContent = `${termData.termName}後-${termData.fsMonth}月`;
    }
}

    const centerSubText = document.getElementById('center-sub-text');
    if (centerSubText) centerSubText.textContent = `${termData.termName}後-${termData.fsMonth}月`;

    // 找出當前宅卦的對宮
    const currentHouseName = zhaiGua.name;
    const guanGua = OPPOSITE_GUA[currentHouseName];

    // 更新宅紫白圖層，傳入 guanGua 參數
// --- ★ 修改：將「空間層(宅、命)」整合至半徑 200 的軌道 ---
    const spaceRingRadius = 200;

    // 1. 宅紫白 (置中：角度偏移 0)
    renderRichStars(zhaiGua.number, spaceRingRadius, 'zhai-zi-bai-layer', '宅', 0, guanGua);

    // 2. 命主甲 (偏左：角度偏移 -15)
    // 使用原本的 person-ming-layer 圖層來畫甲的星星
    if (mingGuaA) {
        renderRichStars(mingGuaA.number, spaceRingRadius, 'person-ming-layer', '甲', -15);
    }

    // 3. 家人乙 (偏右：角度偏移 +15)
    // 使用新的 person-ming-b-layer 圖層來畫乙的星星
    if (mingGuaB) {
        renderRichStars(mingGuaB.number, spaceRingRadius, 'person-ming-b-layer', '乙', 15);
    }
    
    // --- ★ 修改：將運、年、月整合至半徑 228 的同一圈 ---
    const timeRingRadius = 228;
    // 1. 元運紫白 (偏左：角度偏移 -15)
    renderStarsShort(periodStar, timeRingRadius, 'period-layer', '運', 11, -15, '運');
    // 2. 流年紫白 (置中：角度偏移 0，字體稍微放大一點點突顯主角)
    renderStarsShort(annualStar, timeRingRadius, 'annual-layer', '年', 12, 0, '年');
    // 3. 流月紫白 (偏右：角度偏移 15)
    renderStarsShort(monthStar, timeRingRadius, 'monthly-layer', `${termData.fsMonth}月`, 11, 15, '月');

    // ★ 報告輸出 HTML 模板 (含方位顯示與代表家人)
    const outPanel = document.getElementById('diagnostic-output');
    if (outPanel) {
        const GUA_ORDER = ['乾', '坎', '艮', '震', '巽', '離', '坤', '兌'];
        reports.sort((a, b) => GUA_ORDER.indexOf(a.gua) - GUA_ORDER.indexOf(b.gua));
        let html = '';
        reports.forEach(r => {
            let icon = ''; 
            let titleColor = '';
            // 方位對照表
            const GUA_DIRECTION = { '乾':'西北方', '坎':'正北方', '艮':'東北方', '震':'正東方', '巽':'東南方', '離':'正南方', '坤':'西南方', '兌':'正西方' };
            const direction = GUA_DIRECTION[r.gua] || '';

            // 基礎保養建議對照 (當沒有特定剋戰事件時，根據宮位五行提供保養方)
            const BASIC_MAINTENANCE = {
                '金': '建議保持通風明亮，可放置白色系裝飾或 4、9 件金屬擺件補強氣場。',
                '木': '建議維持環境整潔，可放置綠色植物或 3、8 件木質飾品增添生機。',
                '水': '建議避免潮濕陰暗，可放置黑色地墊或 1、6 件動水擺件活化能量。',
                '火': '建議增加採光，可點亮 2、7 盞暖色長明燈或放置紅色裝飾引動熱能。',
                '土': '建議維持環境穩定，可放置陶瓷器皿、天然礦石或 5、10 件黃色物件。'
            };

            // 根據中性狀態設定圖示與顏色
            if (r.state === '能量受阻') { icon = '🛡️'; titleColor = '#b30000'; } 
            else if (r.state === '氣場波動') { icon = '⚠️'; titleColor = '#e91700'; } 
            else if (r.state === '極其祥和') { icon = '🌟'; titleColor = '#b8860b'; } 
            else if (r.state === '氣場趨吉') { icon = '✨'; titleColor = '#dc5f00'; } 
            else { icon = '🍃'; titleColor = '#2a9d8f'; } // 氣場中和

            const memberStyle = (r.state !== '氣場中和') ? 'color:#d35400; font-weight:bold;' : 'color:#888;';
            const guaWuxingMap = { '坎':'水', '坤':'土', '震':'木', '巽':'木', '乾':'金', '兌':'金', '艮':'土', '離':'火' };
            const currentGuaWuxing = guaWuxingMap[r.gua];
            const maintenanceText = BASIC_MAINTENANCE[currentGuaWuxing] || '維持環境整潔。';

            // 根據氣場狀態給予中性描述與佈局引導
            let baseStatusText = "";
            if (r.state === '能量受阻' || r.state === '氣場波動') {
                baseStatusText = `
                    <div style="margin-top:4px; font-size:12px; color:#b30000;">
                        💡 此方能量較為波動，建議參考以下佈局進行優化：
                        <div style="margin-top:4px; color:#666; background:#fff; padding:6px; border-radius:4px; border:1px dashed #e91700; line-height:1.5;">
                            🛠️ <b>基礎保養：</b>${maintenanceText}
                        </div>
                    </div>`;
            } else if (r.state === '極其祥和' || r.state === '氣場趨吉') {
                baseStatusText = `<div style="margin-top:4px; font-size:12px; color:#2e7d32;">💡 此方氣場正向，適合停留或進行重點開運佈局。</div>`;
            } else {
                baseStatusText = `<div style="margin-top:4px; font-size:12px; color:#888;">💡 此方氣場平穩，維持整潔通風即可。</div>`;
            }

            // --- ★ 修正1：在這裡定義 bzDescription ---
            const bzDescription = `<div style="color:#666; font-size:12px; margin-bottom:4px; padding-bottom:4px; border-bottom:1px dashed #ccc;">八宅方位名稱：<span style="color:#d35400; font-weight:bold;">${r.bz}</span></div>`;

            // --- 專業解讀邏輯：整合八宅體質與飛星能量 ---
            let professionalInterpretation = "";
            // 判斷主體結論（以分數正負判斷）
            const mainScore = r.rawScoreA;
            const conclusion = mainScore > 0 ? `<span style="color:#2e7d32; font-weight:bold;">以吉論</span>` : 
                   mainScore < 0 ? `<span style="color:#b30000; font-weight:bold;">需注意</span>` : "氣場平穩";

            professionalInterpretation = `
            <div style="margin-top:8px; font-size:13px; color:#444; background:#fdf7f2; padding:10px; border-radius:8px; border:1px solid #ead6c5; line-height:1.6;">
            🎓 <b>專業鑑定：</b>雖然此方位在八宅法屬於「<b>${r.bz}</b>」，但經由目前勾選的紫白飛星能量結算後，最終得分為 <b>${r.score}</b> 分，因此該區目前的整體氣場${conclusion}。
            </div>
            `;

            // 如果有特定事件（格局、受剋、通關、特級預警），顯示事件內容；
            // 若無特定事件但氣場不穩，則顯示基礎保養建議。
            let eventContent = r.events.length > 0 ? `<div style="margin-top:6px;">${r.events.join('')}</div>` : baseStatusText;
            
            // --- ★ 修正2：使用 \${eventContent} 取代寫死的 \${r.events.join('')} ---
            html += `
        <div id="report-${r.gua}" style="border-bottom: 1px solid #eee; padding: 12px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:${titleColor}; font-size:15px;">${icon} ${r.gua}宮/${direction} (${r.state})</strong>
            <span style="font-size: 11px; color: #aaa; background:#f0f0f0; padding:2px 6px; border-radius:10px;">Score: ${r.score}</span>
        </div>
        
        <div style="font-size: 12.5px; margin-top:5px; margin-bottom:10px;">
            <span style="color:#666;">代表家人：</span><span style="${memberStyle}">${r.member}</span>
        </div>
        
        ${bzDescription}

        <div style="margin-top:8px;">
            ${r.memberScores}
        </div>

        ${professionalInterpretation}

        ${eventContent}
    </div>
    `;
        });
        

        // 1. 將診斷內容渲染到捲動區域
        outPanel.innerHTML = html;
    }

    // 2. 將「吉時表」按鈕單獨渲染到固定的頁腳區域 (不在捲動區內)
    const footerPanel = document.getElementById('diagnostic-footer');
    if (footerPanel) {
        footerPanel.innerHTML = `
            <div style="margin-top: 15px; padding: 15px; text-align: center; border-top: 2px dashed #eee;">
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;">
                    💡 診斷完成後，建議參考本月吉時進行佈局引動：
                </p>
                <button id="btn-view-lucky-time" style="
                    background: linear-gradient(135deg, #da7800, #ff9800);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    font-size: 15px;
                    font-weight: bold;
                    border-radius: 25px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(218, 120, 0, 0.3);
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    📅 查看該月吉時表
                </button>
            </div>
        `;

        // 3. 正式獲取該按鈕元素並綁定點擊事件 
        const luckyTimeBtn = document.getElementById('btn-view-lucky-time');
        if (luckyTimeBtn) {
            luckyTimeBtn.onclick = () => {
                // 取得目前的年份與月份
                const year = termData.fsYear;
                const month = termData.fsMonth;
                
                // 組合 URL 並開啟新分頁 
                const targetUrl = `https://nakaiwen.github.io/lucky_export/?year=${year}&month=${month}`;
                window.open(targetUrl, '_blank');
            };
        }
    }
    }

    // =================================================================
    //  SECTION 6: 羅盤感測與UI更新
    // =================================================================
    const elSittingName = document.getElementById('current-mountain');
    const elFacingName = document.getElementById('current-facing');
    const elSittingDeg = document.getElementById('sitting-degree');
    const elFacingDeg = document.getElementById('facing-degree');
    const degreeDisplay = document.getElementById('degree-display');
    const degreeSlider = document.getElementById('degree-slider');

    let targetHeading = 0;
    let isCompassMode = false;
    let animationFrameId = null;

    function getMountain(degree) {
        let deg = (degree % 360 + 360) % 360;
        const index = Math.floor((deg + 7.5) / 15) % 24;
        return TWENTY_FOUR_MOUNTAINS[index];
    }

    function renderRotation(degree) {
        if (svgPlate) {
            const finalDegree = -degree + 180;
            svgPlate.style.transform = `rotate(${finalDegree}deg)`;
        }
    }

    function updateUI(degree) {
        const deg = Math.round(degree);
        
        if (degreeSlider && document.activeElement !== degreeSlider) {
            degreeSlider.value = deg;
        }
        if (degreeDisplay) {
            degreeDisplay.textContent = deg;
        }

        const facingName = getMountain(deg);
        const sittingDegree = (deg + 180) % 360;
        const sittingName = getMountain(sittingDegree);

        if (elSittingName) elSittingName.textContent = sittingName;
        if (elFacingName) elFacingName.textContent = facingName;
        if (elSittingDeg) elSittingDeg.textContent = Math.round(sittingDegree);
        if (elFacingDeg) elFacingDeg.textContent = deg;
    }

    function animationLoop() {
        if (!isCompassMode) return;
        renderRotation(targetHeading);
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    function setCompassMode(active) {
        isCompassMode = active;
        if (active) {
            svgPlate.style.transition = 'none';
            if (!animationFrameId) animationLoop();
        } else {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            svgPlate.style.transition = 'transform 0.5s ease-out';
        }
    }

    function handleOrientation(event) {
        let compassHeading;
        if (event.webkitCompassHeading) {
            compassHeading = event.webkitCompassHeading;
        } else if (event.alpha) {
            compassHeading = 360 - event.alpha;
        }

        if (compassHeading !== undefined && compassHeading !== null) {
            targetHeading = compassHeading;
            updateUI(compassHeading); 
        }
    }

    function startCompass() {
        setCompassMode(true);
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    } else {
                        alert("羅盤感測權限被拒絕，請檢查 Safari 的設定。");
                        setCompassMode(false);
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }

    // =================================================================
    //  SECTION 7: 初始化與綁定事件
    // =================================================================
    function init() {
    // --- 1. 抓取 LocalStorage 暫存狀態 (擴充雙人版) ---
    const savedYearA = localStorage.getItem('fsSavedYearA');
    const savedYearB = localStorage.getItem('fsSavedYearB');
    const savedGenderA = localStorage.getItem('fsSavedGenderA');
    const savedGenderB = localStorage.getItem('fsSavedGenderB');
    const savedGua = localStorage.getItem('fsSavedGua');
    const savedDate = localStorage.getItem('fsSavedDate'); 
    const isLocked = localStorage.getItem('fsIsLocked') === 'true';

    // --- 2. 取得 DOM 元素 ---
    const inputYearA = document.getElementById('input-year-a');
    const inputYearB = document.getElementById('input-year-b');
    const btnMaleA = document.getElementById('btn-male-a');
    const btnFemaleA = document.getElementById('btn-female-a');
    const btnMaleB = document.getElementById('btn-male-b');
    const btnFemaleB = document.getElementById('btn-female-b');
    const selectHouse = document.getElementById('house-gua');
    const dateInput = document.getElementById('target-date');
    const qiToggleBtn = document.getElementById('btn-qi-toggle');
    const lockBtn = document.getElementById('lock-btn');
    const degreeSlider = document.getElementById('degree-slider');

    // --- 3. 五氣切換 ---
    if (qiToggleBtn) {
        qiToggleBtn.addEventListener('click', () => {
            if (typeof isQiMode !== 'undefined') isQiMode = !isQiMode;
            qiToggleBtn.classList.toggle('active', isQiMode);
            qiToggleBtn.textContent = isQiMode ? '👁️ 關閉五氣資訊' : '👁️ 開啟五氣資訊';
            updateAll(); 
        });
    }

    // --- 4. 基礎個人資訊初始化 (雙人) ---
    // 命主甲
    if (savedYearA && inputYearA) inputYearA.value = savedYearA;
    if (savedGenderA) {
        userSettings.genderA = savedGenderA;
        if (savedGenderA === 'male' && btnMaleA && btnFemaleA) {
            btnMaleA.classList.add('active'); btnFemaleA.classList.remove('active');
        } else if (savedGenderA === 'female' && btnMaleA && btnFemaleA) {
            btnFemaleA.classList.add('active'); btnMaleA.classList.remove('active');
        }
    }
    // 家人乙
    if (savedYearB && inputYearB) inputYearB.value = savedYearB;
    if (savedGenderB) {
        userSettings.genderB = savedGenderB;
        if (savedGenderB === 'male' && btnMaleB && btnFemaleB) {
            btnMaleB.classList.add('active'); btnFemaleB.classList.remove('active');
        } else if (savedGenderB === 'female' && btnMaleB && btnFemaleB) {
            btnFemaleB.classList.add('active'); btnMaleB.classList.remove('active');
        }
    }
    if (savedGua && selectHouse) selectHouse.value = savedGua;
    
    // --- ★ 5. 觀測日期初始化 ---
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        if (isLocked && savedDate) {
            dateInput.value = savedDate;
        } else {
            dateInput.value = formattedDate;
        }
        
        dateInput.addEventListener('change', updateAll);
    }

    // --- 6. 鎖定/解鎖功能 (雙人防護) ---
    function toggleLock(forceState = null) {
        const willLock = forceState !== null ? forceState : !(lockBtn.classList.contains('locked'));
        
        if (willLock) {
            if(inputYearA) inputYearA.disabled = true;
            if(inputYearB) inputYearB.disabled = true;
            if(selectHouse) selectHouse.disabled = true;
            if(btnMaleA) btnMaleA.disabled = true;
            if(btnFemaleA) btnFemaleA.disabled = true;
            if(btnMaleB) btnMaleB.disabled = true;
            if(btnFemaleB) btnFemaleB.disabled = true;
            if(dateInput) dateInput.disabled = true; 
            
            if(lockBtn) {
                lockBtn.classList.add('locked');
                lockBtn.textContent = '🔒 資訊已鎖定';
            }

            if(inputYearA) localStorage.setItem('fsSavedYearA', inputYearA.value);
            if(inputYearB) localStorage.setItem('fsSavedYearB', inputYearB.value);
            localStorage.setItem('fsSavedGenderA', userSettings.genderA);
            localStorage.setItem('fsSavedGenderB', userSettings.genderB);
            if(selectHouse) localStorage.setItem('fsSavedGua', selectHouse.value);
            if(dateInput) localStorage.setItem('fsSavedDate', dateInput.value); 
            localStorage.setItem('fsIsLocked', 'true');

        } else {
            if(inputYearA) inputYearA.disabled = false;
            if(inputYearB) inputYearB.disabled = false;
            if(selectHouse) selectHouse.disabled = false;
            if(btnMaleA) btnMaleA.disabled = false;
            if(btnFemaleA) btnFemaleA.disabled = false;
            if(btnMaleB) btnMaleB.disabled = false;
            if(btnFemaleB) btnFemaleB.disabled = false;
            if(dateInput) dateInput.disabled = false; 

            if(lockBtn) {
                lockBtn.classList.remove('locked');
                lockBtn.textContent = '🔓 資訊已解鎖';
            }
            localStorage.setItem('fsIsLocked', 'false');
        }
    }

    if (lockBtn) {
        lockBtn.addEventListener('click', () => toggleLock());
        if (isLocked) toggleLock(true);
    }

    // --- 7. 羅盤操作相關綁定 ---
    if (degreeSlider) {
        degreeSlider.addEventListener('input', (e) => {
            if (typeof isCompassMode !== 'undefined' && isCompassMode) {
                window.removeEventListener('deviceorientation', handleOrientation, true);
                window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
                if (typeof setCompassMode === 'function') setCompassMode(false); 
            }
            const deg = Number(e.target.value);
            if (typeof updateUI === 'function') updateUI(deg);
            if (typeof renderRotation === 'function') renderRotation(deg);
        });
    }

    const startCompassBtn = document.getElementById('start-compass-btn');
    if (startCompassBtn) startCompassBtn.addEventListener('click', () => {
        if (typeof startCompass === 'function') startCompass();
    });

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
            if (typeof setCompassMode === 'function') setCompassMode(false);
            if (typeof updateUI === 'function') updateUI(180);
            if (typeof renderRotation === 'function') renderRotation(180);
        });
    }

    // --- 8. 其他輸入變更綁定 (雙人事件監聽) ---
    // 命主甲
    if (inputYearA) inputYearA.addEventListener('input', updateAll);
    ['input-month-a','input-day-a','input-month-b','input-day-b'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateAll);
    });
    if (btnMaleA) {
        btnMaleA.addEventListener('click', () => { 
            userSettings.genderA = 'male'; 
            btnMaleA.classList.add('active'); 
            btnFemaleA.classList.remove('active'); 
            updateAll(); 
        });
    }
    if (btnFemaleA) {
        btnFemaleA.addEventListener('click', () => { 
            userSettings.genderA = 'female'; 
            btnFemaleA.classList.add('active'); 
            btnMaleA.classList.remove('active'); 
            updateAll(); 
        });
    }

    // 家人乙
    if (inputYearB) inputYearB.addEventListener('input', updateAll);
    if (btnMaleB) {
        btnMaleB.addEventListener('click', () => { 
            userSettings.genderB = 'male'; 
            btnMaleB.classList.add('active'); 
            btnFemaleB.classList.remove('active'); 
            updateAll(); 
        });
    }
    if (btnFemaleB) {
        btnFemaleB.addEventListener('click', () => { 
            userSettings.genderB = 'female'; 
            btnFemaleB.classList.add('active'); 
            btnMaleB.classList.remove('active'); 
            updateAll(); 
        });
    }
    
    if (selectHouse) selectHouse.addEventListener('change', updateAll);
    
    window.setDegree = function(deg) {
        window.removeEventListener('deviceorientation', handleOrientation);
        if (typeof setCompassMode === 'function') setCompassMode(false);
        if (typeof updateUI === 'function') updateUI(deg); 
        if (typeof renderRotation === 'function') renderRotation(deg);
    }

    // --- 9. 最終執行繪製 ---
    updateAll();
    if (typeof updateUI === 'function') updateUI(180);
    if (typeof renderRotation === 'function') renderRotation(180);
}
    
    init();
});