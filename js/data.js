// Seed data and localStorage helpers
window.LS = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  del(k) {
    localStorage.removeItem(k);
  },
};

// Avatar generator (deterministic SVG data URL - no network needed)
window.avatar = (name, size = 96) => {
  const colors = [
    "#0a66c2",
    "#057642",
    "#915907",
    "#7a3e9d",
    "#b24020",
    "#0f7a86",
    "#c81a5a",
    "#3b82f6",
  ];
  const initials = name
    .split(" ")
    .map((s) => s[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bg = colors[h % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI,Roboto,Arial" font-size="${size * 0.42}" fill="#fff" font-weight="700">${initials}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};
window.coverImg = (seed) => {
  const g1 = ["#0a66c2", "#0f7a86", "#4b3bff", "#c81a5a", "#057642"];
  const g2 = ["#57a3ff", "#22c1c3", "#a172e5", "#ff8a5b", "#8bd17c"];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = g1[h % g1.length],
    b = g2[(h >> 3) % g2.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='420'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><g fill='rgba(255,255,255,.15)'><circle cx='120' cy='320' r='140'/><circle cx='680' cy='90' r='90'/></g></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

const PEOPLE = [
  ["Aarav Sharma", "Senior Product Manager", "Stripe", "San Francisco, CA"],
  ["Priya Iyer", "Staff Software Engineer", "Google", "Bengaluru, IN"],
  ["Marcus Chen", "VP of Engineering", "Notion", "New York, NY"],
  ["Sofia Rossi", "Head of Design", "Figma", "Milan, IT"],
  ["Kwame Osei", "Data Scientist", "OpenAI", "Accra, GH"],
  ["Isabella García", "UX Researcher", "Airbnb", "Barcelona, ES"],
  ["Rohan Verma", "Founder & CEO", "Nebula AI", "Mumbai, IN"],
  ["Yuki Tanaka", "Machine Learning Engineer", "DeepMind", "Tokyo, JP"],
  ["Layla Haddad", "Product Designer", "Linear", "Dubai, AE"],
  ["Ethan Wright", "Growth Marketer", "Vercel", "Austin, TX"],
  ["Nia Okoro", "Frontend Engineer", "Shopify", "Lagos, NG"],
  ["Diego Fernández", "Solutions Architect", "AWS", "Buenos Aires, AR"],
  ["Chloé Dubois", "Content Strategist", "Spotify", "Paris, FR"],
  ["Ahmed Karim", "DevOps Lead", "Cloudflare", "Cairo, EG"],
  ["Meera Kapoor", "Recruiter", "Meta", "Gurugram, IN"],
  ["Jonas Weber", "iOS Engineer", "Apple", "Berlin, DE"],
  ["Ananya Rao", "Data Engineer", "Snowflake", "Hyderabad, IN"],
  ["Oliver Bennett", "Product Manager", "Atlassian", "Sydney, AU"],
  ["Elena Petrova", "Security Engineer", "1Password", "Amsterdam, NL"],
  ["Sam Patel", "Full-Stack Developer", "GitHub", "Toronto, CA"],
];
const HASHTAGS = [
  "#ai",
  "#leadership",
  "#productdesign",
  "#startups",
  "#opentowork",
  "#hiring",
  "#machinelearning",
  "#webdev",
  "#remotework",
  "#innovation",
  "#career",
  "#saas",
];
const POST_TEMPLATES = [
  "Excited to share that our team just shipped a major redesign 🎉\n\nBiggest lesson: ship small, measure, iterate. What's the most impactful launch you've been part of? {tags}",
  "Reflection after 5 years leading teams:\n\n1. Hire for slope, not intercept.\n2. Clarity beats charisma.\n3. Written docs > meetings.\n4. Your calendar is your strategy.\n\nWhat would you add? {tags}",
  "We're hiring! Looking for senior engineers who love building 0→1 products in AI infrastructure. Fully remote, competitive comp, and a team obsessed with craft. DM if interested. {tags}",
  "A short thread on how we cut our onboarding time from 3 weeks to 4 days:\n• Automated environment setup\n• Paired shipping on day 1\n• Living onboarding doc\n• Weekly retro\n\nSmall changes, huge compounding impact. {tags}",
  "Just wrapped a fantastic conversation with a mentee. Reminder: giving generously to others is the highest-leverage career move you can make. {tags}",
  "The best product decisions I've seen came from teams that talked to customers weekly. Not monthly. Not quarterly. Weekly. {tags}",
  "Open to work after an incredible 4 years. Grateful for every teammate and manager who invested in me. If you're hiring for Senior PM roles, I'd love to chat. {tags}",
  "New blog post: how we built our internal design system in 90 days without slowing feature work. TL;DR — treat it like a product, not a project. {tags}",
  "Reminder to founders: revenue solves almost every problem. Talk to customers, charge for value, iterate ruthlessly. {tags}",
  "Big congrats to my incredible team for winning the internal hackathon 🏆 — proud of what a small group can build in 48 hours. {tags}",
  "Interviewing tip: prepare 3 stories that show impact, ambiguity, and collaboration. You can adapt them to almost any behavioral question. {tags}",
  "Culture isn't the perks. It's how decisions get made when nobody's watching. {tags}",
  "Just finished reading 'The Cold Start Problem' — highly recommended for anyone building network-effect products. My top 3 takeaways in the comments. {tags}",
  "We migrated 400+ services to a new observability stack. Latency down 22%, MTTR down 40%. Full write-up dropping next week. {tags}",
  "Speaking at DevWorld next month on 'Designing for AI-native products'. Come say hi if you're around! {tags}",
];

window.SEED = {
  people: PEOPLE.map((p, i) => ({
    id: "u" + i,
    name: p[0],
    role: p[1],
    company: p[2],
    location: p[3],
    avatar: avatar(p[0]),
    mutual: 3 + (i % 30),
    online: i % 3 === 0,
  })),
  hashtags: HASHTAGS,
  postTemplates: POST_TEMPLATES,
  jobs: [
    {
      id: "j1",
      title: "Senior Frontend Engineer",
      company: "Stripe",
      location: "Remote",
      type: "Full-time",
      salary: "$180k-$240k",
      saved: false,
      applied: false,
      posted: "2d",
      desc: "Build world-class payment experiences. React, TypeScript, Design Systems. Remote-first, async culture.",
    },
    {
      id: "j2",
      title: "Staff Product Designer",
      company: "Figma",
      location: "San Francisco",
      type: "Full-time",
      salary: "$210k-$280k",
      saved: false,
      applied: false,
      posted: "1d",
      desc: "Shape the future of design tools. Deep collaboration with engineering and product.",
    },
    {
      id: "j3",
      title: "Machine Learning Engineer",
      company: "OpenAI",
      location: "Remote",
      type: "Full-time",
      salary: "$220k-$320k",
      saved: false,
      applied: false,
      posted: "5h",
      desc: "Applied research on RLHF, evals, and safety. PyTorch, distributed training.",
    },
    {
      id: "j4",
      title: "Product Manager, Growth",
      company: "Notion",
      location: "New York",
      type: "Full-time",
      salary: "$170k-$220k",
      saved: false,
      applied: false,
      posted: "3d",
      desc: "Drive activation and retention. Deep analytical background, PLG experience preferred.",
    },
    {
      id: "j5",
      title: "Site Reliability Engineer",
      company: "Cloudflare",
      location: "Remote",
      type: "Full-time",
      salary: "$160k-$220k",
      saved: false,
      applied: false,
      posted: "1w",
      desc: "Operate one of the largest networks on the internet. Rust or Go, deep systems.",
    },
    {
      id: "j6",
      title: "UX Researcher",
      company: "Airbnb",
      location: "Barcelona",
      type: "Full-time",
      salary: "€90k-€130k",
      saved: false,
      applied: false,
      posted: "6d",
      desc: "Mixed-methods research to shape host and guest experiences.",
    },
    {
      id: "j7",
      title: "iOS Engineer",
      company: "Apple",
      location: "Cupertino",
      type: "Full-time",
      salary: "$190k-$260k",
      saved: false,
      applied: false,
      posted: "4d",
      desc: "Build features used by hundreds of millions. Swift, SwiftUI, performance focus.",
    },
    {
      id: "j8",
      title: "Data Engineer",
      company: "Snowflake",
      location: "Remote",
      type: "Full-time",
      salary: "$170k-$230k",
      saved: false,
      applied: false,
      posted: "2w",
      desc: "Pipelines at petabyte scale. Airflow, dbt, warehousing best practices.",
    },
  ],
};

// Generate feed
function makeFeed() {
  const posts = [];
  for (let i = 0; i < 32; i++) {
    const p = SEED.people[i % SEED.people.length];
    const tags =
      " " +
      Array.from(
        { length: 2 + (i % 3) },
        (_, k) => HASHTAGS[(i + k) % HASHTAGS.length],
      ).join(" ");
    const body = POST_TEMPLATES[i % POST_TEMPLATES.length].replace(
      "{tags}",
      tags,
    );
    const hasImg = i % 3 === 0;
    posts.push({
      id: "p" + i,
      authorId: p.id,
      author: p.name,
      role: p.role,
      company: p.company,
      avatar: p.avatar,
      time:
        i < 5 ? `${i + 1}h` : i < 15 ? `${i - 2}d` : `${Math.floor(i / 3)}d`,
      body,
      image: hasImg ? coverImg(p.name + i) : null,
      reactions: {
        like: 20 + ((i * 13) % 400),
        celebrate: (i * 7) % 80,
        support: (i * 3) % 40,
        insightful: (i * 5) % 60,
        funny: (i * 2) % 25,
      },
      myReaction: null,
      commentsCount: (i * 3) % 40,
      shares: (i * 2) % 25,
      reposted: false,
      saved: false,
      following: false,
    });
  }
  return posts;
}
window.makeFeed = makeFeed;
