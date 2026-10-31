import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ArrowLeft, ArrowRight, Plus, Minus } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import HomeHero from "../components/HomeHero.jsx";
import { HeroBackdrop } from "../components/PageBackdrop.jsx";
import { curveY, drawSurface, surfaceY } from "../components/growth-curve.js";
import site from "../data/view-content.json";
import "./home.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const MotionLink = motion.create(Link);
const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const WIDE = "(min-width: 901px)";

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

const programPhoto = (term) =>
  site.pages["/programs"].images.find((i) => i.local.toLowerCase().includes(term))
    ?.local;
const sectors = [
  {
    title: "Live Healthy",
    start: "We fuel Living Healthy",
    category: "Health & wellbeing",
    photo: programPhoto("live-healthy-4"),
    shift: "28%",
    alt: "A runner in a park checks the tracker on her wrist",
    focus: "50% 15%",
  },
  {
    title: "Mitigate Climate Change",
    start: "We invest in breakthrough",
    category: "Climate & energy",
    photo: programPhoto("mitigate-climate-change-4"),
    shift: "18%",
    alt: "An open hand beneath an infinity loop joining a grey Earth to a green one",
    focus: "50% 30%",
  },
  {
    title: "Enhance Urban Lifestyle",
    start: "We elevate urban lifestyles",
    category: "The next consumer",
    photo: programPhoto("enhance-urban-lifestyle"),
    shift: "24%",
    alt: "A shopper faces a full-height digital fitting display in a clothing store",
    focus: "50% 34%",
  },
];

// Ordered by size, so the ladder climbs to the same billion the hero curve ends on.
const metrics = [
  { value: "5.4X", label: "Increase in value", x: 0.135, size: 3.8 },
  { value: "50+", label: "Corporate Partners", x: 0.275, size: 4.6 },
  { value: "70+", label: "Speed Scaling Mentors", x: 0.425, size: 5.2 },
  { value: "300+", label: "Media Subscribers", x: 0.585, size: 5.8 },
  { value: "10M+", label: "Health-Care Patients", x: 0.75, size: 6.6 },
  { value: "1B+", label: "Urban consumers", x: 0.955, size: 13 },
];
const LADDER_CURVE = { ground: 0.95, rise: 0.66, power: 2.5 };
const PITCH_CURVE = { ground: 0.86, rise: 0.8, power: 3.4 };

const person = (route, index, crop) => {
  const card = site.pages[route].cards[index];
  const [name, role] = card.blocks.filter((b) => b.text).map((b) => b.text);
  return {
    name: name.replace("Ajai kumar", "Ajai Kumar"),
    role,
    photo: card.images[0].local,
    to: card.links[0].href,
    crop,
  };
};
const leadCopy = (route, start) =>
  site.pages[route].blocks.find((b) => b.text?.startsWith(start))?.text;
// Goutham Uppaluri's source image is a plant, so the team grid shows the seven real portraits.
const founder = person("/team", 0);
const team = [1, 2, 7, 3, 6, 4].map((i) => person("/team", i));
// crop: the head centre within the 4:5 source photo (x, y) read off a 10% grid, and the zoom
// that makes the head fill about two thirds of the circle.
const mentors = [
  [0, { x: 0.51, y: 0.21, zoom: 1.7 }],
  [1, { x: 0.52, y: 0.4, zoom: 1.45 }],
  [2, { x: 0.41, y: 0.265, zoom: 2.8 }],
  [4, { x: 0.52, y: 0.42, zoom: 1.3 }],
  [6, { x: 0.53, y: 0.45, zoom: 1.05 }],
  [7, { x: 0.54, y: 0.16, zoom: 3.2 }],
].map(([i, crop]) => person("/speedscalers", i, crop));

// Places a 4:5 photo in a square window, centred on the head but never past the photo's edges.
const PHOTO_RATIO = 1.25;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const cropStyle = ({ x, y, zoom }) => {
  const halfX = 0.5 / zoom;
  const halfY = 0.5 / (zoom * PHOTO_RATIO);
  const cx = clamp(x, halfX, 1 - halfX);
  const cy = clamp(y, halfY, 1 - halfY);
  return {
    width: `${zoom * 100}%`,
    left: `${50 - cx * zoom * 100}%`,
    top: `${50 - cy * PHOTO_RATIO * zoom * 100}%`,
  };
};

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

