import { test, expect } from '@playwright/test';

for (const format of ['mp3', 'ogg']) {
  test(`Drag has non-silent preview and loop playback with the ${format} sound bank`, async ({ page }) => {
    if (format === 'ogg') await page.route('**/soundfont/gunshot-mp3.js', route => route.fulfill({
      status: 200, contentType: 'application/javascript', path: 'dist/groove/app/soundfont/gunshot-ogg.js'
    }));
    await page.goto('/groove/?TimeSig=4/4&Div=16&Tempo=80&Measures=1&H=|----------------|&S=|d---------------|&K=|----------------|');
    const app = page.frameLocator('#groove-frame');
    const play = app.getByRole('button', { name: 'Start groove playback' });
    await expect(play).toBeVisible();
    const snare = app.locator('[data-groove-note="snare"]').first();
    await expect(snare).toHaveAttribute('aria-label', /drag/i);
    await app.locator('body').evaluate(() => {
      window.dragSounds = [];
      const original = MIDI.WebAudio.noteOn;
      const noteOn = function(channel, note, velocity, delay) {
        const source = original.apply(this, arguments);
        if (note === constant_OUR_MIDI_SNARE_DRAG) {
          const data = source?.buffer?.getChannelData(0);
          let peak = 0, energy = 0;
          if (data) for (const sample of data) { peak = Math.max(peak, Math.abs(sample)); energy += sample * sample; }
          window.dragSounds.push({ duration: source?.buffer?.duration || 0, peak, rms: data ? Math.sqrt(energy / data.length) : 0 });
        }
        return source;
      };
      MIDI.noteOn = MIDI.WebAudio.noteOn = noteOn;
    });
    await snare.click({ button: 'right' });
    await app.locator('#snareContextMenu').getByRole('button', { name: 'Drag', exact: true }).click();
    await expect.poll(() => app.locator('body').evaluate(() => window.dragSounds.length)).toBe(1);
    const preview = await app.locator('body').evaluate(() => window.dragSounds[0]);
    expect(preview.duration).toBeGreaterThan(0.1);
    expect(preview.peak).toBeGreaterThan(0.01);
    expect(preview.rms).toBeGreaterThan(0.001);
    await expect.poll(() => app.locator('body').evaluate(() => MIDI.Player.ctx.state)).toBe('running');
    await play.click();
    await expect.poll(() => app.locator('body').evaluate(() => window.dragSounds.length)).toBeGreaterThan(1);
    const loop = await app.locator('body').evaluate(() => window.dragSounds.at(-1));
    expect(loop.peak).toBeGreaterThan(0.01);
    expect(loop.rms).toBeGreaterThan(0.001);
    await app.getByRole('button', { name: 'Stop groove playback' }).click();
  });
}
