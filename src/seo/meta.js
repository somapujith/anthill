// Route metadata for SEO: one pure function that turns a route plus the view data into the title,
// description, canonical, robots, share image and breadcrumbs for that page.
//
// Pure ESM, no DOM, no import.meta, no JSX. It runs in the browser (client-side head updates) and in
// Node (prerender, sitemap, validation). The view data is always passed in; this module never imports it.
//
// Copy policy
//  - The ten hub pages and the privacy/utility pages carry hand-written titles and descriptions in
//    HUB_COPY. They reuse SECTORS_PHRASE from deck-facts so they stay consistent with the site copy.
//  - Detail pages (portfolio, team, mentors, stories, playbooks) are templated from the page data and
//    the parent listing cards. DETAIL_COPY holds the few cases where the archive text cannot produce a
//    good title or description (a merged heading, a glitched paragraph, a role too long for a title).
//  - Nothing is invented: every fact comes from the page, its listing card or deck-facts.

import { SITE, absoluteUrl, normalizeSiteUrl } from "./site.js";
import { DECK, SECTORS_PHRASE } from "../data/deck-facts.js";

export const BRAND = SITE.name;
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 158;

const SUFFIX = ` | ${BRAND}`;
const ROBOTS_INDEX = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const ROBOTS_NOINDEX = "noindex,follow";

/* ------------------------------------------------------------------ */
/* Routes, sections and hand-written hub copy                          */
/* ------------------------------------------------------------------ */

// Section labels match the site navigation (src/App.jsx `navigation`).
export const SECTIONS = {
  "/about": { label: "About", slug: "about" },
  "/philosophy": { label: "Philosophy", slug: "philosophy" },
  "/programs": { label: "Programs", slug: "programs" },
  "/portfolio": { label: "Portfolio", slug: "portfolio" },
  "/speedscalers": { label: "Speed Scalers", slug: "speedscalers" },
  "/stories": { label: "Stories", slug: "stories" },
  "/insights": { label: "Insights", slug: "insights" },
  "/team": { label: "Team", slug: "team" },
  "/contact": { label: "Contact", slug: "contact" },
};

// Detail route prefix -> parent hub.
const PARENT = {
  portfolio: "/portfolio",
  team: "/team",
  mentors: "/speedscalers",
  stories: "/stories",
  playbooks: "/insights",
};

const HUB_ORDER = [
  "/",
  "/about",
  "/philosophy",
  "/programs",
  "/portfolio",
  "/speedscalers",
  "/stories",
  "/insights",
  "/team",
  "/contact",
  "/privacy-policy",
];
const DETAIL_ORDER = ["portfolio", "mentors", "stories", "playbooks", "team"];

// Hand-written copy for every hub and utility route. `keyword` and `intent` document the target
// of the page (docs/seo.md). Title <= 60 characters with the brand once; description 120-158.
export const HUB_COPY = {
  "/": {
    title: "Anthill Ventures: Early-Stage Venture Capital in India",
    description: `Anthill Ventures backs early-stage founders in ${SECTORS_PHRASE} with capital, mentorship and market access. Scale with speed.`,
    keyword: "early-stage venture capital India",
    intent: "Brand and category (navigational plus commercial investigation)",
  },
  "/about": {
    title: "About Anthill Ventures | Early-Stage VC Firm in India",
    description: `Anthill Ventures invests in early-stage companies in ${SECTORS_PHRASE}, backing founders with funding, mentorship and market access.`,
    keyword: "about Anthill Ventures, early-stage VC firm",
    intent: "Navigational and informational: who the firm is and what it invests in",
  },
  "/philosophy": {
    title: "Our Investment Philosophy | Anthill Ventures",
    description:
      "How Anthill Ventures sources, invests in and scales early-stage companies, using its Scalability Quotient to pair capital with mentorship and market access.",
    keyword: "venture investment philosophy, how we invest",
    intent: "Informational: the investment approach and assessment framework",
  },
  "/programs": {
    title: "Venture Scaling Program for Startups | Anthill Ventures",
    description:
      "Apply to Anthill's venture scaling program: early-stage companies get access to capital, industry expertise and distribution networks to scale with speed.",
    keyword: "venture scaling program for startups India",
    intent: "Transactional: founders deciding whether to apply",
  },
  "/portfolio": {
    title: "Portfolio Companies | Anthill Ventures",
    description:
      "Explore the Anthill Ventures portfolio of early-stage companies across health, consumer, urban tech and media, from Bold Care and Broadway to Zypp Electric.",
    keyword: "Anthill Ventures portfolio companies",
    intent: "Navigational and informational: proof of track record",
  },
  "/speedscalers": {
    title: "Speed Scalers: Mentors and Operators | Anthill Ventures",
    description:
      "Meet the founders, operators and industry specialists in Anthill Ventures' Speed Scaler mentorship network, who guide portfolio companies to scale with speed.",
    keyword: "startup mentors India, Speed Scalers",
    intent: "Informational: the mentorship network behind the portfolio",
  },
  "/stories": {
    title: "Founder Stories and Market Insights | Anthill Ventures",
    description:
      "Founder interviews, conversations and news from across the Anthill Ventures network, plus market perspectives on consumer and health categories in India.",
    keyword: "founder stories India, startup market insights",
    intent: "Informational: editorial content that builds topical authority",
  },
  "/insights": {
    title: "Insights: Reports and Playbooks | Anthill Ventures",
    description:
      "Anthill Ventures reports and playbooks on company building, market trends and portfolio impact, from the Climate Impact Report to a carbon markets whitepaper.",
    keyword: "startup playbooks and reports India",
    intent: "Informational: downloadable research for founders and investors",
  },
  "/team": {
    title: "Our Team: Investors and Operators | Anthill Ventures",
    description:
      "Meet the investment and operations team at Anthill Ventures, led by Founder & CEO Prasad Vanga, working alongside founders and portfolio companies.",
    keyword: "Anthill Ventures team",
    intent: "Navigational and trust: who is behind the fund",
  },
  "/contact": {
    title: "Contact Anthill Ventures | Hyderabad and Singapore",
    description:
      "Pitch your company or discuss a partnership with Anthill Ventures. Write to info@anthillventures.com or visit our offices in Hyderabad, India and Singapore.",
    keyword: "contact Anthill Ventures",
    intent: "Navigational and transactional: pitch, partner or enquire",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Anthill Ventures",
    description:
      "How Anthill Ventures collects, uses and protects personal information and cookie data when you use this website or contact us. Last updated July 1, 2025.",
    keyword: "(none: legal page)",
    intent: "Trust and compliance",
  },
  "/info/styleguide": {
    title: "Style Guide | Anthill Ventures",
    description:
      "Reference page for the Anthill Ventures website design system, covering color, typography, buttons and form components. Kept out of search results.",
    keyword: "(none: noindex utility page)",
    intent: "Internal reference",
  },
  "/info/license": {
    title: "License | Anthill Ventures",
    description:
      "Licensing notes for the images, videos and fonts used on the Anthill Ventures website, including Unsplash and Pexels media and open-source fonts.",
    keyword: "(none: noindex utility page)",
    intent: "Internal reference",
  },
  "/info/changelog": {
    title: "Changelog | Anthill Ventures",
    description:
      "Version history of the Anthill Ventures website. The changelog records Version 1.0 as the initial release of the site. Kept out of search results.",
    keyword: "(none: noindex utility page)",
    intent: "Internal reference",
  },
};

