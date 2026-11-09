import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

// These requests are always intercepted: no test enquiry reaches Web3Forms.
for (const path of ['/', '/lessons/', '/recording/']) {
  test(`enquiry validation, slow/error/retry/duplicate handling: ${path}`, async ({ page }) => {
    let requests = 0, release;
    await page.route('https://api.web3forms.com/submit', async route => {
      requests++;
      if (requests === 1) {
        await new Promise(resolve => { release = resolve; });
        await route.fulfill({ status: 503, json: { success: false } });
      } else await route.fulfill({ status: 200, json: { success: true } });
    });
    await page.goto(path);
    const submit = page.locator('#enquiry-form button[type=submit]');
    await submit.click();
    await expect(page.locator('#enquiry-name')).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toBe(0);
    await page.locator('#enquiry-name').fill('Local test');
    await page.locator('#enquiry-email').fill('test@example.invalid');
    await page.locator('#enquiry-type').selectOption('Drum lessons');
    await page.locator('#enquiry-message').fill('Local simulated enquiry. Never delivered.');
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(page.locator('#form-status')).toHaveAttribute('data-state', 'pending');
    // Programmatic duplicate submission also respects the in-flight guard.
    await page.locator('#enquiry-form').evaluate(form => form.requestSubmit());
    expect(requests).toBe(1);
    release();
    await expect(page.locator('#form-status')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#enquiry-message')).toHaveValue('Local simulated enquiry. Never delivered.');
    await expect(page.locator('#enquiry-email')).toHaveValue('test@example.invalid');
    await expect(page.locator('.form-fallback a')).toHaveAttribute('href', 'mailto:info@davedrums.com.au');
    await submit.click();
    await expect(page.locator('#form-status')).toHaveAttribute('data-state', 'success');
    expect(requests).toBe(2);
    await expect(page.locator('#enquiry-message')).toHaveValue('');
    await expect(page.locator('#enquiry-type')).toHaveValue('Drum lessons');
  });
}

test('metronome reports missing audio, retries, and stops on leaving the page', async ({ page }) => {
  let unavailable = true;
  await page.route('**/metronome-*.mp3', route => unavailable
    ? route.fulfill({ status: 503, body: '' }) : route.continue());
  await page.goto('/metronome/');
  await expect(page.getByRole('button', { name: 'Retry audio' })).toBeVisible();
  await expect(page.getByLabel('Start metronome')).toBeDisabled();
  unavailable = false;
  await page.getByRole('button', { name: 'Retry audio' }).click();
  await expect(page.getByLabel('Start metronome')).toBeEnabled();
  await page.getByLabel('Start metronome').click();
  await expect(page.getByLabel('Stop metronome')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(page.getByLabel('Start metronome')).toBeVisible();
});

test('Groove Lab supports keyboard editing and contains portrait grid scrolling', async ({ page }) => {
  await page.goto('/groove/');
  const app = page.frameLocator('#groove-frame');
  const first = app.locator('[data-groove-note="hh"]').first();
  await expect(first).toHaveAttribute('aria-label', /Hi-hat, bar 1, beat 1/);
  const before = await first.getAttribute('aria-pressed');
  await first.focus();
  await first.press('Space');
  await expect(first).toHaveAttribute('aria-pressed', String(before !== 'true'));
  await first.press('ArrowRight');
  await expect(app.locator('[data-groove-note="hh"]').nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(app.locator('[data-groove-note="snare"]').nth(1)).toBeFocused();
  await expect(app.getByRole('slider', { name: 'Tempo slider in beats per minute' })).toBeVisible();
  const frame = page.frames().find(frame => /groove\/app\//.test(frame.url()));
  const dimensions = await frame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
    grid: document.getElementById('musicalInput').scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.grid).toBeGreaterThan(dimensions.width);
  await expect(page.locator('#groove-frame')).not.toHaveAttribute('aria-busy');
  const play = app.getByRole('button', { name: 'Start groove playback' });
  await expect(play).toHaveAttribute('aria-disabled', 'false');
  await play.click();
  await expect(app.getByRole('button', { name: 'Stop groove playback' })).toBeVisible();
  await frame.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(app.getByRole('button', { name: 'Start groove playback' })).toBeVisible();
  await app.locator('#showHideTomsButton').click();
  await expect(app.locator('[data-groove-note="tom1"]').first()).toHaveAttribute('aria-label', /High tom, bar 1/);
  await app.locator('#stickingsButton').click();
  await app.getByRole('button', { name: 'Show or Hide stickings', exact: true }).click();
  await expect(app.locator('[data-groove-note="sticking"]').first()).toHaveAttribute('aria-label', /Sticking, bar 1/);
});

test('a timed-out enquiry preserves the message and offers retry', async ({ page }) => {
  let release;
  await page.route('https://api.web3forms.com/submit', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.abort();
  });
  await page.goto('/lessons/');
  await page.clock.install();
  await page.locator('#enquiry-name').fill('Local timeout test');
  await page.locator('#enquiry-email').fill('test@example.invalid');
  await page.locator('#enquiry-message').fill('Retain this local test message.');
  await page.locator('#enquiry-form button[type=submit]').click();
  await expect.poll(() => typeof release).toBe('function');
  await page.clock.fastForward(20001);
  await expect(page.locator('#form-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#enquiry-message')).toHaveValue('Retain this local test message.');
  release();
  await expect(page.locator('#enquiry-form button[type=submit]')).toBeEnabled();
});

test('blocked video and score embeds retain direct links and focus return', async ({ page }) => {
  await page.goto('/watch/');
  const launch = page.locator('[data-video-provider="instagram"]').first();
  const id = await launch.getAttribute('data-video-id');
  await launch.click();
  await expect(page.locator(`iframe[src*="${id}"]`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open on Instagram', exact: true })).toBeVisible();
  await page.locator('[data-video-close]:visible').click();
  await expect(launch).toBeFocused();
  await page.goto('/notation/karnivool-drone');
  await expect(page.getByRole('link', { name: 'Open the score on Soundslice' })).toHaveAttribute('href', 'https://www.soundslice.com/slices/jXQqc/');
});

test('mobile menu, skip link and tool modal preserve keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('main')).toHaveAttribute('inert');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await page.goto('/rudiments/');
  const help = page.getByRole('button', { name: 'How to use', exact: true });
  await help.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(help).toBeFocused();
});

test('Groove Lab offers the animated rotate prompt on touch phones', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4198/groove/');
    const prompt = page.locator('#groove-orientation');
    await expect(prompt).toBeVisible();
    const proceed = prompt.getByRole('button', { name: 'Or tap to continue' });
    await expect(proceed).toBeFocused();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(prompt).not.toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(prompt).toBeVisible();
    await proceed.click();
    await expect(prompt).not.toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(prompt).not.toBeVisible();
    await page.reload();
    await expect(prompt).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(prompt).not.toBeVisible();
  } finally { await context.close(); }
});

for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
  for (const path of ['/metronome/', '/groove/', '/rudiments/']) {
    test(`tool reflow and controls ${path} ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const play = path === '/groove/' ? page.frameLocator('#groove-frame').getByRole('button', { name: 'Start groove playback' })
        : path === '/metronome/' ? page.getByLabel('Start metronome') : page.locator('#rud-play');
      await expect(play).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === '/groove/') {
        const frame = page.frames().find(frame => /groove\/app\//.test(frame.url()));
        expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const scroll = await frame.evaluate(() => {
          const area = document.getElementById('RightHandContent'); area.scrollTop = area.scrollHeight;
          const rect = document.querySelector('.midiPlayImage').getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, height: innerHeight };
        });
        expect(scroll.top).toBeGreaterThanOrEqual(0);
        expect(scroll.bottom).toBeLessThanOrEqual(scroll.height);
      }
    });
  }
}
