/**
 * The stylesheet, exposed to templates so it can be inlined into <head>.
 * Inlining ~20 KB of CSS removes a render-blocking request entirely, which
 * is the single biggest win for Largest Contentful Paint on a content site.
 *
 * There is exactly one copy on disk (src/assets/css/style.css); the
 * passthrough copy in .eleventy.js also serves it at /assets/css/style.css
 * for anyone who wants to hotlink it.
 */
const fs = require("node:fs");
const path = require("node:path");

module.exports = function () {
  const file = path.join(__dirname, "..", "assets", "css", "style.css");
  return fs.readFileSync(file, "utf8");
};
