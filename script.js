const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
function playAlertSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 1.5);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 1.5);
}

function playTick() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.05);
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
    for(let i=0; i<150; i++) {
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
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => {
            p.tiltAngle += p.tiltAngleInc; p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2; p.x += Math.sin(p.tiltAngle) * 2 + p.dx; p.dy += 0.05; p.y += p.dy;
            ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.tilt + p.r, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r); ctx.stroke();
        });
    }
    animate();
    setTimeout(() => { cancelAnimationFrame(animationId); ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display = 'none'; }, 5000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active'); document.getElementById('mobile-overlay').classList.toggle('active');
}

function changeColor(color) {
    document.documentElement.setAttribute('data-color', color); localStorage.setItem('plannerColor', color);
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.querySelector(`.color-btn.${color}`); if(activeBtn) activeBtn.classList.add('active');
}
let savedColor = localStorage.getItem('plannerColor') || 'zen'; changeColor(savedColor);

function toggleTheme() {
    const body = document.documentElement; const icon = document.getElementById('theme-icon');
    if (body.getAttribute('data-theme') === 'dark') { body.removeAttribute('data-theme'); icon.className = 'fa-solid fa-moon'; localStorage.setItem('plannerTheme', 'light'); } 
    else { body.setAttribute('data-theme', 'dark'); icon.className = 'fa-solid fa-sun'; localStorage.setItem('plannerTheme', 'dark'); }
}
if(localStorage.getItem('plannerTheme') === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); document.getElementById('theme-icon').className = 'fa-solid fa-sun'; } 
else { document.getElementById('theme-icon').className = 'fa-solid fa-moon'; }

let goals = JSON.parse(localStorage.getItem('saasGoalsPro')) || [];
let totalSessions = parseInt(localStorage.getItem('saasTotalSessionsPro')) || 0;
let countdowns = JSON.parse(localStorage.getItem('saasCountdownsPro')) || [];
let dailyLogs = JSON.parse(localStorage.getItem('saasDailyLogs')) || {}; 
let lastActiveDate = localStorage.getItem('saasLastActive') || "";
let currentStreak = parseInt(localStorage.getItem('saasStreak')) || 0;
let lastRestDate = localStorage.getItem('saasLastRest') || "";

let cycleStartDate = localStorage.getItem('saasCycleStart');
if (!cycleStartDate) {
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    cycleStartDate = todayObj.toISOString().split('T')[0]; localStorage.setItem('saasCycleStart', cycleStartDate);
}
let isPendingTax = localStorage.getItem('saasPendingTax') === 'true';

let dailyDebtMinutes = parseInt(localStorage.getItem('saasDailyDebt')) || 0;
let isDebtSession = false;
let isIcebreakerPhase = false; // Biến kiểm soát trạng thái Phá Băng

let activeGoalId = null;
let timerInterval, countdownInterval, timeLeft = 0, isSessionActive = false, currentDuration = 0, requiredWords = 0;
let isPaused = false, pauseInterval, pauseTimeLeft = 300, sessionEndTime = 0, pauseEndTime = 0, graceEndTime = 0;
let standardSessionCount25 = parseInt(localStorage.getItem('saasS25')) || 0;
let standardSessionCount15 = parseInt(localStorage.getItem('saasS15')) || 0;
let graceInterval, graceTimeLeft = 0, isGracePeriod = false, penaltyMinutes = 0, activeSessionMinutes = 0; 
let reportOpenTime = 0;
let isBreakActive = false; 

let curfewTimeStr = localStorage.getItem('saasCurfew') || '';
if(curfewTimeStr) document.getElementById('curfew-time').value = curfewTimeStr;

function saveCurfew() { curfewTimeStr = document.getElementById('curfew-time').value; localStorage.setItem('saasCurfew', curfewTimeStr); updateCurfewCountdown(); }

function isCurfewActive() {
    if (!curfewTimeStr) return false;
    let now = new Date(); let currentHour = now.getHours(); let currentMin = now.getMinutes(); let [cHour, cMin] = curfewTimeStr.split(':').map(Number);
    if (currentHour === cHour && currentMin >= cMin) return true;
    if (currentHour > cHour && currentHour <= 23) return true;
    if (currentHour >= 0 && currentHour < 5) return true; return false;
}

function updateCurfewCountdown() {
    const container = document.getElementById('curfew-countdown-container');
    if (!curfewTimeStr) { container.style.display = 'none'; return; }
    container.style.display = 'flex'; let now = new Date(); let [cHour, cMin] = curfewTimeStr.split(':').map(Number);
    
    if (isCurfewActive()) { document.getElementById('curfew-timer-text').innerText = "ĐÃ KHÓA"; document.getElementById('curfew-progress').style.strokeDashoffset = 113.1; return; }
    let curfewDate = new Date(); curfewDate.setHours(cHour, cMin, 0, 0); let distance = curfewDate - now;
    if (distance < 0) { curfewDate.setDate(curfewDate.getDate() + 1); distance = curfewDate - now; }
    
    let h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); let m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); let s = Math.floor((distance % (1000 * 60)) / 1000);
    document.getElementById('curfew-timer-text').innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    let totalSecs = Math.floor(distance / 1000); let maxSecs = 12 * 3600; let pct = Math.max(0, Math.min(1, totalSecs / maxSecs));
    document.getElementById('curfew-progress').style.strokeDashoffset = 113.1 - (pct * 113.1);
}

let isTickOn = false;
function toggleTick() { isTickOn = !isTickOn; document.getElementById('btn-tick').innerHTML = `<i class="fa-solid fa-clock"></i> Âm Tích Tắc: ${isTickOn ? 'BẬT' : 'TẮT'}`; }

function activateRestDay() {
    if (isPendingTax || dailyDebtMinutes > 0) { alert("Không thể xả hơi khi đang mang trọng tội!"); return; }
    let todayStr = new Date().toISOString().split('T')[0];
    if (lastRestDate) {
        let diff = Math.floor((new Date(todayStr) - new Date(lastRestDate)) / (1000 * 60 * 60 * 24));
        if (diff < 7) { alert("Bạn đã dùng quyền Nghỉ Bảo Tồn trong tuần này. Phải duy trì liên tục 7 ngày mới được cấp phép lại!"); return; }
    }
    if (confirm("Kích hoạt Nghỉ Bảo Tồn? Hôm nay bạn chỉ cần hoàn thành 45 phút (3 phiên ngắn) để duy trì chuỗi kỷ luật.")) {
        lastRestDate = todayStr; localStorage.setItem('saasLastRest', lastRestDate);
        alert("Đã kích hoạt! Tận hưởng ngày nghỉ ngơi, nhưng đừng quên hoàn thành 45 phút nhẹ nhàng nhé.");
    }
}

let isHardcoreTax = false; let taxPauseBank = 180; 

