import "./styles.css";
import {
  COUNTRIES,
  COUNTRY_BY_ID,
  COUNTRY_IDS,
  COUNTRIES_BY_SIDE,
  feminineEnding,
} from "./countries.js";
import {
  DURATIONS,
  applyGuess,
  canGrow,
  explainMiss,
  finishRound,
  matchAnswer,
  newRound,
  readBest,
  readDuration,
  saveBest,
  saveDuration,
  scoreOf,
  startRound,
  tickRound,
} from "./game.js";
import { sound } from "./audio.js";
import { EUROPE, WORLD } from "./map-data.js";

const TOTAL = COUNTRY_IDS.length;
// "français" may still become "française": wait this long before accepting it.
const PAUSE_BEFORE_ACCEPT = 650;
const IN_EUROPE_ZOOM = new Set(Object.keys(EUROPE.labels));

const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
const announcer = document.querySelector("#announcer");

let storage;
try {
  storage = window.localStorage;
} catch {
  /* Records are optional. */
}

let duration = readDuration(storage);
let round = newRound(duration);
let tickTimer;
let pendingTimer;
let feedbackTimer;
let returnFocus;
let pausedAt = null;
// The last answer typed in, so the end of a longer form of it (« s », « e »)
// is not left behind in the field.
let lastAccepted = null;
let warned = false;

// ---------------------------------------------------------------------------
// Small helpers

const ICONS = {
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2-2.5 3.7M12 16.8v.1"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 3h5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"/>',
  volumeOn: '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  volumeOff: '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/>',
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** "la France" with its article marked, so the article reads as part of the answer. */
function nameHTML(country) {
  const glue = country.article.endsWith("’") ? "" : " ";
  return `<span class="art">${country.article}</span>${glue}${escapeHTML(country.name)}`;
}

function feminineHTML(country) {
  const [stem, ending] = feminineEnding(country.nationalityM, country.nationalityF);
  return ending ? `${stem}<b class="ending">${ending}</b>` : stem;
}

function nationalitiesText(country) {
  return country.invariable
    ? `${country.nationalityM} (masculin et féminin)`
    : `masculin ${country.nationalityM}, féminin ${country.nationalityF}`;
}

/** French spacing: a narrow no-break space before ; ! ? and a no-break space before : and inside « ». */
function fr(text) {
  return text
    .replace(/ ([;!?])/g, "\u202F$1")
    .replace(/ (:|»)/g, "\u00A0$1")
    .replace(/« /g, "«\u00A0");
}

function durationLabel(seconds, long = false) {
  const minutes = seconds / 60;
  if (long) return minutes === 1 ? "une minute" : `${minutes}\u00A0minutes`;
  return `${minutes}\u00A0min`;
}

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function announce(text) {
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer.textContent = fr(text);
  });
}

const flagSrc = (country) => `./flags/${country.code}.svg`;

/** « 12 / 24 » on screen, « 12 sur 24 » for a screen reader. */
function outOf(score) {
  return `${score}<span aria-hidden="true"> / ${TOTAL}</span><span class="sr-only"> sur ${TOTAL}</span>`;
}

/** The article as the student typed it, marked as Spanish when it is. */
function slipHTML(country, said) {
  const article = ["el", "los", "las"].includes(said) ? `<span lang="es">${said}</span>` : escapeHTML(said);
  return said.endsWith("’") ? `${article}${escapeHTML(country.name)}` : `${article} ${escapeHTML(country.name)}`;
}

function setSkipTarget(target) {
  document.querySelector(".skip-link")?.setAttribute("href", target);
}

// ---------------------------------------------------------------------------
// Board markup (built once; game events update it in place)

function card(country) {
  return `<li class="card" data-id="${country.id}">
    <img class="card-flag" src="${flagSrc(country)}" alt="" width="44" height="33" decoding="async">
    <div class="card-text" aria-hidden="true">
      <span class="card-country" data-slot="country"></span>
      <span class="card-nat"><abbr class="tag tag-m">m.</abbr><span class="word" data-slot="m"></span></span>
      <span class="card-nat"><abbr class="tag tag-f">f.</abbr><span class="word" data-slot="f"></span></span>
    </div>
    <span class="sr-only" data-slot="sr">Drapeau à trouver</span>
  </li>`;
}

