// Guards for how the page loads, not what it says. These run against the built
// site (playwright.config.ts points the server at `vite preview`), because the
// prerender and the injected preload only exist in the build.
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const islandRequests = (page: Page) => {
  const seen: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (/\/images\/island-\d+\.webp$/.test(url)) seen.push(url.split('/').pop()!);
  });
  return seen;
};

// Chrome pairs a preload with its <img> by resolved URL. If index.html and the
// component disagree by one character the page pays for two bitmaps, and
// nothing on screen betrays it — only this test does.
test('the hero is preloaded once, not twice', async ({ page }) => {
  const seen = islandRequests(page);
  await page.goto('/');
  await expect(page.locator('.world-poster')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(seen).toHaveLength(1);
});

test('the preload advertises the same candidates as the image', async ({ page }) => {
  await page.goto('/');
  const pair = await page.evaluate(() => {
    const link = document.querySelector('link[rel="preload"][as="image"]');
    const image = document.querySelector<HTMLImageElement>('.world-poster');
    return {
      linkSrcset: link?.getAttribute('imagesrcset') ?? null,
      linkSizes: link?.getAttribute('imagesizes') ?? null,
      imageSrcset: image?.getAttribute('srcset') ?? null,
      imageSizes: image?.getAttribute('sizes') ?? null,
      priority: link?.getAttribute('fetchpriority') ?? null,
    };
  });
  expect(pair.linkSrcset).toBe(pair.imageSrcset);
  expect(pair.linkSizes).toBe(pair.imageSizes);
  expect(pair.priority).toBe('high');
});

// srcset must never hand back fewer pixels than the slot needs, or the island
// renders upscaled. The 3x phone is the hungriest case on the page.
for (const [width, height, scale] of [[1440, 900, 1], [1600, 1000, 1], [1024, 768, 1], [390, 844, 3]] as const) {
  test(`${width}x${height} at ${scale}x gets a candidate large enough`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
    const page = await context.newPage();
    const seen = islandRequests(page);
    await page.goto('/');
    await expect(page.locator('.world-poster')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const chosen = Number(seen[0]?.match(/island-(\d+)/)?.[1]);
    const needed = await page.locator('.world-poster').evaluate(
      (image, dpr) => image.getBoundingClientRect().width * dpr, scale,
    );
    // 1100 is the top of the ladder, so a 2x desktop is knowingly under-served.
    expect(chosen).toBeGreaterThanOrEqual(Math.min(1100, Math.floor(needed)));
    await context.close();
  });
}

// The build serves the markup already rendered so the first paint does not wait
// for the bundle. If #root ships empty again, that win is gone.
test('the build ships rendered markup and hydrates it without complaint', async ({ page }) => {
  const complaints: string[] = [];
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) complaints.push(message.text());
  });
  page.on('pageerror', error => complaints.push(error.message));

  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  expect(html).not.toContain('<div id="root"></div>');
  expect(html).toContain('class="world-poster"');

  await page.goto('/');
  await expect(page.locator('.welcome h1')).toContainText('Bonjour,');
  await page.waitForTimeout(700);
  expect(complaints).toEqual([]);
});

// Fraunces is subset to exactly the glyphs the page draws today. Add a title
// with a character outside that set and it silently falls back to Georgia, so
// check the two against each other instead of trusting anyone to remember.
test('every glyph set in Fraunces is inside the subset', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const used = new Set<string>();
  for (const locale of ['Français', 'Español']) {
    await page.getByRole('button', { name: locale }).click();
    for (const character of await page.evaluate(() => {
      const characters = new Set<string>();
      for (const element of document.querySelectorAll<HTMLElement>('*')) {
        if (!/Fraunces/.test(getComputedStyle(element).fontFamily)) continue;
        for (const character of element.textContent ?? '') characters.add(character);
      }
      return [...characters];
    })) used.add(character);
  }

  const subset = new Set(' ,-.?BQacegijlnorstué');
  const missing = [...used].filter(character => !subset.has(character)).sort();
  expect(missing, `add these to the Fraunces subset in docs/image-prompts.md and regenerate the woff2: ${missing.join('')}`).toEqual([]);
});
