import { test, expect } from '@playwright/test';
import { openGrooveSettings } from './groove-helpers.mjs';

test('instrument labels stay centred on their notes with toms and stickings toggled', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/?Div=32&Measures=2');
    const app = page.frameLocator('#groove-frame');
    await openGrooveSettings(app);
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    await app.locator('body').evaluate(() => document.fonts.ready);
    const aligned = async () => {
      const offsets = await app.locator('.notes-row-container').evaluateAll(rows => rows.flatMap(row => {
        const pairs = [['.hh-label', '.hh_cross .fa'], ['.tom-label[id="tom1-label"]', '[id="tom1-container"] .tom_circle'],
          ['.snare-label', '.snare_circle'], ['.tom-label[id="tom4-label"]', '[id="tom4-container"] .tom_circle'], ['.kick-label', '.kick_circle']];
        return pairs.flatMap(([labelSelector, noteSelector]) => {
          const label = row.querySelector(labelSelector);
          if (getComputedStyle(label).visibility === 'hidden') return [];
          const range = document.createRange();
          range.selectNodeContents(label.querySelector('.gl-instrument-name'));
          const text = range.getBoundingClientRect(), note = row.querySelector(noteSelector).getBoundingClientRect();
          return [{ label: label.textContent, offset: Math.abs(text.y + text.height / 2 - note.y - note.height / 2) }];
        });
      }));
      for (const item of offsets) expect(item.offset, `${item.label} at ${width}px`).toBeLessThan(2);
    };
    await aligned();
    const remove = app.getByRole('button', { name: 'Delete bar 1', exact: true });
    const removeBounds = await remove.boundingBox(), gridBounds = await app.locator('#musicalInput').boundingBox();
    expect(removeBounds.y - gridBounds.y).toBeGreaterThanOrEqual(8);
    expect(removeBounds.width).toBeGreaterThanOrEqual(44);
    expect(removeBounds.height).toBeGreaterThanOrEqual(44);
    await app.locator('#showHideTomsButton').click();
    await aligned();
    await app.locator('#stickingsButton').click();
    await app.getByRole('button', { name: 'Show or hide stickings', exact: true }).click();
    await aligned();
    await app.locator('#showHideTomsButton').click();
    await aligned();
    await app.getByRole('button', { name: 'Delete bar 2', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(app.locator('.staff-container')).toHaveCount(1);
    await expect(app.locator('.closeMeasureButton')).toHaveCount(0);
  }
});

test('Groove Lab places transport, step controls and four dropdowns on one desktop row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  await openGrooveSettings(app);
  const play = app.getByRole('button', { name: 'Start groove playback' });
  await expect(play).toBeVisible();
  const controls = [play, app.getByRole('button', { name: 'Increase tempo by 5 BPM' }),
    app.getByRole('button', { name: 'Metronome', exact: true }), app.getByRole('combobox', { name: 'Time signature', exact: true }),
    app.getByRole('combobox', { name: 'Subdivision', exact: true }), app.getByRole('button', { name: 'Grooves', exact: true })];
  const positions = await Promise.all(controls.map(control => control.boundingBox()));
  const centres = positions.map(rect => rect.y + rect.height / 2);
  expect(Math.max(...centres) - Math.min(...centres)).toBeLessThan(2);
  for (let i = 1; i < positions.length; i++) expect(positions[i].x).toBeGreaterThan(positions[i-1].x);
  await expect(app.locator('#midiPlayer input[type="range"]')).toHaveCount(0);
  await expect(app.locator('#groove-keyboard-help')).toHaveCSS('position', 'absolute');
  await app.locator('#gl-meter').selectOption('3/4');
  await expect.poll(() => new URL(page.url()).searchParams.get('TimeSig')).toBe('3/4');
  await app.locator('#gl-notes').selectOption('8');
  await expect.poll(() => new URL(page.url()).searchParams.get('Div')).toBe('8');
  await app.getByRole('button', { name: 'Metronome', exact: true }).click();
  await app.getByRole('button', { name: 'Eighth note', exact: true }).click();
  await expect(app.locator('#gl-metronome')).toHaveValue('8');
});

