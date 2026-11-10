// Let the public page own vertical scrolling, including expanded permutations.
(() => {
  'use strict';
  const editor = document.getElementById('GrooveWriter');
  if (!editor) return;
  const toolbar = document.getElementById('groove-controls');
  if (parent !== window) document.documentElement.dataset.embedded = 'true';
  let scheduled = false;
  let lastHeight = 0;
  function pinToolbar() {
    if (!toolbar || parent === window) return;
    try {
      // The iframe itself stays in flow. Offset only the original live toolbar,
      // clamped to the editor so it releases before the page footer.
      const frame = window.frameElement;
      if (!frame) return;
      const header = parent.document.fullscreenElement ? null : parent.document.querySelector('.site-header');
      const inset = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      const offset = Math.max(0, Math.min(inset - frame.getBoundingClientRect().top,
        editor.offsetHeight - toolbar.offsetHeight));
      const changed = toolbar.style.getPropertyValue('--gl-toolbar-offset') !== `${offset}px`;
      toolbar.style.setProperty('--gl-toolbar-offset', `${offset}px`);
      toolbar.dataset.stuck = String(offset > 0);
      if (changed) {
        document.dispatchEvent(new Event('tool-select:reposition'));
        const writer = window.myGrooveWriter;
        const menu = writer?.myGrooveUtils.visible_context_menu;
        const anchor = menu && { 'gl-metronome-menu': 'gl-metronome-toggle', grooveListWrapper: 'groovesAnchor' }[menu.id];
        if (anchor) writer.positionControlMenu(menu, document.getElementById(anchor));
      }
    } catch { /* Cross-origin embeds keep the toolbar in its normal position. */ }
  }
  function measure() {
    scheduled = false;
    pinToolbar();
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
  if (toolbar) observer.observe(toolbar);
  // Absolutely positioned dialogs can extend below otherwise unchanged content.
  editor.querySelectorAll('#fullURLPopup,#metronomeAutoSpeedupConfiguration').forEach(popup => observer.observe(popup));
  // Dialog feedback can grow after copying or sharing.
  new MutationObserver(schedule).observe(document.getElementById('fullURLPopup'), {
    subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style']
  });
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  document.addEventListener('groove:layout-change', schedule);
  // Capture also catches the fullscreen workspace's own scrolling. No polling
  // or extra scroll container is needed, and scroll work is limited to one frame.
  try {
    if (parent !== window) {
      parent.document.addEventListener('scroll', schedule, { capture: true, passive: true });
      parent.addEventListener('resize', schedule);
      parent.document.addEventListener('fullscreenchange', schedule);
      window.addEventListener('pagehide', () => {
        parent.document.removeEventListener('scroll', schedule, true);
        parent.removeEventListener('resize', schedule);
        parent.document.removeEventListener('fullscreenchange', schedule);
      }, { once: true });
    }
  } catch { /* Standalone/cross-origin editors use their own scroll behaviour. */ }
  document.fonts.ready.then(schedule);
  schedule();
})();
