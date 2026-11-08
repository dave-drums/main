import { cp, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { METRONOME, GROOVE, VITE, appRequire, resetOutput, runNode } from './common.mjs';
import { syncToolTheme } from './sync-tool-theme.mjs';

export async function buildTools() {
  await syncToolTheme();
  const met = await resetOutput('metronome/app');
  const groove = await resetOutput('groove/app');
  await cp(resolve(METRONOME, 'public'), met, { recursive: true });
  await cp(GROOVE, groove, { recursive: true });
  await copyFile(resolve(METRONOME, 'LICENSE'), resolve(met, 'LICENSE'));
  await copyFile(resolve(METRONOME, 'NOTICE.txt'), resolve(met, 'NOTICE.txt'));
  await mkdir(resolve(met, 'licenses'), { recursive: true });
  for (const name of ['react', 'react-dom']) {
    await copyFile(resolve(dirname(appRequire.resolve(`${name}/package.json`)), 'LICENSE'), resolve(met, 'licenses', `${name}.txt`));
  }
  await runNode(VITE, ['build', '--config', 'vite.config.js', '--outDir', resolve(met, 'embed')], METRONOME);
  const hash = createHash('sha256');
  for (const file of ['metronome.js', 'metronome.css']) hash.update(await readFile(resolve(met, 'embed', file)));
  await writeFile(resolve(met, 'version.json'), JSON.stringify({ version: hash.digest('hex').slice(0, 16) }) + '\n');
  console.log('Metronome and Groove Lab are available from /metronome/app/ and /groove/app/.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildTools();