const SIDE_NAMES = {
  top: "Drapeaux d’Europe",
  left: "Drapeaux des Amériques",
  right: "Drapeaux d’Europe du Sud, d’Asie et d’Océanie",
  bottom: "Drapeaux du Portugal, d’Espagne et d’Afrique",
};

function flagList(side) {
  return `<ul class="flags flags-${side}" aria-label="${SIDE_NAMES[side]}">
    ${COUNTRIES_BY_SIDE[side].map(card).join("")}
  </ul>`;
}

function mapLayer(map, { dot }) {
  const shapes = Object.entries(map.countries)
    .map(([code, d]) => `<path class="country" data-code="${code}" d="${d}"/>`)
    .join("");
  const leaders = [];
  const labels = [];
  for (const [code, { at, align }] of Object.entries(map.labels)) {
    const [ax, ay] = map.anchors[code];
    const [lx, ly] = at;
    if (Math.hypot(lx - ax, ly - ay) > dot * 6) {
      leaders.push(
        `<g class="leader" data-code="${code}"><line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly}"/><circle cx="${ax}" cy="${ay}" r="${dot}"/></g>`,
      );
    }
    const pct = (v, size) => `${((v / size) * 100).toFixed(2)}%`;
    labels.push(
      `<span class="label is-blank" data-code="${code}" data-align="${align}" style="--lx:${pct(lx, map.width)};--ly:${pct(ly, map.height)};--ax:${pct(ax, map.width)};--ay:${pct(ay, map.height)}"><span class="label-text"></span></span>`,
    );
  }
  return {
    svg: `<path class="land" d="${map.land}"/><g class="countries">${shapes}</g><path class="borders" d="${map.borders}"/><g class="leaders">${leaders.join("")}</g><g class="ripples"></g>`,
    labels: labels.join(""),
  };
}

function mapFigure() {
  const world = mapLayer(WORLD, { dot: 2.3 });
  const europe = mapLayer(EUROPE, { dot: 4.6 });
  const inset = WORLD.inset;
  return `<figure class="map" aria-labelledby="map-caption">
    <div class="map-frame">
      <div class="world" style="--ratio:${WORLD.width} / ${WORLD.height}">
        <svg class="map-svg" viewBox="0 0 ${WORLD.width} ${WORLD.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
          <rect class="sea" width="${WORLD.width}" height="${WORLD.height}"/>
          <path class="graticule" d="${WORLD.graticule}"/>
          ${world.svg}
          <path class="europe-frame" d="${WORLD.europeFrame}"/>
        </svg>
        <div class="labels" aria-hidden="true">${world.labels}</div>
      </div>
      <div class="inset" style="--x:${(inset.x / WORLD.width) * 100}%;--y:${(inset.y / WORLD.height) * 100}%;--w:${(inset.width / WORLD.width) * 100}%;--ratio:${EUROPE.width} / ${EUROPE.height}">
        <span class="inset-title" aria-hidden="true">Europe</span>
        <svg class="map-svg" viewBox="0 0 ${EUROPE.width} ${EUROPE.height}" aria-hidden="true" focusable="false">
          <rect class="sea" width="${EUROPE.width}" height="${EUROPE.height}"/>
          ${europe.svg}
        </svg>
        <div class="labels" aria-hidden="true">${europe.labels}</div>
      </div>
    </div>
    <figcaption id="map-caption" class="sr-only">Carte du monde. Pays complétés\u00A0: <span data-map-count>0</span> sur ${TOTAL}.</figcaption>
  </figure>`;
}

function renderShell() {
  app.innerHTML = `
    <header class="bar">
      <a class="round-button bar-back" href="../" title="Retour à l’accueil">${icon("back")}<span class="sr-only">Retour à l’accueil d’Isadora Gazzi</span></a>
      <h1 class="bar-title">Pays <span class="amp">et</span> nationalités</h1>
      <div class="bar-slot" data-slot="bar"></div>
      <div class="bar-tools">
        <button type="button" class="round-button" data-action="sound"></button>
        <button type="button" class="round-button" data-action="rules" title="Règles du jeu">${icon("help")}<span class="sr-only">Règles du jeu</span></button>
      </div>
      <div class="timeline" aria-hidden="true"><span class="timeline-fill"></span></div>
    </header>
    <main id="main" class="board" tabindex="-1">
      <div class="board-map">${mapFigure()}<div class="start-slot" data-slot="start"></div></div>
      ${flagList("top")}
      ${flagList("left")}
      ${flagList("right")}
      ${flagList("bottom")}
    </main>
  `;
  renderSoundButton();
}

