/* Shared, reversible disclosure motion. Content keeps its natural height after
   each transition, and ResizeObserver follows loaded booking/form content. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const disclosureDuration = 700;
const disclosureEase = 'cubic-bezier(0.25, 0.65, 0.25, 1)';
const disclosureStates = new WeakMap();
const activeDisclosures = new Set();
function naturalPanelHeight(panel) {
  const inner = panel.firstElementChild;
  if (!inner) return panel.scrollHeight;
  const style = getComputedStyle(inner);
  return inner.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
}
function finishDisclosure(panel, state) {
  const animation = state.animation;
  state.animation = null;
  panel.hidden = !state.expanded;
  panel.inert = !state.expanded;
  panel.classList.remove('disclosure-animating');
  animation?.cancel();
  activeDisclosures.delete(state);
  state.height = state.expanded && state.kind === 'height' ? naturalPanelHeight(panel) : 0;
  if (!state.expanded) state.afterClose?.();
}
function revealPanel(panel, expanded, { instant = false, kind = 'height', afterClose, force = false, fromHeight } = {}) {
  if (!panel) return;
  let state = disclosureStates.get(panel);
  if (!state) {
    state = { panel, expanded: !panel.hidden, animation: null, kind, height: 0, targetHeight: 0, afterClose };
    disclosureStates.set(panel, state);
    if (kind === 'height' && 'ResizeObserver' in window && panel.firstElementChild) {
      state.observer = new ResizeObserver(() => {
        if (!state.expanded || panel.hidden) return;
        const target = naturalPanelHeight(panel);
        if (Math.abs(target - state.targetHeight) < 1) return;
        const start = state.animation ? panel.getBoundingClientRect().height : state.height;
        revealPanel(panel, true, { kind, force: true, fromHeight: start, afterClose: state.afterClose });
      });
      state.observer.observe(panel.firstElementChild);
    }
  }
  if (state.expanded === expanded && !instant && !force) return;
  const wasHidden = panel.hidden;
  const computed = getComputedStyle(panel);
  const startOpacity = wasHidden ? 0 : parseFloat(computed.opacity);
  const startClip = wasHidden ? 'inset(0 0 100% 0)' : (computed.clipPath === 'none' ? 'inset(0 0 0% 0)' : computed.clipPath);
  const startHeight = fromHeight ?? (wasHidden ? 0 : panel.getBoundingClientRect().height);
  state.animation?.cancel();
  state.animation = null;
  state.expanded = expanded;
  state.kind = kind;
  if (afterClose !== undefined) state.afterClose = afterClose;
  panel.hidden = false;
  panel.inert = !expanded;
  state.targetHeight = kind === 'height' && expanded ? naturalPanelHeight(panel) : 0;
  if (instant || reducedMotion.matches || typeof panel.animate !== 'function') {
    finishDisclosure(panel, state); return;
  }
  panel.classList.add('disclosure-animating');
  const frames = kind === 'height'
    ? [{ height: startHeight + 'px', opacity: startOpacity }, { height: state.targetHeight + 'px', opacity: expanded ? 1 : 0 }]
    : kind === 'menu'
      ? [{ clipPath: startClip, opacity: startOpacity }, { clipPath: expanded ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', opacity: expanded ? 1 : 0 }]
      : [{ opacity: startOpacity }, { opacity: expanded ? 1 : 0 }];
  const animation = panel.animate(frames, { duration: disclosureDuration, easing: disclosureEase, fill: 'both' });
  state.animation = animation;
  activeDisclosures.add(state);
  animation.addEventListener('finish', () => {
    if (state.animation === animation) finishDisclosure(panel, state);
  }, { once: true });
}
reducedMotion.addEventListener('change', event => {
  if (event.matches) [...activeDisclosures].forEach(state => finishDisclosure(state.panel, state));
});
/* Keep native details/summary and keyboard behaviour as the no-JavaScript path. */
document.querySelectorAll('details').forEach(details => {
  const summary = details.querySelector(':scope > summary');
  if (!summary) return;
  const panel = document.createElement('div'); panel.className = 'disclosure-content';
  const inner = document.createElement('div'); inner.className = 'disclosure-inner';
  [...details.childNodes].filter(node => node !== summary).forEach(node => inner.append(node));
  panel.append(inner); details.append(panel);
  panel.hidden = !details.open; panel.inert = !details.open;
  summary.setAttribute('aria-expanded', String(details.open));
  summary.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    const expanded = !(disclosureStates.get(panel)?.expanded ?? details.open);
    if (expanded) details.open = true;
    else if (panel.contains(document.activeElement)) summary.focus({ preventScroll: true });
    summary.setAttribute('aria-expanded', String(expanded));
    revealPanel(panel, expanded, { afterClose: () => { details.open = false; } });
  });
  details.addEventListener('toggle', () => {
    const state = disclosureStates.get(panel);
    if (state?.animation || state?.expanded === details.open) return;
    summary.setAttribute('aria-expanded', String(details.open));
    revealPanel(panel, details.open, { afterClose: () => { details.open = false; } });
  });
});