// Section share images (1200x630, produced by the asset pipeline) with their alt text.
const SECTION_OG_ALT = {
  home: "Anthill Ventures: scale with speed",
  about: "Anthill Ventures: about the firm",
  philosophy: "Anthill Ventures: our investment philosophy",
  programs: "Anthill Ventures: venture scaling program",
  portfolio: "Anthill Ventures: portfolio companies",
  speedscalers: "Anthill Ventures: Speed Scaler mentors",
  team: "Anthill Ventures: our team",
  stories: "Anthill Ventures: founder stories",
  insights: "Anthill Ventures: reports and playbooks",
  contact: "Anthill Ventures: get in touch",
};
const DEFAULT_OG_ALT = "Anthill Ventures: scale with speed";

// Curated exceptions for detail pages where the archive text is unusable as-is.
//  title       full title tag (brand included), <= 60 characters
//  descriptor  short company descriptor for "<Name>: <descriptor> | Anthill Ventures portfolio"
//  roleShort   role used in a person's title when the full role is too long
//  description full meta description
export const DETAIL_COPY = {
  // Portfolio: a short descriptor for the title and a one-sentence summary written from each
  // company's own paragraph (the archive paragraphs are dated news copy). "Backed by Anthill
  // Ventures since <Year Invested>." is appended automatically when it fits.
  "/portfolio/bold-care": {
    descriptor: "men's wellness brand",
    summary: "Bold Care is a men's wellness brand in India, pairing clinically validated products with discreet delivery.",
  },
  "/portfolio/broadway": {
    descriptor: "experiential retail",
    summary: "Broadway is an experiential department store for new-age brands, with stores in Delhi and Hyderabad.",
  },
  "/portfolio/deep-holistics": {
    descriptor: "AI wellness",
    summary: "Deep Holistics turns lifestyle data, lab reports and genetics into personalized health recommendations.",
  },
  "/portfolio/erly-sign-i031w": {
    descriptor: "oral cancer test",
    summary: "Erly Sign is building a saliva-based oral cancer test that delivers non-invasive results in 15 minutes.",
  },
  "/portfolio/ikonz": {
    descriptor: "AI holographic avatars",
    summary: "Ikonz is a Hyderabad-based AI and holographic technology company building lifelike digital avatars.",
  },
  "/portfolio/super-human-9j6et": {
    descriptor: "human improvement",
    summary: "Super Human is a global platform bringing scientists, policymakers and visionaries together around biotech, longevity and medicine.",
  },
  "/portfolio/videoverse-toch": {
    descriptor: "AI video platform",
    summary: "Videoverse is an AI-driven video platform for broadcasters, OTT and media platforms, and creators.",
  },
  "/portfolio/zypp-electric": {
    descriptor: "EV logistics",
    summary: "Zypp Electric runs an electric vehicle fleet for last-mile delivery in India, with a SaaS platform to manage fleets.",
  },
  // Team: the archive bios are first person or open with a restated name and a track-record figure.
  "/team/prasad-vanga": {
    description:
      "Prasad Vanga, Founder & CEO of Anthill Ventures, leads global strategy, fund management and venture building, with 20 years in business transformation.",
  },
  "/team/sailesh-sigatapu": {
    description:
      "Sailesh Sigatapu, General Partner at Anthill Ventures, manages fundraising and investor relations with Indian family offices and oversees Urban Tech.",
  },
  "/team/mike-binn": {
    description:
      "Mike Binn, Partner at Anthill Ventures, expands the firm's US footprint for tech transfer and helps Indian technology companies scale in the US market.",
  },
  "/team/bhargav-panguluri": {
    description:
      "Bhargav Panguluri, Portfolio Manager at Anthill Ventures, optimizes the venture portfolio to drive value and support the growth of invested companies.",
  },
  "/team/fazal-mohammed": {
    description:
      "Fazal Mohammed, Operations Manager at Anthill Ventures since 2021, brings a background in operations, team management and recruitment to the firm.",
  },
  "/team/goutham-uppaluri": {
    description:
      "Goutham Uppaluri, Head of Strategy at Anthill Ventures, shapes the firm's strategic direction and looks for new opportunities to drive growth.",
  },
  "/team/nagendra-khatri": {
    description:
      "Nagendra Khatri, Associate in Investments at Anthill Ventures, sources and executes consumer deals across D2C brands, fashion, food and beverage and spirits.",
  },
  // Mentors whose full role cannot fit in a title.
  "/mentors/ajai-kumar": { roleShort: "Founder of HCG" },
  "/mentors/anjali-ajai-kumar": { roleShort: "Executive Director" },
  "/mentors/neeraj-bhargava": { roleShort: "Founder, Zodius Advisors" },
  "/mentors/srini-koppolu": { roleShort: "Founder, Veooz Labs" },
  "/mentors/rana-daggubati": { roleShort: "Actor, Film Producer" },
  "/mentors/vivek-biyani": {
    roleShort: "Director, Future Group",
    description:
      "Vivek Biyani, Director at Future Group and Big Bazaar Direct, leads the group's digital business initiatives, including strategy and new business development.",
  },
  "/mentors/amit-mehta": {
    description:
      "Amit Mehta, Director at LNB Group, is a qualified Chartered Accountant and Harvard Business School alumnus in Anthill Ventures' Speed Scaler mentor network.",
  },
  // Articles: the headings in the archive are merged or too long for a title tag.
  "/stories/building-the-anthill": {
    title: "Building the Anthill: Our Story | Anthill Ventures",
    description:
      "The story behind the Anthill name: a tale from ancient India and the ecology of anthills, and how both shape the way Anthill Ventures builds with founders.",
  },
  "/stories/functional-beverages-in-india-investment-thesis-2025": {
    title: "Functional Beverages in India: Our Thesis | Anthill Ventures",
    description:
      "Anthill's 2025 investment thesis on functional beverages in India: the market landscape and the opportunity in drinks for energy, immunity and digestion.",
  },
  "/stories/indias-gut-health-obsession-how-digestion-is-becoming-a-new-consumer-category": {
    title: "India's Gut Health Obsession | Anthill Ventures",
  },
  "/playbooks/carbon-markets": {
    title: "India Carbon Markets: Startup Whitepaper | Anthill Ventures",
    description:
      "Anthill's whitepaper maps five startup verticals across India's carbon market value chain, benchmarked against the EU, Germany, China and Indonesia.",
  },
  "/playbooks/climate-impact-report": {
    title: "Climate Impact Report: 17 Companies | Anthill Ventures",
    description:
      "Anthill's first Climate Impact Report maps the measurable impact of 17 climate portfolio companies across energy, mobility, water, materials and ESG.",
  },
  "/playbooks/urban-lifestyle": {
    title: "Urban Lifestyle Thesis: How India Lives | Anthill Ventures",
    name: "The Anthill Urban Lifestyle Thesis: Investing in the Future of How India Lives",
    description:
      "Anthill's Urban Lifestyle Thesis outlines our conviction in founder-led, digitally native brands across fashion, beauty, wellness and food and beverage.",
  },
};

