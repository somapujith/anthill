import { useMemo, useRef } from "react";
import { MotionConfig, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import {
  words,
  typeOf,
  imageSource,
  InlineText,
  SmartLink,
  groupSections,
  enrichBlocks,
  sectionFeatures,
} from "./core.jsx";
import "./programs.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const NO_MOTION_PREFERENCE = "(prefers-reduced-motion: no-preference)";
const STACKED = "(max-width: 1199px)";
const EASE = [0.22, 1, 0.36, 1];

const SECTOR_ALT = {
  "Live Healthy": "A woman on a park path checking the fitness watch on her wrist",
  "Mitigate Climate Change":
    "An open hand beneath an infinity loop that joins a grey Earth to a green one",
  "Enhance Urban Lifestyle":
    "A shopper facing a full-length digital fitting display in a clothing store",
};

const LOGO_ALT = [
  [/aws/i, "AWS"],
  [/microsoft/i, "Microsoft for Startups"],
  [/zoom/i, "Zoom"],
];

// The numbers that carry the argument of the metrics paragraph.
const FIGURES =
  /(5\.4X increase|9 Exits|33% IRR|81 Portfolio Companies|50\+ Speed Scaling Mentors|100\+ Distribution Channels|\$1B)/;

const parseMetric = (block) => {
  const match = /^(\$?)(\d+(?:\.\d+)?)(.*)$/.exec(words(block));
  return {
    value: words(block),
    label: block.label,
    prefix: match?.[1] || "",
    number: Number(match?.[2] || 0),
    suffix: match?.[3] || "",
    decimals: match?.[2]?.split(".")[1]?.length || 0,
  };
};

function readProgram(blocks, page) {
  const sections = groupSections(enrichBlocks(blocks, page));
  const find = (pattern) =>
    sections.find((s) => pattern.test(s.title)) || { title: "", blocks: [] };
  const support = find(/^Support for each stage/);
  const proof = find(/^Driving Growth/);
  const vision = sectionFeatures(find(/^Vision India/).blocks);
  const reach = find(/^Our partnerships/);
  const credits = find(/^Our portfolio has access/);
  const creditParts = sectionFeatures(credits.blocks);
  const process = find(/^We Source/);
  const design = creditParts.features[0] || { title: "", blocks: [] };
  // groupSections lifts the last short line before a heading into a label, so
  // the final feature's description arrives as the process section's label.
  const designText = design.blocks.map(words);
  if (designText.length % 2 && process.label) designText.push(process.label);
  const [designIntro, featureLabel, ...featureText] = designText;

  const metricsOf = (section) =>
    section.blocks.filter((b) => typeOf(b) === "metric").map(parseMetric);

  return {
    apply: blocks.find((b) => words(b) === "Apply Now" && b.href),
    support: {
      title: support.title,
      label: support.label,
      items: support.blocks
        .filter((b) => b.href)
        .map((b) => {
          const [title, ...text] = words(b).split(" Overview ");
          return { title, text: text.join(" Overview "), href: b.href };
        }),
    },
    proof: {
      title: proof.title,
      label: proof.label,
      text: words(proof.blocks.find((b) => !b.href && typeOf(b) !== "metric") || {}),
      link: proof.blocks.find((b) => b.href),
      metrics: metricsOf(proof),
    },
    vision: {
      title: find(/^Vision India/).title,
      text: words(vision.leading.find((b) => !b.src) || {}),
      sectors: vision.features.map((feature) => {
        const groups = [{ label: "", items: [] }];
        let text = "";
        let image = null;
        for (const block of feature.blocks) {
          if (block.src) image = block;
          else if (typeOf(block) === "li") groups[groups.length - 1].items.push(words(block));
          else if (!text) text = words(block);
          else groups.push({ label: words(block), items: [] });
        }
        return {
          title: feature.title,
          text,
          image,
          groups: groups.filter((g) => g.label || g.items.length),
        };
      }),
    },
    reach: { title: reach.title, metrics: metricsOf(reach) },
    credits: {
      title: credits.title,
      images: creditParts.leading.flatMap((b) =>
        typeOf(b) === "gallery" ? b.images : b.src ? [b] : [],
      ),
    },
    design: {
      title: design.title,
      intro: designIntro,
      label: featureLabel,
      features: Array.from({ length: Math.floor(featureText.length / 2) }, (_, i) => ({
        title: featureText[i * 2],
        text: featureText[i * 2 + 1],
      })),
    },
    process: {
      title: process.title,
      gates: sections
        .filter((s) => /^Toll Gate /.test(s.title))
        .map((s) => ({
          title: s.title,
          numeral: s.title.replace(/^Toll Gate\s+/, ""),
          items: s.blocks.map((b) => words(b).replace(/^→\s*/, "")),
        })),
    },
    queries: {
      title: find(/^Got Queries/).title,
      text: words(find(/^Got Queries/).blocks[0] || {}),
    },
  };
}

function ApplyLink({ apply, className = "" }) {
  if (!apply) return null;
  return (
    <motion.div
      className={`pg-apply ${className}`}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <SmartLink href={apply.href} className="pg-apply-link">
        <motion.span
          className="pg-apply-fill"
          aria-hidden="true"
          variants={{ rest: { scaleY: 0 }, hover: { scaleY: 1 }, tap: { scaleY: 1 } }}
          transition={{ duration: 0.45, ease: EASE }}
        />
        <span className="pg-apply-text">{words(apply)}</span>
        <motion.span
          className="pg-apply-arrow"
          aria-hidden="true"
          variants={{
            rest: { x: 0, y: 0 },
            hover: { x: 8, y: -8 },
            tap: { x: 3, y: -3 },
          }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <ArrowUpRight strokeWidth={1.5} />
        </motion.span>
      </SmartLink>
    </motion.div>
  );
}

function Support({ support }) {
  return (
    <section className="pg-support" aria-labelledby="pg-support-title">
      <figure className="pg-support-art">
        <div className="pg-support-frame" data-unroll>
          <img
            src="/media/editorial/program-growth.png"
            alt="Architectural illustration of a red pathway rising through ivory terraces"
            loading="lazy"
            width="1086"
            height="1448"
          />
        </div>
        <figcaption>From first traction to the next market.</figcaption>
      </figure>
      <div className="pg-support-copy">
        <div data-rise>
          {support.label && <p className="pg-eyebrow">{support.label}</p>}
          <h2 id="pg-support-title" className="pg-title">
            {support.title}
          </h2>
        </div>
        <ul className="pg-levers">
          {support.items.map((item) => (
            <motion.li
              key={item.title}
              data-rise
              initial="rest"
              animate="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <SmartLink href={item.href} className="pg-lever">
                <motion.span
                  className="pg-lever-title"
                  variants={{ rest: { x: 0 }, hover: { x: 10 }, tap: { x: 4 } }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {item.title}
                </motion.span>
                <span className="pg-lever-text">{item.text}</span>
                <motion.span
                  className="pg-lever-arrow"
                  aria-hidden="true"
                  variants={{
                    rest: { backgroundColor: "rgba(230, 33, 43, 0)", color: "#171717" },
                    hover: { backgroundColor: "rgba(230, 33, 43, 1)", color: "#ffffff" },
                    tap: { backgroundColor: "rgba(186, 19, 28, 1)", color: "#ffffff" },
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <ArrowUpRight size={20} strokeWidth={1.5} />
                </motion.span>
                <motion.span
                  className="pg-lever-rule"
                  aria-hidden="true"
                  variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 }, tap: { scaleX: 1 } }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </SmartLink>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Vision({ vision, page }) {
  return (
    <section className="pg-vision" aria-labelledby="pg-vision-title">
      <div className="container">
        <h2 id="pg-vision-title" className="pg-vision-title" data-letters>
          {vision.title}
        </h2>
      </div>
      <div className="pg-sectors">
        <p className="pg-vision-text" data-rise>
          {vision.text}
        </p>
        {vision.sectors.map((sector) => (
          <article className="pg-sector" key={sector.title}>
            {sector.image && (
              <div className="pg-sector-frame">
                <img
                  data-drift
                  src={imageSource(sector.image, page)}
                  alt={SECTOR_ALT[sector.title] || sector.title}
                  loading="lazy"
                  width="800"
                  height="600"
                />
              </div>
            )}
            <div className="pg-sector-copy" data-rise>
              <h3>{sector.title}</h3>
              <p>{sector.text}</p>
              <div className="pg-sector-lists">
                {sector.groups.map((group, i) => (
                  <div key={group.label || i}>
                    {group.label && <h4 className="pg-eyebrow">{group.label}</h4>}
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// A smooth curve through the gates. Catmull-Rom, written out as cubic Beziers.
function spline(points) {
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i - 1] || points[i];
    const b = points[i];
    const c = points[i + 1];
    const e = points[i + 2] || c;
    d += ` C${b.x + (c.x - a.x) / 6} ${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6} ${c.y - (e.y - b.y) / 6} ${c.x} ${c.y}`;
  }
  return d;
}

function Climb({ process, apply }) {
  const root = useRef(null);
  const stage = useRef(null);
  const track = useRef(null);
  const line = useRef(null);
  const area = useRef(null);
  const reveal = useRef(null);
  const mark = useRef(null);

  useGSAP(
    () => {
      const section = root.current;
      const gates = gsap.utils.toArray(".pg-gate", section);
      let total = 0;
      let stops = [];
      let progress = 1;

      const paint = () => {
        if (!total) return;
        line.current.style.strokeDashoffset = String(total * (1 - progress));
        const head = line.current.getPointAtLength(total * progress);
        const stacked = matchMedia(STACKED).matches;
        reveal.current.setAttribute("width", String(head.x));
        mark.current.style.transform = `translate(${head.x}px, ${head.y}px) translate(-50%, ${stacked ? "-50%" : "-78%"})`;
        gates.forEach((gate, i) =>
          gate.classList.toggle("is-open", progress >= stops[i] - 0.002),
        );
      };

      const measure = () => {
        const box = section.getBoundingClientRect();
        const svg = line.current.ownerSVGElement;
        svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
        const nodes = gates.map((gate) => {
          const rect = gate.querySelector(".pg-gate-node").getBoundingClientRect();
          return { x: rect.left - box.left, y: rect.top - box.top };
        });
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const stacked = matchMedia(STACKED).matches;
        const stageBox = stage.current.getBoundingClientRect();
        const lastBox = gates[gates.length - 1].getBoundingClientRect();
        const points = stacked
          ? [
              { x: first.x - 4, y: stageBox.top - box.top - 34 },
              ...nodes,
              { x: last.x + 4, y: lastBox.bottom - box.top },
            ]
          : [
              { x: 0, y: first.y + 26 },
              ...nodes,
              { x: box.width - 8, y: Math.max(46, last.y - 150) },
            ];
        const d = spline(points);
        track.current.setAttribute("d", d);
        line.current.setAttribute("d", d);
        area.current.setAttribute(
          "d",
          `${d} L${box.width} ${box.height} L0 ${box.height} Z`,
        );
        reveal.current.setAttribute("height", String(box.height));
        total = line.current.getTotalLength();
        line.current.style.strokeDasharray = `${total} ${total + 1}`;
        const samples = Array.from({ length: 321 }, (_, i) => {
          const point = line.current.getPointAtLength((total * i) / 320);
          return { at: i / 320, x: point.x, y: point.y };
        });
        stops = nodes.map((node) => {
          let best = samples[0];
          let bestDistance = Infinity;
          for (const sample of samples) {
            const distance = Math.hypot(sample.x - node.x, sample.y - node.y);
            if (distance < bestDistance) {
              best = sample;
              bestDistance = distance;
            }
          }
          return best.at;
        });
        paint();
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(section);

      const media = gsap.matchMedia();
      media.add(NO_MOTION_PREFERENCE, () => {
        section.classList.add("is-armed");
        const drive = { p: 0 };
        let reached = 0;
        progress = 0;
        paint();
        gsap.to(drive, {
          p: 1,
          ease: "none",
          // Gates stay open once passed: scrolling back does not rewind the climb.
          onUpdate() {
            reached = Math.max(reached, drive.p);
            progress = reached;
            paint();
          },
          scrollTrigger: {
            trigger: stage.current,
            start: "top 70%",
            end: "bottom 94%",
            scrub: 0.6,
          },
        });
        return () => {
          section.classList.remove("is-armed");
          progress = 1;
          paint();
        };
      });

      return () => {
        observer.disconnect();
        media.revert();
      };
    },
    { scope: root },
  );

  const count = process.gates.length;
  return (
    <section className="pg-climb" ref={root} aria-labelledby="pg-climb-title">
      <svg className="pg-climb-art" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pg-climb-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6212b" stopOpacity="0.3" />
            <stop offset="0.75" stopColor="#e6212b" stopOpacity="0" />
          </linearGradient>
          <clipPath id="pg-climb-reveal">
            <rect ref={reveal} x="0" y="0" width="0" height="0" />
          </clipPath>
        </defs>
        <path
          ref={area}
          className="pg-climb-area"
          fill="url(#pg-climb-fill)"
          clipPath="url(#pg-climb-reveal)"
        />
        <path ref={track} className="pg-climb-track" />
        <path ref={line} className="pg-climb-line" />
      </svg>
      <img ref={mark} className="pg-climb-mark" src="/brand/mark-red.svg" alt="" />
      <div className="container">
        <div className="pg-climb-stage" ref={stage}>
          <h2 id="pg-climb-title" className="pg-title pg-climb-title" data-rise>
            {process.title}
          </h2>
          <ol className="pg-gates">
            {process.gates.map((gate, i) => (
              <li
                className="pg-gate"
                key={gate.title}
                style={{ "--f": ((i / (count - 1)) ** 1.9).toFixed(3) }}
              >
                <span className="pg-gate-node" aria-hidden="true">
                  <i className="pg-gate-arm" />
                </span>
                <h3>
                  <span>Toll Gate</span> <b>{gate.numeral}</b>
                </h3>
                <ul>
                  {gate.items.map((item) => (
                    <li key={item}>
                      <span aria-hidden="true">→</span> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <ApplyLink apply={apply} className="pg-apply--climb" />
        </div>
      </div>
    </section>
  );
}

function Proof({ proof }) {
  const lead = proof.metrics.filter((m) => /^(5\.4x|\$1B)$/.test(m.value));
  const rest = proof.metrics.filter((m) => !lead.includes(m));
  return (
    <section className="pg-proof" aria-labelledby="pg-proof-title">
      <div className="container">
        <div className="pg-proof-head">
          <div data-rise>
            {proof.label && <p className="pg-eyebrow">{proof.label}</p>}
            <h2 id="pg-proof-title" className="pg-title">
              {proof.title}
            </h2>
            {proof.link && (
              <SmartLink href={proof.link.href} className="pg-text-link">
                {words(proof.link)} <ArrowUpRight size={18} strokeWidth={1.5} />
              </SmartLink>
            )}
          </div>
          <p className="pg-proof-text" data-words>
            {proof.text.split(FIGURES).map((part, i) =>
              i % 2 ? <strong key={i}>{part}</strong> : part,
            )}
          </p>
        </div>
        <dl className="pg-ledger">
          {[...lead, ...rest].map((metric, i) => (
            <div
              key={metric.value}
              className={i < lead.length ? "pg-metric pg-metric--lead" : "pg-metric"}
            >
              <dt>{metric.label}</dt>
              <dd
                data-count={metric.number}
                data-final={metric.value}
                data-prefix={metric.prefix}
                data-suffix={metric.suffix}
                data-decimals={metric.decimals}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Reach({ reach, credits, page }) {
  const scale = reach.metrics.map((m) => {
    const unit = /B/.test(m.suffix) ? 1000 : 1;
    return m.number * unit;
  });
  const largest = Math.max(1, ...scale);
  const frame = credits.images.find((image) => !LOGO_ALT.some(([p]) => p.test(image.src)));
  const logos = credits.images.filter((image) => image !== frame);
  return (
    <section className="pg-reach">
      <div className="container">
        <h2 className="pg-title" data-rise>
          {reach.title}
        </h2>
        <div className="pg-bars">
          {reach.metrics.map((metric, i) => (
            <div className="pg-bar-row" key={metric.value}>
              <div className="pg-bar-figure">
                <span
                  className="pg-bar-value"
                  data-count={metric.number}
                data-final={metric.value}
                  data-prefix={metric.prefix}
                  data-suffix={metric.suffix}
                  data-decimals={metric.decimals}
                >
                  {metric.value}
                </span>
                <span className="pg-bar-label">{metric.label}</span>
              </div>
              <div className="pg-bar-track" aria-hidden="true">
                <span
                  className="pg-bar"
                  data-grow
                  style={{ width: `${(scale[i] / largest) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="pg-bars-note">Bars drawn to scale</p>
        </div>
        <div className="pg-credits">
          <h2 className="pg-credits-title" data-rise>
            {credits.title
              .split(/(3 Million\+)/)
              .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
          </h2>
          {frame && (
            <img
              className="pg-credits-window"
              src={imageSource(frame, page)}
              alt="The Anthill A, framing a skyline of towers and aerial vehicles"
              loading="lazy"
              width="800"
              height="660"
              data-rise
            />
          )}
          <ul className="pg-logos">
            {logos.map((logo) => (
              <li key={logo.src} data-rise>
                <img
                  src={imageSource(logo, page)}
                  alt={LOGO_ALT.find(([p]) => p.test(logo.src))?.[1] || ""}
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Close({ design, queries, apply, page }) {
  const [write, deadline] = queries.text.split(/(?=Applications open)/);
  return (
    <section className="pg-close">
      <div className="pg-close-copy">
        <div data-rise>
          <h2 className="pg-title">{design.title}</h2>
          <p className="pg-close-intro">{design.intro}</p>
        </div>
        <div className="pg-close-features">
          <p className="pg-eyebrow">{design.label}</p>
          <ul>
            {design.features.map((feature) => (
              <li key={feature.title} data-rise>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="pg-close-panel">
        <ApplyLink apply={apply} className="pg-apply--close" />
        <div className="pg-queries">
          <h2>{queries.title}</h2>
          <p>
            <InlineText text={(write || "").trim()} page={page} />
          </p>
          {deadline && <p>{deadline.trim()}</p>}
        </div>
      </div>
    </section>
  );
}

export default function ProgramsBody({ blocks, page }) {
  const root = useRef(null);
  const data = useMemo(() => readProgram(blocks, page), [blocks, page]);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(NO_MOTION_PREFERENCE, () => {
        const q = gsap.utils.selector(root);
        const once = (trigger, start = "top 88%") => ({
          trigger,
          start,
          once: true,
        });

        // Oversized type rises letter by letter out of a mask.
        for (const element of [
          ...q(".pg-apply--top .pg-apply-text"),
          ...q("[data-letters]"),
        ]) {
          const split = SplitText.create(element, { type: "chars" });
          gsap.from(split.chars, {
            yPercent: 112,
            duration: 0.95,
            ease: "power4.out",
            stagger: 0.022,
            scrollTrigger: once(element, "top 96%"),
          });
        }

        for (const element of q("[data-rise]")) {
          gsap.from(element, {
            y: 24,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: once(element),
          });
        }

        // The terraces unroll downward from the red band above them.
        for (const element of q("[data-unroll]")) {
          gsap.from(element, {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.5,
            ease: "power3.inOut",
            scrollTrigger: once(element, "top 90%"),
          });
          gsap.from(element.querySelector("img"), {
            scale: 1.14,
            duration: 2.1,
            ease: "power3.out",
            scrollTrigger: once(element, "top 90%"),
          });
        }

        for (const image of q("[data-drift]")) {
          gsap.fromTo(
            image,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: image.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }

        // The paragraph lights up word by word, the way the argument builds.
        for (const element of q("[data-words]")) {
          const split = SplitText.create(element, { type: "words" });
          gsap.from(split.words, {
            opacity: 0.18,
            duration: 0.5,
            ease: "none",
            stagger: 0.028,
            scrollTrigger: once(element, "top 78%"),
          });
        }

        // The real figure sits in the markup; it only counts up as it arrives.
        const counters = q("[data-count]");
        for (const element of counters) {
          const { count, prefix, suffix, decimals, final } = element.dataset;
          ScrollTrigger.create({
            ...once(element, "top 92%"),
            onEnter() {
              const counter = { value: 0 };
              gsap.to(counter, {
                value: Number(count),
                duration: 1.5,
                ease: "power3.out",
                onUpdate() {
                  element.textContent = `${prefix}${counter.value.toFixed(Number(decimals))}${suffix}`;
                },
                onComplete() {
                  element.textContent = final;
                },
              });
            },
          });
        }

        for (const element of q("[data-grow]")) {
          gsap.from(element, {
            scaleX: 0,
            duration: 1.5,
            ease: "power4.inOut",
            scrollTrigger: once(element.parentElement, "top 90%"),
          });
        }

        return () => {
          for (const element of counters) element.textContent = element.dataset.final;
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="programs-page" ref={root}>
        <ApplyLink apply={data.apply} className="pg-apply--top" />
        <Support support={data.support} />
        <Vision vision={data.vision} page={page} />
        <Climb process={data.process} apply={data.apply} />
        <Proof proof={data.proof} />
        <Reach reach={data.reach} credits={data.credits} page={page} />
        <Close
          design={data.design}
          queries={data.queries}
          apply={data.apply}
          page={page}
        />
      </div>
    </MotionConfig>
  );
}
