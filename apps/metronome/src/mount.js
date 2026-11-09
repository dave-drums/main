import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Metronome from './Metronome.js';
import { loadFonts } from './fonts.js';

const active = new WeakMap();
const ownedShadows = new WeakMap();

export async function mountApplication(target, { cssHref } = {}) {
  const host = typeof target === 'string' ? document.querySelector(target) : target;
  if (!(host instanceof HTMLElement)) throw new Error('Metronome container not found');
  if (active.has(host)) throw new Error('Metronome container already mounted');
  if (host.shadowRoot && !ownedShadows.has(host)) throw new Error('Container already has a shadow root');
  const token = {};
  active.set(host, token);
  const assetBase = new URL(import.meta.env.BASE_URL, window.location.origin).href;
  const parent = ownedShadows.get(host) || host.attachShadow({ mode: 'open' });
  ownedShadows.set(host, parent);
  const surface = document.createElement('div');
  surface.className = 'metronome-surface tool-ui';
  surface.tabIndex = 0; surface.setAttribute('aria-label', 'Metronome');
  let root;
  try {
    const stylesReady = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = cssHref;
      const timeout = setTimeout(() => reject(new Error('Metronome stylesheet timed out')), 15000);
      link.onload = () => { clearTimeout(timeout); resolve(); };
      link.onerror = () => { clearTimeout(timeout); reject(new Error(`Unable to load metronome stylesheet: ${link.href}`)); };
      parent.append(link);
    });
    // Font failures must not prevent the controls from becoming available.
    loadFonts(assetBase);
    await stylesReady;
    parent.append(surface);
    root = createRoot(surface);
    flushSync(() => root.render(React.createElement(Metronome, { assetBase, keyboardTarget: surface })));
  } catch (error) {
    root?.unmount(); parent.replaceChildren(); active.delete(host); throw error;
  }
  return { unmount() {
    if (active.get(host) !== token) return;
    flushSync(() => root.unmount()); parent.replaceChildren(); active.delete(host);
  } };
}
