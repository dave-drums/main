import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`drag and flam share slash angles and notation height at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/groove/?Div=16&Measures=1&H=|----------------|&S=|d---f-----------|&K=|----------------|');
    const app = page.frameLocator('#groove-frame');
    await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
    const engraving = await app.locator('#svgTarget').evaluate(target => {
      const href = node => node.getAttribute('href') || node.getAttribute('xlink:href');
      const uses = [...target.querySelectorAll('use')].filter(node => !node.closest('defs'));
      const graceHeads = uses.filter(node => href(node) === '#ghd');
      const mainHeads = uses.filter(node => href(node) === '#hd');
      const paths = [...target.querySelectorAll('path')].filter(node => !node.closest('defs'));
      function stem(head, offset) {
        const x = Number(head.getAttribute('x')) + offset;
        const node = paths.find(path => /^m[\d.]+ [\d.]+v-[\d.]+$/.test(path.getAttribute('d')) && Math.abs(path.getBBox().x - x) < .05);
        return node ? { top: node.getBBox().y, height: node.getBBox().height } : null;
      }
      // Beams extend above the stem endpoint: measure the whole ornament,
      // rather than treating stem length alone as its visible height.
      const graceStems = graceHeads.map(head => stem(head, 6.1));
      const beamTops = paths.filter(path => /v1\.60l/.test(path.getAttribute('d')))
        .filter(path => path.getBBox().x >= Number(graceHeads[0].getAttribute('x'))
          && path.getBBox().x < Number(graceHeads[1].getAttribute('x')) + 6.1)
        .map(path => path.getBBox().y);
      return { graceCount: graceHeads.length, mainCount: mainHeads.length,
        graceStems,
        dragHeight: Number(graceHeads[0].getAttribute('y')) - Math.min(...beamTops, ...graceStems.slice(0, 2).map(stem => stem.top)),
        flamHeight: graceStems[2].height,
        beamCount: beamTops.length,
        mainStems: mainHeads.map(head => stem(head, 3.5)),
        slashes: paths.filter(path => /^m[\d.]+ [\d.]+l9\.00 -5\.00$/.test(path.getAttribute('d'))).length };
    });
    expect(engraving.graceCount).toBe(3); // Two drag grace notes and one flam grace note.
    expect(engraving.mainCount).toBe(2);
    expect(engraving.slashes).toBe(2);
    expect(engraving.graceStems.every(Boolean)).toBe(true);
    expect(engraving.mainStems.every(Boolean)).toBe(true);
    expect(engraving.beamCount).toBe(2);
    expect(engraving.dragHeight).toBeCloseTo(engraving.flamHeight, 2);
    for (const dragStem of engraving.graceStems.slice(0, 2)) {
      expect(dragStem.top).toBeGreaterThanOrEqual(engraving.mainStems[0].top);
    }
    expect(engraving.mainStems[0].height).toBe(engraving.mainStems[1].height);
    for (const [selector, name] of [['.snare_drag', 'drag'], ['.snare_flam', 'flam']]) {
      const slash = await app.locator(selector).first().evaluate(node => [...node.querySelectorAll('path')]
        .map(path => path.getAttribute('d')).find(d => /l9\s*-5$/.test(d)));
      expect(slash, `${name} grid slash`).toMatch(/l9\s*-5$/);
    }
    const gridHeights = await app.locator('#musicalInput').evaluate(target => {
      return ['drag', 'flam'].map(name => {
        const icon = target.querySelector(`.snare_${name}`);
        const graceHead = [...icon.querySelectorAll('use')]
          .find(node => node.getAttribute('xlink:href') === `#${name}_ghd`);
        const stem = [...icon.querySelectorAll('path')].find(node => /^m52\.1 53\.34v-14/.test(node.getAttribute('d')));
        const beams = [...icon.querySelectorAll('g > path.fill')].map(node => node.getBBox().y);
        return Number(graceHead.getAttribute('y')) - Math.min(stem.getBBox().y, ...beams);
      });
    });
    expect(gridHeights[0]).toBeCloseTo(gridHeights[1], 2);
    await expect(app.locator('[data-groove-note="snare"]').first()).toHaveAttribute('aria-label', /drag/i);
    await expect(app.locator('[data-groove-note="snare"]').nth(4)).toHaveAttribute('aria-label', /flam/i);
  });
}
