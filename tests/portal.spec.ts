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

// Dragging aside, the arrow keys and Home are the only way to move the island,
// so the test has to see the scene actually redraw. Under reduced motion the
// render loop settles and stops, which makes a new frame a reliable signal that
// the key was handled; the canvas itself cannot be read back, since the renderer
// keeps no drawing buffer.
async function countFrames(page: Page) {
  return page.evaluate(() => (window as unknown as { __frames: number }).__frames);
}

async function settledFrameCount(page: Page) {
  let previous = -1;
  await expect.poll(async () => {
    const current = await countFrames(page);
    const stable = current === previous;
    previous = current;
    return stable;
  }, { timeout: 15_000 }).toBe(true);
  return countFrames(page);
}

test('the arrow keys turn the island and Home recentres it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const target = window as unknown as { __frames: number };
    target.__frames = 0;
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => request(time => { target.__frames += 1; return callback(time); });
  });
  await page.goto('/');
  await expect(page.locator('.world-region')).toHaveClass(/is-ready/);

  const island = page.locator('.francophone-world');
  await island.focus();
  await expect(island).toBeFocused();

  const idle = await settledFrameCount(page);
  await island.press('a');
  await expect.poll(() => countFrames(page)).toBe(idle);

  await island.press('ArrowLeft');
  await expect.poll(() => countFrames(page)).toBeGreaterThan(idle);

  const turned = await settledFrameCount(page);
  await island.press('Home');
  await expect.poll(() => countFrames(page)).toBeGreaterThan(turned);
  await expect(island).toBeFocused();
});

test('reduced motion keeps the island and the games usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-region')).toHaveClass(/is-ready/);
  await expect(page.locator('.world-poster')).toHaveCount(0);
  await expect(gameCard(page)).toBeVisible();
  await gameCard(page).click();
  await expect(page).toHaveURL(/\/quiestce\/$/);
});
