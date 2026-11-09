// Let the public page own vertical scrolling, including expanded permutations.
(() => {
  'use strict';
  const editor = document.getElementById('GrooveWriter');
  if (!editor) return;
  if (parent !== window) document.documentElement.dataset.embedded = 'true';
  let scheduled = false;
  let lastHeight = 0;
  function measure() {
    scheduled = false;
    if (parent === window) return;
    // Measure content, not the viewport: scrollHeight on the document cannot shrink.
    const height = Math.max(320, Math.ceil(editor.getBoundingClientRect().height), editor.scrollHeight) + 2;
    if (height === lastHeight) return;
    lastHeight = height;
    parent.postMessage({ type: 'dave-drums:groove-size', height }, location.origin);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(measure);
  }
  const observer = new ResizeObserver(schedule);
  observer.observe(editor);
  // Absolutely positioned dialogs can extend below otherwise unchanged content.
  editor.querySelectorAll('#fullURLPopup,#metronomeAutoSpeedupConfiguration').forEach(popup => observer.observe(popup));
  // Dialog feedback can grow after copying or sharing.
  new MutationObserver(schedule).observe(document.getElementById('fullURLPopup'), {
    subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style']
  });
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  schedule();
})();
