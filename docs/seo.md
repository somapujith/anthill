# SEO implementation

This document records what was implemented for search and social visibility, where it lives, how the copy was written, what the site owner must still do outside the repository, and how to measure the result. The build commands and hosting rules are in the README: [SEO section](../README.md#seo).

The route, keyword and schema tables below are generated from the code (`src/seo/*`), not typed by hand.

## 1. What was implemented

The site is a client-rendered React single-page app. Before this work every URL served one generic `<head>` and an empty `<div id="root">`, so search engines, social scrapers and AI crawlers that do not run JavaScript saw nothing page-specific. The work gives every route its own metadata and structured data, and writes it into static HTML at build time.

| Area | Where | What it does |
| --- | --- | --- |
| Site constants | `src/seo/site.js` | Origin (`https://www.anthillventures.com`, overridden per build with `SITE_URL`), name, tagline "Scale with speed", locale, theme colour, email, the two offices and three social profiles exactly as on the Contact page and footer, logo and default share image paths, `absoluteUrl()` |
| Route metadata | `src/seo/meta.js` | `buildRouteMeta(path, data)` returns title, description, canonical, robots, type, section, share image, breadcrumbs and, when the data has them, people, company, author and date fields. `indexableRoutes()` lists the sitemap routes and `sitemapHints()` gives priority and change frequency (the build does not write those two fields: Google ignores them) |
| Head tags | `src/seo/head.js` | `headTags(meta, graph)` is the single source of truth for `<title>`, description, canonical, robots, Open Graph, Twitter card and the JSON-LD script. The client and the build both call it, so the two cannot drift |
| Structured data | `src/seo/schema.js` | `buildSchema(meta, data)`: see section 5 |
| Client head updates | `src/seo/Seo.jsx` | Applies the same tags when the route changes in the browser |
| Static output | `scripts/seo-build.mjs`, `scripts/seo-validate.mjs` | Prerendered HTML per route, `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html`, and a validator. Documented in the [README](../README.md#seo) |
| Assets | `public/og/`, `public/brand/logo-512.png`, `public/icons/`, `public/manifest.webmanifest` | Share images (1200x630, one per section plus a default), logo, icons and web manifest |

47 routes are covered: 44 are indexable and listed in the sitemap, and 3 utility pages under `/info/*` are `noindex,follow`. Unknown URLs get a "Page not found | Anthill Ventures" head with `noindex,follow` and no canonical.

## 2. How the metadata is written

**Titles.** At most 60 characters (longest: 60), the brand "Anthill Ventures" exactly once, and the primary keyword first where it reads naturally. Hub pages use a hand-written title; detail pages use a pattern:

- Portfolio company: `<Name>: <short descriptor> | Anthill Ventures portfolio`.
- Team member and Speed Scaler mentor: `<Name>, <Role> | Anthill Ventures`. The role comes from the parent listing card. When the full role does not fit (for example "Founder, Chairman & CEO of HealthCare Global Enterprises Ltd (HCG)") a shorter form of the same role is used; the full role stays in the data for schema.
- Story and playbook: the article title, rewritten only when it cannot fit with the brand.

**Descriptions.** 122 to 158 characters (target 120 to 158), specific to the page, no keyword stuffing and no superlatives. Hub descriptions reuse the site's own approved wording, including the sector phrase "health, frontier tech and urban lifestyles" (from `src/data/deck-facts.js`) and the brand line "Scale with speed". Detail descriptions are built from the first substantive sentence(s) of the page or its listing card, cut on a word boundary and never with an ellipsis. Where the archive text is unusable as a description (a merged heading, a dated news paragraph, a first-person bio, a glitched paragraph) a hand-written entry in `DETAIL_COPY` (28 entries) replaces it. Every such entry restates only facts already on the page.

**Numbers.** Descriptions avoid track-record figures. Where a bio carried the old "5.4x" and "80+" figures, the same replacements the site applies on screen (`figureCopy` in `src/pages/content/core.jsx`) are mirrored in `meta.js`, so metadata never contradicts the page. Keep the two lists in step if either changes.

**Canonical and robots.** Canonicals are absolute, self-referencing, without a trailing slash (except `/`) and built from the build's `SITE_URL`. Indexable pages use `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`. The three `/info/*` pages (style guide, license, changelog) and the not-found page use `noindex,follow`.

**Share images.** Hub pages use `/og/<slug>.png` (home, about, philosophy, programs, portfolio, speedscalers, team, stories, insights, contact), 1200x630, each with its own alt text; privacy and utility pages use the default image. Detail pages use the page's first meaningful content image (arrows, icons and SVGs are skipped) when its pixel size is known and its aspect ratio is between 1.2 and 2.2, which survives the 1.91:1 crop used by LinkedIn, Facebook and X. Portrait photos and PDF covers (all team and mentor portraits, two playbook covers) and the transparent Videoverse logo fall back to the section card. The content image is still passed to schema as `meta.contentImage`. Pixel sizes of the content images are kept in `MEDIA_SIZES` in `meta.js` (see section 8).

**Dates.** Only dates the page states are used: story publication dates ("30 Jan 2025" becomes 2025-01-30) and the privacy policy's "Last updated" date. Playbooks and company pages carry no date, so none is emitted.

**Breadcrumbs.** Home > Section > Page, with the same section labels as the navigation (Portfolio, Team, Speed Scalers for `/mentors/*`, Stories, Insights for `/playbooks/*`).

## 3. Route to title and description

Generated from `buildRouteMeta` (character counts in brackets). The last two columns show the Open Graph type and the share image (a path under `public/`, or the page's own content image).

| Route | Title | Description | Type | Share image |
| --- | --- | --- | --- | --- |
| `/` | Anthill Ventures: Early-Stage Venture Capital in India (54) | Anthill Ventures backs early-stage founders in health, frontier tech and urban lifestyles with capital, mentorship and market access. Scale with speed. (151) | website | `/og/home.png` |
| `/about` | About Anthill Ventures \| Early-Stage VC Firm in India (53) | Anthill Ventures invests in early-stage companies in health, frontier tech and urban lifestyles, backing founders with funding, mentorship and market access. (157) | website | `/og/about.png` |
| `/philosophy` | Our Investment Philosophy \| Anthill Ventures (44) | How Anthill Ventures sources, invests in and scales early-stage companies, using its Scalability Quotient to pair capital with mentorship and market access. (156) | website | `/og/philosophy.png` |
| `/programs` | Venture Scaling Program for Startups \| Anthill Ventures (55) | Apply to Anthill's venture scaling program: early-stage companies get access to capital, industry expertise and distribution networks to scale with speed. (154) | website | `/og/programs.png` |
| `/portfolio` | Portfolio Companies \| Anthill Ventures (38) | Explore the Anthill Ventures portfolio of early-stage companies across health, consumer, urban tech and media, from Bold Care and Broadway to Zypp Electric. (156) | website | `/og/portfolio.png` |
| `/speedscalers` | Speed Scalers: Mentors and Operators \| Anthill Ventures (55) | Meet the founders, operators and industry specialists in Anthill Ventures' Speed Scaler mentorship network, who guide portfolio companies to scale with speed. (158) | website | `/og/speedscalers.png` |
| `/stories` | Founder Stories and Market Insights \| Anthill Ventures (54) | Founder interviews, conversations and news from across the Anthill Ventures network, plus market perspectives on consumer and health categories in India. (153) | website | `/og/stories.png` |
| `/insights` | Insights: Reports and Playbooks \| Anthill Ventures (50) | Anthill Ventures reports and playbooks on company building, market trends and portfolio impact, from the Climate Impact Report to a carbon markets whitepaper. (158) | website | `/og/insights.png` |
| `/team` | Our Team: Investors and Operators \| Anthill Ventures (52) | Meet the investment and operations team at Anthill Ventures, led by Founder & CEO Prasad Vanga, working alongside founders and portfolio companies. (147) | website | `/og/team.png` |
| `/contact` | Contact Anthill Ventures \| Hyderabad and Singapore (50) | Pitch your company or discuss a partnership with Anthill Ventures. Write to info@anthillventures.com or visit our offices in Hyderabad, India and Singapore. (156) | website | `/og/contact.png` |
| `/privacy-policy` | Privacy Policy \| Anthill Ventures (33) | How Anthill Ventures collects, uses and protects personal information and cookie data when you use this website or contact us. Last updated July 1, 2025. (153) | website | `/og/anthill-ventures.png` |
| `/portfolio/bold-care` | Bold Care: men's wellness brand \| Anthill Ventures portfolio (60) | Bold Care is a men's wellness brand in India, pairing clinically validated products with discreet delivery. Backed by Anthill Ventures since 2021. (146) | website | `content image` |
| `/portfolio/broadway` | Broadway: experiential retail \| Anthill Ventures portfolio (58) | Broadway is an experiential department store for new-age brands, with stores in Delhi and Hyderabad. Backed by Anthill Ventures since 2024. (139) | website | `content image` |
| `/portfolio/deep-holistics` | Deep Holistics: AI wellness \| Anthill Ventures portfolio (56) | Deep Holistics turns lifestyle data, lab reports and genetics into personalized health recommendations. Backed by Anthill Ventures since 2025. (142) | website | `content image` |
| `/portfolio/erly-sign-i031w` | Erly Sign: oral cancer test \| Anthill Ventures portfolio (56) | Erly Sign is building a saliva-based oral cancer test that delivers non-invasive results in 15 minutes. Backed by Anthill Ventures since 2017. (142) | website | `content image` |
| `/portfolio/ikonz` | Ikonz: AI holographic avatars \| Anthill Ventures portfolio (58) | Ikonz is a Hyderabad-based AI and holographic technology company building lifelike digital avatars. Backed by Anthill Ventures since 2020. (138) | website | `content image` |
| `/portfolio/super-human-9j6et` | Super Human: human improvement \| Anthill Ventures portfolio (59) | Super Human is a global platform bringing scientists, policymakers and visionaries together around biotech, longevity and medicine. (131) | website | `content image` |
| `/portfolio/videoverse-toch` | Videoverse: AI video platform \| Anthill Ventures portfolio (58) | Videoverse is an AI-driven video platform for broadcasters, OTT and media platforms, and creators. Backed by Anthill Ventures since 2020. (137) | website | `/og/portfolio.png` |
| `/portfolio/zypp-electric` | Zypp Electric: EV logistics \| Anthill Ventures portfolio (56) | Zypp Electric runs an electric vehicle fleet for last-mile delivery in India, with a SaaS platform to manage fleets. Backed by Anthill Ventures since 2021. (155) | website | `content image` |
| `/mentors/aditya-ghosh` | Aditya Ghosh, Co-Founder of Akasa Air \| Anthill Ventures (56) | Aditya Ghosh is a prominent business leader in civil aviation and hospitality, recognized for his leadership roles at IndiGo and OYO. (133) | profile | `/og/speedscalers.png` |
| `/mentors/ajai-kumar` | Dr. B.S. Ajai Kumar, Founder of HCG \| Anthill Ventures (54) | Dr. B.S. Ajai Kumar is a well-known oncologist and the driving force behind HCG, concentrating on cancer care in India. Speed Scaler at Anthill Ventures. (153) | profile | `/og/speedscalers.png` |
| `/mentors/amit-mehta` | Amit Mehta, Director, LNB Group \| Anthill Ventures (50) | Amit Mehta, Director at LNB Group, is a qualified Chartered Accountant and Harvard Business School alumnus in Anthill Ventures' Speed Scaler mentor network. (156) | profile | `/og/speedscalers.png` |
| `/mentors/anjali-ajai-kumar` | Anjali Ajai Kumar, Executive Director \| Anthill Ventures (56) | Anjali Ajai Kumar is a healthcare strategist and social entrepreneur focusing on improving the cancer care patient experience. (126) | profile | `/og/speedscalers.png` |
| `/mentors/chris-rynning` | Chris Rynning, Managing Partner \| Anthill Ventures (50) | Chris Rynning is an expert in venture capital, private equity, and emerging markets, with a focus on China and new technologies. (128) | profile | `/og/speedscalers.png` |
| `/mentors/cristina-ventura` | Cristina Ventura, Chief Catalyst Officer \| Anthill Ventures (59) | Cristina Ventura is a global investor and a driver of impact, focusing on luxury, tech, and sustainability. Speed Scaler mentor at Anthill Ventures. (148) | profile | `/og/speedscalers.png` |
| `/mentors/kiran-grandhi` | Kiran Grandhi, Co-Chairman at GMR Group \| Anthill Ventures (58) | Kiran Grandhi is a leader in infrastructure development and the sports industry, mainly focusing on airports and cricket. Speed Scaler at Anthill Ventures. (155) | profile | `/og/speedscalers.png` |
| `/mentors/kishore-biyani` | Kishore Biyani, Founder of Future Group \| Anthill Ventures (58) | Kishore Biyani is a pioneer of modern retail in India, founding Future Group with popular brands such as Big Bazaar and Pantaloons. (131) | profile | `/og/speedscalers.png` |
| `/mentors/neeraj-bhargava` | Neeraj Bhargava, Founder, Zodius Advisors \| Anthill Ventures (60) | Neeraj Bhargava is a successful entrepreneur and investor, known for co-founding WNS and investing in companies like MakeMyTrip. (128) | profile | `/og/speedscalers.png` |
| `/mentors/rana-daggubati` | Rana Daggubati, Actor, Film Producer \| Anthill Ventures (55) | Rana Daggubati is a versatile Indian actor known for roles in Telugu, Tamil, and Hindi cinema, as well as a visual effects producer. (132) | profile | `/og/speedscalers.png` |
| `/mentors/srini-koppolu` | Srini Koppolu, Founder, Veooz Labs \| Anthill Ventures (53) | Srini Koppolu is a Microsoft veteran and angel investor, spearheading product development and nurturing talent. Speed Scaler mentor at Anthill Ventures. (152) | profile | `/og/speedscalers.png` |
| `/mentors/vivek-biyani` | Vivek Biyani, Director, Future Group \| Anthill Ventures (55) | Vivek Biyani, Director at Future Group and Big Bazaar Direct, leads the group's digital business initiatives, including strategy and new business development. (158) | profile | `/og/speedscalers.png` |
| `/stories/building-the-anthill` | Building the Anthill: Our Story \| Anthill Ventures (50) | The story behind the Anthill name: a tale from ancient India and the ecology of anthills, and how both shape the way Anthill Ventures builds with founders. (155) | article | `content image` |
| `/stories/functional-beverages-in-india-investment-thesis-2025` | Functional Beverages in India: Our Thesis \| Anthill Ventures (60) | Anthill's 2025 investment thesis on functional beverages in India: the market landscape and the opportunity in drinks for energy, immunity and digestion. (153) | article | `content image` |
| `/stories/indias-gut-health-obsession-how-digestion-is-becoming-a-new-consumer-category` | India's Gut Health Obsession \| Anthill Ventures (47) | Gut health is evolving from a niche trend to a foundational necessity for urban Indians battling chronic lifestyle stress. (122) | article | `content image` |
| `/playbooks/carbon-markets` | India Carbon Markets: Startup Whitepaper \| Anthill Ventures (59) | Anthill's whitepaper maps five startup verticals across India's carbon market value chain, benchmarked against the EU, Germany, China and Indonesia. (148) | website | `/og/insights.png` |
| `/playbooks/climate-impact-report` | Climate Impact Report: 17 Companies \| Anthill Ventures (54) | Anthill's first Climate Impact Report maps the measurable impact of 17 climate portfolio companies across energy, mobility, water, materials and ESG. (149) | website | `content image` |
| `/playbooks/urban-lifestyle` | Urban Lifestyle Thesis: How India Lives \| Anthill Ventures (58) | Anthill's Urban Lifestyle Thesis outlines our conviction in founder-led, digitally native brands across fashion, beauty, wellness and food and beverage. (152) | website | `/og/insights.png` |
| `/team/bhargav-panguluri` | Bhargav Panguluri, Portfolio Manager \| Anthill Ventures (55) | Bhargav Panguluri, Portfolio Manager at Anthill Ventures, optimizes the venture portfolio to drive value and support the growth of invested companies. (150) | profile | `/og/team.png` |
| `/team/fazal-mohammed` | Fazal Mohammed, Operations Manager \| Anthill Ventures (53) | Fazal Mohammed, Operations Manager at Anthill Ventures since 2021, brings a background in operations, team management and recruitment to the firm. (146) | profile | `/og/team.png` |
| `/team/goutham-uppaluri` | Goutham Uppaluri, Head of Strategy \| Anthill Ventures (53) | Goutham Uppaluri, Head of Strategy at Anthill Ventures, shapes the firm's strategic direction and looks for new opportunities to drive growth. (142) | profile | `/og/team.png` |
| `/team/mike-binn` | Mike Binn, Partner \| Anthill Ventures (37) | Mike Binn, Partner at Anthill Ventures, expands the firm's US footprint for tech transfer and helps Indian technology companies scale in the US market. (151) | profile | `/og/team.png` |
| `/team/nagendra-khatri` | Nagendra Khatri, Associate, Investments \| Anthill Ventures (58) | Nagendra Khatri, Associate in Investments at Anthill Ventures, sources and executes consumer deals across D2C brands, fashion, food and beverage and spirits. (157) | profile | `/og/team.png` |
| `/team/prasad-vanga` | Prasad Vanga, Founder & CEO \| Anthill Ventures (46) | Prasad Vanga, Founder & CEO of Anthill Ventures, leads global strategy, fund management and venture building, with 20 years in business transformation. (151) | profile | `/og/team.png` |
| `/team/sailesh-sigatapu` | Sailesh Sigatapu, General Partner \| Anthill Ventures (52) | Sailesh Sigatapu, General Partner at Anthill Ventures, manages fundraising and investor relations with Indian family offices and oversees Urban Tech. (149) | profile | `/og/team.png` |
| `/info/styleguide` (noindex) | Style Guide \| Anthill Ventures (30) | Reference page for the Anthill Ventures website design system, covering color, typography, buttons and form components. Kept out of search results. (147) | website | `/og/anthill-ventures.png` |
| `/info/license` (noindex) | License \| Anthill Ventures (26) | Licensing notes for the images, videos and fonts used on the Anthill Ventures website, including Unsplash and Pexels media and open-source fonts. (145) | website | `/og/anthill-ventures.png` |
| `/info/changelog` (noindex) | Changelog \| Anthill Ventures (28) | Version history of the Anthill Ventures website. The changelog records Version 1.0 as the initial release of the site. Kept out of search results. (146) | website | `/og/anthill-ventures.png` |

## 4. Target keyword and intent per hub page

These are editorial judgements from each page's content and the site's own copy, not measured search volumes (see section 9).

| Page | Target keyword | Search intent |
| --- | --- | --- |
| `/` | early-stage venture capital India | Brand and category (navigational plus commercial investigation) |
| `/about` | about Anthill Ventures, early-stage VC firm | Navigational and informational: who the firm is and what it invests in |
| `/philosophy` | venture investment philosophy, how we invest | Informational: the investment approach and assessment framework |
| `/programs` | venture scaling program for startups India | Transactional: founders deciding whether to apply |
| `/portfolio` | Anthill Ventures portfolio companies | Navigational and informational: proof of track record |
| `/speedscalers` | startup mentors India, Speed Scalers | Informational: the mentorship network behind the portfolio |
| `/stories` | founder stories India, startup market insights | Informational: editorial content that builds topical authority |
| `/insights` | startup playbooks and reports India | Informational: downloadable research for founders and investors |
| `/team` | Anthill Ventures team | Navigational and trust: who is behind the fund |
| `/contact` | contact Anthill Ventures | Navigational and transactional: pitch, partner or enquire |
| `/privacy-policy` | (none: legal page) | Trust and compliance |

Detail pages target the entity name (a company, person or article title) plus "Anthill Ventures": branded and navigational queries rather than competitive generic terms.

## 5. Schema map

Generated by running `buildSchema` on every route. Every page carries `Organization` and `WebSite`; the Organization uses the offices, email, logo and social profiles from `site.js`. No ratings, reviews, awards or invented facts are emitted, `FAQPage` and `HowTo` are not used, and the markup mirrors visible page content.

| Page | JSON-LD types in the `@graph` |
| --- | --- |
| `Home` | Organization, WebSite, WebPage, ImageObject |
| `/about` | Organization, WebSite, AboutPage, BreadcrumbList, ImageObject |
| `/philosophy` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject |
| `/programs` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject |
| `/portfolio` | Organization, WebSite, CollectionPage, BreadcrumbList, ImageObject |
| `/speedscalers` | Organization, WebSite, CollectionPage, BreadcrumbList, ImageObject |
| `/stories` | Organization, WebSite, CollectionPage, BreadcrumbList, ImageObject |
| `/insights` | Organization, WebSite, CollectionPage, BreadcrumbList, ImageObject |
| `/team` | Organization, WebSite, CollectionPage, BreadcrumbList, ImageObject |
| `/contact` | Organization, WebSite, ContactPage, BreadcrumbList, ImageObject |
| `/privacy-policy` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject |
| `/portfolio/*` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject |
| `/mentors/*` | Organization, WebSite, ProfilePage, BreadcrumbList, ImageObject, Person |
| `/stories/*` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject, Article |
| `/playbooks/*` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject, Report |
| `/team/*` | Organization, WebSite, ProfilePage, BreadcrumbList, ImageObject, Person |
| `/info/*` | Organization, WebSite, WebPage, BreadcrumbList, ImageObject |

## 6. Build pipeline

The commands (`npm run build`, `npm run seo:validate`), the files written to `dist/`, the `SITE_URL` setting, the AI-crawler policy and the hosting rules (real 404 status, pretty URLs, redirects, headers) are documented in the README: [SEO section](../README.md#seo). The build passes `siteUrl` to `buildRouteMeta`, so staging and preview builds never emit production canonicals.

## 7. What the site owner must do outside the repository

1. **Set the domain.** Build production with `SITE_URL=https://www.anthillventures.com` (the default). Choose one of www or the bare domain, 301 the other to it, and serve everything over HTTPS.
2. **Check the host.** Unknown URLs must return status 404 with `404.html`, not 200 (a soft 404), and each route must be served from its own file (README, "Hosting").
3. **Verify the domain** in Google Search Console (a Domain property verified with a DNS TXT record covers www, the bare domain and subdomains) and in Bing Webmaster Tools (which can import verified sites from Search Console).
4. **Submit `https://www.anthillventures.com/sitemap.xml`** in both tools, then use URL Inspection to request indexing for the home page, the hub pages and a few detail pages. Requesting is a nudge, not a guarantee; the sitemap does the bulk work.
5. **Keep every existing URL or redirect it.** The route set was taken from the live site, so the paths should match, but the live site may carry URLs that are not in this build. Before cutover, list the live site's URLs (its current sitemap, a crawl, and Search Console's Pages report) and compare them with the 44 indexable routes. Anything missing gets a 301 to the closest page; do not leave it to 404. `public/_redirects` already maps `/team/lasya-nadimpally` to `/team`, `/mentors` to `/speedscalers` and `/playbooks` to `/insights`.
6. **Connect the social profiles.** `SITE.social` was copied from the footer: LinkedIn (`in.linkedin.com/company/anthill-ventures`), X (`x.com/anthillventures`) and Instagram (`instagram.com/anthillcapitalventures`). Confirm they are the official accounts, link each one back to https://www.anthillventures.com and keep the name "Anthill Ventures" consistent, because they feed `Organization.sameAs`.
7. **Check share previews** after deploy with the LinkedIn Post Inspector and the Facebook Sharing Debugger (both re-scrape on request), and by pasting a few links into a draft post on X.
8. **Validate structured data** after deploy with Google's Rich Results Test (breadcrumbs, organization) and the Schema Markup Validator.
9. **Review the copy.** The hub titles and descriptions are drafts for the team to approve. Several company paragraphs on the site are dated news ("throughout 2025", "this year"); refresh them so the text and the metadata stay true. Add real publication dates to playbooks when known.
10. **Analytics.** Add or confirm an analytics tool and define a conversion event for contact and pitch submissions, so organic traffic can be tied to enquiries. Nothing in the repository sets this up.

## 8. Maintenance

- **Add a page:** add it to `src/data/view-content.json`. A hub page needs an entry in `HUB_COPY` (plus `SECTIONS` and a `/og/<slug>.png` if it is a new section). Detail pages are templated and need nothing, but check the output with the script below.
- **Check the copy:** save this in the repository root and run `node check-seo-meta.mjs`. It prints any title over 60 characters, any description outside 120 to 158 characters, and duplicates.

```js
import fs from "node:fs";
import { buildRouteMeta } from "./src/seo/meta.js";

const data = JSON.parse(fs.readFileSync("src/data/view-content.json", "utf8"));
const seen = new Map();
for (const route of Object.keys(data.pages)) {
  const { title, description } = buildRouteMeta(route, data);
  if (title.length > 60) console.log("title too long:", route, title.length);
  if (description.length < 120 || description.length > 158) console.log("description length:", route, description.length);
  for (const [kind, text] of [["title", title], ["description", description]]) {
    const key = kind + text;
    if (seen.has(key)) console.log("duplicate", kind + ":", route, "and", seen.get(key));
    else seen.set(key, route);
  }
}
```

- **Refresh the image-size table** (`MEDIA_SIZES` in `meta.js`) when a detail page's first content image changes: read the pixel size of the file under `public/media` and update the entry. An image missing from the table is never used as a share image; the page falls back to its section card.
- **Regenerate the table in section 3** with the same `buildRouteMeta` loop, printing route, title and description.

## 9. What could not be verified in the repository

- **No search data.** Keyword targets are editorial choices; no search-volume, difficulty or results-page data was available, and rankings cannot be promised. Generic terms such as "venture capital India" are highly competitive; branded and entity queries are the realistic early wins.
- **No live-site access.** The current production titles, indexed URLs, rankings and Search Console data were not available. The only record of the old site is the 2025 crawl archive in `src/data/view-content.json`.
- **Search engines decide the snippet.** Titles and descriptions are rewritten when an engine judges another passage a better match; this work improves the starting point.
- **Share-card rendering** on LinkedIn, Facebook and X was not tested; the 1.2 to 2.2 aspect rule is a precaution against bad crops.
- **Structured data** was checked structurally (valid JSON, expected types per route) but not with Google's Rich Results Test, which needs a deployed URL.
- **Facts** come from the site, `deck-facts.js` and the Contact page. The offices are reproduced as published (Hyderabad office: Ramanaidu Studios, Road 79, Jubilee Hills, Hyderabad 500096 (IN); Singapore office: 10 Cross Street #05-101, Office 50/77, Singapore 048417 (SG)); the Indian state is omitted because the Contact page does not state it. Social profile URLs were not checked against the live accounts. Story dates and authors come from the archived pages and were not independently confirmed.
- **Content inconsistencies outside metadata.** Some retained site copy still says "speed with scale" (the philosophy paragraph) although the brand line is "Scale with speed", and a few archive paragraphs contain missing spaces ("Realoutcomes"). Metadata avoids these; the page copy needs an editorial pass.

## 10. Measurement plan

**Before launch (baseline).** Export 16 months of Search Console data for the live site (queries, pages, countries), record Core Web Vitals from the Search Console report and PageSpeed Insights, and save the live URL list from section 7, step 5.

**Leading indicators** (days to weeks; they show the foundation works):

| Indicator | Where | Expected signal |
| --- | --- | --- |
| Sitemap read and URLs discovered | Search Console, Sitemaps | Status "Success" and 44 URLs discovered within days |
| Indexing | Search Console, Pages | Indexed count rising towards 44; no clusters of "Duplicate without user-selected canonical", "Soft 404" or "Crawled, currently not indexed" on hub pages |
| Canonical agreement | URL Inspection on a sample | User-declared and Google-selected canonical match |
| Structured data | Search Console, Enhancements (Breadcrumbs) | Valid items, no errors |
| Crawl health | Search Console, Crawl stats | No spike in 4xx or 5xx responses; HTML responses fast |
| Share previews | LinkedIn Post Inspector, Facebook Sharing Debugger | Correct title, description and image on sampled routes |
| Branded impressions | Search Console, Performance | Queries containing "Anthill Ventures" and founder or partner names show impressions on hub and profile pages |

**Lagging indicators** (weeks to months; they show the business result):

- Clicks and click-through rate by page group (hubs, portfolio, team, stories and playbooks), branded against non-branded.
- Average position for each hub's target keyword in section 4.
- Core Web Vitals pass rate in the field (LCP, INP, CLS) from Search Console and CrUX through PageSpeed Insights.
- Organic landing sessions and, with the analytics event from section 7 step 10, contact and pitch submissions that began from organic search.
- Referral visits from AI assistants and answer engines, tracked as referrers in analytics, and whether the playbooks are cited.
- New referring domains to the playbooks and portfolio pages.

**Cadence.** Check indexing and errors weekly for the first month and review queries and page performance monthly. Revisit titles and descriptions of pages with high impressions and low click-through after about three months, changing one thing at a time so the effect is readable.
