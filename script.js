document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定
    // =================================================================
    
    const RADIAL_LAYOUT = {
        center: { x: 280.36, y: 280.36 }, 
        
        // 吉凶文字出現的半徑
        starRadius: 116, 
        
        // ★★★ 吉字印章設定 ★★★
        // 這是「角度」偏移量，代表印章要往旁邊移動多少度
        sealAngleOffset: 15, 
        sealSize: 10,   // 印章大小
        
        defaultRotation: 0 
    };

    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', 
        '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', 
        '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    const MING_GUA_DATA = {
        1: { name: '坎', group: '東四命', stars: { '坎':'伏位', '巽':'生氣', '震':'天醫', '離':'延年', '乾':'六煞', '兌':'禍害', '艮':'五鬼', '坤':'絕命' } },
        2: { name: '坤', group: '西四命', stars: { '坤':'伏位', '艮':'生氣', '兌':'天醫', '乾':'延年', '離':'六煞', '震':'禍害', '巽':'五鬼', '坎':'絕命' } },
        3: { name: '震', group: '東四命', stars: { '震':'伏位', '離':'生氣', '坎':'天醫', '巽':'延年', '艮':'六煞', '坤':'禍害', '乾':'五鬼', '兌':'絕命' } },
        4: { name: '巽', group: '東四命', stars: { '巽':'伏位', '坎':'生氣', '離':'天醫', '震':'延年', '兌':'六煞', '乾':'禍害', '坤':'五鬼', '艮':'絕命' } },
        6: { name: '乾', group: '西四命', stars: { '乾':'伏位', '兌':'生氣', '艮':'天醫', '坤':'延年', '坎':'六煞', '巽':'禍害', '震':'五鬼', '離':'絕命' } },
        7: { name: '兌', group: '西四命', stars: { '兌':'伏位', '乾':'生氣', '坤':'天醫', '艮':'延年', '巽':'六煞', '坎':'禍害', '離':'五鬼', '震':'絕命' } },
        8: { name: '艮', group: '西四命', stars: { '艮':'伏位', '坤':'生氣', '乾':'天醫', '兌':'延年', '震':'六煞', '離':'禍害', '坎':'五鬼', '巽':'絕命' } },
        9: { name: '離', group: '東四命', stars: { '離':'伏位', '震':'生氣', '巽':'天醫', '坎':'延年', '坤':'六煞', '艮':'禍害', '兌':'五鬼', '乾':'絕命' } }
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

    const centerMainText = document.getElementById('center-main-text');
    const centerSubText = document.getElementById('center-sub-text');

    function updateCenterText(text, subText) {
        if (centerMainText) centerMainText.textContent = text;
        if (centerSubText) centerSubText.textContent = subText;
    }

    /**
     * 繪製圓盤上的吉凶星 + 旁邊的生氣印章
     */
    function drawAusStars(mingGuaInfo) {
        if (!starLayer) return;
        starLayer.innerHTML = ''; 

        const stars = mingGuaInfo.stars;
        
        for (const [gua, starName] of Object.entries(stars)) {
            let svgAngle;
            switch(gua) {
                case '坎': svgAngle = 90;  break;
                case '艮': svgAngle = 135; break; 
                case '震': svgAngle = 180; break; 
                case '巽': svgAngle = 225; break; 
                case '離': svgAngle = 270; break;
                case '坤': svgAngle = 315; break; 
                case '兌': svgAngle = 0;   break; 
                case '乾': svgAngle = 45;  break; 
            }

            // 判斷是否為生氣方，如果是，我們要微調文字位置，留空間給印章
            let textAngle = svgAngle;
            if (starName === '生氣') {
                // 文字往逆時針偏一點點 (例如 -6度)，讓出右邊的位置給印章
                textAngle = svgAngle - 6; 
            }

            const radians = textAngle * (Math.PI / 180);
            
            // ----------------------------------------
            // 1. 繪製主要文字
            // ----------------------------------------
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
                textEl.setAttribute('fill', '#dc5f00ff'); // 吉紅
            } else {
                textEl.setAttribute('fill', '#004fe3ff'); // 凶藍
            }

            textEl.textContent = starName;
            
            // 同心圓排列
            textEl.setAttribute('transform', `rotate(${textAngle + 90}, ${x}, ${y})`);
            starLayer.appendChild(textEl);

            // ----------------------------------------
            // 2. 如果是「生氣」方，在旁邊加蓋吉字印章
            // ----------------------------------------
            if (starName === '生氣') {
                // 印章的角度：原本方位角度 + 偏移量 (往順時針偏，即文字的右邊)
                // 這裡我們偏一點點，例如文字 -6度，印章 +8度，這樣視覺中心大約還是在正中間
                const sealAngle = svgAngle + 12; 
                const sealRadians = sealAngle * (Math.PI / 180);

                // 使用相同的半徑 (starRadius)，這樣就在同一個圓周上
                const sx = RADIAL_LAYOUT.center.x + RADIAL_LAYOUT.starRadius * Math.cos(sealRadians);
                const sy = RADIAL_LAYOUT.center.y + RADIAL_LAYOUT.starRadius * Math.sin(sealRadians);

                // 建立印章群組
                const sealGroup = document.createElementNS(SVG_NS, 'g');
                
                // (A) 印章圓圈
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('cx', 0);
                circle.setAttribute('cy', 0);
                circle.setAttribute('r', RADIAL_LAYOUT.sealSize); 
                circle.setAttribute('fill', 'rgba(255, 255, 255, 0.8)'); // 稍微白底，避免線條干擾
                circle.setAttribute('stroke', '#c0392b'); 
                circle.setAttribute('stroke-width', '1.5');

                // (B) 印章文字
                const sealText = document.createElementNS(SVG_NS, 'text');
                sealText.setAttribute('x', 0);
                sealText.setAttribute('y', 1);
                sealText.setAttribute('text-anchor', 'middle');
                sealText.setAttribute('dominant-baseline', 'central');
                sealText.setAttribute('font-family', '"BiauKai", "DFKai-SB", "KaiTi", serif');
                sealText.setAttribute('font-weight', 'bold');
                sealText.setAttribute('font-size', '14'); 
                sealText.setAttribute('fill', '#c0392b');
                sealText.textContent = '吉';

                sealGroup.appendChild(circle);
                sealGroup.appendChild(sealText);
                
                // 設定群組位置與旋轉
                sealGroup.setAttribute('transform', `rotate(${sealAngle + 90}, ${sx}, ${sy}) translate(${sx}, ${sy})`);
                
                starLayer.appendChild(sealGroup);
            }
        }
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
        console.log("陽宅風水排盤 - 生氣印章版 v9.0");
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