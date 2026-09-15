import { defineConfig } from 'vite';
import type { PreviewServer, ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

function serveGameDirectory(server: ViteDevServer | PreviewServer) {
  server.middlewares.use((request, response, next) => {
    const [path, query] = (request.url ?? '').split('?');
    if (path === '/quiestce') {
      response.writeHead(307, { Location: `/quiestce/${query ? `?${query}` : ''}` });
      response.end();
      return;
    }
    if (path === '/quiestce/') {
      request.url = `/quiestce/index.html${query ? `?${query}` : ''}`;
    }
    next();
  });
}

export default defineConfig({
  plugins: [react(), {
    name: 'game-directory-index',
    configureServer: serveGameDirectory,
    configurePreviewServer: serveGameDirectory,
  }],
  server: { host: '0.0.0.0' },
});
