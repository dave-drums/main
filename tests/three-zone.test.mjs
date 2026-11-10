import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { includeThreeZone } from '../build/three-zone.mjs';

const fixture = await mkdtemp(resolve(tmpdir(), 'three-zone-build-'));
try {
  const output = resolve(fixture, 'public');
  await mkdir(output);
  await includeThreeZone(output, fixture);
  assert.ok(!existsSync(resolve(output, '3zone')), 'Absent demo should be skipped');
  await mkdir(resolve(fixture, '3zone'));
  await writeFile(resolve(fixture, '3zone/index.html'), '<h1>Public demo</h1>');
  await includeThreeZone(output, fixture);
  assert.equal(await readFile(resolve(output, '3zone/index.html'), 'utf8'), '<h1>Public demo</h1>');
  await rm(resolve(output, '3zone'), { recursive: true });

  // Exercise the real source build: generated folders are ignored in Git/CI.
  await includeThreeZone(output);
  const demo = resolve(output, '3zone');
  assert.match(await readFile(resolve(demo, 'index.html'), 'utf8'), /noindex,follow/);
  for (const page of ['booking/index.html', 'contact/index.html']) {
    assert.ok(existsSync(resolve(demo, page)), `Missing demo page: ${page}`);
  }
  assert.ok(existsSync(resolve(demo, 'assets/favicon.png')));
  for (const file of await readdir(demo, { recursive: true })) {
    assert.doesNotMatch(file, /(?:^|[\\/])(?:build|demo|dist|\.local)(?:[\\/]|$)|\.(?:py|md)$|-source\./i);
  }
  console.log('PASS: 3 Zone builds from source into /3zone with no authoring files; public-folder fallback remains supported.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
