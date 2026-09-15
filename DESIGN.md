---
name: "Isadora Gazzi — Un petit monde"
description: "A tactile francophone miniature with a clear doorway to French learning games."
colors:
  paper: "#f6f3eb"
  ink: "#284967"
  blue: "#315f88"
  line: "#dcded3"
  gold: "#e7b157"
  card: "#fffdf7"
  card-line: "#dedfd2"
  card-copy: "#687569"
  intro-copy: "#62726e"
  badge-paper: "#fffbed"
  control-hover: "#e4e9dc"
  language-hover: "#e7eadd"
  arrow-hover: "#44745d"
  world-limestone: "#eadfc5"
  world-edge: "#d5c9ad"
  world-ivory: "#fff1cf"
  world-cream: "#f6e8ca"
  world-coral: "#d48768"
  world-ochre: "#d8a343"
  world-blue: "#245574"
  world-teal: "#397570"
  world-dark: "#244843"
  world-tower: "#ac7647"
  world-tree: "#728852"
  world-leaf: "#879761"
  world-water: "#81b9c0"
  world-water-light: "#c2dcd4"
  world-white: "#fff8e9"
  world-trunk: "#8a6651"
typography:
  display:
    fontFamily: "Fraunces,Georgia,serif"
    fontSize: "clamp(54px,5.25vw,80px)"
    fontWeight: 450
    lineHeight: 1.1
    letterSpacing: "-.04em"
  display-emphasis:
    fontFamily: "Fraunces,Georgia,serif"
    fontWeight: 420
  title:
    fontFamily: "Fraunces,Georgia,serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-.04em"
  body:
    fontFamily: "'DM Sans',sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.8
  card-body:
    fontFamily: "'DM Sans',sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.65
  brand:
    fontFamily: "'DM Sans',sans-serif"
    fontSize: "20px"
    fontWeight: 600
    letterSpacing: "-.04em"
  language-label:
    fontFamily: "'DM Sans',sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: ".05em"
rounded:
  sticker: "5px"
  skip-link: "8px"
  card: "15px"
  pill: "20px"
  language-group: "24px"
  circle: "50%"
spacing:
  control-gap: "6px"
  inline-gap: "8px"
  label-gap: "10px"
  group-gap: "14px"
  column-gap: "20px"
  header-gap: "24px"
components:
  world-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    width: "35px"
    height: "35px"
  world-button-hover:
    backgroundColor: "{colors.control-hover}"
  world-button-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  language-option:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.language-label}"
    rounded: "{rounded.pill}"
    width: "37px"
    height: "30px"
  language-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  activity-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  activity-card-content:
    padding: "19px 20px 17px"
  activity-arrow:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    width: "35px"
    height: "35px"
  player-badge:
    backgroundColor: "{colors.badge-paper}"
    textColor: "#5c655a"
    rounded: "{rounded.pill}"
    padding: "5px 8px"
  brand-monogram:
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    width: "52px"
    height: "52px"
---

# Design System: Isadora Gazzi

## Overview

**Creative North Star: "Un petit monde — a tactile miniature atlas"**

A tactile miniature atlas gives Isadora Gazzi’s directory a warm, curious personality. Cream paper surrounds a sculpted island with references to Paris, Québec and Dakar. Blue ink typography and small golden details connect the interface to the limestone, painted clay and soft daylight of the scene.

The composition is airy around the world and compact around actions. Fraunces gives greetings and game titles a literary voice; DM Sans keeps instructions and navigation direct. The material world extends through the generated game illustration, while semantic links and buttons keep activities usable during scene loading or WebGL failure.

**Key Characteristics:**

- Warm cream surfaces with blue ink and restrained golden accents.
- Fraunces display typography paired with self-hosted DM Sans.
- Real miniature geometry, diffuse shadows and quiet optional motion.
- Small, tactile controls and a single clear link per published activity.

This record describes the implemented directory in `src/styles.css`, `src/App.tsx`, `src/components/FrancophoneWorld.tsx` and `src/components/world/createWorld.ts`. The restored game is a separate application. Frontmatter values describe base styles; the observed responsive overrides below take precedence at their matching viewport sizes. The sidecar’s generated tonal ramps are panel previews, not additional shipped colors.

## Colors

Warm paper, blue ink and muted plant tones frame a richer miniature material palette. The frontmatter preserves source hex values; scene colors are material inputs, so lighting and tone mapping affect their rendered appearance.

### Primary

- **Blue ink** (`ink`): main text, selected language, pressed controls and the activity arrow.
- **Emphasis blue** (`blue`): the greeting’s emphasized phrase, text selection and keyboard focus.

### Secondary

