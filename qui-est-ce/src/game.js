import { ITEM_IDS } from "./items.js";

export const STORAGE_KEY = "qui-est-ce:game:v1";
const knownIds = new Set(ITEM_IDS);

// Rejection sampling keeps each draw equally likely, including a secret card.
export function randomIndex(length) {
  if (!Number.isInteger(length) || length < 1 || length > 2 ** 32) {
    throw new RangeError("Invalid random range");
  }
  const value = new Uint32Array(1);
  const limit = Math.floor(2 ** 32 / length) * length;
  do {
    globalThis.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % length;
}

export function shuffle(items, draw = randomIndex) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = draw(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function newGame(draw = randomIndex) {
  return {
    version: 1,
    board: shuffle(ITEM_IDS, draw),
    secretId: ITEM_IDS[draw(ITEM_IDS.length)],
    eliminated: [],
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function toggleItem(game, id) {
  if (!knownIds.has(id)) return game;
  return {
    ...game,
    eliminated: game.eliminated.includes(id)
      ? game.eliminated.filter((item) => item !== id)
      : [...game.eliminated, id],
    history: [...game.history, { type: "toggle", id }].slice(-100),
    updatedAt: Date.now(),
  };
}

export function undo(game) {
  const previous = game.history.at(-1);
  if (!previous) return game;
  const eliminated =
    previous.type === "reset"
      ? [...previous.eliminated]
      : game.eliminated.includes(previous.id)
        ? game.eliminated.filter((id) => id !== previous.id)
        : [...game.eliminated, previous.id];
  return {
    ...game,
    eliminated,
    history: game.history.slice(0, -1),
    updatedAt: Date.now(),
  };
}

export function resetBoard(game) {
  if (!game.eliminated.length) return game;
  return {
    ...game,
    eliminated: [],
    history: [
      ...game.history,
      { type: "reset", eliminated: [...game.eliminated] },
    ].slice(-100),
    updatedAt: Date.now(),
  };
}

function validIdList(value) {
  return (
    Array.isArray(value) &&
    value.length <= ITEM_IDS.length &&
    value.every((id) => knownIds.has(id)) &&
    new Set(value).size === value.length
  );
}

export function parseGame(raw) {
  try {
    const data = JSON.parse(raw);
    if (
      !data ||
      data.version !== 1 ||
      !validIdList(data.board) ||
      data.board.length !== ITEM_IDS.length ||
      !knownIds.has(data.secretId) ||
      !validIdList(data.eliminated) ||
      !Number.isFinite(data.createdAt) ||
      !Number.isFinite(data.updatedAt) ||
      !Array.isArray(data.history) ||
      data.history.length > 100 ||
      !data.history.every(
        (entry) =>
          entry &&
          ((entry.type === "toggle" && knownIds.has(entry.id)) ||
            (entry.type === "reset" && validIdList(entry.eliminated))),
      )
    )
      return null;
    return {
      version: 1,
      board: [...data.board],
      secretId: data.secretId,
      eliminated: [...data.eliminated],
      history: data.history.map((entry) =>
        entry.type === "toggle"
          ? { type: "toggle", id: entry.id }
          : { type: "reset", eliminated: [...entry.eliminated] },
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}

export function readGame(storage) {
  try {
    return { game: parseGame(storage.getItem(STORAGE_KEY)), available: true };
  } catch {
    return { game: null, available: false };
  }
}

export function saveGame(game, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}
