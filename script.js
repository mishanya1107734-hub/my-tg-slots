// Новые крутые иконки животных
const symbols = ['🦁', '🐼', '🦊', '🐸', '🐵', '🐰'];

let balance = parseInt(localStorage.getItem('casino_balance')) || 1000;
let betPerLine = 10; 
let activeLines = 1;
let isAutoPlaying = false;
let lastBonusTime = parseInt(localStorage.getItem('casino_last_bonus')) || 0;

const balanceDisplay = document.getElementById('balance');
const totalBetDisplay = document.getElementById('total-bet');
const spinBtn = document.getElementById('spin-btn');
const autoBtn = document.getElementById('auto-btn');
const bonusBtn = document.getElementById('bonus-btn');
const messageDisplay = document.getElementById('message');
const betButtons = document.querySelectorAll('.bet-btn');
const lineButtons = document.querySelectorAll('.line-btn');
const modal = document.getElementById('modal');
const infoBtn = document.getElementById('info-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];

const symbolHeight = 65; 

// Звуковой движок
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

function playTickSound(frequency = 300, duration = 0.05) {
    initAudio(); if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function playWinSound() {
    initAudio();
    setTimeout(() => playTickSound(523.25, 0.1), 0);
    setTimeout(() => playTickSound(659.25, 0.1), 100);
    setTimeout(() => playTickSound(783.99, 0.1), 200);
    setTimeout(() => playTickSound(1046.50, 0.25), 300);
}

// Инициализация барабанов (теперь в самом начале для безопасности!)
function initReels() {
    balanceDisplay.innerText = balance;
    reels.forEach(reel => {
        if (!reel) return;
        reel.style.transition = 'none'; reel.style.top = '0px'; reel.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const div = document.createElement('div');
            div.className = 'symbol'; div.innerText = randomSymbol;
            reel.appendChild(div);
        }
    });
    updateLayout();
}

function updateLayout() {
    if (totalBetDisplay) totalBetDisplay.innerText = betPerLine * activeLines;
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) {
            if (i <= activeLines) dot.classList.add('active');
            else dot.classList.remove('active');
        }
    }
    checkBonusTimer();
}

// ПРОВЕРКА ТАЙМЕРА БОНУСА
function checkBonusTimer() {
    if (!bonusBtn) return;
    const now = Date.now();
    const cooldown = 60 * 1000; // 1 минута
    
    if (now - lastBonusTime >= cooldown || lastBonusTime === 0) {
        bonusBtn.disabled = false;
        bonusBtn.innerText = "🎁 Бонус";
    } else {
        bonusBtn.disabled = true;
        const timeLeft = Math.ceil((cooldown - (now - lastBonusTime)) / 1000);
        bonusBtn.innerText = `⏳ ${timeLeft}с`;
    }
}

// Запуск первой инициализации
setTimeout(initReels, 100);
setInterval(checkBonusTimer, 1000);

if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        initAudio();
        const freeCoins = Math.floor(Math.random() * 400) + 100;
        balance += freeCoins;
        balanceDisplay.innerText = balance;
        lastBonusTime = Date.now();
        localStorage.setItem('casino_last_bonus', lastBonusTime);
        saveBalance();
        playWinSound();
        messageDisplay.innerText = `🎁 Вы получили бонус: +${freeCoins} 🟡!`;
        messageDisplay.className = "message win";
        checkBonusTimer();
    });
}

// Переключение линий и ставок
lineButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (spinBtn.disabled) return;
        playTickSound(450, 0.04);
        const activeLineBtn = document.querySelector('.line-btn.active');
        if (activeLineBtn) activeLineBtn.classList.remove('active');
        button.classList.add('active');
        activeLines = parseInt(button.getAttribute('data-lines')) || 1;
        updateLayout();
    });
});

betButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (spinBtn.disabled) return;
        playTickSound(400, 0.04);
        const activeBetBtn = document.querySelector('.bet-btn.active');
        if (activeBetBtn) activeBetBtn.classList.remove('active');
        button.classList.add('active');
        betPerLine = parseInt(button.getAttribute('data-bet')) || 10;
        updateLayout();
    });
});

if (infoBtn) infoBtn.addEventListener('click', () => { initAudio(); modal.classList.add('open'); });
if (closeModalBtn) closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));
function saveBalance() { localStorage.setItem('casino_balance', balance); }

// Логика кнопки АВТО
if (autoBtn) {
    autoBtn.addEventListener('click', () => {
        initAudio();
        if (isAutoPlaying) {
            stopAutoPlay();
        } else {
            isAutoPlaying = true;
            autoBtn.classList.add('active');
            autoBtn.innerText = "СТОП 🛑";
            startSpin();
        }
    });
}

function stopAutoPlay() {
    isAutoPlaying = false;
    if (autoBtn) {
        autoBtn.classList.remove('active');
        autoBtn.innerText = "АВТО 🔄";
    }
}

if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        stopAutoPlay();
        startSpin();
    });
}

