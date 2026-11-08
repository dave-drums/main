// Interaction/lifecycle checks in a controlled DOM; this does not simulate browser rendering.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const script = await readFile(new URL('../assets/experience.js', import.meta.url), 'utf8');
const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

async function fixture({ reduced = false, fine = true, audio = true, animate = true } = {}) {
  const dom = new JSDOM(await readFile(new URL('../index.html', import.meta.url), 'utf8'), {
    url: 'https://www.davedrums.com.au/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, d = w.document, media = new Map(), frames = new Map(), timers = new Map();
  let id = 0, clock = 0, contexts = [];
  const animations = [];
  w.matchMedia = query => {
    if (!media.has(query)) {
      const listeners = new Set();
      media.set(query, { matches: query.includes('reduced-motion') ? reduced : fine,
        addEventListener: (_, callback) => listeners.add(callback),
        change(matches) { this.matches = matches; listeners.forEach(callback => callback()); }
      });
    }
    return media.get(query);
  };
  w.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  w.cancelAnimationFrame = key => frames.delete(key);
  w.setTimeout = (callback, delay = 0) => { timers.set(++id, { callback, time: clock + delay }); return id; };
  w.clearTimeout = key => timers.delete(key);
  w.ResizeObserver = class { observe() {} };
  Object.defineProperty(d.documentElement, 'scrollHeight', { value: 2400 });
  w.Element.prototype.getBoundingClientRect = function () {
    return { top: 0, bottom: 600, left: 0, right: 900, width: 900, height: 600 };
  };
  w.Element.prototype.animate = function (keyframes) {
    const animation = { element: this, frames: keyframes, cancelled: false,
      pause() {}, cancel() { this.cancelled = true; },
      effect: { setKeyframes(value) { animation.frames = value; } }
    };
    animations.push(animation);
    return animation;
  };
  const param = () => ({ value: 0, setValueAtTime(value, time) {
    assert.ok(Number.isFinite(value) && Number.isFinite(time));
  }, exponentialRampToValueAtTime(value, time) {
    assert.ok(value > 0 && Number.isFinite(time));
  } });
  const node = () => ({ disconnected: false, connect() {}, disconnect() { this.disconnected = true; } });
  w.AudioContext = class {
    constructor() {
      this.state = 'suspended'; this.sampleRate = 44100; this.destination = node(); this.sources = [];
      contexts.push(this);
    }
    get currentTime() { return clock / 1000; }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; this.sources.forEach(source => source.onended?.()); }
    createGain() { return { ...node(), gain: param() }; }
    createDynamicsCompressor() { return { ...node(), threshold: param(), ratio: param() }; }
    createBuffer(_, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBiquadFilter() { return { ...node(), frequency: param() }; }
    createSource() {
      const source = { ...node(), frequency: param(), stops: [],
        start(time) { this.startTime = time; },
        stop(time) { this.stops.push(time); if (time === undefined) this.onended?.(); }
      };
      this.sources.push(source);
      return source;
    }
    createOscillator() { return this.createSource(); }
    createBufferSource() { return this.createSource(); }
  };
  if (!audio) delete w.AudioContext;
  if (!animate) delete w.Element.prototype.animate;
  w.eval(script);
  const flushFrames = () => {
    let iterations = 0;
    while (frames.size) {
      assert.ok(iterations++ < 120, 'Motion settles rather than running an idle animation loop');
      const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback(clock));
    }
  };
  const advance = duration => {
    const end = clock + duration;
    while (true) {
      const entry = [...timers].sort((a, b) => a[1].time - b[1].time)[0];
      if (!entry || entry[1].time > end) break;
      clock = entry[1].time; timers.delete(entry[0]); entry[1].callback();
    }
    clock = end;
  };
  return { dom, w, d, media, frames, timers, animations, contexts, flushFrames, advance };
}

for (const reduced of [false, true]) {
  const f = await fixture({ reduced });
  try {
    const { d, w, contexts } = f;
    const trigger = d.querySelector('.rhythm-trigger'), panel = d.querySelector('.rhythm-panel');
    const pads = [...d.querySelectorAll('[data-pad]')], demo = d.querySelector('.rhythm-demo');
    assert.deepEqual(pads.map(pad=>pad.dataset.pad),['kick','snare','hat']);
    assert.equal(d.querySelector('.rhythm-key-hint').textContent,'Keys 1–3');
    f.flushFrames();
    assert.equal(contexts.length, 0, 'Loading the page never starts audio');
    trigger.click();
    assert.equal(panel.hidden, false);
    assert.equal(contexts.length, 0, 'Opening the instrument does not start audio');
    pads[0].click(); await tick();
    assert.equal(contexts.length, 1);
    assert.equal(contexts[0].sources.length, 1);
    assert.ok(pads[0].classList.contains('is-hit'));
    f.advance(150); assert.ok(!pads[0].classList.contains('is-hit'));
    d.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: '2', bubbles: true })); await tick();
    assert.equal(contexts[0].sources.length, 1, 'Shortcuts do not hijack the rest of the page');
    pads[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: '2', bubbles: true })); await tick();
    assert.equal(contexts[0].sources.length, 3, 'Snare combines a tonal body with filtered noise');
    pads[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: '2', bubbles: true, repeat: true })); await tick();
    assert.equal(contexts[0].sources.length, 3, 'Held keys do not repeatedly retrigger the pads');
    pads[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: '4', bubbles: true })); await tick();
    assert.equal(contexts[0].sources.length, 3, 'The removed fourth shortcut does nothing');
    const beforeDemo = contexts[0].sources.length;
    demo.click(); await tick();
    assert.equal(demo.getAttribute('aria-pressed'), 'true');
    const sources = contexts[0].sources.slice(beforeDemo);
    assert.equal(sources.length, 29, 'Two bars are scheduled once on the audio clock');
    assert.ok(sources.some(source => Math.abs(source.startTime - sources[0].startTime - .3125) < 1e-8));
    demo.click();
    assert.equal(demo.getAttribute('aria-pressed'), 'false');
    assert.ok(sources.every(source => source.stops.at(-1) === undefined), 'Stop cancels already-scheduled voices');
    assert.equal(f.timers.size, 0);
    const stoppedCount = contexts[0].sources.length;
    demo.click(); demo.click(); await tick();
    assert.equal(contexts[0].sources.length, stoppedCount, 'Stopping before audio resumes cancels a pending start');
    demo.click(); await tick(); f.advance(5500);
    assert.equal(demo.getAttribute('aria-pressed'), 'false', 'The two-bar demo ends automatically');
    assert.equal(f.timers.size, 0);
    pads[1].focus();
    pads[1].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(panel.hidden, true); assert.equal(d.activeElement, trigger);
    assert.equal(contexts[0].state, 'closed', 'Closing releases the audio device');
    trigger.click(); pads[2].click(); await tick();
    Object.defineProperty(d, 'hidden', { value: true, configurable: true });
    d.dispatchEvent(new w.Event('visibilitychange'));
    assert.equal(contexts[1].state, 'closed', 'Switching away stops sound');
    assert.equal(f.timers.size, 0);
    assert.equal(d.querySelectorAll('[style]').length, 0);
    if (reduced) assert.equal(f.animations.length, 0, 'Reduced motion keeps the instrument fully usable without animation');
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(f.frames.size, 0, 'Leaving the page cancels every motion frame');
  } finally { f.dom.window.close(); }
}

