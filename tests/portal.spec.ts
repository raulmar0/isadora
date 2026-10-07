import { test, expect, type Page } from '@playwright/test';

const quiEstCe = (page: Page) => page.getByRole('link', { name: /^Qui est-ce \? —/ });
const pays = (page: Page) => page.getByRole('link', { name: /^Pays et nationalités —/ });

test('French is the default and language changes survive reloads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true');
  await expect(quiEstCe(page)).toHaveAccessibleName('Qui est-ce ? — On joue ?');
  await expect(pays(page)).toHaveAccessibleName('Pays et nationalités — On joue ?');

  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(quiEstCe(page)).toHaveAccessibleName('Qui est-ce ? — ¡Vamos a jugar!');
  await expect(pays(page)).toHaveAccessibleName('Pays et nationalités — ¡Vamos a jugar!');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
  await expect(quiEstCe(page)).toHaveAccessibleName('Qui est-ce ? — ¡Vamos a jugar!');
  await expect(pays(page)).toHaveAccessibleName('Pays et nationalités — ¡Vamos a jugar!');

  await page.getByRole('button', { name: 'Français' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(quiEstCe(page)).toHaveAccessibleName('Qui est-ce ? — On joue ?');
  await expect(pays(page)).toHaveAccessibleName('Pays et nationalités — On joue ?');
});

test('the game card opens the original playable game', async ({ page }) => {
  await page.goto('/');
  await expect(quiEstCe(page)).toHaveAttribute('href', '/quiestce/');
  await quiEstCe(page).click();
  await expect(page).toHaveURL(/\/quiestce\/$/);
  await expect(page.getByRole('heading', { name: 'Qui est-ce ? — Le jeu des objets', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nouvelle partie', exact: true }).click();
  const firstObject = page.locator('[data-object]').first();
  await expect(page.locator('[data-object]')).toHaveCount(23);
  await firstObject.click();
  await expect(firstObject).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#remaining')).toHaveText('22 / 23');
});

test('the countries card opens the timed map game', async ({ page }) => {
  await page.goto('/');
  await expect(pays(page)).toHaveAttribute('href', '/pays/');
  await pays(page).click();
  await expect(page).toHaveURL(/\/pays\/$/);
  await expect(page.getByRole('heading', { name: 'Pays et nationalités', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await expect(page.locator('#guess')).toBeVisible();
  await page.locator('#guess').fill('français');
  await page.locator('form[data-action="guess"]').evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator('.map-pin.is-found[data-pin="france"]')).toBeVisible();
  await expect(page.locator('[data-score]')).toHaveText('1');
});

test('the island illustration loads, is described, and follows the language', async ({ page }) => {
  await page.goto('/');
  const island = page.locator('.world-poster');
  await expect(island).toBeVisible();
  await expect.poll(() => island.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await island.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toMatch(/\/images\/island-(700|900|1100)\.webp$/);
  await expect(island).toHaveAttribute('alt', /tour Eiffel.+baobab/);

  await page.getByRole('button', { name: 'Español' }).click();
  await expect(island).toHaveAttribute('alt', /torre Eiffel.+baobab/);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`the directory fits a ${viewport.width}×${viewport.height} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(quiEstCe(page)).toBeVisible();
    await expect(pays(page)).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth,
    )).toBeLessThanOrEqual(1);
    await pays(page).scrollIntoViewIfNeeded();
    await expect(pays(page)).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Français' })).toBeEnabled();
  });
}

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
