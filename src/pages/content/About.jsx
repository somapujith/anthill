import { useMemo, useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import {
  FAQ,
  SmartLink,
  enrichBlocks,
  groupSections,
  imageSource,
  sectionFeatures,
  typeOf,
  words,
} from "./core.jsx";
import "./about.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// A once-only reveal mounted with its start already scrolled past would otherwise never play.
const settlePassed = () =>
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.once && !st.vars.scrub && st.animation && st.scroll() >= st.start)
      st.animation.play();
  });

// From the site's own record: "a 5.4X increase in invested value" (/programs)
// reached "over the past decade" (Prasad Vanga's bio on this page).
const SCALE = 5.4;
const SCALE_TICKS = [1, 2, 3, 4, 5];

const LOGO_NAMES = [
  [/salud/i, "Salud"],
  [/sunday/i, "Sunday Everyday"],
  [/broadway/i, "Broadway"],
  [/boldcare/i, "BoldCare"],
  [/ayurythm/i, "AyuRythm"],
  [/erly/i, "Erly Sign"],
  [/safearth/i, "Safearth"],
  [/rooter/i, "Rooter"],
];
const logoName = (image) =>
  LOGO_NAMES.find(([pattern]) => pattern.test(image.src))?.[1] || "";

// Land on a plate carree grid: one character per 3 degrees, from 177W and 81N.
const LAND = [
  "................................#######.###########",
  ".............................#######..###############",
  "......................................###############.....................................######",
  ".....................###........##......############.........................#.....##################...####",
  ".....##############..###....###.#####....##########...............#####...........####################################",
  "...#############################.######...#####................########################################################",
  "....##########################.............###................###..###################################################",
  ".....#######################......####.......................####..##################################################",
  "......#........##############.....#####...................#...##...#######################################.....###",
  "................###############..#######................#.#...#...######################################........#",
  ".................#######################..................################################################",
  "..................####################....................################################################",
  "..................#####################....................###########.#####.############################",
  "..................##################....................####...##.###..#####.##########################...#",
  "..................################......................###.....#.#.########.######################..#",
  "...................###############..........................###......###############################.#..##",
  "....................#############........................######........############################....#",
  ".....................############.......................##############.#############################",
  "......................#####.....#......................#####################..######################",
  ".......................####...........................########################....################",
  "........................###......#....................#########################....#####..#####",
  "..........................##.#........................##################.#####......###....####",
  "............................####......................######################........##......###....##",
  "..............................##......................####################...........#......###.....#",
  "................................#.######...............#####################.........#......#.......#",
  "..................................########..............###################..................#....#",
  ".................................#########....................#############..................#...##",
  ".................................##########...................############..................#...#####",
  ".................................############..................##########....................#...#.#....##",
  ".................................###############...............##########................................###",
  ".................................##############.................#########.................................###",
  "..................................#############.................#########",
  "...................................###########..................#########..#.........................####",
  "....................................##########..................########..##........................########",
  "....................................##########..................#######...##......................###########",
  "....................................#########...................#######...#.......................############",
  "....................................#######......................######...........................############",
  "....................................#######......................#####............................############",
  "....................................######........................###.............................###....#####",
  "...................................######.................................................................####.......#",
  "...................................####..............................................................................#",
  "...................................###..............................................................................#",
  "...................................###.............................................................................#",
  "...................................##",
  "...................................##",
];
const MAP_W = 119;
const MAP_H = LAND.length;
const LAND_PATH = LAND.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (cell === "#" ? `M${x + 0.5} ${y + 0.5}h0` : [])),
).join("");

