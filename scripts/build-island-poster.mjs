// Builds the island poster from docs/artwork-originals/island-poster.png.
//
// The page paints the poster with mix-blend-mode: multiply over the paper
// colour, so the bitmap's background has to be pure white and — this is the
// part that bites — so do its four borders. The original artwork lets the cast
// shadow run off the left edge of the frame; multiply turns that truncation
// into a straight vertical seam against the paper. Two steps fix it:
//
//   1. divide every channel by a bilinear estimate of the cream background,
//      sampled from four 12x12 corner patches, so the background becomes white;
//   2. fade each border to pure white with a smoothstep ramp, applied at source
//      resolution before the downscale. Each ramp is narrower than that edge's
//      empty margin, so it only lifts background and the outer tail of the
//      shadow, never the illustration.
//
// WebP's quantiser can still hand back 253 on a border it was given as 255, and
// not monotonically in quality: 900px survives q84 but not q86. So every width
// is verified after decoding and walks up the quality ladder until its borders
// come back clean. Never skip that check — a border below 255 is the seam.
//
// Usage: node scripts/build-island-poster.mjs [--check]
//        --check rebuilds in memory and reports whether the files on disk match.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// libwebp (wasm) ships inside playwright-core, already a devDependency.
const { utils } = require(
  path.join(path.dirname(require.resolve('playwright-core/package.json')), 'lib', 'coreBundle.js'),
);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'docs/artwork-originals/island-poster.png');
const OUT_DIR = path.join(root, 'public/images');

// Widths the page can ask for — kept in step with src/poster.ts, which is where
// the reasoning for the 1100px ceiling lives.
export const WIDTHS = [700, 900, 1100];
const QUALITY_LADDER = [86, 84, 88, 90, 82];
const ASPECT = 933 / 1400;

// Ramp widths in source pixels, each inside that edge's empty margin
// (solid art starts 82px from the left, 81 right, 28 top, 48 bottom).
const RAMP = { left: 78, right: 32, top: 20, bottom: 28 };
const PATCH = 12;

export const posterName = width => `island-${width}.webp`;
export const posterHeight = width => Math.round(width * ASPECT);

/* ---------------------------------------------------------------- PNG input */

function decodePNG(file) {
  const buf = fs.readFileSync(file);
  let offset = 8, width, height, depth, colorType, interlace;
  const idat = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (depth !== 8 || colorType !== 2 || interlace) {
    throw new Error(`${file}: expected 8-bit non-interlaced RGB`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 3;
  const out = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= 3 ? cur[x - 3] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= 3 ? prev[x - 3] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`unsupported PNG filter ${filter}`);
      cur[x] = v & 255;
    }
  }
  return { width, height, data: out };
}

/* ------------------------------------------------- normalise + fade borders */

const smoothstep = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

function normalise({ width: w, height: h, data }) {
  const patch = (x0, y0) => {
    const sum = [0, 0, 0];
    for (let y = y0; y < y0 + PATCH; y++) {
      for (let x = x0; x < x0 + PATCH; x++) {
        const i = (y * w + x) * 3;
        sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2];
      }
    }
    return sum.map(v => v / (PATCH * PATCH));
  };
  const tl = patch(0, 0), tr = patch(w - PATCH, 0);
  const bl = patch(0, h - PATCH), br = patch(w - PATCH, h - PATCH);

  const out = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const fade = Math.max(smoothstep(1 - y / RAMP.top), smoothstep(1 - (h - 1 - y) / RAMP.bottom));
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const a = Math.max(fade,
        smoothstep(1 - x / RAMP.left), smoothstep(1 - (w - 1 - x) / RAMP.right));
      const i = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        const bg = (1 - u) * (1 - v) * tl[c] + u * (1 - v) * tr[c]
                 + (1 - u) * v * bl[c] + u * v * br[c];
        const value = data[i + c] / bg;         // 1.0 == paper
        out[i + c] = value + (1 - value) * a;   // fade towards white at the borders
      }
    }
  }
  return out;
}

/* --------------------------------------------------------- Lanczos-3 resize */

function lanczos(x, a) {
  if (x === 0) return 1;
  if (Math.abs(x) >= a) return 0;
  const p = Math.PI * x;
  return (a * Math.sin(p) * Math.sin(p / a)) / (p * p);
}

