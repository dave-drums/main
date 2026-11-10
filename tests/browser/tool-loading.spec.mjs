import { test, expect } from '@playwright/test';
import { openGrooveSettings } from './groove-helpers.mjs';

async function expectSpinner(spinner) {
  await expect(spinner).toBeVisible();
  const geometry = await spinner.evaluate(el => {
    const style = getComputedStyle(el, '::after');
    return { display: getComputedStyle(el).display, alignment: getComputedStyle(el).placeItems,
      width: style.width, height: style.height, animation: style.animationName };
  });
  expect(geometry).toMatchObject({ display: 'grid', alignment: 'center', width: '32px', height: '32px' });
  expect(geometry.animation).toBe('tool-loading-turn');
  await expect(spinner.locator('.tool-loading-label')).toHaveCount(1);
}

test('Metronome shows a centred spinner while audio loads and respects reduced motion', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/metronome-*.mp3', async route => { await gate; await route.continue(); });
  await page.goto('/metronome/');
  const spinner = page.locator('#metronome-app .tool-loading');
  await expectSpinner(spinner);
  await expect(page.getByLabel('Start metronome')).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => spinner.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
  release();
  await expect(page.getByLabel('Start metronome')).toBeVisible();
  await expect(page.getByLabel('Start metronome')).toBeEnabled();
  await expect(spinner).toHaveCount(0);
});

test('Groove Lab hands off its page spinner to the audio spinner, then exposes the editor', async ({ page }) => {
  let releaseDocument, releaseAudio;
  const documentGate = new Promise(resolve => { releaseDocument = resolve; });
  const audioGate = new Promise(resolve => { releaseAudio = resolve; });
  await page.route('**/groove/app/', async route => { await documentGate; await route.continue(); });
  await page.goto('/groove/', { waitUntil: 'domcontentloaded' });
  await expectSpinner(page.locator('#groove-feedback'));
  releaseDocument();
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await expect(app.locator('.tool-loading')).not.toBeVisible();
  await expect(app.locator('[data-groove-note="hh"]').first()).toHaveAttribute('aria-label', /Hi-hat, bar 1, beat 1/);
  await expect(page.locator('#groove-loader')).toHaveAttribute('data-tool-loading', 'false');
  // The standalone editor also owns its audio-loading indicator.
  await page.route('**/soundfont/**', async route => { await audioGate; await route.continue(); });
  await page.goto('/groove/app/', { waitUntil: 'domcontentloaded' });
  await expectSpinner(page.locator('.tool-loading'));
  releaseAudio();
  await expect(page.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
});

test('Rudiment Trainer clears the spinner after click audio loads and keeps errors usable', async ({ page }) => {
  let release, unavailable = false;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/metronome-*.mp3', async route => {
    await gate;
    if (unavailable) await route.fulfill({ status: 503, body: '' });
    else await route.continue();
  });
  await page.goto('/rudiments/');
  await page.getByRole('button', { name: 'Start playback', exact: true }).click();
  await expectSpinner(page.locator('#rud-loading'));
  release();
  await page.getByRole('button', { name: 'Stop playback', exact: true }).click();
  await expect(page.locator('#rud-loading')).not.toBeVisible();
  unavailable = true;
  await page.reload();
  await page.getByRole('button', { name: 'Start playback', exact: true }).click();
  await expect(page.locator('#rud-feedback')).toContainText('Audio could not start');
  await expect(page.locator('#rud-loading')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Start playback', exact: true })).toBeEnabled();
});

test('Groove transport fits phones with a settings button and preserves desktop spacing', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    const play = app.getByRole('button', { name: 'Start groove playback' });
    await expect(play).toBeVisible();
    const geometry = await app.locator('#midiPlayer').evaluate(player => {
      const bounds = el => el.getBoundingClientRect().toJSON();
      const time = player.querySelector('.MIDIPlayTime');
      return { player: bounds(player), row: bounds(player.querySelector('.playerControlsRow')),
        settings: bounds(document.querySelector('#gl-settings')), timerBackground: getComputedStyle(time).backgroundColor,
        timeSize: parseFloat(getComputedStyle(time).fontSize), play: bounds(player.querySelector('.midiPlayImage')),
        input: bounds(player.querySelector('.tempoTextField')), overflow: document.documentElement.scrollWidth - innerWidth };
    });
    expect(geometry.timerBackground).toBe('rgba(0, 0, 0, 0)');
    expect(geometry.timeSize).toBeGreaterThanOrEqual(16);
    expect(geometry.play.height).toBe(44);
    expect(geometry.input.height).toBeGreaterThanOrEqual(44);
    expect(geometry.overflow).toBeLessThanOrEqual(0);
    if (width >= 1100) expect(geometry.settings.x - geometry.player.x - geometry.player.width).toBeGreaterThanOrEqual(32);
    else {
      const settings = await app.getByRole('button', { name: 'Groove settings', exact: true }).evaluate(el => el.getBoundingClientRect().toJSON());
      expect(settings.width).toBe(44);
      expect(settings.height).toBe(44);
      expect(settings.x).toBeGreaterThan(geometry.input.x + geometry.input.width);
      expect(settings.y + 22).toBeCloseTo(geometry.play.y + 22, 1);
    }
  }
});

test('Subdivision icons update with selection, omit Mixed, and align with metronome icons', async ({ page }) => {
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  await openGrooveSettings(app);
  const subdivision = app.getByRole('combobox', { name: 'Subdivision', exact: true });
  await subdivision.click();
  const menu = app.getByRole('listbox', { name: 'Subdivision', exact: true });
  await expect(menu.locator('.tool-option-icon')).toHaveCount(6);
  const mixed = menu.getByRole('option', { name: 'Mixed note values', exact: true });
  await expect(mixed.locator('svg')).toHaveCount(0);
  await mixed.click();
  await expect(subdivision.locator('svg.tool-option-icon')).toHaveCount(0);
  await subdivision.click();
  const thirtySecond = menu.getByRole('option', { name: 'Thirty-second note', exact: true });
  await expect(thirtySecond.locator('use')).toHaveAttribute('href', /#note-thirty-second$/);
  await thirtySecond.click();
  await expect(subdivision.locator('use')).toHaveAttribute('href', /#note-thirty-second$/);
  await app.getByRole('button', { name: 'Metronome', exact: true }).click();
  const icon = app.getByRole('button', { name: 'Eighth note', exact: true }).locator('svg');
  const optionsHeading = app.locator('#gl-metronome-menu .tool-menu-heading');
  const iconX = await icon.evaluate(el => el.getBoundingClientRect().x);
  const headingTextX = await optionsHeading.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    return range.getBoundingClientRect().x;
  });
  expect(Math.abs(iconX - headingTextX)).toBeLessThan(1);
});
