// Schema.org JSON-LD for every route. Pure ESM: no DOM, no import.meta, no Vite
// imports, so the same code runs in the browser (Seo.jsx) and in Node (the
// prerender build). View data is passed in; nothing here imports view-content.
//
// buildSchema(meta, data) returns { "@context": "https://schema.org", "@graph": [...] }
//   meta  the object from buildRouteMeta(path, data)
//   data  { pages, shared, siteUrl? }, the shape of view-content.json
//
// Every node has a stable @id so the graph cross-references itself:
//   {origin}/#organization      Anthill Ventures (every page)
//   {origin}/#website           the site (every page)
//   {origin}/#logo              the logo, nested in the organization
//   {canonical}#webpage         the page itself
//   {canonical}#breadcrumb      BreadcrumbList (absent on the homepage)
//   {canonical}#primaryimage    the page image
//   {canonical}#person | #article | #report | #company   the main entity of a detail page
//
// What is deliberately NOT emitted, and why:
//   FAQPage       Google retired FAQ rich results (May 2026); no benefit, only risk.
//   HowTo         rich results removed in 2023.
//   Review / AggregateRating / Product   the site has no reviews or products.
//   SearchAction  the site has no site search.
//   LocalBusiness the firm is not a storefront; one Organization node carries
//                 both office addresses, on every page, instead of per-page copies.
//   Dates, ratings, awards, funding amounts, employee counts, phone numbers:
//                 not on the site (the Contact page phone is a placeholder), so absent.

import { SITE, absoluteUrl } from "./site.js";
import { SECTORS_PHRASE } from "../data/deck-facts.js";

const CONTEXT = "https://schema.org";

// ---------------------------------------------------------------- utilities

const ZERO_WIDTH = /[​-‍⁠﻿]/g;

/** Collapse whitespace and strip the zero-width characters the archive carries. */
const clean = (text) =>
  String(text ?? "")
    .replace(ZERO_WIDTH, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// An object counts as empty once nothing but "@type" is left (a bare
// PostalAddress or ImageObject says nothing). A lone {"@id": ...} reference is
// real content and stays.
const hasContent = (v) =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  !(typeof v === "number" && !Number.isFinite(v)) &&
  !(Array.isArray(v) && v.length === 0) &&
  !(isObject(v) && !Object.keys(v).some((k) => k !== "@type"));

/**
 * Recursively drop undefined, null, empty strings, empty arrays and objects
 * that carry only "@type". Strings are cleaned; key order is preserved, so
 * output is deterministic and JSON-serializable.
 */
export function compact(value) {
  if (Array.isArray(value)) return value.map(compact).filter(hasContent);
  if (isObject(value)) {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      const next = compact(child);
      if (hasContent(next)) out[key] = next;
    }
    return out;
  }
  return typeof value === "string" ? clean(value) : value;
}

const unique = (list) => [...new Set(list.filter(Boolean))];
const ref = (id) => (id ? { "@id": id } : undefined);
const isHttp = (value) => /^https?:\/\//i.test(String(value || ""));

// "Title | Anthill Ventures" and "Title - Anthill" read as page titles; a
// headline or name should be the bare title.
const stripSiteSuffix = (title) =>
  clean(title).replace(/\s*[|–—-]\s*Anthill(?: Ventures)?\s*$/i, "");

const GENERIC_TITLE = /^(anthill|anthill ventures|insights)$/i;

