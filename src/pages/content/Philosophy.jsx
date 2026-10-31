import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import {
  SmartLink,
  enrichBlocks,
  groupSections,
  sectionFeatures,
  words,
} from "./core.jsx";
import "./philosophy.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// A once-only reveal mounted with its start already scrolled past would otherwise never play.
const settlePassed = () =>
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.once && !st.vars.scrub && st.animation && st.scroll() >= st.start)
      st.animation.play();
  });

// One line through four panels, each 320 x 340. Panels meet edge to edge at y = 155.
// Every label is taken from that step's copy, which sits in full just below the drawing.
const FLOW = [
  {
    paths: [
      ["thin", "M0 50C170 50 190 155 320 155"],
      ["thin", "M0 120C150 120 190 155 320 155"],
      ["thin", "M0 190C150 190 190 155 320 155"],
      ["thin", "M0 260C170 260 190 155 320 155"],
    ],
    labels: [
      ["Accelerators", 0, 26],
      ["Universities", 0, 96],
      ["Venture partners", 0, 197],
      ["Industry experts", 0, 267],
    ],
  },
  {
    paths: [["main", "M0 155H320"]],
    node: true,
    labels: [
      ["Seed to Series A", 0, 127],
      ["Scalability Quotient", 160, 184, "center"],
    ],
  },
  {
    paths: [
      ["main", "M0 155H320"],
      ["thin", "M0 155C120 155 140 55 320 55"],
      ["thin", "M0 155C120 155 140 255 320 255"],
    ],
    labels: [
      ["100 plus market access channels", 312, 30, "end"],
      ["Domain mentors", 312, 127, "end"],
      ["Strategic networks", 312, 262, "end"],
    ],
  },
  {
    paths: [
      ["thin", "M0 55C150 55 260 50 320 22"],
      ["thin", "M0 255C170 255 240 170 320 22"],
      ["partner", "M16 300C150 300 250 200 320 22"],
      ["partner", "M92 300C190 290 270 170 320 22"],
      ["partner", "M210 300C260 270 295 160 320 22"],
      ["main", "M0 155C170 155 250 120 320 22"],
    ],
    end: true,
    labels: [
      ["Angels", 8, 306],
      ["Family offices", 84, 306],
      ["Institutional partners", 202, 306],
    ],
  },
];

