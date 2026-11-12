/*
 * Regenerates every brand image the <head> points at:
 *   public/favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180)
 *   public/icons/icon-192.png, icon-512.png, icon-maskable-512.png
 *   public/brand/logo-512.png            (square logo for the Organization schema)
 *   public/og/<slug>.png                 (1200 x 630 Open Graph / Twitter cards)
 *
 * Usage (from the repo root):
 *   node scripts/seo-assets/make-assets.mjs              everything
 *   node scripts/seo-assets/make-assets.mjs icons        icons only
 *   node scripts/seo-assets/make-assets.mjs og           all cards
 *   node scripts/seo-assets/make-assets.mjs og team      one card
 *
 * Everything is drawn from the real brand mark (public/brand/mark-red.svg) and the
 * self-hosted Archivo files, rendered with Playwright (Chrome, falling back to the bundled
 * Chromium). No network, no external API. PNGs are recompressed by optimize-png.py when
 * Python with Pillow is available; otherwise Chrome's output is kept as is.
 */
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC = path.join(ROOT, "public");
const OPTIMIZER = path.join(ROOT, "scripts", "seo-assets", "optimize-png.py");

const BRAND = { red: "#e6212b", redOnDark: "#ff4d56", night: "#0a0507", white: "#ffffff" };
const OG_BUDGET = 240 * 1024; // keep every card well under 250 KB

// slug -> headline ("|" splits lines; the last line sits on the red highlight) and star-field seed
const CARDS = {
  "anthill-ventures": { title: "Scale with|speed.", seed: 1 },
  home: { title: "Scale with|speed.", seed: 1 },
  about: { title: "About|Anthill", seed: 3 },
  philosophy: { title: "Our|philosophy", seed: 4 },
  programs: { title: "Programs", seed: 5 },
  portfolio: { title: "Portfolio", seed: 6 },
  speedscalers: { title: "Speed|Scalers", seed: 7 },
  team: { title: "Team", seed: 8 },
  stories: { title: "Stories", seed: 9 },
  insights: { title: "Insights", seed: 10 },
  contact: { title: "Contact", seed: 11 },
};

/* ---------- brand mark ---------- */

const markSource = await fs.readFile(path.join(PUBLIC, "brand", "mark-red.svg"), "utf8");
const MARK_D = markSource.match(/<path[^>]*\sd="([^"]+)"/)?.[1];
const [, , MARK_W, MARK_H] = markSource.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
if (!MARK_D) throw new Error("mark-red.svg: no path found");

/** A size x size SVG: optional background, the mark centred at `ratio` of the height. */
function markSvg({ size, ratio, fill, bg = null, radius = 0 }) {
  const s = (size * ratio) / MARK_H;
  const tx = (size - MARK_W * s) / 2;
  const ty = (size - MARK_H * s) / 2;
  const back = bg
    ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${back}<path transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(5)})" fill="${fill}" d="${MARK_D}"/></svg>`;
}

// The tab-bar icon. The brand red reads on light tabs (4.6:1 on white); on dark tabs a lighter red keeps 5:1+.
function faviconSvg() {
  const size = 32;
  const ratio = 0.9;
  const s = (size * ratio) / MARK_H;
  const tx = (size - MARK_W * s) / 2;
  const ty = (size - MARK_H * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <title>Anthill Ventures</title>
  <style>
    .mark { fill: ${BRAND.red}; }
    @media (prefers-color-scheme: dark) { .mark { fill: ${BRAND.redOnDark}; } }
  </style>
  <path class="mark" transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(5)})" d="${MARK_D}"/>
