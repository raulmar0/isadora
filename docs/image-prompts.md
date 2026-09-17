# Generated image assets

Generated with the built-in `image_gen` tool on 2026-09-15. The selected outputs are saved in this project. The tool generated raster images; interactive 3D geometry is authored separately in the application.

Web delivery uses high-quality WebP (quality 88, effort 6) encoded with Sharp. Images were resized proportionally without cropping or visual changes and visually inspected after conversion. Original PNGs are preserved under `docs/artwork-originals/`. Impeccable `embed-prompt` embedded each exact prompt inside its PNG source and created an adjacent `.webp.json` provenance sidecar for each public WebP (its supported fallback for this format).

## Qui est-ce? game card

- File: `public/images/qui-est-ce.webp`
- Original: `docs/artwork-originals/qui-est-ce.png`
- Intended use: thumbnail for the existing object-guessing game, Le jeu des objets.
- Delivery: WebP, landscape 900 × 600, 41,982 bytes. Original: PNG, 1536 × 1024.

```text
Use case: stylized-concept
Asset type: polished illustration for a French object-guessing learning game directory card.
Primary request: exceptionally beautiful tactile miniature 3D clay illustration of a blue Guess Who style game board with six charming object tiles standing upright in two staggered rows and one coral question-mark tile.
Scene/backdrop: seamless pale buttery yellow studio ground and backdrop, warm and airy.
Subject: the blue rounded game board is the sole centered hero object. Six upright rounded rectangular ivory tiles each show one tiny sculpted object in relief: a mint bicycle, round dark glasses, blue headphones, coral backpack, mint chair and a yellow mug. Exactly one additional coral red upright tile has a simple cream '?' question mark. The relief objects are beautifully recognizable and dimensional, with no people or faces.
Style/medium: exceptionally polished toy-like matte clay 3D render, tactile ceramic and soft painted wood, refined art direction, sculptural rounded shapes, charming editorial design.
Composition/framing: landscape 3:2 composition, three-quarter elevated perspective, board angled slightly clockwise, full object visible with generous clear margins, all seven tiles readable at small thumbnail size, uncomplicated silhouette.
Lighting/mood: soft warm studio daylight from upper left, beautiful diffuse shadows, warm welcoming playful atmosphere, subtle ambient occlusion.
Color palette: vivid French blue board, coral pink accents, buttery yellow background, cream ivory tiles, subtle mint and peach details.
Materials/textures: fine matte clay grain, soft handmade edges, velvety painted surfaces, no plastic glare.
Text (verbatim): "?" on only the coral tile.
Constraints: no other letters, no logos, no watermark, no interface, no hands, no extra props, no humans or portrait tiles. The board and objects should look truly dimensional, not printed flat illustrations.
```

## Francophonie island poster

- Files: `public/images/island-{700,900,1100}.webp`
- Original: `docs/artwork-originals/island-poster.png` (PNG, 1536 × 1024)
- Intended use: the hero of the directory, and its LCP element.
- Delivery: a WebP `srcset` of 69,798 / 88,504 / 112,566 bytes, built by
  `npm run build:poster` — not by the Sharp pipeline described above. Run it after
  touching the original; `--check` reports whether the files on disk are current.
  The widths and the `sizes` they answer to are derived in `src/poster.ts`.

Two things about this asset are load-bearing, and both are explained at length in
`scripts/build-island-poster.mjs`:

- **Its background is white, not cream.** Every channel is divided by a bilinear
  estimate of the artwork's own cream background so that `mix-blend-mode: multiply`
  over the paper reproduces the original colour. A border pixel that is not pure
  white therefore shows up as a straight seam against the page.
- **The quantiser does not respect a white border just because it was given one.**
  It hands back 253 on some (width, quality) pairs and not monotonically in
  quality: 900px survives q86, 1100px does not. The build script checks every
  width after decoding and walks up the quality ladder until the borders come
  back clean, which is why the three files are encoded at different qualities.

