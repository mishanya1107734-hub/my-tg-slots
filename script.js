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
    setTimeout(() => playTickSound(523.25, 0.1), 0);
    setTimeout(() => playTickSound(659.25, 0.1), 100);
    setTimeout(() => playTickSound(783.99, 0.1), 200);
    setTimeout(() => playTickSound(1046.50, 0.25), 300);
}

function updateLayout() {
    totalBetDisplay.innerText = betPerLine * activeLines;
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (i <= activeLines) dot.classList.add('active');
        else dot.classList.remove('active');
    }
    checkBonusTimer();
}

// ПРОВЕРКА ТАЙМЕРА БОНУСА (Раз в 1 минуту для теста, можно изменить на 24 часа)
function checkBonusTimer() {
    const now = Date.now();
    const cooldown = 60 * 1000; // 1 минута в миллисекундах
    
    if (now - lastBonusTime >= cooldown) {
        bonusBtn.disabled = false;
        bonusBtn.innerText = "🎁 Бонус!";
    } else {
        bonusBtn.disabled = true;
        const timeLeft = Math.ceil((cooldown - (now - lastBonusTime)) / 1000);
        bonusBtn.innerText = `⏳ ${timeLeft}с`;
    }
}
setInterval(checkBonusTimer, 1000);

// Клик по кнопке бонуса
bonusBtn.addEventListener('click', () => {
    initAudio();
    const freeCoins = Math.floor(Math.random() * 400) + 100; // от 100 до 500 монет
    balance += freeCoins;
    balanceDisplay.innerText = balance;
    lastBonusTime = Date.now();
    localStorage.setItem('casino_last_bonus', lastBonusTime);
    saveBalance();
    playWinSound();
    messageDisplay.innerText = `🎁 Вы получили ежедневный бонус: +${freeCoins} 🪙!`;
    messageDisplay.className = "message win";
    checkBonusTimer();
});

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

// Переключение линий и ставок
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

// Логика кнопки АВТО
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

function stopAutoPlay() {
    isAutoPlaying = false;
    autoBtn.classList.remove('active');
    autoBtn.innerText = "АВТО 🔄";
}

spinBtn.addEventListener('click', () => {
    stopAutoPlay(); // Обычный клик отменяет авто-режим
    startSpin();
});

function startSpin() {
    initAudio();
    const totalBet = betPerLine * activeLines;

    if (balance < totalBet) {
        messageDisplay.innerText = "🚨 Мало монет! Спин остановлен.";
        messageDisplay.className = "message lose";
        stopAutoPlay();
        spinBtn.disabled = false;
        return;
    }

    balance -= totalBet;
    balanceDisplay.innerText = balance;
    saveBalance();
    
    spinBtn.disabled = true;
    betButtons.forEach(b => b.disabled = true);
    lineButtons.forEach(b => b.disabled = true);
    
    messageDisplay.innerText = "🐾 Охота началась, барабаны крутятся...";
    messageDisplay.className = "message";

    const finalMatrix = [[], [], []]; 
    let tickInterval = setInterval(() => { playTickSound(250 + Math.random() * 80, 0.02); }, 100);

    reels.forEach((reel, reelIndex) => {
        reel.style.transition = 'none'; 
        reel.style.top = '0px'; 
        reel.innerHTML = '';
        
        // Включаем эффект размытия (Motion Blur)
        reel.classList.add('blur');

        const numSymbolsInReel = 25 + (reelIndex * 5);
        
        for (let i = 0; i < numSymbolsInReel; i++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const div = document.createElement('div');
            div.className = 'symbol'; div.innerText = randomSymbol;
            reel.appendChild(div);
        }

        // Записываем финальные элементы
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 3]); // Верхний HTML элемент
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 2]); // Центральный HTML элемент
        finalMatrix[reelIndex].push(reel.children[numSymbolsInReel - 1]); // Нижний HTML элемент

        setTimeout(() => {
            reel.style.transition = `top ${2 + reelIndex * 0.5}s cubic-bezier(0.1, 0.9, 0.2, 1)`;
            const travelDistance = (numSymbolsInReel - 3) * symbolHeight;
            reel.style.top = `-${travelDistance}px`;
        }, 50);

        // Отключаем размытие незадолго до остановки барабана
        setTimeout(() => {
            reel.classList.remove('blur');
        }, 1800 + reelIndex * 500);
    });

    setTimeout(() => {
        clearInterval(tickInterval);
        checkResult(finalMatrix);
    }, 3200);
}

