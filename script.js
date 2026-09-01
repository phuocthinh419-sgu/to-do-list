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
async function syncToCloud() {
    if (isSyncing || !currentUser) return; 
    isSyncing = true;
    try {
        const dataToSync = {
            goals: JSON.parse(localStorage.getItem('saasGoalsPro')) || [],
            totalSessions: parseFloat(localStorage.getItem('saasTotalSessionsPro')) || 0,
            countdowns: JSON.parse(localStorage.getItem('saasCountdownsPro')) || [],
            dailyLogs: JSON.parse(localStorage.getItem('saasDailyLogs')) || {},
            streak: parseInt(localStorage.getItem('saasStreak')) || 0,
            lastActive: localStorage.getItem('saasLastActive') || "",
            s25: parseInt(localStorage.getItem('saasS25')) || 0,
            s15: parseInt(localStorage.getItem('saasS15')) || 0,
            cycleStart: localStorage.getItem('saasCycleStart') || "",
            usdBalance: parseInt(localStorage.getItem('usdBalance')) || 0,
            userPortfolio: JSON.parse(localStorage.getItem('userPortfolio')) || {},
            stockMarketPrices: JSON.parse(localStorage.getItem('stockMarketPrices')) || {},
            lastRestDate: localStorage.getItem('saasLastRest') || "",
            achComeback: localStorage.getItem('ach_comeback') || "false",
            timetable: JSON.parse(localStorage.getItem('saasTimetable')) || [], 
            lastUpdated: Date.now(),
            
            // 🏆 BỔ SUNG DỮ LIỆU ĐỂ LÊN BẢNG XẾP HẠNG
            displayName: currentUser.displayName || "Ẩn danh",
            photoURL: currentUser.photoURL || "",
            weeklyHours: getTotalCycleHours()
        };
        localStorage.setItem('saasLastUpdated', dataToSync.lastUpdated);
        await db.collection("academic_apex").doc(USER_DOC_ID).set(dataToSync);
        console.log("☁️ Đã đồng bộ mồ hôi và điểm xếp hạng lên Thiên Đình.");
        
        let statusIcon = document.getElementById('status-box');
        if (statusIcon && !isSessionActive && !isBreakActive && !isGracePeriod) {
            statusIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color:var(--brand-info)"></i><span id="status-msg">Dữ liệu đã được bảo vệ trên Cloud.</span>`;
        }
    } catch (e) { console.error("Lỗi đồng bộ Cloud:", e); }
    isSyncing = false;
}

// Hàm giải nén dữ liệu Cloud chép thẳng vào Local
function applyCloudDataToLocal(cloudData) {
    localStorage.setItem('saasGoalsPro', JSON.stringify(cloudData.goals || []));
    localStorage.setItem('saasTotalSessionsPro', cloudData.totalSessions || 0);
    localStorage.setItem('saasCountdownsPro', JSON.stringify(cloudData.countdowns || []));
    localStorage.setItem('saasDailyLogs', JSON.stringify(cloudData.dailyLogs || {}));
    localStorage.setItem('saasStreak', cloudData.streak || 0);
    localStorage.setItem('saasLastActive', cloudData.lastActive || "");
    localStorage.setItem('saasS25', cloudData.s25 || 0);
    localStorage.setItem('saasS15', cloudData.s15 || 0);
    if(cloudData.cycleStart) localStorage.setItem('saasCycleStart', cloudData.cycleStart);
    localStorage.setItem('usdBalance', cloudData.usdBalance || 0);
    localStorage.setItem('userPortfolio', JSON.stringify(cloudData.userPortfolio || {}));
    localStorage.setItem('stockMarketPrices', JSON.stringify(cloudData.stockMarketPrices || {}));
    localStorage.setItem('saasLastRest', cloudData.lastRestDate || "");
    localStorage.setItem('ach_comeback', cloudData.achComeback || "false");
    localStorage.setItem('saasTimetable', JSON.stringify(cloudData.timetable || []));
    localStorage.setItem('saasLastUpdated', cloudData.lastUpdated);
    
    // Nạp lại biến RAM để giao diện chạy đúng
    goals = JSON.parse(localStorage.getItem('saasGoalsPro')) || [];
    totalSessions = parseInt(localStorage.getItem('saasTotalSessionsPro')) || 0;
    countdowns = JSON.parse(localStorage.getItem('saasCountdownsPro')) || [];
    dailyLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {}; 
    lastActiveDate = localStorage.getItem('saasLastActive') || "";
    currentStreak = parseInt(localStorage.getItem('saasStreak')) || 0;
    lastRestDate = localStorage.getItem('saasLastRest') || "";
    cycleStartDate = localStorage.getItem('saasCycleStart');
    timetableData = JSON.parse(localStorage.getItem('saasTimetable')) || [];
}

