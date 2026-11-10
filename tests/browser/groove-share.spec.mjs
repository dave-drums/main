import { test, expect } from '@playwright/test';

test('Start contains its timer and returns to Start after stopping on both layouts', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    const play = app.getByRole('button', { name: 'Start groove playback' });
    await expect(play).toHaveText('Start');
    await app.locator('body').evaluate(() => document.fonts.ready);
    await expect(play.locator('.MIDIPlayTime')).toHaveCount(1);
    await expect(app.locator('.playerControlsRow > .MIDIPlayTime')).toHaveCount(0);
    const geometry = await app.locator('#midiPlayer').evaluate(player => {
      const row = player.querySelector('.playerControlsRow').getBoundingClientRect();
      const play = player.querySelector('.midiPlayImage').getBoundingClientRect();
      const bpm = player.querySelector('.tempoAndProgress').getBoundingClientRect();
      const metronome = document.querySelector('#gl-metronome-toggle').getBoundingClientRect();
      const timeSignature = document.querySelector('#gl-settings .gl-setting:nth-child(2) .tool-select-trigger').getBoundingClientRect();
      const controls = [...player.querySelectorAll('.midiPlayImage,.tempoTextField,.tempoRow .gl-step-button')];
      const minus = player.querySelector('.tempoRow .gl-step-button').getBoundingClientRect();
      const label = player.querySelector('.tempoLabel').getBoundingClientRect();
      const input = player.querySelector('.tempoTextField').getBoundingClientRect();
      const field = player.querySelector('.tempoTextField'), fieldStyle = getComputedStyle(field);
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
      context.font = `${fieldStyle.fontWeight} ${fieldStyle.fontSize} ${fieldStyle.fontFamily}`;
      const textSpace = field.clientWidth - parseFloat(fieldStyle.paddingLeft) - parseFloat(fieldStyle.paddingRight);
      const toolbar = document.getElementById('groove-controls').getBoundingClientRect();
      const labels = [...document.querySelectorAll('#gl-settings .gl-setting > span:first-child')];
      const contentTop = Math.min(...labels.map(el => el.getBoundingClientRect().top), play.top);
      const topStyle = getComputedStyle(document.getElementById('groove-controls'));
      const bottomStyle = getComputedStyle(document.getElementById('bottomButtonRow'));
      return { left: play.x - row.x, right: row.right - bpm.right, gap: bpm.x - play.right,
        labelBeforeMinus: label.right <= minus.left, inputAfterMinus: input.left >= minus.right,
        labelGap: minus.left - label.right, inputWidth: input.width,
        fullTempoFits: context.measureText('300').width <= textSpace,
        labelAlignment: Math.abs(label.y + label.height / 2 - input.y - input.height / 2),
        topPadding: [topStyle.paddingTop, topStyle.paddingBottom],
        bottomPadding: [bottomStyle.paddingTop, bottomStyle.paddingBottom],
        toolbarTop: contentTop - toolbar.top, toolbarBottom: toolbar.bottom - play.bottom,
        toolbarLeft: play.left - toolbar.left,
        toolbarRight: toolbar.right - document.getElementById('gl-settings').getBoundingClientRect().right,
        heights: controls.map(el => el.getBoundingClientRect().height), dropdownHeight: metronome.height,
        playWidth: play.width, columnWidth: metronome.width, bpmLeft: bpm.left, columnLeft: timeSignature.left,
        settingsGap: metronome.left - bpm.right, divider: getComputedStyle(player.querySelector('.playerControlsRow')).borderBottomWidth,
        labelSize: parseFloat(getComputedStyle(player.querySelector('.tempoLabel')).fontSize),
        valueSize: parseFloat(getComputedStyle(player.querySelector('.tempoTextField')).fontSize) };
    });
    expect(Math.abs(geometry.left)).toBeLessThan(1);
    if (width < 1100) expect(geometry.labelSize).toBeLessThan(geometry.valueSize);
    else expect(geometry.valueSize - geometry.labelSize).toBeLessThanOrEqual(2);
    expect(geometry.labelBeforeMinus).toBe(true);
    expect(geometry.inputAfterMinus).toBe(true);
    expect(geometry.fullTempoFits).toBe(true);
    expect(geometry.labelAlignment).toBeLessThan(1);
    for (const height of geometry.heights) expect(Math.abs(height - geometry.dropdownHeight)).toBeLessThan(1);
    if (width < 1100) {
      expect(Math.abs(geometry.right)).toBeLessThan(1);
      expect(Math.abs(geometry.playWidth - geometry.columnWidth)).toBeLessThan(1);
      expect(Math.abs(geometry.bpmLeft - geometry.columnLeft)).toBeLessThan(1);
      expect(geometry.gap).toBe(24);
      expect(geometry.divider).toBe('1px');
      expect(geometry.topPadding).toEqual(geometry.bottomPadding);
      expect(geometry.inputWidth).toBe(width === 320 ? 34 : width === 390 ? 48 : 60);
      expect(geometry.labelGap).toBeGreaterThanOrEqual(width === 320 ? 2 : 10);
    } else {
      expect(Math.abs(geometry.playWidth - geometry.columnWidth)).toBeLessThan(1);
      expect(geometry.gap).toBe(64);
      expect(Math.abs(geometry.gap - geometry.settingsGap)).toBeLessThan(1);
      expect(geometry.inputWidth).toBe(84);
      expect(geometry.toolbarTop).toBeGreaterThanOrEqual(24);
      expect(Math.abs(geometry.toolbarTop - geometry.toolbarBottom)).toBeLessThan(1);
      expect(geometry.toolbarLeft).toBe(32);
      expect(geometry.toolbarRight).toBe(32);
      expect(geometry.divider).toBe('0px');
    }
    await play.click();
    const stop = app.getByRole('button', { name: 'Stop groove playback' });
    await expect(stop).toHaveText('0:00');
    await expect.poll(() => stop.textContent()).toMatch(/^0:0[1-9]$/);
    await stop.click();
    await expect(play).toHaveText('Start');
  }
});

