import { normalizeSettings, generatePattern, generateBar, meterInfo, TapScorer, eventAudioTime, median } from './rhythm-core.js';
import { RhythmEngine } from './rhythm-engine.js';
import { renderBar } from './rhythm-notation.js';

const $ = (name) => document.getElementById(`rr-${name}`);
const modeButtons = [...document.querySelectorAll('[data-rr-mode]')];
const patternInputs = [...document.querySelectorAll('[data-rr-pattern]')];
const feedback = $('feedback'), canvas = $('score');
const freshSeed = () => window.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now() >>> 0;
let seed = freshSeed(), mode = 'generate', bpm = 80, pattern = [], drill = null;
let engine, starting = false, generation = 0, activeSerial = null, activeNote = null;
let scorer = new TapScorer(), taps = [], beatStates = [], calibration = false, calibrationErrors = [], priorBpm = 80;
let lastProgress = -1, lastWidth = 0, missed = [], saved = [];
const storageKey = 'dave-drums-rhythm-exercises-v1';
const practiceIds = ['count-in','sound','click-division','seconds','rhythm-volume','click-volume',
  'gap-on','gap-off','speed-start','speed-target','speed-step','speed-every','speed-mode'];
function capturePractice() {
  return { values: Object.fromEntries(practiceIds.map((id) => [id, $(id).value])),
    checks: Object.fromEntries(['click','guide','gap','trainer'].map((id) => [id, $(id).checked])), beats: [...beatStates] };
}
function restorePractice(data) {
  if (!data || typeof data !== 'object') return;
  for (const id of practiceIds) {
    const field = $(id), value = data.values?.[id];
    if (value === undefined) continue;
    if (field.tagName === 'SELECT') {
      if ([...field.options].some((option) => option.value === String(value))) field.value = String(value);
    } else if (Number.isFinite(Number(value))) {
      field.value = String(Math.round(Math.max(Number(field.min), Math.min(Number(field.max), Number(value)))));
    }
  }
  for (const id of ['click','guide','gap','trainer']) if (typeof data.checks?.[id] === 'boolean') $(id).checked = data.checks[id];
  if (Array.isArray(data.beats) && data.beats.length === beatStates.length
    && data.beats.every((n) => [0,1,2].includes(n))) { beatStates = [...data.beats]; beatButtons(); }
  syncControls();
}

