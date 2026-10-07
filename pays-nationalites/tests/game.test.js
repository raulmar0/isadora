import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeAnswer,
  matchAnswer,
  newRound,
  startRound,
  tickRound,
  applyGuess,
  finishRound,
  ROUND_SECONDS,
  COUNTRY_IDS,
} from "../src/game.js";

describe("normalizeAnswer", () => {
  it("strips accents, articles noise and punctuation", () => {
    assert.equal(normalizeAnswer("  L’Algérie! "), "l algerie");
    assert.equal(normalizeAnswer("États-Unis"), "etats unis");
    assert.equal(normalizeAnswer("française"), "francaise");
  });
});

describe("matchAnswer", () => {
  it("accepts country names with or without articles", () => {
    assert.deepEqual(matchAnswer("France"), { id: "france", kind: "country" });
    assert.deepEqual(matchAnswer("la France"), { id: "france", kind: "country" });
    assert.deepEqual(matchAnswer("les États-Unis"), {
      id: "etats-unis",
      kind: "country",
    });
    assert.deepEqual(matchAnswer("Côte d'Ivoire"), {
      id: "cote-divoire",
      kind: "country",
    });
  });

  it("accepts masculine or feminine nationality and maps to the same country", () => {
    assert.deepEqual(matchAnswer("français"), {
      id: "france",
      kind: "nationality",
    });
    assert.deepEqual(matchAnswer("française"), {
      id: "france",
      kind: "nationality",
    });
    assert.deepEqual(matchAnswer("grecque"), {
      id: "grece",
      kind: "nationality",
    });
    assert.deepEqual(matchAnswer("belge"), {
      id: "belgique",
      kind: "nationality",
    });
  });

  it("rejects unknown answers", () => {
    assert.equal(matchAnswer("xyzzy"), null);
    assert.equal(matchAnswer(""), null);
  });
});

describe("round flow", () => {
  it("starts a timed round and scores unique hits", () => {
    let round = startRound(newRound(), 1_000);
    assert.equal(round.status, "running");
    assert.equal(round.secondsLeft, ROUND_SECONDS);

    let result = applyGuess(round, "français");
    assert.equal(result.result, "hit");
    assert.equal(result.kind, "nationality");
    round = result.round;
    assert.deepEqual(round.found, ["france"]);

    result = applyGuess(round, "française");
    assert.equal(result.result, "duplicate");
    round = result.round;

    result = applyGuess(round, "le Japon");
    assert.equal(result.result, "hit");
    round = result.round;
    assert.deepEqual(round.found, ["france", "japon"]);

    result = applyGuess(round, "blorp");
    assert.equal(result.result, "miss");
  });

  it("finishes when time runs out", () => {
    let round = startRound(newRound(), 1_000);
    round = tickRound(round, 1_000 + ROUND_SECONDS * 1000);
    assert.equal(round.status, "finished");
    assert.equal(round.secondsLeft, 0);
  });

  it("finishes early when every country is found", () => {
    let round = startRound(newRound(), 1_000);
    for (const id of COUNTRY_IDS) {
      const countryGuess =
        id === "france"
          ? "France"
          : id === "japon"
            ? "Japon"
            : null;
      // Drive via nationalityM from a direct re-import would be heavy; use finishRound path.
      void countryGuess;
    }
    // Apply guesses for all by matching article names through applyGuess on known set.
    const answers = [
      "France",
      "Belgique",
      "Suisse",
      "Canada",
      "Sénégal",
      "Maroc",
      "Algérie",
      "Tunisie",
      "Côte d'Ivoire",
      "Espagne",
      "Italie",
      "Allemagne",
      "Portugal",
      "Royaume-Uni",
      "États-Unis",
      "Mexique",
      "Brésil",
      "Argentine",
      "Japon",
      "Chine",
      "Inde",
      "Australie",
      "Grèce",
      "Pays-Bas",
    ];
    for (const answer of answers) {
      round = applyGuess(round, answer).round;
    }
    assert.equal(round.found.length, COUNTRY_IDS.length);
    assert.equal(round.status, "finished");
  });

  it("finishRound stops the clock", () => {
    let round = startRound(newRound(), 1_000);
    round = finishRound(round, 2_000);
    assert.equal(round.status, "finished");
    assert.equal(applyGuess(round, "France").result, "idle");
  });
});
