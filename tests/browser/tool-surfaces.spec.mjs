import { test, expect } from '@playwright/test';

test('mobile practice cards share Groove Lab outer edges', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/');
    const frame = await page.locator('#groove-loader').boundingBox();
    for (const [path, selector] of [['/metronome/', '.metronome-card'], ['/rudiments/', '.rud-panel']]) {
      await page.goto(path);
      await expect(page.locator(selector)).toBeVisible();
      const card = await page.locator(selector).boundingBox();
      expect(card.x, `${path} left edge at ${width}px`).toBeCloseTo(frame.x, 1);
      expect(card.width, `${path} width at ${width}px`).toBeCloseTo(frame.width, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('Groove printing shows the score and excludes open menus and editor controls', async ({ page }) => {
  // The same document is printed by the mobile/Firefox path and browser Print.
  await page.goto('/groove/app/?Tempo=92');
  await expect(page.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await expect(page.locator('#svgTarget svg')).toBeVisible();
  await page.getByRole('button', { name: 'Metronome', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Metronome options' })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#svgTarget svg')).toBeVisible();
  await expect(page.locator('#gl-metronome-menu')).toBeHidden();
  await expect(page.locator('#groove-controls')).toBeHidden();
  await expect(page.locator('#bottomButtonRow')).toBeHidden();
  await expect(page.locator('#musicalInput')).toBeHidden();
  const extras = await page.locator('body > :not(#GrooveWriter)').evaluateAll(nodes =>
    nodes.filter(node => node.getBoundingClientRect().width && node.getBoundingClientRect().height).map(node => node.id || node.tagName));
  expect(extras).toEqual([]);
  await page.emulateMedia({ media: 'screen' });
  await expect(page.getByRole('dialog', { name: 'Metronome options' })).toBeVisible();
});
