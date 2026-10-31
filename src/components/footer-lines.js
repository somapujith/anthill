// The footer's closing statement for each page: a fixed lead and rotating follow-ups.
const home = {
  lead: "Fearless founders.",
  lines: ["For a billion people.", "In health and climate.", "In urban life.", "Across ten countries."],
};

const pages = {
  "/": home,
  "/about": {
    lead: "A decade in.",
    lines: ["80+ startups backed.", "$1B+ in follow-on capital.", "Ten countries reached.", "Still scaling."],
  },
  "/philosophy": {
    lead: "Speed with scale.",
    lines: ["Capital that moves.", "Mentors who've done it.", "Markets that open up.", "Nine areas assessed."],
  },
  "/programs": {
    lead: "Built for India 2030.",
    lines: ["Six toll gates.", "Capital and expertise.", "Distribution networks.", "Apply and start climbing."],
  },
  "/portfolio": {
    lead: "Could you be next?",
    lines: ["80+ startups before you.", "$1B+ in follow-on capital.", "From health to media.", "Across ten countries."],
  },
  "/team": {
    lead: "Work with this team.",
    lines: ["On funding.", "On mentorship.", "On market access."],
  },
  "/speedscalers": {
    lead: "70+ speed scalers.",
    lines: ["Founders who've built.", "Operators who've scaled.", "Specialists by industry."],
  },
  "/stories": {
    lead: "Your story starts here.",
    lines: ["Tell us what you're building.", "Tell us who it's for.", "Tell us where it goes next."],
  },
  "/insights": {
    lead: "Ideas into action.",
    lines: ["Climate impact reports.", "Carbon market playbooks.", "Urban lifestyle theses."],
  },
  "/contact": {
    lead: "Let's talk.",
    lines: ["Bring your deck.", "Bring your traction.", "Bring your market.", "Bring your team."],
  },
};

const families = {
  team: {
    lead: "Talk to the team.",
    lines: ["About funding.", "About mentorship.", "About market access."],
  },
  mentors: {
    lead: "Scale with mentors.",
    lines: ["Who've built companies.", "Who've run operations.", "Who know your industry."],
  },
  portfolio: {
    lead: "Building like this?",
    lines: ["Let's fund it.", "Let's scale it.", "Let's take it to market."],
  },
  stories: {
    lead: "Have one to tell?",
    lines: ["Pitch us the idea.", "Show us the traction.", "Build it with us."],
  },
  playbooks: {
    lead: "Read the playbook.",
    lines: ["Now find the market.", "Now build the company.", "Now pitch us."],
  },
  "privacy-policy": {
    lead: "That's the fine print.",
    lines: ["Now the big idea.", "Now your pitch."],
  },
  info: {
    lead: "That's the fine print.",
    lines: ["Now the big idea.", "Now your pitch."],
  },
};

export function footerLines(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  return pages[path] || families[path.split("/")[1]] || home;
}
