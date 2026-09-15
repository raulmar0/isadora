import { test, expect } from "@playwright/test";
import { STORAGE_KEY } from "../src/game.js";

const savedGame = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);

test("start, cross out, undo, reveal and resume the same saved game", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Continuer", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await expect(page.locator("[data-object]")).toHaveCount(23);
  const initial = await savedGame(page);
  const first = page.locator("[data-object]").first();
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#remaining")).toHaveText("22 / 23");
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await first.click();
  await page
    .getByRole("button", { name: "Voir ma carte", exact: true })
    .click();
  await expect(page.locator(".secret-front")).toBeVisible();
  await expect(page.locator(".secret-front strong")).toHaveText(/.+/);
  await page
    .getByRole("button", { name: "Cacher ma carte", exact: true })
    .click();
  await expect(page.locator(".secret-front")).toHaveCount(0);
  await page.getByRole("button", { name: "Accueil", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  const resumed = await savedGame(page);
  expect(resumed.board).toEqual(initial.board);
  expect(resumed.secretId).toEqual(initial.secretId);
  expect(resumed.eliminated).toEqual([initial.board[0]]);
  await expect(page.locator("[data-object]").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".secret-front")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("new game requires confirmation and cancel preserves the previous game", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await page.locator("[data-object]").first().click();
  const original = await savedGame(page);
  await page.getByRole("button", { name: "Qui est-ce ? — Accueil" }).click();
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await page.getByRole("button", { name: "Garder ma partie" }).click();
  expect(await savedGame(page)).toEqual(original);
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await page.getByRole("button", { name: "C’est parti", exact: true }).click();
  const fresh = await savedGame(page);
  expect(fresh.eliminated).toEqual([]);
  expect(fresh.history).toEqual([]);
  expect(fresh.board).not.toEqual(original.board);
  expect(fresh.createdAt).toBeGreaterThan(original.createdAt);
});

test("all eliminated cards can be restored and reset can be undone", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  for (const card of await page.locator("[data-object]").all())
    await card.click();
  await expect(page.locator("#remaining")).toHaveText("0 / 23");
  await expect(page.locator("#board-message")).toContainText("Plus d’objets");
  await page.getByRole("button", { name: "Rétablir tous les objets" }).click();
  await page.getByRole("button", { name: "Tout rétablir" }).click();
  await expect(page.locator("#remaining")).toHaveText("23 / 23");
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.locator("#remaining")).toHaveText("0 / 23");
});

test("the last object left is named in a « C’est… ? » question", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  for (const card of await page
    .locator('[data-object]:not([data-object="ciseaux"])')
    .all())
    await card.click();
  await expect(page.locator("#remaining")).toHaveText("1 / 23");
  await expect(page.locator("#board-message")).toContainText(
    "« Ce sont les ciseaux ? »",
  );
  await page.locator('[data-object="velo"]').click();
  await expect(page.locator("#board-message")).toContainText("C’est… ?");
});

test("the secret hides automatically, on app switching and when opening rules", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Voir ma carte", exact: true })
    .click();
  await page.clock.fastForward(12001);
  await expect(page.locator(".secret-front")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Voir ma carte", exact: true })
    .click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator(".secret-front")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Voir ma carte", exact: true })
    .click();
  await page.getByRole("button", { name: "Les règles" }).click();
  await expect(page.locator(".secret-front")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Comment jouer ?" }),
  ).toBeVisible();
});

test("missing storage and corrupt saves do not prevent a new game", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{bad save"),
    STORAGE_KEY,
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Continuer", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await expect(page.locator("[data-object]")).toHaveCount(23);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await page.reload();
  await expect(page.locator(".storage-warning")).toBeVisible();
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  await page.locator("[data-object]").first().click();
  await expect(page.locator("#remaining")).toHaveText("22 / 23");
  await expect(page.locator("#saved-status")).toContainText(
    "Sauvegarde indisponible",
  );
});

test("portrait, landscape and phone layouts load artwork without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nouvelle partie", exact: true })
    .click();
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
      smallestCard: Math.min(
        ...[...document.querySelectorAll("[data-object]")].map(
          (card) => card.getBoundingClientRect().width,
        ),
      ),
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
    expect(sizes.smallestCard).toBeGreaterThanOrEqual(44);
    await expect(page.locator('[data-action="secret"]').last()).toBeVisible();
  }
  const image = await page.evaluate(async () => {
    const element = document.querySelector(".object-art");
    const source = getComputedStyle(element).backgroundImage.slice(5, -2);
    const img = new Image();
    img.src = source;
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight };
  });
  expect(image).toEqual({ width: 1536, height: 1024 });
});
