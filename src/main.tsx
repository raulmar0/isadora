import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.getElementById('root')!;
const tree = <React.StrictMode><App /></React.StrictMode>;

// The production build ships the markup already rendered (scripts/prerender.mjs),
// so hydrate it instead of throwing it away and painting it a second time.
// `vite dev` serves an empty root, hence the branch.
if (root.firstChild) ReactDOM.hydrateRoot(root, tree);
else ReactDOM.createRoot(root).render(tree);