function renderSoundButton() {
  const button = app.querySelector('[data-action="sound"]');
  const muted = sound.isMuted();
  button.innerHTML = `${icon(muted ? "volumeOff" : "volumeOn")}<span class="sr-only">Son</span>`;
  button.setAttribute("aria-pressed", String(!muted));
  button.title = muted ? "Activer le son" : "Couper le son";
}

// ---------------------------------------------------------------------------
// Board updates

const cardOf = (id) => app.querySelector(`.card[data-id="${id}"]`);
const shapesOf = (code) => app.querySelectorAll(`.country[data-code="${code}"]`);
const labelsOf = (code) => app.querySelectorAll(`.label[data-code="${code}"]`);
const leadersOf = (code) => app.querySelectorAll(`.leader[data-code="${code}"]`);

function fillCard(country, state) {
  const el = cardOf(country.id);
  el.classList.remove("is-found", "is-missed", "is-latest");
  el.classList.add(state === "found" ? "is-found" : "is-missed");
  el.querySelector('[data-slot="country"]').innerHTML = nameHTML(country);
  el.querySelector('[data-slot="m"]').textContent = country.nationalityM;
  el.querySelector('[data-slot="f"]').innerHTML = feminineHTML(country);
  el.querySelector('[data-slot="sr"]').textContent =
    `${country.articleName} : ${nationalitiesText(country)}${state === "missed" ? " (à revoir)" : ""}`;
}

function fillMap(country, state) {
  const cls = state === "found" ? "is-found" : "is-missed";
  for (const shape of shapesOf(country.code)) {
    shape.classList.remove("is-found", "is-missed");
    shape.classList.add(cls);
  }
  for (const label of labelsOf(country.code)) {
    label.classList.remove("is-blank", "is-found", "is-missed");
    label.classList.add(cls);
    label.querySelector(".label-text").innerHTML = nameHTML(country);
  }
  for (const leader of leadersOf(country.code)) {
    leader.classList.remove("is-found", "is-missed");
    leader.classList.add(cls);
  }
}

function ripple(country) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const map = IN_EUROPE_ZOOM.has(country.code) ? EUROPE : WORLD;
  const layer = app.querySelector(map === EUROPE ? ".inset .ripples" : ".world .ripples");
  const [x, y] = map.anchors[country.code];
  const ns = "http://www.w3.org/2000/svg";
  const ring = document.createElementNS(ns, "circle");
  ring.setAttribute("cx", x);
  ring.setAttribute("cy", y);
  ring.setAttribute("r", map === EUROPE ? 26 : 16);
  ring.setAttribute("class", "ripple");
  ring.addEventListener("animationend", () => ring.remove());
  layer.append(ring);
}

function markLatest(country) {
  for (const el of app.querySelectorAll(".is-latest")) el.classList.remove("is-latest");
  for (const label of labelsOf(country.code)) label.classList.add("is-latest");
  cardOf(country.id).classList.add("is-latest");
}

function reveal(country) {
  fillCard(country, "found");
  fillMap(country, "found");
  markLatest(country);
  ripple(country);
}

function resetBoard() {
  clearPointing();
  for (const el of app.querySelectorAll(".card")) {
    el.classList.remove("is-found", "is-missed", "is-latest");
    el.removeAttribute("tabindex");
    for (const slot of el.querySelectorAll('[data-slot="country"], [data-slot="m"], [data-slot="f"]')) {
      slot.textContent = "";
    }
    el.querySelector('[data-slot="sr"]').textContent = "Drapeau à trouver";
  }
  for (const el of app.querySelectorAll(".country, .leader")) {
    el.classList.remove("is-found", "is-missed");
  }
  for (const label of app.querySelectorAll(".label")) {
    label.className = "label is-blank";
    label.querySelector(".label-text").textContent = "";
  }
  updateScore();
}

