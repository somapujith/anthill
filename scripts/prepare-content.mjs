import fs from "node:fs";
const source = JSON.parse(
  fs.readFileSync("src/data/site-content.json", "utf8"),
);

// People taken off the public site by request. The captured archive stays exact; they are
// dropped here, in the one step that builds the runtime data, so every page, route, card and
// link derived from it leaves them out. scripts/editorial-expectations.json lists the same
// people under "removed" so the rendered audit expects their absence.
const removedPeople = [
  { path: "/team/lasya-nadimpally", name: "Lasya Nadimpally", image: "lasya.jpg" },
];

const withoutPeople = (page) => {
  let { blocks, links, images, cards } = page;
  for (const { path, name, image } of removedPeople) {
    // A person's block run is: portrait, arrow icon, name, role, biography.
    for (let at; (at = blocks.findIndex((b) => b.text === name)) !== -1; ) {
      let start = at;
      while (start > 0 && !blocks[start - 1].text && blocks[start - 1].type === "image")
        start--;
      blocks = [...blocks.slice(0, Math.max(start, at - 2)), ...blocks.slice(at + 3)];
    }
    links = links.filter((l) => l.href !== path);
    cards = cards.filter(
      (c) => !c.links.some((l) => l.href === path) && !c.blocks.some((b) => b.text === name),
    );
    images = images.filter((im, i) => {
      if (im.local?.includes(image)) return false;
      // The arrow icon that follows a portrait belongs to that portrait.
      return !(im.alt === "arrow diagonal" && images[i - 1]?.local?.includes(image));
    });
  }
  return { ...page, blocks, links, images, cards };
};

const pages = Object.fromEntries(
  Object.entries(source.pages)
    .filter(([path]) => !removedPeople.some((person) => person.path === path))
    .map(([path, p]) => [
      path,
      withoutPeople({
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
      }),
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
