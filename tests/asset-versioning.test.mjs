import assert from 'node:assert/strict';
import { versionAssetReferences } from '../build/version-assets.mjs';

const versions = new Map([
  ['/assets/styles.css', 'new-css'],
  ['/assets/navigation.js', 'new-nav'],
  ['/assets/icons.svg', 'new-icons'],
  ['/groove/app/js/groove_writer.js', 'new-editor'],
  ['/groove/app/css/groove_display_orange.css', 'new-toolbar'],
]);
const html = `<link href="../assets/styles.css?v=old" rel="stylesheet">
<script defer src="/assets/navigation.js"></script>
<svg><use href="/assets/icons.svg#home"></use></svg>
<a href="https://example.com/assets/styles.css">External</a>
<a href="#contact">Contact</a><img src="/img/dave.webp">`;
const versioned = versionAssetReferences(html, 'lessons/index.html', versions);
assert.match(versioned, /href="\.\.\/assets\/styles\.css\?v=new-css"/);
assert.match(versioned, /src="\/assets\/navigation\.js\?v=new-nav"/);
assert.match(versioned, /href="\/assets\/icons\.svg\?v=new-icons#home"/);
assert.match(versioned, /href="https:\/\/example.com\/assets\/styles\.css"/);
assert.match(versioned, /href="#contact"/);
assert.match(versioned, /src="\/img\/dave\.webp"/);
assert.equal(versionAssetReferences(versioned, 'lessons/index.html', versions), versioned);
versions.set('/assets/styles.css', 'changed-css');
const updated = versionAssetReferences(versioned, 'lessons/index.html', versions);
assert.match(updated, /styles\.css\?v=changed-css/);
assert.match(updated, /navigation\.js\?v=new-nav/);
const editor = versionAssetReferences('<script src="js/groove_writer.js"></script><link href="css/groove_display_orange.css" rel="stylesheet">', 'groove/app/index.html', versions);
assert.match(editor, /src="js\/groove_writer\.js\?v=new-editor"/);
assert.match(editor, /href="css\/groove_display_orange\.css\?v=new-toolbar"/);
console.log('PASS: Changed UI assets receive fresh URLs; relative paths, SVG fragments and external links survive');
