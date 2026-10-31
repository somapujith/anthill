# Anthill visual and motion refinement

Reviewed November 1, 2026. Reference: https://www.anthillventures.com/. The local implementation is available through the production preview at http://localhost:4180/; this work does not deploy the live site.

## Delivered

- Ink-black hero with white typography, Anthill-red React Bits Threads and a genuine SVG-extruded Three.js brand mark.
- Adapted React Bits Magnet calls to action and SpotlightCard surfaces. Official source, modifications and license are recorded in `THIRD_PARTY_NOTICES.md`; the license is included in the production assets.
- Factual display copy, real team and mentor portraits, uncropped portfolio artwork, clearer investment rows, an offwhite network panel, a red founder section, and a dark footer/menu.
- A sticky navigation shell, reading progress, keyboard focus management, touch layouts, reduced-motion support, background pause/resume and static WebGL fallbacks.
- Source archive retained. `scripts/editorial-expectations.json` explicitly records changed display copy and decorative omissions; the rendered audit checks the replacements and all remaining source content, links, meaningful images and PDFs.

## Verification

- `npm run build` passed. Three.js remains a separately loaded 727 kB minified / 189 kB gzip chunk; Vite reports its standard size warning.
- `npm run check` passed: 48 source routes, 93 archived images and three documents.
- Full production rendered audit passed all 48 routes: zero unexpected missing text, links or images, broken images, invalid PDFs, horizontal overflow, route errors or runtime errors. Evidence: `tmp/rendered-audit/report.json`.
- Production layout audit passed 48 routes at 320, 360, 390, 768, 1024, 1440 and 1920 px: 336 cases with no document overflow. Evidence: `tmp/rendered-audit/viewports.json`.
- Production route smoke checks include detail pages, downloads, privacy, style guide and an unknown-route fallback.
- The final production viewport/interaction suite passed all 77 page/viewport cases and five interactions: menu focus trap/Escape restoration, carousel/disclosure, portfolio filters/empty search, newsletter email validation/local registration, and contact file-size rejection. Zero overflow, broken images or runtime errors were reported. Evidence: `tmp/qa/viewport-results.json`.
- Additional motion-enabled checks passed at 320×568, 844×390 and 1024×600, together with native film-dialog Escape dismissal and menu route navigation restoring interactive content. Evidence: `output/playwright/extra-interactions.json`.
- 3D checks passed for pointer response, live reduced motion, touch behavior, forced context loss and unsupported WebGL fallback.
- Threads measured 28.8 fps. Pause/resume, live reduced motion, offscreen/hidden suspension, context-loss fallback and unsupported WebGL fallback passed with zero console or runtime errors. A DPR-3 mobile emulation rendered the background at DPR 1. Evidence: `tmp/reactbits-qa/results.json`.
- Magnet resets on focus and live reduced motion; offsets are capped at 8 px. Spotlight pointer lighting disables under reduced motion; keyboard focus remains visible.
- Screenshots were visually inspected at desktop and phone sizes. Latest captures: `output/playwright/home-after.png`, `home-mobile-after.png`, `home-small-after.png`, `portfolio-after.png`, `about-after.png`.

## Boundaries

These are Chromium/Chrome browser checks and device emulations, not physical-device Safari/Firefox testing. Existing newsletter/contact flows remain local registration and email handoff; no submission backend was introduced. Historical source business figures were retained, not independently certified. No deployment or Git commit was requested.
