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

## SEO

The app is a client-rendered React SPA, so search and AI crawlers that do not run JavaScript would see an empty page. The build therefore turns it into static, crawlable HTML without changing the app: `createRoot` still boots on load and replaces the prerendered body.

```sh
npm run build          # prebuild -> vite build -> postbuild (scripts/seo-build.mjs)
npm run seo:validate   # asserts the output in dist/ (exit code 1 on any error)
```

`npm run build` runs everything. To run only the SEO step against an existing build: `node scripts/seo-build.mjs --dist dist`. Options: `--site <url>`, `--no-snapshot` (head-only shells, no browser needed), `--strict` (fail on page errors), `--ai-training allow|disallow`, `--report <file>`, `--concurrency <n>`. A build report (per-route timings, page errors, client/build head differences) is written to `tmp/seo-build-report.json`.

### What the build writes

| Output | Content |
| --- | --- |
| `dist/index.html`, `dist/<route>/index.html` | one file per route in `src/data/view-content.json`: its own `<title>`, description, canonical, robots, Open Graph, Twitter and JSON-LD in `<head>`, and the real page body prerendered with Playwright (Chrome, falling back to bundled Chromium) inside `<div id="root" data-prerendered="1">` |
| `dist/404.html` | the app shell with `noindex` and the prerendered "Page not found" view |
| `dist/sitemap.xml` | every indexable route with its absolute canonical URL and `<lastmod>` (the last git commit touching that route's content sources, or the build date when git is unavailable). `/info/*` utility pages are `noindex` and left out. `priority` and `changefreq` are omitted on purpose: Google ignores them |
| `dist/robots.txt` | allows everything, lists the sitemap, and has an explicit group per AI crawler (see below) |
| `dist/llms.txt`, `dist/llms-full.txt` | a curated Markdown map of the site and the main text of every page, generated from the same metadata. A convention for non-Google AI tools; Google Search ignores it |
| `dist/_headers` | `public/_headers` plus a generated `Cache-Control: max-age=0, must-revalidate` rule for every HTML route |

The head tags come from `src/seo/head.js`, the single source of truth also used by the client (`src/seo/Seo.jsx`, which updates the head on route changes). Metadata lives in `src/seo/meta.js`; structured data in `src/seo/schema.js`. The build compares the booted client's title, canonical and robots with what it wrote and prints a warning on any difference.

### Domain: `SITE_URL`

Canonical URLs, the sitemap, `robots.txt` and `llms.txt` use the production origin `https://www.anthillventures.com` (from `src/seo/site.js`). For another origin (staging, a new domain) set it when building:

```sh
SITE_URL=https://staging.example.com npm run build
```

The client reads the origin back from the prerendered canonical, so nothing else needs to change. Preview and staging deployments should set their own `SITE_URL` (or send an `X-Robots-Tag: noindex` header) so they never advertise the production canonicals as their own.

### AI crawlers

The site is public marketing content, so `robots.txt` allows every AI crawler explicitly and says so in a comment: search and citation crawlers (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`), user-triggered fetchers (`ChatGPT-User`, `Claude-User`, `Perplexity-User`) and training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`). Training is a licensing decision, not a visibility one: to opt out of training only, build with `AI_TRAINING=disallow` (or `--ai-training disallow`); search and user-triggered crawlers stay allowed. `Google-Extended` and `Applebot-Extended` never affect Google Search or Apple search results. Some user-triggered fetchers ignore robots.txt by design.

### Hosting

The output is plain static files. A host must do four things:

1. Serve `/<route>` from `dist/<route>/index.html` (the usual "pretty URLs" or directory-index behaviour), with or without a trailing slash. Canonicals have no trailing slash.
2. Answer any URL that is neither a file nor a route with `dist/404.html` and status **404**. Do not use a catch-all rewrite to `index.html` with status 200: that creates soft 404s.
3. Apply the redirects in `public/_redirects`: `/team/lasya-nadimpally` to `/team` (a profile removed on purpose), `/mentors` to `/speedscalers` and `/playbooks` to `/insights` (the parent paths of detail families, whose listings live on those pages).
4. Apply the headers in `dist/_headers`: `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`, `/fonts/*` and `/media/*` (a file in `fonts` or `media` must be republished under a new name when it changes), revalidating HTML, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a permissive `Permissions-Policy`. There is deliberately no CSP.

Netlify and Cloudflare Pages read `_redirects` and `_headers` as they are. For other hosts, translate them:

- **nginx:** `location / { try_files $uri $uri/index.html =404; }`, `error_page 404 /404.html;`, `location = /team/lasya-nadimpally { return 301 /team; }` (likewise the two other redirects), `location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }` (likewise `/fonts/` and `/media/`) and the three security headers with `add_header ... always;`.
- **Apache (`.htaccess`):** `DirectoryIndex index.html`, `ErrorDocument 404 /404.html`, `Redirect 301 /team/lasya-nadimpally /team`, and `Header set` rules inside `<LocationMatch "^/(assets|fonts|media)/">`.
- **Vercel:** `vercel.json` with `"cleanUrls": true`, `"trailingSlash": false`, `redirects` for the three rules and `headers` for the cache and security rules. It serves `404.html` on its own.
- **S3 and CloudFront (or similar):** set the 404 error response to `/404.html` with response code 404 (not 200), rewrite extensionless paths to `<path>/index.html` in a CloudFront Function, and attach the headers as a response headers policy.

After deploying, submit `https://www.anthillventures.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools, and check that `curl -I https://www.anthillventures.com/does-not-exist` returns 404.

### Adding or changing pages

New routes come from `src/data/view-content.json` (regenerated by `npm run prepare:content`); each gets its file, sitemap entry and `llms.txt` line automatically. Titles and descriptions of hub pages are curated in `src/seo/meta.js`; detail pages are templated from their data. `npm run seo:validate` checks title and description length and uniqueness, one canonical and one `<h1>` per page, JSON-LD `@id` references, internal links and images, sitemap and canonical agreement, `robots.txt`, `llms.txt` and `404.html`. The prerender needs a browser: install Chrome, or run `npx playwright install chromium`. Without one the build still succeeds with head-only shells and a clear warning.

## Hosting and backend integration

Deploy `dist/` to a static host. Every route is its own prerendered file (`dist/about/index.html`, ...) and unknown URLs must return a real 404 with `dist/404.html`: see the SEO section above for the redirect and header rules and how to configure hosts that do not read `public/_redirects` / `public/_headers`. This work does not publish or replace the production site.

Connect newsletter, contact submission, file uploads and any playbook lead capture to approved backend endpoints in a later change. Current local interest storage is browser-specific and is not a subscriber database.
