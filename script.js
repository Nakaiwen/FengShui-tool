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

    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    // ★ 專屬五行直覺配色
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
    const LUO_SHU_PATH = ['乾', '兌', '艮', '離', '坎', '坤', '震', '巽'];

    const TWELVE_SHAS_SEQUENCE = ['太歲', '太陽', '喪門', '太陰', '官符', '死符', '歲破', '龍德', '白虎', '福德', '吊客', '病符'];

    // ★ 預測庫：加入具體描述
    const COMBINATION_RULES = [
        { type: 'good', stars: [4, 1], name: '四一同宮', desc: '利文昌、考試、升遷與桃花。' },
        { type: 'good', stars: [6, 8], name: '六八同宮', desc: '大利武職、偏財、事業爆發。' },
        { type: 'good', stars: [8, 9], name: '八九同宮', desc: '大吉慶、婚喜、財運亨通。' },
        { type: 'bad',  stars: [7, 9], name: '九七穿途', desc: '易引發火災、心血管疾病或官非。' },
        { type: 'bad',  stars: [2, 5], name: '二五交加', desc: '極凶！高機率引發重病、血光意外。' },
        { type: 'bad',  stars: [3, 7], name: '三七疊臨', desc: '易遭竊盜、金屬所傷或劫財破財。' }
    ];

    const GUA_DATA = {
        1: { name: '坎', number: 1, stars: { '坎':'伏位', '巽':'生氣', '震':'天醫', '離':'延年', '乾':'六煞', '兌':'禍害', '艮':'五鬼', '坤':'絕命' } },
        2: { name: '坤', number: 2, stars: { '坤':'伏位', '艮':'生氣', '兌':'天醫', '乾':'延年', '離':'六煞', '震':'禍害', '巽':'五鬼', '坎':'絕命' } },
        3: { name: '震', number: 3, stars: { '震':'伏位', '離':'生氣', '坎':'天醫', '巽':'延年', '艮':'六煞', '坤':'禍害', '乾':'五鬼', '兌':'絕命' } },
        4: { name: '巽', number: 4, stars: { '巽':'伏位', '坎':'生氣', '離':'天醫', '震':'延年', '兌':'六煞', '乾':'禍害', '坤':'五鬼', '艮':'絕命' } },
        6: { name: '乾', number: 6, stars: { '乾':'伏位', '兌':'生氣', '艮':'天醫', '坤':'延年', '坎':'六煞', '巽':'禍害', '震':'五鬼', '離':'絕命' } },
        7: { name: '兌', number: 7, stars: { '兌':'伏位', '乾':'生氣', '坤':'天醫', '艮':'延年', '巽':'六煞', '坎':'禍害', '離':'五鬼', '震':'絕命' } },
        8: { name: '艮', number: 8, stars: { '艮':'伏位', '坤':'生氣', '乾':'天醫', '兌':'延年', '震':'六煞', '離':'禍害', '坎':'五鬼', '巽':'絕命' } },
        9: { name: '離', number: 9, stars: { '離':'伏位', '震':'生氣', '巽':'天醫', '坎':'延年', '坤':'六煞', '艮':'禍害', '兌':'五鬼', '乾':'絕命' } }
    };

    let userSettings = {
        gender: 'male',
        houseGua: '坎' 
    };

    let isQiMode = false; // ★ 五氣視角模式開關

    // =================================================================
    //  SECTION 2: 節氣、流年、飛星邏輯與推算引擎
    // =================================================================
    function getSolarTermMonth(targetDate = new Date()) {
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth() + 1;
        const d = targetDate.getDate();
        const md = m * 100 + d;
        
        const terms = [
            { name: '小寒', md: 105, month: 12, yearOffset: -1 },
            { name: '立春', md: 204, month: 1,  yearOffset: 0 },
            { name: '驚蟄', md: 305, month: 2,  yearOffset: 0 },
            { name: '清明', md: 405, month: 3,  yearOffset: 0 },
            { name: '立夏', md: 505, month: 4,  yearOffset: 0 },
            { name: '芒種', md: 605, month: 5,  yearOffset: 0 },
            { name: '小暑', md: 707, month: 6,  yearOffset: 0 },
            { name: '立秋', md: 807, month: 7,  yearOffset: 0 },
            { name: '白露', md: 907, month: 8,  yearOffset: 0 },
            { name: '寒露', md: 1008, month: 9,  yearOffset: 0 },
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

    function calculatePeriodStar(fsYear) {
        let period = ((Math.floor((fsYear - 1864) / 20) + 1) % 9);
        return period === 0 ? 9 : period; 
    }

    function getGanzhiYear(fsYear) {
        const stems = ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'];
        const branches = ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'];
        return stems[fsYear % 10] + branches[fsYear % 12];
    }

    function getStarInGua(centerNum, targetGua) {
        const index = LUO_SHU_PATH.indexOf(targetGua);
        let num = (centerNum + index + 1) % 9;
        return num === 0 ? 9 : num;
    }

    function getWuXing(starNum) {
        const elements = { 1:'Water', 2:'Earth', 3:'Wood', 4:'Wood', 5:'Earth', 6:'Metal', 7:'Metal', 8:'Earth', 9:'Fire' };
        return elements[starNum];
    }

    function getFiveQi(centerStar, palaceStar) {
        const cElem = getWuXing(centerStar); // 中宮(主)
        const pElem = getWuXing(palaceStar); // 宮位(客)

        if (cElem === pElem) return { qi: '旺', color: '#e91700ff' }; // 紅色

        const generate = { 'Wood':'Fire', 'Fire':'Earth', 'Earth':'Metal', 'Metal':'Water', 'Water':'Wood' };
        const destroy = { 'Wood':'Earth', 'Earth':'Water', 'Water':'Fire', 'Fire':'Metal', 'Metal':'Wood' };

        if (generate[pElem] === cElem) return { qi: '生', color: '#e91700ff' }; // 客生主 -> 生 (紅)
        if (generate[cElem] === pElem) return { qi: '退', color: '#004ad2ff' }; // 主生客 -> 退 (藍)
        if (destroy[pElem] === cElem) return { qi: '殺', color: '#000000' };   // 客剋主 -> 殺 (黑)
        if (destroy[cElem] === pElem) return { qi: '死', color: '#000000' };   // 主剋客 -> 死 (黑)
        return { qi: '', color: '' };
    }

    // =================================================================
    //  SECTION 3: 動態預測大腦 (積分量化系統)
    // =================================================================
    
    // 將五氣轉為指定分數
    function getQiScore(qiString) {
        switch(qiString) {
            case '生': return 20; 
            case '旺': return 15; 
            case '退': return -10; 
            case '死': return -15; 
            case '殺': return -20; 
            default: return 0;
        }
    }
    
    // 將八宅轉為指定分數
    function getBzScore(bzString) {
        switch(bzString) {
            case '生氣': 
            case '延年': 
                return 20;
            case '伏位': 
            case '天醫': 
                return 10;
            case '五鬼': 
            case '六煞': 
                return -10;
            case '禍害': 
            case '絕命': 
                return -20;
            default: return 0;
        }
    }

    // 建立動態面板 UI
    function setupDiagnosticPanel() {
        let panel = document.getElementById('ai-diagnostic-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'ai-diagnostic-panel';
            // ★ 加上 control-panel 類別來繼承主面板的圓角、陰影、背景色
            panel.className = 'control-panel'; 
            // ★ 核心修正：將 width 設為 100%，保證與上方完全對齊
            panel.style.cssText = 'margin-top: 15px; text-align: left; width: 100%; box-sizing: border-box; z-index: 100; position: relative;';
            
            panel.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #da7800; display: flex; align-items: center; justify-content: center;">
                    🔮 動態吉凶大腦預測
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
                <div id="diagnostic-output" style="font-size: 14px; max-height: 350px; overflow-y: auto; padding-right: 5px;"></div>
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

    function renderPersonMingStars(centerNum, radius, layerId) {
        const layer = getLayer(layerId);
        layer.innerHTML = '';
        LUO_SHU_PATH.forEach((gua, index) => {
            let num = (centerNum + index + 1) % 9;
            if (num === 0) num = 9;

            if (isQiMode) {
                const qiData = getFiveQi(centerNum, num);
                drawLabel(layer, `命${qiData.qi}`, getSvgAngle(gua), radius, qiData.color, 15);
            } else {
                const info = FLYING_STARS_INFO[num];
                // ★ 這裡改為「命-短星名」加上原本的「意義」
                drawLabel(layer, `命-${STAR_NAMES_SHORT[num]}`, getSvgAngle(gua), radius, info.color, 15, true, info.meaning);
            }
        });
    }

    function renderStarsShort(centerNum, radius, layerId, prefix, fontSize = 14, angleOffset = 0, qiPrefix = '') {
        const layer = getLayer(layerId);
        layer.innerHTML = '';
        LUO_SHU_PATH.forEach((gua, index) => {
            let num = (centerNum + index + 1) % 9;
            if (num === 0) num = 9;

            let text, textColor;
            if (isQiMode) {
                const qiData = getFiveQi(centerNum, num);
                text = `${qiPrefix}${qiData.qi}`; 
                textColor = qiData.color;
            } else {
                text = `${prefix}-${STAR_NAMES_SHORT[num]}`;
                textColor = FLYING_STARS_INFO[num].color;
            }
            drawLabel(layer, text, getSvgAngle(gua) + angleOffset, radius, textColor, fontSize);
        });
    }

    // =================================================================
    //  SECTION 5: 結算邏輯與更新文字圖層
    // =================================================================
    const inputYear = document.getElementById('birth-year');
    const selectHouse = document.getElementById('house-gua');
    const dateInput = document.getElementById('target-date'); 

    function updateAll() {
        if (!inputYear) return;
        const birthYear = parseInt(inputYear.value);
        if (isNaN(birthYear)) return;

        let sum = birthYear.toString().split('').map(Number).reduce((a,b)=>a+b, 0);
        while(sum > 9) sum = sum.toString().split('').map(Number).reduce((a,b)=>a+b,0);
        
        let kua;
        if(userSettings.gender === 'male') { 
            kua = 11 - sum; 
            while(kua > 9) kua -= 9; 
            if(kua === 5) kua = 2; 
        } else { 
            kua = 4 + sum; 
            while(kua > 9) kua -= 9; 
            if(kua === 5) kua = 8; 
        }
        const mingGua = GUA_DATA[kua];

        const houseGuaName = selectHouse ? selectHouse.value : '坎';
        const zhaiGua = Object.values(GUA_DATA).find(g => g.name === houseGuaName) || GUA_DATA[1];

        // 讀取使用者選擇的日期
        let selectedDate = new Date();
        if (dateInput && dateInput.value) {
            const parts = dateInput.value.split('-');
            if (parts.length === 3) {
                selectedDate = new Date(parts[0], parts[1] - 1, parts[2]); 
            }
        }

        // 取得流年流月資料
        const termData = getSolarTermMonth(selectedDate);
        const annualStar = (11 - (termData.fsYear % 9)) % 9 || 9;
        const monthStar = calculateMonthStar(termData.fsYear, termData.fsMonth);
        const periodStar = calculatePeriodStar(termData.fsYear); 

        // 確保 UI 面板存在
        setupDiagnosticPanel();

        // 取得使用者勾選的疊加層級 (1~5)
        let activeLayers = [];
        document.querySelectorAll('.layer-chk').forEach(chk => {
            if (chk.checked) activeLayers.push(parseInt(chk.value));
        });

        let reports = []; // 存放最終生成的報告
        const bzLayer = getLayer('bz-layer'); 
        bzLayer.innerHTML = '';
        const comboLayer = getLayer('combinations-layer');
        comboLayer.innerHTML = ''; 

        // ★ 核心掃描：迴圈跑 8 宮位，執行大腦計分
        LUO_SHU_PATH.forEach(gua => {
            const bzName = zhaiGua.stars[gua];
            const pZhai = getStarInGua(zhaiGua.number, gua);
            const pPeriod = getStarInGua(periodStar, gua);
            const pYear = getStarInGua(annualStar, gua);
            const pMonth = getStarInGua(monthStar, gua);
            const pMing = getStarInGua(mingGua.number, gua);

            let totalScore = 0;
            let activeStarsInPalace = []; // 只收集有打勾的星星
            let triggerEvents = [];

            // 第一步：八宅方賦予權重分數
            totalScore += getBzScore(bzName);

            // 第二步：依勾選層級加入五氣分數
            if (activeLayers.includes(1)) { 
                totalScore += getQiScore(getFiveQi(zhaiGua.number, pZhai).qi); 
                activeStarsInPalace.push(pZhai); 
            }
            if (activeLayers.includes(2)) { 
                totalScore += getQiScore(getFiveQi(periodStar, pPeriod).qi); 
                activeStarsInPalace.push(pPeriod); 
            }
            if (activeLayers.includes(3)) { 
                totalScore += getQiScore(getFiveQi(annualStar, pYear).qi); 
                activeStarsInPalace.push(pYear); 
            }
            if (activeLayers.includes(4)) { 
                totalScore += getQiScore(getFiveQi(monthStar, pMonth).qi); 
                activeStarsInPalace.push(pMonth); 
            }
            if (activeLayers.includes(5)) { 
                totalScore += getQiScore(getFiveQi(mingGua.number, pMing).qi); 
                activeStarsInPalace.push(pMing); 
            }

            // 第三步：化學反應與格局預測 (★ 強化版：加入流月引動判斷)
            let goodHits = 0; 
            let badHits = 0;
            
            // A. 基礎格局判斷
            COMBINATION_RULES.forEach(rule => {
                if (rule.stars.length === 2) {
                    const [s1, s2] = rule.stars; 
                    const count1 = activeStarsInPalace.filter(s => s === s1).length; 
                    const count2 = activeStarsInPalace.filter(s => s === s2).length;
                    let hits = (s1 !== s2) ? count1 * count2 : (count1 * (count1 - 1)) / 2;
                    
                    if (hits > 0) { 
                        if (rule.type === 'good') { 
                            goodHits += hits; 
                            totalScore += 15; 
                            triggerEvents.push(`<span style="color:#2e7d32;">[吉] ${rule.name} - ${rule.desc}</span>`); 
                        } 
                        if (rule.type === 'bad') { 
                            badHits += hits; 
                            totalScore -= 20; 
                            triggerEvents.push(`<span style="color:#e91700;">[凶] ${rule.name} - ${rule.desc}</span>`); 
                        } 
                    }
                }
            });

            // B. ★ 核心預測升級：流月「引動」流年凶氣之判斷
            // 邏輯：如果該宮位流年是「殺/死」，且本月飛入 2(病符), 5(五黃), 3(是非) 等凶星
            const annualQi = getFiveQi(annualStar, pYear).qi;
            const isAnnualDangerous = ['殺', '死'].includes(annualQi);
            const isMonthlyTrigger = [2, 5, 3].includes(pMonth);

            if (isAnnualDangerous && isMonthlyTrigger && activeLayers.includes(4)) {
                totalScore -= 25; // 強烈引動額外扣分
                let triggerStarName = STAR_NAMES_SHORT[pMonth];
                triggerEvents.push(`
                    <div style="background:#fff0f0; border-left:4px solid #b30000; padding:4px 8px; margin:4px 0; color:#b30000; font-weight:bold;">
                        ⚠️ 本月引動流年【${annualQi}氣】！<br>
                        ${triggerStarName}凶星入庫，事件爆發機率極高，請務必避開此區！
                    </div>
                `);
            }

            // ★ 第四步：依據最終總分數畫出「星等評分 (Star Rating)」
            const absScore = Math.abs(totalScore);
            const fullStars = Math.floor(absScore / 10);
            const hasHalfStar = (absScore % 10) >= 5; // 尾數 >= 5 給半顆星
            const totalVisualStars = fullStars + (hasHalfStar ? 1 : 0);
            const starType = totalScore > 0 ? 'good' : 'bad'; // 正分紅星，負分黑星

            if (totalVisualStars > 0) {
                const centerAngle = getSvgAngle(gua); 
                
                // ==========================================
                // ★ 星星排版微調區
                // ==========================================
                const STAR_SPACING = 6;  // 1. 微調星星的左右間距 (數字越大越開)
                const MAX_PER_ROW = 6;   // 2. 一排最多顯示幾顆星 (超過自動換行)
                const ROW_GAP = 8;       // 3. 第二排星星往內縮的半徑距離 (換排高度差)
                // ==========================================

                // 準備要把哪些星星畫出來的陣列 (false=全星, true=半星)
                let starsToDraw = Array(fullStars).fill(false);
                if (hasHalfStar) starsToDraw.push(true);

                // 計算總共有幾排
                const totalRows = Math.ceil(starsToDraw.length / MAX_PER_ROW);

                // ★ 新增：判斷排數來決定起始半徑 (單排 100，雙排以上從 104 開始往下長)
                const baseRadius = totalRows > 1 ? 104 : RADIAL_LAYOUT.combinationsRadius;

                for (let row = 0; row < totalRows; row++) {
                    // 取出這排要畫的星星
                    let rowStars = starsToDraw.slice(row * MAX_PER_ROW, (row + 1) * MAX_PER_ROW);
                    
                    // 計算這排的半徑 (以 baseRadius 為基準往內縮)
                    let currentRadius = baseRadius - (row * ROW_GAP);
                    
                    // 計算這排第一顆星的起始角度 (確保完美置中)
                    let currentAngle = centerAngle - ((rowStars.length - 1) * STAR_SPACING) / 2;

                    // 依序畫出這排的星星
                    rowStars.forEach(isHalf => {
                        drawScoreStar(comboLayer, currentAngle, currentRadius, starType, isHalf);
                        currentAngle += STAR_SPACING;
                    });
                }
            }

            // 第五步：判定最終吉凶狀態 (五段等級) 與背景色
            let finalState = ''; 
            let bgColor = '';
            
            if (totalScore >= 40) { 
                finalState = '極吉'; 
                bgColor = 'rgba(255, 236, 27, 0.55)'; // 璀璨金黃
            } 
            else if (totalScore >= 20) { 
                finalState = '大吉'; 
                bgColor = 'rgba(255, 184, 62, 0.45)'; // 鵝黃色
            } 
            else if (totalScore <= -40) { 
                finalState = '極凶'; 
                bgColor = 'rgba(255, 89, 89, 0.55)'; // 深紅色
            } 
            else if (totalScore <= -20) { 
                finalState = '大凶'; 
                bgColor = 'rgba(255, 131, 97, 0.45)'; // 珊瑚紅
            } 
            else { 
                finalState = '平穩'; 
                bgColor = 'rgba(135, 206, 235, 0.4)'; // 天藍色
            }

            // 繪製八宅底色與文字
            let centerAngle = getSvgAngle(gua);
            drawAnnularSector(bzLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 110, 135, centerAngle - 22.5, centerAngle + 22.5, bgColor);

            const c = ['生氣','延年','天醫','伏位'].includes(bzName) ? '#252525ff' : '#252525ff';
            let textAngle = centerAngle; 
            if (['生氣', '延年'].includes(bzName)) textAngle -= 6; 
            drawLabel(bzLayer, bzName, textAngle, RADIAL_LAYOUT.starRadius, c, 16); 

            if (['生氣', '延年'].includes(bzName)) {
                const sealAngle = centerAngle + 12; 
                const sx = RADIAL_LAYOUT.center.x + RADIAL_LAYOUT.starRadius * Math.cos(sealAngle * Math.PI / 180); 
                const sy = RADIAL_LAYOUT.center.y + RADIAL_LAYOUT.starRadius * Math.sin(sealAngle * Math.PI / 180);
                const sealGroup = document.createElementNS(SVG_NS, 'g'); 
                const circle = document.createElementNS(SVG_NS, 'circle'); 
                circle.setAttribute('r', RADIAL_LAYOUT.sealSize); 
                circle.setAttribute('fill', 'none'); 
                circle.setAttribute('stroke', '#c0392b'); 
                circle.setAttribute('stroke-width', '1.5'); 
                const sealText = document.createElementNS(SVG_NS, 'text'); 
                sealText.setAttribute('text-anchor', 'middle'); 
                sealText.setAttribute('dominant-baseline', 'central'); 
                sealText.setAttribute('font-size', '13'); 
                sealText.setAttribute('fill', '#c0392b'); 
                sealText.setAttribute('font-family', 'serif'); 
                sealText.textContent = '吉'; 
                sealGroup.appendChild(circle); 
                sealGroup.appendChild(sealText); 
                sealGroup.setAttribute('transform', `translate(${sx}, ${sy}) rotate(${sealAngle + 90})`); 
                bzLayer.appendChild(sealGroup);
            }

            // 將結果存入報告庫 (一律收錄八宮位，實現完整預測報告)
            reports.push({ gua: gua, score: totalScore, state: finalState, bz: bzName, events: triggerEvents });
        });

        // 渲染大凶煞 (珊瑚紅警戒區)
        const shasLayer = getLayer('twelve-shas-layer'); 
        if(shasLayer) shasLayer.innerHTML = '';
        
        const labels24 = Array(24).fill(null).map(() => ({ main: '', sub: '', color: '', subColor: '' }));
        const ybIdx = (termData.fsYear - 4) % 12; 
        
        for (let i = 0; i < 12; i++) { 
            const mIdx = i * 2; 
            const shaIdx = (i - ybIdx + 12) % 12; 
            const sName = TWELVE_SHAS_SEQUENCE[shaIdx]; 
            labels24[mIdx].main = sName; 
            labels24[mIdx].color = (sName === '太歲') ? '#e91700ff' : '#6421c3ff'; 
        }
        
        const stemIdx = termData.fsYear % 10; 
        const DU_TIAN_MAP = { 0: [4,5,6], 1: [20,21,22], 2: [16,17,18], 3: [12,13,14], 4: [8,9,10], 5: [4,5,6], 6: [20,21,22], 7: [16,17,18], 8: [12,13,14], 9: [8,9,10] }; 
        const dtIndices = DU_TIAN_MAP[stemIdx]; 
        const dtNames = ['戊己都天', '夾煞都天', '戊己都天'];
        
        for (let i = 0; i < 3; i++) { 
            const idx = dtIndices[i]; 
            const dn = dtNames[i]; 
            const dc = '#e91700ff'; 
            if (labels24[idx].main) { 
                labels24[idx].sub = dn; 
                labels24[idx].subColor = dc; 
            } else { 
                labels24[idx].main = dn; 
                labels24[idx].color = dc; 
            } 
        }
        
        let ssIndices = []; 
        if ([6,10,2].includes(ybIdx)) { ssIndices = [23,0,1]; } 
        else if ([4,8,0].includes(ybIdx)) { ssIndices = [11,12,13]; } 
        else if ([3,7,11].includes(ybIdx)) { ssIndices = [17,18,19]; } 
        else if ([9,1,5].includes(ybIdx)) { ssIndices = [5,6,7]; }
        
        ssIndices.forEach(idx => { 
            const ssn = "三煞"; 
            const ssc = "#e91700ff"; 
            if (!labels24[idx].main) { 
                labels24[idx].main = ssn; 
                labels24[idx].color = ssc; 
            } else if (!labels24[idx].sub) { 
                labels24[idx].sub = ssn; 
                labels24[idx].subColor = ssc; 
            } else { 
                labels24[idx].sub += "·三煞"; 
            } 
        });

        // 畫出外圍凶煞底色
        for (let i = 0; i < 24; i++) { 
            const data = labels24[i]; 
            if (data.color === '#e91700ff' || data.subColor === '#e91700ff') { 
                const cAng = 90 + (i * 15); 
                drawAnnularSector(shasLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 240, 267, cAng - 7.5, cAng + 7.5, 'rgba(252, 133, 115, 0.5)'); 
            } 
        }

        // 畫出外圍凶煞文字
        for (let i = 0; i < 24; i++) { 
            const data = labels24[i]; 
            if (data.main) { 
                const ang = 90 + (i * 15); 
                if (data.sub) { 
                    drawLabel(shasLayer, data.main, ang, RADIAL_LAYOUT.twelveShasRadius, data.color, 12, true, data.sub, data.subColor); 
                } else { 
                    drawLabel(shasLayer, data.main, ang, RADIAL_LAYOUT.twelveShasRadius, data.color, 12); 
                } 
            } 
        }

        // 渲染中心圓盤資訊
        const centerMainText = document.getElementById('center-main-text');
        if (centerMainText) {
            centerMainText.textContent = `${zhaiGua.name}宅 ${mingGua.name}命`;
            const centerBg = document.getElementById('center-bg');
            if (centerBg) { 
                let yearTextEl = document.getElementById('center-year-text'); 
                if (!yearTextEl) { 
                    yearTextEl = document.createElement('div'); 
                    yearTextEl.id = 'center-year-text'; 
                    yearTextEl.style.fontSize = '1.8vmin'; 
                    yearTextEl.style.fontWeight = 'bold'; 
                    yearTextEl.style.color = '#555555ff'; 
                    yearTextEl.style.marginBottom = '0.2vmin'; 
                    yearTextEl.style.fontFamily = '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif'; 
                    yearTextEl.style.whiteSpace = 'nowrap'; 
                    centerBg.insertBefore(yearTextEl, centerMainText); 
                    centerBg.style.width = '14.5vmin'; 
                    centerBg.style.height = '14.5vmin'; 
                } 
                yearTextEl.textContent = `${termData.fsYear} ${getGanzhiYear(termData.fsYear)}年`; 
            }
        }
        
        const centerSubText = document.getElementById('center-sub-text'); 
        if (centerSubText) { centerSubText.textContent = `${termData.termName}後-${termData.fsMonth}月`; }

        // 渲染各層飛星
        renderStarsShort(zhaiGua.number, RADIAL_LAYOUT.personMingRadius, 'zhai-zi-bai-layer', '宅', 11, -15, '宅');
        renderPersonMingStars(mingGua.number, RADIAL_LAYOUT.personMingRadius, 'person-ming-layer');
        renderStarsShort(monthStar, RADIAL_LAYOUT.monthlyRadius, 'monthly-layer', `${termData.fsMonth}月`, 11, 15, '月');
        renderStarsShort(periodStar, RADIAL_LAYOUT.annualRadius, 'period-layer', '元運', 12, -10, '運');
        renderStarsShort(annualStar, RADIAL_LAYOUT.annualRadius, 'annual-layer', '流年', 12, 10, '年');

        
        const outPanel = document.getElementById('diagnostic-output');
        if (outPanel) {
            if (reports.length === 0) {
                outPanel.innerHTML = '<div style="color:#666; padding: 10px 0; text-align:center;">✅ 勾選層級內氣場平穩，無極端大吉凶。</div>';
            } else {
                // ★ 修改：依照您指定的順序固定排序 (乾位起始)
                const GUA_ORDER = ['乾', '坎', '艮', '震', '巽', '離', '坤', '兌'];
                reports.sort((a, b) => GUA_ORDER.indexOf(a.gua) - GUA_ORDER.indexOf(b.gua));

                let html = '';
                reports.forEach(r => {
                    let icon = '';
                    let titleColor = '';
                    
                    // 根據五段等級給予專屬圖示與文字顏色
                    if (r.state === '極凶') { icon = '💥'; titleColor = '#b30000'; }
                    else if (r.state === '大凶') { icon = '🚨'; titleColor = '#e91700'; }
                    else if (r.state === '極吉') { icon = '👑'; titleColor = '#b8860b'; }
                    else if (r.state === '大吉') { icon = '✨'; titleColor = '#dc5f00'; }
                    else { icon = '✅'; titleColor = '#2a9d8f'; } // 平穩用清爽的青綠色

                    // 準備事件文字 (如果沒有觸發事件，則顯示平穩描述)
                    let eventContent = r.events.length > 0 
                        ? `<div style="margin-top:6px; background:#fff; padding:6px; border-radius:5px; border:1px solid #eee;">${r.events.join('')}</div>` 
                        : `<div style="margin-top:4px; font-size:12px; color:#888;">氣場平穩，無重大碰撞。</div>`;
                    
                    html += `
                        <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <strong style="color:${titleColor}; font-size:15px;">${icon} ${r.gua}宮 (${r.state})</strong>
                                <span style="font-size: 11px; color: #aaa; background:#f0f0f0; padding:2px 6px; border-radius:10px;">Score: ${r.score}</span>
                            </div>
                            <div style="font-size: 13px; color: #444; margin-top:4px;">先天方位：<span style="font-weight:bold;">${r.bz}</span></div>
                            ${eventContent}
                        </div>
                    `;
                });
                outPanel.innerHTML = html;
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
        const savedYear = localStorage.getItem('fsSavedYear');
        const savedGender = localStorage.getItem('fsSavedGender');
        const savedGua = localStorage.getItem('fsSavedGua');
        const savedDate = localStorage.getItem('fsSavedDate'); 
        const isLocked = localStorage.getItem('fsIsLocked') === 'true';

        const btnMale = document.getElementById('btn-male');
        const btnFemale = document.getElementById('btn-female');
        const lockBtn = document.getElementById('lock-btn');
        const qiToggleBtn = document.getElementById('btn-qi-toggle');

        if (qiToggleBtn) {
            qiToggleBtn.addEventListener('click', () => {
                isQiMode = !isQiMode;
                qiToggleBtn.classList.toggle('active', isQiMode);
                qiToggleBtn.textContent = isQiMode ? '👁️ 關閉五氣資訊' : '👁️ 開啟五氣資訊 (生旺退殺死)';
                updateAll(); 
            });
        }

        if (savedYear && inputYear) inputYear.value = savedYear;
        if (savedGender) {
            userSettings.gender = savedGender;
            if (savedGender === 'male' && btnMale && btnFemale) {
                btnMale.classList.add('active'); btnFemale.classList.remove('active');
            } else if (savedGender === 'female' && btnMale && btnFemale) {
                btnFemale.classList.add('active'); btnMale.classList.remove('active');
            }
        }
        if (savedGua && selectHouse) selectHouse.value = savedGua;
        
        if (dateInput) {
            if (savedDate) {
                dateInput.value = savedDate;
            } else {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                dateInput.value = `${yyyy}-${mm}-${dd}`;
            }
            dateInput.addEventListener('change', updateAll);
        }

        function toggleLock(forceState = null) {
            const willLock = forceState !== null ? forceState : !(lockBtn.classList.contains('locked'));
            
            if (willLock) {
                if(inputYear) inputYear.disabled = true;
                if(selectHouse) selectHouse.disabled = true;
                if(btnMale) btnMale.disabled = true;
                if(btnFemale) btnFemale.disabled = true;
                if(dateInput) dateInput.disabled = true; 
                
                if(lockBtn) {
                    lockBtn.classList.add('locked');
                    lockBtn.textContent = '🔒 已鎖定 (點擊後可解鎖)';
                }

                if(inputYear) localStorage.setItem('fsSavedYear', inputYear.value);
                localStorage.setItem('fsSavedGender', userSettings.gender);
                if(selectHouse) localStorage.setItem('fsSavedGua', selectHouse.value);
                if(dateInput) localStorage.setItem('fsSavedDate', dateInput.value); 
                localStorage.setItem('fsIsLocked', 'true');

            } else {
                if(inputYear) inputYear.disabled = false;
                if(selectHouse) selectHouse.disabled = false;
                if(btnMale) btnMale.disabled = false;
                if(btnFemale) btnFemale.disabled = false;
                if(dateInput) dateInput.disabled = false; 

                if(lockBtn) {
                    lockBtn.classList.remove('locked');
                    lockBtn.textContent = '🔓 解鎖狀態 (點擊儲存鎖定)';
                }
                localStorage.setItem('fsIsLocked', 'false');
            }
        }

        if (lockBtn) {
            lockBtn.addEventListener('click', () => toggleLock());
            if (isLocked) toggleLock(true);
        }

        if (degreeSlider) {
            degreeSlider.addEventListener('input', (e) => {
                if (isCompassMode) {
                    window.removeEventListener('deviceorientation', handleOrientation, true);
                    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
                    setCompassMode(false); 
                }
                const deg = Number(e.target.value);
                updateUI(deg);
                renderRotation(deg);
            });
        }

        const startCompassBtn = document.getElementById('start-compass-btn');
        if (startCompassBtn) startCompassBtn.addEventListener('click', startCompass);

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.removeEventListener('deviceorientation', handleOrientation, true);
                window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
                setCompassMode(false);
                updateUI(180);
                renderRotation(180);
            });
        }

        if (inputYear) inputYear.addEventListener('input', updateAll);
        
        if (btnMale) {
            btnMale.addEventListener('click', () => { 
                userSettings.gender = 'male'; 
                btnMale.classList.add('active'); 
                btnFemale.classList.remove('active'); 
                updateAll(); 
            });
        }
        
        if (btnFemale) {
            btnFemale.addEventListener('click', () => { 
                userSettings.gender = 'female'; 
                btnFemale.classList.add('active'); 
                btnMale.classList.remove('active'); 
                updateAll(); 
            });
        }
        
        if (selectHouse) selectHouse.addEventListener('change', updateAll);
        
        window.setDegree = function(deg) {
            window.removeEventListener('deviceorientation', handleOrientation);
            setCompassMode(false);
            updateUI(deg); 
            renderRotation(deg);
        }

        updateAll();
        updateUI(180);
        renderRotation(180);
    }
    
    init();
});