function startDebtSession() {
    if(goals.length === 0) { goals.push({ id: Date.now(), name: "KHỔ SAI LÃI KÉP", target: 2, current: 2, reports: [] }); }
    activeGoalId = goals[0].id;
    document.getElementById('shame-modal').style.display = 'none';
    document.getElementById('focus-room').style.display = 'flex';
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');
    
    document.getElementById('focus-target-info').innerText = "PHIÊN KHỔ SAI LÃI KÉP (NỢ NGÀY)";
    let badge = document.getElementById('focus-badge'); badge.innerText = "CHẾ ĐỘ TRẢ NỢ"; badge.style.background = "rgba(225, 29, 72, 0.1)"; badge.style.color = "var(--brand-warning)"; badge.style.borderColor = "var(--brand-warning)";

    document.getElementById('btn-5').style.display = 'none'; document.getElementById('btn-15').style.display = 'none'; document.getElementById('btn-25').style.display = 'none'; document.getElementById('btn-cancel').style.display = 'none';

    let btnTax = document.getElementById('btn-tax');
    if(!btnTax) {
        btnTax = document.createElement('button'); btnTax.className = 'btn-timer'; btnTax.id = 'btn-tax';
        document.querySelector('.timer-controls').insertBefore(btnTax, document.getElementById('btn-pause'));
    }
    btnTax.innerHTML = `<i class="fa-solid fa-link-slash"></i> BẮT ĐẦU TRẢ NỢ (${dailyDebtMinutes}P)`; 
    btnTax.onclick = () => runDebtSession();
    btnTax.style.display = 'flex';
    document.getElementById('btn-focus-back').onclick = function() { alert("Đang mang nợ không được phép rời đi! Tải lại trang án thư vẫn sẽ khóa."); }
}

function runDebtSession() {
    if (isCurfewActive()) { alert("ĐÃ ĐẾN GIỜ GIỚI NGHIÊM!"); return; }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    isDebtSession = true; taxPauseBank = 180; document.getElementById('btn-tax').style.display = 'none';
    
    currentDuration = dailyDebtMinutes; activeSessionMinutes = dailyDebtMinutes; timeLeft = dailyDebtMinutes * 60; sessionEndTime = Date.now() + timeLeft * 1000;
    isSessionActive = true; isPaused = false; document.body.classList.add('focus-active');
    
    document.getElementById('btn-pause').style.display = 'flex'; document.getElementById('btn-pause').innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)';
    
    timerInterval = setInterval(() => {
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM! Cưỡng chế sập nguồn."); resetSystem(); return; }
        if (!isPaused) {
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000);
            if (timeLeft <= 0) { timeLeft = 0; playAlertSound(); triggerReportModal(); }
            updateDisplay(timeLeft); if (isTickOn && timeLeft % 1 === 0) playTick();
        }
    }, 1000);
}

function startTaxSession() {
    if(goals.length === 0) { goals.push({ id: Date.now(), name: "KHÔI PHỤC CHUỖI", target: 2, current: 2, reports: [] }); }
    activeGoalId = goals[0].id;
    document.getElementById('shame-modal').style.display = 'none';
    document.getElementById('focus-room').style.display = 'flex';
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');
    
    document.getElementById('focus-target-info').innerText = "THIẾT QUÂN LUẬT (120 PHÚT)";
    let badge = document.getElementById('focus-badge'); badge.innerText = "CHẾ ĐỘ HARDCORE"; badge.style.background = "rgba(225, 29, 72, 0.1)"; badge.style.color = "var(--brand-warning)"; badge.style.borderColor = "var(--brand-warning)";

    document.getElementById('btn-5').style.display = 'none'; document.getElementById('btn-15').style.display = 'none'; document.getElementById('btn-25').style.display = 'none'; document.getElementById('btn-cancel').style.display = 'none';

    let btnTax = document.getElementById('btn-tax');
    if(!btnTax) {
        btnTax = document.createElement('button'); btnTax.className = 'btn-timer'; btnTax.id = 'btn-tax';
        document.querySelector('.timer-controls').insertBefore(btnTax, document.getElementById('btn-pause'));
    }
    btnTax.innerHTML = '<i class="fa-solid fa-fire-flame-curved"></i> NỘP THUẾ TRÌ HOÃN'; 
    btnTax.onclick = () => runHardcoreSession();
    btnTax.style.display = 'flex';
    document.getElementById('btn-focus-back').onclick = function() { alert("Chưa hoàn thành thuế không được phép rời đi! Tải lại trang án thư vẫn sẽ khóa."); }
}

function runHardcoreSession() {
    if (isCurfewActive()) { alert("ĐÃ ĐẾN GIỜ GIỚI NGHIÊM!"); return; }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    isHardcoreTax = true; taxPauseBank = 180; document.getElementById('btn-tax').style.display = 'none';
    
    currentDuration = 120; activeSessionMinutes = 120; timeLeft = 120 * 60; sessionEndTime = Date.now() + timeLeft * 1000;
    isSessionActive = true; isPaused = false; document.body.classList.add('focus-active');
    
    document.getElementById('btn-pause').style.display = 'flex'; document.getElementById('btn-pause').innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)';
    
    timerInterval = setInterval(() => {
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM!"); resetSystem(); return; }
        if (!isPaused) {
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000);
            if (timeLeft <= 0) { timeLeft = 0; playAlertSound(); triggerReportModal(); }
            updateDisplay(timeLeft); if (isTickOn && timeLeft % 1 === 0) playTick();
        }
    }, 1000);
}

function saveAll() { 
    localStorage.setItem('saasGoalsPro', JSON.stringify(goals)); localStorage.setItem('saasTotalSessionsPro', totalSessions); 
    localStorage.setItem('saasCountdownsPro', JSON.stringify(countdowns)); localStorage.setItem('saasDailyLogs', JSON.stringify(dailyLogs));
    localStorage.setItem('saasStreak', currentStreak); localStorage.setItem('saasLastActive', lastActiveDate);
    localStorage.setItem('saasS25', standardSessionCount25); localStorage.setItem('saasS15', standardSessionCount15);
}

document.getElementById('report-input').addEventListener('paste', function(e) { e.preventDefault(); alert("Hệ thống từ chối thao tác dán văn bản."); });

function exportData() {
    const dataToExport = { goals, totalSessions, countdowns, dailyLogs, streak: currentStreak, lastActive: lastActiveDate, s25: standardSessionCount25, s15: standardSessionCount15, cycleStart: cycleStartDate };
    const dataStr = JSON.stringify(dataToExport); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
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
            alert("Đã phục hồi dữ liệu thành công! Trang web sẽ tự động tải lại."); location.reload();
        } catch (error) { alert("File không hợp lệ hoặc bị lỗi định dạng!"); }
    }; reader.readAsText(file); event.target.value = ''; 
}

