import { COUNTRIES, COUNTRY_IDS, COUNTRY_BY_ID } from "./countries.js";
import { CONTINENTS, ELSEWHERE, ENGLISH, SPANISH } from "./foreign.js";

export const DURATIONS = [60, 120, 180];
export const DEFAULT_DURATION = 60;
export const ROUND_SECONDS = DEFAULT_DURATION;

const BEST_PREFIX = "pays-nationalites:best:v2:";
const LEGACY_BEST_KEY = "pays-nationalites:best:v1";
const DURATION_KEY = "pays-nationalites:duration:v1";

/** Lowercase, strip accents and punctuation, collapse spaces: classroom keyboards rarely have é or ç. */
export function normalizeAnswer(value) {
  return String(value ?? "")
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const ARTICLES = ["le", "la", "l", "les"];
// Spanish speakers often slip their own article in: « el Japón ».
const SLIPPED_ARTICLES = [...ARTICLES, "el", "los", "las"];
const LEADING_ARTICLE = /^(?:le|la|les|l|un|une|des|el|los|las|the) /;
const FRENCH_DETERMINERS = ["le", "la", "les", "l", "un", "une", "des"];

/** How a typed article is written back to the student: "l" → "l’". */
function shownArticle(article) {
  return article === "l" ? "l’" : article;
}

/** "l espagne" is also typed "lespagne", "cote d ivoire" as "cote divoire". */
function spellings(text) {
  const key = normalizeAnswer(text);
  if (!key) return [];
  const glued = key.replace(/\b([ld]) /g, "$1");
  return glued === key ? [key] : [key, glued];
}

function buildIndex() {
  const index = new Map();
  const remember = (text, entry) => {
    for (const key of spellings(text)) {
      // The first entry to claim a spelling keeps it.
      if (!index.has(key)) index.set(key, entry);
    }
  };

  for (const country of COUNTRIES) {
    const asCountry = { id: country.id, kind: "country" };
    remember(country.articleName, asCountry);
    remember(country.name, asCountry);
    for (const alias of country.aliases) {
      // Everyday names carry their own article (l’Angleterre, les USA), so
      // any French article in front of them is accepted as it is.
      const bare = normalizeAnswer(alias).replace(LEADING_ARTICLE, "");
      remember(bare, asCountry);
      for (const article of ARTICLES) remember(`${article} ${bare}`, asCountry);
    }
    const asNationality = { id: country.id, kind: "nationality" };
    remember(country.nationalityM, asNationality);
    remember(country.nationalityF, asNationality);
    for (const alias of country.nationalityAliases) remember(alias, asNationality);
  }

  // A wrong article still finds the country, and the game corrects it.
  for (const country of COUNTRIES) {
    const right = normalizeAnswer(country.article);
    const names = [
      country.name,
      ...country.aliases.map((alias) => normalizeAnswer(alias).replace(LEADING_ARTICLE, "")),
    ];
    for (const [article, name] of SLIPPED_ARTICLES.flatMap((a) => names.map((n) => [a, n]))) {
      if (article === right) continue;
      for (const key of spellings(`${article} ${name}`)) {
        if (index.has(key)) continue;
        index.set(key, {
          id: country.id,
          kind: "country",
          wrongArticle: true,
          expectedArticle: country.article,
          said: shownArticle(article),
        });
      }
    }
  }
  return index;
}

const ANSWERS = buildIndex();
const ANSWER_KEYS = [...ANSWERS.keys()];

/** Every nationality spelling, apart from the country names it shares (suisse, argentine). */
const NATIONALITIES = new Map();
for (const country of COUNTRIES) {
  for (const word of [country.nationalityM, country.nationalityF, ...country.nationalityAliases]) {
    for (const key of spellings(word)) NATIONALITIES.set(key, country.id);
  }
}

const SPANISH_KEYS = new Set(SPANISH.map(normalizeAnswer));
const ENGLISH_KEYS = new Set(ENGLISH.map(normalizeAnswer));
const ELSEWHERE_KEYS = new Set(ELSEWHERE.map(normalizeAnswer));
const CONTINENT_KEYS = new Set(CONTINENTS.map(normalizeAnswer));

export function matchAnswer(raw) {
  const key = normalizeAnswer(raw);
  if (!key) return null;
  const match = ANSWERS.get(key);
  if (!match) return null;
  if (match.wrongArticle) {
    return {
      id: match.id,
      kind: "country",
      wrongArticle: true,
      expectedArticle: match.expectedArticle,
      said: match.said,
    };
  }
  return { id: match.id, kind: match.kind };
}

/**
 * True when the text is itself an answer but also the start of a longer one:
 * "français" may be on its way to "française", "japon" to "japonais". The
 * interface waits for a pause or Enter before accepting those.
 */
export function canGrow(raw) {
  const key = normalizeAnswer(raw);
  if (!key) return false;
  return ANSWER_KEYS.some((other) => other.length > key.length && other.startsWith(key));
}

function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

/** « les Français », « italiennes », « une Suisse »: a nationality with an article or in the plural. */
function nationalityForm(key) {
  const bare = key.replace(LEADING_ARTICLE, "");
  for (const candidate of [bare, bare.replace(/s$/, "")]) {
    if (candidate === key) continue;
    const id = NATIONALITIES.get(candidate);
    if (id) return id;
  }
  return null;
}

/** The forms to compare with a word list: as typed, without article, without a plural ending. */
function variants(key) {
  const bare = key.replace(LEADING_ARTICLE, "");
  return [key, bare, bare.replace(/s$/, ""), bare.replace(/es$/, "")];
}

/**
 * Why an answer did not count: another language, a country that is not on
 * the map, a slip of the keyboard, or simply not in the list. A nationality
 * written with an article or in the plural is recognised too; applyGuess
 * counts it and the interface shows the singular forms.
 */
export function explainMiss(raw) {
  const key = normalizeAnswer(raw);
  if (!key) return { reason: "empty" };
  const forms = variants(key);
  if (forms.some((form) => SPANISH_KEYS.has(form))) return { reason: "spanish" };
  if (forms.some((form) => ENGLISH_KEYS.has(form))) return { reason: "english" };
  const id = nationalityForm(key);
  if (id) return { reason: "nationality-form", id };
  if (forms.some((form) => CONTINENT_KEYS.has(form))) return { reason: "continent" };
  if (forms.some((form) => ELSEWHERE_KEYS.has(form))) return { reason: "elsewhere" };
  if (key.length >= 5) {
    const tolerance = key.length >= 9 ? 2 : 1;
    if (ANSWER_KEYS.some((answer) => !ANSWERS.get(answer).wrongArticle && distance(key, answer) <= tolerance)) {
      return { reason: "spelling" };
    }
  }
  return { reason: "unknown" };
}

export function newRound(duration = DEFAULT_DURATION) {
  const seconds = DURATIONS.includes(duration) ? duration : DEFAULT_DURATION;
  return {
    version: 2,
    duration: seconds,
    found: [],
    secondsLeft: seconds,
    status: "ready", // ready | running | finished
    startedAt: null,
    finishedAt: null,
  };
}

export function startRound(round, now = Date.now()) {
  if (round.status === "running") return round;
  return {
    ...round,
    status: "running",
    secondsLeft: round.duration,
    startedAt: now,
    finishedAt: null,
    found: [],
  };
}

export function tickRound(round, now = Date.now()) {
  if (round.status !== "running" || round.startedAt == null) return round;
  const elapsed = Math.floor((now - round.startedAt) / 1000);
  const secondsLeft = Math.max(0, round.duration - elapsed);
  if (secondsLeft === round.secondsLeft && secondsLeft > 0) return round;
  if (secondsLeft === 0) {
    return { ...round, secondsLeft: 0, status: "finished", finishedAt: now };
  }
  return { ...round, secondsLeft };
}

export function finishRound(round, now = Date.now()) {
  if (round.status === "finished") return round;
  return { ...round, status: "finished", finishedAt: now };
}

export function applyGuess(round, raw) {
  if (round.status !== "running") return { round, result: "idle" };
  let match = matchAnswer(raw);
  let form = false;
  if (!match) {
    const miss = explainMiss(raw);
    if (miss.reason !== "nationality-form") return { round, result: "miss", ...miss };
    // « les Français », « italiennes »: the nationality is known; it counts,
    // and the interface shows the singular forms.
    match = { id: miss.id, kind: "nationality" };
    form = true;
  }
  const country = COUNTRY_BY_ID[match.id];
  const details = {
    country,
    kind: match.kind,
    wrongArticle: Boolean(match.wrongArticle),
    expectedArticle: match.expectedArticle ?? null,
    typedArticle: match.said ?? null,
    nationalityForm: form,
  };
  if (round.found.includes(match.id)) {
    return { round, result: "duplicate", ...details };
  }
  const next = { ...round, found: [...round.found, match.id] };
  const complete = next.found.length >= COUNTRY_IDS.length;
  return { round: complete ? finishRound(next) : next, result: "hit", ...details };
}

export function scoreOf(round) {
  return round.found.length;
}

export function remainingOf(round) {
  return COUNTRY_IDS.length - round.found.length;
}

function validScore(raw) {
  if (raw == null) return 0;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= COUNTRY_IDS.length ? value : 0;
}

export function readBest(storage, duration = DEFAULT_DURATION) {
  try {
    let raw = storage.getItem(BEST_PREFIX + duration);
    // Scores from the first version were all one-minute rounds.
    if (raw == null && duration === 60) raw = storage.getItem(LEGACY_BEST_KEY);
    return { best: validScore(raw), available: true };
  } catch {
    return { best: 0, available: false };
  }
}

export function saveBest(score, storage, duration = DEFAULT_DURATION) {
  try {
    const { best } = readBest(storage, duration);
    const next = Math.max(best, score);
    storage.setItem(BEST_PREFIX + duration, String(next));
    return { best: next, available: true, isRecord: score > best };
  } catch {
    return { best: score, available: false, isRecord: false };
  }
}

export function readDuration(storage) {
  try {
    const value = Number(storage.getItem(DURATION_KEY));
    return DURATIONS.includes(value) ? value : DEFAULT_DURATION;
  } catch {
    return DEFAULT_DURATION;
  }
}

export function saveDuration(duration, storage) {
  try {
    storage.setItem(DURATION_KEY, String(duration));
  } catch {
    /* The choice simply is not remembered. */
  }
}

export { COUNTRY_IDS, COUNTRY_BY_ID, COUNTRIES };
