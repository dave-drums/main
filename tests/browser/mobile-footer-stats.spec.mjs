import { test, expect } from '@playwright/test';

test('mobile footer has a balanced branding row above credits and Back to top', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    if (width > 900) { await expect(page.locator('.footer-location')).toBeVisible(); continue; }
    await expect(page.locator('.footer-location')).toBeHidden();
    const positions = await page.locator('.site-footer').evaluate(footer => {
      const box = selector => { const b = footer.querySelector(selector).getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, right: b.right, bottom: b.bottom }; };
      return { logo: box('.footer-brand'), motto: box('.footer-signature'), credit: box('.footer-copyright'), top: box('.footer-top'), frame: footer.getBoundingClientRect().toJSON() };
    });
    expect(positions.logo.y + (positions.logo.bottom - positions.logo.y) / 2).toBeCloseTo(positions.motto.y + (positions.motto.bottom - positions.motto.y) / 2, 1);
    expect(positions.motto.x).toBeGreaterThan(positions.logo.right);
    expect((positions.logo.x + positions.motto.right) / 2).toBeCloseTo(positions.frame.x + positions.frame.width / 2, 1);
    expect(positions.credit.y).toBeGreaterThan(Math.max(positions.logo.bottom, positions.motto.bottom));
    expect(positions.top.y + (positions.top.bottom - positions.top.y) / 2).toBeCloseTo(positions.credit.y + (positions.credit.bottom - positions.credit.y) / 2, 1);
    expect(positions.top.x).toBeGreaterThan(positions.credit.right);
    expect(positions.frame.height).toBeLessThan(200);
    await expect(page.locator('.footer-navigation')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('mobile notation stats and actions occupy one centred row with separated destructive actions', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    await expect(app.locator('#totalPlayTime')).toHaveText('Total time: 0:00Reps: 0');
    const geometry = await app.locator('.gl-score-controls').evaluate(row => {
      const nodes = [row.querySelector('#LegendLabel'), ...row.querySelectorAll('#totalPlayTime > span'), row.querySelector('#undoButton'), row.querySelector('#clearAllNotesButton')];
      return nodes.map(node => { const b = node.getBoundingClientRect(); return { x: b.x, right: b.right, centre: b.y + b.height / 2 }; });
    });
    for (const item of geometry) expect(item.centre).toBeCloseTo(geometry[0].centre, 1);
    for (let i = 1; i < geometry.length; i++) expect(geometry[i].x).toBeGreaterThanOrEqual(geometry[i - 1].right);
    expect(geometry[4].x - geometry[3].right).toBeGreaterThanOrEqual(12);
  }
});

test('Groove trainer validates settings, skips count-in and ramps after complete repetitions', async ({ page }) => {
  await page.goto('/groove/?TimeSig=2/4&Div=8');
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await app.getByRole('button', { name: 'Speed trainer', exact: true }).click();
  await app.getByRole('checkbox', { name: 'Speed trainer inactive' }).check();
  for (const [name, value] of [['Starting BPM', '240'], ['Target BPM', '252'], ['Increase by', '5'], ['Every … repetitions', '1']]) await app.getByLabel(name, { exact: true }).fill(value);
  await app.getByLabel('Target BPM', { exact: true }).fill('220');
  await app.getByRole('button', { name: 'Start groove playback' }).click();
  await expect(app.getByRole('alert')).toContainText('Target BPM');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await app.getByLabel('Target BPM', { exact: true }).fill('252');
  await app.getByRole('button', { name: 'Metronome', exact: true }).click();
  await app.getByRole('button', { name: 'Count in', exact: true }).click();
  await app.locator('body').evaluate(() => {
    const writer = window.myGrooveWriter, callbacks = writer.myGrooveUtils.midiEventCallbacks;
    const original = callbacks.notePlaying;
    window.trainerLoopTempos = [];
    callbacks.notePlaying = (...args) => {
      const before = writer.myGrooveUtils.getTempo();
      original(...args);
      if (args[1] === 'complete') window.trainerLoopTempos.push([before, writer.myGrooveUtils.getTempo()]);
    };
  });
  await app.getByRole('button', { name: 'Start groove playback' }).click();
  await expect(app.getByLabel('Starting BPM', { exact: true })).toBeDisabled();
  await expect(app.getByRole('spinbutton', { name: 'Tempo in beats per minute' })).toHaveValue('252', { timeout: 15000 });
  const loops = await app.locator('body').evaluate(() => window.trainerLoopTempos);
  expect(loops[0]).toEqual([240, 240]); // The count-in is not a groove repetition.
  expect(loops[1]).toEqual([240, 245]);
  await app.getByRole('button', { name: 'Stop groove playback' }).click();
  await expect(app.getByLabel('Starting BPM', { exact: true })).toBeEnabled();
  await expect(app.locator('#gl-trainer-cycle')).toHaveText('Repetition 0 of 1');
});
