# Frontend acceptance evidence

Verified October 8, 2026 (Asia/Kolkata).

- Production Vite build passes with separate content, React/router, Motion and icon bundles.
- Source archive validation passes all 48 pages: exact main-body text preservation, all captured local page targets, 93 website images and three original PDF documents.
- Rendered content verification covers all 48 routes. Source paragraphs, figures, biographies, meaningful images and links are checked, including FAQ and carousel disclosures and playbook PDF gates.
- 77 viewport cases cover all 11 top-level pages at 360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 and 1366×600. No horizontal overflow, broken images or runtime errors.
- 24 additional detail cases cover a team profile, mentor profile, portfolio company, long story, playbook and style guide at mobile, tablet, desktop and short desktop sizes. No horizontal overflow, broken images or runtime errors.
- An exhaustive layout audit also checks all 48 captured routes at six widths (360, 390, 768, 1024, 1440 and 1920 px): 288 route/width combinations with no horizontal overflow. Consolidated rendered-source audit reports zero missing text, links or meaningful images, and no invalid PDFs or route/runtime errors.
- Navigation focus trapping/Escape return, carousel controls and descriptions, portfolio category/search clearing, newsletter invalid/valid local-only behavior and contact file rejection over 10 MB pass.
- Original brand film dialog passes mobile/desktop source selection, load, close/Escape and focus return. Both local MP4 files respond with HTTP 200.
- Playbook email forms unlock real local PDFs without contacting external subscription endpoints. Style guide demo form validates and shows conditional frontend feedback without network submissions.
- Visual inspection confirms mobile hero bounds, white-logo contrast and complete uncropped article infographics. Desktop homepage is five main sections, approximately four screens including footer at 1440×900.
- Built production SPA route smoke covers Home, Programs, portfolio detail, story detail, playbook, style guide, privacy and unknown-route fallback.

Reusable checks are in `scripts/`; local screenshot and JSON evidence remains in ignored `tmp/qa/` and `tmp/rendered-audit/`. See the README for commands and backend boundaries. Browser testing uses Chrome; no physical-device or Safari/Firefox certification is claimed.
