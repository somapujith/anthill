import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import site from "../data/view-content.json";

// Source URLs escape spaces (%20) and local files hyphenate them, so both are compared in one form.
const normal = (value = "") => value.toLowerCase().replace(/%20|\s+/g, "-");
const fileOf = (item) => item?.local || item?.src || null;
const isArt = (item) => Boolean(fileOf(item)) && !/arrow|\.svg$/i.test(fileOf(item));

const pageImage = (route, term) => {
  const needle = normal(term);
  return fileOf(
    (site.pages[route]?.images || []).find((item) =>
      [item.src, item.local].some((value) => normal(value).includes(needle)),
    ),
  );
};

// What the collection pages actually say about each entry.
const entries = (route) =>
  (site.pages[route]?.cards || []).map((card) => {
    const text = card.blocks.filter((block) => block.text).map((block) => block.text);
    return {
      href: card.links?.[0]?.href,
      title: text[0],
      detail: text[1],
      src: fileOf((card.images || []).find(isArt)),
    };
  });

const entry = (list, slug) => list.find((item) => item.href?.endsWith(`/${slug}`));

// The next text on a page after a given label.
const textAfter = (route, label) => {
  const blocks = site.pages[route]?.blocks || [];
  const index = blocks.findIndex((block) => block.text === label);
  return index < 0 ? "" : blocks[index + 1]?.text || "";
};

// Goutham Uppaluri's source record has stock images where a portrait belongs.
const isPortrait = (src) => Boolean(src) && !/vestal_heroimage|frame-10-min/i.test(src);

function Team() {
  const people = entries("/team");
  return (
    <div className="stage-masthead">
      {people.map((person, index) => (
        <Link
          key={person.href}
          to={person.href}
          className={`stage-person${index === 0 ? " is-lead" : ""}${isPortrait(person.src) ? "" : " is-text"}`}
          data-rise
        >
          {isPortrait(person.src) && <img src={person.src} alt="" />}
          <span className="stage-person-caption">
            <strong>{person.title}</strong>
            <small>{person.detail}</small>
          </span>
        </Link>
      ))}
      <p className="stage-masthead-fact" data-rise>
        <strong>5.4×</strong> <span>scale over the past decade</span>
      </p>
    </div>
  );
}

const mentorNodes = [
  ["ajai-kumar", 54, 47, 1.75],
  ["rana-daggubati", 19, 27, 1.28],
  ["kishore-biyani", 84, 16, 1.3],
  ["aditya-ghosh", 47, 12, 1.02],
  ["neeraj-bhargava", 87, 56, 1.22],
  ["anjali-ajai-kumar", 21, 66, 1.08],
  ["vivek-biyani", 58, 83, 1.02],
  ["chris-rynning", 85, 87, 0.98],
  ["amit-mehta", 37, 87, 0.86],
  ["kiran-grandhi", 11, 90, 0.82],
  ["srini-koppolu", 73, 32, 0.8],
  ["cristina-ventura", 7, 47, 0.8],
];
const mentorEdges = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 3],
  [1, 11],
  [3, 2],
  [2, 10],
  [10, 4],
  [4, 7],
  [7, 6],
  [6, 8],
  [8, 9],
  [9, 5],
  [5, 11],
];

