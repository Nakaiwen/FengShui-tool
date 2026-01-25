document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定 (Data & Config)
    // =================================================================
    
    const RADIAL_LAYOUT = {
        center: { x: 396.65, y: 418.54 }, 
        defaultRotation: 0 
    };

    // 二十四山資料 (從北方 0 度開始，順時針排列)
    // 程式邏輯：0度=子，180度=午
    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', 
        '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', 
        '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    // =================================================================
    //  SECTION 2: SVG 圖盤繪製邏輯 (Drawing Logic)
    // =================================================================
    
    const svgPlate = document.getElementById('FengShui-plate');
    
    /**
     * 旋轉羅盤的函式 (包含 180 度修正)
     * @param {number} degrees - 手機感應到的角度 (0=北)
     * @param {boolean} isInstant - 是否為即時模式
     */
    function rotateCompass(degrees, isInstant = false) {
        if (svgPlate) {
            // 智慧切換動畫速度
            if (isInstant) {
                svgPlate.style.transition = "transform 0.1s linear";
            } else {
                svgPlate.style.transition = "transform 0.5s ease-out";
            }

            // 【重要修正】
            // 1. 手機向右轉(度數增加)，盤面要向左轉回來 -> 用負號 (-degrees)
            // 2. 你的 SVG 預設是「午上子下」(南上北下)，但手機 0 度是北。
            //    為了讓 0 度時「子」在上方，我們需要將盤面額外旋轉 180 度。
            
            const correctedDegree = -degrees + 180; 

            svgPlate.style.transform = `rotate(${correctedDegree}deg)`;
        }
    }

    // =================================================================
    //  SECTION 3: 核心演算法 (Core Algorithms)
    // =================================================================
    
    /**
     * 根據度數取得二十四山文字
     * @param {number} degree - 0~360 度
     * @returns {string} 山名
     */
    function getMountain(degree) {
        // 正規化角度到 0~360
        let deg = (degree % 360 + 360) % 360;
        
        // 每一山佔 15 度
        // 因為「子」山跨越 0 度 (352.5 ~ 7.5)，為了方便計算索引，偏移 7.5 度
        const index = Math.floor((deg + 7.5) / 15) % 24;
        return TWENTY_FOUR_MOUNTAINS[index];
    }

    /**
     * 計算完整的風水座向資訊
     * @param {number} facingDegree - 手機面對的角度 (向)
     */
    function calculateFengShui(facingDegree) {
        // 1. 取得「向」 (Facing) - 手機頂部朝向的方向
        const facingName = getMountain(facingDegree);
        
        // 2. 取得「坐」 (Sitting) - 手機底部朝向的方向 (與向差180度)
        const sittingDegree = (facingDegree + 180) % 360;
        const sittingName = getMountain(sittingDegree);

        return {
            facing: { name: facingName, degree: facingDegree },
            sitting: { name: sittingName, degree: sittingDegree }
        };
    }

    // =================================================================
    //  SECTION 4: UI 互動與主流程 (UI & Main Flow)
    // =================================================================
    
    const degreeSlider = document.getElementById('degree-slider');
    const degreeDisplay = document.getElementById('degree-display');
    const resetBtn = document.getElementById('reset-btn');
    const startCompassBtn = document.getElementById('start-compass-btn');
    
    const elSittingName = document.getElementById('current-mountain');
    const elFacingName = document.getElementById('current-facing');
    const elSittingDeg = document.getElementById('sitting-degree');
    const elFacingDeg = document.getElementById('facing-degree');

    function updateUI(facingDegree) {
        const deg = Math.round(facingDegree);

        // 更新滑桿
        if(degreeSlider) degreeSlider.value = deg;
        if(degreeDisplay) degreeDisplay.textContent = deg;

        // 計算座向 (這裡傳入原始度數即可，演算法會處理)
        const result = calculateFengShui(deg);

        // 更新文字
        if(elSittingName) elSittingName.textContent = result.sitting.name;
        if(elFacingName) elFacingName.textContent = result.facing.name;
        
        if(elSittingDeg) elSittingDeg.textContent = Math.round(result.sitting.degree);
        if(elFacingDeg) elFacingDeg.textContent = deg;
    }

    function handleOrientation(event) {
        let compassHeading;

        // iOS
        if (event.webkitCompassHeading) {
            compassHeading = event.webkitCompassHeading;
        } 
        // Android
        else if (event.alpha) {
            compassHeading = 360 - event.alpha;
        }

        if (compassHeading !== undefined && compassHeading !== null) {
            updateUI(compassHeading);
            rotateCompass(compassHeading, true);
        }
    }

    function startCompass() {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    } else {
                        alert("權限被拒絕");
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }

    function initApp() {
        console.log("陽宅風水排盤系統 - 南北校正版 v2.1");
        
        // 預設狀態
        updateUI(0);
        // 初始繪製也需要校正，所以呼叫 rotateCompass(0)
        rotateCompass(0, false);

        if (degreeSlider) {
            degreeSlider.addEventListener('input', (e) => {
                const degree = Number(e.target.value);
                updateUI(degree);
                rotateCompass(degree, true); 
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.removeEventListener('deviceorientation', handleOrientation);
                updateUI(0);
                rotateCompass(0, false);
            });
        }

        if (startCompassBtn) {
            startCompassBtn.addEventListener('click', startCompass);
        }
    }

    window.setDegree = function(deg) {
        window.removeEventListener('deviceorientation', handleOrientation);
        updateUI(deg);
        rotateCompass(deg, false);
    }

    initApp();
});