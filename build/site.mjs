import { cp, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, resetOutput } from './common.mjs';
import { buildTools } from './tools.mjs';
import { verifySite } from './verify.mjs';

await buildTools();
const output = await resetOutput('dist');
for (const name of ['assets', 'img', 'lessons', 'recording', 'watch', 'notation', 'metronome', 'groove', 'rudiments', 'rhythm', 'help']) {
  await cp(resolve(ROOT, name), resolve(output, name), {
    recursive: true
  });
}
for (const name of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'CNAME', 'LICENSE']) await copyFile(resolve(ROOT, name), resolve(output, name));
await writeFile(resolve(output, '.nojekyll'), '');
await verifySite(output);
console.log(`Complete website built in ${output}`);
