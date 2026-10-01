/* ==========================================================================
   ACADEMIC COMMAND CENTER - ULTIMATE CORE SYSTEM (PHASE V1 + V2 INTEGRATED)
   Bản nguyên khối chống sập (Full Architecture)
   ========================================================================== */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
function playAlertSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode); 
    gainNode.connect(audioCtx.destination);
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 1.5);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.start(audioCtx.currentTime); 
    osc.stop(audioCtx.currentTime + 1.5);
}

function playTick() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); 
    gain.connect(audioCtx.destination);
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start(audioCtx.currentTime); 
    osc.stop(audioCtx.currentTime + 0.05);
}

function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if(!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];
    const colors = ['#0ea5e9', '#e879f9', '#10b981', '#f59e0b', '#f43f5e'];
    
    for(let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2, y: canvas.height / 2 + 100,
            r: Math.random() * 6 + 4,
            dx: Math.random() * 15 - 7.5, dy: Math.random() * -15 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleInc: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0
        });
    }
    
    let animationId;
    function animate() {
        animationId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.tiltAngle += p.tiltAngleInc; 
            p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2; 
            p.x += Math.sin(p.tiltAngle) * 2 + p.dx; 
            p.dy += 0.05; 
            p.y += p.dy;
            ctx.beginPath(); 
            ctx.lineWidth = p.r; 
            ctx.strokeStyle = p.color; 
            ctx.moveTo(p.x + p.tilt + p.r, p.y); 
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r); 
            ctx.stroke();
        });
    }
    animate();
    setTimeout(() => { 
        cancelAnimationFrame(animationId); 
        ctx.clearRect(0,0,canvas.width,canvas.height); 
        canvas.style.display = 'none'; 
    }, 5000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active'); 
    document.getElementById('mobile-overlay').classList.toggle('active');
}

function changeColor(color) {
    document.documentElement.setAttribute('data-color', color); 
    localStorage.setItem('plannerColor', color);
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.querySelector(`.color-btn.${color}`); 
    if(activeBtn) activeBtn.classList.add('active');
}
let savedColor = localStorage.getItem('plannerColor') || 'zen'; 
changeColor(savedColor);

function toggleTheme() {
    const body = document.documentElement; 
    const icon = document.getElementById('theme-icon');
    if (body.getAttribute('data-theme') === 'dark') { 
        body.removeAttribute('data-theme'); 
        icon.className = 'fa-solid fa-moon'; 
        localStorage.setItem('plannerTheme', 'light'); 
    } else { 
        body.setAttribute('data-theme', 'dark'); 
        icon.className = 'fa-solid fa-sun'; 
        localStorage.setItem('plannerTheme', 'dark'); 
    }
}

if(localStorage.getItem('plannerTheme') === 'dark') { 
    document.documentElement.setAttribute('data-theme', 'dark'); 
    document.getElementById('theme-icon').className = 'fa-solid fa-sun'; 
} else { 
    document.getElementById('theme-icon').className = 'fa-solid fa-moon'; 
}

// =====================================================================
// KHỞI TẠO BIẾN DỮ LIỆU
// =====================================================================
let goals = JSON.parse(localStorage.getItem('saasGoalsPro')) || [];
let totalSessions = parseInt(localStorage.getItem('saasTotalSessionsPro')) || 0;
let countdowns = JSON.parse(localStorage.getItem('saasCountdownsPro')) || [];
let dailyLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {}; 
let lastActiveDate = localStorage.getItem('saasLastActive') || "";
let currentStreak = parseInt(localStorage.getItem('saasStreak')) || 0;
let lastRestDate = localStorage.getItem('saasLastRest') || "";

// =====================================================================
// KHỞI TẠO BIẾN DỮ LIỆU & ĐỒNG BỘ CHU KỲ TOÀN CẦU (THỨ 2 - CHỦ NHẬT)
// =====================================================================
// 1. Ghi nhận ngày gia nhập án thư để tính tỷ lệ thuận (Pro-rata) cho tân binh
let joinDate = localStorage.getItem('saasJoinDate');
if (!joinDate) {
    let t = new Date(); 
    joinDate = t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
    localStorage.setItem('saasJoinDate', joinDate);
}

// Hàm tính Thứ 2 tuyệt đối an toàn (Không dùng TimezoneOffset)
function getGlobalMonday(dateObj = new Date()) {
    let d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    let day = d.getDay();
    let diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

let currentGlobalMonday = getGlobalMonday();
let cycleStartDate = localStorage.getItem('saasCycleStart');
if (!cycleStartDate || cycleStartDate !== currentGlobalMonday) {
    cycleStartDate = currentGlobalMonday;
    localStorage.setItem('saasCycleStart', cycleStartDate);
}

function getWeeklyTarget() {
    let target = 5.0; 
    let d = new Date(joinDate);
    let joinMon = getGlobalMonday(d);
    
    // Nếu vẫn đang trong tuần đầu tiên tải án thư
    if (joinMon === currentGlobalMonday) {
        let joinDay = d.getDay();
        joinDay = joinDay === 0 ? 7 : joinDay; 
        if (joinDay > 1) {
            let daysRemaining = 7 - joinDay + 1;
            target = parseFloat(((5.0 / 7) * daysRemaining).toFixed(1));
        }
    }
    return target;
}

function getTotalCycleHours() {
    let total = 0; 
    let parts = currentGlobalMonday.split('-'); // Dùng cứng Thứ 2 hiện tại, phớt lờ biến đổi của Firebase
    for (let i = 0; i < 7; i++) { 
        let d = new Date(parts[0], parts[1]-1, parts[2]); 
        d.setDate(d.getDate() + i); 
        let dStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        total += (dailyLogs[dStr] || 0); 
    }
    return total;
}

let isPendingTax = localStorage.getItem('saasPendingTax') === 'true';
let dailyDebtMinutes = parseInt(localStorage.getItem('saasDailyDebt')) || 0;
let isDebtSession = false;
let isIcebreakerPhase = false; 

// Biến nền tảng kinh tế
let standardMinutes = 0; 
let overtimeMinutes = 0;
let isOvertimePhase = false;

let activeGoalId = null;
let timerInterval, countdownInterval, timeLeft = 0, isSessionActive = false, currentDuration = 0, requiredWords = 0;
let isPaused = false, pauseInterval, pauseTimeLeft = 300, sessionEndTime = 0, pauseEndTime = 0, graceEndTime = 0;
let standardSessionCount25 = parseInt(localStorage.getItem('saasS25')) || 0;
let standardSessionCount15 = parseInt(localStorage.getItem('saasS15')) || 0;
let graceInterval, graceTimeLeft = 0, isGracePeriod = false, penaltyMinutes = 0, activeSessionMinutes = 0; 
let reportOpenTime = 0;
let isBreakActive = false; 

// =====================================================================
// ☁️ FIREBASE CLOUD SYNC & AUTH ENGINE (ĐỒNG BỘ ĐA CHIỀU TUYỆT ĐỐI)
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAOmKn9E2JWuKtXeENdVtpbzduVqNyj1oo",
  authDomain: "academic-apex.firebaseapp.com",
  projectId: "academic-apex",
  storageBucket: "academic-apex.firebasestorage.app",
  messagingSenderId: "764165204162",
  appId: "1:764165204162:web:c5426f1b740248eb6cb35b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;
let USER_DOC_ID = "emperor_data_v1"; 
let isSyncing = false;

function loginWithGoogle() {
    firebase.auth().signInWithPopup(provider).catch(error => alert("Lỗi trình ngọc ấn: " + error.message));
}

// =====================================================================
// ĐĂNG XUẤT VÀ THANH TRỪNG DỮ LIỆU
// =====================================================================
function logout() {
    if(confirm("Bạn xác nhận muốn đăng xuất?")) {
        // Lưu lại thiết lập giao diện (Theme/Color)
        let theme = localStorage.getItem('plannerTheme');
        let color = localStorage.getItem('plannerColor');
        
        // ĐỐT SẠCH TOÀN BỘ TÀNG THƯ CÁ NHÂN CỦA TÀI KHOẢN CŨ
        localStorage.clear(); 
        
        // Trả lại thiết lập giao diện
        if(theme) localStorage.setItem('plannerTheme', theme);
        if(color) localStorage.setItem('plannerColor', color);
        
        firebase.auth().signOut().then(() => location.reload());
    }
}

// =====================================================================
// LẮNG NGHE LỆNH ĐĂNG NHẬP (CỔNG GÁC CHỐNG RÒ RỈ)
// =====================================================================
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // KIỂM TRA ĐỔI TÀI KHOẢN ĐỘT NGỘT
        let previousUid = localStorage.getItem('last_uid');
        if (previousUid && previousUid !== user.uid) {
            console.log("Phát hiện tài khoản mới đăng nhập! Đang tải dữ liệu...");
            let theme = localStorage.getItem('plannerTheme');
            let color = localStorage.getItem('plannerColor');
            localStorage.clear();
            if(theme) localStorage.setItem('plannerTheme', theme);
            if(color) localStorage.setItem('plannerColor', color);
        }
        localStorage.setItem('last_uid', user.uid); // Đóng dấu ngọc ấn hiện tại

        currentUser = user;
        USER_DOC_ID = user.uid; 
        
        document.getElementById('login-overlay').style.display = 'none';
        
        let userBadge = document.getElementById('user-auth-badge');
        if(!userBadge) {
            let navMenu = document.querySelector('.nav-menu');
            navMenu.insertAdjacentHTML('afterbegin', `<div id="user-auth-badge" class="stagger-item" style="padding: 0 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; animation-delay: 0.05s;"><img src="${user.photoURL}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--brand-focus); box-shadow: 0 0 10px rgba(234, 88, 12, 0.3);"><div style="display: flex; flex-direction: column;"><span style="color: var(--text-main); font-weight: 800; font-size: 0.95rem; line-height: 1.2;">${user.displayName}</span><span onclick="logout()" style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 4px;" onmouseover="this.style.color='var(--brand-warning)'" onmouseout="this.style.color='var(--text-muted)'"><i class="fa-solid fa-right-from-bracket"></i> Rời án thư</span></div></div>`);
        }

        console.log("🔓 Đăng nhập thành công! Đang kết nối dữ liệu...");
        
        // 🛑 BẢO MẬT: Bắt buộc đợi kéo dữ liệu từ Cloud về xong xuôi rồi mới cho chạy App
        await initialPullFromCloud();
        initializeAppState();
        startCloudListener();
        // --- KÍCH HOẠT MẠNG XÃ HỘI ---
        updateUserStatus('online'); // Đánh dấu đang trực tuyến
        listenForMessages();        // Bật bộ lắng nghe tin nhắn
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
});
let pendingSync = false;

// =====================================================================
// CLOUD SYNC V2 — ĐỒNG BỘ ĐẦY ĐỦ CORE + GAMIFICATION + SETTINGS
// =====================================================================

function readLocalJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : (JSON.parse(raw) ?? fallback);
    } catch (e) {
        console.warn(`Không đọc được JSON localStorage: ${key}`, e);
        return fallback;
    }
}

function readLocalInt(key, fallback = 0) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') return fallback;
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : fallback;
}

function readLocalFloat(key, fallback = 0) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') return fallback;
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
}

function readLocalString(key, fallback = '') {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
}

function collectPrefixedLocalStorage(prefix) {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) result[key] = localStorage.getItem(key);
    }
    return result;
}

function applyOptionalCloudValue(cloudData, key, localKey = key) {
    // Chỉ ghi đè nếu Cloud thực sự có field này.
    // Điều này giúp tài khoản cũ không bị mất dữ liệu local khi migrate sang Sync V2.
    if (Object.prototype.hasOwnProperty.call(cloudData, key)) {
        const value = cloudData[key];
        if (value === null || value === undefined) return;
        localStorage.setItem(localKey, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
}

function buildCloudData(nowTs) {
    return {
        schemaVersion: 2,

        // ===== CORE =====
        goals: readLocalJSON('saasGoalsPro', []),
        totalSessions: readLocalFloat('saasTotalSessionsPro', 0),
        countdowns: readLocalJSON('saasCountdownsPro', []),
        dailyLogs: readLocalJSON('saasDailyLogs', {}),
        streak: readLocalInt('saasStreak', 0),
        lastActive: readLocalString('saasLastActive'),
        s25: readLocalInt('saasS25', 0),
        s15: readLocalInt('saasS15', 0),
        cycleStart: readLocalString('saasCycleStart'),
        weeklyHours: typeof getTotalCycleHours === 'function' ? getTotalCycleHours() : 0,

        // ===== ECONOMY / MARKET =====
        usdBalance: readLocalInt('usdBalance', 0),
        userPortfolio: readLocalJSON('userPortfolio', {}),
        stockMarketPrices: readLocalJSON('stockMarketPrices', {}),
        lastMarketFlucDate: readLocalString('lastMarketFlucDate'),
        imperialEconomyActive: readLocalString('imperialEconomyActive', 'false'),

        // ===== PENALTY / RECOVERY =====
        lastRestDate: readLocalString('saasLastRest'),
        dailyDebt: readLocalInt('saasDailyDebt', 0),
        debtCheckedDate: readLocalString('saasDebtCheckedDate'),
        pendingTax: readLocalString('saasPendingTax', 'false'),
        feePaidDate: readLocalString('saasFeePaidDate'),
        debtReducerVoucher: readLocalString('saasDebtReducerVoucher', 'false'),
        freezes: readLocalInt('saasFreezes', 0),
        achieved10h: readLocalString('saasAchieved10h', 'false'),
        achieved15h: readLocalString('saasAchieved15h', 'false'),
        streakCheckedDate: readLocalString('saasStreakCheckedDate'),
        achComeback: readLocalString('ach_comeback', 'false'),

        // ===== GAMIFICATION =====
        immortalHours: readLocalFloat('saasImmortalHours', 0),
        dailyQuests: readLocalJSON('saasDailyQuests', []),
        questDate: readLocalString('saasQuestDate'),
        xpBoostUntil: readLocalInt('saasXpBoostUntil', 0),
        starHistory: readLocalJSON('saasStarHistory', [5, 5, 5, 5, 5]),

        // ===== DISPATCH / REPUTATION =====
        dispatchRate: readLocalInt('saasDispatchRate', 100),
        consecutiveRejects: readLocalInt('saasConsecutiveRejects', 0),
        dispatchSnoozeUntil: readLocalInt('saasDispatchSnoozeUntil', 0),
        restModeDate: readLocalString('saasRestModeDate'),
        freeSnoozeDate: readLocalString('saasFreeSnoozeDate'),

        // ===== AI / DAILY LIMITS =====
        copilotDate: readLocalString('saasCopilotDate'),
        copilotUsed: readLocalInt('saasCopilotUsed', 0),

        // ===== USER SETTINGS / UI =====
        curfew: readLocalString('saasCurfew'),
        plannerColor: readLocalString('plannerColor'),
        plannerTheme: readLocalString('plannerTheme'),
        blocklist: readLocalJSON('saasBlocklist', []),
        timetable: readLocalJSON('saasTimetable', []),
        joinDate: readLocalString('saasJoinDate'),
        isSealed: readLocalString('isSealed', 'false'),

        // Dynamic KPI achievement flags: saasKPIAchieved_<id>
        kpiAchieved: collectPrefixedLocalStorage('saasKPIAchieved_'),

        // ===== METADATA =====
        lastUpdated: nowTs,
        displayName: currentUser?.displayName || 'Ẩn danh',
        photoURL: currentUser?.photoURL || ''
    };
}

async function syncToCloud() {
    if (!currentUser) return;
    if (isSyncing) {
        pendingSync = true;
        return;
    }

    isSyncing = true;
    try {
        const nowTs = Date.now();
        localStorage.setItem('saasLastUpdated', nowTs);
        const dataToSync = buildCloudData(nowTs);

        await db.collection('academic_apex').doc(USER_DOC_ID).set(dataToSync);
        console.log('☁️ Đã đồng bộ đầy đủ dữ liệu lên Cloud (Sync V2).');

        const statusIcon = document.getElementById('status-box');
        if (statusIcon && !isSessionActive && !isBreakActive && !isGracePeriod) {
            statusIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color:var(--brand-info)"></i><span id="status-msg">Dữ liệu đã được bảo vệ trên Cloud.</span>`;
        }
    } catch (e) {
        console.error('Lỗi đồng bộ Cloud:', e);
    } finally {
        isSyncing = false;
    }

    // Nếu có thay đổi phát sinh trong lúc đang ghi, chạy thêm 1 lượt.
    if (pendingSync) {
        pendingSync = false;
        await syncToCloud();
    }
}

// Hàm giải nén dữ liệu Cloud chép thẳng vào Local
function applyCloudDataToLocal(cloudData) {
    // ===== CORE =====
    localStorage.setItem('saasGoalsPro', JSON.stringify(cloudData.goals || []));
    localStorage.setItem('saasTotalSessionsPro', cloudData.totalSessions ?? 0);
    localStorage.setItem('saasCountdownsPro', JSON.stringify(cloudData.countdowns || []));
    localStorage.setItem('saasDailyLogs', JSON.stringify(cloudData.dailyLogs || {}));
    localStorage.setItem('saasStreak', cloudData.streak ?? 0);
    localStorage.setItem('saasLastActive', cloudData.lastActive || '');
    localStorage.setItem('saasS25', cloudData.s25 ?? 0);
    localStorage.setItem('saasS15', cloudData.s15 ?? 0);
    if (cloudData.cycleStart) localStorage.setItem('saasCycleStart', cloudData.cycleStart);

    // ===== ECONOMY / MARKET =====
    localStorage.setItem('usdBalance', cloudData.usdBalance ?? 0);
    localStorage.setItem('userPortfolio', JSON.stringify(cloudData.userPortfolio || {}));
    localStorage.setItem('stockMarketPrices', JSON.stringify(cloudData.stockMarketPrices || {}));
    applyOptionalCloudValue(cloudData, 'lastMarketFlucDate');
    applyOptionalCloudValue(cloudData, 'imperialEconomyActive');

    // ===== PENALTY / RECOVERY =====
    applyOptionalCloudValue(cloudData, 'lastRestDate', 'saasLastRest');
    applyOptionalCloudValue(cloudData, 'dailyDebt', 'saasDailyDebt');
    applyOptionalCloudValue(cloudData, 'debtCheckedDate', 'saasDebtCheckedDate');
    applyOptionalCloudValue(cloudData, 'pendingTax', 'saasPendingTax');
    applyOptionalCloudValue(cloudData, 'feePaidDate', 'saasFeePaidDate');
    applyOptionalCloudValue(cloudData, 'debtReducerVoucher', 'saasDebtReducerVoucher');
    applyOptionalCloudValue(cloudData, 'freezes', 'saasFreezes');
    applyOptionalCloudValue(cloudData, 'achieved10h', 'saasAchieved10h');
    applyOptionalCloudValue(cloudData, 'achieved15h', 'saasAchieved15h');
    applyOptionalCloudValue(cloudData, 'streakCheckedDate', 'saasStreakCheckedDate');
    applyOptionalCloudValue(cloudData, 'achComeback', 'ach_comeback');

    // ===== GAMIFICATION =====
    applyOptionalCloudValue(cloudData, 'immortalHours', 'saasImmortalHours');
    applyOptionalCloudValue(cloudData, 'dailyQuests', 'saasDailyQuests');
    applyOptionalCloudValue(cloudData, 'questDate', 'saasQuestDate');
    applyOptionalCloudValue(cloudData, 'xpBoostUntil', 'saasXpBoostUntil');
    applyOptionalCloudValue(cloudData, 'starHistory', 'saasStarHistory');

    // ===== DISPATCH / REPUTATION =====
    applyOptionalCloudValue(cloudData, 'dispatchRate', 'saasDispatchRate');
    applyOptionalCloudValue(cloudData, 'consecutiveRejects', 'saasConsecutiveRejects');
    applyOptionalCloudValue(cloudData, 'dispatchSnoozeUntil', 'saasDispatchSnoozeUntil');
    applyOptionalCloudValue(cloudData, 'restModeDate', 'saasRestModeDate');
    applyOptionalCloudValue(cloudData, 'freeSnoozeDate', 'saasFreeSnoozeDate');

    // ===== AI / DAILY LIMITS =====
    applyOptionalCloudValue(cloudData, 'copilotDate', 'saasCopilotDate');
    applyOptionalCloudValue(cloudData, 'copilotUsed', 'saasCopilotUsed');

    // ===== SETTINGS =====
    applyOptionalCloudValue(cloudData, 'curfew', 'saasCurfew');
    applyOptionalCloudValue(cloudData, 'plannerColor');
    applyOptionalCloudValue(cloudData, 'plannerTheme');
    applyOptionalCloudValue(cloudData, 'blocklist', 'saasBlocklist');
    applyOptionalCloudValue(cloudData, 'timetable', 'saasTimetable');
    applyOptionalCloudValue(cloudData, 'joinDate', 'saasJoinDate');
    applyOptionalCloudValue(cloudData, 'isSealed');

    // Dynamic KPI flags
    if (cloudData.kpiAchieved && typeof cloudData.kpiAchieved === 'object') {
        Object.entries(cloudData.kpiAchieved).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    }

    if (cloudData.lastUpdated) localStorage.setItem('saasLastUpdated', cloudData.lastUpdated);

    // ===== RAM STATE =====
    goals = readLocalJSON('saasGoalsPro', []);
    totalSessions = parseFloat(localStorage.getItem('saasTotalSessionsPro')) || 0;
    countdowns = readLocalJSON('saasCountdownsPro', []);
    dailyLogs = readLocalJSON('saasDailyLogs', {});
    lastActiveDate = readLocalString('saasLastActive');
    currentStreak = readLocalInt('saasStreak', 0);
    lastRestDate = readLocalString('saasLastRest');
    cycleStartDate = localStorage.getItem('saasCycleStart');
    timetableData = readLocalJSON('saasTimetable', []);
    dailyDebtMinutes = readLocalInt('saasDailyDebt', 0);
    isPendingTax = localStorage.getItem('saasPendingTax') === 'true';

    // Các biến đã tồn tại ở các module phía dưới.
    if (typeof dispatchRate !== 'undefined') dispatchRate = readLocalInt('saasDispatchRate', 100);
    if (typeof consecutiveRejects !== 'undefined') consecutiveRejects = readLocalInt('saasConsecutiveRejects', 0);
    if (typeof dispatchSnoozeUntil !== 'undefined') dispatchSnoozeUntil = readLocalInt('saasDispatchSnoozeUntil', 0);
    if (typeof starHistory !== 'undefined') starHistory = readLocalJSON('saasStarHistory', [5,5,5,5,5]);
}

async function initialPullFromCloud() {
    try {
        const doc = await db.collection("academic_apex").doc(USER_DOC_ID).get();
        if (doc.exists) {
            const cloudData = doc.data();
            let localUpdated = parseInt(localStorage.getItem('saasLastUpdated')) || 0;
            
            // 🛡️ BẢN VÁ TỐI THƯỢNG: Trảm các mốc thời gian "đến từ tương lai" do F12 gây ra
            if (localUpdated > Date.now()) {
                localUpdated = 0; // Đưa về 0 để ép buộc tải dữ liệu sạch từ mây đè lên
            }

            if (cloudData.lastUpdated >= localUpdated) {
                applyCloudDataToLocal(cloudData);
                console.log("☁️ Đã nạp dữ liệu thành công từ mây!");
            } else {
                console.log("☁️ Dữ liệu Local mới hơn, đang đẩy lên mây...");
                syncToCloud();
            }
        }
    } catch (e) {
        console.error("Lỗi kéo dữ liệu ban đầu:", e);
    }
}

function startCloudListener() {
    db.collection("academic_apex").doc(USER_DOC_ID).onSnapshot((docRef) => {
        if (docRef.exists) {
            const cloudData = docRef.data();
            const localUpdated = parseInt(localStorage.getItem('saasLastUpdated')) || 0;
            
            if (cloudData.lastUpdated > localUpdated) {
                if (isSessionActive || isBreakActive || isGracePeriod) {
                    console.log("☁️ Thiết bị khác có cập nhật, nhưng thiết bị này đang cày ải. Tạm hoãn!");
                    return; 
                }
                console.log("☁️ Có cập nhật từ thiết bị khác. Đang đồng bộ...");
                applyCloudDataToLocal(cloudData);
                checkCycleAndStreak();
                if (document.getElementById('view-dashboard').style.display !== 'none') {
                    renderKPI(); renderDashboard(); renderGamification();
                }
                if (document.getElementById('timetable-room').style.display !== 'none') {
                    renderTimetable();
                }
            }
        }
    });
}

function initializeAppState() {
    initializeImperialEconomy();
    randomDailyMarketFluctuation();
    updateUsdDisplay();
    autoHealDiscrepancy();
    
    // ĐẠO LUẬT THÉP: Ép hệ thống chốt sổ và phạt ngay khi vừa mở án thư
    checkCycleAndStreak(); 

    renderCountdowns(); 
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => { updateCountdownTicks(); updateCurfewCountdown(); }, 1000); 
    switchTab('dashboard'); 
    checkRecovery();
}

// =====================================================================
// HỆ THỐNG GIỚI NGHIÊM
// =====================================================================
let curfewTimeStr = localStorage.getItem('saasCurfew') || '';
if(curfewTimeStr) document.getElementById('curfew-time').value = curfewTimeStr;

function saveCurfew() { 
    curfewTimeStr = document.getElementById('curfew-time').value; 
    localStorage.setItem('saasCurfew', curfewTimeStr); 
    updateCurfewCountdown(); 
}

function isCurfewActive() {
    if (!curfewTimeStr) return false;
    let now = new Date(); 
    let currentHour = now.getHours(); 
    let currentMin = now.getMinutes(); 
    let [cHour, cMin] = curfewTimeStr.split(':').map(Number);
    
    if (currentHour === cHour && currentMin >= cMin) return true;
    if (currentHour > cHour && currentHour <= 23) return true;
    if (currentHour >= 0 && currentHour < 5) return true; 
    return false;
}

function updateCurfewCountdown() {
    const container = document.getElementById('curfew-countdown-container');
    if (!curfewTimeStr) { container.style.display = 'none'; return; }
    
    container.style.display = 'flex'; 
    let now = new Date(); 
    let [cHour, cMin] = curfewTimeStr.split(':').map(Number);
    
    if (isCurfewActive()) { 
        document.getElementById('curfew-timer-text').innerText = "ĐÃ KHÓA"; 
        document.getElementById('curfew-progress').style.strokeDashoffset = 113.1; 
        return; 
    }
    
    let curfewDate = new Date(); 
    curfewDate.setHours(cHour, cMin, 0, 0); 
    let distance = curfewDate - now;
    
    if (distance < 0) { 
        curfewDate.setDate(curfewDate.getDate() + 1); 
        distance = curfewDate - now; 
    }
    
    let h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); 
    let m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); 
    let s = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('curfew-timer-text').innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    let totalSecs = Math.floor(distance / 1000); 
    let maxSecs = 12 * 3600; 
    let pct = Math.max(0, Math.min(1, totalSecs / maxSecs));
    document.getElementById('curfew-progress').style.strokeDashoffset = 113.1 - (pct * 113.1);
}

// =====================================================================
// QUẢN LÝ TÍNH NĂNG NHỎ
// =====================================================================
let isTickOn = false;
function toggleTick() { 
    isTickOn = !isTickOn; 
    document.getElementById('btn-tick').innerHTML = `<i class="fa-solid fa-clock"></i> Âm Tích Tắc: ${isTickOn ? 'BẬT' : 'TẮT'}`; 
}

function activateRestDay() {
    if (isPendingTax || dailyDebtMinutes > 0) { 
        alert("Không thể xả hơi khi đang mang trọng tội!"); 
        return; 
    }

    // 🛡️ VÁ LỖI MÚI GIỜ: DÙNG ĐÚNG GIỜ ĐỊA PHƯƠNG (VIỆT NAM)
    let todayObj = new Date();
    let todayStr = todayObj.getFullYear() + '-' + String(todayObj.getMonth() + 1).padStart(2, '0') + '-' + String(todayObj.getDate()).padStart(2, '0');
    
    if (lastRestDate) {
        let diff = Math.floor((new Date(todayStr) - new Date(lastRestDate)) / (1000 * 60 * 60 * 24));
        if (diff < 7) { 
            alert("Bạn đã dùng quyền Nghỉ Bảo Tồn trong tuần này. Phải duy trì liên tục 7 ngày mới được cấp phép lại!"); 
            return; 
        }
    }
    if (confirm("Kích hoạt Nghỉ Bảo Tồn? Hôm nay bạn chỉ cần hoàn thành 45 phút (3 phiên ngắn) để duy trì chuỗi kỷ luật.")) {
        lastRestDate = todayStr; 
        localStorage.setItem('saasLastRest', lastRestDate);
        if(typeof syncToCloud === 'function') syncToCloud();
        alert("Đã kích hoạt! Tận hưởng ngày nghỉ ngơi, nhưng đừng quên hoàn thành 45 phút nhẹ nhàng nhé.");
    }
}

function saveRecoveryState() {
    if (isSessionActive) {
        localStorage.setItem('saas_recovery', JSON.stringify({
            goalId: activeGoalId, duration: currentDuration, endTime: sessionEndTime, isIce: isIcebreakerPhase,
            isHardcore: isHardcoreTax, isDebt: isDebtSession, penalty: penaltyMinutes, activeMins: activeSessionMinutes,
            isPaused: isPaused, savedTimeLeft: timeLeft // ĐÓNG BĂNG ĐÚNG GIÂY
        }));
    }
}

function clearRecoveryState() { 
    localStorage.removeItem('saas_recovery'); 
}

function checkRecovery() {
    let rec = localStorage.getItem('saas_recovery');
    if (rec) {
        rec = JSON.parse(rec); 
        let now = Date.now();
        if (rec.endTime > now) { 
            resumeSession(rec); 
        } else {
            activeGoalId = rec.goalId; 
            currentDuration = rec.duration;
            isHardcoreTax = rec.isHardcore; 
            isDebtSession = rec.isDebt;
            activeSessionMinutes = rec.activeMins || rec.duration; 
            
            document.getElementById('sidebar').classList.remove('active'); 
            document.getElementById('mobile-overlay').classList.remove('active');
            document.getElementById('focus-room').style.display = 'flex';
            
            let g = goals.find(x => x.id === activeGoalId);
            if(g) document.getElementById('focus-target-info').innerText = `Mục tiêu: ${g.name} | Còn lại: ${g.current.toFixed(2)}h`;
            triggerReportModal();
        }
    }
}

function resumeSession(rec) {
    clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval);
    isSessionActive = true; isPaused = false; isGracePeriod = false; isBreakActive = false;
    
    activeGoalId = rec.goalId; currentDuration = rec.duration; isIcebreakerPhase = rec.isIce;
    isHardcoreTax = rec.isHardcore; isDebtSession = rec.isDebt; penaltyMinutes = rec.penalty || 0;
    activeSessionMinutes = rec.activeMins || rec.duration; 
    
    // Nếu đang tạm dừng mà bị crash, khôi phục lại đúng số giây
    if (rec.isPaused && rec.savedTimeLeft) {
        timeLeft = rec.savedTimeLeft;
        sessionEndTime = Date.now() + (timeLeft * 1000);
    } else {
        sessionEndTime = rec.endTime;
        timeLeft = Math.round((sessionEndTime - Date.now()) / 1000); 
    }
    
    document.body.classList.remove('break-mode'); document.body.classList.add('focus-active');
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');
    document.getElementById('focus-room').style.display = 'flex';
    
    let g = goals.find(x => x.id === activeGoalId);
    if(g) document.getElementById('focus-target-info').innerText = `Mục tiêu: ${g.name} | Còn lại: ${g.current.toFixed(2)}h`;

    let badge = document.getElementById('focus-badge');
    if(isHardcoreTax) badge.innerText = "CHẾ ĐỘ HARDCORE";
    else if(isDebtSession) badge.innerText = "CHẾ ĐỘ TRẢ NỢ";
    else badge.innerText = isIcebreakerPhase ? "PHÁ BĂNG LỰC CẢN (5P)" : "ĐANG TẬP TRUNG";

    toggleButtons(true);
    if (isHardcoreTax || isDebtSession) {
        document.getElementById('btn-cancel').style.display = 'none';
        let btnTax = document.getElementById('btn-tax');
        if(!btnTax) { 
            btnTax = document.createElement('button'); btnTax.className = 'btn-timer'; btnTax.id = 'btn-tax'; 
            document.querySelector('.timer-controls').insertBefore(btnTax, document.getElementById('btn-pause')); 
        }
        btnTax.style.display = 'none';
    }
    
    document.getElementById('btn-pause').style.display = 'flex'; 
    document.getElementById('btn-pause').innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng'; 
    document.getElementById('status-box').querySelector('i').className = "fa-solid fa-spinner fa-spin"; 
    document.getElementById('status-msg').innerText = "Đã khôi phục phiên học. Tuyệt đối không xao nhãng.";
    
    updateDisplay(timeLeft);
    
    timerInterval = setInterval(() => { 
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; }
        if (!isPaused) { 
            if (!isOvertimePhase) {
                timeLeft = Math.round((sessionEndTime - Date.now()) / 1000); 
                if (timeLeft <= 0) { 
                    timeLeft = 0; 
                    if (isIcebreakerPhase) {
                        isIcebreakerPhase = false; playTick(); activeSessionMinutes = 30 + penaltyMinutes; timeLeft = 25 * 60; 
                        sessionEndTime = Date.now() + timeLeft * 1000; badge.innerText = "ĐÃ VÀO GUỒNG (25P)"; 
                        document.getElementById('status-msg').innerText = "Trạng thái Deep Work tự động kích hoạt."; saveRecoveryState(); updateDisplay(timeLeft);
                    } else if (!isHardcoreTax && !isDebtSession) {
                        isOvertimePhase = true; standardMinutes = currentDuration; overtimeMinutes = 0; sessionEndTime = Date.now(); 
                        playAlertSound(); alert("⏳ HẾT GIỜ CHUẨN! Tiếp tục cày lố (Lương x2)!");
                        document.getElementById('session-timer').style.color = "#fbbf24"; document.getElementById('status-msg').innerText = "ĐANG CÀY LỐ. Lương x2 mỗi phút.";
                        let btnCancel = document.getElementById('btn-cancel'); btnCancel.innerHTML = '<i class="fa-solid fa-file-signature"></i> Nộp báo cáo'; btnCancel.style.borderColor = "var(--brand-break)"; btnCancel.style.color = "var(--brand-break)";
                        btnCancel.onclick = () => { clearInterval(timerInterval); triggerReportModal(); };
                    } else { 
                        playAlertSound(); triggerReportModal(); 
                    }
                } 
                if (!isOvertimePhase) { updateDisplay(timeLeft); if (isTickOn && timeLeft % 1 === 0) playTick(); }
            } else {
                let elapsed = Math.round((Date.now() - sessionEndTime) / 1000); overtimeMinutes = Math.floor(elapsed / 60);
                let m = Math.floor(elapsed / 60).toString().padStart(2, '0'); let s = (elapsed % 60).toString().padStart(2, '0');
                document.getElementById('session-timer').innerText = `+${m}:${s}`;
            }
        }
    }, 1000); 
}

// =====================================================================
// ĐẾ CHẾ KINH TẾ (THƯƠNG TRƯỜNG & CHỨNG KHOÁN)
// =====================================================================
let taxPauseBank = 900;

function updateUsdDisplay() {
    let bal = parseInt(localStorage.getItem("usdBalance")) || 0;
    let el = document.getElementById('usd-balance');
    if (el) el.innerText = `${bal}`;
}

function checkAndDeductCourtFee() {
    let todayStr = new Date().toISOString().split('T')[0];
    let feePaidDate = localStorage.getItem("saasFeePaidDate");
    if (feePaidDate === todayStr) return true;

    let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices")) || {};
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    
    // Tính tổng tài sản = Tiền mặt + Cổ phiếu
    let totalStockValue = 0;
    for (let code in portfolio) {
        if (stocks[code]) totalStockValue += (portfolio[code] * stocks[code]);
    }
    let totalAssets = usd + totalStockValue;

    if (totalAssets < 300) {
        // 🛑 BỘ LUẬT MỚI: PHÁ SẢN THAY VÌ TỬ HÌNH
        alert("⚠️ Án phí là $300. Tổng tài sản của bạn chỉ có $" + totalAssets + ".\n\nTÀI SẢN CẠN KIỆT! Bạn đã chính thức PHÁ SẢN.\n⚖️ Hình phạt: Chuỗi kỷ luật về 0. Xóa bỏ mọi khoản nợ để làm lại từ đầu!");
        
        // 1. Tước đoạt chuỗi kỷ luật
        currentStreak = 0;
        localStorage.setItem('saasStreak', 0);
        
        // 2. Ân xá: Xóa sạch nợ và thuế để cắt đứt vòng lặp
        localStorage.removeItem('saasDailyDebt');
        dailyDebtMinutes = 0;
        localStorage.removeItem('saasPendingTax');
        isPendingTax = false;
        
        // 3. Reset Chu kỳ về hôm nay
        localStorage.setItem('saasCycleStart', todayStr);
        localStorage.setItem("usdBalance", 0); // Tịch thu chút tiền lẻ còn lại
        
        // 4. Cấp biên lai để không bị hỏi lại trong hôm nay
        localStorage.setItem("saasFeePaidDate", todayStr);
        
        // 5. ĐỒNG BỘ LÊN MÂY NGAY LẬP TỨC ĐỂ CHẶT ĐỨT VÒNG LẶP
        if (typeof syncToCloud === "function") syncToCloud(); 
        
        location.reload();
        return false;
        
    } else if (usd < 300) {
        alert("⚠️ Tiền mặt chỉ có $" + usd + ", không đủ $300.\n⚖️ Hệ thống sẽ TỰ ĐỘNG BÁN THÁO cổ phiếu để trừ nợ!");
        for (let code in portfolio) {
            while (portfolio[code] > 0 && usd < 300) {
                portfolio[code]--;
                usd += stocks[code];
            }
        }
        localStorage.setItem("userPortfolio", JSON.stringify(portfolio));
        localStorage.setItem("usdBalance", usd - 300);
        localStorage.setItem("saasFeePaidDate", todayStr);
        updateUsdDisplay();
        if (typeof syncToCloud === "function") syncToCloud(); 
        return true;
    } else {
        alert("Đã thu $300. Bạn hãy vào trả nợ trì hoãn!");
        localStorage.setItem("usdBalance", usd - 300);
        localStorage.setItem("saasFeePaidDate", todayStr);
        updateUsdDisplay();
        if (typeof syncToCloud === "function") syncToCloud(); 
        return true;
    }
}

function impactStockMarket(actionType) {
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    if (!stocks) return;
    let multiplier = 1.0;
    
    if (actionType === "SUCCESS") {
        multiplier = 1.005; // Tăng 0.5%
    } else if (actionType === "CANCEL") {
        multiplier = 0.99; // Giảm 1%
    } else if (actionType === "PENALTY") {
        multiplier = 0.85; // Sập 15%
    }
    
    for (let code in stocks) {
        let currentPrice = stocks[code];
        let newPrice = Math.round(currentPrice * multiplier);
        if (newPrice < 500) newPrice = 500; // Khóa đáy
        stocks[code] = newPrice;
    }
    localStorage.setItem("stockMarketPrices", JSON.stringify(stocks));
    renderStockMarket();
    syncToCloud();
}

let currentTradeStock = "";

function renderStockMarket() {
    let container = document.getElementById('stock-market-container');
    if (!container) return;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    if (!stocks) return;
    
    let html = '';
    for (let code in stocks) {
        let price = stocks[code];
        let owned = portfolio[code] || 0;
        html += `<div onclick="openTradeModal('${code}')" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px; min-width: 130px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); flex-shrink: 0; cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='var(--brand-dash)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border)'">
            <div style="font-weight: 800; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px;">${code}</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--brand-trophy);">$${price}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; font-weight: 700;">Đang giữ: <span style="color:var(--text-main)">${owned}</span></div>
        </div>`;
    }
    container.innerHTML = html;
}

function openTradeModal(code) {
    currentTradeStock = code;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    let price = stocks[code];
    let owned = portfolio[code] || 0;
    let usd = parseInt(localStorage.getItem("usdBalance")) || 0;

    document.getElementById('tm-code').innerText = code;
    document.getElementById('tm-price').innerText = "$" + price;
    document.getElementById('tm-owned').innerText = owned;
    document.getElementById('tm-usd').innerText = "$" + usd;
    
    document.getElementById('trade-modal').style.display = 'flex';
}

function closeTradeModal() { 
    document.getElementById('trade-modal').style.display = 'none'; 
}

function buyStock() {
    let code = currentTradeStock;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    let price = stocks[code];
    let usd = parseInt(localStorage.getItem("usdBalance")) || 0;

    if (usd >= price) {
        localStorage.setItem("usdBalance", usd - price);
        portfolio[code] = (portfolio[code] || 0) + 1;
        localStorage.setItem("userPortfolio", JSON.stringify(portfolio));
        
        playTick(); 
        updateUsdDisplay();
        openTradeModal(code); 
        renderStockMarket(); 
        syncToCloud();
    } else {
        alert(`❌ Tài sản của bạn chỉ còn $${usd}, không đủ sức mua 1 cổ phiếu ${code} với giá $${price}!`);
    }
}

function sellStock() {
    let code = currentTradeStock;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    let price = stocks[code];
    let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
    let owned = portfolio[code] || 0;

    if (owned > 0) {
        localStorage.setItem("usdBalance", usd + price);
        portfolio[code] = owned - 1;
        localStorage.setItem("userPortfolio", JSON.stringify(portfolio));
        
        playAlertSound(); 
        updateUsdDisplay();
        openTradeModal(code);
        renderStockMarket();
        syncToCloud();
    } else {
        alert(`❌ Bạn hiện không nắm giữ cổ phiếu ${code} nào để bán khống!`);
    }
}

function initializeImperialEconomy() {
    let isEconomyInitialized = localStorage.getItem("imperialEconomyActive");
    if (!isEconomyInitialized) {
        console.log("Thánh chỉ tới: Kiểm tra và thiết lập kinh tế...");
        
        // 🛑 LÁ CHẮN BẢO VỆ TÀI SẢN CLOUD: 
        // Chỉ cấp tiền tân binh nếu ví THỰC SỰ TRỐNG KHÔNG (Chưa từng kéo từ Cloud về)
        let currentUsd = localStorage.getItem("usdBalance");
        if (currentUsd === null || currentUsd === undefined) {
            let totalMinutes = 0;
            goals.forEach(g => { if (g.reports) { g.reports.forEach(r => { totalMinutes += parseInt(r.type.replace('p', '')); }); } });
            
            let currentStreakDays = currentStreak; 
            let grossIncome = totalMinutes;
            let weeksOnStreak = Math.floor(currentStreakDays / 7); 
            let retroactiveTax = weeksOnStreak * 250;
            let netBalance = grossIncome - retroactiveTax; 
            
            if (netBalance < 0) netBalance = 0;
            localStorage.setItem("usdBalance", netBalance);
        }
        
        // Khởi tạo sàn chứng khoán nếu chưa có
        if (!localStorage.getItem("stockMarketPrices")) {
            const initialStocks = { "ULIS": 950, "HNUE": 920, "BAYM": 880, "IELT": 800, "GPAX": 750, "VSN": 700, "TS10": 650, "TESL": 620, "VOCA": 580, "MYST": 520 };
            localStorage.setItem("stockMarketPrices", JSON.stringify(initialStocks));
        }
        
        if (!localStorage.getItem("userPortfolio")) {
            const userPortfolio = { "ULIS": 0, "HNUE": 0, "BAYM": 0, "IELT": 0, "GPAX": 0, "VSN": 0, "TS10": 0, "TESL": 0, "VOCA": 0, "MYST": 0 };
            localStorage.setItem("userPortfolio", JSON.stringify(userPortfolio));
        }
        
        // Đóng dấu niêm phong để không bao giờ chạy lại hàm này nữa
        localStorage.setItem("imperialEconomyActive", "true");
        if (typeof syncToCloud === 'function') syncToCloud();
    }
}

function randomDailyMarketFluctuation() {
    let lastFluc = localStorage.getItem("lastMarketFlucDate");
    let todayStr = new Date().toISOString().split('T')[0];
    if (lastFluc !== todayStr) {
        let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
        if (stocks) {
            for (let code in stocks) {
                let randomChange = 1 + (Math.random() * 0.06 - 0.03); 
                let newPrice = Math.round(stocks[code] * randomChange);
                if (newPrice < 500) newPrice = 500;
                stocks[code] = newPrice;
            }
            localStorage.setItem("stockMarketPrices", JSON.stringify(stocks));
        }
        localStorage.setItem("lastMarketFlucDate", todayStr);
        syncToCloud();
    }
}

// =====================================================================
// KHỔ SAI & HÌNH PHẠT
// =====================================================================

function completeDebtSession() {
    isSessionActive = false;
    isDebtSession = false;
    localStorage.removeItem('saasDailyDebt');
    localStorage.removeItem('saas_recovery');

    // 1. TÍNH CHUẨN MÚI GIỜ VIỆT NAM (UTC+7)
    let todayObj = new Date();
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    
    // 2. CỘNG VÀO BIỂU ĐỒ NGÀY (An toàn tuyệt đối từ LocalStorage)
    let safeLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {};
    safeLogs[todayStr] = (safeLogs[todayStr] || 0) + (activeSessionMinutes / 60);
    localStorage.setItem('saasDailyLogs', JSON.stringify(safeLogs));
    if (typeof dailyLogs !== 'undefined') dailyLogs = safeLogs;

    // 3. CỘNG VÀO TỔNG GIỜ TRỌN ĐỜI
    let total = parseFloat(localStorage.getItem('saasTotalSessionsPro')) || 0;
    total += (activeSessionMinutes / 60);
    localStorage.setItem('saasTotalSessionsPro', total.toFixed(2));

    // 4. CỘNG TIỀN VÀO NGÂN KHỐ
    let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
    localStorage.setItem('usdBalance', currentUsd + activeSessionMinutes);

    if(typeof syncToCloud === 'function') syncToCloud();

    alert("🎉 ĐÃ TRẢ SẠCH NỢ! " + activeSessionMinutes + " phút mồ hôi đã được cộng vào cả Biểu Đồ Hôm Nay lẫn Tổng Giờ. Bạn đã được tự do!");
    location.reload();
}

function completeTaxSession() {
    isSessionActive = false;
    isHardcoreTax = false;
    localStorage.removeItem('saasPendingTax');
    localStorage.removeItem('saas_recovery');

    let todayObj = new Date();
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    
    let safeLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {};
    safeLogs[todayStr] = (safeLogs[todayStr] || 0) + (activeSessionMinutes / 60);
    localStorage.setItem('saasDailyLogs', JSON.stringify(safeLogs));
    if (typeof dailyLogs !== 'undefined') dailyLogs = safeLogs;

    let total = parseFloat(localStorage.getItem('saasTotalSessionsPro')) || 0;
    total += (activeSessionMinutes / 60);
    localStorage.setItem('saasTotalSessionsPro', total.toFixed(2));

    let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
    localStorage.setItem('usdBalance', currentUsd + activeSessionMinutes);

    if(typeof syncToCloud === 'function') syncToCloud();

    alert("🎉 THUẾ ĐÃ NỘP XONG! " + activeSessionMinutes + " phút mồ hôi đã được cộng vào mọi mặt trận. Giang sơn vững bền!");
    location.reload();
}

function startDebtSession() {
    if (!checkAndDeductCourtFee()) return;
    if(goals.length === 0) { 
        goals.push({ id: Date.now(), name: "KHỔ SAI LÃI KÉP", target: 2, current: 2, reports: [] }); 
    }
    activeGoalId = goals[0].id;
    
    let modal = document.getElementById('shame-modal'); if(modal) modal.style.display = 'none'; 
    let room = document.getElementById('focus-room'); if(room) room.style.display = 'flex';
    let sidebar = document.getElementById('sidebar'); if(sidebar) sidebar.classList.remove('active'); 
    let overlay = document.getElementById('mobile-overlay'); if(overlay) overlay.classList.remove('active');
    
    let info = document.getElementById('focus-target-info'); if(info) info.innerText = "PHIÊN KHỔ SAI LÃI KÉP (NỢ NGÀY)";
    
    let badge = document.getElementById('focus-badge'); 
    if(badge) {
        badge.innerText = "CHẾ ĐỘ TRẢ NỢ"; 
        badge.style.background = "rgba(225, 29, 72, 0.1)"; 
        badge.style.color = "var(--brand-warning)"; 
        badge.style.borderColor = "var(--brand-warning)";
    }

    let btn5 = document.getElementById('btn-5'); if(btn5) btn5.style.display = 'none'; 
    let btn15 = document.getElementById('btn-15'); if(btn15) btn15.style.display = 'none'; 
    let btn25 = document.getElementById('btn-25'); if(btn25) btn25.style.display = 'none'; 
    let btnCancel = document.getElementById('btn-cancel'); if(btnCancel) btnCancel.style.display = 'none';
    let btnTax = document.getElementById('btn-tax'); if(btnTax) btnTax.style.display = 'none';
    
    let btnBack = document.getElementById('btn-focus-back');
    if(btnBack) btnBack.onclick = function() { alert("Đang mang nợ không được phép rời đi!"); }
    
    runDebtSession();
}

function runDebtSession() {
    if (isCurfewActive()) { alert("ĐÃ ĐẾN GIỜ GIỚI NGHIÊM!"); return; }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    isDebtSession = true; 
    taxPauseBank = 180; 
    
    currentDuration = dailyDebtMinutes; 
    activeSessionMinutes = dailyDebtMinutes; 
    timeLeft = dailyDebtMinutes * 60; 
    sessionEndTime = Date.now() + timeLeft * 1000;
    
    isSessionActive = true; 
    isPaused = false; 
    document.body.classList.add('focus-active');
    try { saveRecoveryState(); } catch(e) {}
    
    let btnPause = document.getElementById('btn-pause');
    if(btnPause) {
        btnPause.style.display = 'flex'; 
        btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)';
    }
    
    updateDisplay(timeLeft);
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isCurfewActive()) { 
            clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; 
        }
        if (!isPaused) {
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000);
            if (timeLeft <= 0) { 
                timeLeft = 0; 
                clearInterval(timerInterval); // 🛡️ CHỐT CHẶN TRÁNH KẸT 00:00
                playAlertSound(); 
                completeDebtSession(); // 🟢 GỌI HÀM GIẢI PHÓNG VÀ CỘNG GIỜ
                return;
            }
            updateDisplay(timeLeft); 
            if (isTickOn && timeLeft % 1 === 0) playTick();
        }
    }, 1000);
}

function startTaxSession() {
    if (!checkAndDeductCourtFee()) return;
    if(goals.length === 0) { 
        goals.push({ id: Date.now(), name: "KHÔI PHỤC CHUỖI", target: 2, current: 2, reports: [] }); 
    }
    activeGoalId = goals[0].id;
    
    let modal = document.getElementById('shame-modal'); if(modal) modal.style.display = 'none'; 
    let room = document.getElementById('focus-room'); if(room) room.style.display = 'flex';
    let sidebar = document.getElementById('sidebar'); if(sidebar) sidebar.classList.remove('active'); 
    let overlay = document.getElementById('mobile-overlay'); if(overlay) overlay.classList.remove('active');
    
    let info = document.getElementById('focus-target-info'); if(info) info.innerText = "THIẾT QUÂN LUẬT (90 PHÚT)";
    
    let badge = document.getElementById('focus-badge'); 
    if(badge) {
        badge.innerText = "CHẾ ĐỘ HARDCORE"; 
        badge.style.background = "rgba(225, 29, 72, 0.1)"; 
        badge.style.color = "var(--brand-warning)"; 
        badge.style.borderColor = "var(--brand-warning)";
    }

    let btn5 = document.getElementById('btn-5'); if(btn5) btn5.style.display = 'none'; 
    let btn15 = document.getElementById('btn-15'); if(btn15) btn15.style.display = 'none'; 
    let btn25 = document.getElementById('btn-25'); if(btn25) btn25.style.display = 'none'; 
    let btnCancel = document.getElementById('btn-cancel'); if(btnCancel) btnCancel.style.display = 'none';
    let btnTax = document.getElementById('btn-tax'); if(btnTax) btnTax.style.display = 'none';
    
    let btnBack = document.getElementById('btn-focus-back');
    if(btnBack) btnBack.onclick = function() { alert("Chưa hoàn thành thuế không được phép rời đi!"); }
    
    runHardcoreSession();
}

function runHardcoreSession() {
    if (isCurfewActive()) { alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); return; }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    isHardcoreTax = true; 
    taxPauseBank = 900; 
    
    currentDuration = 90; 
    activeSessionMinutes = 90; 
    timeLeft = 90 * 60; 
    sessionEndTime = Date.now() + timeLeft * 1000;
    
    isSessionActive = true; 
    isPaused = false; 
    document.body.classList.add('focus-active');
    try { saveRecoveryState(); } catch(e) {}
    
    let btnPause = document.getElementById('btn-pause');
    if(btnPause) {
        btnPause.style.display = 'flex'; 
        btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)';
    }
    
    updateDisplay(timeLeft);
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isCurfewActive()) { 
            clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; 
        }
        if (!isPaused) {
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000);
            if (timeLeft <= 0) { 
                timeLeft = 0; 
                clearInterval(timerInterval); // 🛡️ CHỐT CHẶN TRÁNH KẸT 00:00
                playAlertSound(); 
                completeTaxSession(); // 🟢 GỌI HÀM GIẢI PHÓNG VÀ CỘNG GIỜ
                return;
            }
            updateDisplay(timeLeft); 
            if (isTickOn && timeLeft % 1 === 0) playTick();
        }
    }, 1000);
}

// =====================================================================
// XUẤT NHẬP & SAO LƯU
// =====================================================================
function saveAll() { 
    localStorage.setItem('saasGoalsPro', JSON.stringify(goals)); 
    localStorage.setItem('saasTotalSessionsPro', totalSessions); 
    localStorage.setItem('saasCountdownsPro', JSON.stringify(countdowns)); 
    localStorage.setItem('saasDailyLogs', JSON.stringify(dailyLogs));
    localStorage.setItem('saasStreak', currentStreak); 
    localStorage.setItem('saasLastActive', lastActiveDate);
    localStorage.setItem('saasS25', standardSessionCount25); 
    localStorage.setItem('saasS15', standardSessionCount15);
    
    syncToCloud(); // CHÈN THÊM DÒNG NÀY ĐỂ ĐẨY LÊN FIREBASE
}

document.getElementById('report-input').addEventListener('paste', function(e) { 
    e.preventDefault(); 
    alert("Hệ thống từ chối thao tác dán văn bản."); 
});

function exportData() {
    const dataToExport = { 
        goals, totalSessions, countdowns, dailyLogs, 
        streak: currentStreak, lastActive: lastActiveDate, 
        s25: standardSessionCount25, s15: standardSessionCount15, cycleStart: cycleStartDate 
    };
    const dataStr = JSON.stringify(dataToExport); 
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `AcademicPlanner_SaoLuu_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a'); 
    linkElement.setAttribute('href', dataUri); 
    linkElement.setAttribute('download', exportFileDefaultName); 
    linkElement.click();
}

function importData(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.goals) localStorage.setItem('saasGoalsPro', JSON.stringify(data.goals));
            if (data.totalSessions !== undefined) localStorage.setItem('saasTotalSessionsPro', data.totalSessions);
            if (data.countdowns) localStorage.setItem('saasCountdownsPro', JSON.stringify(data.countdowns));
            if (data.dailyLogs) localStorage.setItem('saasDailyLogs', JSON.stringify(data.dailyLogs));
            if (data.streak !== undefined) localStorage.setItem('saasStreak', data.streak);
            if (data.lastActive !== undefined) localStorage.setItem('saasLastActive', data.lastActive);
            if (data.s25 !== undefined) localStorage.setItem('saasS25', data.s25);
            if (data.s15 !== undefined) localStorage.setItem('saasS15', data.s15);
            if (data.cycleStart) localStorage.setItem('saasCycleStart', data.cycleStart);
            syncToCloud();
            alert("Đã phục hồi dữ liệu thành công! Trang web sẽ tự động tải lại."); 
            location.reload();
        } catch (error) { 
            alert("File không hợp lệ hoặc bị lỗi định dạng!"); 
        }
    }; 
    reader.readAsText(file); 
    event.target.value = ''; 
}

// =====================================================================
// ĐẠO LUẬT CHỐT SỔ (CHUẨN THƯƠNG MẠI 5H/TUẦN & 1H/NGÀY)
// =====================================================================
function checkCycleAndStreak() {
    // 🛡️ LÁ CHẮN TÂN BINH & ĐỒNG BỘ
    if (goals.length === 0 && Object.keys(dailyLogs).length === 0) return; 

    let todayObj = new Date(); 
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    
    let yesterdayObj = new Date(todayObj); 
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    let yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    // =========================================================
    // 1. ĐỒNG BỘ CHU KỲ TUẦN (Chốt sổ vào 23:59 Chủ Nhật)
    // =========================================================
    let currentMon = getGlobalMonday();
    if (currentMon !== cycleStartDate && !isPendingTax) {
        exportData(); 

        let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
        if (usd >= 250) {
            localStorage.setItem("usdBalance", usd - 250);
            alert("Đã thu $250 phí duy trì hệ thống cho tuần mới. TỰ ĐỘNG XUẤT FILE SAO LƯU!");
            updateUsdDisplay();
        } else {
            alert("Tài khoản không đủ $250. Các tính năng nâng cao đã bị phong ấn!");
            localStorage.setItem("isSealed", "true");
        }

        // 🛑 VÁ LỖI CỐT LÕI: TÍNH TỔNG GIỜ CỦA TUẦN CŨ (cycleStartDate) ĐỂ CHỐT SỔ, TUYỆT ĐỐI KHÔNG TÍNH TUẦN MỚI
        let oldCycleTotal = 0;
        let parts = cycleStartDate.split('-'); 
        for (let i = 0; i < 7; i++) { 
            let d = new Date(parts[0], parts[1]-1, parts[2]); 
            d.setDate(d.getDate() + i); 
            let dStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            oldCycleTotal += (dailyLogs[dStr] || 0); 
        }

        let target = getWeeklyTarget();
        
        if (oldCycleTotal < target) {
            if (!isPendingTax) impactStockMarket("PENALTY");
            isPendingTax = true; 
            localStorage.setItem('saasPendingTax', 'true'); 
        } else {
            alert(`TỔNG KẾT TUẦN: Hoàn thành ${oldCycleTotal.toFixed(1)}h (Chỉ tiêu: ${target}h). Bắt đầu tuần mới!`);
        }
        
        cycleStartDate = currentMon;
        localStorage.setItem('saasCycleStart', cycleStartDate);
        localStorage.removeItem('saasAchieved10h');
        localStorage.removeItem('saasAchieved15h');
    }

    // =========================================================
    // 2. ĐẠO LUẬT NGÀY (1.0h/ngày) -> KHOAN HỒNG ĐẠI CHÚNG
    // =========================================================
    let checkedDate = localStorage.getItem('saasDebtCheckedDate');
    if (checkedDate !== yesterdayStr) {
        let lastCheckedObj = checkedDate ? new Date(checkedDate) : new Date(yesterdayStr);
        let daysToCheck = Math.floor((new Date(yesterdayStr) - lastCheckedObj) / (1000 * 60 * 60 * 24));
        
        if (daysToCheck <= 0 || isNaN(daysToCheck)) daysToCheck = 1; 

        for (let i = daysToCheck; i >= 1; i--) {
            let d = new Date(todayObj);
            d.setDate(d.getDate() - i);
            let checkStr = d.toISOString().split('T')[0];
            
            // Hạ chuẩn: Chỉ cần đạt 1.0h/ngày là thoát án
            let targetHrs = (typeof getRequiredHoursForDate === 'function') ? getRequiredHoursForDate(d, checkStr) : ((lastRestDate === checkStr) ? 0.25 : 1.0); 
            let hrsDone = dailyLogs[checkStr] || 0;
            
            let deficitHrs = targetHrs - hrsDone;
            // 🛡️ VÁ LỖI THẬP PHÂN: Bỏ qua sai số dưới 0.01h (khoảng 36 giây)
            if (deficitHrs > 0.01) {
                let penaltyMins = Math.ceil(deficitHrs * 60 * 1.5); // Nhân 1.5 lần lãi kép
                if (dailyDebtMinutes === 0) impactStockMarket("PENALTY");
                dailyDebtMinutes += penaltyMins; 
            }
        }
        
        localStorage.setItem('saasDailyDebt', dailyDebtMinutes);
        localStorage.setItem('saasDebtCheckedDate', yesterdayStr);
    }

    // Đếm vắng mặt để set mốc Comeback
    if (lastActiveDate !== "" && lastActiveDate !== todayStr) {
        let lastDateObj = new Date(lastActiveDate); 
        let diffTime = Math.abs(new Date(todayStr) - lastDateObj);
        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays >= 7) localStorage.setItem('ach_comeback', 'true'); 
    }

    // =========================================================
    // 3. HIỂN THỊ ÁN PHẠT ĐÚNG TỘI DANH
    // =========================================================
    if (isPendingTax) {
        document.getElementById('shame-modal').style.display = 'flex';
        let shameTitle = document.querySelector('.shame-content h2'); 
        if(shameTitle) shameTitle.innerText = "THIẾT QUÂN LUẬT (NỘP THUẾ)";
        let shameDesc = document.querySelector('.shame-content p'); 
        if(shameDesc) shameDesc.innerText = "Bạn đã không đạt đủ tiêu chuẩn tự học: Tổng tuần < 5h. Bắt buộc nộp Thuế 90 phút!"; 
        let btnAlt = document.querySelector('.btn-shame-alt'); 
        if (btnAlt) btnAlt.style.display = 'none'; 
        let btnShame = document.querySelector('.btn-shame');
        if(btnShame) { btnShame.innerHTML = '<i class="fa-solid fa-fire-flame-curved"></i> NỘP THUẾ (90P)'; btnShame.onclick = startTaxSession; }
        return;
    }

    if (dailyDebtMinutes > 0) {
        document.getElementById('shame-modal').style.display = 'flex'; 
        let shameTitle = document.querySelector('.shame-content h2'); 
        if(shameTitle) shameTitle.innerText = "ĐẠO LUẬT LÃI KÉP (TIÊU CHUẨN 1.0H)";
        let shameDesc = document.querySelector('.shame-content p'); 
        if(shameDesc) shameDesc.innerHTML = `Bạn tu luyện chưa đủ tiêu chuẩn 1.0h/ngày. Hình phạt Lãi kép dồn toa là <strong>${dailyDebtMinutes} phút</strong>.<br>Phải làm sạch nợ mới được đi tiếp!`;
        let btnAlt = document.querySelector('.btn-shame-alt'); 
        if (btnAlt) btnAlt.style.display = 'none';
        let btnShame = document.querySelector('.btn-shame');
        if(btnShame) { btnShame.innerHTML = `<i class="fa-solid fa-link-slash"></i> BẮT ĐẦU KHỔ SAI (${dailyDebtMinutes}P)`; btnShame.onclick = startDebtSession; }
        return;
    }

    let streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.innerText = currentStreak;
}

// =====================================================================
// KHỐI LOGIC THIẾT QUÂN LUẬT (CƠ CHẾ VƯỢT NGƯỠNG ĐẠI CHÚNG)
// =====================================================================
function renderKPI() {
    let totalCycleHours = getTotalCycleHours(); 
    let targetHours = getWeeklyTarget(); 

    // --- LOGIC GAME HÓA 3 MÀN (Mới) ---
    // Mặc định Màn 1 (0h - 5h)
    let kpiTarget = 5;
    let barColor = "var(--brand-focus)"; // Màu Xanh/Tím
    let phaseText = "KHỞI ĐỘNG (Phần thưởng mặc định)";

    // Xác định Màn chơi dựa trên số giờ thực tế
    if (totalCycleHours >= 10) {
        kpiTarget = 15;
        barColor = "#ef4444"; // Đỏ (Mốc tử chiến)
        phaseText = "BỨT PHÁ (Phần thưởng x3)";
    } else if (totalCycleHours >= 5) {
        kpiTarget = 10;
        barColor = "#f97316"; // Cam (Mốc đột phá)
        phaseText = "TĂNG TỐC (Phần thưởng x2)";
    }

    // Hiệu ứng hoàn thành màn (Đầy thanh)
    if (totalCycleHours === 5 || totalCycleHours === 10 || totalCycleHours >= 15) {
        barColor = "#eab308"; // Vàng rực
    }

    // Tính % tiến độ dựa trên kpiTarget của màn chơi hiện tại
    let pct = Math.min(100, (totalCycleHours / kpiTarget) * 100);
    // ------------------------------------

    let statusEl = document.getElementById('kpi-status'); 
    let fillEl = document.getElementById('kpi-bar-fill'); 
    let msgEl = document.getElementById('kpi-message');
    
    // 👑 LOGIC HIỂN THỊ VƯƠNG MIỆN TRÊN AVATAR (MỐC 15H)
    let userBadge = document.getElementById('user-auth-badge');
    if (userBadge) {
        let hasCrown = localStorage.getItem('saasAchieved15h') === 'true';
        let existingCrown = document.getElementById('avatar-crown');
        if (hasCrown && !existingCrown) {
            let img = userBadge.querySelector('img');
            if (img) {
                img.insertAdjacentHTML('afterend', '<div id="avatar-crown" style="position:absolute; top:-10px; left:12px; font-size:1.2rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)); z-index:10;">👑</div>');
                userBadge.style.position = 'relative';
            }
        } else if (!hasCrown && existingCrown) {
            existingCrown.remove();
        }
    }
    
    if(statusEl && fillEl && msgEl) {
        // Cập nhật giao diện thanh tiến độ theo Màn chơi
        statusEl.innerText = `${totalCycleHours.toFixed(1)} / ${kpiTarget}h`; 
        fillEl.style.width = `${pct}%`;
        fillEl.style.background = barColor;
        fillEl.style.boxShadow = `0 0 10px ${barColor}`;
        
        let now = new Date(); 
        let todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        
        // Tính toán khoảng cách ngày chuẩn tuyệt đối
        let todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let parts = currentGlobalMonday.split('-');
        let cycleMidnight = new Date(parts[0], parts[1]-1, parts[2]);
        
        let diffCycleDays = Math.floor((todayMidnight - cycleMidnight) / (1000 * 60 * 60 * 24)); 
        let daysLeft = Math.max(1, 7 - diffCycleDays); 
        
        // KIỂM TRA MỐC VƯỢT NGƯỠNG AN TOÀN (15H)
        if(totalCycleHours >= 15) {
            msgEl.innerHTML = `<strong style="color:#eab308"><i class="fa-solid fa-crown"></i> BÁ CHỦ TUẦN! Trạng thái: <span style="color:${barColor}">${phaseText}</span></strong>`; 
            
            if(localStorage.getItem('saasKPIAchieved_' + cycleStartDate) !== 'true') { 
                localStorage.setItem('saasKPIAchieved_' + cycleStartDate, 'true'); 
                if (typeof fireConfetti === 'function') fireConfetti(); 
            }
        } else {
            // Tính toán nhịp độ cần thiết cho MỐC TỐI THIỂU (Mốc đầu tiên: 5h hoặc mốc tùy chỉnh targetHours)
            // Lưu ý: Phần phân tích này tính theo mốc cố định của tuần (targetHours), không tính theo mốc game (kpiTarget)
            let remainingHrs = targetHours - totalCycleHours;
            if (remainingHrs < 0) remainingHrs = 0;

            let reqPace = remainingHrs / daysLeft;
            let standardPace = targetHours / 7; 
            let shortfall = remainingHrs - (standardPace * daysLeft);
            
            let paceColor = ""; let paceIcon = ""; let paceStatus = ""; let pctDiffStr = "";
            
            if (reqPace <= standardPace) {
                paceColor = "var(--brand-break)"; paceIcon = "🟢"; paceStatus = "An toàn";
                let diff = Math.round((standardPace - reqPace) / standardPace * 100);
                pctDiffStr = `<strong style="color:var(--brand-break)">-${diff}%</strong>`;
            } else if (reqPace <= standardPace * 1.5) {
                paceColor = "#f59e0b"; paceIcon = "🟡"; paceStatus = "Cần tăng tốc"; 
                let diff = Math.round((reqPace - standardPace) / standardPace * 100);
                pctDiffStr = `<strong style="color:#f59e0b">+${diff}%</strong>`;
            } else {
                paceColor = "var(--brand-warning)"; paceIcon = "🔴"; paceStatus = "Nguy cơ quá tải"; 
                let diff = Math.round((reqPace - standardPace) / standardPace * 100);
                pctDiffStr = `<strong style="color:var(--brand-warning)">+${diff}%</strong>`;
            }

            let insightHtml = `
                <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">
                    Trạng thái cày ải: <strong style="color:${barColor}; text-transform: uppercase;">${phaseText}</strong>
                </div>
                <div style="margin-top: 16px; padding: 16px; background: rgba(0,0,0,0.02); border: 1px solid var(--border); border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 700; margin-bottom: 12px;">
                        Thiếu <strong style="color:var(--text-main)">${remainingHrs.toFixed(1)}h</strong> đến mốc an toàn (${targetHours}h) &middot; Còn lại <strong style="color:var(--text-main)">${daysLeft} ngày</strong>
                    </div>
                    <div style="font-size: 1.05rem; color: var(--text-main); font-weight: 800; margin-bottom: 8px;">
                        ${paceIcon} Cần <span style="color: ${paceColor}">${reqPace.toFixed(1)}h/ngày</span> để đạt mục tiêu
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; display: flex; flex-direction: column; gap: 6px;">
                        <span>Tiêu chuẩn tự học: ${standardPace.toFixed(1)}h/ngày &middot; ${pctDiffStr} <span style="opacity: 0.8">(${paceStatus})</span></span>
                        ${shortfall > 0 && remainingHrs > 0
                            ? `<span style="color: var(--brand-warning);"><i class="fa-solid fa-triangle-exclamation"></i> Nếu duy trì ${standardPace.toFixed(1)}h/ngày &rarr; thiếu ~${shortfall.toFixed(1)}h</span>` 
                            : `<span style="color: var(--brand-break);"><i class="fa-solid fa-check"></i> Duy trì ${standardPace.toFixed(1)}h/ngày là đủ về đích.</span>`}
                    </div>
                </div>
            `;
            msgEl.innerHTML = insightHtml; 
        }
    }
}

function renderGamification() {
    // 1. KHÓA CỨNG MỘT CHIỀU: Giờ tích lũy & Level chỉ tăng, không giảm
    let calcHours = Object.values(dailyLogs).reduce((sum, val) => sum + val, 0); 
    let savedMaxHours = parseFloat(localStorage.getItem('saasImmortalHours')) || 0;
    let totalHoursEarned = Math.max(calcHours, savedMaxHours);
    localStorage.setItem('saasImmortalHours', totalHoursEarned.toFixed(2));
    
    document.getElementById('total-hours-metric').innerText = totalHoursEarned.toFixed(1) + 'h'; 
    document.getElementById('streak-count').innerText = currentStreak;
    
    let displayHours = parseFloat(totalHoursEarned.toFixed(1));

    // 2. TÍNH LEVEL & ĐỔI MÀU MẦM CÂY THEO CẤP BẬC
    let userLevel = Math.floor(displayHours / 2) + 1;
    let rankTitle = "Người Mới"; 
    let rankDesc = ""; 
    let rankColor = "#94a3b8"; 
    let minHrs = 0, nextHrs = 10;

    if (displayHours >= 300) { 
        rankTitle = "Huyền Thoại"; 
        rankColor = "#f59e0b"; 
        minHrs = 300; nextHrs = 1000;
        rankDesc = "Đạt cấp bậc tối thượng"; 
    } else if (displayHours >= 100) { 
        rankTitle = "Bậc Thầy"; 
        rankColor = "#8b5cf6"; 
        minHrs = 100; nextHrs = 300;
        rankDesc = `Còn ${(nextHrs - displayHours).toFixed(1)}h → Huyền Thoại`; 
    } else if (displayHours >= 50) { 
        rankTitle = "Chuyên Gia"; 
        rankColor = "#ea580c"; 
        minHrs = 50; nextHrs = 100;
        rankDesc = `Còn ${(nextHrs - displayHours).toFixed(1)}h → Bậc Thầy`; 
    } else if (displayHours >= 10) { 
        rankTitle = "Học Giả"; 
        rankColor = "#10b981"; 
        minHrs = 10; nextHrs = 50;
        rankDesc = `Còn ${(nextHrs - displayHours).toFixed(1)}h → Chuyên Gia`; 
    } else {
        rankDesc = `Còn ${(10 - displayHours).toFixed(1)}h → Học Giả`;
    }

    let rankProgressPct = Math.min(100, Math.max(0, ((displayHours - minHrs) / (nextHrs - minHrs)) * 100));
    
    // 3. CẬP NHẬT GIAO DIỆN CÂN ĐỐI TRỤC GIỮA (GIỮ NGUYÊN MẦM CÂY)
    document.getElementById('rank-title').innerText = rankTitle; 

    document.getElementById('rank-desc').innerHTML = `
        <div style="width: 100%; max-width: 260px; margin: 6px auto 0 auto; text-transform: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.8rem;">
                <span style="color: ${rankColor}; font-weight: 800;" title="Cấp độ được bảo toàn vĩnh viễn">
                    <i class="fa-solid fa-shield-halved"></i> Lv.${userLevel}
                </span>
                <span style="color: var(--text-muted); font-weight: 700;">${rankDesc}</span>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 100px; overflow: hidden;">
                <div style="width: ${rankProgressPct}%; height: 100%; background: ${rankColor}; border-radius: 100px; transition: width 0.4s ease;"></div>
            </div>
        </div>`; 

    const iconEl = document.getElementById('rank-icon'); 
    iconEl.style.color = rankColor; 
    iconEl.style.filter = `drop-shadow(0 0 12px ${rankColor}80)`;
    
    // 4. BIỂU ĐỒ NHIỆT (HEATMAP 35 NGÀY)
    const grid = document.getElementById('heatmap-grid'); 
    if(grid) grid.innerHTML = ''; 
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    
    let activeDays35 = 0;
    let totalHours35 = 0;

    for(let i = 34; i >= 0; i--) {
        let d = new Date(todayObj); d.setDate(d.getDate() - i); 
        let dateStr = d.toISOString().split('T')[0]; 
        let hours = dailyLogs[dateStr] || 0; 
        let heatClass = "";
        
        if(hours > 0) {
            activeDays35++;
            totalHours35 += hours;
        }

        if(hours > 0 && hours < 1) heatClass = "heat-1"; 
        else if(hours >= 1 && hours < 3) heatClass = "heat-2"; 
        else if(hours >= 3 && hours < 5) heatClass = "heat-3"; 
        else if(hours >= 5) heatClass = "heat-4";
        
        if(grid) grid.innerHTML += `<div class="heat-cell ${heatClass}" title="${dateStr}: ${hours.toFixed(1)}h"></div>`;
    }

    let heatTotalEl = document.getElementById('heat-total-hrs');
    let heatActiveEl = document.getElementById('heat-active-days');
    let heatAvgEl = document.getElementById('heat-avg-hrs');

    if(heatTotalEl) heatTotalEl.innerText = totalHours35.toFixed(1) + 'h';
    if(heatActiveEl) heatActiveEl.innerText = activeDays35 + '/35';
    if(heatAvgEl) heatAvgEl.innerText = (totalHours35 / 35).toFixed(1) + 'h';
}

function renderCountdowns() {
    const strip = document.getElementById('countdown-strip'); 
    strip.innerHTML = '';
    
    if (countdowns.length === 0) { 
        strip.style.display = 'none'; 
        return; 
    }
    
    strip.style.display = 'flex';
    countdowns.forEach((cd, index) => {
        let delay = (index + 1) * 0.1;
        strip.innerHTML += `
        <div class="countdown-card stagger-item" style="animation-delay: ${delay}s" id="cd-card-${cd.id}">
            <button class="btn-delete-cd" onclick="deleteCountdown(${cd.id})"><i class="fa-solid fa-trash"></i></button>
            <div class="countdown-title">${cd.name}</div>
            <div class="time-blocks">
                <div class="time-box"><span class="t-val" id="cd-d-${cd.id}">00</span><span class="t-lbl">Ngày</span></div>
                <div class="time-box"><span class="t-val" id="cd-h-${cd.id}">00</span><span class="t-lbl">Giờ</span></div>
                <div class="time-box"><span class="t-val" id="cd-m-${cd.id}">00</span><span class="t-lbl">Phút</span></div>
                <div class="time-box"><span class="t-val" id="cd-s-${cd.id}">00</span><span class="t-lbl">Giây</span></div>
            </div>
        </div>`;
    }); 
    updateCountdownTicks();
}

function updateCountdownTicks() {
    const now = new Date().getTime();
    countdowns.forEach(cd => {
        const target = new Date(cd.date).getTime(); 
        const distance = target - now;
        const dEl = document.getElementById(`cd-d-${cd.id}`); 
        if (!dEl) return;
        
        if (distance < 0) { 
            dEl.innerText = "00"; 
            document.getElementById(`cd-h-${cd.id}`).innerText = "00"; 
            document.getElementById(`cd-m-${cd.id}`).innerText = "00"; 
            document.getElementById(`cd-s-${cd.id}`).innerText = "00"; 
        } else {
            dEl.innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
            document.getElementById(`cd-h-${cd.id}`).innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
            document.getElementById(`cd-m-${cd.id}`).innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            document.getElementById(`cd-s-${cd.id}`).innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
        }
    });
}

function createNewCountdown() {
    const name = prompt("Tên sự kiện:"); if (!name) return;
    const dateInput = prompt("Nhập ngày (YYYY-MM-DD):"); if (!dateInput) return;
    let timeInput = prompt("Nhập giờ (HH:MM) - Bấm OK để trống:"); 
    if (!timeInput || timeInput.trim() === "") timeInput = "00:00";
    
    const parsedDate = new Date(`${dateInput.trim()}T${timeInput.trim()}:00`);
    if (isNaN(parsedDate.getTime())) { alert("Định dạng không hợp lệ."); return; }
    
    countdowns.push({ id: Date.now(), name: name.toUpperCase(), date: parsedDate.toISOString() }); 
    saveAll(); 
    renderCountdowns();
}

function deleteCountdown(id) { 
    if (confirm("Xóa bộ đếm ngược này?")) { 
        countdowns = countdowns.filter(c => c.id !== id); 
        saveAll(); 
        renderCountdowns(); 
    } 
}

function switchTab(tab) {
    // KHÔNG ÉP MỞ FOCUS ROOM Ở ĐÂY. Nếu có án phạt, hệ thống im lặng từ chối chuyển tab để Shame Modal hiển thị.
    if (isPendingTax || dailyDebtMinutes > 0) { 
        console.log("Án thư đang bị phong tỏa. Chờ xử lý trên màn hình phạt.");
        return; 
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('view-dashboard').style.display = 'none'; 
    document.getElementById('analytics-room').style.display = 'none'; 
    document.getElementById('trophy-room').style.display = 'none'; 
    document.getElementById('trophy-detail').style.display = 'none';
    
    let ttRoom = document.getElementById('timetable-room');
    if(ttRoom) ttRoom.style.display = 'none';
    
    document.getElementById('sidebar').classList.remove('active'); 
    document.getElementById('mobile-overlay').classList.remove('active');

    let navTt = document.getElementById('nav-timetable'); 
    if(navTt) navTt.classList.remove('active');

    if(tab === 'dashboard') {
        document.getElementById('nav-dash').classList.add('active'); 
        document.getElementById('view-dashboard').style.display = 'block';
        document.getElementById('main-title').innerText = "Tổng quan học tập"; 
        document.getElementById('main-desc').innerText = "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.";
        document.getElementById('btn-create-goal').style.display = 'flex'; 
        document.getElementById('btn-create-countdown').style.display = 'flex'; 
        document.getElementById('btn-rest-day').style.display = 'flex';
        renderKPI(); renderDashboard(); renderGamification(); renderStockMarket(); renderRecommendations();
    } else if(tab === 'analytics') {
        document.getElementById('nav-analytics').classList.add('active'); 
        document.getElementById('analytics-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Phân tích Kỷ luật"; 
        document.getElementById('main-desc').innerText = "Nhìn thấu tiến độ. Điều hướng binh lực.";
        document.getElementById('btn-create-goal').style.display = 'none'; 
        document.getElementById('btn-create-countdown').style.display = 'none'; 
        document.getElementById('btn-rest-day').style.display = 'none';
        renderAnalytics();
    } else if(tab === 'trophy') {
        document.getElementById('nav-trophy').classList.add('active'); 
        document.getElementById('trophy-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Lịch Sử Học Tập"; 
        document.getElementById('main-desc').innerText = "Nơi lưu trữ các mục tiêu đã hoàn thành.";
        document.getElementById('btn-create-goal').style.display = 'none'; 
        document.getElementById('btn-create-countdown').style.display = 'none'; 
        document.getElementById('btn-rest-day').style.display = 'none';
        renderTrophyRoom();
    } else if (tab === 'timetable') {
        if(navTt) navTt.classList.add('active');
        document.getElementById('timetable-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Thời Khóa Biểu"; 
        document.getElementById('main-desc').innerText = "Sắp xếp chiến lược. Tối ưu thời gian.";
        document.getElementById('btn-create-goal').style.display = 'none'; 
        document.getElementById('btn-create-countdown').style.display = 'none'; 
        document.getElementById('btn-rest-day').style.display = 'none';
        renderTimetable();
    }
}

window.renderDailyBreakdown = function(targetDate) {
    let content = document.getElementById('daily-breakdown-content'); 
    if (!content) return;
    
    let dayStats = []; 
    let totalDayHours = 0;
    
    goals.forEach(g => {
        if(g.reports) {
            let goalHrs = 0; 
            let sessionsCount = 0;
            g.reports.forEach(r => { 
                if(r.date.startsWith(targetDate)) { 
                    sessionsCount++; 
                    let mins = parseInt(r.type.replace('p','')); 
                    goalHrs += (mins / 60); 
                } 
            });
            if(goalHrs > 0) { 
                totalDayHours += goalHrs; 
                dayStats.push({ name: g.name, hrs: goalHrs, sessions: sessionsCount }); 
            }
        }
    });
    
    dayStats.sort((a,b) => b.hrs - a.hrs);
    
    if(dayStats.length === 0) { 
        content.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px 0;">Không có hoạt động nào trong ngày này.</p>'; 
        return; 
    }
    
    let html = '';
    dayStats.forEach(stat => {
        let pct = (stat.hrs / totalDayHours) * 100;
        html += `<div class="stat-row" style="margin-bottom: 20px;">
                    <div class="stat-label">
                        <span style="font-weight:700; color:var(--text-main);">${stat.name}</span> 
                        <span style="font-size:0.85rem;"><strong style="color:var(--brand-focus);">${stat.hrs.toFixed(1)}h</strong> (${stat.sessions} phiên)</span>
                    </div>
                    <div class="stat-bar" style="height:14px; border-radius:14px;">
                        <div class="stat-fill" style="width: ${pct}%; background:var(--brand-dash); border-radius:14px;"></div>
                    </div>
                 </div>`;
    });
    html += `<div style="text-align:right; font-size:0.95rem; font-weight:700; color:var(--text-muted); margin-top:20px; border-top:1px dashed var(--border); padding-top:16px;">
                Tổng cộng: <strong style="color:var(--text-main); font-size:1.25rem;">${totalDayHours.toFixed(1)}h</strong>
             </div>`;
    content.innerHTML = html;
};

// =====================================================================
// 1. CẬP NHẬT RENDER DASHBOARD (BỔ SUNG GOAL HEALTH, REQUIRED PACE, PROJECTION)
// =====================================================================
function renderDashboard() {
    let activeGoals = goals.filter(g => g.current > 0); const board = document.getElementById('dashboard-grid'); board.innerHTML = '';
    if (activeGoals.length === 0) { board.innerHTML = '<div class="stagger-item" style="animation-delay:0.3s; grid-column: 1/-1; text-align: center; padding: 60px 20px; border: 2px dashed var(--border); border-radius: 24px; color: var(--text-muted); font-size: 1.05rem; font-weight: 500; backdrop-filter: blur(var(--bg-panel-blur));">Chưa có mục tiêu. Hãy khởi tạo mục tiêu mới.</div>'; return; }
    
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayTime = todayObj.getTime();

    activeGoals.forEach((goal, index) => {
        const percent = Math.max(0, Math.min(100, ((goal.target - goal.current) / goal.target) * 100)); 
        const offset = 226.19 - (percent / 100) * 226.19; 
        let delay = (index + 1) * 0.1 + 0.2;
        
        let hoursDone = goal.target - goal.current;
        let createdTime = goal.createdAt ? new Date(goal.createdAt).getTime() : new Date(cycleStartDate).getTime();
        let daysElapsed = Math.max(1, Math.ceil((todayTime - createdTime) / (1000 * 3600 * 24)));
        
        let currentPace = hoursDone / daysElapsed; 
        
        let healthHtml = "";
        let paceText = currentPace > 0 ? `${currentPace.toFixed(2)}h/ngày` : "0.00h/ngày";
        let reqPaceHtml = "";
        let etaText = currentPace > 0 ? `Cần ~${Math.ceil(goal.current / currentPace)} ngày nữa` : "Chưa xác định";

        if (goal.deadline) {
            let deadlineTime = new Date(goal.deadline).getTime();
            let daysLeftToDeadline = Math.ceil((deadlineTime - todayTime) / (1000 * 3600 * 24));
            let requiredPace = daysLeftToDeadline > 0 ? (goal.current / daysLeftToDeadline) : goal.current;
            
            reqPaceHtml = `<div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: 4px;">Cần đạt (Required)</div><div style="font-size: 0.85rem; color: var(--text-main); font-weight: 700;">${requiredPace.toFixed(2)}h/ngày</div>`;

            let projectedTime = currentPace > 0 ? todayTime + (Math.ceil(goal.current / currentPace) * 24 * 3600 * 1000) : Infinity;
            let diffDays = currentPace > 0 ? Math.ceil((deadlineTime - projectedTime) / (1000 * 3600 * 24)) : -Infinity;
            let extraPaceRequired = Math.max(0, requiredPace - currentPace);
            let extraPaceStr = extraPaceRequired > 0 ? `(Cần +${extraPaceRequired.toFixed(2)}h/ngày)` : "";

            if (daysLeftToDeadline < 0) {
                healthHtml = `<span style="background: rgba(239,68,68,0.1); color: #EF4444; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(239,68,68,0.3);">🔴 BEHIND</span>`;
                etaText = `<span style="color:#ef4444">Đã quá hạn! ${extraPaceStr}</span>`;
            } else if (currentPace >= requiredPace) {
                healthHtml = `<span style="background: rgba(16,185,129,0.1); color: #10B981; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(16,185,129,0.3);">🟢 ON TRACK</span>`;
                etaText = `<span style="color:#10b981">Xong sớm ${diffDays} ngày so với Deadline</span>`;
            } else if (currentPace >= requiredPace * 0.7) {
                healthHtml = `<span style="background: rgba(245,158,11,0.1); color: #F59E0B; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(245,158,11,0.3);">🟡 AT RISK</span>`;
                etaText = `<span style="color:#f59e0b">Dự báo trễ ${Math.abs(diffDays)} ngày ${extraPaceStr}</span>`;
            } else {
                healthHtml = `<span style="background: rgba(239,68,68,0.1); color: #EF4444; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(239,68,68,0.3);">🔴 BEHIND</span>`;
                etaText = currentPace === 0 ? `<span style="color:#ef4444">Chưa cày ải ${extraPaceStr}</span>` : `<span style="color:#ef4444">Dự báo trễ ${Math.abs(diffDays)} ngày ${extraPaceStr}</span>`;
            }
        } else {
            healthHtml = `<span style="background: rgba(14,165,233,0.1); color: #0EA5E9; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(14,165,233,0.3);">🔵 NO DEADLINE</span>`;
        }

        board.innerHTML += `
        <div class="goal-card stagger-item" style="animation-delay: ${delay}s" onclick="openGoal(${goal.id})">
            <button class="btn-delete" onclick="deleteGoal(event, ${goal.id})"><i class="fa-solid fa-trash"></i></button>
            <div class="progress-wrapper" style="align-items: flex-start;">
                <div class="progress-circle">
                    <svg viewBox="0 0 85 85">
                        <circle class="progress-bg" cx="42.5" cy="42.5" r="36"></circle>
                        <circle class="progress-bar" cx="42.5" cy="42.5" r="36" style="stroke-dashoffset: ${offset}"></circle>
                    </svg>
                    <div class="progress-text">${percent.toFixed(0)}%</div>
                </div>
                <div class="goal-meta" style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
                        <h3 style="margin: 0; font-size: 1.15rem; line-height: 1.2;">${goal.name}</h3>
                        ${healthHtml}
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Còn lại</div>
                            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 800;">${goal.current.toFixed(1)}h <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">/ ${goal.target}h</span></div>
                        </div>
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Hiện tại (Current)</div>
                            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 800;">${paceText}</div>
                            ${reqPaceHtml}
                        </div>
                        <div style="grid-column: 1 / -1; border-top: 1px solid var(--border); padding-top: 8px; margin-top: -4px;">
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Dự báo Hoàn thành (Projection)</div>
                            <div style="font-size: 0.85rem; font-weight: 700;">${etaText}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

// =====================================================================
// 2. CẬP NHẬT RENDER ANALYTICS (BẢN VÁ LỖI MÚI GIỜ & TREND TUẦN)
// =====================================================================
function renderAnalytics() {
    const room = document.getElementById('analytics-room'); room.innerHTML = ''; let allGoals = goals; 
    
    // 1. CHUẨN HÓA MÚI GIỜ LOCAL (Trảm đứt lệnh +7 tiếng gây lệch ngày)
    let todayObj = new Date(); 
    let todayStr = todayObj.getFullYear() + '-' + String(todayObj.getMonth() + 1).padStart(2, '0') + '-' + String(todayObj.getDate()).padStart(2, '0');
    
    let yesterdayObj = new Date(); yesterdayObj.setDate(yesterdayObj.getDate() - 1); 
    let yesterdayStr = yesterdayObj.getFullYear() + '-' + String(yesterdayObj.getMonth() + 1).padStart(2, '0') + '-' + String(yesterdayObj.getDate()).padStart(2, '0');

    let todayHrs = dailyLogs[todayStr] || 0; let yesterdayHrs = dailyLogs[yesterdayStr] || 0;
    
    // 2. ÉP DÙNG TUẦN THỰC TẾ (Bỏ qua biến cycleStartDate bị kẹt tuần trước)
    let parts = currentGlobalMonday.split('-'); 
    let cycleStartObj = new Date(parts[0], parts[1]-1, parts[2]); 
    
    // Tính toán Trend Tuần
    let thisWeekHrs = 0; for(let i=0; i<7; i++) { let d = new Date(cycleStartObj); d.setDate(d.getDate() + i); let dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); thisWeekHrs += (dailyLogs[dStr] || 0); }
    let lastWeekHrs = 0; for(let i=1; i<=7; i++) { let d = new Date(cycleStartObj); d.setDate(d.getDate() - i); let dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); lastWeekHrs += (dailyLogs[dStr] || 0); }
    
    // Tính toán Trend Tháng (30 Ngày)
    let thisMonthHrs = 0; for(let i=0; i<30; i++) { let d = new Date(); d.setDate(d.getDate() - i); let dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); thisMonthHrs += (dailyLogs[dStr] || 0); }
    let lastMonthHrs = 0; for(let i=30; i<60; i++) { let d = new Date(); d.setDate(d.getDate() - i); let dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); lastMonthHrs += (dailyLogs[dStr] || 0); }

    function getTrendHtml(current, previous, label, delay) {
        let diff = current - previous; let pct = previous > 0 ? (diff / previous) * 100 : (current > 0 ? 100 : 0);
        let color = diff >= 0 ? 'var(--brand-break)' : 'var(--brand-warning)'; let icon = diff >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'; let text = diff >= 0 ? 'Tăng' : 'Giảm';
        if (diff === 0) { color = 'var(--text-muted)'; icon = 'fa-minus'; text = 'Ổn định'; }
        return `<div class="analytics-card stagger-item" style="padding: 28px; animation-delay: ${delay}s"><span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">${label}</span><div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main); margin: 8px 0; letter-spacing: -1px;">${current.toFixed(1)}h</div><div style="font-size: 0.95rem; font-weight: 600; color: ${color}; display: flex; align-items: center; gap: 6px;"><i class="fa-solid ${icon}"></i> ${text} ${Math.abs(pct).toFixed(0)}% so với kỳ trước</div></div>`;
    }

    let trendDayHtml = getTrendHtml(todayHrs, yesterdayHrs, 'Hôm nay vs Hôm qua', 0.1);
    let trendWeekHtml = getTrendHtml(thisWeekHrs, lastWeekHrs, 'Tuần này vs Tuần trước', 0.2);
    let trendMonthHtml = getTrendHtml(thisMonthHrs, lastMonthHrs, '30 Ngày qua vs Kỳ trước', 0.3);
    let trendsHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px; position: relative; z-index: 20;">${trendDayHtml}${trendWeekHtml}${trendMonthHtml}</div>`;

    // 1. PLANNED VS ACTUAL
    let plannedVsActualHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.3s; grid-column: 1 / -1;"><div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px;"><h3>Nhịp độ Tác chiến (Planned vs Actual)</h3><span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-bullseye" style="color: var(--brand-warning);"></i> Định mức: 1.7h / ngày</span></div><div class="bar-chart" style="height: 220px; position: relative;"><div style="position: absolute; top: 57.5%; left: 0; width: 100%; border-top: 2px dashed var(--brand-warning); opacity: 0.6; z-index: 1;"></div>`;
    
    // VẼ CỘT BẰNG NGÀY GIỜ CHUẨN XÁC CỦA ĐỊA PHƯƠNG
    for(let i=6; i>=0; i--) {
        let d = new Date(); d.setDate(d.getDate() - i);
        let dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); 
        let hrs = dailyLogs[dStr] || 0;
        let hPct = Math.min(100, (hrs / 4) * 100); let daysArr = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        let dayName = i === 0 ? "Hôm nay" : daysArr[d.getDay()];
        let barColor = hrs >= 1.7 ? 'var(--brand-break)' : 'var(--brand-dash)';
        plannedVsActualHtml += `<div class="bar-col" style="z-index: 2;"><span style="font-size: 0.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">${hrs > 0 ? hrs.toFixed(1) + 'h' : ''}</span><div class="bar-wrap" style="height: 160px; background: rgba(0,0,0,0.1); border-color: transparent;"><div class="bar-fill" style="height: ${hPct}%; background: ${barColor}; box-shadow: 0 0 10px ${barColor};"></div></div><span style="margin-top: 8px;">${dayName}</span></div>`;
    }
    plannedVsActualHtml += `</div></div>`;

    // 2. VELOCITY & EFFICIENCY
    let velocityHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.4s; grid-column: 1 / -1;"><h3 style="margin-bottom: 24px;">Gia tốc & Hiệu suất (Velocity & Efficiency)</h3><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">`;
    let activeOrLoggedGoals = allGoals.filter(g => (g.target - g.current) > 0);
    if(activeOrLoggedGoals.length === 0) { velocityHtml += `<p style="color:var(--text-muted)">Chưa có dữ liệu cày ải để phân tích gia tốc.</p>`; } 
    else {
        activeOrLoggedGoals.sort((a,b) => (b.target - b.current) - (a.target - a.current)).forEach(g => {
            let logged = g.target - g.current; let efficiency = (1 / g.target) * 100; let totalProg = (logged / g.target) * 100;
            velocityHtml += `<div style="background: var(--bg-hover); border: 1px solid var(--border); border-radius: 16px; padding: 20px; transition: 0.3s;"><h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 16px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${g.name}</h4><div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem;"><span style="color: var(--text-muted); font-weight: 600;">Hiệu suất (Efficiency)</span><span style="color: var(--brand-focus); font-weight: 800; background: rgba(234, 88, 12, 0.1); padding: 4px 10px; border-radius: 8px;">+${efficiency.toFixed(1)}% / giờ</span></div><div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 16px;"><span style="color: var(--text-muted); font-weight: 600;">Tổng mồ hôi</span><span style="color: var(--text-main); font-weight: 800;">${logged.toFixed(1)} giờ</span></div><div class="stat-bar" style="height: 8px; border-radius: 8px; background: rgba(0,0,0,0.1); border: none;"><div class="stat-fill" style="width: ${totalProg}%; background: var(--brand-dash); box-shadow: 0 0 10px var(--brand-dash);"></div></div></div>`;
        });
    }
    velocityHtml += `</div></div>`;

    // DATA GATHERING
    let actualTotalSessions = 0; let actualS15 = 0; let actualS25 = 0; let totalLoggedMins = 0;
    let timeSlots = { sang: 0, chieu: 0, toi: 0, dem: 0 };
    allGoals.forEach(g => { 
        if(g.reports) { 
            actualTotalSessions += g.reports.length; 
            g.reports.forEach(r => { 
                let mins = parseInt(r.type.replace('p', '')) || 0; 
                totalLoggedMins += mins; if(r.type === '15p') actualS15++; if(r.type === '25p') actualS25++; 
                let parts = r.date.split(' - '); 
                if(parts.length === 2) { 
                    let hour = parseInt(parts[1].split(':')[0]); 
                    if(hour >= 5 && hour < 12) timeSlots.sang++; else if(hour >= 12 && hour < 18) timeSlots.chieu++; else if(hour >= 18 && hour < 22) timeSlots.toi++; else timeSlots.dem++; 
                } 
            }); 
        } 
    });
    
    let maxSlot = Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b); 
    let timeName = maxSlot === 'sang' ? 'Sáng (5h-12h)' : maxSlot === 'chieu' ? 'Chiều (12h-18h)' : maxSlot === 'toi' ? 'Tối (18h-22h)' : 'Đêm (22h-5h)';
    let totalSessionsCount = timeSlots.sang + timeSlots.chieu + timeSlots.toi + timeSlots.dem;
    let timePct = totalSessionsCount > 0 ? Math.round((timeSlots[maxSlot] / totalSessionsCount) * 100) : 0;
    let avgSessionMins = actualTotalSessions > 0 ? Math.round(totalLoggedMins / actualTotalSessions) : 0;
    
    let strongestGoal = activeOrLoggedGoals.length > 0 ? activeOrLoggedGoals.reduce((max, g) => ((g.target - g.current)/g.target) > ((max.target - max.current)/max.target) ? g : max) : null;
    
    let criticalGoals = [];
    activeOrLoggedGoals.forEach(g => {
        if (!g.deadline) return; 
        let deadlineTime = new Date(g.deadline).getTime();
        let daysLeftToDeadline = Math.ceil((deadlineTime - todayObj.getTime()) / (1000 * 3600 * 24));
        let logged = g.target - g.current;
        let createdTime = g.createdAt ? new Date(g.createdAt).getTime() : new Date(currentGlobalMonday).getTime();
        let daysElapsed = Math.max(1, Math.ceil((todayObj.getTime() - createdTime) / (1000 * 3600 * 24)));
        let currentPace = logged / daysElapsed;
        if (daysLeftToDeadline < 0 || (currentPace > 0 && todayObj.getTime() + (Math.ceil(g.current / currentPace) * 24 * 3600 * 1000) > deadlineTime) || (g.current > 0 && currentPace === 0 && daysLeftToDeadline > 0)) {
            let reqPace = daysLeftToDeadline > 0 ? (g.current / daysLeftToDeadline) : g.current;
            criticalGoals.push({ goal: g, reqPace: reqPace });
        }
    });

    // 3. TÍCH HỢP ACADEMIC INSIGHTS
    let insightsHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.5s; grid-column: 1 / -1; background: linear-gradient(145deg, var(--bg-hover) 0%, var(--bg-panel) 100%); border-color: var(--brand-focus);">
        <h3 style="margin-bottom: 24px;"><i class="fa-solid fa-wand-magic-sparkles" style="color: var(--brand-focus); margin-right: 8px;"></i> Academic Insights</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">`;
        
    let hasInsight = false;

    if (thisWeekHrs > lastWeekHrs && lastWeekHrs > 0) {
        insightsHtml += `<div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.3); padding: 20px; border-radius: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #10b981; font-size: 1.05rem; font-weight: 800;"><i class="fa-solid fa-arrow-trend-up"></i> Hiệu suất Đang Tăng</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">Tuần này bạn học nhiều hơn tuần trước ${((thisWeekHrs - lastWeekHrs)/lastWeekHrs * 100).toFixed(0)}%. Phong độ đang vào guồng rất tốt!</p>
        </div>`;
        hasInsight = true;
    } else if (thisWeekHrs < lastWeekHrs && lastWeekHrs > 0) {
        insightsHtml += `<div style="background: rgba(245,158,11,0.05); border: 1px solid rgba(245,158,11,0.3); padding: 20px; border-radius: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #f59e0b; font-size: 1.05rem; font-weight: 800;"><i class="fa-solid fa-arrow-trend-down"></i> Hiệu suất Sụt Giảm</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">Tuần này hiệu suất giảm ${((lastWeekHrs - thisWeekHrs)/lastWeekHrs * 100).toFixed(0)}% so với tuần trước. Bạn cần lấy lại sự tập trung.</p>
        </div>`;
        hasInsight = true;
    }

    if (timePct >= 40) {
        insightsHtml += `<div style="background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.3); padding: 20px; border-radius: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #0ea5e9; font-size: 1.05rem; font-weight: 800;"><i class="fa-solid fa-moon"></i> Thời điểm Vàng</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">${timePct}% thời lượng học hiệu quả nhất của ngài diễn ra vào <strong>${timeName}</strong>.</p>
        </div>`;
        hasInsight = true;
    }

    if (criticalGoals.length > 0) {
        let t = criticalGoals[0];
        insightsHtml += `<div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.3); padding: 20px; border-radius: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #ef4444; font-size: 1.05rem; font-weight: 800;"><i class="fa-solid fa-triangle-exclamation"></i> Nguy cơ Trễ Hạn</h4>
            <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">Mục tiêu <strong>${t.goal.name}</strong> đang báo động đỏ.</p>
            <div style="background: var(--bg-panel); padding: 10px; border-radius: 8px; font-size: 0.85rem; color: #ef4444; font-weight: 600; border: 1px solid rgba(239,68,68,0.2);">
                Đề xuất: Tăng tốc độ lên ${t.reqPace.toFixed(2)}h/ngày và ưu tiên cày ải vào ${timeName}.
            </div>
        </div>`;
        hasInsight = true;
    } else if (strongestGoal) {
        insightsHtml += `<div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.3); padding: 20px; border-radius: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #10b981; font-size: 1.05rem; font-weight: 800;"><i class="fa-solid fa-star"></i> Môn học Thế mạnh</h4>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">Bạn đang tiến bộ vượt bậc ở môn <strong>${strongestGoal.name}</strong>.</p>
        </div>`;
        hasInsight = true;
    }

    if(!hasInsight) insightsHtml += `<div style="color: var(--text-muted); font-size: 0.95rem; font-style: italic; padding: 20px; text-align: center; grid-column: 1/-1;">Hệ thống đang tích lũy dữ liệu để đưa ra cố vấn cho bạn...</div>`;
    insightsHtml += `</div></div>`;

    // 4. CÁC THÀNH PHẦN CŨ (Hồ Sơ Học Thuật, ADN, Tổng quan)
    let weakestGoal = criticalGoals.length > 0 ? criticalGoals[0].goal : null;
    let profileHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.6s; display: flex; flex-direction: column;"><h3 style="margin-bottom: 20px;">Hồ Sơ Học Thuật</h3><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1;"><div style="background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; min-width: 0;"><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Giờ vàng</div><div style="font-size: 0.95rem; color: var(--text-main); font-weight: 800;">${timeName}</div></div><div style="background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; min-width: 0;"><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Phiên TB</div><div style="font-size: 0.95rem; color: var(--text-main); font-weight: 800;">${avgSessionMins} phút</div></div><div style="background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; min-width: 0;"><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Sở Trường</div><div style="font-size: 0.95rem; color: var(--brand-break); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${strongestGoal ? strongestGoal.name : 'Chưa có'}</div></div><div style="background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; min-width: 0;"><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Báo Động</div><div style="font-size: 0.95rem; color: var(--brand-warning); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${weakestGoal ? weakestGoal.name : 'Chưa có'}</div></div></div></div>`;
    
    let dnaDiscipline = Math.min(100, Math.round(currentStreak * (100/14))); 
    let activeDays30 = 0; for(let i=0; i<30; i++){ let d = new Date(); d.setDate(d.getDate()-i); let dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); if (dailyLogs[dStr] > 0) activeDays30++; }
    let consistencyScore = Math.round((activeDays30 / 30) * 100);
    let dnaFocus = Math.min(100, Math.round((avgSessionMins / 30) * 100)); 
    let dnaPace = Math.min(100, Math.round(((thisWeekHrs / 7) / 1.7) * 100)); 
    let onTrackGoalsCount = 0; activeOrLoggedGoals.forEach(g => { let logged = g.target - g.current; let createdTime = g.createdAt ? new Date(g.createdAt).getTime() : new Date(currentGlobalMonday).getTime(); let daysElapsed = Math.max(1, Math.ceil((todayObj.getTime() - createdTime) / (1000 * 3600 * 24))); let pace = logged / daysElapsed; if (g.deadline) { let deadlineTime = new Date(g.deadline).getTime(); let daysLeft = Math.ceil((deadlineTime - todayObj.getTime()) / (1000 * 3600 * 24)); let reqPace = daysLeft > 0 ? (g.current / daysLeft) : g.current; if (pace >= reqPace * 0.7) onTrackGoalsCount++; } else { onTrackGoalsCount++; } });
    let dnaControl = activeOrLoggedGoals.length > 0 ? Math.round((onTrackGoalsCount / activeOrLoggedGoals.length) * 100) : 0;
    
    let dnaHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.65s; display: flex; flex-direction: column; justify-content: center;"><h3 style="margin-bottom: 24px;">ADN Học Thuật</h3><div class="stat-row"><div class="stat-label"><span>KỶ LUẬT (Streak)</span> <span>${dnaDiscipline}%</span></div><div class="stat-bar" style="height:10px;"><div class="stat-fill" style="width: ${dnaDiscipline}%; background: var(--brand-dash)"></div></div></div><div class="stat-row"><div class="stat-label"><span>BỀN BỈ (30 Ngày)</span> <span>${consistencyScore}%</span></div><div class="stat-bar" style="height:10px;"><div class="stat-fill" style="width: ${consistencyScore}%; background: var(--brand-break)"></div></div></div><div class="stat-row"><div class="stat-label"><span>TẬP TRUNG (Focus)</span> <span>${dnaFocus}%</span></div><div class="stat-bar" style="height:10px;"><div class="stat-fill" style="width: ${dnaFocus}%; background: var(--brand-focus)"></div></div></div><div class="stat-row"><div class="stat-label"><span>TỐC ĐỘ (Pace)</span> <span>${dnaPace}%</span></div><div class="stat-bar" style="height:10px;"><div class="stat-fill" style="width: ${dnaPace}%; background: #a855f7"></div></div></div><div class="stat-row" style="margin-bottom: 0;"><div class="stat-label"><span>KIỂM SOÁT (Control)</span> <span>${dnaControl}%</span></div><div class="stat-bar" style="height:10px;"><div class="stat-fill" style="width: ${dnaControl}%; background: var(--brand-info)"></div></div></div></div>`;

    let sessionHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.7s"><h3>Tổng quan Phiên học</h3><div style="background: var(--bg-hover); border: 1px solid var(--border); border-radius: 24px; padding: 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px;"><div style="width: 50px; height: 50px; border-radius: 14px; background: var(--bg-panel); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-bento); flex-shrink: 0;"><i class="fa-solid fa-stopwatch" style="color: var(--brand-focus); font-size: 1.5rem;"></i></div><div style="display: flex; flex-direction: column; gap: 2px;"><div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1; letter-spacing: -1px;">${actualTotalSessions}</div><div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Tổng phiên hoàn thành</div></div></div><div style="display: flex; gap: 12px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px; background: var(--bg-hover); padding: 16px; border-radius: 20px; text-align: center; border: 1px solid var(--border);"><div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); display: block; line-height: 1; margin-bottom: 6px;">${actualS15}</div><div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Ngắn (15p)</div></div><div style="flex: 1; min-width: 120px; background: var(--bg-hover); padding: 16px; border-radius: 20px; text-align: center; border: 1px solid var(--border);"><div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); display: block; line-height: 1; margin-bottom: 6px;">${actualS25}</div><div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Chuẩn (25p)</div></div></div></div>`;
    
    let dailyReportHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.8s"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap:10px;"><h3 style="margin-bottom:0;">Chi tiết Tác chiến Ngày</h3><select id="daily-log-select" onchange="renderDailyBreakdown(this.value)" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); padding:8px 12px; border-radius:10px; font-weight:700; outline:none; font-family:inherit; cursor:pointer;"></select></div><div id="daily-breakdown-content"><p style="color:var(--text-muted); text-align:center; padding: 20px 0;">Vui lòng chọn một ngày để phân tích.</p></div></div>`;

    // 🔴 HỢP NHẤT TOÀN BỘ VÀO GIAO DIỆN
    room.innerHTML = `${trendsHtml}
        <div class="analytics-grid">
            ${plannedVsActualHtml}
            ${velocityHtml}
            ${insightsHtml}     
            ${profileHtml}      
            ${dnaHtml}          
            ${sessionHtml}
            ${dailyReportHtml}
        </div>`;

    let allDates = new Set();
    allGoals.forEach(g => { if(g.reports) { g.reports.forEach(r => { let dStr = r.date.split(' - ')[0]; allDates.add(dStr); }); } });

    let selectEl = document.getElementById('daily-log-select');
    if(allDates.size === 0) { selectEl.innerHTML = '<option value="">Chưa có dữ liệu</option>'; selectEl.disabled = true; } 
    else {
        let sortedDates = Array.from(allDates).sort((a, b) => {
            let [d1, m1, y1] = a.split('/'); let dateA = new Date(y1, m1-1, d1);
            let [d2, m2, y2] = b.split('/'); let dateB = new Date(y2, m2-1, d2);
            return dateB - dateA;
        });
        sortedDates.forEach((d, i) => { let opt = document.createElement('option'); opt.value = d; opt.innerText = i === 0 ? d + " (Gần nhất)" : d; selectEl.appendChild(opt); });
        renderDailyBreakdown(sortedDates[0]);
    }
}

// =====================================================================
// TÍCH HỢP PHASE V1 VÀO DASHBOARD (THÊM DEADLINE & ETA)
// =====================================================================
function createNewGoal() {
    const name = prompt("Tên mục tiêu (VD: Lịch sử Đảng):"); 
    if (!name) return;
    const target = parseFloat(prompt("Định mức thời gian (Số giờ - VD: 20):")); 
    if (isNaN(target) || target <= 0) return alert("Không hợp lệ.");
    
    // Yêu cầu Hạn Chót (Deadline)
    const deadlineInput = prompt("Hạn chót (YYYY-MM-DD) - Nếu không có hãy để trống và bấm OK:");
    let deadline = null;
    if (deadlineInput && deadlineInput.trim() !== "") {
        const parsed = new Date(deadlineInput.trim());
        if (!isNaN(parsed.getTime())) deadline = parsed.toISOString().split('T')[0];
    }
    
    let todayObj = new Date(); 
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    const createdAt = todayObj.toISOString().split('T')[0];

    goals.push({ 
        id: Date.now(), 
        name: name, 
        target: target, 
        current: target, 
        reports: [], 
        deadline: deadline, 
        createdAt: createdAt 
    });
    
    saveAll(); 
    renderDashboard(); 
    renderGamification();
}

function renderDashboard() {
    let activeGoals = goals.filter(g => g.current > 0); 
    const board = document.getElementById('dashboard-grid'); 
    board.innerHTML = '';
    
    if (activeGoals.length === 0) { 
        board.innerHTML = '<div class="stagger-item" style="animation-delay:0.3s; grid-column: 1/-1; text-align: center; padding: 60px 20px; border: 2px dashed var(--border); border-radius: 24px; color: var(--text-muted); font-size: 1.05rem; font-weight: 500; backdrop-filter: blur(var(--bg-panel-blur));">Chưa có mục tiêu. Hãy khởi tạo mục tiêu mới.</div>'; 
        return; 
    }
    
    let todayObj = new Date(); 
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayTime = todayObj.getTime();

    activeGoals.forEach((goal, index) => {
        const percent = Math.max(0, Math.min(100, ((goal.target - goal.current) / goal.target) * 100)); 
        const offset = 226.19 - (percent / 100) * 226.19; 
        let delay = (index + 1) * 0.1 + 0.2;
        
        let hoursDone = goal.target - goal.current;
        let createdTime = goal.createdAt ? new Date(goal.createdAt).getTime() : new Date(cycleStartDate).getTime();
        let daysElapsed = Math.max(1, Math.ceil((todayTime - createdTime) / (1000 * 3600 * 24)));
        
        let currentPace = hoursDone / daysElapsed; 
        let etaDays = currentPace > 0 ? Math.ceil(goal.current / currentPace) : "∞";
        
        let healthHtml = "";
        let paceText = currentPace > 0 ? `${currentPace.toFixed(1)}h/ngày` : "0.0h/ngày";
        let etaText = etaDays !== "∞" ? `Còn ~${etaDays} ngày` : "Chưa xác định";

        if (goal.deadline) {
            let deadlineTime = new Date(goal.deadline).getTime();
            let daysLeftToDeadline = Math.ceil((deadlineTime - todayTime) / (1000 * 3600 * 24));
            let requiredPace = daysLeftToDeadline > 0 ? (goal.current / daysLeftToDeadline) : goal.current;
            
            if (daysLeftToDeadline < 0) {
                healthHtml = `<span style="background: rgba(239,68,68,0.1); color: #EF4444; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(239,68,68,0.3);"><i class="fa-solid fa-skull"></i> QUÁ HẠN</span>`;
            } else if (currentPace >= requiredPace) {
                healthHtml = `<span style="background: rgba(16,185,129,0.1); color: #10B981; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(16,185,129,0.3);"><i class="fa-solid fa-check"></i> ỔN ĐỊNH</span>`;
            } else if (currentPace >= requiredPace * 0.7) {
                healthHtml = `<span style="background: rgba(245,158,11,0.1); color: #F59E0B; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(245,158,11,0.3);"><i class="fa-solid fa-triangle-exclamation"></i> RỦI RO</span>`;
            } else {
                healthHtml = `<span style="background: rgba(239,68,68,0.1); color: #EF4444; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(239,68,68,0.3);"><i class="fa-solid fa-fire"></i> CHẬM TIẾN ĐỘ</span>`;
            }
        } else {
            healthHtml = `<span style="background: rgba(14,165,233,0.1); color: #0EA5E9; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(14,165,233,0.3);"><i class="fa-solid fa-infinity"></i> TỰ DO</span>`;
        }

        board.innerHTML += `
        <div class="goal-card stagger-item" style="animation-delay: ${delay}s" onclick="openGoal(${goal.id})">
            <button class="btn-delete" onclick="deleteGoal(event, ${goal.id})"><i class="fa-solid fa-trash"></i></button>
            <div class="progress-wrapper" style="align-items: flex-start;">
                
                <div class="progress-circle">
                    <svg viewBox="0 0 85 85">
                        <circle class="progress-bg" cx="42.5" cy="42.5" r="36"></circle>
                        <circle class="progress-bar" cx="42.5" cy="42.5" r="36" style="stroke-dashoffset: ${offset}"></circle>
                    </svg>
                    <div class="progress-text">${percent.toFixed(0)}%</div>
                </div>

                <div class="goal-meta" style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
                        <h3 style="margin: 0; font-size: 1.15rem; line-height: 1.2;">${goal.name}</h3>
                        ${healthHtml}
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Còn lại</div>
                            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 800;">${goal.current.toFixed(1)}h <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">/ ${goal.target}h</span></div>
                        </div>
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Tốc độ (Pace)</div>
                            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 800;">${paceText}</div>
                        </div>
                        <div style="grid-column: 1 / -1; border-top: 1px solid var(--border); padding-top: 8px; margin-top: -4px;">
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Dự kiến xong (ETA)</div>
                            <div style="font-size: 0.85rem; color: var(--brand-info); font-weight: 700;">${etaText}</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
    });
}

// =====================================================================
// NÂNG CẤP BỨC TƯỜNG DANH VỌNG: 24 CHUYÊN MỤC THÀNH TỰU (CHAMPIONS LEAGUE)
// =====================================================================
function renderTrophyRoom() {
    const room = document.getElementById('trophy-room'); 
    room.innerHTML = '';
    
    // 1. THU THẬP SỐ LIỆU ĐỂ MỞ KHÓA THÀNH TỰU
    let totalCompletedGoals = goals.filter(g => g.current <= 0).length;
    let totalHours = Object.values(dailyLogs).reduce((a, b) => a + b, 0);
    let totalPomodoros = standardSessionCount25; 
    let nightSessions = 0;
    let morningSessions = 0;
    let totalGoals = goals.length;
    let maxGoalTarget = goals.length > 0 ? Math.max(...goals.map(g => g.target)) : 0;
    let currentUsd = parseInt(localStorage.getItem("usdBalance")) || 0;
    let totalReports = goals.reduce((sum, g) => sum + (g.reports ? g.reports.length : 0), 0);
    
    goals.forEach(g => {
        if (g.reports) {
            g.reports.forEach(r => {
                let parts = r.date.split(' - ');
                if (parts.length === 2) {
                    let hour = parseInt(parts[1].split(':')[0]);
                    if (hour >= 18 || hour < 5) nightSessions++; 
                    if (hour >= 5 && hour < 12) morningSessions++;
                }
            });
        }
    });

    // 2. KHAI BÁO DANH SÁCH 24 THÀNH TỰU (CHIA LÀM 4 HẠNG)
    const achievements = [
        // 🥉 TIER 1: TÂN BINH (DỄ) - Màu Kẽm
        { id: 'first_blood', icon: '🩸', name: 'First Blood', desc: 'Mục tiêu đầu tiên', unlocked: totalGoals >= 1, color: '#a1a1aa' },
        { id: 'apprentice', icon: '📖', name: 'Apprentice', desc: '10h Tập trung', unlocked: totalHours >= 10, color: '#a1a1aa' },
        { id: 'warm_up', icon: '🚶', name: 'Warm Up', desc: '10 Pomodoro', unlocked: totalPomodoros >= 10, color: '#a1a1aa' },
        { id: 'early_bird', icon: '🌅', name: 'Early Bird', desc: '10 Phiên Sáng', unlocked: morningSessions >= 10, color: '#a1a1aa' },
        { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: '10 Phiên Tối', unlocked: nightSessions >= 10, color: '#a1a1aa' },
        { id: 'first_victory', icon: '🏅', name: 'First Victory', desc: 'Xong 1 Mục tiêu', unlocked: totalCompletedGoals >= 1, color: '#a1a1aa' },
        
        // 🥈 TIER 2: CHUYÊN NGHIỆP (TRUNG BÌNH) - Màu Bạc
        { id: 'silver_streak', icon: '⚡', name: 'Silver Streak', desc: 'Chuỗi 14 Ngày', unlocked: currentStreak >= 14, color: '#94a3b8' },
        { id: 'deep_worker', icon: '⏱️', name: 'Deep Worker', desc: '50 Pomodoro', unlocked: totalPomodoros >= 50, color: '#94a3b8' },
        { id: 'scholar', icon: '🎓', name: 'Scholar', desc: '50h Tập trung', unlocked: totalHours >= 50, color: '#94a3b8' },
        { id: 'bounty_hunter', icon: '🎯', name: 'Bounty Hunter', desc: 'Xong 5 Mục tiêu', unlocked: totalCompletedGoals >= 5, color: '#94a3b8' },
        { id: 'capitalist', icon: '💰', name: 'Capitalist', desc: 'Tích lũy $1000', unlocked: currentUsd >= 1000, color: '#94a3b8' },
        { id: 'comeback', icon: '💪', name: 'Comeback', desc: 'Trở lại sau 7 ngày off', unlocked: localStorage.getItem('ach_comeback') === 'true', color: '#94a3b8' },

        // 🥇 TIER 3: TINH ANH (KHÓ) - Màu Vàng Gold
        { id: 'iron_will', icon: '🔥', name: 'Iron Will', desc: 'Chuỗi 30 Ngày', unlocked: currentStreak >= 30, color: '#eab308' },
        { id: 'century', icon: '💯', name: 'Century', desc: '100h Tập trung', unlocked: totalHours >= 100, color: '#eab308' },
        { id: 'veteran', icon: '🛡️', name: 'Veteran', desc: '100 Pomodoro', unlocked: totalPomodoros >= 100, color: '#eab308' },
        { id: 'sherlock', icon: '🕵️‍♂️', name: 'Sherlock', desc: 'Ghi 50 Báo cáo', unlocked: totalReports >= 50, color: '#eab308' },
        { id: 'morning_star', icon: '☀️', name: 'Morning Star', desc: '50 Phiên Sáng', unlocked: morningSessions >= 50, color: '#eab308' },
        { id: 'conqueror', icon: '⚔️', name: 'Conqueror', desc: 'Xong 10 Mục tiêu', unlocked: totalCompletedGoals >= 10, color: '#eab308' },

        // 💎 TIER 4: HUYỀN THOẠI (CỰC KHÓ - CHAMPIONS LEAGUE) - Màu Kim Cương / Đỏ Ruby
        { id: 'bavarian_machine', icon: '🚜', name: 'Bavarian Machine', desc: '300h Tập trung', unlocked: totalHours >= 300, color: '#0ea5e9' },
        { id: 'marathon', icon: '🏃‍♂️', name: 'Marathon Runner', desc: 'Tạo Mục tiêu >100h', unlocked: maxGoalTarget >= 100, color: '#0ea5e9' },
        { id: 'diamond_streak', icon: '💎', name: 'Diamond Streak', desc: 'Chuỗi 90 Ngày', unlocked: currentStreak >= 90, color: '#0ea5e9' },
        { id: 'time_lord', icon: '⏳', name: 'Time Lord', desc: '500 Pomodoro', unlocked: totalPomodoros >= 500, color: '#0ea5e9' },
        { id: 'tycoon', icon: '🏦', name: 'Tycoon', desc: 'Tích lũy $5000', unlocked: currentUsd >= 5000, color: '#0ea5e9' },
        { id: 'the_apex', icon: '👑', name: 'The Apex', desc: 'Đạt 1000h Kỷ luật', unlocked: totalHours >= 1000, color: '#ef4444' }
    ];

    let unlockedCount = achievements.filter(a => a.unlocked).length;
    let totalCount = achievements.length;

    // 3. VẼ GIAO DIỆN BẢNG VÀNG THÀNH TỰU
    let achHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.1s; margin-bottom: 32px; background: linear-gradient(145deg, var(--bg-hover) 0%, var(--bg-panel) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main); text-transform: uppercase; letter-spacing: 1px; margin: 0;"><i class="fa-solid fa-medal" style="color: var(--brand-trophy); margin-right: 8px;"></i> Bảng Vàng Danh Hiệu</h3>
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--brand-trophy); background: rgba(245, 158, 11, 0.1); padding: 6px 14px; border-radius: 100px; border: 1px solid rgba(245, 158, 11, 0.3);">${unlockedCount} / ${totalCount} Cúp</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px;">`;

    achievements.forEach((a, i) => {
        let delay = 0.15 + (i * 0.02);
        if (a.unlocked) {
            // Khi mở khóa, thẻ bài sẽ tỏa sáng với viền và màu theo đúng Tier (Đồng/Bạc/Vàng/Kim Cương)
            achHtml += `<div style="background: var(--bg-panel); border: 2px solid ${a.color}; border-radius: 16px; padding: 20px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 4px 20px ${a.color}30; animation: fadeIn 0.5s ease backwards; animation-delay: ${delay}s; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: ${a.color}; opacity: 0.15; border-radius: 50%; filter: blur(12px);"></div>
                <div style="font-size: 2.8rem; margin-bottom: 12px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); line-height: 1;">${a.icon}</div>
                <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem; margin-bottom: 4px; z-index: 2;">${a.name}</div>
                <div style="font-size: 0.7rem; color: ${a.color}; font-weight: 800; z-index: 2;">${a.desc}</div>
            </div>`;
        } else {
            // Khi chưa đạt, thẻ bài nằm phủ sương xám xịt (Locked)
            achHtml += `<div style="background: var(--bg-hover); border: 1px dashed var(--border); border-radius: 16px; padding: 20px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; opacity: 0.5; filter: grayscale(1); transition: 0.3s; animation: fadeIn 0.5s ease backwards; animation-delay: ${delay}s;">
                <div style="font-size: 2.8rem; margin-bottom: 12px; line-height: 1;">${a.icon}</div>
                <div style="font-weight: 800; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">${a.name}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;"><i class="fa-solid fa-lock"></i> Chưa đạt</div>
            </div>`;
        }
    });
    achHtml += `</div></div>`;
    
    // 4. VẼ GIAO DIỆN KHO LƯU TRỮ MỤC TIÊU CŨ BÊN DƯỚI
    let completedGoals = goals.filter(g => g.current <= 0); 
    let trophyHtml = `<h3 class="stagger-item" style="font-size: 1.1rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; animation-delay: 0.6s;"><i class="fa-solid fa-box-archive" style="color: var(--text-muted); margin-right: 8px;"></i> Kho Mục Tiêu Đã Hoàn Thành</h3>`;
    
    if (completedGoals.length === 0) { 
        trophyHtml += `<div class="locked-state stagger-item" style="animation-delay: 0.65s"><i class="fa-solid fa-hourglass-empty"></i><h2>Chưa Có Mục Tiêu Nào Hoàn Thành</h2><p>Lịch sử vinh quang của ngài sẽ được khắc lên đây.</p></div>`; 
    } else {
        trophyHtml += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">`;
        completedGoals.forEach((g, index) => {
            let reportCount = g.reports ? g.reports.length : 0; 
            let delay = 0.65 + (index * 0.1);
            trophyHtml += `<div class="trophy-card stagger-item" style="animation-delay: ${delay}s" onclick="viewTrophyDetail(${g.id})"><div class="trophy-header"><h3><i class="fa-solid fa-trophy" style="color: var(--brand-trophy);"></i>${g.name}</h3><span class="trophy-badge">ĐÃ HOÀN THÀNH</span></div><p style="color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-clock" style="margin-right: 6px;"></i> Quy mô: ${g.target} Giờ &nbsp;&nbsp;•&nbsp;&nbsp; <i class="fa-solid fa-file-lines" style="margin-right: 6px;"></i> Báo cáo: ${reportCount}</p></div>`;
        });
        trophyHtml += `</div>`;
    }

    room.innerHTML = achHtml + trophyHtml;
}

function viewTrophyDetail(id) {
    document.getElementById('trophy-room').style.display = 'none'; 
    document.getElementById('trophy-detail').style.display = 'block';
    
    let g = goals.find(x => x.id === id); 
    let reports = g.reports || [];
    
    document.getElementById('td-title').innerText = g.name; 
    document.getElementById('td-meta').innerText = `Hoàn thành mốc ${g.target}h - Lưu trữ ${reports.length} báo cáo.`;
    
    let tl = document.getElementById('td-timeline'); 
    tl.innerHTML = '';
    
    if (reports.length === 0) { 
        tl.innerHTML = '<p class="stagger-item" style="animation-delay:0.4s; color: var(--text-muted); font-style: italic;">Không có dữ liệu báo cáo.</p>'; 
    } else { 
        [...reports].reverse().forEach((rep, index) => { 
            let delay = (index * 0.1) + 0.4; 
            tl.innerHTML += `<div class="timeline-item stagger-item" style="animation-delay:${delay}s">
                <div class="tl-meta">
                    <span><i class="fa-solid fa-calendar-day"></i> ${rep.date}</span>
                    <span style="color: var(--brand-trophy);"><i class="fa-solid fa-bolt"></i> Phiên ${rep.type}</span>
                </div>
                <div class="tl-content">${rep.text}</div>
            </div>`; 
        }); 
    }
}

function deleteGoal(e, id) { 
    e.stopPropagation(); 
    if (confirm("Xóa mục tiêu?")) { 
        goals = goals.filter(g => g.id !== id); 
        saveAll(); 
        if(document.getElementById('view-dashboard').style.display !== 'none') {
            renderDashboard(); 
            renderGamification();
        } else {
            renderTrophyRoom(); 
        }
    } 
}

function openGoal(id) {
    if (isPendingTax || dailyDebtMinutes > 0) { alert("Phải dọn sạch nợ trước khi tiếp tục mục tiêu khác!"); return; }
    activeGoalId = id; 
    const goal = goals.find(g => g.id === id);
    
    document.getElementById('sidebar').classList.remove('active'); 
    document.getElementById('mobile-overlay').classList.remove('active');
    document.getElementById('focus-room').style.display = 'flex';
    document.getElementById('focus-target-info').innerText = `Mục tiêu: ${goal.name} | Còn lại: ${goal.current.toFixed(2)}h`;
    
    let badge = document.getElementById('focus-badge'); 
    badge.innerText = "Khu Vực Tập Trung"; 
    badge.style = "";
    
    if(audioCtx.state === 'suspended') audioCtx.resume(); 
    resetSystem();
}

function backToDashboard() {
    if ((isSessionActive || isHardcoreTax || isDebtSession) && !confirm("Phiên đang chạy. Rời đi sẽ hủy toàn bộ tiến độ phiên này?")) return;
    if (isSessionActive || isGracePeriod || isBreakActive || isHardcoreTax || isDebtSession) { 
        clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval); 
        penaltyMinutes = 0; 
        resetSystem(); 
    }
    document.getElementById('focus-room').style.display = 'none';
    renderKPI(); renderDashboard(); renderGamification();
}

function updateDisplay(seconds) {
    if(seconds < 0) seconds = 0; 
    let m = Math.floor(seconds / 60).toString().padStart(2, '0'); 
    let s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('session-timer').innerText = `${m}:${s}`;
}

function toggleButtons(isActive) {
    document.getElementById('btn-5').style.display = isActive ? 'none' : 'flex';
    document.getElementById('btn-15').style.display = isActive ? 'none' : 'flex'; 
    document.getElementById('btn-25').style.display = isActive ? 'none' : 'flex';
    document.getElementById('btn-pause').style.display = isActive ? 'flex' : 'none'; 
    document.getElementById('btn-cancel').style.display = isActive ? 'flex' : 'none';
}

function togglePause() {
    isPaused = !isPaused; 
    const btnPause = document.getElementById('btn-pause'); 
    const statusMsg = document.getElementById('status-msg'); 
    const statusIcon = document.getElementById('status-box').querySelector('i');
    
    saveRecoveryState(); // LƯU NGAY TRẠNG THÁI VÀ SỐ GIÂY CÒN LẠI
    
    if (isHardcoreTax || isDebtSession) {
        if (isPaused) {
            statusIcon.className = "fa-solid fa-pause";
            statusMsg.innerHTML = `<strong style="color:var(--brand-warning)">Đang tạm dừng phạt. Đừng nghỉ quá lâu!</strong>`;
            pauseInterval = setInterval(() => { 
                taxPauseBank--; 
                if(taxPauseBank <= 0) { 
                    clearInterval(pauseInterval); clearInterval(timerInterval); 
                    alert("BẠN ĐÃ DÙNG HẾT NGHỈ NGƠI! Chuỗi kỷ luật đã trở về 1."); 
                    currentStreak = 1; saveAll(); resetSystem(); location.reload(); 
                } 
                btnPause.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp tục (' + taxPauseBank + 's)'; 
            }, 1000);
        } else { 
            clearInterval(pauseInterval); 
            sessionEndTime = Date.now() + timeLeft * 1000; // Bù lại đúng thời gian đã nghỉ
            saveRecoveryState(); 
            btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)'; 
            statusIcon.className = "fa-solid fa-spinner fa-spin";
            statusMsg.innerText = "Thời gian đang trôi. Tuyệt đối không xao nhãng.";
        }
    } else {
        if (isPaused) {
            btnPause.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp tục'; 
            statusIcon.className = "fa-solid fa-pause";
            pauseTimeLeft = 300; 
            pauseEndTime = Date.now() + pauseTimeLeft * 1000;
            pauseInterval = setInterval(() => { 
                pauseTimeLeft = Math.round((pauseEndTime - Date.now()) / 1000); 
                if (pauseTimeLeft <= 0) { 
                    pauseTimeLeft = 0; clearInterval(pauseInterval); clearInterval(timerInterval); 
                    playAlertSound(); resetSystem(); 
                    setTimeout(() => alert("Đã quá 5 phút tạm dừng! Phiên học bị hủy bỏ."), 100); 
                } 
                let m = Math.floor(pauseTimeLeft / 60).toString().padStart(2, '0'); let s = (pauseTimeLeft % 60).toString().padStart(2, '0'); 
                statusMsg.innerHTML = `Tạm dừng. Giới hạn thời gian: <strong style="color: var(--brand-focus);">${m}:${s}</strong>.`; 
            }, 1000);
        } else { 
            clearInterval(pauseInterval); 
            sessionEndTime = Date.now() + timeLeft * 1000; 
            saveRecoveryState(); 
            btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng'; 
            statusMsg.innerText = isIcebreakerPhase ? "5 phút mồi lửa. Hãy bắt đầu." : "Thời gian đang trôi. Tuyệt đối không xao nhãng."; 
            statusIcon.className = "fa-solid fa-spinner fa-spin"; 
        }
    }
}

function startIcebreaker() { startSession(5, true); }

function startSession(minutes, isIce = false) {
    if(isSessionActive && !isGracePeriod) return;
    
    clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval);
    
    // 🛑 VÁ LỖI TẠI ĐÂY: Dập tắt công tắc Cày lố của phiên trước
    isSessionActive = true; isPaused = false; isGracePeriod = false; isBreakActive = false; 
    isOvertimePhase = false; overtimeMinutes = 0;
    
    // Đổi trạng thái thành Đang tập trung (Đèn đỏ)
    updateUserStatus('focusing');
    
    isIcebreakerPhase = isIce; 
    currentDuration = isIce ? 30 : minutes; 
    activeSessionMinutes = minutes + penaltyMinutes; 
    timeLeft = activeSessionMinutes * 60; 
    sessionEndTime = Date.now() + timeLeft * 1000;
    
    document.body.classList.remove('break-mode'); 
    document.body.classList.add('focus-active'); 
    document.getElementById('session-timer').style = ""; 
    document.getElementById('status-box').querySelector('i').style = "";
    
    let badge = document.getElementById('focus-badge');
    if (penaltyMinutes > 0) { 
        badge.innerText = `ĐANG CHỊU PHẠT (+${penaltyMinutes}P)`; 
        badge.style.color = "var(--brand-warning)"; 
        badge.style.background = "rgba(225, 29, 72, 0.1)"; 
    } else { 
        badge.innerText = isIce ? "PHÁ BĂNG LỰC CẢN (5P)" : "ĐANG TẬP TRUNG"; 
        badge.style = ""; 
    }
    
    document.getElementById('btn-pause').innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng'; 
    document.getElementById('status-box').querySelector('i').className = "fa-solid fa-spinner fa-spin"; 
    document.getElementById('status-msg').innerText = isIce ? "5 phút mồi lửa. Hãy gạt bỏ mọi suy nghĩ và bắt đầu làm việc." : "Thời gian đang trôi. Tuyệt đối không xao nhãng.";
    
    toggleButtons(true); 
    updateDisplay(timeLeft); 
    saveRecoveryState();
    
    timerInterval = setInterval(() => { 
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; }
        if (!isPaused) { 
            if (!isOvertimePhase) {
                timeLeft = Math.round((sessionEndTime - Date.now()) / 1000); 
                if (timeLeft <= 0) { 
                    timeLeft = 0; 
                    if (isIcebreakerPhase) {
                        isIcebreakerPhase = false; playTick();
                        activeSessionMinutes = 30 + penaltyMinutes; 
                        timeLeft = 25 * 60; 
                        sessionEndTime = Date.now() + timeLeft * 1000;
                        badge.innerText = "ĐÃ VÀO GUỒNG (25P)"; 
                        document.getElementById('status-msg').innerText = "Trạng thái Deep Work tự động kích hoạt.";
                        saveRecoveryState(); 
                        updateDisplay(timeLeft);
                    } else if (!isHardcoreTax && !isDebtSession) {
                        isOvertimePhase = true;
                        standardMinutes = currentDuration; 
                        overtimeMinutes = 0;
                        sessionEndTime = Date.now(); 
                        playAlertSound();
                        alert("⏳ HẾT GIỜ CHUẨN! Bạn có thể bấm 'Nộp báo cáo' (nút Hủy cũ) để kết thúc, hoặc tiếp tục cày lố (Lương x2)!");
                        
                        document.getElementById('session-timer').style.color = "#fbbf24";
                        document.getElementById('status-msg').innerText = "ĐANG TRONG THỜI GIAN CÀY LỐ (OVERTIME). Lương x2 mỗi phút.";
                        
                        let btnCancel = document.getElementById('btn-cancel');
                        btnCancel.innerHTML = '<i class="fa-solid fa-file-signature"></i> Nộp báo cáo';
                        btnCancel.style.borderColor = "var(--brand-break)";
                        btnCancel.style.color = "var(--brand-break)";
                        btnCancel.onclick = () => {
                            clearInterval(timerInterval);
                            triggerReportModal();
                        };
                    } else { 
                        playAlertSound(); triggerReportModal(); 
                    }
                } 
                if (!isOvertimePhase) {
                    updateDisplay(timeLeft); 
                    if (isTickOn && timeLeft % 1 === 0) playTick(); 
                }
            } else {
                let elapsed = Math.round((Date.now() - sessionEndTime) / 1000);
                overtimeMinutes = Math.floor(elapsed / 60);
                let m = Math.floor(elapsed / 60).toString().padStart(2, '0');
                let s = (elapsed % 60).toString().padStart(2, '0');
                document.getElementById('session-timer').innerText = `+${m}:${s}`;
            }
        }
    }, 1000); 
    penaltyMinutes = 0; 
}

function cancelSession() { 
    if(confirm("Hủy phiên học? (Hình phạt: Cổ phiếu rớt 1% toàn thị trường)")) { 
        impactStockMarket("CANCEL");
        clearInterval(timerInterval); 
        clearInterval(pauseInterval); 
        resetSystem(); 
    } 
}

function resetSystem() {
    isSessionActive = false; isPaused = false; isGracePeriod = false; isHardcoreTax = false; isDebtSession = false; isBreakActive = false; isIcebreakerPhase = false;
    isOvertimePhase = false; standardMinutes = 0; overtimeMinutes = 0;
    
    // Đổi trạng thái thành Trực tuyến (Đèn xanh) trên Mạng xã hội
    updateUserStatus('online');
    
    clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval); 
    clearRecoveryState();
    
    document.body.classList.remove('break-mode'); 
    document.body.classList.remove('focus-active');
    
    let btnTax = document.getElementById('btn-tax'); 
    if(btnTax) btnTax.style.display = 'none'; 
    document.getElementById('btn-focus-back').onclick = backToDashboard;
    
    let btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) {
        btnCancel.innerHTML = '<i class="fa-solid fa-xmark"></i> Hủy bỏ';
        btnCancel.style.borderColor = "var(--brand-warning)";
        btnCancel.style.color = "var(--brand-warning)";
        btnCancel.onclick = cancelSession;
    }

    document.getElementById('focus-badge').style = ""; 
    document.getElementById('session-timer').style = ""; 
    document.getElementById('status-box').querySelector('i').style = "";
    
    updateDisplay(0); toggleButtons(false); 
    document.getElementById('focus-badge').innerText = "KHU VỰC TẬP TRUNG";
    
    if (penaltyMinutes > 0) { 
        document.getElementById('status-msg').innerHTML = `<strong style="color:var(--brand-warning)">Bạn đang chịu hình phạt cộng thêm ${penaltyMinutes} phút.</strong> Hãy bắt đầu phiên học!`; 
    } else { 
        document.getElementById('status-box').innerHTML = `<i class="fa-solid fa-circle-info"></i><span id="status-msg">Sẵn sàng. Hệ thống tính giờ dựa trên mốc thời gian tuyệt đối.</span>`; 
    }
}

// =====================================================================
// XÁC THỰC BÁO CÁO (REPORT)
// =====================================================================
const placeholders = ["Tóm tắt ngắn gọn những khái niệm cốt lõi bạn vừa học được...", "Liệt kê các từ vựng, công thức hoặc điểm nghẽn bạn đã giải quyết...", "Sự trung thực trong báo cáo phản ánh chất lượng thực sự của phiên học...", "Ghi lại những gì bạn thực sự đọng lại trong tâm trí lúc này...", "Mục tiêu là nắm vững kiến thức, hãy tóm tắt lại nội dung cốt lõi..."];

function triggerReportModal() {
    clearInterval(timerInterval); clearInterval(pauseInterval); 
    document.body.classList.remove('focus-active'); clearRecoveryState();
    
    requiredWords = Math.max(25, Math.floor(currentDuration * 1.5)); 
    if (currentDuration >= 120) requiredWords = 80;
    
    document.getElementById('word-required').innerText = requiredWords; 
    document.getElementById('word-req-display').innerText = requiredWords;
    document.getElementById('report-input').value = ""; 
    document.getElementById('report-input').placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    
    updateWordCount(); 
    document.getElementById('report-modal').style.display = 'flex'; 
    reportOpenTime = Date.now(); 
    setTimeout(() => document.getElementById('report-input').focus(), 100);
}

function updateWordCount() {
    let text = document.getElementById('report-input').value.trim(); 
    let currentWords = text ? text.split(/\s+/).length : 0; 
    document.getElementById('word-count').innerText = currentWords;
    let btnSubmit = document.getElementById('btn-submit-report'); 
    let warningText = document.getElementById('word-warning');
    
    if (currentWords >= requiredWords) { 
        document.getElementById('word-count').classList.add('success'); 
        btnSubmit.classList.add('active'); 
        warningText.innerText = "Đã đủ điều kiện. Bạn có thể nộp báo cáo."; 
        warningText.style.color = "var(--brand-break)"; 
    } else { 
        document.getElementById('word-count').classList.remove('success'); 
        btnSubmit.classList.remove('active'); 
        warningText.innerText = `Cần thêm ${requiredWords - currentWords} từ nữa...`; 
        warningText.style.color = "var(--text-muted)"; 
    }
}

function abortReport() { 
    if(isHardcoreTax || isDebtSession) { 
        alert("KHÔNG THỂ HỦY BÁO CÁO CỦA PHIÊN PHẠT! Bắt buộc hoàn thành."); return; 
    } 
    if(confirm("Hủy bỏ đồng nghĩa công sức phiên vừa rồi không được tính? (Hình phạt: Cổ phiếu rớt 1%)")) { 
        impactStockMarket("CANCEL"); 
        document.getElementById('report-modal').style.display = 'none'; 
        resetSystem(); 
    } 
}

// =====================================================================
// AI KIỂM DUYỆT BÁO CÁO & CỐ VẤN HỌC THUẬT (BỨC MÀN TRÚC)
// =====================================================================
const p1 = "AQ.Ab8RN6JneSbUwRE";
const p2 = "YSMiptKviwollYcyZh";
const p3 = "8lFYg8eW2Rtz4s0lg";
const GEMINI_API_KEY = p1 + p2 + p3; 

async function validateReportWithAI(reportText, durationMinutes) {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    
    const prompt = `Bạn là Trợ lý Học thuật (Academic Copilot) đánh giá chất lượng phiên học ${durationMinutes} phút.
    Hãy chấm điểm báo cáo từ 1 đến 5 sao và đưa ra 1 lời khuyên chuyên môn ngắn gọn.
    
    Quy tắc phản hồi: Bắt buộc trả về đúng định dạng: [SỐ SAO TỪ 1 ĐẾN 5] | [LỜI NHẬN XÉT & GỢI Ý]
    (Chỉ ghi đúng 1 chữ số từ 1 đến 5 ở phần đầu tiên).
    
    Tiêu chí chấm sao:
    - 1 hoặc 2: Ký tự vô nghĩa (asdfg), spam, hoặc viết đối phó không liên quan việc học.
    - 3: Đạt yêu cầu cơ bản nhưng mô tả còn chung chung, ít chi tiết.
    - 4: Báo cáo tốt, nêu rõ nội dung công việc đã hoàn thành.
    - 5: Báo cáo xuất sắc, liệt kê cụ thể kiến thức, từ vựng, công thức hoặc đúc kết sâu sắc.
    
    Báo cáo của người dùng: "${reportText}"`;

    let lastError = "";

    for (let modelName of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.6 } 
                })
            });
            
            const data = await response.json();

            if (!response.ok) {
                lastError = `(${response.status}) ${data.error?.message || "Lỗi không xác định"}`;
                if (response.status === 404) continue;
                return `PASS | Lỗi dịch vụ AI ${lastError}`;
            }

            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text.trim();
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            return "PASS | Quá trình phân tích bị gián đoạn do lỗi mạng. Phiên học của bạn vẫn được ghi nhận thành công."; 
        }
    }

    return `PASS | Hệ thống AI đang bảo trì (${lastError}). Phiên học của bạn vẫn được ghi nhận.`;
}

async function submitReport() {
    let text = document.getElementById('report-input').value.trim();
    if (text.split(/\s+/).length >= requiredWords) {
        let timeElapsed = Date.now() - reportOpenTime; 
        let minTimeRequired = (currentDuration === 15) ? 12000 : 18000; 
        if (currentDuration >= 90) minTimeRequired = 30000; 
        
        // 1. Kiểm tra chống spam tốc độ
        if (timeElapsed < minTimeRequired) { 
            alert("PHÁT HIỆN BẤT THƯỜNG:\nTốc độ nhập liệu không hợp lý.\n\nPhiên học đã bị hủy và chuỗi kỷ luật trở về 0."); 
            document.getElementById('report-modal').style.display = 'none'; 
            currentStreak = 0; saveAll(); renderGamification(); resetSystem(); return; 
        }

        // ========================================================
        // 2. KÍCH HOẠT AI CHẤM SAO (1 - 5 SAO) & CỐ VẤN
        // ========================================================
        let btnSubmit = document.getElementById('btn-submit-report');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Hệ thống đang chấm điểm...";
        }

        let aiResponse = await validateReportWithAI(text, currentDuration);
        
        let aiParts = aiResponse.split("|");
        let rawScore = aiParts[0].trim();
        let aiAdvice = aiParts[1] ? aiParts[1].trim() : "Hệ thống đã ghi nhận tiến độ của bạn.";

        // Xử lý điểm Sao (Nếu lỗi mạng trả về PASS thì mặc định không tính vào lịch sử sao)
        let starScore = parseInt(rawScore.replace(/\D/g, ''));
        let isOfflinePass = (rawScore === "PASS" || isNaN(starScore));
        if (!isOfflinePass) {
            starScore = Math.max(1, Math.min(5, starScore));
            if (typeof recordNewStarRating === 'function') recordNewStarRating(starScore);
        }

        // Nếu bị chấm 1 hoặc 2 sao -> Không đạt (FAIL)
        if (!isOfflinePass && starScore <= 2) {
            let starsVisual = "⭐".repeat(starScore);
            alert(`ĐÁNH GIÁ BÁO CÁO: ${starsVisual} (${starScore}/5 Sao - Không đạt)\n\nPhản hồi từ hệ thống: ${aiAdvice}\n\nPhiên học đã bị hủy. Hệ thống áp dụng chế tài trừ $100 và đặt lại chuỗi kỷ luật.`);
            
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = "Nộp Báo Cáo"; }
            document.getElementById('report-modal').style.display = 'none';

            let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
            localStorage.setItem('usdBalance', Math.max(0, currentUsd - 100));
            updateUsdDisplay();
            impactStockMarket("PENALTY");
            currentStreak = 0; saveAll(); renderGamification(); resetSystem(); return;
        }

        // Tính tiền Tip theo số Sao (4 sao: +$15 | 5 sao: +$35)
        let tipAmount = 0;
        if (!isOfflinePass) {
            if (starScore === 4) tipAmount = 15;
            if (starScore === 5) tipAmount = 35;
        }

        let ratingHeader = isOfflinePass 
            ? "Phiên học hoàn thành!" 
            : `ĐÁNH GIÁ CHẤT LƯỢNG: ${"⭐".repeat(starScore)} (${starScore}/5 Sao)${tipAmount > 0 ? `\n💰 Thưởng thêm Tiền Tip chất lượng: +$${tipAmount}` : ""}`;

        alert(`${ratingHeader}\n\n💡 Nhận xét từ Trợ lý AI:\n"${aiAdvice}"`);
        
        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = "Nộp Báo Cáo"; }
        // ========================================================

        document.getElementById('report-modal').style.display = 'none';
        let isPunishment = isHardcoreTax || isDebtSession;

        activeSessionMinutes = standardMinutes + overtimeMinutes;
        if (activeSessionMinutes === 0) activeSessionMinutes = currentDuration; 
        
        let now = new Date(); 
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
        let dateStr = now.toISOString().split('T')[0];
        let currentHour = new Date().getHours();

        // ========================================================
        // 💰 HỆ THỐNG TRẢ THƯỞNG & 3 MỐC VINH QUANG (5-10-15)
        // ========================================================
        if (!isPunishment) {
            let baseEarn = activeSessionMinutes * 1; 
            let todayHrsBefore = dailyLogs[dateStr] || 0; 
            let todayMinsBefore = Math.round(todayHrsBefore * 60);
            
            let extraMins = Math.min(activeSessionMinutes, Math.max(0, todayMinsBefore + activeSessionMinutes - 90));
            let bonusEarn = extraMins > 0 ? Math.floor(extraMins * 0.2) : 0;
            
            let hoursEarned = activeSessionMinutes / 60;
            let currentCycleHrs = getTotalCycleHours() + hoursEarned; 
            
            let rewardMultiplier = 1;
            if (currentCycleHrs >= 15.0) rewardMultiplier = 3;
            else if (currentCycleHrs >= 10.0) rewardMultiplier = 2;

            let totalEarn = ((baseEarn + bonusEarn) * rewardMultiplier) + tipAmount;
            
            let currentUsd = parseInt(localStorage.getItem("usdBalance")) || 0;
            localStorage.setItem("usdBalance", currentUsd + totalEarn);
            updateUsdDisplay();

            let msg = `HOÀN THÀNH PHIÊN HỌC:\n- Thu nhập cơ bản: $${baseEarn + bonusEarn}`;
            if (rewardMultiplier > 1) msg += `\n- Hệ số nhân (x${rewardMultiplier}): $${(baseEarn + bonusEarn) * rewardMultiplier}`;
            if (tipAmount > 0) msg += `\n- Tiền Tip (${starScore} Sao): +$${tipAmount}`;
            msg += `\n=> Tổng thực nhận: +$${totalEarn}`;
            alert(msg);

            let achieved10h = localStorage.getItem('saasAchieved10h') === 'true';
            let achieved15h = localStorage.getItem('saasAchieved15h') === 'true';
            
            if (currentCycleHrs >= 10.0 && !achieved10h) {
                localStorage.setItem('saasAchieved10h', 'true');
                let freezes = parseInt(localStorage.getItem('saasFreezes')) || 0;
                localStorage.setItem('saasFreezes', freezes + 1);
                setTimeout(() => alert("🎉 TẤN CẤP TINH ANH (10H): Nhận 1 Kim Bài Miễn Tử & X2 Thu nhập hệ thống!"), 500);
                if (typeof fireConfetti === 'function') fireConfetti();
            }
            if (currentCycleHrs >= 15.0 && !achieved15h) {
                localStorage.setItem('saasAchieved15h', 'true');
                setTimeout(() => alert("👑 TẤN CẤP HUYỀN THOẠI (15H): Gắn Vương Miện Danh Dự & X3 Thu nhập hệ thống!"), 1000);
                if (typeof fireConfetti === 'function') fireConfetti();
            }

            impactStockMarket("SUCCESS");
            if (typeof completeDispatchQuestSuccess === 'function') completeDispatchQuestSuccess();
        }

        // ========================================================
        // 📜 CẬP NHẬT CÁO THỊ (NHIỆM VỤ NGẪU NHIÊN)
        // ========================================================
        if (!isPunishment) {
            let quests = JSON.parse(localStorage.getItem('saasDailyQuests')) || [];
            quests.forEach(q => {
                if(q.type === 'any_session') q.current += 1;
                if(q.type === 'session_25' && currentDuration === 25) q.current += 1;
                if(q.type === 'session_15' && currentDuration === 15) q.current += 1;
                if(q.type === 'session_long' && activeSessionMinutes >= 50) q.current += 1;
                
                if(q.type === 'time_slot') {
                    if (q.slot === 'morning' && currentHour >= 5 && currentHour < 12) q.current += activeSessionMinutes;
                    if (q.slot === 'afternoon' && currentHour >= 12 && currentHour < 18) q.current += activeSessionMinutes;
                    if (q.slot === 'evening' && (currentHour >= 18 || currentHour < 5)) q.current += activeSessionMinutes;
                }

                if(q.type === 'total_time') {
                    let newTotalHrs = (dailyLogs[dateStr] || 0) + (activeSessionMinutes / 60);
                    q.current = Math.round(newTotalHrs * 60); 
                }
                
                if(q.current > q.target) q.current = q.target;
            });
            localStorage.setItem('saasDailyQuests', JSON.stringify(quests));
        }

        let isSealed = localStorage.getItem("isSealed") === "true";
        if (isSealed) {
            let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
            if (usd >= 250) {
                localStorage.setItem("usdBalance", usd - 250);
                localStorage.setItem("isSealed", "false");
                alert("Tài sản đã đủ. Tự động trích $250 nộp Thuế Duy Trì. Các tính năng cao cấp đã được mở khóa!");
                updateUsdDisplay();
            }
        }

        let goal = goals.find(g => g.id === activeGoalId); 
        if(!goal) goal = goals[0]; 
        if(!goal.reports) goal.reports = [];
        
        let reportLabel = isPunishment ? `Phạt ${activeSessionMinutes}p` : `${activeSessionMinutes}p`;
        goal.reports.push({ 
            date: new Date().toLocaleDateString('vi-VN') + " - " + new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}), 
            type: reportLabel, 
            text: text,
            stars: isOfflinePass ? 5 : starScore
        });
        
        let hoursEarned = activeSessionMinutes / 60; 
        goal.current = Math.max(0, goal.current - hoursEarned);
        
        if(!dailyLogs[dateStr]) dailyLogs[dateStr] = 0; 
        dailyLogs[dateStr] += hoursEarned; 
        totalSessions++;

        lastActiveDate = dateStr;
        localStorage.setItem('saasLastActive', lastActiveDate);

        let checkedStreakDate = localStorage.getItem('saasStreakCheckedDate');
        if (checkedStreakDate !== dateStr && !isPunishment) {
            currentStreak++;
            localStorage.setItem('saasStreakCheckedDate', dateStr);
        }
        
        let focusTargetEl = document.getElementById('focus-target-info');
        if(focusTargetEl) focusTargetEl.innerText = `Mục tiêu: ${goal.name} | Còn lại: ${goal.current.toFixed(2)}h`;
        
        if(goal.current <= 0) { 
            setTimeout(() => { alert(`🎉 CHÚC MỪNG! Mục tiêu "${goal.name}" đã được hoàn thành 100%.`); }, 500); 
        }

        if (isHardcoreTax) { 
            isHardcoreTax = false; 
            if (localStorage.getItem('saasPendingTax') === 'true') {
                localStorage.setItem('saasPendingTax', 'false'); isPendingTax = false;
                alert(`Đã cày xong ${currentDuration}p Thuế Trì Hoãn! Mồ hôi của bạn đã được cộng thẳng vào KPI tuần này.`);
            } else { 
                alert("Chiến dịch khôi phục chuỗi thành công! Sự xao nhãng đã bị dập tắt."); 
            }
            let btnTax = document.getElementById('btn-tax'); if(btnTax) btnTax.style.display = 'none'; 
            let btnFocusBack = document.getElementById('btn-focus-back'); if(btnFocusBack) btnFocusBack.onclick = backToDashboard; 
        }

        if (isDebtSession) {
            isDebtSession = false; dailyDebtMinutes = 0; localStorage.setItem('saasDailyDebt', '0');
            alert(`Đã cày trả sạch nợ Lãi Kép! Thời gian nộp phạt này đã được hệ thống ghi nhận vào Tổng giờ học.`);
            let btnTax = document.getElementById('btn-tax'); if(btnTax) btnTax.style.display = 'none'; 
            let btnFocusBack = document.getElementById('btn-focus-back'); if(btnFocusBack) btnFocusBack.onclick = backToDashboard; 
        }

        saveAll();
        let statusBoxEl = document.getElementById('status-box');
        if(statusBoxEl) statusBoxEl.innerHTML = `<i class="fa-solid fa-check" style="color:var(--brand-break)"></i><span id="status-msg">Kết quả đã được ghi nhận.</span>`;
        
        if (isPunishment) { 
            setTimeout(() => location.reload(), 1500); 
        } else { 
            renderKPI(); 
            initiateBreak(); 
        }
    }
}

// =====================================================================
// NGHỈ NGƠI & ÂN HẠN
// =====================================================================
function initiateBreak() {
    isSessionActive = false; isBreakActive = true; 
    document.body.classList.add('break-mode'); 
    toggleButtons(true); 
    document.getElementById('btn-pause').style.display = 'none'; 
    document.getElementById('btn-cancel').style.display = 'none'; 
    
    let breakMinutes = 5; let breakMsg = "Nghỉ Ngắn (5p)"; 
    document.getElementById('focus-badge').innerText = "THỜI GIAN NGHỈ NGƠI";
    
    if (currentDuration === 25 || currentDuration === 30) { 
        standardSessionCount25++; localStorage.setItem('saasS25', standardSessionCount25); 
        if (standardSessionCount25 % 2 === 0) { breakMinutes = 15; breakMsg = "Nghỉ Dài (15p)"; } 
    } else if (currentDuration === 15) { 
        standardSessionCount15++; localStorage.setItem('saasS15', standardSessionCount15); 
        if (standardSessionCount15 % 3 === 0) { breakMinutes = 10; breakMsg = "Nghỉ Dài (10p)"; } 
    } else if (currentDuration >= 90) { 
        breakMinutes = 15; breakMsg = "Nghỉ Dài (15p)"; 
    }
    
    document.getElementById('status-msg').innerText = `Đang kích hoạt chế độ ${breakMsg}.`;
    timeLeft = breakMinutes * 60; 
    let breakEndTime = Date.now() + timeLeft * 1000; 
    updateDisplay(timeLeft);
    
    timerInterval = setInterval(() => {
        timeLeft = Math.round((breakEndTime - Date.now()) / 1000);
        if (timeLeft <= 0) { 
            timeLeft = 0; clearInterval(timerInterval); playAlertSound(); alert("Hết giờ nghỉ! Thời gian ân hạn 2 phút bắt đầu."); 
            if (goals.find(g => g.id === activeGoalId).current <= 0) { backToDashboard(); } 
            else { startGracePeriod(); } 
        } 
        updateDisplay(timeLeft);
    }, 1000);
}

function startGracePeriod() {
    document.body.classList.remove('break-mode'); 
    isGracePeriod = true; isBreakActive = false; 
    graceTimeLeft = 120; graceEndTime = Date.now() + graceTimeLeft * 1000;
    
    const badge = document.getElementById('focus-badge'); 
    badge.innerText = "THỜI GIAN ÂN HẠN (2 PHÚT)"; badge.style.color = "var(--brand-warning)"; badge.style.background = "rgba(225, 29, 72, 0.1)";
    const timerUI = document.getElementById('session-timer'); timerUI.style.color = "var(--brand-warning)"; timerUI.style.textShadow = "none";
    document.getElementById('status-msg').innerHTML = "Bạn có 2 phút để bắt đầu phiên tiếp theo. Trễ hạn sẽ bị <strong style='color:var(--brand-focus)'>phạt cộng thêm 5 phút</strong>!";
    const statusIcon = document.getElementById('status-box').querySelector('i'); statusIcon.className = "fa-solid fa-hourglass-half fa-spin"; statusIcon.style.color = "var(--brand-warning)";
    
    toggleButtons(false); updateDisplay(graceTimeLeft);
    
    graceInterval = setInterval(() => {
        graceTimeLeft = Math.round((graceEndTime - Date.now()) / 1000);
        if (graceTimeLeft <= 0) { 
            graceTimeLeft = 0; clearInterval(graceInterval); isGracePeriod = false; penaltyMinutes += 5; 
            playAlertSound(); 
            alert(`Đã hết thời gian ân hạn! Phiên học tiếp theo sẽ bị cộng thêm 5 phút phạt.`); 
            resetSystem(); 
        } 
        updateDisplay(graceTimeLeft);
    }, 1000);
}

function autoHealDiscrepancy() {
    let logs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {};
    let actualMinsPerDay = {};
    
    // Quét toàn bộ lịch sử báo cáo để tính ra số phút thực tế của TỪNG NGÀY
    goals.forEach(g => {
        if(g.reports) {
            g.reports.forEach(r => {
                let datePart = r.date.split(' - ')[0]; // VD: "20/09/2026"
                let parts = datePart.split('/');
                if (parts.length === 3) {
                    // Ép chuẩn định dạng YYYY-MM-DD
                    let isoDate = parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
                    let mins = parseInt(r.type.replace(/\D/g, '')) || 0;
                    actualMinsPerDay[isoDate] = (actualMinsPerDay[isoDate] || 0) + mins;
                }
            });
        }
    });

    let needsSync = false;
    for (let date in actualMinsPerDay) {
        let actualHrs = actualMinsPerDay[date] / 60;
        let currentLogged = logs[date] || 0;
        // 🛡️ CHỈ LẤY SỐ LỚN HƠN: Nếu mây đè mất giờ, lấy giờ thực tế đè lại Mây!
        if (actualHrs > currentLogged) {
            logs[date] = actualHrs;
            needsSync = true;
        }
    }

    if (needsSync) {
        localStorage.setItem('saasDailyLogs', JSON.stringify(logs));
        if (typeof dailyLogs !== 'undefined') dailyLogs = logs;
        localStorage.setItem('saasLastUpdated', Date.now());
        if (typeof syncToCloud === 'function') syncToCloud();
    }
}

// =====================================================================
// KHỐI LOGIC THỜI KHÓA BIỂU (TIMETABLE ENGINE)
// =====================================================================
let timetableData = JSON.parse(localStorage.getItem('saasTimetable')) || [];
let currentViewDate = new Date(); // Biến lưu tuần đang xem

// 1. Phải vá hàm switchTab để nó nhận diện Tab Thời Khóa Biểu
const originalSwitchTab = switchTab;
window.switchTab = function(tab) {
    originalSwitchTab(tab); // Gọi code cũ
    document.getElementById('timetable-room').style.display = 'none';
    let navTt = document.getElementById('nav-timetable'); if(navTt) navTt.classList.remove('active');
    
    if (tab === 'timetable') {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(navTt) navTt.classList.add('active');
        document.getElementById('view-dashboard').style.display = 'none'; 
        document.getElementById('analytics-room').style.display = 'none'; 
        document.getElementById('trophy-room').style.display = 'none'; 
        document.getElementById('trophy-detail').style.display = 'none';
        
        document.getElementById('timetable-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Thời Khóa Biểu"; 
        document.getElementById('main-desc').innerText = "Sắp xếp chiến lược. Tối ưu thời gian.";
        document.getElementById('btn-create-goal').style.display = 'none'; document.getElementById('btn-create-countdown').style.display = 'none'; document.getElementById('btn-rest-day').style.display = 'none';
        renderTimetable();
    }
}

// 2. Logic điều hướng Tuần
function getMonday(d) { let dObj = new Date(d); let day = dObj.getDay(); let diff = dObj.getDate() - day + (day === 0 ? -6 : 1); return new Date(dObj.setDate(diff)); }
function goToCurrentWeek() { currentViewDate = new Date(); renderTimetable(); }
function changeWeek(offset) { currentViewDate.setDate(currentViewDate.getDate() + (offset * 7)); renderTimetable(); }

// 3. Render Lưới Thời Khóa Biểu (Dạng Khối Xếp Gọn - Có Today Highlight)
function renderTimetable() {
    let grid = document.getElementById('timetable-grid'); if(!grid) return;
    let monday = getMonday(currentViewDate);
    let days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    
    let sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    document.getElementById('tt-week-label').innerText = `${monday.toLocaleDateString('vi-VN')} - ${sunday.toLocaleDateString('vi-VN')}`;
    
    let html = `<div class="tt-head" style="border-right: 1px solid var(--border);">Ca học</div>`;
    let weekDates = [];
    
    // Header Thứ & Ngày (Cắm cờ TODAY)
    for (let i = 0; i < 7; i++) {
        let d = new Date(monday); d.setDate(monday.getDate() + i); weekDates.push(d);
        let isToday = (d.toDateString() === new Date().toDateString());
        let todayClass = isToday ? 'is-today' : '';
        
        // Thêm biểu tượng tia chớp nhỏ nhấp nháy bên cạnh "Thứ X" nếu là ngày hôm nay
        let dayNameHtml = isToday 
            ? `<i class="fa-solid fa-bolt fa-fade" style="font-size: 0.8rem; margin-right: 4px;"></i>${days[i]}` 
            : days[i];
            
        html += `<div class="tt-cell tt-head ${todayClass}"><span>${dayNameHtml}</span><span>${d.toLocaleDateString('vi-VN')}</span></div>`;
    }

    let shifts = [{ id: 'sang', label: 'Sáng' }, { id: 'chieu', label: 'Chiều' }, { id: 'toi', label: 'Tối' }];
    
    shifts.forEach(shift => {
        html += `<div class="tt-cell tt-shift">${shift.label}</div>`;
        for (let i = 0; i < 7; i++) {
            let currentDayObj = weekDates[i];
            let currentDow = currentDayObj.getDay(); 
            let localDateStr = currentDayObj.getFullYear() + '-' + String(currentDayObj.getMonth()+1).padStart(2,'0') + '-' + String(currentDayObj.getDate()).padStart(2,'0');
            
            let itemsHTML = '';
            timetableData.forEach(item => {
                let sDate = new Date(item.startDate); sDate.setHours(0,0,0,0);
                let eDate = new Date(item.endDate); eDate.setHours(23,59,59,999);
                
                if (item.shift === shift.id && parseInt(item.dow) === currentDow && currentDayObj >= sDate && currentDayObj <= eDate) {
                    
                    let isPaused = item.pausedDates && item.pausedDates.includes(localDateStr);
                    let cssClass = `tt-${item.type} ${isPaused ? 'is-paused' : ''}`;
                    let ribbonHtml = isPaused ? `<div class="tt-ribbon">Tạm ngưng</div>` : '';
                    let icon = item.type === 'online' ? '<i class="fa-solid fa-laptop"></i> ' : (item.type === 'exam' ? '<i class="fa-solid fa-file-signature"></i> ' : (item.type === 'work' ? '<i class="fa-solid fa-building"></i> ' : (item.type === 'tutor' ? '<i class="fa-solid fa-user-graduate"></i> ' : '')));
                    
                    // Thẻ bài xếp gọn đè lên nhau
                    itemsHTML += `<div class="tt-item ${cssClass}" onclick="handleTimetableAction(${item.id}, '${localDateStr}')">
                        ${ribbonHtml}
                        <strong>${icon}${item.name}</strong>
                        ${item.code ? `<div>${item.code}</div>` : ''}
                        ${item.room ? `<div>Phòng: ${item.room}</div>` : ''}
                        ${item.teacher ? `<div>GV: ${item.teacher}</div>` : ''}
                    </div>`;
                }
            });
            
            // Highlight nền của cột TODAY
            let isTodayCol = (currentDayObj.toDateString() === new Date().toDateString()) ? 'is-today-col' : '';
            html += `<div class="tt-cell tt-content ${isTodayCol}">${itemsHTML}</div>`;
        }
    });
    grid.innerHTML = html;
}

// 4. Modal & Lưu Dữ Liệu
function openTimetableModal() {
    document.getElementById('tt-name').value = ''; 
    document.getElementById('tt-code').value = '';
    document.getElementById('tt-room').value = ''; 
    document.getElementById('tt-teacher').value = '';
    
    let today = new Date(); 
    let twoMonths = new Date(); 
    twoMonths.setMonth(today.getMonth() + 2);
    
    // Ép dùng giờ địa phương (Local Time) và chuẩn hóa có số 0 ở đầu
   let todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    let twoMonthsStr = twoMonths.getFullYear() + '-' + String(twoMonths.getMonth() + 1).padStart(2, '0') + '-' + String(twoMonths.getDate()).padStart(2, '0');
    
    document.getElementById('tt-start').value = todayStr;
    document.getElementById('tt-end').value = twoMonthsStr;
    document.getElementById('timetable-modal').style.display = 'flex';
}

function saveTimetableItem() {
    let name = document.getElementById('tt-name').value;
    if(!name) return alert("Bạn chưa nhập tên sự kiện!");
    
    let item = {
        id: Date.now(),
        name: name,
        type: document.getElementById('tt-type').value,
        code: document.getElementById('tt-code').value,
        room: document.getElementById('tt-room').value,
        teacher: document.getElementById('tt-teacher').value,
        startDate: document.getElementById('tt-start').value,
        endDate: document.getElementById('tt-end').value,
        dow: document.getElementById('tt-dow').value,
        shift: document.getElementById('tt-shift').value,
        pausedDates: [] // Khởi tạo mảng trống để lưu các ngày báo nghỉ
    };
    
    timetableData.push(item);
    localStorage.setItem('saasTimetable', JSON.stringify(timetableData));
    if (typeof syncToCloud === "function") { localStorage.setItem('saasLastUpdated', Date.now()); syncToCloud(); }
    
    document.getElementById('timetable-modal').style.display = 'none';
    renderTimetable();
}

// 5. Xử lý Tạm Ngưng hoặc Xóa
function handleTimetableAction(id, dateStr) {
    let item = timetableData.find(i => i.id === id);
    if(!item) return;

    let isCurrentlyPaused = item.pausedDates && item.pausedDates.includes(dateStr);
    let promptMsg = `CÁC TÙY CHỌN CHO: ${item.name}\n\n[ 1 ] - ${isCurrentlyPaused ? 'Hủy báo nghỉ (Đi học lại)' : 'Đánh dấu Nghỉ buổi này (Tạm ngưng)'}\n[ 2 ] - Xóa vĩnh viễn khỏi Lịch\n\nNhập phím 1 hoặc 2:`;
    
    let action = prompt(promptMsg);

    if (action === "1") {
        if (!item.pausedDates) item.pausedDates = [];
        if (isCurrentlyPaused) {
            item.pausedDates = item.pausedDates.filter(d => d !== dateStr); // Gỡ dải băng
        } else {
            item.pausedDates.push(dateStr); // Gắn dải băng
        }
    } else if (action === "2") {
        if(confirm("Bạn có chắc chắn muốn xóa vĩnh viễn khỏi thời khóa biểu?")) {
            timetableData = timetableData.filter(i => i.id !== id);
        }
    } else {
        return; // Hủy thao tác
    }

    localStorage.setItem('saasTimetable', JSON.stringify(timetableData));
    if (typeof syncToCloud === "function") { localStorage.setItem('saasLastUpdated', Date.now()); syncToCloud(); }
    renderTimetable();
}

// =====================================================================
// 🧠 ACADEMIC RECOMMENDATION ENGINE (TRÍ TUỆ KHUYẾN NGHỊ)
// =====================================================================
function renderRecommendations() {
    let container = document.getElementById('recom-container');
    if(!container) return;
    container.innerHTML = '';

    let now = new Date(); 
    let todayDow = now.getDay();
    let todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');

    let tomorrowObj = new Date(now);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    let tomorrowDow = tomorrowObj.getDay();
    let tomorrowStr = tomorrowObj.getFullYear() + '-' + String(tomorrowObj.getMonth()+1).padStart(2,'0') + '-' + String(tomorrowObj.getDate()).padStart(2,'0');

    let recommendations = [];

    // 1. QUÉT LỊCH HÔM NAY (Đề xuất REVIEW)
    timetableData.forEach(item => {
        let sDate = new Date(item.startDate); sDate.setHours(0,0,0,0);
        let eDate = new Date(item.endDate); eDate.setHours(23,59,59,999);
        let isPausedToday = item.pausedDates && item.pausedDates.includes(todayStr);
        
        if (!isPausedToday && parseInt(item.dow) === todayDow && now >= sDate && now <= eDate) {
            if(item.type === 'offline' || item.type === 'online') {
                let existingGoal = goals.find(g => g.name.includes(item.name));
                recommendations.push({
                    type: 'review', label: 'Review Môn', icon: 'fa-book-open',
                    title: item.name,
                    desc: 'Hôm nay ngài có lịch môn này. Hãy ôn lại để kiến thức thẩm thấu sâu hơn!',
                    suggestedTarget: 1.0,
                    goalId: existingGoal ? existingGoal.id : null // CÓ RỒI VẪN LƯU LẠI ID
                });
            }
        }
    });

    // 2. QUÉT LỊCH NGÀY MAI (Đề xuất CHUẨN BỊ)
    timetableData.forEach(item => {
        let sDate = new Date(item.startDate); sDate.setHours(0,0,0,0);
        let eDate = new Date(item.endDate); eDate.setHours(23,59,59,999);
        let isPausedTomorrow = item.pausedDates && item.pausedDates.includes(tomorrowStr);

        if (!isPausedTomorrow && parseInt(item.dow) === tomorrowDow && tomorrowObj >= sDate && tomorrowObj <= eDate) {
            if(item.type === 'offline' || item.type === 'online') {
                 let existingGoal = goals.find(g => g.name.includes(item.name));
                 recommendations.push({
                     type: 'prepare', label: 'Chuẩn bị', icon: 'fa-bolt',
                     title: item.name,
                     desc: 'Ngày mai ngài có lịch môn này. Dành 30 phút xem trước bài sẽ làm chủ thế trận.',
                     suggestedTarget: 0.5,
                     goalId: existingGoal ? existingGoal.id : null // CÓ RỒI VẪN LƯU LẠI ID
                 });
            }
        }
    });

    let topRecoms = recommendations.slice(0, 3);
    
    if(topRecoms.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; border: 1px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.02);">Hệ thống đã phân tích: Không có đề xuất ôn tập hay chuẩn bị cấp bách nào. Bệ hạ có thể tự do cày cuốc các môn học!</div>`;
        return;
    }

    topRecoms.forEach(r => {
        let badgeClass = r.type === 'review' ? 'review' : 'prepare';
        let targetText = r.suggestedTarget === 1.0 ? '1.0h' : '0.5h';
        
        // KIỂM TRA: Nếu đã có mục tiêu -> Học Ngay. Nếu chưa -> Tạo Mới.
        let btnHtml = r.goalId 
            ? `<button class="btn-accept-recom" onclick="openGoal(${r.goalId})" style="background: var(--brand-focus); border-color: var(--brand-focus); color: #fff;"><i class="fa-solid fa-play"></i> Học Ngay</button>`
            : `<button class="btn-accept-recom" onclick="acceptRecommendation('[${r.label}] ${r.title}', ${r.suggestedTarget})"><i class="fa-solid fa-plus"></i> Tạo Mục Tiêu</button>`;

        container.innerHTML += `
            <div class="recom-card stagger-item">
                <div class="recom-badge ${badgeClass}"><i class="fa-solid ${r.icon}"></i> ${r.label} &middot; Đề xuất: ${targetText}</div>
                <div class="recom-title">${r.title}</div>
                <div class="recom-meta">${r.desc}</div>
                ${btnHtml}
            </div>
        `;
    });
}

// Hàm bấm nút "Tạo Mục Tiêu Nhanh" từ Đề Xuất
window.acceptRecommendation = function(name, target) {
    let inputName = prompt(`CHẤP NHẬN ĐỀ XUẤT TỪ HỆ THỐNG:\n\nMục tiêu: "${name}"\n\nNhập số giờ cam kết (Mặc định ${target}h):`, target);
    if(inputName !== null) {
        let hrs = parseFloat(inputName);
        if(isNaN(hrs) || hrs <= 0) return alert("Số giờ không hợp lệ!");
        
        let todayObj = new Date(); 
        todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
        const createdAt = todayObj.toISOString().split('T')[0];

        // Khởi tạo mục tiêu chuẩn form của hệ thống
        const newGoal = { 
            id: Date.now(), 
            name: name, 
            target: hrs, 
            current: hrs, 
            reports: [], 
            deadline: null, 
            createdAt: createdAt 
        };
        
        goals.push(newGoal);
        localStorage.setItem('saasGoalsPro', JSON.stringify(goals));
        if (typeof syncToCloud === "function") { localStorage.setItem('saasLastUpdated', Date.now()); syncToCloud(); }
        renderDashboard();
        renderGamification();
        renderRecommendations(); // Vẽ lại để ẩn đề xuất vừa chấp nhận
    }
}

// =====================================================================
// KHỞI TẠO HỆ THỐNG (Đã được chuyển vào bên trong hàm initializeAppState 
// để đảm bảo chỉ chạy SAU KHI kéo dữ liệu Cloud về thành công)
// =====================================================================

// =====================================================================
// BỘ HỘ PHỦ: QUẢN LÝ NHIỆM VỤ NGÀY (RANDOM) & NHẬN THƯỞNG
// =====================================================================
function initDailyQuests() {
    let todayObj = new Date();
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];

    let questDate = localStorage.getItem('saasQuestDate');
    if (questDate !== todayStr) {
        // KHO CÁO THỊ ĐA DẠNG
        const questPool = [
            { id: 'q_morn', type: 'time_slot', slot: 'morning', target: 45, current: 0, reward: 40, title: 'Chiến Thần Bình Minh', desc: 'Tích lũy 45p tu luyện buổi sáng (5h-12h)', claimed: false },
            { id: 'q_aft', type: 'time_slot', slot: 'afternoon', target: 45, current: 0, reward: 40, title: 'Nắng Chiều Không Nghỉ', desc: 'Tích lũy 45p tu luyện buổi chiều (12h-18h)', claimed: false },
            { id: 'q_eve', type: 'time_slot', slot: 'evening', target: 45, current: 0, reward: 40, title: 'Kẻ Thống Trị Màn Đêm', desc: 'Tích lũy 45p tu luyện tối/đêm (18h-24h)', claimed: false },
            { id: 'q_p25', type: 'session_25', target: 2, current: 0, reward: 30, title: 'Bậc Thầy Pomodoro', desc: 'Hoàn thành 2 phiên chuẩn 25p', claimed: false },
            { id: 'q_p15', type: 'session_15', target: 3, current: 0, reward: 30, title: 'Đánh Nhanh Thắng Nhanh', desc: 'Hoàn thành 3 phiên ngắn 15p', claimed: false },
            { id: 'q_l50', type: 'session_long', target: 1, current: 0, reward: 50, title: 'Sức Bền Đáng Nể', desc: 'Hoàn thành 1 phiên cày liên tục >= 50p', claimed: false },
            { id: 'q_fst', type: 'any_session', target: 1, current: 0, reward: 15, title: 'Khởi Động Trơn Tru', desc: 'Hoàn thành 1 phiên học bất kỳ', claimed: false },
            { id: 'q_90m', type: 'total_time', target: 90, current: 0, reward: 100, title: 'Chạm Mốc Tiêu Chuẩn', desc: 'Tích lũy đủ 1.5h (90p) trong ngày', claimed: false }
        ];

        // Thuật toán xáo trộn ngẫu nhiên (Bốc thăm)
        for (let i = questPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questPool[i], questPool[j]] = [questPool[j], questPool[i]];
        }
        
        // Cắt lấy 3 nhiệm vụ đầu tiên
        let selectedQuests = questPool.slice(0, 3);
        
        localStorage.setItem('saasDailyQuests', JSON.stringify(selectedQuests));
        localStorage.setItem('saasQuestDate', todayStr);
    }
}

function renderDailyQuests() {
    let dash = document.getElementById('view-dashboard');
    if (!dash || dash.style.display === 'none') return;
    
    let questBox = document.getElementById('imperial-quests');
    if (!questBox) {
        questBox = document.createElement('div');
        questBox.id = 'imperial-quests';
        questBox.className = 'stagger-item';
        questBox.style.animationDelay = '0.15s';
        questBox.style.marginBottom = '24px';
        
        let grid = document.getElementById('dashboard-grid');
        dash.insertBefore(questBox, grid);
    }
    
    let quests = JSON.parse(localStorage.getItem('saasDailyQuests')) || [];
    let html = `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 1.15rem; text-transform: uppercase;"><i class="fa-solid fa-scroll" style="color: var(--brand-warning); margin-right: 8px;"></i> Cáo Thị Hôm Nay</h3>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">`;
    
    quests.forEach(q => {
        let pct = Math.min(100, (q.current / q.target) * 100);
        let btnHtml = '';
        if (q.claimed) {
            btnHtml = `<button disabled style="background: rgba(0,0,0,0.1); color: var(--text-muted); border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; cursor: not-allowed;"><i class="fa-solid fa-check"></i> Đã nhận</button>`;
        } else if (q.current >= q.target) {
            btnHtml = `<button onclick="claimQuestReward('${q.id}')" style="background: var(--brand-warning); color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 10px rgba(245,158,11,0.3); transition: 0.2s;"><i class="fa-solid fa-gift"></i> Nhận $${q.reward}</button>`;
        } else {
            btnHtml = `<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">${q.current}/${q.target}</span>`;
        }
        
        html += `<div style="background: var(--bg-hover); border: 1px solid var(--border); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: 800; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">${q.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${q.desc}</div>
                </div>
                <div style="font-size: 0.9rem; color: var(--brand-warning); font-weight: 800;">+$${q.reward}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
                    <div style="height: 100%; width: ${pct}%; background: var(--brand-warning); border-radius: 8px;"></div>
                </div>
                ${btnHtml}
            </div>
        </div>`;
    });
    
    html += `</div>`;
    questBox.innerHTML = html;
}

window.claimQuestReward = function(id) {
    let quests = JSON.parse(localStorage.getItem('saasDailyQuests')) || [];
    let q = quests.find(x => x.id === id);
    if(q && q.current >= q.target && !q.claimed) {
        q.claimed = true;
        let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
        localStorage.setItem("usdBalance", usd + q.reward);
        localStorage.setItem('saasDailyQuests', JSON.stringify(quests));
        updateUsdDisplay();
        renderDailyQuests();
        if(typeof syncToCloud === 'function') syncToCloud();
    }
}

// 🛑 HOOK VÀO HÀM RENDER DASHBOARD (Bổ sung thêm Nhiệm vụ hiển thị trên bảng)
const originalRenderDashboard = renderDashboard;
window.renderDashboard = function() {
    originalRenderDashboard(); 
    initDailyQuests();         
    renderDailyQuests();       
}

// =====================================================================
// NGỰ ÂM CÁC (HỆ THỐNG THUÊ NHẠC LÕI KÉP)
// =====================================================================
let musicRentInterval;
let musicTimeLeft = 0;

function rentMusic(minutes, price) {
    let usd = parseInt(localStorage.getItem('usdBalance')) || 0;
    if (usd >= price) {
        // Trừ tiền
        localStorage.setItem('usdBalance', usd - price);
        updateUsdDisplay();
        
        // Kích hoạt thời gian thuê
        musicTimeLeft += minutes * 60;
        
        // Chuyển giao diện sang Máy Phát Nhạc
        document.getElementById('music-shop').style.display = 'none';
        document.getElementById('music-player').style.display = 'flex';
        
        updateMusicTimerDisplay();
        
        // Chạy đồng hồ thuê bao độc lập
        clearInterval(musicRentInterval);
        musicRentInterval = setInterval(() => {
            musicTimeLeft--;
            updateMusicTimerDisplay();
            
            if (musicTimeLeft <= 0) {
                clearInterval(musicRentInterval);
                shutDownMusic();
                alert("⏳ Hết thời gian thuê Ngự Âm Các! Âm nhạc đã được thu hồi. Bạn hãy gia hạn nếu muốn nghe tiếp!");
            }
        }, 1000);
        
        if(typeof syncToCloud === 'function') syncToCloud();
        playTick();
    } else {
        alert("❌ Tài sản của bạn chỉ còn $" + usd + ", không đủ để mua gói này!");
    }
}

function updateMusicTimerDisplay() {
    if(musicTimeLeft < 0) musicTimeLeft = 0;
    let m = Math.floor(musicTimeLeft / 60).toString().padStart(2, '0');
    let s = (musicTimeLeft % 60).toString().padStart(2, '0');
    document.getElementById('music-timer-text').innerText = `${m}:${s}`;
}

// Biến lưu trữ Playlist của bệ hạ
let currentPlaylist = [];
let currentTrackIndex = 0;
let audioPlayer = null;

function loadMusic() {
    let fileInput = document.getElementById('local-audio-input');
    
    // Nếu bệ hạ chưa chọn file nào
    if (fileInput.files.length === 0) {
        alert("Bạn chưa nạp bản nhạc nào từ thiết bị!"); 
        return;
    }

    // Đưa toàn bộ file đã chọn vào Playlist
    currentPlaylist = Array.from(fileInput.files);
    currentTrackIndex = 0;

    let frameContainer = document.getElementById('music-frame-container');
    
    // Giao diện máy phát nhạc hoàng gia (Có nút Tới/Lùi)
    frameContainer.innerHTML = `
        <div id="track-name-display" style="color: #fbbf24; font-weight: 800; font-size: 0.95rem; text-align: center; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
        <audio id="royal-audio-player" controls style="width: 100%; height: 40px; outline: none;"></audio>
        <div style="display: flex; justify-content: center; gap: 16px; margin-top: 16px;">
            <button onclick="prevTrack()" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 8px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'"><i class="fa-solid fa-backward-step"></i> Bài trước</button>
            <button onclick="nextTrack()" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 8px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'">Bài sau <i class="fa-solid fa-forward-step"></i></button>
        </div>
    `;
    
    audioPlayer = document.getElementById('royal-audio-player');
    
    // ĐẠO LUẬT AUTO-NEXT: Nghe hết bài tự động chuyển bài tiếp theo
    audioPlayer.addEventListener('ended', function() {
        nextTrack();
    });

    // Chuyển đổi giao diện
    document.getElementById('music-input-area').style.display = 'none';
    frameContainer.style.display = 'block';
    document.getElementById('btn-stop-music').style.display = 'block';
    
    // Bắt đầu phát bài đầu tiên
    playTrack(currentTrackIndex);
}

function playTrack(index) {
    if (currentPlaylist.length === 0) return;
    
    // Vòng lặp Playlist: Hết danh sách thì quay lại bài đầu
    if (index >= currentPlaylist.length) currentTrackIndex = 0; 
    if (index < 0) currentTrackIndex = currentPlaylist.length - 1; 
    
    let file = currentPlaylist[currentTrackIndex];
    let fileURL = URL.createObjectURL(file);
    
    document.getElementById('track-name-display').innerHTML = `<i class="fa-solid fa-compact-disc fa-spin" style="margin-right: 8px;"></i>${file.name}`;
    audioPlayer.src = fileURL;
    audioPlayer.play();
}

function nextTrack() {
    currentTrackIndex++;
    playTrack(currentTrackIndex);
}

function prevTrack() {
    currentTrackIndex--;
    playTrack(currentTrackIndex);
}

function stopMusicManually() {
    if(audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }
    currentPlaylist = [];
    document.getElementById('music-frame-container').innerHTML = '';
    document.getElementById('music-frame-container').style.display = 'none';
    document.getElementById('btn-stop-music').style.display = 'none';
    document.getElementById('music-input-area').style.display = 'flex';
    document.getElementById('local-audio-input').value = '';
}

function shutDownMusic() {
    musicTimeLeft = 0;
    clearInterval(musicRentInterval);
    if(audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }
    currentPlaylist = [];
    document.getElementById('music-frame-container').innerHTML = '';
    
    document.getElementById('music-player').style.display = 'none';
    document.getElementById('music-shop').style.display = 'flex';
    
    document.getElementById('music-frame-container').style.display = 'none';
    document.getElementById('btn-stop-music').style.display = 'none';
    document.getElementById('music-input-area').style.display = 'flex';
    document.getElementById('local-audio-input').value = '';
}

// =====================================================================
// ĐẠO LUẬT 1: THIẾT KỴ BAN TRƯA (CÓ MẮT THẦN QUÉT LỊCH SÁNG)
// =====================================================================
function checkNoonPenalty() {
    if (!currentUser) return; 
    if (goals.length === 0 && Object.keys(dailyLogs).length === 0) return;

    let now = new Date();
    let todayStr = now.toISOString().split('T')[0];
    let lastNoonPenalty = localStorage.getItem('lastNoonPenaltyDate');
    
    // Chỉ kích hoạt sát thủ 1 lần sau 12h trưa mỗi ngày
    if (now.getHours() >= 12 && lastNoonPenalty !== todayStr) {
        
        let currentDayOfWeek = now.getDay(); // 0 là CN, 1-6 là T2-T7
        let hasMorningSchedule = false;
        
        // 1. MẮT THẦN QUÉT LỊCH: Sửa đúng tên mảng dữ liệu 'timetableData'
        if (typeof timetableData !== 'undefined' && timetableData.length > 0) {
            hasMorningSchedule = timetableData.some(item => 
                parseInt(item.dow) === currentDayOfWeek && item.shift === 'sang'
            );
        }

        // 2. KIỂM TRA POMODORO: 1 phiên chuẩn = 25 phút (~0.41 giờ)
        let todayHrs = dailyLogs[todayStr] || 0;
        let requiredMorningHrs = 25 / 60; 

        // 3. XỬ ÁN
        if (hasMorningSchedule) {
            console.log("Dò thấy lịch học sáng. Đao phủ 12h rút lui!");
            localStorage.setItem('lastNoonPenaltyDate', todayStr); 
        } else if (todayHrs < requiredMorningHrs) {
            // Sửa lỗi: Gọi đúng biến tài sản từ kho lưu trữ
            let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
            currentUsd -= 10; 
            localStorage.setItem('usdBalance', currentUsd);
            
            // Sửa lỗi: Cập nhật giao diện bằng đúng hàm của The Apex
            updateUsdDisplay();
            if (typeof syncToCloud === 'function') syncToCloud();
            
            alert("THÁNH CHỈ! Sáng nay trống lịch mà bạn chưa kích hoạt phiên Pomodoro nào. Tịch thu $10!");
            localStorage.setItem('lastNoonPenaltyDate', todayStr); 
        } else {
            // Đã học ngoan trước 12h
            localStorage.setItem('lastNoonPenaltyDate', todayStr); 
        }
    }
}

// 🛑 HOOK VÀO HÀM RENDER DASHBOARD ĐỂ KÍCH HOẠT ĐAO PHỦ MỖI KHI MỞ APP
const originDashboardRender = renderDashboard;
window.renderDashboard = function() {
    originDashboardRender(); 
    initDailyQuests();         
    renderDailyQuests();
    checkNoonPenalty(); // Triệu hồi đao phủ đi tuần tra     
}

// =====================================================================
// BẢNG XẾP HẠNG TOÀN CẦU (GLOBAL LEADERBOARD REAL-TIME)
// =====================================================================

function openLeaderboard() {
    // 1. Tạo giao diện Modal nếu chưa có
    let modal = document.getElementById('leaderboard-modal');
    if (!modal) {
        let html = `
        <div id="leaderboard-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:var(--bg-panel); width:90%; max-width:500px; border-radius:24px; padding:24px; border:1px solid var(--border); max-height:85vh; overflow-y:auto; position:relative; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <button onclick="document.getElementById('leaderboard-modal').style.display='none'" style="position:absolute; top:20px; right:20px; background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer; transition:0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'"><i class="fa-solid fa-xmark"></i></button>
                
                <h2 style="margin-top:0; text-align:center; color:var(--brand-trophy); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 1px;"><i class="fa-solid fa-trophy"></i> Bảng Xếp Hạng</h2>
                
                <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:15px; margin-top: 20px;">
                    <button id="tab-lb-hours" onclick="fetchLeaderboard('weeklyHours')" style="flex:1; padding:12px; border-radius:12px; background:var(--brand-focus); color:#fff; border:none; font-weight:800; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-fire"></i> Top Giờ Học</button>
                    <button id="tab-lb-streak" onclick="fetchLeaderboard('streak')" style="flex:1; padding:12px; border-radius:12px; background:var(--bg-hover); color:var(--text-main); border:1px solid var(--border); font-weight:800; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-bolt"></i> Top Chuỗi Kỷ Luật</button>
                </div>

                <div id="leaderboard-content" style="display:flex; flex-direction:column; gap:12px;">
                    <div style="text-align:center; color:var(--text-muted); padding: 40px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px; color: var(--brand-focus);"></i><br>Đang tải dữ liệu từ máy chủ...</div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('leaderboard-modal');
    }
    
    modal.style.display = 'flex';
    
    // Ép đồng bộ điểm mới nhất của ngài lên server trước khi mở bảng
    if (typeof syncToCloud === 'function') syncToCloud();
    
    fetchLeaderboard('weeklyHours');
}

async function fetchLeaderboard(orderByField) {
    const content = document.getElementById('leaderboard-content');
    
    // Cập nhật UI nút Tab
    document.getElementById('tab-lb-hours').style.background = orderByField === 'weeklyHours' ? 'var(--brand-focus)' : 'var(--bg-hover)';
    document.getElementById('tab-lb-hours').style.color = orderByField === 'weeklyHours' ? '#fff' : 'var(--text-main)';
    document.getElementById('tab-lb-streak').style.background = orderByField === 'streak' ? 'var(--brand-focus)' : 'var(--bg-hover)';
    document.getElementById('tab-lb-streak').style.color = orderByField === 'streak' ? '#fff' : 'var(--text-main)';

    content.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding: 40px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px; color: var(--brand-focus);"></i><br>Đang sắp xếp thứ hạng...</div>';
    
    try {
        const snapshot = await db.collection("academic_apex")
            .orderBy(orderByField, "desc")
            .limit(30)
            .get();
            
        if (snapshot.empty) {
            content.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding: 20px;">Chưa có dữ liệu trên bảng vàng.</div>';
            return;
        }

        let html = '';
        let rank = 1;
        
        snapshot.forEach((doc) => {
            let data = doc.data();
            let name = data.displayName || "Ẩn danh";
            let photo = data.photoURL || "https://via.placeholder.com/44";
            
            // Xử lý điểm số tùy theo Tab đang mở
            let score = orderByField === 'weeklyHours' 
                ? (data.weeklyHours || 0).toFixed(1) + 'h' 
                : (data.streak || 0) + ' Ngày';
            
            // Tùy chỉnh màu sắc Top 1, 2, 3
            let rankStyle = "color:var(--text-muted); font-size:1.1rem; font-weight:800; width:35px; text-align:center;";
            let crownHtml = "";
            
            if(rank === 1) {
                rankStyle = "color:#eab308; font-size:1.5rem; font-weight:900; width:35px; text-align:center; text-shadow:0 0 15px rgba(234,179,8,0.4);";
                crownHtml = '<i class="fa-solid fa-crown" style="color: #eab308; position: absolute; top: -10px; left: -10px; font-size: 1.2rem; transform: rotate(-20deg);"></i>';
            }
            else if(rank === 2) rankStyle = "color:#94a3b8; font-size:1.3rem; font-weight:800; width:35px; text-align:center;";
            else if(rank === 3) rankStyle = "color:#b45309; font-size:1.2rem; font-weight:800; width:35px; text-align:center;";

            let isMe = doc.id === USER_DOC_ID;
            let bgStyle = isMe ? "background: linear-gradient(90deg, rgba(14,165,233,0.1) 0%, rgba(0,0,0,0) 100%); border: 1px solid var(--brand-focus);" : "background:var(--bg-hover); border:1px solid var(--border);";

            html += `
            <div class="stagger-item" style="animation-delay: ${rank * 0.05}s; display:flex; align-items:center; padding:14px; border-radius:16px; ${bgStyle} position: relative;">
                <div style="${rankStyle}">${rank}</div>
                <div style="position: relative; margin:0 14px;">
                    ${crownHtml}
                    <img src="${photo}" style="width:44px; height:44px; border-radius:50%; object-fit: cover; border: 2px solid ${isMe ? 'var(--brand-focus)' : 'transparent'};">
                </div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:800; color:var(--text-main); font-size:1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${name} ${isMe ? '<span style="font-size:0.7rem; color:var(--brand-focus); background: rgba(14,165,233,0.1); padding: 2px 6px; border-radius: 4px; vertical-align: middle;">Tài khoản của bạn</span>' : ''}
                    </div>
                </div>
                <div style="font-weight:900; color:var(--brand-trophy); font-size:1.2rem; margin-left: 10px;">${score}</div>
            </div>`;
            rank++;
        });
        
        content.innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải BXH:", error);
        content.innerHTML = '<div style="text-align:center; color:#ef4444; padding: 20px;">Lỗi kết nối Thiên Đình. Vui lòng kiểm tra lại mạng.</div>';
    }
}

// =====================================================================
// HỆ THỐNG MẠNG XÃ HỘI (BẢNG XẾP HẠNG & HỘP THƯ)
// =====================================================================
let blocklist = JSON.parse(localStorage.getItem('saasBlocklist')) || [];

// --- 1. ĐỒNG BỘ TRẠNG THÁI ---
function updateUserStatus(statusStr) {
    if (!currentUser) return;
    db.collection("academic_apex").doc(USER_DOC_ID).set({
        currentStatus: statusStr,
        lastActiveTime: Date.now()
    }, { merge: true }).catch(err => console.log("Lỗi cập nhật trạng thái:", err));
}

// --- 2. LẮNG NGHE TIN NHẮN TỚI ---
function listenForMessages() {
    if(!currentUser) return;
    db.collection("messages").where("receiverId", "==", USER_DOC_ID).onSnapshot((snapshot) => {
        let unreadCount = 0;
        snapshot.forEach(doc => {
            let msg = doc.data();
            // Bỏ qua tin nhắn nếu người gửi nằm trong danh sách chặn
            if (!msg.isRead && !blocklist.includes(msg.senderId)) unreadCount++;
        });
        let badge = document.getElementById("unread-badge");
        if(badge) {
            badge.style.display = unreadCount > 0 ? "flex" : "none";
            badge.innerText = unreadCount;
        }
    });
}

// --- 3. GIAO DIỆN HỘP THƯ (INBOX) ---
// Biến toàn cục lưu trữ bộ lắng nghe Hộp thư (Tránh rò rỉ bộ nhớ)
let inboxSnapshotListener = null;

// HÀM ĐÓNG HỘP THƯ & NGẮT KẾT NỐI LIVE
function closeInbox() {
    let modal = document.getElementById('inbox-modal');
    if (modal) modal.style.display = 'none';
    
    // Ngắt bộ lắng nghe thời gian thực khi không dùng đến
    if (inboxSnapshotListener) {
        inboxSnapshotListener();
        inboxSnapshotListener = null;
    }
}

// 3. GIAO DIỆN HỘP THƯ (INBOX)
function openInbox() {
    if (isSessionActive) {
        alert("Tính năng bị khóa: Bạn đang trong phiên làm việc tập trung.");
        return;
    }
    
    let modal = document.getElementById('inbox-modal');
    if (!modal) {
        let html = `
        <div id="inbox-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:var(--bg-panel); width:90%; max-width:600px; border-radius:24px; padding:24px; border:1px solid var(--border); max-height:85vh; display:flex; flex-direction:column; position:relative; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <button onclick="closeInbox()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                <h2 style="margin-top:0; color:var(--text-main); font-size: 1.5rem;"><i class="fa-solid fa-envelope" style="color:var(--brand-focus);"></i> Hộp thư cá nhân</h2>
                
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                    Mã ID của bạn: <strong style="color:var(--brand-focus); user-select:all; cursor:copy;" title="Bôi đen để copy">${USER_DOC_ID}</strong> (Copy gửi cho bạn bè)
                </div>

                <div style="display:flex; gap:10px; margin: 10px 0 16px 0; border-bottom:1px solid var(--border); padding-bottom:16px; flex-wrap:wrap;">
                    <button id="tab-inbox-main" onclick="renderInbox('main')" style="background:var(--brand-focus); color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer;">Tin nhắn đến</button>
                    <button id="tab-inbox-block" onclick="renderInbox('blocklist')" style="background:var(--bg-hover); color:var(--text-main); border:1px solid var(--border); padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer;">Danh sách chặn</button>
                    <button onclick="openComposeModal('', '')" style="background:var(--brand-trophy); color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:auto;"><i class="fa-solid fa-pen"></i> Soạn thư mới</button>
                </div>
                <div id="inbox-content" style="flex:1; overflow-y:auto; padding-right:8px;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('inbox-modal');
    }
    modal.style.display = 'flex';
    renderInbox('main');
}

async function renderInbox(tab) {
    const content = document.getElementById('inbox-content');
    
    // Xóa bộ lắng nghe cũ trước khi mở bộ mới (Tránh lỗi trùng lặp dữ liệu)
    if (inboxSnapshotListener) {
        inboxSnapshotListener();
        inboxSnapshotListener = null;
    }

    document.getElementById('tab-inbox-main').style.background = tab === 'main' ? 'var(--brand-focus)' : 'var(--bg-hover)';
    document.getElementById('tab-inbox-main').style.color = tab === 'main' ? '#fff' : 'var(--text-main)';
    document.getElementById('tab-inbox-block').style.background = tab === 'blocklist' ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)';
    document.getElementById('tab-inbox-block').style.color = tab === 'blocklist' ? '#ef4444' : 'var(--text-main)';

    if (tab === 'blocklist') {
        if (blocklist.length === 0) {
            content.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Danh sách đen trống.</div>';
            return;
        }
        let html = '';
        blocklist.forEach(uid => {
            html += `<div style="background:var(--bg-hover); padding:16px; border-radius:12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border);">
                <span style="color:var(--text-main); font-weight:700;">ID bị chặn: ${uid.substring(0,8)}...</span>
                <button onclick="unblockUser('${uid}')" style="background:none; border:1px solid var(--brand-info); color:var(--brand-info); padding:6px 12px; border-radius:6px; cursor:pointer;">Bỏ chặn</button>
            </div>`;
        });
        content.innerHTML = html;
        return;
    }

    content.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Đang kết nối kênh Live...</div>';
    
    try {
        // CẬP NHẬT: Kích hoạt onSnapshot để truyền dữ liệu thời gian thực
        inboxSnapshotListener = db.collection("messages")
            .where("receiverId", "==", USER_DOC_ID)
            .onSnapshot((snapshot) => {
                let msgs = [];
                snapshot.forEach(doc => {
                    msgs.push({ id: doc.id, ...doc.data() });
                });
                
                // Sắp xếp tin nhắn: Thời gian mới nhất đẩy lên đầu
                msgs.sort((a, b) => b.timestamp - a.timestamp);
                
                // Giới hạn hiển thị 30 tin nhắn gần nhất để giữ giao diện nhẹ nhàng
                msgs = msgs.slice(0, 30);

                let html = '';
                msgs.forEach(msg => {
                    if (blocklist.includes(msg.senderId)) return; // Ẩn tin nhắn từ kẻ bị chặn
                    
                    let timeStr = new Date(msg.timestamp).toLocaleString('vi-VN');
                    let bgStyle = msg.isRead ? 'background:var(--bg-hover); border-color:var(--border);' : 'background:rgba(14,165,233,0.05); border-color:var(--brand-focus);';
                    
                    html += `
                    <div style="${bgStyle} border:1px solid; padding:16px; border-radius:12px; margin-bottom:12px; position:relative; transition: all 0.3s ease;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                            <span style="color:var(--text-main); font-weight:800;"><i class="fa-solid fa-user"></i> ${msg.senderName}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted);">${timeStr}</span>
                        </div>
                        <div style="color:var(--text-muted); line-height:1.5; margin-bottom:16px; word-break: break-word;">${msg.content}</div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${!msg.isRead ? `<button onclick="markAsRead('${msg.id}')" style="background:none; border:1px solid var(--border); color:var(--text-main); padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;"><i class="fa-solid fa-check"></i> Đã đọc</button>` : ''}
                            <button onclick="openComposeModal('${msg.senderId}', '${msg.senderName}')" style="background:var(--brand-focus); border:none; color:#fff; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;"><i class="fa-solid fa-reply"></i> Phản hồi</button>
                            <button onclick="blockUser('${msg.senderId}')" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; padding:6px 12px; border-radius:6px; cursor:pointer; margin-left:auto; font-weight:600;"><i class="fa-solid fa-ban"></i> Chặn</button>
                        </div>
                    </div>`;
                });
                
                content.innerHTML = html !== '' ? html : '<div style="text-align:center; padding:20px; color:var(--text-muted);">Không có tin nhắn nào.</div>';
            }, (error) => {
                console.error("Lỗi Live Inbox:", error);
                content.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Đứt kết nối Mạng xã hội.</div>';
            });
            
    } catch (e) {
        console.error(e);
        content.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Lỗi tải dữ liệu hộp thư. Vui lòng kiểm tra lại.</div>';
    }
}

// --- 4. LOGIC CHẶN & ĐÁNH DẤU ĐÃ ĐỌC ---
function markAsRead(msgId) {
    db.collection("messages").doc(msgId).update({ isRead: true }).then(() => renderInbox('main'));
}

function blockUser(uid) {
    if (confirm("Chặn người này? Bạn sẽ không nhận được tin nhắn từ họ nữa.")) {
        if (!blocklist.includes(uid)) {
            blocklist.push(uid);
            localStorage.setItem('saasBlocklist', JSON.stringify(blocklist));
            renderInbox('main');
        }
    }
}

function unblockUser(uid) {
    blocklist = blocklist.filter(id => id !== uid);
    localStorage.setItem('saasBlocklist', JSON.stringify(blocklist));
    renderInbox('blocklist');
}

// --- 5. GIAO DIỆN SOẠN TIN NHẮN (COMPOSE) ---
function openComposeModal(receiverId = '', receiverName = '') {
    if (isSessionActive) return alert("Tính năng bị khóa: Đang trong phiên tập trung.");
    
    // Xóa modal cũ nếu có để reset form
    let existingModal = document.getElementById('compose-modal');
    if (existingModal) existingModal.remove();

    let isNewMessage = receiverId === '';
    let headerHtml = isNewMessage 
        ? `<h3 style="margin-top:0; color:var(--text-main);">Soạn tin nhắn mới</h3>
           <input type="text" id="comp-recv-id" placeholder="Dán Mã ID của người nhận vào đây..." style="width:100%; padding:12px; border-radius:12px; background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); margin-bottom:16px; font-family:inherit; outline:none;">`
        : `<h3 style="margin-top:0; color:var(--text-main);">Gửi tin nhắn đến <span style="color:var(--brand-focus);">${receiverName}</span></h3>
           <input type="hidden" id="comp-recv-id" value="${receiverId}">`;

    let html = `
    <div id="compose-modal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
        <div style="background:var(--bg-panel); width:90%; max-width:450px; border-radius:20px; padding:24px; border:1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            ${headerHtml}
            <textarea id="comp-content" rows="4" placeholder="Nhập nội dung tin nhắn..." style="width:100%; padding:12px; border-radius:12px; background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); margin-bottom:16px; font-family:inherit; resize:none; outline:none;"></textarea>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button onclick="document.getElementById('compose-modal').style.display='none'" class="btn-ghost" style="padding:10px 20px;">Hủy bỏ</button>
                <button id="comp-btn-send" onclick="sendMessage()" class="btn-submit active" style="padding:10px 20px;"><i class="fa-solid fa-paper-plane"></i> Gửi đi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function sendMessage() {
    let receiverId = document.getElementById('comp-recv-id').value.trim();
    let content = document.getElementById('comp-content').value.trim();
    
    if (!receiverId) return alert("Vui lòng cung cấp Mã ID người nhận.");
    if (!content) return alert("Nội dung tin nhắn không được để trống.");
    if (receiverId === USER_DOC_ID) return alert("Không thể tự gửi tin nhắn cho chính mình.");
    
    let btn = document.getElementById('comp-btn-send');
    btn.innerText = 'Đang kiểm tra...'; btn.disabled = true;
    
    try {
        // Kiểm tra ID người nhận trên hệ thống
        let receiverDoc = await db.collection("academic_apex").doc(receiverId).get();
        if (!receiverDoc.exists) {
            alert("Mã ID không tồn tại trên hệ thống. Vui lòng kiểm tra lại!");
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi đi'; 
            btn.disabled = false;
            return;
        }

        btn.innerText = 'Đang gửi...';
        await db.collection("messages").add({
            senderId: USER_DOC_ID,
            senderName: currentUser.displayName || "Ẩn danh",
            receiverId: receiverId,
            content: content,
            timestamp: Date.now(),
            isRead: false
        });
        
        // Hiệu ứng thành công thay thế cho alert
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Thành công';
        btn.style.background = '#10b981'; // Chuyển nút sang màu xanh lá
        btn.style.borderColor = '#10b981';
        
        // Đợi 0.8 giây rồi tự động đóng cửa sổ và reset nút
        setTimeout(() => {
            document.getElementById('compose-modal').style.display = 'none';
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi đi'; 
            btn.style.background = ''; // Trả lại màu gốc của CSS
            btn.style.borderColor = '';
            btn.disabled = false;
        }, 800);
        
    } catch (err) {
        console.error(err);
        alert("Lỗi hệ thống: Không thể gửi tin nhắn. Vui lòng thử lại sau.");
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi đi'; 
        btn.disabled = false;
    }
}

// --- 6. BẢNG XẾP HẠNG (CẬP NHẬT TRẠNG THÁI ONLINE/OFFLINE) ---
function openLeaderboard() {
    let modal = document.getElementById('leaderboard-modal');
    if (!modal) {
        let html = `
        <div id="leaderboard-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:var(--bg-panel); width:90%; max-width:500px; border-radius:24px; padding:24px; border:1px solid var(--border); max-height:85vh; overflow-y:auto; position:relative; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <button onclick="document.getElementById('leaderboard-modal').style.display='none'" style="position:absolute; top:20px; right:20px; background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-xmark"></i></button>
                <h2 style="margin-top:0; text-align:center; color:var(--brand-trophy); font-size: 1.5rem; text-transform: uppercase;"><i class="fa-solid fa-trophy"></i> Bảng Xếp Hạng</h2>
                
                <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:15px; margin-top: 20px;">
                    <button id="tab-lb-hours" onclick="fetchLeaderboard('weeklyHours')" style="flex:1; padding:12px; border-radius:12px; font-weight:800; cursor:pointer;">Top Giờ Học</button>
                    <button id="tab-lb-streak" onclick="fetchLeaderboard('streak')" style="flex:1; padding:12px; border-radius:12px; font-weight:800; cursor:pointer;">Top Chuỗi</button>
                </div>
                <div id="leaderboard-content" style="display:flex; flex-direction:column; gap:12px;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('leaderboard-modal');
    }
    modal.style.display = 'flex';
    // Ép đồng bộ dữ liệu mới nhất lên Cloud trước khi xem
    if (typeof syncToCloud === 'function') syncToCloud();
    fetchLeaderboard('weeklyHours');
}

async function fetchLeaderboard(orderByField) {
    const content = document.getElementById('leaderboard-content');
    document.getElementById('tab-lb-hours').style.background = orderByField === 'weeklyHours' ? 'var(--brand-focus)' : 'var(--bg-hover)';
    document.getElementById('tab-lb-hours').style.color = orderByField === 'weeklyHours' ? '#fff' : 'var(--text-main)';
    document.getElementById('tab-lb-streak').style.background = orderByField === 'streak' ? 'var(--brand-focus)' : 'var(--bg-hover)';
    document.getElementById('tab-lb-streak').style.color = orderByField === 'streak' ? '#fff' : 'var(--text-main)';

    content.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding: 40px 0;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i><br>Đang tải dữ liệu...</div>';
    
    try {
        // Lấy Top 30 người dùng
        const snapshot = await db.collection("academic_apex").orderBy(orderByField, "desc").limit(30).get();
        if (snapshot.empty) return content.innerHTML = '<div style="text-align:center; padding: 20px; color:var(--text-muted);">Chưa có dữ liệu xếp hạng.</div>';

        let html = ''; let rank = 1;
        snapshot.forEach((doc) => {
            let data = doc.data();
            let name = data.displayName || "Ẩn danh";
            let photo = data.photoURL || "https://via.placeholder.com/44";
            let score = orderByField === 'weeklyHours' ? (data.weeklyHours || 0).toFixed(1) + 'h' : (data.streak || 0) + ' Ngày';
            
            // Hiển thị trạng thái
            let isFocusing = data.currentStatus === 'focusing';
            let statusColor = isFocusing ? '#ef4444' : '#10b981';
            let statusText = isFocusing ? 'Đang tập trung' : 'Trực tuyến';
            let statusDot = `<div style="width:14px; height:14px; border-radius:50%; background:${statusColor}; position:absolute; bottom:0; right:0; border:2px solid var(--bg-panel); box-shadow: 0 0 5px ${statusColor};" title="${statusText}"></div>`;

            let isMe = doc.id === USER_DOC_ID;
            let actionBtn = !isMe 
                ? `<button onclick="openComposeModal('${doc.id}', '${name}')" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--brand-focus); width:36px; height:36px; border-radius:8px; cursor:pointer;" title="Gửi thư"><i class="fa-solid fa-paper-plane"></i></button>` 
                : `<div style="width:36px;"></div>`;

            let rankStyle = rank === 1 ? "color:#eab308; font-size:1.5rem; font-weight:900;" : (rank === 2 ? "color:#94a3b8; font-size:1.3rem;" : "color:#b45309; font-size:1.2rem;");
            
            html += `
            <div class="stagger-item" style="display:flex; align-items:center; padding:12px; border-radius:16px; background:${isMe ? 'rgba(14,165,233,0.05)' : 'var(--bg-hover)'}; border:1px solid ${isMe ? 'var(--brand-focus)' : 'var(--border)'};">
                <div style="width:35px; text-align:center; font-weight:800; ${rankStyle}">${rank}</div>
                <div style="position:relative; margin:0 12px;">
                    <img src="${photo}" style="width:44px; height:44px; border-radius:50%; object-fit: cover;">
                    ${statusDot}
                </div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:800; color:var(--text-main); font-size:1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                    <div style="font-weight:900; color:var(--brand-trophy); font-size:1.1rem;">${score}</div>
                </div>
                ${actionBtn}
            </div>`;
            rank++;
        });
        content.innerHTML = html;
    } catch (e) {
        console.error(e);
        content.innerHTML = '<div style="text-align:center; color:#ef4444;">Lỗi kết nối máy chủ.</div>';
    }
}

// =====================================================================
// 1. HỆ THỐNG ĐIỀU PHỐI NHIỆM VỤ THÔNG MINH (ĐỒNG BỘ TKB & ĐỊNH MỨC ĐỘNG)
// =====================================================================
let dispatchRate = parseInt(localStorage.getItem('saasDispatchRate'));
if (isNaN(dispatchRate)) dispatchRate = 100;

let consecutiveRejects = parseInt(localStorage.getItem('saasConsecutiveRejects')) || 0;
let activeDispatchQuest = null; 
let dispatchCountdownTimer = null;
let idleDispatchTimer = null;
let dispatchSnoozeUntil = parseInt(localStorage.getItem('saasDispatchSnoozeUntil')) || 0;
// Giữ nguyên trạng thái Tạm nghỉ suốt cả ngày (kể cả khi F5 hoặc tắt tab mở lại)
let todayRestCheck = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
let isFreeRestMode = (localStorage.getItem('saasRestModeDate') === todayRestCheck);

function saveDispatchState() {
    localStorage.setItem('saasDispatchRate', dispatchRate);
    localStorage.setItem('saasConsecutiveRejects', consecutiveRejects);
}

function normalizeText(str) {
    return (str || "").toLowerCase().replace(/\[.*?\]/g, "").trim();
}

function getLocalTodayStr() {
    let now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

// Quét 3 ca tiêu chuẩn (Sáng: 6h-12h | Chiều: 12h-18h | Tối: 18h-22h)
function getCurrentBusySchedule() {
    if (typeof timetableData === 'undefined' || !Array.isArray(timetableData)) return null;
    let now = new Date();
    let hour = now.getHours();
    let currentShift = null;

    if (hour >= 6 && hour < 12) currentShift = 'sang';
    else if (hour >= 12 && hour < 18) currentShift = 'chieu';
    else if (hour >= 18 && hour < 22) currentShift = 'toi';

    if (!currentShift) return null;

    let todayDow = now.getDay();
    let todayStr = getLocalTodayStr();

    return timetableData.find(item => {
        let sDate = new Date(item.startDate); sDate.setHours(0, 0, 0, 0);
        let eDate = new Date(item.endDate); eDate.setHours(23, 59, 59, 999);
        let isPaused = item.pausedDates && item.pausedDates.includes(todayStr);
        return !isPaused && item.shift === currentShift && parseInt(item.dow) === todayDow && now >= sDate && now <= eDate;
    }) || null;
}

// HÀM TÍNH ĐỊNH MỨC ĐỘNG CHO BẤT KỲ NGÀY NÀO (DÙNG CHUNG CHO CẢ ĐIỀU PHỐI & PHẠT LÃI KÉP)
function getRequiredHoursForDate(dateObj, dateStr) {
    if (typeof lastRestDate !== 'undefined' && lastRestDate === dateStr) return 0.25;

    let dow = dateObj.getDay();
    let busyShiftsCount = 0;

    if (typeof timetableData !== 'undefined' && Array.isArray(timetableData)) {
        let shiftsSet = new Set();
        timetableData.forEach(item => {
            let sDate = new Date(item.startDate); sDate.setHours(0, 0, 0, 0);
            let eDate = new Date(item.endDate); eDate.setHours(23, 59, 59, 999);
            let isPaused = item.pausedDates && item.pausedDates.includes(dateStr);
            if (!isPaused && parseInt(item.dow) === dow && dateObj >= sDate && dateObj <= eDate) {
                shiftsSet.add(item.shift);
            }
        });
        busyShiftsCount = shiftsSet.size;
    }

    // 0 ca: 1.0h | 1 ca: 0.75h (45p) | 2 ca: 0.5h (30p) | 3 ca: 0.25h (15p)
    if (busyShiftsCount === 0) return 1.0;
    if (busyShiftsCount === 1) return 0.75;
    if (busyShiftsCount === 2) return 0.5;
    return 0.25;
}

function getTodayDispatchQuotaInfo() {
    let todayStr = getLocalTodayStr();
    let now = new Date();
    let todayDow = now.getDay();
    let busyShiftsCount = 0;

    if (typeof timetableData !== 'undefined' && Array.isArray(timetableData)) {
        let shiftsSet = new Set();
        timetableData.forEach(item => {
            let sDate = new Date(item.startDate); sDate.setHours(0, 0, 0, 0);
            let eDate = new Date(item.endDate); eDate.setHours(23, 59, 59, 999);
            let isPaused = item.pausedDates && item.pausedDates.includes(todayStr);
            if (!isPaused && parseInt(item.dow) === todayDow && now >= sDate && now <= eDate) {
                shiftsSet.add(item.shift);
            }
        });
        busyShiftsCount = shiftsSet.size;
    }

    let requiredHrs = getRequiredHoursForDate(now, todayStr);

    // Đặc quyền: Nếu tổng giờ tuần đã đạt >= mục tiêu tuần (5.0h), hạ định mức ngày xuống 0.25h (15p giữ lửa)
    if (typeof getTotalCycleHours === 'function' && typeof getWeeklyTarget === 'function') {
        if (getTotalCycleHours() >= getWeeklyTarget()) {
            requiredHrs = 0.25;
        }
    }

    let doneHrs = (typeof dailyLogs !== 'undefined' && dailyLogs[todayStr]) ? dailyLogs[todayStr] : 0;
    let isQuotaMet = (requiredHrs - doneHrs) <= 0.01;

    return { busyShiftsCount, requiredHrs, doneHrs, isQuotaMet };
}

function handleDispatchRestAction() {
    let qInfo = getTodayDispatchQuotaInfo();

    if (qInfo.isQuotaMet) {
        isFreeRestMode = !isFreeRestMode;
        if (isFreeRestMode) {
            localStorage.setItem('saasRestModeDate', getLocalTodayStr()); // Lưu cứng ngày đang Tạm nghỉ
            clearTimeout(idleDispatchTimer);
        } else {
            localStorage.removeItem('saasRestModeDate'); // Hủy Tạm nghỉ -> Bật lại Trực tuyến
            scheduleIdleDispatch(45000);
        }
        renderDispatchStatusWidget();
        return;
    }

    if (Date.now() < dispatchSnoozeUntil) {
        dispatchSnoozeUntil = 0;
        localStorage.setItem('saasDispatchSnoozeUntil', '0');
        scheduleIdleDispatch(45000);
        renderDispatchStatusWidget();
        return;
    }

    let todayStr = getLocalTodayStr();
    let freeUsedDate = localStorage.getItem('saasFreeSnoozeDate');
    let isFreeAvailable = (freeUsedDate !== todayStr);

    if (isFreeAvailable) {
        if (confirm(`Bạn chưa hoàn thành định mức hôm nay (${qInfo.doneHrs.toFixed(2)}h / ${qInfo.requiredHrs}h).\n\nKích hoạt 1 lượt HOÃN ĐIỀU PHỐI 15 PHÚT miễn phí trong ngày để xem thống kê hoặc sắp xếp lịch trình?`)) {
            localStorage.setItem('saasFreeSnoozeDate', todayStr);
            dispatchSnoozeUntil = Date.now() + 15 * 60 * 1000;
            localStorage.setItem('saasDispatchSnoozeUntil', dispatchSnoozeUntil);
            clearTimeout(idleDispatchTimer);
            renderDispatchStatusWidget();
            setTimeout(() => { renderDispatchStatusWidget(); scheduleIdleDispatch(15000); }, 15 * 60 * 1000 + 500);
        }
    } else {
        let usd = parseInt(localStorage.getItem('usdBalance')) || 0;
        if (confirm(`Bạn đã dùng hết lượt hoãn miễn phí hôm nay.\n\nChi trả $30 USD để tiếp tục hoãn điều phối thêm 15 phút?`)) {
            if (usd < 30) {
                alert("Số dư không đủ $30 USD!");
                return;
            }
            localStorage.setItem('usdBalance', usd - 30);
            if (typeof updateUsdDisplay === 'function') updateUsdDisplay();
            dispatchSnoozeUntil = Date.now() + 15 * 60 * 1000;
            localStorage.setItem('saasDispatchSnoozeUntil', dispatchSnoozeUntil);
            clearTimeout(idleDispatchTimer);
            renderDispatchStatusWidget();
            setTimeout(() => { renderDispatchStatusWidget(); scheduleIdleDispatch(15000); }, 15 * 60 * 1000 + 500);
        }
    }
}

function selectSmartDispatchTask(activeGoals) {
    let now = new Date();
    let todayDow = now.getDay();
    let todayStr = getLocalTodayStr();

    let tomorrowObj = new Date(now);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    let tomorrowDow = tomorrowObj.getDay();
    let tomorrowStr = tomorrowObj.getFullYear() + '-' + String(tomorrowObj.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrowObj.getDate()).padStart(2, '0');

    let todayClasses = [];
    let tomorrowClasses = [];
    let qInfo = getTodayDispatchQuotaInfo();

    if (typeof timetableData !== 'undefined' && Array.isArray(timetableData)) {
        timetableData.forEach(item => {
            let sDate = new Date(item.startDate); sDate.setHours(0, 0, 0, 0);
            let eDate = new Date(item.endDate); eDate.setHours(23, 59, 59, 999);

            let isPausedToday = item.pausedDates && item.pausedDates.includes(todayStr);
            if (!isPausedToday && parseInt(item.dow) === todayDow && now >= sDate && now <= eDate) {
                if (item.type === 'offline' || item.type === 'online' || item.type === 'exam') todayClasses.push(item);
            }

            let isPausedTomorrow = item.pausedDates && item.pausedDates.includes(tomorrowStr);
            if (!isPausedTomorrow && parseInt(item.dow) === tomorrowDow && tomorrowObj >= sDate && tomorrowObj <= eDate) {
                if (item.type === 'offline' || item.type === 'online' || item.type === 'exam') tomorrowClasses.push(item);
            }
        });
    }

    let chosenGoal = null;
    let reasonText = "";

    for (let cls of todayClasses) {
        let match = activeGoals.find(g => normalizeText(g.name).includes(normalizeText(cls.name)) || normalizeText(cls.name).includes(normalizeText(g.name)));
        if (match) {
            chosenGoal = match;
            reasonText = cls.type === 'exam' ? `Lịch thi hôm nay (${cls.name})` : `Ôn tập môn học hôm nay (${cls.name})`;
            break;
        }
    }

    if (!chosenGoal) {
        for (let cls of tomorrowClasses) {
            let match = activeGoals.find(g => normalizeText(g.name).includes(normalizeText(cls.name)) || normalizeText(cls.name).includes(normalizeText(g.name)));
            if (match) {
                chosenGoal = match;
                reasonText = cls.type === 'exam' ? `Trọng tâm: Ngày mai thi (${cls.name})` : `Chuẩn bị cho lịch học ngày mai (${cls.name})`;
                break;
            }
        }
    }

    if (!chosenGoal) {
        let goalsWithDeadline = activeGoals.filter(g => g.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        if (goalsWithDeadline.length > 0) {
            chosenGoal = goalsWithDeadline[0];
            reasonText = `Ưu tiên mục tiêu sát hạn chót (${chosenGoal.deadline})`;
        }
    }

    if (!chosenGoal) {
        let sortedByRemaining = [...activeGoals].sort((a, b) => b.current - a.current);
        chosenGoal = sortedByRemaining[0];
        reasonText = `Đẩy tiến độ mục tiêu trọng tâm (Còn ${chosenGoal.current.toFixed(1)}h)`;
    }

    let isTiredOrLate = (qInfo.busyShiftsCount >= 2) || (now.getHours() >= 21) || (chosenGoal.current <= 0.3);
    let duration = isTiredOrLate ? 15 : 25;

    if (qInfo.busyShiftsCount >= 2) {
        reasonText += ` • Phiên 15p (Hôm nay có ${qInfo.busyShiftsCount} ca lịch trình)`;
    }

    return { goal: chosenGoal, duration: duration, reason: reasonText };
}

function renderDispatchStatusWidget() {
    let dash = document.getElementById('view-dashboard');
    if (!dash || dash.style.display === 'none') return;

    let widget = document.getElementById('dispatch-status-widget');
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'dispatch-status-widget';
        widget.className = 'stagger-item';
        widget.style.marginBottom = '20px';
        let questBox = document.getElementById('imperial-quests');
        if (questBox) dash.insertBefore(widget, questBox);
        else dash.insertBefore(widget, document.getElementById('dashboard-grid'));
    }

    let busyItem = getCurrentBusySchedule();
    let isCurfew = (typeof isCurfewActive === 'function' && isCurfewActive());
    let qInfo = getTodayDispatchQuotaInfo();
    let isSnoozed = Date.now() < dispatchSnoozeUntil;

    let statusColor = "#10b981";
    let statusText = `Trực tuyến (Định mức hôm nay: ${qInfo.doneHrs.toFixed(2)}h / ${qInfo.requiredHrs}h)`;

    if (isCurfew) {
        statusColor = "#64748b";
        statusText = "Đang trong Giờ Giới Nghiêm (Ngưng tự động điều phối)";
    } else if (busyItem) {
        statusColor = "#0ea5e9";
        let shiftName = busyItem.shift === 'sang' ? 'Ca Sáng' : (busyItem.shift === 'chieu' ? 'Ca Chiều' : 'Ca Tối');
        statusText = `Miễn làm phiền • Đang trong ${shiftName}: ${busyItem.name}`;
    } else if (isFreeRestMode && qInfo.isQuotaMet) {
        statusColor = "#64748b";
        statusText = "Đang Tạm nghỉ (Đã hoàn thành định mức kỷ luật hôm nay)";
    } else if (isSnoozed) {
        let minsLeft = Math.ceil((dispatchSnoozeUntil - Date.now()) / 60000);
        statusColor = "#8b5cf6";
        statusText = `Đang hoãn điều phối tạm thời (Còn ~${minsLeft} phút)`;
    } else if (dispatchRate < 50 || consecutiveRejects >= 3) {
        statusColor = "#ef4444";
        statusText = "Chế tài (Áp dụng nhiệm vụ bắt buộc • Nhận 30% thưởng gốc)";
    } else if (dispatchRate < 80) {
        statusColor = "#f59e0b";
        statusText = "Cảnh báo (Tạm ngưng đề xuất nhiệm vụ hệ số cao)";
    }

    let restBtnLabel = "";
    let restBtnStyle = "background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-muted);";
    if (qInfo.isQuotaMet) {
        restBtnLabel = isFreeRestMode ? `<i class="fa-solid fa-play"></i> Bật Trực tuyến` : `<i class="fa-solid fa-mug-hot"></i> Tạm nghỉ (Đã đủ ${qInfo.requiredHrs}h)`;
        if (!isFreeRestMode) restBtnStyle = "background: rgba(16,185,129,0.12); border: 1px solid #10b981; color: #10b981;";
    } else if (isSnoozed) {
        restBtnLabel = `<i class="fa-solid fa-bolt"></i> Hủy hoãn`;
        restBtnStyle = "background: rgba(139,92,246,0.12); border: 1px solid #8b5cf6; color: #8b5cf6;";
    } else {
        let isFree = (localStorage.getItem('saasFreeSnoozeDate') !== getLocalTodayStr());
        restBtnLabel = `<i class="fa-regular fa-clock"></i> Hoãn 15p (${isFree ? 'Miễn phí' : '$30'})`;
    }

    widget.innerHTML = `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-left: 4px solid ${statusColor}; border-radius: 14px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: ${statusColor}15; color: ${statusColor}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Điều phối Thông minh (Đồng bộ TKB • Hôm nay có ${qInfo.busyShiftsCount} ca lịch)</div>
                    <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 700;">${statusText}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div style="text-align: right; margin-right: 6px;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Hiệu suất</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: ${statusColor};">${dispatchRate}%</div>
                </div>
                <button onclick="handleDispatchRestAction()" style="${restBtnStyle} padding: 8px 12px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.8rem; transition: 0.2s;">
                    ${restBtnLabel}
                </button>
                <button onclick="triggerDispatchPing(true)" style="background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-main); padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.82rem; transition: 0.2s;" onmouseover="this.style.borderColor='var(--brand-focus)'" onmouseout="this.style.borderColor='var(--border)'">
                    <i class="fa-solid fa-bolt" style="color: var(--brand-warning);"></i> Nhận đề xuất
                </button>
            </div>
        </div>`;
}

function scheduleIdleDispatch(customDelay = 45000) {
    clearTimeout(idleDispatchTimer);
    if (typeof isCurfewActive === 'function' && isCurfewActive()) return;
    if (getCurrentBusySchedule() !== null) return;
    if (Date.now() < dispatchSnoozeUntil) return;
    let qInfo = getTodayDispatchQuotaInfo();
    if (isFreeRestMode && qInfo.isQuotaMet) return;
    if (isSessionActive || isBreakActive || isGracePeriod || isPendingTax || dailyDebtMinutes > 0) return;
    
    idleDispatchTimer = setTimeout(() => {
        if (typeof isCurfewActive === 'function' && isCurfewActive()) return;
        if (getCurrentBusySchedule() !== null) return;
        if (Date.now() < dispatchSnoozeUntil) return;
        if (isFreeRestMode && getTodayDispatchQuotaInfo().isQuotaMet) return;

        let lbOpen = document.getElementById('leaderboard-modal')?.style.display === 'flex';
        let inboxOpen = document.getElementById('inbox-modal')?.style.display === 'flex';
        let tradeOpen = document.getElementById('trade-modal')?.style.display === 'flex';
        let shopOpen = document.getElementById('academic-shop-modal')?.style.display === 'flex';
        let chatOpen = (typeof isCopilotOpen !== 'undefined' && isCopilotOpen);
        if (lbOpen || inboxOpen || tradeOpen || shopOpen || chatOpen) {
            scheduleIdleDispatch(45000);
            return;
        }

        let dash = document.getElementById('view-dashboard');
        let activeGoals = goals.filter(g => g.current > 0);
        if (dash && dash.style.display !== 'none' && !isSessionActive && activeGoals.length > 0) {
            triggerDispatchPing(false);
        }
    }, customDelay);
}

function triggerDispatchPing(isManual = false) {
    if (typeof isCurfewActive === 'function' && isCurfewActive()) {
        if (isManual) alert("Hệ thống đang trong Giờ Giới Nghiêm. Trạm điều phối tạm ngưng phát nhiệm vụ để đảm bảo thời gian nghỉ ngơi!");
        return;
    }

    let activeGoals = goals.filter(g => g.current > 0);
    if (activeGoals.length === 0) {
        if (isManual) alert("Vui lòng khởi tạo ít nhất 1 Mục tiêu trước khi nhận nhiệm vụ điều phối!");
        return;
    }
    if (isSessionActive || isBreakActive || isGracePeriod) return;
    if (document.getElementById('dispatch-modal') && document.getElementById('dispatch-modal').style.display === 'flex') return;

    let smartPick = selectSmartDispatchTask(activeGoals);
    let targetGoal = smartPick.goal;
    let duration = smartPick.duration;
    let isMandatory = (consecutiveRejects >= 3 || dispatchRate < 50);

    let hour = new Date().getHours();
    let surgeMultiplier = 1.5;
    let tierLabel = "Nhiệm vụ Tiêu chuẩn";

    if (dispatchRate >= 80 && !isMandatory) {
        if (hour >= 21 || hour < 6) {
            surgeMultiplier = 2.5;
            tierLabel = "Khung Giờ Cao Điểm Tối (x2.5 Thưởng)";
        } else {
            surgeMultiplier = 2.0;
            tierLabel = "Nhiệm vụ Ưu tiên (x2.0 Thưởng)";
        }
    } else if (dispatchRate < 80 && !isMandatory) {
        surgeMultiplier = 1.2;
        tierLabel = "Nhiệm vụ Khôi phục Tín nhiệm";
    }

    let originalReward = Math.round(duration * surgeMultiplier + 20);
    let finalReward = isMandatory ? Math.round(originalReward * 0.3) : originalReward;

    activeDispatchQuest = {
        goalId: targetGoal.id,
        goalName: targetGoal.name,
        duration: duration,
        originalReward: originalReward,
        finalReward: finalReward,
        isMandatory: isMandatory,
        reason: smartPick.reason,
        tierLabel: isMandatory ? "NHIỆM VỤ BẮT BUỘC (KHÔI PHỤC HIỆU SUẤT)" : tierLabel
    };

    playAlertSound();
    showDispatchModal();
}

function showDispatchModal() {
    let modal = document.getElementById('dispatch-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dispatch-modal';
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.82); z-index:10001; align-items:center; justify-content:center; backdrop-filter:blur(6px);";
        document.body.appendChild(modal);
    }

    let q = activeDispatchQuest;
    let accentColor = q.isMandatory ? "#ef4444" : "#10b981";
    const DECISION_SECONDS = 15;

    let rewardDisplayHtml = q.isMandatory
        ? `<div style="text-align:right; flex-shrink:0;">
               <div style="font-size:0.8rem; color:var(--text-muted); text-decoration:line-through;">Mức gốc: +$${q.originalReward}</div>
               <div style="font-size:1.5rem; font-weight:900; color:#f59e0b;">+$${q.finalReward} <span style="font-size:0.75rem; background:rgba(245,158,11,0.15); padding:2px 6px; border-radius:4px;">30%</span></div>
           </div>`
        : `<div style="text-align:right; flex-shrink:0;">
               <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Thưởng hoàn thành</div>
               <div style="font-size:1.6rem; font-weight:900; color:#10b981;">+$${q.finalReward}</div>
           </div>`;

    let actionButtonsHtml = q.isMandatory
        ? `<div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.08); padding:10px 12px; border-radius:8px; margin-bottom:14px; font-weight:600; line-height:1.4;">
               <i class="fa-solid fa-circle-exclamation"></i> Bạn đã từ chối liên tiếp 3 nhiệm vụ hoặc để Hiệu suất dưới 50%. Hệ thống yêu cầu hoàn thành phiên này (nhận 30% mức thưởng gốc) để khôi phục quyền lợi điều phối.
           </div>
           <button onclick="acceptDispatchQuest()" style="width:100%; padding:14px; border-radius:12px; border:none; background:#ef4444; color:#fff; font-weight:800; font-size:1rem; cursor:pointer; box-shadow:0 4px 15px rgba(239,68,68,0.4);">
               <i class="fa-solid fa-check-double"></i> BẮT ĐẦU NGAY (${q.duration} PHÚT)
           </button>`
        : `<div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:6px; overflow:hidden; margin-bottom:16px;">
               <div id="dispatch-timer-bar" style="width:100%; height:100%; background:${accentColor}; transition:width 1s linear;"></div>
           </div>
           <div style="display:flex; gap:12px;">
               <button onclick="declineDispatchQuest()" style="flex:1; padding:12px; border-radius:12px; border:1px solid var(--border); background:var(--bg-hover); color:var(--text-muted); font-weight:700; cursor:pointer;">
                   Bỏ qua (-15% • Nghỉ 4p)
               </button>
               <button onclick="acceptDispatchQuest()" style="flex:2; padding:12px; border-radius:12px; border:none; background:${accentColor}; color:#fff; font-weight:800; font-size:1rem; cursor:pointer; box-shadow:0 4px 15px rgba(16,185,129,0.35);">
                   <i class="fa-solid fa-bolt"></i> Nhận nhiệm vụ (<span id="dispatch-sec-left">${DECISION_SECONDS}</span>s)
               </button>
           </div>`;

    modal.innerHTML = `
        <div style="background:var(--bg-panel); width:92%; max-width:450px; border-radius:22px; padding:24px; border:2px solid ${accentColor}; box-shadow:0 15px 50px rgba(0,0,0,0.6);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <span style="background:${accentColor}20; color:${accentColor}; padding:4px 10px; border-radius:100px; font-size:0.75rem; font-weight:800;">
                    <i class="fa-solid fa-satellite-dish"></i> ${q.tierLabel}
                </span>
                <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">Hiệu suất: ${dispatchRate}%</span>
            </div>
            <div style="background:var(--bg-hover); border:1px solid var(--border); border-radius:16px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div style="overflow:hidden;">
                    <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Mục tiêu đề xuất</div>
                    <div style="font-size:1.15rem; font-weight:800; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:4px 0;">${q.goalName}</div>
                    <div style="font-size:0.85rem; color:var(--brand-focus); font-weight:700;"><i class="fa-regular fa-clock"></i> Thời lượng: ${q.duration} phút</div>
                </div>
                ${rewardDisplayHtml}
            </div>
            <div style="font-size:0.78rem; color:var(--brand-info); background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.2); padding:8px 12px; border-radius:10px; margin-bottom:16px; font-weight:600;">
                <i class="fa-solid fa-calendar-check"></i> <b>Căn cứ điều phối:</b> ${q.reason}
            </div>
            ${actionButtonsHtml}
        </div>`;

    modal.style.display = 'flex';

    clearInterval(dispatchCountdownTimer);
    if (!q.isMandatory) {
        let sec = DECISION_SECONDS;
        dispatchCountdownTimer = setInterval(() => {
            sec--;
            let secEl = document.getElementById('dispatch-sec-left');
            let barEl = document.getElementById('dispatch-timer-bar');
            if (secEl) secEl.innerText = sec;
            if (barEl) barEl.style.width = `${(sec / DECISION_SECONDS) * 100}%`;

            if (sec <= 0) {
                clearInterval(dispatchCountdownTimer);
                declineDispatchQuest();
            }
        }, 1000);
    }
}

function acceptDispatchQuest() {
    clearInterval(dispatchCountdownTimer);
    let modal = document.getElementById('dispatch-modal');
    if (modal) modal.style.display = 'none';

    if (!activeDispatchQuest) return;
    let q = activeDispatchQuest;

    openGoal(q.goalId);
    startSession(q.duration, false);

    let badge = document.getElementById('focus-badge');
    if (badge) {
        badge.innerText = q.isMandatory ? `NHIỆM VỤ BẮT BUỘC (THƯỞNG 30%: +$${q.finalReward})` : `ĐANG CHẠY NHIỆM VỤ ĐIỀU PHỐI (+$${q.finalReward})`;
    }
}

function declineDispatchQuest() {
    clearInterval(dispatchCountdownTimer);
    let modal = document.getElementById('dispatch-modal');
    if (modal) modal.style.display = 'none';

    activeDispatchQuest = null;
    consecutiveRejects++;
    dispatchRate = Math.max(0, dispatchRate - 15);
    saveDispatchState();
    renderDispatchStatusWidget();

    if (consecutiveRejects >= 3) {
        setTimeout(() => {
            triggerDispatchPing(false);
        }, 600);
    } else {
        scheduleIdleDispatch(240000);
    }
}

function completeDispatchQuestSuccess() {
    if (!activeDispatchQuest) return;
    let q = activeDispatchQuest;

    let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
    localStorage.setItem('usdBalance', currentUsd + q.finalReward);
    updateUsdDisplay();

    consecutiveRejects = 0;
    dispatchRate = q.isMandatory ? Math.max(70, dispatchRate + 20) : Math.min(100, dispatchRate + 10);
    saveDispatchState();

    dispatchSnoozeUntil = Date.now() + 15 * 60 * 1000;
    localStorage.setItem('saasDispatchSnoozeUntil', dispatchSnoozeUntil);

    alert(`HOÀN THÀNH NHIỆM VỤ ĐIỀU PHỐI!\n- Thưởng điều phối: +$${q.finalReward}\n- Hiệu suất nhận lệnh phục hồi lên: ${dispatchRate}%\n- Hệ thống tự động cấp 15 phút nghỉ ngơi miễn làm phiền.`);
    activeDispatchQuest = null;
}

const originalCancelSessionForDispatch = cancelSession;
window.cancelSession = function() {
    if (activeDispatchQuest) {
        if (confirm("CẢNH BÁO HỦY NHIỆM VỤ ĐIỀU PHỐI:\nViệc hủy nhiệm vụ sau khi đã nhận sẽ bị trừ $50 phí hủy chuyến, giảm 30% Hiệu suất nhận lệnh và giảm 1% giá cổ phiếu. Bạn chắc chắn muốn hủy?")) {
            let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
            localStorage.setItem('usdBalance', Math.max(0, currentUsd - 50));
            updateUsdDisplay();

            dispatchRate = Math.max(0, dispatchRate - 30);
            consecutiveRejects++;
            saveDispatchState();
            activeDispatchQuest = null;

            impactStockMarket("CANCEL");
            clearInterval(timerInterval);
            clearInterval(pauseInterval);
            resetSystem();
        }
    } else {
        originalCancelSessionForDispatch();
    }
};

// =====================================================================
// 2. HUY HIỆU SAO CHẤT LƯỢNG DƯỚI ẢNH ĐẠI DIỆN (STAR RATING)
// =====================================================================
let starHistory = JSON.parse(localStorage.getItem('saasStarHistory'));
if (!Array.isArray(starHistory) || starHistory.length === 0) {
    starHistory = [5, 5, 5, 5, 5];
    localStorage.setItem('saasStarHistory', JSON.stringify(starHistory));
}

function getAverageStarRating() {
    if (!starHistory || starHistory.length === 0) return 5.0;
    let sum = starHistory.reduce((a, b) => a + b, 0);
    return sum / starHistory.length;
}

function recordNewStarRating(score) {
    starHistory.push(score);
    if (starHistory.length > 20) starHistory.shift();
    localStorage.setItem('saasStarHistory', JSON.stringify(starHistory));
    renderAvatarStarBadge();
}

function renderAvatarStarBadge() {
    let userBadge = document.getElementById('user-auth-badge');
    if (!userBadge) return;

    let img = userBadge.querySelector('img');
    if (!img) return;

    let wrapper = document.getElementById('avatar-star-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'avatar-star-wrapper';
        wrapper.style.cssText = "position: relative; display: inline-flex; flex-direction: column; align-items: center; flex-shrink: 0; margin-bottom: 6px;";
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
    }

    let avg = getAverageStarRating();
    let badgeColor = avg >= 4.5 ? "#f59e0b" : (avg >= 3.8 ? "#10b981" : "#ef4444");

    let starBadge = document.getElementById('user-star-pill');
    if (!starBadge) {
        starBadge = document.createElement('div');
        starBadge.id = 'user-star-pill';
        wrapper.appendChild(starBadge);
    }

    starBadge.style.cssText = `
        position: absolute;
        bottom: -8px;
        background: var(--bg-panel);
        color: var(--text-main);
        border: 1.5px solid ${badgeColor};
        border-radius: 100px;
        padding: 1px 6px;
        font-size: 0.65rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        z-index: 12;
        white-space: nowrap;
    `;
    starBadge.title = `Điểm chất lượng báo cáo (Trung bình ${starHistory.length} phiên gần nhất)`;
    starBadge.innerHTML = `<i class="fa-solid fa-star" style="color: ${badgeColor}; font-size: 0.6rem;"></i> ${avg.toFixed(2)}`;
}

// =====================================================================
// 3. TRỢ LÝ HỌC THUẬT AI (FLOATING COPILOT - $30/CÂU VƯỢT MỨC)
// =====================================================================
let copilotHistory = [];
let isCopilotOpen = false;
let copilotLastAskTime = 0;
const FREE_DAILY_CHATS = 3;
const EXTRA_CHAT_COST = 30;

function getCopilotQuota() {
    let todayStr = getLocalTodayStr();
    let savedDate = localStorage.getItem('saasCopilotDate');
    let used = parseInt(localStorage.getItem('saasCopilotUsed')) || 0;

    if (savedDate !== todayStr) {
        used = 0;
        localStorage.setItem('saasCopilotDate', todayStr);
        localStorage.setItem('saasCopilotUsed', '0');
    }
    return { used, remainingFree: Math.max(0, FREE_DAILY_CHATS - used) };
}

function incrementCopilotQuota() {
    let q = getCopilotQuota();
    localStorage.setItem('saasCopilotUsed', q.used + 1);
    updateCopilotQuotaBadge();
}

function updateCopilotQuotaBadge() {
    let badge = document.getElementById('copilot-quota-info');
    if (!badge) return;
    let q = getCopilotQuota();
    if (q.remainingFree > 0) {
        badge.innerHTML = `<i class="fa-solid fa-bolt" style="color:#fbbf24;"></i> Miễn phí hôm nay: <b>${q.remainingFree}/${FREE_DAILY_CHATS} lượt</b>`;
    } else {
        badge.innerHTML = `<i class="fa-solid fa-coins" style="color:#fbbf24;"></i> Phí tư vấn AI: <b>$${EXTRA_CHAT_COST} / câu hỏi</b>`;
    }
}

function initAICopilotWidget() {
    if (document.getElementById('ai-copilot-container')) return;

    const container = document.createElement('div');
    container.id = 'ai-copilot-container';
    container.innerHTML = `
        <button id="ai-copilot-fab" onclick="toggleAICopilot()" title="Trợ lý Học thuật AI" style="position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #2563eb, #7c3aed); color:#fff; border:none; box-shadow:0 8px 25px rgba(37,99,235,0.45); cursor:pointer; z-index:9998; font-size:1.35rem; display:flex; align-items:center; justify-content:center; transition:transform 0.2s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
            <i class="fa-solid fa-robot"></i>
        </button>

        <div id="ai-copilot-window" style="display:none; position:fixed; bottom:92px; right:24px; width:360px; max-width:calc(100vw - 32px); height:520px; max-height:calc(100vh - 120px); background:var(--bg-panel); border:1px solid var(--border); border-radius:20px; box-shadow:0 15px 45px rgba(0,0,0,0.4); z-index:9999; flex-direction:column; overflow:hidden;">
            <div style="padding:14px 18px; background:linear-gradient(135deg, #2563eb, #7c3aed); color:#fff; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                        <div style="font-weight:800; font-size:0.95rem;">Academic AI Copilot</div>
                        <div id="copilot-quota-info" style="font-size:0.72rem; opacity:0.95;">Đang tải hạn mức...</div>
                    </div>
                </div>
                <button onclick="toggleAICopilot()" style="background:transparent; border:none; color:#fff; font-size:1.2rem; cursor:pointer; opacity:0.85;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div id="ai-copilot-messages" style="flex:1; padding:16px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; font-size:0.86rem; line-height:1.5;">
                <div style="background:var(--bg-hover); color:var(--text-main); padding:12px 14px; border-radius:14px 14px 14px 4px; border:1px solid var(--border); max-width:90%;">
                    Xin chào! Tôi là <b>Trợ lý Học thuật</b>. Các nút tra cứu nhanh bên dưới hoàn toàn <b>miễn phí</b>. Khi cần giải đáp chuyên môn sâu, bạn có ${FREE_DAILY_CHATS} lượt miễn phí mỗi ngày (vượt mức: $${EXTRA_CHAT_COST}/câu).
                </div>
            </div>

            <div style="padding:8px 12px; border-top:1px solid var(--border); display:flex; gap:6px; overflow-x:auto; white-space:nowrap; background:var(--bg-panel);">
                <button onclick="runLocalCopilotCheck('progress')" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); padding:5px 10px; border-radius:100px; font-size:0.74rem; font-weight:700; cursor:pointer;">📊 Phân tích tiến độ (0 phí)</button>
                <button onclick="runLocalCopilotCheck('schedule')" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); padding:5px 10px; border-radius:100px; font-size:0.74rem; font-weight:700; cursor:pointer;">📅 Lịch trình & Ưu tiên</button>
                <button onclick="runLocalCopilotCheck('reputation')" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); padding:5px 10px; border-radius:100px; font-size:0.74rem; font-weight:700; cursor:pointer;">⭐ Hồ sơ Tín nhiệm</button>
            </div>

            <div style="padding:12px; border-top:1px solid var(--border); display:flex; gap:8px; background:var(--bg-panel);">
                <input id="ai-copilot-input" type="text" placeholder="Hỏi AI về phương pháp, kiến thức..." onkeydown="if(event.key==='Enter') sendCopilotMessage()" style="flex:1; padding:10px 14px; border-radius:12px; border:1px solid var(--border); background:var(--bg-hover); color:var(--text-main); font-size:0.86rem; outline:none;">
                <button id="ai-copilot-send" onclick="sendCopilotMessage()" style="background:#2563eb; color:#fff; border:none; width:40px; height:40px; border-radius:12px; cursor:pointer; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(container);
    updateCopilotQuotaBadge();
}

function toggleAICopilot() {
    initAICopilotWidget();
    const win = document.getElementById('ai-copilot-window');
    isCopilotOpen = !isCopilotOpen;
    win.style.display = isCopilotOpen ? 'flex' : 'none';
    updateCopilotQuotaBadge();
    if (isCopilotOpen) {
        setTimeout(() => document.getElementById('ai-copilot-input')?.focus(), 100);
    }
}

function appendCopilotBubble(text, sender = 'ai') {
    initAICopilotWidget();
    const box = document.getElementById('ai-copilot-messages');
    if (!box) return;

    const msgDiv = document.createElement('div');
    if (sender === 'user') {
        msgDiv.style.cssText = "align-self:flex-end; background:#2563eb; color:#fff; padding:10px 14px; border-radius:14px 14px 4px 14px; max-width:85%; word-wrap:break-word; font-weight:600;";
        msgDiv.innerText = text;
    } else {
        msgDiv.style.cssText = "align-self:flex-start; background:var(--bg-hover); color:var(--text-main); padding:12px 14px; border-radius:14px 14px 14px 4px; border:1px solid var(--border); max-width:90%; word-wrap:break-word;";
        msgDiv.innerHTML = text;
    }
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    return msgDiv;
}

function runLocalCopilotCheck(type) {
    let activeGoals = goals.filter(g => g.current > 0);
    let cycleHrs = (typeof getTotalCycleHours === 'function') ? getTotalCycleHours() : 0;
    let targetHrs = (typeof getWeeklyTarget === 'function') ? getWeeklyTarget() : 5.0;

    if (type === 'progress') {
        appendCopilotBubble("📊 Phân tích tiến độ hiện tại", 'user');
        let remainKPI = Math.max(0, targetHrs - cycleHrs);
        let qInfo = getTodayDispatchQuotaInfo();
        let msg = `<b>Báo cáo Tiến độ Hệ thống:</b><br>• Định mức hôm nay (${qInfo.busyShiftsCount} ca TKB): <b>${qInfo.doneHrs.toFixed(2)}h / ${qInfo.requiredHrs}h</b><br>• KPI Tuần này: <b>${cycleHrs.toFixed(1)}h / ${targetHrs}h</b> ${remainKPI > 0 ? `(Còn thiếu ${remainKPI.toFixed(1)}h)` : `(Đã hoàn thành chỉ tiêu an toàn)`}.`;
        if (activeGoals.length > 0) {
            let pick = (typeof selectSmartDispatchTask === 'function') ? selectSmartDispatchTask(activeGoals) : { goal: activeGoals[0], duration: 25, reason: "Mục tiêu trọng tâm" };
            msg += `<br>• <b>Đề xuất hành động:</b> Ưu tiên thực hiện phiên <b>${pick.duration} phút</b> cho mục tiêu <b>"${pick.goal.name}"</b> (${pick.reason}).`;
        }
        appendCopilotBubble(msg, 'ai');
    } else if (type === 'schedule') {
        appendCopilotBubble("📅 Kiểm tra lịch trình & ưu tiên", 'user');
        let busy = (typeof getCurrentBusySchedule === 'function') ? getCurrentBusySchedule() : null;
        if (busy) {
            appendCopilotBubble(`Hiện tại bạn đang trong ca lịch trình: <b>${busy.name}</b> ${busy.room ? `(Phòng: ${busy.room})` : ''}. Hệ thống đã tự động tạm ngưng phát nhiệm vụ điều phối để bạn tập trung.`, 'ai');
        } else {
            appendCopilotBubble(`Hiện tại bạn đang trống lịch trên Thời khóa biểu. Đây là thời điểm lý tưởng để hoàn thành 1 phiên học nhằm tích lũy giờ và giữ vững Hiệu suất điều phối.`, 'ai');
        }
    } else if (type === 'reputation') {
        appendCopilotBubble("⭐ Kiểm tra Hồ sơ Tín nhiệm", 'user');
        let avgStar = (typeof getAverageStarRating === 'function') ? getAverageStarRating().toFixed(2) : "5.00";
        let dRate = (typeof dispatchRate !== 'undefined') ? dispatchRate : 100;
        let usd = localStorage.getItem('usdBalance') || 0;
        appendCopilotBubble(`<b>Hồ sơ Tín nhiệm Học thuật:</b><br>• Đánh giá chất lượng: <b>⭐ ${avgStar} / 5.00</b><br>• Hiệu suất nhận nhiệm vụ: <b>${dRate}%</b><br>• Ngân khố hiện tại: <b>$${usd}</b>`, 'ai');
    }
}

async function sendCopilotMessage() {
    const input = document.getElementById('ai-copilot-input');
    if (!input) return;
    const userText = input.value.trim();
    if (!userText) return;

    let now = Date.now();
    let diffSec = Math.ceil((15000 - (now - copilotLastAskTime)) / 1000);
    if (now - copilotLastAskTime < 15000) {
        alert(`Vui lòng đợi ${diffSec} giây trước khi gửi câu hỏi tiếp theo.`);
        return;
    }

    let quota = getCopilotQuota();
    let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;

    if (quota.remainingFree <= 0) {
        if (currentUsd < EXTRA_CHAT_COST) {
            appendCopilotBubble(`⚠️ Bạn đã dùng hết ${FREE_DAILY_CHATS} lượt hỏi AI miễn phí hôm nay. Số dư hiện tại ($${currentUsd}) không đủ $${EXTRA_CHAT_COST} để mua thêm lượt tư vấn.`, 'ai');
            return;
        }
        localStorage.setItem('usdBalance', currentUsd - EXTRA_CHAT_COST);
        if (typeof updateUsdDisplay === 'function') updateUsdDisplay();
    }

    copilotLastAskTime = now;
    incrementCopilotQuota();
    input.value = '';

    appendCopilotBubble(userText, 'user');
    const loadingBubble = appendCopilotBubble("<i class='fa-solid fa-spinner fa-spin'></i> Trợ lý AI đang phân tích...", 'ai');

    let activeGoalsList = (typeof goals !== 'undefined' && goals.length > 0)
        ? goals.filter(g => g.current > 0).map(g => `${g.name} (Còn ${g.current.toFixed(1)}h/${g.target}h)`).join("; ")
        : "Chưa có mục tiêu";

    const systemContext = `Bạn là Trợ lý Học thuật AI (Academic Copilot) trong ứng dụng quản lý học tập The Apex.
    Phong cách: Trung lập, chuyên nghiệp, đi thẳng vào trọng tâm, trình bày rõ ràng (dưới 130 từ).
    Ngữ cảnh người dùng: Chuỗi ${currentStreak} ngày | Mục tiêu đang học: ${activeGoalsList}.`;

    copilotHistory.push(`Người dùng: ${userText}`);
    if (copilotHistory.length > 6) copilotHistory.shift();

    const fullPrompt = `${systemContext}\n\nHội thoại:\n${copilotHistory.join("\n")}\n\nTrợ lý AI:`;
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let reply = "Hệ thống cố vấn tạm thời gián đoạn kết nối. Vui lòng thử lại sau.";

    for (let modelName of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 404) continue;
                reply = `Hệ thống AI đang bận (${response.status}). Vui lòng thử lại sau ít phút.`;
                break;
            }
            if (data.candidates && data.candidates.length > 0) {
                reply = data.candidates[0].content.parts[0].text.trim();
                copilotHistory.push(`Trợ lý AI: ${reply}`);
                break;
            }
        } catch (err) {
            console.error("Copilot Error:", err);
        }
    }

    loadingBubble.innerHTML = reply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    if (typeof syncToCloud === 'function') syncToCloud();
}

// =====================================================================
// 4. CỬA HÀNG VẬT PHẨM HỌC THUẬT (ACADEMIC SHOP)
// =====================================================================
function injectShopButtonToSidebar() {
    if (document.getElementById('btn-open-academic-shop')) return;
    let usdEl = document.getElementById('usd-balance');
    if (!usdEl) return;

    let walletBox = usdEl.closest('div');
    if (walletBox && walletBox.parentElement) {
        let btn = document.createElement('button');
        btn.id = 'btn-open-academic-shop';
        btn.onclick = openAcademicShop;
        btn.style.cssText = "width: calc(100% - 32px); margin: 8px 16px 16px 16px; padding: 10px 14px; border-radius: 12px; background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15)); border: 1px solid rgba(245,158,11,0.4); color: var(--brand-trophy); font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;";
        btn.innerHTML = `<i class="fa-solid fa-store"></i> Cửa Hàng Vật Phẩm`;
        walletBox.parentElement.insertBefore(btn, walletBox.nextSibling);
    }
}

function openAcademicShop() {
    let modal = document.getElementById('academic-shop-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'academic-shop-modal';
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.82); z-index:10000; align-items:center; justify-content:center; backdrop-filter:blur(6px);";
        document.body.appendChild(modal);
    }
    renderAcademicShopContent();
    modal.style.display = 'flex';
}

function renderAcademicShopContent() {
    let modal = document.getElementById('academic-shop-modal');
    if (!modal) return;

    let usd = parseInt(localStorage.getItem('usdBalance')) || 0;
    let shields = parseInt(localStorage.getItem('saasFreezes')) || 0;
    let xpBoostUntil = parseInt(localStorage.getItem('saasXpBoostUntil')) || 0;
    let isBoostActive = Date.now() < xpBoostUntil;
    let boostHrsLeft = isBoostActive ? Math.ceil((xpBoostUntil - Date.now()) / 3600000) : 0;

    modal.innerHTML = `
        <div style="background:var(--bg-panel); width:92%; max-width:560px; border-radius:24px; padding:24px; border:1px solid var(--border); max-height:88vh; overflow-y:auto; position:relative; box-shadow:0 15px 50px rgba(0,0,0,0.6);">
            <button onclick="document.getElementById('academic-shop-modal').style.display='none'" style="position:absolute; top:20px; right:20px; background:none; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
            
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
                <div style="width:46px; height:46px; border-radius:14px; background:rgba(245,158,11,0.15); color:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                    <i class="fa-solid fa-store"></i>
                </div>
                <div>
                    <h2 style="margin:0; font-size:1.35rem; color:var(--text-main);">Cửa Hàng Vật Phẩm Học Thuật</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Số dư hiện tại: <strong style="color:#f59e0b;">$${usd} USD</strong></div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                <div style="background:var(--bg-hover); border:1px solid var(--border); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center; gap:14px;">
                    <div>
                        <div style="font-weight:800; color:var(--text-main); font-size:1rem;">🛡️ Khiên Bảo Vệ Chuỗi (Streak Shield)</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">Tự động kích hoạt khi bạn lỡ quên học qua đêm để xóa phạt Lãi kép ngày đó và bảo toàn Chuỗi kỷ luật.</div>
                        <div style="font-size:0.78rem; color:#10b981; font-weight:700;">Đang sở hữu: ${shields} / 2 Khiên</div>
                    </div>
                    <button onclick="buyShopItem('shield')" style="background:#f59e0b; color:#fff; border:none; padding:10px 16px; border-radius:12px; font-weight:800; cursor:pointer; flex-shrink:0;">$1,500</button>
                </div>

                <div style="background:var(--bg-hover); border:1px solid var(--border); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center; gap:14px;">
                    <div>
                        <div style="font-weight:800; color:var(--text-main); font-size:1rem;">⚖️ Phiếu Giảm Án Phạt 50% (Debt Reducer)</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">Cắt giảm ngay lập tức 50% số phút phạt Nợ Lãi Kép hiện tại (hoặc lưu trữ để tự động giảm 50% ở lần bị phạt tiếp theo).</div>
                        <div style="font-size:0.78rem; color:var(--brand-info); font-weight:700;">Trạng thái: ${localStorage.getItem('saasDebtReducerVoucher') === 'true' ? 'Đã trang bị sẵn 1 phiếu' : 'Chưa trang bị'}</div>
                    </div>
                    <button onclick="buyShopItem('reducer')" style="background:#f59e0b; color:#fff; border:none; padding:10px 16px; border-radius:12px; font-weight:800; cursor:pointer; flex-shrink:0;">$800</button>
                </div>

                <div style="background:var(--bg-hover); border:1px solid var(--border); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center; gap:14px;">
                    <div>
                        <div style="font-weight:800; color:var(--text-main); font-size:1rem;">📡 Thẻ Khôi Phục Điều Phối (Dispatch Reset)</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">Đưa Hiệu suất nhận lệnh quay về ngay mốc ưu tiên <b>85%</b> và xóa sạch chuỗi từ chối liên tiếp.</div>
                        <div style="font-size:0.78rem; color:var(--brand-focus); font-weight:700;">Hiệu suất hiện tại: ${dispatchRate}%</div>
                    </div>
                    <button onclick="buyShopItem('dispatch_reset')" style="background:#f59e0b; color:#fff; border:none; padding:10px 16px; border-radius:12px; font-weight:800; cursor:pointer; flex-shrink:0;">$500</button>
                </div>

                <div style="background:var(--bg-hover); border:1px solid var(--border); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center; gap:14px;">
                    <div>
                        <div style="font-weight:800; color:var(--text-main); font-size:1rem;">⚡ Thẻ Tăng Trưởng Cấp Độ 24h (XP Boost x1.5)</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">Trong 24 giờ tiếp theo, mỗi phiên học hoàn thành được cộng thêm <b>+50%</b> số giờ tích lũy vào thanh Cấp độ (Level).</div>
                        <div style="font-size:0.78rem; color:#8b5cf6; font-weight:700;">${isBoostActive ? `Đang kích hoạt (Còn ${boostHrsLeft}h)` : 'Chưa kích hoạt'}</div>
                    </div>
                    <button onclick="buyShopItem('xp_boost')" style="background:#f59e0b; color:#fff; border:none; padding:10px 16px; border-radius:12px; font-weight:800; cursor:pointer; flex-shrink:0;">$1,200</button>
                </div>
            </div>
        </div>
    `;
}

function buyShopItem(itemType) {
    let usd = parseInt(localStorage.getItem('usdBalance')) || 0;

    if (itemType === 'shield') {
        let shields = parseInt(localStorage.getItem('saasFreezes')) || 0;
        if (shields >= 2) return alert("Bạn chỉ được tích trữ tối đa 2 Khiên Bảo Vệ Chuỗi cùng lúc!");
        if (usd < 1500) return alert("Số dư không đủ $1,500 USD!");
        localStorage.setItem('usdBalance', usd - 1500);
        localStorage.setItem('saasFreezes', shields + 1);
        alert("🛡️ Mua thành công 1 Khiên Bảo Vệ Chuỗi!");
    } else if (itemType === 'reducer') {
        if (usd < 800) return alert("Số dư không đủ $800 USD!");
        if (dailyDebtMinutes > 0) {
            localStorage.setItem('usdBalance', usd - 800);
            dailyDebtMinutes = Math.max(15, Math.floor(dailyDebtMinutes / 2));
            localStorage.setItem('saasDailyDebt', dailyDebtMinutes);
            alert(`⚖️ Đã áp dụng Phiếu Giảm Án! Số phút phạt của bạn đã giảm một nửa, chỉ còn ${dailyDebtMinutes} phút.`);
        } else {
            if (localStorage.getItem('saasDebtReducerVoucher') === 'true') return alert("Bạn đã trang bị sẵn 1 Phiếu Giảm Án trong kho rồi!");
            localStorage.setItem('usdBalance', usd - 800);
            localStorage.setItem('saasDebtReducerVoucher', 'true');
            alert("⚖️ Đã trang bị Phiếu Giảm Án 50%! Hệ thống sẽ tự động cắt giảm một nửa số phút phạt nếu bạn lỡ vi phạm định mức ngày.");
        }
    } else if (itemType === 'dispatch_reset') {
        if (dispatchRate >= 85 && consecutiveRejects === 0) return alert("Hiệu suất của bạn đang ở mức Tối ưu (>= 85%), chưa cần dùng thẻ này!");
        if (usd < 500) return alert("Số dư không đủ $500 USD!");
        localStorage.setItem('usdBalance', usd - 500);
        dispatchRate = Math.max(85, dispatchRate);
        consecutiveRejects = 0;
        saveDispatchState();
        renderDispatchStatusWidget();
        alert("📡 Đã khôi phục Hiệu suất nhận lệnh lên 85% và xóa toàn bộ chuỗi từ chối!");
    } else if (itemType === 'xp_boost') {
        if (usd < 1200) return alert("Số dư không đủ $1,200 USD!");
        localStorage.setItem('usdBalance', usd - 1200);
        let currentEnd = parseInt(localStorage.getItem('saasXpBoostUntil')) || 0;
        let baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
        localStorage.setItem('saasXpBoostUntil', baseTime + 24 * 3600 * 1000);
        alert("⚡ Đã kích hoạt Thẻ Tăng Trưởng Cấp Độ (x1.5 Level XP) trong 24 giờ!");
    }

    if (typeof updateUsdDisplay === 'function') updateUsdDisplay();
    renderAcademicShopContent();
    if (typeof syncToCloud === 'function') syncToCloud();
}

const prevCheckCycleShop = window.checkCycleAndStreak;
window.checkCycleAndStreak = function() {
    let prevDebt = dailyDebtMinutes;
    if (typeof prevCheckCycleShop === 'function') prevCheckCycleShop();

    if (dailyDebtMinutes > prevDebt) {
        let shields = parseInt(localStorage.getItem('saasFreezes')) || 0;
        if (shields > 0) {
            localStorage.setItem('saasFreezes', shields - 1);
            dailyDebtMinutes = 0;
            localStorage.setItem('saasDailyDebt', '0');
            let shameModal = document.getElementById('shame-modal');
            if (shameModal) shameModal.style.display = 'none';
            alert("🛡️ KHIÊN BẢO VỆ CHUỖI ĐÃ KÍCH HOẠT!\nHệ thống đã tự động dùng 1 Khiên để miễn trừ án phạt Lãi kép hôm qua và bảo vệ Chuỗi kỷ luật của bạn!");
            if (typeof syncToCloud === 'function') syncToCloud();
            return;
        }
        if (localStorage.getItem('saasDebtReducerVoucher') === 'true') {
            localStorage.removeItem('saasDebtReducerVoucher');
            dailyDebtMinutes = Math.max(15, Math.floor(dailyDebtMinutes / 2));
            localStorage.setItem('saasDailyDebt', dailyDebtMinutes);
            alert(`⚖️ PHIẾU GIẢM ÁN 50% ĐÃ KÍCH HOẠT!\nThời gian phạt khổ sai đã được giảm một nửa, chỉ còn ${dailyDebtMinutes} phút.`);
        }
    }
};

const prevRenderDashboardMaster = window.renderDashboard;
window.renderDashboard = function() {
    if (typeof prevRenderDashboardMaster === 'function') prevRenderDashboardMaster();
    renderDispatchStatusWidget();
    scheduleIdleDispatch(45000);
    injectShopButtonToSidebar();
};

const prevRenderKPIMaster = window.renderKPI;
window.renderKPI = function() {
    if (typeof prevRenderKPIMaster === 'function') prevRenderKPIMaster();
    renderAvatarStarBadge();
    injectShopButtonToSidebar();
};

window.addEventListener('DOMContentLoaded', () => {
    initAICopilotWidget();
    setTimeout(() => {
        renderAvatarStarBadge();
        injectShopButtonToSidebar();
    }, 1200);
});

// =====================================================================
// APEX COMPLETE ENGINE: PHÔI DASHBOARD 4 TẦNG CHUẨN ẢNH & CUSTOM WALLPAPER
// =====================================================================
var bentoTodoList = JSON.parse(localStorage.getItem('saasBentoTodos')) || [
    { id: 1, text: "Ôn tập Giải tích 1 (Chương 3)", done: true },
    { id: 2, text: "Làm đề Reading IELTS", done: true },
    { id: 3, text: "Đọc sách chuyên ngành", done: false },
    { id: 4, text: "Viết báo cáo dự án", done: false },
    { id: 5, text: "Xem lại Flashcard từ vựng", done: false }
];

function saveBentoTodos() {
    localStorage.setItem('saasBentoTodos', JSON.stringify(bentoTodoList));
}

function formatHrsToHM(decimalHours) {
    var totalMins = Math.round((decimalHours || 0) * 60);
    var h = Math.floor(totalMins / 60);
    var m = totalMins % 60;
    return h + "h " + String(m).padStart(2, '0') + "m";
}

// =====================================================================
// 1. TRẠM TÙY CHỈNH ẢNH NỀN TỰ DO (CUSTOM WALLPAPER STUDIO)
// =====================================================================
var DEFAULT_WALLPAPER = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=85";

function applyCustomWallpaper() {
    var savedBg = localStorage.getItem('saasCustomWallpaper') || DEFAULT_WALLPAPER;
    var savedDim = localStorage.getItem('saasWallpaperDim') || "0.78";
    document.documentElement.style.setProperty('--user-wallpaper', "url('" + savedBg + "')");
    document.documentElement.style.setProperty('--user-bg-dim', savedDim);
}

function openWallpaperPickerModal() {
    var modal = document.getElementById('wallpaper-picker-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'wallpaper-picker-modal';
        modal.style.cssText = "display:none; position:fixed; inset:0; background:rgba(5,7,15,0.85); backdrop-filter:blur(10px); z-index:10002; align-items:center; justify-content:center; padding:20px;";
        document.body.appendChild(modal);
    }

    var currentBg = localStorage.getItem('saasCustomWallpaper') || DEFAULT_WALLPAPER;
    var currentDim = localStorage.getItem('saasWallpaperDim') || "0.78";

    var presets = [
        { name: "Hồ Núi Đêm (Mặc định)", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=85" },
        { name: "Cực Quang Bắc Cực", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=85" },
        { name: "Thư Viện Cổ Điển", url: "https://images.unsplash.com/photo-1507842229356-51c61504d3ab?auto=format&fit=crop&w=1920&q=85" },
        { name: "Bầu Trời Ngân Hà", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=85" },
        { name: "Rừng Sương Mù", url: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=85" },
        { name: "Thành Phố Cyberpunk", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85" }
    ];

    var presetHtml = presets.map(function(p) {
        return `
            <div onclick="setWallpaperUrl('${p.url}')" style="cursor:pointer; border-radius:10px; overflow:hidden; border:2px solid ${currentBg===p.url ? '#a855f7' : 'rgba(255,255,255,0.1)'}; position:relative; height:78px; background:url('${p.url}') center/cover no-repeat;">
                <div style="position:absolute; inset:0; background:linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%); display:flex; align-items:flex-end; padding:6px 8px;">
                    <span style="font-size:0.7rem; font-weight:700; color:#fff;">${p.name}</span>
                </div>
            </div>`;
    }).join('');

    modal.innerHTML = `
        <div style="background:#111526; border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:24px; width:100%; max-width:560px; box-shadow:0 25px 60px rgba(0,0,0,0.75); color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; font-size:1.15rem; font-weight:800;"><i class="fa-regular fa-image" style="color:#a855f7; margin-right:8px;"></i>Tùy Chỉnh Ảnh Nền Giao Diện</h3>
                <button onclick="document.getElementById('wallpaper-picker-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:1.3rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div style="font-size:0.76rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:8px;">1. Tải ảnh từ máy tính hoặc dán Link ảnh</div>
            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <input type="text" id="custom-bg-url-input" placeholder="Dán link ảnh (https://...) vào đây" value="${currentBg.startsWith('data:') ? '' : currentBg}" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#fff; font-size:0.8rem; outline:none;">
                <button onclick="setWallpaperUrl(document.getElementById('custom-bg-url-input').value)" style="background:#7c3aed; color:#fff; border:none; padding:0 16px; border-radius:10px; font-weight:700; font-size:0.8rem; cursor:pointer;">Áp dụng</button>
            </div>

            <div style="margin-bottom:18px;">
                <label style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px; border-radius:10px; border:1px dashed rgba(168,85,247,0.5); background:rgba(168,85,247,0.08); color:#e9d5ff; font-weight:700; font-size:0.8rem; cursor:pointer;">
                    <i class="fa-solid fa-upload"></i> Chọn file ảnh từ máy tính của bạn (.jpg, .png, .webp)
                    <input type="file" accept="image/*" style="display:none;" onchange="handleLocalWallpaperUpload(event)">
                </label>
            </div>

            <div style="font-size:0.76rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:8px;">2. Độ tối lớp phủ kính (${Math.round(currentDim * 100)}%)</div>
            <input type="range" min="0.35" max="0.95" step="0.05" value="${currentDim}" oninput="updateWallpaperDim(this.value)" style="width:100%; margin-bottom:18px; accent-color:#a855f7; cursor:pointer;">

            <div style="font-size:0.76rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:8px;">3. Kho ảnh nền chọn lọc</div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                ${presetHtml}
            </div>
        </div>`;
    modal.style.display = 'flex';
}

window.setWallpaperUrl = function(url) {
    if (!url || !url.trim()) return;
    localStorage.setItem('saasCustomWallpaper', url.trim());
    applyCustomWallpaper();
    openWallpaperPickerModal();
};

window.updateWallpaperDim = function(val) {
    localStorage.setItem('saasWallpaperDim', val);
    applyCustomWallpaper();
};

window.handleLocalWallpaperUpload = function(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxW = 1600;
            var scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            try {
                localStorage.setItem('saasCustomWallpaper', dataUrl);
                applyCustomWallpaper();
                document.getElementById('wallpaper-picker-modal').style.display = 'none';
            } catch (err) {
                alert("Ảnh có dung lượng quá lớn! Vui lòng chọn ảnh nhẹ hơn hoặc dùng Link ảnh.");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// =====================================================================
// 2. KHÔI PHỤC THẺ THIẾT QUÂN LUẬT (TUẦN) & KẾT NỐI CHỨNG KHOÁN
// =====================================================================
function ensureMartialLawKpiCard() {
    var dash = document.getElementById('view-dashboard');
    if (!dash) return;

    var kpiCard = document.getElementById('restored-kpi-card');
    if (!kpiCard) {
        kpiCard = document.createElement('div');
        kpiCard.id = 'restored-kpi-card';
        kpiCard.className = 'phoi-card';
        kpiCard.style.cssText = "margin-bottom: 14px; border: 1px solid rgba(20, 184, 166, 0.3);";

        var kpiStatus = document.getElementById('kpi-status');
        var kpiBarFill = document.getElementById('kpi-bar-fill');
        var kpiMsg = document.getElementById('kpi-message');

        kpiCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; font-weight:800; color:#fff; text-transform:uppercase; letter-spacing:0.6px;">
                    <i class="fa-solid fa-crosshairs" style="color:#14b8a6;"></i> Tiến Độ Mục Tiêu Tuần (KPI)
                </div>
                <div id="kpi-status-slot"></div>
            </div>
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.07); border-radius:100px; overflow:hidden; margin-bottom:8px;" id="kpi-bar-slot"></div>
            <div id="kpi-msg-slot"></div>
        `;

        var bento = document.getElementById('bento-command-center');
        if (bento && bento.nextSibling) dash.insertBefore(kpiCard, bento.nextSibling);
        else dash.insertBefore(kpiCard, dash.firstChild);

        if (kpiStatus) {
            kpiStatus.style.cssText = "font-size: 1.45rem !important; font-weight: 900; color: #fff; line-height: 1;";
            document.getElementById('kpi-status-slot').appendChild(kpiStatus);
        }
        if (kpiBarFill) {
            kpiBarFill.style.cssText = "height: 100%; background: linear-gradient(90deg, #14b8a6, #3b82f6); border-radius: 100px; transition: width 0.8s ease;";
            document.getElementById('kpi-bar-slot').appendChild(kpiBarFill);
        }
        if (kpiMsg) {
            kpiMsg.style.cssText = "font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin: 0;";
            document.getElementById('kpi-msg-slot').appendChild(kpiMsg);
        }
    }
}

function getUnifiedStockArray() {
    if (typeof stockMarket !== 'undefined' && stockMarket && !Array.isArray(stockMarket) && typeof stockMarket === 'object') {
        return Object.keys(stockMarket).map(function(k) {
            var item = stockMarket[k] || {};
            return {
                code: k,
                name: item.name || k,
                price: Number(item.price || 100),
                owned: Number(item.owned || 0),
                change: Number(item.lastChange || item.change || 1.8)
            };
        });
    }
    var arr = (typeof stockMarket !== 'undefined' && Array.isArray(stockMarket)) ? stockMarket : ((typeof stocks !== 'undefined' && Array.isArray(stocks)) ? stocks : null);
    if (arr && arr.length > 0) {
        return arr.map(function(item) {
            var c = item.code || item.symbol || "APX";
            return {
                code: c,
                name: item.name || c,
                price: Number(item.price || 100),
                owned: Number(item.owned || 0),
                change: Number(item.lastChange || item.change || 1.5)
            };
        });
    }
    return [
        { code: "BAYM", name: "Bayern Munich", price: 128.4, owned: 0, change: 2.4 },
        { code: "IELT", name: "IELTS 7.0+", price: 95.2, owned: 0, change: 1.6 },
        { code: "TESL", name: "Master TESOL", price: 112.0, owned: 0, change: 0.9 }
    ];
}

function triggerStockTrade(code) {
    if (typeof openTradeModal === 'function') { openTradeModal(code); return; }
    if (typeof openTrade === 'function') { openTrade(code); return; }
    var container = document.getElementById('stock-market-container');
    if (container) {
        var cards = container.querySelectorAll('[onclick]');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].getAttribute('onclick').includes(code)) {
                cards[i].click();
                return;
            }
        }
    }
}

function openFullStockMarketDrawer() {
    var modal = document.getElementById('full-market-exchange-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'full-market-exchange-modal';
        modal.style.cssText = "display:none; position:fixed; inset:0; background:rgba(5,7,15,0.82); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:20px;";
        document.body.appendChild(modal);
    }
    var list = getUnifiedStockArray();
    var usd = parseInt(localStorage.getItem('usdBalance')) || 0;

    var cardsHtml = list.map(function(st) {
        var isUp = st.change >= 0;
        return `
            <div onclick="document.getElementById('full-market-exchange-modal').style.display='none'; triggerStockTrade('${st.code}');" style="background:#161c30; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:16px; cursor:pointer; transition:0.2s;" onmouseover="this.style.borderColor='#8b5cf6'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:800; font-size:0.95rem; color:#fff;"><i class="fa-solid fa-coins" style="color:#fbbf24; margin-right:6px;"></i>${st.code}</span>
                    <span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:6px; background:${isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isUp ? '#10b981' : '#ef4444'};">${isUp ? '+' : ''}${st.change.toFixed(1)}%</span>
                </div>
                <div style="font-size:1.4rem; font-weight:900; color:#fbbf24; margin-bottom:6px;">$${st.price.toFixed(1)}</div>
                <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:#8b95b0;">
                    <span>Sở hữu: <strong style="color:#fff;">${st.owned} cổ</strong></span>
                    <span style="color:#a855f7; font-weight:700;">Giao dịch →</span>
                </div>
            </div>`;
    }).join('');

    modal.innerHTML = `
        <div style="background:#101424; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; width:100%; max-width:680px; box-shadow:0 25px 60px rgba(0,0,0,0.7);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                <div>
                    <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin:0;"><i class="fa-solid fa-chart-line" style="color:#10b981; margin-right:8px;"></i>Thị Trường Cổ Phiếu Học Thuật</h3>
                    <div style="font-size:0.78rem; color:#8b95b0; margin-top:4px;">Số dư khả dụng: <strong style="color:#fbbf24;">$${usd.toLocaleString()} USD</strong></div>
                </div>
                <button onclick="document.getElementById('full-market-exchange-modal').style.display='none'" style="background:none; border:none; color:#8b95b0; font-size:1.3rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:12px;">${cardsHtml}</div>
        </div>`;
    modal.style.display = 'flex';
}

// =====================================================================
// 3. CSS CHUẨN PHÔI ẢNH DEMO (4 TẦNG + TÙY CHỈNH ẢNH NỀN ĐỘNG)
// =====================================================================
function injectPhoiLayoutCSS() {
    applyCustomWallpaper();
    var oldStyle = document.getElementById('clean-layout-fix-css');
    if (oldStyle) oldStyle.remove();

    var style = document.createElement('style');
    style.id = 'clean-layout-fix-css';
    style.innerHTML = `
        :root {
            --user-wallpaper: url('${DEFAULT_WALLPAPER}');
            --user-bg-dim: 0.78;
            --theme-accent: #8b5cf6;
            --theme-accent-2: #6366f1;
            --theme-soft: rgba(139, 92, 246, 0.18);
            --theme-border: rgba(139, 92, 246, 0.35);
        }
        [data-color="zen"]         { --theme-accent: #10b981; --theme-accent-2: #0ea5e9; --theme-soft: rgba(16,185,129,0.18); --theme-border: rgba(16,185,129,0.35); }
        [data-color="neon-purple"] { --theme-accent: #a855f7; --theme-accent-2: #6366f1; --theme-soft: rgba(168,85,247,0.18); --theme-border: rgba(168,85,247,0.35); }
        [data-color="neon-blue"]   { --theme-accent: #0ea5e9; --theme-accent-2: #3b82f6; --theme-soft: rgba(14,165,233,0.18); --theme-border: rgba(56,189,248,0.35); }
        [data-color="sakura"]      { --theme-accent: #f43f5e; --theme-accent-2: #f59e0b; --theme-soft: rgba(244,63,94,0.18);  --theme-border: rgba(244,63,94,0.35); }

        body {
            background-color: #080b14 !important;
            background-image: linear-gradient(180deg, rgba(8, 11, 22, var(--user-bg-dim)) 0%, rgba(10, 14, 26, calc(var(--user-bg-dim) + 0.08)) 100%), var(--user-wallpaper) !important;
            background-size: cover !important;
            background-position: center !important;
            background-attachment: fixed !important;
        }

        .bento-top-search, #global-goal-search { display: none !important; }
        @media (min-width: 1025px) { .mobile-toggle { display: none !important; } }

        #view-dashboard > .kpi-card,
        #view-dashboard > .recommendation-strip,
        #view-dashboard > .gamification-strip,
        #view-dashboard > #imperial-quests,
        #view-dashboard > #legacy-stock-strip,
        #view-dashboard > .stock-strip {
            display: none !important;
        }

        /* TẦNG 1: HERO BANNER CHUẨN PHÔI ẢNH */
        .phoi-hero-banner {
            position: relative;
            border-radius: 18px;
            padding: 18px 24px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: 
                linear-gradient(90deg, rgba(12, 16, 32, 0.88) 0%, rgba(18, 22, 44, 0.62) 55%, rgba(12, 16, 32, 0.78) 100%),
                var(--user-wallpaper) center/cover no-repeat;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        }
        .phoi-hero-left { z-index: 2; flex: 1; max-width: 62%; }
        .phoi-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .phoi-pill-cmd {
            background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.12);
            color: #e2e8f0; padding: 3px 10px; border-radius: 100px; font-size: 0.64rem;
            font-weight: 800; letter-spacing: 0.8px; display: inline-flex; align-items: center; gap: 5px;
        }
        .phoi-pill-live {
            background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.4);
            color: #34d399; padding: 3px 10px; border-radius: 100px; font-size: 0.64rem; font-weight: 800;
        }
        .phoi-hero-left h1 {
            font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 4px 0;
            letter-spacing: -0.4px; text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .phoi-hero-left p {
            font-size: 0.8rem; color: #cbd5e1; font-style: italic; margin: 0 0 14px 0;
        }
        .phoi-hero-mini-bar {
            display: inline-flex; align-items: center; gap: 22px; flex-wrap: wrap;
            background: rgba(13, 18, 34, 0.78); border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px); padding: 9px 18px; border-radius: 12px;
        }
        .phoi-mini-item { display: flex; align-items: center; gap: 9px; }
        .phoi-mini-item strong { display: block; font-size: 0.84rem; color: #fff; font-weight: 800; line-height: 1.1; }
        .phoi-mini-item span { font-size: 0.66rem; color: #94a3b8; }

        /* Cụm Orbit Vòng Tròn Chữ A (Đã vá lỗi dính chữ & căn đều 3 đỉnh) */
        .phoi-orbit-box {
            position: relative; width: 270px; height: 188px;
            display: flex; align-items: center; justify-content: center; z-index: 2; flex-shrink: 0;
        }
        .phoi-orbit-ring1 {
            position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%);
            width: 116px; height: 116px; border-radius: 50%; border: 1px dashed rgba(168, 85, 247, 0.45);
        }
        .phoi-orbit-ring2 {
            position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%);
            width: 182px; height: 182px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .phoi-orbit-core {
            position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%);
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle, #7c3aed 0%, #311068 100%);
            border: 2px solid #c084fc; display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem; font-weight: 900; color: #fff;
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.75); z-index: 3;
        }
        .phoi-sat {
            position: absolute; display: flex; flex-direction: column; align-items: center;
            z-index: 4; text-align: center; min-width: 72px;
        }
        .phoi-orbit-box .phoi-sat:nth-of-type(4) { top: 2px !important; left: 50% !important; transform: translateX(-50%) !important; }
        .phoi-orbit-box .phoi-sat:nth-of-type(5) { bottom: 4px !important; left: 8px !important; }
        .phoi-orbit-box .phoi-sat:nth-of-type(6) { bottom: 4px !important; right: 8px !important; }

        .phoi-sat-circle {
            width: 32px; height: 32px; border-radius: 50%; background: rgba(13, 18, 34, 0.95);
            display: flex; align-items: center; justify-content: center; font-size: 0.78rem;
            margin-bottom: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.45);
        }
        .phoi-sat strong { font-size: 0.68rem; color: #fff; line-height: 1.15; font-weight: 800; }
        .phoi-sat span { font-size: 0.62rem; color: #cbd5e1; line-height: 1.15; margin-top: 1px; }

        /* TẦNG 2: 4 THẺ CHỈ SỐ NHANH MÀU SẮC */
        .phoi-stat-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px;
        }
        .phoi-stat-card {
            border-radius: 15px; padding: 13px 15px;
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.09);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
            display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        }
        .phoi-stat-card.s-purple { background: linear-gradient(135deg, rgba(88, 28, 135, 0.45), rgba(17, 22, 38, 0.85)); border-color: rgba(168, 85, 247, 0.3); }
        .phoi-stat-card.s-cyan   { background: linear-gradient(135deg, rgba(12, 74, 110, 0.48), rgba(17, 22, 38, 0.85)); border-color: rgba(56, 189, 248, 0.3); }
        .phoi-stat-card.s-amber  { background: linear-gradient(135deg, rgba(120, 53, 15, 0.48), rgba(17, 22, 38, 0.85)); border-color: rgba(245, 158, 11, 0.3); }
        .phoi-stat-card.s-rose   { background: linear-gradient(135deg, rgba(136, 19, 55, 0.48), rgba(17, 22, 38, 0.85)); border-color: rgba(244, 63, 94, 0.3); }

        .phoi-orb {
            width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; font-size: 1rem;
        }

        /* TẦNG 3 (3 CỘT) & TẦNG 4 (2 CỘT) */
        .phoi-row-3col { display: grid; grid-template-columns: 1.15fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .phoi-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }

        .phoi-card, .clean-card, .goal-card, .countdown-card {
            background: rgba(17, 22, 38, 0.78) !important;
            backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 16px !important; padding: 14px 16px !important;
            box-shadow: 0 8px 26px rgba(0, 0, 0, 0.35) !important;
            display: flex; flex-direction: column; justify-content: space-between;
        }
        .phoi-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .phoi-card-title { font-size: 0.75rem; font-weight: 800; color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.6px; }
        .phoi-link { font-size: 0.72rem; color: #94a3b8; font-weight: 600; cursor: pointer; }
        .phoi-link:hover { color: #fff; text-decoration: underline; }

        .phoi-heat-container { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
        .phoi-heat-labels {
            display: grid; grid-template-rows: repeat(7, 13px); gap: 4px;
            font-size: 0.6rem; color: #64748b; font-weight: 700; line-height: 13px;
        }
        .phoi-heat-matrix {
            display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: repeat(7, 13px);
            gap: 4px; flex: 1;
        }
        .phoi-heat-cell { height: 13px; border-radius: 3px; background: rgba(255,255,255,0.05); }

        @media (max-width: 1150px) {
            .phoi-stat-grid { grid-template-columns: repeat(2, 1fr); }
            .phoi-row-3col, .phoi-row-2col { grid-template-columns: 1fr; }
            .phoi-orbit-box { display: none; }
            .phoi-hero-left { max-width: 100%; }
        }

        #focus-room {
            background-image: var(--user-wallpaper) !important;
            background-size: cover !important; background-position: center !important;
            flex-direction: column !important; justify-content: space-between !important; padding: 16px 28px !important;
        }
        #focus-overlay {
            background: radial-gradient(circle at 45% 45%, rgba(15, 18, 38, 0.55) 0%, rgba(8, 10, 22, 0.88) 100%) !important;
            backdrop-filter: blur(5px) !important;
        }
        .focus-pill-btn {
            background: rgba(19, 24, 42, 0.78); border: 1px solid rgba(255, 255, 255, 0.15);
            color: #e2e8f0; padding: 7px 16px; border-radius: 100px; font-size: 0.78rem; font-weight: 700; cursor: pointer;
        }
        .neon-timer-ring-wrapper { position: relative !important; width: 250px !important; height: 250px !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 6px auto !important; }
        .neon-timer-ring-wrapper svg { width: 250px !important; height: 250px !important; }
        .neon-timer-center { position: absolute !important; inset: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; z-index: 5 !important; pointer-events: none !important; }
        #focus-room #session-timer { font-size: 3.5rem !important; font-weight: 900 !important; color: #fff !important; line-height: 1 !important; margin: 0 !important; }

        .hex-icon { width: 48px; height: 54px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem; flex-shrink: 0; }
        .demo-filter-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .demo-tab-pill { background: #131826; border: 1px solid rgba(255,255,255,0.07); color: #8b95b0; padding: 6px 14px; border-radius: 9px; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
        .demo-tab-pill.active { background: linear-gradient(90deg, #7c3aed, #4f46e5); color: #fff; border-color: transparent; }
    `;
    document.head.appendChild(style);
}

function toggleBentoTodo(id) {
    var item = bentoTodoList.find(function(t) { return t.id === id; });
    if (item) {
        item.done = !item.done;
        saveBentoTodos();
        renderBentoCommandCenter();
        renderFocusStudioRightPanel();
    }
}

function addBentoTodoPrompt() {
    var text = prompt("Nhập nhiệm vụ cần hoàn thành hôm nay:");
    if (!text || !text.trim()) return;
    bentoTodoList.push({ id: Date.now(), text: text.trim(), done: false });
    saveBentoTodos();
    renderBentoCommandCenter();
    renderFocusStudioRightPanel();
}

function deleteBentoTodo(e, id) {
    e.stopPropagation();
    bentoTodoList = bentoTodoList.filter(function(t) { return t.id !== id; });
    saveBentoTodos();
    renderBentoCommandCenter();
    renderFocusStudioRightPanel();
}

// =====================================================================
// 4. DỰNG BẢNG ĐIỀU KHIỂN KHỚP 100% PHÔI 4 TẦNG TRONG ẢNH
// =====================================================================
function renderBentoCommandCenter() {
    try {
        injectPhoiLayoutCSS();
        var dash = document.getElementById('view-dashboard');
        if (!dash) return;

        var container = document.getElementById('bento-command-center');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bento-command-center';
            dash.insertBefore(container, dash.firstChild);
        }

        // Thêm nút "🖼️ Ảnh nền" lên thanh Header nếu chưa có
        var headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('btn-open-wallpaper')) {
            var wpBtn = document.createElement('button');
            wpBtn.id = 'btn-open-wallpaper';
            wpBtn.className = 'btn-ghost-action';
            wpBtn.onclick = openWallpaperPickerModal;
            wpBtn.innerHTML = '<i class="fa-regular fa-image" style="color:#a855f7;"></i> Ảnh nền';
            headerActions.insertBefore(wpBtn, headerActions.firstChild);
        }

        var now = new Date();
        var hr = now.getHours();
        var greeting = hr < 12 ? "Chào buổi sáng" : (hr < 18 ? "Chào buổi chiều" : "Chào buổi tối");
        var userName = (typeof currentUser !== 'undefined' && currentUser && currentUser.displayName) ? currentUser.displayName : "Phước Thịnh";

        var qInfo = (typeof getTodayDispatchQuotaInfo === 'function')
            ? getTodayDispatchQuotaInfo()
            : { doneHrs: 0, requiredHrs: 1.0, busyShiftsCount: 0 };
        var todayDoneHrs = qInfo.doneHrs || 0;
        var dailyGoalHrs = Math.max(qInfo.requiredHrs || 1.0, 0.25);
        var pctToday = Math.min(100, Math.round((todayDoneHrs / dailyGoalHrs) * 100));

        var totalAllTimeHrs = 0;
        if (typeof dailyLogs !== 'undefined') {
            totalAllTimeHrs = Object.values(dailyLogs).reduce(function(a, b) { return a + b; }, 0);
        }
        var level = Math.max(1, Math.floor(totalAllTimeHrs / 10) + 1);
        var levelPct = Math.min(100, Math.round(((totalAllTimeHrs % 10) / 10) * 100));
        var totalXP = Math.round(totalAllTimeHrs * 100);
        var todayXP = Math.round(todayDoneHrs * 100);
        var todayPomodoros = Math.round((todayDoneHrs * 60) / 25);
        var streak = typeof currentStreak !== 'undefined' ? currentStreak : 0;

        var doneCount = bentoTodoList.filter(function(t) { return t.done; }).length;
        var totalTodos = Math.max(1, bentoTodoList.length);
        var todoPct = Math.round((doneCount / totalTodos) * 100);

        // TẦNG 3 - CỘT 1: Ma trận Lịch sử học tập (7 hàng x 12 cột = 84 ngày)
        var heatCellsHtml = '';
        for (var i = 83; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            var val = (typeof dailyLogs !== 'undefined' && dailyLogs[dStr]) ? dailyLogs[dStr] : 0;
            var bg = 'rgba(255,255,255,0.05)';
            if (val >= 2.0) bg = '#10b981';
            else if (val >= 1.0) bg = 'rgba(16,185,129,0.72)';
            else if (val > 0) bg = 'rgba(16,185,129,0.35)';
            heatCellsHtml += `<div class="phoi-heat-cell" style="background:${bg};" title="${dStr}: ${val.toFixed(1)}h"></div>`;
        }

        // TẦNG 3 - CỘT 2: Mục tiêu hiện tại (3 mục tiêu kèm Icon tròn màu sắc)
        var activeGoals = (typeof goals !== 'undefined' && Array.isArray(goals)) ? goals.filter(function(g) { return g.current > 0; }).slice(0, 3) : [];
        var gIcons = [
            { icon: 'fa-book-open', color: '#a855f7', bg: 'rgba(168,85,247,0.2)' },
            { icon: 'fa-bullseye',  color: '#f43f5e', bg: 'rgba(244,63,94,0.2)' },
            { icon: 'fa-book',      color: '#10b981', bg: 'rgba(16,185,129,0.2)' }
        ];
        var currentGoalsHtml = activeGoals.length === 0
            ? '<div style="padding:20px 0; text-align:center; color:#64748b; font-size:0.78rem;">Chưa có mục tiêu đang mở.</div>'
            : activeGoals.map(function(g, idx) {
                var st = gIcons[idx % gIcons.length];
                var doneG = Math.max(0, (g.target || 1) - g.current);
                var pctG = Math.min(100, Math.round((doneG / (g.target || 1)) * 100));
                return `
                    <div onclick="openGoal(${g.id})" style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;">
                        <div style="width:34px; height:34px; border-radius:50%; background:${st.bg}; color:${st.color}; border:1px solid ${st.color}55; display:flex; align-items:center; justify-content:center; font-size:0.8rem; flex-shrink:0;">
                            <i class="fa-solid ${st.icon}"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:5px;">
                                <span style="color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.name}</span>
                                <span style="color:#94a3b8; font-size:0.74rem;">${pctG}%</span>
                            </div>
                            <div style="width:100%; height:6px; background:rgba(255,255,255,0.07); border-radius:100px; overflow:hidden;">
                                <div style="width:${pctG}%; height:100%; background:${st.color}; border-radius:100px;"></div>
                            </div>
                        </div>
                    </div>`;
            }).join('');

        // TẦNG 3 - CỘT 3: Thị trường cổ phiếu
        var stockList = getUnifiedStockArray();
        var stockRowsHtml = stockList.slice(0, 3).map(function(st) {
            var isUp = st.change >= 0;
            return `
                <div onclick="triggerStockTrade('${st.code}')" style="display:flex; justify-content:space-between; align-items:center; padding:6px 4px; font-size:0.78rem; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background='transparent'">
                    <span style="font-weight:800; color:#e2e8f0; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-coins" style="color:#fbbf24; font-size:0.7rem;"></i> ${st.code}
                    </span>
                    <span style="font-weight:700; color:#fff;">$${st.price.toFixed(1)}</span>
                    <span style="font-weight:700; color:${isUp ? '#10b981' : '#ef4444'}; font-size:0.74rem;">
                        ${isUp ? '+' : ''}${st.change.toFixed(1)}%
                    </span>
                </div>`;
        }).join('');

        // TẦNG 4 - CỘT 1: Nhiệm vụ hôm nay
        var todoListHtml = bentoTodoList.map(function(t) {
            return `
                <div onclick="toggleBentoTodo(${t.id})" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 6px; border-radius:8px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.03);">
                    <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                        <div style="width:16px; height:16px; border-radius:4px; border:1.5px solid ${t.done ? '#10b981' : '#64748b'}; background:${t.done ? '#10b981' : 'transparent'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.62rem; flex-shrink:0;">
                            ${t.done ? '<i class="fa-solid fa-check"></i>' : ''}
                        </div>
                        <span style="font-size:0.8rem; color:${t.done ? '#94a3b8' : '#f1f5f9'}; text-decoration:${t.done ? 'line-through' : 'none'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${t.text}
                        </span>
                    </div>
                    <button onclick="deleteBentoTodo(event, ${t.id})" style="background:none; border:none; color:#475569; cursor:pointer; font-size:0.7rem;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>`;
        }).join('');

        // TẦNG 4 - CỘT 2: Lịch trình sắp tới
        var todayDow = now.getDay();
        var todayStr = (typeof getLocalTodayStr === 'function') ? getLocalTodayStr() : now.toISOString().split('T')[0];
        var todaySchedules = [];
        if (typeof timetableData !== 'undefined' && Array.isArray(timetableData)) {
            var shiftOrder = { sang: 1, chieu: 2, toi: 3 };
            todaySchedules = timetableData.filter(function(item) {
                var sDate = new Date(item.startDate); sDate.setHours(0, 0, 0, 0);
                var eDate = new Date(item.endDate); eDate.setHours(23, 59, 59, 999);
                var isPaused = item.pausedDates && item.pausedDates.includes(todayStr);
                return !isPaused && parseInt(item.dow) === todayDow && now >= sDate && now <= eDate;
            }).sort(function(a, b) { return (shiftOrder[a.shift] || 9) - (shiftOrder[b.shift] || 9); });
        }

        var pillColors = [
            { bg: 'rgba(99,102,241,0.22)', border: 'rgba(99,102,241,0.45)', text: '#a5b4fc' },
            { bg: 'rgba(14,165,233,0.22)', border: 'rgba(14,165,233,0.45)', text: '#7dd3fc' },
            { bg: 'rgba(244,63,94,0.22)',  border: 'rgba(244,63,94,0.45)',  text: '#fda4af' },
            { bg: 'rgba(16,185,129,0.22)', border: 'rgba(16,185,129,0.45)', text: '#6ee7b7' }
        ];
        var scheduleRowsHtml = todaySchedules.length === 0
            ? '<div style="padding:22px 0; text-align:center; color:#64748b; font-size:0.78rem;">Hôm nay không có ca cố định trên Thời khóa biểu.</div>'
            : todaySchedules.slice(0, 4).map(function(item, idx) {
                var pc = pillColors[idx % pillColors.length];
                var shiftTime = item.code || (item.shift === 'sang' ? 'Ca Sáng' : (item.shift === 'chieu' ? 'Ca Chiều' : 'Ca Tối'));
                var rightMeta = item.room || item.teacher || 'Theo TKB';
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                        <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                            <span style="background:${pc.bg}; border:1px solid ${pc.border}; color:${pc.text}; padding:3px 9px; border-radius:7px; font-size:0.7rem; font-weight:800; flex-shrink:0;">
                                ${shiftTime}
                            </span>
                            <span style="font-size:0.8rem; font-weight:600; color:#f1f5f9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                ${item.name}
                            </span>
                        </div>
                        <span style="font-size:0.72rem; color:#94a3b8; flex-shrink:0;">${rightMeta}</span>
                    </div>`;
            }).join('');

        container.innerHTML = `
            <!-- TẦNG 1: HERO BANNER CHUẨN PHÔI -->
            <div class="phoi-hero-banner">
                <div class="phoi-hero-left">
                    <div class="phoi-badge-row">
                        <span class="phoi-pill-cmd"><i class="fa-solid fa-wand-magic-sparkles" style="color:#a855f7;"></i> COMMAND CENTER</span>
                        <span class="phoi-pill-live">● LIVE</span>
                    </div>
                    <h1>${greeting}, ${userName}! 👋</h1>
                    <p>"Hành trình vạn dặm bắt đầu từ một bước chân."</p>
                    <div class="phoi-hero-mini-bar">
                        <div class="phoi-mini-item">
                            <span style="font-size:1.15rem;">🔥</span>
                            <div>
                                <strong>${streak} ngày</strong>
                                <span>Chuỗi kỷ luật</span>
                            </div>
                        </div>
                        <div class="phoi-mini-item">
                            <span style="font-size:1.15rem;">📊</span>
                            <div>
                                <strong>${todayDoneHrs.toFixed(1)} giờ</strong>
                                <span>Tập trung hôm nay</span>
                            </div>
                        </div>
                        <div class="phoi-mini-item">
                            <span style="font-size:1.15rem;">🚩</span>
                            <div>
                                <strong>${doneCount} / ${bentoTodoList.length}</strong>
                                <span>Nhiệm vụ hoàn thành</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="phoi-orbit-box">
                    <div class="phoi-orbit-ring1"></div>
                    <div class="phoi-orbit-ring2"></div>
                    <div class="phoi-orbit-core">A</div>

                    <div class="phoi-sat" style="top: -4px; left: 50%; transform: translateX(-50%);">
                        <div class="phoi-sat-circle" style="border:1.5px solid #f59e0b; color:#fbbf24;"><i class="fa-solid fa-crown"></i></div>
                        <strong>Streak</strong>
                        <span>${streak} ngày</span>
                    </div>
                    <div class="phoi-sat" style="bottom: 4px; left: 16px;">
                        <div class="phoi-sat-circle" style="border:1.5px solid #a855f7; color:#c084fc;"><i class="fa-solid fa-bullseye"></i></div>
                        <strong>Focus</strong>
                        <span>${todayDoneHrs.toFixed(1)} giờ</span>
                    </div>
                    <div class="phoi-sat" style="bottom: 4px; right: 16px;">
                        <div class="phoi-sat-circle" style="border:1.5px solid #10b981; color:#34d399;"><i class="fa-solid fa-chart-simple"></i></div>
                        <strong>Growth</strong>
                        <span>Lv. ${level}</span>
                    </div>
                </div>
            </div>

            <!-- TẦNG 2: 4 THẺ CHỈ SỐ PHÁT SÁNG -->
            <div class="phoi-stat-grid">
                <div class="phoi-stat-card s-purple">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="phoi-orb" style="background:rgba(168,85,247,0.2); border:1.5px solid #a855f7; color:#d8b4fe;">
                            <i class="fa-regular fa-clock"></i>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:#cbd5e1;">Thời gian học hôm nay</div>
                            <div style="font-size:1.35rem; font-weight:800; color:#fff;">${todayDoneHrs.toFixed(1)} giờ</div>
                        </div>
                    </div>
                    <div>
                        <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:100px; overflow:hidden; margin-bottom:5px;">
                            <div style="width:${pctToday}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #c084fc);"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.66rem; color:#94a3b8;">
                            <span>Mục tiêu: ${dailyGoalHrs} giờ</span>
                            <span>${pctToday}%</span>
                        </div>
                    </div>
                </div>

                <div class="phoi-stat-card s-cyan">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="phoi-orb" style="background:rgba(14,165,233,0.2); border:1.5px solid #38bdf8; color:#7dd3fc;">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:#cbd5e1;">Nhiệm vụ hoàn thành</div>
                            <div style="font-size:1.35rem; font-weight:800; color:#fff;">${doneCount} / ${bentoTodoList.length}</div>
                        </div>
                    </div>
                    <div>
                        <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:100px; overflow:hidden; margin-bottom:5px;">
                            <div style="width:${todoPct}%; height:100%; background:linear-gradient(90deg, #0284c7, #38bdf8);"></div>
                        </div>
                        <div style="font-size:0.66rem; color:#38bdf8;">Hiệu suất: ${typeof dispatchRate !== 'undefined' ? dispatchRate : 100}%</div>
                    </div>
                </div>

                <div class="phoi-stat-card s-amber" onclick="if(typeof openAcademicShop==='function') openAcademicShop();" style="cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="phoi-orb" style="background:rgba(245,158,11,0.2); border:1.5px solid #fbbf24; color:#fde68a;">
                            <i class="fa-solid fa-star"></i>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:#cbd5e1;">XP nhận được</div>
                            <div style="font-size:1.35rem; font-weight:800; color:#fff;">+${todayXP} XP</div>
                        </div>
                    </div>
                    <div>
                        <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:100px; overflow:hidden; margin-bottom:5px;">
                            <div style="width:${levelPct}%; height:100%; background:linear-gradient(90deg, #d97706, #fbbf24);"></div>
                        </div>
                        <div style="font-size:0.66rem; color:#fbbf24;">Tổng: ${totalXP.toLocaleString()} XP</div>
                    </div>
                </div>

                <div class="phoi-stat-card s-rose">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="phoi-orb" style="background:rgba(244,63,94,0.2); border:1.5px solid #fb7185; color:#fda4af;">
                            <i class="fa-solid fa-apple-whole"></i>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:#cbd5e1;">Số phiên Pomodoro</div>
                            <div style="font-size:1.35rem; font-weight:800; color:#fff;">${todayPomodoros} phiên</div>
                        </div>
                    </div>
                    <div>
                        <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:100px; overflow:hidden; margin-bottom:5px;">
                            <div style="width:${Math.min(100, Math.max(20, todayPomodoros * 25))}%; height:100%; background:linear-gradient(90deg, #e11d48, #fb7185);"></div>
                        </div>
                        <div style="font-size:0.66rem; color:#fda4af;">Đánh giá: ★ ${(typeof getAverageStarRating==='function'?getAverageStarRating():5).toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <!-- TẦNG 3: LỊCH SỬ HỌC TẬP | MỤC TIÊU HIỆN TẠI | THỊ TRƯỜNG CỔ PHIẾU -->
            <div class="phoi-row-3col">
                <div class="phoi-card">
                    <div class="phoi-card-head">
                        <span class="phoi-card-title">Lịch sử học tập</span>
                        <span style="font-size:0.68rem; color:#94a3b8;">30 ngày qua ⌄</span>
                    </div>
                    <div class="phoi-heat-container">
                        <div class="phoi-heat-labels">
                            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                        </div>
                        <div class="phoi-heat-matrix">${heatCellsHtml}</div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; align-items:center; gap:4px; font-size:0.64rem; color:#94a3b8; margin-top:6px;">
                        Ít hơn
                        <i style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.1);display:inline-block;"></i>
                        <i style="width:8px;height:8px;border-radius:50%;background:rgba(16,185,129,0.35);display:inline-block;"></i>
                        <i style="width:8px;height:8px;border-radius:50%;background:rgba(16,185,129,0.7);display:inline-block;"></i>
                        <i style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></i>
                        Nhiều hơn
                    </div>
                </div>

                <div class="phoi-card">
                    <div>
                        <div class="phoi-card-head">
                            <span class="phoi-card-title">Mục tiêu hiện tại</span>
                            <span class="phoi-link" onclick="document.getElementById('dashboard-grid')?.scrollIntoView({behavior:'smooth'})">Xem tất cả →</span>
                        </div>
                        <div>${currentGoalsHtml}</div>
                    </div>
                </div>

                <div class="phoi-card">
                    <div>
                        <div class="phoi-card-head">
                            <span class="phoi-card-title">Thị trường cổ phiếu</span>
                            <span style="background:rgba(16,185,129,0.15); color:#10b981; padding:2px 7px; border-radius:6px; font-size:0.65rem; font-weight:800;">LIVE</span>
                        </div>
                        <svg viewBox="0 0 240 42" style="width:100%; height:36px; margin-bottom:4px;">
                            <defs>
                                <linearGradient id="phoiStockGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.32"/>
                                    <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                            <path d="M0,32 Q30,20 65,26 T130,14 T190,18 T240,6 L240,42 L0,42 Z" fill="url(#phoiStockGrad)"/>
                            <path d="M0,32 Q30,20 65,26 T130,14 T190,18 T240,6" fill="none" stroke="#10b981" stroke-width="2"/>
                        </svg>
                        <div>${stockRowsHtml}</div>
                    </div>
                    <div onclick="openFullStockMarketDrawer()" style="margin-top:6px; text-align:center; font-size:0.73rem; color:#10b981; font-weight:700; cursor:pointer;">
                        Xem toàn bộ thị trường (${stockList.length} mã) →
                    </div>
                </div>
            </div>

            <!-- TẦNG 4: NHIỆM VỤ HÔM NAY (TRÁI) & LỊCH TRÌNH SẮP TỚI (PHẢI) -->
            <div class="phoi-row-2col">
                <div class="phoi-card">
                    <div>
                        <div class="phoi-card-head">
                            <span class="phoi-card-title">Nhiệm vụ hôm nay</span>
                            <span style="font-size:0.72rem; color:#94a3b8;">${doneCount} / ${bentoTodoList.length} hoàn thành</span>
                        </div>
                        <div style="max-height:150px; overflow-y:auto;">${todoListHtml}</div>
                    </div>
                    <button onclick="addBentoTodoPrompt()" style="margin-top:8px; width:100%; padding:6px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.12); color:#94a3b8; font-weight:600; font-size:0.74rem; cursor:pointer;">
                        + Thêm nhiệm vụ
                    </button>
                </div>

                <div class="phoi-card">
                    <div>
                        <div class="phoi-card-head">
                            <span class="phoi-card-title">Lịch trình sắp tới</span>
                            <span class="phoi-link" onclick="switchTab('timetable')">Xem tất cả →</span>
                        </div>
                        <div>${scheduleRowsHtml}</div>
                    </div>
                </div>
            </div>
        `;

        ensureMartialLawKpiCard();
    } catch (err) {
        console.error("Phoi Dashboard Error:", err);
    }
}

// =====================================================================
// 5. TRANG THÀNH TỰU, FOCUS ROOM & SIDEBAR CỐ ĐỊNH
// =====================================================================
var currentTrophyFilter = 'all';
function filterTrophyCategory(cat) {
    currentTrophyFilter = cat;
    renderMasterTrophyAndArchive();
}

function renderMasterTrophyAndArchive() {
    injectPhoiLayoutCSS();
    var room = document.getElementById('trophy-room');
    if (!room) return;

    var totalAllTimeHrs = 0;
    if (typeof dailyLogs !== 'undefined') {
        totalAllTimeHrs = Object.values(dailyLogs).reduce(function(a, b) { return a + b; }, 0);
    }
    var completedGoals = (typeof goals !== 'undefined' && Array.isArray(goals)) ? goals.filter(function(g) { return g.current <= 0; }) : [];
    var usd = parseInt(localStorage.getItem('usdBalance')) || 0;
    var streak = typeof currentStreak !== 'undefined' ? currentStreak : 0;

    var allAchievements = [
        { tier: 'rookie', name: "First Blood", desc: "Hoàn thành phiên học đầu tiên", icon: "fa-fire", grad: "linear-gradient(135deg,#f97316,#ea580c)", unlocked: totalAllTimeHrs > 0 },
        { tier: 'rookie', name: "Apprentice", desc: "Tích lũy 10 giờ học tập thực tế", icon: "fa-book-open", grad: "linear-gradient(135deg,#38bdf8,#0284c7)", unlocked: totalAllTimeHrs >= 10 },
        { tier: 'pro', name: "Silver Streak", desc: "Duy trì chuỗi kỷ luật 14 ngày", icon: "fa-bolt", grad: "linear-gradient(135deg,#94a3b8,#475569)", unlocked: streak >= 14 },
        { tier: 'pro', name: "Iron Will", desc: "Duy trì chuỗi kỷ luật 30 ngày", icon: "fa-shield-halved", grad: "linear-gradient(135deg,#f59e0b,#d97706)", unlocked: streak >= 30 },
        { tier: 'elite', name: "Deep Worker", desc: "Vượt mốc 50 giờ tập trung sâu", icon: "fa-brain", grad: "linear-gradient(135deg,#10b981,#059669)", unlocked: totalAllTimeHrs >= 50 },
        { tier: 'elite', name: "Capitalist", desc: "Quỹ thưởng vượt mốc $1,000 USD", icon: "fa-coins", grad: "linear-gradient(135deg,#fbbf24,#b45309)", unlocked: usd >= 1000 },
        { tier: 'legend', name: "Tycoon", desc: "Sở hữu tài sản đạt $5,000 USD", icon: "fa-gem", grad: "linear-gradient(135deg,#06b6d4,#0e7490)", unlocked: usd >= 5000 },
        { tier: 'legend', name: "The Apex", desc: "Đạt 100 giờ học tập bất tử", icon: "fa-crown", grad: "linear-gradient(135deg,#f43f5e,#be123c)", unlocked: totalAllTimeHrs >= 100 }
    ];

    var unlockedCount = allAchievements.filter(function(a) { return a.unlocked; }).length;
    var pctUnlock = Math.round((unlockedCount / allAchievements.length) * 100);
    var filteredList = allAchievements.filter(function(a) { return currentTrophyFilter === 'all' || a.tier === currentTrophyFilter; });

    var achievementsHtml = filteredList.map(function(a) {
        return `
            <div class="phoi-card" style="flex-direction:row; align-items:center; gap:14px; opacity:${a.unlocked ? '1' : '0.42'};">
                <div class="hex-icon" style="background:${a.unlocked ? a.grad : '#1e293b'};"><i class="fa-solid ${a.icon}"></i></div>
                <div style="flex:1;">
                    <strong style="font-size:0.88rem; color:#fff;">${a.name}</strong>
                    <div style="font-size:0.74rem; color:#8b95b0; margin-top:3px;">${a.desc}</div>
                </div>
            </div>`;
    }).join('');

    var archiveCardsHtml = completedGoals.map(function(g) {
        var cleanHrs = Number(g.target || 0).toFixed(1).replace(/\.0$/, '');
        var repCount = (g.reports && g.reports.length) ? g.reports.length : 0;
        return `
            <div class="phoi-card" onclick="if(typeof viewTrophyDetail==='function') viewTrophyDetail(${g.id})" style="cursor:pointer;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="hex-icon" style="width:42px; height:48px; font-size:1rem; background:linear-gradient(135deg, #10b981, #059669);"><i class="fa-solid fa-check-double"></i></div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:800; color:#fff; font-size:0.88rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.name}</div>
                        <div style="font-size:0.68rem; color:#10b981; font-weight:700; margin-top:2px;">HOÀN THÀNH 100%</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:12px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); font-size:0.73rem; color:#8b95b0;">
                    <span>Quy mô: <strong style="color:#fff;">${cleanHrs} giờ</strong></span>
                    <span>Báo cáo: <strong style="color:#fff;">${repCount} bản</strong></span>
                </div>
            </div>`;
    }).join('');

    room.innerHTML = `
        <div class="phoi-card" style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
                <div><strong style="font-size:1.3rem; color:#fff;">${unlockedCount} / ${allAchievements.length}</strong> <span style="font-size:0.8rem; color:#cbd5e1; margin-left:8px;">Thành tựu đã mở khóa</span></div>
                <strong style="color:#60a5fa; font-size:0.9rem;">${pctUnlock}%</strong>
            </div>
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:100px; margin-top:8px; overflow:hidden;">
                <div style="width:${pctUnlock}%; height:100%; background:linear-gradient(90deg, #3b82f6, #8b5cf6);"></div>
            </div>
        </div>
        <div class="demo-filter-tabs">
            <button class="demo-tab-pill ${currentTrophyFilter==='all'?'active':''}" onclick="filterTrophyCategory('all')">Tất cả</button>
            <button class="demo-tab-pill ${currentTrophyFilter==='rookie'?'active':''}" onclick="filterTrophyCategory('rookie')">Tân binh</button>
            <button class="demo-tab-pill ${currentTrophyFilter==='pro'?'active':''}" onclick="filterTrophyCategory('pro')">Chuyên nghiệp</button>
            <button class="demo-tab-pill ${currentTrophyFilter==='elite'?'active':''}" onclick="filterTrophyCategory('elite')">Tinh anh</button>
            <button class="demo-tab-pill ${currentTrophyFilter==='legend'?'active':''}" onclick="filterTrophyCategory('legend')">Huyền thoại</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px; margin-bottom:24px;">${achievementsHtml}</div>
        <h3 style="font-size:0.86rem; font-weight:800; color:#e2e8f0; text-transform:uppercase; margin-bottom:12px;">Kho lưu trữ mục tiêu đã hoàn thành (${completedGoals.length})</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">${archiveCardsHtml}</div>
    `;
}
window.renderTrophies = renderMasterTrophyAndArchive;
window.renderTrophyRoom = renderMasterTrophyAndArchive;

function renderFocusStudioRightPanel() {
    try {
        var todoBox = document.getElementById('focus-room-todo-list');
        if (todoBox) {
            todoBox.innerHTML = bentoTodoList.map(function(t) {
                return `
                    <div onclick="toggleBentoTodo(${t.id})" style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:7px; cursor:pointer; background:rgba(255,255,255,0.03);">
                        <div style="width:15px; height:15px; border-radius:4px; border:1.5px solid ${t.done ? '#10b981' : '#64748b'}; background:${t.done ? '#10b981' : 'transparent'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.6rem; flex-shrink:0;">
                            ${t.done ? '<i class="fa-solid fa-check"></i>' : ''}
                        </div>
                        <span style="font-size:0.78rem; color:${t.done ? 'rgba(255,255,255,0.45)' : '#fff'}; text-decoration:${t.done ? 'line-through' : 'none'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${t.text}
                        </span>
                    </div>`;
            }).join('');
        }
    } catch (e) {}
}

// Duy trì đồng hồ, cố định thẻ User ở đáy Sidebar (Không nhảy) & Nút đổi ảnh nền
setInterval(function() {
    var now = new Date();
    var clockEl = document.getElementById('top-clock-label');
    var dateEl = document.getElementById('top-date-label');
    if (clockEl) clockEl.innerText = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (dateEl) {
        var dNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        dateEl.innerHTML = '<i class="fa-regular fa-calendar" style="color:#8b5cf6;"></i> ' + dNames[now.getDay()] + ', ' + now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
    }

    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
        var brandLogoBox = sidebar.querySelector('.brand > div:first-child');
        if (brandLogoBox && !brandLogoBox.querySelector('.fa-layer-group')) {
            brandLogoBox.style.cssText = "width:32px; height:32px; border-radius:9px; background:linear-gradient(135deg, #7c3aed, #4f46e5); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.95rem; flex-shrink:0;";
            brandLogoBox.innerHTML = '<i class="fa-solid fa-layer-group" style="color:#fff !important;"></i>';
        }
        var footerDock = document.getElementById('sidebar-bottom-dock');
        var paletteBox = sidebar.querySelector('.palette-container');
        var themeBtn = document.querySelector('.theme-toggle');
        if (paletteBox && themeBtn && themeBtn.parentElement !== paletteBox) {
            paletteBox.appendChild(themeBtn);
        }
        if (footerDock) footerDock.remove();

        var badge = document.getElementById('user-auth-badge');
        if (badge) {
            if (badge.innerHTML.includes('Rời án thư')) badge.innerHTML = badge.innerHTML.replace('Rời án thư', 'Đăng xuất');
            if (sidebar.lastElementChild !== badge) {
                badge.style.cssText = "margin: 8px 4px 0 4px; padding: 9px 10px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 10px; flex-shrink: 0;";
                sidebar.appendChild(badge);
            }
        }
    }

    var focusRoom = document.getElementById('focus-room');
    if (focusRoom && focusRoom.style.display !== 'none') {
        var ring = document.getElementById('focus-ring-circle');
        var subDur = document.getElementById('focus-sub-duration');
        var timerText = document.getElementById('session-timer') ? document.getElementById('session-timer').innerText : "00:00";
        if (typeof currentDuration !== 'undefined' && subDur) {
            subDur.innerText = "/ " + String(currentDuration).padStart(2, '0') + ":00";
        }
        if (ring && timerText.includes(':')) {
            var parts = timerText.split(':').map(Number);
            var remainingSec = (parts[0] * 60) + (parts[1] || 0);
            var totalSec = ((typeof currentDuration !== 'undefined' ? currentDuration : 25) * 60) || 1500;
            var ratio = Math.min(1, Math.max(0, remainingSec / totalSec));
            ring.style.strokeDashoffset = 816.8 * (1 - ratio);
        }
    }
}, 1000);

var origSwitchTabPhoi = window.switchTab;
window.switchTab = function(tabName) {
    if (typeof origSwitchTabPhoi === 'function') origSwitchTabPhoi(tabName);
    if (tabName === 'trophy') setTimeout(renderMasterTrophyAndArchive, 30);
    if (tabName === 'dashboard') setTimeout(renderBentoCommandCenter, 30);
};

var prevRenderDashPhoi = window.renderDashboard;
window.renderDashboard = function() {
    if (typeof prevRenderDashPhoi === 'function') prevRenderDashPhoi();
    renderBentoCommandCenter();
    renderFocusStudioRightPanel();
};

window.addEventListener('DOMContentLoaded', function() {
    injectPhoiLayoutCSS();
    setTimeout(function() {
        renderBentoCommandCenter();
        renderFocusStudioRightPanel();
    }, 300);
});

// =====================================================================
// FOCUS ROOM PRO STUDIO OVERHAUL (100% COMPLETE & SYNTAX VERIFIED)
// =====================================================================
(function upgradeFocusRoomStudio() {
    var currentFocusScene = localStorage.getItem('apexFocusScene') || 'lofi_room';
    var ambientAudioCtx = null;
    var ambientNoiseNode = null;
    var isAmbientPlaying = false;

    var FOCUS_SCENES = {
        lofi_room: {
            label: "🎧 Lo-fi Room",
            bg: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=85"
        },
        library: {
            label: "🏛️ Library",
            bg: "https://images.unsplash.com/photo-1507842229356-51c61504d3ab?auto=format&fit=crop&w=1920&q=85"
        },
        rain_night: {
            label: "🌧️ Rainy Night",
            bg: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=85"
        },
        user_custom: {
            label: "🌌 Nền Dashboard",
            bg: ""
        }
    };

    window.toggleFocusRainSound = function() {
        var btn = document.getElementById('btn-ambient-rain');
        if (!isAmbientPlaying) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!ambientAudioCtx) ambientAudioCtx = new AudioContext();
            if (ambientAudioCtx.state === 'suspended') ambientAudioCtx.resume();

            var bufferSize = 2 * ambientAudioCtx.sampleRate;
            var noiseBuffer = ambientAudioCtx.createBuffer(1, bufferSize, ambientAudioCtx.sampleRate);
            var output = noiseBuffer.getChannelData(0);
            var lastOut = 0.0;
            for (var i = 0; i < bufferSize; i++) {
                var white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            }
            ambientNoiseNode = ambientAudioCtx.createBufferSource();
            ambientNoiseNode.buffer = noiseBuffer;
            ambientNoiseNode.loop = true;

            var filter = ambientAudioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 850;

            var gainNode = ambientAudioCtx.createGain();
            gainNode.gain.value = 0.18;

            ambientNoiseNode.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ambientAudioCtx.destination);
            ambientNoiseNode.start(0);
            isAmbientPlaying = true;
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fa-solid fa-cloud-showers-heavy" style="color:#38bdf8;"></i> Tiếng mưa: BẬT';
            }
        } else {
            if (ambientNoiseNode) {
                try { ambientNoiseNode.stop(); } catch (e) {}
            }
            isAmbientPlaying = false;
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fa-solid fa-cloud-rain"></i> Tiếng mưa: TẮT';
            }
        }
    };

    window.switchFocusScene = function(sceneKey) {
        currentFocusScene = sceneKey;
        localStorage.setItem('apexFocusScene', sceneKey);
        var focusRoom = document.getElementById('focus-room');
        if (focusRoom) {
            if (sceneKey === 'user_custom') {
                var customUrl = localStorage.getItem('saasCustomWallpaper') || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=85";
                focusRoom.style.setProperty('background-image', "url('" + customUrl + "')", 'important');
            } else if (FOCUS_SCENES[sceneKey]) {
                focusRoom.style.setProperty('background-image', "url('" + FOCUS_SCENES[sceneKey].bg + "')", 'important');
            }
        }
        document.querySelectorAll('.focus-scene-pill').forEach(function(el) {
            el.classList.toggle('active', el.getAttribute('data-scene') === sceneKey);
        });
    };

    window.toggleFocusFullscreen = function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(function(){});
        } else {
            document.exitFullscreen().catch(function(){});
        }
    };

    function injectFocusStudioProCSS() {
        if (document.getElementById('focus-studio-pro-css')) return;
        var st = document.createElement('style');
        st.id = 'focus-studio-pro-css';
        st.innerHTML = `
            #focus-room {
                padding: 18px 32px !important;
                transition: background-image 0.4s ease-in-out !important;
            }
            #focus-overlay {
                background: radial-gradient(circle at 38% 48%, rgba(124, 58, 237, 0.18) 0%, rgba(10, 14, 28, 0.72) 50%, rgba(6, 8, 18, 0.92) 100%) !important;
                backdrop-filter: blur(6px) !important;
            }
            .focus-ambient-bar {
                display: flex; align-items: center; justify-content: center; gap: 8px;
                flex-wrap: wrap; margin-bottom: 12px;
            }
            .focus-scene-pill {
                background: rgba(15, 20, 38, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #cbd5e1; padding: 6px 14px; border-radius: 100px;
                font-size: 0.75rem; font-weight: 600; cursor: pointer;
                transition: all 0.2s ease; backdrop-filter: blur(8px);
            }
            .focus-scene-pill:hover, .focus-scene-pill.active {
                background: rgba(139, 92, 246, 0.32);
                border-color: #a855f7; color: #fff;
                box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
            }

            /* Vòng Hào Quang Đôi Phát Sáng (Luôn sáng kể cả khi ở 00:00) */
            .neon-timer-ring-wrapper {
                position: relative !important;
                width: 270px !important;
                height: 270px !important;
                border-radius: 50% !important;
                background: radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(15, 20, 38, 0.72) 72%) !important;
                box-shadow: 0 0 55px rgba(124, 58, 237, 0.32), inset 0 0 30px rgba(139, 92, 246, 0.2) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 8px auto !important;
            }
            .neon-timer-ring-wrapper::before {
                content: "";
                position: absolute;
                inset: 16px;
                border-radius: 50%;
                border: 1px dashed rgba(192, 132, 252, 0.3);
                pointer-events: none;
            }
            .neon-timer-ring-wrapper svg {
                width: 270px !important;
                height: 270px !important;
                filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6)) !important;
            }
            #focus-room #session-timer {
                font-size: 4rem !important;
                font-weight: 900 !important;
                color: #ffffff !important;
                letter-spacing: -2px !important;
                text-shadow: 0 0 28px rgba(192, 132, 252, 0.65) !important;
            }
            #focus-sub-duration {
                font-size: 0.85rem !important;
                color: #c084fc !important;
                font-weight: 700 !important;
                margin-top: 6px !important;
            }
            .focus-glass-panel {
                background: linear-gradient(155deg, rgba(20, 25, 45, 0.78), rgba(12, 15, 28, 0.88)) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 16px !important;
                padding: 14px 16px !important;
                backdrop-filter: blur(18px) !important;
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4) !important;
            }
        `;
        document.head.appendChild(st);
    }

    function buildFocusStudioComponents() {
        injectFocusStudioProCSS();
        var focusRoom = document.getElementById('focus-room');
        if (!focusRoom) return;

        // 1. Nhóm nút Tiếng mưa & Toàn màn hình ở góc phải trên
        var tickBtn = document.getElementById('btn-tick');
        if (tickBtn && !document.getElementById('focus-top-right-group')) {
            var rightGroup = document.createElement('div');
            rightGroup.id = 'focus-top-right-group';
            rightGroup.style.cssText = "display:flex; align-items:center; gap:8px;";

            var rainBtn = document.createElement('button');
            rainBtn.id = 'btn-ambient-rain';
            rainBtn.className = 'btn-back';
            rainBtn.onclick = window.toggleFocusRainSound;
            rainBtn.innerHTML = '<i class="fa-solid fa-cloud-rain"></i> Tiếng mưa: TẮT';

            var fsBtn = document.createElement('button');
            fsBtn.className = 'btn-back';
            fsBtn.onclick = window.toggleFocusFullscreen;
            fsBtn.title = "Toàn màn hình";
            fsBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';

            tickBtn.parentNode.insertBefore(rightGroup, tickBtn);
            rightGroup.appendChild(rainBtn);
            rightGroup.appendChild(tickBtn);
            rightGroup.appendChild(fsBtn);
        }

        // 2. Thanh chọn Bối cảnh (Lo-fi Room, Library, Rainy Night, Nền Dashboard)
        var badge = document.getElementById('focus-badge');
        if (badge && !document.getElementById('focus-ambient-scene-bar')) {
            var sceneBar = document.createElement('div');
            sceneBar.id = 'focus-ambient-scene-bar';
            sceneBar.className = 'focus-ambient-bar';
            sceneBar.innerHTML = Object.keys(FOCUS_SCENES).map(function(k) {
                return '<button class="focus-scene-pill ' + (currentFocusScene === k ? 'active' : '') + '" data-scene="' + k + '" onclick="switchFocusScene(\'' + k + '\')">' + FOCUS_SCENES[k].label + '</button>';
            }).join('');
            badge.parentNode.insertBefore(sceneBar, badge);
        }

        // 3. Câu trích dẫn & Nút Bắt đầu nhanh dưới vòng tròn
        var ringWrap = focusRoom.querySelector('.neon-timer-ring-wrapper');
        if (ringWrap && !document.getElementById('focus-studio-quote-box')) {
            var quoteBox = document.createElement('div');
            quoteBox.id = 'focus-studio-quote-box';
            quoteBox.style.cssText = "text-align:center; margin: 10px 0 6px 0;";
            quoteBox.innerHTML = `
                <div style="color:rgba(255,255,255,0.8); font-style:italic; font-size:0.84rem; margin-bottom:10px;">
                    "Stay focused. You've got this." ✨
                </div>
                <button id="btn-focus-quick-start" onclick="startSession(25)" style="background:linear-gradient(90deg, #8b5cf6, #6366f1); color:#fff; border:none; padding:9px 26px; border-radius:100px; font-weight:800; font-size:0.82rem; cursor:pointer; box-shadow:0 6px 20px rgba(139,92,246,0.5); display:inline-flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-play"></i> Bắt đầu Pomodoro (25p)
                </button>
            `;
            ringWrap.parentNode.insertBefore(quoteBox, ringWrap.nextSibling);
        }

        // 4. Bổ sung Thẻ "Thống kê phiên" ở cột phải
        var todoListEl = document.getElementById('focus-room-todo-list');
        var musicWidget = document.getElementById('widget-music');
        if (todoListEl && todoListEl.parentElement) {
            todoListEl.parentElement.className = 'focus-glass-panel';
        }
        if (musicWidget) {
            musicWidget.className = 'focus-glass-panel';
            if (!document.getElementById('focus-pro-stats-panel')) {
                var statsPanel = document.createElement('div');
                statsPanel.id = 'focus-pro-stats-panel';
                statsPanel.className = 'focus-glass-panel';
                statsPanel.innerHTML = `
                    <div style="font-weight:700; color:#fff; font-size:0.82rem; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                        <span><i class="fa-solid fa-chart-pie" style="color:#38bdf8; margin-right:6px;"></i> Thống kê phiên</span>
                        <span style="font-size:0.65rem; background:rgba(16,185,129,0.18); color:#34d399; padding:2px 8px; border-radius:6px; font-weight:700;">LIVE</span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem;">
                        <div style="background:rgba(255,255,255,0.04); padding:8px 10px; border-radius:10px;">
                            <div style="color:#94a3b8; font-size:0.66rem;">Chu kỳ</div>
                            <strong style="color:#fff; font-size:0.9rem;">Pomodoro</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.04); padding:8px 10px; border-radius:10px;">
                            <div style="color:#94a3b8; font-size:0.66rem;">Hiệu suất</div>
                            <strong style="color:#10b981; font-size:0.9rem;">${typeof dispatchRate !== 'undefined' ? dispatchRate : 100}%</strong>
                        </div>
                    </div>
                `;
                musicWidget.parentElement.insertBefore(statsPanel, musicWidget);
            }
        }

        window.switchFocusScene(currentFocusScene);
    }

    // 5. Giữ cho Vòng tròn Neon luôn sáng rực khi ở trạng thái chờ 00:00
    setInterval(function() {
        var focusRoom = document.getElementById('focus-room');
        if (!focusRoom || focusRoom.style.display === 'none') return;

        var timerText = document.getElementById('session-timer') ? document.getElementById('session-timer').innerText.trim() : "00:00";
        var ring = document.getElementById('focus-ring-circle');
        var quickBtn = document.getElementById('btn-focus-quick-start');
        var subDur = document.getElementById('focus-sub-duration');

        if (timerText === "00:00") {
            if (ring) ring.style.strokeDashoffset = "0"; // Sáng满 vòng tròn khi chờ
            if (subDur) subDur.innerText = "/ 25:00";
            if (quickBtn) quickBtn.style.display = "inline-flex";
        } else {
            if (quickBtn) quickBtn.style.display = "none";
        }
    }, 500);

    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(buildFocusStudioComponents, 450);
    });
    setTimeout(buildFocusStudioComponents, 200);
})();
