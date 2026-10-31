import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Download, Pause, Play, Search } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { pages, labels, typeOf, words, cleanPath, pageBlocks, isHeading, firstImage, usefulImages, imageSource, routeTitle, PageHero, BodyContent } from "./core.jsx";
import "./collection.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function sourceName(path, page) {
  const heading =
    pageBlocks(page).find((b) => ["h1", "h2"].includes(typeOf(b))) ||
    pageBlocks(page).find(
      (b) => words(b) && words(b) !== "View all" && !b.href,
    );
  return heading ? words(heading) : routeTitle(path);
}

const clean = (text) =>
  text.replace(/[​-‍﻿]/g, "").replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").trim();

// The opening sentence of a detail page, used as a teaser. Sentences written in
// the first person ("We're passionate about...") do not describe the company.
function openingLine(blocks) {
  const body = blocks.filter((b) => typeOf(b) === "p" && clean(words(b)));
  const sentences = body.flatMap(
    (b) => clean(words(b)).match(/[^.!?]+[.!?]+(?=\s|$)/g) || [],
  );
  return (sentences.find((s) => !/^\s*We(’|'|\s)/.test(s)) || "").trim();
}

function collectionFor(pathname, page) {
  const prefix =
    pathname === "/speedscalers"
      ? "/mentors/"
      : pathname === "/insights"
        ? "/playbooks/"
        : `${pathname}/`;
  const keys = Object.keys(pages).filter((path) => path.startsWith(prefix));
  const links = page?.links || [];
  keys.sort((a, b) => {
    const ia = links.findIndex((l) => cleanPath(l.href) === a);
    const ib = links.findIndex((l) => cleanPath(l.href) === b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  return keys.map((path) => {
    const detail = pages[path];
    const card = (page?.cards || []).find((c) =>
      c.links?.some((l) => cleanPath(l.href) === path),
    );
    const cardText = (card?.blocks || []).filter(
      (b) => !b.src && words(b) && !/^\d+$/.test(words(b)),
    );
    const title = cardText[0] ? words(cardText[0]) : sourceName(path, detail);
    const sourceLink = links.find((l) => cleanPath(l.href) === path);
    const blocks = pageBlocks(detail);
    const afterHeading = blocks.slice(
      blocks.findIndex((b) => ["h1", "h2"].includes(typeOf(b))) + 1,
    );
    const people = ["/team", "/speedscalers"].includes(pathname);
    const role =
      people && cardText[1]
        ? words(cardText[1])
        : afterHeading.find(
            (b) =>
              words(b) && words(b).length < 110 && !isHeading(b) && !b.href,
          )?.text || "";
    const excerpt = cardText
      .slice(people ? 2 : 1)
      .map(words)
      .filter((text) => pathname !== "/portfolio" && text !== role)
      .join(" ");
    const linkText = sourceLink?.text || "";
    const year = linkText.match(/\b20\d{2}\b/)?.[0] || "";
    const category =
      pathname === "/portfolio"
        ? ["Urban Tech", "Media Tech", "Consumer", "Health"].find((c) =>
            linkText.includes(c),
          ) || ""
        : "";
    const after = (label) => {
      const at = blocks.findIndex((b) => words(b) === label);
      return at < 0 ? "" : words(blocks[at + 1] || {});
    };
    const download = (detail?.links || []).find((l) => l.text === "Download");
    return {
      path,
      page: detail,
      title,
      role,
      excerpt,
      year,
      category,
      image: firstImage(card) || firstImage(detail),
      linkText,
      card,
      status: after("Status"),
      author: after("Written by:"),
      date: blocks.map(words).find((t) => /^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(t)) || "",
      teaser: ["/portfolio", "/stories"].includes(pathname) ? openingLine(blocks) : "",
      pdf: download ? download.local || download.href : "",
      // The first detail image of a playbook repeats its cover.
      innerPages: pathname === "/insights" ? usefulImages(detail).slice(1, 4) : [],
    };
  });
}

// Scroll choreography. Every tween is a `from`, so anything GSAP has not reached
// yet is simply visible, and reduced motion leaves the page untouched.
function useListingMotion(scope, kind) {
  const reveals = useRef(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      reveals.current = media;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        const on = (el) => ({ trigger: el, start: "top 90%", once: true });
        q("[data-rise]").forEach((el) =>
          gsap.from(el, { y: 26, autoAlpha: 0, duration: 0.9, ease: "expo.out", clearProps: "transform,opacity,visibility", scrollTrigger: on(el) }),
        );
        q("[data-unveil]").forEach((el) =>
          gsap.from(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15, ease: "expo.inOut", clearProps: "clipPath", scrollTrigger: on(el) }),
        );
        q("[data-line]").forEach((el) =>
          gsap.from(el, { yPercent: 108, duration: 1, ease: "expo.out", clearProps: "transform", scrollTrigger: on(el.parentElement) }),
        );
        q("[data-lift]").forEach((el, i) =>
          gsap.from(el, { yPercent: 101, duration: 1.3, delay: i * 0.12, ease: "expo.out", clearProps: "transform", scrollTrigger: { trigger: el.parentElement, start: "top 85%", once: true } }),
        );
        q("[data-draw]").forEach((el) =>
          gsap.from(el, { scaleX: 0, duration: 1.4, ease: "expo.inOut", transformOrigin: "left center", clearProps: "transform", scrollTrigger: { trigger: el, start: "top 96%", once: true } }),
        );
        q("[data-scrub]").forEach((el) =>
          gsap.fromTo(el, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } }),
        );
      });
      return () => media.revert();
    },
    { scope, dependencies: [kind] },
  );
  // Filtering moves everything, so any reveal still waiting is finished at once.
  return () => reveals.current?.revert();
}

