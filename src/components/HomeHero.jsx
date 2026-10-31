import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play, X } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { HeroBackdrop } from "./PageBackdrop.jsx";
import { curveY, drawSurface, surfaceY } from "./growth-curve.js";
import BackgroundPaths from "./kokonutui/BackgroundPaths.jsx";
import CountUp from "./reactbits/CountUp.jsx";
import LogoLoop from "./reactbits/LogoLoop.jsx";
import RotatingText from "./reactbits/RotatingText.jsx";
import "./home-hero.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const MotionLink = motion.create(Link);

const outcomes = ["Healthier lives", "Cleaner energy", "Better city life"];

// Milestones climb the growth curve in order, ending at the mission itself.
const milestones = [
  { x: 0.07, to: 10, label: "Countries" },
  { x: 0.3, to: 70, suffix: "+", label: "Speed-scaling mentors" },
  { x: 0.53, to: 80, suffix: "+", label: "Startups backed", end: true },
  { x: 0.755, to: 1, prefix: "$", suffix: "B+", label: "Follow-on capital", end: true },
  { x: 0.955, to: 1, suffix: "B", label: "People to reach", end: true, goal: true },
];

const DESKTOP_CURVE = { ground: 0.885, rise: 0.8, power: 5 };
const STACKED = "(max-width: 1100px)";

