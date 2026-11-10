import { test, expect } from '@playwright/test';

for (const [path, toggleId, panelId] of [['/metronome/', null, 'met-trainer-panel'], ['/rudiments/', 'rud-trainer-toggle', 'rud-trainer-panel'], ['/groove/', 'gl-trainer-toggle', 'metronomeAutoSpeedupConfiguration']]) {
  test(`Speed trainer opens without changing its enable state: ${path}`, async ({ page }) => {
    await page.goto(path);
    const root = path === '/groove/' ? page.frameLocator('#groove-frame') : page;
    const button = toggleId ? root.locator(`#${toggleId}`) : root.getByRole('button', { name: 'Speed trainer', exact: true });
    const panel = root.locator(`#${panelId}`);
    await expect(button).toBeVisible();
    if (path !== '/groove/') {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const panel = await button.evaluate(node => ({ width: node.getBoundingClientRect().width, available: node.parentElement.clientWidth - parseFloat(getComputedStyle(node.parentElement).paddingLeft) - parseFloat(getComputedStyle(node.parentElement).paddingRight) }));
        expect(panel.width).toBeCloseTo(panel.available, 0);
        await expect(button.locator('svg')).toHaveCount(2);
      }
    }
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    expect((await panel.boundingBox())?.height || 0).toBeLessThan(1);
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const enabled = root.getByRole('checkbox', { name: 'Speed trainer inactive', exact: true });
    await expect(enabled).not.toBeChecked();
    await enabled.check();
    await button.click();
    await expect(panel).toHaveAttribute('inert');
    await expect.poll(async () => (await panel.boundingBox())?.height || 0).toBeLessThan(1);
    await button.click();
    await expect(root.getByRole('checkbox', { name: 'Speed trainer active', exact: true })).toBeChecked();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await button.click();
    await expect(panel).toHaveCSS('transition-duration', '0s');
  });
}

test('notation controls restore a deleted groove and added measures stay aligned', async ({ page }) => {
  await page.goto('/groove/?Div=16&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|d---f---g---O---|&K=|o-------o-------|');
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await expect(app.locator('#switchModeButton')).toHaveCount(0);
  await expect(app.locator('#sheetMusicDiv #LegendLabel')).toBeVisible();
  await expect(app.locator('#sheetMusicDiv #undoButton')).toBeVisible();
  await expect(app.locator('#sheetMusicDiv #clearAllNotesButton')).toBeVisible();
  const alignment = await app.locator('.gl-score-controls').evaluate(row => {
    const key = row.querySelector('#LegendLabel').getBoundingClientRect();
    const time = row.querySelector('#totalPlayTime > span').getBoundingClientRect();
    return Math.abs(key.y + key.height / 2 - time.y - time.height / 2);
  });
  expect(alignment).toBeLessThan(1);
  const snapshot = () => app.locator('body').evaluate(() => JSON.stringify(window.myGrooveWriter.grooveDataFromClickableUI()));
  const before = await snapshot();
  await app.getByRole('button', { name: 'Delete all notes', exact: true }).click();
  await expect(app.locator('[data-groove-note][aria-pressed="true"]')).toHaveCount(0);
  await app.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(snapshot).toBe(before);
  await app.getByRole('button', { name: 'Add measure', exact: true }).click();
  await expect(app.locator('.staff-container')).toHaveCount(2);
  const bar = app.locator('.staff-container').last();
  // Read all coordinates in one frame while the editor scrolls to the new bar.
  const { add, notes, stickings } = await bar.evaluate(node => {
    const box = selector => { const b = node.querySelector(selector).getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    return { add: box('#addMeasureButton'), notes: box('.notes-row-container'), stickings: box('.stickings-row-container') };
  });
  const contentTop = stickings?.height ? stickings.y : notes.y;
  expect(Math.abs((add.y + add.height / 2) - (contentTop + notes.y + notes.height) / 2)).toBeLessThan(2);
  expect(add.x - notes.x - notes.width).toBeLessThanOrEqual(4);
  expect(await bar.locator('.closeMeasureButton svg').evaluate(svg => getComputedStyle(svg).strokeWidth))
    .toBe(await app.locator('#addMeasureButton svg').evaluate(svg => getComputedStyle(svg).strokeWidth));
});
