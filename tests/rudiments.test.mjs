// Dependency-free musical data, engraving and transport regression checks.
// Run: node tests/rudiments.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceURL = async (name) => `data:text/javascript;base64,${Buffer.from(
  (await readFile(new URL(`../assets/${name}.js`, import.meta.url), 'utf8')).replaceAll('import.meta.url', JSON.stringify(new URL(`../assets/${name}.js`, import.meta.url).href)),
).toString('base64')}`;
const moduleFrom = async (name) => import(await sourceURL(name));
const { RUDIMENTS, withLead } = await moduleFrom('rudiments-data');
const { RudimentEngine, strokeEvents, rampTempo, compileTimeline } = await moduleFrom('rudiments-engine');
const { renderNotation, layoutNotation } = await moduleFrom('rudiments-notation');
const results = [];
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-7, `${message}: ${actual} vs ${expected}`);

// Independent reference transcriptions from the inspected official figures.
// [hands, tick durations (quarter=96), accents, flam positions, drag positions]
const fill = (count, value) => Array(count).fill(value);
const expected = [
  ['RLRLRLRL', fill(8,12), []],
  ['RLRLRLRL', [16,16,16,48,16,16,16,48], []],
  ['RLRLRLR', [...fill(6,16),96], []],
  ['RLRLRLRL', fill(8,48), []],
  ['RRRLLLRRRLLL', fill(12,16), []],
  ['RRLLRRLLRRLLRRLL', fill(16,12), []],
  ['RRLLRLLRRL', [12,12,12,12,48,12,12,12,12,48], [4,9]],
  ['RLLRRLRLLRRL', [24,12,12,12,12,24,24,12,12,12,12,24], [0,5,6,11]],
  ['RRLLRRLRRLLRRL', [12,12,12,12,12,12,24,12,12,12,12,12,12,24], [6,13]],
  ['RRLLRRLLRLLRRLLRRL', [...fill(8,12),96,...fill(8,12),96], [8,17]],
  ['RRLLRRLLRL', [...fill(8,12),24,24,48], [8,9]],
  ['RRLLRRLLRRL', [...fill(10,12),24,48], [10]],
  ['RRLLRRLLRRLLRLLRRLLRRLLRRL', [...fill(12,12),48,...fill(12,12),48], [12,25]],
  ['RRLLRRLLRRLLRRL', [...fill(14,12),24], [14]],
  ['RRLLRRLLRRLLRRLLRLLRRLLRRLLRRLLRRL', [...fill(16,12),96,...fill(16,12),96], [16,33]],
  ['RLRRLRLL', fill(8,24), [0,4]],
  ['RLRLRRLRLRLL', fill(12,24), [0,6]],
  ['RLRLRLRRLRLRLRLL', fill(16,24), [0,8]],
  ['RLRRLLRLRRLL', fill(12,24), [0,6]],
  ['RL', [96,96], [], [0,1]],
  ['RLRLRL', fill(6,48), [0,3], [0,3]],
  ['RRLLRRLL', fill(8,24), [0,2,4,6], [0,2,4,6]],
  ['RLRLR', [24,24,24,24,96], [1], [0,4]],
  ['RLRRLRLL', fill(8,24), [0,4], [0,4]],
  ['RRLRLLRL', fill(8,24), [0,4], [0,4]],
  ['RLRRLLLRLLRR', fill(12,24), [0,6], [0,6]],
  ['RLRLRLRL', fill(8,24), [0,3,4,7], [0,3,4,7]],
  ['RRLRRLRRLRRL', fill(12,16), [0,3,6,9], [0,3,6,9]],
  ['RLLRRLLR', fill(8,24), [0,2,4,6], [0,2,4,6]],
  ['RLLRLRRL', [48,24,24,48,48,24,24,48], [0,4], [0,4]],
  ['RL', [96,96], [], [], [0,1]],
  ['RLLR', fill(4,48), [1,3], [], [0,2]],
  ['RRLLLR', fill(6,48), [2,5], [], [0,1,3,4]],
  ['RLRRLR', [24,24,48,24,24,48], [2,5], [], [0,3]],
  ['RRLRRLLRLL', [12,12,24,24,24,12,12,24,24,24], [0,5]],
  ['RRLRRLLRLL', [48,24,24,24,24,48,24,24,24,24], [0,5], [], [1,6]],
  ['RRRLRRLLLRLL', [48,48,24,24,24,24,48,48,24,24,24,24], [0,6], [], [1,2,7,8]],
  ['RLRLLRLR', [16,16,16,48,16,16,16,48], [3,7], [], [0,4]],
  ['RRLRLLLRLR', [48,16,16,16,48,48,16,16,16,48], [4,9], [], [0,1,5,6]],
  ['RRRLRLLLLRLR', [48,48,16,16,16,48,48,48,16,16,16,48], [5,11], [], [0,1,2,6,7,8]],
];
assert.equal(RUDIMENTS.length, 40);
assert.deepEqual(RUDIMENTS.map((r) => r.pas), Array.from({ length: 40 }, (_, i) => i + 1));
assert.equal(new Set(RUDIMENTS.map((r) => r.id)).size, 40);
assert.deepEqual(['Roll rudiments','Diddle rudiments','Flam rudiments','Drag rudiments']
  .map((family) => RUDIMENTS.filter((r) => r.category === family).length), [15,4,11,10]);
RUDIMENTS.forEach((r, i) => {
  assert.equal(r.notes.map((n) => n.hand).join(''), expected[i][0], r.name);
  assert.deepEqual(r.notes.map((n) => n.ticks), expected[i][1], r.name);
  assert.deepEqual(r.notes.flatMap((n, j) => n.accent ? [j] : []), expected[i][2], r.name);
  assert.deepEqual(r.notes.flatMap((n, j) => n.grace.length === 1 ? [j] : []), expected[i][3] || [], r.name);
  assert.deepEqual(r.notes.flatMap((n, j) => n.grace.length === 2 ? [j] : []), expected[i][4] || [], r.name);
  near(r.notes.reduce((sum, n) => sum + n.beats, 0), r.meter[0] * 4 / r.meter[1], 'Meter matches note durations');
  const reversed = withLead(r, 'L');
  assert.deepEqual(withLead(reversed, 'L').notes, r.notes);
  r.notes.forEach((n) => {
    near(n.beats, 4 / n.value * (n.tuplet ? 2 / 3 : 1) * (n.dot ? 1.5 : 1), 'Notated duration matches audio');
    assert.ok(Number.isInteger(n.ticks) && n.ticks > 0);
    n.grace.forEach((h) => assert.notEqual(h, n.hand));
  });
});
results.push('All 40 PAS IDs, reference stickings, exact durations, accents, ornaments, meters and lead reversal');
const dottedTimeline = compileTimeline({ meter: [3,4], notes: [{ticks:72}, {ticks:24}, {ticks:48}, {ticks:72}, {ticks:24}, {ticks:48}] });
assert.ok(dottedTimeline.points.some((point) => point.ticks === 192 && point.click && point.index === undefined),
  'Quarter clicks continue independently of held dotted notes');
assert.deepEqual(RUDIMENTS.filter((r) => r.notes.some((n) => n.buzz)).map((r) => r.pas), [4]);
const buzz = strokeEvents(RUDIMENTS[3].notes[0], 1, 80, 0);
assert.equal(buzz.length, 1, 'Buzz hand-change pulse does not pretend to count rebounds');
assert.equal(buzz[0].buzz, true);
near(buzz[0].duration, 0.375, 'Buzz texture fills the hand-change pulse');

for (const bpm of [40, 80, 240]) {
  for (const r of RUDIMENTS) {
    for (const n of r.notes) {
      const events = strokeEvents(n, 1, bpm, 0);
      if (!n.hand) { assert.deepEqual(events, [], 'Rests are silent'); continue; }
      assert.equal(events.at(-1).time, 1);
      assert.equal(events.at(-1).hand, n.hand);
      events.slice(0, -1).forEach((e, i) => {
        assert.ok(e.time < 1 && e.time > 0.95);
        assert.ok(e.velocity < events.at(-1).velocity);
        assert.ok(e.time < events[i + 1].time);
      });
    }
  }
}
assert.ok(strokeEvents(RUDIMENTS[15].notes[0], 0, 80, 0)[0].velocity > strokeEvents(RUDIMENTS[15].notes[1], 0, 80, 1)[0].velocity);
assert.deepEqual(Array.from({ length: 14 }, (_, n) => rampTempo(80, 92, 5, 4, n)),
  [80, 80, 80, 80, 85, 85, 85, 85, 90, 90, 90, 90, 92, 92]);
results.push('Grace notes precede main beats at all tempo extremes; accents are stronger; ramp clamps to target');

function audioNode() {
  return { gain: { value: 0, setValueAtTime(value) { this.value = value; }, cancelScheduledValues() {}, exponentialRampToValueAtTime() {} },
    pan: {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    connect(target) { this.target = target; return target; }, disconnect() { this.disconnected = true; },
    start(time) { this.startTime = time; }, stop(time) { this.stopTime = time; if (time === undefined) this.onended?.(); } };
}
function context() {
  return { currentTime: 0, sampleRate: 48000, state: 'running', destination: {},
    createGain: audioNode, createStereoPanner: audioNode, createBufferSource: audioNode,
    createBiquadFilter: audioNode, createOscillator: audioNode,
    decodeAudioData: async () => ({ duration: 0.1 }),
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) }), close() { this.state = 'closed'; } };
}
const saved = Object.fromEntries(['setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'document', 'window', 'ResizeObserver', 'fetch', 'performance'].map((key) => [key, globalThis[key]]));
try {
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  globalThis.setInterval = () => 1;
  globalThis.clearInterval = () => {};
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  for (const r of RUDIMENTS) {
    for (const bpm of [40, 80, 240]) {
      const c = context();
      const hits = [], clicks = [];
      const engine = new RudimentEngine(c, { visual() {}, interrupted(message) { throw new Error(message); } });
      engine.hit = (time, hand, velocity) => hits.push({ time, hand, velocity });
      engine.hitBuzz = (time, hand, velocity) => hits.push({ time, hand, velocity });
      engine.click = (time, accent) => clicks.push({ time, accent });
      const length = r.notes.reduce((sum, n) => sum + n.ticks, 0) / 96;
      engine.start(r, bpm, { click: () => true, volume: 0.7 });
      const duration = 0.16 + 20 * length * 60 / bpm;
      for (let now = 0.025; now < duration; now += 0.025) { c.currentTime = now; engine.tick(); }
      const mains = hits.filter((hit) => hit.velocity >= 0.62);
      const attacks = r.notes.map((note, index) => ({note,index})).filter(({note}) => note.hand);
      const offsets = [];
      let offset = 0;
      for (const note of r.notes) { offsets.push(offset); offset += note.ticks; }
      mains.forEach((hit, i) => {
        const cycle = Math.floor(i / attacks.length), index = attacks[i % attacks.length].index;
        near(hit.time, 0.16 + (cycle * offset + offsets[index]) / 96 * 60 / bpm, `${r.name}: no metrical drift across loops`);
        assert.equal(hit.hand, r.notes[index].hand);
      });
      clicks.forEach((click, i) => {
        near(click.time, 0.16 + i * 60 / bpm, 'Quarter-note click alignment');
        assert.equal(click.accent, i % length === 0);
      });
      assert.ok(mains.length >= 20 * attacks.length);
      engine.stop();
      const count = hits.length;
      c.currentTime += 5;
      engine.tick();
      assert.equal(hits.length, count, 'Stop cancels future scheduling');
      assert.equal(engine.queue.length, 0);
    }
  }
  results.push('Every rudiment loops seamlessly at 40, 80 and 240 BPM; clicks align; Stop cancels the queue');

  const c = context(), tempos = [];
  const ramp = new RudimentEngine(c, { visual() {}, interrupted(message) { throw new Error(message); } });
  ramp.hit = (time) => tempos.push({ time, bpm: ramp.bpm, completed: ramp.completed });
  ramp.click = () => {};
  ramp.start(RUDIMENTS[0], 200, { volume: 0.7, click: () => false,
    ramp: { start: 80, target: 92, increase: 5, every: 4 } });
  for (let now = 0.025; now < 23; now += 0.025) { c.currentTime = now; ramp.tick(); }
  for (const event of tempos) assert.equal(event.bpm, rampTempo(80, 92, 5, 4, event.completed));
  assert.ok(tempos.some((e) => e.bpm === 92));
  ramp.stop();
  const changed = [];
  ramp.hit = (time) => changed.push(time);
  c.currentTime = 0;
  ramp.start(RUDIMENTS[0], 80, { volume: 0.7, click: () => false });
  for (let now = 0.025; now <= 0.3; now += 0.025) { c.currentTime = now; ramp.tick(); }
  ramp.requestedBpm = 120;
  for (let now = 0.325; now < 3; now += 0.025) { c.currentTime = now; ramp.tick(); }
  assert.ok(changed.some((time, i) => i > 0 && Math.abs(time - changed[i - 1] - 0.0625) < 1e-7));
  near(changed.at(-1) - changed.at(-2), 0.0625, 'Live tempo change without resetting phase');
  ramp.stop();
  results.push('Ramp changes after complete repetitions and holds target; live tempo changes preserve transport');

  const live = new RudimentEngine(context(), { visual() {}, interrupted() {} });
  const fetched = [];
  globalThis.fetch = async (url) => {
    fetched.push(url.pathname.split('/').at(-1));
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  };
  await Promise.all([live.prepareClick(), live.prepareClick()]);
  await live.prepareClick();
  assert.deepEqual(fetched, ['metronome-normal.mp3', 'metronome-high.mp3'], 'Sample preparation is cached, including concurrent starts');
  const clicks = [];
  const originalTrack = live.track;
  live.track = (source, nodes, end) => clicks.push({source, gain:nodes[0].gain.value, end});
  live.click(1, true);
  live.click(2, false);
  assert.equal(clicks[0].source.buffer, live.clickSamples.high);
  assert.equal(clicks[1].source.buffer, live.clickSamples.normal);
  assert.deepEqual(clicks.map((click) => click.gain), [0.48,0.3], 'Louder click retains the downbeat/normal emphasis ratio');
  live.track = originalTrack;
  live.hit(1, 'R', 1);
  live.hit(1.2, 'L', 0.27);
  live.click(1, true);
  live.hitBuzz(1.3, 'R', 0.62, 0.375);
  assert.equal(live.sources.size, 6);
  live.stop();
  assert.equal(live.sources.size, 0, 'All synth and click sources stopped');
  live.dispose();
  assert.equal(live.context.state, 'closed');
  let interruption;
  const lag = new RudimentEngine(context(), { visual() {}, interrupted(message) { interruption = message; lag.stop(); } });
  lag.hit = () => {};
  lag.start(RUDIMENTS[7], 80, { volume: 0.7, click: () => false });
  lag.context.currentTime = 3;
  lag.tick();
  assert.ok(interruption.includes('interruption'));
  assert.equal(lag.running, false);
  results.push('Synth/click node cleanup, context disposal and safe interruption after scheduler stalls');

  // Verify actual engraving output rather than maintaining snapshots of code.
  class Element {
    constructor(tag) {
      this.tag = tag; this.attrs = {}; this.children = []; this.listeners = {};
      this.value = ''; this.clientWidth = 800;
      this.classList = { add() {}, remove() {} };
    }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    append(...nodes) {
      this.children.push(...nodes);
      if (this.tag === 'select' && !this.value && this.children[0]) this.value = this.children[0].value;
    }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener(event, listener) { this.listeners[event] = listener; }
    closest() { return ['input', 'select', 'button', 'textarea', 'a', 'summary'].includes(this.tag) ? this : null; }
    querySelector() { return null; }
    focus() { this.focused = true; }
    reportValidity() {
      return this.value !== '' && Number.isInteger(+this.value)
        && +this.value >= +(this.attrs.min ?? -Infinity) && +this.value <= +(this.attrs.max ?? Infinity);
    }
  }
  globalThis.document = { createElementNS: (_, tag) => new Element(tag) };
  const descendants = (node) => [node, ...node.children.flatMap(descendants)];
  for (const r of RUDIMENTS) {
    for (const width of [230, 375, 600, 960]) {
      const container = new Element('div');
      container.clientWidth = width;
      renderNotation(container, r);
      const tree = descendants(container.children[0]);
      const layout = layoutNotation(r, width);
      assert.ok(layout.rows.length <= 2, `${r.name}: no fragmented trailing systems`);
      assert.deepEqual(layout.rows.flatMap(row=>row.groups.flatMap(group=>group.items.map(item=>item.index))),
        r.notes.map((_,index)=>index), `${r.name}: every note stays in order across the split`);
      if (layout.rows.length === 2) near(layout.rows[0].end,layout.rows[1].end,`${r.name}: balanced staff widths`);
      for (const row of layout.rows) {
        assert.ok(row.end + 8 < layout.width, `${r.name}: repeat/bar line fits the system`);
        for (const group of row.groups) if (group.tuplet) {
          assert.equal(group.items.reduce((sum, item) => sum + item.note.ticks, 0), group.span,
            `${r.name}: complete tuplet group survives system wrapping`);
        }
      }
      const strokes = tree.filter((e) => e.attrs['data-stroke']);
      assert.equal(strokes.length, r.notes.reduce((sum, n) => sum + n.grace.length + 1, 0));
      assert.equal(new Set(strokes.map((s) => s.attrs['data-stroke'])).size, strokes.length);
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-accent').length, r.notes.filter((n) => n.accent).length);
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-slur').length, r.notes.filter((n) => n.grace.length).length);
      const expectedTuplets = { 2:2, 3:1, 5:4, 28:4, 38:2, 39:2, 40:2 };
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-tuplet').length, expectedTuplets[r.pas] || 0);
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-dot').length, 0);
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-buzz-mark').length, r.pas === 4 ? 8 : 0);
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-end-bar').length, 1);
      assert.equal(tree.filter((e) => e.tag === 'circle' && !e.attrs.class).length, 0, 'No repeat dots');
      assert.equal(tree.filter((e) => e.attrs.class === 'rud-rest-flag').length, [11,12].includes(r.pas) ? 1 : 0, 'PAS eighth rests are engraved');
      const [x, y, scoreWidth, scoreHeight] = container.children[0].attrs.viewBox.split(' ').map(Number);
      assert.equal(x + y, 0);
      tree.filter((e) => e.tag === 'ellipse').forEach((e) => {
        assert.ok(+e.attrs.cx - +e.attrs.rx >= 0 && +e.attrs.cx + +e.attrs.rx < scoreWidth);
        assert.ok(+e.attrs.cy + +e.attrs.ry < scoreHeight);
      });
    }
  }
  results.push('Notation output for all patterns at four widths: every main/grace stroke, accent, slur and in-bounds notehead');
  {
    const engine = new RudimentEngine(context(), { visual() {}, interrupted() {} });
    engine.hit(1, 'R', 0.7);
    engine.hitBuzz(1, 'L', 0.7, 0.4);
    const reachesDrumBus = (source) => {
      for (let node = source; node; node = node.target) if (node === engine.drums) return true;
      return false;
    };
    assert.ok([...engine.sources].every(reachesDrumBus), 'Both ordinary strokes and buzz rolls use the drum mute bus');
    const existing = new Set(engine.sources);
    await engine.prepareClick();
    engine.click(1, true);
    const click = [...engine.sources].find((source) => !existing.has(source));
    assert.equal(reachesDrumBus(click), false, 'The click bypasses the drum mute bus');
    assert.equal(click.target.target, engine.master);
    engine.setDrumsEnabled(false);
    assert.equal(engine.drums.gain.value, 0);
    engine.dispose();
    assert.equal(engine.drums.disconnected, true);
    results.push('Drum mute covers ordinary strokes and buzz rolls while leaving the click on its own audio path');
  }
  for (const number of [1,2,3,7,8,16,20,21,22,23,24,30,31,32,38]) {
    assert.equal(layoutNotation(RUDIMENTS[number-1],230).rows.length,1,`PAS ${number}: standard figures remain one line on mobile`);
  }
  for (const [number,count] of [[10,9],[13,13],[15,17],[18,8],[37,6],[40,6]]) {
    assert.deepEqual(layoutNotation(RUDIMENTS[number-1],375).rows.map(row=>row.groups.reduce((sum,g)=>sum+g.items.length,0)),[count,count],
      `PAS ${number}: dense phrases split into equal musical halves`);
  }

  // Exercise the real controller against a small DOM/audio fixture. This is
  // intentionally separate from browser layout, autoplay and device testing.
  const html = await readFile(new URL('../rudiments/index.html', import.meta.url), 'utf8');
  let clock = 0;
  let intervalId = 0;
  const intervals = new Map();
  globalThis.performance = { now: () => clock };
  globalThis.setInterval = (callback) => { intervals.set(++intervalId, callback); return intervalId; };
  globalThis.clearInterval = (id) => intervals.delete(id);
  const elements = new Map();
  for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
    const el = new Element(match[1]);
    for (const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) el.attrs[attr[1]] = attr[2];
    el.value = el.attrs.value || '';
    el.checked = 'checked' in el.attrs;
    el.disabled = 'disabled' in el.attrs;
    elements.set(match[3], el);
  }
  const docListeners = {}, windowListeners = {};
  globalThis.document = {
    hidden: false, createElement: (tag) => new Element(tag), createElementNS: (_, tag) => new Element(tag),
    getElementById: (id) => elements.get(id),
    querySelector: () => null,
    querySelectorAll: (query) => query === '[data-ramp-field]'
      ? [...elements.values()].filter((el) => 'data-ramp-field' in el.attrs) : [],
    addEventListener: (event, listener) => { docListeners[event] = listener; },
  };
  globalThis.window = { AudioContext: class {
    constructor() { Object.assign(this, context()); }
    async resume() { this.state = 'running'; }
  }, addEventListener: (event, listener) => { windowListeners[event] = listener; } };
  globalThis.ResizeObserver = class { observe() {} };
  let controllerEngine;
  const originalStart = RudimentEngine.prototype.start;
  RudimentEngine.prototype.start = function(...args) { controllerEngine = this; return originalStart.apply(this,args); };
  let controller = await readFile(new URL('../assets/rudiments.js', import.meta.url), 'utf8');
  for (const name of ['rudiments-data', 'rudiments-engine', 'rudiments-notation', 'tempo-stepper', 'playback-timer']) {
    controller = controller.replace(`'./${name}.js'`, `'${await sourceURL(name)}'`);
  }
  await import(`data:text/javascript;base64,${Buffer.from(controller).toString('base64')}`);
  const get = (id) => elements.get(`rud-${id}`);
  assert.equal(get('ramp-status').textContent,'Speed trainer inactive');
  assert.equal(descendants(get('select')).filter((el) => el.tag === 'option').length, 40);
  assert.equal(get('controls').disabled, false);
  assert.equal(get('bpm').value, '80');
  get('previous').listeners.click();
  assert.equal(get('select').value, RUDIMENTS.at(-1).id, 'Previous wraps to last rudiment');
  get('next').listeners.click();
  assert.equal(get('select').value, RUDIMENTS[0].id, 'Next wraps to first rudiment');
  get('next').listeners.click();
  assert.equal(get('select').value, RUDIMENTS[1].id);
  assert.equal(get('right').attrs['aria-pressed'], 'true');
  assert.equal(get('left').attrs['aria-pressed'], 'false');
  assert.equal(elements.has('rud-volume'), false);
  get('click').listeners.click(); assert.equal(get('click').attrs['aria-pressed'], 'false');
  assert.ok(get('click-icon').attrs.href.endsWith('#speaker-off'));
  assert.equal(get('click').attrs.title, 'Unmute metronome');
  get('click').listeners.click(); assert.equal(get('click').attrs['aria-pressed'], 'true');
  const originalRandom = Math.random;
  try {
    for (const [index, hand] of [[0,'R'],[39,'L'],[16,'L'],[16,'R']]) {
      get(hand === 'R' ? 'right' : 'left').listeners.click();
      let calls = 0;
      Math.random = () => { calls++; return (index + 0.5) / 40; };
      get('random').listeners.click();
      assert.equal(calls, 1, 'Random selects only a rudiment');
      assert.equal(get('select').value, RUDIMENTS[index].id);
      assert.equal(get(hand === 'R' ? 'right' : 'left').attrs['aria-pressed'], 'true', 'Random preserves the lead');
      assert.equal(get('name').textContent, RUDIMENTS[index].name);
    }
  } finally { Math.random = originalRandom; }
  for (const r of RUDIMENTS) {
    get('select').value = r.id;
    get('select').listeners.change();
    assert.equal(get('name').textContent, r.name);
    assert.equal(get('rhythm-note').textContent, r.rhythm);
    assert.ok(descendants(get('notation')).some((el) => el.attrs['data-stroke'] === '0:main'));
  }
  get('left').listeners.click();
  const leftMain = descendants(get('notation')).find((el) => el.attrs['data-stroke'] === '0:main');
  assert.equal(leftMain.children.find((el) => el.attrs.class === 'rud-sticking').textContent, 'L');
  get('plus').listeners.click(); assert.equal(get('bpm').value, '85');
  get('minus').listeners.click(); assert.equal(get('bpm').value, '80');
  await get('play').listeners.click();
  assert.equal(get('play-label').textContent, '0:00');
  assert.ok(get('play-icon').attrs.href.endsWith('#stop'));
  assert.equal(get('play').attrs['aria-label'], 'Stop playback');
  clock = 61250;
  for (const tick of intervals.values()) tick();
  assert.equal(get('play-label').textContent, '1:01', 'Timer counts elapsed minutes and seconds');
  assert.equal(controllerEngine.options.volume, 1, 'Rudiments always starts at maximum volume');
  assert.equal(controllerEngine.drums.target, controllerEngine.master, 'Drum sound has a separate audio bus');
  assert.equal(controllerEngine.drums.gain.value, 0.8);
  get('drums').listeners.click();
  assert.equal(get('drums').attrs['aria-pressed'], 'false');
  assert.equal(controllerEngine.drums.gain.value, 0, 'Muting silences scheduled drum sounds');
  assert.equal(controllerEngine.master.gain.value, 1, 'The click remains audible');
  assert.equal(controllerEngine.running, true, 'Muting preserves playback and notation timing');
  assert.ok(get('drums-icon').attrs.href.endsWith('#speaker-off'));
  assert.equal(controllerEngine.options.click(), true);
  get('click').listeners.click(); assert.equal(controllerEngine.options.click(), false);
  get('click').listeners.click(); assert.equal(controllerEngine.options.click(), true);
  get('slider').value = '100'; get('slider').listeners.input();
  assert.equal(get('bpm').value, '100');
  document.hidden = true; docListeners.visibilitychange();
  assert.equal(get('play-label').textContent, 'Start');
  assert.equal(intervals.size, 0, 'Background stop cancels the elapsed timer and scheduler');
  assert.ok(get('feedback').textContent.includes('background'));
  document.hidden = false;
  get('ramp').checked = true; get('ramp').listeners.change();
  assert.equal(get('ramp-status').textContent,'Speed trainer active');
  get('target').value = '60';
  await get('play').listeners.click();
  assert.ok(get('feedback').textContent.includes('Target BPM'));
  assert.equal(get('play-label').textContent, 'Start');
  get('target').value = '';
  await get('play').listeners.click();
  assert.equal(get('play-label').textContent, 'Start');
  get('target').value = '120';
  await get('play').listeners.click();
  assert.equal(get('play-label').textContent, '0:00', 'Restart resets the elapsed timer');
  assert.equal(controllerEngine.drums.gain.value, 0, 'The selected mute state survives restart');
  get('drums').listeners.click();
  assert.equal(controllerEngine.drums.gain.value, 0.8, 'Unmuting restores the quieter drum level');
  assert.equal(get('slider').disabled, true);
  assert.equal(get('target').disabled, true);
  assert.equal(get('ramp-status').textContent,'Speed trainer active');
  for (const [completed, expected] of [[0,1],[1,2],[2,3],[3,4],[4,1],[5,2]]) {
    controllerEngine.visual({key:'0:main',completed,bpm:completed>=4?85:80});
    assert.equal(get('cycle').textContent, `Repetition ${expected} of 4`);
  }
  get('select').listeners.change();
  assert.equal(get('cycle').textContent, 'Repetition 0 of 4');
  assert.equal(get('play-label').textContent, 'Start');
  assert.equal(get('slider').disabled, false);
  let prevented = false;
  const space = { code: 'Space', target: new Element('input'), preventDefault() { prevented = true; } };
  docListeners.keydown(space); assert.equal(prevented, false);
  space.target = new Element('div'); docListeners.keydown(space);
  await new Promise(setImmediate);
  assert.equal(prevented, true);
  assert.equal(get('play-label').textContent, '0:00');
  assert.ok(get('play-icon').attrs.href.endsWith('#stop'));
  await get('play').listeners.click();
  assert.equal(get('play-label').textContent, 'Start');
  assert.equal(intervals.size, 0, 'Rapid Start/Stop leaves no elapsed timer running');
  // Rapid Start/Stop cancels a pending resume rather than starting later.
  const pending = get('play').listeners.click();
  await get('play').listeners.click();
  await pending;
  assert.equal(get('play-label').textContent, 'Start');
  RudimentEngine.prototype.start = originalStart;
  windowListeners.pagehide();
  results.push('Controller initialization, selection/lead, tempo, ramp validation/locking, background pause, Space focus guard and rapid Start/Stop');
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}

export { results };
console.log(results.map((result) => `PASS: ${result}`).join('\n'));
