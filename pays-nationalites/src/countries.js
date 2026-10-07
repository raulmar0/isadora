// The 24 countries of the round. `side` places the flag around the map
// (top, right, bottom, left); `continent` orders the flags when the screen is
// too narrow for that frame. `code` is the ISO 3166-1 alpha-2 code, used for
// the flag file and the map geometry.

const DATA = [
  // --- Top: northern Europe ---
  {
    id: "royaume-uni",
    code: "gb",
    article: "le",
    name: "Royaume-Uni",
    nationalityM: "britannique",
    nationalityF: "britannique",
    side: "top",
    continent: "europe",
    aliases: ["angleterre", "l angleterre", "grande bretagne", "la grande bretagne", "uk"],
    nationalityAliases: ["anglais", "anglaise"],
  },
  {
    id: "france",
    code: "fr",
    article: "la",
    name: "France",
    nationalityM: "français",
    nationalityF: "française",
    side: "top",
    continent: "europe",
    aliases: [],
  },
  {
    id: "belgique",
    code: "be",
    article: "la",
    name: "Belgique",
    nationalityM: "belge",
    nationalityF: "belge",
    side: "top",
    continent: "europe",
    aliases: [],
  },
  {
    id: "pays-bas",
    code: "nl",
    article: "les",
    name: "Pays-Bas",
    nationalityM: "néerlandais",
    nationalityF: "néerlandaise",
    side: "top",
    continent: "europe",
    aliases: ["hollande", "la hollande"],
    nationalityAliases: ["hollandais", "hollandaise"],
  },
  {
    id: "allemagne",
    code: "de",
    article: "l’",
    name: "Allemagne",
    nationalityM: "allemand",
    nationalityF: "allemande",
    side: "top",
    continent: "europe",
    aliases: [],
  },
  {
    id: "suisse",
    code: "ch",
    article: "la",
    name: "Suisse",
    nationalityM: "suisse",
    nationalityF: "suisse",
    side: "top",
    continent: "europe",
    aliases: [],
  },

  // --- Right: south-eastern Europe, Asia and Oceania ---
  {
    id: "italie",
    code: "it",
    article: "l’",
    name: "Italie",
    nationalityM: "italien",
    nationalityF: "italienne",
    side: "right",
    continent: "europe",
    aliases: [],
  },
  {
    id: "grece",
    code: "gr",
    article: "la",
    name: "Grèce",
    nationalityM: "grec",
    nationalityF: "grecque",
    side: "right",
    continent: "europe",
    aliases: [],
  },
  {
    id: "chine",
    code: "cn",
    article: "la",
    name: "Chine",
    nationalityM: "chinois",
    nationalityF: "chinoise",
    side: "right",
    continent: "asie",
    aliases: [],
  },
  {
    id: "japon",
    code: "jp",
    article: "le",
    name: "Japon",
    nationalityM: "japonais",
    nationalityF: "japonaise",
    side: "right",
    continent: "asie",
    aliases: [],
  },
  {
    id: "inde",
    code: "in",
    article: "l’",
    name: "Inde",
    nationalityM: "indien",
    nationalityF: "indienne",
    side: "right",
    continent: "asie",
    aliases: [],
  },
  {
    id: "australie",
    code: "au",
    article: "l’",
    name: "Australie",
    nationalityM: "australien",
    nationalityF: "australienne",
    side: "right",
    continent: "asie",
    aliases: [],
  },

  // --- Bottom: Portugal, Spain and Africa ---
  {
    id: "portugal",
    code: "pt",
    article: "le",
    name: "Portugal",
    nationalityM: "portugais",
    nationalityF: "portugaise",
    side: "bottom",
    continent: "europe",
    aliases: [],
  },
  {
    id: "espagne",
    code: "es",
    article: "l’",
    name: "Espagne",
    nationalityM: "espagnol",
    nationalityF: "espagnole",
    side: "bottom",
    continent: "europe",
    aliases: [],
  },
  {
    id: "maroc",
    code: "ma",
    article: "le",
    name: "Maroc",
    nationalityM: "marocain",
    nationalityF: "marocaine",
    side: "bottom",
    continent: "afrique",
    aliases: [],
  },
  {
    id: "senegal",
    code: "sn",
    article: "le",
    name: "Sénégal",
    nationalityM: "sénégalais",
    nationalityF: "sénégalaise",
    side: "bottom",
    continent: "afrique",
    aliases: [],
  },
  {
    id: "cote-divoire",
    code: "ci",
    article: "la",
    name: "Côte d’Ivoire",
    nationalityM: "ivoirien",
    nationalityF: "ivoirienne",
    side: "bottom",
    continent: "afrique",
    aliases: [],
  },
  {
    id: "algerie",
    code: "dz",
    article: "l’",
    name: "Algérie",
    nationalityM: "algérien",
    nationalityF: "algérienne",
    side: "bottom",
    continent: "afrique",
    aliases: [],
  },

  // --- Left: the Americas ---
  {
    id: "canada",
    code: "ca",
    article: "le",
    name: "Canada",
    nationalityM: "canadien",
    nationalityF: "canadienne",
    side: "left",
    continent: "amerique",
    aliases: [],
  },
  {
    id: "etats-unis",
    code: "us",
    article: "les",
    name: "États-Unis",
    nationalityM: "américain",
    nationalityF: "américaine",
    side: "left",
    continent: "amerique",
    aliases: ["usa", "us", "amerique", "l amerique"],
    nationalityAliases: ["états-unien", "états-unienne"],
  },
  {
    id: "mexique",
    code: "mx",
    article: "le",
    name: "Mexique",
    nationalityM: "mexicain",
    nationalityF: "mexicaine",
    side: "left",
    continent: "amerique",
    aliases: [],
  },
  {
    id: "venezuela",
    code: "ve",
    article: "le",
    name: "Venezuela",
    nationalityM: "vénézuélien",
    nationalityF: "vénézuélienne",
    side: "left",
    continent: "amerique",
    aliases: [],
  },
  {
    id: "bresil",
    code: "br",
    article: "le",
    name: "Brésil",
    nationalityM: "brésilien",
    nationalityF: "brésilienne",
    side: "left",
    continent: "amerique",
    aliases: [],
  },
  {
    id: "argentine",
    code: "ar",
    article: "l’",
    name: "Argentine",
    nationalityM: "argentin",
    nationalityF: "argentine",
    side: "left",
    continent: "amerique",
    aliases: [],
  },
];

/** "la France", "l’Allemagne", "les États-Unis". */
export function withArticle(article, name) {
  return article.endsWith("’") ? `${article}${name}` : `${article} ${name}`;
}

/**
 * Splits the feminine form into the part it shares with the masculine and the
 * ending French adds: française → ["français", "e"], grecque → ["grec", "que"].
 * Invariable forms (belge, suisse) return an empty ending.
 */
export function feminineEnding(m, f) {
  if (m === f) return [f, ""];
  let i = 0;
  while (i < m.length && i < f.length && m[i] === f[i]) i += 1;
  return [f.slice(0, i), f.slice(i)];
}

export const COUNTRIES = DATA.map((country) => ({
  nationalityAliases: [],
  ...country,
  articleName: withArticle(country.article, country.name),
  invariable: country.nationalityM === country.nationalityF,
}));

export const COUNTRY_BY_ID = Object.fromEntries(
  COUNTRIES.map((country) => [country.id, country]),
);

export const COUNTRY_IDS = COUNTRIES.map((country) => country.id);

export const SIDES = ["top", "right", "bottom", "left"];

export const COUNTRIES_BY_SIDE = Object.fromEntries(
  SIDES.map((side) => [side, COUNTRIES.filter((c) => c.side === side)]),
);
