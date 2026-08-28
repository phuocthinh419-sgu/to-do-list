/* ==========================================================================
   ACADEMIC COMMAND CENTER - ULTIMATE CORE SYSTEM (V6 FULL ARCHITECTURE)
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

let cycleStartDate = localStorage.getItem('saasCycleStart');
if (!cycleStartDate) {
    let todayObj = new Date(); 
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    cycleStartDate = todayObj.toISOString().split('T')[0]; 
    localStorage.setItem('saasCycleStart', cycleStartDate);
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

let timetableData = JSON.parse(localStorage.getItem('saasTimetable')) || [];

// =====================================================================
// ☁️ FIREBASE CLOUD SYNC & AUTH ENGINE (BẢO MẬT TUYỆT ĐỐI)
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

// HÀM ĐĂNG NHẬP & ĐĂNG XUẤT
function loginWithGoogle() {
    firebase.auth().signInWithPopup(provider).catch(error => alert("Lỗi trình ngọc ấn: " + error.message));
}

function logout() {
    if(confirm("Bạn muốn thu hồi ngọc ấn và rời khỏi án thư?")) {
        firebase.auth().signOut().then(() => location.reload());
    }
}

// LẮNG NGHE LỆNH ĐĂNG NHẬP (TRÁI TIM CỦA BẢO MẬT)
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        USER_DOC_ID = user.uid; 
        
        document.getElementById('login-overlay').style.display = 'none';
        
        let userBadge = document.getElementById('user-auth-badge');
        if(!userBadge) {
            let navMenu = document.querySelector('.nav-menu');
            navMenu.insertAdjacentHTML('afterbegin', `<div id="user-auth-badge" class="stagger-item" style="padding: 0 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; animation-delay: 0.05s;"><img src="${user.photoURL}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--brand-focus); box-shadow: 0 0 10px rgba(234, 88, 12, 0.3);"><div style="display: flex; flex-direction: column;"><span style="color: var(--text-main); font-weight: 800; font-size: 0.95rem; line-height: 1.2;">${user.displayName}</span><span onclick="logout()" style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 4px;" onmouseover="this.style.color='var(--brand-warning)'" onmouseout="this.style.color='var(--text-muted)'"><i class="fa-solid fa-right-from-bracket"></i> Rời án thư</span></div></div>`);
        }

        console.log("🔓 Ngọc ấn hợp lệ! Khởi động quy trình nạp dữ liệu từ Thiên Đình...");
        pullFromCloud(); 
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
            lastUpdated: Date.now()
        };
        localStorage.setItem('saasLastUpdated', dataToSync.lastUpdated);
        await db.collection("academic_apex").doc(USER_DOC_ID).set(dataToSync);
        console.log("☁️ Đã đồng bộ mồ hôi và lịch trình lên Thiên Đình.");
        
        let statusIcon = document.getElementById('status-box');
        if (statusIcon && !isSessionActive && !isBreakActive && !isGracePeriod) {
            statusIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color:var(--brand-info)"></i><span id="status-msg">Dữ liệu đã được bảo vệ trên Cloud.</span>`;
        }
    } catch (e) { console.error("Lỗi đồng bộ Cloud:", e); }
    isSyncing = false;
}

function pullFromCloud() {
    if (!currentUser) return;
    try {
        db.collection("academic_apex").doc(USER_DOC_ID).onSnapshot((docRef) => {
            if (docRef.exists) {
                const cloudData = docRef.data();
                const localUpdated = parseInt(localStorage.getItem('saasLastUpdated')) || 0;
                
                if (cloudData.lastUpdated > localUpdated) {
                    if (isSessionActive || isBreakActive || isGracePeriod) {
                        console.log("☁️ Mây có dữ liệu mới, nhưng đang cày ải. Tạm hoãn đồng bộ!");
                        return; 
                    }

                    console.log("☁️ Đồng bộ thời gian thực từ Thiên Đình...");
                    localStorage.setItem('saasGoalsPro', JSON.stringify(cloudData.goals));
                    localStorage.setItem('saasTotalSessionsPro', cloudData.totalSessions);
                    localStorage.setItem('saasCountdownsPro', JSON.stringify(cloudData.countdowns));
                    localStorage.setItem('saasDailyLogs', JSON.stringify(cloudData.dailyLogs));
                    localStorage.setItem('saasStreak', cloudData.streak);
                    localStorage.setItem('saasLastActive', cloudData.lastActive);
                    localStorage.setItem('saasS25', cloudData.s25);
                    localStorage.setItem('saasS15', cloudData.s15);
                    localStorage.setItem('saasCycleStart', cloudData.cycleStart);
                    localStorage.setItem('usdBalance', cloudData.usdBalance);
                    localStorage.setItem('userPortfolio', JSON.stringify(cloudData.userPortfolio));
                    localStorage.setItem('stockMarketPrices', JSON.stringify(cloudData.stockMarketPrices));
                    localStorage.setItem('saasLastRest', cloudData.lastRestDate);
                    localStorage.setItem('ach_comeback', cloudData.achComeback);
                    if (cloudData.timetable) localStorage.setItem('saasTimetable', JSON.stringify(cloudData.timetable));

                    localStorage.setItem('saasLastUpdated', cloudData.lastUpdated);
                    
                    checkCycleAndStreak();
                    if (document.getElementById('view-dashboard').style.display !== 'none') {
                        renderKPI(); renderDashboard(); renderGamification();
                    }
                }
            }
        });
    } catch (e) { console.error("Lỗi tải dữ liệu Cloud:", e); }
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
            isPaused: isPaused, savedTimeLeft: timeLeft
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
            document.getElementById('focus-room').style.display = 'flex'; // KHỞI ĐỘNG KIỂU V6
            
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
    
    if (rec.isPaused && rec.savedTimeLeft) {
        timeLeft = rec.savedTimeLeft;
        sessionEndTime = Date.now() + (timeLeft * 1000);
    } else {
        sessionEndTime = rec.endTime;
        timeLeft = Math.round((sessionEndTime - Date.now()) / 1000); 
    }
    
    document.body.classList.remove('break-mode'); document.body.classList.add('focus-active');
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');
    
    document.getElementById('focus-room').style.display = 'flex'; // GIAO DIỆN V6 FLEX
    
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
// ĐẠO LUẬT CHỐT SỔ (CHUẨN THƯƠNG MẠI 5H/TUẦN & 1H/NGÀY)
// =====================================================================
function checkCycleAndStreak() {
    if (goals.length === 0 && Object.keys(dailyLogs).length === 0) return; 

    let todayObj = new Date(); 
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    
    let yesterdayObj = new Date(todayObj); 
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    let yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    // 1. ĐẠO LUẬT TUẦN (5h/tuần)
    let todayMidnight = new Date(todayStr + "T00:00:00");
    let cycleMidnight = new Date(cycleStartDate + "T00:00:00");
    let diffCycleDays = Math.floor((todayMidnight - cycleMidnight) / (1000 * 60 * 60 * 24));

    if (diffCycleDays >= 7 && !isPendingTax) {
        exportData(); 

        let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
        if (usd >= 250) {
            localStorage.setItem("usdBalance", usd - 250);
            alert("Đã thu $250 Thuế Duy Trì Vương Triều cho tuần mới. TỰ ĐỘNG XUẤT FILE SAO LƯU!");
            updateUsdDisplay();
        } else {
            alert("Tài sản không đủ $250. Án thư sẽ bị niêm phong các chức năng nâng cao!");
            localStorage.setItem("isSealed", "true");
        }

        let totalCycleHours = 0;
        let cycleStartObj = new Date(cycleStartDate);
        for(let i = 0; i < 7; i++) {
            let d = new Date(cycleStartObj); 
            d.setDate(d.getDate() + i); 
            totalCycleHours += (dailyLogs[d.toISOString().split('T')[0]] || 0); 
        }
        
        if (totalCycleHours < 5.0) {
            if (!isPendingTax) impactStockMarket("PENALTY");
            isPendingTax = true; 
            localStorage.setItem('saasPendingTax', 'true'); 
        } else {
            alert(`TỔNG KẾT TUẦN: Bạn đã hoàn thành ${totalCycleHours.toFixed(1)} giờ. Chu kỳ mới bắt đầu!`);
        }
        
        cycleStartObj.setDate(cycleStartObj.getDate() + 7);
        if (todayMidnight - cycleStartObj > 14 * 24 * 3600 * 1000) cycleStartObj = new Date(todayStr);
        cycleStartDate = cycleStartObj.toISOString().split('T')[0];
        localStorage.setItem('saasCycleStart', cycleStartDate);
    }

    // 2. ĐẠO LUẬT NGÀY (1.0h/ngày)
    let checkedDate = localStorage.getItem('saasDebtCheckedDate');
    if (checkedDate !== yesterdayStr) {
        let lastCheckedObj = checkedDate ? new Date(checkedDate) : new Date(yesterdayStr);
        let daysToCheck = Math.floor((new Date(yesterdayStr) - lastCheckedObj) / (1000 * 60 * 60 * 24));
        
        if (daysToCheck <= 0 || isNaN(daysToCheck)) daysToCheck = 1; 

        for (let i = daysToCheck; i >= 1; i--) {
            let d = new Date(todayObj);
            d.setDate(d.getDate() - i);
            let checkStr = d.toISOString().split('T')[0];
            
            let targetHrs = (lastRestDate === checkStr) ? 0.75 : 1.0; 
            let hrsDone = dailyLogs[checkStr] || 0;
            
            if (hrsDone < targetHrs) {
                let deficitHrs = targetHrs - hrsDone; 
                let penaltyMins = Math.ceil(deficitHrs * 60 * 1.5); 
                if (dailyDebtMinutes === 0) impactStockMarket("PENALTY");
                dailyDebtMinutes += penaltyMins; 
            }
        }
        
        localStorage.setItem('saasDailyDebt', dailyDebtMinutes);
        localStorage.setItem('saasDebtCheckedDate', yesterdayStr);
    }

    if (lastActiveDate !== "" && lastActiveDate !== todayStr) {
        let lastDateObj = new Date(lastActiveDate); 
        let diffTime = Math.abs(new Date(todayStr) - lastDateObj);
        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays >= 7) localStorage.setItem('ach_comeback', 'true'); 
    }

    // 3. HIỂN THỊ ÁN PHẠT ĐÚNG TỘI DANH (ĐÃ VÁ LỖI HIỂN THỊ)
    if (isPendingTax) {
        setTimeout(() => {
            document.getElementById('shame-modal').style.display = 'flex';
            let shameTitle = document.querySelector('.shame-content h2'); 
            if(shameTitle) shameTitle.innerText = "THIẾT QUÂN LUẬT (NỘP THUẾ)";
            let shameDesc = document.querySelector('.shame-content p'); 
            if(shameDesc) shameDesc.innerText = "Bạn đã không đạt đủ tiêu chuẩn tự học: Tổng tuần < 5h. Bắt buộc nộp Thuế 90 phút!"; 
            let btnAlt = document.querySelector('.btn-shame-alt'); 
            if (btnAlt) btnAlt.style.display = 'none'; 
            let btnShame = document.querySelector('.btn-shame');
            if(btnShame) { btnShame.innerHTML = '<i class="fa-solid fa-fire-flame-curved"></i> NỘP THUẾ (90P)'; btnShame.onclick = startTaxSession; }
        }, 500);
        return;
    }

    if (dailyDebtMinutes > 0) {
        setTimeout(() => {
            document.getElementById('shame-modal').style.display = 'flex'; 
            let shameTitle = document.querySelector('.shame-content h2'); 
            if(shameTitle) shameTitle.innerText = "ĐẠO LUẬT LÃI KÉP (TIÊU CHUẨN 1.0H)";
            let shameDesc = document.querySelector('.shame-content p'); 
            if(shameDesc) shameDesc.innerHTML = `Bạn tu luyện chưa đủ tiêu chuẩn 1.0h/ngày. Hình phạt Lãi kép dồn toa là <strong>${dailyDebtMinutes} phút</strong>.<br>Phải làm sạch nợ mới được đi tiếp!`;
            let btnAlt = document.querySelector('.btn-shame-alt'); 
            if (btnAlt) btnAlt.style.display = 'none';
            let btnShame = document.querySelector('.btn-shame');
            if(btnShame) { btnShame.innerHTML = `<i class="fa-solid fa-link-slash"></i> BẮT ĐẦU KHỔ SAI (${dailyDebtMinutes}P)`; btnShame.onclick = startDebtSession; }
        }, 500);
        return;
    }

    let streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.innerText = currentStreak;
}

// =====================================================================
// ĐẾ CHẾ KINH TẾ & CHỨNG KHOÁN
// =====================================================================
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
    
    let totalStockValue = 0;
    for (let code in portfolio) {
        if (stocks[code]) totalStockValue += (portfolio[code] * stocks[code]);
    }
    let totalAssets = usd + totalStockValue;

    if (totalAssets < 300) {
        alert("⚠️ Án phí là $300. Tổng tài sản của bạn chỉ có $" + totalAssets + ".\n\nTÀI SẢN CẠN KIỆT! Bạn đã chính thức PHÁ SẢN.\n⚖️ Hình phạt: Chuỗi kỷ luật về 0. Xóa bỏ mọi khoản nợ để làm lại từ đầu!");
        currentStreak = 0; localStorage.setItem('saasStreak', 0);
        localStorage.removeItem('saasDailyDebt'); dailyDebtMinutes = 0;
        localStorage.removeItem('saasPendingTax'); isPendingTax = false;
        localStorage.setItem('saasCycleStart', todayStr);
        localStorage.setItem("usdBalance", 0); 
        localStorage.setItem("saasFeePaidDate", todayStr);
        if (typeof syncToCloud === "function") syncToCloud(); 
        location.reload();
        return false;
    } else if (usd < 300) {
        alert("⚠️ Tiền mặt chỉ có $" + usd + ", không đủ $300.\n⚖️ Hệ thống sẽ TỰ ĐỘNG BÁN THÁO cổ phiếu để trừ nợ!");
        for (let code in portfolio) {
            while (portfolio[code] > 0 && usd < 300) {
                portfolio[code]--; usd += stocks[code];
            }
        }
        localStorage.setItem("userPortfolio", JSON.stringify(portfolio));
        localStorage.setItem("usdBalance", usd - 300);
        localStorage.setItem("saasFeePaidDate", todayStr);
        updateUsdDisplay();
        if (typeof syncToCloud === "function") syncToCloud(); 
        return true;
    } else {
        alert("Đã thu $300 án phí. Bạn hãy vào trả nợ trì hoãn!");
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
    
    if (actionType === "SUCCESS") multiplier = 1.005; 
    else if (actionType === "CANCEL") multiplier = 0.99; 
    else if (actionType === "PENALTY") multiplier = 0.85; 
    
    for (let code in stocks) {
        let currentPrice = stocks[code];
        let newPrice = Math.round(currentPrice * multiplier);
        if (newPrice < 500) newPrice = 500; 
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
        let price = stocks[code]; let owned = portfolio[code] || 0;
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
    let price = stocks[code]; let owned = portfolio[code] || 0;
    let usd = parseInt(localStorage.getItem("usdBalance")) || 0;

    document.getElementById('tm-code').innerText = code;
    document.getElementById('tm-price').innerText = "$" + price;
    document.getElementById('tm-owned').innerText = owned;
    document.getElementById('tm-usd').innerText = "$" + usd;
    document.getElementById('trade-modal').style.display = 'flex';
}

function closeTradeModal() { document.getElementById('trade-modal').style.display = 'none'; }

function buyStock() {
    let code = currentTradeStock;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    let price = stocks[code]; let usd = parseInt(localStorage.getItem("usdBalance")) || 0;

    if (usd >= price) {
        localStorage.setItem("usdBalance", usd - price);
        portfolio[code] = (portfolio[code] || 0) + 1;
        localStorage.setItem("userPortfolio", JSON.stringify(portfolio));
        playTick(); updateUsdDisplay(); openTradeModal(code); renderStockMarket(); syncToCloud();
    } else {
        alert(`❌ Tài sản của bạn chỉ còn $${usd}, không đủ sức mua 1 cổ phiếu ${code} với giá $${price}!`);
    }
}

function sellStock() {
    let code = currentTradeStock;
    let stocks = JSON.parse(localStorage.getItem("stockMarketPrices"));
    let portfolio = JSON.parse(localStorage.getItem("userPortfolio")) || {};
    let price = stocks[code]; let usd = parseInt(localStorage.getItem("usdBalance")) || 0;
    let owned = portfolio[code] || 0;

    if (owned > 0) {
        localStorage.setItem("usdBalance", usd + price);
        portfolio[code] = owned - 1;
        localStorage.setItem("userPortfolio", JSON.stringify(portfolio));
        playAlertSound(); updateUsdDisplay(); openTradeModal(code); renderStockMarket(); syncToCloud();
    } else {
        alert(`❌ Bạn hiện không nắm giữ cổ phiếu ${code} nào để bán khống!`);
    }
}

function initializeImperialEconomy() {
    let isEconomyInitialized = localStorage.getItem("imperialEconomyActive");
    if (!isEconomyInitialized) {
        let totalMinutes = 0;
        goals.forEach(g => { if (g.reports) { g.reports.forEach(r => { totalMinutes += parseInt(r.type.replace('p', '')); }); } });

        let currentStreakDays = currentStreak; let grossIncome = totalMinutes;
        let weeksOnStreak = Math.floor(currentStreakDays / 7); let retroactiveTax = weeksOnStreak * 250;
        let netBalance = grossIncome - retroactiveTax; if (netBalance < 0) netBalance = 0;

        localStorage.setItem("usdBalance", netBalance);
        
        const initialStocks = { "ULIS": 950, "HNUE": 920, "BAYM": 880, "IELT": 800, "GPAX": 750, "VSN": 700, "TS10": 650, "TESL": 620, "VOCA": 580, "MYST": 520 };
        localStorage.setItem("stockMarketPrices", JSON.stringify(initialStocks));
        
        const userPortfolio = { "ULIS": 0, "HNUE": 0, "BAYM": 0, "IELT": 0, "GPAX": 0, "VSN": 0, "TS10": 0, "TESL": 0, "VOCA": 0, "MYST": 0 };
        localStorage.setItem("userPortfolio", JSON.stringify(userPortfolio));
        localStorage.setItem("imperialEconomyActive", "true");
        syncToCloud();
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
// KHỔ SAI & HÌNH PHẠT (VÁ LỖI HIỂN THỊ FOCUS ROOM V6)
// =====================================================================

function completeDebtSession() {
    isSessionActive = false; isDebtSession = false;
    localStorage.removeItem('saasDailyDebt'); localStorage.removeItem('saas_recovery');

    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset()); let todayStr = todayObj.toISOString().split('T')[0];
    
    let safeLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {};
    safeLogs[todayStr] = (safeLogs[todayStr] || 0) + (activeSessionMinutes / 60);
    localStorage.setItem('saasDailyLogs', JSON.stringify(safeLogs));
    if (typeof dailyLogs !== 'undefined') dailyLogs = safeLogs;

    let total = parseFloat(localStorage.getItem('saasTotalSessionsPro')) || 0;
    total += (activeSessionMinutes / 60); localStorage.setItem('saasTotalSessionsPro', total.toFixed(2));

    let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
    localStorage.setItem('usdBalance', currentUsd + activeSessionMinutes);

    if(typeof syncToCloud === 'function') syncToCloud();
    alert("🎉 ĐÃ TRẢ SẠCH NỢ! " + activeSessionMinutes + " phút mồ hôi đã được cộng vào Tổng Giờ. Bạn đã được tự do!"); location.reload();
}

function completeTaxSession() {
    isSessionActive = false; isHardcoreTax = false;
    localStorage.removeItem('saasPendingTax'); localStorage.removeItem('saas_recovery');

    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset()); let todayStr = todayObj.toISOString().split('T')[0];
    
    let safeLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {};
    safeLogs[todayStr] = (safeLogs[todayStr] || 0) + (activeSessionMinutes / 60);
    localStorage.setItem('saasDailyLogs', JSON.stringify(safeLogs));
    if (typeof dailyLogs !== 'undefined') dailyLogs = safeLogs;

    let total = parseFloat(localStorage.getItem('saasTotalSessionsPro')) || 0;
    total += (activeSessionMinutes / 60); localStorage.setItem('saasTotalSessionsPro', total.toFixed(2));

    let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
    localStorage.setItem('usdBalance', currentUsd + activeSessionMinutes);

    if(typeof syncToCloud === 'function') syncToCloud();
    alert("🎉 THUẾ ĐÃ NỘP XONG! " + activeSessionMinutes + " phút mồ hôi đã được cộng vào mọi mặt trận. Giang sơn vững bền!"); location.reload();
}

function startDebtSession() {
    if (!checkAndDeductCourtFee()) return;
    if(goals.length === 0) { goals.push({ id: Date.now(), name: "KHỔ SAI LÃI KÉP", target: 2, current: 2, reports: [] }); }
    activeGoalId = goals[0].id;
    
    let modal = document.getElementById('shame-modal'); if(modal) modal.style.display = 'none'; 
    let sidebar = document.getElementById('sidebar'); if(sidebar) sidebar.classList.remove('active'); 
    let overlay = document.getElementById('mobile-overlay'); if(overlay) overlay.classList.remove('active');
    
    // ÉP MỞ FLEX THEO CSS V6
    let room = document.getElementById('focus-room'); if(room) room.style.display = 'flex';
    
    let info = document.getElementById('focus-target-info'); if(info) info.innerText = "PHIÊN KHỔ SAI LÃI KÉP (NỢ NGÀY)";
    
    let badge = document.getElementById('focus-badge'); 
    if(badge) {
        badge.innerText = "CHẾ ĐỘ TRẢ NỢ"; 
        badge.style.background = "rgba(225, 29, 72, 0.1)"; 
        badge.style.color = "var(--brand-warning)"; 
        badge.style.border = "1px solid var(--brand-warning)"; // VÁ LỖI XÓA MẤT VIỀN
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
    isDebtSession = true; taxPauseBank = 180; 
    
    currentDuration = dailyDebtMinutes; activeSessionMinutes = dailyDebtMinutes; timeLeft = dailyDebtMinutes * 60; sessionEndTime = Date.now() + timeLeft * 1000;
    
    isSessionActive = true; isPaused = false; document.body.classList.add('focus-active');
    try { saveRecoveryState(); } catch(e) {}
    
    let btnPause = document.getElementById('btn-pause');
    if(btnPause) { btnPause.style.display = 'flex'; btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)'; }
    
    updateDisplay(timeLeft); clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; }
        if (!isPaused) {
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000);
            if (timeLeft <= 0) { 
                timeLeft = 0; clearInterval(timerInterval); playAlertSound(); completeDebtSession(); return;
            }
            updateDisplay(timeLeft); if (isTickOn && timeLeft % 1 === 0) playTick();
        }
    }, 1000);
}

function startTaxSession() {
    if (!checkAndDeductCourtFee()) return;
    if(goals.length === 0) { goals.push({ id: Date.now(), name: "KHÔI PHỤC CHUỖI", target: 2, current: 2, reports: [] }); }
    activeGoalId = goals[0].id;
    
    let modal = document.getElementById('shame-modal'); if(modal) modal.style.display = 'none'; 
    let sidebar = document.getElementById('sidebar'); if(sidebar) sidebar.classList.remove('active'); 
    let overlay = document.getElementById('mobile-overlay'); if(overlay) overlay.classList.remove('active');
    
    // ÉP MỞ FLEX THEO CSS V6
    let room = document.getElementById('focus-room'); if(room) room.style.display = 'flex';
    
    let info = document.getElementById('focus-target-info'); if(info) info.innerText = "THIẾT QUÂN LUẬT (90 PHÚT)";
    
    let badge = document.getElementById('focus-badge'); 
    if(badge) {
        badge.innerText = "CHẾ ĐỘ HARDCORE"; 
        badge.style.background = "rgba(225, 29, 72, 0.1)"; 
        badge.style.color = "var(--brand-warning)"; 
        badge.style.border = "1px solid var(--brand-warning)"; // VÁ LỖI XÓA MẤT VIỀN
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
    isHardcoreTax = true; taxPauseBank = 900; 
    
    currentDuration = 90; activeSessionMinutes = 90; timeLeft = 90 * 60; sessionEndTime = Date.now() + timeLeft * 1000;
    
    isSessionActive = true; isPaused = false; document.body.classList.add('focus-active');
    try { saveRecoveryState(); } catch(e) {}
    
    let btnPause = document.getElementById('btn-pause');
    if(btnPause) { btnPause.style.display = 'flex'; btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)'; }
    
    updateDisplay(timeLeft); clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; }
        if (!isPaused) {
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000);
            if (timeLeft <= 0) { 
                timeLeft = 0; clearInterval(timerInterval); playAlertSound(); completeTaxSession(); return;
            }
            updateDisplay(timeLeft); if (isTickOn && timeLeft % 1 === 0) playTick();
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
    syncToCloud(); 
}

document.getElementById('report-input').addEventListener('paste', function(e) { 
    e.preventDefault(); alert("Hệ thống từ chối thao tác dán văn bản."); 
});

function exportData() {
    const dataToExport = { goals, totalSessions, countdowns, dailyLogs, streak: currentStreak, lastActive: lastActiveDate, s25: standardSessionCount25, s15: standardSessionCount15, cycleStart: cycleStartDate };
    const dataStr = JSON.stringify(dataToExport); 
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `AcademicPlanner_SaoLuu_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri); linkElement.setAttribute('download', exportFileDefaultName); linkElement.click();
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
            syncToCloud(); alert("Đã phục hồi dữ liệu thành công! Trang web sẽ tự động tải lại."); location.reload();
        } catch (error) { alert("File không hợp lệ hoặc bị lỗi định dạng!"); }
    }; 
    reader.readAsText(file); event.target.value = ''; 
}

// =====================================================================
// KHỐI LOGIC THIẾT QUÂN LUẬT & KPI
// =====================================================================
function renderKPI() {
    let totalCycleHours = 0; 
    let cycleStartObj = new Date(cycleStartDate);
    for(let i=0; i<7; i++) { 
        let d = new Date(cycleStartObj); d.setDate(d.getDate() + i); 
        let dStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        totalCycleHours += (dailyLogs[dStr] || 0); 
    }
    
    let pct = Math.min(100, (totalCycleHours / 5.0) * 100);
    let statusEl = document.getElementById('kpi-status'); 
    let fillEl = document.getElementById('kpi-bar-fill'); 
    let msgEl = document.getElementById('kpi-message');
    
    if(statusEl && fillEl && msgEl) {
        statusEl.innerText = `${totalCycleHours.toFixed(1)} / 5.0h`; 
        fillEl.style.width = `${pct}%`;
        
        let now = new Date(); 
        let todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        let todayMidnight = new Date(todayStr + "T00:00:00");
        let cycleMidnight = new Date(cycleStartDate + "T00:00:00");
        let diffCycleDays = Math.floor((todayMidnight - cycleMidnight) / (1000 * 60 * 60 * 24)); 
        let daysLeft = Math.max(1, 7 - diffCycleDays); 
        
        if(totalCycleHours >= 5.0) {
            msgEl.innerHTML = '<strong style="color:#eab308"><i class="fa-solid fa-crown"></i> Vượt ngưỡng xuất chúng! Bạn đã out-trình 90% bá tánh!</strong>'; 
            fillEl.style.background = '#eab308'; 
            fillEl.style.boxShadow = '0 0 20px #eab308';
            if(localStorage.getItem('saasKPIAchieved_' + cycleStartDate) !== 'true') { 
                localStorage.setItem('saasKPIAchieved_' + cycleStartDate, 'true'); fireConfetti(); 
            }
        } else {
            let remainingHrs = 5.0 - totalCycleHours;
            let reqPace = remainingHrs / daysLeft;
            let standardPace = 1.0; 
            let shortfall = remainingHrs - (standardPace * daysLeft);
            let paceColor = ""; let paceIcon = ""; let paceStatus = ""; let pctDiffStr = "";
            
            if (reqPace <= 1.0) {
                paceColor = "var(--brand-break)"; paceIcon = "🟢"; paceStatus = "An toàn";
                let diff = Math.round((1.0 - reqPace) / 1.0 * 100);
                pctDiffStr = `<strong style="color:var(--brand-break)">-${diff}%</strong>`;
            } else if (reqPace <= 1.5) {
                paceColor = "#f59e0b"; paceIcon = "🟡"; paceStatus = "Cần tăng tốc"; 
                let diff = Math.round((reqPace - 1.0) / 1.0 * 100);
                pctDiffStr = `<strong style="color:#f59e0b">+${diff}%</strong>`;
            } else {
                paceColor = "var(--brand-warning)"; paceIcon = "🔴"; paceStatus = "Nguy cơ quá tải"; 
                let diff = Math.round((reqPace - 1.0) / 1.0 * 100);
                pctDiffStr = `<strong style="color:var(--brand-warning)">+${diff}%</strong>`;
            }

            let insightHtml = `
                <div style="margin-top: 16px; padding: 16px; background: rgba(0,0,0,0.02); border: 1px solid var(--border); border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 700; margin-bottom: 12px;">
                        Còn thiếu <strong style="color:var(--text-main)">${remainingHrs.toFixed(1)}h</strong> &middot; Còn lại <strong style="color:var(--text-main)">${daysLeft} ngày</strong>
                    </div>
                    <div style="font-size: 1.05rem; color: var(--text-main); font-weight: 800; margin-bottom: 8px;">
                        ${paceIcon} Cần <span style="color: ${paceColor}">${reqPace.toFixed(1)}h/ngày</span> để đạt mục tiêu
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; display: flex; flex-direction: column; gap: 6px;">
                        <span>Tiêu chuẩn tự học: 1.0h/ngày &middot; ${pctDiffStr} <span style="opacity: 0.8">(${paceStatus})</span></span>
                        ${shortfall > 0 
                            ? `<span style="color: var(--brand-warning);"><i class="fa-solid fa-triangle-exclamation"></i> Nếu duy trì 1.0h/ngày &rarr; thiếu ~${shortfall.toFixed(1)}h vào cuối tuần</span>` 
                            : `<span style="color: var(--brand-break);"><i class="fa-solid fa-check"></i> Duy trì 1.0h/ngày là đủ để về đích an toàn.</span>`}
                    </div>
                </div>
            `;
            msgEl.innerHTML = insightHtml; 
            fillEl.style.background = 'var(--brand-focus)'; 
            fillEl.style.boxShadow = '0 0 10px rgba(234, 88, 12, 0.4)';
        }
    }
}

function renderGamification() {
    let totalHoursEarned = Object.values(dailyLogs).reduce((sum, val) => sum + val, 0); 
    document.getElementById('total-hours-metric').innerText = totalHoursEarned.toFixed(1) + 'h'; 
    let streakEl = document.getElementById('streak-count');
    if(streakEl) streakEl.innerText = currentStreak;
    
    let rankTitle = "Người Mới"; let rankDesc = "Cần 10h để thăng cấp Học Giả"; let rankColor = "#94a3b8"; 
    if(totalHoursEarned >= 300) { rankTitle = "Huyền Thoại"; rankDesc = "Thành tích học tập xuất sắc"; rankColor = "#f59e0b"; } 
    else if(totalHoursEarned >= 100) { rankTitle = "Bậc Thầy"; rankDesc = `Cần ${Math.ceil(300 - totalHoursEarned)}h để thăng cấp Huyền Thoại`; rankColor = "#8b5cf6"; } 
    else if(totalHoursEarned >= 50) { rankTitle = "Chuyên Gia"; rankDesc = `Cần ${Math.ceil(100 - totalHoursEarned)}h để thăng cấp Bậc Thầy`; rankColor = "#ea580c"; } 
    else if(totalHoursEarned >= 10) { rankTitle = "Học Giả"; rankDesc = `Cần ${Math.ceil(50 - totalHoursEarned)}h để thăng cấp Chuyên Gia`; rankColor = "#10b981"; } 
    
    document.getElementById('rank-title').innerText = rankTitle; 
    document.getElementById('rank-desc').innerText = rankDesc; 
    const iconEl = document.getElementById('rank-icon'); 
    iconEl.style.color = rankColor; 
    iconEl.style.filter = `drop-shadow(0 0 12px ${rankColor}80)`;
    
    const grid = document.getElementById('heatmap-grid'); 
    if(grid) grid.innerHTML = ''; 
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    
    let activeDays35 = 0; let totalHours35 = 0;
    for(let i = 34; i >= 0; i--) {
        let d = new Date(todayObj); d.setDate(d.getDate() - i); 
        let dateStr = d.toISOString().split('T')[0]; 
        let hours = dailyLogs[dateStr] || 0; 
        let heatClass = "";
        
        if(hours > 0) { activeDays35++; totalHours35 += hours; }

        if(hours > 0 && hours < 1) heatClass = "heat-1"; 
        else if(hours >= 1 && hours < 3) heatClass = "heat-2"; 
        else if(hours >= 3 && hours < 5) heatClass = "heat-3"; 
        else if(hours >= 5) heatClass = "heat-4";
        
        if(grid) grid.innerHTML += `<div class="heat-cell ${heatClass}" title="${dateStr}: ${hours.toFixed(1)}h"></div>`;
    }

    let heatTotalEl = document.getElementById('heat-total-hrs'); let heatActiveEl = document.getElementById('heat-active-days'); let heatAvgEl = document.getElementById('heat-avg-hrs');
    if(heatTotalEl) heatTotalEl.innerText = totalHours35.toFixed(1) + 'h';
    if(heatActiveEl) heatActiveEl.innerText = activeDays35 + '/35';
    if(heatAvgEl) heatAvgEl.innerText = (totalHours35 / 35).toFixed(1) + 'h';
}

function renderCountdowns() {
    const strip = document.getElementById('countdown-strip'); 
    strip.innerHTML = '';
    if (countdowns.length === 0) { strip.style.display = 'none'; return; }
    
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
            dEl.innerText = "00"; document.getElementById(`cd-h-${cd.id}`).innerText = "00"; document.getElementById(`cd-m-${cd.id}`).innerText = "00"; document.getElementById(`cd-s-${cd.id}`).innerText = "00"; 
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
    saveAll(); renderCountdowns();
}

function deleteCountdown(id) { 
    if (confirm("Xóa bộ đếm ngược này?")) { countdowns = countdowns.filter(c => c.id !== id); saveAll(); renderCountdowns(); } 
}

function switchTab(tab) {
    if (isPendingTax || dailyDebtMinutes > 0) { 
        setTimeout(() => {
            alert("Án thư đang bị phong tỏa. Bắt buộc hoàn thành phiên phạt!");
            let focusRoom = document.getElementById('focus-room');
            if(focusRoom) focusRoom.style.display = 'flex'; // VÁ LỖI HIỂN THỊ FLEX V6
            
            let targetInfo = document.getElementById('focus-target-info');
            if (targetInfo) targetInfo.innerHTML = "<i class='fa-solid fa-skull-crossbones' style='color: #e11d48;'></i> MỤC TIÊU: PHIÊN PHẠT CƯỠNG CHẾ";
            
            let backBtn = document.getElementById('btn-focus-back');
            if (backBtn) backBtn.style.display = 'none';
        }, 300);
        return;
    }
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('view-dashboard').style.display = 'none'; 
    document.getElementById('analytics-room').style.display = 'none'; 
    document.getElementById('trophy-room').style.display = 'none'; 
    document.getElementById('trophy-detail').style.display = 'none';
    document.getElementById('timetable-room').style.display = 'none';
    
    document.getElementById('sidebar').classList.remove('active'); 
    document.getElementById('mobile-overlay').classList.remove('active');

    let navTt = document.getElementById('nav-timetable'); if(navTt) navTt.classList.remove('active');

    if(tab === 'dashboard') {
        document.getElementById('nav-dash').classList.add('active'); 
        document.getElementById('view-dashboard').style.display = 'block';
        document.getElementById('main-title').innerText = "Tổng quan học tập"; 
        document.getElementById('main-desc').innerText = "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.";
        document.getElementById('btn-create-goal').style.display = 'flex'; document.getElementById('btn-create-countdown').style.display = 'flex'; document.getElementById('btn-rest-day').style.display = 'flex';
        renderKPI(); renderDashboard(); renderGamification(); renderStockMarket(); renderRecommendations();
    } else if(tab === 'analytics') {
        document.getElementById('nav-analytics').classList.add('active'); 
        document.getElementById('analytics-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Phân tích Kỷ luật"; 
        document.getElementById('main-desc').innerText = "Nhìn thấu tiến độ. Điều hướng binh lực.";
        document.getElementById('btn-create-goal').style.display = 'none'; document.getElementById('btn-create-countdown').style.display = 'none'; document.getElementById('btn-rest-day').style.display = 'none';
        renderAnalytics();
    } else if(tab === 'trophy') {
        document.getElementById('nav-trophy').classList.add('active'); 
        document.getElementById('trophy-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Lịch Sử Học Tập"; 
        document.getElementById('main-desc').innerText = "Nơi lưu trữ các mục tiêu đã hoàn thành.";
        document.getElementById('btn-create-goal').style.display = 'none'; document.getElementById('btn-create-countdown').style.display = 'none'; document.getElementById('btn-rest-day').style.display = 'none';
        renderTrophyRoom();
    } else if (tab === 'timetable') {
        if(navTt) navTt.classList.add('active');
        document.getElementById('timetable-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Thời Khóa Biểu"; 
        document.getElementById('main-desc').innerText = "Sắp xếp chiến lược. Tối ưu thời gian.";
        document.getElementById('btn-create-goal').style.display = 'none'; document.getElementById('btn-create-countdown').style.display = 'none'; document.getElementById('btn-rest-day').style.display = 'none';
        renderTimetable();
    }
}

window.renderDailyBreakdown = function(targetDate) {
    let content = document.getElementById('daily-breakdown-content'); 
    if (!content) return;
    
    let dayStats = []; let totalDayHours = 0;
    
    goals.forEach(g => {
        if(g.reports) {
            let goalHrs = 0; let sessionsCount = 0;
            g.reports.forEach(r => { 
                if(r.date.startsWith(targetDate)) { 
                    sessionsCount++; let mins = parseInt(r.type.replace('p','')); goalHrs += (mins / 60); 
                } 
            });
            if(goalHrs > 0) { totalDayHours += goalHrs; dayStats.push({ name: g.name, hrs: goalHrs, sessions: sessionsCount }); }
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
// BỘ HỘ PHỦ: QUẢN LÝ NHIỆM VỤ NGÀY (RANDOM) & NHẬN THƯỞNG
// =====================================================================
function initDailyQuests() {
    let todayObj = new Date();
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];

    let questDate = localStorage.getItem('saasQuestDate');
    if (questDate !== todayStr) {
        const questPool = [
            { id: 'q_morn', type: 'time_slot', slot: 'morning', target: 45, current: 0, reward: 40, title: 'Chiến Thần Bình Minh', desc: 'Tích lũy 45p tu luyện buổi sáng (5h-12h)', claimed: false },
            { id: 'q_aft', type: 'time_slot', slot: 'afternoon', target: 45, current: 0, reward: 40, title: 'Nắng Chiều Không Nghỉ', desc: 'Tích lũy 45p tu luyện buổi chiều (12h-18h)', claimed: false },
            { id: 'q_eve', type: 'time_slot', slot: 'evening', target: 45, current: 0, reward: 40, title: 'Kẻ Thống Trị Màn Đêm', desc: 'Tích lũy 45p tu luyện tối/đêm (18h-24h)', claimed: false },
            { id: 'q_p25', type: 'session_25', target: 2, current: 0, reward: 30, title: 'Bậc Thầy Pomodoro', desc: 'Hoàn thành 2 phiên chuẩn 25p', claimed: false },
            { id: 'q_p15', type: 'session_15', target: 3, current: 0, reward: 30, title: 'Đánh Nhanh Thắng Nhanh', desc: 'Hoàn thành 3 phiên ngắn 15p', claimed: false },
            { id: 'q_l50', type: 'session_long', target: 1, current: 0, reward: 50, title: 'Sức Bền Đáng Nể', desc: 'Hoàn thành 1 phiên cày liên tục >= 50p', claimed: false },
            { id: 'q_fst', type: 'any_session', target: 1, current: 0, reward: 15, title: 'Khởi Động Trơn Tru', desc: 'Hoàn thành 1 phiên học bất kỳ', claimed: false },
            { id: 'q_90m', type: 'total_time', target: 60, current: 0, reward: 100, title: 'Chạm Mốc Tiêu Chuẩn', desc: 'Tích lũy đủ 1.0h (60p) trong ngày', claimed: false } // Sửa chuẩn xuống 1.0h đại chúng
        ];

        for (let i = questPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questPool[i], questPool[j]] = [questPool[j], questPool[i]];
        }
        
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
        updateUsdDisplay(); renderDailyQuests(); if(typeof syncToCloud === 'function') syncToCloud();
    }
}

// =====================================================================
// KIẾN TRÚC HIỂN THỊ (RENDER DASHBOARD)
// =====================================================================
function createNewGoal() {
    const name = prompt("Tên mục tiêu (VD: Lịch sử Đảng):"); if (!name) return;
    const target = parseFloat(prompt("Định mức thời gian (Số giờ - VD: 20):")); if (isNaN(target) || target <= 0) return alert("Không hợp lệ.");
    const deadlineInput = prompt("Hạn chót (YYYY-MM-DD) - Nếu không có hãy để trống và bấm OK:");
    let deadline = null;
    if (deadlineInput && deadlineInput.trim() !== "") {
        const parsed = new Date(deadlineInput.trim());
        if (!isNaN(parsed.getTime())) deadline = parsed.toISOString().split('T')[0];
    }
    
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    const createdAt = todayObj.toISOString().split('T')[0];

    goals.push({ id: Date.now(), name: name, target: target, current: target, reports: [], deadline: deadline, createdAt: createdAt });
    saveAll(); renderDashboard(); renderGamification();
}

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
                    <svg viewBox="0 0 85 85"><circle class="progress-bg" cx="42.5" cy="42.5" r="36"></circle><circle class="progress-bar" cx="42.5" cy="42.5" r="36" style="stroke-dashoffset: ${offset}"></circle></svg>
                    <div class="progress-text">${percent.toFixed(0)}%</div>
                </div>
                <div class="goal-meta" style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
                        <h3 style="margin: 0; font-size: 1.15rem; line-height: 1.2;">${goal.name}</h3>${healthHtml}
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                        <div><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Còn lại</div><div style="font-size: 0.9rem; color: var(--text-main); font-weight: 800;">${goal.current.toFixed(1)}h <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">/ ${goal.target}h</span></div></div>
                        <div><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Tốc độ (Pace)</div><div style="font-size: 0.9rem; color: var(--text-main); font-weight: 800;">${paceText}</div></div>
                        <div style="grid-column: 1 / -1; border-top: 1px solid var(--border); padding-top: 8px; margin-top: -4px;"><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Dự kiến xong (ETA)</div><div style="font-size: 0.85rem; color: var(--brand-info); font-weight: 700;">${etaText}</div></div>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

function openGoal(id) {
    if (isPendingTax || dailyDebtMinutes > 0) { alert("Phải dọn sạch nợ trước khi tiếp tục mục tiêu khác!"); return; }
    activeGoalId = id; const goal = goals.find(g => g.id === id);
    
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');
    
    // VÁ LỖI HIỂN THỊ FLEX MỚI CỦA V6
    let room = document.getElementById('focus-room');
    if(room) room.style.display = 'flex';
    
    document.getElementById('focus-target-info').innerText = `Mục tiêu: ${goal.name} | Còn lại: ${goal.current.toFixed(2)}h`;
    let badge = document.getElementById('focus-badge'); 
    
    // VÁ LỖI XÓA MẤT ĐỊNH DẠNG BADGE
    badge.innerText = "Khu Vực Tập Trung"; 
    badge.style.color = "var(--brand-focus)";
    badge.style.background = "rgba(255,255,255,0.1)";
    badge.style.border = "1px solid rgba(255,255,255,0.2)";
    
    if(audioCtx.state === 'suspended') audioCtx.resume(); 
    resetSystem();
}

function checkNoonPenalty() {
    if (!currentUser) return; 
    if (goals.length === 0 && Object.keys(dailyLogs).length === 0) return;

    let now = new Date();
    let todayStr = now.toISOString().split('T')[0];
    let lastNoonPenalty = localStorage.getItem('lastNoonPenaltyDate');
    
    if (now.getHours() >= 12 && lastNoonPenalty !== todayStr) {
        let currentDayOfWeek = now.getDay(); 
        let hasMorningSchedule = false;
        
        if (typeof timetableData !== 'undefined' && timetableData.length > 0) {
            hasMorningSchedule = timetableData.some(item => 
                parseInt(item.dow) === currentDayOfWeek && item.shift === 'sang'
            );
        }

        let todayHrs = dailyLogs[todayStr] || 0;
        let requiredMorningHrs = 25 / 60; 

        if (hasMorningSchedule) {
            console.log("Dò thấy lịch học sáng. Đao phủ 12h rút lui!");
            localStorage.setItem('lastNoonPenaltyDate', todayStr); 
        } else if (todayHrs < requiredMorningHrs) {
            let currentUsd = parseInt(localStorage.getItem('usdBalance')) || 0;
            currentUsd -= 10; 
            localStorage.setItem('usdBalance', currentUsd);
            
            updateUsdDisplay();
            if (typeof syncToCloud === 'function') syncToCloud();
            
            alert("THÁNH CHỈ! Sáng nay trống lịch mà bạn chưa kích hoạt phiên Pomodoro nào. Tịch thu $10!");
            localStorage.setItem('lastNoonPenaltyDate', todayStr); 
        } else {
            localStorage.setItem('lastNoonPenaltyDate', todayStr); 
        }
    }
}

// 🛑 HOOK VÀO HÀM RENDER DASHBOARD ĐỂ KÍCH HOẠT QUÉT LỊCH VÀ CÁO THỊ
const originDashboardRender = renderDashboard;
window.renderDashboard = function() {
    originDashboardRender(); 
    initDailyQuests();         
    renderDailyQuests();
    checkNoonPenalty(); 
}

// =====================================================================
// KHỞI ĐỘNG HỆ THỐNG
// =====================================================================
initializeImperialEconomy();
randomDailyMarketFluctuation();
updateUsdDisplay();
autoHealDiscrepancy();
renderCountdowns(); 
countdownInterval = setInterval(() => { updateCountdownTicks(); updateCurfewCountdown(); }, 1000); 
switchTab('dashboard'); 
checkRecovery();