- **Golden detail** (`gold`): the small monogram accent; related ochres belong to the miniature’s painted furniture and balloon.
- **Clay and vegetation** (`world-coral`, `world-ochre`, `world-teal`, `world-tree`, `world-leaf`): architecture, trees and props. The scene also uses its own blue, dark, tower and trunk materials.
- **Water** (`world-water`, `world-water-light`): the river and its short pale ripples.
- **Control greens** (`control-hover`, `language-hover`, `arrow-hover`): quiet feedback when a visitor points at an action.

### Neutral

- **Cream paper** (`paper`): the page and ordinary circular controls.
- **Warm card and badge paper** (`card`, `badge-paper`): slightly lighter surfaces for game content and metadata.
- **Fine boundaries** (`line`, `card-line`): page dividers and the card’s resting edge.
- **Muted supporting copy** (`intro-copy`, `card-copy`): short introductory and game descriptions.
- **Sculpted stone** (`world-limestone`, `world-edge`, `world-ivory`, `world-cream`, `world-white`): the layered island, architectural details, clouds and pale props.

**The Ink and Material Rule.** Use ink and blue for interface meaning; keep the broader clay, foliage and water palette inside illustrated or sculpted subjects.

## Typography

**Display Font:** self-hosted Fraunces, with Georgia and serif fallbacks.

**Body Font:** self-hosted DM Sans, with a sans-serif fallback.

Fraunces supplies soft, irregular serif forms with close tracking. DM Sans carries concise utility copy without competing with the greeting. The existing variable font files are retained from the restored game: Fraunces declares weights 100–900; DM Sans declares 100–1000. Optical sizing is automatic and font synthesis is disabled.

### Hierarchy

- **Display:** the two-line French greeting uses the frontmatter display role. Its emphasized phrase requests italic styling and a lighter variable weight; no separate italic font face is declared in the current stylesheet.
- **Title:** game names use the serif title role, left aligned beside a circular arrow.
- **Body:** introductory copy uses the body role and authored line breaks. Card descriptions use the more compact card-body role.
- **Brand:** the teacher’s name uses the sans-serif brand role beside the round monogram.
- **Labels:** the language options use the language-label role. Existing metadata and utility captions range from 8–12px depending on viewport; these are local compact treatments, not a general reading-size recommendation.

The responsive display is 62px at widths up to 1100px, then `clamp(51px,9.5vw,70px)` with line-height 1.08 up to 760px, and 48px up to 370px. Short desktop viewports use 65px, subject to the later width overrides. Activity titles finish at 27px on mobile and 24px at the narrowest breakpoint. There is no fixed modular type ratio.

**The Two Voices Rule.** Use Fraunces for greetings, game titles and brief expressive signoffs; use DM Sans for navigation, instructions and actions.

## Layout

The directory uses a centered page with a maximum width of 1800px and side padding of 4.6vw. A horizontal header, the main stage and a quiet footer are separated by fine rules. The base stage has a 360px left column, a flexible world column and a 20px gap; the greeting sits above the activity card while the world spans both rows. The card’s base maximum width is 340px.

At widths of at least 1600px, the left column expands to 420px and the card to 370px. Up to 1100px, side padding becomes 4vw, the left column becomes 320px and the card is capped at 300px. A combined width/height query (at least 1000px wide and at most 820px tall) compresses the header, vertical spacing, card artwork and world height. Later width queries still win when both match.

At 760px and below, the page has 24px side padding and a single-column sequence: centered greeting, world, activity. The world’s final minimum height is 310px. The activity is at most 430px wide and changes to a horizontal card: artwork occupies 34%, copy takes the remaining space, artwork has a 160px minimum height, and the angled sticker is hidden. The final content padding is 17px 15px 15px. At 370px and below, page padding is 18px, the world’s minimum height is 280px and card content padding is 15px 12px. The page supports a minimum body width of 320px.

Spacing is contextual rather than a universal grid. The extracted spacing tokens record recurring control, inline, column and header gaps. Preserve room around the 3D silhouette and keep the activity action readable without requiring rotation of the world.

## Elevation & Depth

Depth comes from real sculpted geometry, warm diffuse lighting, a pale ground shadow and restrained interface elevation. Scene surfaces use predominantly rough matte materials; the river is smoother. The layered limestone base, rounded architecture and contact shadows give the island weight. Fine orbital ellipses and the rotated stamp sit quietly behind or beside the scene.

### Shadow Vocabulary

- **Card at rest:** `0 8px 26px -15px #4d624638`.
- **Card on hover:** `0 18px 34px -18px #384d4e57`, accompanied by a small lift and tilt.
- **Paper sticker:** `0 3px 9px #5b4a2912`.
- **Monogram accent separation:** `0 0 0 4px var(--paper)`; this is a paper-colored ring rather than elevation.

