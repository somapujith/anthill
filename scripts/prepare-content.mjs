import fs from "node:fs";
const source = JSON.parse(
  fs.readFileSync("src/data/site-content.json", "utf8"),
);
const pages = Object.fromEntries(
  Object.entries(source.pages).map(([path, p]) => [
    path,
    {
      path,
      title: p.title,
      description: p.description,
      blocks: p.blocks,
      links: p.links,
      images: p.images,
      videos: p.videos,
      forms: p.forms,
      cards: p.cards.map((c) => ({
        blocks: c.blocks,
        images: c.images,
        links: c.links,
      })),
    },
  ]),
);
fs.writeFileSync(
  "src/data/view-content.json",
  JSON.stringify({
    pages,
    shared: { footerLinks: source.shared.footerLinks },
    homeHighlights: source.homeHighlights,
  }),
);
console.log(
  `Prepared ${Object.keys(pages).length} pages for the frontend; exact source archive retained separately.`,
);
