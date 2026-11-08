import { resolve, dirname } from 'node:path';
import { readdir } from 'node:fs/promises';
import { ROOT, METRONOME, appRequire, runNode } from './common.mjs';
import { syncToolTheme } from './sync-tool-theme.mjs';

await syncToolTheme();
await runNode(resolve(dirname(appRequire.resolve('vitest/package.json')), 'vitest.mjs'), ['run'], METRONOME);
for (const file of (await readdir(resolve(ROOT, 'tests'))).filter(name => name.endsWith('.test.mjs')).sort()) {
  await runNode(resolve(ROOT, 'tests', file));
}
