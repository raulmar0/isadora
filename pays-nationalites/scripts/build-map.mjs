// Builds src/map-data.js from Natural Earth (via world-atlas): a world map in
// the Patterson projection and a zoom on Europe, already projected to SVG
// paths so the browser ships no geography library. Run `npm run build:map`
// after changing the extents or the label positions below; the output is
// committed.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { geoPatterson } from "d3-geo-projection";
import { merge, mesh } from "topojson-client";
import {
  filter,
  filterAttachedWeight,
  presimplify,
  simplify,
  sphericalTriangleArea,
} from "topojson-simplify";
import polylabel from "polylabel";

const require = createRequire(import.meta.url);
const source = JSON.parse(readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8"));
const output = fileURLToPath(new URL("../src/map-data.js", import.meta.url));

// ISO 3166-1 numeric (Natural Earth ids) → the alpha-2 codes used in countries.js.
const CODES = {
  124: "ca", 826: "gb", 528: "nl", 56: "be", 276: "de", 756: "ch", 300: "gr", 156: "cn",
  392: "jp", 356: "in", 36: "au", 788: "tn", 12: "dz", 504: "ma", 686: "sn", 384: "ci",
  32: "ar", 76: "br", 840: "us", 484: "mx", 620: "pt", 724: "es", 250: "fr", 380: "it",
};
const ANTARCTICA = 10;

// Label positions as [longitude, latitude, alignment]. "c" centres the label
// on the point; "l" and "r" put its left or right edge there, for callouts
// that sit in the sea beside a small country.
const WORLD_LABELS = {
  ca: [-103, 60.5, "c"],
  us: [-99, 39.5, "c"],
  mx: [-104, 23.5, "c"],
  br: [-51.5, -9, "c"],
  ar: [-50, -40, "l"],
  sn: [-26, 14.5, "r"],
  ci: [-7, -2.5, "c"],
  ma: [-17, 29.5, "r"],
  dz: [3, 23.2, "c"],
  tn: [17, 31.6, "l"],
  in: [79, 21, "c"],
  cn: [101, 34.5, "c"],
  jp: [147, 37, "l"],
  au: [134, -25, "c"],
};

// In the zoom the parallels bend (conic projection) and every label competes
// with its neighbours, so these are placed in the zoom's own units (600 wide)
// and checked for overlaps in the browser at every screen size.
const EUROPE_LABELS = {
  gb: [165, 57, "c"],
  nl: [326, 109, "l"],
  de: [378, 166, "l"],
  be: [209, 182, "r"],
  fr: [246, 240, "c"],
  ch: [362, 246, "l"],
  it: [402, 303, "c"],
  gr: [517, 364, "c"],
  es: [240, 318, "c"],
  pt: [10, 375, "l"],
};

// The zoom covers Western Europe and the Mediterranean shore of the Maghreb.
const EUROPE = { west: -17, east: 30, south: 34.6, north: 60.6 };

function topology(minWeight, minRing) {
  let t = presimplify(structuredClone(source), sphericalTriangleArea);
  t = simplify(t, minWeight);
  t = filter(t, filterAttachedWeight(t, minRing, sphericalTriangleArea));
  t.objects.countries.geometries = t.objects.countries.geometries.filter(
    (g) => Number(g.id) !== ANTARCTICA,
  );
  return t;
}

/** Absolute "M…L…Z" path → relative commands in tenths of a unit: about half the bytes. */
function compact(d) {
  if (!d) return "";
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const fmt = (n) => (n / 10).toString().replace(/^(-?)0\./, "$1.");
  let out = "";
  const number = (text) => {
    out += text.startsWith("-") || /[a-z]$/.test(out) || out === "" ? text : ` ${text}`;
  };
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let command = "";
  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i];
    if (token === "Z") {
      out += "z";
      cx = sx;
      cy = sy;
      i += 1;
      continue;
    }
    if (token === "M" || token === "L") {
      command = token;
      i += 1;
      continue;
    }
    const x = Math.round(Number(tokens[i]) * 10);
    const y = Math.round(Number(tokens[i + 1]) * 10);
    i += 2;
    if (command === "M") {
      out += "m";
      number(fmt(x - cx));
      number(fmt(y - cy));
      cx = sx = x;
      cy = sy = y;
      command = "L";
      continue;
    }
    if (x === cx && y === cy) continue;
    number(fmt(x - cx));
    number(fmt(y - cy));
    cx = x;
    cy = y;
  }
  return out;
}

function round(point) {
  return [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10];
}

function largestRing(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let best = polygons[0];
  let bestArea = -1;
  for (const polygon of polygons) {
    const area = geoArea({ type: "Polygon", coordinates: polygon });
    if (area > bestArea) {
      bestArea = area;
      best = polygon;
    }
  }
  return best;
}