// True positions. India is pinned at Hyderabad, the firm's listed address;
// the USA at the country's centre, since the site names no city there.
const toMap = (lat, lon) => ({ x: (lon + 177) / 3 + 0.5, y: (81 - lat) / 3 + 0.5 });
const HUBS = {
  USA: { code: "USA", side: "right", ...toMap(39, -98) },
  India: { code: "IND", side: "left", ...toMap(17.4, 78.5) },
  Singapore: { code: "SG", side: "right", ...toMap(1.35, 103.8) },
};
const arc = (a, b, lift) =>
  `M${a.x} ${a.y}Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;

function HubMap({ hubs }) {
  const [active, setActive] = useState(null);
  const path = useMemo(
    () => [arc(HUBS.USA, HUBS.India, 15), arc(HUBS.India, HUBS.Singapore, 5)],
    [],
  );
  return (
    <>
      <div
        className="about-map"
        role="img"
        aria-label="World map marking Anthill's hubs in India, the USA and Singapore"
      >
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
          <path className="about-map-land" d={LAND_PATH} />
          {path.map((d) => (
            <path className="about-map-arc" d={d} pathLength="1" key={d} />
          ))}
        </svg>
        {hubs.map((name) => {
          const hub = HUBS[name];
          if (!hub) return null;
          return (
            <span
              className={`about-pin about-pin--${hub.side}${active === name ? " is-active" : ""}`}
              style={{
                left: `${(hub.x / MAP_W) * 100}%`,
                top: `${(hub.y / MAP_H) * 100}%`,
              }}
              key={name}
            >
              <i />
              <b>{hub.code}</b>
            </span>
          );
        })}
      </div>
      <div className="about-hub-names">
        {hubs.map((name) => (
          <div
            className="about-hub"
            onPointerEnter={() => setActive(name)}
            onPointerLeave={() => setActive(null)}
            key={name}
          >
            <h3>{name}</h3>
          </div>
        ))}
      </div>
    </>
  );
}

function ArrowCue() {
  return (
    <motion.span
      className="about-cue"
      variants={{ hover: { x: 4, y: -4 } }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <ArrowUpRight size={20} aria-hidden="true" />
    </motion.span>
  );
}

function TextLink({ block }) {
  return (
    <motion.span className="about-link-wrap" whileHover="hover" whileTap={{ scale: 0.98 }}>
      <SmartLink href={block.href} className="about-link">
        <span>{words(block)}</span>
        <ArrowCue />
      </SmartLink>
    </motion.span>
  );
}

export default function AboutBody({ blocks, page }) {
  const root = useRef(null);
  const numeral = useRef(null);
  const sections = groupSections(enrichBlocks(blocks, page));
  const find = (pattern) => sections.find((s) => pattern.test(s.title));

  const story = find(/^Our Story$/);
  const support = find(/support founders/i);
  const home = find(/call home/i);
  const leadership = find(/leadership/i);
  const faq = find(/frequently asked/i);

  const [lead, ...rest] = words(story?.blocks[0] || {}).split(/(?<=\.)\s+/);
  const sectors = "health, climate and urban lifestyles";
  const [leadStart, leadEnd] = lead.split(sectors);

  const { features, leading } = sectionFeatures(support?.blocks || []);
  const supportLink = leading.find((b) => b.href);

  const hubs = (home?.blocks || []).filter((b) => typeOf(b) === "hub").map(words);

  const leaderBlocks = leadership?.blocks || [];
  const viewAll = leaderBlocks.find((b) => b.href && /view all/i.test(words(b)));
  const people = leaderBlocks.find((b) => typeOf(b) === "cards")?.items || [];
  const galleryIndex = leaderBlocks.findIndex((b) => typeOf(b) === "gallery");
  const wallTitle = leaderBlocks[galleryIndex - 1];
  const logos = leaderBlocks[galleryIndex]?.images || [];
  const wallLink = leaderBlocks[galleryIndex + 1];

  const faqBlocks = faq?.blocks || [];
  const pitchIndex = faqBlocks.findIndex((b) => b.href);
  const pitchLabel = faqBlocks[pitchIndex - 1];
  const pitchLink = faqBlocks[pitchIndex];

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);
        const reveal = (targets, trigger, vars, start = "top 82%") =>
          gsap.from(targets, {
            ease: "expo.out",
            duration: 1.1,
            ...vars,
            scrollTrigger: { trigger, start, once: true },
          });

        // Story: the sentence inks itself in as it is read.
        const lead = SplitText.create(q(".about-story-lead"), { type: "words" });
        gsap.fromTo(
          lead.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: q(".about-story-lead"),
              start: "top 86%",
              end: "bottom 52%",
              scrub: 0.5,
              once: true,
            },
          },
        );
        reveal(q(".about-film"), q(".about-film"), {
          clipPath: "inset(0 100% 0 0)",
          duration: 1.5,
        });
        gsap.fromTo(
          q(".about-film img"),
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: q(".about-film"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );

        // Scale: the number and the bar climb together, in true proportion.
        const count = { value: 1 };
        const write = () => {
          if (numeral.current)
            numeral.current.textContent = `${count.value.toFixed(1)}×`;
        };
        const climb = gsap.timeline({
          scrollTrigger: { trigger: q(".about-scale"), start: "top 62%", once: true },
          defaults: { duration: 2.4, ease: "power2.inOut" },
        });
        climb
          .to(count, { value: SCALE, onUpdate: write }, 0)
          .fromTo(q(".about-ruler-fill"), { scaleX: 1 / SCALE }, { scaleX: 1 }, 0);
        count.value = 1;
        write();

        // Support: the cross grows out of the founder at its centre.
        const cross = gsap.timeline({
          scrollTrigger: { trigger: q(".about-cross"), start: "top 74%", once: true },
          defaults: { ease: "expo.out" },
        });
        cross
          .from(q(".about-cross-node"), { scale: 0, duration: 0.8 }, 0)
          .from(q(".about-cross-h"), { scaleX: 0, duration: 1.4 }, 0.1)
          .from(q(".about-cross-v"), { scaleY: 0, duration: 1.4 }, 0.1)
          .from(q(".about-quad-inner"), { y: 24, autoAlpha: 0, duration: 1, stagger: 0.09 }, 0.3);

        // Hubs: the route is drawn, then the pins and names land.
        const route = gsap.timeline({
          scrollTrigger: { trigger: q(".about-map"), start: "top 74%", once: true },
        });
        route
          .from(q(".about-pin"), { autoAlpha: 0, duration: 0.5, stagger: 0.25 }, 0)
          .fromTo(
            q(".about-map-arc"),
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.1,
              stagger: 0.7,
              ease: "power2.inOut",
              clearProps: "strokeDasharray,strokeDashoffset",
            },
            0.1,
          );
        reveal(q(".about-hub h3"), q(".about-hub-names"), { yPercent: 40, autoAlpha: 0, stagger: 0.1 }, "top 92%");

        // Leadership: each portrait is uncovered from the top.
        q(".about-person").forEach((person) => {
          const portrait = person.querySelector(".about-portrait");
          reveal(portrait, person, { clipPath: "inset(0 0 100% 0)", duration: 1.3 });
          reveal(person.querySelector(".about-person-copy"), person, { y: 24, autoAlpha: 0, delay: 0.25 });
        });

        // Wall: logos switch on out of order, like lights across a dark city.
        reveal(q(".about-wall-cell img"), q(".about-wall"), {
          autoAlpha: 0,
          duration: 0.5,
          ease: "none",
          stagger: { each: 0.09, from: "random" },
        }, "top 76%");

        reveal(q(".about-faq-head"), q(".about-faq"), { y: 26, autoAlpha: 0 });

        const pitch = SplitText.create(q(".about-pitch-word"), { type: "chars", mask: "chars" });
        // The mask would clip tight letters if it stayed, so the split is undone once it lands.
        reveal(pitch.chars, q(".about-pitch"), { yPercent: 110, stagger: 0.022, onComplete: () => pitch.revert() }, "top 88%");

        ScrollTrigger.addEventListener("refresh", settlePassed);
        gsap.delayedCall(0.1, settlePassed);

        return () => {
          ScrollTrigger.removeEventListener("refresh", settlePassed);
          lead.revert();
          pitch.revert();
          if (numeral.current) numeral.current.textContent = `${SCALE}×`;
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="about-page" ref={root}>
        {story && (
          <section className="about-story">
            <div className="container">
              <h2>{story.title}</h2>
              <p className="about-story-lead">
                {leadEnd === undefined ? (
                  lead
                ) : (
                  <>
                    {leadStart}
                    <em>{sectors}</em>
                    {leadEnd}
                  </>
                )}
              </p>
              <div className="about-story-spread">
                <figure className="about-film">
                  <img
                    src="/media/732903b48-688607114822f4cb467009bd_SacleWithSpeed_Desktop-poster-00001.jpg"
                    alt="The red Anthill A lifting off from a dark landscape at night"
                    width="1012"
                    height="720"
                    loading="lazy"
                  />
                </figure>
                <div className="about-story-rest">
                  {rest.map((sentence) => (
                    <p key={sentence}>{sentence}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="about-scale" aria-label={`${SCALE}× increase in invested value`}>
          <div className="container">
            <div className="about-scale-head">
              <p className="about-numeral" ref={numeral}>
                {SCALE}×
              </p>
              <div className="about-scale-caption">
                <p className="about-eyebrow">Over the past decade</p>
                <p className="about-scale-label">Increase in invested value</p>
              </div>
            </div>
            <div className="about-ruler" aria-hidden="true">
              <span className="about-ruler-fill" />
              {SCALE_TICKS.map((tick) => (
                <span
                  className="about-ruler-tick"
                  style={{ left: `${(tick / SCALE) * 100}%` }}
                  key={tick}
                >
                  {tick}×
                </span>
              ))}
              <span className="about-ruler-end">{SCALE}×</span>
            </div>
          </div>
        </section>

        {support && (
          <section className="about-support">
            <div className="container">
              <header className="about-head">
                <div>
                  {support.label && <p className="about-eyebrow">{support.label}</p>}
                  <h2>{support.title}</h2>
                </div>
                {supportLink && <TextLink block={supportLink} />}
              </header>
              <div className="about-cross">
                <span className="about-cross-h" aria-hidden="true" />
                <span className="about-cross-v" aria-hidden="true" />
                <span className="about-cross-node" aria-hidden="true">
                  Founders
                </span>
                {features.map((feature) => (
                  <article className="about-quad" key={feature.title}>
                    <div className="about-quad-inner">
                      <h3>{feature.title}</h3>
                      {feature.blocks
                        .filter((b) => !/^\d{1,2}$/.test(words(b)))
                        .map((b) => (
                          <p key={words(b)}>{words(b)}</p>
                        ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {home && (
          <section className="about-home">
            <div className="container">
              <header className="about-head">
                <div>
                  {home.label && <p className="about-eyebrow">{home.label}</p>}
                  <h2>{home.title}</h2>
                </div>
              </header>
              <HubMap hubs={hubs} />
            </div>
          </section>
        )}

        {leadership && (
          <section className="about-leaders">
            <div className="container">
              <header className="about-head">
                <div>
                  {leadership.label && <p className="about-eyebrow">{leadership.label}</p>}
                  <h2>{leadership.title}</h2>
                </div>
                {viewAll && <TextLink block={viewAll} />}
              </header>
              <div className="about-people">
                {people.map((person) => (
                  <motion.article
                    className="about-person"
                    whileHover="hover"
                    key={person.path}
                  >
                    <SmartLink href={person.path}>
                      <div className="about-portrait">
                        {person.image && (
                          <img
                            src={imageSource(person.image, person.page)}
                            alt={`Portrait of ${person.title}`}
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="about-person-copy">
                        <p className="about-role">{person.role}</p>
                        <h3>
                          {person.title}
                          <ArrowCue />
                        </h3>
                        <p className="about-bio">{person.excerpt}</p>
                      </div>
                    </SmartLink>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>
        )}

        {logos.length > 0 && (
          <section className="about-wall">
            <div className="about-wall-title">
              <h2>{words(wallTitle || {})}</h2>
            </div>
            {logos.map((logo) => (
              <div className="about-wall-cell" key={logo.src}>
                <img
                  src={imageSource(logo, page)}
                  alt={`${logoName(logo)} logo`}
                  loading="lazy"
                  width="256"
                  height="256"
                />
              </div>
            ))}
            {wallLink?.href && (
              <motion.div className="about-wall-link" whileHover="hover" whileTap={{ scale: 0.985 }}>
                <SmartLink href={wallLink.href}>
                  <span>{words(wallLink)}</span>
                  <ArrowCue />
                </SmartLink>
              </motion.div>
            )}
          </section>
        )}

        {faq && (
          <section className="about-faq">
            <div className="container">
              <header className="about-faq-head">
                {faq.label && <p className="about-eyebrow">{faq.label}</p>}
                <h2>{faq.title}</h2>
              </header>
              <FAQ blocks={pitchIndex > 0 ? faqBlocks.slice(0, pitchIndex - 1) : faqBlocks} page={page} />
            </div>
          </section>
        )}

        {pitchLink && (
          <motion.section className="about-pitch" whileHover="hover">
            <SmartLink href={pitchLink.href}>
              <span className="container about-pitch-inner">
                {pitchLabel && <span className="about-pitch-label">{words(pitchLabel)}</span>}
                <span className="about-pitch-row">
                  <span className="about-pitch-word">{words(pitchLink)}</span>
                  <motion.span
                    className="about-pitch-arrow"
                    variants={{ hover: { x: 10, y: -10 } }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ArrowUpRight aria-hidden="true" />
                  </motion.span>
                </span>
              </span>
            </SmartLink>
          </motion.section>
        )}
      </div>
    </MotionConfig>
  );
}
