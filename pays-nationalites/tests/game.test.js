import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import {
  COUNTRIES,
  COUNTRIES_BY_SIDE,
  SIDES,
  feminineEnding,
  withArticle,
} from "../src/countries.js";
import { CONTINENTS, ELSEWHERE, ENGLISH, SPANISH } from "../src/foreign.js";
import {
  COUNTRY_IDS,
  DEFAULT_DURATION,
  DURATIONS,
  ROUND_SECONDS,
  applyGuess,
  canGrow,
  explainMiss,
  finishRound,
  matchAnswer,
  newRound,
  normalizeAnswer,
  readBest,
  readDuration,
  saveBest,
  saveDuration,
  startRound,
  tickRound,
} from "../src/game.js";
import { EUROPE, WORLD } from "../src/map-data.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    data,
  };
}

const brokenStorage = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};

describe("country data", () => {
  it("has 24 countries with unique ids and codes, six around each side of the map", () => {
    assert.equal(COUNTRIES.length, 24);
    assert.equal(new Set(COUNTRY_IDS).size, 24);
    assert.equal(new Set(COUNTRIES.map((c) => c.code)).size, 24);
    for (const side of SIDES) assert.equal(COUNTRIES_BY_SIDE[side].length, 6, side);
  });

  it("writes every country with its article", () => {
    for (const country of COUNTRIES) {
      assert.match(country.article, /^(le|la|les|l’)$/, country.id);
      assert.equal(country.articleName, withArticle(country.article, country.name));
    }
    assert.equal(withArticle("l’", "Espagne"), "l’Espagne");
    assert.equal(withArticle("les", "Pays-Bas"), "les Pays-Bas");
  });

  it("uses l’ exactly before a vowel sound", () => {
    for (const country of COUNTRIES) {
      const vowel = /^[AEÉIOU]/.test(country.name);
      assert.equal(country.article === "l’", vowel && country.article !== "les", country.id);
    }
  });

  it("ships a flag and map geometry for every country", () => {
    for (const country of COUNTRIES) {
      assert.ok(existsSync(new URL(`../public/flags/${country.code}.svg`, import.meta.url)), country.code);
      assert.ok(WORLD.countries[country.code], `world shape ${country.code}`);
      assert.ok(WORLD.anchors[country.code], `world anchor ${country.code}`);
      const labelled = [WORLD.labels[country.code], EUROPE.labels[country.code]].filter(Boolean);
      assert.equal(labelled.length, 1, `${country.code} is named on exactly one map`);
      if (EUROPE.labels[country.code]) assert.ok(EUROPE.countries[country.code], `zoom shape ${country.code}`);
    }
  });

  it("draws each country whole, around its label anchor", () => {
    // Natural Earth gives one code to several shapes (Australia and the
    // Ashmore Islands): a lost shape would leave the country unpainted.
    const bounds = (d) => {
      let x = 0;
      let y = 0;
      let start = [0, 0];
      const box = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [, command, args] of d.matchAll(/([mlz])([^mlz]*)/g)) {
        if (command === "z") {
          [x, y] = start;
          continue;
        }
        const n = args.match(/-?\d*\.?\d+/g).map(Number);
        for (let i = 0; i < n.length; i += 2) {
          x += n[i];
          y += n[i + 1];
          if (command === "m" && i === 0) start = [x, y];
          box[0] = Math.min(box[0], x);
          box[1] = Math.min(box[1], y);
          box[2] = Math.max(box[2], x);
          box[3] = Math.max(box[3], y);
        }
      }
      return box;
    };
    for (const country of COUNTRIES) {
      const [x0, y0, x1, y1] = bounds(WORLD.countries[country.code]);
      const [ax, ay] = WORLD.anchors[country.code];
      assert.ok(ax >= x0 && ax <= x1 && ay >= y0 && ay <= y1, `${country.code} anchor inside its shape`);
    }
    const [x0, , x1] = bounds(WORLD.countries.au);
    assert.ok(x1 - x0 > 60, "Australia keeps its mainland");
  });

  it("splits the feminine ending from the masculine", () => {
    assert.deepEqual(feminineEnding("français", "française"), ["français", "e"]);
    assert.deepEqual(feminineEnding("grec", "grecque"), ["grec", "que"]);
    assert.deepEqual(feminineEnding("canadien", "canadienne"), ["canadien", "ne"]);
    assert.deepEqual(feminineEnding("belge", "belge"), ["belge", ""]);
  });
});