// Pixel sizes of the content images chosen for detail pages (read from public/media with a script;
// see docs/seo.md for how to refresh the table). Images outside the table are never used as share
// images because their aspect ratio is unknown.
const MEDIA_SIZES = {
  "/media/13bf3b79b-6899a2ae5c03e1dc4e6e971e_boldcare.jpg": [1600, 1067],
  "/media/0533d1bb8-6899a269d29fc223a20aad16_Broadway-stories-Creative.jpg": [1600, 1067],
  "/media/978efea45-6899a279889bb95f7a49e511_deepholistics.jpg": [1600, 1067],
  "/media/811596c82-6899a2c74df9d15a1774d04d_Erlysign.jpg": [1600, 1067],
  "/media/3d937f380-6899a2bb39288fa31fdd77d3_Ikonz.jpg": [1600, 1067],
  "/media/972ed1762-6899a24adf139b9dcc4990ce_superhuman-creative.jpg": [1600, 1067],
  "/media/e3ea941e8-68860b34941095af17549813_videoverse.png": [1024, 414],
  "/media/a027f3875-6899a291d1cc58fee12b1d7a_zypp-electric.jpg": [1600, 1067],
  "/media/197831884-685d01955da70d47316033a3_Bhargav.jpg": [1280, 1600],
  "/media/fdae65937-685d016ebff81eefb4cd39a1_Faizal.jpg": [1280, 1600],
  "/media/66a53ef42-685a76cb03bc3c04bfcdd7c7_Frame-10-min.jpg": [1550, 1600],
  "/media/cdcfaec0d-685d0230d20b696cac199f76_mikebinn.jpg": [500, 500],
  "/media/2d11f29ce-685d00822f11d3e2b2d03acb_Nagendhra.jpg": [1280, 1600],
  "/media/258c809a0-685d02954459dc2f7a2a3394_prasad.jpg": [1280, 1600],
  "/media/daa203417-685d025f2e9f6cbb90892138_Sailesh.jpg": [1280, 1600],
  "/media/400958a5e-68836884dbc0636e998354d9_Aditya_Ghosh.jpg": [1280, 1600],
  "/media/82d3061b7-68837db26aa4014d31974abc_Ajai-Kumar.jpg": [1280, 1600],
  "/media/cfc2e6b30-68837eee44ebf10bac02ed11_amit.jpg": [1280, 1600],
  "/media/2535b2ac1-688381b175e6fd2efffa49bd_Anjali-Ajai-Kumar.jpg": [1280, 1600],
  "/media/14f57ac61-688366e7051220dea3b1ebb7_Chris-Rynning.jpg": [1280, 1600],
  "/media/51935a5fc-688361af5afe74f4ab3d2fb0_Cristina-Ventura.jpg": [1280, 1600],
  "/media/f6f904101-68836586f0a58c4f193c7ce9_Kiran-Grandhi.jpg": [1280, 1600],
  "/media/fc6a62fdb-68837949c52104c91da950d7_Kishore-Biyani.jpg": [1280, 1600],
  "/media/ec2a4744a-68836a10a98456d3bcb8f106__neeraj_bhargava.jpg": [1280, 1600],
  "/media/472c76f31-6883770033892550496c09f0_Rana-Daggubati.jpg": [1280, 1600],
  "/media/a36ef625e-688362a94e0c3edd8ea3d239_Srini-Koppolu.jpg": [1280, 1600],
  "/media/749d314f0-688378c29a8c975734d7f305_Vivek-Biyani.jpg": [1280, 1600],
  "/media/75301b3aa-698c4d61fa3181dd37a1b51b_33.jpg": [1280, 720],
  "/media/15f1de0b4-698d8a6b62e20b470b24b570_https-3A-2F-2Fsubstack-post-media.s3.amazonaws.com-2Fpublic-2Fimages-2F403d1ca6-29ef-4fd9-91cd-1e91a176904a_3780x1890.jpeg": [1456, 728],
  "/media/b2e51fd8a-6985c1b607a80b56f26b3835_1.webp": [1024, 756],
  "/media/b807cb9bc-6a22a2940c94eddbfb67e726_India-Carbon-Markets_-Whitepaper-by-Anthill-Ventures_page-0001.jpg": [1236, 1600],
  "/media/eb0730fb2-6a22ac6afecd24b0f8b547a8_anthill-ventures-climate-impact-report-2026-images-0.jpg": [1600, 900],
  "/media/588ef6c77-6952538f85820fe8bb14832a_Anthill-Urban-Lifestyle-Thesis_page-0001.jpg": [1131, 1600],
};

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

