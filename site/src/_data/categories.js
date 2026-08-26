/**
 * Category hubs. Each entry generates /<key>/ listing every post whose
 * `categoryKey` matches. Add an entry here and the category appears in the
 * nav, sidebar counts and footer automatically (see site.nav for nav order).
 */
module.exports = [
  {
    key: "guides",
    title: "Guides",
    description:
      "Long-form, opinionated guides to choosing and configuring the tools that sit underneath your work — version control, editors, shells, build systems and backups. Every recommendation here has survived at least a month of daily use.",
    order: 1,
  },
  {
    key: "tutorials",
    title: "Tutorials",
    description:
      "Step-by-step tutorials with copy-pasteable commands and a working end state. If a step fails, we say what the error looks like and how to get out of it.",
    order: 2,
  },
  {
    key: "reviews",
    title: "Reviews",
    description:
      "Hardware and software reviews measured with instruments where possible: power draw, latency, panel output, and the boring stuff that decides whether something survives a year of real use.",
    order: 3,
  },
];
