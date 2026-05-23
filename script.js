// Новые крутые иконки животных
const symbols = ['🦁', '🐼', '🦊', '🐸', '🐵', '🐰'];

let balance = parseInt(localStorage.getItem('casino_balance')) || 1000;
let betPerLine = 10; 
let activeLines = 1;

const balanceDisplay = document.getElementById('balance');
const totalBetDisplay = document.getElementById('total-bet');
const spinBtn = document.getElementById('spin-btn');
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

const symbolHeight = 80; 
balanceDisplay.innerText = balance;

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
    setTimeout(() => playTickSound(587.33, 0.12), 0);
    setTimeout(() => playTickSound(739.99, 0.12), 120);
    setTimeout(() => playTickSound(880.00, 0.12), 240);
    setTimeout(() => playTickSound(1174.66, 0.3), 360);
}

function updateLayout() {
    totalBetDisplay.innerText = betPerLine * activeLines;
    // Подсвечиваем точки-индикаторы линий слева от барабанов
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (i <= activeLines) dot.classList.add('active');
        else dot.classList.remove('active');
    }
}

function initReels() {
    reels.forEach(reel => {
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

// Переключение линий
lineButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (spinBtn.disabled) return;
        playTickSound(450, 0.04);
        document.querySelector('.line-btn.active').classList.remove('active');
        button.classList.add('active');
        activeLines = parseInt(button.getAttribute('data-lines'));
        updateLayout();
    });
});

// Переключение ставок
betButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (spinBtn.disabled) return;
        playTickSound(400, 0.04);
        document.querySelector('.bet-btn.active').classList.remove('active');
        button.classList.add('active');
        betPerLine = parseInt(button.getAttribute('data-bet'));
        updateLayout();
    });
});

infoBtn.addEventListener('click', () => { initAudio(); modal.classList.add('open'); });
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));
function saveBalance() { localStorage.setItem('casino_balance', balance); }

spinBtn.addEventListener('click', () => {
    initAudio();
    const totalBet = betPerLine * activeLines;

    if (balance < totalBet) {
        messageDisplay.innerText = "🚨 Мало монет! Начислен бонус 500 фантиков.";
        messageDisplay.className = "message lose";
        balance = 500; balanceDisplay.innerText = balance; saveBalance();
        return;
    }

    balance -= totalBet;
    balanceDisplay.innerText = balance;
    saveBalance();
    
    spinBtn.disabled = true;
    messageDisplay.innerText = "🐾 Охота началась, крутим...";
    messageDisplay.className = "message";

    // Двумерный массив, куда соберем ВСЕ видимые в конце символы (3 барабана х 3 строки)
    const finalMatrix = [[], [], []]; 

    let tickInterval = setInterval(() => { playTickSound(250 + Math.random() * 80, 0.02); }, 100);

    reels.forEach((reel, reelIndex) => {
        reel.style.transition = 'none'; reel.style.top = '0px'; reel.innerHTML = '';
        const numSymbolsInReel = 25 + (reelIndex * 5);
        
        for (let i = 0; i < numSymbolsInReel; i++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const div = document.createElement('div');
            div.className = 'symbol'; div.innerText = randomSymbol;
            reel.appendChild(div);
        }

        // Запоминаем три финальных видимых символа для этого барабана
        // Верхний ряд (индекс -3), Центральный ряд (индекс -2), Нижний ряд (индекс -1)
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 3].innerText); // Верх
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 2].innerText); // Центр
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 1].innerText); // Низ

        setTimeout(() => {
            reel.style.transition = `top ${2 + reelIndex * 0.5}s cubic-bezier(0.1, 0.9, 0.2, 1)`;
            const travelDistance = (numSymbolsInReel - 3) * symbolHeight;
            reel.style.top = `-${travelDistance}px`;
        }, 50);
    });

    setTimeout(() => {
        clearInterval(tickInterval);
        checkResult(finalMatrix);
        spinBtn.disabled = false;
    }, 3200);
});

function checkResult(matrix) {
    // Формируем тройки символов для каждой из 3 линий
    const linesToCheck = [
        { id: 1, name: "Центр", symbols: [matrix[0][1], matrix[1][1], matrix[2][1]] }, // Линия 1
        { id: 2, name: "Верх",  symbols: [matrix[0][0], matrix[1][0], matrix[2][0]] }, // Линия 2
        { id: 3, name: "Низ",   symbols: [matrix[0][2], matrix[1][2], matrix[2][2]] }  // Линия 3
    ];

    let totalWin = 0;
    let winDetails = [];

    // Проверяем только те линии, которые оплатил игрок
    linesToCheck.forEach(line => {
        if (line.id <= activeLines) {
            const [s1, s2, s3] = line.symbols;

            if (s1 === s2 && s2 === s3) {
                let coeff = 15; // Любые 3 в ряд
                if (s1 === '🦊') coeff = 20;
                if (s1 === '🐼') coeff = 40;
                if (s1 === '🦁') coeff = 100;

                let linePrize = betPerLine * coeff;
                totalWin += linePrize;
                winDetails.push(`3х ${s1} (${line.name})`);
            } else if (s1 === s2 || s2 === s3 || s1 === s3) {
                let linePrize = betPerLine * 2;
                totalWin += linePrize;
                winDetails.push(`2х совпадения (${line.name})`);
            }
        }
    });

    if (totalWin > 0) {
        balance += totalWin;
        balanceDisplay.innerText = balance;
        messageDisplay.innerText = `🎉 ВЫИГРЫШ: +${totalWin} 🪙\n[ ${winDetails.join(', ')} ]`;
        messageDisplay.className = "message win";
        playWinSound();
    } else {
        messageDisplay.innerText = "❌ Нет совпадений по линиям.";
        messageDisplay.className = "message lose";
        playTickSound(130, 0.15);
    }

    saveBalance();
}

initReels();