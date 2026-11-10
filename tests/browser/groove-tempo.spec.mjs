import { test, expect } from '@playwright/test';

test('BPM controls keep even gaps, readable digits and matching heights', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto('/groove/?Tempo=300');
  const app = page.frameLocator('#groove-frame');
  const tempo = app.getByRole('spinbutton', { name: 'Tempo in beats per minute' });
  // Layout also works after the sound-bank loading fallback, independently of audio support.
  await expect(tempo).toBeVisible({ timeout: 25000 });
  await app.locator('body').evaluate(() => document.fonts.ready);
  for (const width of [320, 360, 390, 430, 768, 844, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 1000 });
    await tempo.fill('300');
    await tempo.press('Tab');
    const layout = await app.locator('.tempoRow.gl-stepper').evaluate(row => {
      const input = row.querySelector('input'), css = getComputedStyle(input);
      const canvas = document.createElement('canvas').getContext('2d');
      canvas.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      const bounds = row.getBoundingClientRect();
      return {
        left: bounds.left, right: bounds.right, fontSize: parseFloat(css.fontSize),
        textWidth: canvas.measureText(input.value).width,
        contentWidth: input.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
        controls: [...row.querySelectorAll('button,input')].map(node => {
          const b = node.getBoundingClientRect(); return { x: b.x, right: b.right, y: b.y, height: b.height, width: b.width };
        }),
      };
    });
    const [minus, number, plus] = layout.controls;
    expect(layout.fontSize, `digits at ${width}px`).toBeGreaterThanOrEqual(18);
    expect(layout.textWidth).toBeLessThanOrEqual(layout.contentWidth + .5);
    expect(minus.width).toBeCloseTo(plus.width, 1);
    for (const control of layout.controls) {
      expect(control.height).toBe(44);
      expect(control.y).toBeCloseTo(number.y, 1);
      expect(control.x).toBeGreaterThanOrEqual(layout.left - .5);
      expect(control.right).toBeLessThanOrEqual(layout.right + .5);
    }
    expect(number.x - minus.right).toBeCloseTo(plus.x - number.right, 1);
    await app.getByRole('button', { name: 'Decrease tempo by 5 BPM' }).click();
    await expect(tempo).toHaveValue('295');
  }
});
