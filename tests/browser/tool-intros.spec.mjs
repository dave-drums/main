import { test, expect } from '@playwright/test';

for (const path of ['/metronome/', '/groove/', '/rudiments/']) {
  test(`tool intro centres on mobile and BPM corners match buttons: ${path}`, async ({ page }) => {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      const field = path === '/groove/' ? page.frameLocator('#groove-frame').locator('.tempoTextField')
        : path === '/metronome/' ? page.locator('.met-bpm') : page.locator('#rud-bpm');
      const button = path === '/groove/' ? page.frameLocator('#groove-frame').locator('.tempoRow .gl-step-button').first()
        : path === '/metronome/' ? page.locator('.met-bpm-row button').first() : page.locator('#rud-minus');
      await expect(field).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await field.evaluate(el => getComputedStyle(el).borderRadius)).toBe(await button.evaluate(el => getComputedStyle(el).borderRadius));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width > 900) continue;
      const geometry = await page.locator('.tool-intro').evaluate(intro => {
        const bounds = intro.getBoundingClientRect();
        const icon = intro.querySelector('.tool-symbol').getBoundingClientRect();
        const heading = intro.querySelector('h1').getBoundingClientRect();
        const description = intro.querySelector('.lead').getBoundingClientRect();
        const actions = intro.querySelector('.tool-actions').getBoundingClientRect();
        const centre = bounds.x + bounds.width / 2;
        return { heading: Math.abs((icon.left + heading.right) / 2 - centre),
          description: Math.abs(description.x + description.width / 2 - centre),
          actions: Math.abs(actions.x + actions.width / 2 - centre),
          textAlign: getComputedStyle(intro.querySelector('.lead')).textAlign };
      });
      expect(geometry.heading).toBeLessThan(1);
      expect(geometry.description).toBeLessThan(1);
      expect(geometry.actions).toBeLessThan(1);
      expect(geometry.textAlign).toBe('center');
    }
  });
}
