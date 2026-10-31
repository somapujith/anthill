import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { pages, labels, heroData, PageHero, BodyContent } from "./content/core.jsx";
import Collection from "./content/Collection.jsx";
import DetailPage from "./content/Detail.jsx";
import ContactPage from "./content/Contact.jsx";
import AboutBody from "./content/About.jsx";
import PhilosophyBody from "./content/Philosophy.jsx";
import ProgramsBody from "./content/Programs.jsx";

const routeBodies = {
  "/about": AboutBody,
  "/philosophy": PhilosophyBody,
  "/programs": ProgramsBody,
};

export default function ContentPage({ pathname }) {
  const path = (pathname || window.location.pathname).replace(/\/$/, "") || "/";
  const page = pages[path];
  if (!page)
    return (
      <div className="content-not-found not-found">
        <div className="not-found-stage">
          <svg className="not-found-curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              vectorEffect="non-scaling-stroke"
              d={`M${Array.from({ length: 49 }, (_, i) => `${(i / 48) * 100} ${90 - 80 * (i / 48) ** 5}`).join(" L")}`}
            />
          </svg>
          <span className="not-found-marker" aria-hidden="true">
            <i />
            You are here
          </span>
          <div className="container not-found-copy">
            <span className="eyebrow">404 / ANTHILL VENTURES</span>
            <strong className="not-found-numeral" aria-hidden="true">404</strong>
            <h1>Page not found.</h1>
            <p>We couldn’t find this page. It has drifted off the curve, so here is the way back.</p>
            <Link to="/" className="button">
              Back to home <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <nav className="container not-found-links" aria-label="Key pages">
          {[
            ["About", "/about", "We invest in early-stage companies and work with founders on funding, mentorship and market access."],
            ["Portfolio", "/portfolio", "Explore the companies in our portfolio across health, consumer, urban tech and media."],
            ["Programs", "/programs", "Our venture scaling program brings early-stage companies access to capital, industry expertise and distribution networks."],
            ["Insights", "/insights", "Reports and playbooks on company building, market trends and our portfolio's impact."],
            ["Contact", "/contact", "Have a question? Want to work with us?"],
          ].map(([name, href, text]) => (
            <Link key={href} to={href}>
              <span className="not-found-link-name">
                {name} <ArrowRight size={20} aria-hidden="true" />
              </span>
              <span className="not-found-link-text">{text}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  const hero = heroData(page, path);
  if (path === "/contact") return <ContactPage page={page} hero={hero} />;
  if (
    ["/portfolio", "/team", "/speedscalers", "/stories", "/insights"].includes(
      path,
    )
  )
    return <Collection key={path} pathname={path} page={page} hero={hero} />;
  if (/^\/(portfolio|team|mentors|stories|playbooks)\//.test(path))
    return <DetailPage pathname={path} page={page} hero={hero} />;
  const RouteBody = routeBodies[path];
  return (
    <>
      <PageHero {...hero} label={labels[path] || "Anthill Ventures"} />
      {RouteBody ? (
        <RouteBody blocks={hero.blocks} page={page} pathname={path} />
      ) : (
        <BodyContent
          blocks={hero.blocks}
          page={page}
          pathname={path}
          reading={path === "/privacy-policy" || path.startsWith("/info/")}
        />
      )}
    </>
  );
}
