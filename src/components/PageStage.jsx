import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { HeroBackdrop } from "./PageBackdrop.jsx";
import { drawSurface } from "./growth-curve.js";
import StageVisual from "./StageVisuals.jsx";
import "./page-stage.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const STACKED = "(max-width: 900px)";

export default function PageStage({ pathname, title, description, label, back, quiet, visual }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const motionPaused = Boolean(reduced || paused);
  const root = useRef(null);
  const sky = useRef(null);
  const edge = useRef(null);
  const zone = useRef(null);
  const copy = useRef(null);
  const variation = [...pathname].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 97, 7);

  useGSAP(
    () => {
      const stage = root.current;
      const state = { t: 1.25, lift: 0 };
      let curve = { ground: 0.9, rise: 0.8, power: 5 };
      const draw = () => {
        if (sky.current) drawSurface(sky.current, edge.current, curve, state.t, state.lift);
      };
      // The curve is read from the layout so it can never run behind the copy.
      const measure = () => {
        const box = stage.getBoundingClientRect();
        if (matchMedia(STACKED).matches) {
          const area = zone.current.getBoundingClientRect();
          const top = (area.top - box.top) / box.height;
          const bottom = (area.bottom - box.top) / box.height;
          curve = { ground: bottom, rise: bottom - top, power: 2.4 };
        } else {
          const end = copy.current.getBoundingClientRect().bottom;
          const ground = Math.min(0.94, (end - box.top + 34) / box.height);
          curve = { ground, rise: ground - 0.1, power: 5 };
        }
        draw();
      };
      const observer = new ResizeObserver(measure);
      observer.observe(stage);

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(stage);
        const split = SplitText.create(q("h1"), {
          type: "words",
          mask: "words",
          wordsClass: "stage-word",
        });
        if (sky.current) state.t = -0.12;
        measure();
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro
          .from(split.words, { yPercent: 110, duration: 1, stagger: 0.05 }, 0.05)
          .from(q(".stage-top > *, .stage-description"), { y: 16, autoAlpha: 0, duration: 0.8, stagger: 0.06 }, 0.3)
          .to(state, { t: 1.25, duration: 1.8, ease: "power2.inOut", onUpdate: draw }, 0.1);
        const rising = q("[data-rise]");
        if (rising.length)
          intro.from(rising, { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, 0.55);
        const drawn = q("[data-draw]");
        if (drawn.length)
          intro.fromTo(
            drawn,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.3, stagger: 0.07, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" },
            0.45,
          );

        const leave = gsap.timeline({
          scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: true },
        });
        leave.to(q(".stage-copy, .stage-visual"), { y: -60, autoAlpha: 0, ease: "none", duration: 0.55 }, 0);
        if (sky.current) leave.to(state, { lift: 1, ease: "power1.in", duration: 1, onUpdate: draw }, 0);

        return () => {
          state.t = 1.25;
          state.lift = 0;
          split.revert();
        };
      });
      measure();

      return () => {
        observer.disconnect();
        media.revert();
      };
    },
    { scope: root },
  );

  const body = visual || (!quiet && <StageVisual pathname={pathname} />);
  return (
    <section
      ref={root}
      className={`page-stage${quiet ? " page-stage--quiet" : ""}${title.length > 30 ? " page-stage--long" : ""}`}
      data-paused={motionPaused}
    >
      {!quiet && (
        <>
          <div className="stage-silk">
            <HeroBackdrop paused={motionPaused} variation={variation} />
          </div>
          <svg className="stage-sky" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path ref={sky} className="stage-sky-fill" />
            <path ref={edge} className="stage-sky-edge" vectorEffect="non-scaling-stroke" />
          </svg>
        </>
      )}
      <div className="stage-inner">
        <div className="stage-copy" ref={copy}>
          <div className="stage-top">
            {back && (
              <Link className="stage-back" to={back.href}>
                <ArrowLeft size={15} /> {back.label}
              </Link>
            )}
            <span className="eyebrow">{label || "Anthill Ventures"}</span>
            {!quiet && !reduced && (
              <button
                type="button"
                className="stage-toggle"
                aria-label={paused ? "Resume background animation" : "Pause background animation"}
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            )}
          </div>
          <h1>{title}</h1>
          {description && <p className="stage-description">{description}</p>}
        </div>
        <div ref={zone} className="stage-zone" aria-hidden="true" />
        {body && <div className="stage-visual">{body}</div>}
      </div>
    </section>
  );
}
