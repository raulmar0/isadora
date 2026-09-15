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

test('without WebGL the fallback artwork and game link remain usable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, context: string, ...args: unknown[]) {
        if (context.includes('webgl')) return null;
        return Reflect.apply(getContext, this, [context, ...args]);
      },
    });
  });
  await page.goto('/');
  const poster = page.locator('.world-poster');
  await expect(poster).toBeVisible();
  await expect.poll(() => poster.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Recentrer la vue' })).toHaveCount(0);
  await gameCard(page).click();
  await expect(page).toHaveURL(/\/quiestce\/$/);
  await expect(page.getByRole('button', { name: 'Nouvelle partie', exact: true })).toBeEnabled();
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

test('animation can be paused and resumed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-region')).toHaveClass(/is-ready/);
  await page.getByRole('button', { name: 'Mettre l’animation en pause' }).click();
  const resume = page.getByRole('button', { name: 'Reprendre l’animation' });
  await expect(resume).toHaveAttribute('aria-pressed', 'true');
  await resume.click();
  await expect(page.getByRole('button', { name: 'Mettre l’animation en pause' })).toHaveAttribute('aria-pressed', 'false');
});

test('reduced motion hides animation controls while keeping reset and games usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-region')).toHaveClass(/is-ready/);
  await expect(page.getByRole('button', { name: /Mettre l’animation en pause|Reprendre l’animation/ })).toHaveCount(0);
  const reset = page.getByRole('button', { name: 'Recentrer la vue' });
  await expect(reset).toBeEnabled();
  await reset.click();
  await expect(page.locator('.world-region')).toHaveClass(/is-ready/);
  await expect(gameCard(page)).toBeVisible();
});