The next island artwork needs at least 8% of empty margin on all four sides, with
the cast shadow ending inside the frame. This one's runs off the left edge, and a
fade can hide the truncation but cannot give the shadow back.

```text
Use case: stylized-concept
Asset type: wide hero poster and loading fallback for an interactive Francophonie 3D miniature world.
Primary request: exceptionally gorgeous miniature floating island toy diorama celebrating the French-speaking world with recognizable Paris, Quebec and Dakar architectural motifs.
Scene/backdrop: warm cream seamless studio background color #f7f4eb. A complete cream limestone floating platform with rounded organic edges hovers above the ground and casts a soft diffuse shadow.
Subject: a delicately simplified but recognizable coral-sand Eiffel Tower rises near the left-center; two charming cream Paris café buildings with teal and salmon shutters and a striped café awning beside it; two small Quebec steep-roof houses in powder blue and warm red on the right; a sculptural Dakar baobab tree and low warm terracotta Senegal architectural shapes toward the rear. A gentle blue river winds through the island with a tiny cream arched bridge across it. Carefully scattered mint-green rounded trees and little coral shrubs complete the miniature landscape.
Style/medium: premium tactile matte clay 3D diorama, collectible architectural toy, contemporary warm editorial art direction, sculptural clean shapes, beautiful material softness and restrained detail.
Composition/framing: wide landscape 3:2 image, elevated three-quarter isometric-like view, entire island and tower fully visible with generous empty margins all around, centered balanced composition, monuments have clear readable silhouettes, foreground river leads inward, avoid visual clutter.
Lighting/mood: luminous warm diffuse studio lighting from upper left, lovely soft ambient occlusion and natural contact shadows, enveloping cheerful quiet atmosphere.
Color palette: warm cream stone, French blue river, soft coral and terracotta architecture, teal and mint trees, pale yellow accents.
Materials/textures: subtly mottled cream limestone platform, soft matte painted clay buildings, velvety tree canopies, satin water with subtle highlights.
Constraints: no text, no logos, no watermark, no border, no interface, no people, no flags, no photorealism, no glossy plastic, no disconnected floating objects. Preserve whole-island framing and beautiful ample negative space.
```

## Limestone material

- File: `public/images/limestone-texture.webp`
- Original: `docs/artwork-originals/limestone-texture.png`
- Intended use: warm cream albedo map for the real-time island platform. Requested as seamlessly tileable; exact pixel-boundary seamlessness has not been mathematically verified.
- **No longer shipped.** The real-time island was replaced by the still illustration, so this texture was removed from `public/images/`. The record is kept for provenance; the file is recoverable from git history.
- Delivery: WebP, square 768 × 768, 138,532 bytes. Original: PNG, 1254 × 1254.

```text
Use case: stylized-concept
Asset type: seamless square albedo texture for the limestone ground and rock platform of a real-time 3D Francophonie miniature island.
Primary request: square seamlessly tileable softly mottled warm cream limestone material, light ivory and buttery beige, delicate natural fine pores and subtle warm mottling, tactile soft stone.
Scene/backdrop: the entire image is one continuous stone surface, filling edge to edge.
Style/medium: premium sculptural matte limestone texture, subtle and restrained, compatible with a miniature clay toy-like 3D world.
Composition/framing: perfectly straight orthographic top-down surface scan, zero perspective.
Lighting/mood: entirely even flat diffuse lighting, no shadows, no directional highlights, no vignette, no ambient occlusion.
Color palette: warm pale cream stone, base approximately #f2e5cb with very subtle ivory and pale tan variations.
Materials/textures: tiny pores, fine soft grain, subtle organic cloudy patches. Very low contrast.
Constraints: seamless tileable boundaries, no visible masonry joints or tile grid, no cracks, no deep cavities, no objects, no text, no borders, no watermark. Uniform scale and tone across all edges. This is a usable texture map, not a render of a slab.
```
