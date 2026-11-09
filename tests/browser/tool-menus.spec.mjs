import { test, expect } from '@playwright/test';

test('grid context menus use sentence case and retain note and row actions', async ({ page }) => {
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  const snare = app.locator('[data-groove-note="snare"]').first();
  await expect(snare).toBeVisible();
  const labels = await app.locator('.noteContextMenu li[onclick*="notePopupClick"], .noteContextMenu li[onclick*="noteLabelPopupClick"]').allTextContents();
  for (const label of labels) {
    const text = label.trim();
    expect(text[0], text).toBe(text[0].toUpperCase());
    const ordinary = text.replace(/\b[RL]s?\b/g, '');
    expect(ordinary.slice(1), text).toBe(ordinary.slice(1).toLowerCase());
  }
  await snare.click({ button: 'right' });
  const notes = app.locator('#snareContextMenu');
  await expect(notes).toBeVisible();
  await notes.getByRole('button', { name: 'Ghost note', exact: true }).click();
  await expect(notes).not.toBeVisible();
  await expect(snare).toHaveAttribute('aria-label', /ghost/i);
  await app.locator('.snare-label').first().click();
  const row = app.locator('#snareLabelContextMenu');
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'All snares off', exact: true }).click();
  await expect(row).not.toBeVisible();
  await expect(app.locator('[data-groove-note="snare"][aria-pressed="true"]')).toHaveCount(0);
  await snare.click({ button: 'right' });
  await notes.getByRole('button', { name: 'Drag', exact: true }).click();
  await expect(snare).toHaveAttribute('aria-label', /drag/i);
});

test('documented Groove keyboard shortcuts work without replacing grid navigation', async ({ page }) => {
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  const first = app.locator('[data-groove-note="hh"]').first();
  const second = app.locator('[data-groove-note="hh"]').nth(1);
  await expect(first).toBeVisible();
  const original = await first.getAttribute('aria-pressed');
  await first.press('Space');
  await expect(first).toHaveAttribute('aria-pressed', String(original !== 'true'));
  await first.press('Control+z');
  await expect(first).toHaveAttribute('aria-pressed', original);
  await first.press('Control+y');
  await expect(first).toHaveAttribute('aria-pressed', String(original !== 'true'));
  const tempo = app.locator('.tempoTextField');
  const bpm = Number(await tempo.inputValue());
  await first.press('ArrowRight');
  await expect(second).toBeFocused();
  await expect(tempo).toHaveValue(String(bpm));
  await page.keyboard.down('Control');
  await second.hover();
  await page.keyboard.up('Control');
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await app.locator('#totalPlayTime').hover();
  await page.keyboard.down('Alt');
  await second.hover();
  await page.keyboard.up('Alt');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await app.locator('body').evaluate(() => document.activeElement.blur());
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => Number(await tempo.inputValue())).toBeGreaterThan(bpm);
  await page.keyboard.press('ArrowLeft');
  await expect(tempo).toHaveValue(String(bpm));
  await page.keyboard.press('Space');
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await page.getByRole('button', { name: 'How to use', exact: true }).click();
  const guide = page.getByRole('dialog', { name: 'How to use Groove Lab', exact: true });
  await expect(guide.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
  await expect(guide).toContainText('Ctrl+Z / Ctrl+Y');
  await page.keyboard.press('Escape');
  await expect(guide).not.toBeVisible();
});

