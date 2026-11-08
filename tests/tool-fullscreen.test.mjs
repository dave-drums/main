// Shared fullscreen behavior without relying on a browser's privileged UI.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/tools.js', import.meta.url), 'utf8');
class Element {
  children = [];
  listeners = {};
  attrs = {};
  hidden = true;
  append(...nodes) { this.children.push(...nodes); }
  prepend(node) { this.children.unshift(node); }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
}
function fixture(supported = true) {
  const listeners = [];
  const items = ['metronome', 'groove', 'rudiments'].map((name) => {
    const button = new Element();
    button.dataset = { toolFullscreen: `${name}-workspace`, toolName: name };
    const workspace = new Element(), feedback = new Element(), app = new Element();
    workspace.append(app);
    workspace.querySelector = () => feedback;
    return { name, button, workspace, feedback, app };
  });
  const document = {
    fullscreenEnabled: supported, fullscreenElement: null,
    createElement: () => new Element(),
    querySelectorAll: (selector) => selector === '[data-tool-fullscreen]' ? items.map((item) => item.button) : [],
    getElementById: (id) => items.find((item) => item.button.dataset.toolFullscreen === id)?.workspace,
    addEventListener: (name, callback) => { assert.equal(name, 'fullscreenchange'); listeners.push(callback); },
    async exitFullscreen() { this.fullscreenElement = null; listeners.forEach((callback) => callback()); },
  };
  for (const item of items) item.workspace.requestFullscreen = async () => {
    document.fullscreenElement = item.workspace;
    listeners.forEach((callback) => callback());
  };
  vm.runInNewContext(source, { document });
  return { document, items };
}

const { document, items } = fixture();
for (const { name, workspace, button, feedback, app } of items) {
  const toolbar = workspace.children[0], exit = toolbar.children[0];
  assert.equal(toolbar.className, 'tool-fullscreen-toolbar section-shell tool-ui');
  assert.equal(exit.textContent, 'Exit Full Screen');
  assert.equal(button.hidden, false);
  await button.listeners.click();
  assert.equal(document.fullscreenElement, workspace);
  assert.equal(button.attrs['aria-pressed'], 'true');
  assert.equal(exit.focused, true);
  assert.equal(workspace.children[1], app, `${name} remains mounted`);
  await exit.listeners.click();
  assert.equal(document.fullscreenElement, null);
  assert.equal(button.attrs['aria-pressed'], 'false');
  assert.equal(button.focused, true);
  button.focused = false;
  await button.listeners.click();
  await document.exitFullscreen(); // Browser Escape fires the same event.
  assert.equal(button.focused, true);
  workspace.requestFullscreen = async () => { throw new Error('Unavailable'); };
  await button.listeners.click();
  assert.match(feedback.textContent, /Full screen isn’t available/);
}
for (const { button, workspace } of fixture(false).items) {
  assert.equal(button.hidden, true);
  assert.equal(workspace.children.length, 1);
}
const css = await readFile(new URL('../assets/styles.css', import.meta.url), 'utf8');
assert.match(css, /\.app-workspace:fullscreen > \.tool-intro,\s*\.app-workspace:fullscreen > \.tool-guide\s*\{\s*display: none;/);
assert.match(css, /\.tool-fullscreen-toolbar\s*\{\s*display: none;/);
for (const page of ['metronome','groove','rudiments']) {
  const html = await readFile(new URL(`../${page}/index.html`, import.meta.url), 'utf8');
  assert.ok(html.includes(`data-tool-fullscreen="${page}-workspace"`));
  assert.ok(html.includes('../assets/tools.js'));
}
console.log('PASS: All three tools preserve the app, focus Exit Full Screen, restore focus on exit/Escape and handle unsupported/rejected fullscreen; shared CSS hides heroes.');
