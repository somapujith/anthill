import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Send,
  Mail,
} from "lucide-react";
import siteContent from "../data/view-content.json";
import PageBackdrop from "../components/PageBackdrop.jsx";
import SpotlightCard from "../components/reactbits/SpotlightCard.jsx";
import "./content-pages.css";

const pages = siteContent.pages || {};
const labels = {
  "/about": "About Anthill",
  "/philosophy": "Our Philosophy",
  "/programs": "Anthill for India 2030",
  "/portfolio": "Our Portfolio",
  "/team": "Our Team",
  "/speedscalers": "Speed Scalers",
  "/stories": "Stories",
  "/insights": "Insights",
  "/privacy-policy": "Privacy Policy",
  "/contact": "Contact",
};
// Display edits are kept separate from the captured source archive.
export const heroCopy = {
  "/about": {
    title: "About Anthill",
    description:
      "We invest in early-stage companies and work with founders on funding, mentorship and market access.",
  },
  "/philosophy": {
    description:
      "Capital, mentorship and market access for companies working in health, climate and urban lifestyles.",
  },
  "/portfolio": {
    description:
      "Explore the companies in our portfolio across health, consumer, urban tech and media.",
  },
  "/team": {
    description:
      "Meet the investment and operations team working with Anthill's founders and portfolio companies.",
  },
  "/speedscalers": {
    description:
      "Meet the founders, operators and industry specialists in Anthill's mentorship network.",
  },
  "/programs": {
    description:
      "Our venture scaling program brings early-stage companies access to capital, industry expertise and distribution networks.",
  },
  "/stories": {
    description:
      "Founder interviews, conversations and news from across the Anthill network.",
  },
  "/insights": {
    description:
      "Reports and playbooks on company building, market trends and our portfolio's impact.",
  },
};
export const editorialCopy = [
  [
    "For the past decade Anthill",
    "Anthill Ventures invests in early-stage companies across health, climate and urban lifestyles. Founders work with our operators, domain experts and network on funding, product development and market access. Our Scalability Quotient helps assess a company's readiness to grow.",
  ],
  [
    "Empowering Visionaries Through Strategic Support",
    "How we support founders",
  ],
  ["Where Speed Meets Purpose", "How we invest"],
  ["Scaling with Speed, Investing with Purpose.", "Our approach"],
  [
    "We assess ventures across 9 core pillars",
    "Nine areas we assess before investing",
  ],
  [
    "Scaling ventures with precision, purpose, and proven market insight.",
    "Support for each stage of growth",
  ],
  ["Build Smarter, Scale Faster with Anthill", "The program"],
  ["Partnering for Growth, Shaping the Future", "Our leadership"],
  [
    "Anthill Essentials: Frequently Asked Questions",
    "Frequently asked questions",
  ],
];
const displayText = (text) =>
  editorialCopy.find(([source]) => text.startsWith(source))?.[1] || text;

const typeOf = (b) => String(b.type || b.tag || "p").toLowerCase();
const words = (b) => b.text || b.content || "";
const cleanPath = (href) => {
  try {
    const url = new URL(href, "https://www.anthillventures.com");
    return /(^|\.)anthillventures\.com$/.test(url.hostname)
      ? `${url.pathname}${url.search}${url.hash}`
      : href;
  } catch {
    return href;
  }
};
const pageBlocks = (page) =>
  (page?.blocks || [])
    .filter(
      (b) =>
        (words(b)
          .replace(/[\u200b-\u200d\ufeff]/g, "")
          .trim() ||
          b.src) &&
        !isDecor(b),
    )
    .flatMap((b) => {
      if (b.href || b.src) return [b];
      const text = words(b);
      if (
        page.path === "/info/styleguide" &&
        /^Thank you!|^Oops! Something went wrong while submitting/.test(text)
      )
        return [];
      if (page.path === "/info/styleguide" && text === "All Forms")
        return [b, { type: "source-form", forms: page.forms || [] }];
      const direct = page?.links?.find(
        (l) => l.text === text || l.text === `${text} ${text}`,
      );
      if (direct && text !== "View all")
        return [{ ...b, href: direct.local || direct.href }];
      const embedded = (page?.links || []).filter(
        (l) => l.text.length > 30 && text.includes(l.text),
      );
      if (embedded.length > 1)
        return embedded.map((l) => ({
          type: "link",
          text: l.text,
          href: l.href,
        }));
      return [{ ...b, text: displayText(text) }];
    })
    .filter((block, index, all) => {
      const previous = all[index - 1];
      return (
        !block.href ||
        !previous ||
        block.href !== previous.href ||
        words(block) !== words(previous)
      );
    });