function checkCycleAndStreak() {
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    let yesterdayObj = new Date(todayObj); yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    let yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    // 1. KIỂM TRA CHU KỲ 7 NGÀY
    let cycleStartObj = new Date(cycleStartDate);
    let diffCycleTime = new Date(todayStr) - cycleStartObj;
    let diffCycleDays = Math.floor(diffCycleTime / (1000 * 60 * 60 * 24));

    if (diffCycleDays >= 7 && !isPendingTax) {
        let totalCycleHours = 0;
        for(let i=0; i<7; i++) {
            let d = new Date(cycleStartObj); d.setDate(d.getDate() + i);
            let dStr = d.toISOString().split('T')[0];
            totalCycleHours += (dailyLogs[dStr] || 0);
        }
        
        if (totalCycleHours < 12) {
            isPendingTax = true;
            localStorage.setItem('saasPendingTax', 'true');
            localStorage.setItem('saasDailyDebt', '0'); dailyDebtMinutes = 0; 
        } else {
            alert(`TỔNG KẾT TUẦN: Bệ hạ đã xuất sắc hoàn thành ${totalCycleHours.toFixed(1)} giờ. Kỷ luật thép được giữ vững!`);
        }
        cycleStartDate = todayStr; localStorage.setItem('saasCycleStart', cycleStartDate);
    }

    // 2. RÀ SOÁT TỘI LỖI MỖI NGÀY
    if (lastActiveDate !== "" && lastActiveDate !== todayStr) {
        let lastDateObj = new Date(lastActiveDate); 
        let diffTime = Math.abs(new Date(todayStr) - lastDateObj);
        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        let checkedDate = localStorage.getItem('saasDebtCheckedDate');
        if (checkedDate !== yesterdayStr) {
            if (diffDays > 1) {
                isPendingTax = true;
                localStorage.setItem('saasPendingTax', 'true');
                localStorage.setItem('saasDailyDebt', '0'); dailyDebtMinutes = 0;
            } else if (diffDays === 1) {
                let yesterdayHrs = dailyLogs[yesterdayStr] || 0;
                let targetHrs = (lastRestDate === yesterdayStr) ? 0.75 : 1.0;
                
                if (yesterdayHrs === 0) {
                    isPendingTax = true;
                    localStorage.setItem('saasPendingTax', 'true');
                    localStorage.setItem('saasDailyDebt', '0'); dailyDebtMinutes = 0;
                } else if (yesterdayHrs > 0 && yesterdayHrs < targetHrs) {
                    let deficitHrs = targetHrs - yesterdayHrs;
                    let penaltyMins = Math.ceil(deficitHrs * 60 * 1.5);
                    dailyDebtMinutes += penaltyMins;
                    localStorage.setItem('saasDailyDebt', dailyDebtMinutes);
                }
            }
            localStorage.setItem('saasDebtCheckedDate', yesterdayStr);
        }
    }

    // 3. THỰC THI PHÁN QUYẾT
    if (isPendingTax) {
        document.getElementById('shame-modal').style.display = 'flex';
        document.querySelector('.shame-content h2').innerText = "THIẾT QUÂN LUẬT (NỘP THUẾ)";
        document.querySelector('.shame-content p').innerText = "Bệ hạ đã vi phạm trọng tội: Không đạt 12h/tuần HOẶC có ngày không học phút nào. Bắt buộc nộp Thuế Trì Hoãn 120 phút liên tục!";
        document.querySelector('.btn-shame-alt').style.display = 'none'; 
        document.querySelector('.btn-shame').innerHTML = '<i class="fa-solid fa-fire-flame-curved"></i> NỘP THUẾ (120P)';
        document.querySelector('.btn-shame').onclick = startTaxSession;
        return;
    }

    if (dailyDebtMinutes > 0) {
        document.getElementById('shame-modal').style.display = 'flex'; 
        document.querySelector('.shame-content h2').innerText = "ĐẠO LUẬT LÃI KÉP (NỢ 1 TRẢ 1.5)";
        document.querySelector('.shame-content p').innerHTML = `Hôm qua bệ hạ tu luyện chưa đủ chuẩn. Hình phạt dồn toa là <strong>${dailyDebtMinutes} phút</strong> Phiên Khổ Sai.<br>Phải làm sạch nợ mới được đi tiếp!`;
        document.querySelector('.btn-shame-alt').style.display = 'none';
        document.querySelector('.btn-shame').innerHTML = `<i class="fa-solid fa-link-slash"></i> BẮT ĐẦU KHỔ SAI (${dailyDebtMinutes}P)`;
        document.querySelector('.btn-shame').onclick = startDebtSession;
        return;
    }

    document.getElementById('streak-count').innerText = currentStreak;
}

function updateStreakOnSubmit() {
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    let todayStr = todayObj.toISOString().split('T')[0];
    if (lastActiveDate !== todayStr) { currentStreak++; lastActiveDate = todayStr; }
    document.getElementById('streak-count').innerText = currentStreak;
}

function renderKPI() {
    let totalCycleHours = 0; let cycleStartObj = new Date(cycleStartDate);
    for(let i=0; i<7; i++) { let d = new Date(cycleStartObj); d.setDate(d.getDate() + i); let dStr = d.toISOString().split('T')[0]; totalCycleHours += (dailyLogs[dStr] || 0); }
    
    let pct = Math.min(100, (totalCycleHours / 12) * 100);
    let statusEl = document.getElementById('kpi-status'); let fillEl = document.getElementById('kpi-bar-fill'); let msgEl = document.getElementById('kpi-message');

    if(statusEl && fillEl && msgEl) {
        statusEl.innerText = `${totalCycleHours.toFixed(1)} / 12.0h`; fillEl.style.width = `${pct}%`;
        if(totalCycleHours >= 12) {
            msgEl.innerHTML = '<strong style="color:var(--brand-break)"><i class="fa-solid fa-crown"></i> Bệ hạ đã chinh phục thành công Thiết Quân Luật tuần này!</strong>';
            fillEl.style.background = 'var(--brand-break)'; fillEl.style.boxShadow = '0 0 15px var(--brand-break)';
            if(localStorage.getItem('saasKPIAchieved_' + cycleStartDate) !== 'true') {
                localStorage.setItem('saasKPIAchieved_' + cycleStartDate, 'true'); fireConfetti();
            }
        } else {
            msgEl.innerText = `Còn thiếu ${(12 - totalCycleHours).toFixed(1)}h nữa để an toàn vượt qua vạch tử thần.`;
            fillEl.style.background = 'var(--brand-focus)'; fillEl.style.boxShadow = '0 0 10px rgba(234, 88, 12, 0.4)';
        }
    }
}

function renderGamification() {
    let totalHoursEarned = goals.reduce((sum, g) => sum + (g.target - g.current), 0);
    document.getElementById('total-hours-metric').innerText = totalHoursEarned.toFixed(1) + 'h';
    document.getElementById('streak-count').innerText = currentStreak;
    
    let rankTitle = "Người Mới"; let rankDesc = "Cần 10h để thăng cấp Học Giả"; let rankColor = "#94a3b8"; 
    if(totalHoursEarned >= 300) { rankTitle = "Huyền Thoại"; rankDesc = "Thành tích học tập xuất sắc"; rankColor = "#f59e0b"; } 
    else if(totalHoursEarned >= 100) { rankTitle = "Bậc Thầy"; rankDesc = `Cần ${Math.ceil(300 - totalHoursEarned)}h để thăng cấp Huyền Thoại`; rankColor = "#8b5cf6"; } 
    else if(totalHoursEarned >= 50) { rankTitle = "Chuyên Gia"; rankDesc = `Cần ${Math.ceil(100 - totalHoursEarned)}h để thăng cấp Bậc Thầy`; rankColor = "#ea580c"; } 
    else if(totalHoursEarned >= 10) { rankTitle = "Học Giả"; rankDesc = `Cần ${Math.ceil(50 - totalHoursEarned)}h để thăng cấp Chuyên Gia`; rankColor = "#10b981"; } 

    document.getElementById('rank-title').innerText = rankTitle; document.getElementById('rank-desc').innerText = rankDesc;
    const iconEl = document.getElementById('rank-icon'); iconEl.style.color = rankColor; iconEl.style.filter = `drop-shadow(0 0 12px ${rankColor}80)`;

    const grid = document.getElementById('heatmap-grid'); grid.innerHTML = '';
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    
    for(let i = 34; i >= 0; i--) {
        let d = new Date(todayObj); d.setDate(d.getDate() - i); let dateStr = d.toISOString().split('T')[0];
        let hours = dailyLogs[dateStr] || 0; let heatClass = "";
        if(hours > 0 && hours < 1) heatClass = "heat-1"; else if(hours >= 1 && hours < 3) heatClass = "heat-2";
        else if(hours >= 3 && hours < 5) heatClass = "heat-3"; else if(hours >= 5) heatClass = "heat-4";
        grid.innerHTML += `<div class="heat-cell ${heatClass}" title="${dateStr}: ${hours.toFixed(1)}h"></div>`;
    }
}

