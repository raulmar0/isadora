# Illustrations

Generated with the built-in Image Gen tool. The game uses one 6 × 4 sprite atlas containing all 23 objects, in the order in `src/items.js`. The final empty cell is not used. Labels are real French text in the app, so they remain sharp and accessible.

Final asset: [public/assets/objects.png](../public/assets/objects.png). A few cards use a small CSS crop offset, defined in `src/items.js`, to keep adjacent illustrations out of the visible area.

## Original generation prompt

Use case: scientific-educational
Asset type: ONE production sprite atlas image for a French classroom guessing game, made of a precise 6-column by 4-row grid of 24 equal square cells. Landscape aspect ratio 3:2, preferably 1536x1024. This is a single spritesheet, not a screenshot of a website.
Primary request: Illustrate 23 clearly recognizable everyday objects for students, each wholly contained and centered within its own exact cell. The 24th cell is empty white. The cells have no borders and the entire background is pure white (#ffffff).
Style/medium: charming editorial gouache and colored-pencil illustrations, tactile matte painted surfaces, slightly imperfect dark ink details, rounded forms, sophisticated playful schoolbook style. Consistent three-quarter perspective, subtle natural shadows. Each object fills about 65–75% of its cell with generous pure white space around it so the image can be used as CSS sprites. Rich cobalt blue, warm coral, golden yellow and sage green accents. No faces on objects.
Composition: The image has EXACTLY six equal columns and four equal rows with no outer margins and no gutters, each object centered at the middle of the appropriate cell. Every object is completely separated from adjacent cells. Do not add any labels, numbers, letters, captions, logos, borders, patterns or decorative filler.
Exact cell sequence, reading left to right:
ROW 1: 1. one classic black-and-white soccer ball; 2. one mint-green kick scooter with two small wheels, standing upright; 3. one cobalt-blue handheld video-game console with a dark screen and coral controls; 4. one open pale-blue laptop computer; 5. one closed coral-red hardcover book with cream page edges and a small bookmark, no writing; 6. one pair of dark-blue over-ear audio headphones.
ROW 2: 1. one coral smartphone with a light screen; 2. one pair of blue round eyeglasses; 3. one golden-yellow school backpack; 4. one soft sage-green zippered pencil case, closed; 5. one blue ballpoint pen with cap and clip; 6. a small fanned set of six brightly colored pencils.
ROW 3: 1. one chunky white glue stick with a yellow cap and simple blue band, no writing; 2. one thick coral felt-tip marker with its cap placed alongside it; 3. one single wooden graphite pencil with yellow lacquer and pink eraser; 4. one pair of scissors with coral handles and visible gray metal blades; 5. one simple wooden classroom table with a golden-brown top and four blue legs; 6. one two-tone pink and blue rectangular eraser.
ROW 4: 1. one golden wooden school ruler with small dark measurement tick marks but no numbers; 2. one classroom chair with blue painted metal legs and a pale wooden seat and back; 3. one coral skateboard showing its deck and four wheels; 4. one mint-green classic bicycle with two equal wheels, saddle and handlebars; 5. one pair of blush-pink ballet slippers with delicate ribbons; 6. completely empty white.
Constraints: all 23 requested objects exactly once in exactly the specified cell order; no missing, duplicate or substituted objects; no other objects; no people; no text; no watermark. Keep exact uniform square-cell alignment for CSS sprites.

## Final editing prompt

Use case: precise-object-edit
Edit target: the supplied classroom object sprite atlas.
Change ONLY the background and whitespace around the illustrations. Replace ALL multicolored, blurred, gray, black and tinted background areas with completely flat PURE WHITE #ffffff. There must be NO backdrop gradients, no haze, no texture outside objects. Even the final empty cell must be pure white. This is critical for use in an actual application.
Preserve the original 23 objects, their illustration style, their colors, their relative order and their 6 columns x 4 rows layout exactly. Keep the landscape 3:2 canvas. Every cell must have an exactly equal square area. Center each object within its original cell and reduce the object slightly if necessary so every illustration including ribbons, handlebar and wheels stays within the middle 76% of its square cell, leaving at least 12% pure white margin to each cell edge. Remove the white fuzzy ground scribbles. No object should touch a cell edge.
No dividers, no grid lines, no text, no numbers, no labels, no added objects. The last cell (row 4 column 6) is entirely white. Background pure white, NOT transparency. This is a background cleanup and spacing correction, not a style change.
