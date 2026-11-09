import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { ROOT, GROOVE } from '../build/common.mjs';

const query = '?TimeSig=4/4&Div=16&Tempo=92&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|----O-------O---|&K=|o-------o-------|&Title=Migration%20check&Author=Dave';
const html = await readFile(resolve(GROOVE, 'index.html'), 'utf8');
const app = new JSDOM(html, { url: `https://www.davedrums.com.au/groove/app/${query}`, runScripts: 'outside-only' });
try {
  for (const file of ['groove_utils', 'groove_writer']) app.window.eval(await readFile(resolve(GROOVE, 'js', `${file}.js`), 'utf8'));
  const utils = new app.window.GrooveUtils();
  const data = utils.getGrooveDataFromUrlString(query);
  const share = new URL(utils.getUrlStringFromGrooveData(data, 'share'));
  assert.equal(share.origin, 'https://www.davedrums.com.au');
  assert.equal(share.pathname, '/groove/');
  assert.equal(share.searchParams.get('Tempo'), '92');
  assert.equal(share.searchParams.get('Title'), 'Migration check');
  const roundtrip = utils.getGrooveDataFromUrlString(share.search);
  for (const field of ['hh_array', 'snare_array', 'kick_array', 'tempo', 'title', 'author', 'numBeats', 'noteValue']) assert.deepEqual(roundtrip[field], data[field]);
  assert.equal(new URL(utils.getUrlStringFromGrooveData(data, 'display')).pathname, '/groove/app/GrooveEmbed.html');
  assert.equal(new URL(utils.getUrlStringFromGrooveData(data, 'editor')).pathname, '/groove/app/');
  assert.equal(new URL(utils.getUrlStringFromGrooveData(data, 'fullGrooveScribe')).pathname, '/groove/');
  const writer = new app.window.GrooveWriter();
  const staff = new JSDOM(writer.HTMLforStaffContainer(1, 0)).window.document;
  assert.ok(staff.querySelectorAll('.snare_accent .groove-accent-mark').length > 0);
  assert.equal(app.window.document.getElementById('shortenerCheckbox'), null);
  assert.doesNotMatch(await readFile(resolve(GROOVE, 'js/groove_writer.js'), 'utf8'), /firebasedynamiclinks|fillInShortenedURL/);
} finally { app.window.close(); }

const page = new JSDOM(await readFile(resolve(ROOT, 'groove/index.html'), 'utf8'), {
  url: `https://www.davedrums.com.au/groove/${query}#top`, runScripts: 'outside-only'
});
try {
  const { window } = page;
  window.matchMedia = () => ({ matches: false, addEventListener() {} });
  window.eval(await readFile(resolve(ROOT, 'assets/groove.js'), 'utf8'));
  const frame = window.document.getElementById('groove-frame');
  assert.equal(new URL(frame.src).pathname, '/groove/app/');
  assert.equal(new URL(frame.src).search, query);
  const send = (source, origin, search) => window.dispatchEvent(new window.MessageEvent('message', {
    source, origin, data: { type: 'dave-drums:groove-change', search }
  }));
  send(window, window.location.origin, '?Tempo=10');
  assert.equal(window.location.search, query, 'Other windows cannot rewrite the public URL');
  send(frame.contentWindow, 'https://example.com', '?Tempo=10');
  assert.equal(window.location.search, query, 'Other origins cannot rewrite the public URL');
  send(frame.contentWindow, window.location.origin, '?Tempo=108&Title=Updated');
  assert.equal(window.location.pathname, '/groove/');
  assert.equal(window.location.search, '?Tempo=108&Title=Updated');
  assert.equal(window.location.hash, '#top');
  const size = (source, origin, height) => window.dispatchEvent(new window.MessageEvent('message', {
    source, origin, data: { type: 'dave-drums:groove-size', height }
  }));
  const initialHeight = frame.height;
  size(window, window.location.origin, 1400);
  size(frame.contentWindow, 'https://example.com', 1400);
  for (const height of [NaN, Infinity, -1, 100000, '1400']) size(frame.contentWindow, window.location.origin, height);
  assert.equal(frame.height, initialHeight, 'Only bounded numeric heights from the embedded editor are accepted');
  size(frame.contentWindow, window.location.origin, 1400.2);
  assert.equal(frame.height, '1401');
  size(frame.contentWindow, window.location.origin, 650);
  assert.equal(frame.height, '650', 'Closing expanded content can shrink the editor again');

} finally { page.window.close(); }
console.log('PASS: Groove pattern round-trip, same-origin share/embed URLs, retained accent marks, query forwarding and authenticated editor-to-page history updates.');
