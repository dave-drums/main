import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('../apps/groovelab/js/groove_display.js', import.meta.url), 'utf8');
for (const current of [true, false]) {
  const dom = new JSDOM(`<script src="/groove/app/js/groove_display.js?v=1"></script>
    <script src="/assets/tools.js"></script>`, {
    url: 'https://www.davedrums.com.au/groove/app/GrooveEmbed.html', runScripts: 'outside-only'
  });
  try {
    const doc = dom.window.document;
    Object.defineProperty(doc, 'currentScript', { value: current ? doc.scripts[0] : null });
    dom.window.eval(source);
    assert.equal(dom.window.GrooveDisplay.getLocalScriptRoot(), 'https://www.davedrums.com.au/groove/app/js/');
    const added = [...doc.querySelectorAll('script[src],link[href]')].slice(2);
    assert.ok(added.length > 10);
    for (const node of added) {
      const url = new URL(node.src || node.href);
      assert.ok(url.pathname.startsWith('/groove/app/'), `Embed dependency escaped its app: ${url}`);
    }
    assert.ok(added.some(node => node.src?.endsWith('/groove/app/js/groove_utils.js')));
    assert.ok(added.some(node => node.href?.endsWith('/groove/app/css/groove_display.css')));
  } finally { dom.window.close(); }
}
console.log('PASS: Notation embed resolves its dependencies beside its own script, including deferred loading with later script tags.');