function settings() {
  return normalizeSettings({ meter: $('meter').value, divisions: $('divisions').value,
    level: $('level').value, space: $('space').value, swing: $('swing').value, bars: $('bars').value, seed });
}
function setBpm(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return;
  bpm = Math.max(40, Math.min(240, Math.round(number)));
  $('bpm').value = String(bpm); $('tempo').value = String(bpm);
  if (engine) engine.requestedBpm = bpm;
}
function apply(input) {
  const s = normalizeSettings(input); seed = s.seed;
  for (const name of ['meter', 'divisions', 'level', 'space', 'swing', 'bars']) $(name).value = String(s[name]);
}
function drawBars(items) {
  const width = canvas.clientWidth || 900, columns = width >= 850 ? 2 : 1;
  canvas.classList.toggle('rr-one-column', columns === 1);
  canvas.replaceChildren(...items.map(({ bar, serial }) => {
    const section = document.createElement('div'); section.className = 'rr-bar';
    const label = document.createElement('p'); label.className = 'rr-bar-label';
    label.textContent = mode === 'read' && engine?.running ? `Bar ${serial + 1}` : `Bar ${serial % pattern.length + 1} · ${bar.meter}`;
    const host = document.createElement('div');
    section.append(label, host);
    renderBar(host, bar, serial, (width - (columns - 1) * 16) / columns);
    return section;
  }));
  if (activeNote) canvas.querySelector(`[data-rr-note="${activeNote}"]`)?.classList.add('rud-current');
}
function idleScore() { drawBars(pattern.map((bar, serial) => ({ bar, serial }))); }
function runningScore(serial) {
  drawBars([serial, serial + 1].map((index) => ({ bar: engine.barAt(index), serial: index })));
}
function beatButtons(reset = false) {
  const info = meterInfo(settings().meter);
  if (reset || beatStates.length !== info.beats) beatStates = Array.from({ length: info.beats }, (_, i) => i ? 1 : 2);
  $('beats').replaceChildren(...beatStates.map((state, index) => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'button tool-button rr-beat'; button.dataset.state = String(state);
    const names = ['muted', 'normal', 'accent'];
    button.textContent = String(index + 1); button.setAttribute('aria-label', `Beat ${index + 1}: ${names[state]}. Change state.`);
    button.addEventListener('click', () => { beatStates[index] = (beatStates[index] + 1) % 3; beatButtons(); });
    return button;
  }));
}
function syncControls() {
  const running = Boolean(starting || engine?.running);
  $('start').textContent = running ? 'Stop' : 'Start';
  $('start').setAttribute('aria-pressed', String(running));
  modeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.rrMode === mode)));
  $('play-panel').hidden = mode !== 'play';
  $('score').hidden = calibration;
  $('swing').disabled = settings().divisions % 3 === 0;
  $('space-value').textContent = `${$('space').value}%`;
  $('swing-value').textContent = $('swing').disabled ? 'Straight for 3 / 6 divisions'
    : `${$('swing').value}%${Number($('swing').value) === 50 ? ' · straight' : ''}`;
  $('beat-unit').textContent = calibration ? 'Quarter-note BPM · timing adjustment' : `${meterInfo(settings().meter).unit} BPM`;
  for (const id of ['count-in','sound','click-division','seconds','gap','trainer']) $(id).disabled = running;
  for (const id of ['gap-on','gap-off']) $(id).disabled = running || !$('gap').checked;
  for (const id of ['speed-start','speed-target','speed-step','speed-every','speed-mode']) $(id).disabled = running || !$('trainer').checked;
  for (const id of ['bpm','tempo','minus','plus','tap-tempo']) $(id).disabled = calibration || running && $('trainer').checked;
  $('calibrate').disabled = running;
  $('drill').disabled = running || !missed.length;
}
function stats() {
  const s = scorer.stats();
  $('accuracy').textContent = `${s.accuracy}%`; $('hits').textContent = String(s.hits);
  $('misses').textContent = String(s.misses); $('streak').textContent = String(s.longest);
}
function audibleTime() { return engine ? eventAudioTime(engine.context, performance.now()) : 0; }
function stop(message = '') {
  const wasPlaying = engine?.running && engine.options.mode === 'play';
  if (wasPlaying) { scorer.finish(audibleTime()); missed = [...scorer.missedBars.values()]; stats(); }
  generation++; starting = false; engine?.stop();
  if (calibration) { calibration = false; setBpm(priorBpm); }
  activeSerial = null; activeNote = null; $('pad').removeAttribute('data-result');
  syncControls(); idleScore();
  const s = scorer.stats();
  $('status').textContent = message || (wasPlaying ? `Finished · ${s.accuracy}% accuracy · ${s.longest} best streak · ${s.extras} extra taps.` : 'Ready to read.');
}
function regenerate(newSeed = false) {
  stop(); if (newSeed) seed = freshSeed();
  drill = null; pattern = generatePattern(settings()); scorer = new TapScorer(); missed = [];
  stats(); beatButtons(true); syncControls(); idleScore();
  $('position').textContent = `${pattern.length} ${pattern.length === 1 ? 'bar' : 'bars'} · ${settings().meter}`;
  feedback.textContent = '';
}
function visual(event) {
  if (event.kind === 'count') { $('status').textContent = `Count in · ${event.count} / ${event.total}`; return; }
  if (event.kind === 'bar') {
    activeSerial = event.serial; activeNote = null; runningScore(event.serial);
    $('position').textContent = mode === 'read' ? `Reading · bar ${event.serial + 1}`
      : `Loop ${Math.floor(event.serial / pattern.length) + 1} · bar ${event.serial % pattern.length + 1} / ${pattern.length}`;
    $('status').textContent = calibration ? 'Tap eight steady clicks to adjust timing.'
      : event.silent ? 'Silent click · keep the pulse going' : $('trainer').checked
        ? `Speed trainer · ${event.bpm} BPM` : mode === 'play' ? 'Tap the notes · keep rests and ties silent' : 'Playing';
    if ($('trainer').checked && !calibration) setBpm(event.bpm);
  } else {
    canvas.querySelectorAll('.rud-current').forEach((node) => node.classList.remove('rud-current'));
    activeNote = event.id;
    canvas.querySelector(`[data-rr-note="${event.id}"]`)?.classList.add('rud-current');
  }
}
function progress(elapsed) {
  const unit = Math.floor(elapsed * 10); if (unit === lastProgress) return; lastProgress = unit;
  const seconds = Math.floor(elapsed);
  $('clock').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  if (mode === 'play' && !calibration) stats();
}
function valid(ids) {
  for (const id of ids) {
    const field = $(id);
    if (!field.checkValidity()) {
      const details = field.closest('details');
      if (details) details.open = true;
      field.reportValidity(); return false;
    }
  }
  return true;
}
async function start(adjust = false) {
  if (starting || engine?.running) { stop(); return; }
  if (!adjust && !valid(['seconds'])) return;
  if (!adjust && $('gap').checked && !valid(['gap-on','gap-off'])) return;
  if (!adjust && $('trainer').checked && !valid(['speed-start','speed-target','speed-step','speed-every'])) return;
  const token = ++generation; starting = true;
  calibration = adjust; calibrationErrors = []; priorBpm = bpm;
  if (adjust) setBpm(80);
  else { scorer = new TapScorer(); missed = []; stats(); }
  feedback.textContent = ''; $('status').textContent = 'Preparing audio…'; lastProgress = -1; syncControls();
  try {
    if (!engine || engine.context.state === 'closed') {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('Web Audio unavailable');
      engine = new RhythmEngine(new Context({ latencyHint: 'interactive' }), {
        visual, interrupted: stop, progress, finished: () => stop('Session timer finished.'),
      });
    }
    await engine.context.resume();
    if (token !== generation) return;
    if (document.hidden || engine.context.state !== 'running') { stop('Audio paused. Press Start when this page is ready.'); return; }
    const s = adjust ? normalizeSettings({ meter: '4/4', level: 0, space: 0, divisions: 2 }) : settings();
    const training = !adjust && $('trainer').checked ? { start: Number($('speed-start').value), target: Number($('speed-target').value),
      step: Number($('speed-step').value), every: Number($('speed-every').value), mode: $('speed-mode').value } : null;
    engine.start({ settings: s, pattern: adjust ? generatePattern(s) : pattern, mode: adjust ? 'calibrate' : mode, bpm,
      countIn: adjust ? 0 : Number($('count-in').value), seconds: adjust ? 0 : Number($('seconds').value),
      trainer: training, gap: !adjust && $('gap').checked ? { on: Number($('gap-on').value), off: Number($('gap-off').value) } : null,
      sound: $('sound').value, clickDivision: adjust ? 1 : Number($('click-division').value), scorer,
      beats: () => beatStates, click: () => $('click').checked, guide: () => mode !== 'play' || $('guide').checked,
      clickVolume: () => Number($('click-volume').value) / 100, rhythmVolume: () => Number($('rhythm-volume').value) / 100 });
    starting = false; if (training) setBpm(training.start); syncControls();
    if (adjust) $('status').textContent = 'Tap eight steady clicks · 80 BPM';
  } catch (error) {
    if (token === generation) stop('Audio could not start. Try again in a browser with Web Audio support.');
    console.error('Rhythm Reader audio:', error);
  }
}
function tap(timestamp) {
  if (!engine?.running || mode !== 'play') { $('tap-feedback').textContent = 'Press Start before tapping the rhythm.'; return; }
  if (performance.now() - timestamp > 200) { stop('Tap delivery was interrupted. Press Start to try again.'); return; }
  const time = eventAudioTime(engine.context, timestamp);
  if (calibration) {
    let target;
    for (const candidate of engine.calibrationTargets) if (!candidate.used && Math.abs(time - candidate.time) < 0.3
      && (!target || Math.abs(time - candidate.time) < Math.abs(time - target.time))) target = candidate;
    if (!target) { $('tap-feedback').textContent = 'Follow the click, then tap again.'; return; }
    target.used = true; calibrationErrors.push((time - target.time) * 1000);
    $('tap-feedback').textContent = `${calibrationErrors.length} / 8 steady taps`;
    if (calibrationErrors.length === 8) {
      const centre = median(calibrationErrors), clean = calibrationErrors.filter((v) => Math.abs(v - centre) <= 80);
      const offset = Math.max(-250, Math.min(250, Math.round(median(clean.length >= 5 ? clean : calibrationErrors))));
      $('offset').value = String(offset); saveOffset(); stop(`Timing adjustment saved: ${offset} ms.`);
    }
    return;
  }
  if (engine.startedAt === null || time < engine.startedAt) { $('tap-feedback').textContent = 'Wait for the count-in to finish.'; return; }
  const result = scorer.tap(time - (Number($('offset').value) || 0) / 1000);
  $('pad').dataset.result = result.hit ? 'hit' : 'extra';
  $('tap-feedback').textContent = result.hit ? Math.abs(result.error) < 15 ? 'On time' : `${Math.round(Math.abs(result.error))} ms ${result.error < 0 ? 'early' : 'late'}` : 'Extra tap · listen for the next note';
  if (result.hit) canvas.querySelector(`[data-rr-note="${result.id}"]`)?.classList.add('rr-hit');
  stats();
}
function saveOffset() { try { localStorage.setItem('dave-drums-rhythm-offset', $('offset').value); } catch { /* Practice still works without storage. */ } }
function savedList() {
  $('saved').replaceChildren(...(saved.length ? saved.map((entry) => {
    const option = document.createElement('option'); option.value = entry.id; option.textContent = entry.name; return option;
  }) : [Object.assign(document.createElement('option'), { value: '', textContent: 'No saved exercises' })]));
  $('load').disabled = $('delete').disabled = !saved.length;
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); savedList(); return true; }
  catch { feedback.textContent = 'Saving is unavailable in this browser. Use Share exercise to keep a link.'; return false; }
}
function customBars(indices) {
  return Array.isArray(indices) && indices.length > 0 && indices.length <= 8
    && indices.every((i) => Number.isInteger(i) && i >= 0 && i <= 100000)
    ? indices.map((index) => generateBar(settings(), index)) : null;
}
function visibleIndices() {
  return drill?.map((bar) => bar.index) || (mode === 'read' && activeSerial !== null ? [activeSerial, activeSerial + 1] : null);
}