function FlowDrawing({ panel }) {
  return (
    <div className="phil-drawing" aria-hidden="true">
      <svg viewBox="0 0 320 340">
        {panel.paths.map(([kind, d]) => (
          <path className={`phil-strand phil-strand--${kind}`} d={d} pathLength="1" key={d} />
        ))}
        {panel.node && <rect className="phil-node" x="142" y="137" width="36" height="36" />}
        {panel.end && <rect className="phil-node" x="306" y="15" width="14" height="14" />}
      </svg>
      {panel.labels.map(([text, x, y, align]) => (
        <span
          className={`phil-tag${align ? ` phil-tag--${align}` : ""}`}
          style={{
            [align === "end" ? "right" : "left"]: `${((align === "end" ? 320 - x : x) / 320) * 100}%`,
            top: `${(y / 340) * 100}%`,
          }}
          key={text}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

// The wheel. Wedges are placed so the left column reads down its side and the right down its own.
const OUTER = 200;
const INNER = 92;
const COUNT_LEFT = 5;
const angleOf = (i) => (i < COUNT_LEFT ? 350 - 40 * i : 30 + 40 * (i - COUNT_LEFT));
const polar = (radius, degrees) => {
  const a = (degrees * Math.PI) / 180;
  return [radius * Math.sin(a), -radius * Math.cos(a)];
};
const wedgePath = (i) => {
  const centre = angleOf(i);
  const from = centre - 19;
  const to = centre + 19;
  const [x1, y1] = polar(OUTER, from);
  const [x2, y2] = polar(OUTER, to);
  const [x3, y3] = polar(INNER, to);
  const [x4, y4] = polar(INNER, from);
  return `M${x1} ${y1}A${OUTER} ${OUTER} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${INNER} ${INNER} 0 0 0 ${x4} ${y4}Z`;
};
const WEDGES = Array.from({ length: 9 }, (_, i) => wedgePath(i));

function PillarGlyph({ index }) {
  return (
    <svg className="phil-glyph" viewBox="-210 -210 420 420" aria-hidden="true">
      {WEDGES.map((d, i) => (
        <path d={d} className={i === index ? "is-own" : ""} key={d} />
      ))}
    </svg>
  );
}

function Pillar({ pillar, index, active, pinned, onHover, onPin }) {
  return (
    <li
      className={`phil-pillar${active ? " is-active" : ""}`}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(null)}
    >
      <PillarGlyph index={index} />
      <div>
        <h3>
          <button
            type="button"
            aria-pressed={pinned}
            onClick={() => onPin(index)}
            onFocus={() => onHover(index)}
            onBlur={() => onHover(null)}
          >
            {pillar.title}
          </button>
        </h3>
        {pillar.text.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    </li>
  );
}

function PillarWheel({ pillars }) {
  const stage = useRef(null);
  const wheel = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  // All wedges start lit, so the diagram is complete without JavaScript or motion.
  const [lit, setLit] = useState(pillars.length);
  const [leaders, setLeaders] = useState([]);

  const chosen = hovered ?? pinned;
  const cursor = lit > 0 && lit < pillars.length ? lit - 1 : null;
  const current = chosen ?? cursor;
  const left = pillars.slice(0, COUNT_LEFT);
  const right = pillars.slice(COUNT_LEFT);
  const togglePin = (i) => setPinned((value) => (value === i ? null : i));

  // Leader lines are measured from the layout so they always reach their row.
  useEffect(() => {
    const box = stage.current;
    const circle = wheel.current;
    if (!box || !circle) return undefined;
    const wide = window.matchMedia("(min-width: 1100px)");
    const measure = () => {
      if (!wide.matches) {
        setLeaders([]);
        return;
      }
      const frame = box.getBoundingClientRect();
      const disc = circle.getBoundingClientRect();
      const radius = (disc.width / 2) * (OUTER / 210);
      const cx = disc.left + disc.width / 2 - frame.left;
      const cy = disc.top + disc.height / 2 - frame.top;
      const rows = box.querySelectorAll(".phil-pillar");
      setLeaders(
        [...rows].map((row, i) => {
          const rect = row.getBoundingClientRect();
          const title = row.querySelector("button").getBoundingClientRect();
          const onLeft = i < COUNT_LEFT;
          const x0 = (onLeft ? rect.right + 12 : rect.left - 12) - frame.left;
          const y0 = title.top + Math.min(title.height / 2, 15) - frame.top;
          const [px, py] = polar(radius, angleOf(i));
          const elbow = x0 + (onLeft ? 16 : -16);
          return {
            line: `M${x0} ${y0}H${elbow}L${cx + px} ${cy + py}`,
            tip: `M${cx + px} ${cy + py}h0`,
          };
        }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    wide.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", measure);
    };
  }, []);

  // The assessment runs as the section passes: each wedge fills in turn and stays filled.
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const total = pillars.length;
        const show = (self) => {
          const next = Math.ceil(self.progress * total);
          setLit((value) => Math.max(value, next));
        };
        setLit(0);
        const trigger = ScrollTrigger.create({
          trigger: stage.current,
          start: "top 68%",
          end: "bottom 78%",
          onUpdate: show,
          onRefresh: show,
          onLeave: () => setLit(total),
        });
        return () => {
          trigger.kill();
          setLit(total);
        };
      });
      return () => media.revert();
    },
    { scope: stage },
  );

  return (
    <div className="phil-stage" ref={stage}>
      {leaders.length > 0 && (
        <svg className="phil-leaders" aria-hidden="true">
          {leaders.map(({ line, tip }, i) => (
            <g className={current === i ? "is-active" : ""} key={line}>
              <path d={line} />
              <path className="phil-leader-tip" d={tip} />
            </g>
          ))}
        </svg>
      )}
      <ul className="phil-column phil-column--left">
        {left.map((pillar, i) => (
          <Pillar
            pillar={pillar}
            index={i}
            active={current === i}
            pinned={pinned === i}
            onHover={setHovered}
            onPin={togglePin}
            key={pillar.title}
          />
        ))}
      </ul>
      <div className="phil-wheel" ref={wheel} aria-hidden="true">
        <svg viewBox="-210 -210 420 420">
          {WEDGES.map((d, i) => (
            <path
              d={d}
              className={`phil-wedge${i < lit ? " is-lit" : ""}${current === i ? " is-current" : ""}`}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              onClick={() => togglePin(i)}
              key={d}
            />
          ))}
        </svg>
        <svg className="phil-wheel-rings" viewBox="-210 -210 420 420">
          <circle r="128" />
          <circle r="164" />
        </svg>
        <div className="phil-wheel-core">
          {current === null ? (
            <>
              <strong>{pillars.length}</strong>
              <span>areas</span>
            </>
          ) : (
            <em key={current}>{pillars[current].title}</em>
          )}
        </div>
      </div>
      <ul className="phil-column phil-column--right">
        {right.map((pillar, i) => (
          <Pillar
            pillar={pillar}
            index={i + COUNT_LEFT}
            active={current === i + COUNT_LEFT}
            pinned={pinned === i + COUNT_LEFT}
            onHover={setHovered}
            onPin={togglePin}
            key={pillar.title}
          />
        ))}
      </ul>
    </div>
  );
}

export default function PhilosophyBody({ blocks, page }) {
  const root = useRef(null);
  const sections = groupSections(enrichBlocks(blocks, page));
  const invest = sections.find((s) => /how we invest/i.test(s.title));
  const framework = sections.find((s) => /nine areas/i.test(s.title));

  const steps = (invest?.blocks || [])
    .filter((b) => b.href && words(b).includes(" Overview "))
    .map((b) => {
      const [heading, ...body] = words(b).split(" Overview ");
      const [, number, name] = heading.match(/^(\d+\.)\s*(.*)$/) || [null, "", heading];
      return { number, name, body: body.join(" Overview "), href: b.href };
    });

  const { features, leading } = sectionFeatures(framework?.blocks || []);
  const portfolio = leading.find((b) => b.href);
  const pillars = features.map((f) => ({
    title: f.title,
    text: f.blocks.map(words).filter((t) => t && !/^\d{1,2}$/.test(t)),
  }));

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          wide: "(prefers-reduced-motion: no-preference) and (min-width: 1100px)",
        },
        (context) => {
          if (!context.conditions.motion) return undefined;
          const q = gsap.utils.selector(root);
          const splits = q(".phil-rise").map((el) =>
            SplitText.create(el, { type: "words", mask: "words" }),
          );
          splits.forEach((split, i) =>
            gsap.from(split.words, {
              yPercent: 110,
              duration: 1.1,
              stagger: 0.06,
              ease: "expo.out",
              // The mask would clip descenders if it stayed, so the split is undone once it lands.
              onComplete: () => split.revert(),
              scrollTrigger: { trigger: q(".phil-rise")[i], start: "top 88%", once: true },
            }),
          );

          const drawPanel = (panel) => {
            const local = gsap.utils.selector(panel);
            const tl = gsap.timeline({ defaults: { ease: "none" } });
            tl.fromTo(
              local(".phil-strand"),
              { strokeDasharray: 1, strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1, stagger: 0.05 },
            );
            tl.from(local(".phil-node"), { autoAlpha: 0, duration: 0.2 }, 0.5);
            tl.from(local(".phil-tag"), { autoAlpha: 0, duration: 0.3, stagger: 0.06 }, 0.2);
            return tl;
          };
          const panels = q(".phil-step");
          if (context.conditions.wide) {
            const master = gsap.timeline({
              scrollTrigger: {
                trigger: q(".phil-flow"),
                start: "top 82%",
                end: "top 12%",
                scrub: 0.6,
                once: true,
              },
            });
            panels.forEach((panel) => master.add(drawPanel(panel)));
          } else {
            panels.forEach((panel) => {
              const drawn = drawPanel(panel);
              ScrollTrigger.create({
                trigger: panel,
                start: "top 84%",
                end: "top 28%",
                animation: drawn,
                scrub: 0.5,
                once: true,
              });
            });
          }
          gsap.from(q(".phil-step-copy"), {
            y: 26,
            autoAlpha: 0,
            duration: 1,
            stagger: 0.09,
            ease: "expo.out",
            scrollTrigger: { trigger: q(".phil-step-copy")[0], start: "top 90%", once: true },
          });

          const close = SplitText.create(q(".phil-close-word"), { type: "chars", mask: "chars" });
          gsap.from(close.chars, {
            yPercent: 110,
            duration: 1,
            stagger: 0.022,
            ease: "expo.out",
            onComplete: () => close.revert(),
            scrollTrigger: { trigger: q(".phil-close"), start: "top 92%", once: true },
          });

          ScrollTrigger.addEventListener("refresh", settlePassed);
          gsap.delayedCall(0.1, settlePassed);

          return () => {
            ScrollTrigger.removeEventListener("refresh", settlePassed);
            splits.forEach((split) => split.revert());
            close.revert();
          };
        },
      );
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="philosophy-page" ref={root}>
        {invest && (
          <section className="phil-invest">
            <div className="container">
              <header className="phil-head">
                {invest.label && <p className="phil-eyebrow">{invest.label}</p>}
                <h2 className="phil-rise">{invest.title}</h2>
              </header>
              <ol className="phil-flow">
                {steps.map((step, i) => (
                  <li className="phil-step" key={step.name}>
                    {FLOW[i] && <FlowDrawing panel={FLOW[i]} />}
                    <div className="phil-step-copy">
                      <span className="phil-step-number">{step.number}</span>
                      <h3>
                        <SmartLink href={step.href} aria-label={`${step.name}: About Anthill`}>
                          {step.name}
                          <ArrowUpRight aria-hidden="true" />
                        </SmartLink>
                      </h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {framework && (
          <section className="phil-framework">
            <div className="container">
              <header className="phil-head">
                {framework.label && <p className="phil-eyebrow">{framework.label}</p>}
                <h2 className="phil-rise">{framework.title}</h2>
              </header>
              <PillarWheel pillars={pillars} />
            </div>
          </section>
        )}

        {portfolio && (
          <motion.section className="phil-close" whileHover="hover">
            <SmartLink href={portfolio.href}>
              <span className="container phil-close-inner">
                <span className="phil-close-word">{words(portfolio)}</span>
                <motion.span
                  className="phil-close-arrow"
                  variants={{ hover: { x: 10, y: -10 } }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ArrowUpRight aria-hidden="true" />
                </motion.span>
              </span>
            </SmartLink>
          </motion.section>
        )}
      </div>
    </MotionConfig>
  );
}