/* One navigation list follows the homepage journey on every viewport. */
const menuButton = document.querySelector('[data-menu-button]');
const navigation = document.querySelector('[data-navigation]');
const header = document.querySelector('.site-header');
const menuBackdrop = document.querySelector('[data-menu-backdrop]');
const desktopView = window.matchMedia('(min-width: 1101px)');
function setMenu(open, { restoreFocus = false, focusFirst = false, instant = false } = {}) {
  const mobile = !desktopView.matches;
  const expanded = mobile && open;
  revealPanel(navigation, !mobile || expanded, { kind: 'menu', instant: instant || !mobile });
  menuButton?.setAttribute('aria-expanded', String(expanded));
  menuButton?.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  document.documentElement.classList.toggle('has-mobile-menu', expanded);
  revealPanel(menuBackdrop, expanded, { kind: 'fade', instant: instant || !mobile });
  if (restoreFocus && mobile) menuButton?.focus();
  if (expanded && focusFirst) navigation?.querySelector('a')?.focus({ preventScroll: true });
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  setMenu(open, { restoreFocus: !open, focusFirst: open });
});
menuBackdrop?.addEventListener('click', () => setMenu(false, { restoreFocus: true }));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    event.preventDefault(); setMenu(false, { restoreFocus: true });
  }
});
document.addEventListener('click', event => {
  if (!header?.contains(event.target)) setMenu(false);
});
document.addEventListener('focusin', event => {
  if (!header?.contains(event.target)) setMenu(false);
});
const pagePath = path => path.replace(/index\.html$/, '');
header?.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  setMenu(false);
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || pagePath(destination.pathname) !== pagePath(window.location.pathname) || !destination.hash) return;
  const section = document.getElementById(destination.hash.slice(1));
  if (section) window.requestAnimationFrame(() => {
    section.tabIndex = -1; section.focus({ preventScroll: true });
  });
});
desktopView.addEventListener('change', () => {
  const focusWasInNav = navigation?.contains(document.activeElement);
  const focusWasOnToggle = document.activeElement === menuButton;
  setMenu(false, { instant: true });
  if (!desktopView.matches && focusWasInNav) menuButton?.focus();
  if (desktopView.matches && focusWasOnToggle) navigation?.querySelector('a')?.focus();
});
setMenu(false, { instant: true });
header?.classList.add('nav-ready');

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('[data-reveal]').forEach(element => {
    observer.observe(element); element.classList.add('will-reveal');
  });
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    document.querySelectorAll('.will-reveal').forEach(element => element.classList.add('is-visible'));
  });
}

/* All five original healcode elements exist before the provider is loaded.
   A single explicit request loads the same five-widget setup used by the live
   studio page. Subsequent panels reveal an existing widget, without guessing
   at undocumented initialisers or injecting the provider repeatedly. */