function startSpin() {
    initAudio();
    const totalBet = betPerLine * activeLines;

    if (balance < totalBet) {
        messageDisplay.innerText = "🚨 Мало монет! Спин остановлен.";
        messageDisplay.className = "message lose";
        stopAutoPlay();
        if (spinBtn) spinBtn.disabled = false;
        return;
    }

    balance -= totalBet;
    balanceDisplay.innerText = balance;
    saveBalance();
    
    if (spinBtn) spinBtn.disabled = true;
    betButtons.forEach(b => b.disabled = true);
    lineButtons.forEach(b => b.disabled = true);
    
    messageDisplay.innerText = "🐾 Охота началась, барабаны крутятся...";
    messageDisplay.className = "message";

    const finalMatrix = [[], [], []]; 
    let tickInterval = setInterval(() => { playTickSound(250 + Math.random() * 80, 0.02); }, 100);

    reels.forEach((reel, reelIndex) => {
        if (!reel) return;
        reel.style.transition = 'none'; 
        reel.style.top = '0px'; 
        reel.innerHTML = '';
        
        reel.classList.add('blur');

        const numSymbolsInReel = 25 + (reelIndex * 5);
        
        for (let i = 0; i < numSymbolsInReel; i++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const div = document.createElement('div');
            div.className = 'symbol'; div.innerText = randomSymbol;
            reel.appendChild(div);
        }

        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 3]);
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 2]);
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 1]);

        setTimeout(() => {
            reel.style.transition = `top ${2 + reelIndex * 0.5}s cubic-bezier(0.1, 0.9, 0.2, 1)`;
            const travelDistance = (numSymbolsInReel - 3) * symbolHeight;
            reel.style.top = `-${travelDistance}px`;
        }, 50);

        setTimeout(() => {
            reel.classList.remove('blur');
        }, 1800 + reelIndex * 500);
    });

    setTimeout(() => {
        clearInterval(tickInterval);
        checkResult(finalMatrix);
    }, 3200);
}

function checkResult(matrix) {
    const linesToCheck = [
        { id: 1, name: "Центр", elements: [matrix[0][1], matrix[1][1], matrix[2][1]] },
        { id: 2, name: "Верх",  elements: [matrix[0][0], matrix[1][0], matrix[2][0]] },
        { id: 3, name: "Низ",   elements: [matrix[0][2], matrix[1][2], matrix[2][2]] }
    ];

    let totalWin = 0;
    let winDetails = [];

    linesToCheck.forEach(line => {
        if (line.id <= activeLines) {
            // Проверка на случай если элементы не дорендерились
            if (!line.elements[0] || !line.elements[1] || !line.elements[2]) return;
            
            const textSymbols = line.elements.map(el => el.innerText);
            const wildCount = textSymbols.filter(s => s === '🦁').length;
            
            let isWin3 = false;
            let isWin2 = false;
            let winningSymbol = '';

            if (wildCount === 3) {
                isWin3 = true;
                winningSymbol = '🦁';
            } else {
                const nonWilds = textSymbols.filter(s => s !== '🦁');
                const uniqueNonWilds = [...new Set(nonWilds)];

                if (uniqueNonWilds.length === 1) {
                    isWin3 = true;
                    winningSymbol = uniqueNonWilds[0];
                } else if (uniqueNonWilds.length === 2 && wildCount > 0) {
                    isWin2 = true;
                    winningSymbol = uniqueNonWilds[0];
                } else if (uniqueNonWilds.length === 2 && wildCount === 0) {
                    if (textSymbols[0] === textSymbols[1] || textSymbols[1] === textSymbols[2] || textSymbols[0] === textSymbols[2]) {
                        isWin2 = true;
                    }
                }
            }

            if (isWin3) {
                let coeff = 15;
                if (winningSymbol === '🦊') coeff = 20;
                if (winningSymbol === '🐼') coeff = 40;
                if (winningSymbol === '🦁') coeff = 100;

                totalWin += betPerLine * coeff;
                winDetails.push(`3х ${winningSymbol}`);
                line.elements.forEach(el => el.classList.add('winner'));
            } else if (isWin2) {
                totalWin += betPerLine * 2;
                winDetails.push(`2х совпадения`);
                
                if (textSymbols[0] === textSymbols[1] || textSymbols[0] === '🦁' || textSymbols[1] === '🦁') {
                    line.elements[0].classList.add('winner'); line.elements[1].classList.add('winner');
                }
                if (textSymbols[1] === textSymbols[2] || textSymbols[2] === '🦁') {
                    line.elements[1].classList.add('winner'); line.elements[2].classList.add('winner');
                }
            }
        }
    });

    if (totalWin > 0) {
        balance += totalWin;
        balanceDisplay.innerText = balance;
        messageDisplay.innerText = `🎉 ВЫИГРЫШ: +${totalWin} 🟡\n[ ${winDetails.join(', ')} ]`;
        messageDisplay.className = "message win";
        playWinSound();
    } else {
        messageDisplay.innerText = "❌ Нет совпадений.\nПопробуй еще раз!";
        messageDisplay.className = "message lose";
        playTickSound(130, 0.15);
    }

    saveBalance();

    setTimeout(() => {
        if (!isAutoPlaying) {
            if (spinBtn) spinBtn.disabled = false;
            betButtons.forEach(b => b.disabled = false);
            lineButtons.forEach(b => b.disabled = false);
        } else {
            setTimeout(() => {
                if (isAutoPlaying) startSpin();
            }, 1000);
        }
    }, 500);
}