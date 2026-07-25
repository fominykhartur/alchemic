let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
}

function playNote(freq, dur, type, vol) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function playNoise(dur, vol) {
  if (!audioCtx) return;
  const bufSize = audioCtx.sampleRate * dur;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const gain = audioCtx.createGain();
  gain.gain.value = vol || 0.1;
  src.connect(gain);
  gain.connect(audioCtx.destination);
  src.start();
}

export function playDrop() {
  initAudio();
  playNoise(0.06, 0.08);
}

export function playMix() {
  initAudio();
  playNote(400, 0.08, 'sine', 0.12);
  setTimeout(() => playNote(600, 0.08, 'sine', 0.1), 60);
  setTimeout(() => playNote(800, 0.1, 'sine', 0.08), 120);
}

export function playExplode() {
  initAudio();
  playNote(100, 0.3, 'sawtooth', 0.15);
  setTimeout(() => playNoise(0.3, 0.12), 50);
}

export function playDiscover() {
  initAudio();
  playNote(523, 0.12, 'sine', 0.15);
  setTimeout(() => playNote(659, 0.12, 'sine', 0.13), 100);
  setTimeout(() => playNote(784, 0.2, 'sine', 0.12), 200);
}

export function playAchievement() {
  initAudio();
  playNote(523, 0.15, 'sine', 0.14);
  setTimeout(() => playNote(659, 0.15, 'sine', 0.12), 120);
  setTimeout(() => playNote(784, 0.15, 'sine', 0.11), 240);
  setTimeout(() => playNote(1047, 0.25, 'sine', 0.13), 360);
}