const isHeading = (b) => /^h[1-6]$/.test(typeOf(b));
const isDecor = (i) =>
  /(?:About-Page2|_sphere)\.jpg(?:\?|$)/i.test(i.src || "") ||
  /^(arrow|icon|menu)$/i.test(i.alt || "") ||
  (/^decor$/i.test(i.alt || "") && /\.svg(?:\?|$)/i.test(i.src || "")) ||
  /(?:arrow|icon|decor)[-_\s.%]/i.test(i.src || "");
const imageSource = (image, page) =>
  image.local ||
  image.localSrc ||
  page?.images?.find((i) => i.src === image.src)?.local ||
  image.src;
const usefulImages = (page) =>
  (page?.images || []).filter((i) => !isDecor(i) && (i.local || i.src));
const firstImage = (page) => usefulImages(page)[0];
const routeTitle = (path) =>
  path
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-[a-z0-9]{5,}$/, "")
    .replaceAll("-", " ") || "Anthill";

function SmartLink({ href, children, ...props }) {
  const destination = cleanPath(href || "/contact");
  return destination.startsWith("/") ? (
    <Link to={destination} {...props}>
      {children}
    </Link>
  ) : (
    <a
      href={destination}
      target={/^https?:/.test(destination) ? "_blank" : undefined}
      rel={/^https?:/.test(destination) ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function heroData(page, pathname) {
  const blocks = pageBlocks(page);
  const detail = /^\/(team|mentors|portfolio|stories|playbooks)\//.test(
    pathname,
  );
  let titleIndex = blocks.findIndex((b) =>
    ["h1", ...(detail ? ["h2"] : [])].includes(typeOf(b)),
  );
  const firstText = blocks.findIndex(
    (b) =>
      words(b) &&
      words(b).length < 160 &&
      !b.href &&
      !/^\d+$/.test(words(b)) &&
      !/^View all$/i.test(words(b)),
  );
  if (titleIndex < 0 || (!detail && firstText >= 0 && firstText < titleIndex))
    titleIndex = firstText;
  const consumed = new Set();
  let title = labels[pathname] || routeTitle(pathname);
  if (titleIndex >= 0) {
    title = words(blocks[titleIndex]);
    consumed.add(titleIndex);
    if (typeOf(blocks[titleIndex]) === "h1") {
      let i = titleIndex + 1;
      while (blocks[i] && typeOf(blocks[i]) === "h1") {
        title += ` ${words(blocks[i])}`;
        consumed.add(i);
        i++;
      }
    }
  }
  const end = Math.max(-1, ...consumed);
  let description = "";
  if (
    blocks[end + 1] &&
    !blocks[end + 1].href &&
    words(blocks[end + 1]).length > 110 &&
    !["h1", "h2"].includes(typeOf(blocks[end + 1]))
  ) {
    description = words(blocks[end + 1]);
    consumed.add(end + 1);
  }
  return {
    title,
    description,
    blocks: blocks.filter((_, i) => !consumed.has(i)),
    ...heroCopy[pathname],
  };
}

function PageHero({ title, description, label, back, children }) {
  const { pathname } = useLocation();
  const family = pathname.split("/")[1] || "about";
  const quiet = pathname === "/privacy-policy" || pathname.startsWith("/info/");
  return (
    <section className={`content-hero container content-hero--${family} ${quiet ? "content-hero--quiet" : ""}`}>
      <div className="content-hero-layout">
        <div className="content-hero-copy">
          {back && (
            <Link className="content-back" to={back.href}>
              <ArrowLeft size={15} /> {back.label}
            </Link>
          )}
          <Reveal>
            <div className="eyebrow">{label || "ANTHILL VENTURES"}</div>
            <h1>{title}</h1>
          </Reveal>
          <div className="content-hero-bottom">
            {description && (
              <Reveal className="content-hero-description">
                <p>{description}</p>
              </Reveal>
            )}
            {children}
          </div>
        </div>
        {!quiet && (
          <div className="content-hero-backdrop">
            <PageBackdrop pathname={pathname} />
          </div>
        )}
      </div>
    </section>
  );
}

function sourceName(path, page) {
  const heading =
    pageBlocks(page).find((b) => ["h1", "h2"].includes(typeOf(b))) ||
    pageBlocks(page).find(
      (b) => words(b) && words(b) !== "View all" && !b.href,
    );
  return heading ? words(heading) : routeTitle(path);
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
    };
  });
}

