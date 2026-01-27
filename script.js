document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定
    // =================================================================
    
    const RADIAL_LAYOUT = {
        center: { x: 280.36, y: 280.36 }, 
        
        // 1. 八宅吉凶星 (內圈)
        starRadius: 115, 
        
        // 2. 紫白飛星 (外圈)
        flyingStarRadius: 260, 

        // 吉字印章設定
        sealOffset: 0, 
        sealSize: 10,   
        
        defaultRotation: 0 
    };

    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', 
        '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', 
        '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    // ★★★ 更新：紫白飛星完整資訊 (雙行內容) ★★★
    const FLYING_STARS_INFO = {
        1: { name: '一白貪狼', meaning: '桃花星', color: '#555555' }, 
        2: { name: '二黑巨門', meaning: '病符星', color: '#000000' }, 
        3: { name: '三碧蚩尤', meaning: '強盜星', color: '#2e7d32' }, // 深綠
        4: { name: '四綠文曲', meaning: '破財星', color: '#388e3c' }, // 綠
        5: { name: '五黃廉貞', meaning: '毒癌星', color: '#d84315' }, // 橘褐
        6: { name: '六白武曲', meaning: '偏財星', color: '#555555' }, 
        7: { name: '七赤破軍', meaning: '賊盜星', color: '#c62828' }, // 紅
        8: { name: '八白左輔', meaning: '財帛星', color: '#555555' }, 
        9: { name: '九紫右弼', meaning: '喜慶星', color: '#8e24aa' }  // 紫
    };

    // 洛書飛行軌跡
    const LUO_SHU_PATH = ['乾', '兌', '艮', '離', '坎', '坤', '震', '巽'];

    const MING_GUA_DATA = {
        1: { number: 1, name: '坎', group: '東四命', stars: { '坎':'伏位', '巽':'生氣', '震':'天醫', '離':'延年', '乾':'六煞', '兌':'禍害', '艮':'五鬼', '坤':'絕命' } },
        2: { number: 2, name: '坤', group: '西四命', stars: { '坤':'伏位', '艮':'生氣', '兌':'天醫', '乾':'延年', '離':'六煞', '震':'禍害', '巽':'五鬼', '坎':'絕命' } },
        3: { number: 3, name: '震', group: '東四命', stars: { '震':'伏位', '離':'生氣', '坎':'天醫', '巽':'延年', '艮':'六煞', '坤':'禍害', '乾':'五鬼', '兌':'絕命' } },
        4: { number: 4, name: '巽', group: '東四命', stars: { '巽':'伏位', '坎':'生氣', '離':'天醫', '震':'延年', '兌':'六煞', '乾':'禍害', '坤':'五鬼', '艮':'絕命' } },
        6: { number: 6, name: '乾', group: '西四命', stars: { '乾':'伏位', '兌':'生氣', '艮':'天醫', '坤':'延年', '坎':'六煞', '巽':'禍害', '震':'五鬼', '離':'絕命' } },
        7: { number: 7, name: '兌', group: '西四命', stars: { '兌':'伏位', '乾':'生氣', '坤':'天醫', '艮':'延年', '巽':'六煞', '坎':'禍害', '離':'五鬼', '震':'絕命' } },
        8: { number: 8, name: '艮', group: '西四命', stars: { '艮':'伏位', '坤':'生氣', '乾':'天醫', '兌':'延年', '震':'六煞', '離':'禍害', '坎':'五鬼', '巽':'絕命' } },
        9: { number: 9, name: '離', group: '東四命', stars: { '離':'伏位', '震':'生氣', '巽':'天醫', '坎':'延年', '坤':'六煞', '艮':'禍害', '兌':'五鬼', '乾':'絕命' } }
    };

    let userSettings = {
        year: 1990,
        gender: 'male'
    };

    // =================================================================
    //  SECTION 2: 繪圖與 DOM
    // =================================================================
    const svgPlate = document.getElementById('FengShui-plate');
    const SVG_NS = "http://www.w3.org/2000/svg";
    
    // 建立吉凶星專用圖層
    let starLayer = document.getElementById('star-layer');
    if (!starLayer && svgPlate) {
        starLayer = document.createElementNS(SVG_NS, 'g');
        starLayer.setAttribute('id', 'star-layer');
        svgPlate.appendChild(starLayer);
    }
    
    // 建立紫白飛星圖層
    let flyingStarLayer = document.getElementById('flying-star-layer');
    if (!flyingStarLayer && svgPlate) {
        flyingStarLayer = document.createElementNS(SVG_NS, 'g');
        flyingStarLayer.setAttribute('id', 'flying-star-layer');
        svgPlate.appendChild(flyingStarLayer);
    }

    const centerMainText = document.getElementById('center-main-text');
    const centerSubText = document.getElementById('center-sub-text');

    function updateCenterText(text, subText) {
        if (centerMainText) centerMainText.textContent = text;
        if (centerSubText) centerSubText.textContent = subText;
    }

    function getSvgAngle(gua) {
        switch(gua) {
            case '坎': return 90; 
            case '艮': return 135; 
            case '震': return 180; 
            case '巽': return 225; 
            case '離': return 270; 
            case '坤': return 315; 
            case '兌': return 0;   
            case '乾': return 45;  
        }
        return 0;
    }

    /**
     * 1. 繪製八宅吉凶星 + 吉字印章 (內圈)
     */
    function drawAusStars(mingGuaInfo) {
        if (!starLayer) return;
        starLayer.innerHTML = ''; 

        const stars = mingGuaInfo.stars;
        
        for (const [gua, starName] of Object.entries(stars)) {
            const svgAngle = getSvgAngle(gua);

            // 讓位邏輯
            let textAngle = svgAngle;
            if (['生氣', '延年'].includes(starName)) {
                textAngle = svgAngle - 6; 
            }

            const radians = textAngle * (Math.PI / 180);
            const x = RADIAL_LAYOUT.center.x + RADIAL_LAYOUT.starRadius * Math.cos(radians);
            const y = RADIAL_LAYOUT.center.y + RADIAL_LAYOUT.starRadius * Math.sin(radians);

            const textEl = document.createElementNS(SVG_NS, 'text');
            textEl.setAttribute('x', x);
            textEl.setAttribute('y', y);
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'central');
            textEl.setAttribute('font-family', '"BiauKai", "DFKai-SB", "KaiTi", serif');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('font-size', '20'); 
            
            if (['生氣', '天醫', '延年', '伏位'].includes(starName)) {
                textEl.setAttribute('fill', '#dc5f00ff'); 
            } else {
                textEl.setAttribute('fill', '#004fe3ff'); 
            }

            textEl.textContent = starName;
            textEl.setAttribute('transform', `rotate(${textAngle + 90}, ${x}, ${y})`);
            starLayer.appendChild(textEl);

            // 繪製印章
            if (['生氣', '延年'].includes(starName)) {
                const sealAngle = svgAngle + 12; 
                const sealRadians = sealAngle * (Math.PI / 180);
                const sealDist = RADIAL_LAYOUT.starRadius + RADIAL_LAYOUT.sealOffset;
                const sx = RADIAL_LAYOUT.center.x + sealDist * Math.cos(sealRadians);
                const sy = RADIAL_LAYOUT.center.y + sealDist * Math.sin(sealRadians);

                const sealGroup = document.createElementNS(SVG_NS, 'g');
                
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('cx', 0);
                circle.setAttribute('cy', 0);
                circle.setAttribute('r', RADIAL_LAYOUT.sealSize); 
                circle.setAttribute('fill', 'rgba(255, 255, 255, 0)');
                circle.setAttribute('stroke', '#c0392b'); 
                circle.setAttribute('stroke-width', '1.5');

                const sealText = document.createElementNS(SVG_NS, 'text');
                sealText.setAttribute('x', 0);
                sealText.setAttribute('y', 1);
                sealText.setAttribute('text-anchor', 'middle');
                sealText.setAttribute('dominant-baseline', 'central');
                sealText.setAttribute('font-family', '"BiauKai", "DFKai-SB", "KaiTi", serif');
                sealText.setAttribute('font-weight', 'bold');
                sealText.setAttribute('font-size', '13'); 
                sealText.setAttribute('fill', '#c0392b');
                sealText.textContent = '吉';

                sealGroup.appendChild(circle);
                sealGroup.appendChild(sealText);
                sealGroup.setAttribute('transform', `rotate(${sealAngle + 90}, ${sx}, ${sy}) translate(${sx}, ${sy})`);
                
                starLayer.appendChild(sealGroup);
            }
        }
    }

    /**
     * 2. ★★★ 繪製紫白飛星 (雙行：星名 + 意涵) ★★★
     */
    function drawFlyingStars(centerNumber) {
        if (!flyingStarLayer) return;
        flyingStarLayer.innerHTML = ''; 

        LUO_SHU_PATH.forEach((gua, index) => {
            let starNum = (centerNumber + index + 1) % 9;
            if (starNum === 0) starNum = 9;

            const starInfo = FLYING_STARS_INFO[starNum];
            const svgAngle = getSvgAngle(gua);
            
            const radians = svgAngle * (Math.PI / 180);
            const x = RADIAL_LAYOUT.center.x + RADIAL_LAYOUT.flyingStarRadius * Math.cos(radians);
            const y = RADIAL_LAYOUT.center.y + RADIAL_LAYOUT.flyingStarRadius * Math.sin(radians);

            const textEl = document.createElementNS(SVG_NS, 'text');
            textEl.setAttribute('x', x);
            textEl.setAttribute('y', y);
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'central');
            textEl.setAttribute('font-family', '"BiauKai", "DFKai-SB", "KaiTi", serif');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('fill', starInfo.color); 
            
            // 同心圓旋轉
            textEl.setAttribute('transform', `rotate(${svgAngle + 90}, ${x}, ${y})`);

            // ★ 第一行：星名 (例如：一白貪狼)
            const tspan1 = document.createElementNS(SVG_NS, 'tspan');
            tspan1.setAttribute('x', x);
            tspan1.setAttribute('dy', '0.6em'); // 稍微往上提
            // 因為字數變多 (4字)，字體設小一點
            tspan1.setAttribute('font-size', '16'); 
            tspan1.textContent = starInfo.name;

            // ★ 第二行：意涵 (例如：桃花星)
            const tspan2 = document.createElementNS(SVG_NS, 'tspan');
            tspan2.setAttribute('x', x);
            tspan2.setAttribute('dy', '1.5em'); // 換行間距
            tspan2.setAttribute('font-size', '14'); // 意涵字體再小一點
            tspan2.textContent = starInfo.meaning;

            textEl.appendChild(tspan1);
            textEl.appendChild(tspan2);
            
            flyingStarLayer.appendChild(textEl);
        });
    }

    // 旋轉控制
    let targetHeading = 0;
    let isCompassMode = false;
    let animationFrameId = null;

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

    // =================================================================
    //  SECTION 3: 核心演算法
    // =================================================================
    function getMountain(degree) {
        let deg = (degree % 360 + 360) % 360;
        const index = Math.floor((deg + 7.5) / 15) % 24;
        return TWENTY_FOUR_MOUNTAINS[index];
    }

    function calculateFengShui(facingDegree) {
        const facingName = getMountain(facingDegree);
        const sittingDegree = (facingDegree + 180) % 360;
        const sittingName = getMountain(sittingDegree);
        return {
            facing: { name: facingName, degree: facingDegree },
            sitting: { name: sittingName, degree: sittingDegree }
        };
    }

    function calculateMingGua(year, gender) {
        let sum = 0;
        const digits = year.toString().split('').map(Number);
        digits.forEach(d => sum += d);
        while (sum > 9) {
            sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
        }
        let kuaNumber;
        if (gender === 'male') {
            kuaNumber = 11 - sum;
            while (kuaNumber > 9) kuaNumber -= 9; 
            if (kuaNumber === 5) kuaNumber = 2; 
        } else {
            kuaNumber = 4 + sum;
            while (kuaNumber > 9) kuaNumber -= 9;
            if (kuaNumber === 5) kuaNumber = 8; 
        }
        return MING_GUA_DATA[kuaNumber];
    }

    // =================================================================
    //  SECTION 4: UI 與事件
    // =================================================================
    const degreeSlider = document.getElementById('degree-slider');
    const degreeDisplay = document.getElementById('degree-display');
    const resetBtn = document.getElementById('reset-btn');
    const startCompassBtn = document.getElementById('start-compass-btn');
    
    const elSittingName = document.getElementById('current-mountain');
    const elFacingName = document.getElementById('current-facing');
    const elSittingDeg = document.getElementById('sitting-degree');
    const elFacingDeg = document.getElementById('facing-degree');
    
    const inputYear = document.getElementById('birth-year');
    const btnMale = document.getElementById('btn-male');
    const btnFemale = document.getElementById('btn-female');

    function updateUI(degree) {
        const deg = Math.round(degree);
        if(degreeSlider && document.activeElement !== degreeSlider) {
            degreeSlider.value = deg;
        }
        if(degreeDisplay) degreeDisplay.textContent = deg;

        const result = calculateFengShui(deg);
        if(elSittingName) elSittingName.textContent = result.sitting.name;
        if(elFacingName) elFacingName.textContent = result.facing.name;
        if(elSittingDeg) elSittingDeg.textContent = Math.round(result.sitting.degree);
        if(elFacingDeg) elFacingDeg.textContent = deg;
    }

    function updateProfile() {
        const year = parseInt(inputYear.value);
        if (isNaN(year) || year < 1900 || year > 2099) return;

        const result = calculateMingGua(year, userSettings.gender);
        
        if (result) {
            updateCenterText(`${result.name}命`, result.group);
            drawAusStars(result);
            drawFlyingStars(result.number);
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
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    } else {
                        alert("權限被拒絕");
                        setCompassMode(false);
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }

    function initApp() {
        console.log("陽宅風水排盤 - 紫白飛星完整版 v11.0");
        updateUI(0);
        renderRotation(0);
        
        updateProfile(); 

        if (degreeSlider) {
            degreeSlider.addEventListener('input', (e) => {
                if (isCompassMode) {
                    window.removeEventListener('deviceorientation', handleOrientation);
                    setCompassMode(false); 
                }
                const degree = Number(e.target.value);
                updateUI(degree);
                renderRotation(degree);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.removeEventListener('deviceorientation', handleOrientation);
                setCompassMode(false);
                setTimeout(() => { updateUI(0); renderRotation(0); }, 10);
            });
        }

        if (startCompassBtn) {
            startCompassBtn.addEventListener('click', startCompass);
        }

        if (inputYear) {
            inputYear.addEventListener('input', updateProfile);
            inputYear.addEventListener('change', updateProfile); 
        }

        if (btnMale) {
            btnMale.addEventListener('click', () => {
                userSettings.gender = 'male';
                btnMale.classList.add('active');
                btnFemale.classList.remove('active');
                updateProfile();
            });
        }

        if (btnFemale) {
            btnFemale.addEventListener('click', () => {
                userSettings.gender = 'female';
                btnFemale.classList.add('active');
                btnMale.classList.remove('active');
                updateProfile();
            });
        }
    }

    window.setDegree = function(deg) {
        window.removeEventListener('deviceorientation', handleOrientation);
        setCompassMode(false);
        setTimeout(() => { updateUI(deg); renderRotation(deg); }, 10);
    }

    initApp();
});