test('expanded permutations resize the iframe in normal and full screen modes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  await openGrooveSettings(app);
  const iframe = page.locator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  const noInnerScroll = async () => {
    await expect(app.locator('html')).toHaveCSS('overflow-y', 'hidden');
    await expect.poll(() => app.locator('body').evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2)).toBe(true);
    await expect(app.locator('#RightHandContent')).toHaveCSS('overflow-y', 'visible');
  };
  await noInnerScroll();
  const initial = Number(await iframe.getAttribute('height'));
  await app.getByRole('button', { name: 'Grooves', exact: true }).click();
  await app.getByRole('button', { name: 'Kick permutation', exact: true }).click();
  await expect.poll(async () => Number(await iframe.getAttribute('height'))).toBeGreaterThan(initial + 200);
  await noInnerScroll();
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('groove-workspace');
  await noInnerScroll();
  await app.getByRole('button', { name: 'Grooves', exact: true }).click();
  await app.getByRole('button', { name: 'None', exact: true }).click();
  await expect.poll(async () => Number(await iframe.getAttribute('height'))).toBeLessThan(initial + 100);
  await noInnerScroll();
  await page.getByRole('button', { name: 'Exit Full Screen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBe(null);
  await noInnerScroll();
});

test('mobile editor avoids a nested scrollbar while standalone editing remains scrollable', async ({ page }) => {
  for (const width of [320, 390, 768, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    await openGrooveSettings(app);
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    await expect(app.locator('html')).toHaveCSS('overflow-y', 'hidden');
    await expect.poll(() => app.locator('body').evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await app.locator('#shareSaveButton').scrollIntoViewIfNeeded();
    await expect(app.locator('#shareSaveButton')).toBeVisible();
  }
  await page.goto('/groove/app/');
  await expect(page.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-embedded');
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  await page.locator('#shareSaveButton').scrollIntoViewIfNeeded();
  await expect(page.locator('#shareSaveButton')).toBeVisible();
});

test('Groove Lab settings and share dialogs fit narrow screens without iframe scrolling', async ({ page }) => {
  for (const width of [320, 390, 768, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    await openGrooveSettings(app);
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    const fits = async () => {
      await expect.poll(() => app.locator('body').evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2 && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    };
    await fits();

    expect(await app.locator('#groove-controls').evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(280);
    const metronome = app.getByRole('button', { name: 'Metronome', exact: true });
    await metronome.click();
    await expect(app.getByRole('button', { name: 'Speed trainer', exact: true })).toBeVisible();
    await expect(app.locator('#gl-click-options')).not.toContainText('Speed trainer');
    await page.keyboard.press('Escape');
    await expect(metronome).toBeFocused();
    await app.locator('#gl-meter').selectOption('3/4');
    await expect(app.locator('#gl-meter')).toHaveValue('3/4');
    await fits();
    await app.locator('#shareSaveButton').click();
    await expect(app.locator('#fullURLPopupTextField')).toBeVisible();
    await fits();
    await app.locator('#shareButton').click();
    await expect(app.locator('#groove-share-status')).not.toHaveText('');
    await fits();
    await app.locator('#fullURLPopupCloseButton').click();
    await fits();
    await app.locator('#LegendLabel').click();
    await expect(app.locator('#svgTarget text').filter({ hasText: /^Hi-Hat$/ })).toHaveCSS('font-size', '10px');
    await fits();
  }
});

test('playback totals update inside the notation controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  await openGrooveSettings(app);
  const tempo = app.locator('.tempoTextField');
  await expect(tempo).toBeVisible();
  await tempo.fill('240');
  await tempo.press('Tab');
  await app.getByRole('button', { name: 'Start groove playback' }).click();
  const totals = app.locator('#totalPlayTime .totalTimeNum');
  await expect(totals).toHaveCount(2);
  await expect.poll(async () => totals.nth(0).textContent()).not.toBe('0:00');
  await expect.poll(async () => Number(await totals.nth(1).textContent())).toBeGreaterThan(0);
  await expect(app.locator('#totalPlayTime')).toContainText('Total time:');
  await expect(app.locator('#totalPlayTime')).toContainText('Reps:');
  await expect(app.locator('#totalPlayTime')).not.toContainText('Notes:');
  await app.getByRole('button', { name: 'Stop groove playback' }).click();
  await expect(app.locator('.gl-score-controls')).toHaveCSS('background-color', 'rgb(248, 250, 251)');
  await expect(app.locator('#switchModeButton')).toHaveCount(0);
  await app.locator('#LegendLabel').click();
  await expect(app.locator('#svgTarget text').filter({ hasText: /^Hi-Hat$/ })).toHaveCSS('font-size', '12px');
});

test('compact settings update the groove and keep live controls intact across layouts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/groove/?TimeSig=4/4&Div=16&Tempo=92&Measures=1&Swing=5');
  const app = page.frameLocator('#groove-frame');
  await openGrooveSettings(app);
  const metronome = app.locator('#gl-metronome');
  const meter = app.locator('#gl-meter');
  const notes = app.locator('#gl-notes');
  await expect(metronome).toHaveValue('0');
  await expect(meter).toHaveValue('4/4');
  await expect(notes).toHaveValue('16');
  await app.getByRole('button', { name: 'Increase tempo by 5 BPM' }).focus();
  await page.keyboard.press('Tab');
  await expect(app.getByRole('button', { name: 'Groove settings', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(app.getByRole('button', { name: 'Metronome', exact: true })).toBeFocused();
  await metronome.selectOption('8');
  await expect(app.locator('#gl-metronome')).toHaveValue('8');
  await notes.selectOption('4');
  await expect(notes.locator('option:checked')).toHaveText('Quarter note');
  await expect(app.locator('[data-groove-note="hh"]')).toHaveCount(4);
  await app.getByRole('button', { name: 'Start groove playback' }).click();
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await app.getByRole('button', { name: 'Stop groove playback' }).click();
  await meter.selectOption('5/8');
  await expect.poll(() => new URL(page.url()).searchParams.get('TimeSig')).toBe('5/8');
  await expect(notes).toHaveValue('8');
  await expect(notes.locator('option[value="4"]')).toHaveJSProperty('disabled', true);
  await expect(notes.locator('option[value="12"]')).toHaveJSProperty('disabled', true);
  await notes.selectOption('32');
  await expect.poll(() => new URL(page.url()).searchParams.get('Div')).toBe('32');
  await meter.selectOption('4/4');
  await notes.selectOption('16');
  const swing = app.locator('.swingInput');
  await app.locator('body').evaluate(() => window.myGrooveWriter.myGrooveUtils.setSwing(5));
  await expect(swing).toHaveValue('5');
  await app.getByRole('button', { name: 'Metronome', exact: true }).click();
  await app.getByRole('button', { name: 'Count in', exact: true }).click();
  await expect(app.locator('#metronomeOptionsContextMenuCountIn')).toHaveAttribute('aria-pressed', 'true');
  const tempo = app.locator('.tempoTextField');
  await tempo.fill('145');
  await tempo.press('Tab');
  await app.locator('#midiPlayer').evaluate(el => { el.dataset.retainedPlayer = 'yes'; });
  await app.getByRole('button', { name: 'Start groove playback' }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await expect(app.locator('#midiPlayer')).toHaveAttribute('data-retained-player', 'yes');
  await expect(tempo).toHaveValue('145');
  await expect(swing).toHaveValue('5');
  await expect(app.locator('#midiPlayer .swingRow')).not.toBeVisible();
  await expect(app.locator('#gl-click-options > li')).toHaveCount(3);
  await expect(app.locator('#gl-settings')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(metronome).toHaveValue('8');
  await expect(meter).toHaveValue('4/4');
  await expect(notes).toHaveValue('16');
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await app.getByRole('button', { name: 'Stop groove playback' }).click();
  await app.locator('body').evaluate(() => window.myGrooveWriter.swapViewEditMode());
  await expect(meter).toBeDisabled();
  await expect(notes).toBeDisabled();
  await app.locator('body').evaluate(() => window.myGrooveWriter.swapViewEditMode());
  await expect(meter).toBeEnabled();
  await expect(notes).toBeEnabled();
  await page.reload();
  await expect(app.locator('#gl-meter')).toHaveValue('4/4');
  await expect(app.locator('#gl-notes')).toHaveValue('16');
  await expect(app.locator('.tempoTextField')).toHaveValue('145');
});


test('mobile settings and bottom toolbar align, with actions inside the notation section', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    await openGrooveSettings(app);
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    const legend = app.getByRole('button', { name: 'Legend', exact: true });
    await expect(app.locator('#sheetMusicDiv #LegendLabel')).toBeVisible();
    await expect(app.locator('#sheetMusicDiv .gl-score-action')).toHaveCount(3);
    if (width <= 900) {
      const layout = await app.locator('#bottomButtonRow').evaluate(bar => {
        const buttons = [...bar.querySelectorAll('button')].filter(button => getComputedStyle(button).display !== 'none');
        return { gap: getComputedStyle(bar).columnGap,
          topGap: getComputedStyle(document.getElementById('gl-settings')).columnGap,
          topHeight: document.querySelector('#gl-settings .tool-select-trigger').getBoundingClientRect().height,
          buttons: buttons.map(button => { const { x, y, width, height } = button.getBoundingClientRect();
            const icon = button.querySelector('.tool-icon,.stickings-icon').getBoundingClientRect();
            const label = button.querySelector('.bottomButtonContents > span:last-child').getBoundingClientRect();
            return { name: button.textContent.trim(), x, y, width, height, iconRight: icon.right, textLeft: label.left, overflow: button.scrollWidth > button.clientWidth + 1 }; }) };
      });
      expect(layout.gap).toBe('12px');
      expect(parseFloat(layout.gap)).toBeLessThan(parseFloat(layout.topGap));
      expect(layout.buttons.map(button => button.name)).toEqual(['Toms', 'Stickings', 'Speed trainer', 'Download', 'Print', 'Share']);
      for (const row of [layout.buttons.slice(0, 3), layout.buttons.slice(3, 6)]) {
        expect(new Set(row.map(button => button.y)).size).toBe(1);
        for (const button of row) {
          expect(button.height).toBe(layout.topHeight);
          expect(button.iconRight).toBeLessThan(button.textLeft);
          expect(button.width).toBeCloseTo(row[0].width, 1);
          expect(button.overflow).toBe(false);
        }
      }
      expect(layout.buttons[3].y).toBeGreaterThan(layout.buttons[0].y);
    }
    await legend.click();
    await expect(legend).toHaveAttribute('aria-pressed', 'true');
    await legend.press('Space');
    await expect(legend).toHaveAttribute('aria-pressed', 'false');
    if (width <= 900) {
      const settings = app.locator('#gl-settings');
      await expect(settings).toContainText('Time Signature');
      const cells = await settings.locator(':scope > .gl-setting').evaluateAll(items => items.map(item => {
        const { x, y, width } = item.getBoundingClientRect(); return { x, y, width };
      }));
      expect(cells).toHaveLength(4);
      expect(cells[0].y).toBe(cells[1].y);
      expect(cells[2].y).toBe(cells[3].y);
      expect(cells[0].x).toBe(cells[2].x);
      expect(cells[1].x).toBe(cells[3].x);
      expect(cells[2].y).toBeGreaterThan(cells[0].y + 50);
      expect(Math.abs(cells[0].width - cells[1].width)).toBeLessThan(1);
    }
    await expect(app.locator('#permutationAnchor')).toHaveCount(0);
    const grooves = app.getByRole('button', { name: 'Grooves', exact: true });
    await grooves.click();
    await expect(grooves).toHaveAttribute('aria-expanded', 'true');
    await expect(app.getByRole('heading', { name: 'Permutations' })).toBeVisible();
    const kick = app.getByRole('button', { name: 'Kick permutation', exact: true });
    await page.keyboard.press('ArrowDown');
    await expect(kick).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(grooves).toBeFocused();
    await expect(grooves).toHaveAttribute('aria-expanded', 'false');
    await grooves.click();
    // Presets still load the original pattern data and close the menu.
    const preset = app.locator('#grooveListWrapper .grooveListLI').first();
    await preset.focus();
    await page.keyboard.press('Enter');
    await expect(grooves).toHaveAttribute('aria-expanded', 'false');
    await app.locator('#gl-meter').selectOption('3/4');
    await grooves.click();
    await expect(kick).toBeDisabled();
    await expect(app.locator('#permutation-meter-note')).toBeVisible();
    await page.keyboard.press('Escape');
  }
});


for (const width of [320, 390, 768, 844]) {
  test(`mobile Metronome groups click options and retains their state at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 1000 });
    await page.goto('/groove/');
    const app = page.frameLocator('#groove-frame');
    await openGrooveSettings(app);
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    const toggle = app.getByRole('button', { name: 'Metronome', exact: true });
    const menu = app.getByRole('dialog', { name: 'Metronome options', exact: true });
    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('heading', { name: 'Options', exact: true })).toBeVisible();
    await expect(menu.locator('.groove-menu-section')).toHaveCSS('border-top-width', '1px');
    await menu.getByRole('button', { name: 'Eighth note', exact: true }).click();
    await expect(toggle).toHaveText('Eighth note');
    await expect(app.locator('#gl-metronome')).toHaveValue('8');
    await toggle.click();
    await menu.getByRole('button', { name: 'Solo (no drums)', exact: true }).click();
    await expect(toggle).toBeFocused();
    await expect(menu).not.toBeVisible();
    expect(await app.locator('body').evaluate(() => window.myGrooveWriter.myGrooveUtils.getMetronomeSolo())).toBe(true);
    await toggle.click();
    await expect(menu.getByRole('button', { name: 'Solo (no drums)', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await menu.getByRole('button', { name: 'Count in', exact: true }).click();
    await expect(toggle).toBeFocused();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await expect(menu.getByRole('button', { name: 'Count in', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await menu.getByRole('button', { name: 'Offset click', exact: true }).click();
    const offset = app.locator('#metronomeOptionsOffsetClickContextMenu');
    await expect(offset).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(app.locator('#metronomeOptionsOffsetClickContextMenuOnTheE')).toHaveClass(/menuChecked/);
    await expect(toggle).toBeFocused();
    await toggle.click();
    await menu.getByRole('button', { name: 'Offset click', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(offset).not.toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await toggle.click();
    await expect(app.locator('#gl-click-options > li')).toHaveCount(3);
    await expect(app.getByRole('button', { name: 'Count in', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width, height: 1000 });
    await toggle.click();
    await expect(menu.getByRole('button', { name: 'Count in', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(app.locator('#gl-click-options > li')).toHaveCount(3);
    const solo = menu.getByRole('button', { name: 'Solo (no drums)', exact: true });
    await expect(solo).toHaveAttribute('aria-pressed', 'true');
    await solo.click();
    expect(await app.locator('body').evaluate(() => window.myGrooveWriter.myGrooveUtils.getMetronomeSolo())).toBe(false);
    await app.locator('#gl-notes').selectOption('12');
    await toggle.click();
    await menu.getByRole('button', { name: 'Offset click', exact: true }).click();
    await expect(app.locator('#metronomeOptionsOffsetClickForTripletsContextMenu')).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await app.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 2)).toBe(true);
  });
}


test('tempo buttons step and repeat while hidden swing remains in playback and shared patterns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/groove/?Tempo=80&Div=16&Swing=17');
  const app = page.frameLocator('#groove-frame');
  await openGrooveSettings(app);
  const tempo = app.getByRole('spinbutton', { name: 'Tempo in beats per minute' });
  const swing = app.locator('.swingInput');
  await expect(tempo).toHaveValue('80');
  await expect(app.locator('#midiPlayer [data-adjust]')).toHaveCount(4);
  await expect(app.locator('#midiPlayer [data-adjust="tempo"]')).toHaveCount(2);
  await expect(app.locator('#midiPlayer [data-adjust="swing"]')).toHaveCount(2);
  await expect(app.locator('#midiPlayer .swingRow')).not.toBeVisible();
  await expect(swing).toHaveValue('17');
  await app.locator('#shareSaveButton').click();
  expect(new URL(await app.locator('#fullURLPopupTextField').inputValue()).searchParams.get('Swing')).toBe('17');
  await app.locator('#fullURLPopupCloseButton').click();
  for (const [name, expected] of [['Increase tempo by 5 BPM','85'],['Decrease tempo by 5 BPM','80']]) {
    await app.getByRole('button', { name }).click(); await expect(tempo).toHaveValue(expected);
  }
  for (const [field, entered, expected] of [[tempo,'999','300'],[tempo,'-5','30']]) {
    await field.fill(entered); await field.press('Tab'); await expect(field).toHaveValue(expected);
  }
  await tempo.fill('240'); await tempo.press('Tab');
  await app.getByRole('button', { name: 'Start groove playback' }).click();
  await app.getByRole('button', { name: 'Increase tempo by 5 BPM' }).click();
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await expect(tempo).toHaveValue('245');
  await expect(swing).toHaveValue('17');
  await expect.poll(() => app.locator('body').evaluate(() => window.myGrooveWriter.myGrooveUtils.getSwing())).toBe(17);
  await app.getByRole('button', { name: 'Stop groove playback' }).click();
  await app.locator('#gl-notes').selectOption('12');
  await expect(swing).toBeDisabled();
  await expect(swing).toHaveValue('0');
  for (const button of await app.locator('[data-adjust="swing"]').all()) await expect(button).toBeDisabled();
  await app.locator('#gl-notes').selectOption('16');
  await expect(swing).toBeEnabled();
  await expect(app.locator('#midiPlayer .swingRow')).not.toBeVisible();
  await expect(app.getByRole('button', { name: /swing by/ })).toHaveCount(0);
  expect(await app.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await tempo.fill('80'); await tempo.press('Tab');
  const plus = app.getByRole('button', { name: 'Increase tempo by 5 BPM' });
  await plus.press('Space');
  await expect(tempo).toHaveValue('85');
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await plus.dispatchEvent('pointerdown', { button: 0, isPrimary: true });
  await expect(tempo).toHaveValue('90');
  await page.clock.runFor(900);
  await expect(tempo).toHaveValue('90');
  await page.clock.runFor(100);
  await expect(tempo).toHaveValue('95');
  await plus.dispatchEvent('pointerup', { button: 0 });
  await page.clock.runFor(300);
  await expect(tempo).toHaveValue('95');
});
