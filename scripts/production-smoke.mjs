import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
});
try {
  for (const route of [
    "/",
    "/programs",
    "/portfolio/videoverse-toch",
    "/stories/building-the-anthill",
    "/playbooks/climate-impact-report",
    "/info/styleguide",
    "/privacy-policy",
    "/not-a-page",
  ]) {
    await page.goto(`http://127.0.0.1:4180${route}`, {
      waitUntil: "networkidle",
    });
    const heading = await page.locator("main h1").textContent();
    if (!heading) throw new Error(`Missing heading: ${route}`);
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw new Error(`Overflow: ${route}`);
    if (
      route === "/privacy-policy" &&
      (await page
        .locator('main a[href="https://anthillventures.com/"]')
        .count()) !== 1
    )
      throw new Error("Privacy source reference is not clickable");
    console.log(`${route}: ${heading.replace(/\s+/g, " ").trim()}`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Production SPA routes and split bundles pass.");
} finally {
  await browser.close();
}
