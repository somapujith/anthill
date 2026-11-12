// Figures and wording taken from the "Anthill India Opportunities Fund" LP Presentation 2026
// (confidential investor deck). One module so every page reads the same numbers.
// The captured source archive (site-content.json) stays untouched; display code imports from here.

export const DECK = {
  // Track record (deck slide 20-21)
  portfolioCompanies: 60,
  exits: 15,
  averageIrr: "~18%",
  grossMoic: 3, // shown as "3X" / "3x"
  aumUsdMillions: 54,
  operatingYears: "10+",
  womenFoundersPct: 45,
  followOnRaisedPct: 44,
  // Community and reach (deck slides 12, 15, 25)
  venturePartners: 30,
  marketAccessPartners: "100+",
  healthcareUsers: "260M+",
  mediaViewers: "600M+",
  affluentCustomers: "150M+",
  infrastructureCredits: "3M+",
};

// Countries. The first three are the existing hubs; the last three are added from the brief.
// The "ten countries" count is not in the deck and is left as the site has it.
export const COUNTRIES = [
  { name: "India", code: "IND" },
  { name: "USA", code: "USA" },
  { name: "Singapore", code: "SG" },
  { name: "Sweden", code: "SWE" },
  { name: "Israel", code: "ISR" },
  { name: "Finland", code: "FIN" },
];
export const ADDED_COUNTRIES = ["Sweden", "Israel", "Finland"];
// Approximate map positions (latitude, longitude) for the three added countries.
export const COUNTRY_COORDS = {
  Sweden: [62.0, 15.0],
  Israel: [31.5, 34.9],
  Finland: [63.5, 26.0],
};
export const REGION_LABEL = COUNTRIES.map((c) => c.code).join(" / ");

// "Mitigate Climate Change" becomes "Frontier Tech" (deck slides 5-6).
export const SECTORS_PHRASE = "health, frontier tech and urban lifestyles";
export const FRONTIER_TECH = {
  title: "Frontier Tech",
  tagline: "India's sovereign tech layer",
  blurb:
    "Companies building India's sovereign tech layer, backed by a national push into AI, space, defence, semiconductors, quantum and biotech.",
  marketBy2030: "~$30B by 2030",
  nationalRdi: "~$12 billion national RDI push",
  rdiFundNote:
    "A 1 lakh crore RDI Fund is expected to crowd in 10x more private capital; the deep-tech startup base is growing 40%+ a year.",
  areas: [
    "AI & Computing",
    "Defence Tech",
    "Space Tech",
    "Climate & Clean Tech",
    "Robotics & Autonomous Systems",
  ],
  image: "/media/editorial/frontier-tech.jpg",
  imageAlt:
    "Original artwork: a perspective lattice carrying a raised chip-like slab, with orbit rings and fine flight arcs above it and a single red trajectory that launches from the lattice and curves into an orbit",
};
