import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { pages, labels, typeOf, words, cleanPath, pageBlocks, isHeading, firstImage, routeTitle, PageHero, CollectionCard, BodyContent } from "./core.jsx";
import "./collection.css";

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

export default function Collection({ pathname, page, hero }) {
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
