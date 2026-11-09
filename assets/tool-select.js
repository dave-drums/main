// Shared select-only combobox. Native selects remain the source of values,
// validation and change events; only their presentation is enhanced.
let nextId = 0;
const instances = new WeakMap();
const selector = 'select[data-tool-select], .enquiry-form select';

export function enhanceToolSelect(select) {
  if (instances.has(select)) return instances.get(select);
  const doc = select.ownerDocument, win = doc.defaultView;
  const wrapper = doc.createElement('span');
  wrapper.className = 'tool-select';
  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.className = 'tool-select-trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const caption = doc.createElement('span');
  caption.className = 'tool-select-value';
  trigger.append(caption);
  const label = select.getAttribute('aria-label') || select.labels?.[0]?.querySelector(':scope > span:not(.required-mark)')?.textContent || select.labels?.[0]?.textContent || 'Choose an option';
  trigger.setAttribute('aria-label', label.replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim());
  const menu = doc.createElement('div');
  menu.id = `tool-select-menu-${++nextId}`;
  caption.id = `tool-select-value-${nextId}`;
  menu.className = 'tool-menu tool-select-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', label.trim());
  trigger.setAttribute('aria-controls', menu.id);
  const nativePopover = typeof menu.showPopover === 'function';
  if (nativePopover) menu.setAttribute('popover', 'auto');
  else menu.hidden = true;
  select.before(wrapper);
  wrapper.append(select, trigger, menu);
  select.classList.add('tool-select-native');
  select.setAttribute('aria-hidden', 'true');
  select.tabIndex = -1;
  let opened = false, active = -1, choices = [], search = '', searchedAt = 0;

  let selectedIcon;
  function optionIcon(option) {
    if (!option?.dataset.icon) return null;
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tool-icon tool-option-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = doc.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', `${select.dataset.iconSprite || '/assets/icons.svg'}#${option.dataset.icon}`);
    svg.append(use);
    return svg;
  }
  function close(restore = false) {
    if (!opened) return;
    opened = false;
    if (nativePopover && menu.matches(':popover-open')) menu.hidePopover();
    else if (!nativePopover) menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    if (restore) trigger.focus({ preventScroll: true });
  }
  function position() {
    if (!opened) return;
    if (!trigger.getClientRects().length) { close(); return; }
    const anchor = trigger.getBoundingClientRect();
    let top = 0, bottom = win.innerHeight;
    // An app iframe can be taller than the visible portion of the parent page.
    try {
      if (win.frameElement) {
        const frame = win.frameElement.getBoundingClientRect();
        top = Math.max(0, -frame.top);
        bottom = Math.min(bottom, win.parent.innerHeight - frame.top);
      }
    } catch { /* Cross-origin embeds use their own viewport. */ }
    const below = bottom - anchor.bottom - 8, above = anchor.top - top - 8;
    const useAbove = below < 180 && above > below;
    const available = Math.max(80, useAbove ? above : below);
    menu.style.maxHeight = `${Math.min(440, available)}px`;
    menu.style.maxWidth = `${Math.max(0, win.innerWidth - 16)}px`;
    menu.style.minWidth = `${Math.min(Math.max(anchor.width, 220), win.innerWidth - 16)}px`;
    const width = menu.getBoundingClientRect().width;
    menu.style.left = `${Math.max(8, Math.min(anchor.left, win.innerWidth - width - 8))}px`;
    menu.style.top = `${useAbove ? anchor.top - menu.offsetHeight - 6 : anchor.bottom + 6}px`;
  }
  function activate(index, scroll = true) {
    active = index;
    choices.forEach((item, i) => { item.node.dataset.active = String(i === active); });
    const item = choices[active];
    if (!item) return;
    trigger.setAttribute('aria-activedescendant', item.node.id);
    if (scroll) item.node.scrollIntoView({ block: 'nearest' });
  }
  function choose(index) {
    const item = choices[index];
    if (!item || item.option.disabled || item.option.parentElement.disabled) return;
    select.value = item.option.value;
    close(true);
    select.dispatchEvent(new win.Event('input', { bubbles: true }));
    select.dispatchEvent(new win.Event('change', { bubbles: true }));
    refresh();
  }
  function build() {
    menu.replaceChildren();
    menu.classList.toggle('tool-menu-with-icons', [...select.options].some(option => option.dataset.icon));
    choices = [];
    function appendOption(option, parent) {
      const node = doc.createElement('div');
      const index = choices.length;
      node.id = `${menu.id}-option-${index}`;
      node.className = 'tool-menu-option';
      node.setAttribute('role', 'option');
      node.setAttribute('aria-selected', String(option.selected));
      node.setAttribute('aria-disabled', String(option.disabled || !!option.parentElement.disabled));
      const text = doc.createElement('span');
      text.className = 'tool-option-label';
      text.textContent = option.label;
      const icon = optionIcon(option);
      if (icon) node.append(icon);
      node.append(text);
      node.addEventListener('pointermove', () => { if (node.getAttribute('aria-disabled') !== 'true') activate(index, false); });
      node.addEventListener('click', event => { event.stopPropagation(); choose(index); });
      parent.append(node);
      choices.push({ node, option });
    }
    for (const child of select.children) {
      if (child.tagName === 'OPTGROUP') {
        const group = doc.createElement('div');
        group.className = 'tool-menu-section';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', child.label);
        const heading = doc.createElement('div');
        heading.className = 'tool-menu-heading';
        heading.textContent = child.label;
        group.append(heading);
        for (const option of child.children) appendOption(option, group);
        menu.append(group);
      } else if (child.tagName === 'OPTION') appendOption(child, menu);
    }
  }
  function open() {
    if (select.disabled || opened) return;
    build();
    opened = true;
    if (nativePopover) menu.showPopover();
    else {
      (doc.fullscreenElement || doc.body).append(menu);
      menu.hidden = false;
    }
    trigger.setAttribute('aria-expanded', 'true');
    position();
    activate(Math.max(0, choices.findIndex(item => item.option.selected)));
  }
  function refresh() {
    const text = select.selectedOptions[0]?.label || 'Choose an option';
    if (caption.textContent !== text) caption.textContent = text;
    const icon = select.selectedOptions[0]?.dataset.icon;
    if (selectedIcon?.dataset.optionIcon !== icon) {
      selectedIcon?.remove();
      selectedIcon = optionIcon(select.selectedOptions[0]);
      if (selectedIcon) { selectedIcon.dataset.optionIcon = icon; trigger.prepend(selectedIcon); }
    }
    trigger.disabled = select.disabled;
    trigger.setAttribute('aria-required', String(select.required));
    if (select.hasAttribute('aria-invalid')) trigger.setAttribute('aria-invalid', select.getAttribute('aria-invalid'));
    else trigger.removeAttribute('aria-invalid');
    trigger.setAttribute('aria-describedby', [caption.id, select.getAttribute('aria-describedby')].filter(Boolean).join(' '));
    if (select.disabled) close();
    if (opened) { build(); position(); activate(Math.max(0, choices.findIndex(item => item.option.selected)), false); }
  }
  trigger.addEventListener('click', () => opened ? close() : open());
  trigger.addEventListener('keydown', event => {
    const key = event.key;
    if (key === 'Tab') { close(); return; }
    if (key === 'Escape') { if (opened) { event.preventDefault(); event.stopPropagation(); close(true); } return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault(); event.stopPropagation();
      if (!opened) { open(); return; }
      if (key === 'Enter' || key === ' ') { choose(active); return; }
      const enabled = choices.map((item, i) => item.node.getAttribute('aria-disabled') === 'false' ? i : -1).filter(i => i >= 0);
      const current = enabled.indexOf(active);
      activate(key === 'Home' ? enabled[0] : key === 'End' ? enabled.at(-1) : enabled[Math.max(0, Math.min(enabled.length - 1, current + (key === 'ArrowDown' ? 1 : -1)))]);
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!opened) open();
      const now = Date.now();
      search = now - searchedAt > 700 ? key : search + key;
      searchedAt = now;
      const index = choices.findIndex(item => item.node.getAttribute('aria-disabled') === 'false' && item.option.label.toLocaleLowerCase().startsWith(search.toLocaleLowerCase()));
      if (index >= 0) activate(index);
    }
  });
  menu.addEventListener('toggle', event => { if (event.newState === 'closed') close(); });
  doc.addEventListener('pointerdown', event => { if (opened && !wrapper.contains(event.target) && !menu.contains(event.target)) close(); });
  win.addEventListener('resize', position);
  try { if (win.parent !== win) win.parent.addEventListener('scroll', position, { passive: true }); } catch { /* Cross-origin embed. */ }
  doc.addEventListener('scroll', event => { if (!menu.contains(event.target)) position(); }, true);
  select.addEventListener('change', refresh);
  select.addEventListener('focus', () => trigger.focus({ preventScroll: true }));
  select.form?.addEventListener('reset', () => queueMicrotask(refresh));
  select.addEventListener('invalid', event => { event.preventDefault(); trigger.setAttribute('aria-invalid', 'true'); trigger.focus(); });
  const observer = new win.MutationObserver(refresh);
  observer.observe(select, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'required', 'label', 'selected', 'aria-describedby', 'aria-invalid', 'data-icon'] });
  const api = { refresh, close, trigger, menu };
  instances.set(select, api);
  refresh();
  return api;
}

export function bindToolSelects(root = document) {
  const controls = new Map();
  function scan() {
    root.querySelectorAll(selector).forEach(select => {
      if (!controls.has(select)) controls.set(select, enhanceToolSelect(select));
    });
  }
  function refresh() { scan(); for (const api of controls.values()) api.refresh(); }
  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches?.(selector) || node.querySelector?.(selector))))) scan();
  });
  observer.observe(root, { subtree: true, childList: true });
  root.addEventListener('tool-select:refresh', refresh);
  scan();
  return { refresh };
}

if (typeof document !== 'undefined') bindToolSelects(document);
