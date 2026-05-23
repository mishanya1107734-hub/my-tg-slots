const symbols = ['🍒', '🍋', '🍇', '🍉', '💎', '7️⃣'];

let balance = parseInt(localStorage.getItem('casino_balance')) || 1000;
let bet = 10; 

const balanceDisplay = document.getElementById('balance');
const spinBtn = document.getElementById('spin-btn');
const messageDisplay = document.getElementById('message');
const betButtons = document.querySelectorAll('.bet-btn');

// Элементы модального окна
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

// 🔊 СИНТЕЗАТОР ЗВУКОВ (Web Audio API)
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Звук "пиканья" при прокрутке барабана
function playTickSound(frequency = 300, duration = 0.05) {
    initAudio();
    if (!audioCtx) return;
    
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Праздничный звук выигрыша
function playWinSound() {
    initAudio();
    let now = audioCtx.currentTime;
    // Играем красивое мажорное арпеджио (три быстрых ноты вверх)
    setTimeout(() => playTickSound(523.25, 0.15), 0);   // Нота До
    setTimeout(() => playTickSound(659.25, 0.15), 150); // Нота Ми
    setTimeout(() => playTickSound(783.99, 0.15), 300); // Нота Соль
    setTimeout(() => playTickSound(1046.50, 0.4), 450); // Нота До (октавой выше)
}

function initReels() {
    reels.forEach(reel => {
        reel.style.transition = 'none';
        reel.style.top = '0px';
        reel.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const div = document.createElement('div');
            div.className = 'symbol';
            div.innerText = randomSymbol;
            reel.appendChild(div);
        }
    });
}

// Управление модальным окном (Таблица выигрышей)
infoBtn.addEventListener('click', () => {
    initAudio(); // Активируем аудиоконтекст по клику пользователя
    modal.classList.add('open');
});
closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));

// Выбор ставки
betButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (spinBtn.disabled) return;
        playTickSound(400, 0.05); // Звук клика по ставке
        document.querySelector('.bet-btn.active').classList.remove('active');
        button.classList.add('active');
        bet = parseInt(button.getAttribute('data-bet'));
    });
});

function saveBalance() {
    localStorage.setItem('casino_balance', balance);
}

spinBtn.addEventListener('click', () => {
    initAudio();
    if (balance < bet) {
        messageDisplay.innerText = "🚨 Не хватает монет! Получи бонус 500 фантиков.";
        messageDisplay.className = "message lose";
        balance = 500;
        balanceDisplay.innerText = balance;
        saveBalance();
        return;
    }

    balance -= bet;
    balanceDisplay.innerText = balance;
    saveBalance();
    
    spinBtn.disabled = true;
    messageDisplay.innerText = "🎰 Крутим барабаны...";
    messageDisplay.className = "message";

    const finalResult = [];

    // Звуковое сопровождение кручения (серия быстрых щелчков)
    let tickInterval = setInterval(() => {
        playTickSound(200 + Math.random() * 100, 0.03);
    }, 120);

    reels.forEach((reel, reelIndex) => {
        reel.style.transition = 'none';
        reel.style.top = '0px';
        reel.innerHTML = '';

        const numSymbolsInReel = 25 + (reelIndex * 5);
        
        for (let i = 0; i < numSymbolsInReel; i++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const div = document.createElement('div');
            div.className = 'symbol';
            div.innerText = randomSymbol;
            reel.appendChild(div);
        }

        finalResult.push(reel.children[numSymbolsInReel - 2].innerText);

        setTimeout(() => {
            reel.style.transition = `top ${2 + reelIndex * 0.5}s cubic-bezier(0.1, 0.9, 0.2, 1)`;
            const travelDistance = (numSymbolsInReel - 3) * symbolHeight;
            reel.style.top = `-${travelDistance}px`;
        }, 50);
    });

    setTimeout(() => {
        clearInterval(tickInterval); // Останавливаем звук кручения
        checkResult(finalResult);
        spinBtn.disabled = false;
    }, 3200);
});

function checkResult(result) {
    const [sym1, sym2, sym3] = result;

    if (sym1 === sym2 && sym2 === sym3) {
        let prize = bet * 15;
        if (sym1 === '💎') prize = bet * 50;
        if (sym1 === '7️⃣') prize = bet * 100;

        balance += prize;
        balanceDisplay.innerText = balance;
        messageDisplay.innerText = `🎉 ДЖЕКПОТ! +${prize} 🪙 (${sym1}${sym2}${sym3})`;
        messageDisplay.className = "message win";
        playWinSound(); // Звук победы
    } else if (sym1 === sym2 || sym2 === sym3 || sym1 === sym3) {
        let prize = bet * 2;
        balance += prize;
        balanceDisplay.innerText = balance;
        messageDisplay.innerText = `👍 Два совпадения: +${prize} 🪙`;
        messageDisplay.className = "message win";
        playWinSound(); // Звук победы
    } else {
        messageDisplay.innerText = "❌ Не повезло. Крути еще!";
        messageDisplay.className = "message lose";
        playTickSound(150, 0.2); // Глухой звук проигрыша
    }

    saveBalance();
}

initReels();