function updateScore() {
  const score = scoreOf(round);
  const scoreEl = app.querySelector("[data-score]");
  if (scoreEl) scoreEl.textContent = String(score);
  app.querySelector("[data-map-count]").textContent = String(score);
}

function updateClock() {
  const timer = app.querySelector("[data-timer]");
  if (timer) timer.textContent = formatClock(round.secondsLeft);
  const clock = app.querySelector(".clock");
  if (clock) clock.classList.toggle("is-urgent", round.status === "running" && round.secondsLeft <= 10);
  const fill = app.querySelector(".timeline-fill");
  if (round.status === "running" && round.startedAt != null) {
    const left = Math.max(0, 1 - (Date.now() - round.startedAt) / (round.duration * 1000));
    fill.style.transform = `scaleX(${left})`;
  }
}

// ---------------------------------------------------------------------------
// Bar and panels for each state

function durationPicker(name) {
  return `<fieldset class="durations">
    <legend>Durée</legend>
    <div class="segments">
      ${DURATIONS.map(
        (seconds) => `<label class="segment">
          <input type="radio" name="${name}" value="${seconds}" ${seconds === duration ? "checked" : ""}>
          <span>${durationLabel(seconds)}</span>
        </label>`,
      ).join("")}
    </div>
  </fieldset>`;
}

function bestLine() {
  const { best, available } = readBest(storage, duration);
  if (!available) return "Ce navigateur ne garde pas les records.";
  return fr(
    best > 0
      ? `Record en ${durationLabel(duration)} : <strong>${outOf(best)}</strong>`
      : `Pas encore de record en ${durationLabel(duration)}.`,
  );
}

function renderReady() {
  app.dataset.state = "ready";
  setSkipTarget("#main");
  app.querySelector('[data-slot="bar"]').innerHTML = "";
  app.querySelector(".timeline-fill").style.transform = "scaleX(1)";
  app.querySelector('[data-slot="start"]').innerHTML = fr(`
    <section class="start" aria-labelledby="start-title">
      <h2 id="start-title">Combien de pays en <span data-slot="duration-long">${durationLabel(duration, true)}</span>&nbsp;?</h2>
      <p class="start-lead">Écris un pays ou une nationalité en français. Le pays se complète sur la carte avec son article, et le drapeau montre la nationalité au masculin et au féminin.</p>
      <div class="start-example" aria-hidden="true">
        <span class="example-typed">française</span>
        ${icon("arrow")}
        <span class="example-label"><span class="art">la</span> France</span>
        <span class="example-nat"><span class="tag tag-m">m.</span><span>français</span><span class="tag tag-f">f.</span><span>français<b class="ending">e</b></span></span>
      </div>
      <p class="sr-only">Exemple : « française » complète la France, avec français au masculin et française au féminin.</p>
      <div class="start-actions">
        ${durationPicker("duration")}
        <button type="button" class="button button-primary button-large" data-action="start">Commencer ${icon("arrow")}</button>
      </div>
      <p class="start-best" data-slot="best">${bestLine()}</p>
    </section>`);
}

function renderRunning() {
  app.dataset.state = "running";
  setSkipTarget("#guess");
  app.querySelector('[data-slot="start"]').innerHTML = "";
  app.querySelector('[data-slot="bar"]').innerHTML = `
    <div class="play">
      <div class="clock">${icon("clock")}<span class="sr-only">Temps restant\u00A0: </span><span data-timer>${formatClock(round.secondsLeft)}</span></div>
      <form class="guess" data-action="guess" autocomplete="off" novalidate>
        <label class="sr-only" for="guess">Pays ou nationalité</label>
        <input id="guess" name="guess" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Pays ou nationalité…" aria-describedby="feedback">
        <span class="guess-hint" aria-hidden="true">Entrée ↵</span>
        <button class="guess-submit" type="submit" title="Valider">${icon("check")}<span class="sr-only">Valider</span></button>
        <p class="feedback" id="feedback" role="status" aria-live="polite"></p>
      </form>
      <p class="score"><span class="sr-only">Pays trouvés\u00A0: </span><strong data-score>${scoreOf(round)}</strong><span class="score-total" aria-hidden="true"> / ${TOTAL}</span><span class="sr-only"> sur ${TOTAL}</span></p>
      <button type="button" class="stop-button" data-action="stop">${icon("stop")}<span class="stop-long">Terminer</span><span class="stop-short">Fin</span></button>
    </div>`;
}