The world uses soft real-time shadows and an orthographic camera. Its generated limestone texture provides low-contrast grain. The poster has its own baked lighting and is companion artwork rather than an identical image of the geometry.

**The Soft Contact Rule.** Ground tangible objects with diffuse contact shadows; use thin borders to separate interface surfaces.

## Shapes

The language of the interface is gently rounded and tangible. Cards use the card radius with clipped artwork; small stickers use the tighter sticker radius. Language selection and player metadata use pill shapes. The monogram, scene buttons and action arrow are circles. Fine single-pixel borders create edges without heavy outlines; the future-activity marker uses a dashed circular border.

The scene’s form language combines bevelled stone layers, softened miniature boxes, rounded tree crowns and simplified architectural silhouettes. Decorative sparkles and action symbols are inline stroked SVGs with round caps and joins, never text glyph substitutes.

## Components

### Navigation

The header pairs a linked round monogram and teacher name with a concise contextual phrase and an ES/FR segmented language group. The contextual phrase disappears on mobile. The selected language fills with ink and uses paper text; an unselected option has a pale green hover fill. Selection uses `aria-pressed`, the document language follows the choice, and Spanish is the current default. This default is an implementation choice rather than a permanent brand rule.

The keyboard skip link becomes visible on focus and moves directly to activities. The footer is a low-density signoff with a serif French farewell; its arrangement stacks on mobile.

### Buttons

Scene controls are small bordered circles on paper. Hover introduces a pale green fill and a 2px lift over 0.2s. A pressed pause control uses ink fill with paper text. The base control size is 35px square, reduced to 31px on mobile. Buttons retain accessible labels and titles. The shared focus treatment is a 3px blue outline with a 6px offset.

The activity arrow is a visual affordance inside the card link, not a separate button. It rotates by −35 degrees and changes to green when its containing card is hovered.

### Cards / Containers

A published activity is one complete semantic link. The card combines generated miniature artwork, a player badge, a French title, one sentence of localized description, skill metadata and a visible action. The resting surface is warm card paper with a fine border and low diffuse shadow. Hover lifts it by 5px, tilts it by −0.5 degrees and scales its image to 1.04; active press lowers the lift to 1px. The transition uses `cubic-bezier(.2,.7,.3,1)` for the card and image movement.

Base artwork uses an aspect ratio of 2.05. The narrow-screen horizontal composition and its final cascade values are documented in Layout. The current directory has one published activity, « Qui est-ce ? »; that content count is not a reusable component constraint.

### Chips

The player count is a noninteractive pill over the artwork. A small tilted paper sticker adds a French invitation on desktop; it disappears in the compact mobile card. Neither badge represents a selectable filter. The future-activity line combines a dashed circular plus with two quiet lines of copy and has no action.

### Francophone miniature

The signature is an actual rotatable Three.js island with Paris, Québec and Dakar references. The canvas has a poster during loading or failure, and the activity link remains independently available. Desktop pointer dragging and horizontal touch dragging rotate the island while vertical touch scrolling stays available. The focusable scene also accepts left/right arrow keys and Home to reset.

Automatic movement is slow and local: the scene sways slightly, and the balloon, boat and clouds animate. Pause freezes the animation timeline; reset restores the starting view. Reduced motion removes automatic motion, interpolation and CSS hover transforms while preserving direct manipulation. The pause toggle is omitted when reduced motion is active. A failed WebGL scene retains its poster and hides scene controls.

Generated assets and exact prompts are recorded in [docs/image-prompts.md](docs/image-prompts.md). Reuse their matte clay, warm stone and soft daylight character; their raster output is separate from the interactive geometry.

## Do's and Don'ts

### Do:

- **Do** keep cream paper and blue ink as the interface foundation.
- **Do** preserve the Fraunces and DM Sans pairing and the current font files.
- **Do** use real geometry for the rotatable world and a companion poster while it loads or cannot render.
- **Do** keep each published activity as one semantic link with a visible action.
- **Do** preserve the compact horizontal activity card on mobile.
- **Do** provide visible keyboard focus, scene reset, optional pause and reduced-motion behavior.
- **Do** use localized ES/FR utility copy and mark enduring French phrases with their language.

### Don't:

- **Don't** replace the miniature’s matte materials with glossy plastic or high-contrast noise.
- **Don't** hide activity access behind interaction with the 3D world.
- **Don't** present future activities as working links or empty app cards.
- **Don't** apply decorative transforms when reduced motion is requested.
- **Don't** treat the small metadata sizes as a general body-text scale.
- **Don't** turn the current single-card page arrangement into a restriction on future published activities.
