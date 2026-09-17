// Writes the rendered app into dist/index.html so the first paint does not wait
// for the bundle.
//
// Before this, the browser downloaded 72 KB of JavaScript, ran it, and only then
// had anything to show: first contentful paint sat at 1336 ms on a slow
// connection. The markup is the same one <App /> produces on the client, which
// is why App always starts in French — a client render that disagreed with this
// HTML would make React discard it and paint twice.
//
// Run after `vite build`, before the static copy is published.

import { build } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = path.join(root, 'dist/index.html');
const ssrDir = path.join(root, 'node_modules/.ssr-prerender');

await build({
  root,
  logLevel: 'warn',
  configFile: path.join(root, 'vite.config.ts'),
  build: {
    ssr: path.join(root, 'src/entry-server.tsx'),
    outDir: ssrDir,
    emptyOutDir: true,
    copyPublicDir: false,
  },
});

const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
const markup = render();

const source = await fs.readFile(html, 'utf8');
const empty = '<div id="root"></div>';
if (!source.includes(empty)) {
  throw new Error('dist/index.html no longer has an empty #root — prerender would not know where to put the markup.');
}
await fs.writeFile(html, source.replace(empty, `<div id="root">${markup}</div>`));
await fs.rm(ssrDir, { recursive: true, force: true });

console.log(`Prerendered ${markup.length} chars of markup into dist/index.html`);
