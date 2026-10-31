import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowUpRight, X, Menu, Instagram, Linkedin } from "lucide-react";
import Home from "./pages/Home.jsx";
import ContentPage from "./pages/ContentPage.jsx";
import site from "./data/view-content.json";

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

function Header() {
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const location = useLocation();
  const toggle = useRef(null);
  const panel = useRef(null);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [
      ...document.querySelectorAll(".site-header, #main-content, .site-footer"),
    ];
    const inertState = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    panel.current?.querySelector("a")?.focus();
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
      background.forEach((element, index) => {
        element.inert = inertState[index];
      });
      document.removeEventListener("keydown", key);
      toggle.current?.focus();
    };
  }, [open]);
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Anthill Ventures home">
          <img
            src="/brand/logo-red-black.svg"
            alt="Anthill Ventures"
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
            Let’s talk <ArrowUpRight size={16} />
          </Link>
          <button
            ref={toggle}
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            <span>{open ? "Close" : "Explore"}</span>
            {open ? <X size={20} /> : <Menu size={20} />}
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
          <motion.div
            id="site-menu"
            ref={panel}
            className="menu-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Explore Anthill"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <div className="menu-top">
              <span className="eyebrow">Explore Anthill</span>
              <button
                className="icon-button"
                onClick={() => {
                  setOpen(false);
                  toggle.current?.focus();
                }}
                aria-label="Close navigation"
              >
                <X />
              </button>
            </div>
            <nav aria-label="All pages">
              <Link to="/" onClick={() => setOpen(false)}>
                Home
                <ArrowUpRight />
              </Link>
              {navigation.map(([name, path]) => (
                <Link to={path} key={path}>
                  {name}
                  <ArrowUpRight />
                </Link>
              ))}
            </nav>
            <div className="menu-bottom">
              <span>IND / USA / SG</span>
              <a href="mailto:Info@anthillventures.com">
                Info@anthillventures.com <ArrowUpRight size={16} />
              </a>
            </div>
          </motion.div>
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
        <button type="submit" aria-label="Subscribe to newsletter">
          <ArrowUpRight />
        </button>
      </form>
      <p className="form-note" role="status">
        {status || "Register your interest. Email delivery coming soon."}
      </p>
    </div>
  );
}

function Footer() {
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
  return (
    <footer className="site-footer">
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
          <p>
            Ramanaidu Studios
            <br />
            Road 79, Jubilee Hills
            <br />
            Hyderabad, 500096
          </p>
          <span className="eyebrow">IND / USA / SG</span>
        </div>
        <div className="footer-links">
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
        </div>
        <Newsletter />
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Anthill Ventures</span>
        <a href="mailto:Info@anthillventures.com">
          Info@anthillventures.com <ArrowUpRight size={14} />
        </a>
        <div className="footer-socials">
          {socialLinks.map((x) => (
            <a key={x.href} href={x.href} target="_blank" rel="noreferrer" aria-label={`Anthill on ${x.text}`} title={x.text}>
              {x.text === "Instagram" ? <Instagram size={20} aria-hidden="true" /> : x.text === "LinkedIn" ? <Linkedin size={20} aria-hidden="true" /> : <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.4L5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" /></svg>}
            </a>
          ))}
        </div>
        <Link to="/privacy-policy">Privacy Policy</Link>
      </div>
      <div className="container footer-credit">
        <a href="https://sprdlx.co/" target="_blank" rel="noreferrer">
          Designed by SPR DLX Studios <ArrowUpRight size={12} />
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
    const page = site.pages?.[location.pathname];
    document.title = page?.title || "Anthill Ventures — Scaling with speed";
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
