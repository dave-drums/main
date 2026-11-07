import { RUDIMENTS, withLead } from './rudiments-data.js';
import { RudimentEngine } from './rudiments-engine.js';
import { renderNotation } from './rudiments-notation.js';
import { bindTempoStepper, TEMPO_STEP } from './tempo-stepper.js';
import { startPlaybackTimer } from './playback-timer.js';

const $ = (id) => document.getElementById(id);
const select = $('rud-select');
let lead = 'R';
let clickEnabled = true;
let drumsEnabled = true;
let repetition = 0;
const play = $('rud-play');
const bpmInput = $('rud-bpm');
const slider = $('rud-slider');
const feedback = $('rud-feedback');
const score = $('rud-notation');
const rampToggle = $('rud-ramp');
const rampFields = [...document.querySelectorAll('[data-ramp-field]')];
let rudiment;
let bpm = 80;
let engine;
let starting = false;
let generation = 0;
let taps = [];
let active;
let displayedBpm;
let elapsedTime = '0:00';
let stopPlaybackTimer;

const categories = new Map();
for (const rud of RUDIMENTS) {
  if (!categories.has(rud.category)) {
    const group = document.createElement('optgroup');
    group.label = rud.category;
    categories.set(rud.category, group);
    select.append(group);
  }
  const option = document.createElement('option');
  option.value = rud.id;
  option.textContent = `${rud.pas}. ${rud.name}`;
  categories.get(rud.category).append(option);
}
select.value = RUDIMENTS[0].id;

function setBpm(value, fromPlayback = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) return;
  bpm = Math.max(40, Math.min(240, Math.round(number)));
  bpmInput.value = String(bpm);
  slider.value = String(bpm);
  if (engine && !fromPlayback) engine.requestedBpm = bpm;
}

function clearHighlight() {
  document.querySelectorAll('.rud-current').forEach((node) => node.classList.remove('rud-current'));
  active = null;
}

function visual(event) {
  clearHighlight();
  active = event;
  score.querySelector(`[data-stroke="${event.key}"]`)?.classList.add('rud-current');
  if (rampToggle.checked) {
    repetition = event.completed % Number($('rud-every').value) + 1;
    updateCycle();
  }
  if (displayedBpm !== event.bpm) {
    displayedBpm = event.bpm;
    // In steady mode keep the user's requested tempo visible, even while the
    // last few milliseconds of already-scheduled audio use the previous tempo.
    if (rampToggle.checked) {
      setBpm(event.bpm, true);
      updateRampStatus();
    }
  }
}

function updateCycle() {
  const cycle = $('rud-cycle');
  cycle.hidden = !rampToggle.checked;
  const text = `Repetition ${repetition} of ${Math.max(1, Number($('rud-every').value) || 1)}`;
  if (cycle.textContent !== text) cycle.textContent = text;
}

function updateRampStatus() {
  const target = Number($('rud-target').value);
  $('rud-ramp-status').textContent = rampToggle.checked
    ? engine?.running ? bpm >= target ? 'Target reached · holding tempo' : 'Speed trainer active'
      : 'Speed trainer ready'
    : 'Steady tempo';
}

function updatePlayButton() {
  const running = starting || engine?.running;
  play.textContent = running ? `⏹ ${elapsedTime}` : 'Start';
  play.setAttribute('aria-label', running ? 'Stop playback' : 'Start playback');
}

function controls() {
  const running = starting || engine?.running;
  updatePlayButton();
  play.setAttribute('aria-pressed', String(Boolean(running)));
  play.setAttribute('aria-busy', String(starting));
  rampToggle.disabled = Boolean(running);
  rampFields.forEach((field) => { field.disabled = Boolean(running) || !rampToggle.checked; });
  // During a ramp the transport owns tempo. Stop to edit its settings.
  [bpmInput, slider, $('rud-minus'), $('rud-plus'), $('rud-tap')].forEach((field) => {
    field.disabled = Boolean(running) && rampToggle.checked;
  });
  updateRampStatus();
  updateCycle();
}

function stop(message = '') {
  generation++;
  starting = false;
  stopPlaybackTimer?.();
  stopPlaybackTimer = undefined;
  elapsedTime = '0:00';
  engine?.stop();
  clearHighlight();
  repetition = 0;
  feedback.textContent = message;
  controls();
}

function choose() {
  stop();
  rudiment = withLead(RUDIMENTS.find((item) => item.id === select.value), lead);
  $('rud-name').textContent = rudiment.name;
  $('rud-rhythm-note').textContent = rudiment.rhythm;
  renderNotation(score, rudiment);
}