function BrandFilm({ poster, motionPaused }) {
  const dialog = useRef(null);
  const video = useRef(null);
  const preview = useRef(null);
  const inView = useInView(preview);
  useEffect(() => {
    const element = preview.current;
    if (!element) return;
    if (!motionPaused && inView && matchMedia(`not all and ${STACKED}`).matches)
      element.play().catch(() => {});
    else element.pause();
  }, [motionPaused, inView]);
  return (
    <>
      <motion.button
        type="button"
        className="hero-film"
        whileHover="hover"
        whileTap={{ scale: 0.985 }}
        onClick={() => dialog.current.showModal()}
      >
        <span className="hero-film-media">
          <motion.video
            ref={preview}
            variants={{ hover: { scale: 1.05 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            src="/media/films/scale-with-speed-desktop.mp4"
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </span>
        <span className="hero-film-label">
          <span className="film-play">
            <Play size={14} />
          </span>
          Watch the film
        </span>
      </motion.button>
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
        <video ref={video} controls playsInline preload="none" poster={poster}>
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

export default function HomeHero({ lead, poster, logos }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [lit, setLit] = useState(reduced ? milestones.length : 0);
  const motionPaused = Boolean(reduced || paused);
  const root = useRef(null);
  const sky = useRef(null);
  const edge = useRef(null);
  const head = useRef(null);
  const zone = useRef(null);
  const litRef = useRef(lit);

  useGSAP(
    () => {
      const hero = root.current;
      const state = { t: 1.25 };
      let curve = DESKTOP_CURVE;

      const draw = () => {
        drawSurface(sky.current, edge.current, curve, state.t, 0);
        const x = Math.min(state.t, 0.955);
        head.current.style.left = `${x * 100}%`;
        head.current.style.top = `${surfaceY(x, curve, state.t, 0) * 100}%`;
        const reached = milestones.filter((m) => m.x <= state.t).length;
        if (reached > litRef.current) {
          litRef.current = reached;
          setLit(reached);
        }
      };

      // Stacked layouts read the curve from the empty zone between the copy and the proof.
      const measure = () => {
        if (!matchMedia(STACKED).matches) curve = DESKTOP_CURVE;
        else {
          const heroBox = hero.getBoundingClientRect();
          const zoneBox = zone.current.getBoundingClientRect();
          const top = (zoneBox.top - heroBox.top) / heroBox.height;
          const bottom = (zoneBox.bottom - heroBox.top) / heroBox.height;
          curve = { ground: bottom, rise: bottom - top, power: 2.6 };
        }
        draw();
      };
      const observer = new ResizeObserver(measure);
      observer.observe(hero);

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(hero);
        const splits = q("[data-split]").map((line) =>
          SplitText.create(line, {
            type: "words",
            mask: "words",
            wordsClass: "hero-word",
            aria: "none",
          }),
        );
        state.t = -0.12;
        measure();

        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro
          .from(splits[0].words, { yPercent: 110, duration: 1.1, stagger: 0.08 }, 0.15)
          .from(q(".hero-rotator"), { clipPath: "inset(0 100% 0 0)", duration: 0.9, ease: "power4.inOut", clearProps: "clipPath" }, 0.35)
          .from(splits[1].words, { yPercent: 110, duration: 1.1, stagger: 0.05 }, 0.55)
          .from(q(".hero-lead, .hero-actions > *"), { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0.8)
          .to(state, { t: 1.25, duration: 2.9, ease: "power2.inOut", onUpdate: draw }, 0.2)
          .fromTo(q(".hero-head"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.5)
          .fromTo(q(".hero-trail"), { scaleY: 0, autoAlpha: 1 }, { scaleY: 1, duration: 0.7, ease: "power3.in" }, 2.35)
          .to(q(".hero-trail"), { autoAlpha: 0, duration: 0.8, ease: "power1.out" }, 3.05)
          .from(q(".hero-film"), { clipPath: "inset(100% 0 0 0)", duration: 1, ease: "power4.inOut", clearProps: "clipPath" }, 2.1)
          .from(q(".hero-rail"), { autoAlpha: 0, duration: 1 }, 2.2);

        gsap
          .timeline({
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          })
          .to(q(".hero-sky"), { yPercent: -100, ease: "power1.in", duration: 1 }, 0)
          .to(q(".hero-copy"),{ y: -90, autoAlpha: 0, ease: "none", duration: 0.45 }, 0)
          .to(q(".hero-proof, .hero-film, .hero-rail, .hero-head, .hero-trail"), { autoAlpha: 0, ease: "none", duration: 0.16 }, 0);

        return () => {
          state.t = 1.25;
          splits.forEach((split) => split.revert());
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

  return (
    <section
      ref={root}
      className="home-hero home-section"
      aria-labelledby="hero-title"
    >
      <div className="hero-silk">
        <HeroBackdrop paused={motionPaused} />
      </div>
      <svg
        className="hero-sky"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path ref={sky} className="hero-sky-fill" />
        <path ref={edge} className="hero-sky-edge" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="hero-stars" aria-hidden="true" />
      <div className="hero-paths" aria-hidden="true">
        <BackgroundPaths
          color="#ffc9ce"
          count={18}
          fade
          angle={-24}
          spread={0.7}
          speed={0.6}
          paused={motionPaused}
        />
      </div>
      <span ref={head} className="hero-head" aria-hidden="true">
        <span className="hero-trail" />
      </span>

      <div className="hero-inner">
        <div className="hero-copy">
          <h1
            id="hero-title"
            aria-label="Fearless founders. Healthier lives, cleaner energy and better city life for a billion people."
          >
            <span className="hero-line" data-split>
              Fearless founders.
            </span>
            <span className="hero-line hero-line--rotating">
              <span className="hero-rotator">
                <RotatingText
                  texts={outcomes}
                  highlight
                  highlightColor="#e6212b"
                  effect="slide"
                  staggerDuration={0.016}
                  rotationInterval={3400}
                  auto={!motionPaused}
                />
              </span>
            </span>
            <span className="hero-line" data-split>
              for a billion people.
            </span>
          </h1>
          <p className="hero-lead">{lead}</p>
          <div className="hero-actions">
            <MotionLink className="hero-cta" to="/contact" whileHover="hover" whileTap={{ scale: 0.98 }}>
              Pitch your startup
              <motion.span variants={{ hover: { x: 3, y: -3 } }}>
                <ArrowUpRight size={20} />
              </motion.span>
            </MotionLink>
            <MotionLink className="hero-cta hero-cta--ghost" to="/portfolio" whileHover="hover" whileTap={{ scale: 0.98 }}>
              See the portfolio
              <motion.span variants={{ hover: { x: 3, y: -3 } }}>
                <ArrowUpRight size={20} />
              </motion.span>
            </MotionLink>
            {/* The pause control stays, as an icon, because the background moves continuously. */}
            {!reduced && (
              <button
                type="button"
                className="atmosphere-toggle"
                aria-label={paused ? "Resume background animation" : "Pause background animation"}
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
          </div>
        </div>

        <BrandFilm poster={poster} motionPaused={motionPaused} />

        <div ref={zone} className="hero-curve-zone" aria-hidden="true" />

        <dl className="hero-proof">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.label}
              className={`hero-marker${milestone.end ? " hero-marker--end" : ""}${milestone.goal ? " hero-marker--goal" : ""}`}
              data-lit={index < lit}
              style={{
                "--x": `${milestone.x * 100}%`,
                "--y": `${curveY(milestone.x, DESKTOP_CURVE) * 100}%`,
              }}
            >
              <dt>{milestone.label}</dt>
              <dd>
                <CountUp
                  to={milestone.to}
                  prefix={milestone.prefix}
                  suffix={milestone.suffix}
                  mode="roll"
                  trigger="load"
                  duration={1}
                  startWhen={index < lit}
                />
              </dd>
            </div>
          ))}
        </dl>

        <div className="hero-rail">
          <span className="hero-rail-label">In the portfolio</span>
          <LogoLoop
            logos={logos}
            speed={motionPaused ? 0 : 34}
            logoHeight={44}
            gap={44}
            draggable={false}
            fadeOutWidth={0.06}
            ariaLabel="Portfolio companies"
          />
        </div>
      </div>
    </section>
  );
}
