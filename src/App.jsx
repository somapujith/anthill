import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowUpRight, X, Instagram, Linkedin, Pause, Play } from "lucide-react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Home from "./pages/Home.jsx";
import ContentPage from "./pages/ContentPage.jsx";
import { HeroBackdrop } from "./components/PageBackdrop.jsx";
import RotatingText from "./components/reactbits/RotatingText.jsx";
import { footerLines } from "./components/footer-lines.js";
import { drawSurface, surfaceY } from "./components/growth-curve.js";
import site from "./data/view-content.json";

gsap.registerPlugin(SplitText, useGSAP);

const MotionLink = motion.create(Link);

export const navigation = [
  ["About", "/about"],
  ["Philosophy", "/philosophy"],
  ["Programs", "/programs"],
  ["Portfolio", "/portfolio"],
  ["Speed Scalers", "/speedscalers"],
  ["Stories", "/stories"],
  ["Insights", "/insights"],
  ["Team", "/team"],
  ["Contact", "/contact"],
];

const EMAIL = "Info@anthillventures.com";

const offices = [
  ["India", ["Ramanaidu Studios", "Road 79, Jubilee Hills", "Hyderabad, 500096"]],
  ["Singapore", ["10 Cross Street #05-101", "Office 50/77", "Singapore, 048417"]],
];

const menuLinks = [["Home", "/"], ...navigation];

// Every preview is real site media with copy already approved for that route.
const routePreviews = {
  "/": {
    image: "/media/732903b48-688607114822f4cb467009bd_SacleWithSpeed_Desktop-poster-00001.jpg",
    label: "Scale with speed",
    text: "We back founders building businesses in health, climate and urban life, with capital, mentorship and market access.",
  },
  "/about": {
    image: "/media/8ba94c061-6877b8b9d23b5775854a8dc9_About-Page2.jpg",
    label: "Our Story",
    text: "We invest in early-stage companies and work with founders on funding, mentorship and market access.",
  },
  "/philosophy": {
    image: "/media/63e5310a9-68934ed67a10c02ee111c4f1_6374e2e7d4aaaa538dc8c1d44d373629_team-hands-red.jpg",
    label: "How we invest",
    text: "Capital, mentorship and market access for companies working in health, climate and urban lifestyles.",
  },
  "/programs": {
    image: "/media/ba8dd5359-68fd9b299887c2486c8b5a4d_4273a5398a082f8049a8b4cd28e9d281_sphere.jpg",
    label: "Anthill for India 2030",
    text: "Our venture scaling program brings early-stage companies access to capital, industry expertise and distribution networks.",
  },
  "/portfolio": {
    image: "/media/972ed1762-6899a24adf139b9dcc4990ce_superhuman-creative.jpg",
    tiles: [
      "/media/972ed1762-6899a24adf139b9dcc4990ce_superhuman-creative.jpg",
      "/media/0533d1bb8-6899a269d29fc223a20aad16_Broadway-stories-Creative.jpg",
      "/media/978efea45-6899a279889bb95f7a49e511_deepholistics.jpg",
      "/media/a027f3875-6899a291d1cc58fee12b1d7a_zypp-electric.jpg",
      "/media/13bf3b79b-6899a2ae5c03e1dc4e6e971e_boldcare.jpg",
      "/media/3d937f380-6899a2bb39288fa31fdd77d3_Ikonz.jpg",
    ],
    label: "80+ startups backed",
    text: "Explore the companies in our portfolio across health, consumer, urban tech and media.",
  },
  "/speedscalers": {
    image: "/media/472c76f31-6883770033892550496c09f0_Rana-Daggubati.jpg",
    position: "50% 18%",
    label: "70+ speed-scaling mentors",
    text: "Meet the founders, operators and industry specialists in Anthill's mentorship network.",
  },
  "/stories": {
    image: "/media/75301b3aa-698c4d61fa3181dd37a1b51b_33.jpg",
    label: "Building the Anthill",
    text: "Founder interviews, conversations and news from across the Anthill network.",
  },
  "/insights": {
    image: "/media/692625aa6-6a231e2f5928d78f289332a7_ab537100-6880-48bd-bf24-4aefe3477a2a.png",
    position: "50% 30%",
    label: "Climate Impact Report",
    text: "Reports and playbooks on company building, market trends and our portfolio's impact.",
  },
  "/team": {
    image: "/media/258c809a0-685d02954459dc2f7a2a3394_prasad.jpg",
    position: "50% 12%",
    label: "Prasad Vanga, Founder & CEO",
    text: "Meet the investment and operations team working with Anthill's founders and portfolio companies.",
  },
  "/contact": {
    image: "/brand/mark-red.svg",
    mark: true,
    label: "IND / USA / SG",
    text: "Have a question? Want to work with us?",
  },
};

