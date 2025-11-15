// app.js - game logic for Whack-a-Mole
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const moles = Array.from(document.querySelectorAll('.mole'));
  const scoreEl = document.getElementById('score');
  const timeEl = document.getElementById('time');
  const levelEl = document.getElementById('level');
  const hitsEl = document.getElementById('hits');
  const missesEl = document.getElementById('misses');
  const difficultyEl = document.getElementById('difficulty');
  const highScoreEl = document.getElementById('highScore');
  const soundToggle = document.getElementById('soundToggle');

  let score = 0;
  let timeLeft = 30;
  let timerInterval = null;
  let moleInterval = null;
  let lastIndex = null;
  let isRunning = false;
  let hits = 0, misses = 0;
  let level = 1;

  const highScoreKey = 'whack_highscore_v1';
  highScoreEl.textContent = localStorage.getItem(highScoreKey) || '0';

  // Web Audio setup (create audio context lazily on first user gesture)
  let audioCtx = null;
  function ensureAudioContext(){
    if(!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function beep(freq=440, duration=0.06, vol=0.08){
    if(!soundToggle.checked) return;
    try {
      ensureAudioContext();
      if(audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      setTimeout(()=>o.stop(), duration*1000 + 20);
    } catch (err) {
      // ignore audio errors
    }
  }

  function pickRandomIndex(){
    let idx;
    do { idx = Math.floor(Math.random() * moles.length); } while (idx === lastIndex);
    lastIndex = idx;
    return idx;
  }

  function getVisibleTime(){
    const diff = difficultyEl.value;
    let base;
    if(diff === 'easy') base = 900 - (level-1)*60;
    else if(diff === 'normal') base = 650 - (level-1)*50;
    else base = 420 - (level-1)*30;
    return Math.max(220, base);
  }

  function popMole(){
    const idx = pickRandomIndex();
    const mole = moles[idx];
    mole.classList.add('up');
    const visibleTime = getVisibleTime();
    setTimeout(()=> {
      if(mole.classList.contains('up')) {
        mole.classList.remove('up');
        misses++;
        missesEl.textContent = misses;
        beep(220, 0.04, 0.04);
      }
    }, visibleTime);
  }

  function startGame(){
    if(isRunning) return;
    // audio context resume on first gesture
    ensureAudioContext();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    score = 0; timeLeft = 30; hits = 0; misses = 0; level = 1;
    updateUI();
    isRunning = true;
    startBtn.textContent = 'Playing...';
    startBtn.disabled = true;

    timerInterval = setInterval(()=> {
      timeLeft--;
      timeEl.textContent = timeLeft + 's';
      level = Math.floor(score / 10) + 1;
      levelEl.textContent = level;
      if(timeLeft <= 0) endGame();
    }, 1000);

    moleInterval = setInterval(()=> {
      popMole();
    }, 500);
  }

  function endGame(){
    clearInterval(timerInterval);
    clearInterval(moleInterval);
    isRunning = false;
    startBtn.textContent = 'Start';
    startBtn.disabled = false;
    moles.forEach(m => m.classList.remove('up'));
    const prevHigh = parseInt(localStorage.getItem(highScoreKey) || '0', 10);
    if(score > prevHigh) {
      localStorage.setItem(highScoreKey, score);
      highScoreEl.textContent = score;
      alert('🏆 New High Score: ' + score + '!');
    } else {
      alert('Game over! Score: ' + score);
    }
  }

  function resetGame(){
    clearInterval(timerInterval);
    clearInterval(moleInterval);
    isRunning = false;
    score = 0; timeLeft = 30; hits = 0; misses = 0; level = 1;
    updateUI();
    startBtn.textContent = 'Start';
    startBtn.disabled = false;
    moles.forEach(m => m.classList.remove('up'));
  }

  function updateUI(){
    scoreEl.textContent = score;
    timeEl.textContent = timeLeft + 's';
    hitsEl.textContent = hits;
    missesEl.textContent = misses;
    levelEl.textContent = level;
  }

  // mole events
  moles.forEach(mole => {
    mole.addEventListener('click', (e)=> {
      if(!isRunning) return;
      if(!mole.classList.contains('up')) {
        misses++; missesEl.textContent = misses; beep(200,0.03,0.03);
        return;
      }
      mole.classList.remove('up');
      score += 1 + Math.floor(level/2);
      hits++; hitsEl.textContent = hits;
      if(difficultyEl.value === 'hard') timeLeft += 1;
      updateUI();
      beep(880 - Math.random()*220, 0.06, 0.14);
    });

    mole.addEventListener('touchstart', (e)=> {
      e.preventDefault();
      mole.click();
    }, {passive:false});
  });

  // keyboard: 1-9 to whack, space to start
  window.addEventListener('keydown', e => {
    const code = e.key;
    if(code >= '1' && code <= '9'){
      const idx = parseInt(code,10) - 1;
      moles[idx].click();
    } else if(code === ' '){ // space
      e.preventDefault();
      if(!isRunning) startGame();
    }
  });

  // buttons
  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetGame);

  // initialize UI and read highscore
  updateUI();
  highScoreEl.textContent = localStorage.getItem(highScoreKey) || '0';
});
