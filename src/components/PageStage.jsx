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
// These visuals are drawn on the night, so the silk waits underneath them.
const CLEAR_OF_SILK = ["philosophy", "contact"];

// "/team" is "team", "/team/mike-binn" is "team-detail": every layout hangs off this one key.
const routeKey = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length > 1 ? `${parts[0]}-detail` : parts[0] || "home";
};

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
      const state = { t: 1.25 };
      let curve = { ground: 0.9, rise: 0.8, power: 5 };
      const draw = () => {
        if (sky.current) drawSurface(sky.current, edge.current, curve, state.t, 0);
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
          const clear = CLEAR_OF_SILK.includes(stage.dataset.route);
          const held = clear ? stage.querySelector(".stage-visual") : null;
          const end = Math.max(
            copy.current.getBoundingClientRect().bottom,
            held ? held.getBoundingClientRect().bottom : 0,
          );
          const ground = Math.min(0.94, (end - box.top + 34) / box.height);
          curve = { ground, rise: ground - 0.1, power: clear ? 18 : 5 };
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
        const faded = q("[data-fade]");
        if (faded.length)
          intro.from(faded, { autoAlpha: 0, duration: 0.9, stagger: 0.025, ease: "power1.out" }, 0.5);
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
        // Copy and the visuals drawn on the night fade before the silk reaches them. The solid
        // visuals stay opaque, so the curve and silk never show through them mid-fade.
        const onNight = CLEAR_OF_SILK.includes(stage.dataset.route);
        leave.to(q(onNight ? ".stage-copy, .stage-visual" : ".stage-copy"), { y: -60, autoAlpha: 0, ease: "none", duration: 0.42 }, 0);
        if (!onNight) leave.to(q(".stage-visual"), { y: -60, ease: "none", duration: 0.42 }, 0);
        // The flood moves the night as one layer, so scrolling never redraws the curve.
        if (sky.current) leave.to(q(".stage-sky"), { yPercent: -100, ease: "power1.in", duration: 1 }, 0);

        return () => {
          state.t = 1.25;
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
      className={`page-stage${quiet ? " page-stage--quiet" : ""}${title.length > 30 ? " page-stage--long" : ""}${body ? "" : " page-stage--plain"}`}
      data-route={routeKey(pathname)}
      data-paused={motionPaused}
    >
      {quiet ? (
        // Reading pages keep the growth line, drawn once, without the silk.
        <svg className="stage-quiet-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 96 C52 96 84 92 100 8" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
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