function Toolbar({ label, count, children, query, onQuery, placeholder, searchLabel }) {
  return (
    <div className="listing-toolbar">
      {children || (
        <span className="listing-label">
          {label} <b>{String(count).padStart(2, "0")}</b>
        </span>
      )}
      {onQuery && (
        <label className="content-search listing-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label={searchLabel}
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}

function EmptyState({ query, onClear }) {
  return (
    <div className="content-empty listing-empty">
      <p>No results for “{query}”.</p>
      <button type="button" className="button" onClick={onClear}>
        Clear filters <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* Portfolio: a sortable ledger on night, with a viewer that follows the row. */

const SORTS = {
  Year: (a, b) => b.year - a.year,
  Name: (a, b) => a.title.localeCompare(b.title),
  Industry: (a, b) => a.category.localeCompare(b.category),
};
const companyAlt = (item) => `${item.title} brand creative`;
const logoOnly = (item) => item.path.includes("videoverse");

function Portfolio({ items, query, setQuery, category, setCategory, matches, reset }) {
  const [sort, setSort] = useState("Year");
  const [activePath, setActivePath] = useState("");
  const counts = { All: items.length };
  for (const i of items) counts[i.category] = (counts[i.category] || 0) + 1;
  const list = [...matches].sort(SORTS[sort]);
  const current = list.find((i) => i.path === activePath) || list[0];
  const years = [];
  const span = items.map((i) => Number(i.year));
  for (let y = Math.min(...span); y <= Math.max(...span); y++) years.push(String(y));
  const shown = new Set(list.map((i) => i.path));
  return (
    <>
      <div className="pf-night">
        <div className="container">
          <Toolbar
            query={query}
            onQuery={setQuery}
            placeholder="Find a company"
            searchLabel={`Search ${labels["/portfolio"]}`}
          >
            <div className="content-filters pf-filters" role="group" aria-label="Filter portfolio">
              {Object.keys(counts).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={category === c ? "is-active" : ""}
                  aria-pressed={category === c}
                >
                  {c}
                  <sup>{counts[c]}</sup>
                  {category === c && (
                    <motion.span layoutId="pf-filter-mark" className="pf-filter-mark" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />
                  )}
                </button>
              ))}
            </div>
          </Toolbar>
          {list.length > 0 ? (
            <div className="pf-body">
              <div className="pf-index">
                <div className="pf-head">
                  {Object.keys(SORTS).map((key) => (
                    <button
                      type="button"
                      key={key}
                      className={`pf-sort pf-sort--${key.toLowerCase()}`}
                      aria-pressed={sort === key}
                      aria-label={`Sort by ${key.toLowerCase()}`}
                      onClick={() => setSort(key)}
                    >
                      {key}
                    </button>
                  ))}
                  <span className="pf-head-status">Status</span>
                </div>
                <ul className="pf-rows">
                  <AnimatePresence initial={false}>
                    {list.map((item) => (
                      <motion.li
                        key={item.path}
                        layout="position"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                        className={`content-card pf-row${current.path === item.path ? " is-current" : ""}`}
                      >
                        <Link
                          to={item.path}
                          className="pf-link"
                          onMouseEnter={() => setActivePath(item.path)}
                          onFocus={() => setActivePath(item.path)}
                        >
                          <span className="pf-year">{item.year}</span>
                          <span className={`pf-thumb${logoOnly(item) ? " is-logo" : ""}`}>
                            <img src={imageSource(item.image, item.page)} alt={companyAlt(item)} loading="lazy" />
                          </span>
                          <h2 className="pf-name">{item.title}</h2>
                          <span className="pf-industry">{item.category}</span>
                          <span className="pf-status">{item.status}</span>
                          <ArrowUpRight className="pf-arrow" size={20} aria-hidden="true" />
                        </Link>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
              <aside className="pf-viewer" aria-hidden="true">
                <Link to={current.path} tabIndex={-1} className="pf-screen">
                  {items.map((item) => (
                    <img
                      key={item.path}
                      src={imageSource(item.image, item.page)}
                      alt=""
                      className={`${item.path === current.path ? "is-shown" : ""}${logoOnly(item) ? " is-logo" : ""}`}
                    />
                  ))}
                </Link>
                <p className="pf-caption" key={current.path}>
                  <b>{current.title}</b> {current.teaser}
                </p>
              </aside>
            </div>
          ) : (
            <EmptyState query={query} onClear={reset} />
          )}
        </div>
      </div>
      <div className="pf-timeline" aria-hidden="true">
        <div className="container">
          <p className="listing-label">Year Invested</p>
          <div className="pf-years" style={{ "--years": years.length }}>
            {years.map((y) => (
              <div className="pf-year-col" key={y}>
                <div className="pf-year-stack" data-rise>
                  {items
                    .filter((i) => i.year === y)
                    .map((i) => (
                      <span
                        key={i.path}
                        className={`pf-mark${shown.has(i.path) ? "" : " is-out"}${current?.path === i.path ? " is-current" : ""}`}
                      >
                        <i />
                        <em>{i.title}</em>
                      </span>
                    ))}
                </div>
                <span className="pf-year-label">{y}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* Team: portraits with the name biting a white notch out of the photograph. */

// This profile has no photograph in the source archive, only a landscape image.
const NOT_A_PORTRAIT = {
  "/team/goutham-uppaluri": "Moss on a rock, the image on Goutham Uppaluri's profile",
};
const portraitAlt = (item) => NOT_A_PORTRAIT[item.path] || `Portrait of ${item.title}`;

function TeamCard({ item, index, total }) {
  const [first, ...rest] = item.title.split(" ");
  const alone = index > 0 && index === total - 1 && total % 2 === 0;
  const slot = index === 0 ? "lead" : alone ? "close" : `slot-${(index - 1) % 4}`;
  return (
    <article className={`content-card team-card team-card--${slot}${NOT_A_PORTRAIT[item.path] ? " team-card--plain" : ""}`}>
      <Link to={item.path} className="team-link">
        <figure className="team-photo" data-unveil>
          <img src={imageSource(item.image, item.page)} alt={portraitAlt(item)} loading="lazy" data-scrub />
        </figure>
        <div className="team-copy">
          <h2 className="team-name">
            <span className="team-line"><span data-line>{first}</span></span>{" "}
            <span className="team-line"><span data-line>{rest.join(" ")}</span></span>
          </h2>
          <p className="team-role">{item.role}</p>
          <p className="team-bio">{item.excerpt}</p>
          <span className="team-open" aria-hidden="true"><ArrowUpRight size={22} /></span>
        </div>
      </Link>
    </article>
  );
}

function Team({ items, query, setQuery, matches, reset }) {
  return (
    <div className="team-paper">
      <div className="container">
        <Toolbar
          label="Meet the people"
          count={items.length}
          query={query}
          onQuery={setQuery}
          placeholder="Search by name or role"
          searchLabel={`Search ${labels["/team"]}`}
        />
        {matches.length > 0 ? (
          <div className="team-wall">
            {matches.map((item, i) => (
              <TeamCard key={item.path} item={item} index={i} total={matches.length} />
            ))}
          </div>
        ) : (
          <EmptyState query={query} onClear={reset} />
        )}
      </div>
    </div>
  );
}

/* Speed Scalers: household names on night, then the working roster on paper. */

const MARQUEE_NAMES = ["/mentors/rana-daggubati", "/mentors/kishore-biyani", "/mentors/aditya-ghosh", "/mentors/neeraj-bhargava"];
// Every company here is named in a Speed Scaler's own card or profile.
const BUILT = ["HCG", "Future Group", "Big Bazaar", "Pantaloons", "Akasa Air", "IndiGo", "OYO", "WNS", "MakeMyTrip", "Rainshine Global", "GMR Group", "Microsoft", "Veooz Labs", "AMYP Ventures", "LNB Group", "Lane Crawford Joyce Group"];

function Ticker() {
  const [paused, setPaused] = useState(false);
  const run = (
    <span className="ss-run">
      {BUILT.map((name) => (
        <span key={name}>{name}</span>
      ))}
    </span>
  );
  return (
    <div className="ss-ticker" data-paused={paused}>
      <div className="ss-track" aria-hidden="true">
        {run}
        {run}
      </div>
      <button
        type="button"
        className="ss-toggle"
        aria-label={paused ? "Resume moving company names" : "Pause moving company names"}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </div>
  );
}

function Speedscalers({ items, query, setQuery, matches, reset }) {
  const stars = MARQUEE_NAMES.map((p) => matches.find((i) => i.path === p)).filter(Boolean);
  const roster = matches.filter((i) => !MARQUEE_NAMES.includes(i.path));
  return (
    <>
      <div className="ss-night">
        <div className="container">
          <Toolbar
            label="Meet the people"
            count={items.length}
            query={query}
            onQuery={setQuery}
            placeholder="Search by name or company"
            searchLabel={`Search ${labels["/speedscalers"]}`}
          />
          {stars.length > 0 && (
            <div className="ss-stars">
              {stars.map((item, i) => (
                <article className={`content-card ss-star ss-star--${i}`} key={item.path}>
                  <Link to={item.path} className="ss-star-link">
                    <figure className="ss-star-photo" {...(i < 3 ? { "data-unveil": "" } : {})}>
                      <img src={imageSource(item.image, item.page)} alt={portraitAlt(item)} loading="lazy" {...(i < 3 ? { "data-scrub": "" } : {})} />
                      <figcaption>
                        <h2>{item.title}</h2>
                        <p>{item.role}</p>
                      </figcaption>
                    </figure>
                    <p className="ss-star-bio">{item.excerpt}</p>
                  </Link>
                </article>
              ))}
            </div>
          )}
          {!matches.length && <EmptyState query={query} onClear={reset} />}
        </div>
      </div>
      {!query && <Ticker />}
      {roster.length > 0 && (
        <div className="ss-paper">
          <div className="container">
            <div className="ss-roster">
              {roster.map((item) => (
                <article className="content-card ss-entry" key={item.path}>
                  <Link to={item.path} className="ss-entry-link" data-rise>
                    <span className="ss-entry-photo">
                      <img src={imageSource(item.image, item.page)} alt={portraitAlt(item)} loading="lazy" />
                    </span>
                    <span className="ss-entry-copy">
                      <h2>{item.title}</h2>
                      <span className="ss-entry-role">{item.role}</span>
                      <span className="ss-entry-bio">{item.excerpt}</span>
                    </span>
                    <ArrowUpRight className="ss-entry-arrow" size={20} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Stories: a front page. The newest story leads. */

const headline = (title) => {
  const match = title.match(/^(.+?(?:!!|:|Thesis))\s+(.+)$/);
  return match ? [match[1], match[2]] : [title, ""];
};
const storyAlt = (item) => `Illustration for the story ${item.title}`;

function Stories({ items }) {
  const [lead, ...rest] = [...items].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const authors = [...new Set(items.map((i) => i.author).filter(Boolean))];
  const [main, deck] = headline(lead.title);
  return (
    <div className="st-paper">
      <div className="container">
        <div className="st-masthead" data-draw>
          <span>{authors.length === 1 ? `Written by ${authors[0]}` : "Anthill Ventures"}</span>
          <span>{String(items.length).padStart(2, "0")} stories</span>
        </div>
        <div className="st-front">
          <article className="content-card st-lead">
            <Link to={lead.path} className="st-lead-link">
              <p className="st-kicker">{lead.date}</p>
              <h2>
                <span className="st-lead-main"><span data-line>{main}</span></span>{" "}
                {deck && <span className="st-lead-deck">{deck}</span>}
              </h2>
              <figure className="st-lead-image" data-unveil>
                <img src={imageSource(lead.image, lead.page)} alt={storyAlt(lead)} loading="lazy" />
              </figure>
              <div className="st-lead-foot">
                <p>{lead.excerpt || lead.teaser}</p>
                <span className="st-read">Read the story <ArrowRight size={18} aria-hidden="true" /></span>
              </div>
            </Link>
          </article>
          <div className="st-side">
            {rest.map((item) => {
              const [head, sub] = headline(item.title);
              return (
                <article className="content-card st-brief" key={item.path}>
                  <Link to={item.path} className="st-brief-link" data-rise>
                    <figure className="st-brief-image">
                      <img src={imageSource(item.image, item.page)} alt={storyAlt(item)} loading="lazy" />
                    </figure>
                    <p className="st-kicker">{item.date}</p>
                    <h2>{head}{sub && <> <span>{sub}</span></>}</h2>
                    <p className="st-brief-text">{item.excerpt || item.teaser}</p>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Insights: real reports standing on a shelf, with their inner pages behind. */

// Figures quoted from each playbook's own summary.
const PLAYBOOK_FIGURES = {
  "/playbooks/climate-impact-report": [
    ["17", "companies"],
    ["1.1 million+", "tCO2e avoided"],
    ["10 million", "litres of water saved annually"],
  ],
  "/playbooks/carbon-markets": [
    ["$49.5 billion", "projected size of India's carbon market by 2030"],
    ["5", "startup verticals mapped"],
  ],
};

function Insights({ items }) {
  return (
    <div className="sh-room">
      <div className="sh-ledge" data-draw />
      <div className="container">
        <div className="sh-top">
          <span className="listing-label">Our playbooks <b>{String(items.length).padStart(2, "0")}</b></span>
        </div>
        <div className="sh-shelf">
          {items.map((item, i) => {
            const [head, sub] = headline(item.title);
            const figures = PLAYBOOK_FIGURES[item.path] || [];
            return (
              <article className={`content-card sh-item sh-item--${i}`} key={item.path}>
                <div className="sh-zone">
                  <div className="sh-lift" data-lift>
                    <Link to={item.path} className="sh-book" aria-label={`Open ${item.title}`}>
                      {item.innerPages.map((p, n) => (
                        <img
                          key={p.local || p.src}
                          className={`sh-page sh-page--${n}`}
                          src={imageSource(p, item.page)}
                          alt={`Inside page ${n + 1} of ${item.title}`}
                          loading="lazy"
                        />
                      ))}
                      <img
                        className="sh-cover"
                        src={imageSource(item.image, item.page)}
                        alt={`Cover of ${item.title}`}
                        loading="lazy"
                      />
                    </Link>
                  </div>
                </div>
                <div className="sh-notes" data-rise>
                  <h2>{head}{sub && <> <span>{sub}</span></>}</h2>
                  {figures.length > 0 && (
                    <dl className="sh-figures">
                      {figures.map(([value, label]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <p>{item.excerpt}</p>
                  <div className="sh-actions">
                    <Link to={item.path} className="button sh-read">
                      Read <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    {item.pdf && (
                      <a href={item.pdf} download className="sh-download" aria-label={`Download ${item.title} as a PDF`}>
                        <Download size={16} aria-hidden="true" /> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Collection({ pathname, page, hero }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const scope = useRef(null);
  const items = useMemo(() => collectionFor(pathname, page), [pathname, page]);
  const matches = items.filter(
    (i) =>
      (category === "All" || i.category === category) &&
      `${i.title} ${i.category} ${i.role} ${i.linkText}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const reset = () => {
    setQuery("");
    setCategory("All");
  };
  const name = pathname.slice(1);
  const settleReveals = useListingMotion(scope, name);
  const filtering = Boolean(query) || category !== "All";
  useEffect(() => {
    if (filtering) settleReveals();
    ScrollTrigger.refresh();
  }, [filtering, matches.length]);
  const targetPaths = new Set(items.map((i) => i.path));
  const cardBlockKeys = new Set(
    items
      .flatMap((item) => item.card?.blocks || [])
      .map((b) => b.src || words(b)),
  );
  const remaining = hero.blocks.filter(
    (b) =>
      !targetPaths.has(cleanPath(b.href || "")) &&
      !cardBlockKeys.has(b.src || words(b)) &&
      !["Year", "YeaR", "Name", "Industry"].includes(words(b)),
  );
  const shared = { items, query, setQuery, matches, reset };
  return (
    <MotionConfig reducedMotion="user">
      <PageHero {...hero} label={labels[pathname] || "Anthill Ventures"} />
      <section
        ref={scope}
        className={`collection collection--${name}`}
        aria-label={labels[pathname] || "Collection"}
      >
        <p className="sr-only" role="status" aria-live="polite">
          {matches.length} {matches.length === 1 ? "result" : "results"}
        </p>
        {pathname === "/portfolio" && <Portfolio {...shared} category={category} setCategory={setCategory} />}
        {pathname === "/team" && <Team {...shared} />}
        {pathname === "/speedscalers" && <Speedscalers {...shared} />}
        {pathname === "/stories" && <Stories items={items} />}
        {pathname === "/insights" && <Insights items={items} />}
      </section>
      {remaining.length > 0 && (
        <BodyContent blocks={remaining} page={page} pathname={pathname} />
      )}
    </MotionConfig>
  );
}
