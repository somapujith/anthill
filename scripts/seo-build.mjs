#!/usr/bin/env node
/*
 * Post-build SEO pipeline (runs as `postbuild` after `vite build`).
 *
 *   node scripts/seo-build.mjs [--dist <dir>] [--site <url>] [--no-snapshot]
 *                              [--strict] [--ai-training allow|disallow]
 *                              [--report <file>] [--concurrency <n>]
 *
 * For every route in src/data/view-content.json (plus a 404) it
 *   1. builds the <head> with the same modules the client uses (src/seo/*),
 *   2. prerenders the real page body with Playwright so crawlers that do not run
 *      JavaScript (social scrapers, LLM crawlers) see the content,
 *   3. writes <dist>/<route>/index.html (home -> <dist>/index.html) and <dist>/404.html,
 *   4. writes sitemap.xml, robots.txt, llms.txt, llms-full.txt and the HTML cache
 *      rules appended to <dist>/_headers.
 *
 * The client still boots with createRoot and replaces the prerendered body.
 * Nothing is written to <dist> until every snapshot has finished, so the temporary
 * static server never serves half-written output.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const started = Date.now();
const log = (...a) => console.log("[seo-build]", ...a);
const warn = (...a) => console.warn("[seo-build] WARN", ...a);
const fail = (msg) => {
  console.error("[seo-build] ERROR", msg);
  process.exit(1);
};

/* ------------------------------------------------------------------ args */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const [k, inline] = a.slice(2).split("=");
    if (inline !== undefined) out[k] = inline;
    else if (["no-snapshot", "strict", "help"].includes(k)) out[k] = true;
    else out[k] = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(
    "node scripts/seo-build.mjs [--dist <dir>] [--site <url>] [--no-snapshot] [--strict] [--ai-training allow|disallow] [--report <file>] [--concurrency <n>]",
  );
  process.exit(0);
}

const dist = path.resolve(args.dist || "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  fail(`${path.join(dist, "index.html")} not found. Run "vite build" first (or pass --dist).`);
}

const importRepo = (rel) => import(pathToFileURL(path.join(REPO, rel)).href);
const [{ SITE, absoluteUrl }, metaLib, schemaLib, headLib] = await Promise.all([
  importRepo("src/seo/site.js"),
  importRepo("src/seo/meta.js"),
  importRepo("src/seo/schema.js"),
  importRepo("src/seo/head.js"),
]);
const { buildRouteMeta, indexableRoutes } = metaLib;
const { buildSchema } = schemaLib;
const { headTags } = headLib;
const { DECK } = await importRepo("src/data/deck-facts.js");

const siteUrl = String(args.site || process.env.SITE_URL || SITE.url).trim().replace(/\/+$/, "");
try {
  const u = new URL(siteUrl);
  if (!/^https?:$/.test(u.protocol)) throw new Error("protocol");
  if (u.pathname !== "/" && u.pathname !== "") warn(`site URL "${siteUrl}" has a path; canonicals will be built under it`);
  if (u.protocol !== "https:" && !/^(localhost|127\.|\[::1\])/.test(u.hostname))
    warn(`site URL "${siteUrl}" is not https`);
} catch {
  fail(`invalid site URL "${siteUrl}" (use --site or SITE_URL, e.g. https://www.anthillventures.com)`);
}

const view = JSON.parse(fs.readFileSync(path.join(REPO, "src/data/view-content.json"), "utf8"));
const data = { pages: view.pages, shared: view.shared, siteUrl };
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (/data-prerendered=/.test(template) || /data-seo-key=/.test(template)) {
  fail(`${dist}/index.html was already processed. Run "vite build" again to regenerate the template.`);
}
if (!/<div id="root"[^>]*><\/div>/.test(template)) fail('template has no empty <div id="root"></div>');

const routes = Object.keys(view.pages);
const NOT_FOUND_PATH = "/404";
log(`site ${siteUrl}; ${routes.length} routes; dist ${path.relative(process.cwd(), dist) || "."}`);

/* ----------------------------------------------------------------- html */

const escAttr = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escText = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ATTR_NAME = /^[A-Za-z_:][-A-Za-z0-9_:.]*$/;

