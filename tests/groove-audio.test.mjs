import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const utils = { document: { currentScript: null } };
runInNewContext(await readFile(new URL('../apps/groovelab/js/groove_utils.js', import.meta.url), 'utf8'), utils);
const pitchNames = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
for (const format of ['mp3','ogg']) {
  const sandbox = {};
  runInNewContext(await readFile(new URL(`../apps/groovelab/soundfont/gunshot-${format}.js`, import.meta.url), 'utf8'), sandbox);
  for (const name of ['NORMAL','GHOST','ACCENT','XSTICK','BUZZ','FLAM','DRAG']) {
    const note = utils[`constant_OUR_MIDI_SNARE_${name}`];
    const pitch = pitchNames[note % 12] + (Math.floor(note / 12) - 1);
    const data = sandbox.MIDI.Soundfont.gunshot[pitch];
    assert.match(data, new RegExp(`^data:audio/${format};base64,.+`), `${name} (${note}/${pitch}) needs a ${format} sample`);
    const bytes = Buffer.from(data.split(',')[1], 'base64');
    assert.ok(bytes.length > 1000, `${name} needs a complete audio payload`);
    if (format === 'ogg') assert.equal(bytes.subarray(0,4).toString(), 'OggS');
  }
}
console.log('PASS: All selectable snare sounds, including Drag, have audio samples in both sound banks.');
