import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { ROOT, METRONOME, GROOVE } from './common.mjs';

export async function syncToolTheme({ check = false } = {}) {
  const source = await readFile(resolve(ROOT, 'assets/styles.css'), 'utf8');
  const tokens = source.match(/:root \{[\s\S]*?\n\}/)[0].replace(':root {', ':root, :host {');
  const shared = source.split('/* TOOL UI SHARED START')[1].split('/* TOOL UI SHARED END */')[0].split('*/').slice(1).join('*/').trim();
  const spriteBytes = await readFile(resolve(ROOT, 'assets/icons.svg'));
  const dom = new JSDOM(spriteBytes.toString(), { contentType: 'image/svg+xml' });
  const symbols = new Map([...dom.window.document.querySelectorAll('symbol')].map(symbol => [symbol.id, symbol]));
  const data = name => {
    const symbol = symbols.get(name);
    return { viewBox: symbol.getAttribute('viewBox'), nodes: [...symbol.children].map(node => [
      node.localName, Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]))
    ]) };
  };
  const files = new Map();
  const fonts = ['inter-latin.woff2', 'dm-sans-latin.woff2', 'Inter-OFL.txt', 'DM-Sans-OFL.txt'];
  for (const [target, css, fontFolder] of [[METRONOME, 'src/dave-drums-theme.css', 'public/fonts'], [GROOVE, 'css/dave-drums-theme.css', 'fonts']]) {
    const faces = target === GROOVE ? [
      ['Inter', fonts[0], '400 800'], ['"DM Sans"', fonts[1], '400 700'], ['"DM-Sans"', fonts[1], '400 700']
    ].map(([family, file, weight]) => `@font-face { font-family: ${family}; src: url("../fonts/${file}") format("woff2"); font-weight: ${weight}; font-style: normal; font-display: swap; }`).join('\n') : '';
    files.set(resolve(target, css), `/* Generated from assets/styles.css by build/sync-tool-theme.mjs. */\n${faces}\n${tokens}\n\n${shared}\n`);
    for (const font of fonts) files.set(resolve(target, fontFolder, font), await readFile(resolve(ROOT, 'assets/fonts', font)));
  }
  for (const file of ['tempo-stepper.js', 'playback-timer.js', 'context-help.js']) files.set(resolve(METRONOME, 'src', file), await readFile(resolve(ROOT, 'assets', file)));
  files.set(resolve(GROOVE, 'js/context-help.js'), await readFile(resolve(ROOT, 'assets/context-help.js')));
  files.set(resolve(METRONOME, 'src/tool-icons.json'), JSON.stringify(Object.fromEntries(
    ['close', 'minus', 'plus', 'speaker-off', 'chevron-up', 'stop', 'play', 'tap'].map(name => [name, data(name)])
  ), null, 2) + '\n');
  for (const name of ['normal', 'high']) files.set(resolve(METRONOME, `public/assets/metronome-${name}.mp3`), await readFile(resolve(ROOT, `assets/metronome-${name}.mp3`)));
  const iconLicense = await readFile(resolve(ROOT, 'assets/icons-LICENSE.txt'));
  files.set(resolve(METRONOME, 'public/assets/icons-LICENSE.txt'), iconLicense);
  files.set(resolve(GROOVE, 'images/icons-LICENSE.txt'), iconLicense);
  files.set(resolve(GROOVE, 'images/tool-icons.svg'), spriteBytes);
  files.set(resolve(METRONOME, 'public/assets/metronome.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512"><rect width="64" height="64" rx="14" fill="#111517"/><g transform="translate(12 12) scale(1.666667)" fill="none" stroke="#71d5f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbols.get('metronome').innerHTML}</g></svg>\n`);
  for (const name of ['play', 'stop', 'repeat', 'maximize', 'minimize', 'sticks', 'check']) {
    const filled = ['play', 'stop'].includes(name);
    files.set(resolve(GROOVE, `images/icons/${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data(name).viewBox}" fill="${filled ? 'black' : 'none'}" stroke="${filled ? 'none' : 'black'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbols.get(name).innerHTML}</svg>\n`);
  }
  for (const [path, value] of files) {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
    if (check) {
      const existing = await readFile(path).catch(() => Buffer.alloc(0));
      if (!existing.equals(bytes)) throw new Error(`Outdated shared tool asset: ${path}`);
    } else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
  }
  dom.window.close();
  console.log(`Shared tool assets ${check ? 'verified' : 'synchronized'} within this repository.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await syncToolTheme({ check: process.argv.includes('--check') });