function safeJsonLd(text) {
  // JSON-LD is already `<`-escaped by the schema module; this is a belt-and-braces pass so
  // a stray "</script>" or U+2028 can never break the document.
  return String(text).replace(/</g, "\\u003c").replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028").replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}

function serializeTag(t) {
  const attrs = { ...(t.attrs || {}), "data-seo-key": t.key };
  let a = "";
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (!ATTR_NAME.test(k)) throw new Error(`bad attribute name "${k}" on tag ${t.key}`);
    a += v === true ? ` ${k}` : ` ${k}="${escAttr(v)}"`;
  }
  if (t.tag === "meta" || t.tag === "link") return `<${t.tag}${a}>`;
  if (t.tag === "title") return `<title${a}>${escText(t.text ?? "")}</title>`;
  if (t.tag === "script") {
    const isJson = /json/i.test(String(t.attrs?.type || ""));
    return `<script${a}>${isJson ? safeJsonLd(t.text ?? "") : String(t.text ?? "").replace(/<\/script/gi, "<\\/script")}</script>`;
  }
  throw new Error(`unsupported tag "${t.tag}" (${t.key})`);
}

const TAG_BODY = `(?:[^>"']|"[^"]*"|'[^']*')*`;
const reVoid = (name) => new RegExp(`<${name}\\b${TAG_BODY}>`, "gi");
const attrOf = (tagHtml, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tagHtml);
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
};

// Same identity the client (Seo.jsx) uses to adopt a static default, so a template tag that
// duplicates a generated one is dropped even when it forgot `data-seo-default`.
function identityOf(tagName, get) {
  const name = tagName.toLowerCase();
  if (name === "title") return "title";
  if (name === "meta") {
    for (const attr of ["name", "property", "http-equiv", "itemprop"]) {
      const v = get(attr);
      if (v) return `meta|${attr}|${v}`;
    }
    return null;
  }
  if (name === "link") {
    const rel = get("rel");
    return rel ? `link|${rel}|${get("hreflang") || ""}|${get("sizes") || ""}|${get("type") || ""}|${get("media") || ""}` : null;
  }
  return null;
}

function stripTemplateDefaults(html, generated) {
  const want = new Set(generated.map((t) => identityOf(t.tag, (a) => (t.attrs?.[a] == null || t.attrs[a] === false ? "" : String(t.attrs[a])))).filter(Boolean));
  let out = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  out = out.replace(new RegExp(`<script\\b${TAG_BODY}\\bdata-seo-default\\b${TAG_BODY}>[\\s\\S]*?<\\/script>`, "gi"), "");
  for (const name of ["meta", "link"]) {
    out = out.replace(reVoid(name), (tag) => {
      if (/\sdata-seo-default(\s|=|\/|>)/i.test(tag)) return "";
      const id = identityOf(name, (a) => attrOf(tag, a));
      return id && want.has(id) ? "" : tag;
    });
  }
  return out;
}

const ROOT_RE = /<div id="root"[^>]*><\/div>/;

function composeHtml(meta, graph, bodyHtml) {
  const tags = headTags(meta, graph);
  const lang = String(SITE.locale || "en").replace(/_/g, "-");
  let html = stripTemplateDefaults(template, tags);
  html = html.replace(/<html\b([^>]*)>/i, (m, attrs) =>
    /\slang=/.test(attrs) ? m.replace(/\slang="[^"]*"/, ` lang="${/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(lang) ? lang : "en"}"`) : `<html lang="en"${attrs}>`,
  );
  const injected = tags.map(serializeTag).join("\n    ");
  if (!/<\/head>/i.test(html)) throw new Error("template has no </head>");
  // Drop the template's comments (they describe the defaults we just replaced) and the blank
  // lines left where tags were removed.
  html = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, (head) => head.replace(/<!--[\s\S]*?-->/g, "").replace(/\n[ \t]*(?=\n)/g, ""));
  // Early in <head>, right after the viewport meta, so scrapers that read only the first bytes
  // still see the title, description and Open Graph tags; before </head> if there is no viewport.
  const viewport = reVoid("meta");
  let placed = false;
  html = html.replace(viewport, (tag) => {
    if (placed || attrOf(tag, "name") !== "viewport") return tag;
    placed = true;
    return `${tag}\n    ${injected}`;
  });
  if (!placed) html = html.replace(/<\/head>/i, () => `    ${injected}\n  </head>`);
  if (bodyHtml != null) {
    html = html.replace(ROOT_RE, () => `<div id="root" data-prerendered="1">${bodyHtml}</div>`);
    // The template's <noscript> says "this site needs JavaScript"; it is wrong once the real
    // content is in the page (and would show next to it with scripting disabled).
    html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>\s*/gi, "");
  }
  return html;
}