describe("normalizeAnswer", () => {
  it("ignores case, accents, apostrophes and punctuation", () => {
    assert.equal(normalizeAnswer("  L’Algérie! "), "l algerie");
    assert.equal(normalizeAnswer("États-Unis"), "etats unis");
    assert.equal(normalizeAnswer("française"), "francaise");
    assert.equal(normalizeAnswer("Côte d'Ivoire"), "cote d ivoire");
  });
});

describe("matchAnswer", () => {
  it("accepts every country with or without its article, and both nationalities", () => {
    for (const country of COUNTRIES) {
      assert.equal(matchAnswer(country.articleName)?.id, country.id, country.articleName);
      assert.equal(matchAnswer(country.name)?.id, country.id, country.name);
      assert.equal(matchAnswer(country.nationalityM)?.id, country.id, country.nationalityM);
      assert.equal(matchAnswer(country.nationalityF)?.id, country.id, country.nationalityF);
      assert.equal(matchAnswer(country.articleName.toUpperCase())?.id, country.id);
    }
  });

  it("returns the kind of answer", () => {
    assert.deepEqual(matchAnswer("la France"), { id: "france", kind: "country" });
    assert.deepEqual(matchAnswer("France"), { id: "france", kind: "country" });
    assert.deepEqual(matchAnswer("française"), { id: "france", kind: "nationality" });
    assert.deepEqual(matchAnswer("grecque"), { id: "grece", kind: "nationality" });
    assert.deepEqual(matchAnswer("belge"), { id: "belgique", kind: "nationality" });
    assert.deepEqual(matchAnswer("anglais"), { id: "royaume-uni", kind: "nationality" });
  });

  it("accepts the spellings a keyboard without accents or apostrophes produces", () => {
    assert.equal(matchAnswer("lEspagne")?.id, "espagne");
    assert.equal(matchAnswer("l espagne")?.id, "espagne");
    assert.equal(matchAnswer("cote divoire")?.id, "cote-divoire");
    assert.equal(matchAnswer("Côte d’Ivoire")?.id, "cote-divoire");
    assert.equal(matchAnswer("les etats unis")?.id, "etats-unis");
    assert.equal(matchAnswer("NEERLANDAISE")?.id, "pays-bas");
  });

  it("recognises everyday names: Angleterre, Hollande, USA", () => {
    assert.equal(matchAnswer("l’Angleterre")?.id, "royaume-uni");
    assert.equal(matchAnswer("hollandais")?.id, "pays-bas");
    assert.equal(matchAnswer("la Hollande")?.id, "pays-bas");
    assert.equal(matchAnswer("usa")?.id, "etats-unis");
  });

  it("finds the country behind a wrong article and says which one is right", () => {
    assert.deepEqual(matchAnswer("le France"), {
      id: "france",
      kind: "country",
      wrongArticle: true,
      expectedArticle: "la",
      said: "le",
    });
    assert.equal(matchAnswer("la Japon")?.expectedArticle, "le");
    assert.equal(matchAnswer("la Espagne")?.expectedArticle, "l’");
    assert.equal(matchAnswer("le Pays-Bas")?.expectedArticle, "les");
    assert.equal(matchAnswer("l’Mexique")?.expectedArticle, "le");
    assert.equal(matchAnswer("la France")?.wrongArticle, undefined);
  });

  it("remembers the article that was typed, even glued to the name", () => {
    assert.equal(matchAnswer("lmexique")?.said, "l’");
    assert.equal(matchAnswer("l´japon")?.said, "l’");
    assert.equal(matchAnswer("le-chine")?.said, "le");
  });

  it("treats a Spanish article as a wrong article", () => {
    assert.deepEqual(matchAnswer("el Japón"), {
      id: "japon",
      kind: "country",
      wrongArticle: true,
      expectedArticle: "le",
      said: "el",
    });
    assert.equal(matchAnswer("los États-Unis")?.id, "etats-unis");
    assert.equal(matchAnswer("los USA")?.said, "los");
    assert.equal(matchAnswer("el Hollande")?.id, "pays-bas");
  });

  it("accepts everyday names with any article", () => {
    assert.deepEqual(matchAnswer("les USA"), { id: "etats-unis", kind: "country" });
    assert.equal(matchAnswer("le Hollande")?.id, "pays-bas");
    assert.equal(matchAnswer("la Angleterre")?.wrongArticle, undefined);
    assert.deepEqual(matchAnswer("états-unienne"), { id: "etats-unis", kind: "nationality" });
  });

  it("rejects what is not in the list", () => {
    assert.equal(matchAnswer("xyzzy"), null);
    assert.equal(matchAnswer(""), null);
    assert.equal(matchAnswer("   "), null);
    assert.equal(matchAnswer("Russie"), null);
  });
});