const END_TITLES = { complete: "Bravo !", stop: "Partie terminée", time: "Temps écoulé" };

function renderFinished(saved, reason) {
  app.dataset.state = "finished";
  setSkipTarget("#result-title");
  const score = scoreOf(round);
  const note =
    reason === "complete"
      ? `Tout trouvé, avec ${formatClock(round.secondsLeft)} d’avance !`
      : saved.isRecord && score > 0
        ? "Nouveau record !"
        : saved.available && saved.best > 0
          ? `Record en ${durationLabel(round.duration)} : ${outOf(saved.best)}`
          : "";
  app.querySelector('[data-slot="start"]').innerHTML = "";
  app.querySelector('[data-slot="bar"]').innerHTML = fr(`
    <div class="result">
      <p class="result-score"><strong>${score}</strong><span aria-hidden="true"> / ${TOTAL}</span><span class="sr-only"> sur ${TOTAL}</span></p>
      <div class="result-text">
        <h2 class="result-title" id="result-title" tabindex="-1">${END_TITLES[reason]}</h2>
        ${note ? `<p class="result-note">${note}</p>` : ""}
      </div>
      <div class="result-actions">
        <button type="button" class="button button-primary" data-action="start">${icon("refresh")} Rejouer</button>
        <button type="button" class="text-button" data-action="menu">Changer la durée</button>
      </div>
    </div>`);
  // The finished board is the answer key: each flag can point at its country.
  for (const el of app.querySelectorAll(".card")) el.tabIndex = 0;
}

// ---------------------------------------------------------------------------
// Feedback under the answer field

function showFeedback(kind, html) {
  const el = app.querySelector("#feedback");
  if (!el) return;
  clearTimeout(feedbackTimer);
  el.className = `feedback is-${kind}`;
  el.innerHTML = fr(html);
  feedbackTimer = setTimeout(() => {
    el.classList.add("is-fading");
  }, 3200);
}

const flagHTML = (country) => `<img src="${flagSrc(country)}" alt="" width="20" height="15">`;

function nationalitiesHTML(country) {
  return country.invariable
    ? `<span class="tag tag-mf">m./f.</span>${country.nationalityM}`
    : `<span class="tag tag-m">m.</span>${country.nationalityM}<span class="tag tag-f">f.</span>${feminineHTML(country)}`;
}

function showHitFeedback(country) {
  showFeedback(
    "hit",
    `${flagHTML(country)}<strong>${nameHTML(country)}</strong><span class="feedback-nat" aria-hidden="true">${nationalitiesHTML(country)}</span><span class="sr-only"> : ${nationalitiesText(country)}</span>`,
  );
}

/** « les Français », « italiens »: counted, with the forms to write. */
function showFormFeedback(country) {
  showFeedback(
    "article",
    `${flagHTML(country)}<strong>${nameHTML(country)}</strong> · au singulier, sans article :<span class="feedback-nat" aria-hidden="true">${nationalitiesHTML(country)}</span><span class="sr-only"> ${nationalitiesText(country)}</span>`,
  );
}

