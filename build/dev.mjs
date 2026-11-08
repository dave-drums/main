import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, METRONOME, GROOVE } from './common.mjs';
import { buildTools } from './tools.mjs';
import { serveSite } from './serve.mjs';

await buildTools();
const port = Number(process.env.PORT || 4177);
const server = await serveSite({ port });
console.log(`Dave Drums, metronome and Groove Lab: http://127.0.0.1:${port}/`);
console.log('Tool source changes rebuild automatically. Refresh the browser after saving.');
let timer;
let building = false;
let queued = false;
const rebuild = async () => {
  if (building) { queued = true; return; }
  building = true;
  try { await buildTools(); }
  catch (error) { console.error('Tool build failed:', error.message); }
  finally {
    building = false;
    if (queued) { queued = false; rebuild(); }
  }
};
const generated = /(?:^|\/)(?:dave-drums-theme\.css|tempo-stepper\.js|playback-timer\.js|context-help\.js|tool-icons\.json)$|^(?:fonts\/|images\/(?:icons\/|tool-icons\.svg|icons-LICENSE\.txt))$/;
const watchers = [
  [resolve(ROOT, 'assets'), name => /^(?:styles\.css|icons\.svg|icons-LICENSE\.txt|tempo-stepper\.js|playback-timer\.js|context-help\.js|metronome-(?:normal|high)\.mp3|fonts\/)/.test(name)],
  [resolve(METRONOME, 'src'), name => !generated.test(name)],
  [resolve(METRONOME, 'public'), name => !name.startsWith('fonts/') && !['assets/icons-LICENSE.txt', 'assets/metronome.svg', 'assets/metronome-normal.mp3', 'assets/metronome-high.mp3'].includes(name)],
  [GROOVE, name => !generated.test(name) && !name.startsWith('fonts/') && !name.startsWith('images/icons/')],
  [METRONOME, name => /^vite\.config\.js$/.test(name)]
].map(([folder, relevant]) => watch(folder, { recursive: folder !== METRONOME }, (_, file) => {
  const name = String(file || '').replaceAll('\\', '/');
  if (!relevant(name)) return;
  clearTimeout(timer); timer = setTimeout(rebuild, 250);
}));
const close = () => {
  clearTimeout(timer); watchers.forEach(watcher => watcher.close()); server.close();
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
