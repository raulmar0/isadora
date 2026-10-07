import "./styles.css";
import {
  COUNTRIES,
  nationalityLabel,
} from "./countries.js";
import {
  newRound,
  startRound,
  tickRound,
  applyGuess,
  finishRound,
  scoreOf,
  remainingOf,
  readBest,
  saveBest,
  ROUND_SECONDS,
  COUNTRY_IDS,
} from "./game.js";

const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
const announcer = document.querySelector("#announcer");
const toastElement = document.querySelector("#toast");

let storage;
try {
  storage = window.localStorage;
} catch {
  /* Best score is optional. */
}

const loadedBest = readBest(storage);
let bestScore = loadedBest.best;
let storageAvailable = loadedBest.available;
let round = newRound();
let screen = "home";
let toastTimer;
let tickTimer;
let returnFocus;

const paths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  play: '<path d="m9 5 11 7-11 7V5Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .4c0 1.8-2.5 1.9-2.5 3.6m0 3h.01"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  clock:
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 21V4m0 0h9l-1.5 3L14 10H5"/>',
};

function icon(name, className = "") {
  return `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

function announce(text) {
  announcer.textContent = "";
  announcer.textContent = text;
}

function showToast(text) {
  toastElement.hidden = false;
  toastElement.textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastElement.hidden = true;
  }, 1600);
}

function header(isGame = false) {
  return `<header class="site-header">
    <button class="brand" data-action="home" aria-label="Pays et nationalités — Accueil">
      <span class="brand-mark" aria-hidden="true">${icon("flag")}</span>
      <span class="brand-type">Pays <span class="brand-amp">&</span> nations</span>
    </button>
    <nav aria-label="Navigation principale">
      ${
        isGame
          ? '<button class="text-button home-link" data-action="home">' +
            icon("back") +
            "<span>Accueil</span></button>"
          : '<span class="language-tag"><span class="french-flag" aria-hidden="true"></span> En français</span>'
      }
      <button class="text-button rules-link" data-action="rules">${icon("help")}<span>Les règles</span></button>
    </nav>
  </header>`;
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  return `0:${String(safe).padStart(2, "0")}`;
}

function flagChip(country, found) {
  const label = nationalityLabel(country);
  return `<div class="flag-chip ${found ? "is-found" : ""}" data-country="${country.id}" style="--x:${country.mapX}%;--y:${country.mapY}%">
    <span class="flag-emoji" aria-hidden="true">${country.flag}</span>
    <span class="flag-copy">
      <span class="flag-nats">${found ? label : "· · ·"}</span>
      <span class="flag-country">${found ? country.articleName : "?"}</span>
    </span>
  </div>`;
}

function mapPin(country, found) {
  return `<button type="button" class="map-pin ${found ? "is-found" : ""}" data-pin="${country.id}" style="left:${country.mapX}%;top:${country.mapY}%" ${found ? "" : "tabindex='-1'"} aria-label="${found ? country.articleName : "Pays à trouver"}">
    <span class="pin-dot" aria-hidden="true"></span>
    <span class="pin-label">${found ? country.articleName : ""}</span>
  </button>`;
}

function ringPosition(index, total) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const x = 50 + Math.cos(angle) * 46;
  const y = 50 + Math.sin(angle) * 44;
  return { x, y };
}

function playBoard() {
  const foundSet = new Set(round.found);
  const chips = COUNTRIES.map((country, index) => {
    const { x, y } = ringPosition(index, COUNTRIES.length);
    const found = foundSet.has(country.id);
    return `<div class="orbit-slot" style="left:${x}%;top:${y}%">${flagChip(country, found)}</div>`;
  }).join("");

  const pins = COUNTRIES.map((country) =>
    mapPin(country, foundSet.has(country.id)),
  ).join("");

  const inputDisabled = round.status !== "running" ? "disabled" : "";
  const urgent = round.secondsLeft <= 10 && round.status === "running";

  return `<section class="board" aria-label="Carte et drapeaux">
    <div class="orbit">${chips}</div>
    <div class="map-stage">
      <svg class="world-outline" viewBox="0 0 100 60" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="50" cy="30" rx="46" ry="26" fill="#e8e4d6" stroke="#cfc8b4" stroke-width="0.6"/>
        <path d="M18 22c4-6 14-8 22-5 3 1 5 4 8 4s6-3 10-2 8 4 11 3c4-1 8 2 10 6-2 5-7 8-12 9-6 1-10-2-15-1-4 1-7 5-12 5-6 0-11-4-14-9-2-3-2-7-2-10z" fill="#d9e0cf" opacity=".9"/>
        <path d="M58 18c6-2 14 0 18 4 3 3 5 8 3 12-3 5-10 7-16 6-5-1-9-5-10-10-1-4 1-9 5-12z" fill="#d2dcc8" opacity=".85"/>
        <path d="M70 40c5 1 10 5 11 10 0 3-3 6-8 6-5 0-9-3-10-7-1-3 2-8 7-9z" fill="#d6deca" opacity=".9"/>
        <path d="M28 40c4 0 8 3 9 7 1 3-1 6-5 7-5 1-10-1-11-5-1-4 2-8 7-9z" fill="#d4dcc7"/>
        <line x1="50" y1="4" x2="50" y2="56" stroke="#cfc8b4" stroke-width=".35" stroke-dasharray="1 1.2"/>
        <line x1="6" y1="30" x2="94" y2="30" stroke="#cfc8b4" stroke-width=".35" stroke-dasharray="1 1.2"/>
      </svg>
      <div class="map-pins">${pins}</div>
    </div>
  </section>
  <section class="play-bar">
    <div class="meter" aria-live="polite">
      <div class="timer ${urgent ? "is-urgent" : ""}">${icon("clock")}<span data-timer>${formatTime(round.secondsLeft)}</span></div>
      <div class="scoreline"><strong data-score>${scoreOf(round)}</strong> / ${COUNTRY_IDS.length}<span class="score-rest">trouvés</span></div>
    </div>
    <form class="guess-form" data-action="guess" autocomplete="off">
      <label class="sr-only" for="guess">Pays ou nationalité</label>
      <input id="guess" name="guess" type="text" inputmode="text" enterkeyhint="done" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Écris un pays ou une nationalité…" ${inputDisabled} />
      <button class="button button-primary" type="submit" ${inputDisabled}>OK</button>
    </form>
    <p class="hint">Un seul genre suffit : <em>français</em> révèle aussi <em>française</em>. Les pays comptent avec leur article.</p>
  </section>`;
}

function renderHome() {
  screen = "home";
  stopTicking();
  round = newRound();
  app.innerHTML = `${header()}
    <main id="main" class="home-main" tabindex="-1">
      <h1 class="sr-only">Pays et nationalités</h1>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Une minute · carte & drapeaux</p>
          <h2 class="hero-title">Nomme pays et nationalités.</h2>
          <p class="hero-lead">Au centre, la carte se complète. Autour, les drapeaux montrent le masculin et le féminin. Les pays s’écrivent avec leur article : <strong>la France</strong>, <strong>le Canada</strong>, <strong>les États-Unis</strong>.</p>
          <div class="home-actions">
            <button class="button button-primary" data-action="start">Nouvelle partie ${icon("arrow")}</button>
            <button class="button button-secondary" data-action="rules">${icon("help")} Les règles</button>
          </div>
          <p class="best-line">${storageAvailable ? `Meilleur score : <strong>${bestScore}</strong> / ${COUNTRY_IDS.length}` : "La sauvegarde du score est indisponible dans ce navigateur."}</p>
        </div>
        <div class="hero-preview" aria-hidden="true">
          <div class="preview-map">
            <span class="preview-flag" style="--i:0">🇫🇷</span>
            <span class="preview-flag" style="--i:1">🇨🇦</span>
            <span class="preview-flag" style="--i:2">🇸🇳</span>
            <span class="preview-flag" style="--i:3">🇯🇵</span>
            <span class="preview-flag" style="--i:4">🇧🇷</span>
            <span class="preview-flag" style="--i:5">🇪🇸</span>
            <div class="preview-core"><span>la France</span><small>français / française</small></div>
          </div>
        </div>
      </section>
    </main>`;
}

function renderPlay() {
  screen = "play";
  app.innerHTML = `${header(true)}
    <main id="main" class="play-main" tabindex="-1">
      <h1 class="sr-only">Partie en cours — Pays et nationalités</h1>
      ${playBoard()}
    </main>`;
  const input = app.querySelector("#guess");
  if (input && round.status === "running") {
    input.focus();
  }
}

function renderFinish() {
  screen = "finish";
  stopTicking();
  const score = scoreOf(round);
  const saved = saveBest(score, storage);
  bestScore = saved.best;
  storageAvailable = saved.available;
  const missed = COUNTRIES.filter((country) => !round.found.includes(country.id));

  app.innerHTML = `${header(true)}
    <main id="main" class="finish-main" tabindex="-1">
      <section class="finish-card">
        <p class="eyebrow">${score === COUNTRY_IDS.length ? "Bravo !" : "Temps écoulé"}</p>
        <h2 class="hero-title">${score} / ${COUNTRY_IDS.length}</h2>
        <p class="hero-lead">${
          score === COUNTRY_IDS.length
            ? "Tu as trouvé tous les pays et leurs nationalités."
            : `Il restait ${remainingOf(round)} pays. Meilleur score : ${bestScore}.`
        }</p>
        <div class="home-actions">
          <button class="button button-primary" data-action="start">Rejouer ${icon("arrow")}</button>
          <button class="button button-secondary" data-action="home">${icon("back")} Accueil</button>
        </div>
        ${
          missed.length
            ? `<details class="missed"><summary>Voir les pays manqués (${missed.length})</summary><ul>${missed
                .map(
                  (country) =>
                    `<li><span class="flag-emoji">${country.flag}</span> <strong>${country.articleName}</strong> — ${nationalityLabel(country)}</li>`,
                )
                .join("")}</ul></details>`
            : ""
        }
      </section>
      ${playBoard()}
    </main>`;
}

function render() {
  if (screen === "home") renderHome();
  else if (screen === "finish" || round.status === "finished") renderFinish();
  else renderPlay();
}

function stopTicking() {
  clearInterval(tickTimer);
  tickTimer = undefined;
}

function startTicking() {
  stopTicking();
  tickTimer = setInterval(() => {
    const previous = round.secondsLeft;
    round = tickRound(round);
    if (round.status === "finished") {
      announce(`Temps écoulé. Score : ${scoreOf(round)} sur ${COUNTRY_IDS.length}.`);
      renderFinish();
      return;
    }
    if (round.secondsLeft !== previous) {
      const timer = app.querySelector("[data-timer]");
      const timerWrap = app.querySelector(".timer");
      if (timer) timer.textContent = formatTime(round.secondsLeft);
      if (timerWrap) {
        timerWrap.classList.toggle("is-urgent", round.secondsLeft <= 10);
      }
    }
  }, 200);
}

function openRules() {
  returnFocus = document.activeElement;
  dialog.innerHTML = `
    <form method="dialog" class="dialog-sheet">
      <header>
        <h2 id="dialog-title">Les règles</h2>
        <button value="close" class="icon-button" aria-label="Fermer">${icon("close")}</button>
      </header>
      <div class="dialog-body">
        <ol>
          <li>Tu as <strong>${ROUND_SECONDS} secondes</strong> pour nommer le plus de pays possible.</li>
          <li>Écris le <strong>pays</strong> (avec ou sans article) ou la <strong>nationalité</strong>.</li>
          <li>Masculin ou féminin : un seul suffit, les deux apparaissent sur le drapeau.</li>
          <li>Au centre, la carte se remplit. Autour, les drapeaux révèlent les nationalités.</li>
        </ol>
        <p>Exemples : <em>la France</em>, <em>français</em>, <em>française</em>, <em>les États-Unis</em>, <em>américaine</em>.</p>
      </div>
      <footer>
        <button class="button button-primary" value="close">Compris</button>
      </footer>
    </form>`;
  dialog.showModal();
  dialog.querySelector("button")?.focus();
}

dialog.addEventListener("close", () => {
  if (returnFocus && typeof returnFocus.focus === "function") {
    returnFocus.focus();
  }
});

function beginRound() {
  round = startRound(newRound());
  screen = "play";
  renderPlay();
  startTicking();
  announce(`Nouvelle partie. ${ROUND_SECONDS} secondes. Écris un pays ou une nationalité.`);
}

function onGuess(form) {
  const input = form.querySelector("#guess");
  const value = input?.value ?? "";
  const { round: next, result, country, kind } = applyGuess(round, value);
  round = next;
  if (input) input.value = "";

  if (result === "hit") {
    const detail =
      kind === "nationality"
        ? `${nationalityLabel(country)} → ${country.articleName}`
        : `${country.articleName} → ${nationalityLabel(country)}`;
    showToast(detail);
    announce(`Trouvé : ${country.articleName}. ${nationalityLabel(country)}.`);
    if (round.status === "finished") {
      renderFinish();
      return;
    }
    renderPlay();
    app.querySelector("#guess")?.focus();
    return;
  }
  if (result === "duplicate") {
    showToast(`Déjà trouvé : ${country.articleName}`);
    input?.focus();
    return;
  }
  if (result === "miss") {
    showToast("Pas dans la liste — essaie encore");
    input?.focus();
  }
}

app.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "home") {
    renderHome();
    return;
  }
  if (action === "start") {
    beginRound();
    return;
  }
  if (action === "rules") {
    openRules();
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action='guess']");
  if (!form) return;
  event.preventDefault();
  onGuess(form);
});

renderHome();
