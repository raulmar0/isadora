import { test, expect, type Page } from '@playwright/test';

// The game is served from the built site, like everything else in this suite.
const GAME = '/pays/';

async function start(page: Page) {
  await page.goto(GAME);
  await page.getByRole('button', { name: 'Commencer' }).click();
  const guess = page.getByLabel('Pays ou nationalité');
  await expect(guess).toBeFocused();
  return guess;
}

async function cutTexts(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.card .word, .card .card-country')]
    .filter(el => getComputedStyle(el).display !== 'none' && el.scrollWidth > el.clientWidth + 1)
    .map(el => el.textContent));
}

async function overlappingLabels(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    for (const scope of ['.world', '.inset']) {
      const frame = document.querySelector(scope)!.getBoundingClientRect();
      const boxes = [...document.querySelectorAll<HTMLElement>(`${scope} .label`)]
        .filter(label => getComputedStyle(label).display !== 'none')
        .map(label => ({ code: label.dataset.code, box: label.firstElementChild!.getBoundingClientRect() }));
      boxes.forEach(({ code, box }, i) => {
        if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) {
          problems.push(`${code} leaves ${scope}`);
        }
        for (const other of boxes.slice(i + 1)) {
          const x = Math.min(box.right, other.box.right) - Math.max(box.left, other.box.left);
          const y = Math.min(box.bottom, other.box.bottom) - Math.max(box.top, other.box.top);
          if (x > 1 && y > 1) problems.push(`${code} × ${other.code}`);
        }
      });
    }
    return problems;
  });
}

test('one answer completes the map and the flag, with both genders', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('française');
  await expect(guess).toHaveValue('');
  await expect(page.locator('.label.is-found[data-code="fr"]')).toHaveText('la France');
  const card = page.locator('.card[data-id="france"]');
  await expect(card).toHaveClass(/is-found/);
  await expect(card.locator('[data-slot="m"]')).toHaveText('français');
  await expect(card.locator('[data-slot="f"]')).toHaveText('française');
  await expect(page.locator('#feedback')).toContainText('la France');
  await expect(page.locator('[data-score]')).toHaveText('1');
});

test('an answer that may still grow waits for a pause or Enter', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('japonais');
  await expect(guess).toHaveClass(/is-pending/);
  await expect(page.locator('.label[data-code="jp"]')).toHaveClass(/is-blank/);
  await expect(page.locator('.label.is-found[data-code="jp"]')).toHaveText('le Japon');
  await expect(guess).toHaveValue('');

  await guess.pressSequentially('italien');
  await guess.press('Enter');
  await expect(page.locator('.label.is-found[data-code="it"]')).toHaveText('l’Italie');
  await expect(page.locator('[data-score]')).toHaveText('2');
});

test('a wrong article still counts and is corrected', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('le Belgique');
  await expect(page.locator('.label.is-found[data-code="be"]')).toHaveText('la Belgique');
  await expect(page.locator('#feedback')).toHaveText(/On dit la Belgique, pas le Belgique/);
});

test('duplicates, Spanish words and typos get their own message', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('le Maroc');
  await expect(page.locator('.label.is-found[data-code="ma"]')).toHaveText('le Maroc');
  await page.waitForTimeout(2600);
  await guess.pressSequentially('marocaine');
  await expect(page.locator('#feedback')).toHaveText(/Déjà trouvé\s:\sle Maroc/);
  await expect(page.locator('[data-score]')).toHaveText('1');

  await guess.pressSequentially('Alemania');
  await guess.press('Enter');
  await expect(page.locator('#feedback')).toHaveText(/c’est de l’espagnol/);
  await expect(guess).toHaveValue('');

  await guess.pressSequentially('alemand');
  await guess.press('Enter');
  await expect(page.locator('#feedback')).toHaveText(/Presque/);
  await expect(guess).toHaveValue('alemand');
});

test('ending the round reveals what was missed and offers a new round', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('brésilienne');
  await page.getByRole('button', { name: /^(Terminer|Fin)$/ }).click();
  await expect(page.getByRole('heading', { name: 'Partie terminée' })).toBeFocused();
  await expect(page.locator('[data-score]')).toHaveCount(0);
  await expect(page.locator('.result-score')).toContainText('1');
  await expect(page.locator('.card.is-missed')).toHaveCount(23);
  await expect(page.locator('.label.is-missed[data-code="mx"]')).toHaveText('le Mexique');
  await expect(page.locator('.card[data-id="mexique"] [data-slot="f"]')).toHaveText('mexicaine');
  await page.getByRole('button', { name: 'Rejouer' }).click();
  await expect(page.getByLabel('Pays ou nationalité')).toBeFocused();
  await expect(page.locator('.card.is-found, .card.is-missed')).toHaveCount(0);
});