async function initialPullFromCloud() {
    try {
        const doc = await db.collection("academic_apex").doc(USER_DOC_ID).get();
        if (doc.exists) {
            const cloudData = doc.data();
            const localUpdated = parseInt(localStorage.getItem('saasLastUpdated')) || 0;
            
            // Nếu Cloud mới hơn, lấy Cloud đè Local
            if (cloudData.lastUpdated >= localUpdated) {
                applyCloudDataToLocal(cloudData);
                console.log("☁️ Đã nạp dữ liệu thành công từ mây!");
            } else {
                // Nếu Local mới hơn (ví dụ cày offline), đẩy Local lên Cloud
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
    renderCountdowns(); 
    clearInterval(countdownInterval); // Xóa bộ đếm cũ nếu có
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
    let todayStr = new Date().toISOString().split('T')[0];
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
        syncToCloud();
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

        let totalCycleHours = getTotalCycleHours();
        let target = getWeeklyTarget();
        
        if (totalCycleHours < target) {
            if (!isPendingTax) impactStockMarket("PENALTY");
            isPendingTax = true; 
            localStorage.setItem('saasPendingTax', 'true'); 
        } else {
            alert(`TỔNG KẾT TUẦN: Hoàn thành ${totalCycleHours.toFixed(1)}h (Chỉ tiêu: ${target}h). Bắt đầu tuần mới!`);
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
            let targetHrs = (lastRestDate === checkStr) ? 0.75 : 1.0; 
            let hrsDone = dailyLogs[checkStr] || 0;
            
            if (hrsDone < targetHrs) {
                let deficitHrs = targetHrs - hrsDone; 
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
    // ĐẠO LUẬT MỚI: Đếm tổng giờ từ toàn bộ Nhật ký, không phụ thuộc vào Mục tiêu nữa!
    let totalHoursEarned = Object.values(dailyLogs).reduce((sum, val) => sum + val, 0); 
    
    document.getElementById('total-hours-metric').innerText = totalHoursEarned.toFixed(1) + 'h'; 
    document.getElementById('streak-count').innerText = currentStreak;
    
  // Căn chỉnh để dữ liệu phán xét khớp 100% với số hiển thị
    let displayHours = parseFloat(totalHoursEarned.toFixed(1));

    let rankTitle = "Người Mới"; 
    let rankDesc = "Cần 10h để thăng cấp Học Giả"; 
    let rankColor = "#94a3b8"; 

    if (displayHours >= 300) { 
        rankTitle = "Huyền Thoại"; 
        rankDesc = "Thành tích học tập xuất sắc"; 
        rankColor = "#f59e0b"; 
    } else if (displayHours >= 100) { 
        rankTitle = "Bậc Thầy"; 
        rankDesc = `Cần ${Math.ceil(300 - displayHours)}h để thăng cấp Huyền Thoại`; 
        rankColor = "#8b5cf6"; 
    } else if (displayHours >= 50) { 
        rankTitle = "Chuyên Gia"; 
        rankDesc = `Cần ${Math.ceil(100 - displayHours)}h để thăng cấp Bậc Thầy`; 
        rankColor = "#ea580c"; 
    } else if (displayHours >= 10) { 
        rankTitle = "Học Giả"; 
        rankDesc = `Cần ${Math.ceil(50 - displayHours)}h để thăng cấp Chuyên Gia`; 
        rankColor = "#10b981"; 
    }
    
    document.getElementById('rank-title').innerText = rankTitle; 
    document.getElementById('rank-desc').innerText = rankDesc; 
    const iconEl = document.getElementById('rank-icon'); 
    iconEl.style.color = rankColor; 
    iconEl.style.filter = `drop-shadow(0 0 12px ${rankColor}80)`;
    
    const grid = document.getElementById('heatmap-grid'); 
    if(grid) grid.innerHTML = ''; 
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    
    // TÍNH TOÁN DỮ LIỆU TRONG ĐÚNG 35 NGÀY
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

    // ĐỔ SỐ LIỆU VÀO CÁC CHỈ SỐ MINI TRONG HTML
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
// 2. CẬP NHẬT RENDER ANALYTICS (THÊM TREND THÁNG & GỘP ACADEMIC INSIGHTS)
// =====================================================================
function renderAnalytics() {
    const room = document.getElementById('analytics-room'); room.innerHTML = ''; let allGoals = goals; 
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset()); let todayStr = todayObj.toISOString().split('T')[0];
    let yesterdayObj = new Date(todayObj); yesterdayObj.setDate(yesterdayObj.getDate() - 1); let yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    let todayHrs = dailyLogs[todayStr] || 0; let yesterdayHrs = dailyLogs[yesterdayStr] || 0;
    let cycleStartObj = new Date(cycleStartDate);
    
    // Tính toán Trend Tuần
    let thisWeekHrs = 0; for(let i=0; i<7; i++) { let d = new Date(cycleStartObj); d.setDate(d.getDate() + i); thisWeekHrs += (dailyLogs[d.toISOString().split('T')[0]] || 0); }
    let lastWeekHrs = 0; for(let i=1; i<=7; i++) { let d = new Date(cycleStartObj); d.setDate(d.getDate() - i); lastWeekHrs += (dailyLogs[d.toISOString().split('T')[0]] || 0); }
    
    // Bổ sung: Tính toán Trend Tháng (30 Ngày)
    let thisMonthHrs = 0; for(let i=0; i<30; i++) { let d = new Date(todayObj); d.setDate(d.getDate() - i); thisMonthHrs += (dailyLogs[d.toISOString().split('T')[0]] || 0); }
    let lastMonthHrs = 0; for(let i=30; i<60; i++) { let d = new Date(todayObj); d.setDate(d.getDate() - i); lastMonthHrs += (dailyLogs[d.toISOString().split('T')[0]] || 0); }

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
    for(let i=6; i>=0; i--) {
        let d = new Date(todayObj); d.setDate(d.getDate() - i);
        let dStr = d.toISOString().split('T')[0]; let hrs = dailyLogs[dStr] || 0;
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
        let createdTime = g.createdAt ? new Date(g.createdAt).getTime() : new Date(cycleStartDate).getTime();
        let daysElapsed = Math.max(1, Math.ceil((todayObj.getTime() - createdTime) / (1000 * 3600 * 24)));
        let currentPace = logged / daysElapsed;
        if (daysLeftToDeadline < 0 || (currentPace > 0 && todayObj.getTime() + (Math.ceil(g.current / currentPace) * 24 * 3600 * 1000) > deadlineTime) || (g.current > 0 && currentPace === 0 && daysLeftToDeadline > 0)) {
            let reqPace = daysLeftToDeadline > 0 ? (g.current / daysLeftToDeadline) : g.current;
            criticalGoals.push({ goal: g, reqPace: reqPace });
        }
    });

    // 3. TÍCH HỢP ACADEMIC INSIGHTS (GỘP TIÊN TRI & CỐ VẤN)
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
    let activeDays30 = 0; for(let i=0; i<30; i++){ let d = new Date(todayObj); d.setDate(d.getDate()-i); if (dailyLogs[d.toISOString().split('T')[0]] > 0) activeDays30++; }
    let consistencyScore = Math.round((activeDays30 / 30) * 100);
    let dnaFocus = Math.min(100, Math.round((avgSessionMins / 30) * 100)); 
    let dnaPace = Math.min(100, Math.round(((thisWeekHrs / 7) / 1.7) * 100)); 
    let onTrackGoalsCount = 0; activeOrLoggedGoals.forEach(g => { let logged = g.target - g.current; let createdTime = g.createdAt ? new Date(g.createdAt).getTime() : new Date(cycleStartDate).getTime(); let daysElapsed = Math.max(1, Math.ceil((todayObj.getTime() - createdTime) / (1000 * 3600 * 24))); let pace = logged / daysElapsed; if (g.deadline) { let deadlineTime = new Date(g.deadline).getTime(); let daysLeft = Math.ceil((deadlineTime - todayObj.getTime()) / (1000 * 3600 * 24)); let reqPace = daysLeft > 0 ? (g.current / daysLeft) : g.current; if (pace >= reqPace * 0.7) onTrackGoalsCount++; } else { onTrackGoalsCount++; } });
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

function submitReport() {
    let text = document.getElementById('report-input').value.trim();
    if (text.split(/\s+/).length >= requiredWords) {
        let timeElapsed = Date.now() - reportOpenTime; 
        let minTimeRequired = (currentDuration === 15) ? 12000 : 18000; 
        if (currentDuration >= 90) minTimeRequired = 30000; 
        
        if (timeElapsed < minTimeRequired) { 
            alert("PHÁT HIỆN BẤT THƯỜNG:\nTốc độ nhập liệu không hợp lý.\n\nPhiên học đã bị hủy và chuỗi kỷ luật trở về 0."); 
            document.getElementById('report-modal').style.display = 'none'; 
            currentStreak = 0; saveAll(); renderGamification(); resetSystem(); return; 
        }

        document.getElementById('report-modal').style.display = 'none';
        let isPunishment = isHardcoreTax || isDebtSession;

        activeSessionMinutes = standardMinutes + overtimeMinutes;
        if (activeSessionMinutes === 0) activeSessionMinutes = currentDuration; 
        
        let now = new Date(); 
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
        let dateStr = now.toISOString().split('T')[0];
        let currentHour = new Date().getHours(); // Lấy giờ thực tế để xét Nhiệm vụ buổi

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

            let totalEarn = (baseEarn + bonusEarn) * rewardMultiplier;
            
            let currentUsd = parseInt(localStorage.getItem("usdBalance")) || 0;
            localStorage.setItem("usdBalance", currentUsd + totalEarn);
            updateUsdDisplay();

            let msg = `HOÀN THÀNH PHIÊN HỌC:\n- Thu nhập: $${baseEarn + bonusEarn}`;
            if (rewardMultiplier > 1) msg += `\n- Thưởng Hệ số (x${rewardMultiplier}): $${totalEarn}`;
            alert(msg);

            // Kiểm tra và trao thưởng mốc mới
            let achieved10h = localStorage.getItem('saasAchieved10h') === 'true';
            let achieved15h = localStorage.getItem('saasAchieved15h') === 'true';
            
            if (currentCycleHrs >= 10.0 && !achieved10h) {
                localStorage.setItem('saasAchieved10h', 'true');
                let freezes = parseInt(localStorage.getItem('saasFreezes')) || 0;
                localStorage.setItem('saasFreezes', freezes + 1); // Cấp Kim Bài Miễn Tử
                setTimeout(() => alert("🎉 TẤN CẤP TINH ANH (10H): Nhận 1 Kim Bài Miễn Tử & X2 Thu nhập hệ thống!"), 500);
                if (typeof fireConfetti === 'function') fireConfetti();
            }
            if (currentCycleHrs >= 15.0 && !achieved15h) {
                localStorage.setItem('saasAchieved15h', 'true');
                setTimeout(() => alert("👑 TẤN CẤP HUYỀN THOẠI (15H): Gắn Vương Miện Danh Dự & X3 Thu nhập hệ thống!"), 1000);
                if (typeof fireConfetti === 'function') fireConfetti();
            }

            impactStockMarket("SUCCESS"); 
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
                
                // Cập nhật nhiệm vụ theo Khung Giờ
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
        
        let reportLabel = isPunishment ? `Phạt ${currentDuration}p` : `${currentDuration}p`;
        goal.reports.push({ 
            date: new Date().toLocaleDateString('vi-VN') + " - " + new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}), 
            type: reportLabel, 
            text: text 
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
                alert(`Đã cày xong ${currentDuration}p Thuế Trì Hoãn! Mồ hôi của ngài đã được cộng thẳng vào KPI tuần này.`);
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
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    let localDateStr = new Date().toLocaleDateString('vi-VN');
    
    let actualHoursToday = 0;
    goals.forEach(g => {
        if(g.reports) {
            g.reports.forEach(r => {
                let rDate = r.date.split(' - ')[0];
                if(rDate === localDateStr) {
                    let mins = parseInt(r.type.replace('p',''));
                    actualHoursToday += (mins / 60);
                }
            });
        }
    });
    
    let currentLogged = dailyLogs[todayStr] || 0;
    if (Math.abs(currentLogged - actualHoursToday) > 0.01) {
        dailyLogs[todayStr] = actualHoursToday;
        localStorage.setItem('saasDailyLogs', JSON.stringify(dailyLogs));
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
                if(!existingGoal) {
                    recommendations.push({
                        type: 'review', label: 'Review Môn', icon: 'fa-book-open',
                        title: item.name,
                        desc: 'Bạn vừa học môn này hôm nay. Hãy ôn tập lại khi kiến thức còn nóng hổi!',
                        suggestedTarget: 1.0
                    });
                }
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
                 if(!existingGoal) {
                    recommendations.push({
                        type: 'prepare', label: 'Chuẩn bị', icon: 'fa-bolt',
                        title: item.name,
                        desc: 'Ngày mai có lịch môn này. Dành 30 phút xem trước bài sẽ làm chủ thế trận.',
                        suggestedTarget: 0.5
                    });
                 }
            }
        }
    });

    let topRecoms = recommendations.slice(0, 3);
    
    if(topRecoms.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; border: 1px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.02);">Hệ thống đã phân tích: Không có đề xuất ôn tập hay chuẩn bị cấp bách nào. Bạn có thể tự do cày cuốc các môn học!</div>`;
        return;
    }

    topRecoms.forEach(r => {
        let badgeClass = r.type === 'review' ? 'review' : 'prepare';
        let targetText = r.suggestedTarget === 1.0 ? '1.0h' : '0.5h';
        container.innerHTML += `
            <div class="recom-card stagger-item">
                <div class="recom-badge ${badgeClass}"><i class="fa-solid ${r.icon}"></i> ${r.label} &middot; Đề xuất: ${targetText}</div>
                <div class="recom-title">${r.title}</div>
                <div class="recom-meta">${r.desc}</div>
                <button class="btn-accept-recom" onclick="acceptRecommendation('[${r.label}] ${r.title}', ${r.suggestedTarget})"><i class="fa-solid fa-plus"></i> Tạo Mục Tiêu Nhanh</button>
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
