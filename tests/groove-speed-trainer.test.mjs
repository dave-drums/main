import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(await readFile(new URL('../apps/groovelab/index.html', import.meta.url), 'utf8'), { url: 'http://localhost/', runScripts: 'outside-only' });
try {
  for (const name of ['groove_utils', 'groove_writer']) dom.window.eval(await readFile(new URL(`../apps/groovelab/js/${name}.js`, import.meta.url), 'utf8'));
  const writer = new dom.window.GrooveWriter(), doc = dom.window.document;
  let tempo = 80, reloads = 0;
  writer.myGrooveUtils.setTempo = value => { tempo = value; };
  writer.myGrooveUtils.getTempo = () => tempo;
  writer.myGrooveUtils.midiNoteHasChanged = () => { reloads++; };
  const input = name => doc.getElementById(`gl-trainer-${name}`);
  const cycle = () => doc.getElementById('gl-trainer-cycle').textContent;
  writer.setSpeedTrainerEnabled(true);
  for (const [name, value] of [['start', 120], ['target', 132], ['increase', 5], ['every', 2]]) input(name).value = value;
  assert.equal(writer.prepareSpeedTrainer(), true);
  writer.syncSpeedTrainerControls(true);
  assert.equal(tempo, 120);
  assert.equal(cycle(), 'Repetition 1 of 2');
  const expected = [[120, 2], [125, 1], [125, 2], [130, 1], [130, 2], [132, 1], [132, 2], [132, 1]];
  for (const [bpm, repetition] of expected) {
    writer.advanceSpeedTrainer();
    assert.equal(tempo, bpm);
    assert.equal(cycle(), `Repetition ${repetition} of 2`);
  }
  assert.equal(reloads, 3, 'Reload only when the ramp changes tempo; hold at target');
  assert.equal(input('enabled').disabled, true);
  assert.equal(input('target').disabled, true);
  writer.syncSpeedTrainerControls(false);
  assert.equal(input('target').disabled, false);
  assert.equal(cycle(), 'Repetition 0 of 2');
  assert.equal(writer.prepareSpeedTrainer(), true);
  assert.equal(tempo, 120, 'Restart from the selected starting BPM');
  input('start').value = 140;
  assert.equal(writer.prepareSpeedTrainer(), false);
  assert.match(doc.getElementById('gl-trainer-error').textContent, /Target BPM/);
  input('start').value = '';
  assert.equal(writer.prepareSpeedTrainer(), false);
  writer.setSpeedTrainerEnabled(false);
  assert.equal(writer.prepareSpeedTrainer(), true);
  assert.equal(doc.getElementById('gl-trainer-cycle').hidden, true);
  console.log('PASS: Groove repetition ramp, exact cycle counts, target clamp, restart, validation and locked settings');
} finally { dom.window.close(); }
