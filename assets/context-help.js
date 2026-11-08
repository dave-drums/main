// Shared, delegated help for document pages and isolated tool roots.
const bindings = new WeakMap();
let nextHelpId = 0;

export function bindContextHelp(root) {
  if (bindings.has(root)) return bindings.get(root);
  const doc = root.ownerDocument || root;
  const view = doc.defaultView;
  let active;
  let pinned = false;
  let closeTimer;
  const states = new WeakMap();
  const listeners = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };
  const close = () => {
    view.clearTimeout(closeTimer);
    if (!active) return;
    active.tip.hidden = true;
    if (active.trigger.tagName === 'BUTTON') active.trigger.setAttribute('aria-expanded', 'false');
    active = undefined;
    pinned = false;
  };
  const prepare = () => root.querySelectorAll('[data-context-help]').forEach(wrapper => {
    if (states.has(wrapper)) return;
    const hadClass = wrapper.classList.contains('context-help');
    wrapper.classList.add('context-help');
    let trigger = wrapper.querySelector('a,button');
    const created = !trigger;
    if (!trigger) {
      trigger = doc.createElement('button');
      trigger.type = 'button';
      trigger.className = 'context-help-trigger';
      trigger.setAttribute('aria-label', wrapper.dataset.helpLabel || 'Explain this setting');
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const use = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '/assets/icons.svg#help');
      svg.append(use);
      trigger.append(svg);
      wrapper.append(trigger);
    }
    const tip = doc.createElement('span');
    tip.className = 'context-help-bubble';
    tip.id = `context-help-${++nextHelpId}`;
    tip.setAttribute('role', 'tooltip');
    tip.textContent = wrapper.dataset.contextHelp;
    tip.hidden = true;
    wrapper.append(tip);
    const describedBy = trigger.getAttribute('aria-describedby');
    const expanded = trigger.getAttribute('aria-expanded');
    trigger.setAttribute('aria-describedby', tip.id);
    if (trigger.tagName === 'BUTTON') trigger.setAttribute('aria-expanded', 'false');
    states.set(wrapper, { wrapper, trigger, tip, created, hadClass, describedBy, expanded });
  });
  const find = target => states.get(target?.closest?.('[data-context-help]'));
  const open = state => {
    if (!state || active === state) return;
    close();
    active = state;
    state.tip.hidden = false;
    if (state.trigger.tagName === 'BUTTON') state.trigger.setAttribute('aria-expanded', 'true');
    state.tip.classList.remove('is-end', 'is-above', 'is-viewport');
    const bounds = state.tip.getBoundingClientRect();
    if (bounds.right > view.innerWidth - 16) state.tip.classList.add('is-end');
    const aligned = state.tip.getBoundingClientRect();
    if (aligned.left < 16 || aligned.right > view.innerWidth - 16) state.tip.classList.add('is-viewport');
    else if (aligned.bottom > view.innerHeight - 16) state.tip.classList.add('is-above');
  };
  prepare();
  const observer = new view.MutationObserver(prepare);
  observer.observe(root, { childList: true, subtree: true });
  listen(root, 'pointerover', event => {
    if (active?.wrapper.contains(event.target)) view.clearTimeout(closeTimer);
    if (event.pointerType !== 'touch' && !pinned) open(find(event.target));
  });
  listen(root, 'pointerout', event => {
    if (active && !pinned && !active.wrapper.contains(event.relatedTarget)
        && !active.wrapper.contains(root.activeElement || doc.activeElement)) closeTimer = view.setTimeout(close, 150);
  });
  listen(root, 'focusin', event => open(find(event.target)));
  listen(root, 'focusout', event => {
    if (active && !active.wrapper.contains(event.relatedTarget)) close();
  });
  listen(root, 'click', event => {
    const state = find(event.target);
    if (!state || state.trigger.tagName !== 'BUTTON') return;
    event.preventDefault();
    event.stopPropagation();
    if (active === state && pinned) close();
    else { open(state); pinned = true; }
  });
  listen(root, 'pointerdown', event => {
    if (active && !active.wrapper.contains(event.target)) close();
  }, true);
  listen(root, 'keydown', event => {
    if (find(event.target) && [' ', 'Enter'].includes(event.key)) event.stopPropagation();
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }, true);
  listen(root, 'scroll', close, true);
  listen(view, 'resize', close);
  const dispose = () => {
    close();
    observer.disconnect();
    listeners.forEach(remove => remove());
    root.querySelectorAll('[data-context-help]').forEach(wrapper => {
      const state = states.get(wrapper);
      if (!state) return;
      state.tip.remove();
      if (state.created) state.trigger.remove();
      else for (const [attribute, value] of [['aria-describedby', state.describedBy], ['aria-expanded', state.expanded]]) {
        if (value === null) state.trigger.removeAttribute(attribute);
        else state.trigger.setAttribute(attribute, value);
      }
      if (!state.hadClass) wrapper.classList.remove('context-help');
    });
    bindings.delete(root);
  };
  bindings.set(root, dispose);
  return dispose;
}

if (typeof document !== 'undefined' && document.querySelector('[data-context-help]')) bindContextHelp(document);
