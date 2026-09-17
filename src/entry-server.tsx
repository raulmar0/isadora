// Server entry for the build-time prerender. See scripts/prerender.mjs.
//
// The page is static once it is painted, so there is no reason to make a
// visitor download and run 72 KB of JavaScript before any text appears. This
// renders the same <App /> to a string at build time; the client then hydrates
// it. App starts in French unconditionally so both renders agree.
import { renderToString } from 'react-dom/server';
import App from './App';

export function render(): string {
  return renderToString(<App />);
}
