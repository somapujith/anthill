import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import view from "../data/view-content.json";
import { SITE } from "./site.js";
import { buildRouteMeta } from "./meta.js";
import { buildSchema } from "./schema.js";
import { headTags } from "./head.js";

/*
 * Keeps the real <head> in step with the current route.
 *
 * Tags come from head.js (the same module the static build uses), each with a
 * stable `key`. The client upserts them by that key (data-seo-key), adopts the
 * static defaults that index.html / the prerender ship (data-seo-default or an
 * unmarked tag with the same identity), and removes tags the route no longer
 * has (article:* after leaving an article, the canonical on a not-found page).
 * Every step is idempotent, so React StrictMode double effects, hot reloads
 * and repeated navigations never create duplicates.
 */

const KEY = "data-seo-key";
const DEFAULT = "data-seo-default";
const MAX_CACHE = 200;

/** Same normalisation ContentPage uses to look a page up, so head and body agree. */
export function normalizePath(pathname) {
  return String(pathname || "/").replace(/[?#].*$/, "").replace(/\/$/, "") || "/";
}

/* ---------- site origin ---------- */

let siteUrl;
function resolveSiteUrl() {
  if (siteUrl !== undefined) return siteUrl;
  let url = "";
  try {
    url = import.meta.env?.VITE_SITE_URL || "";
  } catch {
    url = "";
  }
  // A prerendered page already carries the origin it was built for; keep the
  // client canonical identical to it (a canonical that differs between the raw
  // HTML and the rendered DOM lets Google pick either).
  if (!url && typeof document !== "undefined") {
    const href = document.head?.querySelector('link[rel="canonical"]')?.getAttribute("href");
    try {
      if (href) url = new URL(href).origin;
    } catch {
      url = "";
    }
  }
  siteUrl = url ? url.replace(/\/+$/, "") : null;
  return siteUrl;
}

/* ---------- route -> head tags (memoised per path) ---------- */

const cache = new Map();

function toText(value) {
  if (value == null) return undefined;
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function routeHead(pathname) {
  const path = normalizePath(pathname);
  const origin = resolveSiteUrl();
  const cacheKey = `${origin || ""}|${path}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const data = { pages: view.pages, shared: view.shared, ...(origin ? { siteUrl: origin } : {}) };
  const meta = buildRouteMeta(path, data);
  const graph = buildSchema(meta, data);
  const entry = { meta, tags: headTags(meta, graph) };
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(cacheKey, entry);
  return entry;
}

/* ---------- DOM upsert ---------- */

// Identity of a head tag, computed the same way from a tag descriptor or a live
// element, used only to adopt untagged defaults. Keys do the real matching.
function identity(tagName, get) {
  const name = String(tagName).toLowerCase();
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
    if (!rel) return null;
    return `link|${rel}|${get("hreflang") || ""}|${get("sizes") || ""}|${get("type") || ""}|${get("media") || ""}`;
  }
  if (name === "script") {
    const id = get("id");
    return id ? `script|id|${id}` : null; // never hijack someone else's script
  }
  return null;
}

const tagIdentity = (tag) =>
  identity(tag.tag, (attr) => {
    const v = tag.attrs?.[attr];
    return v == null || v === false ? "" : String(v);
  });
const elIdentity = (el) => identity(el.localName, (attr) => el.getAttribute(attr) || "");

function syncElement(el, tag) {
  const attrs = tag.attrs || {};
  const wanted = new Set();
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    const next = value === true ? "" : String(value);
    wanted.add(name);
    if (el.getAttribute(name) !== next) el.setAttribute(name, next);
  }
  for (const attr of Array.from(el.attributes)) {
    if (!wanted.has(attr.name) && attr.name !== KEY) el.removeAttribute(attr.name);
  }
  const text = toText(tag.text);
  if (text !== undefined && el.textContent !== text) el.textContent = text;
}

export function applyHeadTags(tags, doc = document) {
  const head = doc.head;
  if (!head) return;

  const byKey = new Map(); // key -> managed elements already carrying it
  const pool = []; // untagged candidates: static defaults and unmarked tags
  for (const el of Array.from(head.children)) {
    const key = el.getAttribute(KEY);
    if (key) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(el);
    } else if (el.hasAttribute(DEFAULT) || elIdentity(el)) {
      pool.push(el);
    }
  }

  const keep = new Set();
  const identities = new Set();
  for (const tag of tags) {
    if (!tag || !tag.key || !tag.tag) continue;
    const id = tagIdentity(tag);
    if (id) identities.add(id);

    let el = byKey.get(tag.key)?.find((candidate) => !keep.has(candidate));
    if (!el && id) {
      const at = pool.findIndex((candidate) => elIdentity(candidate) === id);
      if (at !== -1) el = pool.splice(at, 1)[0];
    }
    const created = !el;
    if (!el) el = doc.createElement(tag.tag);
    syncElement(el, tag);
    el.setAttribute(KEY, tag.key);
    el.removeAttribute(DEFAULT);
    if (created) head.appendChild(el);
    keep.add(el);
  }

  // Anything managed that this route no longer has, plus surplus duplicates.
  for (const list of byKey.values()) {
    for (const el of list) if (!keep.has(el)) el.remove();
  }
  for (const el of pool) {
    if (el.hasAttribute(DEFAULT) || identities.has(elIdentity(el))) el.remove();
  }
}

function localeToLang(locale) {
  const lang = String(locale || "en").replace(/_/g, "-");
  return /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(lang) ? lang : "en";
}

export function applyRoute(pathname, doc = document) {
  const { meta, tags } = routeHead(pathname);
  applyHeadTags(tags, doc);
  const lang = localeToLang(SITE?.locale);
  if (doc.documentElement.getAttribute("lang") !== lang) doc.documentElement.setAttribute("lang", lang);
  return meta;
}

/* ---------- React ---------- */

export function useSeo(pathname) {
  // Layout effect: the head is correct before the browser paints the route.
  useLayoutEffect(() => {
    applyRoute(pathname);
  }, [pathname]);
}

export default function Seo() {
  const { pathname } = useLocation();
  useSeo(normalizePath(pathname));
  return null;
}
