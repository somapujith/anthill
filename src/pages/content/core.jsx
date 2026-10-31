import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ArrowRight, Plus } from "lucide-react";
import siteContent from "../../data/view-content.json";
import PageStage from "../../components/PageStage.jsx";
import SpotlightCard from "../../components/reactbits/SpotlightCard.jsx";
import "../content-pages.css";

export const pages = siteContent.pages || {};

export const labels = {
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

export const displayText = (text) =>
  editorialCopy.find(([source]) => text.startsWith(source))?.[1] || text;

export const typeOf = (b) => String(b.type || b.tag || "p").toLowerCase();

export const words = (b) => b.text || b.content || "";

export const cleanPath = (href) => {
  try {
    const url = new URL(href, "https://www.anthillventures.com");
    return /(^|\.)anthillventures\.com$/.test(url.hostname)
      ? `${url.pathname}${url.search}${url.hash}`
      : href;
  } catch {
    return href;
  }
};

export const pageBlocks = (page) =>
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

export const isHeading = (b) => /^h[1-6]$/.test(typeOf(b));

export const isDecor = (i) =>
  /(?:About-Page2|_sphere)\.jpg(?:\?|$)/i.test(i.src || "") ||
  /^(arrow|icon|menu)$/i.test(i.alt || "") ||
  (/^decor$/i.test(i.alt || "") && /\.svg(?:\?|$)/i.test(i.src || "")) ||
  /(?:arrow|icon|decor)[-_\s.%]/i.test(i.src || "");

export const imageSource = (image, page) =>
  image.local ||
  image.localSrc ||
  page?.images?.find((i) => i.src === image.src)?.local ||
  image.src;

export const usefulImages = (page) =>
  (page?.images || []).filter((i) => !isDecor(i) && (i.local || i.src));

export const firstImage = (page) => usefulImages(page)[0];

export const routeTitle = (path) =>
  path
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-[a-z0-9]{5,}$/, "")
    .replaceAll("-", " ") || "Anthill";

export function SmartLink({ href, children, ...props }) {
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

export function Reveal({ children, className = "", delay = 0 }) {
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

export function heroData(page, pathname) {
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
    !(detail && words(blocks[end + 1]).length > 240) &&
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

export function PageHero({ title, description, label, back, visual }) {
  const { pathname } = useLocation();
  const quiet = pathname === "/privacy-policy" || pathname.startsWith("/info/");
  return (
    <PageStage
      pathname={pathname}
      title={title}
      description={description}
      label={label}
      back={back}
      quiet={quiet}
      visual={visual}
    />
  );
}

export function CollectionCard({ item, index, kind }) {
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

export function InlineText({ text, page }) {
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

export function UtilityForm({ form, index }) {
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

export function Block({ block, page, index = 0 }) {
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

export function groupSections(blocks) {
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

export function enrichBlocks(blocks, page) {
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

export function sectionFeatures(blocks) {
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

export function FAQ({ blocks, page }) {
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

export function BodyContent({ blocks, page, pathname, reading = false }) {
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
