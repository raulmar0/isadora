// Renders the directory card for « Pays et nationalités » from the game's own
// material: the projected Natural Earth map, the flag files and the label
// style. Run after changing the map or the flags:
//   node scripts/build-pays-card.mjs
// It needs Playwright's Chromium (see the README) and writes
// public/images/pays-nationalites.webp with its provenance sidecar.

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { WORLD } from '../pays-nationalites/src/map-data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const game = join(root, 'pays-nationalites');
const output = join(root, 'public', 'images', 'pays-nationalites.webp');
const file = (path) => pathToFileURL(join(game, path)).href;

// The card is 3:2, but the directory crops it: to a 2.05–2.35:1 band on wide
// screens, and to a narrow portrait slice around 57% of the width on phones.
// France, its flag card and Senegal sit where both crops see them; Brazil
// completes the wide view. This window of the world map holds the Atlantic
// between the Americas, Europe and Africa.
const VIEW = { x: 178, y: 52, width: 480, height: 320 };
const FOUND = ['fr', 'br', 'sn', 'ca', 'es', 'ma'];
const TARGETS = ['us', 'mx', 'ar', 'pt', 'gb', 'it', 'de', 'be', 'nl', 'ch', 'dz', 've', 'ci', 'gr'];

const shapes = [...FOUND, ...TARGETS]
  .map((code) => `<path class="${FOUND.includes(code) ? 'found' : 'target'}" d="${WORLD.countries[code]}"/>`)
  .join('');

const at = (code) => {
  const [x, y] = WORLD.anchors[code];
  return `left:${((x - VIEW.x) / VIEW.width) * 100}%;top:${((y - VIEW.y) / VIEW.height) * 100}%`;
};

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face { font-family: "DM Sans"; font-weight: 400 700; src: url("${file('public/fonts/dm-sans-latin.woff2')}") format("woff2"); }
@font-face { font-family: Fraunces; font-weight: 500 700; src: url("${file('public/fonts/fraunces-latin.woff2')}") format("woff2"); }
* { box-sizing: border-box; }
body { margin: 0; width: 900px; height: 600px; overflow: hidden; background: #d4e5df; font-family: "DM Sans", sans-serif; color: #284967; }
.map { position: absolute; inset: 0; }
svg { display: block; width: 900px; height: 600px; }
.grat { fill: none; stroke: #c0d7cf; stroke-width: 1px; vector-effect: non-scaling-stroke; }
.land { fill: #efe8d6; }
.borders { fill: none; stroke: #fbf8f0; stroke-width: 1px; vector-effect: non-scaling-stroke; }
.target { fill: #e0cd9c; stroke: #8c6f30; stroke-width: 1px; vector-effect: non-scaling-stroke; }
.found { fill: #397570; stroke: #285752; stroke-width: 1px; vector-effect: non-scaling-stroke; }
.pill { position: absolute; transform: translate(-50%, -50%); padding: 7px 15px 8px; border-radius: 999px; background: #284967; color: #fffdf7; font-weight: 650; font-size: 23px; white-space: nowrap; box-shadow: 0 6px 14px -6px rgba(23, 44, 64, .6); }
.pill b { font-weight: 500; color: #e7b157; }
.blank { position: absolute; transform: translate(-50%, -50%); width: 58px; height: 30px; border-radius: 999px; border: 2px dashed #6f7b71; background: rgba(255, 253, 247, .8); }
.card { position: absolute; display: flex; align-items: center; gap: 14px; padding: 13px 18px 13px 14px; border-radius: 16px; background: #fffdf7; border: 1px solid #b7d0c6; box-shadow: 0 16px 30px -18px rgba(40, 73, 103, .55); font-size: 21px; line-height: 1.25; }
.card img { width: 62px; height: 46.5px; border-radius: 4px; box-shadow: 0 0 0 1px rgba(40, 73, 103, .15); }
.card span { display: block; font-weight: 600; white-space: nowrap; }
.card i { font-style: normal; font-weight: 700; font-size: .78em; margin-right: 8px; }
.m { color: #315f88; } .f { color: #a5472a; } .card em { font-style: normal; font-weight: 800; color: #a5472a; }
</style></head><body>
<div class="map">
  <svg viewBox="${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}" preserveAspectRatio="xMidYMid slice">
    <rect x="0" y="0" width="${WORLD.width}" height="${WORLD.height}" fill="#d4e5df"/>
    <path class="grat" d="${WORLD.graticule}"/>
    <path class="land" d="${WORLD.land}"/>
    ${shapes}
    <path class="borders" d="${WORLD.borders}"/>
  </svg>
</div>
<span class="pill" style="${at('fr')};margin-top:-6px"><b>la</b> France</span>
<span class="pill" style="${at('br')};margin-top:-40px;margin-left:-44px"><b>le</b> Brésil</span>
<span class="pill" style="${at('sn')};margin-left:104px"><b>le</b> Sénégal</span>
<span class="blank" style="${at('dz')};margin-left:26px;margin-top:6px"></span>
<span class="blank" style="${at('us')};margin-left:40px"></span>
<div class="card" style="left:336px;top:200px">
  <img src="${file('public/flags/fr.svg')}" alt="">
  <div><span class="m"><i>m.</i>français</span><span class="f"><i>f.</i>français<em>e</em></span></div>
</div>
<div class="card" style="left:36px;top:318px">
  <img src="${file('public/flags/br.svg')}" alt="">
  <div><span class="m"><i>m.</i>brésilien</span><span class="f"><i>f.</i>brésilien<em>ne</em></span></div>
</div>
</body></html>`;

const dir = await mkdtemp(join(tmpdir(), 'pays-card-'));
const page_ = join(dir, 'card.html');
await writeFile(page_, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  await page.goto(pathToFileURL(page_).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const png = await page.screenshot({ type: 'png' });
  // No image converter is needed: Chromium encodes WebP itself.
  const webp = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', 0.86).split(',')[1];
  }, png.toString('base64'));
  await writeFile(output, Buffer.from(webp, 'base64'));
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}
await writeFile(
  `${output}.json`,
  `${JSON.stringify(
    {
      source: 'Rendered by scripts/build-pays-card.mjs from the game itself: the Natural Earth map projected in pays-nationalites/src/map-data.js and the flag-icons flags in pays-nationalites/public/flags.',
      width: 900,
      height: 600,
    },
    null,
    2,
  )}\n`,
);
const size = (await readFile(output)).length;
console.log(`public/images/pays-nationalites.webp ${(size / 1024).toFixed(1)} KB`);
