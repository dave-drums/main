import { spawn } from 'node:child_process';
import { lstat, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const METRONOME = resolve(ROOT, 'apps/metronome');
export const GROOVE = resolve(ROOT, 'apps/groovelab');
export const appRequire = createRequire(resolve(METRONOME, 'package.json'));
export const VITE = resolve(dirname(appRequire.resolve('vite/package.json')), 'bin/vite.js');

export function runNode(file, args = [], cwd = ROOT) {
  return new Promise((accept, reject) => {
    const child = spawn(process.execPath, [file, ...args], { cwd, stdio: 'inherit', windowsHide: true });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? accept() : reject(new Error(`${relative(ROOT, file)} exited with ${code}`)));
  });
}

// Only these disposable build directories may be recursively cleared.
export async function resetOutput(name) {
  if (!['dist', 'metronome/app', 'groove/app'].includes(name)) throw new Error(`Unexpected output: ${name}`);
  const target = resolve(ROOT, name);
  if (target === resolve(ROOT) || !target.startsWith(resolve(ROOT) + sep)) throw new Error('Output escaped the checkout');
  let ancestor = resolve(ROOT);
  for (const part of name.split('/')) {
    ancestor = resolve(ancestor, part);
    const entry = await lstat(ancestor).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (entry?.isSymbolicLink()) throw new Error(`Refusing to clear linked output: ${ancestor}`);
  }
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  return target;
}
