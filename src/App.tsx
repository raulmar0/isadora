import { useEffect, useState } from 'react';
import { activities } from './activities';
import type { Locale } from './activities';
import { Icon } from './components/Icon';

const translations = {
  es: {
    island: 'Una isla flotante en miniatura: la torre Eiffel y un café parisino, una mezquita de adobe, un baobab, casas quebequesas y un río con un puente de piedra.',
    soon: 'La próxima aventura está en camino.',
    more: 'Más juegos, pronto',
    skip: 'Ir a los juegos',
    games: 'Juegos para aprender francés',
    available: 'À vous de jouer',
  },
  fr: {
    island: 'Une île flottante miniature : la tour Eiffel et un café parisien, une mosquée de terre, un baobab, des maisons québécoises et une rivière franchie par un pont de pierre.',
    soon: 'La prochaine aventure se prépare.',
    more: 'D’autres jeux arrivent',
    skip: 'Aller aux jeux',
    games: 'Jeux pour apprendre le français',
    available: 'À vous de jouer',
  },
};

// A fresh key: the previous one was written on every visit, so it holds a
// language nobody chose and would keep old visitors away from the default.
const localeKey = 'isadora-langue';

function initialLocale(): Locale {
  try { return localStorage.getItem(localeKey) === 'es' ? 'es' : 'fr'; } catch { return 'fr'; }
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = translations[locale];

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  // Only a deliberate choice is remembered.
  function chooseLocale(language: Locale) {
    setLocale(language);
    try { localStorage.setItem(localeKey, language); } catch { /* Preference is optional. */ }
  }

  return (
    <div className="atelier">
      <a className="skip-link" href="#jeux">{t.skip}</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label={`Isadora Gazzi — ${locale === 'es' ? 'Inicio' : 'Accueil'}`}>
          <span className="brand-monogram" aria-hidden="true">ig<span /></span>
          <span className="brand-name">Isadora Gazzi</span>
        </a>
        <div className="language-switch" role="group" aria-label="Idioma / Langue">
          {(['es', 'fr'] as const).map(language => (
            <button key={language} type="button" lang={language} aria-label={language === 'es' ? 'Español' : 'Français'} aria-pressed={locale === language} onClick={() => chooseLocale(language)}>{language.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <main className="main-stage">
        <section className="welcome">
          <h1 lang="fr">Bonjour,<br /><em>la curiosité.</em><span className="title-star" aria-hidden="true"><Icon name="spark" size={37} /></span></h1>
        </section>

        <div className="world-region">
          <div className="world-orbit orbit-one" aria-hidden="true" />
          <div className="world-orbit orbit-two" aria-hidden="true" />
          <img className="world-poster" src="/images/island-paper.webp" alt={t.island} width="1400" height="933" fetchPriority="high" />
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
    </div>
  );
}
