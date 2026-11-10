import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT } from './common.mjs';

// Support the authoring checkout and the original ready-to-copy public folder.
export async function includeThreeZone(output, root = ROOT) {
  const source = resolve(root, '3zone');
  let publicFolder = source;
  if (existsSync(resolve(source, 'build/build.py'))) {
    const python = process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
    const args = process.platform === 'win32' && !process.env.PYTHON ? ['-3'] : [];
    await new Promise((accept, reject) => {
      const child = spawn(python, [...args, 'build/build.py', '--demo'], {
        cwd: source, stdio: 'inherit', windowsHide: true
      });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? accept() : reject(new Error(`3 Zone build exited with ${code}`)));
    });
    publicFolder = resolve(source, 'demo/3zone');
    if (!existsSync(resolve(publicFolder, 'index.html'))) throw new Error('3 Zone build did not produce its public demo');
  }
  if (existsSync(resolve(publicFolder, 'index.html'))) {
    await cp(publicFolder, resolve(output, '3zone'), { recursive: true });
  }
}
