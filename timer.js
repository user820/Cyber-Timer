// Timer logic

let isRunning = false; // Timer starts paused
let isCountdown = false;
let startTime = 0;
let countdownSeconds = 0;
let elapsedSeconds = 0;

// Flags to track if beeps have been played at milestones
let beepAtStartPlayed = false;
let beepAt15MinPlayed = false;
let beepAt5MinPlayed = false;

// Create AudioContext once (for beep sound)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(duration = 1000, frequency = 440, volume = 0.1) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();

  // Stop beep after duration
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

// Padding helper
function pad(n) {
  return n < 10 ? '0' + n : n;
}

function updateTimer() {
  if (!isRunning) return;

  const now = Date.now();

  if (isCountdown) {
    // Countdown mode
    elapsedSeconds = Math.floor((now - startTime) / 1000);
    const remaining = countdownSeconds - elapsedSeconds;

    // Play beep at start of countdown (once)
    if (!beepAtStartPlayed && elapsedSeconds === 0) {
      playBeep(1000, 440, 0.1);
      beepAtStartPlayed = true;
    }

    // Play beep at 15 minutes left (900 seconds) if applicable
    if (!beepAt15MinPlayed && remaining <= 900 && countdownSeconds >= 900) {
      playBeep(1000, 440, 0.1);
      beepAt15MinPlayed = true;
    }

    // Play beep at 5 minutes left (300 seconds) if applicable
    if (!beepAt5MinPlayed && remaining <= 300 && countdownSeconds >= 300) {
      playBeep(1000, 440, 0.1);
      beepAt5MinPlayed = true;
    }

    if (remaining <= 0) {
      // Countdown finished
      isRunning = false;
      document.getElementById('timer').textContent = '00:00:00';

      // Play beep only in countdown mode when timer ends
      playBeep(1000, 440, 0.1);

      return;
    }

    const hrs = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;

    document.getElementById('timer').textContent =
      `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  } else {
    // Count-up mode
    elapsedSeconds = Math.floor((now - startTime) / 1000);
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;

    document.getElementById('timer').textContent =
      `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
}

// Toggle play/pause
function togglePlayPause() {
  if (isRunning) {
    // Pause
    isRunning = false;
  } else {
    // Play
    if (startTime === 0) {
      // First start
      startTime = Date.now();
    } else {
      // Resume: adjust startTime to account for paused duration
      startTime = Date.now() - elapsedSeconds * 1000;
    }
    isRunning = true;
  }
  updateTimer();
}

// Switch to countdown mode and prompt for time
function startCountdown() {
  const input = window.prompt('Enter countdown time in seconds:', '60');
  if (input === null) return; // Cancelled

  const seconds = parseInt(input, 10);
  if (isNaN(seconds) || seconds <= 0) {
    alert('Please enter a valid positive number of seconds.');
    return;
  }

  isCountdown = true;
  countdownSeconds = seconds;
  elapsedSeconds = 0;
  startTime = Date.now();
  isRunning = true;

  // Reset beep flags when starting a new countdown
  beepAtStartPlayed = false;
  beepAt15MinPlayed = false;
  beepAt5MinPlayed = false;

  updateTimer();
}

// Switch to count-up mode (reset timer)
function startCountUp() {
  isCountdown = false;
  elapsedSeconds = 0;
  startTime = Date.now();
  isRunning = true;
  updateTimer();
}

// Initial display
document.getElementById('timer').textContent = '00:00:00';

// Update timer every second
setInterval(updateTimer, 1000);

// Keyboard controls
// Existing keyboard controls listener
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.key.toLowerCase() === 't') {
    e.preventDefault();
    startCountdown();
  } else if (e.key.toLowerCase() === 'r') {
    e.preventDefault();
    const confirmReset = window.confirm('Are you sure you want to reset the timer?');
    if (confirmReset) {
      startCountUp();
    }
  } else if (e.key.toLowerCase() === 'l') {
    e.preventDefault();
    const newLeftText = window.prompt('Enter new left text:', document.querySelector('.ui-left').textContent);
    if (newLeftText !== null) {
      document.querySelector('.ui-left').textContent = newLeftText;
    }
  } else if (e.key.toLowerCase() === 'p') {
    e.preventDefault();
    const newRightText = window.prompt('Enter new right text:', document.querySelector('.ui-right').textContent);
    if (newRightText !== null) {
      document.querySelector('.ui-right').textContent = newRightText;
    }
  }
});


// Draw grid and lines on canvas
const canvas = document.getElementById('bg-grid');
const ctx = canvas.getContext('2d');
canvas.width = 1920;
canvas.height = 1080;

let offsetX = 0;
let offsetY = 0;
const gridSpacingX = 240;
const gridSpacingY = 180;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Speed constants (positive values)
const speedX = 0.1; // pixels per frame, horizontal speed
const speedY = 0.1; // pixels per frame, vertical speed

function drawGrid() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Update offsets for smooth movement in opposite direction
  offsetX -= speedX; // move left instead of right
  offsetY -= speedY; // move up instead of down

  // Wrap offsets to keep them within grid spacing limits
  if (offsetX < 0) offsetX += gridSpacingX;
  if (offsetY < 0) offsetY += gridSpacingY;

  // Draw vertical grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let x = -offsetX; x <= canvasWidth; x += gridSpacingX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }

  // Draw horizontal grid lines
  for (let y = -offsetY; y <= canvasHeight; y += gridSpacingY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Draw angled bright lines (static)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.lineTo(canvasWidth, 600);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(canvasWidth, 300);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(500, 0);
  ctx.lineTo(1200, canvasHeight);
  ctx.stroke();
}

function animate() {
  drawGrid();
  requestAnimationFrame(animate);
}

animate();

const timerElement = document.getElementById('timer');
let tiltStartTime = null;

function animateTilt(timestamp) {
  if (!tiltStartTime) tiltStartTime = timestamp;
  const elapsed = (timestamp - tiltStartTime) / 1000; // seconds

  // Calculate rotation angle using sine wave
  // amplitude in degrees (e.g., 3 degrees max tilt)
  const amplitude = 2;
  // frequency in Hz (cycles per second), e.g., 0.5 means one full left-right-left cycle every 2 seconds
  const frequency = 0.2;
  const angle = amplitude * Math.sin(2 * Math.PI * frequency * elapsed);

  // Apply rotation transform
  timerElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

  requestAnimationFrame(animateTilt);
}

// Start the tilt animation
requestAnimationFrame(animateTilt);
