// Interaction/lifecycle checks in a controlled DOM; this does not simulate browser rendering.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const script = await readFile(new URL('../assets/experience.js', import.meta.url), 'utf8');

async function fixture({ reduced = false, fine = true, animate = true } = {}) {
  const dom = new JSDOM(await readFile(new URL('../index.html', import.meta.url), 'utf8'), {
    url: 'https://www.davedrums.com.au/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, d = w.document, media = new Map(), frames = new Map();
  let id = 0;
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
  if (!animate) delete w.Element.prototype.animate;
  w.eval(script);
  const flushFrames = () => {
    let iterations = 0;
    while (frames.size) {
      assert.ok(iterations++ < 120, 'Motion settles rather than running an idle animation loop');
      const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback(0));
    }
  };
  return { dom, w, d, media, frames, animations, flushFrames };
}

for (const settings of [{}, { reduced: true }, { fine: false }, { animate: false }]) {
  const f = await fixture(settings);
  try {
    f.flushFrames();
    const stage = f.d.querySelector('.performance-stage');
    stage.dispatchEvent(new f.w.MouseEvent('pointermove', { clientX: 100, clientY: 100 }));
    f.flushFrames();
    if (settings.reduced || settings.animate === false) assert.equal(f.animations.length, 0);
    if (settings.fine === false) assert.ok(f.animations.every(animation => !animation.element.matches('.hero-media')));
    f.w.dispatchEvent(new f.w.Event('pagehide'));
    assert.equal(f.frames.size, 0, 'Leaving the page cancels every motion frame');
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

console.log('PASS: Homepage depth cleanup, reduced motion, pointer-light lifecycle and reading progress.');