describe("canGrow", () => {
  it("waits when a longer answer starts with what was typed", () => {
    assert.equal(canGrow("japonais"), true); // → japonaise
    assert.equal(canGrow("japon"), true); // → japonais
    assert.equal(canGrow("argentin"), true); // → argentine
    assert.equal(canGrow("français"), true);
  });

  it("accepts at once when nothing longer can follow", () => {
    assert.equal(canGrow("française"), false);
    assert.equal(canGrow("la France"), false);
    assert.equal(canGrow("belge"), false);
    assert.equal(canGrow("le Japon"), false);
    assert.equal(canGrow(""), false);
  });
});

describe("explainMiss", () => {
  it("spots Spanish and English words", () => {
    assert.deepEqual(explainMiss("Alemania"), { reason: "spanish" });
    assert.deepEqual(explainMiss("japonés"), { reason: "spanish" });
    assert.deepEqual(explainMiss("Germany"), { reason: "english" });
    assert.deepEqual(explainMiss("Spanish"), { reason: "english" });
  });

  it("tells a continent from a country", () => {
    assert.deepEqual(explainMiss("européenne"), { reason: "continent" });
    assert.deepEqual(explainMiss("les Africains"), { reason: "continent" });
  });

  it("removes a foreign article and a plural before naming the language", () => {
    assert.deepEqual(explainMiss("los franceses"), { reason: "spanish" });
    assert.deepEqual(explainMiss("las francesas"), { reason: "spanish" });
    assert.deepEqual(explainMiss("la Alemania"), { reason: "spanish" });
    assert.deepEqual(explainMiss("el Brasil"), { reason: "spanish" });
    assert.deepEqual(explainMiss("los Estados Unidos"), { reason: "spanish" });
    assert.deepEqual(explainMiss("the Netherlands"), { reason: "english" });
  });

  it("recognises a nationality written with an article or in the plural", () => {
    assert.deepEqual(explainMiss("les Suisses"), { reason: "nationality-form", id: "suisse" });
    assert.deepEqual(explainMiss("argentines"), { reason: "nationality-form", id: "argentine" });
    assert.deepEqual(explainMiss("une Française"), { reason: "nationality-form", id: "france" });
    assert.deepEqual(explainMiss("les Français"), { reason: "nationality-form", id: "france" });
    assert.deepEqual(explainMiss("italiens"), { reason: "nationality-form", id: "italie" });
    assert.deepEqual(explainMiss("la japonaise"), { reason: "nationality-form", id: "japon" });
  });

  it("knows correct French for countries that are not on the map", () => {
    assert.deepEqual(explainMiss("iranienne"), { reason: "elsewhere" });
    assert.deepEqual(explainMiss("la Russie"), { reason: "elsewhere" });
    assert.deepEqual(explainMiss("angolaise"), { reason: "elsewhere" });
  });

  it("calls a one-letter slip a spelling mistake", () => {
    assert.deepEqual(explainMiss("alemand"), { reason: "spelling" });
    assert.deepEqual(explainMiss("canadiene"), { reason: "spelling" });
    assert.deepEqual(explainMiss("brezil"), { reason: "spelling" });
  });

  it("does not guess on short or unrelated words", () => {
    assert.deepEqual(explainMiss("xyzzy"), { reason: "unknown" });
    assert.deepEqual(explainMiss("uk2"), { reason: "unknown" });
    assert.deepEqual(explainMiss(""), { reason: "empty" });
  });

  it("never lists an answer as a foreign word or as a country off the map", () => {
    for (const word of [...SPANISH, ...ENGLISH, ...ELSEWHERE, ...CONTINENTS]) {
      assert.equal(matchAnswer(word), null, word);
    }
  });
});

