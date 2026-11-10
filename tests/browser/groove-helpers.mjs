import { expect } from '@playwright/test';

// Open the mobile drawer only when needed; desktop keeps the same controls inline.
export async function openGrooveSettings(app) {
  await expect(app.locator('#groove-controls')).toHaveAttribute('data-settings-ready', 'true');
  const toggle = app.getByRole('button', { name: 'Groove settings', exact: true });
  const compact = await app.locator('#groove-controls').evaluate(() => matchMedia('(max-width: 1100px)').matches);
  if (compact && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  await expect(app.locator('#gl-settings-drawer')).toHaveAttribute('aria-hidden', 'false');
}
