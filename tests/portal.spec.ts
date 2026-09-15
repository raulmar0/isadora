import { test, expect, type Page } from '@playwright/test';

const gameCard = (page: Page) => page.getByRole('link', { name: /^Qui est-ce \? —/ });

test('French is the default and language changes survive reloads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true');
  await expect(gameCard(page)).toHaveAccessibleName('Qui est-ce ? — On joue ?');

  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(gameCard(page)).toHaveAccessibleName('Qui est-ce ? — ¡Vamos a jugar!');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
  await expect(gameCard(page)).toHaveAccessibleName('Qui est-ce ? — ¡Vamos a jugar!');

  await page.getByRole('button', { name: 'Français' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(gameCard(page)).toHaveAccessibleName('Qui est-ce ? — On joue ?');
});

test('the game card opens the original playable game', async ({ page }) => {
  await page.goto('/');
  await expect(gameCard(page)).toHaveAttribute('href', '/quiestce/');
  await gameCard(page).click();
  await expect(page).toHaveURL(/\/quiestce\/$/);
  await expect(page.getByRole('heading', { name: 'Qui est-ce ? — Le jeu des objets', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nouvelle partie', exact: true }).click();
  const firstObject = page.locator('[data-object]').first();
  await expect(page.locator('[data-object]')).toHaveCount(23);
  await firstObject.click();
  await expect(firstObject).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#remaining')).toHaveText('22 / 23');
});

test('the island illustration loads, is described, and follows the language', async ({ page }) => {
  await page.goto('/');
  const island = page.locator('.world-poster');
  await expect(island).toBeVisible();
  // A broken or missing file still renders an <img>, so check the decoded bitmap.
  await expect.poll(() => island.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1400);
  await expect(island).toHaveAttribute('alt', /tour Eiffel.+baobab/);

  await page.getByRole('button', { name: 'Español' }).click();
  await expect(island).toHaveAttribute('alt', /torre Eiffel.+baobab/);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`the directory fits a ${viewport.width}×${viewport.height} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(gameCard(page)).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth,
    )).toBeLessThanOrEqual(1);
    await gameCard(page).scrollIntoViewIfNeeded();
    await expect(gameCard(page)).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Français' })).toBeEnabled();
  });
}

// The page ships no WebGL and no animation now: nothing may request a canvas,
// and the only remaining motion is the reduced-motion-aware card hover.
test('the page renders without a canvas or an animation frame', async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as unknown as { __rafs: number; __contexts: number };
    target.__rafs = 0;
    target.__contexts = 0;
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => { target.__rafs += 1; return request(callback); };
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, context: string, ...args: unknown[]) {
        target.__contexts += 1;
        return Reflect.apply(getContext, this, [context, ...args]);
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('.world-poster')).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => ({
    canvases: document.querySelectorAll('canvas').length,
    contexts: (window as unknown as { __contexts: number }).__contexts,
    frames: (window as unknown as { __rafs: number }).__rafs,
  }))).toEqual({ canvases: 0, contexts: 0, frames: 0 });
});
