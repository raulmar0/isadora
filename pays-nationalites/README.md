# Pays et nationalités

Jeu minute pour la classe de français : nommer le plus de pays et de nationalités possible. Au centre, la carte du monde se complète avec le nom des pays et leur article ; autour, les drapeaux montrent la nationalité au masculin et au féminin.

**Jouer : https://isadoragazzi.com/pays/**

## Règles

- Une partie dure 1, 2 ou 3 minutes (1 par défaut ; le choix est mémorisé, avec un record par durée).
- Une seule réponse suffit : le pays (*la France*, *France*) ou la nationalité (*français*, *française*) complète la carte **et** le drapeau, avec les deux genres.
- L’article est facultatif à la saisie mais toujours affiché. Un mauvais article compte quand même et le jeu le corrige (*On dit la France, pas le France*).
- Accents, majuscules et apostrophes sont facultatifs. La réponse est validée dès qu’elle est complète ; si elle peut encore s’allonger (*japonais* → *japonaise*), le jeu attend une courte pause ou la touche Entrée. Les lettres qui terminent une réponse déjà comptée (*japonaise* + *s*, *le Japon* + *ais*) ne restent pas dans le champ.
- *Les Français*, *italiennes* comptent aussi : le jeu rappelle les formes au singulier. Un article espagnol (*el Japón*) est corrigé comme un mauvais article.
- Un mot espagnol ou anglais (*Alemania*, *Germany*), un pays qui n’est pas sur la carte (*iranienne*), un continent (*européenne*) ou une faute d’une lettre reçoivent chacun leur message.
- Lire les règles pendant une partie arrête le chrono.
- À la fin, le même plateau devient le corrigé : les réponses manquées apparaissent en ocre.

## Développement

```sh
npm ci
npm run dev
npm test
npm run build
```

Application statique HTML/CSS/JS avec Vite (`base: './'`), sans backend. Les tests de navigateur du jeu sont dans `../tests/pays.spec.ts` et tournent avec ceux du site.

## Carte et drapeaux

La carte n’est pas dessinée à la main : `src/map-data.js` est généré par `npm run build:map` à partir de Natural Earth 1:50m (domaine public, via `world-atlas`). Le monde est en projection Patterson ; l’Europe de l’Ouest, trop petite à cette échelle, a un zoom en projection conique placé dans le Pacifique Sud. Les tracés sont projetés et simplifiés à l’avance, le navigateur ne charge aucune bibliothèque de géographie.

La position des noms se règle dans `scripts/build-map.mjs` (longitude et latitude pour le monde, unités du zoom pour l’Europe). Après un changement, les tests de navigateur vérifient qu’aucun nom ne chevauche un autre et que tout le plateau tient dans un écran de 1080×600, 1366×650 et 1920×1000.

Les drapeaux viennent de [flag-icons](https://github.com/lipis/flag-icons) (MIT, licence dans `public/flags/LICENSE.txt`) et sont optimisés par `npm run build:flags`. Le Mexique et l’Espagne, dont les armoiries pèsent 80 Ko, passent à environ 30 Ko sans différence visible. Ce sont de vrais fichiers SVG : les émojis de drapeaux ne s’affichent pas sous Windows.

Les deux scripts ne tournent pas pendant le build ; leur résultat est versionné.
