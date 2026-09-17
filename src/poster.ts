// The island poster is the LCP element, and React injects it, so the preload
// scanner cannot see it in the HTML. index.html carries a <link rel="preload">
// built from these exact strings.
//
// They live here because Chrome matches a preload to its <img> by *resolved
// URL*: if the link picks the 1100px candidate and the <img> picks the 900px
// one, the page downloads both. Keep the two in sync by construction, never by
// copy-paste — vite.config.ts imports this module to write the <link>.

// The ladder stops at 1100 on purpose. srcset takes the smallest candidate that
// reaches the required device pixels, and the hungriest real case is a 3x phone:
// 386 CSS px x 3 = 1158. Adding a 1400 candidate would hand that phone 1400 and
// save it nothing, so 1100 serves it at 0.95x, which is not visible at that
// size. The cost lands on a 2x desktop, which needs 1945 and now gets 1100
// instead of the 1400 it used to get. Put 1400 back in this array if that
// tradeoff ever stops being worth it — everything else follows from here.
export const POSTER_WIDTHS = [700, 900, 1100];

// Declared intrinsic box. Only the ratio matters here: it is what reserves
// space before the bitmap arrives, and it matches the `aspect-ratio: 1400/933`
// the mobile rule pins. Every candidate shares it to within 0.01%.
export const POSTER_WIDTH = 1400;
export const POSTER_HEIGHT = 933;

export const posterUrl = (width: number) => `/images/island-${width}.webp`;

export const POSTER_SRCSET = POSTER_WIDTHS.map(w => `${posterUrl(w)} ${w}w`).join(', ');

// Derived from the layout, not guessed. `.atelier` is `max-width:1800px` with
// `padding:0 4.6vw` (4vw under 1100, 24px under 760, 18px under 370);
// `.main-stage` is a `360px + gap 20px` grid (420px from 1600, 320px and no gap
// under 1100); `.world-region` is the second column widened by its negative
// margins (-10/-35, -30/-35 under 1100, -22 either side under 760). That gives
// the painted width as:
//
//   <=370   100vw - 36 + 44        = 100vw + 8px
//   <=760   100vw - 48 + 44        = 100vw - 4px
//   <=1100  0.92V - 320 + 65       = 92vw - 255px      (687.08 at 1024, measured 687.09)
//   <1600   0.908V - 360 - 20 + 45 = 90.8vw - 335px    (972.52 at 1440, measured 972.53)
//   <=1800  0.908V - 420 - 20 + 45 = 90.8vw - 395px    (1057.80 at 1600, measured 1057.81)
//   >1800   1800 - 0.092V - 395    = 1405px - 9.2vw
//
// Known blind spot: on a wide, short viewport the `min-height:548px` branch
// makes the image height-limited instead of width-limited, and `sizes` cannot
// see height, so it over-requests by up to ~28% there. Over-requesting is the
// safe direction — it picks a larger candidate, never a blurry one.
export const POSTER_SIZES = [
  '(max-width: 370px) calc(100vw + 8px)',
  '(max-width: 760px) calc(100vw - 4px)',
  '(max-width: 1100px) calc(92vw - 255px)',
  '(max-width: 1599.98px) calc(90.8vw - 335px)',
  '(max-width: 1800px) calc(90.8vw - 395px)',
  'calc(1405px - 9.2vw)',
].join(', ');

// Fallback for anything that ignores srcset: the widest candidate there is.
export const POSTER_SRC = posterUrl(POSTER_WIDTHS[POSTER_WIDTHS.length - 1]);
