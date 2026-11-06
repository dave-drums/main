(() => {
const video = document.querySelector('video');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');


const backdrop = document.querySelector('.backdrop canvas');
const backdropContext = backdrop.getContext('2d');
const desktop = matchMedia('(min-width: 651px)');

function paintBackdrop() {
  if (desktop.matches && !reducedMotion.matches && video.readyState >= 2) {
    backdropContext.drawImage(video, 0, 0, backdrop.width, backdrop.height);
  }
}

function clearBackdrop() {
  backdropContext.clearRect(0, 0, backdrop.width, backdrop.height);
  paintBackdrop();
}

if ('requestVideoFrameCallback' in video) {
  let lastPaint = 0;
  function mirrorFrame(now) {
    if (now - lastPaint >= 80) {
      paintBackdrop();
      lastPaint = now;
    }
    video.requestVideoFrameCallback(mirrorFrame);
  }
  video.requestVideoFrameCallback(mirrorFrame);
} else {
  video.addEventListener('timeupdate', paintBackdrop);
}
video.addEventListener('loadeddata', paintBackdrop);
desktop.addEventListener('change', clearBackdrop);
reducedMotion.addEventListener('change', clearBackdrop);

const audio = document.querySelector('audio');
const signal = document.querySelector('.live-signal');
const signalContext = signal.getContext('2d');
let audioContext;
let analyser;
let samples;

function prepareSignal() {
  const Context = window.AudioContext || window.webkitAudioContext;
  // Keep ordinary media playback for local previews and unsupported browsers.
  if (!Context || location.protocol === 'file:') return;
  try {
    audioContext ||= new Context();
    audioContext.resume().then(() => {
      if (analyser || audioContext.state !== 'running') return;
      const nextAnalyser = audioContext.createAnalyser();
      nextAnalyser.fftSize = 1024;
      nextAnalyser.connect(audioContext.destination);
      audioContext.createMediaElementSource(audio).connect(nextAnalyser);
      analyser = nextAnalyser;
      samples = new Uint8Array(analyser.fftSize);
    }).catch(() => {});
  } catch {}
}

function drawSignal() {
  const { width, height } = signal;
  const isLive = analyser && !audio.paused && !reducedMotion.matches;
  signalContext.clearRect(0, 0, width, height);
  signalContext.beginPath();
  signalContext.lineWidth = isLive ? 3 : 2;
  signalContext.strokeStyle = isLive ? '#ff854d' : '#a66149';
  signalContext.moveTo(0, height / 2);
  if (isLive) {
    analyser.getByteTimeDomainData(samples);
    for (let index = 0; index < samples.length; index += 4) {
      const x = width * index / (samples.length - 4);
      const amplitude = (samples[index] - 128) / 128;
      const y = height / 2 + Math.tanh(amplitude * 3.2) * (height / 2 - 2);
      signalContext.lineTo(x, y);
    }
  } else {
    signalContext.lineTo(width, height / 2);
  }
  signalContext.stroke();
}
let frame;


function animateWaveform() {
  drawSignal();
  if (!audio.paused && !reducedMotion.matches) {
    frame = requestAnimationFrame(animateWaveform);
  }
}
function updateWaveform() {
  cancelAnimationFrame(frame);
  animateWaveform();
}

for (const event of ['play', 'pause', 'ended']) {
  audio.addEventListener(event, updateWaveform);
}
reducedMotion.addEventListener('change', updateWaveform);
updateWaveform();
const toggle = document.querySelector('.audio-toggle');
const icon = toggle.querySelector('span');

function syncAudioControls() {
  toggle.setAttribute('aria-label', audio.paused ? 'Play audio' : 'Pause audio');
  icon.textContent = audio.paused ? '▶' : '❚❚';
}

toggle.addEventListener('click', () => {
  if (audio.paused) {
    prepareSignal();
    audio.play().catch(syncAudioControls);
  } else {
    audio.pause();
  }
});
for (const event of ['play', 'pause', 'ended']) {
  audio.addEventListener(event, syncAudioControls);
}
function showAudioError() {
  toggle.setAttribute('aria-label', 'Audio unavailable');
  toggle.disabled = true;
}
audio.addEventListener('error', showAudioError);
syncAudioControls();
if (audio.error) showAudioError();
const warning = document.querySelector('.entry-warning');
const enter = warning.querySelector('button');
const main = document.querySelector('main');

enter.focus();
enter.addEventListener('click', () => {
  const revealFootage = () => main.classList.remove('opening');
  video.addEventListener('playing', revealFootage, { once: true });
  video.play().catch(revealFootage);
  prepareSignal();
  audio.play().catch(syncAudioControls);
  warning.classList.add('is-leaving');
  warning.inert = true;
  main.inert = false;
  main.focus({ preventScroll: true });
}, { once: true });
})();
