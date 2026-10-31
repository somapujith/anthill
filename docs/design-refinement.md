# Anthill visual refinement

Class: frontend. Goal: an editorial investment website with a distinctive Anthill identity, real 3D brand geometry, and clear responsive layouts.

Reference: https://www.anthillventures.com/ (reviewed November 1, 2026). Retain the existing brand, investment themes, portfolio, people, and source archive; improve hierarchy and remove ornamental template patterns.

Direction: white paper, black Archivo headlines, Helvetica body, Anthill red accents, fine rules, generous space, and photography. The signature element is a real extruded red Anthill mark on an unboxed white stage. No orbit rings, grain, decorative stars, redundant numbered labels, italic headline styling, or pastel toy-image cards.

Tokens: paper #ffffff; ink #171717; muted #60605c; rule #e3e3df; accent #e6212b. Square image frames and minimal borders. Body text 14–18px, labels 11–12px. Controls target 44px. Motion: 160–500ms for feedback and one-shot entrances, with reduced-motion support. 3D responds gently to fine-pointer movement, remains still on touch, and falls back to the supplied SVG when WebGL is unavailable.

Work ownership:
- Foundation/integration: root owns global styles, application shell, dependencies, and verification.
- Homepage: home_redesign owns Home.jsx and home.css.
- 3D: brand_3d owns HeroMark.jsx and hero-mark.css.
- Interior pages: interior_refinement owns ContentPage.jsx and content-pages.css.

Acceptance: production build; archive and route checks; browser rendering across 320–1920px including short landscape; working menu keyboard paths, carousel, filters, film, forms and downloads; no runtime errors, broken assets, or page overflow in checked cases; reduced-motion and WebGL fallback checks. Verify representative screenshots visually. No deployment is part of this task.

## Expressive motion pass

The follow-up brief requests a more memorable presentation using React Bits. Retain factual copy, photography and clear layouts; increase visual contrast with a full-width ink-black hero, white typography and visible Anthill-red Threads behind the 3D mark. Add real React Bits Magnet calls to action and SpotlightCard pointer highlights. A red contact section anchors the lower page. Interior headers use a lighter Threads composition aligned away from reading text. Preserve keyboard/touch usability, live reduced motion, background pause controls, fallback imagery and offscreen rendering suspension.

Additional ownership: brand_3d owns Threads and BrandAtmosphere; interior_refinement owns Magnet and SpotlightCard plus inner-page integration; home_redesign owns homepage integration; root owns application shell, notices and final verification.
