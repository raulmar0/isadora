// Vector world map markup in viewBox="0 0 1000 580"
// Handcrafted stylised continents matching Isadora Gazzi paper aesthetic.

export const WORLD_MAP_SVG = `
<svg class="world-svg" viewBox="0 0 1000 580" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
  <defs>
    <filter id="map-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#284967" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Ocean background with rounded frame -->
  <rect width="1000" height="580" rx="20" fill="#e8eee0" stroke="#d0dbc3" stroke-width="1.5"/>

  <!-- Compass rose in ocean -->
  <g transform="translate(110, 480)" opacity="0.45" stroke="#9bb192" fill="none">
    <circle cx="0" cy="0" r="22" stroke-width="0.8" stroke-dasharray="2 3"/>
    <path d="M0 -26 L0 26 M-26 0 L26 0" stroke-width="0.8"/>
    <polygon points="0,-22 4,-6 0,0" fill="#9bb192"/>
    <polygon points="0,22 4,6 0,0" fill="#9bb192"/>
    <polygon points="22,0 6,4 0,0" fill="#9bb192"/>
    <polygon points="-22,0 -6,4 0,0" fill="#9bb192"/>
    <text x="0" y="-28" text-anchor="middle" font-family="'DM Sans', sans-serif" font-size="9" font-weight="700" fill="#6d8864">N</text>
  </g>

  <!-- Graticule latitude and longitude lines -->
  <g stroke="#cfdcbf" stroke-width="0.75" stroke-dasharray="3 4">
    <!-- Equator -->
    <line x1="20" y1="320" x2="980" y2="320"/>
    <!-- Tropic of Cancer -->
    <line x1="20" y1="225" x2="980" y2="225"/>
    <!-- Tropic of Capricorn -->
    <line x1="20" y1="415" x2="980" y2="415"/>
    <!-- Prime Meridian -->
    <line x1="480" y1="20" x2="480" y2="560"/>
    <!-- Polar circles -->
    <line x1="20" y1="120" x2="980" y2="120" opacity="0.6"/>
    <line x1="20" y1="500" x2="980" y2="500" opacity="0.6"/>
  </g>

  <!-- Continental landmasses -->
  <g fill="#d6e0cc" stroke="#b6c5a8" stroke-width="1.2" stroke-linejoin="round" filter="url(#map-glow)">

    <!-- Greenland -->
    <path d="M335 70 C365 65 395 80 390 108 C380 128 340 135 320 115 C310 100 315 78 335 70 Z"/>

    <!-- North America & Central America -->
    <path d="M95 135 C125 100 200 92 250 110 C275 118 310 102 335 125 C320 148 285 155 270 178 C285 198 280 238 245 250 C230 262 215 285 195 305 C182 318 168 312 160 290 C150 275 132 272 125 255 C115 230 140 215 135 190 C105 180 85 152 95 135 Z"/>
    <!-- Alaska peninsula -->
    <path d="M95 135 C80 145 60 152 50 160 C55 168 75 162 90 150 Z"/>
    <!-- Baja California -->
    <path d="M142 270 C140 285 145 305 150 315 C154 315 152 295 148 275 Z"/>
    <!-- Florida peninsula -->
    <path d="M232 245 C238 260 242 275 240 282 C235 282 232 265 228 250 Z"/>

    <!-- South America -->
    <path d="M235 330 C265 318 320 330 355 365 C380 398 350 440 330 475 C310 508 290 540 272 546 C255 528 260 485 260 450 C250 410 228 370 235 330 Z"/>

    <!-- Europe & Scandinavia -->
    <!-- British Isles -->
    <path d="M448 162 C458 152 472 158 468 178 C458 192 444 186 448 162 Z"/>
    <path d="M438 170 C444 165 448 172 445 182 C440 186 435 180 438 170 Z"/>
    <!-- Scandinavia -->
    <path d="M495 90 C515 75 545 92 538 132 C528 148 502 142 496 122 C492 108 488 98 495 90 Z"/>
    <!-- Western/Central/Eastern Europe -->
    <path d="M432 205 C442 188 472 180 505 185 C535 182 555 198 558 220 C548 238 535 245 525 240 C522 248 528 262 522 268 C515 268 508 250 500 248 C495 248 485 252 478 250 C465 255 450 258 438 255 C425 252 422 238 428 225 C430 215 428 210 432 205 Z"/>
    <!-- Italy boot -->
    <path d="M508 230 C518 235 526 250 522 264 C516 268 510 255 506 242 Z"/>
    <circle cx="510" cy="270" r="5" stroke-width="0.8"/> <!-- Sicily -->
    <!-- Greece & Aegean -->
    <path d="M540 238 C552 240 556 255 548 262 C542 262 538 250 540 238 Z"/>

    <!-- Africa & Madagascar -->
    <path d="M430 270 C470 255 525 258 550 292 C572 328 578 378 552 422 C528 462 505 488 478 492 C458 470 452 430 432 390 C412 365 398 318 430 270 Z"/>
    <!-- Madagascar -->
    <path d="M574 418 C584 408 594 422 588 448 C578 464 568 448 574 418 Z"/>

    <!-- Asia & Middle East -->
    <path d="M545 160 C595 138 705 132 795 162 C845 182 860 238 825 278 C790 318 755 348 720 318 C690 318 660 298 640 258 C610 238 572 242 548 218 C532 195 536 172 545 160 Z"/>
    <!-- Arabian Peninsula -->
    <path d="M565 272 C590 265 615 282 605 318 C592 332 570 325 560 305 C555 288 558 276 565 272 Z"/>
    <!-- India Peninsula -->
    <path d="M662 268 C692 260 716 284 706 324 C696 348 676 352 666 328 C656 304 652 278 662 268 Z"/>
    <circle cx="704" cy="336" r="4" stroke-width="0.8"/> <!-- Sri Lanka -->
    <!-- Japan archipelago -->
    <path d="M848 205 C862 196 872 214 864 242 C854 252 844 238 848 205 Z"/>
    <!-- Korea -->
    <path d="M796 230 C804 225 808 238 805 252 C798 255 794 245 796 230 Z"/>

    <!-- Australia & New Zealand -->
    <path d="M775 412 C825 388 880 412 885 450 C875 485 830 500 790 480 C770 460 760 430 775 412 Z"/>
    <!-- Tasmania -->
    <circle cx="848" cy="510" r="5" stroke-width="0.8"/>
    <!-- New Zealand -->
    <path d="M920 470 C928 460 932 475 926 495 C920 500 916 488 920 470 Z"/>
    <path d="M912 498 C918 492 922 505 918 522 C912 525 908 514 912 498 Z"/>
  </g>
</svg>
`;
