// Site-wide constants for SEO. Pure ESM: runs in the browser and in Node, no DOM, no import.meta.
//
// The default origin is the production domain of the live site this redesign replaces. The build
// passes its own origin (SITE_URL) through `buildRouteMeta(path, { ..., siteUrl })` and
// `absoluteUrl(path, siteUrl)`, so nothing here needs to change for a staging or preview build.
//
// Every fact below is taken from the site itself: the Contact page (offices, email) and the footer
// (social profiles). Nothing is invented; optional fields that the site does not state (for example
// the Indian state) are left out on purpose.

export const SITE = {
  url: "https://www.anthillventures.com",
  name: "Anthill Ventures",
  tagline: "Scale with speed",
  locale: "en_IN",
  themeColor: "#0a0507", // --night in src/styles.css; the dark brand colour behind the hero and footer
  email: "info@anthillventures.com",
  // Same two offices, same wording, as the Contact page. "name" is a neutral label, not a legal entity.
  offices: [
    {
      name: "Hyderabad office",
      streetAddress: "Ramanaidu Studios, Road 79, Jubilee Hills",
      locality: "Hyderabad",
      postalCode: "500096",
      country: "IN",
    },
    {
      name: "Singapore office",
      streetAddress: "10 Cross Street #05-101, Office 50/77",
      locality: "Singapore",
      postalCode: "048417",
      country: "SG",
    },
  ],
  // Footer social links (LinkedIn, X, Instagram). Used for Organization.sameAs.
  social: [
    "https://in.linkedin.com/company/anthill-ventures",
    "https://x.com/anthillventures",
    "https://www.instagram.com/anthillcapitalventures/",
  ],
  // Produced by the asset pipeline; per-section share images live next to the default one.
  logo: "/brand/logo-512.png",
  defaultOg: "/og/anthill-ventures.png",
};

const ABSOLUTE = /^[a-z][a-z0-9+.-]*:\/\//i;

// Clean origin: "https://example.com/" -> "https://example.com". Anything that is not an http(s)
// URL falls back to `fallback`, so a typo in SITE_URL can never produce relative canonicals.
export function normalizeSiteUrl(value, fallback = SITE.url) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!/^https?:\/\/[^\s/?#]+/i.test(raw)) return fallback;
  return raw.replace(/[?#].*$/, "").replace(/\/+$/, "");
}

// Canonical form of a route or asset path as an absolute URL: leading slash, no trailing slash
// except for "/", no duplicate slashes, fragment dropped, query kept (asset cache-busters).
// Absolute URLs pass through untouched.
export const absoluteUrl = (path = "/", siteUrl = SITE.url) => {
  const raw = String(path ?? "").trim();
  if (ABSOLUTE.test(raw)) return raw;
  const origin = normalizeSiteUrl(siteUrl);
  const [beforeHash] = raw.split("#");
  const [pathname, ...queryParts] = beforeHash.split("?");
  const query = queryParts.length ? `?${queryParts.join("?")}` : "";
  let clean = `/${pathname}`.replace(/\/{2,}/g, "/");
  if (clean.length > 1) clean = clean.replace(/\/+$/, "");
  return `${origin}${clean}${query}`;
};
