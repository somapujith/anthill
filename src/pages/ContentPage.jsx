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
      <div className="content-not-found container">
        <span className="eyebrow">404 / ANTHILL VENTURES</span>
        <h1>Page not found.</h1>
        <p>We couldn’t find this page.</p>
        <Link to="/" className="button">
          Back to home <ArrowRight size={17} />
        </Link>
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