test('a nationality typed with its article and in the plural is not cut short', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('les Italiens', { delay: 40 });
  await expect(page.locator('.label.is-found[data-code="it"]')).toHaveText('l’Italie');
  await expect(guess).toHaveValue('');
  await expect(page.locator('#feedback')).toContainText('au singulier, sans article');

  await guess.pressSequentially('japonaise', { delay: 40 });
  await expect(page.locator('.label.is-found[data-code="jp"]')).toHaveText('le Japon');
  await guess.pressSequentially('s', { delay: 40 });
  await expect(guess).toHaveValue('');
  await guess.pressSequentially('le Brésil', { delay: 40 });
  await expect(page.locator('.label.is-found[data-code="br"]')).toHaveText('le Brésil');
  await guess.pressSequentially('ienne', { delay: 40 });
  await expect(guess).toHaveValue('');
  await guess.pressSequentially('belge', { delay: 40 });
  await expect(page.locator('[data-score]')).toHaveText('4');

  // Right after « grecque », an « s » may start « Suisse »: it is not swallowed.
  await guess.pressSequentially('grecque', { delay: 40 });
  await expect(page.locator('.label.is-found[data-code="gr"]')).toHaveText('la Grèce');
  await guess.pressSequentially('suisse', { delay: 40 });
  await expect(page.locator('.label.is-found[data-code="ch"]')).toHaveText('la Suisse');
  await expect(guess).toHaveValue('');
  await expect(page.locator('[data-score]')).toHaveText('6');
});

test('an answer still waiting for the pause counts when the round ends', async ({ page }) => {
  const guess = await start(page);
  await guess.pressSequentially('italien');
  await expect(guess).toHaveClass(/is-pending/);
  await page.getByRole('button', { name: /^(Terminer|Fin)$/ }).click();
  await expect(page.locator('.result-score')).toContainText('1');
  await expect(page.locator('.card[data-id="italie"]')).toHaveClass(/is-found/);
});

test('reading the rules stops the clock and gives the field back', async ({ page, viewport }) => {
  // Phones keep the sound switch in the bar during a round instead of the rules.
  test.skip((viewport?.width ?? 1280) <= 480, 'no rules button during a round on phones');
  const guess = await start(page);
  await guess.pressSequentially('la Fr');
  await page.getByRole('button', { name: 'Règles du jeu' }).click();
  await expect(page.getByRole('dialog', { name: 'Règles du jeu' })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Compris' }).click();
  await expect(guess).toBeFocused();
  await expect(page.locator('[data-timer]')).toHaveText(/^(1:00|0:59|0:58)$/);
  await guess.pressSequentially('ance');
  await expect(page.locator('.label.is-found[data-code="fr"]')).toHaveText('la France');
});

test('on the answer key a flag points at its country', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: /^(Terminer|Fin)$/ }).click();
  await page.locator('.card[data-id="japon"]').click();
  await expect(page.locator('.country.is-pointed[data-code="jp"]')).toHaveCount(1);
  await expect(page.locator('.label.is-pointed[data-code="jp"]')).toHaveText('le Japon');
});

test('the chosen duration is used and remembered', async ({ page }) => {
  await page.goto(GAME);
  await page.getByRole('radio', { name: '3 min' }).check();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Combien de pays en 3 minutes ?');
  await page.reload();
  await expect(page.getByRole('radio', { name: '3 min' })).toBeChecked();
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(page.locator('[data-timer]')).toHaveText(/^(3:00|2:59)$/);
});

test('every flag loads', async ({ page }) => {
  await page.goto(GAME);
  const flags = page.locator('.card-flag');
  await expect(flags).toHaveCount(24);
  await expect.poll(() => flags.evaluateAll(images =>
    images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBe(24);
});

for (const viewport of [{ width: 1366, height: 650 }, { width: 1920, height: 1000 }, { width: 1080, height: 600 }]) {
  test(`the whole board fits one ${viewport.width}×${viewport.height} screen and no names overlap`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await start(page);
    await page.getByRole('button', { name: /^(Terminer|Fin)$/ }).click();
    await expect(page.locator('.label.is-missed')).toHaveCount(24);
    expect(await cutTexts(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    expect(await overlappingLabels(page)).toEqual([]);
  });
}

for (const viewport of [{ width: 390, height: 844, scrolls: true }, { width: 820, height: 1180, scrolls: false }, { width: 320, height: 640, scrolls: true }]) {
  test(`a ${viewport.width}px screen keeps the answer field on top and nothing spills sideways`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const guess = await start(page);
    await guess.pressSequentially('la Suisse');
    await page.evaluate(() => window.scrollBy(0, 900));
    if (viewport.scrolls) expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await expect(guess).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.locator('[data-action="stop"]').click();
    await expect(page.getByRole('heading', { name: 'Partie terminée' })).toBeFocused();
    expect(await cutTexts(page)).toEqual([]);
    expect(await overlappingLabels(page)).toEqual([]);
  });
}
