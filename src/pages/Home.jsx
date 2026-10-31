import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ArrowLeft, ArrowRight, Plus, Minus } from "lucide-react";
import SpotlightCard from "../components/reactbits/SpotlightCard.jsx";
import HomeHero from "../components/HomeHero.jsx";
import site from "../data/view-content.json";
import "./home.css";

const page = site.pages["/"];
const blocks = page.blocks;
const homeCopy = {
  "We help fearless":
    "We back founders building businesses in health, climate and urban life, with capital, mentorship and market access.",
  "We fuel Living Healthy":
    "Digital therapeutics, genomics and technology that improve health outcomes and quality of life.",
  "We invest in breakthrough":
    "Solutions to decarbonize energy and industry and reduce the impact of climate change.",
  "We elevate urban lifestyles":
    "Consumer brands and platforms serving young India's urban lifestyles, with convenience, culture and sustainability in mind.",
  "By investing globally":
    "We connect founders with technology, markets and experienced operators across India, the US and Singapore.",
  "At Anthill,":
    "Anthill's portfolio includes more than 80 startups across ten countries. Together, these companies have raised over $1 billion in follow-on capital.",
  "To pitch your idea":
    "Share your pitch deck, traction, market opportunity and the team behind it. Tell us how you plan to grow and where Anthill can help.",
};
const copy = (start) =>
  homeCopy[start] || blocks.find((b) => b.text?.startsWith(start))?.text || "";
const image = (term) =>
  page.images.find((i) => i.src.toLowerCase().includes(term))?.local;
const portrait = (route, term) =>
  site.pages[route].images.find((item) => item.src.toLowerCase().includes(term))
    ?.local;
const heroLogos = [
  ["broadway_logo", "Broadway"],
  ["rooter_logo", "Rooter"],
  ["erly_sign_logo", "Erly Sign", "hero-logo--square"],
  ["sunday_everyday_logo", "Sunday Everyday"],
  ["boldcare_logo", "Bold Care"],
  ["safearth_logo", "Safearth"],
  ["salud_logo", "Salud", "hero-logo--tall"],
  ["ayurythm_logo", "AyuRythm"],
].map(([term, title, variant = ""]) => ({
  title,
  node: (
    <img
      className={`hero-logo ${variant}`}
      src={portrait("/about", term)}
      alt={title}
      width="256"
      height="256"
    />
  ),
}));
const teamPortraits = [
  ["prasad", "Prasad Vanga"],
  ["sailesh", "Sailesh Sigatapu"],
  ["mikebinn", "Mike Binn"],
];
const mentorPortraits = [
  ["ajai-kumar.jpg", "Dr. B.S. Ajai Kumar"],
  ["anjali-ajai", "Anjali Ajai Kumar"],
  ["kishore-biyani", "Kishore Biyani"],
];
const sectors = [
  ["Live Healthy", "We fuel Living Healthy", "Health & wellbeing"],
  ["Mitigate Climate Change", "We invest in breakthrough", "Climate & energy"],
  [
    "Enhance Urban Lifestyle",
    "We elevate urban lifestyles",
    "The next consumer",
  ],
];
const metrics = [
  ["1B+", "Urban consumers"],
  ["300+", "Media Subscribers"],
  ["10M+", "Health-Care Patients"],
  ["5.4X", "Increase in value"],
  ["50+", "Corporate Partners"],
  ["70+", "Speed Scaling Mentors"],
];
const companySummaries = {
  "Super Human":
    "A platform connecting scientists, policymakers and innovators in biotechnology, medicine and human augmentation.",
  Broadway:
    "An experiential department store bringing direct-to-consumer brands, live events and creator spaces together.",
  Ikonz:
    "AI digital avatars and holographic technology for real-time engagement across sports, education and advertising.",
  "Deep Holistics":
    "Personal health recommendations informed by lifestyle data, lab reports and genetics.",
  "Zypp Electric":
    "Electric vehicle fleets and fleet-management software for last-mile deliveries.",
  Boldcare: "Men's wellness products with discreet delivery in India.",
  Erlysign:
    "Saliva-based testing technology for non-invasive early oral cancer detection.",
};
const highlights = blocks.reduce((acc, b, i) => {
  if (b.type === "h4")
    acc.push({
      name: b.text,
      description: companySummaries[b.text],
      image: blocks[i - 1]?.local,
    });
  return acc;
}, []);
const destinations = {
  "Super Human": "/portfolio/super-human-9j6et",
  Broadway: "/portfolio/broadway",
  Ikonz: "/portfolio/ikonz",
  "Deep Holistics": "/portfolio/deep-holistics",
  "Zypp Electric": "/portfolio/zypp-electric",
  Boldcare: "/portfolio/bold-care",
  Erlysign: "/portfolio/erly-sign-i031w",
};

