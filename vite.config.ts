import { defineConfig } from 'vite';
import type { PreviewServer, ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { POSTER_SIZES, POSTER_SRCSET } from './src/poster';

function serveGameDirectory(server: ViteDevServer | PreviewServer) {
  const games = ['/quiestce', '/pays'];
  server.middlewares.use((request, response, next) => {
    const [path, query] = (request.url ?? '').split('?');
    for (const game of games) {
      if (path === game) {
        response.writeHead(307, { Location: `${game}/${query ? `?${query}` : ''}` });
        response.end();
        return;
      }
      if (path === `${game}/`) {
        request.url = `${game}/index.html${query ? `?${query}` : ''}`;
        break;
      }
    }
    next();
  });
}

export default defineConfig({
  plugins: [react(), {
    name: 'game-directory-index',
    configureServer: serveGameDirectory,
    configurePreviewServer: serveGameDirectory,
  }, {
    // React injects the island, so the preload scanner never sees the LCP
    // element and the download does not start until the bundle has run: 1279ms
    // instead of 164ms on a slow connection. This link is written from the same
    // constants the <img> uses, because Chrome pairs a preload with its image
    // by resolved URL and downloads both if the two disagree.
    //
    // No href on purpose. With width descriptors the browser resolves the URL
    // from imagesrcset; a browser too old to understand that attribute would
    // use href to preload a candidate the <img> may not pick, and pay for two.
    name: 'preload-island-poster',
    transformIndexHtml: () => [{
      tag: 'link',
      attrs: {
        rel: 'preload',
        as: 'image',
        imagesrcset: POSTER_SRCSET,
        imagesizes: POSTER_SIZES,
        fetchpriority: 'high',
      },
      injectTo: 'head' as const,
    }],
  }],
  server: { host: '0.0.0.0' },
});
