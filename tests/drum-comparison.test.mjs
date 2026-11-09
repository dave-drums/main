import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { DrumComparison } from '../assets/drum-comparison.js';

class MockContext {
  constructor() { this.currentTime = 0; this.destination = {}; this.sources = []; this.gains = []; }
  async resume() {}
  async close() { this.closed = true; }
  async decodeAudioData(data) { return { duration: new Uint8Array(data)[0] || 30 }; }
  createGain() {
    const node = { gain: { value: 0, ramps: [], cancelAndHoldAtTime() {}, linearRampToValueAtTime(value, when) { this.ramps.push([value, when]); } }, connect() {}, disconnect() { this.disconnected = true; } };
    this.gains.push(node); return node;
  }
  createBufferSource() {
    const node = { connect() {}, start(...args) { this.started = args; }, stop() { this.stopped = true; }, disconnect() { this.disconnected = true; } };
    this.sources.push(node); return node;
  }
}

let fetched = [];
const engine = new DrumComparison({ AudioContext: MockContext, fetchAudio: async url => {
  fetched.push(url); return { ok: true, arrayBuffer: async () => new Uint8Array([30]).buffer };
} });
await engine.load({ raw: '/raw.mp3', mixed: '/mixed.mp3' });
assert.deepEqual(fetched, ['/raw.mp3', '/mixed.mp3']);
assert.equal(engine.duration, 30);
assert(!engine.playing, 'Preloading must never start audio');
assert.equal(engine.context.sources.length, 0);
await engine.play();
assert.equal(engine.sources.length, 2);
assert.deepEqual(engine.sources[0].started, engine.sources[1].started, 'Both sources start at the same time, offset and duration');
engine.context.currentTime = 7.52;
assert.equal(engine.position, 7.5);
for (let i = 0; i < 50; i++) engine.setVersion(i % 2 ? 'raw' : 'mixed');
assert.equal(engine.position, 7.5);
assert.equal(engine.context.sources.length, 2, 'Version switches never restart either source');
assert(engine.sources.every(source => !source.stopped));
assert.equal(engine.context.gains[0].gain.ramps.at(-1)[0], 1);
assert.equal(engine.context.gains[1].gain.ramps.at(-1)[0], 0);
engine.pause();
assert.equal(engine.position, 7.5);
assert(engine.context.sources.every(source => source.stopped && source.disconnected));
engine.context.currentTime = 15;
await engine.play();
assert.equal(engine.sources[0].started[1], 7.5, 'Pause/resume preserves the shared position');
await engine.seek(12);
assert.equal(engine.position, 12);
assert(engine.playing);
assert.equal(engine.sources[0].started[1], 12);
assert.deepEqual(engine.sources[0].started, engine.sources[1].started);
engine.sources[0].onended();
assert(!engine.playing);
assert.equal(engine.position, 30);
await engine.play();
assert.equal(engine.sources[0].started[1], 0, 'Play after the end restarts both versions');
await engine.dispose();
assert(engine.context.closed);
assert(engine.context.gains.every(gain => gain.disconnected));

const interrupted = new DrumComparison({ AudioContext: MockContext });
interrupted.buffers = { raw: {}, mixed: {} }; interrupted.context = new MockContext();
let resume;
interrupted.context.resume = () => new Promise(resolve => { resume = resolve; });
const pending = interrupted.play();
interrupted.pause(); resume(); await pending;
assert.equal(interrupted.context.sources.length, 0, 'Pause cancels a pending start');

const mismatch = new DrumComparison({ AudioContext: MockContext, fetchAudio: async url => ({ ok: true, arrayBuffer: async () => new Uint8Array([url === 'raw' ? 30 : 29]).buffer }) });
await assert.rejects(mismatch.load({ raw: 'raw', mixed: 'mixed' }), /matching start points and lengths/);
assert(!mismatch.buffers);
await mismatch.dispose();
const failure = new DrumComparison({ AudioContext: MockContext, fetchAudio: async () => ({ ok: false }) });
await assert.rejects(failure.load({ raw: 'raw', mixed: 'mixed' }), /could not be loaded/);