describe("round flow", () => {
  it("lasts one, two or three minutes", () => {
    assert.deepEqual(DURATIONS, [60, 120, 180]);
    assert.equal(ROUND_SECONDS, 60);
    assert.equal(newRound().duration, DEFAULT_DURATION);
    assert.equal(newRound(180).secondsLeft, 180);
    assert.equal(newRound(45).duration, DEFAULT_DURATION);
  });

  it("counts down from the chosen duration and stops at zero", () => {
    let round = startRound(newRound(120), 1_000);
    assert.equal(round.status, "running");
    round = tickRound(round, 1_000 + 30_500);
    assert.equal(round.secondsLeft, 90);
    round = tickRound(round, 1_000 + 120_000);
    assert.equal(round.status, "finished");
    assert.equal(round.secondsLeft, 0);
  });

  it("scores each country once, whichever form finds it", () => {
    let round = startRound(newRound(), 1_000);
    let result = applyGuess(round, "français");
    assert.equal(result.result, "hit");
    assert.equal(result.kind, "nationality");
    round = result.round;
    assert.deepEqual(round.found, ["france"]);

    result = applyGuess(round, "la France");
    assert.equal(result.result, "duplicate");
    assert.equal(result.country.id, "france");

    result = applyGuess(round, "le Japon");
    assert.equal(result.result, "hit");
    round = result.round;
    assert.deepEqual(round.found, ["france", "japon"]);

    result = applyGuess(round, "Alemania");
    assert.equal(result.result, "miss");
    assert.equal(result.reason, "spanish");
  });

  it("reports a corrected article on a hit, and on a duplicate", () => {
    let round = startRound(newRound(), 1_000);
    let result = applyGuess(round, "le Belgique");
    assert.equal(result.result, "hit");
    assert.equal(result.wrongArticle, true);
    assert.equal(result.expectedArticle, "la");
    assert.equal(result.typedArticle, "le");
    round = result.round;
    result = applyGuess(round, "les Belgique");
    assert.equal(result.result, "duplicate");
    assert.equal(result.typedArticle, "les");
  });

  it("counts a nationality written in the plural and flags the form", () => {
    const round = startRound(newRound(), 1_000);
    const result = applyGuess(round, "les Français");
    assert.equal(result.result, "hit");
    assert.equal(result.country.id, "france");
    assert.equal(result.nationalityForm, true);
    assert.equal(applyGuess(round, "française").nationalityForm, false);
  });

  it("finishes early when every country is found", () => {
    let round = startRound(newRound(), 1_000);
    for (const country of COUNTRIES) round = applyGuess(round, country.nationalityF).round;
    assert.equal(round.found.length, COUNTRY_IDS.length);
    assert.equal(round.status, "finished");
  });

  it("ignores answers once the round is over", () => {
    const round = finishRound(startRound(newRound(), 1_000), 2_000);
    assert.equal(round.status, "finished");
    assert.equal(applyGuess(round, "France").result, "idle");
    assert.equal(applyGuess(newRound(), "France").result, "idle");
  });
});

describe("records and settings", () => {
  it("keeps one record per duration", () => {
    const storage = memoryStorage();
    assert.deepEqual(readBest(storage, 60), { best: 0, available: true });
    assert.deepEqual(saveBest(7, storage, 60), { best: 7, available: true, isRecord: true });
    assert.deepEqual(saveBest(5, storage, 60), { best: 7, available: true, isRecord: false });
    assert.equal(readBest(storage, 120).best, 0);
    saveBest(12, storage, 120);
    assert.equal(readBest(storage, 120).best, 12);
    assert.equal(readBest(storage, 60).best, 7);
  });

  it("carries over the one-minute record from the first version", () => {
    const storage = memoryStorage({ "pays-nationalites:best:v1": "9" });
    assert.equal(readBest(storage, 60).best, 9);
    assert.equal(readBest(storage, 180).best, 0);
  });

  it("ignores corrupt values and survives blocked storage", () => {
    assert.equal(readBest(memoryStorage({ "pays-nationalites:best:v2:60": "99" }), 60).best, 0);
    assert.equal(readBest(memoryStorage({ "pays-nationalites:best:v2:60": "abc" }), 60).best, 0);
    assert.deepEqual(readBest(brokenStorage), { best: 0, available: false });
    assert.equal(saveBest(4, brokenStorage).available, false);
    assert.equal(readDuration(brokenStorage), DEFAULT_DURATION);
    assert.doesNotThrow(() => saveDuration(120, brokenStorage));
  });

  it("remembers the chosen duration", () => {
    const storage = memoryStorage();
    assert.equal(readDuration(storage), 60);
    saveDuration(180, storage);
    assert.equal(readDuration(storage), 180);
    storage.setItem("pays-nationalites:duration:v1", "999");
    assert.equal(readDuration(storage), 60);
  });
});
