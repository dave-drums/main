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
  expect(bounds.width).toBeGreaterThanOrEqual(30);
  expect(bounds.height).toBeGreaterThanOrEqual(30);
  await expect(empty).toHaveCSS('border-radius', '6px');
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
    await expect(highlights).toHaveAttribute('rx', '0');
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
  expect(box.width).toBe(30);
  expect(box.height).toBe(30);
  const heads = await combo.evaluate(node => {
    const circle = node.querySelector('.kick_circle').getBoundingClientRect(), cross = node.querySelector('.kick_splash').getBoundingClientRect();
    return { circleRight: circle.right, crossLeft: cross.left, circleBottom: circle.bottom, crossTop: cross.top };
  });
  expect(heads.crossLeft).toBeGreaterThanOrEqual(heads.circleRight);
  await expect(app.locator('[data-groove-note="kick"]').nth(2)).toHaveAttribute('data-note-state', 'foot splash');
});

for (const width of [320, 390, 768, 1440, 1722]) {
  test(`score selection covers the first complete bar and ends at its barline at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const [division, measures, signature] of [[16, 2, '4/4'], [32, 4, '4/4'], [16, 3, '7/8']]) {
      await page.goto(`/groove/?Div=${division}&Measures=${measures}&TimeSig=${signature}`);
      const app = page.frameLocator('#groove-frame');
      await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
      for (const legend of [false, true]) {
        if (legend) await app.locator('#LegendLabel').click();
        const geometry = await app.locator('#svgTarget').evaluate(target => {
          return [...target.querySelectorAll('svg')].flatMap(svg => {
            const viewport = svg.getBoundingClientRect();
            const barlines = [...svg.querySelectorAll('path')].filter(path => {
              if (path.closest('defs')) return false;
              const box = path.getBBox();
              return box.width < .01 && Math.abs(box.height - 24) < .01;
            }).map(path => {
              const box = path.getBoundingClientRect();
              // Firefox includes the stroke width; compare its centre to the bar boundary.
              return box.x + box.width / 2;
            });
            return [...svg.querySelectorAll('.gl-score-bar-highlight')].map(rect => {
              const box = rect.getBoundingClientRect();
              const notes = [...svg.querySelectorAll(`.gl-score-bar-marker[data-score-bar="${rect.dataset.scoreBar}"]`)].map(note => note.getBoundingClientRect());
              return { bar: rect.dataset.scoreBar, x: box.x, right: box.right, top: box.top, bottom: box.bottom,
                noteLeft: Math.min(...notes.map(n => n.x)), noteRight: Math.max(...notes.map(n => n.right)),
                noteTop: Math.max(viewport.y, Math.min(...notes.map(n => n.y))),
                noteBottom: Math.min(viewport.bottom, Math.max(...notes.map(n => n.bottom))),
                nearestBarline: Math.min(...barlines.map(x => Math.abs(box.right - x))) };
            });
          });
        });
        expect(geometry.length).toBe(measures);
        for (const bar of geometry) {
          expect(bar.x).toBeLessThanOrEqual(bar.noteLeft + 1);
          expect(bar.right).toBeGreaterThanOrEqual(bar.noteRight - 1);
          expect(bar.top).toBeLessThanOrEqual(bar.noteTop);
          expect(bar.bottom).toBeGreaterThanOrEqual(bar.noteBottom);
          expect(bar.nearestBarline).toBeLessThan(2);
        }
      }
    }
  });
}

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


test('compact cells centre all symbol families and keep ghost notes in proportion', async ({ page }) => {
  const pattern = new URLSearchParams({ Div: '16', Measures: '1',
    H: '|xXo+crbmsnN-----|', S: '|oOgxfdb---------|', K: '|oxX-------------|',
    T1: '|o---------------|', T4: '|o---------------|', Stickings: '|RLBc------------|' });
  await page.goto(`/groove/?${pattern}`);
  const app = page.frameLocator('#groove-frame');
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible({ timeout: 25000 });
  await app.locator('body').evaluate(() => {
    window.myGrooveWriter.showHideToms(true, true);
    window.myGrooveWriter.stickingsShowHide(true, true);
    return document.fonts.ready;
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const geometry = await app.locator('#musicalInput').evaluate(grid => {
      const box = node => node.getBoundingClientRect();
      const selectors = ['#hh_cross0 .fa', '#hh_crash4 .fa', '#hh_ride5 .fa', '#hh_ride_bell6 .fa',
        '#hh_cow_bell7 svg', '#hh_stacker8 svg', '#hh_metronome_normal9 .fa', '#hh_metronome_accent10 .fa',
        '#snare_circle0', '#snare_accent1 svg', '#snare_ghost2 .fa', '#snare_xstick3 .fa', '#snare_buzz6 .fa',
        '#tom_circle1-0', '#tom_circle4-0', '#kick_circle0', '#kick_splash1 .fa',
        '#sticking_right0', '#sticking_left1', '#sticking_both2', '#sticking_count3'];
      const centred = selectors.map(selector => {
        const node = grid.querySelector(selector), cell = node.closest('[data-groove-note]');
        const a = box(node), b = box(cell);
        return { selector, x: Math.abs(a.x + a.width/2 - b.x - b.width/2),
          y: Math.abs(a.y + a.height/2 - b.y - b.height/2), width: a.width, height: a.height };
      });
      const ornaments = ['#snare_flam4 svg', '#snare_drag5 svg'].map(selector => {
        const svg = grid.querySelector(selector), group = svg.querySelector('g');
        const a = group.getBBox(), matrix = group.getScreenCTM();
        const centre = new DOMPoint(a.x+a.width/2,a.y+a.height/2).matrixTransform(matrix);
        const cell = box(svg.closest('[data-groove-note]'));
        return { selector, x: Math.abs(centre.x-cell.x-cell.width/2), y: Math.abs(centre.y-cell.y-cell.height/2) };
      });
      const composites = [
        ['#hi-hat1', '.hh_cross .fa,.hh_accent .fa'], ['#hi-hat2', '.hh_cross .fa,.hh_open .fa'],
        ['#hi-hat3', '.hh_cross .fa,.hh_close .fa'], ['#kick2', '.kick_circle,.kick_splash .fa']
      ].map(([selector, parts]) => {
        const cell = grid.querySelector(selector), b = box(cell);
        const marks = [...cell.querySelectorAll(parts)].map(box);
        const left = Math.min(...marks.map(mark => mark.x)), right = Math.max(...marks.map(mark => mark.right));
        const top = Math.min(...marks.map(mark => mark.y)), bottom = Math.max(...marks.map(mark => mark.bottom));
        return { selector, x: Math.abs((left+right)/2-b.x-b.width/2), y: Math.abs((top+bottom)/2-b.y-b.height/2) };
      });
      const cell = box(grid.querySelector('[data-groove-note]'));
      const label = grid.querySelector('.gl-instrument-name');
      return { centred, ornaments, composites, cell: { width: cell.width, height: cell.height },
        rowHeight: box(grid.querySelector('.hi-hat-container')).height,
        labelSize: getComputedStyle(label).fontSize, ghostSize: getComputedStyle(grid.querySelector('.snare_ghost')).fontSize };
    });
    expect(geometry.cell).toEqual({ width: 30, height: 30 });
    expect(geometry.rowHeight).toBe(36);
    expect(geometry.labelSize).toBe('13px');
    expect(geometry.ghostSize).toBe('14px');
    for (const mark of [...geometry.centred, ...geometry.ornaments, ...geometry.composites]) {
      expect(mark.x, `${mark.selector} horizontal at ${width}px`).toBeLessThan(1);
      expect(mark.y, `${mark.selector} vertical at ${width}px`).toBeLessThan(1);
    }
    const combo = app.locator('#kick2');
    await expect(combo).toHaveAttribute('data-note-state', 'kick and foot splash');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