</svg>
`;
}

/* ---------- plumbing ---------- */

function icoFromPngs(entries) {
  // entries: [{ size, png: Buffer }] -> a PNG-in-ICO container
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = entries.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.png)]);
}

function startServer() {
  const types = { ".html": "text/html", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".css": "text/css", ".js": "text/javascript" };
  const server = http.createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT)) throw new Error("outside root");
      const body = await fs.readFile(file);
      res.writeHead(200, {
        "content-type": types[path.extname(file)] || "application/octet-stream",
        "access-control-allow-origin": "*",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
}

function optimize(file, { quantize = false } = {}) {
  for (const py of ["python", "python3", "py"]) {
    const run = spawnSync(py, ["-I", OPTIMIZER, file, ...(quantize ? ["--quantize"] : [])], { encoding: "utf8" });
    if (run.error) continue;
    if (run.status === 0) return true;
    console.warn(`  optimize-png.py failed (${py}): ${run.stderr.trim()}`);
    return false;
  }
  console.warn("  python not found, keeping Chrome's PNG as is");
  return false;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
async function report(file) {
  const { size } = await fs.stat(file);
  console.log(`  ${path.relative(ROOT, file).replaceAll("\\", "/")}  ${kb(size)}`);
  return size;
}

/* ---------- icons ---------- */

async function renderSvgToPng(browser, svg, size, file, { transparent = false } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
  const png = await page.screenshot({ type: "png", omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  if (file) await fs.writeFile(file, png);
  return png;
}

async function makeIcons(browser) {
  console.log("Icons");
  await fs.mkdir(path.join(PUBLIC, "icons"), { recursive: true });

  await fs.writeFile(path.join(PUBLIC, "favicon.svg"), faviconSvg());
  await report(path.join(PUBLIC, "favicon.svg"));

  const ico = [];
  for (const size of [16, 32, 48]) {
    const png = await renderSvgToPng(browser, markSvg({ size, ratio: 0.94, fill: BRAND.red }), size, null, { transparent: true });
    ico.push({ size, png });
  }
  await fs.writeFile(path.join(PUBLIC, "favicon.ico"), icoFromPngs(ico));
  await report(path.join(PUBLIC, "favicon.ico"));

  const jobs = [
    // opaque ink tile; iOS rounds the corners itself
    ["apple-touch-icon.png", markSvg({ size: 180, ratio: 0.62, fill: BRAND.red, bg: BRAND.night }), 180, false],
    // "any" icons: rounded ink tile, transparent corners
    ["icons/icon-192.png", markSvg({ size: 192, ratio: 0.64, fill: BRAND.red, bg: BRAND.night, radius: 42 }), 192, true],
    ["icons/icon-512.png", markSvg({ size: 512, ratio: 0.64, fill: BRAND.red, bg: BRAND.night, radius: 112 }), 512, true],
    // maskable: full-bleed ground, the mark inside the 80% safe circle (half-diagonal 0.34 * 512 < 0.4 * 512)
    ["icons/icon-maskable-512.png", markSvg({ size: 512, ratio: 0.54, fill: BRAND.red, bg: BRAND.night }), 512, false],
    // Organization logo: square, clean white ground, readable at 112 px
    ["brand/logo-512.png", markSvg({ size: 512, ratio: 0.66, fill: BRAND.red, bg: BRAND.white }), 512, false],
  ];
  for (const [name, svg, size, transparent] of jobs) {
    const file = path.join(PUBLIC, name);
    await renderSvgToPng(browser, svg, size, file, { transparent });
    optimize(file);
    await report(file);
  }
}

/* ---------- Open Graph cards ---------- */

async function makeCards(browser, origin, only) {
  console.log("Open Graph cards");
  await fs.mkdir(path.join(PUBLIC, "og"), { recursive: true });
  const slugs = only ? [only] : Object.keys(CARDS);
  for (const slug of slugs) {
    const card = CARDS[slug];
    if (!card) throw new Error(`Unknown card "${slug}". Known: ${Object.keys(CARDS).join(", ")}`);
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const url = `${origin}/scripts/seo-assets/og-template.html?title=${encodeURIComponent(card.title)}&seed=${card.seed}`;
    await page.goto(url, { waitUntil: "load" });
    await page.waitForSelector("html[data-ready]");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.getElementById("logo").decode());
    const fontsOk = await page.evaluate(() => document.fonts.check('500 124px "Archivo"') && document.fonts.check('400 31px "Archivo"'));
    if (!fontsOk) throw new Error("Archivo did not load from public/fonts");
    const file = path.join(PUBLIC, "og", `${slug}.png`);
    await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
    await page.close();
    optimize(file);
    let size = (await fs.stat(file)).size;
    if (size > OG_BUDGET) {
      console.log(`  ${slug}: ${kb(size)} over budget, quantising to a palette PNG`);
      optimize(file, { quantize: true });
      size = (await fs.stat(file)).size;
    }
    await report(file);
    if (size > 250 * 1024) throw new Error(`${slug}.png is ${kb(size)}, over the 250 KB limit`);
  }
}

/* ---------- main ---------- */

const [mode = "all", slug] = process.argv.slice(2);
const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await launch();
try {
  if (mode === "all" || mode === "icons") await makeIcons(browser);
  if (mode === "all" || mode === "og") await makeCards(browser, origin, slug);
} finally {
  await browser.close();
  server.close();
}