function CollectionCard({ item, index, kind }) {
  const portrait = kind === "people";
  return (
    <Reveal
      className={`content-card ${portrait ? "content-person" : ""} ${item.path.includes("videoverse") ? "content-white-company" : ""}`}
      delay={(index % 3) * 0.045}
    >
      <Link to={item.path} className="content-card-link">
        <SpotlightCard
          className={`content-card-media ${kind === "portfolio" ? "content-company-media" : ""}`}
          spotlightColor="#e6212b"
          intensity={0.18}
          borderGlow={0.7}
        >
          {item.image ? (
            <img
              src={imageSource(item.image, item.page)}
              alt={item.image.alt || item.title}
              loading="lazy"
            />
          ) : (
            <div className="content-type-art" aria-hidden="true">
              <span>{item.title.slice(0, 1)}</span>
            </div>
          )}
          <span className="content-card-arrow">
            <ArrowUpRight size={22} />
          </span>
        </SpotlightCard>
        <div className="content-card-meta">
          <span>
            {item.category ||
              (portrait ? item.role : item.year) ||
              (kind === "insights" ? "PLAYBOOK" : "ANTHILL VENTURES")}
          </span>
          {item.year && item.category && <span>{item.year}</span>}
        </div>
        <h2>{item.title}</h2>
        {item.excerpt && <p className="content-person-bio">{item.excerpt}</p>}
      </Link>
    </Reveal>
  );
}