// Same rule as tidyName in meta.js (the archive has "Ajai kumar"), so a name in
// a listing matches the name on the person's own page. Kept local so this
// module depends only on site.js and deck-facts.js.
const NAME_PARTICLES = new Set(["van", "de", "der", "den", "von", "bin", "al", "da", "di", "la", "le"]);
const tidyName = (name) =>
  clean(name)
    .split(" ")
    .map((w) => (/^[a-z]{3,}$/.test(w) && !NAME_PARTICLES.has(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const normalizePath = (path) => {
  const p = String(path || "/").split(/[?#]/)[0].replace(/\/+$/, "");
  return p || "/";
};

/** href -> site path when it points at this site, otherwise the href unchanged. */
function localPath(href) {
  try {
    const url = new URL(href, "https://www.anthillventures.com");
    return /(^|\.)anthillventures\.com$/.test(url.hostname)
      ? normalizePath(url.pathname)
      : href;
  } catch {
    return href;
  }
}

const langOf = (locale) => String(locale || "en").replace("_", "-");

// ISO 3166-1 alpha-2 is Google's preferred addressCountry form.
const COUNTRY_CODES = { india: "IN", singapore: "SG" };
const countryCode = (country) => {
  const text = clean(country);
  return text.length === 2 ? text.toUpperCase() : COUNTRY_CODES[text.toLowerCase()] || text;
};

// ---------------------------------------------------------------- page data

const blocksOf = (page) => (Array.isArray(page?.blocks) ? page.blocks : []);
const blockText = (b) => clean(b?.text ?? b?.content ?? "");

/**
 * The visible title of a detail page. Mirrors how the listing pages name their
 * cards: the first h1/h2, else the first plain text that is not the back link
 * ("View all"; playbook titles are plain text, not headings).
 */
function visibleHeading(page, path) {
  const blocks = blocksOf(page);
  const heading =
    blocks.find((b) => /^h[12]$/i.test(b.type || b.tag || "") && blockText(b)) ||
    blocks.find((b) => blockText(b) && blockText(b) !== "View all" && !b.href && !b.src);
  if (heading) return blockText(heading);
  const title = stripSiteSuffix(page?.title);
  if (title && !GENERIC_TITLE.test(title)) return title;
  const slug = normalizePath(path).split("/").pop() || "";
  return slug
    .replace(/-[a-z0-9]{5,}$/, "")
    .replaceAll("-", " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// Decorative images the pages carry (arrows, icons, sphere art) are never a
// subject photo. Same rules the rendering code uses.
const DECOR_SRC = /(?:About-Page2|_sphere)\.jpg(?:\?|$)|(?:arrow|icon|decor)[-_\s.%]/i;
const isDecorImage = (image) =>
  DECOR_SRC.test(image?.src || "") ||
  /^(arrow|icon|menu)$/i.test(image?.alt || "") ||
  (/^decor$/i.test(image?.alt || "") && /\.svg(?:\?|$)/i.test(image?.src || ""));

/** First real photo on a detail page, as the site serves it (local copy first). */
function pagePhoto(page) {
  const image = (page?.images || []).find(
    (i) => (i.local || i.src) && !isDecorImage(i) && !/\.svg(?:\?|$)/i.test(i.local || i.src),
  );
  return image ? image.local || image.src : "";
}

/** Footer social links, in LinkedIn, X, Instagram order, query strings dropped. */
function socialProfiles(data) {
  const links = (data?.shared?.footerLinks || [])
    .map((l) => String(l?.href || ""))
    .filter(isHttp);
  const order = [/linkedin\.com/i, /(?:^|\/\/|\.)(?:x|twitter)\.com/i, /instagram\.com/i];
  const found = order.map((re) => links.find((href) => re.test(href))).filter(Boolean);
  const profiles = (found.length ? found : SITE.social || []).map((href) =>
    href.replace(/\?.*$/, ""),
  );
  return unique(profiles);
}

// ---------------------------------------------------------------- context

function makeContext(meta, data) {
  const siteUrl = data?.siteUrl || SITE.url;
  const abs = (path) => (isHttp(path) ? String(path) : absoluteUrl(path, siteUrl));
  // The normalised origin, exactly as the canonical URLs are built.
  const origin = absoluteUrl("/", siteUrl).replace(/\/+$/, "");
  const path = normalizePath(meta?.path);
  const url = meta?.canonical ? abs(meta.canonical) : meta?.found === false ? "" : abs(path);
  return {
    meta,
    data,
    path,
    pages: data?.pages || {},
    siteUrl,
    origin,
    abs,
    url,
    lang: langOf(SITE.locale),
    ids: {
      org: `${origin}/#organization`,
      website: `${origin}/#website`,
      logo: `${origin}/#logo`,
      page: `${url}#webpage`,
      breadcrumb: `${url}#breadcrumb`,
      image: `${url}#primaryimage`,
      person: `${url}#person`,
      article: `${url}#article`,
      report: `${url}#report`,
      company: `${url}#company`,
    },
  };
}

// ---------------------------------------------------------------- site-wide nodes

function organizationNode(ctx) {
  const { abs, ids, data } = ctx;
  return {
    // Plain "Organization", not ["Organization","FinancialService"]. FinancialService
    // is a LocalBusiness subtype (a place customers visit); a venture capital firm
    // has no schema.org type of its own, and claiming LocalBusiness would invite
    // local-pack rules (opening hours, phone, geo) the site neither states nor meets.
    "@type": "Organization",
    "@id": ids.org,
    name: SITE.name,
    url: abs("/"),
    logo: {
      "@type": "ImageObject",
      "@id": ids.logo,
      url: abs(SITE.logo),
      contentUrl: abs(SITE.logo),
      caption: SITE.name,
    },
    // Matches the site's own About copy: "invests in early-stage companies across
    // health, frontier tech and urban lifestyles ... funding, mentorship and market access".
    description: `${SITE.name} invests in early-stage companies across ${SECTORS_PHRASE}, working with founders on funding, mentorship and market access.`,
    slogan: SITE.tagline,
    email: SITE.email,
    sameAs: socialProfiles(data),
    // Both offices exactly as the Contact page lists them (Hyderabad, Singapore).
    address: (SITE.offices || []).map((o) => ({
      "@type": "PostalAddress",
      streetAddress: o.streetAddress,
      addressLocality: o.locality,
      addressRegion: o.region,
      postalCode: o.postalCode,
      addressCountry: countryCode(o.country),
    })),
    areaServed: { "@type": "Country", name: "India" },
    // Only what the site states: the sector triple and early-stage venture capital.
    knowsAbout: [
      "Early-stage venture capital",
      ...SECTORS_PHRASE.split(/,\s*|\s+and\s+/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    ],
  };
}

function websiteNode(ctx) {
  const { abs, ids } = ctx;
  return {
    "@type": "WebSite",
    "@id": ids.website,
    url: abs("/"),
    name: SITE.name,
    alternateName: "Anthill", // the short form the site itself uses throughout its copy
    description: SITE.tagline,
    publisher: ref(ids.org),
    inLanguage: ctx.lang,
  };
}

// ---------------------------------------------------------------- page nodes

// route -> WebPage subtype. Anything not listed is a plain WebPage.
const PAGE_TYPES = {
  "/about": "AboutPage",
  "/contact": "ContactPage",
  "/portfolio": "CollectionPage",
  "/team": "CollectionPage",
  "/speedscalers": "CollectionPage",
  "/stories": "CollectionPage",
  "/insights": "CollectionPage",
};

// listing route -> prefix of the detail pages it lists (matches Collection.jsx)
const COLLECTION_PREFIX = {
  "/portfolio": "/portfolio/",
  "/team": "/team/",
  "/speedscalers": "/mentors/",
  "/stories": "/stories/",
  "/insights": "/playbooks/",
};

/** "team" | "mentor" | "story" | "playbook" | "company" for a detail path, else "". */
function detailKind(path) {
  if (path.startsWith("/team/")) return "team";
  if (path.startsWith("/mentors/")) return "mentor";
  if (path.startsWith("/stories/")) return "story";
  if (path.startsWith("/playbooks/")) return "playbook";
  if (path.startsWith("/portfolio/")) return "company";
  return "";
}

/** ItemList (name + url only) of the detail pages a listing route shows. */
function itemListFor(ctx) {
  const prefix = COLLECTION_PREFIX[ctx.path];
  if (!prefix) return undefined;
  const people = ctx.path === "/team" || ctx.path === "/speedscalers";
  const hub = ctx.pages[ctx.path];
  const links = hub?.links || [];
  const keys = Object.keys(ctx.pages).filter((p) => p.startsWith(prefix));
  // Same order as the rendered listing: the hub's own link order, unlisted last.
  const rank = (p) => {
    const i = links.findIndex((l) => localPath(l.href) === p);
    return i < 0 ? 999 : i;
  };
  keys.sort((a, b) => rank(a) - rank(b));
  if (!keys.length) return undefined;
  return {
    "@type": "ItemList",
    numberOfItems: keys.length,
    itemListElement: keys.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: people ? tidyName(visibleHeading(ctx.pages[p], p)) : visibleHeading(ctx.pages[p], p),
      url: ctx.abs(p),
    })),
  };
}

function imageNode(ctx) {
  const image = ctx.meta?.image;
  if (!image?.url) return undefined;
  return {
    "@type": "ImageObject",
    "@id": ctx.ids.image,
    url: ctx.abs(image.url),
    contentUrl: ctx.abs(image.url),
    width: image.width,
    height: image.height,
    caption: image.alt,
  };
}

function breadcrumbNode(ctx) {
  const crumbs = ctx.meta?.breadcrumbs || [];
  // A single crumb (or the homepage) is not a trail.
  if (ctx.path === "/" || crumbs.length < 2) return undefined;
  const last = crumbs.length - 1;
  return {
    "@type": "BreadcrumbList",
    "@id": ctx.ids.breadcrumb,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      // The final item is the current page; Google lets it omit `item`.
      item: i === last ? undefined : ctx.abs(c.path),
    })),
  };
}

// ---------------------------------------------------------------- main entities

/**
 * The photo of the person or company a detail page is about. When the page's
 * share image already is that photo it is referenced by @id, not repeated.
 */
function subjectImage(ctx) {
  // meta.contentImage (optional, set by buildRouteMeta) is the page's own photo
  // with a written alt; without it, fall back to the first real image in the data.
  const content = ctx.meta?.contentImage;
  const photo = content?.url || pagePhoto(ctx.pages[ctx.path]);
  if (!photo) return undefined;
  const url = ctx.abs(photo);
  if (ctx.meta?.image?.url && ctx.abs(ctx.meta.image.url) === url) return ref(ctx.ids.image);
  return {
    "@type": "ImageObject",
    url,
    contentUrl: url,
    width: content?.width,
    height: content?.height,
    caption: content?.alt,
  };
}

/**
 * Images of an article or report: the page's own picture first (the story's
 * hero, the report's cover), then the share image, each once.
 */
function articleImages(ctx) {
  const own = subjectImage(ctx);
  const share = ctx.meta?.image?.url ? ref(ctx.ids.image) : undefined;
  const list = [own, share].filter(Boolean);
  const seen = new Set();
  const distinct = list.filter((i) => {
    const key = i["@id"] || i.url;
    return seen.has(key) ? false : seen.add(key);
  });
  return distinct.length > 1 ? distinct : distinct[0];
}

function personNode(ctx, kind) {
  const { meta, ids, pages, path } = ctx;
  // Team members work for Anthill. Speed Scalers are outside mentors whose
  // jobTitle is their role elsewhere (e.g. "Co-Founder of Akasa Air"), so
  // `worksFor` would be false for them; `affiliation` states only what the
  // site says: they are part of Anthill's mentor network.
  const organization =
    kind === "team" ? { worksFor: ref(ids.org) } : { affiliation: ref(ids.org) };
  return {
    "@type": "Person",
    "@id": ids.person,
    name: meta.name || visibleHeading(pages[path], path),
    jobTitle: meta.role,
    description: meta.description,
    url: ctx.url,
    image: subjectImage(ctx),
    ...organization,
    sameAs: unique((meta.sameAs || []).filter(isHttp)),
    mainEntityOfPage: ref(ids.page),
  };
}

/** Visible byline of a story: meta.author, else the link after "Written by:". */
function storyAuthor(ctx) {
  const byline = ctx.meta?.author;
  if (byline?.name) {
    return { "@type": "Person", name: byline.name, url: isHttp(byline.url) ? byline.url : undefined };
  }
  const blocks = blocksOf(ctx.pages[ctx.path]);
  const at = blocks.findIndex((b) => /^Written by:?$/i.test(blockText(b)));
  if (at < 0) return undefined;
  const next = blocks[at + 1] || {};
  const name = blockText(next);
  if (!name || /^\d{1,2} \w{3} \d{4}$/.test(name)) return undefined;
  return {
    "@type": "Person",
    name,
    url: isHttp(next.href) ? next.href : undefined,
  };
}

function articleNode(ctx) {
  const { meta, ids, pages, path } = ctx;
  return {
    "@type": "Article",
    "@id": ids.article,
    headline: visibleHeading(pages[path], path) || meta.name || stripSiteSuffix(meta.title),
    description: meta.description,
    image: articleImages(ctx),
    // The byline is on the page, so the author is that person; otherwise the firm.
    author: storyAuthor(ctx) || ref(ids.org),
    publisher: ref(ids.org),
    mainEntityOfPage: ref(ids.page),
    isPartOf: ref(ids.website),
    inLanguage: ctx.lang,
    // Only when meta carries them (they are not invented here).
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
  };
}

/** The downloadable PDF of a playbook, as the page offers it. */
function playbookDocument(ctx) {
  const links = ctx.pages[ctx.path]?.links || [];
  const link =
    links.find((l) => clean(l.text) === "Download") ||
    links.find((l) => /\.pdf(?:$|\?)/i.test(l.local || l.href || ""));
  const target = link?.local || link?.href;
  if (!target || target === "#" || !(isHttp(target) || target.startsWith("/"))) return undefined;
  return {
    "@type": "MediaObject",
    contentUrl: ctx.abs(target),
    encodingFormat: "application/pdf",
  };
}

function reportNode(ctx) {
  const { meta, ids, pages, path } = ctx;
  const document = playbookDocument(ctx);
  return {
    // schema.org has no whitepaper type; Report (an Article subtype) is the
    // closest valid fit for Anthill's published research. It inherits
    // headline/author/publisher, and the PDF is attached as `encoding`.
    "@type": "Report",
    "@id": ids.report,
    headline: visibleHeading(pages[path], path) || meta.name || stripSiteSuffix(meta.title),
    description: meta.description,
    image: articleImages(ctx),
    author: ref(ids.org),
    publisher: ref(ids.org),
    mainEntityOfPage: ref(ids.page),
    isPartOf: ref(ids.website),
    inLanguage: ctx.lang,
    encoding: document,
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
  };
}

function companyNode(ctx) {
  const { meta, ids, pages, path } = ctx;
  const page = pages[path];
  return {
    // A portfolio company is its own Organization. The relationship is stated
    // with `funder` (Anthill supplies capital; the page shows "Year Invested"):
    // true for an investor, and unlike parentOrganization/subOrganization it
    // does not claim ownership or control, which the site never says.
    "@type": "Organization",
    "@id": ids.company,
    name: meta.name || visibleHeading(page, path),
    description: meta.description,
    url: isHttp(meta.websiteUrl) ? meta.websiteUrl : undefined,
    image: subjectImage(ctx),
    funder: ref(ids.org),
    mainEntityOfPage: ref(ids.page),
  };
}

// ---------------------------------------------------------------- assembly

function webPageNode(ctx, family, entity) {
  const { meta, ids } = ctx;
  const profile = family === "team" || family === "mentor";
  const type = profile ? "ProfilePage" : PAGE_TYPES[ctx.path] || "WebPage";
  const entityId = entity ? entity["@id"] : undefined;
  return {
    "@type": type,
    "@id": ids.page,
    url: ctx.url,
    name: meta.title,
    description: meta.description,
    isPartOf: ref(ids.website),
    // Hub and corporate pages are about the firm; detail pages are about their entity.
    about: entityId ? undefined : ref(ids.org),
    publisher: ref(ids.org),
    primaryImageOfPage: meta.image?.url ? ref(ids.image) : undefined,
    breadcrumb: ctx.path === "/" || (meta.breadcrumbs || []).length < 2 ? undefined : ref(ids.breadcrumb),
    inLanguage: ctx.lang,
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    mainEntity: entityId ? ref(entityId) : itemListFor(ctx),
  };
}

export function buildSchema(meta, data) {
  const ctx = makeContext(meta || {}, data || {});
  const graph = [organizationNode(ctx), websiteNode(ctx)];

  // Unknown routes are noindex and have no canonical: site nodes only.
  if (meta && meta.found !== false && ctx.url) {
    const family = detailKind(ctx.path);
    const entity =
      family === "team" || family === "mentor"
        ? personNode(ctx, family)
        : family === "story"
          ? articleNode(ctx)
          : family === "playbook"
            ? reportNode(ctx)
            : family === "company"
              ? companyNode(ctx)
              : undefined;
    graph.push(
      webPageNode(ctx, family, entity),
      breadcrumbNode(ctx),
      imageNode(ctx),
      entity,
    );
  }

  return compact({ "@context": CONTEXT, "@graph": graph });
}