function project({ t, projection, width, height, labels, labelUnits = false, only }) {
  const path = geoPath(projection).digits(2);
  // Natural Earth gives Australia's code to the Ashmore and Cartier Islands
  // too: gather every shape of a code before drawing it.
  const groups = {};
  for (const geometry of t.objects.countries.geometries) {
    const code = CODES[Number(geometry.id)];
    if (!code || (only && !only.includes(code))) continue;
    (groups[code] ??= []).push(geometry);
  }
  const countries = {};
  const anchors = {};
  for (const [code, geometries] of Object.entries(groups)) {
    const shape = merge(t, geometries);
    const d = path(shape);
    if (!d) continue;
    countries[code] = compact(d);
    const ring = largestRing(shape).map((r) => r.map((c) => projection(c)));
    anchors[code] = round(polylabel(ring, 0.5));
  }
  const placed = {};
  for (const [code, [lon, lat, align]] of Object.entries(labels)) {
    // [x, y] in map units when labelUnits is set, [longitude, latitude] otherwise.
    placed[code] = { at: labelUnits ? [lon, lat] : round(projection([lon, lat])), align };
  }
  return {
    width,
    height,
    land: compact(path(merge(t, t.objects.countries.geometries))),
    borders: compact(path(mesh(t, t.objects.countries, (a, b) => a !== b))),
    countries,
    anchors,
    labels: placed,
  };
}

// --- World -----------------------------------------------------------------
const WIDTH = 1000;
const world = geoPatterson().rotate([-10, 0]);
world.scale(1).translate([0, 0]);
const span = world([190 - 1e-9, 0])[0] - world([-170 + 1e-9, 0])[0];
world.scale(WIDTH / span).translate([WIDTH / 2, 0]);
const top = world([10, 83.7])[1] - 3;
const bottom = world([10, -57.5])[1];
world.translate([WIDTH / 2, -top]);
const HEIGHT = Math.round(bottom - top);

const worldMap = project({
  t: topology(3e-5, 2e-4),
  projection: world,
  width: WIDTH,
  height: HEIGHT,
  labels: WORLD_LABELS,
});
worldMap.graticule = compact(
  geoPath(world).digits(2)(
    geoGraticule()
      .step([30, 30])
      .extent([[-180, -60], [180.0001, 90]])(),
  ),
);
const edge = [];
for (let lon = EUROPE.west; lon <= EUROPE.east; lon += 0.5) edge.push([lon, EUROPE.north]);
for (let lat = EUROPE.north; lat >= EUROPE.south; lat -= 0.5) edge.push([EUROPE.east, lat]);
for (let lon = EUROPE.east; lon >= EUROPE.west; lon -= 0.5) edge.push([lon, EUROPE.south]);
for (let lat = EUROPE.south; lat <= EUROPE.north; lat += 0.5) edge.push([EUROPE.west, lat]);
worldMap.europeFrame = compact(`M${edge.map((p) => world(p).map((v) => v.toFixed(2)).join(",")).join("L")}Z`);

// --- Europe ----------------------------------------------------------------
const europeWidth = 600;
const europe = geoConicConformal().parallels([38, 56]).rotate([-6.5, 0]).center([0, 47]);
const frame = {
  type: "Polygon",
  coordinates: [[
    [EUROPE.west, EUROPE.south],
    [EUROPE.west, EUROPE.north],
    [EUROPE.east, EUROPE.north],
    [EUROPE.east, EUROPE.south],
    [EUROPE.west, EUROPE.south],
  ]],
};
europe.fitWidth(europeWidth, frame);
const [[fx0, fy0], [, fy1]] = geoPath(europe).bounds(frame);
const [tx, ty] = europe.translate();
europe.translate([tx - fx0, ty - fy0]);
const europeHeight = Math.round(fy1 - fy0);
europe.clipExtent([[0, 0], [europeWidth, europeHeight]]);

const europeMap = project({
  t: topology(3e-7, 1e-6),
  projection: europe,
  width: europeWidth,
  height: europeHeight,
  labels: EUROPE_LABELS,
  labelUnits: true,
  only: ["gb", "pt", "es", "fr", "be", "nl", "de", "ch", "it", "gr", "ma", "dz", "tn"],
});

// Where the zoom sits on the world map: the empty South Pacific, bottom left.
const insetWidth = 262;
worldMap.inset = {
  x: 10,
  y: Math.round(HEIGHT - 10 - insetWidth * (europeHeight / europeWidth)),
  width: insetWidth,
  height: Math.round(insetWidth * (europeHeight / europeWidth)),
};

const banner = `// Generated by scripts/build-map.mjs from Natural Earth 1:50m (public domain)
// through world-atlas (ISC, © 2013-2019 Michael Bostock). Do not edit by hand.
`;
writeFileSync(
  output,
  `${banner}export const WORLD = ${JSON.stringify(worldMap)};\n\nexport const EUROPE = ${JSON.stringify(europeMap)};\n`,
);
const kb = (s) => `${(JSON.stringify(s).length / 1024).toFixed(1)} KB`;
console.log(`world ${WIDTH}×${HEIGHT} ${kb(worldMap)} · europe ${europeWidth}×${europeHeight} ${kb(europeMap)}`);