// Detail routes belong to the section that lists them.
const parentRoutes = { "/mentors": "/speedscalers", "/playbooks": "/insights" };
function sectionOf(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (routePreviews[path]) return path;
  const root = "/" + path.split("/")[1];
  const section = parentRoutes[root] || root;
  return routePreviews[section] ? section : null;
}

const socialLinks = (site.shared?.footerLinks || [])
  .filter((x) => /linkedin\.com|x\.com|instagram\.com/.test(x.href))
  .map((x) => ({
    ...x,
    text: x.href.includes("linkedin")
      ? "LinkedIn"
      : x.href.includes("instagram")
        ? "Instagram"
        : "X",
  }));

function Socials({ className }) {
  return (
    <div className={className}>
      {socialLinks.map((x) => (
        <a key={x.href} href={x.href} target="_blank" rel="noreferrer" aria-label={`Anthill on ${x.text}`} title={x.text}>
          {x.text === "Instagram" ? (
            <Instagram size={20} aria-hidden="true" />
          ) : x.text === "LinkedIn" ? (
            <Linkedin size={20} aria-hidden="true" />
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.4L5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
            </svg>
          )}
        </a>
      ))}
    </div>
  );
}

function Offices({ className }) {
  return (
    <div className={className}>
      {offices.map(([place, lines]) => (
        <address key={place}>
          <span>{place}</span>
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
      ))}
    </div>
  );
}

const MENU_STACKED = "(max-width: 900px)";
const MENU_CURVE = { ground: 1.02, rise: 0.96, power: 5.2 };
const MENU_CURVE_STACKED = { ground: 1.02, rise: 0.46, power: 3.6 };

