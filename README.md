# Isadora Gazzi

A simple directory for Isadora's French learning activities. The francophone island and the game artwork were created with Image Gen.

## Development

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

The development command builds the original `qui-est-ce/` game and serves it at `/quiestce/`. The game source, assets and fonts were recovered unchanged from the existing project backup. The default portal language is French, with a Spanish switch.

```sh
npm run check
npm test
npm run test:e2e
npm run build
```

Before running browser tests for the first time, install Chromium with `npx playwright install --with-deps chromium`.

The production output is in `dist/`, including the original game. Serve this directory at the root of a static website. No backend or API keys are needed at runtime. Publication is not performed by the build command.

## Publication

GitHub Pages serves [isadoragazzi.com](https://isadoragazzi.com/). The workflow in `.github/workflows/deploy.yml` installs the locked dependencies, checks the game, builds the site, runs browser tests, and publishes `dist/` after each push to `main`. It can also be started manually from GitHub Actions. The existing custom domain is preserved by `public/CNAME`.

## Add an activity

Add an entry to `src/activities.ts` with its real destination, artwork, and ES/FR descriptions. Cards render automatically; add only activities that are ready to open.

## Visual resources

Generated shipping assets are in `public/images/`. Exact generation prompts and provenance are in [docs/image-prompts.md](docs/image-prompts.md). The island illustration was then divided by its own background so that the background becomes white; `mix-blend-mode: multiply` over the paper colour therefore leaves it invisible and the island keeps its soft shadow.

DM Sans and Fraunces are self-hosted in `public/fonts/` with their SIL Open Font Licenses. The site ships no canvas and no animation loop: the island is a still illustration with a description in both languages.