const page = new JSDOM(await readFile(new URL('../recording/index.html', import.meta.url), 'utf8'));
try {
  const section = page.window.document.querySelector('[data-drum-comparison]');
  assert(section.querySelector('h2').textContent.includes('Hear the difference'));
  assert.equal(section.querySelectorAll('[data-compare-version]').length, 2);
  assert.equal(section.querySelector('[data-compare-version="raw"] use').getAttribute('href'), '/assets/icons.svg#mic');
  assert.equal(section.querySelector('[data-compare-version="mixed"] use').getAttribute('href'), '/assets/icons.svg#sparkles');
  const panel = section.closest('.recording-showcase');
  assert(panel.matches('.theme-medium.surface-panel'));
  assert.equal(panel.previousElementSibling.id, 'services');
  assert.equal(panel.querySelectorAll(':scope > section').length, 2);
  assert.equal(panel.querySelectorAll('.surface-panel').length, 0);
  assert.equal(section.nextElementSibling.getAttribute('aria-labelledby'), 'process-heading');
  assert(section.querySelector('input[type="range"]').labels.length);
  assert(section.querySelector('.comparison-scrubber input[type="range"]'));
  assert.equal(section.querySelectorAll('input[type="range"]').length, 1);
  for (const version of ['raw', 'mixed']) {
    const file = section.getAttribute(`data-audio-${version}`);
    assert((await readFile(new URL(`..${file}`, import.meta.url))).length > 0);
  }
} finally { page.window.close(); }

// Run the real page controller with simulated browser audio, without autoplay.
const ui = new JSDOM(await readFile(new URL('../recording/index.html', import.meta.url), 'utf8'), {
  runScripts: 'outside-only', url: 'https://www.davedrums.com.au/recording/'
});
try {
  const { window } = ui;
  let observe, requests = 0;
  window.IntersectionObserver = class {
    constructor(callback) { observe = callback; }
    observe() {}
    disconnect() {}
  };
  window.ResizeObserver = class { observe() {} };
  window.requestAnimationFrame = () => 1;
  window.cancelAnimationFrame = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => ({ setTransform() {}, clearRect() {}, fillRect() {} });
  let audio;
  window.AudioContext = class extends MockContext {
    constructor() { super(); audio = this; }
    async decodeAudioData() { return { duration: 30, getChannelData: () => new Float32Array(960).fill(.25) }; }
  };
  window.fetch = async function () {
    assert.equal(this === window, true, 'Native browser fetch must be called with Window as its receiver');
    requests++;
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) };
  };
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  window.eval((await readFile(new URL('../assets/drum-comparison.js', import.meta.url), 'utf8')).replace('export class', 'class'));
  assert.equal(requests, 0, 'Audio only preloads when the comparison approaches the viewport');
  observe([{ isIntersecting: true }]); await flush();
  assert.equal(requests, 2);
  assert.equal(audio.sources.length, 0, 'Preloading creates no playing sources');
  const section = window.document.querySelector('[data-drum-comparison]');
  const play = section.querySelector('[data-compare-play]');
  assert(!play.disabled);
  play.click(); await flush();
  assert.equal(audio.sources.length, 2);
  assert.equal(play.textContent.trim(), 'Pause');
  section.querySelector('[data-compare-version="mixed"]').click();
  assert.equal(audio.sources.length, 2);
  assert.equal(section.querySelector('[data-compare-version="mixed"]').getAttribute('aria-pressed'), 'true');
  assert(section.querySelector('[data-compare-description]').textContent.includes('Reverb and ambience'));
  assert.equal(section.querySelector('[data-compare-caption] use').getAttribute('href'), '/assets/icons.svg#info');
  section.querySelector('[data-compare-version="raw"]').click();
  assert(section.querySelector('[data-compare-description]').textContent.includes('straight from the microphones'));
  assert.equal(section.querySelector('[data-compare-caption] use').getAttribute('href'), '/assets/icons.svg#info');
  const seek = section.querySelector('[data-compare-seek]');
  const sourcesBeforeScrub = audio.sources.length;
  seek.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
  seek.value = '12'; seek.dispatchEvent(new window.Event('input')); await flush();
  seek.value = '15'; seek.dispatchEvent(new window.Event('input')); await flush();
  assert.equal(audio.sources.length, sourcesBeforeScrub, 'Dragging updates position without repeatedly restarting audio');
  window.document.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true })); await flush();
  assert.deepEqual(audio.sources.at(-1).started, audio.sources.at(-2).started);
  assert.equal(audio.sources.at(-1).started[1], 15);
  assert.equal(play.textContent.trim(), 'Pause', 'Releasing a playing scrub resumes playback');
  play.click();
  assert.equal(play.textContent.trim(), 'Play');
  seek.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
  seek.value = '5'; seek.dispatchEvent(new window.Event('input'));
  window.document.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true })); await flush();
  assert.equal(play.textContent.trim(), 'Play', 'Seeking while paused never starts audio');
  seek.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(Number(seek.value), 6, 'Arrow keys seek by one second');
  seek.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(Number(seek.value), 30);
  seek.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(Number(seek.value), 0);
  window.dispatchEvent(new window.Event('pagehide'));
  assert(audio.closed);
} finally { ui.window.close(); }
console.log('PASS: Both comparison files preload, start in sync, switch without restarts, seek/resume together and clean up; errors and cancelled starts remain silent.');
