// Copies the 24 flags of the round from flag-icons (MIT) into public/flags,
// optimised with SVGO. Mexico and Spain carry detailed coats of arms (80 KB
// each); whole-unit precision brings them near 30 KB with no visible change
// at the sizes the game draws them.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { COUNTRIES } from "../src/countries.js";

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("flag-icons/package.json")), "flags", "4x3");
const target = fileURLToPath(new URL("../public/flags/", import.meta.url));
const COARSE = new Set(["mx", "es"]);

await mkdir(target, { recursive: true });
let total = 0;
for (const { code } of COUNTRIES) {
  const svg = await readFile(join(source, `${code}.svg`), "utf8");
  const { data } = optimize(svg, {
    multipass: true,
    floatPrecision: COARSE.has(code) ? 0 : 2,
  });
  await writeFile(join(target, `${code}.svg`), data);
  total += data.length;
}
await writeFile(
  join(target, "LICENSE.txt"),
  `Flags from flag-icons (https://github.com/lipis/flag-icons), optimised with SVGO.

The MIT License (MIT)

Copyright (c) 2013 Panayiotis Lipiridis

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`,
);
console.log(`${COUNTRIES.length} flags, ${(total / 1024).toFixed(1)} KB`);