modeButtons.forEach((button) => button.addEventListener('click', () => { stop(); mode = button.dataset.rrMode; syncControls(); idleScore(); }));
patternInputs.forEach((input) => input.addEventListener('change', () => regenerate()));
for (const id of ['space','swing']) $(id).addEventListener('input', syncControls);
$('start').addEventListener('click', () => start());
$('new').addEventListener('click', () => regenerate(true));
$('bpm').addEventListener('change', () => setBpm($('bpm').value || bpm));
$('tempo').addEventListener('input', () => setBpm($('tempo').value));
$('minus').addEventListener('click', () => setBpm(bpm - 1));
$('plus').addEventListener('click', () => setBpm(bpm + 1));
$('tap-tempo').addEventListener('click', () => {
  const now = performance.now(); if (taps.length && now - taps.at(-1) > 2200) taps = [];
  taps.push(now); taps = taps.slice(-6);
  if (taps.length > 1) setBpm(60000 * (taps.length - 1) / (now - taps[0]));
  feedback.textContent = taps.length > 1 ? `Tempo set to ${bpm} BPM.` : 'Keep tapping to set a tempo.';
});
for (const id of ['gap','trainer']) $(id).addEventListener('change', syncControls);
$('pad').addEventListener('pointerdown', (event) => {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault(); tap(event.timeStamp);
});
$('pad').addEventListener('keydown', (event) => {
  if (['Space','Enter','KeyJ'].includes(event.code)) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) tap(event.timeStamp); }
});
$('pad').addEventListener('click', (event) => { if (event.detail === 0) tap(event.timeStamp); });
$('offset').addEventListener('change', () => { $('offset').value = String(Math.max(-250, Math.min(250, Number($('offset').value) || 0))); saveOffset(); });
$('calibrate').addEventListener('click', () => start(true));
$('drill').addEventListener('click', () => {
  stop(); drill = missed.slice(0, 8); pattern = drill; scorer = new TapScorer(); stats(); syncControls(); idleScore();
  $('position').textContent = `Drill · ${pattern.length} missed ${pattern.length === 1 ? 'bar' : 'bars'}`;
});
$('share').addEventListener('click', async () => {
  const url = new URL(window.location.href); url.search = '';
  for (const [key, value] of Object.entries(settings())) url.searchParams.set(key, value);
  url.searchParams.set('bpm', bpm);
  const indices = visibleIndices();
  if (indices) url.searchParams.set('take', indices.join(','));
  $('share-url').value = url.href;
  try { await navigator.clipboard.writeText(url.href); feedback.textContent = 'Exercise link copied.'; }
  catch { $('share-url').hidden = false; $('share-url').focus(); $('share-url').select(); feedback.textContent = 'Copy this link to share the exercise.'; }
});
$('save').addEventListener('click', () => {
  if (saved.length >= 40) { feedback.textContent = 'You have 40 saved exercises. Delete one to make room.'; return; }
  const name = $('save-name').value.trim() || `${settings().meter} · Level ${settings().level + 1} · ${bpm} BPM`;
  saved.push({ id: `${Date.now()}-${freshSeed()}`, name, settings: settings(), bpm,
    indices: visibleIndices(), practice: capturePractice() });
  if (persist()) feedback.textContent = `Saved “${name}” in this browser.`;
});
$('load').addEventListener('click', () => {
  const entry = saved.find((item) => item.id === $('saved').value); if (!entry) return;
  stop(); if (mode === 'read') mode = 'generate';
  apply(entry.settings); regenerate(); setBpm(entry.bpm || 80);
  drill = customBars(entry.indices); if (drill) { pattern = drill; idleScore(); }
  restorePractice(entry.practice);
  feedback.textContent = `Loaded “${entry.name}”.`;
});
$('delete').addEventListener('click', () => { saved = saved.filter((entry) => entry.id !== $('saved').value); persist(); });
document.addEventListener('keydown', (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')
    || event.target.closest('input,select,textarea,button,a,summary,[contenteditable]')) return;
  if (event.code === 'KeyJ' && mode === 'play' || event.code === 'Space' && mode === 'play' && engine?.running) {
    event.preventDefault(); tap(event.timeStamp);
  } else if (event.code === 'Space') { event.preventDefault(); start(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && (starting || engine?.running)) stop('Playback paused while this page was in the background.'); });
window.addEventListener('pagehide', () => { stop(); engine?.dispose(); engine = undefined; });
new ResizeObserver(([entry]) => {
  if (Math.abs(entry.contentRect.width - lastWidth) < 1) return;
  lastWidth = entry.contentRect.width;
  if (activeSerial !== null && engine?.running) runningScore(activeSerial); else idleScore();
}).observe(canvas);
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  saved = Array.isArray(stored) ? stored.filter((entry) => entry && typeof entry.id === 'string' && typeof entry.name === 'string' && entry.settings).slice(0, 40) : [];
  $('offset').value = String(Math.max(-250, Math.min(250, Number(localStorage.getItem('dave-drums-rhythm-offset')) || 0)));
} catch { saved = []; }
const params = new URLSearchParams(window.location.search);
if (params.has('seed')) apply(Object.fromEntries(params));
setBpm(params.has('bpm') ? params.get('bpm') : 80);
$('controls').disabled = false;
regenerate();
if (params.has('take')) {
  drill = customBars(params.get('take').split(',').map(Number));
  if (drill) { pattern = drill; idleScore(); }
}
savedList();