function Reveal({ children, className = "" }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Portfolio() {
  const track = useRef(null);
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(null);
  const [index, setIndex] = useState(0);
  const stride = () => {
    const el = track.current;
    return (
      (el?.querySelector("article")?.offsetWidth || 350) +
      (Number.parseFloat(el ? getComputedStyle(el).gap : "24") || 24)
    );
  };
  function scroll(direction) {
    track.current?.scrollBy({
      left: direction * stride(),
      behavior: reduced ? "instant" : "smooth",
    });
  }
  return (
    <section
      className="home-portfolio home-section"
      aria-labelledby="portfolio-heading"
    >
      <div className="container">
        <Reveal className="section-heading">
          <div>
            <span className="eyebrow">Portfolio</span>
            <h2 id="portfolio-heading" className="section-title">
              Selected companies
            </h2>
          </div>
          <Link to="/portfolio" className="text-link">
            View portfolio <ArrowUpRight size={19} />
          </Link>
        </Reveal>
      </div>
      <div
        ref={track}
        className="portfolio-track"
        onScroll={() =>
          setIndex(Math.round(track.current.scrollLeft / stride()))
        }
      >
        {highlights.map((card, i) => (
          <article key={card.name} className="featured-card">
            <Link
              to={
                destinations[card.name] && site.pages[destinations[card.name]]
                  ? destinations[card.name]
                  : "/portfolio"
              }
              className="featured-image"
            >
              <img loading="lazy" src={card.image} alt={card.name} />
              <span className="featured-open">
                <ArrowUpRight size={22} />
              </span>
            </Link>
            <div className="featured-info">
              <h3>{card.name}</h3>
              {card.description && (
                <button
                  className="icon-button"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  aria-expanded={expanded === i}
                  aria-controls={"company-overview-" + i}
                  aria-label={`Overview of ${card.name}`}
                >
                  {expanded === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
              )}
            </div>
            {card.description && (
              <div
                id={"company-overview-" + i}
                className={`featured-description ${expanded === i ? "expanded" : ""}`}
              >
                <p>{card.description}</p>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="container carousel-bottom">
        <span className="carousel-count" aria-live="polite">
          {String(Math.min(index + 1, highlights.length)).padStart(2, "0")}{" "}
          <span className="muted">
            / {String(highlights.length).padStart(2, "0")}
          </span>
        </span>
        <div className="carousel-progress" aria-hidden="true">
          <span
            style={{ width: `${((index + 1) / highlights.length) * 100}%` }}
          />
        </div>
        <div className="carousel-controls">
          <button
            className="icon-button"
            onClick={() => scroll(-1)}
            aria-label="Previous company"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            className="icon-button"
            onClick={() => scroll(1)}
            aria-label="Next company"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HomeHero
        lead={copy("We help fearless")}
        poster={image("desktop-poster")}
        logos={heroLogos}
      />
      <section
        id="where-we-invest"
        className="home-thesis home-section"
        aria-labelledby="thesis-heading"
      >
        <div className="container thesis-layout">
          <Reveal className="thesis-intro">
            <span className="eyebrow">Our focus</span>
            <h2 id="thesis-heading" className="section-title">
              Where We <br />
              Invest
            </h2>
            <Link to="/philosophy" className="text-link">
              Our philosophy <ArrowUpRight size={19} />
            </Link>
          </Reveal>
          <div className="sector-list">
            {sectors.map(([title, start, category]) => (
              <Reveal key={title}>
                <SpotlightCard
                  className="sector-spotlight"
                  theme="light"
                  spotlightColor="#e6212b"
                  intensity={0.14}
                  borderGlow={0.45}
                >
                  <Link to="/about" className="sector-row">
                    <div className="sector-row-heading">
                      <span className="sector-category">{category}</span>
                      <h3>{title}</h3>
                    </div>
                    <p>{copy(start)}</p>
                    <ArrowUpRight size={24} className="sector-arrow" />
                  </Link>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section
        className="home-impact home-section"
        aria-labelledby="impact-heading"
      >
        <div className="container">
          <Reveal className="impact-layout">
            <div className="impact-copy">
              <span className="eyebrow">People & reach</span>
              <h2 id="impact-heading" className="section-title">
                Scaling
                <br />
                Without Borders
              </h2>
              <p>{copy("By investing globally")}</p>
              <div className="global-strip">
                <span>India</span>
                <span>USA</span>
                <span>Singapore</span>
              </div>
            </div>
            <div className="impact-data">
              <span className="eyebrow">The Anthill network</span>
              <h3>Our network in numbers</h3>
              <p className="impact-description">{copy("At Anthill,")}</p>
              <div className="metrics-grid">
                {metrics.map(([value, label]) => (
                  <div className="metric" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="people-links">
            <Link to="/team">
              <div className="people-image">
                {teamPortraits.map(([term, name]) => (
                  <img
                    key={name}
                    src={portrait("/team", term)}
                    loading="lazy"
                    alt={name}
                  />
                ))}
              </div>
              <div className="people-caption">
                <div>
                  <span className="eyebrow">Our people</span>
                  <h3>Meet the team</h3>
                  <span className="people-action">View Team</span>
                </div>
                <ArrowUpRight size={25} />
              </div>
            </Link>
            <Link to="/speedscalers">
              <div className="people-image">
                {mentorPortraits.map(([term, name]) => (
                  <img
                    key={name}
                    src={portrait("/speedscalers", term)}
                    loading="lazy"
                    alt={name}
                  />
                ))}
              </div>
              <div className="people-caption">
                <div>
                  <span className="eyebrow">Our mentors</span>
                  <h3>70+ speed scalers worldwide</h3>
                  <span className="people-action">View</span>
                </div>
                <ArrowUpRight size={25} />
              </div>
            </Link>
          </Reveal>
        </div>
      </section>
      <Portfolio />
      <section
        className="home-connect home-section"
        aria-labelledby="connect-heading"
      >
        <div className="container">
          <Reveal>
            <div className="connect-top">
              <span className="eyebrow">For founders</span>
              <div>
                <Link to="/stories" className="text-link">
                  Our stories <ArrowUpRight size={17} />
                </Link>
                <Link to="/insights" className="text-link">
                  Insights & playbooks <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
            <div className="connect-main">
              <h2 id="connect-heading">
                Ready to <br />
                pitch<span>?</span>
              </h2>
              <div className="connect-copy">
                <p>{copy("To pitch your idea")}</p>
                  <Link to="/contact" className="button">
                    Get in Touch <ArrowUpRight size={20} />
                  </Link>
                
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