test('Groove selectors use shared grouped menus with keyboard selection and disabled options', async ({ page }) => {
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  const meter = app.getByRole('combobox', { name: 'Time signature', exact: true });
  await meter.click();
  const menu = app.getByRole('listbox', { name: 'Time signature', exact: true });
  await expect(menu).toHaveCSS('background-color', 'rgb(32, 44, 51)');
  await expect(menu.getByRole('group', { name: 'Eighth-note beats' })).toHaveCSS('border-top-width', '1px');
  await menu.getByRole('option', { name: '5/8', exact: true }).click();
  await expect(app.locator('#gl-meter')).toHaveValue('5/8');
  await expect(meter).toBeFocused();
  const notes = app.getByRole('combobox', { name: 'Subdivision', exact: true });
  await notes.click();
  await expect(app.getByRole('option', { name: 'Quarter note', exact: true })).toHaveAttribute('aria-disabled', 'true');
  await expect(app.getByRole('group', { name: 'Triplets', exact: true })).toHaveCSS('border-top-width', '1px');
  await page.keyboard.press('Home');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(app.locator('#gl-notes')).toHaveValue('32');
  await expect(notes).toBeFocused();
  await expect(notes).toHaveAttribute('aria-expanded', 'false');
  await meter.click();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(app.locator('#gl-meter')).toHaveValue('3/4');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Rudiment categories share the menu style and preserve arrows, keyboard and fullscreen focus', async ({ page }) => {
  await page.goto('/rudiments/');
  const select = page.getByRole('combobox', { name: 'Choose your rudiment', exact: true });
  await select.click();
  await expect(page.getByRole('option')).toHaveCount(40);
  const menu = page.getByRole('listbox', { name: 'Choose your rudiment', exact: true });
  await expect(menu).toHaveCSS('background-color', 'rgb(32, 44, 51)');
  await expect(menu.locator('.tool-menu-section').nth(1)).toHaveCSS('border-top-width', '1px');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(page.locator('#rud-name')).toHaveText('Triple Ratamacue');
  await expect(select).toBeFocused();
  await page.locator('#rud-next').click();
  await expect(select).toContainText('Single Stroke Roll');
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await select.click();
  await expect(menu).toBeVisible();
  const bounds = await menu.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(select).toBeFocused();
  await page.getByRole('button', { name: 'Exit Full Screen', exact: true }).click();
});

test('Metronome subdivision groups use the shared surface and divider', async ({ page }) => {
  await page.goto('/metronome/');
  await page.getByRole('button', { name: 'Subdivision: 1', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Subdivision', exact: true });
  await expect(dialog).toHaveCSS('background-color', 'rgb(32, 44, 51)');
  await expect(dialog.locator('.tool-menu-section').nth(1)).toHaveCSS('border-top-width', '1px');
  await dialog.getByRole('button', { name: '8th Triplet', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Subdivision: 3', exact: true })).toBeFocused();
});

test('enquiry dropdown keeps native validation, values and accepted submission status', async ({ page }) => {
  let submissions = 0;
  await page.route('https://api.web3forms.com/submit', async route => {
    submissions++;
    await route.fulfill({ status: 200, json: { success: true } });
  });
  await page.goto('/recording/');
  await page.locator('#enquiry-name').fill('Local test');
  await page.locator('#enquiry-email').fill('test@example.invalid');
  await page.locator('#enquiry-message').fill('Simulated enquiry; never delivered.');
  const native = page.locator('#enquiry-type');
  const dropdown = page.getByRole('combobox', { name: 'Enquiry type', exact: true });
  await expect(dropdown).toHaveAttribute('aria-required', 'true');
  // The Recording page preselects its enquiry type; clear it to test validation.
  await native.evaluate(select => { select.selectedIndex = 0; select.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.locator('#enquiry-form button[type="submit"]').click();
  await expect(dropdown).toHaveAttribute('aria-invalid', 'true');
  await expect(dropdown).toBeFocused();
  expect(submissions).toBe(0);
  await dropdown.click();
  await page.getByRole('option', { name: 'Drum recording', exact: true }).click();
  await expect(native).toHaveValue('Drum recording');
  await expect(dropdown).toHaveAttribute('aria-invalid', 'false');
  await page.locator('#enquiry-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toHaveAttribute('data-state', 'success');
  expect(submissions).toBe(1);
  await expect(dropdown).toContainText('Drum recording');
});
