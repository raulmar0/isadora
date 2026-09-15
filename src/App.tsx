import { lazy, Suspense, useEffect, useState } from 'react';
import { activities } from './activities';
import type { Locale } from './activities';
import { Icon } from './components/Icon';
import SceneBoundary from './components/SceneBoundary';

const FrancophoneWorld = lazy(() => import('./components/FrancophoneWorld'));

const translations = {
  es: {
    atelier: 'Un petit monde de français',
    intro: 'Un pequeño rincón para jugar, explorar\ny aprender francés con Isadora.',
    explore: 'El francés nos lleva lejos.',
    drag: 'Arrastra y dale una vuelta al mundo',
    pause: 'Pausar animación', resume: 'Reanudar animación', reset: 'Restablecer vista',
    scene: 'Isla francófona en 3D. Arrastra para girarla. París, Quebec y Dakar en un pequeño mundo.',
    loading: 'Preparando un pequeño mundo…',
    soon: 'La próxima aventura está en camino.',
    more: 'Más juegos, pronto',
    made: 'Creado con curiosidad por Isadora Gazzi',
    skip: 'Ir a los juegos',
    games: 'Juegos para aprender francés',
    available: 'À vous de jouer',
  },
  fr: {
    atelier: 'Un petit monde de français',
    intro: 'Un petit coin pour jouer, explorer\net apprendre le français avec Isadora.',
    explore: 'Le français nous emmène loin.',
    drag: 'Faites glisser pour faire le tour du monde',
    pause: 'Mettre l’animation en pause', resume: 'Reprendre l’animation', reset: 'Recentrer la vue',
    scene: 'Île francophone en 3D. Faites glisser pour la tourner. Paris, Québec et Dakar dans un petit monde.',
    loading: 'Un petit monde prend forme…',
    soon: 'La prochaine aventure se prépare.',
    more: 'D’autres jeux arrivent',
    made: 'Créé avec curiosité par Isadora Gazzi',
    skip: 'Aller aux jeux',
    games: 'Jeux pour apprendre le français',
    available: 'À vous de jouer',
  },
};

function initialLocale(): Locale {
  try { return localStorage.getItem('isadora-locale') === 'fr' ? 'fr' : 'es'; } catch { return 'es'; }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return reduced;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [worldReady, setWorldReady] = useState(false);
  const [worldError, setWorldError] = useState(false);
  const reducedMotion = useReducedMotion();
  const t = translations[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('isadora-locale', locale); } catch { /* Preference is optional. */ }
  }, [locale]);

  return (
    <div className="atelier">
      <a className="skip-link" href="#jeux">{t.skip}</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label={`Isadora Gazzi — ${locale === 'es' ? 'Inicio' : 'Accueil'}`}>
          <span className="brand-monogram" aria-hidden="true">ig<span /></span>
          <span className="brand-name">Isadora Gazzi<span lang="fr">{t.atelier}</span></span>
        </a>
        <div className="header-note"><Icon name="spark" size={16} /><span>{t.explore}</span></div>
        <div className="language-switch" role="group" aria-label="Idioma / Langue">
          {(['es', 'fr'] as const).map(language => (
            <button key={language} type="button" lang={language} aria-label={language === 'es' ? 'Español' : 'Français'} aria-pressed={locale === language} onClick={() => setLocale(language)}>{language.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <main className="main-stage">
        <section className="welcome">
          <h1 lang="fr">Bonjour,<br /><em>la curiosité.</em><span className="title-star" aria-hidden="true"><Icon name="spark" size={37} /></span></h1>
          <p>{t.intro}</p>
        </section>

        <div className={`world-region ${worldReady ? 'is-ready' : ''} ${worldError ? 'has-error' : ''}`}>
          <div className="world-orbit orbit-one" aria-hidden="true" />
          <div className="world-orbit orbit-two" aria-hidden="true" />
          <div className="world-stamp" aria-hidden="true"><Icon name="globe" size={23} /><span>LE MONDE<br />EN FRANÇAIS</span></div>
          <div className="world-canvas" role="region" aria-label={t.scene}>
            {(!worldReady || worldError) && <img className="world-poster" src="/images/island-poster.webp" alt="" />}
            {!worldError && <SceneBoundary onError={() => setWorldError(true)}><Suspense fallback={null}><FrancophoneWorld reducedMotion={reducedMotion} paused={paused} resetKey={resetKey} onReady={() => setWorldReady(true)} onError={() => setWorldError(true)} /></Suspense></SceneBoundary>}
          </div>
          <div className="world-caption" aria-hidden="true"><span>Paris</span><i /><span>Québec</span><i /><span>Dakar</span></div>
          {!worldError && <div className="world-toolbar">
            <span className="drag-hint"><Icon name="hand" size={17} />{t.drag}</span>
            <div className="world-buttons">
              <button className="icon-button" type="button" aria-label={t.reset} title={t.reset} onClick={() => setResetKey(key => key + 1)}><Icon name="reset" size={18} /></button>
              {!reducedMotion && <button className="icon-button" type="button" aria-label={paused ? t.resume : t.pause} title={paused ? t.resume : t.pause} aria-pressed={paused} onClick={() => setPaused(value => !value)}><Icon name={paused ? 'play' : 'pause'} size={18} /></button>}
            </div>
          </div>}
        </div>

        <section className="activities" id="jeux" aria-label={t.games}>
          {activities.map(activity => {
            const copy = activity.copy[locale];
            return <a className="activity-card" href={activity.href} key={activity.id} aria-label={`${activity.title} — ${copy.action}`}>
              <div className="activity-art">
                <img src={activity.image} alt={copy.imageAlt} width="1536" height="1024" fetchPriority="high" />
                <span className="activity-sticker" lang="fr">{t.available}<Icon name="spark" size={12} /></span>
                <span className="players"><Icon name="people" size={13} />{copy.players}</span>
              </div>
              <div className="activity-info">
                <div className="activity-heading"><h2 lang="fr">{activity.title}</h2><span className="activity-arrow"><Icon name="arrow" size={22} /></span></div>
                <p>{copy.subtitle}</p>
                <div className="activity-bottom"><span>{copy.category}</span><span className="activity-action">{copy.action}</span></div>
              </div>
            </a>;
          })}
          <div className="coming-soon"><span className="coming-symbol"><Icon name="plus" size={16} /></span><span>{t.more}<small>{t.soon}</small></span></div>
        </section>
      </main>

      <footer className="site-footer"><span>{t.made}</span><span className="footer-signoff" lang="fr">À bientôt, les curieux !<Icon name="spark" size={15} /></span></footer>
    </div>
  );
}
