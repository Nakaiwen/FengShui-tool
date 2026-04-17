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
        { type: 'good', stars: [4, 1], name: '四一同宮', desc: '利文昌、考試、升遷與桃花。', boost: '建議佈局：放置四支水種萬年青或掛上四隻毛筆，引動文昌氣場。' },
        { type: 'good', stars: [6, 8], name: '六八同宮', desc: '大利武職、偏財、事業爆發。', boost: '建議佈局：放置金屬聚寶盆或銅製飾品，並鋪設黃色地墊催財。' },
        { type: 'good', stars: [8, 9], name: '八九同宮', desc: '大吉慶、婚喜、財運亨通。', boost: '建議佈局：放置紅色中國結或點亮紅燈，引動喜慶財氣。' },
        { type: 'bad',  stars: [7, 9], name: '九七穿途', desc: '注意火災、心血管疾病或官非。' },
        { type: 'bad',  stars: [2, 5], name: '二五交加', desc: '注意重病、血光意外。' },
        { type: 'bad',  stars: [3, 7], name: '三七疊臨', desc: '注意遭竊盜、金屬所傷或劫財破財。' }
    ];

    // ★ 核心數據升級：新增乾坤生六子人物與身體部位
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

    // 八宮對沖定義（用於判定「關」方）
    const OPPOSITE_GUA = {
        '坎': '離', '離': '坎',
        '震': '兌', '兌': '震',
        '巽': '乾', '乾': '巽',
        '艮': '坤', '坤': '艮'
    };

    
    // 將原本的 userSettings 替換為支援雙人的版本
    let userSettings = {
    genderA: 'male',
    genderB: 'male'
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
    const color = (type === '四一') ? 'rgba(88, 206, 92, 0.4)' : 'rgba(255, 226, 62, 0.4)';

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

    // --- 計算命主 (甲) 命卦 ---
    let mingGuaA = null;
    if (!isNaN(birthYearA)) {
        let sumA = birthYearA.toString().split('').map(Number).reduce((a, b) => a + b, 0);
        while (sumA > 9) sumA = sumA.toString().split('').map(Number).reduce((a, b) => a + b, 0);
        let kuaA = (genderA === 'male') ? (11 - sumA) : (4 + sumA);
        while (kuaA > 9) kuaA -= 9;
        if (kuaA === 5) kuaA = (genderA === 'male') ? 2 : 8;
        mingGuaA = GUA_DATA[kuaA];
    } else {
        return; // 命主必填，否則停止渲染
    }

    // --- 計算家人 (乙) 命卦 (若有填寫) ---
    let mingGuaB = null;
    if (!isNaN(birthYearB)) {
        let sumB = birthYearB.toString().split('').map(Number).reduce((a, b) => a + b, 0);
        while (sumB > 9) sumB = sumB.toString().split('').map(Number).reduce((a, b) => a + b, 0);
        let kuaB = (genderB === 'male') ? (11 - sumB) : (4 + sumB);
        while (kuaB > 9) kuaB -= 9;
        if (kuaB === 5) kuaB = (genderB === 'male') ? 2 : 8;
        mingGuaB = GUA_DATA[kuaB];
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
        
        // 取得甲與乙的命星 (確保 mingGuaA 與 mingGuaB 在迴圈外已被定義)
        const pMingA = mingGuaA ? getStarInGua(mingGuaA.number, gua) : null;
        const pMingB = mingGuaB ? getStarInGua(mingGuaB.number, gua) : null;

        let sharedScore = 0;
        let sharedStars = []; 
        let triggerEvents = [];

        // 第一步：空間共用 - 宅卦八宅基礎分
        sharedScore += getBzScore(bzName);
        

        // 第二步：收集空間活躍星與五氣分 (宅、運、年、月)
        if (activeLayers.includes(1)) { 
            const qiData = getFiveQi(zhaiGua.number, pZhai);
            let finalQi = qiData.qi;
            const currentHouseName = zhaiGua.name;
            if (gua === OPPOSITE_GUA[currentHouseName]) { finalQi = '關'; }
            sharedScore += getQiScore(finalQi); 
            sharedStars.push(pZhai); 
        }
        if (activeLayers.includes(2)) { sharedScore += getQiScore(getFiveQi(periodStar, pPeriod).qi); sharedStars.push(pPeriod); }
        if (activeLayers.includes(3)) { sharedScore += getQiScore(getFiveQi(annualStar, pYear).qi); sharedStars.push(pYear); }
        if (activeLayers.includes(4)) { sharedScore += getQiScore(getFiveQi(monthStar, pMonth).qi); sharedStars.push(pMonth); }

        // 第三步：化學反應（吉凶組合） (★ 加入趨吉佈局提示) -> 空間共用
        COMBINATION_RULES.forEach(rule => {
            if (rule.stars.length === 2) {
                const [s1, s2] = rule.stars; 
                const c1 = sharedStars.filter(s => s === s1).length; 
                const c2 = sharedStars.filter(s => s === s2).length;
                let hits = (s1 !== s2) ? c1 * c2 : (c1 * (c1 - 1)) / 2;
                
                if (hits > 0) { 
                    if (rule.type === 'good') { 
                        sharedScore += 15; 
                        drawLuckyGlow(bzLayer, gua, rule.name.includes('四一') ? '四一' : '財位');
                        triggerEvents.push(`
                            <div style="color:#2e7d32; margin-bottom:6px;">
                                <b>[吉] ${rule.name}</b> - ${rule.desc}
                                ${rule.boost ? `
                                <div style="font-size:12px; color:#1b5e20; background:#e8f5e9; padding:5px 10px; border-radius:4px; margin-top:4px; border-left:3px solid #2e7d32; line-height:1.4;">
                                    🚀 <b>趨吉佈局：</b>${rule.boost}
                                </div>` : ''}
                            </div>
                        `); 
                    } 
                    if (rule.type === 'bad') { 
                        sharedScore -= 20; 
                        triggerEvents.push(`
                            <div style="color:#e91700; margin-bottom:4px;">
                                <b>[凶] ${rule.name}</b> - ${rule.desc}
                            </div>
                        `); 
                    } 
                }
            }
        });

        // =========================================================
        // ★ 進階大腦：精準【受剋判定】與【通關化解】邏輯 (空間共用)
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
        sharedStars.forEach(s => presentWuxings.add(starWuxingMap[s]));

        let injuryNote = "";
        let isHealed = false;
        let healerStar = null;
        let destroyCount = 0; 
        let drainCount = 0;   

        sharedStars.forEach(s => {
            const sWuxing = starWuxingMap[s];
            if (destroyMap[sWuxing] === currentGuaWuxing) {
                destroyCount++;
                const needBridge = bridgeMap[`${sWuxing}_${currentGuaWuxing}`];
                if (presentWuxings.has(needBridge)) {
                    isHealed = true;
                    healerStar = sharedStars.find(star => starWuxingMap[star] === needBridge);
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
            if (drainMap[currentGuaWuxing] === sWuxing) {
                drainCount++;
            }
        });

        if (destroyCount > 0 && drainCount > 0 && !isHealed) {
            sharedScore -= 30; 
            const BOOST_REMEDY = {
                '金': '建議擇吉日吉時，大量補充金元素：放置 4 或 9 件銅製錢幣、白色地毯，並保持此方乾淨明亮。',
                '木': '建議擇吉日吉時，大量補充木元素：放置 3 或 8 盆長青植物、綠色裝飾，維持生機，並保持此方乾淨明亮。',
                '水': '建議擇吉日吉時，大量補充水元素：放置 1 或 6 件動水擺件、黑色裝飾，活化能量，並保持此方乾淨明亮。',
                '火': '建議擇吉日吉時，大量補充火元素：點亮 2 或 7 盞暖色長明燈、紅色掛畫，支撐氣場，並保持此方乾淨明亮。',
                '土': '建議擇吉日吉時，大量補充土元素：放置陶藝或是石雕擺件、聚寶盆，或5顆、10顆天然礦石，並保持此方乾淨明亮。'
            };
            const currentBoost = BOOST_REMEDY[currentGuaWuxing] || '請尋求專業老師指導。';
            triggerEvents.push(`
                <div style="background:#4a0000; border-left:5px solid #ff0000; padding:10px; margin:5px 0; color:#fff; font-size:13px; border-radius:4px; line-height:1.6;">
                    🚨 <b>【特級預警：剋洩交加】</b><br>
                    此方位能量耗損過度！請注意此方位內部能量(<b>${currentGuaWuxing}</b>)正遭受大量剋洩耗損。<br>
                    這對 <b>${guaInfo.member}</b> 的影響較為明顯，若在此方位施工動土，極易引發意外或突發健康問題！<br>
                    <div style="margin-top:8px; color:#ffeb3b; font-size:12.5px; background:rgba(255,255,255,0.1); padding:8px; border-radius:4px; border:1px dashed #ffeb3b;">
                        🛠️ <b>緊急佈局方案：</b><br>${currentBoost}
                    </div>
                </div>
            `);
        } else if (isHealed && !injuryNote) {
            sharedScore += 20; 
            triggerEvents.push(`
                <div style="background:#f0fff4; border-left:4px solid #2e7d32; padding:8px 10px; margin:5px 0; color:#2e7d32; font-size:12.5px;">
                    🌿 <b>【通關化解】</b>：<br>
                    本有剋戰凶象，幸得同宮 <b>${STAR_NAMES_SHORT[healerStar]}</b> 轉化氣場，化凶為吉！
                </div>
            `);
        } else if (injuryNote) {
            sharedScore -= 20;
            triggerEvents.push(injuryNote);
        }

        const annualQi = getFiveQi(annualStar, pYear).qi;
        if (annualQi === '殺' && [2, 5, 3].includes(pMonth) && activeLayers.includes(4)) {
            triggerEvents.push(`<div style="background:#fff9f0; border-left:4px solid #da7800; padding:4px 8px; margin:4px 0; color:#da7800; font-size:12px;">⚠️ 氣場引動：流月凶星進入流年殺位，易有突發意外。</div>`);
        }

        // =========================================================
        // ★ 核心升級：雙人專屬分數結算 (繼承 sharedScore 後各自加總)
        // =========================================================
        let scoreA = sharedScore;
        let scoreB = mingGuaB ? sharedScore : null;
        let pA_HTML = '';
        let pB_HTML = '';

        // 動態判斷性別頭像
        const avatarA = (genderA === 'female') ? '👩' : '👨';
        const avatarB = (genderB === 'female') ? '👩' : '👨';

        // 命主(甲) 結算
        if (mingGuaA) {
            const bzA = mingGuaA.stars[gua];
            scoreA += getBzScore(bzA);
            let qiText = '';
            if (activeLayers.includes(5)) {
                const qA = getFiveQi(mingGuaA.number, pMingA).qi;
                scoreA += getQiScore(qA);
                qiText = ` / 命氣:${qA}`;
            }
            pA_HTML = `<div style="color:#d35400; font-size:13.5px; margin-bottom:5px;">${avatarA} <b>命主(甲)：</b>命盤八宅[${bzA}]${qiText} ➔ 總評: <b>${scoreA}</b>分</div>`;
        }

        // 家人(乙) 結算
        if (mingGuaB) {
            const bzB = mingGuaB.stars[gua];
            scoreB += getBzScore(bzB);
            let qiText = '';
            if (activeLayers.includes(5)) {
                const qB = getFiveQi(mingGuaB.number, pMingB).qi;
                scoreB += getQiScore(qB);
                qiText = ` / 命氣:${qB}`;
            }
            pB_HTML = `<div style="color:#2980b9; font-size:13.5px; margin-bottom:10px;">${avatarB} <b>家人(乙)：</b>命盤八宅[${bzB}]${qiText} ➔ 總評: <b>${scoreB}</b>分</div>`;
        }

    

        // =========================================================
        // ★ 核心升級：繪製左甲右乙的扇形底色與星等
        // =========================================================
        function getStateAndColor(sc) {
            if (sc >= 40) return { state: '極其祥和', color: 'rgba(255, 236, 27, 0.55)' };
            if (sc >= 20) return { state: '氣場趨吉', color: 'rgba(255, 184, 62, 0.45)' };
            if (sc <= -40) return { state: '能量受阻', color: 'rgba(255, 89, 89, 0.55)' };
            if (sc <= -20) return { state: '氣場波動', color: 'rgba(255, 131, 97, 0.45)' };
            return { state: '氣場中和', color: 'rgba(135, 206, 235, 0.4)' };
        }

        const resA = getStateAndColor(scoreA);
        const resB = mingGuaB ? getStateAndColor(scoreB) : resA; // 若無乙，右半邊同甲顏色

        let centerAngle = getSvgAngle(gua);
        
        // 繪製左半邊 (甲的顏色： -22.5度 到 0度)
        const guaSectorA = drawAnnularSector(bzLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 110, 135, centerAngle - 22.5, centerAngle, resA.color);
        // 繪製右半邊 (乙的顏色： 0度 到 +22.5度)
        const guaSectorB = drawAnnularSector(bzLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 110, 135, centerAngle, centerAngle + 22.5, resB.color);

        // 綁定點擊跳轉 (左右兩半都綁)
        const clickHandler = () => {
            const targetReport = document.getElementById(`report-${gua}`);
            if (targetReport) {
                targetReport.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetReport.style.transition = 'background-color 0.5s';
                targetReport.style.backgroundColor = '#fff9c4'; 
                setTimeout(() => targetReport.style.backgroundColor = '', 2000);
            }
        };
        if (guaSectorA) { guaSectorA.style.cursor = 'pointer'; guaSectorA.setAttribute('id', `svg-gua-a-${gua}`); guaSectorA.onclick = clickHandler; }
        if (guaSectorB) { guaSectorB.style.cursor = 'pointer'; guaSectorB.setAttribute('id', `svg-gua-b-${gua}`); guaSectorB.onclick = clickHandler; }

        // 星等繪製 (取兩人平均分數畫星星)
        const avgScore = mingGuaB ? Math.round((scoreA + scoreB) / 2) : scoreA;
        const absScore = Math.abs(avgScore);
        const fullStars = Math.floor(absScore / 10);
        const hasHalfStar = (absScore % 10) >= 5;
        const totalVisualStars = fullStars + (hasHalfStar ? 1 : 0);
        const starType = avgScore > 0 ? 'good' : 'bad';

        if (totalVisualStars > 0) {
            const STAR_SPACING = 6; const MAX_PER_ROW = 6; const ROW_GAP = 8;
            let starsToDraw = Array(fullStars).fill(false);
            if (hasHalfStar) starsToDraw.push(true);
            const totalRows = Math.ceil(starsToDraw.length / MAX_PER_ROW);
            const baseRadius = totalRows > 1 ? 104 : RADIAL_LAYOUT.combinationsRadius;
            for (let row = 0; row < totalRows; row++) {
                let rowStars = starsToDraw.slice(row * MAX_PER_ROW, (row + 1) * MAX_PER_ROW);
                let currentRadius = baseRadius - (row * ROW_GAP);
                let currentAngle = centerAngle - ((rowStars.length - 1) * STAR_SPACING) / 2;
                rowStars.forEach(isHalf => {
                    drawScoreStar(comboLayer, currentAngle, currentRadius, starType, isHalf);
                    currentAngle += STAR_SPACING;
                });
            }
        }

        // 繪製空間八宅文字與吉印
        drawLabel(bzLayer, bzName, (['生氣', '延年'].includes(bzName) ? centerAngle - 6 : centerAngle), RADIAL_LAYOUT.starRadius, '#252525ff', 16);
        if (['生氣', '延年'].includes(bzName)) {
            const sealAngle = centerAngle + 12;
            const sx = RADIAL_LAYOUT.center.x + RADIAL_LAYOUT.starRadius * Math.cos(sealAngle * Math.PI / 180);
            const sy = RADIAL_LAYOUT.center.y + RADIAL_LAYOUT.starRadius * Math.sin(sealAngle * Math.PI / 180);
            const sealGroup = document.createElementNS(SVG_NS, 'g');
            const circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('r', RADIAL_LAYOUT.sealSize);
            circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', '#c0392b'); circle.setAttribute('stroke-width', '1.5');
            const sealText = document.createElementNS(SVG_NS, 'text');
            sealText.setAttribute('text-anchor', 'middle'); sealText.setAttribute('dominant-baseline', 'central'); sealText.setAttribute('font-size', '13'); sealText.setAttribute('fill', '#c0392b'); sealText.setAttribute('font-family', 'serif'); sealText.textContent = '吉';
            sealGroup.appendChild(circle); sealGroup.appendChild(sealText);
            sealGroup.setAttribute('transform', `translate(${sx}, ${sy}) rotate(${sealAngle + 90})`);
            bzLayer.appendChild(sealGroup);
        }

        // 產出下方的報告資料陣列 (支援雙人顯示)
        const finalStateDisplay = mingGuaB ? `甲:${resA.state} / 乙:${resB.state}` : resA.state;
        const finalScoreDisplay = mingGuaB ? `甲:${scoreA} / 乙:${scoreB}` : scoreA;
        
        // 產出下方的報告資料陣列 (新增 rawScoreA 存入原始數字)
        reports.push({ 
            gua: gua, 
            score: finalScoreDisplay, 
            rawScoreA: scoreA, // ★ 關鍵：把甲的原始分數存下來，後面才抓得到
            state: finalStateDisplay, 
            bz: bzName, 
            events: triggerEvents, 
            member: guaInfo.member, 
            body: guaInfo.body,
            memberScores: pA_HTML + pB_HTML  // ★ 新增這行：把甲乙個人分數獨立打包
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
        labels24[mIdx].main = sName; labels24[mIdx].color = (sName === '太歲') ? '#e91700ff' : '#6421c3ff';
    }
    const stemIdx = termData.fsYear % 10;
    const DU_TIAN_MAP = { 0: [4, 5, 6], 1: [20, 21, 22], 2: [16, 17, 18], 3: [12, 13, 14], 4: [8, 9, 10], 5: [4, 5, 6], 6: [20, 21, 22], 7: [16, 17, 18], 8: [12, 13, 14], 9: [8, 9, 10] };
    const dtIndices = DU_TIAN_MAP[stemIdx];
    for (let i = 0; i < 3; i++) {
        const idx = dtIndices[i]; const dn = ['戊己都天', '夾煞都天', '戊己都天'][i];
        if (labels24[idx].main) { labels24[idx].sub = dn; labels24[idx].subColor = '#e91700ff'; }
        else { labels24[idx].main = dn; labels24[idx].color = '#e91700ff'; }
    }
    let ssIdx = [];
    if ([6, 10, 2].includes(ybIdx)) ssIdx = [23, 0, 1];
    else if ([4, 8, 0].includes(ybIdx)) ssIdx = [11, 12, 13];
    else if ([3, 7, 11].includes(ybIdx)) ssIdx = [17, 18, 19];
    else if ([9, 1, 5].includes(ybIdx)) ssIdx = [5, 6, 7];
    ssIdx.forEach(idx => {
        if (!labels24[idx].main) { labels24[idx].main = "三煞"; labels24[idx].color = "#e91700ff"; }
        else if (!labels24[idx].sub) { labels24[idx].sub = "三煞"; labels24[idx].subColor = "#e91700ff"; }
        else labels24[idx].sub += "·三煞";
    });
    for (let i = 0; i < 24; i++) {
        if (labels24[i].color === '#e91700ff' || labels24[i].subColor === '#e91700ff') {
            drawAnnularSector(shasLayer, RADIAL_LAYOUT.center.x, RADIAL_LAYOUT.center.y, 240, 267, 90 + (i * 15) - 7.5, 90 + (i * 15) + 7.5, 'rgba(252, 133, 115, 0.5)');
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