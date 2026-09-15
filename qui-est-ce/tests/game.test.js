import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEM_IDS, ITEMS, questionFor } from "../src/items.js";
import {
  newGame,
  toggleItem,
  undo,
  resetBoard,
  parseGame,
  saveGame,
  readGame,
} from "../src/game.js";

test("each deal contains all 23 objects once and independently draws the secret", () => {
  const calls = [];
  const game = newGame((length) => {
    calls.push(length);
    return 0;
  });
  assert.deepEqual([...game.board].sort(), [...ITEM_IDS].sort());
  assert.equal(game.secretId, ITEM_IDS[0]);
  assert.notEqual(game.board[0], game.secretId);
  assert.equal(calls.at(-1), 23);
  assert.equal(calls.length, 23);
  assert.deepEqual(game.eliminated, []);
});

test("a series of deals changes the order and keeps every item eligible as the secret", () => {
  const orders = new Set();
  const secrets = new Set();
  for (let index = 0; index < 23; index += 1) {
    const game = newGame((length) => index % length);
    orders.add(game.board.join(","));
    secrets.add(game.secretId);
  }
  assert.ok(orders.size > 20);
  assert.equal(secrets.size, 23);
});

test("crossing out, restoring and undoing never change the secret or board order", () => {
  const initial = newGame();
  const id = initial.board[0];
  const crossed = toggleItem(initial, id);
  assert.deepEqual(initial.eliminated, []);
  assert.deepEqual(crossed.eliminated, [id]);
  const restored = toggleItem(crossed, id);
  assert.deepEqual(restored.eliminated, []);
  const undone = undo(restored);
  assert.deepEqual(undone.eliminated, [id]);
  assert.equal(undone.secretId, initial.secretId);
  assert.deepEqual(undone.board, initial.board);
  assert.deepEqual(undo(undone).eliminated, []);
});

test("resetting a full board can be undone without losing the original secret", () => {
  let game = newGame();
  for (const id of ITEM_IDS) game = toggleItem(game, id);
  const reset = resetBoard(game);
  assert.deepEqual(reset.eliminated, []);
  assert.equal(reset.secretId, game.secretId);
  assert.deepEqual(reset.board, game.board);
  assert.deepEqual(undo(reset).eliminated, game.eliminated);
  assert.equal(undo(undo(reset)).eliminated.length, 22);
});

test("saved state round-trips with order, secret, eliminated cards and undo history intact", () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
  };
  const game = toggleItem(newGame(), ITEM_IDS[0]);
  assert.equal(saveGame(game, storage), true);
  assert.deepEqual(readGame(storage), { game, available: true });
});

test("corrupt and outdated saves fail safely instead of breaking the menu", () => {
  const valid = newGame();
  const cases = [
    null,
    "",
    "{broken",
    "null",
    "{}",
    "[]",
    JSON.stringify({ ...valid, version: 2 }),
    JSON.stringify({ ...valid, secretId: "unknown" }),
    JSON.stringify({
      ...valid,
      board: [...valid.board.slice(1), valid.board[1]],
    }),
    JSON.stringify({ ...valid, eliminated: ["unknown"] }),
    JSON.stringify({ ...valid, history: [null] }),
    JSON.stringify({
      ...valid,
      history: [{ type: "reset", eliminated: ["unknown"] }],
    }),
  ];
  for (const value of cases) assert.equal(parseGame(value), null);
});

test("blocked browser storage leaves the game playable", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  assert.deepEqual(readGame(storage), { game: null, available: false });
  assert.equal(saveGame(newGame(), storage), false);
});

test("French guess questions agree with singular and plural object names", () => {
  assert.equal(
    questionFor(ITEMS.find(({ id }) => id === "ciseaux")),
    "Ce sont les ciseaux ?",
  );
  assert.equal(
    questionFor(ITEMS.find(({ id }) => id === "ordinateur")),
    "C’est l’ordinateur ?",
  );
});
