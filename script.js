document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //  SECTION 1: 核心資料與設定
    // =================================================================
    const RADIAL_LAYOUT = {
        center: { x: 280.36, y: 280.36 }, 
        defaultRotation: 0 
    };

    const TWENTY_FOUR_MOUNTAINS = [
        '子', '癸', '丑', '艮', '寅', '甲', 
        '卯', '乙', '辰', '巽', '巳', '丙', 
        '午', '丁', '未', '坤', '申', '庚', 
        '酉', '辛', '戌', '乾', '亥', '壬'
    ];

    const MING_GUA_DATA = {
        1: { name: '坎', group: '東四命' },
        2: { name: '坤', group: '西四命' },
        3: { name: '震', group: '東四命' },
        4: { name: '巽', group: '東四命' },
        6: { name: '乾', group: '西四命' },
        7: { name: '兌', group: '西四命' },
        8: { name: '艮', group: '西四命' },
        9: { name: '離', group: '東四命' }
    };

    let userSettings = {
        year: 1990,
        gender: 'male'
    };

    // =================================================================
    //  SECTION 2: 繪圖邏輯
    // =================================================================
    const svgPlate = document.getElementById('FengShui-plate');
    
    // 取得 HTML 浮動層元素 (這次改用 HTML 顯示，所以不用 SVG createElement)
    const centerMainText = document.getElementById('center-main-text');
    const centerSubText = document.getElementById('center-sub-text');

    /**
     * 更新圓盤正中央的 HTML 文字
     */
    function updateCenterText(text, subText) {
        if (centerMainText) centerMainText.textContent = text;
        if (centerSubText) centerSubText.textContent = subText;
    }

    let targetHeading = 0;
    let isCompassMode = false;
    let animationFrameId = null;

    function renderRotation(degree) {
        if (svgPlate) {
            // 修正：0度=北，SVG預設午在上，需+180轉正。手機右轉盤面左轉(-degree)
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
            // 更新圓心文字
            updateCenterText(`${result.name}命`, result.group);
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
        console.log("陽宅風水排盤 - 圓心固定版 v6.0");
        updateUI(0);
        renderRotation(0);
        
        updateProfile(); // 初始化命卦顯示

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