// УМНЫЙ АЛГОРИТМ ПРОВЕРКИ ЛИНИЙ И ДЖОКЕРА (WILD)
function checkResult(matrix) {
    // Массив линий, хранящий сами HTML-элементы для последующей подсветки
    const linesToCheck = [
        { id: 1, name: "Центр", elements: [matrix[0][1], matrix[1][1], matrix[2][1]] },
        { id: 2, name: "Верх",  elements: [matrix[0][0], matrix[1][0], matrix[2][0]] },
        { id: 3, name: "Низ",   elements: [matrix[0][2], matrix[1][2], matrix[2][2]] }
    ];

    let totalWin = 0;
    let winDetails = [];

    linesToCheck.forEach(line => {
        if (line.id <= activeLines) {
            const textSymbols = line.elements.map(el => el.innerText);
            
            // Считаем сколько Львов (WILD) на линии
            const wildCount = textSymbols.filter(s => s === '🦁').length;
            
            let isWin3 = false;
            let isWin2 = false;
            let winningSymbol = '';

            if (wildCount === 3) {
                // Три льва — максимальный джекпот
                isWin3 = true;
                winningSymbol = '🦁';
            } else {
                // Находим все уникальные символы на линии, кроме Льва
                const nonWilds = textSymbols.filter(s => s !== '🦁');
                const uniqueNonWilds = [...new Set(nonWilds)];

                if (uniqueNonWilds.length === 1) {
                    // Если без львов остался один тип животного, значит львы дополнили его до 3 в ряд!
                    isWin3 = true;
                    winningSymbol = uniqueNonWilds[0];
                } else if (uniqueNonWilds.length === 2 && wildCount > 0) {
                    // Если есть лев и два разных символа — это гарантированно пара (2 совпадения)
                    isWin2 = true;
                    winningSymbol = uniqueNonWilds[0]; // берем любой для расчета
                } else if (uniqueNonWilds.length === 2 && wildCount === 0) {
                    // Львов нет, но два символа совпали сами по себе
                    if (textSymbols[0] === textSymbols[1] || textSymbols[1] === textSymbols[2] || textSymbols[0] === textSymbols[2]) {
                        isWin2 = true;
                    }
                }
            }

            // Начисление призов и запуск анимации для конкретных элементов линии
            if (isWin3) {
                let coeff = 15;
                if (winningSymbol === '🦊') coeff = 20;
                if (winningSymbol === '🐼') coeff = 40;
                if (winningSymbol === '🦁') coeff = 100;

                totalWin += betPerLine * coeff;
                winDetails.push(`3х ${winningSymbol} (${line.name})`);
                line.elements.forEach(el => el.classList.add('winner')); // Запускаем пульсацию
            } else if (isWin2) {
                totalWin += betPerLine * 2;
                winDetails.push(`2х совпадения (${line.name})`);
                
                // Подсвечиваем только совпадающие элементы на линии
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
        messageDisplay.innerText = `🎉 ВЫИГРЫШ: +${totalWin} 🪙\n[ ${winDetails.join(', ')} ]`;
        messageDisplay.className = "message win";
        playWinSound();
    } else {
        messageDisplay.innerText = "❌ Нет совпадений.\nПопробуй еще раз!";
        messageDisplay.className = "message lose";
        playTickSound(130, 0.15);
    }

    saveBalance();

    // Разблокируем кнопки ставок и линий, если авто-игра выключена
    setTimeout(() => {
        if (!isAutoPlaying) {
            spinBtn.disabled = false;
            betButtons.forEach(b => b.disabled = false);
            lineButtons.forEach(b => b.disabled = false);
        } else {
            // Если включен режим АВТО — ждем 1.5 секунды и крутим заново сами
            setTimeout(() => {
                if (isAutoPlaying) startSpin();
            }, 1500);
        }
    }, 500);
}

initReels();