test('Copy and Share use equal native buttons, preserve links and announce clipboard results', async ({ page }) => {
  await page.addInitScript(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.copied.push(text); }
    }});
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/?Tempo=92&Title=Share%20check');
    const app = page.frameLocator('#groove-frame');
    await app.locator('#shareSaveButton').click();
    const field = app.getByRole('textbox', { name: 'Groove share link or embed code' });
    await expect(field).toHaveAttribute('readonly');
    const link = await field.inputValue();
    expect(new URL(link).pathname).toBe('/groove/');
    expect(new URL(link).searchParams.get('Tempo')).toBe('92');
    const copy = app.locator('#fullURLPopupCopyButton'), share = app.locator('#shareButton');
    const a = await copy.boundingBox(), b = await share.boundingBox();
    expect(Math.abs(a.height - b.height)).toBeLessThan(1);
    expect(Math.abs(a.width - b.width)).toBeLessThan(1);
    expect(a.height).toBe(44);
    expect(a.width).toBe(100);
    await copy.click();
    await expect(app.locator('#groove-share-status')).toContainText('Link copied');
    expect(await field.evaluate(() => window.copied.at(-1))).toBe(link);
    await app.locator('#embedCodeCheckbox').check();
    await copy.click();
    await expect(app.locator('#groove-share-status')).toHaveText('Embed code copied.');
    const embed = await field.inputValue();
    expect(await field.evaluate(() => window.copied.at(-1))).toBe(embed);
    await share.click();
    expect(await field.evaluate(() => window.copied.at(-1))).toBe(link);
    await expect(field).toHaveValue(embed);
    await share.press('Escape');
    await expect(field).not.toBeVisible();
    await expect(app.locator('#shareSaveButton')).toBeFocused();
  }
});

test('native sharing sends the public groove URL; cancellation and denied copying stay usable', async ({ page }) => {
  await page.addInitScript(() => {
    window.shared = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
      if (window.cancelShare) throw new DOMException('Cancelled', 'AbortError');
      window.shared.push(data);
    }});
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
    document.execCommand = () => false;
  });
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  await app.locator('#shareSaveButton').click();
  await app.locator('#shareButton').click();
  await expect(app.locator('#groove-share-status')).toHaveText('Groove shared.');
  const data = await app.locator('body').evaluate(() => window.shared[0]);
  expect(new URL(data.url).pathname).toBe('/groove/');
  await app.locator('body').evaluate(() => { window.cancelShare = true; });
  await app.locator('#shareButton').click();
  await expect(app.locator('#shareButton')).toBeEnabled();
  await expect(app.locator('#groove-share-status')).toHaveText('');
  await app.locator('#fullURLPopupCopyButton').click();
  await expect(app.locator('#groove-share-status')).toContainText('Copy was blocked');
  await expect(app.locator('#fullURLPopupTextField')).not.toHaveValue('');
});
