import { test, expect } from '@playwright/test';

test('Drone uses a photo-led hero, black score section and green cover card without overflow', async ({ page }) => {
  await page.route('https://www.soundslice.com/**', route => route.fulfill({ body: '<html><body>Score</body></html>', contentType: 'text/html' }));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/notation/karnivool-drone.html');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Karnivool Drone');
    const hero = page.locator('.notation-hero');
    await expect(hero).toHaveClass(/service-hero/);
    await expect(hero.locator('img')).toHaveAttribute('src', '/img/karnivool-drone.jpg');
    await expect(hero.locator('img')).toBeVisible();
    const imageLayout = await hero.evaluate(node => {
      const hero = node.getBoundingClientRect(), media = node.querySelector('.page-hero-media').getBoundingClientRect();
      return { width: hero.width, imageWidth: media.width, fit: getComputedStyle(node.querySelector('img')).objectFit };
    });
    expect(imageLayout.imageWidth).toBeCloseTo(imageLayout.width, 0);
    expect(imageLayout.fit).toBe('cover');
    await expect(page.locator('#drone-notation')).toHaveClass(/theme-dark/);
    await expect(page.locator('.notation-performance')).toHaveClass(/theme-medium/);
    await expect(page.getByRole('link', { name: 'Open the score on Soundslice' })).toHaveAttribute('href', 'https://www.soundslice.com/slices/jXQqc/');
    await expect(page.locator('.notation-performance .video-launch')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=2XUMTnUKAKc');
    await page.locator('.notation-performance .video-player').scrollIntoViewIfNeeded();
    await expect(page.locator('.notation-performance .video-player')).toHaveCSS('opacity', '1');
    const sections = await page.locator('main > section').evaluateAll(nodes => nodes.map(node => {
      const b = node.getBoundingClientRect(); return { x: b.x, right: b.right, y: b.y, bottom: b.bottom };
    }));
    for (const section of sections) {
      expect(section.x).toBeCloseTo(sections[0].x, 0);
      expect(section.right).toBeCloseTo(sections[0].right, 0);
    }
    expect(sections[1].y).toBeGreaterThan(sections[0].bottom);
    expect(sections[2].y).toBeGreaterThan(sections[1].bottom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
