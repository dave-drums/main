import { test, expect } from '@playwright/test';

test('the public metronome loads and plays entirely from this website', async ({ page }) => {
  const samples = [];
  page.on('response', response => { if (/metronome-(?:low|normal|high)\.mp3$/.test(response.url())) samples.push(response); });
  await page.addInitScript(() => {
    window.metronomeStarts = 0;
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) { window.metronomeStarts++; return original.apply(this, args); };
  });
  await page.goto('/metronome/');
  await expect(page.getByLabel('Start metronome')).toBeVisible();
  await expect.poll(() => samples.length).toBe(3);
  expect(samples.every(response => response.ok() && new URL(response.url()).pathname.startsWith('/metronome/app/'))).toBe(true);
  await page.getByLabel('Start metronome').click();
  await expect.poll(() => page.evaluate(() => window.metronomeStarts)).toBeGreaterThan(0);
  await expect(page.getByLabel('Stop metronome')).toBeVisible();
  await page.getByLabel('Stop metronome').click();
  await page.getByRole('button', { name: 'How to use', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('metronome-workspace');
  await page.getByRole('button', { name: 'Exit Full Screen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBe(null);
});

test('Groove Lab keeps shared patterns on the public page and exports local embeds', async ({ page }) => {
  await page.goto('/groove/?TimeSig=4/4&Div=16&Tempo=92&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|----O-------O---|&K=|o-------o-------|&Title=Migration%20check');
  const app = page.frameLocator('#groove-frame');
  const tempo = app.locator('[id^="tempoTextField"]').first();
  await expect(tempo).toHaveValue('92');
  await tempo.fill('108');
  await tempo.press('Tab');
  await expect.poll(() => new URL(page.url()).searchParams.get('Tempo')).toBe('108');
  await app.locator('#shareSaveButton').click();
  const field = app.locator('#fullURLPopupTextField');
  const share = new URL(await field.inputValue());
  expect(share.pathname).toBe('/groove/');
  expect(share.searchParams.get('Title')).toBe('Migration check');
  expect(share.searchParams.get('Tempo')).toBe('108');
  await app.locator('#embedCodeCheckbox').check();
  expect(await field.inputValue()).toContain('/groove/app/GrooveEmbed.html?');
  await page.goto(share.href);
  await expect(page.frameLocator('#groove-frame').locator('[id^="tempoTextField"]').first()).toHaveValue('108');
});

test('the exported notation embed and its assets load from the same website', async ({ page }) => {
  const missing = [];
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
  await page.goto('/groove/app/GrooveEmbed.html?TimeSig=4/4&Div=16&Tempo=92&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|----O-------O---|&K=|o-------o-------|');
  await expect(page.locator('.svgTarget svg').first()).toBeVisible();
  expect(missing).toEqual([]);
});
