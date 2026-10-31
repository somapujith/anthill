import { ArrowUpRight } from "lucide-react";
import site from "../data/view-content.json";

const pageImage = (route, term) =>
  (site.pages[route]?.images || []).find((item) =>
    item.src.toLowerCase().includes(term),
  )?.local;
const images = (route, terms) =>
  terms.map((term) => pageImage(route, term)).filter(Boolean);

function Team() {
  const faces = images("/team", ["prasad", "sailesh", "mikebinn", "bhargav", "faizal"]);
  return (
    <div className="stage-faces" aria-hidden="true">
      {faces.map((src, index) => (
        <span key={src} data-rise style={{ "--step": index }}>
          <img src={src} alt="" />
        </span>
      ))}
    </div>
  );
}

const mentorNodes = [
  [14, 66, 1],
  [31, 26, 1.22],
  [50, 60, 1.5],
  [67, 18, 1],
  [87, 42, 1.22],
  [33, 88, 0.86],
  [73, 82, 1],
];
const mentorEdges = [
  [0, 1],
  [1, 2],
  [0, 2],
  [2, 3],
  [3, 4],
  [2, 4],
  [0, 5],
  [5, 2],
  [2, 6],
  [4, 6],
];

function Mentors() {
  const faces = images("/speedscalers", [
    "rana-dag",
    "kishore-biyani",
    "ajai-kumar.jpg",
    "aditya_ghosh",
    "neeraj",
    "anjali-ajai",
    "vivek-biyani",
  ]);
  return (
    <div className="stage-network" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {mentorEdges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            data-draw
            pathLength="1"
            x1={mentorNodes[a][0]}
            y1={mentorNodes[a][1]}
            x2={mentorNodes[b][0]}
            y2={mentorNodes[b][1]}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {faces.map((src, index) => (
        <span
          key={src}
          data-rise
          style={{
            left: `${mentorNodes[index][0]}%`,
            top: `${mentorNodes[index][1]}%`,
            "--scale": mentorNodes[index][2],
          }}
        >
          <img src={src} alt="" />
        </span>
      ))}
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
    <div className="stage-logos" aria-hidden="true">
      {logoFiles.map(([term, shape]) => (
        <span key={term} data-rise className={shape ? `is-${shape}` : ""}>
          <img src={pageImage("/about", term)} alt="" />
        </span>
      ))}
    </div>
  );
}

function Programs() {
  const sectors = [
    ["live-healthy", "Live Healthy"],
    ["mitigate-climate", "Mitigate Climate Change"],
    ["enhance-urban", "Enhance Urban Lifestyle"],
  ];
  return (
    <div className="stage-sectors" aria-hidden="true">
      {sectors.map(([term, name], index) => (
        <figure key={term} data-rise style={{ "--step": index }}>
          <img src={pageImage("/programs", term)} alt="" />
          <figcaption>{name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Publications({ route, terms, fanned }) {
  return (
    <div className={`stage-covers${fanned ? " is-fanned" : ""}`} aria-hidden="true">
      {images(route, terms).map((src, index) => (
        <span key={src} data-rise style={{ "--step": index }}>
          <img src={src} alt="" />
        </span>
      ))}
    </div>
  );
}

function Philosophy() {
  const inputs = [
    ["M0 70 C150 70 190 214 320 232", "Capital", 56],
    ["M0 210 C130 210 200 226 320 232", "Mentorship", 196],
    ["M0 350 C150 350 190 250 320 232", "Market access", 336],
  ];
  return (
    <div className="stage-converge" aria-hidden="true">
      <svg viewBox="0 0 560 420">
        {inputs.map(([path, label, y]) => (
          <g key={label}>
            <path data-draw pathLength="1" d={path} />
            <text data-rise x="0" y={y}>
              {label}
            </text>
          </g>
        ))}
        <path
          data-draw
          pathLength="1"
          className="stage-converge-rise"
          d="M320 232 C410 240 490 170 540 44"
        />
        <circle data-rise className="stage-converge-head" cx="540" cy="44" r="7" />
        <text data-rise className="stage-converge-goal" x="520" y="30" textAnchor="end">
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
  return (
    <div className="stage-about">
      <span className="stage-about-image" data-rise aria-hidden="true">
        <img src={pageImage("/about", "about-page2")} alt="" />
      </span>
      <dl>
        {facts.map(([value, label]) => (
          <div key={label} data-rise>
            <dd>{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Contact() {
  return (
    <a className="stage-contact" href="mailto:info@anthillventures.com" data-rise>
      <span className="stage-rings" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="stage-contact-label">Write to us</span>
      <span className="stage-contact-email">
        info@anthillventures.com <ArrowUpRight size={26} />
      </span>
    </a>
  );
}

export function StageTile({ src, alt, variant }) {
  return (
    <span className={`stage-tile stage-tile--${variant}`} data-rise>
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
  if (pathname === "/stories")
    return (
      <Publications
        route="/stories"
        terms={["_33.jpg", "_1.webp", "functional-beverages"]}
        fanned
      />
    );
  if (pathname === "/insights")
    return (
      <Publications
        route="/insights"
        terms={["ab537100", "1_page-0001", "urban-lifestyle-thesis"]}
      />
    );
  return null;
}