function Collection({ pathname, page, hero }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const items = useMemo(() => collectionFor(pathname, page), [pathname, page]);
  const categories = [
    "All",
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ];
  const filtered = items.filter(
    (i) =>
      (category === "All" || i.category === category) &&
      `${i.title} ${i.category} ${i.role} ${i.linkText}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const kind = ["/team", "/speedscalers"].includes(pathname)
    ? "people"
    : pathname === "/portfolio"
      ? "portfolio"
      : pathname === "/insights"
        ? "insights"
        : "stories";
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
  return (
    <>
      <PageHero {...hero} label={labels[pathname] || "Anthill Ventures"} />
      <section className="container content-collection-section">
        <div className="content-collection-toolbar">
          <div className="content-filters" aria-label="Filter portfolio">
            {kind === "portfolio" ? (
              categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={category === c ? "is-active" : ""}
                  aria-pressed={category === c}
                >
                  {c}
                </button>
              ))
            ) : (
              <span className="eyebrow">
                {kind === "people"
                  ? "MEET THE PEOPLE"
                  : kind === "insights"
                    ? "OUR PLAYBOOKS"
                    : "EXPLORE THE COLLECTION"}{" "}
                <span className="content-count">
                  {items.length.toString().padStart(2, "0")}
                </span>
              </span>
            )}
          </div>
          <label className="content-search">
            <Search size={17} />
            <input
              type="search"
              aria-label={`Search ${labels[pathname] || "collection"}`}
              placeholder={
                kind === "portfolio"
                  ? "Find a company"
                  : "Search the collection"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>
        <div
          className={`content-card-grid ${kind === "people" ? "content-people-grid" : ""}`}
        >
          {filtered.map((item, index) => (
            <CollectionCard
              key={item.path}
              item={item}
              index={index}
              kind={kind}
            />
          ))}
        </div>
        {!filtered.length && (
          <div className="content-empty">
            <p>No results for “{query}”.</p>
            <button
              className="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      {remaining.length > 0 && (
        <BodyContent blocks={remaining} page={page} pathname={pathname} />
      )}
    </>
  );
}

function InlineText({ text, page }) {
  const links = (page?.links || []).filter(
    (l) => l.text && text.includes(l.text) && l.text.length < 120,
  );
  if (!links.length) return text;
  const segments = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    const match = links
      .map((l) => ({ link: l, position: remaining.indexOf(l.text) }))
      .filter((l) => l.position >= 0)
      .sort(
        (a, b) =>
          a.position - b.position || b.link.text.length - a.link.text.length,
      )[0];
    if (!match) {
      segments.push(remaining);
      break;
    }
    if (match.position) segments.push(remaining.slice(0, match.position));
    segments.push(
      <a
        key={key++}
        href={match.link.local || match.link.href}
        target={/^https?:/.test(match.link.href) ? "_blank" : undefined}
        rel={
          /^https?:/.test(match.link.href) ? "noopener noreferrer" : undefined
        }
        className="content-inline-link"
      >
        {match.link.text}
      </a>,
    );
    remaining = remaining.slice(match.position + match.link.text.length);
  }
  return segments;
}

function UtilityForm({ form, index }) {
  const [status, setStatus] = useState("");
  return (
    <form
      className="content-contact-form content-demo-form"
      aria-label={`${form.name || "Demo form"} ${index + 1}`}
      onInvalid={() => setStatus("error")}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus("success");
      }}
    >
      <p className="content-form-note">
        Interactive form preview. This form does not send data.
      </p>
      {(form.fields || [])
        .filter((f) => f.type !== "submit")
        .map((field, i) => (
          <label key={i} htmlFor={`demo-${index}-${field.id || i}`}>
            {field.placeholder || field.name}
            <span className="sr-only"> Demo field</span>
            {field.tag === "textarea" ? (
              <textarea
                id={`demo-${index}-${field.id || i}`}
                name={field.name}
                rows="4"
                placeholder={field.placeholder}
                required={field.required}
                onChange={() => setStatus("")}
              />
            ) : (
              <input
                id={`demo-${index}-${field.id || i}`}
                name={field.name}
                type={
                  /email/i.test(field.name) ? "email" : field.type || "text"
                }
                placeholder={field.placeholder}
                required={field.required}
                onChange={() => setStatus("")}
              />
            )}
          </label>
        ))}
      <button className="button" type="submit">
        Preview submit <ArrowRight size={17} />
      </button>
      {status === "success" && (
        <div className="content-form-feedback" role="status">
          <p>Preview complete. No data has been sent.</p>
          <p className="content-demo-state">
            <span>Success state preview:</span> Thank you! Your submission has
            been received!
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="content-form-feedback" role="alert">
          <p>Please check the email format.</p>
          <p className="content-demo-state">
            <span>Error state preview:</span> Oops! Something went wrong while
            submitting the form.
          </p>
        </div>
      )}
    </form>
  );
}

function Block({ block, page, index = 0 }) {
  const type = typeOf(block);
  const text = words(block);
  if (type === "source-form")
    return (
      <div className="content-utility-forms">
        {block.forms.map((form, i) => (
          <UtilityForm form={form} index={i} key={i} />
        ))}
      </div>
    );
  if (type === "gallery")
    return (
      <div className="content-logo-gallery">
        {block.images.map((i, n) => (
          <img
            src={imageSource(i, page)}
            alt={i.alt || ""}
            loading="lazy"
            key={n}
          />
        ))}
      </div>
    );
  if (type === "metric")
    return (
      <div className="content-metric">
        <span>{text}</span>
        <p>{block.label}</p>
      </div>
    );
  if (type === "hub")
    return (
      <div className="content-hub">
        <h3>{text}</h3>
      </div>
    );
  if (type === "cards")
    return (
      <div className="content-inline-card-grid">
        {block.items.map((item, i) => (
          <CollectionCard item={item} kind="people" index={i} key={item.path} />
        ))}
      </div>
    );
  if (block.href && text.includes(" Overview ")) {
    const [heading, ...body] = text.split(" Overview ");
    return (
      <SmartLink href={block.href} className="content-process">
        <h3>{heading}</h3>
        <div>
          <span className="eyebrow">Overview</span>
          <p>{body.join(" Overview ")}</p>
        </div>
        <ArrowUpRight size={22} />
      </SmartLink>
    );
  }
  if (block.src || type === "image" || type === "img") {
    if (isDecor(block)) return null;
    return (
      <figure className="content-inline-image">
        <img
          src={imageSource(block, page)}
          alt={block.alt || ""}
          loading="lazy"
        />
      </figure>
    );
  }
  if (block.href)
    return (
      <SmartLink href={block.href} className="content-source-link">
        <span>{text}</span>
        <ArrowUpRight size={18} />
      </SmartLink>
    );
  if (type === "li")
    return (
      <div className="content-list-item">
        <span aria-hidden="true">↗</span>
        <span>
          <InlineText text={text} page={page} />
        </span>
      </div>
    );
  if (type === "blockquote")
    return (
      <blockquote>
        <InlineText text={text} page={page} />
      </blockquote>
    );
  if (isHeading(block)) {
    const Tag = type === "h1" ? "h2" : type;
    return (
      <Tag className={`content-source-heading ${type}`}>
        <InlineText text={text} page={page} />
      </Tag>
    );
  }
  if (/^\d{1,2}$/.test(text))
    return <span className="content-block-number">{text}</span>;
  if (/^(\$?\d[\d.,]*\s?(M|B|X|x|%|\+|×).*)$/.test(text) && text.length < 20)
    return <p className="content-stat-value">{text}</p>;
  return (
    <p className={text.length < 55 ? "content-short-text" : ""}>
      <InlineText text={text} page={page} />
    </p>
  );
}

function groupSections(blocks) {
  const sections = [];
  let current = { title: "", label: "", blocks: [] };
  for (const block of blocks) {
    const type = typeOf(block);
    if (
      (type === "h2" ||
        type === "h1" ||
        (type === "h3" && words(block).length < 100)) &&
      !/^\$?\d[\d.,]*[MBXx%+]/.test(words(block))
    ) {
      const preceding = current.blocks[current.blocks.length - 1];
      const label =
        preceding &&
        typeOf(preceding) === "text" &&
        words(preceding).length < 75 &&
        !preceding.href
          ? words(current.blocks.pop())
          : "";
      if (current.blocks.length || current.title) sections.push(current);
      current = { title: words(block), label, blocks: [] };
    } else if (
      words(block) === "Our Story" &&
      !current.title &&
      !current.blocks.length
    ) {
      current.title = words(block);
    } else current.blocks.push(block);
  }
  if (current.blocks.length || current.title) sections.push(current);
  return sections;
}

function enrichBlocks(blocks, page) {
  const result = [];
  const profileCards = (page.cards || []).filter((card) =>
    card.links?.some((l) => /^\/(team|mentors)\//.test(cleanPath(l.href))),
  );
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const card = profileCards.find(
      (c) =>
        c.blocks?.[0] &&
        (c.blocks[0].src || words(c.blocks[0])) === (block.src || words(block)),
    );
    if (card) {
      const link = card.links.find((l) =>
        /^\/(team|mentors)\//.test(cleanPath(l.href)),
      );
      const textBlocks = card.blocks.filter((b) => !b.src);
      const item = {
        path: cleanPath(link.href),
        page: pages[cleanPath(link.href)],
        title: words(textBlocks[0]),
        role: words(textBlocks[1] || {}),
        excerpt: words(textBlocks[2] || {}),
        image: firstImage(card),
      };
      const previous = result[result.length - 1];
      if (previous?.type === "cards") previous.items.push(item);
      else result.push({ type: "cards", items: [item] });
      const cardKeys = new Set(card.blocks.map((b) => b.src || words(b)));
      while (
        blocks[i + 1] &&
        cardKeys.has(blocks[i + 1].src || words(blocks[i + 1]))
      )
        i++;
      continue;
    }
    const value = words(block);
    const numeric =
      /^\$?\d[\d.,]*\s?[MBXx%+×]+$/.test(value) ||
      (value === "9" && words(blocks[i + 1] || {}).startsWith("Exits"));
    if (
      numeric &&
      blocks[i + 1] &&
      !isHeading(blocks[i + 1]) &&
      !blocks[i + 1].src &&
      words(blocks[i + 1]).length < 70
    ) {
      result.push({ type: "metric", text: value, label: words(blocks[i + 1]) });
      i++;
      continue;
    }
    if (
      block.src &&
      blocks[i + 1]?.src &&
      ["/about", "/programs"].includes(page.path)
    ) {
      const images = [block];
      while (blocks[i + 1]?.src) {
        images.push(blocks[i + 1]);
        i++;
      }
      result.push({ type: "gallery", images });
      continue;
    }
    result.push(
      page.path === "/about" &&
        ["India", "USA", "Singapore"].includes(words(block))
        ? { ...block, type: "hub" }
        : block,
    );
  }
  return result;
}

function sectionFeatures(blocks) {
  const features = [];
  let leading = [];
  let current = null;
  for (const b of blocks) {
    if (typeOf(b) === "h4") {
      const preceding = current ? current.blocks : leading;
      const image = preceding[preceding.length - 1]?.src
        ? preceding.pop()
        : null;
      if (current) features.push(current);
      current = { title: words(b), blocks: image ? [image] : [] };
    } else if (current) current.blocks.push(b);
    else leading.push(b);
  }
  if (current) features.push(current);
  return { features, leading };
}

function FAQ({ blocks, page }) {
  const entries = [];
  const other = [];
  const isQuestion = (b) =>
    /^(What|How|Who|When|Where|Why|Can|Do|Does|Is|Are)\b/i.test(words(b)) &&
    words(b).trim().endsWith("?");
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (isQuestion(block)) {
      const answer = [];
      let j = i + 1;
      while (
        j < blocks.length &&
        !isQuestion(blocks[j]) &&
        !/^\d{1,2}$/.test(words(blocks[j])) &&
        (typeOf(blocks[j]) === "p" || blocks[j].src)
      ) {
        if (!blocks[j].src) answer.push(blocks[j]);
        j++;
      }
      entries.push({ question: words(block), answer });
      i = j - 1;
    } else if (!/^\d{1,2}$/.test(words(block)) && !block.src) other.push(block);
  }
  return (
    <div className="content-faq">
      {entries.map((entry) => (
        <details key={entry.question}>
          <summary>
            <span>{entry.question}</span>
            <Plus size={20} />
          </summary>
          <div className="content-faq-answer">
            {entry.answer.map((b, i) => (
              <Block block={b} page={page} key={i} />
            ))}
          </div>
        </details>
      ))}
      {other.map((b, i) => (
        <Block block={b} page={page} key={i} />
      ))}
    </div>
  );
}

function BodyContent({ blocks, page, pathname, reading = false }) {
  const sections = groupSections(enrichBlocks(blocks, page));
  return (
    <div
      className={`container content-body ${reading ? "content-reading" : ""} ${pathname === "/philosophy" ? "content-philosophy" : ""} ${pathname === "/about" ? "content-about" : ""} ${pathname === "/programs" ? "content-programs" : ""}`}
    >
      {sections.map((section, index) => {
        const { features, leading } = sectionFeatures(section.blocks);
        const faq = /Frequently Asked|FAQ|Essentials/i.test(section.title);
        const programSupport = pathname === "/programs" && section.title === "Support for each stage of growth";
        const programStage = pathname === "/programs" && /^Toll Gate [IVX]+$/.test(section.title);
        return (
          <Reveal
            key={`${index}-${section.title}`}
            className={`content-section ${features.length > 1 ? "content-feature-section" : ""} ${programSupport ? "content-program-support" : ""} ${programStage ? "content-program-stage" : ""} ${!section.blocks.length ? "content-section--heading-only" : ""}`}
          >
            {section.title && (
              <div className="content-section-heading">
                {section.label && (
                  <span className="eyebrow">{section.label}</span>
                )}
                <h2>{section.title}</h2>
              </div>
            )}
            <div className={programSupport ? "content-program-support-layout" : undefined}>
              {programSupport && (
                <figure className="content-program-art">
                  <img
                    src="/media/editorial/program-growth.png"
                    alt="Architectural illustration of a red pathway rising through ivory terraces"
                    loading="lazy"
                    width="1086"
                    height="1448"
                  />
                  <figcaption>From first traction to the next market.</figcaption>
                </figure>
              )}
              <div className={programSupport ? "content-program-support-copy" : "content-section-main"}>
            {faq ? (
              <FAQ blocks={section.blocks} page={page} />
            ) : (
              <>
                {leading.length > 0 && (
                  <div
                    className={`content-section-copy ${leading.some((b) => ["metric", "hub", "cards", "gallery"].includes(typeOf(b))) ? "content-wide-copy" : ""}`}
                  >
                    <div className="content-leading-blocks">
                      {leading
                        .filter(
                          (b) =>
                            !features.length || !/^\d{1,2}$/.test(words(b)),
                        )
                        .map((block, i) => (
                          <Block block={block} page={page} index={i} key={i} />
                        ))}
                    </div>
                  </div>
                )}
                {features.length > 0 && (
                  <div
                    className={`content-feature-grid ${features.length === 1 ? "single-feature" : ""}`}
                  >
                    {features.map((feature, i) => (
                      <div className="content-feature" key={i}>
                        <h3>{feature.title}</h3>
                        <div>
                          {feature.blocks
                            .filter((b) => !/^\d{1,2}$/.test(words(b)))
                            .map((b, j) => (
                              <Block block={b} page={page} key={j} />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

function PlaybookDownload({ page }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const link = (page.links || []).find((l) => l.text === "Download");
  if (!link) return null;
  return (
    <section className="container content-download">
      <div>
        <span className="eyebrow">THE COMPLETE PLAYBOOK</span>
        <h2>Ideas to put into action.</h2>
        <p>Download the full report.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setReady(true);
        }}
      >
        <label htmlFor="playbook-email">Your Email Address</label>
        <div className="content-download-row">
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
          <button className="button" type="submit">
            Download <ArrowRight size={16} />
          </button>
        </div>
        <p className="content-form-note">
          Email subscriptions are not connected yet. Your address is not
          submitted.
        </p>
        {ready && (
          <div className="content-download-feedback" role="status">
            <p>Your PDF is ready. No subscription has been created.</p>
            <a
              href={link.local || link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
            >
              Open the PDF <ArrowUpRight size={16} />
            </a>
            <a
              href={link.local || link.href}
              download
              className="content-download-save"
            >
              Save PDF
            </a>
          </div>
        )}
      </form>
    </section>
  );
}

function DetailPage({ pathname, page, hero }) {
  const family = pathname.split("/")[1];
  const people = ["team", "mentors"].includes(family);
  const article = ["stories", "playbooks"].includes(family);
  const parent =
    family === "mentors"
      ? "/speedscalers"
      : family === "playbooks"
        ? "/insights"
        : `/${family}`;
  const image = firstImage(page);
  const imageSrc = image && imageSource(image, page);
  let blocks = hero.blocks.filter(
    (b) =>
      words(b) !== "View all" &&
      !(
        family === "playbooks" &&
        ["Download", "Oops! Something went wrong."].includes(words(b))
      ) &&
      (!imageSrc || !b.src || imageSource(b, page) !== imageSrc),
  );
  const facts = [];
  const website =
    family === "portfolio" &&
    (page.links || []).find((l) => /Website Link/i.test(l.text));
  if (family === "portfolio") {
    const used = new Set();
    blocks.forEach((b, i) => {
      if (
        ["Year Invested", "Industry", "Status"].includes(words(b)) &&
        blocks[i + 1]
      ) {
        facts.push({ label: words(b), value: words(blocks[i + 1]) });
        used.add(i);
        used.add(i + 1);
      }
      if (words(b) === "Website" || /^Website Link/.test(words(b))) used.add(i);
    });
    blocks = blocks.filter((_, i) => !used.has(i));
  }
  const socialLinks = (page.links || []).filter(
    (l) => !l.text && /^https?:/.test(l.href),
  );
  return (
    <>
      <PageHero
        {...hero}
        label={labels[parent] || "Anthill Ventures"}
        back={{ href: parent, label: labels[parent] || "Back" }}
      />
      {people ? (
        <div className="container content-profile-layout">
          {image && (
            <Reveal className="content-profile-photo">
              <img src={imageSrc} alt={image.alt || hero.title} />
            </Reveal>
          )}
          <BodyContent
            blocks={blocks}
            page={page}
            pathname={pathname}
            reading
          />
        </div>
      ) : (
        <>
          {image && (
            <Reveal
              className={`container content-detail-banner ${family === "portfolio" ? "content-portfolio-banner" : ""} ${article ? "content-article-banner" : ""} ${pathname.includes("videoverse") ? "content-white-company" : ""}`}
            >
              <img src={imageSrc} alt={image.alt || hero.title} />
            </Reveal>
          )}
          {family === "portfolio" && (
            <section className="container content-company-facts">
              <dl>
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {website && (
                <SmartLink href={website.href} className="button">
                  Website Link <ArrowUpRight size={17} />
                </SmartLink>
              )}
            </section>
          )}
          {family === "playbooks" && <PlaybookDownload page={page} />}
          <BodyContent
            blocks={blocks}
            page={page}
            pathname={pathname}
            reading={article || family === "portfolio"}
          />
        </>
      )}
      <div className="container content-return">
        <Link to={parent} className="button">
          <ArrowLeft size={17} /> Explore {labels[parent] || family}
        </Link>
        {socialLinks.map((l, i) => (
          <SmartLink href={l.href} className="button" key={i}>
            {l.href.includes("linkedin")
              ? "LinkedIn"
              : l.href.includes("x.com") || l.href.includes("twitter")
                ? "X"
                : "Visit profile"}{" "}
            <ArrowUpRight size={16} />
          </SmartLink>
        ))}
      </div>
    </>
  );
}

function ContactPage({ page, hero }) {
  const [submitted, setSubmitted] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };
  const fieldNames = (page.forms || [])
    .flatMap((form) => form.fields || form.inputs || [])
    .map((f) => f.label || f.placeholder || f.name || "")
    .filter(Boolean);
  const body = hero.blocks.filter(
    (b) =>
      !/^(Your Information|Upload File|Max file size 10MB\.|Uploading\.\.\.|fileuploaded.jpg|Upload failed.*|Submit|Send|Thank you! Your submission has been received!|Oops! Something went wrong while submitting the form\.)$/.test(
        words(b),
      ) && !fieldNames.includes(words(b)),
  );
  const emailHref = `mailto:info@anthillventures.com?subject=${encodeURIComponent(`Website enquiry from ${values.firstName} ${values.lastName}`)}&body=${encodeURIComponent(`Name: ${values.firstName} ${values.lastName}\nCompany: ${values.company}\nPhone: ${values.phone}\nEmail: ${values.email}\n\n${values.message}`)}`;
  const setField = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setSubmitted(false);
  };
  return (
    <>
      <PageHero {...hero} label="Contact Anthill" />
      <section className="container content-contact-layout">
        <div className="content-contact-info">
          <span className="eyebrow">START A CONVERSATION</span>
          <a
            className="content-contact-email"
            href="mailto:info@anthillventures.com"
          >
            Info@anthillventures.com <ArrowUpRight size={24} />
          </a>
          <BodyContent blocks={body} page={page} pathname="/contact" />
        </div>
        <Reveal className="content-contact-form-wrap">
          <form className="content-contact-form" onSubmit={handleSubmit}>
            <div className="content-form-heading">
              <h2>Your Information</h2>
            </div>
            <div className="content-form-row">
              <label>
                First Name
                <input
                  name="First-Name"
                  autoComplete="given-name"
                  required
                  placeholder="First Name"
                  value={values.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
              </label>
              <label>
                Last Name
                <input
                  name="Last-Name"
                  autoComplete="family-name"
                  required
                  placeholder="Last Name"
                  value={values.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </label>
            </div>
            <div className="content-form-row">
              <label>
                Company
                <input
                  name="Company"
                  autoComplete="organization"
                  placeholder="Company"
                  value={values.company}
                  onChange={(e) => setField("company", e.target.value)}
                />
              </label>
              <label>
                Your Phone
                <input
                  name="Phone-2"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Your Phone"
                  value={values.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </label>
            </div>
            <label>
              Your Email
              <input
                name="Email-2"
                type="email"
                autoComplete="email"
                required
                placeholder="Your Email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </label>
            <label>
              Your Message
              <textarea
                name="Your-Message"
                required
                rows="4"
                placeholder="Your Message"
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
              />
            </label>
            <label className="content-file-label">
              Upload File
              <input
                name="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 10 * 1024 * 1024) {
                    setFileMessage(
                      "Upload failed. Max size for files is 10 MB.",
                    );
                    e.target.value = "";
                  } else
                    setFileMessage(
                      file
                        ? `${file.name} selected. Attach this file when sending your email.`
                        : "",
                    );
                }}
              />
              <span>Max file size 10MB.</span>
            </label>
            {fileMessage && (
              <p className="content-form-note" role="status">
                {fileMessage}
              </p>
            )}
            <p className="content-form-note">
              Prepare your enquiry below, then send it through your email app.
            </p>
            <button className="button content-submit" type="submit">
              Prepare enquiry <Send size={17} />
            </button>
            {submitted && (
              <div className="content-form-feedback" role="status">
                <p>
                  Your enquiry is ready. No message has been sent. Open your
                  email app to send it to Anthill.
                </p>
                <a href={emailHref} className="button">
                  <Mail size={17} /> Send by email
                </a>
              </div>
            )}
          </form>
        </Reveal>
      </section>
    </>
  );
}

export default function ContentPage({ pathname }) {
  const path = (pathname || window.location.pathname).replace(/\/$/, "") || "/";
  const page = pages[path];
  if (!page)
    return (
      <div className="content-not-found container">
        <span className="eyebrow">404 / ANTHILL VENTURES</span>
        <h1>Page not found.</h1>
        <p>We couldn’t find this page.</p>
        <Link to="/" className="button">
          Back to home <ArrowRight size={17} />
        </Link>
      </div>
    );
  const hero = heroData(page, path);
  if (path === "/contact") return <ContactPage page={page} hero={hero} />;
  if (
    ["/portfolio", "/team", "/speedscalers", "/stories", "/insights"].includes(
      path,
    )
  )
    return <Collection key={path} pathname={path} page={page} hero={hero} />;
  if (/^\/(portfolio|team|mentors|stories|playbooks)\//.test(path))
    return <DetailPage pathname={path} page={page} hero={hero} />;
  return (
    <>
      <PageHero {...hero} label={labels[path] || "Anthill Ventures"} />
      <BodyContent
        blocks={hero.blocks}
        page={page}
        pathname={path}
        reading={path === "/privacy-policy" || path.startsWith("/info/")}
      />
    </>
  );
}