function kernel(from, to, a) {
  const scale = to / from, support = a / Math.min(scale, 1), rows = [];
  for (let i = 0; i < to; i++) {
    const center = (i + 0.5) / scale - 0.5;
    const idx = [], weights = [];
    let total = 0;
    for (let j = Math.ceil(center - support); j <= Math.floor(center + support); j++) {
      const weight = lanczos((j - center) * Math.min(scale, 1), a);
      if (weight === 0) continue;
      idx.push(Math.min(from - 1, Math.max(0, j)));
      weights.push(weight);
      total += weight;
    }
    rows.push({ idx, weights: weights.map(weight => weight / total) });
  }
  return rows;
}

function resize(src, w, h, dw, dh) {
  const kx = kernel(w, dw, 3), ky = kernel(h, dh, 3);
  const tmp = new Float64Array(dw * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < dw; x++) {
      const { idx, weights } = kx[x];
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = 0; k < idx.length; k++) s += src[(y * w + idx[k]) * 3 + c] * weights[k];
        tmp[(y * dw + x) * 3 + c] = s;
      }
    }
  }
  const out = new Float64Array(dw * dh * 3);
  for (let y = 0; y < dh; y++) {
    const { idx, weights } = ky[y];
    for (let x = 0; x < dw; x++) {
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = 0; k < idx.length; k++) s += tmp[(idx[k] * dw + x) * 3 + c] * weights[k];
        out[(y * dw + x) * 3 + c] = s;
      }
    }
  }
  return out;
}

/* ----------------------------------------------------------- encode + check */

// The quantiser nudges borders it was handed as 255, so hand it a 2px white
// frame and check what comes back out.
const FRAME = 2;

function toRgba(plane, w, h) {
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, j = (y * w + x) * 3;
      const framed = x < FRAME || y < FRAME || x >= w - FRAME || y >= h - FRAME;
      for (let c = 0; c < 3; c++) {
        rgba[i + c] = framed ? 255 : Math.max(0, Math.min(255, Math.round(plane[j + c] * 255)));
      }
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function worstBorder(webp) {
  const { width: w, height: h, data } = utils.decodeWebp(webp);
  let worst = 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x !== 0 && y !== 0 && x !== w - 1 && y !== h - 1) continue;
      const i = (y * w + x) * 4;
      worst = Math.min(worst, data[i], data[i + 1], data[i + 2]);
    }
  }
  return worst;
}

function encodeAt(plane, w, h) {
  const rgba = toRgba(plane, w, h);
  const tried = [];
  for (const quality of QUALITY_LADDER) {
    const webp = utils.encodeWebp({ data: rgba, width: w, height: h }, { quality });
    const border = worstBorder(webp);
    tried.push(`q${quality}${border === 255 ? '' : `(border ${border})`}`);
    if (border === 255) return { webp, quality, tried };
  }
  throw new Error(`${w}px: no quality kept the borders pure white — tried ${tried.join(', ')}`);
}

/* ---------------------------------------------------------------------- run */

const check = process.argv.includes('--check');
const master = decodePNG(SOURCE);
const plane = normalise(master);
const manifest = [];
let stale = 0;

for (const width of WIDTHS) {
  const height = posterHeight(width);
  const scaled = width === master.width && height === master.height
    ? plane
    : resize(plane, master.width, master.height, width, height);
  const { webp, quality, tried } = encodeAt(scaled, width, height);
  const file = path.join(OUT_DIR, posterName(width));
  const current = fs.existsSync(file) ? fs.readFileSync(file) : null;
  const same = current !== null && Buffer.compare(current, webp) === 0;
  if (!same) stale++;
  if (!check) fs.writeFileSync(file, webp);
  manifest.push({ width, height, quality, bytes: webp.length });
  console.log(
    `${String(width).padStart(5)}x${String(height).padEnd(4)}  q${quality}  ` +
    `${String(webp.length).padStart(7)} B  borders clean` +
    (tried.length > 1 ? `  (fell back from ${tried.slice(0, -1).join(', ')})` : '') +
    (check ? `  ${same ? 'up to date' : 'STALE'}` : ''),
  );
}

if (check) {
  console.log(stale === 0 ? 'up to date' : `${stale} file(s) stale: run without --check`);
  process.exitCode = stale === 0 ? 0 : 1;
} else {
  console.log(`\nsrcset total ${manifest.reduce((n, m) => n + m.bytes, 0)} B across ${manifest.length} widths`);
}
