import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const content = JSON.parse(
  await fs.readFile("src/data/site-content.json", "utf8"),
);
const editorial = JSON.parse(
  await fs.readFile("scripts/editorial-expectations.json", "utf8"),
);
const origin = process.env.ANTHILL_VERIFY_ORIGIN || "http://localhost:5180";
const output = path.resolve("tmp/rendered-audit");
await fs.mkdir(output, { recursive: true });
const normalize = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const ignored = new Set([
  "Read more",
  "Overview",
  "View",
  "View all",
  "View Team",
  "View portfolio",
  "Get in Touch",
  "Visit Website",
  "Website Link",
  "Apply Now",
  "Download",
  "Uploading...",
  "fileuploaded.jpg",
  "Upload failed. Max size for files is 10 MB.",
  "Thank you! Your submission has been received!",
  "Oops! Something went wrong while submitting the form.",
  "Oops! Something went wrong.",
  "YeaR",
  "Name",
  "Industry",
]);
let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (error) =>
  errors.push({ url: page.url(), message: error.message }),
);
const results = [];
const routeFilter = process.argv.slice(2);
const layoutOnly = process.env.ANTHILL_VERIFY_LAYOUT_ONLY === "1";
for (const [route, source] of Object.entries(content.pages).filter(
  ([route]) => !routeFilter.length || routeFilter.includes(route),
)) {
  try {
    await page.goto(origin + route, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    if (layoutOnly) {
      const viewports = [];
      for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.waitForTimeout(35);
        viewports.push(
          await page.evaluate(() => ({
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
          })),
        );
      }
      const horizontalOverflow = viewports.some((v) => v.overflow);
      results.push({ route, viewports, horizontalOverflow });
      console.log(
        `${route}: ${horizontalOverflow ? "OVERFLOW " + JSON.stringify(viewports.filter((v) => v.overflow)) : "passed 7 viewport widths"}`,
      );
      continue;
    }
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll("main img"))
        img.loading = "eager";
      for (let y = 0; y < document.documentElement.scrollHeight; y += 650) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      await Promise.all(
        [...document.querySelectorAll("main img")].map((img) =>
          Promise.race([
            img.decode().catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]),
        ),
      );
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(100);
    // The recreated download form only unlocks a local PDF; it has no backend.
    if (route.startsWith("/playbooks/")) {
      const email = page.locator('main input[type="email"]');
      if (await email.count()) {
        await email.fill("qa@anthill.example");
        await email.press("Enter");
        await page.waitForTimeout(100);
      }
    }
    const interactionText = [];
    const expandable = page.locator("main button[aria-expanded]");
    for (const button of await expandable.all()) {
      if ((await button.getAttribute("aria-expanded")) === "false")
        await button.click();
      await page.waitForTimeout(80);
      interactionText.push(await page.locator("main").innerText());
      interactionText.push(
        await page.evaluate(() => {
          const walker = document.createTreeWalker(
            document.querySelector("main"),
            NodeFilter.SHOW_TEXT,
          );
          const text = [];
          let node;
          while ((node = walker.nextNode()))
            if (
              node.parentElement.getClientRects().length &&
              getComputedStyle(node.parentElement).visibility !== "hidden"
            )
              text.push(node.textContent);
          return text.join(" ");
        }),
      );
    }
    const rendered = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.querySelector("main"),
        NodeFilter.SHOW_TEXT,
      );
      const text = [];
      let node;
      while ((node = walker.nextNode()))
        if (
          node.parentElement.getClientRects().length &&
          getComputedStyle(node.parentElement).visibility !== "hidden"
        )
          text.push(node.textContent);
      return {
        text:
          document.querySelector("main")?.innerText || document.body.innerText,
        visibleContent: text.join(" "),
        domText:
          document.querySelector("main")?.textContent ||
          document.body.textContent,
        links: [...document.querySelectorAll("main a[href]")].map((a) => ({
          href: a.getAttribute("href"),
          text: a.innerText,
          accessible: a.getAttribute("aria-label") || "",
        })),
        images: [...document.querySelectorAll("main img")].map((img) => ({
          src: img.getAttribute("src"),
          complete: img.complete,
          width: img.naturalWidth,
          alt: img.alt,
        })),
        accordions: [...document.querySelectorAll("main details")].map(
          (details) => ({
            text: details.textContent,
            summary: details.querySelector("summary")?.innerText,
          }),
        ),
        headings: [...document.querySelectorAll("main h1,h2,h3,h4,h5,h6")].map(
          (h) => h.innerText,
        ),
        horizontalOverflow:
          document.documentElement.scrollWidth > innerWidth + 1,
        pageTitle: document.title,
      };
    });
    const visible = normalize(
      [rendered.text, rendered.visibleContent, ...interactionText].join(" "),
    );
    const dom = normalize(rendered.domText);
    const significant = source.blocks
      .filter((b) => b.text?.trim() && !ignored.has(b.text))
      .flatMap((b) => {
        const embedded = source.links.filter(
          (l) => l.text.length > 30 && b.text.includes(l.text),
        );
        return embedded.length > 1
          ? embedded.map((l) => ({ ...b, text: l.text }))
          : [b];
      });
    const isPresent = (text) => {
      const expected = normalize(text);
      const options = [
        visible,
        ...rendered.accordions.map((a) => normalize(a.text)),
      ];
      if (options.some((actual) => actual.includes(expected))) return true;
      if (
        expected.length < 50 &&
        options.some((actual) =>
          actual.toLowerCase().includes(expected.toLowerCase()),
        )
      )
        return true;
      // Source cards combine index, presentation-only "Overview", heading and body.
      // Their layout may separate these parts; every substantive phrase must remain.
      if (expected.includes(" Overview ")) {
        return expected
          .split(" Overview ")
          .every((part) =>
            options.some((actual) =>
              actual.includes(part.replace(/^\d+\.\s*/, "")),
            ),
          );
      }
      return (
        /^\d+\.\s/.test(expected) &&
        options.some((actual) =>
          actual.includes(expected.replace(/^\d+\.\s*/, "")),
        )
      );
    };
    const displayText = (text) =>
      editorial.changes
        .filter((change) => change.route === route)
        .sort((a, b) => b.source.length - a.source.length)
        .reduce(
          (current, change) =>
            current === change.source
              ? change.replacement
              : /^\d{2}$/.test(change.source)
                ? current
                : current.replaceAll(change.source, change.replacement),
          text,
        );
    const missing = significant
      .filter((b) => !isPresent(displayText(b.text)))
      .map((b) => ({
        type: b.type,
        text: b.text,
        expected: displayText(b.text),
        inDOM: dom.includes(normalize(b.text)),
      }));
    for (const expected of editorial.requiredText[route] || []) {
      if (!isPresent(expected))
        missing.push({ type: "editorial-copy", text: expected });
    }
    const actionLinks = source.links.filter(
      (l) =>
        l.href &&
        l.href !== "#" &&
        (l.href.startsWith("http") ||
          l.href.startsWith("mailto:") ||
          /^\/(?:portfolio|team|mentors|stories|playbooks)\//.test(l.href)),
    );
    const missingLinks = actionLinks.filter(
      (l) =>
        !rendered.links.some((a) => {
          const actual = a.href || "";
          const expected = l.local || l.href;
          return (
            actual === expected ||
            actual === l.href ||
            (l.href.startsWith("https://anthillventures.com") &&
              actual === new URL(l.href).pathname)
          );
        }),
    );
    const brokenImages = rendered.images.filter(
      (img) => !img.complete || img.width === 0,
    );
    const imageContentRoute =
      /^\/(?:team|mentors|portfolio|stories|playbooks)(?:\/|$)/.test(route) ||
      ["/speedscalers", "/insights"].includes(route);
    const importantImages = imageContentRoute
      ? source.images.filter(
          (img) => !/(?:arrow|icon|decor)[-_%\s.]|poster-00001/i.test(img.src),
        )
      : [];
    const missingImages = importantImages.filter(
      (img) =>
        !rendered.images.some(
          (actual) => actual.src === img.local || actual.src === img.src,
        ),
    );
    const pdfErrors = [];
    for (const pdf of rendered.links.filter((link) =>
      /\.pdf(?:\?|$)/i.test(link.href || ""),
    )) {
      const response = await page.request.get(new URL(pdf.href, origin).href);
      if (
        !response.ok() ||
        (await response.body()).subarray(0, 5).toString() !== "%PDF-"
      )
        pdfErrors.push({ href: pdf.href, status: response.status() });
    }
    const result = {
      route,
      missing,
      missingLinks,
      brokenImages,
      missingImages,
      pdfErrors,
      horizontalOverflow: rendered.horizontalOverflow,
      headings: rendered.headings,
      title: rendered.pageTitle,
      sourceBlocks: significant.length,
    };
    results.push(result);
    if (
      missing.length ||
      missingLinks.length ||
      brokenImages.length ||
      missingImages.length ||
      pdfErrors.length ||
      result.horizontalOverflow
    ) {
      console.log(
        `${route}: missing ${missing.length} blocks, ${missingLinks.length} links, ${brokenImages.length} broken images, ${missingImages.length} missing images, ${pdfErrors.length} invalid PDFs, overflow ${result.horizontalOverflow}`,
      );
      for (const block of missing) console.log("  TEXT:", block.text);
      for (const link of missingLinks) console.log("  LINK:", link.href);
      for (const img of missingImages)
        console.log("  IMAGE:", img.local || img.src);
    } else
      console.log(`${route}: passed ${significant.length} significant blocks`);
  } catch (error) {
    results.push({ route, error: error.message });
    console.log(route + ": ERROR " + error.message);
  }
}
// Focused reruns replace their route evidence while retaining the prior full audit.
if (routeFilter.length && !layoutOnly) {
  try {
    const prior = JSON.parse(
      await fs.readFile(path.join(output, "report.json"), "utf8"),
    );
    const combined = new Map(
      prior.results.map((result) => [result.route, result]),
    );
    for (const result of results) combined.set(result.route, result);
    results.splice(0, results.length, ...combined.values());
  } catch {
    /* No previous full audit to consolidate. */
  }
}
const summaries = {
  routes: results.length,
  routesWithMissingText: results.filter((r) => r.missing?.length).length,
  missingBlocks: results.reduce((n, r) => n + (r.missing?.length || 0), 0),
  missingLinks: results.reduce((n, r) => n + (r.missingLinks?.length || 0), 0),
  brokenImages: results.reduce((n, r) => n + (r.brokenImages?.length || 0), 0),
  missingImages: results.reduce(
    (n, r) => n + (r.missingImages?.length || 0),
    0,
  ),
  invalidPDFs: results.reduce((n, r) => n + (r.pdfErrors?.length || 0), 0),
  horizontalOverflow: results.filter((r) => r.horizontalOverflow).length,
  routeErrors: results.filter((r) => r.error).length,
  runtimeErrors: errors.length,
};
await fs.writeFile(
  path.join(output, layoutOnly ? "viewports.json" : "report.json"),
  JSON.stringify(
    {
      origin,
      mode: layoutOnly ? "layout" : "content",
      summaries,
      errors,
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(summaries, null, 2));
await browser.close();
if (
  Object.values(summaries)
    .slice(1)
    .some((n) => n > 0)
)
  process.exitCode = 1;