function Mentors() {
  const mentors = entries("/speedscalers");
  return (
    <div className="stage-network">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {mentorEdges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            data-fade
            x1={mentorNodes[a][1]}
            y1={mentorNodes[a][2]}
            x2={mentorNodes[b][1]}
            y2={mentorNodes[b][2]}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {mentorNodes.map(([slug, x, y, scale]) => {
        const mentor = entry(mentors, slug);
        if (!mentor?.src) return null;
        return (
          <Link
            key={slug}
            to={mentor.href}
            className="stage-node"
            data-rise
            style={{ left: `${x}%`, top: `${y}%`, "--scale": scale }}
          >
            <span className="stage-node-face">
              <img src={mentor.src} alt="" />
            </span>
            <span className="stage-node-name">{mentor.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

const logoFiles = [
  ["broadway_logo"],
  ["rooter_logo"],
  ["erly_sign_logo", "square"],
  ["sunday_everyday_logo"],
  ["boldcare_logo"],
  ["safearth_logo"],
  ["salud_logo", "tall"],
  ["ayurythm_logo"],
];

function Portfolio() {
  return (
    <div className="stage-logos">
      {logoFiles.map(([term, shape]) => {
        const src = pageImage("/about", term);
        if (!src) return null;
        return (
          <span key={term} data-rise className={shape ? `is-${shape}` : ""} aria-hidden="true">
            <img src={src} alt="" />
          </span>
        );
      })}
      <p className="stage-logos-fact" data-rise>
        <strong>80+</strong> <span>Startups backed</span>
      </p>
    </div>
  );
}

function Programs() {
  const sectors = [
    ["live-healthy", "Live Healthy", "58% 12%"],
    ["mitigate-climate", "Mitigate Climate Change", "74% 28%"],
    ["enhance-urban", "Enhance Urban Lifestyle", "54% 42%"],
  ];
  return (
    <div className="stage-sectors" aria-hidden="true">
      {sectors.map(([term, name, focus], index) => {
        const src = pageImage("/programs", term);
        if (!src) return null;
        return (
          <figure key={term} data-rise style={{ "--step": index }}>
            <img src={src} alt="" style={{ objectPosition: focus }} />
            <figcaption>{name}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function Stories() {
  const stories = entries("/stories").filter((story) => story.src);
  return (
    <div className="stage-front">
      {stories.map((story, index) => (
        <Link
          key={story.href}
          to={story.href}
          className={index === 0 ? "is-lead" : ""}
          data-rise
        >
          <img src={story.src} alt="" />
          <span>
            {story.title} <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function Insights() {
  const reports = entries("/insights").filter((report) => report.src);
  const cover = (slug, className) => {
    const report = entry(reports, slug);
    if (!report) return null;
    return (
      <Link key={slug} to={report.href} className={className} data-rise>
        <img src={report.src} alt={report.title} />
      </Link>
    );
  };
  return (
    <div className="stage-reports-wrap">
      <div className="stage-reports">
        {cover("urban-lifestyle", "is-lead")}
        <div>
          {cover("climate-impact-report")}
          {cover("carbon-markets")}
        </div>
      </div>
    </div>
  );
}

function Philosophy() {
  const inputs = [
    ["M0 196 H196 C330 196 300 422 442 422", "Capital", 172],
    ["M0 322 H216 C330 322 320 430 442 430", "Mentorship", 298],
    ["M0 476 H240 C330 476 340 438 442 438", "Market access", 452],
  ];
  return (
    <div className="stage-converge">
      <svg
        viewBox="0 0 720 500"
        preserveAspectRatio="xMinYMax meet"
        role="img"
        aria-label="Capital, mentorship and market access become one rising line: speed with scale."
      >
        <path
          data-draw
          pathLength="1"
          className="stage-converge-rise"
          d="M440 430 C560 430 650 300 690 70"
        />
        {inputs.map(([path, label, y]) => (
          <g key={label}>
            <path data-draw pathLength="1" d={path} />
            <text data-rise x="0" y={y}>
              {label}
            </text>
          </g>
        ))}
        <circle data-rise className="stage-converge-halo" cx="690" cy="70" r="36" />
        <circle data-rise className="stage-converge-head" cx="690" cy="70" r="20" />
        <text data-rise className="stage-converge-goal" x="640" y="62" textAnchor="end">
          Speed with scale
        </text>
      </svg>
    </div>
  );
}

function About() {
  const facts = [
    ["80+", "Startups backed"],
    ["10", "Countries"],
    ["$1B+", "Follow-on capital"],
    ["70+", "Speed-scaling mentors"],
  ];
  const still = pageImage("/about", "about-page2");
  return (
    <div className="stage-about">
      {still && (
        <span className="stage-about-still" data-rise>
          <img src={still} alt="" />
          <img src={still} alt="" aria-hidden="true" />
        </span>
      )}
      <dl>
        {facts.map(([value, label]) => (
          <div key={label} data-rise>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Contact() {
  const offices = ["India", "Singapore"].map((name) => [name, textAfter("/contact", name)]);
  return (
    <div className="stage-contact">
      <a className="stage-contact-link" href="mailto:info@anthillventures.com" data-rise>
        <span className="stage-contact-mark" aria-hidden="true">
          <span className="stage-rings">
            <i />
            <i />
            <i />
            <i />
          </span>
          <ArrowUpRight size={30} />
        </span>
        <span className="stage-contact-label">Write to us</span>
        <span className="stage-contact-email">
          <span>info@</span>
          <span>anthillventures.com</span>
        </span>
      </a>
      <dl className="stage-offices">
        {offices.map(([name, address]) =>
          address ? (
            <div key={name} data-rise>
              <dt>{name}</dt>
              <dd>{address}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </div>
  );
}

// The role on a person's page sits straight after their name.
const roleFor = (pathname) => {
  const blocks = site.pages[pathname]?.blocks || [];
  const name = blocks.findIndex((block) => block.type === "h2");
  return name < 0 ? "" : blocks[name + 1]?.text || "";
};

function PersonTile({ src, alt, pathname }) {
  const role = roleFor(pathname);
  return (
    <figure className={`stage-portrait${isPortrait(src) ? "" : " is-texture"}`} data-rise>
      <img src={src} alt={alt} />
      {role && (
        <figcaption data-rise aria-hidden="true">
          {role}
        </figcaption>
      )}
    </figure>
  );
}

function CompanyTile({ src, alt, light }) {
  return (
    <div className={`stage-lightbox${light ? " is-light" : ""}`}>
      <span className="stage-lightbox-print" data-rise>
        <img src={src} alt={alt} />
      </span>
    </div>
  );
}

function PlaybookTile({ src, alt, pathname }) {
  const spread = /-images-\d/i.test(src);
  const pages = spread
    ? []
    : (site.pages[pathname]?.images || [])
        .filter(isArt)
        .map(fileOf)
        .filter((file) => file !== src)
        .slice(0, 2);
  return (
    <div className={`stage-book${spread ? " is-spread" : ""}`}>
      {pages.map((page, index) => (
        <span key={page} className="stage-book-page" data-rise style={{ "--step": index }}>
          <img src={page} alt="" />
        </span>
      ))}
      <span className="stage-book-cover" data-rise>
        <img src={src} alt={alt} />
      </span>
    </div>
  );
}

export function StageTile({ src, alt, variant = "" }) {
  const { pathname } = useLocation();
  if (!src) return null;
  const kind = variant.split(" ")[0];
  if (kind === "person") return <PersonTile src={src} alt={alt} pathname={pathname} />;
  if (kind === "company")
    return <CompanyTile src={src} alt={alt} light={variant.includes("--light")} />;
  if (kind === "playbook") return <PlaybookTile src={src} alt={alt} pathname={pathname} />;
  return (
    <span className="stage-window" data-rise>
      <img src={src} alt={alt} />
    </span>
  );
}

export default function StageVisual({ pathname }) {
  if (pathname === "/about") return <About />;
  if (pathname === "/philosophy") return <Philosophy />;
  if (pathname === "/programs") return <Programs />;
  if (pathname === "/portfolio") return <Portfolio />;
  if (pathname === "/team") return <Team />;
  if (pathname === "/speedscalers") return <Mentors />;
  if (pathname === "/contact") return <Contact />;
  if (pathname === "/stories") return <Stories />;
  if (pathname === "/insights") return <Insights />;
  return null;
}