let bookingLoad;
function loadBookingProvider() {
  if (bookingLoad) return bookingLoad;
  const statuses = document.querySelectorAll('.booking-widget [role="status"]');
  statuses.forEach(status => {
    status.textContent = 'Booking is supplied by Mindbody. If the panel does not appear, open Mindbody directly or call the studio.';
  });
  bookingLoad = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://widgets.mindbodyonline.com/javascripts/healcode.js';
    script.async = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => {
      statuses.forEach(status => {
        status.textContent = 'Mindbody could not be loaded. Please open Mindbody directly or call 0411 292 672.';
      });
      script.remove(); bookingLoad = null; reject(new Error('Mindbody loader unavailable'));
    }, { once: true });
    document.head.append(script);
  });
  return bookingLoad;
}
const bookingButtons = [...document.querySelectorAll('[data-load-booking]')];
function setBookingPanel(button, open) {
  bookingButtons.forEach(candidate => {
    const region = document.getElementById(candidate.getAttribute('aria-controls'));
    if (!region) return;
    const expanded = candidate === button && open;
    candidate.setAttribute('aria-expanded', String(expanded));
    revealPanel(region, expanded);
    if (expanded) {
      candidate.querySelector('.booking-label').textContent = 'Close booking panel';
      candidate.setAttribute('aria-label', 'Close ' + region.getAttribute('aria-label'));
    } else {
      candidate.querySelector('.booking-label').textContent = 'View times & book';
      candidate.removeAttribute('aria-label');
    }
  });
  if (open) loadBookingProvider().catch(() => { /* Phone and direct links remain available. */ });
}
bookingButtons.forEach(button => {
  button.addEventListener('click', () => {
    setBookingPanel(button, button.getAttribute('aria-expanded') !== 'true');
  });
});
function bookingButtonForHash(hash) {
  if (!hash.startsWith('#book-')) return null;
  return bookingButtons.find(button => button.closest('.booking-option')?.id === hash.slice(1));
}
const bookingSlugs = ['sauna', 'water', 'compression', 'heat-water', 'all-zones'];
function revealBookingHash() {
  const fragment = window.location.hash.slice(1);
  let hash = window.location.hash;
  if (bookingButtons.length && bookingSlugs.includes(fragment)) {
    hash = '#book-' + fragment;
    window.history.replaceState(null, '', hash);
    window.requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
  }
  const button = bookingButtonForHash(hash);
  if (button) setBookingPanel(button, true);
  if (!bookingButtons.length && fragment.startsWith('book-') && bookingSlugs.includes(fragment.slice(5))) {
    const bookingLink = document.querySelector('.header-cta');
    if (!bookingLink) return;
    const destination = new URL(bookingLink.href);
    destination.hash = fragment; window.location.replace(destination.href);
  }
}
window.addEventListener('hashchange', revealBookingHash);
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || pagePath(destination.pathname) !== pagePath(window.location.pathname)) return;
  const button = bookingButtonForHash(destination.hash);
  if (!button) return;
  setBookingPanel(button, true);
  window.requestAnimationFrame(() => button.focus({ preventScroll: true }));
});
revealBookingHash();
/* Web3Forms enquiries. A missing key leaves the rendered form disabled.
   No submission data is stored locally and no success is inferred from HTTP alone. */
