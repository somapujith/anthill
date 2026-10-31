import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { StageTile } from "../../components/StageVisuals.jsx";
import { labels, words, imageSource, firstImage, SmartLink, PageHero, BodyContent } from "./core.jsx";
import "./detail.css";

function PlaybookDownload({ page }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const link = (page.links || []).find((l) => l.text === "Download");
  if (!link) return null;
  return (
    <section className="container content-download">
      <div>
        <span className="eyebrow">THE COMPLETE PLAYBOOK</span>
        <h2>Ideas to put into action.</h2>
        <p>Download the full report.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setReady(true);
        }}
      >
        <label htmlFor="playbook-email">Your Email Address</label>
        <div className="content-download-row">
          <input
            id="playbook-email"
            name="EMAIL"
            type="email"
            autoComplete="email"
            required
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setReady(false);
            }}
          />
          <button className="button" type="submit">
            Download <ArrowRight size={16} />
          </button>
        </div>
        <p className="content-form-note">
          Email subscriptions are not connected yet. Your address is not
          submitted.
        </p>
        {ready && (
          <div className="content-download-feedback" role="status">
            <p>Your PDF is ready. No subscription has been created.</p>
            <a
              href={link.local || link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
            >
              Open the PDF <ArrowUpRight size={16} />
            </a>
            <a
              href={link.local || link.href}
              download
              className="content-download-save"
            >
              Save PDF
            </a>
          </div>
        )}
      </form>
    </section>
  );
}

export default function DetailPage({ pathname, page, hero }) {
  const family = pathname.split("/")[1];
  const people = ["team", "mentors"].includes(family);
  const article = ["stories", "playbooks"].includes(family);
  const parent =
    family === "mentors"
      ? "/speedscalers"
      : family === "playbooks"
        ? "/insights"
        : `/${family}`;
  const image = firstImage(page);
  const imageSrc = image && imageSource(image, page);
  let blocks = hero.blocks.filter(
    (b) =>
      words(b) !== "View all" &&
      !(
        family === "playbooks" &&
        ["Download", "Oops! Something went wrong."].includes(words(b))
      ) &&
      (!imageSrc || !b.src || imageSource(b, page) !== imageSrc),
  );
  const facts = [];
  const website =
    family === "portfolio" &&
    (page.links || []).find((l) => /Website Link/i.test(l.text));
  if (family === "portfolio") {
    const used = new Set();
    blocks.forEach((b, i) => {
      if (
        ["Year Invested", "Industry", "Status"].includes(words(b)) &&
        blocks[i + 1]
      ) {
        facts.push({ label: words(b), value: words(blocks[i + 1]) });
        used.add(i);
        used.add(i + 1);
      }
      if (words(b) === "Website" || /^Website Link/.test(words(b))) used.add(i);
    });
    blocks = blocks.filter((_, i) => !used.has(i));
  }
  const socialLinks = (page.links || []).filter(
    (l) => !l.text && /^https?:/.test(l.href),
  );
  return (
    <>
      <PageHero
        {...hero}
        label={labels[parent] || "Anthill Ventures"}
        back={{ href: parent, label: labels[parent] || "Back" }}
        visual={
          image && (
            <StageTile
              src={imageSrc}
              alt={image.alt || hero.title}
              variant={`${people ? "person" : family === "portfolio" ? "company" : family === "stories" ? "story" : "playbook"}${pathname.includes("videoverse") ? " stage-tile--light" : ""}`}
            />
          )
        }
      />
      {people ? (
        <BodyContent
          blocks={blocks}
          page={page}
          pathname={pathname}
          reading
        />
      ) : (
        <>
          {family === "portfolio" && (
            <section className="container content-company-facts">
              <dl>
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {website && (
                <SmartLink href={website.href} className="button">
                  Website Link <ArrowUpRight size={17} />
                </SmartLink>
              )}
            </section>
          )}
          {family === "playbooks" && <PlaybookDownload page={page} />}
          <BodyContent
            blocks={blocks}
            page={page}
            pathname={pathname}
            reading={article || family === "portfolio"}
          />
        </>
      )}
      <div className="container content-return">
        <Link to={parent} className="button">
          <ArrowLeft size={17} /> Explore {labels[parent] || family}
        </Link>
        {socialLinks.map((l, i) => (
          <SmartLink href={l.href} className="button" key={i}>
            {l.href.includes("linkedin")
              ? "LinkedIn"
              : l.href.includes("x.com") || l.href.includes("twitter")
                ? "X"
                : "Visit profile"}{" "}
            <ArrowUpRight size={16} />
          </SmartLink>
        ))}
      </div>
    </>
  );
}
