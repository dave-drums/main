// Link the visible editor bar to its engraved score without changing playback.
(() => {
  'use strict';
  const editor = document.getElementById('musicalInput');
  const bars = document.getElementById('measureContainer');
  const score = document.getElementById('svgTarget');
  if (!editor || !bars || !score) return;
  const ns = 'http://www.w3.org/2000/svg';
  let pending = false;

  function updateCurrentBar() {
    pending = false;
    const viewport = editor.getBoundingClientRect();
    const cards = [...bars.querySelectorAll('.staff-container')];
    let current = 1, greatest = -1;
    cards.forEach((card, index) => {
      const box = card.querySelector('.notes-row-container').getBoundingClientRect();
      const visible = Math.max(0, Math.min(box.right, viewport.right) - Math.max(box.left, viewport.left));
      if (visible > greatest) { greatest = visible; current = index + 1; }
    });
    editor.dataset.currentBar = String(current);
    cards.forEach((card, index) => {
      const active = cards.length > 1 && index + 1 === current;
      card.classList.toggle('is-current-bar', active);
      if (active) card.setAttribute('aria-current', 'true'); else card.removeAttribute('aria-current');
    });
    score.querySelectorAll('.gl-score-bar-highlight').forEach(rect => {
      rect.classList.toggle('is-current-bar', cards.length > 1 && Number(rect.dataset.scoreBar) === current);
    });
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateCurrentBar);
  }
  function rebuildScoreHighlights() {
    for (const svg of score.querySelectorAll('svg')) {
      svg.querySelectorAll('.gl-score-bar-highlight').forEach(rect => rect.remove());
      const groups = new Map();
      // Screen matrices include responsive SVG scaling consistently in Chromium and Firefox.
      const transform = svg.getScreenCTM();
      if (!transform) continue;
      const boundaries = [...svg.querySelectorAll('.gl-score-bar-edge')].map(marker => {
        const matrix = marker.getScreenCTM();
        if (!matrix) return null;
        // Firefox gives zero-width rects an empty bounding box; use their engraved coordinate.
        return new DOMPoint(Number(marker.getAttribute('x')), 0).matrixTransform(transform.inverse().multiply(matrix)).x;
      }).filter(value => value !== null).sort((a, b) => a - b);
      for (const marker of svg.querySelectorAll('.gl-score-bar-marker')) {
        const matrix = marker.getScreenCTM();
        if (!matrix) continue;
        const box = Object.fromEntries(['x', 'y', 'width', 'height'].map(name => [name, Number(marker.getAttribute(name))]));
        const toScore = transform.inverse().multiply(matrix);
        const corners = [new DOMPoint(box.x, box.y), new DOMPoint(box.x + box.width, box.y + box.height)]
          .map(point => point.matrixTransform(toScore));
        const bounds = { left: corners[0].x, top: corners[0].y, right: corners[1].x, bottom: corners[1].y };
        const previous = groups.get(marker.dataset.scoreBar);
        groups.set(marker.dataset.scoreBar, previous ? {
          left: Math.min(previous.left, bounds.left), top: Math.min(previous.top, bounds.top),
          right: Math.max(previous.right, bounds.right), bottom: Math.max(previous.bottom, bounds.bottom)
        } : bounds);
      }
      for (const [bar, box] of groups) {
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('class', 'gl-score-bar-highlight');
        rect.dataset.scoreBar = bar;
        rect.setAttribute('aria-hidden', 'true');
        // Snap to actual engraved barlines, including at responsive SVG scales.
        const left = boundaries.filter(edge => edge <= box.left + 1).at(-1) ?? Math.max(0, box.left - 5);
        const right = boundaries.find(edge => edge >= box.right - 1) ?? box.right + 5;
        const top = Math.max(0, box.top - 5);
        const bottom = Math.min(svg.viewBox.baseVal.height || Infinity, box.bottom + 5);
        rect.setAttribute('x', left);
        rect.setAttribute('y', top);
        rect.setAttribute('width', right - left);
        rect.setAttribute('height', bottom - top);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('rx', '0');
        svg.insertBefore(rect, svg.firstChild);
      }
    }
    schedule();
  }
  editor.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(schedule).observe(editor);
  new MutationObserver(schedule).observe(bars, { childList: true });
  score.addEventListener('groove:score-rendered', rebuildScoreHighlights);
  document.fonts.ready.then(rebuildScoreHighlights);
  rebuildScoreHighlights();
})();
