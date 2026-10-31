import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Play,
  Pause,
  X,
} from "lucide-react";
import SpotlightCard from "../components/reactbits/SpotlightCard.jsx";
import { HeroBackdrop } from "../components/PageBackdrop.jsx";
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

function BrandFilm() {
  const dialog = useRef(null);
  const video = useRef(null);
  return (
    <>
      <button className="art-film" onClick={() => dialog.current.showModal()}>
        <span className="film-play">
          <Play size={14} />
        </span>
        Watch the film
      </button>
      <dialog
        ref={dialog}
        className="brand-film-dialog"
        aria-labelledby="film-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
        onClose={() => video.current?.pause()}
      >
        <div className="film-header">
          <h2 id="film-title">Scale with speed</h2>
          <button
            className="icon-button"
            onClick={() => dialog.current.close()}
            aria-label="Close brand film"
          >
            <X size={20} />
          </button>
        </div>
        <video
          ref={video}
          controls
          playsInline
          preload="none"
          poster={image("desktop-poster")}
        >
          <source
            src="/media/films/scale-with-speed-mobile.mp4"
            type="video/mp4"
            media="(max-width: 600px)"
          />
          <source
            src="/media/films/scale-with-speed-desktop.mp4"
            type="video/mp4"
          />
          Your browser cannot play this film.{" "}
          <a href="/media/films/scale-with-speed-desktop.mp4">
            Download the film
          </a>
        </video>
      </dialog>
    </>
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
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const motionPaused = Boolean(reduced || paused);
  const headlineMotion = (delay) => ({
    initial: reduced ? false : { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
  });
  return (
    <>
      <section className="home-hero home-section" aria-labelledby="hero-title">
        <div className="container hero-editorial">
          <div className="hero-editorial-top"><span className="eyebrow">Anthill Ventures / India 2030</span><span className="hero-edition">Venture capital & venture building</span></div>
          <h1 id="hero-title" aria-label="Big ideas. Built into businesses.">
            <motion.span className="hero-opening" {...headlineMotion(0.05)}>Big ideas.</motion.span>{" "}
            <motion.span className="hero-built" {...headlineMotion(0.14)}>Built into businesses.</motion.span>
          </h1>
          <div className="hero-editorial-intro"><p>{copy("We help fearless")}</p><div className="hero-editorial-actions"><Link className="button" to="/programs">Scale with us <ArrowUpRight size={19} /></Link><Link className="text-link" to="/about">About Anthill <ArrowRight size={17} /></Link></div></div>
          <div className="hero-stage">
            <HeroBackdrop paused={motionPaused} />
            <div className="hero-stage-content">
              <div className="hero-stage-proof"><span className="eyebrow">Across the Anthill portfolio</span><div className="hero-scale"><strong>80+</strong><span>companies across<br />10 countries</span></div><BrandFilm /></div>
              <div className="hero-company-pair">
                <Link to="/portfolio/broadway" className="hero-company hero-company--broadway"><img src={highlights.find((company) => company.name === "Broadway")?.image} alt="Broadway department store" width="2045" height="1364" /><div><span>Broadway <small>Consumer</small></span><ArrowUpRight size={22} /></div></Link>
                <Link to="/portfolio/zypp-electric" className="hero-company hero-company--zypp"><img src={highlights.find((company) => company.name === "Zypp Electric")?.image} alt="Zypp Electric delivery fleet" width="2045" height="1364" /><div><span>Zypp Electric <small>Urban tech</small></span><ArrowUpRight size={22} /></div></Link>
              </div>
            </div>
          </div>
          <div className="hero-editorial-footer"><a href="#where-we-invest" className="scroll-link"><ArrowDown size={16} />Discover Anthill</a><span className="hero-geography">India / United States / Singapore</span><button type="button" className="atmosphere-toggle" aria-label={reduced ? "Background animation disabled for reduced motion" : paused ? "Resume background animation" : "Pause background animation"} aria-pressed={motionPaused} disabled={Boolean(reduced)} onClick={() => setPaused(!paused)}>{motionPaused ? <Play size={13} /> : <Pause size={13} />}<span>{reduced ? "Reduced motion" : paused ? "Resume motion" : "Pause motion"}</span></button></div>
        </div>
      </section>
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