const enquiryForm = document.querySelector('[data-enquiry-form]');
if (enquiryForm) {
  const enabled = enquiryForm.dataset.enabled === 'true' && Boolean(enquiryForm.elements.namedItem('access_key')?.value.trim());
  const fieldset = enquiryForm.querySelector('fieldset');
  const submit = enquiryForm.querySelector('[data-enquiry-submit]');
  const status = enquiryForm.querySelector('[data-form-status]');
  const topic = enquiryForm.elements.namedItem('enquiry');
  const fields = ['name', 'email', 'phone', 'enquiry', 'message'].map(name => enquiryForm.elements.namedItem(name));
  const captchaRequired = enquiryForm.dataset.captcha === 'true';
  const captchaGroup = enquiryForm.querySelector('.form-verification');
  const captchaError = enquiryForm.querySelector('#captcha-error');
  const originalSubmit = submit.innerHTML;
  let submitting = false;
  const requestedTopic = new URLSearchParams(window.location.search).get('enquiry');
  if ([...topic.options].some(option => option.value === requestedTopic)) {
    [...topic.options].forEach(option => { option.defaultSelected = option.value === requestedTopic; });
    topic.value = requestedTopic;
  }
  const enquiryContext = document.querySelector('[data-enquiry-context]');
  const topics = {
    membership: ['Membership enquiry', 'Interested in membership? Ask about joining, inclusions and the full terms.'],
    'first-visit': ['First visit enquiry', 'Have a question about your first visit? Tell us which zone you’re interested in.'],
    booking: ['Booking question', 'Need a hand with a booking? Include the session and date in your email.']
  };
  if (Object.hasOwn(topics, requestedTopic)) {
    if (enquiryContext) {
      enquiryContext.textContent = topics[requestedTopic][1]; enquiryContext.hidden = false;
    }
  }
  if (enabled) enquiryForm.noValidate = true;
  function showStatus(message, state = '') {
    status.textContent = message; status.dataset.state = state;
  }
  function validateField(field) {
    const value = field.value.trim();
    let error = '';
    if (field.name === 'name' && value.length < 2) error = 'Please enter your name.';
    if (field.name === 'email' && (!value || field.validity.typeMismatch)) error = 'Please enter a valid email address.';
    if (field.name === 'enquiry' && ![...topic.options].some(option => option.value === value)) error = 'Please choose an enquiry type.';
    if (field.name === 'message' && value.length < 10) error = 'Please enter a message of at least 10 characters.';
    if (field.maxLength > 0 && value.length > field.maxLength) error = 'Please use no more than ' + field.maxLength + ' characters.';
    const message = document.getElementById(field.id + '-error');
    message.textContent = error;
    message.hidden = !error;
    if (error) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !error;
  }
  fields.forEach(field => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    field.addEventListener('change', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });
  enquiryForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!enabled) {
      showStatus('Online enquiries are currently unavailable. Please call or email the studio.', 'error');
      return;
    }
    if (submitting) return;
    const invalid = fields.filter(field => !validateField(field));
    if (invalid.length) {
      showStatus('Please check the highlighted fields.', 'error');
      invalid[0].focus(); return;
    }
    if (enquiryForm.elements.namedItem('botcheck').checked) {
      showStatus('Unable to submit this enquiry. Please contact the studio directly.', 'error'); return;
    }
    const captchaToken = enquiryForm.querySelector('[name="h-captcha-response"]')?.value.trim();
    if (captchaRequired && !captchaToken) {
      captchaError.textContent = 'Please complete the verification. If it hasn’t loaded, call or email the studio.';
      captchaError.hidden = false;
      captchaGroup.setAttribute('aria-invalid', 'true');
      captchaGroup.tabIndex = -1; captchaGroup.focus();
      showStatus('Please complete the verification before sending.', 'error'); return;
    }
    if (captchaError) { captchaError.hidden = true; captchaGroup.removeAttribute('aria-invalid'); }
    const formData = new FormData(enquiryForm);
    formData.delete('redirect'); // Native HTML uses a redirect; the enhanced flow expects JSON.
    const payload = Object.fromEntries(formData.entries());
    ['name', 'email', 'phone', 'message'].forEach(name => { payload[name] = payload[name].trim(); });
    const topicName = topic.options[topic.selectedIndex].textContent;
    payload.subject = '3 Zone Recovery enquiry — ' + topicName;
    payload.botcheck = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    const previouslyDisabled = fieldset.disabled;
    submitting = true;
    fieldset.disabled = true;
    enquiryForm.setAttribute('aria-busy', 'true');
    submit.textContent = 'Sending…';
    showStatus('Sending your enquiry…');
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new Error('Unexpected form response');
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Enquiry not confirmed');
      enquiryForm.reset();
      showStatus('Thank you. Your enquiry has been submitted.', 'success');
    } catch {
      showStatus('We couldn’t confirm your enquiry was sent. Your message is still here. Please try again, or call or email the studio.', 'error');
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      fieldset.disabled = previouslyDisabled;
      enquiryForm.setAttribute('aria-busy', 'false');
      submit.innerHTML = originalSubmit;
      if (captchaRequired && window.hcaptcha) {
        try { window.hcaptcha.reset(); } catch { /* Direct contact links remain available. */ }
      }
    }
  });
}
