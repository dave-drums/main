import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

export async function verifySite(output) {
  const text = file => readFile(resolve(output, file), 'utf8');
  const files = new Set();
  const walk = async folder => {
    for (const entry of await readdir(resolve(output, folder), { withFileTypes: true })) {
      const name = folder ? `${folder}/${entry.name}` : entry.name;
      assert.ok(!entry.isSymbolicLink(), `Symlink in deployment: ${name}`);
      if (entry.isDirectory()) await walk(name); else files.add(name);
    }
  };
  await walk('');
  for (const name of ['apps', 'build', 'tests', '.local', 'node_modules', '.git', 'package.json', 'package-lock.json']) assert.ok(!files.has(name) && ![...files].some(file => file.startsWith(name + '/')), `Private build material in deployment: ${name}`);
  for (const file of files) assert.doesNotMatch(file, /(?:\.(?:md|bat|py|wav)$|(?:^|\/)__pycache__\/)/i, `Development/archive file in deployment: ${file}`);
  assert.equal((await text('CNAME')).trim(), 'www.davedrums.com.au');
  const loader = await text('assets/metronome.js');
  assert.ok(loader.includes('../metronome/app/'));
  assert.doesNotMatch(loader, /dave-drums\.github\.io/);
  const groove = new JSDOM(await text('groove/index.html')).window.document;
  assert.equal(groove.getElementById('groove-frame').getAttribute('src'), '/groove/app/');
  const manifest = JSON.parse(await text('metronome/app/version.json'));
  const hash = createHash('sha256');
  for (const file of ['metronome.js', 'metronome.css']) hash.update(await readFile(resolve(output, 'metronome/app/embed', file)));
  assert.equal(manifest.version, hash.digest('hex').slice(0, 16));
  const embed = await text('metronome/app/embed/metronome.js');
  assert.ok(embed.includes('/metronome/app/'));
  assert.doesNotMatch(embed, /serviceWorker|registerSW|dave-drums\.github\.io\/metronome\//);
  const samples = { low: '72423da31cdda03df5391a3d077013b54a15d59d', normal: '99b387f43c905ba13f65ba45306f55dbf20c390c', high: '84805287c61d3a05493eca02066830da8e5b24e6' };
  for (const [name, expected] of Object.entries(samples)) {
    const bytes = await readFile(resolve(output, `metronome/app/assets/metronome-${name}.mp3`));
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), expected);
  }
  for (const file of ['metronome/app/LICENSE', 'metronome/app/NOTICE.txt', 'metronome/app/licenses/react.txt', 'metronome/app/licenses/react-dom.txt', 'groove/app/LICENSE.txt', 'groove/app/SOURCE-NOTICE.txt', 'groove/app/soundfont/gunshot-mp3.js']) assert.ok(files.has(file), `Missing tool asset/notice: ${file}`);
  // Check real local references in the public tool shells and imported Groove entry points.
  for (const file of [...files].filter(name => name.endsWith('.html'))) {
    const doc = new JSDOM(await text(file)).window.document;
    for (const node of doc.querySelectorAll('link[rel="stylesheet"],script[src],use[href]')) {
      const source = node.getAttribute('src') || node.getAttribute('href');
      const url = new URL(source, `https://www.davedrums.com.au/${file}`);
      if (url.origin !== 'https://www.davedrums.com.au' || !/^\/(?:assets|groove\/app\/(?:js|css))\/[^/]+\.(?:css|js|svg)$/.test(url.pathname)) continue;
      const bytes = await readFile(resolve(output, url.pathname.slice(1)));
      const expected = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
      assert.equal(url.searchParams.get('v'), expected, `${file} must use the current version of ${url.pathname}`);
    }
    for (const node of doc.querySelectorAll('script[src],link[rel="stylesheet"],img[src],iframe[src]')) {
      const source = node.getAttribute('src') || node.getAttribute('href');
      const url = new URL(source, `https://www.davedrums.com.au/${file}`);
      if (url.origin !== 'https://www.davedrums.com.au') continue;
      let name = decodeURIComponent(url.pathname).slice(1);
      if (name.endsWith('/')) name += 'index.html';
      assert.ok(files.has(name), `${file} points to missing ${name}`);
    }
  }
  // Groove's notation embed adds its dependencies at runtime rather than in HTML.
  const display = await text('groove/app/js/groove_display.js');
  for (const [, relative] of display.matchAll(/root\.loadjscssfile\("([^"]+)"/g)) {
    const path = new URL(relative, 'https://www.davedrums.com.au/groove/app/js/groove_display.js').pathname.slice(1);
    assert.ok(files.has(path), `Notation embed points to missing ${path}`);
  }
  for (const file of [...files].filter(name => name.endsWith('.css'))) {
    for (const [, source] of (await text(file)).matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
      if (/^(?:data:|#)/.test(source)) continue;
      const url = new URL(source, `https://www.davedrums.com.au/${file}`);
      if (url.origin !== 'https://www.davedrums.com.au') continue;
      assert.ok(files.has(decodeURIComponent(url.pathname).slice(1)), `${file} points to missing ${source}`);
    }
  }
  console.log('PASS: One deployable site, local tool loaders, exact original clicks, versioned JS/CSS, licences and tool asset references.');
}
