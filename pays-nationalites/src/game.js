import { COUNTRIES, COUNTRY_IDS, COUNTRY_BY_ID } from "./countries.js";

export const STORAGE_KEY = "pays-nationalites:best:v1";
export const ROUND_SECONDS = 60;

/** Lowercase, strip accents/punctuation, collapse spaces — for loose classroom typing. */
export function normalizeAnswer(value) {
  return String(value ?? "")
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’'`]/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildIndex() {
  const index = new Map();
  const remember = (raw, id, kind) => {
    const key = normalizeAnswer(raw);
    if (!key) return;
    const existing = index.get(key);
    // Prefer an exact prior entry; never let a later country steal a shared alias.
    if (existing && existing.id !== id) return;
    index.set(key, { id, kind });
  };

  for (const country of COUNTRIES) {
    // Country with its grammatical article
    remember(country.articleName, country.id, "country");
    // Country without article (bare name)
    remember(country.name, country.id, "country");
    // All aliases & colloquial variations
    for (const alias of country.aliases) {
      remember(alias, country.id, "country");
    }
    // Masculine & feminine nationalities
    remember(country.nationalityM, country.id, "nationality");
    remember(country.nationalityF, country.id, "nationality");
  }

  // Also index wrong-article variants for pedagogical guidance
  const wrongArticleMap = new Map();
  for (const country of COUNTRIES) {
    const wrongArticles = ["le", "la", "l", "les"].filter(
      (a) => a !== normalizeAnswer(country.article),
    );
    for (const wa of wrongArticles) {
      const wrongKey = `${wa} ${normalizeAnswer(country.name)}`;
      if (!index.has(wrongKey)) {
        wrongArticleMap.set(wrongKey, {
          id: country.id,
          expectedArticle: country.article,
        });
      }
    }
  }

  return { index, wrongArticleMap };
}

const { index: ANSWER_INDEX, wrongArticleMap: WRONG_ARTICLES } = buildIndex();

export function matchAnswer(raw) {
  const key = normalizeAnswer(raw);
  if (!key) return null;
  const match = ANSWER_INDEX.get(key);
  if (match) return match;

  // Check if student typed the country with the wrong article
  const wrong = WRONG_ARTICLES.get(key);
  if (wrong) {
    return {
      id: wrong.id,
      kind: "country",
      wrongArticle: true,
      expectedArticle: wrong.expectedArticle,
    };
  }

  return null;
}

export function newRound() {
  return {
    version: 1,
    found: [],
    secondsLeft: ROUND_SECONDS,
    status: "ready", // ready | running | finished
    startedAt: null,
    finishedAt: null,
    lastFoundId: null,
    lastFoundKind: null,
    lastWrongArticle: false,
  };
}

export function startRound(round, now = Date.now()) {
  if (round.status === "running") return round;
  return {
    ...round,
    status: "running",
    secondsLeft: ROUND_SECONDS,
    startedAt: now,
    finishedAt: null,
    found: [],
    lastFoundId: null,
    lastFoundKind: null,
    lastWrongArticle: false,
  };
}

export function tickRound(round, now = Date.now()) {
  if (round.status !== "running" || round.startedAt == null) return round;
  const elapsed = Math.floor((now - round.startedAt) / 1000);
  const secondsLeft = Math.max(0, ROUND_SECONDS - elapsed);
  if (secondsLeft === round.secondsLeft && secondsLeft > 0) return round;
  if (secondsLeft === 0) {
    return {
      ...round,
      secondsLeft: 0,
      status: "finished",
      finishedAt: round.finishedAt ?? now,
    };
  }
  return { ...round, secondsLeft };
}

export function finishRound(round, now = Date.now()) {
  if (round.status === "finished") return round;
  return {
    ...round,
    status: "finished",
    secondsLeft: 0,
    finishedAt: now,
  };
}

export function applyGuess(round, raw) {
  if (round.status !== "running") {
    return { round, result: "idle" };
  }
  const match = matchAnswer(raw);
  if (!match) {
    return { round, result: "miss" };
  }
  if (round.found.includes(match.id)) {
    return { round, result: "duplicate", country: COUNTRY_BY_ID[match.id] };
  }
  const next = {
    ...round,
    found: [...round.found, match.id],
    lastFoundId: match.id,
    lastFoundKind: match.kind,
    lastWrongArticle: Boolean(match.wrongArticle),
  };
  const complete = next.found.length >= COUNTRY_IDS.length;
  return {
    round: complete ? finishRound(next) : next,
    result: "hit",
    country: COUNTRY_BY_ID[match.id],
    kind: match.kind,
    wrongArticle: Boolean(match.wrongArticle),
    expectedArticle: match.expectedArticle ?? null,
  };
}

export function scoreOf(round) {
  return round.found.length;
}

export function remainingOf(round) {
  return COUNTRY_IDS.length - round.found.length;
}

export function readBest(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw == null) return { best: 0, available: true };
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0 || value > COUNTRY_IDS.length) {
      return { best: 0, available: true };
    }
    return { best: value, available: true };
  } catch {
    return { best: 0, available: false };
  }
}

export function saveBest(score, storage) {
  try {
    const { best } = readBest(storage);
    const next = Math.max(best, score);
    storage.setItem(STORAGE_KEY, String(next));
    return { best: next, available: true };
  } catch {
    return { best: score, available: false };
  }
}

export { COUNTRY_IDS, COUNTRY_BY_ID, COUNTRIES };
