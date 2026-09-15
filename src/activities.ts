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
];
