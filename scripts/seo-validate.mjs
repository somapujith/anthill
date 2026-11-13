#!/usr/bin/env node
/*
 * Asserts the SEO build output.
 *
 *   node scripts/seo-validate.mjs [--dist <dir>] [--site <url>] [--min-words <n>] [--quiet]
 *
 * Prints a table (one row per route) and the list of problems; exits 1 when there is any
 * error. Warnings never fail the run. Needs only the build output and src/data/view-content.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const [k, inline] = a.slice(2).split("=");
    out[k] = inline !== undefined ? inline : ["quiet"].includes(k) ? true : argv[++i];
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const dist = path.resolve(args.dist || "dist");
const MIN_WORDS = Number(args["min-words"] || 60);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

if (!fs.existsSync(dist)) {
  console.error(`dist not found: ${dist}`);
  process.exit(1);
}

const read = (rel) => fs.readFileSync(path.join(dist, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(dist, rel));

/* --------------------------------------------------------- html parsing */

const TAG_BODY = `(?:[^>"']|"[^"]*"|'[^']*')*`;
function attrsOf(tag) {
  const out = {};
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const body = tag.replace(/^<\w+/, "").replace(/\/?>$/, "");
  for (let m; (m = re.exec(body)); ) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

function parseHead(html) {
  const m = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html);
  const head = m ? m[1] : "";
  const metas = [...head.matchAll(new RegExp(`<meta\\b${TAG_BODY}>`, "gi"))].map((x) => attrsOf(x[0]));
  const links = [...head.matchAll(new RegExp(`<link\\b${TAG_BODY}>`, "gi"))].map((x) => attrsOf(x[0]));
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((x) => decode(x[1]).trim());
  const scripts = [...head.matchAll(new RegExp(`<script\\b(${TAG_BODY})>([\\s\\S]*?)<\\/script>`, "gi"))].map((x) => ({ attrs: attrsOf(`<script${x[1]}>`), text: x[2] }));
  const metaBy = (key, val) => metas.filter((a) => a[key] === val);
  return { head, metas, links, titles, scripts, metaBy };
}

