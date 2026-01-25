document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定
    // =================================================================
    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', 
        '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', 
        '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    // =================================================================
    //  SECTION 2: 繪圖與動畫控制 (核心優化)
    // =================================================================
    const svgPlate = document.getElementById('FengShui-plate');
    
    // 用來記錄當前目標角度 (由感應器提供)
    let targetHeading = 0;
    // 標記是否正在使用電子羅盤模式
    let isCompassMode = false;
    // 動畫循環的 ID
    let animationFrameId = null;

    /**
     * 執行旋轉 (底層函式)
     */
    function renderRotation(degree) {
        if (svgPlate) {
            // 修正邏輯：0度=北(子)，圓盤預設午在上，需轉180度
            // 手機右轉(角度增)，盤面左轉(角度減)
            const finalDegree = -degree + 180;
            svgPlate.style.transform = `rotate(${finalDegree}deg)`;
        }
    }

    /**
     * 動畫循環 (解決卡頓的關鍵)
     * 瀏覽器每秒會呼叫這個函式約 60 次
     */
    function animationLoop() {
        if (!isCompassMode) return; // 如果不是羅盤模式就停止

        // 直接渲染最新角度，移除所有延遲
        renderRotation(targetHeading);

        // 請求下一幀
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    /**
     * 切換模式
     * @param {boolean} active - 是否開啟電子羅盤
     */
    function setCompassMode(active) {
        isCompassMode = active;
        
        if (active) {
            // 開啟羅盤模式：
            // 1. 移除 CSS transition (避免與 JS 搶控制權，造成抖動)
            svgPlate.style.transition = 'none';
            // 2. 啟動動畫循環
            if (!animationFrameId) {
                animationLoop();
            }
        } else {
            // 關閉羅盤模式 (手動模式)：
            // 1. 停止動畫循環
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            // 2. 加回 CSS transition (讓手動操作有優雅的滑動感)
            svgPlate.style.transition = 'transform 0.5s ease-out';
        }
    }

    // =================================================================
    //  SECTION 3: 演算法
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

    function updateUI(degree) {
        // 更新文字與滑桿
        const deg = Math.round(degree);
        if(degreeSlider && document.activeElement !== degreeSlider) {
            // 只有當使用者「沒有」正在拉滑桿時，才自動更新滑桿位置
            degreeSlider.value = deg;
        }
        if(degreeDisplay) degreeDisplay.textContent = deg;

        const result = calculateFengShui(deg);
        if(elSittingName) elSittingName.textContent = result.sitting.name;
        if(elFacingName) elFacingName.textContent = result.facing.name;
        if(elSittingDeg) elSittingDeg.textContent = Math.round(result.sitting.degree);
        if(elFacingDeg) elFacingDeg.textContent = deg;
    }

    // 感應器事件處理 (只負責更新數據，不負責繪圖)
    function handleOrientation(event) {
        let compassHeading;
        
        if (event.webkitCompassHeading) {
            // iOS
            compassHeading = event.webkitCompassHeading;
        } else if (event.alpha) {
            // Android (簡易修正)
            compassHeading = 360 - event.alpha;
        }

        if (compassHeading !== undefined && compassHeading !== null) {
            // 保存角度，讓動畫迴圈去讀取
            targetHeading = compassHeading;
            // 更新文字介面
            updateUI(compassHeading);
        }
    }

    function startCompass() {
        // 先切換到羅盤模式 (移除 CSS transition)
        setCompassMode(true);

        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    } else {
                        alert("權限被拒絕");
                        setCompassMode(false); // 失敗則切回手動
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }

    function initApp() {
        console.log("陽宅風水排盤系統 - 極致滑順版 v3.0");
        updateUI(0);
        renderRotation(0); // 初始畫面

        // 1. 滑桿事件 (手動)
        if (degreeSlider) {
            degreeSlider.addEventListener('input', (e) => {
                // 如果動了滑桿，視為手動模式
                if (isCompassMode) {
                    window.removeEventListener('deviceorientation', handleOrientation);
                    setCompassMode(false); 
                }
                const degree = Number(e.target.value);
                updateUI(degree);
                renderRotation(degree);
            });
        }

        // 2. 歸零按鈕
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                // 停止感應
                window.removeEventListener('deviceorientation', handleOrientation);
                setCompassMode(false); // 切回手動 (開啟 CSS transition)
                
                // 延遲一點點執行，確保 CSS transition 已經生效
                setTimeout(() => {
                    updateUI(0);
                    renderRotation(0);
                }, 10);
            });
        }

        // 3. 啟動按鈕
        if (startCompassBtn) {
            startCompassBtn.addEventListener('click', startCompass);
        }
    }

    // 全域函式 (手動按鈕)
    window.setDegree = function(deg) {
        window.removeEventListener('deviceorientation', handleOrientation);
        setCompassMode(false); // 切回手動
        setTimeout(() => {
            updateUI(deg);
            renderRotation(deg);
        }, 10);
    }

    initApp();
});