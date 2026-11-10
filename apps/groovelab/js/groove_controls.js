import { bindTempoStepper } from './tempo-stepper.js';

// Shared Groove Lab settings. The editor and its playback engine keep their
// original nodes and values at every viewport size.
(() => {
  'use strict';
  const writer = window.myGrooveWriter;
  const metronome = document.getElementById('gl-metronome');
  const clickToggle = document.getElementById('gl-metronome-toggle');
  const clickMenu = document.getElementById('gl-metronome-menu');
  const clickRates = document.getElementById('gl-click-rates');
  const meter = document.getElementById('gl-meter');
  const notes = document.getElementById('gl-notes');
  const optionItems = [...document.querySelectorAll('#gl-click-options > li[onclick]')];
  let pending = false;

  // The drawer changes presentation only: these are the same live settings on
  // desktop and mobile, including during playback and after rotating a phone.
  const toolbar = document.getElementById('groove-controls');
  const settingsToggle = document.getElementById('gl-settings-toggle');
  const drawer = document.getElementById('gl-settings-drawer');
  const compact = matchMedia('(max-width: 1100px)');
  let settingsOpen = false;
  function dismissMenus() {
    document.dispatchEvent(new Event('tool-select:close'));
    const menu = writer.myGrooveUtils.visible_context_menu;
    if (menu) writer.myGrooveUtils.hideContextMenu(menu);
  }
  function syncDrawer() {
    const visible = !compact.matches || settingsOpen;
    if (!visible && drawer.contains(document.activeElement)) settingsToggle.focus({ preventScroll: true });
    drawer.inert = !visible;
    drawer.setAttribute('aria-hidden', String(!visible));
    drawer.classList.toggle('is-open', visible);
    settingsToggle.setAttribute('aria-expanded', String(compact.matches && settingsOpen));
    if (!compact.matches && document.activeElement === settingsToggle) clickToggle.focus({ preventScroll: true });
    document.dispatchEvent(new Event('groove:layout-change'));
  }
  settingsToggle.hidden = false;
  toolbar.dataset.settingsReady = 'true';
  settingsToggle.addEventListener('click', () => {
    dismissMenus();
    settingsOpen = !settingsOpen;
    syncDrawer();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || !compact.matches || !settingsOpen) return;
    // Let an open select or action menu consume the first Escape.
    if (writer.myGrooveUtils.visible_context_menu || toolbar.querySelector('[aria-expanded="true"]:not(#gl-settings-toggle)')) return;
    settingsOpen = false;
    syncDrawer();
    settingsToggle.focus({ preventScroll: true });
  }, true);
  compact.addEventListener('change', () => { dismissMenus(); syncDrawer(); });
  syncDrawer();

  const clickIcons = { 0: 'speaker-off', 4: 'note-quarter', 8: 'note-eighth', 16: 'note-sixteenth' };
  function clickIcon(value) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tool-icon gl-click-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', `images/tool-icons.svg#${clickIcons[value]}`);
    svg.append(use);
    return svg;
  }
  for (const option of metronome.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'groove-menu-option';
    button.dataset.clickRate = option.value;
    const label = document.createElement('span');
    label.textContent = option.label;
    button.append(clickIcon(option.value), label);
    button.addEventListener('click', () => {
      writer.setMetronomeFrequency(Number(option.value));
      writer.myGrooveUtils.hideContextMenu(clickMenu);
      clickToggle.focus({ preventScroll: true });
      sync();
    });
    clickRates.append(button);
  }
  clickToggle.addEventListener('click', () => writer.toggleControlMenu(clickMenu, clickToggle));
  metronome.addEventListener('focus', () => clickToggle.focus({ preventScroll: true }));
  for (const item of optionItems) {
    item.addEventListener('click', () => {
      if (item.id === 'metronomeOptionsContextMenuOffTheOne') return;
      writer.myGrooveUtils.hideContextMenu(clickMenu);
      clickToggle.focus({ preventScroll: true });
      sync();
    });
  }
  for (const bottom of [4, 8, 16]) {
    const group = document.createElement('optgroup');
    group.label = { 4: 'Quarter-note beats', 8: 'Eighth-note beats', 16: 'Sixteenth-note beats' }[bottom];
    for (let top = 2; top <= 15; top++) {
      const value = `${top}/${bottom}`;
      group.append(new Option(value, value));
    }
    meter.append(group);
  }
  function sync() {
    pending = false;
    const frequency = String(writer.getMetronomeFrequency());
    if (metronome.value !== frequency) metronome.value = frequency;
    const caption = document.getElementById('gl-metronome-value');
    const label = metronome.selectedOptions[0].label;
    if (caption.textContent !== label) caption.textContent = label;
    document.querySelector('#gl-metronome-icon use').setAttribute('href', `images/tool-icons.svg#${clickIcons[frequency]}`);
    clickRates.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.clickRate === frequency)));
    const signature = writer.getTimeSignature();
    if (![...meter.options].some(option => option.value === signature)) meter.append(new Option(signature, signature));
    if (meter.value !== signature) meter.value = signature;
    notes.value = String(writer.getSubdivision());
    meter.disabled = notes.disabled = writer.myGrooveUtils.viewMode;
    document.dispatchEvent(new Event('tool-select:refresh'));
    for (const item of optionItems) {
      if (item.id !== 'metronomeOptionsContextMenuOffTheOne') item.setAttribute('aria-pressed', String(item.classList.contains('menuChecked')));
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(sync);
  }
  metronome.addEventListener('change', () => { writer.setMetronomeFrequency(Number(metronome.value)); sync(); });
  meter.addEventListener('change', () => { writer.changeTimeSignature(...meter.value.split('/')); sync(); });
  notes.addEventListener('change', () => { writer.changeDivision(Number(notes.value)); sync(); });
  document.addEventListener('groove:controls-change', schedule);
  const observer = new MutationObserver(schedule);
  for (const target of [document.getElementById('measureContainer'), clickMenu]) {
    observer.observe(target, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
  window.addEventListener('load', () => {
    document.querySelectorAll('#midiPlayer [data-adjust]').forEach(button => {
      bindTempoStepper(button, () => {
        const amount = Number(button.dataset.step);
        if (button.dataset.adjust === 'tempo') writer.myGrooveUtils.setTempo(writer.myGrooveUtils.getTempo() + amount);
        else writer.myGrooveUtils.setSwing(writer.myGrooveUtils.getSwing() + amount);
      });
    });
    sync();
  });
  sync();
})();