for (const settings of [{ audio: false }, { fine: false, animate: false }]) {
  const f = await fixture(settings);
  try {
    f.flushFrames();
    if (settings.audio === false) assert.equal(f.d.querySelector('[data-rhythm]').hidden, true, 'Unsupported audio leaves no dead controls');
    else {
      f.d.querySelector('.rhythm-trigger').click();
      f.d.querySelector('[data-pad]').click(); await tick();
      assert.equal(f.contexts[0].sources.length, 1, 'Touch and animation-free browsers retain the instrument');
      f.w.dispatchEvent(new f.w.Event('pagehide'));
    }
    if (settings.animate === false) assert.equal(f.animations.length, 0);
  } finally { f.dom.window.close(); }
}

{
  const f = await fixture();
  try {
    const card = f.d.querySelector('.hero-tool');
    card.dispatchEvent(new f.w.Event('pointerenter'));
    card.dispatchEvent(new f.w.MouseEvent('pointermove', { clientX: 100, clientY: 100 }));
    f.flushFrames();
    assert.equal(card.querySelectorAll('.surface-light').length, 1);
    assert.ok(card.classList.contains('is-pointer-inside'));
    f.media.get('(prefers-reduced-motion: reduce)').change(true);
    assert.ok(!card.classList.contains('is-pointer-inside'));
    assert.ok(f.animations.every(animation => animation.cancelled));
    assert.equal(f.d.querySelectorAll('[style]').length, 0, 'Motion never injects inline styles');
  } finally { f.dom.window.close(); }
}

{
  const f = await fixture({ reduced: true, fine: false });
  try {
    const line=f.d.querySelector('.site-progress line'),dot=f.d.querySelector('.site-progress circle');
    for(const fraction of [0,.25,.5,.75,1]){
      f.w.scrollY=(2400-f.w.innerHeight)*fraction;
      f.w.dispatchEvent(new f.w.Event('scroll'));f.flushFrames();
      const expected=Math.min(f.w.innerWidth-3,Math.max(3,fraction*f.w.innerWidth));
      assert.equal(Number(dot.getAttribute('cx')),expected);
      assert.equal(line.getAttribute('x2'),dot.getAttribute('cx'));
    }
    f.w.innerWidth=320;f.w.dispatchEvent(new f.w.Event('resize'));f.flushFrames();
    assert.equal(Number(dot.getAttribute('cx')),317,'The progress marker stays inside a narrow viewport at the end');
    assert.equal(f.d.querySelector('.site-progress').getAttribute('aria-hidden'),'true');
  }finally{f.dom.window.close();}
}

console.log('PASS: Opt-in pad audio, scoped keyboard controls, timed demo/Stop, cleanup, reduced motion, pointer-light lifecycle and existing site content.');