function Sectors() {
  const root = useRef(null);
  const pointerInside = useRef(false);
  const [open, setOpen] = useState(0);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        const split = SplitText.create(q(".home-vision-line"), { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            duration: 0.9,
            stagger: 0.07,
            ease: "power1.out",
            scrollTrigger: { trigger: q(".home-vision-line"), start: "top 82%", once: true },
          },
        );
        return () => split.revert();
      });
      // With no pointer in the list, the open row follows the scroll position.
      media.add(`${MOTION_OK} and ${WIDE} and (hover: hover)`, () => {
        let lastY = scrollY;
        ScrollTrigger.create({
          trigger: q(".home-sector-list"),
          start: "top 58%",
          end: "bottom 62%",
          onUpdate: (self) => {
            if (scrollY === lastY) return;
            lastY = scrollY;
            if (self.isActive && !pointerInside.current)
              setOpen(Math.min(sectors.length - 1, Math.floor(self.progress * sectors.length)));
          },
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="where-we-invest"
      className="home-thesis home-section"
      aria-labelledby="thesis-heading"
    >
      <div className="container home-vision">
        <span className="eyebrow">Our Vision</span>
        <p className="home-vision-line">
          Healthier lives, cleaner energy and better city life for{" "}
          <em>a billion people.</em>
        </p>
      </div>
      <div className="container invest-bar">
        <div>
          <span className="eyebrow">Our focus</span>
          <h2 id="thesis-heading">Where We Invest</h2>
        </div>
        <Link to="/philosophy" className="text-link">
          Our philosophy <ArrowUpRight size={19} />
        </Link>
      </div>
      <ol
        className="home-sector-list"
        onPointerEnter={() => (pointerInside.current = true)}
        onPointerLeave={() => (pointerInside.current = false)}
      >
        {sectors.map((sector, i) => (
          <li
            key={sector.title}
            className={`home-sector${open === i ? " is-open" : ""}`}
            onPointerEnter={() => setOpen(i)}
          >
            <Link to="/about" className="home-sector-link" onFocus={() => setOpen(i)}>
              <div className="home-sector-photo" style={{ "--shift": sector.shift }}>
                <img
                  loading="lazy"
                  src={sector.photo}
                  alt={sector.alt}
                  style={{ objectPosition: sector.focus }}
                />
              </div>
              <div className="container home-sector-head">
                <span className="home-sector-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{sector.title}</h3>
              </div>
              <div className="home-sector-fold">
                <div className="home-sector-fold-inner">
                  <div className="container home-sector-body">
                    <div>
                      <span className="home-sector-category">{sector.category}</span>
                      <p>{copy(sector.start)}</p>
                    </div>
                    <span className="home-sector-go" aria-hidden="true">
                      <ArrowUpRight size={22} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Borders() {
  const root = useRef(null);
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        const split = SplitText.create(q(".reach-title > span"), {
          type: "lines",
          mask: "lines",
          linesClass: "home-line",
        });
        gsap
          .timeline({
            defaults: { ease: "expo.out" },
            scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
            onComplete: () => split.revert(),
          })
          .from(split.lines, { yPercent: 108, duration: 1.2, stagger: 0.12 }, 0)
          .from(q(".reach-map"), { autoAlpha: 0, duration: 1.4, ease: "power1.out" }, 0.1)
          .from(q(".reach-line"), { scaleX: 0, duration: 1.6, ease: "power3.inOut" }, 0.5)
          .from(q(".reach-route li"), { autoAlpha: 0, y: 14, duration: 0.8, stagger: 0.18 }, 0.7)
          .from(q(".reach-copy"), { autoAlpha: 0, y: 14, duration: 0.8 }, 0.6);
        gsap.to(q(".reach-map"), {
          yPercent: -7,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
        return () => split.revert();
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="home-reach">
      <div className="container reach-top">
        <img
          className="reach-map"
          loading="lazy"
          src={image("india%20map")}
          alt="Map of India drawn in red dots"
        />
        <span className="eyebrow">People & reach</span>
        <h2 id="impact-heading" className="reach-title">
          <span>Scaling</span> <span>Without Borders</span>
        </h2>
        <p className="reach-copy">{copy("By investing globally")}</p>
        <div className="reach-route">
          <span className="reach-line" aria-hidden="true" />
          <ul>
            <li>India</li>
            <li>USA</li>
            <li>Singapore</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Ladder() {
  const root = useRef(null);
  const sky = useRef(null);
  const edge = useRef(null);
  const head = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const state = { t: 1.25 };
      const steps = q(".ladder-step");
      let reached = metrics.length;

      // Steps are placed with the CSS translate property, so only their children move in y.
      const reveal = (step) => {
        gsap.to(step, { autoAlpha: 1, duration: 0.4, overwrite: true });
        gsap.fromTo(step.children, { y: 18 }, { y: 0, duration: 0.8, ease: "expo.out" });
      };

      const draw = () => {
        drawSurface(sky.current, edge.current, LADDER_CURVE, state.t, 0);
        const x = Math.min(state.t, 0.955);
        head.current.style.left = `${x * 100}%`;
        head.current.style.top = `${surfaceY(x, LADDER_CURVE, state.t, 0) * 100}%`;
        while (reached < metrics.length && metrics[reached].x <= state.t)
          reveal(steps[reached++]);
      };
      draw();

      const media = gsap.matchMedia();
      // The silk climbs with the scroll and never falls back, like the hero's opening.
      media.add(`${MOTION_OK} and ${WIDE}`, () => {
        reached = 0;
        state.t = -0.12;
        gsap.set(steps, { autoAlpha: 0 });
        draw();
        let goal = state.t;
        ScrollTrigger.create({
          trigger: root.current,
          start: "top 78%",
          end: "bottom 96%",
          onUpdate: (self) => {
            const next = gsap.utils.interpolate(-0.12, 1.25, self.progress);
            if (next <= goal) return;
            goal = next;
            gsap.to(state, { t: goal, duration: 0.5, ease: "power2.out", overwrite: true, onUpdate: draw });
          },
        });
        gsap.from(q(".ladder-intro > *"), {
          autoAlpha: 0,
          y: 16,
          duration: 0.8,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
        });
        return () => {
          reached = metrics.length;
          state.t = 1.25;
          draw();
        };
      });
      // Narrow screens climb the same steps as a staircase, one row at a time.
      media.add(`${MOTION_OK} and (max-width: 900px)`, () => {
        steps.forEach((step) => {
          gsap.from(step, {
            autoAlpha: 0,
            y: 20,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: step, start: "top 90%", once: true },
          });
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="ladder">
      <div className="ladder-dots" aria-hidden="true" />
      <svg
        className="ladder-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path ref={sky} className="ladder-sky" />
        <path ref={edge} className="ladder-edge" vectorEffect="non-scaling-stroke" />
      </svg>
      <span ref={head} className="ladder-head" aria-hidden="true" />
      <div className="ladder-intro">
        <span className="eyebrow">The Anthill network</span>
        <h3>Our network in numbers</h3>
        <p>{copy("At Anthill,")}</p>
      </div>
      <dl className="ladder-list">
        {metrics.map(({ value, label, x, size }, i) => (
          <div
            key={label}
            className="ladder-step"
            style={{
              "--i": i,
              "--x": `${x * 100}%`,
              "--y": `${curveY(x, LADDER_CURVE) * 100}%`,
              "--size": size,
            }}
          >
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TeamMember({ member, lead = false }) {
  return (
    <li className={lead ? "home-team-lead" : undefined}>
      <Link to={member.to}>
        <span className="home-team-photo">
          <img loading="lazy" src={member.photo} alt={member.name} />
        </span>
        <strong>{member.name}</strong>
        <span className="home-team-member-role">{member.role}</span>
      </Link>
    </li>
  );
}

function Team() {
  const root = useRef(null);
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        gsap
          .timeline({
            defaults: { ease: "expo.out" },
            scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
          })
          .from(q(".home-team-head > *"), { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.08 }, 0)
          .from(q(".home-team-photo"), { clipPath: "inset(100% 0 0 0)", duration: 1.1, ease: "power4.inOut", stagger: 0.07, clearProps: "clipPath" }, 0.1);
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="home-team home-section"
      aria-labelledby="team-heading"
    >
      <div className="container">
        <div className="home-team-head">
          <div>
            <span className="eyebrow">Our people</span>
            <h2 id="team-heading">Meet the team</h2>
          </div>
          <p>{leadCopy("/team", "Anthill\u2019s leadership")}</p>
          <Link to="/team" className="text-link">
            View Team <ArrowUpRight size={19} />
          </Link>
        </div>
        <ul className="home-team-grid">
          <TeamMember member={founder} lead />
          {team.map((member) => (
            <TeamMember key={member.name} member={member} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Mentors() {
  const root = useRef(null);
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        gsap.from(q(".home-mentors-intro > *"), {
          autoAlpha: 0,
          y: 18,
          duration: 0.9,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
        });
        q(".home-mentor").forEach((row) => {
          gsap.from(row, {
            autoAlpha: 0,
            y: 26,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: row, start: "top 92%", once: true },
          });
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="home-mentors home-section"
      aria-labelledby="mentors-heading"
    >
      <div className="container home-mentors-layout">
        <div className="home-mentors-intro">
          <span className="eyebrow">Our mentors</span>
          <h2 id="mentors-heading">70+ speed scalers worldwide</h2>
          <p>{leadCopy("/speedscalers", "Backed by 70+")}</p>
          <Link
            to="/speedscalers"
            className="text-link"
            aria-label="View all speed scalers"
          >
            View <ArrowUpRight size={19} />
          </Link>
        </div>
        <ul className="home-mentor-list">
          {mentors.map(({ name, role, photo, to, crop }) => (
            <li className="home-mentor" key={name}>
              <Link to={to}>
                <span className="home-mentor-avatar">
                  <img
                    loading="lazy"
                    src={photo}
                    alt={name}
                    style={cropStyle(crop)}
                  />
                </span>
                <span className="home-mentor-text">
                  <strong>{name}</strong>
                  <span>{role}</span>
                </span>
                <ArrowUpRight size={26} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Portfolio() {
  const root = useRef(null);
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
  const behavior = reduced ? "instant" : "smooth";
  function scroll(direction) {
    track.current?.scrollBy({ left: direction * stride(), behavior });
  }
  function jump(i) {
    track.current?.scrollTo({ left: i * stride(), behavior });
  }

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        const split = SplitText.create(q("#portfolio-heading"), {
          type: "lines",
          mask: "lines",
          linesClass: "home-line",
        });
        gsap
          .timeline({
            defaults: { ease: "expo.out" },
            scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
            onComplete: () => split.revert(),
          })
          .from(split.lines, { yPercent: 108, duration: 1.1 }, 0)
          .from(q(".home-roster li"), { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.04 }, 0.2)
          .from(q(".featured-card"), { autoAlpha: 0, y: 34, duration: 1, stagger: 0.1 }, 0.3);
        return () => split.revert();
      });
      return () => media.revert();
    },
    { scope: root },
  );

  const current = Math.min(index, highlights.length - 1);
  return (
    <section
      ref={root}
      className="home-portfolio home-section"
      aria-labelledby="portfolio-heading"
    >
      <div className="container portfolio-top">
        <div className="portfolio-title">
          <span className="eyebrow">Portfolio</span>
          <h2 id="portfolio-heading">Selected companies</h2>
        </div>
        <Link to="/portfolio" className="text-link">
          View portfolio <ArrowUpRight size={19} />
        </Link>
        <ol className="home-roster" aria-label="Jump to a company">
          {highlights.map((card, i) => (
            <li key={card.name}>
              <button
                type="button"
                aria-current={i === current ? "true" : undefined}
                onClick={() => jump(i)}
              >
                {card.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div
        ref={track}
        className="portfolio-track"
        role="group"
        aria-labelledby="portfolio-heading"
        tabIndex={0}
        onScroll={() =>
          setIndex(Math.round(track.current.scrollLeft / stride()))
        }
      >
        {highlights.map((card, i) => (
          <article
            key={card.name}
            className={`featured-card${i === current ? " is-current" : ""}`}
          >
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
              <span className="featured-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{card.name}</h3>
              {card.description && (
                <motion.button
                  type="button"
                  className="icon-button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  aria-expanded={expanded === i}
                  aria-controls={"company-overview-" + i}
                  aria-label={`Overview of ${card.name}`}
                >
                  {expanded === i ? <Minus size={18} /> : <Plus size={18} />}
                </motion.button>
              )}
            </div>
            {card.description && (
              <div
                id={"company-overview-" + i}
                className={`featured-description${expanded === i ? " expanded" : ""}`}
              >
                <p>{card.description}</p>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="container carousel-bottom">
        <span className="carousel-count" aria-live="polite">
          {String(current + 1).padStart(2, "0")}{" "}
          <span>/ {String(highlights.length).padStart(2, "0")}</span>
        </span>
        <div className="carousel-progress" aria-hidden="true">
          <span
            style={{ transform: `scaleX(${(current + 1) / highlights.length})` }}
          />
        </div>
        <div className="carousel-controls">
          <motion.button
            type="button"
            className="icon-button"
            whileTap={{ scale: 0.92 }}
            onClick={() => scroll(-1)}
            aria-label="Previous company"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <motion.button
            type="button"
            className="icon-button"
            whileTap={{ scale: 0.92 }}
            onClick={() => scroll(1)}
            aria-label="Next company"
          >
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}

function Pitch() {
  const root = useRef(null);
  const sky = useRef(null);
  const edge = useRef(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const state = { lift: 1 };
      const draw = () =>
        drawSurface(sky.current, edge.current, PITCH_CURVE, 1.25, state.lift);
      draw();

      const media = gsap.matchMedia();
      // The dark section above lifts off along the growth curve to uncover the silk.
      media.add(MOTION_OK, () => {
        state.lift = 0;
        draw();
        let goal = 0;
        ScrollTrigger.create({
          trigger: root.current,
          start: "top 92%",
          end: "top 12%",
          onUpdate: (self) => {
            if (self.progress <= goal) return;
            goal = self.progress;
            gsap.to(state, { lift: goal, duration: 0.5, ease: "power2.out", overwrite: true, onUpdate: draw });
          },
        });
        const split = SplitText.create(q("#connect-heading"), {
          type: "lines",
          mask: "lines",
          linesClass: "home-line",
        });
        gsap
          .timeline({
            defaults: { ease: "expo.out" },
            scrollTrigger: { trigger: root.current, start: "top 42%", once: true },
            onComplete: () => split.revert(),
          })
          .from(split.lines, { yPercent: 104, duration: 1.3, stagger: 0.14 }, 0)
          .from(q(".connect-copy, .connect-top > *"), { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.08 }, 0.5);
        return () => {
          split.revert();
          state.lift = 1;
          draw();
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="home-connect home-section"
      aria-labelledby="connect-heading"
    >
      <div className="connect-silk">
        <HeroBackdrop paused={Boolean(reduced)} variation={7} />
      </div>
      <svg
        className="connect-sky"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path ref={sky} className="connect-sky-fill" />
        <path ref={edge} className="connect-sky-edge" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="container connect-inner">
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
            pitch?
          </h2>
          <div className="connect-copy">
            <p>{copy("To pitch your idea")}</p>
          </div>
        </div>
      </div>
      <MotionLink
        to="/contact"
        className="connect-cta"
        whileHover="hover"
        whileTap={{ scale: 0.995 }}
      >
        <span className="container connect-cta-inner">
          Get in Touch
          <motion.span variants={{ hover: { x: 6, y: -6 } }}>
            <ArrowUpRight size="1em" />
          </motion.span>
        </span>
      </MotionLink>
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
      <div className="home-below">
        <Sectors />
        <section
          className="home-impact home-section"
          aria-labelledby="impact-heading"
        >
          <Borders />
          <Ladder />
        </section>
        <Team />
        <Mentors />
        <Portfolio />
        <Pitch />
      </div>
    </>
  );
}
