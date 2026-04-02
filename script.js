document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定
    // =================================================================
    
    const RADIAL_LAYOUT = {
        center: { x: 280.36, y: 280.36 }, 
        
        starRadius: 117,        // 1. 八宅吉凶星 
        personMingRadius: 205,  // 2. 人命紫白 
        monthlyRadius: 232,     // 3. 流月飛星 
        annualRadius: 255,      // 4. 流年飛星 

        sealOffset: 0,
        sealSize: 10,   
        defaultRotation: 0 
    };

    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    const FLYING_STARS_INFO = {
        1: { name: '一白貪狼', meaning: '桃花星', color: '#555555' }, 
        2: { name: '二黑巨門', meaning: '病符星', color: '#000000' }, 
        3: { name: '三碧蚩尤', meaning: '強盜星', color: '#2e7d32' }, 
        4: { name: '四綠文曲', meaning: '破財星', color: '#388e3c' }, 
        5: { name: '五黃廉貞', meaning: '毒癌星', color: '#d84315' }, 
        6: { name: '六白武曲', meaning: '偏財星', color: '#555555' }, 
        7: { name: '七赤破軍', meaning: '賊盜星', color: '#c62828' }, 
        8: { name: '八白左輔', meaning: '財帛星', color: '#555555' }, 
        9: { name: '九紫右弼', meaning: '喜慶星', color: '#8e24aa' }  
    };

    const STAR_NAMES_SHORT = { 1: '一白', 2: '二黑', 3: '三碧', 4: '四綠', 5: '五黃', 6: '六白', 7: '七赤', 8: '八白', 9: '九紫' };
    const LUO_SHU_PATH = ['乾', '兌', '艮', '離', '坎', '坤', '震', '巽'];

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

    // =================================================================
    //  SECTION 2: 節氣與飛星邏輯
    // =================================================================
    function getSolarTermMonth() {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const d = now.getDate();
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
        if ([0, 3, 6, 9].includes(yearBranchIndex)) startStar = 8; 
        else if ([1, 4, 7, 10].includes(yearBranchIndex)) startStar = 5; 
        else startStar = 2; 
        let star = startStar - (fsMonth - 1);
        while (star <= 0) star += 9;
        return star;
    }

    // =================================================================
    //  SECTION 3: 繪圖核心
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

    function drawLabel(layer, text, angle, radius, color, fontSize, isDouble = false, subText = "") {
        const rad = angle * (Math.PI / 180);
        const x = RADIAL_LAYOUT.center.x + radius * Math.cos(rad);
        const y = RADIAL_LAYOUT.center.y + radius * Math.sin(rad);

        const textEl = document.createElementNS(SVG_NS, 'text');
        textEl.setAttribute('x', x); textEl.setAttribute('y', y);
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'central');
        textEl.setAttribute('font-family', '"BiauKai", "DFKai-SB", "KaiTi", serif');
        textEl.setAttribute('font-weight', 'bold');
        textEl.setAttribute('fill', color);
        textEl.setAttribute('transform', `rotate(${angle + 90}, ${x}, ${y})`);

        if (isDouble) {
            // ★ 自訂的小字體 11 與 10
            const t1 = document.createElementNS(SVG_NS, 'tspan');
            t1.setAttribute('x', x); t1.setAttribute('dy', '-0.5em');
            t1.setAttribute('font-size', '11');
            t1.textContent = text;
            
            const t2 = document.createElementNS(SVG_NS, 'tspan');
            t2.setAttribute('x', x); t2.setAttribute('dy', '1.5em');
            t2.setAttribute('font-size', '10');
            t2.textContent = subText;
            
            textEl.appendChild(t1);
            textEl.appendChild(t2);
        } else {
            textEl.setAttribute('font-size', fontSize);
            textEl.textContent = text;
        }
        layer.appendChild(textEl);
    }

    function renderPersonMingStars(centerNum, radius, layerId) {
        const layer = getLayer(layerId);
        layer.innerHTML = '';
        LUO_SHU_PATH.forEach((gua, index) => {
            let num = (centerNum + index + 1) % 9;
            if (num === 0) num = 9;
            const info = FLYING_STARS_INFO[num];
            drawLabel(layer, info.name, getSvgAngle(gua), radius, info.color, 15, true, info.meaning);
        });
    }

    function renderStarsShort(centerNum, radius, layerId, prefix) {
        const layer = getLayer(layerId);
        layer.innerHTML = '';
        LUO_SHU_PATH.forEach((gua, index) => {
            let num = (centerNum + index + 1) % 9;
            if (num === 0) num = 9;
            const starColor = FLYING_STARS_INFO[num].color;
            drawLabel(layer, `${prefix}-${STAR_NAMES_SHORT[num]}`, getSvgAngle(gua), radius, starColor, 14);
        });
    }

    // =================================================================
    //  SECTION 4: 更新文字與圖層
    // =================================================================
    const inputYear = document.getElementById('birth-year');
    const selectHouse = document.getElementById('house-gua');

    function updateAll() {
        const birthYear = parseInt(inputYear.value);
        if (isNaN(birthYear)) return;

        let sum = birthYear.toString().split('').map(Number).reduce((a,b)=>a+b, 0);
        while(sum > 9) sum = sum.toString().split('').map(Number).reduce((a,b)=>a+b,0);
        let kua;
        if(userSettings.gender === 'male') { kua = 11 - sum; while(kua > 9) kua -= 9; if(kua === 5) kua = 2; } 
        else { kua = 4 + sum; while(kua > 9) kua -= 9; if(kua === 5) kua = 8; }
        const mingGua = GUA_DATA[kua];

        const houseGuaName = selectHouse ? selectHouse.value : '坎';
        const zhaiGua = Object.values(GUA_DATA).find(g => g.name === houseGuaName) || GUA_DATA[1];

        const termData = getSolarTermMonth();
        const annualStar = (11 - (termData.fsYear % 9)) % 9 || 9;
        const monthStar = calculateMonthStar(termData.fsYear, termData.fsMonth);

        document.getElementById('center-main-text').textContent = `${zhaiGua.name}宅 ${mingGua.name}命`;
        document.getElementById('center-sub-text').textContent = `${termData.termName}後-${termData.fsMonth}月`;

        const bzLayer = getLayer('bz-layer'); bzLayer.innerHTML = '';
        for(const [g, s] of Object.entries(zhaiGua.stars)) {
            const c = ['生氣','延年','天醫','伏位'].includes(s) ? '#dc5f00' : '#004fe3';
            let textAngle = getSvgAngle(g);
            if (['生氣', '延年'].includes(s)) textAngle -= 6; 
            drawLabel(bzLayer, s, textAngle, RADIAL_LAYOUT.starRadius, c, 18);

            if (['生氣', '延年'].includes(s)) {
                const sealAngle = getSvgAngle(g) + 12; 
                const sx = RADIAL_LAYOUT.center.x + RADIAL_LAYOUT.starRadius * Math.cos(sealAngle * Math.PI / 180);
                const sy = RADIAL_LAYOUT.center.y + RADIAL_LAYOUT.starRadius * Math.sin(sealAngle * Math.PI / 180);
                const sealGroup = document.createElementNS(SVG_NS, 'g');
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('r', RADIAL_LAYOUT.sealSize); circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', '#c0392b'); circle.setAttribute('stroke-width', '1.5');
                const sealText = document.createElementNS(SVG_NS, 'text');
                sealText.setAttribute('text-anchor', 'middle'); sealText.setAttribute('dominant-baseline', 'central'); sealText.setAttribute('font-size', '13'); sealText.setAttribute('fill', '#c0392b'); sealText.setAttribute('font-family', 'serif'); sealText.textContent = '吉';
                sealGroup.appendChild(circle); sealGroup.appendChild(sealText);
                sealGroup.setAttribute('transform', `translate(${sx}, ${sy}) rotate(${sealAngle + 90})`);
                bzLayer.appendChild(sealGroup);
            }
        }
        
        renderPersonMingStars(mingGua.number, RADIAL_LAYOUT.personMingRadius, 'person-ming-layer');
        renderStarsShort(monthStar, RADIAL_LAYOUT.monthlyRadius, 'monthly-layer', `${termData.fsMonth}月`);
        renderStarsShort(annualStar, RADIAL_LAYOUT.annualRadius, 'annual-layer', `${termData.fsYear.toString().slice(-2)}年`);
    }

    // =================================================================
    //  SECTION 5: 手機羅盤感測與UI旋轉 (★完全修復版★)
    // =================================================================
    let targetHeading = 0;
    let isCompassMode = false;
    let animationFrameId = null;

    // 計算 24 山 (輔助 UI 更新)
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

    function updateDegreeUI(deg) {
        const roundDeg = Math.round(deg);
        if(document.getElementById('degree-display')) document.getElementById('degree-display').textContent = roundDeg;
        if(document.getElementById('facing-degree')) document.getElementById('facing-degree').textContent = roundDeg;
        
        const sittingDeg = (roundDeg + 180) % 360;
        if(document.getElementById('sitting-degree')) document.getElementById('sitting-degree').textContent = sittingDeg;

        // ★ 修復：更新坐向中文字 (子、午等)
        const elFacingName = document.getElementById('current-facing');
        if (elFacingName) elFacingName.textContent = getMountain(roundDeg);
        
        const elSittingName = document.getElementById('current-mountain');
        if (elSittingName) elSittingName.textContent = getMountain(sittingDeg);
        
        const slider = document.getElementById('degree-slider');
        if (slider && document.activeElement !== slider) {
            slider.value = roundDeg;
        }
    }

    function handleOrientation(event) {
        let compassHeading;
        
        // ★ 修復 NaN 問題：恢復最穩定且相容性最高的取值邏輯
        if (event.webkitCompassHeading) {
            compassHeading = event.webkitCompassHeading;
        } else if (event.alpha) {
            compassHeading = 360 - event.alpha;
        }

        // 確保抓到的值是有效的數字，才進行更新
        if (compassHeading !== undefined && compassHeading !== null && !isNaN(compassHeading)) {
            targetHeading = compassHeading;
            updateDegreeUI(compassHeading);
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
                        alert("羅盤感測權限被拒絕，請檢查 Safari 的設定 (隱私權 -> 動作與方向感測)。");
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
    //  SECTION 6: 初始化與綁定事件
    // =================================================================
    function init() {
        const slider = document.getElementById('degree-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                if (isCompassMode) {
                    window.removeEventListener('deviceorientation', handleOrientation, true);
                    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
                    setCompassMode(false); 
                }
                const deg = Number(e.target.value);
                updateDegreeUI(deg);
                renderRotation(deg);
            });
        }
        
        const startCompassBtn = document.getElementById('start-compass-btn');
        if (startCompassBtn) {
            startCompassBtn.addEventListener('click', startCompass);
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.removeEventListener('deviceorientation', handleOrientation, true);
                window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
                setCompassMode(false);
                updateDegreeUI(0);
                renderRotation(0);
            });
        }

        if (inputYear) inputYear.addEventListener('input', updateAll);
        
        const btnMale = document.getElementById('btn-male');
        const btnFemale = document.getElementById('btn-female');
        if (btnMale) {
            btnMale.addEventListener('click', () => { userSettings.gender='male'; btnMale.classList.add('active'); btnFemale.classList.remove('active'); updateAll(); });
        }
        if (btnFemale) {
            btnFemale.addEventListener('click', () => { userSettings.gender='female'; btnFemale.classList.add('active'); btnMale.classList.remove('active'); updateAll(); });
        }
        
        const selectHouse = document.getElementById('house-gua');
        if (selectHouse) {
            selectHouse.addEventListener('change', updateAll);
        }
        
        updateAll();
        updateDegreeUI(0);
        renderRotation(0);
    }
    
    init();
});