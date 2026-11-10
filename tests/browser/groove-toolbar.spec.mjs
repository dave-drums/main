import { test, expect } from '@playwright/test';
import { openGrooveSettings } from './groove-helpers.mjs';

test('mobile settings slide down without replacing playback or exposing collapsed controls to the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/groove/?Tempo=92&Measures=2');
  const app = page.frameLocator('#groove-frame');
  const play = app.getByRole('button', { name: 'Start groove playback' });
  const toggle = app.getByRole('button', { name: 'Groove settings', exact: true });
  const drawer = app.locator('#gl-settings-drawer');
  await expect(play).toBeEnabled();
  await expect(drawer).toHaveAttribute('inert', '');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => drawer.evaluate(el => el.getBoundingClientRect().height)).toBe(0);
  await app.locator('#midiPlayer').evaluate(el => { window.originalPlayer = el; });
  await app.getByRole('button', { name: 'Increase tempo by 5 BPM' }).focus();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(drawer).not.toHaveAttribute('inert');
  await expect.poll(() => drawer.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(140);
  await app.getByRole('combobox', { name: 'Time signature', exact: true }).click();
  await expect(app.getByRole('listbox', { name: 'Time signature', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await expect(drawer).toHaveAttribute('inert', '');
  await play.click();
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await openGrooveSettings(app);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(toggle).toBeHidden();
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  expect(await app.locator('#midiPlayer').evaluate(el => el === window.originalPlayer)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await app.getByRole('button', { name: 'Stop groove playback' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(drawer).toHaveCSS('transition-duration', '0s');
});

test('compact transport has even gaps and keeps settings inside the card at phone and tablet widths', async ({ page }) => {
  await page.goto('/groove/?Tempo=300');
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeEnabled();
  for (const width of [320, 390, 768, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
    await app.locator('body').evaluate(() => document.fonts.ready);
    const geometry = await app.locator('#groove-controls').evaluate(bar => {
      const box = selector => bar.querySelector(selector).getBoundingClientRect().toJSON();
      return { bar: bar.getBoundingClientRect().toJSON(), play: box('.midiPlayImage'), tempo: box('.tempoAndProgress'), settings: box('#gl-settings-toggle'), overflow: document.documentElement.scrollWidth - innerWidth };
    });
    const { play, tempo, settings, bar } = geometry;
    expect(geometry.overflow).toBeLessThanOrEqual(0);
    expect(play.x).toBe(12);
    expect(settings.right).toBeLessThanOrEqual(bar.right - 11);
    expect(settings.x - tempo.right).toBeCloseTo(tempo.x - play.right, 1);
    expect(play.y).toBe(tempo.y);
    expect(tempo.y).toBe(settings.y);
    expect(play.width).toBeLessThanOrEqual(160);
    for (const box of [play, tempo, settings]) expect(box.height).toBe(44);
  }
});

for (const width of [390, 844, 1440]) {
  test(`toolbar follows parent and fullscreen scrolling with working controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 844 ? 500 : 900 });
    await page.goto('/groove/?Measures=8&Div=32&Tempo=92');
    const app = page.frameLocator('#groove-frame');
    const toolbar = app.locator('#groove-controls');
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeEnabled();
    await expect(app.locator('#svgTarget svg').first()).toBeVisible();
    await page.evaluate(() => {
      const frame = document.getElementById('groove-frame');
      scrollTo(0, scrollY + frame.getBoundingClientRect().top + 300);
    });
    const headerBottom = await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().bottom);
    await expect.poll(async () => (await toolbar.boundingBox()).y).toBeCloseTo(headerBottom, 0);
    await expect(toolbar).toHaveAttribute('data-stuck', 'true');
    const originalHeight = await page.locator('#groove-frame').getAttribute('height');
    await app.getByRole('button', { name: 'Increase tempo by 5 BPM' }).click();
    await expect(app.locator('.tempoTextField')).toHaveValue('97');
    await openGrooveSettings(app);
    await app.getByRole('combobox', { name: 'Time signature', exact: true }).click();
    const menu = app.getByRole('listbox', { name: 'Time signature', exact: true });
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    expect(menuBox.y).toBeGreaterThanOrEqual(headerBottom);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual((width === 844 ? 500 : 900) + 1);
    await page.evaluate(() => scrollBy(0,40));
    await expect.poll(async () => (await menu.boundingBox()).y).toBeCloseTo(menuBox.y,0);
    await menu.getByRole('option', { name: '5/4', exact: true }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('TimeSig')).toBe('5/4');
    await app.getByRole('button', { name: 'Metronome', exact: true }).click();
    const clickMenu = app.getByRole('dialog', { name: 'Metronome options', exact: true });
    const clickTop = (await clickMenu.boundingBox()).y;
    await page.evaluate(() => scrollBy(0,30));
    await expect.poll(async () => (await clickMenu.boundingBox()).y).toBeCloseTo(clickTop,0);
    await clickMenu.getByRole('button', { name: 'Eighth note', exact: true }).click();
    await expect(app.locator('#gl-metronome')).toHaveValue('8');
    if (width < 1100) await app.getByRole('button', { name: 'Groove settings', exact: true }).click();
    await page.evaluate(() => scrollBy(0, 150));
    await expect.poll(async () => (await toolbar.boundingBox()).y).toBeCloseTo(headerBottom, 0);
    await expect.poll(() => app.locator('body').evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2)).toBe(true);
    // Scrolling must not inflate the iframe height on each animation frame.
    const settled = await page.locator('#groove-frame').getAttribute('height');
    await page.evaluate(() => scrollBy(0, 30));
    await expect(page.locator('#groove-frame')).toHaveAttribute('height', settled);
    expect(Number(originalHeight)).toBeGreaterThan(500);
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('groove-workspace');
    await page.locator('#groove-workspace').evaluate(el => { el.scrollTop = 300; });
    await expect.poll(async () => (await toolbar.boundingBox()).y).toBeCloseTo(0, 0);
    await app.getByRole('button', { name: 'Decrease tempo by 5 BPM' }).click();
    await expect(app.locator('.tempoTextField')).toHaveValue('92');
    await page.evaluate(() => document.exitFullscreen());
    await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBe(null);
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    const frameBox = await page.locator('#groove-frame').boundingBox();
    const barBox = await toolbar.boundingBox();
    expect(barBox.y + barBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('direct editor keeps a sticky toolbar without introducing a nested scrollbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/groove/app/?Measures=8&Div=32');
  await expect(page.getByRole('button', { name: 'Start groove playback' })).toBeEnabled();
  await page.evaluate(() => scrollTo(0,300));
  await expect.poll(async () => (await page.locator('#groove-controls').boundingBox()).y).toBeCloseTo(0,0);
  await page.getByRole('button', { name: 'Increase tempo by 5 BPM' }).click();
  await expect(page.locator('.tempoTextField')).toHaveValue('85');
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
});
