import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowLeft, ArrowRight, ArrowDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { StageTile } from "../../components/StageVisuals.jsx";
import {
  pages,
  labels,
  words,
  typeOf,
  cleanPath,
  heroData,
  imageSource,
  firstImage,
  SmartLink,
  InlineText,
  Block,
  PageHero,
} from "./core.jsx";
import "./detail.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const MotionLink = motion.create(Link);
const tap = { scale: 0.985 };

/* ---------- Reading the archive ---------- */

const clean = (text) => text.replace(/[​-‍﻿]/g, "").trim();
const pad = (n) => String(n).padStart(2, "0");

// Sentences keep their exact source wording; only the markup around them changes.
function sentences(text) {
  const parts = [];
  const breaker = /[.!?]\s+(?=[A-Z“"])/g;
  let start = 0;
  let match;
  while ((match = breaker.exec(text))) {
    const before = text.slice(start, match.index + 1);
    if (/(?:^|[\s(])(?:Dr|Mr|Mrs|Ms|Prof|St|vs|[A-Z])\.$/.test(before))
      continue;
    parts.push(before);
    start = match.index + match[0].length;
  }
  parts.push(text.slice(start));
  return parts.filter(Boolean);
}

function paragraphs(list, size = 340) {
  const out = [];
  let current = "";
  for (const s of list) {
    if (current && current.length + s.length > size) {
      out.push(current);
      current = s;
    } else current = current ? `${current} ${s}` : s;
  }
  if (current) out.push(current);
  return out;
}

// The opening sentence becomes the lede and the remainder is paced into paragraphs.
function Prose({ blocks, page, size }) {
  const texts = blocks.filter((b) => !b.src && !b.href && clean(words(b)));
  const others = blocks.filter((b) => b.src || b.href);
  if (!texts.length && !others.length) return null;
  const parts = texts[0] ? sentences(clean(words(texts[0]))) : [];
  let leadCount = 0;
  let lead = "";
  while (leadCount < parts.length && lead.length < 40) {
    lead = lead ? `${lead} ${parts[leadCount]}` : parts[leadCount];
    leadCount++;
  }
  const rest = [
    ...paragraphs(parts.slice(leadCount), size),
    ...texts.slice(1).map((b) => clean(words(b))),
  ];
  return (
    <>
      {lead && (
        <p className="detail-lede" data-read>
          <InlineText text={lead} page={page} />
        </p>
      )}
      {rest.length > 0 && (
        <div className="detail-copy">
          {rest.map((text, i) => (
            <p key={i} data-up>
              <InlineText text={text} page={page} />
            </p>
          ))}
        </div>
      )}
      {others.map((b, i) => (
        <Block block={b} page={page} key={i} />
      ))}
    </>
  );
}

const collections = new Map();

function collection(parent, prefix) {
  const key = `${parent}:${prefix}`;
  if (collections.has(key)) return collections.get(key);
  const links = pages[parent]?.links || [];
  const position = (path) => {
    const at = links.findIndex((l) => cleanPath(l.href) === path);
    return at < 0 ? 999 : at;
  };
  const items = Object.keys(pages)
    .filter((path) => path.startsWith(prefix))
    .sort((a, b) => position(a) - position(b))
    .map((path) => {
      const page = pages[path];
      const hero = heroData(page, path);
      const image = firstImage(page);
      const texts = hero.blocks.filter(
        (b) =>
          words(b) && !b.src && !b.href && words(b) !== "View all",
      );
      return {
        path,
        page,
        title: hero.title,
        role: texts.find((b) => words(b).length < 110)
          ? words(texts.find((b) => words(b).length < 110))
          : "",
        src: image && imageSource(image, page),
        facts: companyFacts(hero.blocks).facts,
        date: hero.blocks.map(words).find((t) => /^\d{1,2} \w{3} \d{4}$/.test(t)) || "",
      };
    });
  collections.set(key, items);
  return items;
}

function companyFacts(blocks) {
  const facts = {};
  const used = new Set();
  blocks.forEach((b, i) => {
    if (["Year Invested", "Industry", "Status"].includes(words(b)) && blocks[i + 1]) {
      facts[words(b)] = words(blocks[i + 1]);
      used.add(i);
      used.add(i + 1);
    }
    if (words(b) === "Website" || /^Website Link/.test(words(b))) used.add(i);
  });
  return { facts, rest: blocks.filter((_, i) => !used.has(i)) };
}

const hostname = (href) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

/* ---------- Shared motion ---------- */

function useDetailMotion(root, pathname) {
  useGSAP(
    () => {
      const scope = root.current;
      let timer;
      // Lazy images change the page length, and every trigger position with it.
      const settle = () => {
        clearTimeout(timer);
        timer = setTimeout(() => ScrollTrigger.refresh(), 120);
      };
      scope.addEventListener("load", settle, true);

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        const once = (trigger, start = "top 88%") => ({ trigger, start, once: true });

        const splits = q("[data-lines]").map((el) =>
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            aria: "none",
            linesClass: "detail-line",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 108,
                duration: 1.05,
                stagger: 0.09,
                ease: "expo.out",
                scrollTrigger: once(el),
              }),
          }),
        );

        // The lede inks in as it is read. It only ever moves forward, so text that has
        // been read stays fully dark when the reader scrolls back up.
        const reads = q("[data-read]").map((el) => {
          const split = SplitText.create(el, { type: "words", aria: "none", wordsClass: "detail-word" });
          const ink = gsap.fromTo(
            split.words,
            { opacity: 0.24 },
            { opacity: 1, ease: "none", stagger: 0.1, paused: true },
          );
          ScrollTrigger.create({
            trigger: el,
            start: "top 86%",
            end: "bottom 58%",
            onUpdate: (self) => {
              if (self.progress > ink.progress())
                gsap.to(ink, { progress: self.progress, duration: 0.4, ease: "power1.out", overwrite: true });
            },
          });
          return split;
        });

        q("[data-up]").forEach((el) =>
          gsap.from(el, {
            y: 26,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: once(el, "top 92%"),
          }),
        );

        q("[data-stagger]").forEach((group) =>
          gsap.from(group.children, {
            y: 34,
            autoAlpha: 0,
            duration: 0.85,
            stagger: 0.055,
            ease: "power3.out",
            scrollTrigger: once(group),
          }),
        );

        // The year axis draws itself, then the companies land on it.
        const axis = q("[data-axis]")[0];
        if (axis) {
          gsap.from(axis, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.4,
            ease: "power2.inOut",
            scrollTrigger: once(axis, "top 90%"),
          });
          gsap.from(q("[data-chip]"), {
            y: 26,
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.07,
            delay: 0.3,
            ease: "power3.out",
            scrollTrigger: once(axis, "top 90%"),
          });
        }

        // Reading progress for the long reads.
        const article = q("[data-article]")[0];
        if (article) {
          const fill = q("[data-progress]")[0];
          const percent = q("[data-percent]")[0];
          ScrollTrigger.create({
            trigger: article,
            start: "top 30%",
            end: "bottom 70%",
            onUpdate: (self) => {
              fill.style.transform = `scaleY(${self.progress})`;
              percent.textContent = `${Math.round(self.progress * 100)}%`;
            },
          });
          q("[data-toc]").forEach((link) => {
            const target = scope.querySelector(link.getAttribute("href"));
            if (!target) return;
            ScrollTrigger.create({
              trigger: target,
              start: "top 45%",
              endTrigger: article,
              end: "bottom 45%",
              onToggle: (self) => {
                if (self.isActive) {
                  q("[data-toc]").forEach((l) => l.classList.remove("is-current"));
                  link.classList.add("is-current");
                }
              },
              onLeaveBack: () => {
                link.classList.remove("is-current");
                const links = q("[data-toc]");
                const before = links[links.indexOf(link) - 1];
                if (before) before.classList.add("is-current");
              },
            });
          });
        }

        return () => {
          splits.forEach((s) => s.revert());
          reads.forEach((s) => s.revert());
        };
      });

      // Report pages drift at different speeds, on the vertical axis only. Below this
      // width they sit in a horizontal scroller, which would clip the movement.
      media.add("(prefers-reduced-motion: no-preference) and (min-width: 901px)", () => {
        gsap.utils.selector(scope)("[data-drift]").forEach((el) => {
          const distance = Number(el.dataset.drift);
          gsap.fromTo(
            el,
            { y: distance },
            {
              y: -distance,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });

      return () => {
        clearTimeout(timer);
        scope.removeEventListener("load", settle, true);
        media.revert();
      };
    },
    { scope: root, dependencies: [pathname], revertOnUpdate: true },
  );
}

/* ---------- People ---------- */

function PersonBody({ page, blocks, pathname, parent, family, name }) {
  const label = labels[parent];
  const crew = collection(parent, `/${family}/`);
  const at = Math.max(0, crew.findIndex((p) => p.path === pathname));
  const previous = crew[(at - 1 + crew.length) % crew.length];
  const next = crew[(at + 1) % crew.length];
  const roleBlock = blocks.find((b) => !b.src && !b.href && words(b).length < 110);
  const role = roleBlock ? words(roleBlock) : "";
  const bio = blocks.filter((b) => b !== roleBlock);
  const socials = (page.links || []).filter((l) => !l.text && /^https?:/.test(l.href));
  const socialName = (href) =>
    href.includes("linkedin") ? "LinkedIn" : href.includes("x.com") || href.includes("twitter") ? "X" : "Profile";
  return (
    <>
      <section className="dp-intro">
        <div className="container">
          <p className="dp-tally">
            <span className="eyebrow">{label}</span>
            <span aria-label={`Person ${at + 1} of ${crew.length}`}>
              {pad(at + 1)} <i>/</i> {pad(crew.length)}
            </span>
          </p>
          {role && (
            <h2 className={`dp-role${role.length > 38 ? " dp-role--long" : ""}`} data-lines>
              {role.endsWith(".") ? (
                <>
                  {role.slice(0, -1)}
                  <span className="dp-stop">.</span>
                </>
              ) : (
                <>
                  {role}
                  <span className="dp-stop" aria-hidden="true">.</span>
                </>
              )}
            </h2>
          )}
          <div className="dp-grid">
            <div className="dp-bio">
              <Prose blocks={bio} page={page} />
            </div>
            <div className="dp-actions">
              {socials.map((l) => (
                <SmartLink
                  href={l.href}
                  className="dp-action"
                  key={l.href}
                  aria-label={`${name} on ${socialName(l.href)} (opens in a new tab)`}
                >
                  <span>{socialName(l.href)}</span>
                  <ArrowUpRight size={22} />
                </SmartLink>
              ))}
              <Link to={parent} className="dp-action dp-action--quiet">
                <span>Explore {label}</span>
                <ArrowLeft size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="dp-crew detail-ink">
        <div className="container">
          <h2 className="dp-crew-title" data-lines>
            {family === "team" ? "The rest of the team" : "More Speed Scalers"}
          </h2>
          {crew.length > 1 && (
            <div className="dp-turn">
              <MotionLink to={previous.path} className="dp-turn-card dp-turn-card--prev" whileTap={tap}>
                <span className="dp-turn-photo">
                  {previous.src && <img src={previous.src} alt="" loading="lazy" />}
                </span>
                <span className="dp-turn-copy">
                  <span className="dp-turn-dir"><ArrowLeft size={16} /> Previous</span>
                  <strong>{previous.title}</strong>
                  <span className="dp-turn-role">{previous.role}</span>
                </span>
              </MotionLink>
              <MotionLink to={next.path} className="dp-turn-card dp-turn-card--next" whileTap={tap}>
                <span className="dp-turn-copy">
                  <span className="dp-turn-dir">Next <ArrowRight size={16} /></span>
                  <strong>{next.title}</strong>
                  <span className="dp-turn-role">{next.role}</span>
                </span>
                <span className="dp-turn-photo">
                  {next.src && <img src={next.src} alt="" loading="lazy" />}
                </span>
              </MotionLink>
            </div>
          )}
          <nav aria-label={`Everyone in ${label}`}>
            <ul
              className={`dp-sheet${crew.length > 8 ? " dp-sheet--wide" : ""}`}
              data-stagger
            >
              {crew.map((person) => (
                <li key={person.path}>
                  <Link
                    to={person.path}
                    className="dp-sheet-link"
                    aria-current={person.path === pathname ? "page" : undefined}
                  >
                    <span className="dp-sheet-photo">
                      {person.src && <img src={person.src} alt="" loading="lazy" />}
                    </span>
                    <span className="dp-sheet-name">{person.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
}

/* ---------- Portfolio ---------- */

function YearMap({ companies, pathname, name }) {
  const years = companies.map((c) => Number(c.facts["Year Invested"])).filter(Boolean);
  if (!years.length) return null;
  const axis = [];
  for (let y = Math.min(...years); y <= Math.max(...years); y++) axis.push(y);
  return (
    <section className="dc-map detail-night">
      <div className="container">
        <div className="dc-map-head">
          <h2 data-lines>Where {name} sits in the portfolio</h2>
          <p data-up>
            {companies.length} company profiles, placed by the year Anthill
            invested.
          </p>
        </div>
        <ol className="dc-years" style={{ "--years": axis.length }}>
          {axis.map((year) => {
            const here = companies.filter((c) => Number(c.facts["Year Invested"]) === year);
            return (
              <li className={`dc-year${here.length ? "" : " dc-year--empty"}`} key={year}>
                <ul>
                  {here.map((c) => (
                    <li key={c.path} data-chip>
                      <Link
                        to={c.path}
                        className="dc-chip"
                        aria-current={c.path === pathname ? "page" : undefined}
                      >
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <span className="dc-year-label">{year}</span>
              </li>
            );
          })}
          <li className="dc-axis" data-axis aria-hidden="true" />
        </ol>
      </div>
    </section>
  );
}

function CompanyBody({ page, blocks, pathname, parent, name }) {
  const { facts, rest } = companyFacts(blocks);
  const website = (page.links || []).find((l) => /Website Link/i.test(l.text));
  const companies = collection("/portfolio", "/portfolio/");
  const year = Number(facts["Year Invested"]);
  const related = companies
    .filter((c) => c.path !== pathname)
    .map((c) => ({
      c,
      score:
        (c.facts.Industry === facts.Industry ? 0 : 100) +
        Math.abs(Number(c.facts["Year Invested"]) - year),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(({ c }) => c);
  const story = rest.filter((b) => clean(words(b)) || b.src);
  return (
    <>
      <section className="dc-band detail-night">
        <div className="container dc-band-grid">
          <dl>
            {facts["Year Invested"] && (
              <div className="dc-fact dc-fact--year">
                <dt>Year Invested</dt>
                <dd data-lines>{facts["Year Invested"]}</dd>
              </div>
            )}
            {facts.Industry && (
              <div className="dc-fact">
                <dt>Industry</dt>
                <dd>{facts.Industry}</dd>
              </div>
            )}
            {facts.Status && (
              <div className="dc-fact">
                <dt>Status</dt>
                <dd className="dc-status">
                  <span className="dc-status-dot" aria-hidden="true" />
                  {facts.Status}
                </dd>
              </div>
            )}
          </dl>
          {website && (
            <SmartLink
              href={website.href}
              className="dc-site"
              aria-label={`Website: ${hostname(website.href)} (opens in a new tab)`}
            >
              <span className="dc-site-label">Website</span>
              <span className="dc-site-host">{hostname(website.href)}</span>
              <ArrowUpRight size={34} strokeWidth={1.5} />
            </SmartLink>
          )}
        </div>
      </section>

      {story.length > 0 && (
        <section className="dc-story">
          <div className="container dc-story-grid">
            <h2>The story</h2>
            <div>
              <Prose blocks={story} page={page} />
            </div>
          </div>
        </section>
      )}

      <YearMap companies={companies} pathname={pathname} name={name} />

      <section className="dc-related">
        <div className="container">
          <h2 data-lines>More from the portfolio</h2>
          <div className="dc-related-grid" data-stagger>
            {related.map((c) => (
              <MotionLink to={c.path} className="dc-card" key={c.path} whileTap={tap}>
                <span className={`dc-card-photo${c.path.includes("videoverse") ? " dc-card-photo--light" : ""}`}>
                  {c.src && <img src={c.src} alt="" loading="lazy" />}
                </span>
                <span className="dc-card-meta">
                  <span>{c.facts.Industry}</span>
                  <span>{c.facts["Year Invested"]}</span>
                </span>
                <h3>{c.title}</h3>
              </MotionLink>
            ))}
          </div>
          <Link to={parent} className="button detail-return">
            <ArrowLeft size={17} /> Explore {labels[parent]}
          </Link>
        </div>
      </section>
    </>
  );
}

/* ---------- Stories ---------- */

const OPENERS = [
  "Just as an anthill is not created overnight, scale is not accidental. It is engineered.",
  "Anthill is not just a source of capital.",
];

function parseStory(blocks, page) {
  const meta = { intro: "", author: null, date: "", source: null };
  const imageLinks = (page.links || []).filter((l) => !l.text && /^https?:/.test(l.href));
  let imageCount = 0;
  const items = [];
  const notes = [];
  let inNote = false;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const text = clean(words(b));
    const type = typeOf(b);
    if (!meta.author && text === "Written by:") {
      meta.intro = text;
      if (blocks[i + 1]?.href) meta.author = blocks[++i];
      if (/^\d{1,2} \w{3} \d{4}$/.test(words(blocks[i + 1] || {}))) meta.date = words(blocks[++i]);
      continue;
    }
    if (b.href && !b.src) {
      if (text === "Visit Website") {
        if (b.href !== "#") meta.source = b;
      } else items.push({ kind: "block", block: b });
      continue;
    }
    if (b.src) {
      const caption = typeOf(blocks[i + 1] || {}) === "figcaption" ? words(blocks[++i]) : "";
      items.push({ kind: "figure", block: b, caption, link: imageLinks[imageCount++]?.href });
      continue;
    }
    if (!text) continue;
    if (type === "figcaption") {
      items.push({ kind: "caption", text });
      continue;
    }
    if (/^Note:/.test(text)) inNote = true;
    if (inNote) {
      notes.push(text);
      continue;
    }
    if (type === "li") {
      const last = items[items.length - 1];
      if (last?.kind === "list") last.items.push(text);
      else items.push({ kind: "list", items: [text] });
      continue;
    }
    if (isSubhead(text)) {
      items.push({ kind: "subhead", text });
      continue;
    }
    if (/^Source:/.test(text)) {
      const last = items[items.length - 1];
      if (last?.kind === "p") {
        items[items.length - 1] = { kind: "datum", text: last.text, source: text };
        continue;
      }
    }
    // A paragraph can open on a line strong enough to stand alone. The wording and its
    // order are unchanged: the line simply becomes a moment and the paragraph continues.
    const opener = OPENERS.find((line) => text.startsWith(`${line} `));
    if (opener) {
      items.push({ kind: "moment", lines: [opener] });
      items.push({ kind: "p", text: text.slice(opener.length + 1) });
      continue;
    }
    if (text.length <= 90 && /\.$/.test(text)) {
      const last = items[items.length - 1];
      if (last?.kind === "moment") last.lines.push(text);
      else items.push({ kind: "moment", lines: [text] });
      continue;
    }
    items.push({ kind: "p", text });
  }
  // The closing line of a piece gets the full-width night treatment.
  let finale = null;
  const last = items[items.length - 1];
  if (last?.kind === "moment") finale = items.pop().lines;
  else if (last?.kind === "p" && last.text.length < 170) finale = [items.pop().text];
  return { meta, items, notes, finale };
}

function isSubhead(text) {
  if (/^#\s?\d+\s/.test(text)) return true;
  if (/\):$/.test(text)) return true;
  return text.length <= 70 && !/[.,:;!]$/.test(text) && !/^Source:/.test(text);
}

const subheadParts = (text) => {
  const numbered = text.match(/^#(\s?)(\d+)\s+(.*)$/);
  return numbered
    ? { spaced: Boolean(numbered[1]), number: numbered[2], title: numbered[3] }
    : { title: text };
};

// Splits "Term : explanation" or "Term - explanation" so the term can carry the weight.
function ListText({ text, page }) {
  const match = text.match(/^(.{2,34}?)(\s?:\s|\s-\s)(.+)$/);
  if (!match) return <InlineText text={text} page={page} />;
  return (
    <>
      <strong>{match[1]}</strong>
      {match[2]}
      <InlineText text={match[3]} page={page} />
    </>
  );
}

const storyWords = (items, notes, finale) =>
  [
    ...items.flatMap((item) => [item.text, item.source, ...(item.items || []), ...(item.lines || [])]),
    ...notes,
    ...(finale || []),
  ]
    .filter(Boolean)
    .join(" ")
    .split(/\s+/).length;

function StoryBody({ page, blocks, pathname, parent, name }) {
  const { meta, items, notes, finale } = parseStory(blocks, page);
  const heads = items.filter((i) => i.kind === "subhead");
  const others = collection(parent, "/stories/").filter((s) => s.path !== pathname);
  const minutes = Math.max(1, Math.round(storyWords(items, notes, finale) / 220));
  let headIndex = 0;
  let firstParagraph = true;
  return (
    <>
      <section className="ds-byline">
        <div className="container ds-byline-row">
          {meta.author && (
            <p>
              <span className="ds-byline-label">{meta.intro}</span>
              <SmartLink href={meta.author.href} className="ds-author">
                {words(meta.author)} <ArrowUpRight size={16} />
              </SmartLink>
            </p>
          )}
          {meta.date && (
            <p>
              <span className="ds-byline-label">Published</span>
              <span className="ds-byline-value">{meta.date}</span>
            </p>
          )}
          <p>
            <span className="ds-byline-label">Reading time</span>
            <span className="ds-byline-value">{minutes} min</span>
          </p>
        </div>
      </section>

      <div className="container ds-article" data-article>
        <aside className="ds-rail">
          <div className="ds-rail-inner">
            <div className="ds-meter" aria-hidden="true">
              <span className="ds-meter-track">
                <span data-progress />
              </span>
              <span className="ds-meter-value" data-percent>0%</span>
            </div>
            {heads.length > 1 && (
              <nav aria-label="In this story" className="ds-toc">
                <ol>
                  {heads.map((head, i) => (
                    <li key={i}>
                      <a href={`#section-${i + 1}`} data-toc>
                        {subheadParts(head.text).title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        </aside>

        <article className="ds-flow">
          {items.map((item, i) => {
            if (item.kind === "subhead") {
              headIndex++;
              const parts = subheadParts(item.text);
              return (
                <h2 className="ds-subhead" id={`section-${headIndex}`} key={i}>
                  {parts.number && (
                    <span className="ds-subhead-number">
                      #
                      {parts.spaced && <span className="ds-collapse"> </span>}
                      {parts.number}{" "}
                    </span>
                  )}
                  <span data-lines>
                    <InlineText text={parts.title} page={page} />
                  </span>
                </h2>
              );
            }
            if (item.kind === "moment")
              return (
                <div className="ds-moment" key={i}>
                  {item.lines.map((line, j) => (
                    <p key={j} data-lines>
                      <InlineText text={line} page={page} />
                    </p>
                  ))}
                </div>
              );
            if (item.kind === "datum")
              return (
                <div className="ds-datum" key={i} data-up>
                  <p>
                    <InlineText text={item.text} page={page} />
                  </p>
                  <p className="ds-datum-source">
                    <InlineText text={item.source} page={page} />
                  </p>
                </div>
              );
            if (item.kind === "figure") {
              const image = (
                <img
                  src={imageSource(item.block, page)}
                  alt={item.block.alt || (/credit/i.test(item.caption) || !item.caption ? `Illustration from the story ${name}` : item.caption)}
                  loading="lazy"
                />
              );
              return (
                <figure className="ds-figure" key={i} data-up>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      {image}
                    </a>
                  ) : (
                    image
                  )}
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              );
            }
            if (item.kind === "caption")
              return (
                <p className="ds-caption" key={i}>{item.text}</p>
              );
            if (item.kind === "list")
              return (
                <ul className="ds-list" key={i}>
                  {item.items.map((text, j) => (
                    <li key={j}>
                      <ListText text={text} page={page} />
                    </li>
                  ))}
                </ul>
              );
            if (item.kind === "block")
              return <Block block={item.block} page={page} key={i} />;
            const opening = firstParagraph;
            firstParagraph = false;
            return (
              <p className={opening ? "ds-p ds-opening" : "ds-p"} key={i}>
                <InlineText text={item.text} page={page} />
              </p>
            );
          })}
        </article>
      </div>

      {finale && (
        <section className="ds-finale detail-night">
          <div className="container">
            {finale.map((line, i) => (
              <p key={i} data-lines>
                <InlineText text={line} page={page} />
              </p>
            ))}
          </div>
        </section>
      )}

      {(notes.length > 0 || meta.source) && (
        <section className="ds-end">
          <div className="container ds-end-grid">
            {notes.length > 0 && (
              <div className="ds-notes">
                {notes.map((text, i) => (
                  <p key={i}>
                    <InlineText text={text} page={page} />
                  </p>
                ))}
              </div>
            )}
            {meta.source && (
              <SmartLink href={meta.source.href} className="ds-source">
                <span className="ds-byline-label">Visit Website</span>
                <span className="ds-source-host">{hostname(meta.source.href)}</span>
                <ArrowUpRight size={26} />
              </SmartLink>
            )}
          </div>
        </section>
      )}

      <section className="ds-next">
        <div className="container">
          <h2 data-lines>Keep reading</h2>
          <div className="ds-next-list" data-stagger>
            {others.map((story) => (
              <MotionLink to={story.path} className="ds-next-item" key={story.path} whileTap={tap}>
                <span className="ds-next-photo">
                  {story.src && <img src={story.src} alt="" loading="lazy" />}
                </span>
                <span className="ds-next-copy">
                  <span className="ds-byline-label">{story.date}</span>
                  <h3>{story.title}</h3>
                </span>
                <ArrowUpRight size={28} />
              </MotionLink>
            ))}
          </div>
          <Link to={parent} className="button detail-return">
            <ArrowLeft size={17} /> Explore {labels[parent]}
          </Link>
        </div>
      </section>
    </>
  );
}

/* ---------- Playbooks ---------- */

function PlaybookDownload({ page }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const link = (page.links || []).find((l) => l.text === "Download");
  if (!link) return null;
  return (
    <section className="pb-download detail-night" id="download">
      <div className="container pb-download-grid">
        <div className="pb-download-copy">
          <span className="eyebrow">THE COMPLETE PLAYBOOK</span>
          <h2 data-lines>Ideas to put into action.</h2>
          <p>Download the full report.</p>
        </div>
        <form
          className="pb-form"
          onSubmit={(e) => {
            e.preventDefault();
            setReady(true);
          }}
        >
          <label htmlFor="playbook-email">Your Email Address</label>
          <input
            id="playbook-email"
            name="EMAIL"
            type="email"
            autoComplete="email"
            required
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setReady(false);
            }}
          />
          <button className="button pb-submit" type="submit">
            Download <ArrowDown size={20} />
          </button>
          <p className="pb-note">
            Email subscriptions are not connected yet. Your address is not
            submitted.
          </p>
          {ready && (
            <div className="pb-feedback" role="status">
              <p>Your PDF is ready. No subscription has been created.</p>
              <div>
                <a
                  href={link.local || link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                >
                  Open the PDF <ArrowUpRight size={16} />
                </a>
                <a href={link.local || link.href} download className="pb-save">
                  Save PDF
                </a>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

const pageDrift = [46, -30, 62, -18];

function PlaybookBody({ page, blocks, pathname, parent, name }) {
  // Slide-shaped reports need bigger previews than portrait ones to stay legible.
  const [landscape, setLandscape] = useState(false);
  const sheets = blocks.filter((b) => b.src);
  const summary = blocks.filter((b) => !b.src);
  const others = collection(parent, "/playbooks/").filter((p) => p.path !== pathname);
  return (
    <>
      <PlaybookDownload page={page} />

      {summary.length > 0 && (
        <section className="pb-summary">
          <div className="container pb-summary-grid">
            <h2>About this playbook</h2>
            <div>
              <Prose blocks={summary} page={page} size={420} />
            </div>
          </div>
        </section>
      )}

      {sheets.length > 0 && (
        <section className="pb-inside detail-ink">
          <div className="container">
            <div className="pb-inside-head">
              <h2 data-lines>Inside the report</h2>
              <a href="#download" className="pb-inside-cta">
                Download the full report <ArrowUpRight size={18} />
              </a>
            </div>
            <div
              className={`pb-sheets${landscape ? " pb-sheets--landscape" : ""}`}
              tabIndex={0}
              role="group"
              aria-label="Pages from the report"
            >
              {sheets.map((sheet, i) => (
                <figure key={i} className="pb-sheet">
                  <div data-drift={pageDrift[i % pageDrift.length]}>
                    <img
                      src={imageSource(sheet, page)}
                      alt={sheet.alt || `Page ${i + 2} of ${name}`}
                      loading="lazy"
                      onLoad={(e) => {
                        if (e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)
                          setLandscape(true);
                      }}
                    />
                    <figcaption>Page {pad(i + 2)}</figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pb-more">
        <div className="container">
          <h2 data-lines>More playbooks</h2>
          <div className="pb-more-grid" data-stagger>
            {others.map((other) => (
              <MotionLink to={other.path} className="pb-more-item" key={other.path} whileTap={tap}>
                <span className="pb-more-cover">
                  {other.src && <img src={other.src} alt="" loading="lazy" />}
                </span>
                <span className="pb-more-copy">
                  <h3>{other.title}</h3>
                  <ArrowUpRight size={24} />
                </span>
              </MotionLink>
            ))}
          </div>
          <Link to={parent} className="button detail-return">
            <ArrowLeft size={17} /> Explore {labels[parent]}
          </Link>
        </div>
      </section>
    </>
  );
}

/* ---------- Page ---------- */

const familyClass = {
  team: "person",
  mentors: "person",
  portfolio: "company",
  stories: "article",
  playbooks: "playbook",
};

export default function DetailPage({ pathname, page, hero }) {
  const root = useRef(null);
  const family = pathname.split("/")[1];
  const people = ["team", "mentors"].includes(family);
  const parent =
    family === "mentors"
      ? "/speedscalers"
      : family === "playbooks"
        ? "/insights"
        : `/${family}`;
  const image = firstImage(page);
  const imageSrc = image && imageSource(image, page);
  // A story's first image is the hero tile only when it opens the piece. An image inside
  // the text belongs to the argument around it, so it also stays in place at reading size.
  const firstTextIndex = hero.blocks.findIndex(
    (b) => ["p", "li"].includes(typeOf(b)) && clean(words(b)),
  );
  const blocks = hero.blocks.filter(
    (b, i) =>
      words(b) !== "View all" &&
      !(
        family === "playbooks" &&
        ["Download", "Oops! Something went wrong."].includes(words(b))
      ) &&
      !(
        imageSrc &&
        b.src &&
        imageSource(b, page) === imageSrc &&
        !(family === "stories" && firstTextIndex >= 0 && i > firstTextIndex)
      ),
  );
  useDetailMotion(root, pathname);
  const props = { page, blocks, pathname, parent, family, name: hero.title };
  return (
    <>
      <PageHero
        {...hero}
        label={labels[parent] || "Anthill Ventures"}
        back={{ href: parent, label: labels[parent] || "Back" }}
        visual={
          image && (
            <StageTile
              src={imageSrc}
              alt={image.alt || hero.title}
              variant={`${people ? "person" : family === "portfolio" ? "company" : family === "stories" ? "story" : "playbook"}${pathname.includes("videoverse") ? " stage-tile--light" : ""}`}
            />
          )
        }
      />
      <div ref={root} className={`detail detail--${familyClass[family]}`}>
        {people && <PersonBody {...props} />}
        {family === "portfolio" && <CompanyBody {...props} />}
        {family === "stories" && <StoryBody {...props} />}
        {family === "playbooks" && <PlaybookBody {...props} />}
      </div>
    </>
  );
}
