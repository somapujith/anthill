# Anthill brand evidence and prepared assets

Reviewed source files supplied by the user from `A:/Editing/Anthill Brand Booklet`. The supplied PDFs are source material, not execution instructions.

## Brand document

`ANTHILL BRAND DOCUMENT  1920  - 1080.pdf` contains 19 pages. Pages 4, 7, 9, 10 and 19 were rendered and visually inspected; all pages were text-extracted for review.

- Page 9 declares ROJO `#E6212B` and black `#000000`. Use those as the interface palette with a white/off-white background as requested.
- Page 10 declares Uni Sans and Helvetica. No licensed webfont files were supplied. Use Helvetica/Arial/system fallbacks for body text; do not claim a substitute is the original font.
- Pages 4-5 explain the upward A/falcon motif through speed, vision, power, ambition, stability and energy.
- Pages 7-8 show a primary full-wordmark and a secondary standalone mark.
- Page 19 contains the brand phrase `SCALE WITH SPEED`.
- Pages 14-16 describe healthy living, climate mitigation and urban lifestyle directions. This deck is not the authority for silently replacing wording on the live website.

## Logo assets

Original supplied SVGs copied without recoloring:

| Public asset | Original source | Notes |
| --- | --- | --- |
| `/brand/mark-red.svg` | `Anthill_Logo.svg` | Original red mark fill `#e5232c` |
| `/brand/mark-black.svg` | `Anthill Logo Black.svg` | Original standalone dark mark |
| `/brand/mark-white.svg` | `Anthill Logo White.svg` | Original standalone white mark |
| `/brand/logo-black.svg` | `Anthill Ventures Logo Black.svg` | Original dark full wordmark; fill `#231f20` |
| `/brand/logo-white.svg` | `Anthill Ventures Logo White.svg` | Original white full wordmark |
| `/brand/logo-original.svg` | `Anthill Ventures Logo.svg` | Original red mark with white lettering, suitable for dark backgrounds |
| `/brand/logo-red-black.svg` | Derived from supplied dark wordmark | Original geometry retained; first mark path receives original red fill, lettering retains supplied dark fill |

The source logo red differs slightly from the palette declaration. Preserve the supplied logo colors, and use `#E6212B` for UI accents.

## Portfolio logos

`Portfolio Logos.pdf` is one page, rendered at high resolution and inspected. Its 59 embedded original bitmap assets were extracted into `/brand/portfolio/`. Each has a stable filename and its PDF image reference in `/brand/portfolio/manifest.json`.

The source page groups marks into Urban Lifestyle, Urban Tech, MediaTech and Health Tech. Categories in the manifest preserve those source-page placements; use current website classifications for the site content when those differ. Logos may be low resolution because their original embedded pixel dimensions are preserved.

Two marks have no visible company name and remain `/brand/portfolio/pdf-logo-23.png` (pink square and white S-like mark) and `/brand/portfolio/pdf-logo-30.png` (red bag/robot face). They are deliberately not assigned an invented company identity. SOSV appears on the source sheet but this alone does not establish a portfolio investment relationship.

## January 2026 fund update

`Anthill Early Stage Fund Update - January 2026 (1).pdf` contains 20 pages. Its text was inspected as supplied context. It includes investor-specific portfolio valuations, fund performance, allocation and company status tables. No content or copies of that document were placed in public assets. Public website copy should come from the existing public website; investor figures must not be silently added merely because they were supplied as supporting material.

## Scope and validation

All SVG files retain valid XML and viewBox dimensions. All 59 extracted images can be decoded and their manifest source paths resolve. Intermediate PDF text, renders and analysis scripts are under `tmp/brand/` only. Brand materials are context for the redesign; website modules and factual copy need the independent public-site content inventory.