function nudgeInput() {
  const form = app.querySelector(".guess");
  if (!form || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  form.classList.remove("is-nudged");
  void form.offsetWidth;
  form.classList.add("is-nudged");
}

// ---------------------------------------------------------------------------
// Game flow

function stopTicking() {
  clearInterval(tickTimer);
  tickTimer = undefined;
}

/** An answer waiting for the pause was typed in time: it counts. */
function flushPending() {
  clearTimeout(pendingTimer);
  const input = app.querySelector("#guess");
  if (input?.classList.contains("is-pending")) submitGuess(input.value, false);
}

function tick() {
  // The rules are open: the clock waits for them.
  if (pausedAt != null) return;
  const previous = round.secondsLeft;
  const next = tickRound(round);
  if (next.status === "finished") {
    flushPending();
    // The pending answer may have been the last one and ended the round.
    if (round.status === "running") {
      round = { ...round, secondsLeft: 0 };
      finish("time");
    }
    return;
  }
  round = next;
  if (round.secondsLeft !== previous) {
    if (round.secondsLeft <= 5) sound.playTick();
    if (round.secondsLeft <= 10 && !warned) {
      warned = true;
      announce("Plus que 10 secondes.");
    }
  }
  updateClock();
}

function startTicking() {
  stopTicking();
  tickTimer = setInterval(tick, 200);
}

function begin() {
  clearTimeout(pendingTimer);
  round = startRound(newRound(duration));
  warned = false;
  pausedAt = null;
  lastAccepted = null;
  resetBoard();
  renderRunning();
  updateClock();
  app.querySelector("#guess").focus();
  startTicking();
  announce(`C’est parti : ${durationLabel(duration, true)}. Écris un pays ou une nationalité.`);
}

function finish(reason) {
  stopTicking();
  clearTimeout(pendingTimer);
  pausedAt = null;
  lastAccepted = null;
  round = finishRound(round);
  const score = scoreOf(round);
  const saved = saveBest(score, storage, round.duration);
  for (const country of COUNTRIES) {
    if (!round.found.includes(country.id)) {
      fillCard(country, "missed");
      fillMap(country, "missed");
    }
  }
  for (const el of app.querySelectorAll(".is-latest")) el.classList.remove("is-latest");
  app.querySelector(".timeline-fill").style.transform = "scaleX(0)";
  renderFinished(saved, reason);
  const record = saved.isRecord && score > 0;
  if (reason === "complete" || record) sound.playVictory();
  else sound.playEnd();
  announce(
    reason === "complete"
      ? `Tout est trouvé : ${score} pays sur ${TOTAL}.`
      : `${score} pays sur ${TOTAL}.${record ? " Nouveau record !" : ""} Les réponses manquantes sont affichées sur la carte et sur les drapeaux.`,
  );
  app.querySelector("#result-title")?.focus();
}

function backToMenu() {
  stopTicking();
  clearTimeout(pendingTimer);
  round = newRound(duration);
  resetBoard();
  renderReady();
  app.querySelector('[data-action="start"]')?.focus();
}

function submitGuess(value, explicit) {
  clearTimeout(pendingTimer);
  const input = app.querySelector("#guess");
  input?.classList.remove("is-pending");
  if (round.status !== "running") return;

  const outcome = applyGuess(round, value);
  round = outcome.round;
  const typed = escapeHTML(value.trim());

  if (outcome.result === "hit") {
    const { country } = outcome;
    input.value = "";
    lastAccepted = { raw: value, id: country.id, at: Date.now() };
    reveal(country);
    updateScore();
    sound.playHit();
    if (outcome.wrongArticle) {
      showFeedback(
        "article",
        `${flagHTML(country)}On dit <strong>${nameHTML(country)}</strong>, pas <s>${slipHTML(country, outcome.typedArticle)}</s>.`,
      );
    } else if (outcome.nationalityForm) {
      showFormFeedback(country);
    } else {
      showHitFeedback(country);
    }
    if (round.status === "finished") finish("complete");
    return;
  }

  if (outcome.result === "duplicate") {
    const { country } = outcome;
    input.value = "";
    lastAccepted = { raw: value, id: country.id, at: Date.now() };
    sound.playDuplicate();
    const slip = outcome.wrongArticle
      ? ` (pas <s>${slipHTML(country, outcome.typedArticle)}</s>)`
      : "";
    showFeedback("duplicate", `Déjà trouvé : <strong>${nameHTML(country)}</strong>${slip}.`);
    const el = cardOf(country.id);
    el.classList.remove("is-latest");
    void el.offsetWidth;
    el.classList.add("is-latest");
    return;
  }

  if (!explicit || outcome.reason === "empty") return;
  lastAccepted = null;
  nudgeInput();
  if (outcome.reason === "spelling") {
    showFeedback("miss", "Presque ! Vérifie l’orthographe.");
    input.select();
    return;
  }
  input.value = "";
  if (outcome.reason === "spanish") {
    showFeedback("miss", `« <span lang="es">${typed}</span> », c’est de l’espagnol. Essaie en français !`);
  } else if (outcome.reason === "english") {
    showFeedback("miss", `« <span lang="en">${typed}</span> », c’est de l’anglais. Essaie en français !`);
  } else if (outcome.reason === "continent") {
    showFeedback("miss", `« ${typed} » : c’est un continent. Écris un pays ou une nationalité !`);
  } else if (outcome.reason === "elsewhere") {
    showFeedback("miss", `« ${typed} » : c’est juste, mais ce pays n’est pas sur la carte.`);
  } else {
    showFeedback("miss", `« ${typed} » n’est pas dans la liste.`);
  }
}

/** Which country the text names, as an answer or as a nationality form. */
function recognised(value) {
  const match = matchAnswer(value);
  if (match) return match;
  const miss = explainMiss(value);
  return miss.reason === "nationality-form" ? { id: miss.id, kind: "nationality" } : null;
}

/**
 * Answers count as soon as they are complete, but the student may be typing
 * a longer form of the same one: « japonaise » + « s », « le Japon » + « ais »,
 * « les Itali » + « ens ». Those letters must not stay in front of the next
 * answer — yet « s » may just as well start « Suisse ». So a continuation
 * waits, like an answer that can still grow: after a pause or on Enter it is
 * swallowed, and any other letter makes it a new answer.
 */
function continuationOf(value) {
  if (!lastAccepted || Date.now() - lastAccepted.at > 3000 || !value || recognised(value)) return null;
  const combined = lastAccepted.raw + value;
  return recognised(combined)?.id === lastAccepted.id ? combined : null;
}

function absorb(input, combined) {
  input.value = "";
  input.classList.remove("is-pending");
  lastAccepted = { ...lastAccepted, raw: combined, at: Date.now() };
  const country = COUNTRY_BY_ID[lastAccepted.id];
  const match = matchAnswer(combined);
  if (!match) showFormFeedback(country);
  else if (!match.wrongArticle) showHitFeedback(country);
}

function onTyping(input) {
  clearTimeout(pendingTimer);
  input.classList.remove("is-pending");
  if (round.status !== "running") return;
  const value = input.value;
  const combined = continuationOf(value);
  if (combined) {
    input.classList.add("is-pending");
    pendingTimer = setTimeout(() => {
      if (input.value === value) absorb(input, combined);
    }, PAUSE_BEFORE_ACCEPT);
    return;
  }
  const found = recognised(value);
  if (!found) return;
  if (canGrow(value)) {
    input.classList.add("is-pending");
    pendingTimer = setTimeout(() => {
      if (input.value === value) submitGuess(value, false);
    }, PAUSE_BEFORE_ACCEPT);
    return;
  }
  submitGuess(value, false);
}

// ---------------------------------------------------------------------------
// Rules

function openRules() {
  returnFocus = document.activeElement;
  // Reading the rules does not cost time.
  if (round.status === "running" && pausedAt == null) {
    pausedAt = Date.now();
    stopTicking();
  }
  dialog.innerHTML = fr(`
    <form method="dialog" class="sheet">
      <div class="sheet-head">
        <h2 id="dialog-title">Règles du jeu</h2>
        <button value="close" class="round-button" title="Fermer">${icon("close")}<span class="sr-only">Fermer</span></button>
      </div>
      <ol class="rules">
        <li>Choisis une durée : <strong>1, 2 ou 3\u00A0minutes</strong>.</li>
        <li>Écris un <strong>pays</strong> ou une <strong>nationalité</strong>. Une seule réponse suffit : le pays apparaît sur la carte et le drapeau montre la nationalité.</li>
        <li>Les pays s’écrivent avec leur <strong>article</strong> : <em>la</em> France, <em>le</em> Japon, <em>l’</em>Espagne, <em>les</em> États-Unis. Si tu l’oublies ou si tu te trompes d’article, ça compte quand même : le jeu affiche toujours le bon article.</li>
        <li>Un seul genre suffit, au singulier : <em>français</em> ou <em>française</em>, les deux formes apparaissent.</li>
        <li>Pas besoin d’accents ni de majuscules. La réponse est validée toute seule ; si elle peut encore s’allonger (<em>japonais</em> → <em>japonaise</em>), fais une pause ou appuie sur Entrée.</li>
      </ol>
      <div class="sheet-foot">
        <button class="button button-primary" value="close">Compris</button>
      </div>
    </form>`);
  dialog.showModal();
  dialog.querySelector(".sheet-foot .button").focus();
}

dialog.addEventListener("close", () => {
  if (pausedAt != null && round.status === "running") {
    round = { ...round, startedAt: round.startedAt + (Date.now() - pausedAt) };
    pausedAt = null;
    startTicking();
    updateClock();
  }
  const target = round.status === "running" ? app.querySelector("#guess") : returnFocus;
  if (target && typeof target.focus === "function") target.focus();
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// ---------------------------------------------------------------------------
// Events

app.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  // A double click on Terminer must not land on the button that replaces it.
  if (event.detail > 1 && action) return;
  if (action === "start") begin();
  else if (action === "stop" && round.status === "running") {
    flushPending();
    if (round.status === "running") finish("stop");
  } else if (action === "menu") backToMenu();
  else if (action === "rules") openRules();
  else if (action === "sound") {
    sound.toggleMute();
    renderSoundButton();
  } else if (round.status === "finished") {
    // On the answer key, tapping a flag points at its country.
    const el = event.target.closest(".card");
    if (el) {
      clearPointing();
      point(el);
    }
  }
});

// The second press of a double click must not move focus either.
app.addEventListener("mousedown", (event) => {
  if (event.detail > 1 && event.target.closest("[data-action]")) event.preventDefault();
});

app.addEventListener("change", (event) => {
  if (event.target.name !== "duration") return;
  duration = Number(event.target.value);
  saveDuration(duration, storage);
  round = newRound(duration);
  const long = app.querySelector('[data-slot="duration-long"]');
  if (long) long.textContent = durationLabel(duration, true);
  const best = app.querySelector('[data-slot="best"]');
  if (best) best.innerHTML = bestLine();
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest('form[data-action="guess"]');
  if (!form) return;
  event.preventDefault();
  const input = form.querySelector("#guess");
  const combined = continuationOf(input.value);
  if (combined) {
    clearTimeout(pendingTimer);
    absorb(input, combined);
  } else {
    submitGuess(input.value, true);
  }
  input.focus();
});

app.addEventListener("input", (event) => {
  if (event.target.id !== "guess" || event.isComposing) return;
  onTyping(event.target);
});

app.addEventListener("compositionend", (event) => {
  if (event.target.id === "guess") onTyping(event.target);
});

// The answers have to be typed: no copying them off the cards, no pasting or
// dropping text into the box.
for (const type of ["copy", "cut", "paste", "drop"]) {
  app.addEventListener(type, (event) => event.preventDefault());
}

app.addEventListener("beforeinput", (event) => {
  if (event.inputType === "insertFromPaste" || event.inputType === "insertFromDrop") {
    event.preventDefault();
  }
});

// Pointing at a flag (mouse, keyboard focus, or a tap on the answer key)
// shows where its country is.
function point(card) {
  const { code } = COUNTRY_BY_ID[card.dataset.id];
  card.classList.add("is-pointing");
  for (const node of [...shapesOf(code), ...labelsOf(code), ...leadersOf(code)]) {
    node.classList.add("is-pointed");
  }
}

function clearPointing() {
  for (const node of app.querySelectorAll(".is-pointed, .is-pointing")) {
    node.classList.remove("is-pointed", "is-pointing");
  }
}

app.addEventListener("pointerover", (event) => {
  const el = event.target.closest(".card");
  if (!el || event.pointerType === "touch") return;
  clearPointing();
  point(el);
});

app.addEventListener("pointerout", (event) => {
  const el = event.target.closest(".card");
  if (!el || el.contains(event.relatedTarget) || event.pointerType === "touch") return;
  clearPointing();
});

app.addEventListener("focusin", (event) => {
  const el = event.target.closest(".card");
  if (!el) return;
  clearPointing();
  point(el);
});

app.addEventListener("focusout", (event) => {
  if (event.target.closest(".card")) clearPointing();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && round.status === "running") tick();
});

renderShell();
renderReady();
