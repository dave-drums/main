import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

// Exercise the real embed handler with a controlled audio clock and timers.
const dom = new JSDOM(`<div class="playerControl">
  <input class="tempoTextField" value="120">
  <button class="midiPlayImage"></button>
  <button class="midiCountInButton active"></button>
</div>`, { url: 'https://www.davedrums.com.au/groove/app/GrooveEmbed.html', runScripts: 'outside-only' });
try {
  const { window } = dom;
  const requests = [], starts = [], timers = [];
  let poll, played = 0, closed = 0;
  Object.defineProperty(window.document, 'currentScript', { value: {
    src: 'https://www.davedrums.com.au/groove/app/js/count-in-handler.js'
  } });
  window.setInterval = callback => { poll = callback; return 1; };
  window.clearInterval = () => {};
  window.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
  window.GrooveUtils = function () { this.myGrooveData = { numBeats: 4, noteValue: 4 }; };
  window.MIDI = { Player: { playing: false } };
  window.fetch = async url => {
    requests.push(url);
    return { arrayBuffer: async () => new Uint8Array([url.includes('high') ? 1 : 2]).buffer };
  };
  window.AudioContext = class {
    currentTime = 0;
    destination = {};
    decodeAudioData = async bytes => new Uint8Array(bytes)[0];
    createBufferSource() {
      const node = { connect() {}, start: time => starts.push([node.buffer, time]) };
      return node;
    }
    close() { closed++; }
  };
  const play = window.document.querySelector('.midiPlayImage');
  play.onclick = () => { played++; };
  window.eval(await readFile(new URL('../apps/groovelab/js/count-in-handler.js', import.meta.url), 'utf8'));
  window.GrooveCountIn.init();
  poll();
  play.click();
  await new Promise(setImmediate);
  assert.deepEqual(requests, [
    'https://www.davedrums.com.au/assets/metronome-high.mp3',
    'https://www.davedrums.com.au/assets/metronome-normal.mp3'
  ]);
  assert.deepEqual(starts, [[1, .01], [2, .51], [2, 1.01], [2, 1.51]]);
  assert.equal(played, 0, 'The groove waits for its count-in');
  assert.ok(timers[0].delay > 1900 && timers[0].delay < 2000);
  timers.shift().callback();
  timers.shift().callback();
  assert.equal(closed, 1);
  assert.equal(played, 1, 'Playback follows the count-in once');
} finally { dom.window.close(); }
console.log('PASS: Notation count-in loads the shared samples, schedules one bar, releases audio and starts the groove once.');