// Zero-width and no-break characters the archive text carries (built from code points so the source stays readable).
const INVISIBLE = new RegExp("[" + String.fromCharCode(0x200b, 0x200c, 0x200d, 0x2060, 0xfeff) + "]", "g");
const NBSP = new RegExp(String.fromCharCode(0xa0), "g");
const STOP_END = new Set(
  "a an and as at by for from in into like of on or such that the to which who whose with including is are was were than but so".split(" "),
);

export function clean(value) {
  return String(value ?? "")
    .replace(INVISIBLE, "")
    .replace(NBSP, " ")
    .replace(/([a-z]),(?=[A-Z])/g, "$1, ")
    .replace(/\.?Long Description$/i, ".")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}

const ABBREV = /^(?:Dr|Mr|Mrs|Ms|Prof|St|Ltd|Inc|Co|Corp|vs|etc|Jr|Sr)\.$/i;
const INITIAL = /(?:^|\.)[A-Za-z]\.$/;

export function sentences(text) {
  const out = [];
  const src = clean(text);
  const re = /[.!?]+["”’)]*\s+/g;
  let start = 0;
  let m;
  while ((m = re.exec(src))) {
    const upto = src.slice(start, m.index + m[0].trimEnd().length);
    const last = upto.split(/\s+/).pop();
    const next = src.slice(m.index + m[0].length, m.index + m[0].length + 1);
    if (ABBREV.test(last) || INITIAL.test(last) || !/[A-Z0-9"“‘'(₹$]/.test(next)) continue;
    out.push(upto.trim());
    start = m.index + m[0].length;
  }
  const tail = src.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

function stripEnd(text) {
  let t = text.replace(/[\s,;:–—-]+$/, "");
  for (;;) {
    const m = t.match(/\s+(\S+)$/);
    if (m && STOP_END.has(m[1].toLowerCase().replace(/[^a-z]/g, ""))) t = t.slice(0, m.index).replace(/[\s,;:–—-]+$/, "");
    else break;
  }
  return t;
}

// Cut text to at most `max` characters on a word boundary (never mid-word, never an ellipsis).
// Prefers a clause break (comma, semicolon, dash, colon) when one sits in the last third.
export function cutWords(text, max, { terminal = true } = {}) {
  const src = clean(text);
  const budget = terminal ? max - 1 : max;
  if (src.length <= max) return src;
  let slice = src.slice(0, budget + 1);
  const space = slice.lastIndexOf(" ");
  slice = space > 0 && slice.length > budget ? slice.slice(0, space) : slice.slice(0, budget);
  const clause = Math.max(slice.lastIndexOf(","), slice.lastIndexOf(";"), slice.lastIndexOf(":"), slice.lastIndexOf(" —"), slice.lastIndexOf(" -"));
  if (clause > budget * 0.62) slice = slice.slice(0, clause);
  slice = stripEnd(slice);
  return terminal && !/[.!?]$/.test(slice) ? `${slice}.` : slice;
}

// Build a description of 120-158 characters from whole sentences; cut the last one on a word
// boundary if needed; append optional fillers only while there is room and the text is too short.
export function fitDescription(parts, fillers = []) {
  const list = parts.map(clean).filter(Boolean);
  let out = "";
  for (const part of list) {
    const joined = out ? `${out} ${part}` : part;
    if (joined.length <= DESCRIPTION_MAX) {
      out = joined;
      continue;
    }
    if (out.length >= DESCRIPTION_MIN) break;
    const room = DESCRIPTION_MAX - (out ? out.length + 1 : 0);
    const cut = cutWords(part, room);
    if (cut.length >= 24) out = out ? `${out} ${cut}` : cut;
    break;
  }
  for (const filler of fillers) {
    if (out.length >= DESCRIPTION_MIN) break;
    const joined = `${out} ${filler}`.trim();
    if (joined.length <= DESCRIPTION_MAX) out = joined;
  }
  return out;
}

// Title with the brand suffix; if the base does not fit it is cut on a word boundary.
export function fitTitle(base, suffix = SUFFIX) {
  const b = clean(base);
  if (b.length + suffix.length <= TITLE_MAX) return `${b}${suffix}`;
  const cut = cutWords(b, TITLE_MAX - suffix.length, { terminal: false });
  return `${cut}${suffix}`;
}

const PARTICLES = new Set(["van", "de", "der", "den", "von", "bin", "al", "da", "di", "la", "le"]);
export function tidyName(name) {
  return clean(name)
    .split(" ")
    .map((w) => (/^[a-z]{3,}$/.test(w) && !PARTICLES.has(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
const longMonth = (name) => MONTHS[String(name).slice(0, 3).toLowerCase()];

// "30 Jan 2025" -> "2025-01-30"
function isoFromShort(text) {
  const m = /^(\d{1,2}) ([A-Za-z]{3,9}) (\d{4})$/.exec(clean(text));
  const mm = m && longMonth(m[2]);
  return m && mm ? `${m[3]}-${mm}-${m[1].padStart(2, "0")}` : undefined;
}

/* ------------------------------------------------------------------ */
/* Path handling                                                       */
/* ------------------------------------------------------------------ */

export function normalizePath(path) {
  let p = String(path ?? "/").trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(p)) {
    try {
      p = new URL(p).pathname;
    } catch {
      /* keep as is */
    }
  }
  p = p.split("#")[0].split("?")[0];
  p = `/${p}`.replace(/\/{2,}/g, "/").replace(/\/index\.html$/i, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

const isNoindex = (path) => /^\/info(\/|$)/.test(path);

function findPage(path, pages) {
  if (!pages) return null;
  if (pages[path]) return { key: path, page: pages[path] };
  const lower = path.toLowerCase();
  const key = Object.keys(pages).find((k) => normalizePath(k).toLowerCase() === lower);
  return key ? { key: normalizePath(key), page: pages[key] } : null;
}

const detailInfo = (path) => {
  const m = /^\/(portfolio|team|mentors|stories|playbooks)\/[^/]+$/.exec(path);
  return m ? { kind: m[1], parent: PARENT[m[1]] } : null;
};

/* ------------------------------------------------------------------ */
/* Reading the archive data                                            */
/* ------------------------------------------------------------------ */

const DECOR_SRC = /(?:arrow|icon|decor|sprite|favicon|logo-)[-_\s.%]/i;
const DECOR_ALT = /^(arrow|icon|menu|decor|arrow diagonal)$/i;

const textBlocks = (page) =>
  (page?.blocks || [])
    .filter((b) => b && b.type !== "image" && typeof b.text === "string")
    .map((b) => ({ type: String(b.type || "p").toLowerCase(), text: clean(b.text) }))
    .filter((b) => b.text && b.text !== "View all");

const isMeaningfulImage = (img) => {
  const src = img?.local || img?.src || "";
  if (!src || /\.svg(?:\?|$)/i.test(src)) return false;
  if (DECOR_SRC.test(src) || DECOR_ALT.test(img.alt || "")) return false;
  return true;
};

const firstContentImage = (page) => (page?.images || []).find(isMeaningfulImage);

// Card data from a parent listing page: href -> { texts:[...], image }
function listingCards(pages, parentPath) {
  const map = new Map();
  for (const card of pages?.[parentPath]?.cards || []) {
    const href = card?.links?.[0]?.href;
    if (!href) continue;
    const texts = (card.blocks || [])
      .filter((b) => b && b.type !== "image" && b.text)
      .map((b) => clean(b.text))
      .filter(Boolean);
    map.set(normalizePath(href), { texts, links: card.links });
  }
  return map;
}

const FIGURE_FIXES = [
  ["a 5.4× scale, guiding a portfolio of over 80 successful startup investments", `a ${DECK.grossMoic}× gross MOIC, guiding a portfolio of ${DECK.portfolioCompanies} successful startup investments`],
  ["Anthill has scaled at a 5.4x multiple in just 10 years", `Anthill has delivered a ${DECK.grossMoic}x gross MOIC in just 10 years`],
];
// Same replacements the site applies on screen (core.jsx `figureCopy`), so meta never shows the
// archive's old track-record figures.
const figures = (text) => FIGURE_FIXES.reduce((t, [from, to]) => t.replace(from, to), text);
const CLAIMY = /\bMOIC\b|\bIRR\b|\b\d+(?:\.\d+)?\s?[x×]\b|\bmultiple\b/i;

const socialLinks = (page) =>
  [...new Set((page?.links || []).map((l) => l.href).filter((h) => /^https?:\/\/(?:[a-z]+\.)?(?:linkedin|x|twitter|instagram)\.com\//i.test(h || "")))];

/* ------------------------------------------------------------------ */
/* Share images                                                        */
/* ------------------------------------------------------------------ */

const SHARE_ASPECT = [1.2, 2.2]; // landscape-ish images survive the 1.91:1 crop; portraits and strips do not

function sectionImage(slug, siteUrl) {
  const key = slug && SECTION_OG_ALT[slug] ? slug : null;
  return {
    url: absoluteUrl(key ? `/og/${key}.png` : SITE.defaultOg, siteUrl),
    alt: key ? SECTION_OG_ALT[key] : DEFAULT_OG_ALT,
    width: 1200,
    height: 630,
  };
}

function contentImage(page, alt, siteUrl) {
  const img = firstContentImage(page);
  if (!img) return null;
  const src = img.local || img.src;
  const size = MEDIA_SIZES[src];
  return {
    url: absoluteUrl(src, siteUrl),
    alt,
    ...(size ? { width: size[0], height: size[1] } : {}),
  };
}

function shareImage(content, fallback) {
  if (!content || !content.width || !content.height) return fallback;
  const ratio = content.width / content.height;
  return ratio >= SHARE_ASPECT[0] && ratio <= SHARE_ASPECT[1] ? content : fallback;
}

/* ------------------------------------------------------------------ */
/* Detail page builders                                                */
/* ------------------------------------------------------------------ */

function portfolioMeta(path, page) {
  const blocks = textBlocks(page);
  const name = clean(blocks.find((b) => b.type === "h1")?.text || page.title);
  const paragraph = blocks.find((b) => b.type === "p" && b.text.length > 30)?.text || clean(page.description);
  const fact = (label) => {
    const at = blocks.findIndex((b) => b.text === label);
    return at >= 0 ? blocks[at + 1]?.text : undefined;
  };
  const industry = fact("Industry");
  const year = fact("Year Invested");
  const curated = DETAIL_COPY[path] || {};
  const descriptor = curated.descriptor || (industry ? `${industry} company` : "portfolio company");
  const tail = ` | ${BRAND} portfolio`;
  const lead = `${name}: ${descriptor}`;
  const title =
    curated.title ||
    (lead.length + tail.length <= TITLE_MAX ? `${lead}${tail}` : fitTitle(lead));
  const backed = year ? `Backed by ${BRAND} since ${year}.` : "";
  let description = curated.description;
  if (!description) {
    const body = curated.summary ? [curated.summary] : sentences(paragraph);
    description = fitDescription(body, [backed, industry ? `${industry} company in the ${BRAND} portfolio.` : ""]);
    // The curated summary is one short sentence: always state the investment year when it fits.
    if (curated.summary && backed && `${description} ${backed}`.length <= DESCRIPTION_MAX && !description.includes(backed)) {
      description = `${description} ${backed}`;
    }
  }
  const link = (page.links || []).find((l) => /^https?:\/\//.test(l.href || "") && /Website/i.test(l.text || ""));
  return { title, description, name, websiteUrl: link?.href };
}

function personMeta(path, page, pages, kind) {
  const blocks = textBlocks(page);
  const parent = PARENT[kind];
  const name = tidyName(blocks.find((b) => b.type === "h2" || b.type === "h1")?.text || page.title);
  const card = listingCards(pages, parent).get(path);
  const nameAt = blocks.findIndex((b) => b.type === "h2" || b.type === "h1");
  const role =
    clean(card?.texts?.[1]) ||
    clean(blocks.slice(nameAt + 1).find((b) => b.type !== "p" && b.text.length < 110)?.text) ||
    "";
  const blurb = card?.texts?.[2] || "";
  const bio = figures(blocks.find((b) => b.type === "p" && b.text.length > 20)?.text || "");
  const curated = DETAIL_COPY[path] || {};
  const label = kind === "mentors" ? "Speed Scaler" : "";

  // Title: "<Name>, <Role> | Anthill Ventures", shortening the role only when it must.
  const roleTitle = role.replace(/\s+-\s+/g, ", ");
  const shortened = [
    curated.roleShort,
    roleTitle,
    roleTitle.replace(/\b[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)* \(([A-Z]{2,})\)/, "$1"),
    roleTitle.split(/ (?:of|at) /)[0],
  ].filter(Boolean);
  const fits = (r) => `${name}, ${r}${SUFFIX}`.length <= TITLE_MAX;
  const chosen = shortened.find(fits);
  const title = chosen
    ? `${name}, ${chosen}${SUFFIX}`
    : kind === "mentors"
      ? fitTitle(`${name} | Speed Scaler,`, ` ${BRAND}`)
      : fitTitle(name);

  // Description.
  let description = curated.description;
  if (!description) {
    if (kind === "mentors") {
      // "<Name> is a <card blurb>" (the listing card gives one line per mentor), then the network tag.
      const body = blurb || sentences(bio).filter((s) => !CLAIMY.test(s))[0] || "";
      const lower = body.replace(/^(\w)/, (c) => c.toLowerCase());
      const sentence = /^(a|an) /i.test(body) ? `${name} is ${lower}` : `${name} ${lower}`;
      const tags = [`Speed Scaler mentor at ${BRAND}.`, `Speed Scaler at ${BRAND}.`];
      description = fitDescription([sentence]);
      const tag = tags.find((t) => `${description} ${t}`.length <= DESCRIPTION_MAX);
      if (tag) description = `${description} ${tag}`;
      if (description.length < DESCRIPTION_MIN) description = fitDescription([`${name}, ${role}.`, body, tags[1]]);
    } else {
      let first = sentences(bio).filter((s) => !CLAIMY.test(s));
      // Archive bios for two team members are first person: "I'm X, Role at Anthill, focused on ...".
      first = first.map((s) =>
        s.replace(/^I(?:'|’)m (.+?), (.+?) at Anthill, (focused on .+?)\.?$/, (_, n, r, rest) => `${n} is ${r} at ${BRAND}, ${rest.replace(/\bour\b/g, "Anthill's")}.`),
      );
      const lead = `${name}, ${roleTitle} at ${BRAND}.`;
      const alreadyIntro = first[0] && first[0].includes(name) && /Anthill/.test(first[0]);
      description = fitDescription(alreadyIntro ? first : [lead, ...first], [`Meet the ${BRAND} team.`]);
    }
  }
  return { title, description, name, role, sameAs: socialLinks(page), label };
}

function articleMeta(path, page, pages, kind) {
  const blocks = textBlocks(page);
  const parent = PARENT[kind];
  const card = listingCards(pages, parent).get(path);
  const curated = DETAIL_COPY[path] || {};
  let heading;
  let author;
  let published;
  if (kind === "stories") {
    heading = blocks.find((b) => b.type === "h1" || b.type === "h2")?.text;
    const authorName = blocks.find((b) => b.type === "link" && blocks[blocks.indexOf(b) - 1]?.text === "Written by:")?.text;
    const authorUrl = (page.links || []).find((l) => clean(l.text) === authorName)?.href;
    if (authorName) author = { name: authorName, ...(authorUrl && /^https?:/.test(authorUrl) ? { url: authorUrl } : {}) };
    published = isoFromShort(blocks.find((b) => /^\d{1,2} [A-Za-z]{3,9} \d{4}$/.test(b.text))?.text);
  } else {
    heading = blocks.find((b) => b.type === "h1" || b.type === "h2")?.text || card?.texts?.[0] || blocks[0]?.text;
  }
  const name = curated.name || clean(heading || page.title);
  const title = curated.title || fitTitle(name);
  // Description: curated, else the listing blurb, else the first substantive paragraph.
  const paragraph =
    blocks.find((b) => b.type === "p" && b.text.length > 60 && !/^source:/i.test(b.text))?.text || "";
  const blurb = card?.texts?.find((t, i) => i > 0 && t.length > 60) || "";
  const description = curated.description || fitDescription(sentences(blurb || paragraph), [`From ${BRAND}.`]);
  return { title, description, name, author, published };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const notFoundMeta = (path, siteUrl) => ({
  path,
  found: false,
  title: `Page not found${SUFFIX}`,
  description: `The page you were looking for is not available. Return to the ${BRAND} home page or explore our programs, portfolio and team to find what you need.`,
  robots: ROBOTS_NOINDEX,
  type: "website",
  section: "Not found",
  image: sectionImage(null, siteUrl),
  breadcrumbs: [{ name: "Home", path: "/" }],
});

export function buildRouteMeta(path, data = {}) {
  const siteUrl = normalizeSiteUrl(data.siteUrl, SITE.url);
  const pages = data.pages || {};
  const requested = normalizePath(path);
  const hit = findPage(requested, pages);
  if (!hit) return notFoundMeta(requested, siteUrl);

  const p = normalizePath(hit.key);
  const page = hit.page;
  const detail = detailInfo(p);
  const robots = isNoindex(p) ? ROBOTS_NOINDEX : ROBOTS_INDEX;
  const home = { name: "Home", path: "/" };
  const hubLabel = SECTIONS[p]?.label;
  const base = { path: p, found: true, canonical: absoluteUrl(p, siteUrl), robots };

  // Hubs, privacy and utility pages: curated copy.
  if (!detail) {
    const copy = HUB_COPY[p];
    const slug = p === "/" ? "home" : SECTIONS[p]?.slug;
    const blocks = textBlocks(page);
    const label =
      p === "/"
        ? "Home"
        : hubLabel || (p === "/privacy-policy" ? "Privacy Policy" : blocks.find((b) => b.type === "h1")?.text || clean(page.title) || "Page");
    let dateModified;
    if (p === "/privacy-policy") {
      const hitDate = /Last updated:\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(blocks.map((b) => b.text).join(" "));
      const mm = hitDate && longMonth(hitDate[1]);
      if (mm) dateModified = `${hitDate[3]}-${mm}-${hitDate[2].padStart(2, "0")}`;
    }
    const meta = {
      ...base,
      title: copy?.title || fitTitle(label),
      description: copy?.description || fitDescription(sentences(page.description || blocks.find((b) => b.type === "p")?.text || ""), [`Learn more about ${BRAND}.`]),
      type: "website",
      section: label,
      image: sectionImage(slug, siteUrl),
      breadcrumbs: p === "/" ? [home] : [home, { name: label, path: p }],
      ...(dateModified ? { dateModified } : {}),
    };
    return meta;
  }

  // Detail pages.
  const parentLabel = SECTIONS[detail.parent].label;
  const parentSlug = SECTIONS[detail.parent].slug;
  const fallbackImage = sectionImage(parentSlug, siteUrl);
  let built;
  let type = "website";
  if (detail.kind === "portfolio") built = portfolioMeta(p, page);
  else if (detail.kind === "team" || detail.kind === "mentors") {
    built = personMeta(p, page, pages, detail.kind);
    type = "profile";
  } else {
    built = articleMeta(p, page, pages, detail.kind);
    if (detail.kind === "stories") type = "article";
  }

  const altBase =
    detail.kind === "portfolio"
      ? `${built.name}, a company in the ${BRAND} portfolio`
      : type === "profile"
        ? `Portrait of ${built.name}${built.role ? `, ${built.role}` : ""}`
        : detail.kind === "playbooks"
          ? `Cover of ${built.name}`
          : built.name;
  const content = contentImage(page, altBase, siteUrl);
  const image = shareImage(content, fallbackImage);

  return {
    ...base,
    title: built.title,
    description: built.description,
    type,
    section: parentLabel,
    name: built.name,
    ...(built.role ? { role: built.role } : {}),
    image,
    ...(content ? { contentImage: content } : {}),
    breadcrumbs: [home, { name: parentLabel, path: detail.parent }, { name: built.name, path: p }],
    ...(built.sameAs && built.sameAs.length ? { sameAs: built.sameAs } : {}),
    ...(built.websiteUrl ? { websiteUrl: built.websiteUrl } : {}),
    ...(built.published ? { datePublished: built.published } : {}),
    ...(built.author ? { author: built.author } : {}),
  };
}

const groupOf = (path) => {
  if (path === "/") return [0, 0];
  const hub = HUB_ORDER.indexOf(path);
  if (hub >= 0) return [1, hub];
  const d = detailInfo(path);
  if (d) return [2, DETAIL_ORDER.indexOf(d.kind)];
  return [3, 0];
};

// Routes for sitemap.xml: every found page except noindex ones, in a stable, meaningful order
// (home, hubs in navigation order, then detail pages grouped by section in listing order).
export function indexableRoutes(data = {}) {
  const pages = data.pages || {};
  const keys = Object.keys(pages).map((k, i) => ({ path: normalizePath(k), i }));
  const seen = new Set();
  return keys
    .filter(({ path }) => !isNoindex(path) && !seen.has(path) && seen.add(path))
    .sort((a, b) => {
      const [ga, sa] = groupOf(a.path);
      const [gb, sb] = groupOf(b.path);
      return ga - gb || sa - sb || a.i - b.i;
    })
    .map(({ path }) => path);
}

// Sitemap hints. Google ignores priority and changefreq; they are kept for other crawlers and
// as a readable statement of how often each section is expected to change.
export function sitemapHints(path) {
  const p = normalizePath(path);
  if (p === "/") return { priority: 1, changefreq: "weekly" };
  if (p === "/privacy-policy") return { priority: 0.2, changefreq: "yearly" };
  if (HUB_ORDER.includes(p)) {
    if (p === "/stories" || p === "/insights") return { priority: 0.7, changefreq: "weekly" };
    if (p === "/contact") return { priority: 0.6, changefreq: "yearly" };
    if (p === "/team" || p === "/speedscalers") return { priority: 0.7, changefreq: "monthly" };
    return { priority: 0.8, changefreq: "monthly" };
  }
  const d = detailInfo(p);
  if (d) {
    if (d.kind === "portfolio") return { priority: 0.6, changefreq: "monthly" };
    if (d.kind === "stories" || d.kind === "playbooks") return { priority: 0.6, changefreq: "monthly" };
    return { priority: 0.5, changefreq: "yearly" };
  }
  return { priority: 0.3, changefreq: "yearly" };
}
