import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { bindContextHelp } from '../assets/context-help.js';

const dom = new JSDOM('<button id="outside">Outside</button><div id="host"></div>', { pretendToBeVisual: true });
const { document: doc } = dom.window;
try {
  // Exercise the same controller inside the Metronome's isolated shadow root.
  const root = doc.getElementById('host').attachShadow({ mode: 'open' });
  root.innerHTML = '<span data-context-help="Two clicks in each beat." data-help-label="About subdivision"></span>';
  const dispose = bindContextHelp(root);
  const trigger = root.querySelector('button'), tip = root.querySelector('[role="tooltip"]');
  assert.equal(trigger.getAttribute('aria-label'), 'About subdivision');
  assert.equal(trigger.getAttribute('aria-describedby'), tip.id);
  assert(tip.hidden);
  trigger.focus();
  assert(!tip.hidden);
  root.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert(tip.hidden);
  trigger.click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  trigger.click();
  assert(tip.hidden);
  trigger.click();
  doc.getElementById('outside').focus();
  assert(tip.hidden);
  // Settings dialogs are mounted after the main tool, so their help must be discovered too.
  const extra = doc.createElement('span');
  extra.dataset.contextHelp = 'Start slowly, then build speed.';
  root.append(extra);
  await Promise.resolve();
  assert(extra.querySelector('button'));
  extra.querySelector('button').click();
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert(extra.querySelector('[role="tooltip"]').hidden);
  dispose();
  trigger.click();
  assert(tip.hidden, 'Disposal removes handlers and pending close timers');
  assert.equal(root.querySelectorAll('[role="tooltip"]').length, 0);
  const rebound = bindContextHelp(root);
  assert.equal(root.querySelectorAll('[role="tooltip"]').length, 2, 'Rebinding adds one tooltip per setting');
  rebound();
} finally { dom.window.close(); }

const html = await readFile(new URL('../lessons/index.html', import.meta.url), 'utf8');
const reviews = new JSDOM(html, { runScripts: 'outside-only', url: 'https://www.davedrums.com.au/lessons/' });
try {
  const cards = [...reviews.window.document.querySelectorAll('.testimonial-card')];
  const original = cards.map(card => card.querySelector('blockquote').textContent);
  for (const [index, card] of cards.entries()) {
    const quote = card.querySelector('blockquote');
    Object.defineProperties(quote, { clientHeight: { value: 90 }, scrollHeight: { value: index === 0 ? 180 : 60 } });
  }
  reviews.window.eval(await readFile(new URL('../assets/review-details.js', import.meta.url), 'utf8'));
  const card = cards[0], more = card.querySelector('.review-read-more');
  assert(!more.hidden);
  assert(cards[1].querySelector('.review-read-more').hidden);
  more.click();
  assert(card.classList.contains('is-expanded'));
  assert.equal(more.getAttribute('aria-expanded'), 'true');
  more.click();
  assert(!card.classList.contains('is-expanded'));
  assert.deepEqual(cards.map(node => node.querySelector('blockquote').textContent), original);
  assert.equal(cards.length, 22);
  for (const card of cards) {
    const link = card.querySelector('.review-source-link');
    assert.equal(link.href, 'https://share.google/1A38X8U2UJPVkTOlF');
    assert.equal(link.target, '_blank');
  }
} finally { reviews.window.close(); }
const home = new JSDOM(await readFile(new URL('../index.html', import.meta.url), 'utf8'));
try {
  assert.equal(home.window.document.querySelector('.lesson-home-review .review-source-link').href,
    'https://share.google/1A38X8U2UJPVkTOlF');
} finally { home.window.close(); }
console.log('PASS: Context help keyboard/tap/dynamic/shadow-root lifecycle; review expansion, attribution and original text.');