function bodyOf(html) {
  const m = /<div id="root"([^>]*)>([\s\S]*)<\/div>\s*<script\b[^>]*type="module"/i.exec(html) || /<div id="root"([^>]*)>([\s\S]*)<\/div>/i.exec(html);
  if (!m) return { prerendered: false, html: "" };
  return { prerendered: /data-prerendered="1"/.test(m[1]), html: m[2] };
}
const visibleText = (html) =>
  decode(
    html
      .replace(/<(script|style|svg|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

/* ----------------------------------------------------------- the routes */

const view = JSON.parse(fs.readFileSync(path.join(REPO, "src/data/view-content.json"), "utf8"));
const routes = Object.keys(view.pages);
const routeFile = (r) => (r === "/" ? "index.html" : `${r.replace(/^\//, "")}/index.html`);

// Every directory under dist that holds an index.html is a route file; flag unexpected ones.
function walkRouteFiles(dir, rel = "") {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (["assets", "fonts", "media", "brand", "icons", "og", "documents", "licenses"].includes(e.name) && !rel) continue;
    const next = path.posix.join(rel, e.name);
    if (fs.existsSync(path.join(dir, next, "index.html"))) out.push("/" + next);
    out.push(...walkRouteFiles(dir, next));
  }
  return out;
}
for (const r of walkRouteFiles(dist)) if (!routes.includes(r)) warn(r, "route file exists but the route is not in view-content.json");

// Origin: from --site, else from the home canonical.
let origin = args.site ? String(args.site).replace(/\/+$/, "") : "";
const absOf = (r) => `${origin}${r === "/" ? "/" : r}`;

const rows = [];
const seenTitles = new Map();
const seenDescriptions = new Map();
const routeInfo = new Map();

const ROBOTS_INDEX = /^index,follow/;
function isNoindex(robots) {
  return /noindex/i.test(robots || "");
}

function checkRoute(route) {
  const file = routeFile(route);
  const row = { route, title: 0, desc: 0, h1: 0, words: 0, nodes: 0, status: "ok" };
  if (!exists(file)) {
    err(route, `route file ${file} is missing`);
    row.status = "MISSING";
    rows.push(row);
    return;
  }
  const html = read(file);
  const { titles, metas, links, scripts, metaBy } = parseHead(html);
  const before = errors.length;

  // title
  if (titles.length !== 1) err(route, `expected exactly one <title>, found ${titles.length}`);
  const title = titles[0] || "";
  row.title = title.length;
  if (!title) err(route, "empty <title>");
  if (title.length > 60) err(route, `title is ${title.length} chars (max 60): "${title}"`);
  if (title.length && title.length < 15) warn(route, `title is very short (${title.length}): "${title}"`);
  if (/^(anthill|insights|home|untitled)$/i.test(title.trim())) err(route, `generic title "${title}"`);
  if (title) (seenTitles.get(title) || seenTitles.set(title, []).get(title)).push(route);

  // description
  const descs = metaBy("name", "description");
  if (descs.length !== 1) err(route, `expected exactly one meta description, found ${descs.length}`);
  const description = descs[0]?.content || "";
  row.desc = description.length;
  const noindexPage = isNoindex(metaBy("name", "robots")[0]?.content);
  if (!description) err(route, "empty meta description");
  else if (description.length < 120 || description.length > 160) (noindexPage ? warn : err)(route, `meta description is ${description.length} chars (want 120-160)`);
  if (description) (seenDescriptions.get(description) || seenDescriptions.set(description, []).get(description)).push(route);

  // canonical
  const canon = links.filter((l) => (l.rel || "").toLowerCase() === "canonical");
  if (canon.length !== 1) err(route, `expected exactly one canonical, found ${canon.length}`);
  else {
    if (!origin && route === "/") {
      try {
        origin = new URL(canon[0].href).origin;
      } catch {
        /* reported below */
      }
    }
    if (origin && canon[0].href !== absOf(route)) err(route, `canonical "${canon[0].href}" should be "${absOf(route)}"`);
    if (!/^https?:\/\//.test(canon[0].href || "")) err(route, `canonical is not absolute: "${canon[0].href}"`);
  }

  // robots
  const robotsMeta = metaBy("name", "robots");
  if (robotsMeta.length !== 1) err(route, `expected exactly one robots meta, found ${robotsMeta.length}`);
  const robots = robotsMeta[0]?.content || "";
  if (route.startsWith("/info/")) {
    if (!isNoindex(robots)) err(route, `utility page should be noindex (robots: "${robots}")`);
  } else if (!ROBOTS_INDEX.test(robots) || isNoindex(robots)) err(route, `robots meta should start with "index,follow" (got "${robots}")`);

  // viewport / lang
  if (!metaBy("name", "viewport").length) err(route, "missing viewport meta");
  if (!/<html\b[^>]*\blang="[a-z]{2}/i.test(html)) err(route, "missing <html lang>");

  // Open Graph / Twitter
  const og = (p) => metaBy("property", p);
  for (const p of ["og:title", "og:description", "og:type", "og:url", "og:image", "og:site_name", "og:locale"]) {
    if (og(p).length !== 1) err(route, `expected exactly one ${p}, found ${og(p).length}`);
  }
  if (og("og:url")[0] && canon[0] && og("og:url")[0].content !== canon[0].href) err(route, `og:url "${og("og:url")[0].content}" differs from canonical`);
  if (og("og:title")[0] && og("og:title")[0].content.length > 90) warn(route, "og:title is long");
  const ogImage = og("og:image")[0]?.content || "";
  if (ogImage) {
    if (!/^https?:\/\//.test(ogImage)) err(route, `og:image is not absolute: ${ogImage}`);
    else {
      if (!og("og:image:alt").length) warn(route, "og:image:alt missing");
      if (!og("og:image:width").length || !og("og:image:height").length) warn(route, "og:image width/height missing");
      if (origin && ogImage.startsWith(origin)) {
        const p = new URL(ogImage).pathname;
        if (!exists(p.replace(/^\//, ""))) err(route, `og:image file ${p} does not exist in dist`);
      }
    }
  }
  for (const n of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    if (metaBy("name", n).length !== 1) err(route, `expected exactly one ${n}, found ${metaBy("name", n).length}`);
  }

  // JSON-LD
  const ld = scripts.filter((s) => (s.attrs.type || "").toLowerCase() === "application/ld+json");
  if (ld.length !== 1) err(route, `expected exactly one JSON-LD block, found ${ld.length}`);
  else {
    try {
      const j = JSON.parse(ld[0].text);
      if (j["@context"] !== "https://schema.org") err(route, `JSON-LD @context is "${j["@context"]}"`);
      if (!Array.isArray(j["@graph"])) err(route, "JSON-LD has no @graph array");
      else {
        row.nodes = j["@graph"].length;
        checkGraph(route, j["@graph"], canon[0]?.href);
      }
    } catch (e) {
      err(route, `JSON-LD does not parse: ${e.message}`);
    }
  }
  if (/<\/script/i.test(ld[0]?.text || "")) err(route, "JSON-LD contains a raw </script");

  // body
  const body = bodyOf(html);
  if (!body.prerendered) err(route, "body is not prerendered (no data-prerendered root)");
  else {
    const h1s = (body.html.match(/<h1[\s>]/gi) || []).length;
    row.h1 = h1s;
    if (h1s !== 1) err(route, `expected exactly one <h1> in the prerendered body, found ${h1s}`);
    const text = visibleText(body.html);
    row.words = text ? text.split(/\s+/).length : 0;
    if (row.words < MIN_WORDS) err(route, `prerendered body has only ${row.words} words (min ${MIN_WORDS})`);
    if (/<script\b/i.test(body.html)) err(route, "prerendered body contains a <script>");
    if (/\sopacity:\s*0(?![.\d])/i.test(body.html)) warn(route, "prerendered body has inline opacity:0 (content may be invisible without JS)");
    checkBodyAssets(route, body.html);
  }

  // old template defaults must be gone
  if (/data-seo-default/.test(html)) err(route, "a data-seo-default tag from the template is still present");

  routeInfo.set(route, { robots, canonical: canon[0]?.href, title, description });
  row.status = errors.length > before ? "ERR" : "ok";
  rows.push(row);
}

function checkGraph(route, graph, canonical) {
  const defined = new Set();
  const dupes = new Set();
  const types = new Set();
  for (const n of graph) {
    if (!n || typeof n !== "object") continue;
    for (const t of [].concat(n["@type"] || [])) types.add(t);
    const keys = Object.keys(n).filter((k) => k !== "@id");
    if (n["@id"] && keys.length > 0) {
      if (defined.has(n["@id"])) dupes.add(n["@id"]);
      defined.add(n["@id"]);
    }
    if (!n["@type"]) err(route, `JSON-LD node ${n["@id"] || "(no @id)"} has no @type`);
  }
  for (const d of dupes) err(route, `JSON-LD @id defined twice: ${d}`);
  const refs = [];
  const walk = (v, pathKey) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, pathKey));
    if (v && typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length === 1 && keys[0] === "@id") refs.push(v["@id"]);
      else for (const k of keys) walk(v[k], k);
    }
  };
  for (const n of graph) for (const [k, v] of Object.entries(n)) if (k !== "@id") walk(v, k);
  for (const r of new Set(refs)) if (!defined.has(r)) err(route, `JSON-LD @id reference does not resolve: ${r}`);
  if (!types.has("Organization")) err(route, "JSON-LD has no Organization node");
  if (!types.has("WebSite")) err(route, "JSON-LD has no WebSite node");
  const pageTypes = ["WebPage", "CollectionPage", "AboutPage", "ContactPage", "ProfilePage", "Article", "Report", "ItemPage", "FAQPage"];
  if (!pageTypes.some((t) => types.has(t))) err(route, "JSON-LD has no page node (WebPage/CollectionPage/...)");
  if (route !== "/" && !types.has("BreadcrumbList")) err(route, "JSON-LD has no BreadcrumbList");
  for (const bad of ["FAQPage", "HowTo", "Review", "AggregateRating", "Product", "SearchAction", "Offer"]) {
    if (types.has(bad)) err(route, `JSON-LD contains forbidden ${bad}`);
  }
  // every url-ish field must be absolute
  const urls = JSON.stringify(graph).match(/"(url|image|logo|contentUrl|item|sameAs|mainEntityOfPage)":"([^"]*)"/g) || [];
  for (const u of urls) {
    const v = /":"([^"]*)"/.exec(u)[1];
    if (v && !/^https?:\/\//.test(v) && !v.startsWith("#")) err(route, `JSON-LD has a non-absolute URL: ${u}`);
  }
  if (canonical && !graph.some((n) => typeof n["@id"] === "string" && n["@id"].startsWith(canonical))) {
    warn(route, "no JSON-LD node id is anchored on the page canonical URL");
  }
}

const assetCache = new Map();
function checkBodyAssets(route, html) {
  const linkSet = new Set();
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/gi)) linkSet.add(decode(m[1]));
  for (const href of linkSet) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const p = href.replace(/[?#].*$/, "").replace(/\/$/, "") || "/";
    if (routes.includes(p)) continue;
    if (p === "/404") continue;
    if (!assetCache.has(p)) assetCache.set(p, exists(p.replace(/^\//, "")));
    if (!assetCache.get(p)) err(route, `internal link ${href} points to nothing (not a route, not a file in dist)`);
  }
  let noAlt = 0;
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const a = attrsOf(m[0]);
    if (a.alt === undefined) noAlt++;
    const src = a.src || "";
    if (src.startsWith("/") && !src.startsWith("//")) {
      const p = src.replace(/[?#].*$/, "");
      if (!assetCache.has(p)) assetCache.set(p, exists(p.replace(/^\//, "")));
      if (!assetCache.get(p)) err(route, `image ${src} does not exist in dist`);
    }
  }
  if (noAlt) err(route, `${noAlt} <img> without an alt attribute (use alt="" for decorative images)`);
}

for (const r of routes) checkRoute(r);

for (const [t, rs] of seenTitles) if (rs.length > 1) err(rs.join(", "), `duplicate title "${t}"`);
for (const [d, rs] of seenDescriptions) if (rs.length > 1) err(rs.join(", "), `duplicate description "${d.slice(0, 70)}..."`);

/* ------------------------------------------------------------ 404.html */
{
  const where = "404.html";
  if (!exists(where)) err(where, "missing");
  else {
    const html = read(where);
    const { metaBy, links, titles } = parseHead(html);
    if (!isNoindex(metaBy("name", "robots")[0]?.content)) err(where, "404.html must be noindex");
    if (titles.length !== 1) err(where, `expected one <title>, found ${titles.length}`);
    if (links.some((l) => (l.rel || "").toLowerCase() === "canonical")) err(where, "404.html must not carry a canonical");
    const body = bodyOf(html);
    if (!body.prerendered) warn(where, "404 body is not prerendered (the client renders it)");
    else if ((body.html.match(/<h1[\s>]/gi) || []).length !== 1) err(where, "404 body should have exactly one <h1>");
  }
}

/* ---------------------------------------------------------- sitemap.xml */
{
  const where = "sitemap.xml";
  if (!exists(where)) err(where, "missing");
  else {
    const xml = read(where);
    if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(xml)) err(where, "missing XML declaration");
    // tag balance (cheap well-formedness check)
    const opens = (xml.match(/<url>/g) || []).length;
    const closes = (xml.match(/<\/url>/g) || []).length;
    if (opens !== closes) err(where, `unbalanced <url> (${opens} open, ${closes} close)`);
    if (/<sitemapindex/.test(xml)) warn(where, "sitemap index in use; child sitemaps are not followed by this validator");
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => decode(m[1]));
    const mods = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]);
    if (locs.length > 50000) err(where, `${locs.length} URLs (max 50,000)`);
    if (new Set(locs).size !== locs.length) err(where, "duplicate <loc> entries");
    const canonicals = new Map([...routeInfo].map(([r, i]) => [i.canonical, r]));
    for (const loc of locs) {
      if (!/^https:\/\//.test(loc) && !/^http:\/\/(localhost|127\.)/.test(loc)) err(where, `${loc} is not https`);
      const r = canonicals.get(loc);
      if (!r) err(where, `${loc} is not the canonical URL of any built route`);
      else if (isNoindex(routeInfo.get(r).robots)) err(where, `${loc} is noindex but listed`);
    }
    for (const [r, i] of routeInfo) if (!isNoindex(i.robots) && !locs.includes(i.canonical)) err(where, `indexable route ${r} is missing from the sitemap`);
    for (const m of mods) {
      if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(m)) err(where, `invalid <lastmod> "${m}"`);
      else if (new Date(m) > new Date(Date.now() + 86400000)) err(where, `<lastmod> ${m} is in the future`);
    }
    if (mods.length !== locs.length) err(where, `${locs.length} URLs but ${mods.length} <lastmod>`);
    if (mods.length > 3 && new Set(mods).size === 1) warn(where, `every <lastmod> is the same (${mods[0]}); Google ignores uniform dates`);
    // redirects never belong in a sitemap
    const redirectsFile = path.join(REPO, "public/_redirects");
    if (fs.existsSync(redirectsFile)) {
      for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/)) {
        const from = line.trim().split(/\s+/)[0];
        if (!from || from.startsWith("#") || /[*:]/.test(from)) continue;
        if (locs.some((l) => new URL(l).pathname.replace(/\/$/, "") === from.replace(/\/$/, ""))) err(where, `${from} is redirected but listed`);
      }
    }
    console.log(`sitemap.xml: ${locs.length} URLs`);
  }
}

/* ----------------------------------------------------------- robots.txt */
{
  const where = "robots.txt";
  if (!exists(where)) err(where, "missing");
  else {
    const txt = read(where);
    const sm = [...txt.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
    if (!sm.length) err(where, "no Sitemap: line");
    else {
      const expect = origin ? `${origin}/sitemap.xml` : null;
      if (expect && !sm.includes(expect)) err(where, `Sitemap line(s) ${sm.join(", ")} should include ${expect}`);
    }
    if (!/^user-agent:\s*\*/im.test(txt)) err(where, "no User-agent: * group");
    // a Disallow that blocks the whole site or the assets would break rendering/indexing
    const groups = txt.split(/\r?\n\s*\r?\n/);
    for (const g of groups) {
      if (/^user-agent:\s*\*/im.test(g)) {
        for (const m of g.matchAll(/^disallow:\s*(\S*)/gim)) {
          if (m[1] === "/" || /^\/(assets|fonts|media|brand|icons|og)/.test(m[1])) err(where, `Disallow: ${m[1]} for * blocks required content`);
        }
      }
    }
    for (const bot of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"]) {
      if (!new RegExp(`^user-agent:\\s*${bot}\\s*$`, "im").test(txt)) warn(where, `no explicit group for ${bot}`);
    }
  }
}

/* ------------------------------------------------------------- llms.txt */
{
  const where = "llms.txt";
  if (!exists(where)) err(where, "missing");
  else {
    const txt = read(where);
    if (!/^# \S/.test(txt)) err(where, "must start with an H1 title");
    if (!/^> \S/m.test(txt)) err(where, "no blockquote summary");
    const links = [...txt.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
    if (links.length < 5) err(where, `only ${links.length} links`);
    for (const l of links) {
      let u;
      try {
        u = new URL(l);
      } catch {
        err(where, `bad URL ${l}`);
        continue;
      }
      if (origin && u.origin !== origin) {
        err(where, `link ${l} is not on ${origin}`);
        continue;
      }
      const p = u.pathname.replace(/\/$/, "") || "/";
      if (!routes.includes(p) && !exists(p.replace(/^\//, ""))) err(where, `link ${l} does not resolve to a route or file`);
    }
    if (exists("llms-full.txt")) {
      const full = read("llms-full.txt");
      if (!/^# \S/.test(full)) err("llms-full.txt", "must start with an H1 title");
      if (full.length > 5_000_000) warn("llms-full.txt", "very large");
    }
  }
}

/* ------------------------------------------------- redirects / headers */
{
  for (const f of ["_redirects", "_headers"]) if (!exists(f)) warn(f, "missing from dist (hosts that read it will not see the rules)");
  if (exists("_redirects")) {
    const r = read("_redirects");
    if (/^\s*\/\*\s+\/index\.html\s+200/m.test(r)) err("_redirects", 'catch-all "/* /index.html 200" produces soft 404s');
    if (!/^\s*\/\*\s+\/404\.html\s+404/m.test(r)) err("_redirects", 'missing "/* /404.html 404"');
  }
}

/* --------------------------------------------------------------- report */

const pad = (v, n) => String(v).padEnd(n).slice(0, n);
const padL = (v, n) => String(v).padStart(n);
if (!args.quiet) {
  console.log("");
  console.log(`${pad("route", 62)} ${padL("title", 5)} ${padL("desc", 4)} ${padL("h1", 2)} ${padL("words", 5)} ${padL("ld", 3)}  status`);
  for (const r of rows) console.log(`${pad(r.route, 62)} ${padL(r.title, 5)} ${padL(r.desc, 4)} ${padL(r.h1, 2)} ${padL(r.words, 5)} ${padL(r.nodes, 3)}  ${r.status}`);
}
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  warn  ${w.where}: ${w.msg}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  ERROR ${e.where}: ${e.msg}`);
}
console.log(`\n${rows.length} routes checked, ${errors.length} error(s), ${warnings.length} warning(s) in ${path.relative(process.cwd(), dist) || "."}`);
process.exit(errors.length ? 1 : 0);
