/**
 * Global site data — every template can read `site.*`.
 *
 * ⚠️  `url`, `adSense.client` and `adSense.publisherId` are live.
 *     `newsletter.action` is still a placeholder until a provider endpoint
 *     is set (subscriptions currently show a "not wired up yet" notice).
 */
module.exports = {
  name: "Stackwise",
  tagline: "Practical guides for the tools you actually use",
  description:
    "Stackwise publishes clear, tested guides, tutorials and honest reviews on developer tooling, hardware and productivity systems — written by people who use this stuff daily.",
  url: "https://stackwise.dpdns.org",
  locale: "en",
  defaultOgType: "website",
  themeColor: "#0f172a",
  built: new Date(),

  // Where posts live on the filesystem / URL space.
  postsPath: "/blog/",

  // ---- Monetisation -------------------------------------------------
  // AdSense: leave `enabled` true with placeholder slots, flip `client`
  // to your ca-pub-XXXXXXXXXXXXXXXX once approved. Ads render as labelled
  // placeholders until a real client id is set, so review pages never show
  // empty ad boxes.
  adSense: {
    enabled: true,
    client: "ca-pub-7435877725775872",
    publisherId: "pub-7435877725775872", // for ads.txt
    adsTxtLine: "google.com, pub-7435877725775872, DIRECT, f08c47fec0942fa0",
    lazyLoad: true,
    // Slots: name -> ad unit id. Empty ids render as labelled placeholders.
    slots: {
      headerBanner: "",
      inArticle: "",
      sidebar: "",
      inFeed: "",
      footer: "",
    },
  },

  // Consent / privacy. Set region to "all" to show the banner to everyone.
  consent: {
    enabled: true,
    region: "eu", // "eu" | "all" | "off"
  },

  // ---- Newsletter ---------------------------------------------------
  newsletter: {
    headline: "One useful email, every Sunday",
    body: "A short digest of the week's guides, tools and one thing worth reading elsewhere. No spam, unsubscribe in one click.",
    provider: "buttondown", // buttondown | formspree | mailchimp | custom
    action: "https://buttondown.example/api/emails/embed-subscribe/stackwise",
    placeholderEmail: "you@example.com",
  },

  // ---- Search -------------------------------------------------------
  search: {
    enabled: true,
    indexUrl: "/search/index.json",
    pageUrl: "/search/",
  },

  analytics: {
    // Google tag id (gtag.js). Leave empty to emit no analytics at all.
    googleTagId: "",
    plausibleDomain: "",
    // Vercel Web Analytics: emits <script defer src="/_vercel/insights">
    // (the framework-agnostic integration — this site is Eleventy, not
    // Next.js, so the React component from the Vercel docs does not apply).
    // Requires deployment on Vercel + Web Analytics enabled in the project.
    vercel: true,
  },

  nav: [
    { title: "Home", url: "/" },
    { title: "What's New", url: "/whats-new/" },
    { title: "Guides", url: "/guides/" },
    { title: "Tutorials", url: "/tutorials/" },
    { title: "Reviews", url: "/reviews/" },
    { title: "About Us", url: "/about/" },
    { title: "Contact", url: "/contact/" },
  ],

  social: [
    { title: "X / Twitter", url: "https://x.com/stackwise" },
    { title: "GitHub", url: "https://github.com/stackwise" },
    { title: "RSS", url: "/feed.xml" },
  ],
};

// Same list as bare URLs for schema.org `sameAs` (external profiles only).
module.exports.sameAs = module.exports.social
  .map((s) => s.url)
  .filter((u) => /^https?:\/\//.test(u));
