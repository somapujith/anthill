# Site redesign brief

Supersedes the route-art section of `hero-and-page-art-direction.md`. The owner rejected abstract decorative panels as "bare and odd" and wants every section unique, considered and alive.

## Point of view

Night launch. Anthill's film shows the red A lifting off from a dark landscape, in monochrome with one red accent. The site is built from that: confident editorial type, deep night surfaces, white reading surfaces, one red, moving silk. Every visual must be real content (faces, companies, reports, numbers, the actual process) or a diagram that explains something true. Never decoration for its own sake.

## Foundation

- Night `#0a0507`, ink `#171717`, paper `#fff`, muted `#60605c`, line `#e3e3df`, red `#e6212b` (hover `#ba131c`). On night: text `#fff`, secondary `#eaddde`, eyebrow `#ffd9dc`, hairline `#ffffff24`.
- Display font `var(--display)` (Archivo), body `var(--body)`. Display weight 500, tracking no tighter than `-0.045em` (tighter makes letters collide).
- Square corners everywhere. Circles only for avatars and icon buttons.
- Small text is at least 12px, body at least 15px. The old 10 to 11px text was too small: raise it where you touch it.
- Layout grid: `.container`, gutter `clamp(22px, 4.7vw, 88px)`.
- Section rhythm: vary it. Do not stack same-looking white sections. Use night sections, ink sections, oversized numerals, full-bleed media and asymmetric grids. Each section needs one idea that a template would not have.

## Motion

- GSAP with ScrollTrigger and SplitText for scroll choreography, via `useGSAP` with a scope so it cleans up. Motion (`motion/react`) for hover and tap.
- Wrap all GSAP in `gsap.matchMedia()` under `(prefers-reduced-motion: no-preference)`. With reduced motion, everything must be fully visible and static.
- Content must never depend on animation to become visible if JS is slow. Do not hide anything with CSS alone.
- Never put `position: absolute` children inside an element you transform unless they should move with it.
- No pinning, no scroll-jacking, no magnetic buttons, no parallax that causes horizontal overflow.

## Hard rules

- Facts only. Use the site's existing data and copy. Never invent numbers, names, quotes, logos or claims.
- Keep all source text rendered. `scripts/verify-rendered.mjs` fails if text or links from the source archive disappear, and `scripts/editorial-expectations.json` locks approved copy. You may restructure freely, but do not drop content.
- No new npm packages and no edits to `package.json`.
- Accessible: real headings in order, keyboard reachable, visible focus, 4.5:1 contrast for body text, meaningful `alt`.
- Responsive from 320 to 1920px with no horizontal overflow.

## Stage

Every route already opens with `PageStage` (or `HomeHero` on `/`): a dark hero with a silk curve under a transparent header. The next section starts right below it.
