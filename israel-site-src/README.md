# Israel page source

`israel-site/index.html` (what gets deployed to israel.anthillventures.com) is **generated** from this folder. Edit the files here, rebuild, then commit both.

## Layout
- `src/shell.html`: head, header, footer, shared JavaScript (menu, scroll spy, reveal, motion layer).
- `src/base.css`: design tokens and shared components (buttons, glass, section labels, header).
- `src/parts/NN-name.part`: one file per section. Each has three blocks introduced by the lines `@@CSS`, `@@HTML`, `@@JS` (keep those lines exactly). `@@JS` runs inside the shell's shared script.
- `original/Anthill_Israel_2.original.html`: the page before the redesign. The build reads the logos, team portraits, hero photo, legal text and meta description from it, and `verify.py` compares against it.
- `build.py`: assembles everything into one self-contained HTML file.
- `verify.py`: checks regulated text (disclosures, bios, figures, contact details) is word-for-word identical to the original.

## Build
Needs Python 3 with Pillow (`pip install pillow`).

    python build.py --out out/main.html     # build to out/ and look at it
    python verify.py out/main.html          # must print ALL CONTENT CHECKS PASS
    python build.py --deploy                # writes israel-site/index.html (and an ignored root working copy)

Placeholders in parts: `{{LOGO0..2}}`, `{{PH_PRASAD}}` and friends (team portraits), `{{HERO}}`, `{{CONTOURS}}` are filled by the build. Do not paste base64 images into parts.

## Rules that matter
- Regulated copy (disclosures, bios, 60+ / 10 / 33% / 5.4x, the track-record note and a few fixed sentences) must not change; `verify.py` guards it. Do not add factual claims, and keep the original's hedging ("aim to", "potential", "subject to").
- No maps of India or Israel (border depiction is legally sensitive).
- The share image `israel-site/og-israel.jpg` is not built here; replace it by hand and keep it 1200x630 with the key content inside the centre ~976px (WhatsApp crops the sides).