function renderCountdowns() {
    const strip = document.getElementById('countdown-strip'); strip.innerHTML = '';
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
    }); updateCountdownTicks();
}

function updateCountdownTicks() {
    const now = new Date().getTime();
    countdowns.forEach(cd => {
        const target = new Date(cd.date).getTime(); const distance = target - now;
        const dEl = document.getElementById(`cd-d-${cd.id}`); if (!dEl) return;
        if (distance < 0) { dEl.innerText = "00"; document.getElementById(`cd-h-${cd.id}`).innerText = "00"; document.getElementById(`cd-m-${cd.id}`).innerText = "00"; document.getElementById(`cd-s-${cd.id}`).innerText = "00"; } 
        else {
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
    let timeInput = prompt("Nhập giờ (HH:MM) - Bấm OK để trống:"); if (!timeInput || timeInput.trim() === "") timeInput = "00:00";
    const parsedDate = new Date(`${dateInput.trim()}T${timeInput.trim()}:00`);
    if (isNaN(parsedDate.getTime())) { alert("Định dạng không hợp lệ."); return; }
    countdowns.push({ id: Date.now(), name: name.toUpperCase(), date: parsedDate.toISOString() }); saveAll(); renderCountdowns();
}
function deleteCountdown(id) { if (confirm("Xóa bộ đếm ngược này?")) { countdowns = countdowns.filter(c => c.id !== id); saveAll(); renderCountdowns(); } }

function switchTab(tab) {
    if (isPendingTax || dailyDebtMinutes > 0) { alert("Án thư đang bị phong tỏa. Bắt buộc hoàn thành phiên phạt!"); return; }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('view-dashboard').style.display = 'none'; document.getElementById('analytics-room').style.display = 'none'; 
    document.getElementById('trophy-room').style.display = 'none'; document.getElementById('trophy-detail').style.display = 'none';
    
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');

    if(tab === 'dashboard') {
        document.getElementById('nav-dash').classList.add('active'); document.getElementById('view-dashboard').style.display = 'block';
        document.getElementById('main-title').innerText = "Tổng quan học tập"; document.getElementById('main-desc').innerText = "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.";
        document.getElementById('btn-create-goal').style.display = 'flex'; document.getElementById('btn-create-countdown').style.display = 'flex'; document.getElementById('btn-rest-day').style.display = 'flex';
        renderKPI(); renderDashboard(); renderGamification();
    } else if(tab === 'analytics') {
        document.getElementById('nav-analytics').classList.add('active'); document.getElementById('analytics-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Phân tích Kỷ luật"; document.getElementById('main-desc').innerText = "Nhìn thấu tiến độ. Điều hướng binh lực.";
        document.getElementById('btn-create-goal').style.display = 'none'; document.getElementById('btn-create-countdown').style.display = 'none'; document.getElementById('btn-rest-day').style.display = 'none';
        renderAnalytics();
    } else if(tab === 'trophy') {
        document.getElementById('nav-trophy').classList.add('active'); document.getElementById('trophy-room').style.display = 'block';
        document.getElementById('main-title').innerText = "Lịch Sử Học Tập"; document.getElementById('main-desc').innerText = "Nơi lưu trữ các mục tiêu đã hoàn thành.";
        document.getElementById('btn-create-goal').style.display = 'none'; document.getElementById('btn-create-countdown').style.display = 'none'; document.getElementById('btn-rest-day').style.display = 'none';
        renderTrophyRoom();
    }
}

window.renderDailyBreakdown = function(targetDate) {
    let content = document.getElementById('daily-breakdown-content'); if (!content) return;
    let dayStats = []; let totalDayHours = 0;
    goals.forEach(g => {
        if(g.reports) {
            let goalHrs = 0; let sessionsCount = 0;
            g.reports.forEach(r => { if(r.date.startsWith(targetDate)) { sessionsCount++; let mins = parseInt(r.type.replace('p','')); goalHrs += (mins / 60); } });
            if(goalHrs > 0) { totalDayHours += goalHrs; dayStats.push({ name: g.name, hrs: goalHrs, sessions: sessionsCount }); }
        }
    });
    dayStats.sort((a,b) => b.hrs - a.hrs);
    if(dayStats.length === 0) { content.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px 0;">Không có hoạt động nào trong ngày này.</p>'; return; }
    
    let html = '';
    dayStats.forEach(stat => {
        let pct = (stat.hrs / totalDayHours) * 100;
        html += `<div class="stat-row" style="margin-bottom: 20px;"><div class="stat-label"><span style="font-weight:700; color:var(--text-main);">${stat.name}</span> <span style="font-size:0.85rem;"><strong style="color:var(--brand-focus);">${stat.hrs.toFixed(1)}h</strong> (${stat.sessions} phiên)</span></div><div class="stat-bar" style="height:14px; border-radius:14px;"><div class="stat-fill" style="width: ${pct}%; background:var(--brand-dash); border-radius:14px;"></div></div></div>`;
    });
    html += `<div style="text-align:right; font-size:0.95rem; font-weight:700; color:var(--text-muted); margin-top:20px; border-top:1px dashed var(--border); padding-top:16px;">Tổng cộng: <strong style="color:var(--text-main); font-size:1.25rem;">${totalDayHours.toFixed(1)}h</strong></div>`;
    content.innerHTML = html;
};

function renderAnalytics() {
    const room = document.getElementById('analytics-room'); room.innerHTML = ''; let allGoals = goals; 
    let todayObj = new Date(); todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset()); let todayStr = todayObj.toISOString().split('T')[0];
    let yesterdayObj = new Date(todayObj); yesterdayObj.setDate(yesterdayObj.getDate() - 1); let yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    let todayHrs = dailyLogs[todayStr] || 0; let yesterdayHrs = dailyLogs[yesterdayStr] || 0;
    let thisWeekHrs = 0; for(let i=0; i<7; i++) { let d = new Date(todayObj); d.setDate(d.getDate() - i); thisWeekHrs += (dailyLogs[d.toISOString().split('T')[0]] || 0); }
    let lastWeekHrs = 0; for(let i=7; i<14; i++) { let d = new Date(todayObj); d.setDate(d.getDate() - i); lastWeekHrs += (dailyLogs[d.toISOString().split('T')[0]] || 0); }

    function getTrendHtml(current, previous, label, delay) {
        let diff = current - previous; let pct = previous > 0 ? (diff / previous) * 100 : (current > 0 ? 100 : 0);
        let color = diff >= 0 ? 'var(--brand-break)' : 'var(--brand-warning)'; let icon = diff >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'; let text = diff >= 0 ? 'Tăng' : 'Giảm';
        if (diff === 0) { color = 'var(--text-muted)'; icon = 'fa-minus'; text = 'Ổn định'; }
        return `<div class="analytics-card stagger-item" style="padding: 28px; animation-delay: ${delay}s"><span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">${label}</span><div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main); margin: 8px 0; letter-spacing: -1px;">${current.toFixed(1)}h</div><div style="font-size: 0.95rem; font-weight: 600; color: ${color}; display: flex; align-items: center; gap: 6px;"><i class="fa-solid ${icon}"></i> ${text} ${Math.abs(pct).toFixed(0)}% so với kỳ trước</div></div>`;
    }

    let trendWeekHtml = getTrendHtml(thisWeekHrs, lastWeekHrs, 'Hiệu suất Tuần (7 Ngày)', 0.1);
    let trendDayHtml = getTrendHtml(todayHrs, yesterdayHrs, 'Hiệu suất Hôm nay', 0.2);
    let trendsHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px; position: relative; z-index: 20;">${trendWeekHtml}${trendDayHtml}</div>`;

    let actualTotalSessions = 0; let actualS15 = 0; let actualS25 = 0;
    allGoals.forEach(g => { if(g.reports) { actualTotalSessions += g.reports.length; g.reports.forEach(r => { if(r.type === '15p') actualS15++; if(r.type === '25p') actualS25++; }); } });

    let sessionHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.3s"><h3>Tổng quan Phiên học</h3><div style="background: var(--bg-hover); border: 1px solid var(--border); border-radius: 24px; padding: 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; position: relative; z-index: 20;"><div style="width: 50px; height: 50px; border-radius: 14px; background: var(--bg-panel); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-bento); flex-shrink: 0;"><i class="fa-solid fa-stopwatch" style="color: var(--brand-focus); font-size: 1.5rem;"></i></div><div style="display: flex; flex-direction: column; gap: 2px;"><div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1; letter-spacing: -1px;">${actualTotalSessions}</div><div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Tổng phiên hoàn thành</div></div></div><div style="display: flex; gap: 12px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px; background: var(--bg-hover); padding: 16px; border-radius: 20px; text-align: center; border: 1px solid var(--border); position: relative; z-index: 20;"><div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); display: block; line-height: 1; margin-bottom: 6px;">${actualS15}</div><div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Ngắn (15p)</div></div><div style="flex: 1; min-width: 120px; background: var(--bg-hover); padding: 16px; border-radius: 20px; text-align: center; border: 1px solid var(--border); position: relative; z-index: 20;"><div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); display: block; line-height: 1; margin-bottom: 6px;">${actualS25}</div><div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Chuẩn (25p)</div></div></div></div>`;
    
    let dailyReportHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.4s"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; position:relative; z-index:20; flex-wrap:wrap; gap:10px;"><h3 style="margin-bottom:0;">Chi tiết Tác chiến Ngày</h3><select id="daily-log-select" onchange="renderDailyBreakdown(this.value)" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-main); padding:8px 12px; border-radius:10px; font-weight:700; outline:none; font-family:inherit; cursor:pointer;"></select></div><div id="daily-breakdown-content" style="position:relative; z-index:20;"><p style="color:var(--text-muted); text-align:center; padding: 20px 0;">Vui lòng chọn một ngày để phân tích.</p></div></div>`;

    let focusHtml = '<div class="analytics-card stagger-item" style="animation-delay: 0.5s"><h3>Phân bổ Trọng tâm Toàn cục</h3>';
    let totalLogged = 0; let goalStats = allGoals.map(g => { let logged = g.target - g.current; totalLogged += logged; return { name: g.name, logged: logged }; }).filter(g => g.logged > 0).sort((a,b) => b.logged - a.logged);
    if (totalLogged === 0) focusHtml += '<p style="color:var(--text-muted)">Chưa có dữ liệu học tập.</p>';
    else { goalStats.forEach(g => { let pct = (g.logged / totalLogged) * 100; focusHtml += `<div class="stat-row"><div class="stat-label"><span>${g.name}</span> <span>${g.logged.toFixed(1)}h (${pct.toFixed(0)}%)</span></div><div class="stat-bar"><div class="stat-fill" style="width: ${pct}%"></div></div></div>`; }); }
    focusHtml += '</div>';

    let timeSlots = { sang: 0, chieu: 0, toi: 0, dem: 0 };
    allGoals.forEach(g => { if (g.reports) { g.reports.forEach(r => { let parts = r.date.split(' - '); if(parts.length === 2) { let hour = parseInt(parts[1].split(':')[0]); if(hour >= 5 && hour < 12) timeSlots.sang++; else if(hour >= 12 && hour < 18) timeSlots.chieu++; else if(hour >= 18 && hour < 22) timeSlots.toi++; else timeSlots.dem++; } }); } });
    let maxSlot = Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b); let totalSessionsCount = timeSlots.sang + timeSlots.chieu + timeSlots.toi + timeSlots.dem;
    
    let bioHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.6s"><h3>Nhịp sinh học Kỷ luật</h3>`;
    if (totalSessionsCount === 0) bioHtml += '<p style="color:var(--text-muted)">Chưa đủ dữ liệu phiên học.</p>';
    else { bioHtml += `<div class="bio-grid"><div class="bio-box ${maxSlot === 'sang' ? 'active' : ''}"><i class="fa-regular fa-sun"></i><span>Sáng<br>(5h-12h)</span><strong>${timeSlots.sang} phiên</strong></div><div class="bio-box ${maxSlot === 'chieu' ? 'active' : ''}"><i class="fa-solid fa-cloud-sun"></i><span>Chiều<br>(12h-18h)</span><strong>${timeSlots.chieu} phiên</strong></div><div class="bio-box ${maxSlot === 'toi' ? 'active' : ''}"><i class="fa-regular fa-moon"></i><span>Tối<br>(18h-22h)</span><strong>${timeSlots.toi} phiên</strong></div><div class="bio-box ${maxSlot === 'dem' ? 'active' : ''}"><i class="fa-solid fa-star"></i><span>Đêm<br>(22h-5h)</span><strong>${timeSlots.dem} phiên</strong></div></div>`; }
    bioHtml += `</div>`;

    let dowStats = [0, 0, 0, 0, 0, 0, 0]; for (let dateStr in dailyLogs) { let day = new Date(dateStr).getDay(); let idx = day === 0 ? 6 : day - 1; dowStats[idx] += dailyLogs[dateStr]; }
    let maxDow = Math.max(...dowStats, 1); 
    let dowHtml = `<div class="analytics-card stagger-item" style="animation-delay: 0.7s"><h3>Độ lệch Kỷ luật (Theo thứ)</h3><div class="bar-chart">`;
    let days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for(let i=0; i<7; i++) { let h = (dowStats[i] / maxDow) * 100; dowHtml += `<div class="bar-col"><div class="bar-wrap"><div class="bar-fill" style="height: ${h}%"></div></div><span>${days[i]}</span></div>`; }
    dowHtml += `</div></div>`;

    room.innerHTML = `${trendsHtml}<div class="analytics-grid">${sessionHtml}${dailyReportHtml}${focusHtml}${bioHtml}${dowHtml}</div>`;

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

function renderDashboard() {
    let activeGoals = goals.filter(g => g.current > 0); const board = document.getElementById('dashboard-grid'); board.innerHTML = '';
    if (activeGoals.length === 0) { board.innerHTML = '<div class="stagger-item" style="animation-delay:0.3s; grid-column: 1/-1; text-align: center; padding: 60px 20px; border: 2px dashed var(--border); border-radius: 24px; color: var(--text-muted); font-size: 1.05rem; font-weight: 500; backdrop-filter: blur(var(--bg-panel-blur));">Chưa có mục tiêu. Hãy khởi tạo mục tiêu mới.</div>'; return; }
    activeGoals.forEach((goal, index) => {
        const percent = Math.max(0, Math.min(100, ((goal.target - goal.current) / goal.target) * 100)); const offset = 226.19 - (percent / 100) * 226.19; let delay = (index + 1) * 0.1 + 0.2;
        board.innerHTML += `<div class="goal-card stagger-item" style="animation-delay: ${delay}s" onclick="openGoal(${goal.id})"><button class="btn-delete" onclick="deleteGoal(event, ${goal.id})"><i class="fa-solid fa-trash"></i></button><div class="progress-wrapper"><div class="progress-circle"><svg><circle class="progress-bg" cx="42.5" cy="42.5" r="36"></circle><circle class="progress-bar" cx="42.5" cy="42.5" r="36" style="stroke-dashoffset: ${offset}"></circle></svg><div class="progress-text">${percent.toFixed(0)}%</div></div><div class="goal-meta"><h3>${goal.name}</h3><p>Còn lại: <strong style="color:var(--text-main);">${goal.current.toFixed(2)}h</strong> / ${goal.target}h</p></div></div></div>`;
    });
}

function renderTrophyRoom() {
    let completedGoals = goals.filter(g => g.current <= 0); const room = document.getElementById('trophy-room'); room.innerHTML = '';
    if (completedGoals.length === 0) { room.innerHTML = `<div class="locked-state stagger-item" style="animation-delay: 0.1s"><i class="fa-solid fa-lock"></i><h2>Kho Lưu Trữ Bị Khóa</h2><p>Chỉ mở khóa khi hoàn thành 100% ít nhất 1 mục tiêu.</p></div>`; return; }
    completedGoals.forEach((g, index) => {
        let reportCount = g.reports ? g.reports.length : 0; let delay = (index + 1) * 0.1;
        room.innerHTML += `<div class="trophy-card stagger-item" style="animation-delay: ${delay}s" onclick="viewTrophyDetail(${g.id})"><div class="trophy-header"><h3><i class="fa-solid fa-trophy" style="color: var(--brand-trophy);"></i>${g.name}</h3><span class="trophy-badge">ĐÃ HOÀN THÀNH</span></div><p style="color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-clock" style="margin-right: 6px;"></i> Quy mô: ${g.target} Giờ &nbsp;&nbsp;•&nbsp;&nbsp; <i class="fa-solid fa-file-lines" style="margin-right: 6px;"></i> Báo cáo: ${reportCount}</p></div>`;
    });
}

function viewTrophyDetail(id) {
    document.getElementById('trophy-room').style.display = 'none'; document.getElementById('trophy-detail').style.display = 'block';
    let g = goals.find(x => x.id === id); let reports = g.reports || [];
    document.getElementById('td-title').innerText = g.name; document.getElementById('td-meta').innerText = `Hoàn thành mốc ${g.target}h - Lưu trữ ${reports.length} báo cáo.`;
    let tl = document.getElementById('td-timeline'); tl.innerHTML = '';
    if (reports.length === 0) { tl.innerHTML = '<p class="stagger-item" style="animation-delay:0.4s; color: var(--text-muted); font-style: italic;">Không có dữ liệu báo cáo.</p>'; } 
    else { [...reports].reverse().forEach((rep, index) => { let delay = (index * 0.1) + 0.4; tl.innerHTML += `<div class="timeline-item stagger-item" style="animation-delay:${delay}s"><div class="tl-meta"><span><i class="fa-solid fa-calendar-day"></i> ${rep.date}</span><span style="color: var(--brand-trophy);"><i class="fa-solid fa-bolt"></i> Phiên ${rep.type}</span></div><div class="tl-content">${rep.text}</div></div>`; }); }
}

function createNewGoal() {
    const name = prompt("Tên mục tiêu:"); if (!name) return;
    const target = parseFloat(prompt("Định mức thời gian (Số giờ):")); if (isNaN(target) || target <= 0) return alert("Hợp lệ.");
    goals.push({ id: Date.now(), name: name, target: target, current: target, reports: [] }); saveAll(); renderDashboard(); renderGamification();
}

function deleteGoal(e, id) { e.stopPropagation(); if (confirm("Xóa mục tiêu?")) { goals = goals.filter(g => g.id !== id); saveAll(); if(document.getElementById('view-dashboard').style.display !== 'none') {renderDashboard(); renderGamification();} else renderTrophyRoom(); } }

function openGoal(id) {
    if (isPendingTax || dailyDebtMinutes > 0) { alert("Phải dọn sạch nợ trước khi tiếp tục mục tiêu khác!"); return; }
    activeGoalId = id; const goal = goals.find(g => g.id === id);
    
    document.getElementById('sidebar').classList.remove('active'); document.getElementById('mobile-overlay').classList.remove('active');
    document.getElementById('focus-room').style.display = 'flex';
    document.getElementById('focus-target-info').innerText = `Mục tiêu: ${goal.name} | Còn lại: ${goal.current.toFixed(2)}h`;
    
    let badge = document.getElementById('focus-badge'); badge.innerText = "Khu Vực Tập Trung"; badge.style = "";
    if(audioCtx.state === 'suspended') audioCtx.resume(); resetSystem();
}

function backToDashboard() {
    if ((isSessionActive || isHardcoreTax || isDebtSession) && !confirm("Phiên đang chạy. Rời đi sẽ hủy toàn bộ tiến độ phiên này?")) return;
    if (isSessionActive || isGracePeriod || isBreakActive || isHardcoreTax || isDebtSession) { clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval); penaltyMinutes = 0; resetSystem(); }
    document.getElementById('focus-room').style.display = 'none';
    renderKPI(); renderDashboard(); renderGamification();
}

function updateDisplay(seconds) {
    if(seconds < 0) seconds = 0; let m = Math.floor(seconds / 60).toString().padStart(2, '0'); let s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('session-timer').innerText = `${m}:${s}`;
}

function toggleButtons(isActive) {
    document.getElementById('btn-5').style.display = isActive ? 'none' : 'flex';
    document.getElementById('btn-15').style.display = isActive ? 'none' : 'flex'; document.getElementById('btn-25').style.display = isActive ? 'none' : 'flex';
    document.getElementById('btn-pause').style.display = isActive ? 'flex' : 'none'; document.getElementById('btn-cancel').style.display = isActive ? 'flex' : 'none';
}

function togglePause() {
    isPaused = !isPaused; const btnPause = document.getElementById('btn-pause'); const statusMsg = document.getElementById('status-msg'); const statusIcon = document.getElementById('status-box').querySelector('i');
    if (isHardcoreTax || isDebtSession) {
        if (isPaused) {
            pauseInterval = setInterval(() => { taxPauseBank--; if(taxPauseBank <= 0) { clearInterval(pauseInterval); clearInterval(timerInterval); alert("BẠN ĐÃ DÙNG HẾT 3 PHÚT NGHỈ NGƠI! Chuỗi kỷ luật đã trở về 1."); currentStreak = 1; saveAll(); resetSystem(); location.reload(); } btnPause.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp tục (' + taxPauseBank + 's)'; }, 1000);
        } else { clearInterval(pauseInterval); btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng (Còn ' + taxPauseBank + 's)'; }
    } else {
        if (isPaused) {
            btnPause.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp tục'; statusIcon.className = "fa-solid fa-pause";
            pauseTimeLeft = 300; pauseEndTime = Date.now() + pauseTimeLeft * 1000;
            pauseInterval = setInterval(() => { pauseTimeLeft = Math.round((pauseEndTime - Date.now()) / 1000); if (pauseTimeLeft <= 0) { pauseTimeLeft = 0; clearInterval(pauseInterval); clearInterval(timerInterval); playAlertSound(); resetSystem(); setTimeout(() => alert("Đã quá 5 phút tạm dừng! Hệ thống tự động hủy phiên học hiện tại do mất tập trung."), 100); } let m = Math.floor(pauseTimeLeft / 60).toString().padStart(2, '0'); let s = (pauseTimeLeft % 60).toString().padStart(2, '0'); statusMsg.innerHTML = `Tạm dừng. Giới hạn thời gian: <strong style="color: var(--brand-focus);">${m}:${s}</strong>.`; }, 1000);
        } else { clearInterval(pauseInterval); sessionEndTime = Date.now() + timeLeft * 1000; btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng'; statusMsg.innerText = isIcebreakerPhase ? "5 phút mồi lửa. Hãy gạt bỏ mọi suy nghĩ và bắt đầu." : "Thời gian đang trôi. Tuyệt đối không xao nhãng."; statusIcon.className = "fa-solid fa-spinner fa-spin"; }
    }
}

function startIcebreaker() {
    startSession(5, true);
}

function startSession(minutes, isIce = false) {
    if (isCurfewActive()) { alert("ĐÃ ĐẾN GIỜ GIỚI NGHIÊM!"); return; }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval);
    isSessionActive = true; isPaused = false; isGracePeriod = false; isBreakActive = false;
    
    isIcebreakerPhase = isIce;
    currentDuration = isIce ? 30 : minutes; 
    activeSessionMinutes = minutes + penaltyMinutes; 
    timeLeft = activeSessionMinutes * 60; sessionEndTime = Date.now() + timeLeft * 1000;
    
    document.body.classList.remove('break-mode'); document.body.classList.add('focus-active'); 
    document.getElementById('session-timer').style = ""; document.getElementById('status-box').querySelector('i').style = "";
    
    let badge = document.getElementById('focus-badge');
    if (penaltyMinutes > 0) { 
        badge.innerText = `ĐANG CHỊU PHẠT (+${penaltyMinutes}P)`; 
        badge.style.color = "var(--brand-warning)"; badge.style.background = "rgba(225, 29, 72, 0.1)"; 
    } else { 
        badge.innerText = isIce ? "PHÁ BĂNG LỰC CẢN (5P)" : "ĐANG TẬP TRUNG"; 
        badge.style = ""; 
    }
    
    document.getElementById('btn-pause').innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng'; 
    document.getElementById('status-box').querySelector('i').className = "fa-solid fa-spinner fa-spin"; 
    document.getElementById('status-msg').innerText = isIce ? "5 phút mồi lửa. Hãy gạt bỏ mọi suy nghĩ và bắt đầu làm việc." : "Thời gian đang trôi. Tuyệt đối không xao nhãng.";
    
    toggleButtons(true); updateDisplay(timeLeft);
    
    timerInterval = setInterval(() => { 
        if (isCurfewActive()) { clearInterval(timerInterval); alert("ĐÃ TỚI GIỜ GIỚI NGHIÊM! Cưỡng chế sập nguồn. Kết quả phiên này bị hủy."); resetSystem(); return; }
        if (!isPaused) { 
            timeLeft = Math.round((sessionEndTime - Date.now()) / 1000); 
            if (timeLeft <= 0) { 
                timeLeft = 0; 
                if (isIcebreakerPhase) {
                    isIcebreakerPhase = false;
                    playTick();
                    activeSessionMinutes = 30 + penaltyMinutes; 
                    timeLeft = 25 * 60; 
                    sessionEndTime = Date.now() + timeLeft * 1000;
                    badge.innerText = "ĐÃ VÀO GUỒNG (25P)";
                    document.getElementById('status-msg').innerText = "Lực cản tâm lý đã bị đập tan! Trạng thái Deep Work tự động kích hoạt.";
                    updateDisplay(timeLeft);
                } else {
                    playAlertSound(); triggerReportModal(); 
                }
            } else {
                updateDisplay(timeLeft); if (isTickOn && timeLeft % 1 === 0) playTick(); 
            }
        }
    }, 1000); 
    penaltyMinutes = 0; 
}

function cancelSession() { if(confirm("Hủy phiên học?")) { clearInterval(timerInterval); clearInterval(pauseInterval); resetSystem(); } }

function resetSystem() {
    isSessionActive = false; isPaused = false; isGracePeriod = false; isHardcoreTax = false; isDebtSession = false; isBreakActive = false; isIcebreakerPhase = false;
    clearInterval(timerInterval); clearInterval(pauseInterval); clearInterval(graceInterval);
    document.body.classList.remove('break-mode'); document.body.classList.remove('focus-active');
    
    let btnTax = document.getElementById('btn-tax'); if(btnTax) btnTax.style.display = 'none'; document.getElementById('btn-focus-back').onclick = backToDashboard;
    document.getElementById('focus-badge').style = ""; document.getElementById('session-timer').style = ""; document.getElementById('status-box').querySelector('i').style = "";
    updateDisplay(0); toggleButtons(false); document.getElementById('focus-badge').innerText = "KHU VỰC TẬP TRUNG";
    if (penaltyMinutes > 0) { document.getElementById('status-msg').innerHTML = `<strong style="color:var(--brand-warning)">Bạn đang chịu hình phạt cộng thêm ${penaltyMinutes} phút.</strong> Hãy bắt đầu phiên học!`; } else { document.getElementById('status-box').innerHTML = `<i class="fa-solid fa-circle-info"></i><span id="status-msg">Sẵn sàng. Hệ thống tính giờ dựa trên mốc thời gian tuyệt đối.</span>`; }
}

const placeholders = ["Tóm tắt ngắn gọn những khái niệm cốt lõi bạn vừa học được...", "Liệt kê các từ vựng, công thức hoặc điểm nghẽn bạn đã giải quyết...", "Sự trung thực trong báo cáo phản ánh chất lượng thực sự của phiên học...", "Ghi lại những gì bạn thực sự đọng lại trong tâm trí lúc này...", "Mục tiêu là nắm vững kiến thức, hãy tóm tắt lại nội dung cốt lõi..."];

function triggerReportModal() {
    clearInterval(timerInterval); clearInterval(pauseInterval); document.body.classList.remove('focus-active');
    
    requiredWords = Math.max(25, Math.floor(currentDuration * 1.5)); 
    if (currentDuration >= 120) requiredWords = 80;
    
    document.getElementById('word-required').innerText = requiredWords; document.getElementById('word-req-display').innerText = requiredWords;
    document.getElementById('report-input').value = ""; document.getElementById('report-input').placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    updateWordCount(); document.getElementById('report-modal').style.display = 'flex'; reportOpenTime = Date.now(); setTimeout(() => document.getElementById('report-input').focus(), 100);
}

function updateWordCount() {
    let text = document.getElementById('report-input').value.trim(); let currentWords = text ? text.split(/\s+/).length : 0; document.getElementById('word-count').innerText = currentWords;
    let btnSubmit = document.getElementById('btn-submit-report'); let warningText = document.getElementById('word-warning');
    if (currentWords >= requiredWords) { document.getElementById('word-count').classList.add('success'); btnSubmit.classList.add('active'); warningText.innerText = "Đã đủ điều kiện. Bạn có thể nộp báo cáo."; warningText.style.color = "var(--brand-break)"; } else { document.getElementById('word-count').classList.remove('success'); btnSubmit.classList.remove('active'); warningText.innerText = `Cần thêm ${requiredWords - currentWords} từ nữa...`; warningText.style.color = "var(--text-muted)"; }
}

function abortReport() { if(isHardcoreTax || isDebtSession) { alert("KHÔNG THỂ HỦY BÁO CÁO CỦA PHIÊN PHẠT! Bắt buộc hoàn thành."); return; } if(confirm("Hủy bỏ đồng nghĩa công sức phiên vừa rồi không được tính?")) { document.getElementById('report-modal').style.display = 'none'; resetSystem(); } }

function submitReport() {
    let text = document.getElementById('report-input').value.trim();
    if (text.split(/\s+/).length >= requiredWords) {
        let timeElapsed = Date.now() - reportOpenTime; let minTimeRequired = (currentDuration === 15) ? 12000 : 18000; if (currentDuration >= 120) minTimeRequired = 30000; 
        if (timeElapsed < minTimeRequired) { alert("PHÁT HIỆN BẤT THƯỜNG:\nTốc độ nhập liệu không hợp lý. Khả năng cao đã sử dụng phần mềm gõ tự động hoặc thủ thuật kéo thả.\n\nPhiên học đã bị hủy và chuỗi kỷ luật trở về 0."); document.getElementById('report-modal').style.display = 'none'; currentStreak = 0; saveAll(); renderGamification(); resetSystem(); return; }

        document.getElementById('report-modal').style.display = 'none';
        
        let isPunishment = isHardcoreTax || isDebtSession;

        if (!isPunishment) {
            let goal = goals.find(g => g.id === activeGoalId); if(!goal.reports) goal.reports = [];
            let now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); let dateStr = now.toISOString().split('T')[0];
            goal.reports.push({ date: new Date().toLocaleDateString('vi-VN') + " - " + new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}), type: currentDuration + 'p', text: text });
            let hoursEarned = activeSessionMinutes / 60; goal.current = Math.max(0, goal.current - hoursEarned);
            if(!dailyLogs[dateStr]) dailyLogs[dateStr] = 0; dailyLogs[dateStr] += hoursEarned; totalSessions++;
            document.getElementById('focus-target-info').innerText = `Mục tiêu: ${goal.name} | Còn lại: ${goal.current.toFixed(2)}h`;
            if(goal.current <= 0) { setTimeout(() => { alert(`🎉 CHÚC MỪNG! Mục tiêu "${goal.name}" đã được hoàn thành 100%.`); }, 500); }
        }

        if (isHardcoreTax) { 
            isHardcoreTax = false; 
            if (localStorage.getItem('saasPendingTax') === 'true') {
                localStorage.setItem('saasPendingTax', 'false'); isPendingTax = false;
                alert("Đã nộp xong Thuế Trì Hoãn! Bệ hạ đã rửa sạch trọng tội. Án thư chính thức được giải phóng.");
            } else {
                alert("Chiến dịch khôi phục chuỗi thành công! Sự xao nhãng đã bị dập tắt."); 
            }
            document.getElementById('btn-tax').style.display = 'none'; document.getElementById('btn-focus-back').onclick = backToDashboard; 
        }

        if (isDebtSession) {
            isDebtSession = false; dailyDebtMinutes = 0; localStorage.setItem('saasDailyDebt', '0');
            alert("Đã trả sạch nợ Lãi Kép! Cảm ơn bệ hạ đã giữ uy tín. Án thư trở lại bình thường.");
            document.getElementById('btn-tax').style.display = 'none'; document.getElementById('btn-focus-back').onclick = backToDashboard; 
        }

        updateStreakOnSubmit(); saveAll();
        document.getElementById('status-box').innerHTML = `<i class="fa-solid fa-check" style="color:var(--brand-break)"></i><span id="status-msg">Kết quả đã được ghi nhận.</span>`;
        
        if (isPunishment) { setTimeout(() => location.reload(), 1500); } else { renderKPI(); initiateBreak(); }
    }
}

function initiateBreak() {
    isSessionActive = false; isBreakActive = true; document.body.classList.add('break-mode'); toggleButtons(true); 
    document.getElementById('btn-pause').style.display = 'none'; document.getElementById('btn-cancel').style.display = 'none'; 
    
    let breakMinutes = 5; let breakMsg = "Nghỉ Ngắn (5p)"; document.getElementById('focus-badge').innerText = "THỜI GIAN NGHỈ NGƠI";
    if (currentDuration === 25 || currentDuration === 30) { standardSessionCount25++; localStorage.setItem('saasS25', standardSessionCount25); if (standardSessionCount25 % 2 === 0) { breakMinutes = 15; breakMsg = "Nghỉ Dài (15p)"; } } 
    else if (currentDuration === 15) { standardSessionCount15++; localStorage.setItem('saasS15', standardSessionCount15); if (standardSessionCount15 % 3 === 0) { breakMinutes = 10; breakMsg = "Nghỉ Dài (10p)"; } } 
    else if (currentDuration >= 120) { breakMinutes = 30; breakMsg = "Hồi Phục (30p)"; }
    
    document.getElementById('status-msg').innerText = `Đang kích hoạt chế độ ${breakMsg}.`;
    timeLeft = breakMinutes * 60; let breakEndTime = Date.now() + timeLeft * 1000; updateDisplay(timeLeft);
    
    timerInterval = setInterval(() => {
        timeLeft = Math.round((breakEndTime - Date.now()) / 1000);
        if (timeLeft <= 0) { timeLeft = 0; clearInterval(timerInterval); playAlertSound(); alert("Hết giờ nghỉ! Thời gian ân hạn 2 phút bắt đầu."); if (goals.find(g => g.id === activeGoalId).current <= 0) { backToDashboard(); } else { startGracePeriod(); } } updateDisplay(timeLeft);
    }, 1000);
}

function startGracePeriod() {
    document.body.classList.remove('break-mode'); isGracePeriod = true; isBreakActive = false; graceTimeLeft = 120; graceEndTime = Date.now() + graceTimeLeft * 1000;
    
    const badge = document.getElementById('focus-badge'); badge.innerText = "THỜI GIAN ÂN HẠN (2 PHÚT)"; badge.style.color = "var(--brand-warning)"; badge.style.background = "rgba(225, 29, 72, 0.1)";
    const timerUI = document.getElementById('session-timer'); timerUI.style.color = "var(--brand-warning)"; timerUI.style.textShadow = "none";
    document.getElementById('status-msg').innerHTML = "Bạn có 2 phút để bắt đầu phiên tiếp theo. Trễ hạn sẽ bị <strong style='color:var(--brand-focus)'>phạt cộng thêm 5 phút</strong>!";
    const statusIcon = document.getElementById('status-box').querySelector('i'); statusIcon.className = "fa-solid fa-hourglass-half fa-spin"; statusIcon.style.color = "var(--brand-warning)";
    
    toggleButtons(false); updateDisplay(graceTimeLeft);
    
    graceInterval = setInterval(() => {
        graceTimeLeft = Math.round((graceEndTime - Date.now()) / 1000);
        if (graceTimeLeft <= 0) { graceTimeLeft = 0; clearInterval(graceInterval); isGracePeriod = false; penaltyMinutes += 5; playAlertSound(); alert(`Đã hết thời gian ân hạn! Phiên học tiếp theo sẽ bị cộng thêm 5 phút phạt.`); resetSystem(); } updateDisplay(graceTimeLeft);
    }, 1000);
}

checkCycleAndStreak(); renderCountdowns(); countdownInterval = setInterval(() => { updateCountdownTicks(); updateCurfewCountdown(); }, 1000); switchTab('dashboard');