/* ------------------------------------------------------- static server */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function startServer() {
  const server = http.createServer((req, res) => {
    let pathname = "/";
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = path.join(dist, pathname);
    const inside = file === dist || file.startsWith(dist + path.sep);
    let stat = null;
    if (inside) {
      try {
        stat = fs.statSync(file);
      } catch {
        stat = null;
      }
    }
    if (stat?.isFile() && path.basename(file) !== "index.html") {
      res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(file).pipe(res);
      return;
    }
    // A file extension means "a real asset that is missing"; anything else is a client route.
    if (path.extname(pathname) && pathname !== "/index.html") {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
    res.end(template);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

/* ---------------------------------------------------------- prerender */

// Runs inside the page. Returns the #root markup plus a Markdown rendition of <main>.
function extractInPage() {
  const root = document.getElementById("root");
  const main = document.querySelector("main") || root;
  const SKIP = new Set(["SCRIPT", "STYLE", "SVG", "CANVAS", "NOSCRIPT", "TEMPLATE", "VIDEO", "AUDIO", "IFRAME", "INPUT", "SELECT", "TEXTAREA", "BUTTON", "FORM", "LABEL"]);
  const BLOCK = new Set(["P", "DIV", "SECTION", "ARTICLE", "UL", "OL", "LI", "BLOCKQUOTE", "FIGURE", "FIGCAPTION", "TABLE", "TR", "DL", "DT", "DD", "HEADER", "FOOTER", "NAV", "ASIDE", "MAIN", "DETAILS", "SUMMARY", "ADDRESS"]);
  const collapse = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const lines = [];
  let cur = "";
  let bullet = false;
  const flush = () => {
    const t = collapse(cur);
    if (t) lines.push((bullet ? "- " : "") + t);
    if (t) bullet = false;
    cur = "";
  };
  const walk = (n) => {
    if (n.nodeType === 3) {
      cur += n.nodeValue;
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toUpperCase();
    if (SKIP.has(tag) || n.getAttribute("aria-hidden") === "true" || n.hidden) return;
    const disp = getComputedStyle(n).display;
    if (disp === "none") return;
    if (tag === "BR") {
      cur += " ";
      return;
    }
    const isBlock = BLOCK.has(tag) || !/^(inline|contents)/.test(disp);
    if (/^H[1-6]$/.test(tag)) {
      flush();
      const t = collapse(n.innerText);
      if (t) lines.push("#".repeat(Number(tag[1])) + " " + t);
      bullet = false;
      return;
    }
    if (tag === "A") {
      const text = collapse(n.innerText);
      const href = n.getAttribute("href") || "";
      if (isBlock) flush();
      if (text && href && !href.startsWith("#") && !/^javascript:/i.test(href)) cur += `[${text}](${href})`;
      else cur += text;
      if (isBlock) flush();
      else cur += " ";
      return;
    }
    if (tag === "LI") {
      flush();
      bullet = true;
      n.childNodes.forEach(walk);
      flush();
      bullet = false;
      return;
    }
    if (isBlock) {
      flush();
      n.childNodes.forEach(walk);
      flush();
      return;
    }
    if (/^inline-/.test(disp)) cur += " ";
    n.childNodes.forEach(walk);
    if (/^inline-/.test(disp)) cur += " ";
  };
  walk(main);
  flush();
  const dedup = lines.filter((l, i) => l !== lines[i - 1]);
  return {
    html: root.innerHTML,
    md: dedup.join("\n\n"),
    text: collapse(main.innerText),
    h1s: document.querySelectorAll("#root h1").length,
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
  };
}

function sanitizeSnapshot(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/\sdata-reactroot(="[^"]*")?/g, "");
}

async function loadPlaywright() {
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      const mod = await import(name);
      const chromium = mod.chromium || mod.default?.chromium;
      if (chromium) return chromium;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function launchBrowser(chromium) {
  const attempts = [
    { label: "chrome", opts: { channel: "chrome" } },
    { label: "msedge", opts: { channel: "msedge" } },
    { label: "bundled chromium", opts: {} },
  ];
  const errors = [];
  for (const { label, opts } of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, ...opts });
      return { browser, label };
    } catch (e) {
      errors.push(`${label}: ${String(e.message).split("\n")[0]}`);
    }
  }
  return { browser: null, errors };
}

const SETTLE_MS = Number(process.env.SEO_SETTLE_MS || 600);

async function snapshotRoute(browser, origin, route, expectH1 = true) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const issues = [];
  const aborted = new Set();
  try {
    const page = await context.newPage();
    page.on("pageerror", (e) => issues.push(`pageerror: ${String(e.message || e).split("\n")[0]}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // our own aborted media requests surface as generic "Failed to load resource" lines
      if (/ERR_FAILED|net::ERR_ABORTED/.test(t) && aborted.size) return;
      issues.push(`console.error: ${t.split("\n")[0].slice(0, 300)}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !/\/404(\/|$)/.test(new URL(r.url()).pathname + "/")) issues.push(`http ${r.status()}: ${new URL(r.url()).pathname}`);
    });
    // Video/audio are irrelevant to the DOM and slow to settle; skip them.
    await page.route("**/*", (r) => {
      const type = r.request().resourceType();
      if (type === "media") {
        aborted.add(r.request().url());
        return r.abort();
      }
      return r.continue();
    });
    await page.goto(origin + route, { waitUntil: "load", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    if (expectH1) await page.waitForSelector("main h1", { timeout: 20000 });
    else await page.waitForSelector("#root *", { timeout: 20000 });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
    // Trigger scroll-driven mounts (in-view sections, lazy images), then return to the top.
    await page.evaluate(async () => {
      const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
      const max = Math.min(document.documentElement.scrollHeight, 30000);
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);
    const snap = await page.evaluate(extractInPage);
    return { ...snap, issues, aborted: aborted.size };
  } finally {
    await context.close().catch(() => {});
  }
}

async function prerenderAll(routeList) {
  const results = new Map();
  const report = { browser: null, skipped: null };
  if (args["no-snapshot"]) {
    report.skipped = "--no-snapshot";
    return { results, report };
  }
  const chromium = await loadPlaywright();
  if (!chromium) {
    report.skipped = "playwright not installed";
    warn("Playwright is not installed: writing head-only shells (no prerendered body). Run `npm install`.");
    return { results, report };
  }
  const { browser, label, errors } = await launchBrowser(chromium);
  if (!browser) {
    report.skipped = `no browser could be launched (${errors.join("; ")})`;
    warn(`No browser could be launched (${errors.join("; ")}). Writing head-only shells: crawlers that do not run JavaScript will see an empty page. Install Chrome or run "npx playwright install chromium".`);
    return { results, report };
  }
  report.browser = label;
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  log(`prerendering ${routeList.length} routes with ${label} (${args.concurrency || 4} parallel)`);
  const queue = routeList.slice();
  const concurrency = Math.max(1, Number(args.concurrency || 4));
  let done = 0;
  const worker = async () => {
    for (let route; (route = queue.shift()); ) {
      const t0 = Date.now();
      const isNotFound = route === NOT_FOUND_PATH;
      const loadPath = isNotFound ? "/__prerender-404__" : route;
      let snap = null;
      let lastError = null;
      for (let attempt = 1; attempt <= 2 && !snap; attempt++) {
        try {
          snap = await snapshotRoute(browser, origin, loadPath);
        } catch (e) {
          lastError = String(e.message || e).split("\n")[0];
        }
      }
      if (snap) {
        results.set(route, { ...snap, html: sanitizeSnapshot(snap.html), ms: Date.now() - t0 });
      } else {
        results.set(route, { failed: lastError, issues: [`snapshot failed: ${lastError}`], ms: Date.now() - t0 });
        warn(`snapshot failed for ${route}: ${lastError}`);
      }
      done++;
      if (done % 10 === 0 || done === routeList.length) log(`  ${done}/${routeList.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, routeList.length) }, worker));
  await browser.close().catch(() => {});
  await new Promise((r) => server.close(r));
  return { results, report };
}

/* ------------------------------------------------------------ sitemap */

function git(args2) {
  try {
    return execFileSync("git", args2, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const buildDate = new Date().toISOString().slice(0, 10);

// The files whose edits change a route's real content. Header, footer and styles are
// excluded on purpose: <lastmod> should only move when the page's content moves.
function sourcesFor(route) {
  const files = ["src/data/site-content.json"];
  if (route === "/") files.push("src/pages/Home.jsx", "src/components/HomeHero.jsx", "src/data/deck-facts.js");
  else {
    files.push("src/pages/content/core.jsx");
    if (route === "/about") files.push("src/pages/content/About.jsx", "src/data/deck-facts.js");
    else if (route === "/philosophy") files.push("src/pages/content/Philosophy.jsx");
    else if (route === "/programs") files.push("src/pages/content/Programs.jsx", "src/data/deck-facts.js");
    else if (route === "/contact") files.push("src/pages/content/Contact.jsx");
    else if (["/portfolio", "/team", "/speedscalers", "/stories", "/insights"].includes(route)) files.push("src/pages/content/Collection.jsx");
    else files.push("src/pages/content/Detail.jsx");
  }
  return files.filter((f) => fs.existsSync(path.join(REPO, f)));
}

const lastmodCache = new Map();
function lastmodFor(route) {
  const files = sourcesFor(route);
  const key = files.join("|");
  if (lastmodCache.has(key)) return lastmodCache.get(key);
  let date = "";
  const committed = git(["log", "-1", "--format=%cI", "--", ...files]).slice(0, 10);
  if (committed) date = committed;
  // Uncommitted edits to a source file count as "modified now" (file mtime), never older than the commit.
  const dirty = git(["status", "--porcelain", "--", ...files]);
  if (dirty) {
    const m = Math.max(...files.map((f) => fs.statSync(path.join(REPO, f)).mtimeMs));
    const d = new Date(m).toISOString().slice(0, 10);
    if (!date || d > date) date = d;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > buildDate) date = buildDate;
  lastmodCache.set(key, date);
  return date;
}

function redirectSources() {
  const file = path.join(REPO, "public/_redirects");
  if (!fs.existsSync(file)) return new Set();
  const out = new Set();
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const from = t.split(/\s+/)[0];
    if (from && !/[*:]/.test(from)) out.add(from.replace(/\/$/, "") || "/");
  }
  return out;
}

const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function buildSitemaps(entries) {
  const MAX = 50000;
  const urlset = (list) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    list.map((e) => `  <url>\n    <loc>${xmlEsc(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>\n`).join("") +
    `</urlset>\n`;
  if (entries.length <= MAX) return { "sitemap.xml": urlset(entries) };
  const files = {};
  const parts = [];
  for (let i = 0; i < entries.length; i += MAX) {
    const name = `sitemap-${parts.length + 1}.xml`;
    files[name] = urlset(entries.slice(i, i + MAX));
    parts.push(name);
  }
  files["sitemap.xml"] =
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    parts.map((n) => `  <sitemap>\n    <loc>${xmlEsc(absoluteUrl("/" + n, siteUrl))}</loc>\n    <lastmod>${buildDate}</lastmod>\n  </sitemap>\n`).join("") +
    `</sitemapindex>\n`;
  return files;
}

/* ------------------------------------------------------------- robots */

function buildRobots() {
  const training = String(args["ai-training"] || process.env.AI_TRAINING || "allow").toLowerCase();
  const trainingRule = training === "disallow" ? "Disallow: /" : "Allow: /";
  const group = (agents, rule) => agents.map((a) => `User-agent: ${a}`).join("\n") + `\n${rule}\n`;
  return [
    `# robots.txt for ${siteUrl}`,
    `# Generated by scripts/seo-build.mjs. Edit the generator, not this file.`,
    ``,
    `# Everything on this site is public marketing content. There are no private paths,`,
    `# so nothing is disallowed (assets, fonts and media must stay crawlable for rendering).`,
    `# The /info/* utility pages are kept out of the index with a robots meta tag, which`,
    `# only works if they stay crawlable, so they are not disallowed here either.`,
    group(["*"], "Allow: /"),
    `# AI crawlers. Policy: ${training === "disallow" ? "allow AI search and user-triggered fetchers; disallow AI model training" : "allow all AI crawlers (search, user-triggered fetchers and training)"}.`,
    `# Reason: the site is public marketing content and being citable in AI answers is wanted.`,
    `# Each token governs one purpose and is listed separately on purpose:`,
    `#   search/citation: OAI-SearchBot (ChatGPT search), Claude-SearchBot (Claude search), PerplexityBot`,
    `#   user-triggered:  ChatGPT-User, Claude-User, Perplexity-User (some of these ignore robots.txt)`,
    `#   training:        GPTBot, ClaudeBot, Google-Extended (Gemini/Vertex), Applebot-Extended (Apple Intelligence)`,
    `# Google-Extended and Applebot-Extended do not affect Google Search or Apple search surfaces.`,
    `# To opt out of training only, rebuild with AI_TRAINING=disallow (or --ai-training disallow).`,
    ``,
    `# AI search and citation crawlers`,
    group(["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"], "Allow: /"),
    `# User-triggered fetchers (a person asked an assistant to read a page)`,
    group(["ChatGPT-User", "Claude-User", "Perplexity-User"], "Allow: /"),
    `# Model-training crawlers`,
    group(["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"], trainingRule),
    `Sitemap: ${absoluteUrl("/sitemap.xml", siteUrl)}`,
    ``,
  ].join("\n");
}

/* ------------------------------------------------------------- llms.txt */

const stripBrand = (t) => String(t || "").replace(/\s*[|–—-]\s*Anthill Ventures( portfolio)?\s*$/i, "").trim();
const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim();
const COUNTRY_NAMES = { IN: "India", SG: "Singapore", US: "United States" };

// `ordered` is indexableRoutes(): home, hubs in navigation order, then detail pages by section.
function buildLlms(metaByRoute, snapshots, ordered, hasFull) {
  const ok = (r) => metaByRoute.get(r)?.found && !/noindex/i.test(metaByRoute.get(r).robots);
  const pick = (re) => ordered.filter((r) => re.test(r) && ok(r));
  const link = (r, label) => {
    const m = metaByRoute.get(r);
    return `- [${label || stripBrand(m.name || m.title) || r}](${m.canonical}): ${oneLine(m.description)}`;
  };
  const home = metaByRoute.get("/");
  const homeText = snapshots.get("/")?.text || "";
  // Only facts that the deck module holds AND the rendered home page actually shows.
  const shown = (re) => !homeText || re.test(homeText);
  const facts = [];
  if (DECK.portfolioCompanies && shown(new RegExp(`${DECK.portfolioCompanies} startups|startups backed ${DECK.portfolioCompanies}`, "i")))
    facts.push(`${DECK.portfolioCompanies} startups backed`);
  if (DECK.venturePartners && shown(new RegExp(`${DECK.venturePartners} (seasoned )?speed scalers|venture partners ${DECK.venturePartners}`, "i")))
    facts.push(`${DECK.venturePartners} venture partners (speed scalers)`);

  const out = [];
  out.push(`# ${SITE.name}`, "");
  out.push(`> ${oneLine(home.description)}`, "");
  out.push(
    `${SITE.name} is a venture capital firm for early-stage companies. It combines capital, mentorship and market access to help founders ${String(SITE.tagline || "scale with speed").toLowerCase().replace(/\.$/, "")}.` +
      (facts.length ? ` ${facts.join("; ")}.` : ""),
    "",
  );
  out.push(`Brand line: "${SITE.tagline}". Sectors: health, frontier tech and urban lifestyles.`, "");

  const hubs = pick(/^\/[^/]+$/).filter((r) => r !== "/privacy-policy");
  out.push("## Key pages", "", ...hubs.map((r) => link(r, metaByRoute.get(r).section)), "");
  const sections = [
    ["Portfolio companies", /^\/portfolio\/[^/]+$/],
    ["Team", /^\/team\/[^/]+$/],
    ["Mentors and speed scalers", /^\/mentors\/[^/]+$/],
    ["Stories, insights and playbooks", /^\/(stories|playbooks)\/[^/]+$/],
  ];
  for (const [title, re] of sections) {
    const list = pick(re);
    if (list.length) out.push(`## ${title}`, "", ...list.map((r) => link(r)), "");
  }

  out.push("## Contact", "");
  out.push(`- Email: ${SITE.email}`);
  for (const o of SITE.offices || []) {
    const addr = [o.streetAddress, o.locality, o.region, o.postalCode, COUNTRY_NAMES[o.country] || o.country].filter(Boolean).join(", ");
    out.push(`- ${o.name}: ${addr}`);
  }
  out.push("");
  out.push("## Optional", "");
  if (ok("/privacy-policy")) out.push(link("/privacy-policy", "Privacy Policy"));
  out.push(`- [Sitemap](${absoluteUrl("/sitemap.xml", siteUrl)}): every indexable page with its last modified date`);
  if (hasFull) out.push(`- [Full text of every page](${absoluteUrl("/llms-full.txt", siteUrl)}): the main text of every page in one Markdown file`);
  out.push("");
  return out.join("\n");
}

function buildLlmsFull(metaByRoute, snapshots, ordered) {
  const order = ordered.filter((r) => snapshots.get(r)?.md && metaByRoute.get(r)?.found && !/noindex/i.test(metaByRoute.get(r).robots));
  if (!order.length) return null;
  const abs = (md) => md.replace(/\]\((\/[^)\s]*)\)/g, (_, p) => `](${absoluteUrl(p.replace(/[?#].*$/, ""), siteUrl)}${/[?#]/.test(p) ? p.slice(p.search(/[?#]/)) : ""})`);
  const demote = (md) => md.replace(/^(#{1,6}) /gm, (_, h) => "#".repeat(Math.min(6, h.length + 2)) + " ");
  const parts = [`# ${SITE.name}: full text`, "", `> Main text of every indexable page of ${siteUrl}, generated from the published pages at build time. One section per page.`, ""];
  for (const r of order) {
    const m = metaByRoute.get(r);
    parts.push(`## ${stripBrand(m.name || m.title)}`, "", `URL: ${m.canonical}`, "", abs(demote(snapshots.get(r).md)), "");
  }
  return parts.join("\n");
}

/* --------------------------------------------------------------- run */

// 1. metadata and graph for every route (and the not-found page)
const metaByRoute = new Map();
const graphByRoute = new Map();
for (const route of [...routes, NOT_FOUND_PATH]) {
  const meta = buildRouteMeta(route, data);
  if (route !== NOT_FOUND_PATH && !meta.found) fail(`buildRouteMeta did not find existing route ${route}`);
  metaByRoute.set(route, meta);
  graphByRoute.set(route, buildSchema(meta, data));
}

// 2. prerender
const t0 = Date.now();
const snapRoutes = [...routes, NOT_FOUND_PATH];
const { results: snapshots, report: browserReport } = await prerenderAll(snapRoutes);
log(`prerender ${browserReport.browser ? "done" : "skipped"} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// 3. compose every output in memory
const outputs = new Map(); // relative path -> string
const routeFile = (route) => (route === "/" ? "index.html" : `${route.replace(/^\//, "")}/index.html`);
const routeReports = [];
for (const route of routes) {
  const snap = snapshots.get(route);
  const body = snap && !snap.failed ? snap.html : null;
  outputs.set(routeFile(route), composeHtml(metaByRoute.get(route), graphByRoute.get(route), body));
}
{
  const snap = snapshots.get(NOT_FOUND_PATH);
  outputs.set("404.html", composeHtml(metaByRoute.get(NOT_FOUND_PATH), graphByRoute.get(NOT_FOUND_PATH), snap && !snap.failed ? snap.html : null));
}

for (const route of snapRoutes) {
  const snap = snapshots.get(route);
  const meta = metaByRoute.get(route);
  const rep = { route, prerendered: !!(snap && !snap.failed), ms: snap?.ms ?? 0, textChars: snap?.text?.length ?? 0, h1: snap?.h1s ?? null, bytes: Buffer.byteLength(outputs.get(route === NOT_FOUND_PATH ? "404.html" : routeFile(route))), issues: snap?.issues ?? [], warnings: [] };
  if (snap && !snap.failed) {
    if (snap.h1s !== 1) rep.warnings.push(`expected exactly one <h1>, found ${snap.h1s}`);
    if (snap.title !== meta.title) rep.warnings.push(`client title differs from build title ("${snap.title}" vs "${meta.title}")`);
    if (meta.canonical) {
      let a;
      let b;
      try {
        a = new URL(snap.canonical).pathname.replace(/\/$/, "") || "/";
        b = new URL(meta.canonical).pathname.replace(/\/$/, "") || "/";
      } catch {
        a = snap.canonical;
        b = meta.canonical;
      }
      if (a !== b) rep.warnings.push(`client canonical differs from build canonical ("${snap.canonical}" vs "${meta.canonical}")`);
    }
    if (snap.robots !== meta.robots) rep.warnings.push(`client robots differs from build robots ("${snap.robots}" vs "${meta.robots}")`);
    if (/opacity:\s*0(?![.\d])/.test(snap.html)) rep.warnings.push("snapshot contains inline opacity:0 elements (may be hidden without JS)");
    if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(snap.html)) rep.warnings.push("snapshot contains <img> without alt");
  }
  routeReports.push(rep);
}

// 4. sitemap
const redirected = redirectSources();
const sitemapRoutes = indexableRoutes(data)
  .filter((r) => {
    const m = metaByRoute.get(r) || buildRouteMeta(r, data);
    if (!m.found || /noindex/i.test(m.robots)) return false;
    if (redirected.has(r)) return false;
    if (m.canonical !== absoluteUrl(r, siteUrl)) {
      warn(`${r}: canonical ${m.canonical} differs from its URL; left out of the sitemap`);
      return false;
    }
    return true;
  })
  ;
// indexableRoutes() already returns home, hubs in navigation order, then details by section.
// A page that states its own last-updated date (the privacy policy) uses that date.
const ownDate = (m) => (/^\d{4}-\d{2}-\d{2}$/.test(m.dateModified || "") && m.dateModified <= buildDate ? m.dateModified : null);
const sitemapEntries = sitemapRoutes.map((r) => ({ loc: metaByRoute.get(r).canonical, lastmod: ownDate(metaByRoute.get(r)) || lastmodFor(r) }));
for (const [name, xml] of Object.entries(buildSitemaps(sitemapEntries))) outputs.set(name, xml);

// 5. robots, llms
outputs.set("robots.txt", buildRobots());
const llmsFull = buildLlmsFull(metaByRoute, snapshots, indexableRoutes(data));
outputs.set("llms.txt", buildLlms(metaByRoute, snapshots, indexableRoutes(data), !!llmsFull));
if (llmsFull) outputs.set("llms-full.txt", llmsFull);

// 6. HTML/text cache rules for the generated files, appended to the copied public/_headers.
//    (Immutable rules for /assets, /fonts, /media live in public/_headers; route paths never
//    overlap them, so no header is set twice.)
{
  const headersFile = path.join(dist, "_headers");
  if (fs.existsSync(headersFile)) {
    const rules = [];
    const html = (p) => rules.push(`${p}\n  Cache-Control: public, max-age=0, must-revalidate`);
    html("/");
    for (const r of routes) if (r !== "/") html(r);
    html("/404.html");
    for (const f of ["/sitemap.xml", "/robots.txt", "/llms.txt", "/llms-full.txt"]) rules.push(`${f}\n  Cache-Control: public, max-age=3600`);
    const base = fs.readFileSync(headersFile, "utf8").replace(/\s+$/, "");
    outputs.set("_headers", `${base}\n\n# --- generated by scripts/seo-build.mjs: HTML must revalidate; one rule per route ---\n${rules.join("\n")}\n`);
  }
}

// 7. flush (server is already closed, so nothing can read half-written files)
let written = 0;
for (const [rel, content] of outputs) {
  const file = path.join(dist, rel);
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, content);
  written++;
}

// 8. report
const reportFile = path.resolve(args.report || path.join(REPO, "tmp/seo-build-report.json"));
const buildReport = {
  builtAt: new Date().toISOString(),
  site: siteUrl,
  dist,
  browser: browserReport,
  routes: routeReports,
  sitemapUrls: sitemapEntries.length,
  files: [...outputs.keys()],
  seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
};
await fsp.mkdir(path.dirname(reportFile), { recursive: true });
await fsp.writeFile(reportFile, JSON.stringify(buildReport, null, 2));

const withIssues = routeReports.filter((r) => r.issues.length || r.warnings.length);
for (const r of withIssues) {
  for (const i of r.issues) warn(`${r.route}: ${i}`);
  for (const i of r.warnings) warn(`${r.route}: ${i}`);
}
const prerendered = routeReports.filter((r) => r.prerendered).length;
log(
  `wrote ${written} files; ${prerendered}/${routeReports.length} pages prerendered; ${sitemapEntries.length} sitemap URLs; ${buildReport.seconds}s; report ${path.relative(process.cwd(), reportFile)}`,
);
if (args.strict) {
  const bad = routeReports.filter((r) => r.issues.length || (browserReport.browser && !r.prerendered));
  if (bad.length) fail(`--strict: ${bad.length} route(s) had page errors or failed to prerender`);
}