function MenuOverlay({ panel, pathname, onClose }) {
  const reduced = useReducedMotion();
  const current = sectionOf(pathname);
  const [active, setActive] = useState(current || "/");
  const sky = useRef(null);
  const edge = useRef(null);

  useGSAP(
    () => {
      const state = { t: 1.25 };
      const draw = () =>
        drawSurface(
          sky.current,
          edge.current,
          matchMedia(MENU_STACKED).matches ? MENU_CURVE_STACKED : MENU_CURVE,
          state.t,
          0,
        );
      draw();
      window.addEventListener("resize", draw);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(panel.current);
        state.t = -0.12;
        draw();
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .to(state, { t: 1.25, duration: 1.7, ease: "power2.inOut", onUpdate: draw }, 0.1)
          .from(q(".menu-link-text"), { yPercent: 118, duration: 1, stagger: 0.05 }, 0.18)
          .from(q(".menu-link-thumb, .menu-link-here"), { opacity: 0, duration: 0.7, stagger: 0.03 }, 0.4)
          .from(q(".menu-top-label, .menu-contact > *"), { y: 14, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.6)
          .from(q(".menu-preview"), { clipPath: "inset(100% 0 0 0)", duration: 1.05, ease: "power4.inOut", clearProps: "clipPath" }, 0.3);
        return () => {
          state.t = 1.25;
        };
      });
      return () => {
        window.removeEventListener("resize", draw);
        media.revert();
      };
    },
    { scope: panel },
  );

  return (
    <motion.div
      id="site-menu"
      ref={panel}
      className="menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Explore Anthill"
      initial={reduced ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)" }}
      animate={reduced ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
      exit={reduced ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
      transition={{ duration: reduced ? 0.01 : 0.62, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="menu-silk" aria-hidden="true">
        <HeroBackdrop variation={5} />
      </div>
      <svg className="menu-sky" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path ref={sky} className="menu-sky-fill" />
        <path ref={edge} className="menu-sky-edge" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="night-stars" aria-hidden="true" />

      <div className="menu-scroll">
        <div className="menu-top">
          <Link to="/" className="brand" aria-label="Anthill Ventures home" onClick={onClose}>
            <img src="/brand/logo-red-white.svg" alt="Anthill Ventures" width="154" height="54" />
          </Link>
          <span className="eyebrow menu-top-label">Explore Anthill</span>
          <button type="button" className="icon-button menu-close" onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <div className="menu-body">
          <div className="menu-main">
            <nav aria-label="All pages" className="menu-links">
              {menuLinks.map(([name, path], index) => {
                const isCurrent = current === path;
                const preview = routePreviews[path];
                return (
                  <Link
                    to={path}
                    key={path}
                    className={`menu-link${isCurrent ? " is-current" : ""}`}
                    aria-current={isCurrent ? "page" : undefined}
                    style={{ "--climb": ((menuLinks.length - 1 - index) / (menuLinks.length - 1)) ** 2.6 }}
                    onClick={onClose}
                    onMouseEnter={() => setActive(path)}
                    onFocus={() => setActive(path)}
                  >
                    <span className="menu-link-mask">
                      <span className="menu-link-text">{name}</span>
                    </span>
                    {isCurrent && <span className="menu-link-here">You are here</span>}
                    <ArrowUpRight className="menu-link-arrow" aria-hidden="true" />
                    <span className={`menu-link-thumb${preview.mark ? " is-mark" : ""}`} aria-hidden="true">
                      <img src={preview.image} alt="" loading="lazy" style={{ objectPosition: preview.position }} />
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="menu-contact">
              <Offices className="menu-offices" />
              <div className="menu-reach">
                <a className="menu-email" href={`mailto:${EMAIL}`}>
                  {EMAIL} <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <span className="menu-regions">IND / USA / SG</span>
                <Socials className="menu-socials" />
              </div>
            </div>
          </div>

          <div className="menu-preview" aria-hidden="true">
            {menuLinks.map(([, path]) => {
              const preview = routePreviews[path];
              return (
                <figure key={path} className="menu-preview-item" data-active={active === path}>
                  <span className={`menu-preview-media${preview.mark ? " is-mark" : ""}${preview.tiles ? " is-tiles" : ""}`}>
                    {(preview.tiles || [preview.image]).map((src) => (
                      <img key={src} src={src} alt="" loading="lazy" style={{ objectPosition: preview.position }} />
                    ))}
                  </span>
                  <figcaption>
                    <span className="menu-preview-label">{preview.label}</span>
                    <span className="menu-preview-text">{preview.text}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const [atTop, setAtTop] = useState(() => window.scrollY <= 24);
  useMotionValueEvent(scrollY, "change", (y) => setAtTop(y <= 24));
  const location = useLocation();
  const staged =
    location.pathname === "/" ||
    Boolean(site.pages[location.pathname.replace(/\/$/, "")]);
  const overHero = staged && atTop;
  const toggle = useRef(null);
  const panel = useRef(null);
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    const background = [
      ...document.querySelectorAll(".site-header, #main-content, .site-footer"),
    ];
    const inertState = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    panel.current?.querySelector(".menu-close")?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab") {
        const els = panel.current?.querySelectorAll("a,button");
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.body.style.paddingRight = previousPadding;
      background.forEach((element, index) => {
        element.inert = inertState[index];
      });
      document.removeEventListener("keydown", key);
      toggle.current?.focus();
    };
  }, [open]);
  return (
    <>
      <header
        className={`site-header${staged ? " site-header--home" : ""}${overHero ? " site-header--over-hero" : ""}`}
      >
        <Link to="/" className="brand" aria-label="Anthill Ventures home">
          <img
            className="brand-logo brand-logo--dark"
            src="/brand/logo-red-black.svg"
            alt="Anthill Ventures"
            width="154"
            height="54"
          />
          <img
            className="brand-logo brand-logo--light"
            src="/brand/logo-red-white.svg"
            alt=""
            width="154"
            height="54"
          />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.slice(0, 4).map(([name, path]) => (
            <NavLink to={path} key={path}>
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="header-contact" to="/contact">
            Let’s talk <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            ref={toggle}
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            <span className="menu-toggle-label">{open ? "Close" : "Explore"}</span>
            <span className="menu-toggle-bars" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
        <motion.div
          className="reading-progress"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
      </header>
      <AnimatePresence>
        {open && (
          <MenuOverlay panel={panel} pathname={location.pathname} onClose={close} />
        )}
      </AnimatePresence>
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    try {
      const entries = JSON.parse(
        localStorage.getItem("anthill-newsletter-interest") || "[]",
      );
      if (!entries.includes(email.toLowerCase())) {
        entries.push(email.toLowerCase());
        localStorage.setItem(
          "anthill-newsletter-interest",
          JSON.stringify(entries),
        );
      }
      setStatus(
        "Your email is saved on this device. Newsletter delivery will be available when subscriptions launch.",
      );
      setEmail("");
    } catch {
      setStatus(
        "Subscription delivery is not connected yet. Please try again when subscriptions launch.",
      );
    }
  }
  return (
    <div className="newsletter">
      <h3>
        Stay in the loop<span>.</span>
      </h3>
      <p>Subscribe to our weekly newsletter for updates and news</p>
      <form onSubmit={submit}>
        <label className="sr-only" htmlFor="newsletter-email">
          Your Email Address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your Email Address"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("");
          }}
        />
        <motion.button type="submit" aria-label="Subscribe to newsletter" whileTap={{ scale: 0.94 }}>
          <ArrowUpRight aria-hidden="true" />
        </motion.button>
      </form>
      <p className="form-note" role="status">
        {status || "Register your interest. Email delivery coming soon."}
      </p>
    </div>
  );
}

const FOOTER_STACKED = "(max-width: 900px)";
const GOAL_X = 0.955;

function Footer() {
  const location = useLocation();
  const stage = useRef(null);
  const sky = useRef(null);
  const edge = useRef(null);
  const head = useRef(null);
  const copy = useRef(null);
  const zone = useRef(null);
  // The silk only starts its GPU work as the footer comes near the viewport.
  const near = useInView(stage, { once: true, margin: "600px 0px" });
  const inView = useInView(stage);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const closing = footerLines(location.pathname);

  useGSAP(
    () => {
      const box = stage.current;
      const state = { t: 1.25 };
      let curve = { ground: 0.9, rise: 0.8, power: 5 };
      const draw = () => {
        drawSurface(sky.current, edge.current, curve, state.t, 0);
        const x = Math.min(state.t, GOAL_X);
        head.current.style.left = `${x * 100}%`;
        head.current.style.top = `${surfaceY(x, curve, state.t, 0) * 100}%`;
      };
      // The curve is read from the layout so it can never run behind the statement.
      const measure = () => {
        const frame = box.getBoundingClientRect();
        if (matchMedia(FOOTER_STACKED).matches) {
          const area = zone.current.getBoundingClientRect();
          const top = (area.top - frame.top) / frame.height;
          const bottom = (area.bottom - frame.top) / frame.height;
          // Leave clear sky above the head for the goal figure.
          curve = { ground: bottom, rise: bottom - top - 84 / frame.height, power: 2.6 };
        } else {
          const end = copy.current.getBoundingClientRect().bottom;
          const ground = Math.min(0.93, (end - frame.top + 44) / frame.height);
          curve = { ground, rise: ground - 0.12, power: 5 };
        }
        draw();
      };
      const observer = new ResizeObserver(measure);
      observer.observe(box);
      measure();

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(box);
        const split = SplitText.create(q(".footer-lead"), {
          type: "words",
          mask: "words",
          wordsClass: "footer-word",
          aria: "none",
        });
        state.t = -0.12;
        measure();
        const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
        intro
          .from(split.words, { yPercent: 112, duration: 1.1, stagger: 0.05 }, 0.05)
          .from(q(".footer-rotator"), { y: 36, opacity: 0, duration: 0.9, clearProps: "transform,opacity" }, 0.25)
          .from(q(".footer-statement .eyebrow, .footer-statement p, .footer-actions > *"), { y: 18, opacity: 0, duration: 0.8, stagger: 0.07, clearProps: "transform,opacity" }, 0.35)
          .to(state, { t: 1.25, duration: 2.2, ease: "power2.inOut", onUpdate: draw }, 0.1)
          .fromTo(q(".footer-head-dot"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.4)
          .fromTo(q(".footer-goal"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 1.9);
        const reveal = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            intro.play();
            reveal.disconnect();
          },
          { threshold: 0.2 },
        );
        reveal.observe(box);
        return () => {
          reveal.disconnect();
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
    { scope: stage, dependencies: [location.pathname], revertOnUpdate: true },
  );

  return (
    <footer className="site-footer">
      <div ref={stage} className="footer-stage">
        <div className="footer-silk" aria-hidden="true">
          {near ? <HeroBackdrop variation={23} paused={paused} /> : null}
        </div>
        <svg className="footer-sky" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path ref={sky} className="footer-sky-fill" />
          <path ref={edge} className="footer-sky-edge" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="night-stars" aria-hidden="true" />
        <div ref={head} className="footer-head">
          <span className="footer-head-dot" aria-hidden="true" />
          <p className="footer-goal">
            <strong>1B</strong>
            <span>People to reach</span>
          </p>
        </div>
        <div className="container footer-stage-inner">
          <div ref={copy} className="footer-statement">
            <div className="footer-statement-top">
              <span className="eyebrow">Speed-scaling venture capital</span>
              {!reduced && (
                <button
                  type="button"
                  className="stage-toggle"
                  aria-label={paused ? "Resume footer animation" : "Pause footer animation"}
                  aria-pressed={paused}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <Play size={12} /> : <Pause size={12} />}
                </button>
              )}
            </div>
            {/* Keyed so GSAP's split text never holds stale copy across routes. */}
            <h2 key={location.pathname}>
              <span className="footer-lead">{closing.lead}</span>{" "}
              <span className="footer-rotator">
                {closing.lines.map((line) => (
                  <span key={line} className="footer-rotator-sizer" aria-hidden="true">
                    {line}
                  </span>
                ))}
                <RotatingText
                  texts={closing.lines}
                  splitBy="words"
                  effect="slide"
                  staggerDuration={0.04}
                  rotationInterval={2800}
                  auto={inView && !paused && !reduced}
                />
              </span>
            </h2>
            <p>
              We back founders building businesses in health, climate and urban
              life, with capital, mentorship and market access.
            </p>
            <div className="footer-actions">
              <MotionLink className="footer-cta" to="/contact" whileHover="hover" whileTap={{ scale: 0.98 }}>
                Pitch your startup
                <motion.span variants={{ hover: { x: 3, y: -3 } }}>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </motion.span>
              </MotionLink>
              <motion.a className="footer-cta footer-cta--ghost" href={`mailto:${EMAIL}`} whileHover="hover" whileTap={{ scale: 0.98 }}>
                {EMAIL}
                <motion.span variants={{ hover: { x: 3, y: -3 } }}>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </motion.span>
              </motion.a>
            </div>
          </div>
          <div ref={zone} className="footer-zone" aria-hidden="true" />
        </div>
      </div>

      <div className="container footer-main">
        <div className="footer-brand">
          <Link to="/" aria-label="Anthill Ventures home">
            <img
              src="/brand/logo-white.svg"
              alt="Anthill Ventures"
              width="154"
              height="54"
            />
          </Link>
          <Offices className="footer-offices" />
          <span className="eyebrow">IND / USA / SG</span>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <span className="eyebrow">Explore</span>
          <div>
            <Link to="/">Home</Link>
            {navigation.map(([name, path]) => (
              <Link key={path} to={path}>
                {name}
              </Link>
            ))}
            <Link to="/insights">Playbooks</Link>
          </div>
        </nav>
        <Newsletter />
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Anthill Ventures</span>
        <Socials className="footer-socials" />
        <Link to="/privacy-policy">Privacy Policy</Link>
        <a className="footer-credit" href="https://sprdlx.co/" target="_blank" rel="noreferrer" aria-label="Designed by SPR DLX Studios">
          <img src="/brand/sprdlx-white.svg" alt="" width="36" height="32" />
        </a>
      </div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  const reduce = useReducedMotion();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const page = site.pages?.[location.pathname.replace(/\/$/, "") || "/"];
    document.title = page?.title || "Page not found | Anthill Ventures";
  }, [location.pathname]);
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {location.pathname === "/" ? (
              <Home />
            ) : (
              <ContentPage pathname={location.pathname} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </MotionConfig>
  );
}
