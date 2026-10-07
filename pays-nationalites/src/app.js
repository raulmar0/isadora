import "./styles.css";
import {
  COUNTRIES,
  COUNTRY_BY_ID,
  COUNTRY_IDS,
  COUNTRIES_BY_POSITION,
  nationalityLabel,
  formatGenderDisplay,
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
} from "./game.js";
import { sound } from "./audio.js";
import { WORLD_MAP_SVG } from "./map-data.js";

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
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 21V4m0 0h9l-1.5 3L14 10H5"/>',
  volumeOn: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  volumeOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
};

function icon(name, className = "") {
  return `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

function announce(text) {
  announcer.textContent = "";
  announcer.textContent = text;
}

function showToast(text, isAlert = false) {
  toastElement.hidden = false;
  toastElement.className = `toast ${isAlert ? "is-alert" : ""}`;
  toastElement.innerHTML = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastElement.hidden = true;
  }, 2200);
}

function header(isGame = false) {
  const isMuted = sound.isMuted();
  return `<header class="site-header">
    <button class="brand" data-action="home" aria-label="Pays et nationalités — Accueil">
      <span class="brand-mark" aria-hidden="true">${icon("flag")}</span>
      <span class="brand-type">Pays <span class="brand-amp">&</span> nationalités</span>
    </button>
    <nav aria-label="Navigation principale">
      <button class="icon-toggle-button sound-toggle" data-action="toggle-sound" aria-label="${isMuted ? "Activer le son" : "Couper le son"}" title="${isMuted ? "Activer le son" : "Couper le son"}">
        ${icon(isMuted ? "volumeOff" : "volumeOn")}
      </button>
      ${
        isGame
          ? '<button class="text-button home-link" data-action="home">' +
            icon("back") +
            "<span>Accueil</span></button>"
          : '<span class="language-tag"><span class="french-flag" aria-hidden="true"></span> En français</span>'
      }
      <button class="text-button rules-link" data-action="rules">${icon("help")}<span>Règles</span></button>
    </nav>
  </header>`;
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  return `0:${String(safe).padStart(2, "0")}`;
}

function renderFlagGenders(country, found) {
  const { isInvariant, m, f } = formatGenderDisplay(country);
  if (!found) {
    if (isInvariant) {
      return `<span class="gender-pill placeholder"><abbr class="gender-tag" title="Masculin et féminin">m./f.</abbr> ···</span>`;
    }
    return `
      <span class="gender-pill placeholder"><abbr class="gender-tag" title="Masculin">m.</abbr> ···</span>
      <span class="gender-pill placeholder"><abbr class="gender-tag" title="Féminin">f.</abbr> ···</span>
    `;
  }
  if (isInvariant) {
    return `<span class="gender-pill gender-mf" title="Masculin et féminin identiques"><abbr class="gender-tag">m./f.</abbr> ${m}</span>`;
  }
  return `
    <span class="gender-pill gender-m" title="Forme masculine"><abbr class="gender-tag">m.</abbr> ${m}</span>
    <span class="gender-pill gender-f" title="Forme féminine"><abbr class="gender-tag">f.</abbr> ${f}</span>
  `;
}

function flagCard(country, found) {
  const ariaLabel = found
    ? `${country.articleName} : masculin ${country.nationalityM}, féminin ${country.nationalityF}`
    : `Drapeau ${country.flag} à deviner`;

  return `
    <div class="flag-card ${found ? "is-found" : "is-unfound"}" data-country="${country.id}" role="button" tabindex="0" aria-label="${ariaLabel}">
      <span class="flag-emoji" aria-hidden="true">${country.flag}</span>
      <div class="flag-info">
        <div class="country-line">
          <span class="country-name ${found ? "" : "placeholder"}">${found ? country.articleName : "······"}</span>
        </div>
        <div class="gender-line">
          ${renderFlagGenders(country, found)}
        </div>
      </div>
    </div>
  `;
}

function mapPin(country, found) {
  const offsetClass = `offset-${country.labelOffset}`;
  return `
    <button type="button" class="map-pin ${found ? "is-found" : "is-unfound"} ${offsetClass}" data-pin="${country.id}" style="left:${country.mapX}%; top:${country.mapY}%;" ${found ? "" : "tabindex='-1'"} aria-label="${found ? country.articleName : "Pays à compléter"}">
      <span class="pin-beacon" aria-hidden="true"></span>
      <span class="pin-dot" aria-hidden="true"></span>
      <span class="pin-label">${found ? country.articleName : ""}</span>
    </button>
  `;
}

function playBoard() {
  const foundSet = new Set(round.found);

  const topCards = COUNTRIES_BY_POSITION.top
    .map((c) => flagCard(c, foundSet.has(c.id)))
    .join("");
  const leftCards = COUNTRIES_BY_POSITION.left
    .map((c) => flagCard(c, foundSet.has(c.id)))
    .join("");
  const rightCards = COUNTRIES_BY_POSITION.right
    .map((c) => flagCard(c, foundSet.has(c.id)))
    .join("");
  const bottomCards = COUNTRIES_BY_POSITION.bottom
    .map((c) => flagCard(c, foundSet.has(c.id)))
    .join("");

  const pins = COUNTRIES.map((c) => mapPin(c, foundSet.has(c.id))).join("");

  const inputDisabled = round.status !== "running" ? "disabled" : "";
  const urgent = round.secondsLeft <= 10 && round.status === "running";

  return `
    <div class="game-stage" aria-label="Plateau de jeu — Pays et nationalités">
      <!-- TOP PERIMETER: 6 flags -->
      <section class="perimeter-row perimeter-top" aria-label="Drapeaux du nord">
        ${topCards}
      </section>

      <!-- MIDDLE SECTION: Left flags, Center Map + Input, Right flags -->
      <div class="stage-middle">
        <!-- LEFT PERIMETER: 6 flags -->
        <aside class="perimeter-col perimeter-left" aria-label="Drapeaux de l'ouest">
          ${leftCards}
        </aside>

        <!-- CENTER WORLD MAP & CONTROLS -->
        <section class="stage-center">
          <div class="map-stage">
            ${WORLD_MAP_SVG}
            <div class="map-pins">${pins}</div>
            <div class="map-caption">
              <span class="map-tag">Carte du monde</span>
              <span class="map-status">${round.found.length} / ${COUNTRY_IDS.length} complétés</span>
            </div>
          </div>

          <div class="play-controls">
            <div class="meter" aria-live="polite">
              <div class="timer ${urgent ? "is-urgent" : ""}">
                ${icon("clock")}
                <span data-timer>${formatTime(round.secondsLeft)}</span>
              </div>
              <div class="scoreline">
                <strong data-score>${scoreOf(round)}</strong>
                <span class="score-total">/ ${COUNTRY_IDS.length}</span>
                <span class="score-rest">trouvés</span>
              </div>
            </div>

            <form class="guess-form" data-action="guess" autocomplete="off">
              <label class="sr-only" for="guess">Pays ou nationalité</label>
              <input id="guess" name="guess" type="text" inputmode="text" enterkeyhint="go" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Écris un pays ou une nationalité…" ${inputDisabled} />
              <button class="button button-primary submit-btn" type="submit" ${inputDisabled}>Valider</button>
            </form>

            <p class="hint">
              💡 <strong>Règle :</strong> un seul genre suffit (ex. <em>français</em> révèle <em>française</em>). Les pays s’affichent avec leur article (<em>la France</em>).
            </p>
          </div>
        </section>

        <!-- RIGHT PERIMETER: 6 flags -->
        <aside class="perimeter-col perimeter-right" aria-label="Drapeaux de l'est">
          ${rightCards}
        </aside>
      </div>

      <!-- BOTTOM PERIMETER: 6 flags -->
      <section class="perimeter-row perimeter-bottom" aria-label="Drapeaux du sud">
        ${bottomCards}
      </section>
    </div>
  `;
}

function renderHome() {
  screen = "home";
  stopTicking();
  round = newRound();
  app.innerHTML = `
    ${header()}
    <main id="main" class="home-main" tabindex="-1">
      <h1 class="sr-only">Pays et nationalités — Jeu minute</h1>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Jeu minute · Isadora Gazzi</p>
          <h2 class="hero-title">Nomme pays et nationalités.</h2>
          <p class="hero-lead">
            Au centre, la carte du monde avec les pays <strong>à compléter</strong>. Autour, les drapeaux avec les nationalités qui apparaissent <strong>au masculin et au féminin</strong>. Les pays viennent toujours avec leur <strong>article</strong> !
          </p>
          <div class="home-actions">
            <button class="button button-primary" data-action="start">
              Nouvelle partie ${icon("arrow")}
            </button>
            <button class="button button-secondary" data-action="rules">
              ${icon("help")} Règles du jeu
            </button>
          </div>
          <p class="best-line">
            ${
              storageAvailable
                ? `Meilleur score : <strong>${bestScore}</strong> / ${COUNTRY_IDS.length}`
                : "La sauvegarde du score est indisponible dans ce navigateur."
            }
          </p>
        </div>

        <div class="hero-preview" aria-hidden="true">
          <div class="preview-stage">
            <div class="preview-badge-top">
              <span class="preview-chip">🇨🇦 le Canada</span>
              <span class="preview-chip">🇩🇪 l’Allemagne</span>
            </div>
            <div class="preview-core">
              <div class="preview-globe">
                <span class="preview-pulse"></span>
                <span class="preview-pin">📍</span>
              </div>
              <div class="preview-reveal">
                <strong class="preview-country">la France</strong>
                <div class="preview-genders">
                  <span class="preview-pill">m. français</span>
                  <span class="preview-pill">f. française</span>
                </div>
              </div>
            </div>
            <div class="preview-badge-bottom">
              <span class="preview-chip">🇸🇳 le Sénégal</span>
              <span class="preview-chip">🇯🇵 le Japon</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderPlay() {
  screen = "play";
  app.innerHTML = `
    ${header(true)}
    <main id="main" class="play-main" tabindex="-1">
      <h1 class="sr-only">Partie en cours — Pays et nationalités</h1>
      ${playBoard()}
    </main>
  `;
  const input = app.querySelector("#guess");
  if (input && round.status === "running") {
    input.focus();
  }
}

function getPerformanceFeedback(score, total) {
  if (score === total) {
    return {
      badge: "Bravo ! Tout trouvé !",
      message: "Exceptionnel ! Tu connais tous les 24 pays avec leurs articles et leurs nationalités au masculin et au féminin !",
    };
  }
  if (score >= 18) {
    return {
      badge: "Excellent résultat !",
      message: "Tu as une excellente maîtrise du vocabulaire des pays et de leurs accords en français !",
    };
  }
  if (score >= 10) {
    return {
      badge: "Bien joué !",
      message: "Bonne progression ! Consulte la liste ci-dessous pour mémoriser les pays manqués.",
    };
  }
  return {
    badge: "Temps écoulé !",
    message: "Bel effort ! Observe bien les pays ci-dessous avec leur article et rejoue pour battre ton score.",
  };
}

function renderFinish() {
  screen = "finish";
  stopTicking();
  const score = scoreOf(round);
  const saved = saveBest(score, storage);
  bestScore = saved.best;
  storageAvailable = saved.available;

  const foundList = COUNTRIES.filter((c) => round.found.includes(c.id));
  const missedList = COUNTRIES.filter((c) => !round.found.includes(c.id));
  const feedback = getPerformanceFeedback(score, COUNTRY_IDS.length);

  app.innerHTML = `
    ${header(true)}
    <main id="main" class="finish-main" tabindex="-1">
      <section class="finish-summary">
        <div class="finish-hero">
          <p class="eyebrow">${feedback.badge}</p>
          <h2 class="hero-title">${score} <span class="finish-total">/ ${COUNTRY_IDS.length}</span></h2>
          <p class="hero-lead">${feedback.message}</p>
          <div class="home-actions">
            <button class="button button-primary" data-action="start">
              Rejouer ${icon("refresh")}
            </button>
            <button class="button button-secondary" data-action="home">
              ${icon("back")} Accueil
            </button>
          </div>
        </div>

        <div class="review-section">
          ${
            missedList.length > 0
              ? `
            <div class="review-group missed-group">
              <h3 class="review-heading missed-heading">
                À revoir (${missedList.length})
              </h3>
              <div class="review-grid">
                ${missedList
                  .map(
                    (c) => `
                  <div class="review-card missed-card">
                    <span class="flag-emoji">${c.flag}</span>
                    <div class="review-text">
                      <strong class="review-country">${c.articleName}</strong>
                      <span class="review-genders">
                        <span class="tag-m">m. ${c.nationalityM}</span> · <span class="tag-f">f. ${c.nationalityF}</span>
                      </span>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            `
              : ""
          }

          ${
            foundList.length > 0
              ? `
            <div class="review-group found-group">
              <h3 class="review-heading found-heading">
                Pays trouvés (${foundList.length})
              </h3>
              <div class="review-grid">
                ${foundList
                  .map(
                    (c) => `
                  <div class="review-card found-card">
                    <span class="flag-emoji">${c.flag}</span>
                    <div class="review-text">
                      <strong class="review-country">${c.articleName}</strong>
                      <span class="review-genders">
                        <span class="tag-m">m. ${c.nationalityM}</span> · <span class="tag-f">f. ${c.nationalityF}</span>
                      </span>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            `
              : ""
          }
        </div>
      </section>

      <section class="finish-board-view" aria-label="Carte récapitulative">
        <h3 class="sr-only">Carte finale</h3>
        ${playBoard()}
      </section>
    </main>
  `;
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
      sound.playVictory();
      announce(`Temps écoulé. Score : ${scoreOf(round)} sur ${COUNTRY_IDS.length}.`);
      renderFinish();
      return;
    }
    if (round.secondsLeft !== previous) {
      if (round.secondsLeft <= 5 && round.secondsLeft > 0) {
        sound.playTick();
      }
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
        <h2 id="dialog-title">Règles du jeu</h2>
        <button value="close" class="icon-button" aria-label="Fermer">${icon("close")}</button>
      </header>
      <div class="dialog-body">
        <ol>
          <li>Tu as <strong>${ROUND_SECONDS} secondes</strong> pour nommer un maximum de pays et nationalités.</li>
          <li>Écris soit le <strong>pays</strong> (avec ou sans article), soit la <strong>nationalité</strong>.</li>
          <li><strong>Les deux genres se révèlent :</strong> si tu dis <em>français</em> ou <em>française</em>, les deux formes s’affichent avec le pays !</li>
          <li>Au centre, la <strong>carte se complète</strong> avec les pays et leurs articles (<em>la France</em>, <em>le Mexique</em>, <em>les États-Unis</em>).</li>
        </ol>
        <div class="rules-example">
          <p><strong>Exemples de réponses valides :</strong></p>
          <p>• <em>France</em> ou <em>la France</em> → révèle 🇫🇷 la France (français / française)</p>
          <p>• <em>espagnol</em> ou <em>espagnole</em> → révèle 🇪🇸 l’Espagne (espagnol / espagnole)</p>
          <p>• <em>américain</em> ou <em>américaine</em> → révèle 🇺🇸 les États-Unis</p>
        </div>
      </div>
      <footer>
        <button class="button button-primary" value="close">Compris, je joue !</button>
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
  const { round: next, result, country, wrongArticle, expectedArticle } = applyGuess(
    round,
    value,
  );
  round = next;
  if (input) input.value = "";

  if (result === "hit") {
    sound.playHit();
    const mLabel = country.nationalityM;
    const fLabel = country.nationalityF;
    const natSummary =
      mLabel === fLabel ? mLabel : `${mLabel} (m.) / ${fLabel} (f.)`;

    let message = `✨ Trouvé ! <strong>${country.articleName}</strong> — ${natSummary}`;
    if (wrongArticle && expectedArticle) {
      message = `✨ Trouvé ! 💡 Attention : on dit <strong>${country.articleName}</strong> — ${natSummary}`;
    }

    showToast(message);
    announce(`Trouvé : ${country.articleName}. ${natSummary}.`);

    if (round.status === "finished") {
      sound.playVictory();
      renderFinish();
      return;
    }
    renderPlay();
    app.querySelector("#guess")?.focus();
    return;
  }

  if (result === "duplicate") {
    sound.playDuplicate();
    showToast(`Déjà trouvé : <strong>${country.articleName}</strong>`);
    input?.focus();
    return;
  }

  if (result === "miss") {
    showToast("Pas dans la liste — essaie encore !", true);
    input?.focus();
  }
}

// Global click handler
app.addEventListener("click", (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (actionEl) {
    const action = actionEl.dataset.action;
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
      return;
    }
    if (action === "toggle-sound") {
      sound.toggleMute();
      render();
      return;
    }
  }

  // Interactive tap on flag cards or map pins for helpful hints
  const cardEl = event.target.closest(".flag-card");
  if (cardEl && round.status === "running") {
    const countryId = cardEl.dataset.country;
    const country = COUNTRY_BY_ID[countryId];
    if (country) {
      if (round.found.includes(countryId)) {
        showToast(
          `🇫🇷 <strong>${country.articleName}</strong> : masculin <em>${country.nationalityM}</em>, féminin <em>${country.nationalityF}</em>`,
        );
      } else {
        const hintText = country.capital
          ? `💡 Indice : Capitale = ${country.capital}. Écris le pays ou sa nationalité !`
          : `💡 Indice : Écris ce pays avec son article (${country.article}) ou sa nationalité !`;
        showToast(hintText);
      }
      app.querySelector("#guess")?.focus();
    }
  }

  const pinEl = event.target.closest(".map-pin");
  if (pinEl && round.status === "running") {
    const pinId = pinEl.dataset.pin;
    const country = COUNTRY_BY_ID[pinId];
    if (country) {
      if (round.found.includes(pinId)) {
        showToast(`📍 <strong>${country.articleName}</strong> déjà complété !`);
      } else {
        showToast(
          `📍 Pays à compléter ! Indice : se trouve dans cette zone géographique.`,
        );
      }
      app.querySelector("#guess")?.focus();
    }
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action='guess']");
  if (!form) return;
  event.preventDefault();
  onGuess(form);
});

// Render initial view
renderHome();
