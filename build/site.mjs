import { transform } from 'lightningcss';
import { cp, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, resetOutput } from './common.mjs';
import { buildTools } from './tools.mjs';
import { verifySite } from './verify.mjs';
import { versionSiteAssets } from './version-assets.mjs';
import { includeThreeZone } from './three-zone.mjs';

await buildTools();
const output = await resetOutput('dist');
for (const name of ['assets', 'img', 'lessons', 'recording', 'watch', 'notation', 'metronome', 'groove', 'rudiments', 'rhythm', 'help']) {
  await cp(resolve(ROOT, name), resolve(output, name), {
    recursive: true
  });
}
await includeThreeZone(output);
for (const name of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'CNAME', 'LICENSE']) await copyFile(resolve(ROOT, name), resolve(output, name));
// Minify the deployed stylesheet; keep the labelled source readable.
const stylesheet = resolve(output, 'assets/styles.css');
const { code } = transform({ filename: stylesheet, code: await readFile(stylesheet), minify: true });
await writeFile(stylesheet, code);
// New deployments must not pair fresh markup with a visitor's cached UI assets.
await versionSiteAssets(output);
await writeFile(resolve(output, '.nojekyll'), '');
await verifySite(output);
console.log(`Complete website built in ${output}`);
