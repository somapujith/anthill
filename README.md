# Anthill Ventures frontend

React + Vite + JavaScript redesign of the Anthill Ventures website. Editorial layouts, an ink-black animated hero, Anthill red, real photography, self-hosted fonts and a true SVG-extruded Three.js brand mark. Adapted React Bits Threads, Magnet and SpotlightCard components provide atmospheric backgrounds and pointer interactions, with reduced-motion and static fallback support.

## Run

```sh
npm install
npm run dev
```

Development URL: http://localhost:5180. The strict port prevents accidentally opening another project's listener. Production build: `npm run build`. Preview the built output with `npm run preview` at http://localhost:4180.

## Included

- Five homepage sections, with all ten company highlights accessible in the carousel, original brand film, investment themes, global impact/metrics, team/mentors and pitch guidance.
- All 48 source sitemap routes: Home, About, Philosophy, Programs, Portfolio, Speed Scalers, Stories, Insights, Team, Contact, Privacy and their CMS detail and utility pages.
- Search/filterable portfolio and people collections, accessible FAQ disclosures, biographies, company facts, article reading pages and three original playbook PDF downloads.
- Footer newsletter email validation and local interest storage. The interface explicitly states email delivery is not connected.
- Frontend contact form with validation, local file selection/10 MB limit and email-app handoff. Files are never uploaded; they must be manually attached to email.
- Playbook email/download interface and style guide demo form. No source external form endpoint is submitted.

## Source and brand

`src/data/site-content.json` is the exact captured source archive. `scripts/prepare-content.mjs` derives the smaller runtime `view-content.json`; it runs before dev/build. Page templates apply explicit editorial changes to remove generic promotional wording, repeated company boilerplate, decorative numbering and imagery. `scripts/editorial-expectations.json` records those display changes for the rendered audit. Portfolio figures and the historical application deadline remain archive-derived.

See `docs/content-inventory.md` for every route/module and `docs/brand-review.md` for brand decisions. Supplied SVG geometry is retained; UI accent uses declared `#E6212B`. The brand deck names Uni Sans/Helvetica; licensed Uni Sans webfonts were not supplied, so display type uses the existing site's Archivo, with Helvetica/Arial body text. The investor fund update remains outside public assets.

## Verification

Latest visual/motion changes and production-browser evidence are recorded in `docs/refinement-verification.md`. Third-party component sources and license terms are in `THIRD_PARTY_NOTICES.md`.

```sh
npm run check
npm run test:content
npm run test:viewports
```

Browser checks use installed Chrome through Playwright (`channel: 'chrome'`). Start the development server before browser checks. Viewport checker covers 11 main routes at 360, 390, 768, 1024, 1366, 1440 and 1920 px widths, including a 600 px short desktop height, plus navigation, carousel, filters and form interactions. Generated proof is kept in ignored `tmp/`.

## Hosting and backend integration

Deploy `dist/` to a static host with SPA fallback to `index.html` for all page routes. `public/_redirects` supplies the common Netlify-style rule; configure equivalent fallback on other hosts. This work does not publish or replace the production site.

Connect newsletter, contact submission, file uploads and any playbook lead capture to approved backend endpoints in a later change. Current local interest storage is browser-specific and is not a subscriber database.