async function start() {
  if (starting || engine?.running) { stop(); return; }
  const ramp = rampToggle.checked ? {
    start: Number($('rud-start').value), target: Number($('rud-target').value),
    increase: Number($('rud-increase').value), every: Number($('rud-every').value),
  } : null;
  if (ramp) {
    for (const field of rampFields) if (!field.reportValidity()) return;
    if (ramp.target < ramp.start) {
      feedback.textContent = 'Target BPM must be equal to or above starting BPM.';
      $('rud-target').focus();
      return;
    }
  }
  const token = ++generation;
  starting = true;
  feedback.textContent = '';
  controls();
  try {
    if (!engine || engine.context.state === 'closed') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Web Audio is unavailable');
      engine = new RudimentEngine(new AudioContext({ latencyHint: 'interactive' }), { visual, interrupted: stop });
    }
    await engine.context.resume();
    if (token !== generation) return;
    await engine.prepareClick();
    if (token !== generation) return;
    if (document.hidden) { stop('Press Start when this page is visible to begin playback.'); return; }
    engine.start(rudiment, bpm, { ramp, click: () => clickEnabled, drums: drumsEnabled, volume: 1 });
    if (ramp) setBpm(ramp.start, true);
    starting = false;
    displayedBpm = undefined;
    stopPlaybackTimer = startPlaybackTimer((time) => {
      elapsedTime = time;
      updatePlayButton();
    });
    controls();
  } catch (error) {
    if (token === generation) stop('Audio could not start. Try Start again in a browser that supports Web Audio.');
    console.error('Rudiment trainer audio:', error);
  }
}

select.addEventListener('change', choose);
function chooseLead(hand) {
  if (lead === hand) return;
  lead = hand;
  $('rud-left').setAttribute('aria-pressed', String(hand === 'L'));
  $('rud-right').setAttribute('aria-pressed', String(hand === 'R'));
  choose();
}
$('rud-left').addEventListener('click', () => chooseLead('L'));
$('rud-right').addEventListener('click', () => chooseLead('R'));
$('rud-click').addEventListener('click', () => {
  clickEnabled = !clickEnabled;
  $('rud-click').setAttribute('aria-pressed', String(clickEnabled));
  $('rud-click').setAttribute('title', clickEnabled ? 'Mute metronome' : 'Unmute metronome');
  $('rud-click-icon').setAttribute('href', `../assets/icons.svg#${clickEnabled ? 'speaker' : 'speaker-off'}`);
});
$('rud-drums').addEventListener('click', () => {
  drumsEnabled = !drumsEnabled;
  $('rud-drums').setAttribute('aria-pressed', String(drumsEnabled));
  $('rud-drums').setAttribute('title', drumsEnabled ? 'Mute drum sound' : 'Unmute drum sound');
  $('rud-drums-icon').setAttribute('href', `../assets/icons.svg#${drumsEnabled ? 'speaker' : 'speaker-off'}`);
  engine?.setDrumsEnabled(drumsEnabled);
});
function stepRudiment(direction) {
  const index = RUDIMENTS.findIndex((item) => item.id === select.value);
  select.value = RUDIMENTS[(index + direction + RUDIMENTS.length) % RUDIMENTS.length].id;
  choose();
}
$('rud-previous').addEventListener('click', () => stepRudiment(-1));
$('rud-next').addEventListener('click', () => stepRudiment(1));
$('rud-random').addEventListener('click', () => {
  select.value = RUDIMENTS[Math.floor(Math.random() * RUDIMENTS.length)].id;
  choose();
});
play.addEventListener('click', start);
slider.addEventListener('input', () => setBpm(slider.value));
bpmInput.addEventListener('change', () => setBpm(bpmInput.value || bpm));
bindTempoStepper($('rud-minus'), () => setBpm(bpm - TEMPO_STEP));
bindTempoStepper($('rud-plus'), () => setBpm(bpm + TEMPO_STEP));
$('rud-tap').addEventListener('click', () => {
  const now = performance.now();
  if (taps.length && now - taps[taps.length - 1] > 2200) taps = [];
  taps.push(now);
  taps = taps.slice(-6);
  if (taps.length > 1) setBpm(60000 * (taps.length - 1) / (now - taps[0]));
  feedback.textContent = taps.length > 1 ? `Tap tempo set to ${bpm} BPM.` : 'Keep tapping to set the tempo.';
});
rampToggle.addEventListener('change', controls);
rampFields.forEach((field) => field.addEventListener('input', controls));
document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey
    || document.querySelector('dialog[open]')
    || event.target.closest('input, select, textarea, button, a, summary, [contenteditable], [role="button"]')) return;
  event.preventDefault();
  start();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (starting || engine?.running)) stop('Playback paused while this page was in the background. Press Start to continue.');
});
window.addEventListener('pagehide', () => {
  stop();
  engine?.dispose();
  engine = undefined;
});
let lastWidth = 0;
new ResizeObserver(([entry]) => {
  if (Math.abs(entry.contentRect.width - lastWidth) < 1) return;
  lastWidth = entry.contentRect.width;
  renderNotation(score, rudiment);
  if (active) score.querySelector(`[data-stroke="${active.key}"]`)?.classList.add('rud-current');
}).observe(score);
$('rud-controls').disabled = false;
choose();
