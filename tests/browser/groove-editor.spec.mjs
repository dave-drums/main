import { test, expect } from '@playwright/test';

test('new step cells keep special notes, row actions and shared patterns intact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/groove/?Div=16&Measures=1&S=|O---d---f---g---|');
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  const snare = app.locator('[data-groove-note="snare"]');
  for (const [index, state] of [[0, 'accent'], [4, 'drag'], [8, 'flam'], [12, 'ghost note']]) {
    await expect(snare.nth(index)).toHaveAttribute('aria-pressed', 'true');
    await expect(snare.nth(index)).toHaveAttribute('data-note-state', state);
  }
  const empty = snare.nth(1);
  const bounds = await empty.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(36);
  expect(bounds.height).toBeGreaterThanOrEqual(36);
  await expect(empty).toHaveCSS('border-radius', '8px');
  await empty.click();
  await expect(empty).toHaveAttribute('aria-pressed', 'true');
  await empty.click({ button: 'right' });
  await app.locator('#snareContextMenu').getByRole('button', { name: 'Ghost note', exact: true }).click();
  await expect(empty).toHaveAttribute('data-note-state', 'ghost note');
  await app.locator('.hh-label .gl-instrument-icon').click();
  await app.locator('#hhLabelContextMenu').getByRole('button', { name: 'All hi-hats off', exact: true }).click();
  await expect(app.locator('[data-groove-note="hh"][aria-pressed="true"]')).toHaveCount(0);
  const snapshot = () => app.locator('body').evaluate(() => JSON.stringify(window.myGrooveWriter.grooveDataFromClickableUI()));
  const original = await snapshot();
  await app.getByRole('button', { name: 'Add bar', exact: true }).click();
  await expect(app.locator('.gl-bar-title')).toHaveText(['Bar 1', 'Bar 2']);
  await expect(app.locator('.gl-bar-header .closeMeasureButton')).toHaveCount(2);
  await app.getByRole('button', { name: 'Delete bar 2', exact: true }).click();
  await expect(app.locator('.gl-bar-title')).toHaveText(['Bar 1']);
  expect(await snapshot()).toBe(original);
  await app.locator('#shareSaveButton').click();
  const link = await app.locator('#fullURLPopupTextField').inputValue();
  await page.goto(link);
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  expect(await snapshot()).toBe(original);
});

for (const division of [16, 32]) {
  test(`visible editor bar highlights the matching notation including empty bars and legend: division ${division}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(`/groove/?Div=${division}&Measures=2&H=|--------------------------------|--------------------------------|&S=|--------------------------------|--------------------------------|&K=|--------------------------------|--------------------------------|`);
    const app = page.frameLocator('#groove-frame');
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    const grid = app.locator('#musicalInput');
    const highlights = app.locator('.gl-score-bar-highlight.is-current-bar');
    await expect(grid).toHaveAttribute('data-current-bar', '1');
    await expect(highlights).toHaveAttribute('data-score-bar', '1');
    await grid.evaluate(node => { node.scrollLeft = node.scrollWidth; });
    await expect(grid).toHaveAttribute('data-current-bar', '2');
    await expect(highlights).toHaveAttribute('data-score-bar', '2');
    await app.locator('#LegendLabel').click();
    await expect(highlights).toHaveAttribute('data-score-bar', '2');
    await expect(app.locator('.gl-score-bar-highlight[data-score-bar="0"]')).toHaveCount(0);
    const last = app.locator('[data-groove-note="snare"]').last();
    await last.focus();
    await last.press('Space');
    await expect(highlights).toHaveAttribute('data-score-bar', '2');
    await page.emulateMedia({ media: 'print' });
    await expect(highlights).toBeHidden();
  });
}

test('compact grid symbols preserve stacker, cowbell and combined kick/foot choices', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/groove/?Div=16&Measures=1&H=|sm--------------|&K=|X-x-------------|');
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await expect(app.locator('.kick-label use').first()).toHaveAttribute('href', 'images/tool-icons.svg#kick-drum');
  await expect(app.locator('#hh_stacker0 use')).toHaveAttribute('href', 'images/tool-icons.svg#stacker');
  await expect(app.locator('#hh_cow_bell1 use')).toHaveAttribute('href', 'images/tool-icons.svg#cowbell');
  const combo = app.locator('[data-groove-note="kick"]').first();
  await expect(combo).toHaveAttribute('data-note-state', 'kick and foot splash');
  const box = await combo.boundingBox();
  expect(box.width).toBe(36);
  expect(box.height).toBe(36);
  const heads = await combo.evaluate(node => {
    const circle = node.querySelector('.kick_circle').getBoundingClientRect(), cross = node.querySelector('.kick_splash').getBoundingClientRect();
    return { circleRight: circle.right, crossLeft: cross.left, circleBottom: circle.bottom, crossTop: cross.top };
  });
  expect(heads.crossLeft).toBeGreaterThanOrEqual(heads.circleRight);
  await expect(app.locator('[data-groove-note="kick"]').nth(2)).toHaveAttribute('data-note-state', 'foot splash');
});

test('portrait grid keeps row labels visible and keyboard focus clear when scrolling', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/?Div=16&Measures=1');
    const app = page.frameLocator('#groove-frame');
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    const first = app.locator('[data-groove-note="hh"]').first();
    await first.focus();
    await first.press('End');
    const last = app.locator('[data-groove-note="hh"]').last();
    await expect(last).toBeFocused();
    const boxes = await app.locator('#musicalInput').evaluate(grid => {
      const rect = node => { const b = node.getBoundingClientRect(); return { x: b.x, right: b.right }; };
      return { grid: rect(grid), label: rect(grid.querySelector('.hh-label')), scrolled: grid.scrollLeft, pageOverflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(boxes.scrolled).toBeGreaterThan(0);
    expect(boxes.label.x).toBeGreaterThanOrEqual(boxes.grid.x);
    const cell = await last.boundingBox();
    expect(cell.x).toBeGreaterThanOrEqual(boxes.label.right);
    expect(cell.x + cell.width).toBeLessThanOrEqual(boxes.grid.right);
    expect(boxes.pageOverflow).toBe(false);
    await expect(app.locator('html')).toHaveCSS('overflow-y', 'hidden');
  }
});
