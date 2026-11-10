import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768]) {
  test(`mobile navigation keeps paired links and aligned icons at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1024 });
    // A cached old URL must not supply the stylesheet for a fresh deployment.
    await page.route(/\/assets\/styles\.css$/, route => route.fulfill({
      contentType: 'text/css', body: '.site-header nav { display: block; font-size: 28px }',
    }));
    await page.goto('/recording/');
    const stylesheet = page.locator('link[rel="stylesheet"][href*="assets/styles.css"]');
    await expect(stylesheet).toHaveAttribute('href', /\?v=[a-f0-9]{12}$/);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const menu = page.locator('#site-navigation');
    await expect(menu).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('inert');
    const items = menu.locator(':scope > a, :scope > details > summary');
    const boxes = await items.evaluateAll(nodes => nodes.map(node => {
      const bounds = node.getBoundingClientRect();
      const icon = node.querySelector('.nav-mobile-icon').getBoundingClientRect();
      const label = [...node.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
      const range = document.createRange(); range.selectNode(label);
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
        iconRight: icon.right, textLeft: range.getBoundingClientRect().left,
        fontSize: parseFloat(getComputedStyle(node).fontSize) };
    }));
    expect(boxes).toHaveLength(7);
    for (let row = 0; row < 3; row++) {
      const [left, right] = boxes.slice(row * 2, row * 2 + 2);
      expect(left.y).toBeCloseTo(right.y, 1);
      expect(left.x + left.width).toBeLessThan(right.x);
      expect(left.width).toBeCloseTo(right.width, 1);
    }
    for (const item of boxes) {
      expect(item.height).toBeGreaterThanOrEqual(44);
      expect(item.fontSize).toBeLessThanOrEqual(18);
      expect(item.iconRight).toBeLessThan(item.textLeft);
    }
    await expect(menu.getByRole('link', { name: 'Recording', exact: true })).toHaveAttribute('aria-current', 'page');
    await menu.getByText('Free Tools', { exact: true }).click();
    await expect(menu.getByRole('link', { name: 'Rudiment Trainer', exact: true })).toBeVisible();
    const submenu = await menu.locator('.nav-submenu').boundingBox();
    expect(submenu.x).toBeGreaterThanOrEqual(0);
    expect(submenu.x + submenu.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape'); // Close tools, then the main menu.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert');
  });
}
