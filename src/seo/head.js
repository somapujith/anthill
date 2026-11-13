// Single source of truth for the <head> tags of a route. The client (Seo.jsx) upserts these by
// `key`; the build writes them into each prerendered HTML file. Pure ESM, no DOM.
//
//   headTags(meta, graph) -> Array<{ key, tag: "title"|"meta"|"link"|"script", attrs, text? }>
//
// `meta` comes from buildRouteMeta (meta.js), `graph` from buildSchema (schema.js; may be omitted).
// Keys are stable so a tag can be replaced in place when the route changes. Optional tags
// (article and profile extras, image size, publication dates) are emitted only when the value is
// known; nothing is guessed or defaulted.

import { SITE } from "./site.js";

const IMAGE_TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

const imageType = (url) => IMAGE_TYPES[(/\.([a-z0-9]+)(?:\?.*)?$/i.exec(url || "") || [])[1]?.toLowerCase()];

// "@handle" from the X/Twitter profile in SITE.social, if there is one.
const twitterHandle = () => {
  const url = SITE.social.find((u) => /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/?#]+/i.test(u));
  const handle = url && /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([^/?#]+)/i.exec(url)?.[1];
  return handle ? `@${handle}` : "";
};

const BACKSLASH = String.fromCharCode(92);
const LINE_SEPARATORS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029) + "]", "g");

// JSON for an inline <script type="application/ld+json">: "<" is escaped so a string such as
// "</script>" in the data can never close the tag; U+2028/2029 are escaped for older parsers.
export const jsonLdText = (graph) =>
  JSON.stringify(graph)
    .replace(/</g, BACKSLASH + "u003c")
    .replace(LINE_SEPARATORS, (c) => BACKSLASH + "u" + c.charCodeAt(0).toString(16));

const metaName = (key, name, content) => ({ key, tag: "meta", attrs: { name, content: String(content) } });
const metaProp = (key, property, content) => ({ key, tag: "meta", attrs: { property, content: String(content) } });

// Two-word names without punctuation only ("Mike Binn"); honorifics and initials are not split.
const splitName = (name) => {
  const parts = String(name || "").trim().split(/\s+/);
  return parts.length === 2 && parts.every((p) => /^[A-Za-zÀ-ɏ'’-]{2,}$/.test(p)) ? parts : null;
};

export function headTags(meta, graph) {
  if (!meta) return [];
  const tags = [];
  const found = meta.found !== false;

  tags.push({ key: "title", tag: "title", attrs: {}, text: meta.title });
  if (meta.description) tags.push(metaName("description", "description", meta.description));
  if (found && meta.canonical) tags.push({ key: "canonical", tag: "link", attrs: { rel: "canonical", href: meta.canonical } });
  if (meta.robots) tags.push(metaName("robots", "robots", meta.robots));

  // Open Graph.
  tags.push(metaProp("og:type", "og:type", meta.type || "website"));
  tags.push(metaProp("og:site_name", "og:site_name", SITE.name));
  tags.push(metaProp("og:locale", "og:locale", SITE.locale));
  tags.push(metaProp("og:title", "og:title", meta.title));
  if (meta.description) tags.push(metaProp("og:description", "og:description", meta.description));
  if (found && meta.canonical) tags.push(metaProp("og:url", "og:url", meta.canonical));
  const image = meta.image;
  if (image?.url) {
    tags.push(metaProp("og:image", "og:image", image.url));
    const type = imageType(image.url);
    if (type) tags.push(metaProp("og:image:type", "og:image:type", type));
    if (image.alt) tags.push(metaProp("og:image:alt", "og:image:alt", image.alt));
    if (image.width) tags.push(metaProp("og:image:width", "og:image:width", image.width));
    if (image.height) tags.push(metaProp("og:image:height", "og:image:height", image.height));
  }

  // Twitter / X card.
  tags.push(metaName("twitter:card", "twitter:card", "summary_large_image"));
  const handle = twitterHandle();
  if (handle) tags.push(metaName("twitter:site", "twitter:site", handle));
  tags.push(metaName("twitter:title", "twitter:title", meta.title));
  if (meta.description) tags.push(metaName("twitter:description", "twitter:description", meta.description));
  if (image?.url) {
    tags.push(metaName("twitter:image", "twitter:image", image.url));
    if (image.alt) tags.push(metaName("twitter:image:alt", "twitter:image:alt", image.alt));
  }

  // Article extras: only values the data actually has.
  if (meta.type === "article") {
    if (meta.datePublished) tags.push(metaProp("article:published_time", "article:published_time", meta.datePublished));
    if (meta.dateModified) tags.push(metaProp("article:modified_time", "article:modified_time", meta.dateModified));
    if (meta.section) tags.push(metaProp("article:section", "article:section", meta.section));
    if (meta.author?.url) tags.push(metaProp("article:author", "article:author", meta.author.url));
  } else if (meta.type === "profile") {
    const parts = splitName(meta.name);
    if (parts) {
      tags.push(metaProp("profile:first_name", "profile:first_name", parts[0]));
      tags.push(metaProp("profile:last_name", "profile:last_name", parts[1]));
    }
  }

  // Structured data.
  if (graph) {
    tags.push({
      key: "jsonld",
      tag: "script",
      attrs: { type: "application/ld+json", id: "seo-jsonld" },
      text: jsonLdText(graph),
    });
  }
  return tags;
}
