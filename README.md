# Isadora Gazzi

A simple directory for Isadora's French learning activities. The francophone island and the Qui est-ce ? artwork were created with Image Gen; the Pays et nationalités card is rendered from the game's own map and flags.

## Development

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

The development command builds `qui-est-ce/` (at `/quiestce/`, recovered unchanged from the project backup) and `pays-nationalites/` (at `/pays/`; how its map and flags are generated, and their licences, are in [pays-nationalites/README.md](pays-nationalites/README.md)). The default portal language is French, with a Spanish switch.

```sh
npm run check
npm test
npm run build
npm run test:e2e
```

Browser tests run against `dist/`, so build first. Before running them for the first time, install Chromium with `npx playwright install --with-deps chromium`. CI runs Chromium only; `npx playwright test -c playwright.cross.config.ts` runs the same suite in Firefox, WebKit and an iPhone viewport (install those browsers with `npx playwright install firefox webkit`).

The production output is in `dist/`, including both games. Serve this directory at the root of a static website. No backend or API keys are needed at runtime. Publication is not performed by the build command.

## Publication

GitHub Pages serves [isadoragazzi.com](https://isadoragazzi.com/). The workflow in `.github/workflows/deploy.yml` installs the locked dependencies, checks the game, builds the site, runs browser tests, and publishes `dist/` after each push to `main`. It can also be started manually from GitHub Actions. The existing custom domain is preserved by `public/CNAME`.

## Add an activity

Add an entry to `src/activities.ts` with its real destination, artwork, and ES/FR descriptions. Cards render automatically; add only activities that are ready to open.

## Visual resources

Generated shipping assets are in `public/images/`. Exact generation prompts and provenance are in [docs/image-prompts.md](docs/image-prompts.md). The island illustration was then divided by its own background so that the background becomes white; `mix-blend-mode: multiply` over the paper colour therefore leaves it invisible and the island keeps its soft shadow. Its four borders are faded to pure white as well, or the truncated edge of the cast shadow draws a straight line against the paper. `npm run build:poster` rebuilds the `srcset` and verifies that invariant.

DM Sans and Fraunces are self-hosted in `public/fonts/` with their SIL Open Font Licenses. The site ships no canvas and no animation loop: the island is a still illustration with a description in both languages.

**Fraunces is subset to the 21 characters the page actually draws** — the monogram, the headline and the card titles, none of which change with the language. That takes it from 67 KB to 12 KB, and it is why a new card title with an unfamiliar character would quietly fall back to Georgia. `tests/loading.spec.ts` compares the glyphs in use against the subset and fails if one escapes; regenerate the woff2 from Google Fonts with the new `&text=` set when it does.

## Loading

The island is the LCP element, so the build works to get it on screen early, and `tests/loading.spec.ts` keeps each piece honest:

- **The markup ships rendered.** `scripts/prerender.mjs` renders `<App />` at build time and the client hydrates it, instead of painting nothing until 72 KB of JavaScript arrives. `App` always starts in French for that reason: a first client render that disagreed with the HTML would make React discard it. A stored Spanish preference is applied right after hydration.
- **The hero is preloaded.** `vite.config.ts` injects a `<link rel="preload" as="image">` built from the same constants the `<img>` uses. Chrome pairs the two by resolved URL, so if they ever diverge the page downloads two bitmaps — hence one source of truth in `src/poster.ts` and a test that compares them.
- **The `srcset` stops at 1100px.** A 3× phone needs 1158 device pixels and a 2× desktop 1945; a 1400px candidate would serve the phone nothing but bytes. The reasoning, and the knob, are in `src/poster.ts`.

Measured on a throttled slow 4G profile, against the previous build: LCP 2588 → 1744 ms on desktop and 2580 → 1712 ms on a 3× phone, first contentful paint 1296 → 608 ms, and 418 → 280 KB over the wire.
