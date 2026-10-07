export type Locale = 'es' | 'fr';

// Add a published activity here to give it a place in the directory.
export const activities = [
  {
    id: 'qui-est-ce',
    href: '/quiestce/',
    title: 'Qui est-ce ?',
    image: '/images/qui-est-ce.webp',
    copy: {
      es: {
        subtitle: 'Un objeto secreto. Mil buenas preguntas.',
        category: 'Vocabulario · Expresión oral',
        players: '2 jugadores',
        action: '¡Vamos a jugar!',
        imageAlt: 'Tablero de juego en miniatura con tarjetas de objetos y una tarjeta misteriosa.',
      },
      fr: {
        subtitle: 'Un objet secret. Mille bonnes questions.',
        category: 'Vocabulaire · Expression orale',
        players: '2 joueurs',
        action: 'On joue ?',
        imageAlt: 'Un plateau miniature avec des cartes d’objets et une carte mystère.',
      },
    },
  },
  {
    id: 'pays-nationalites',
    href: '/pays/',
    title: 'Pays et nationalités',
    image: '/images/pays-nationalites.webp',
    copy: {
      es: {
        subtitle: 'Un minuto. Países con artículo, nacionalidades en masculino y femenino.',
        category: 'Vocabulario · Geografía',
        players: '1 jugador',
        action: '¡Vamos a jugar!',
        imageAlt: 'Mapa del Atlántico con Francia, Senegal y Brasil completados y dos banderas con la nacionalidad en masculino y femenino.',
      },
      fr: {
        subtitle: 'Une minute. Pays avec article, nationalités au masculin et au féminin.',
        category: 'Vocabulaire · Géographie',
        players: '1 joueur',
        action: 'On joue ?',
        imageAlt: 'Une carte de l’Atlantique où la France, le Sénégal et le Brésil sont complétés, avec deux drapeaux et leur nationalité au masculin et au féminin.',
      },
    },
  },
];
