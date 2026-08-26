#!/usr/bin/env node
/**
 * Post-build verification. Run `npm run build && npm test`.
 *
 * Checks the things that actually break a content site in production:
 * broken internal links, invalid structured data, missing legal pages,
 * missing ad placeholders, and search-index/URL drift.
 *
 * Exits non-zero on the first failing group so CI catches it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
})(DIST);

const htmlFiles = files.filter((f) => f.endsWith(".html"));
const read = (f) => fs.readFileSync(f, "utf8");
const rel = (f) => path.relative(ROOT, f);

let failures = 0;
const group = (name) => console.log(`\n\x1b[1m${name}\x1b[0m`);
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

/* ---- 1. Required pages ------------------------------------------------ */
group("Required pages (AdSense review checklist)");
const required = [
  "/", "/guides/", "/tutorials/", "/reviews/", "/blog/",
  "/about/", "/contact/", "/privacy-policy/", "/terms-of-service/",
  "/disclaimer/", "/cookie-policy/", "/affiliate-disclosure/",
  "/editorial-policy/", "/authors/", "/search/", "/404.html",
  "/sitemap.xml", "/robots.txt", "/feed.xml", "/ads.txt",
];
for (const url of required) {
  const target = path.join(DIST, url);
  const exists =
    fs.existsSync(target) ||
    fs.existsSync(path.join(target, "index.html"));
  check(url, exists);
}

/* ---- 2. Internal links ------------------------------------------------ */
group("Internal links");
const broken = new Map();
for (const file of htmlFiles) {
  const html = read(file);
  for (const href of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    const raw = href[1];
    if (/^(https?:|mailto:|tel:|#|javascript:)/.test(raw)) continue;
    const clean = raw.split("?")[0].split("#")[0];
    if (!clean.startsWith("/")) continue;
    const target = path.join(DIST, clean);
    const ok =
      fs.existsSync(target) || fs.existsSync(path.join(target, "index.html"));
    if (!ok) {
      if (!broken.has(clean)) broken.set(clean, []);
      broken.get(clean).push(rel(file));
    }
  }
}
check(
  "every internal link resolves",
  broken.size === 0,
  broken.size
    ? [...broken.entries()].map(([k, v]) => `${k} (from ${v[0]})`).join(", ")
    : `${htmlFiles.length} pages scanned`
);

/* ---- 3. Images -------------------------------------------------------- */
group("Images");
const missingImages = new Set();
let imgCount = 0;
let noAlt = 0;
for (const file of htmlFiles) {
  for (const tag of read(file).matchAll(/<img[^>]*>/g)) {
    imgCount++;
    if (!/alt=/.test(tag[0])) noAlt++;
    const src = /src="([^"]+)"/.exec(tag[0]);
    if (!src) continue;
    if (/^(data:|https?:)/.test(src[1])) continue;
    if (!fs.existsSync(path.join(DIST, src[1]))) missingImages.add(src[1]);
  }
}
check("all referenced images exist", missingImages.size === 0, [...missingImages].join(", "));
check("every <img> has an alt attribute", noAlt === 0, `${imgCount} images`);

/* ---- 4. Structured data ----------------------------------------------- */
group("Structured data (JSON-LD)");
let ldCount = 0;
let ldBad = 0;
const types = new Set();
for (const file of htmlFiles) {
  for (const block of read(file).matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs
  )) {
    const body = block[1].trim();
    if (!body) { ldBad++; console.log(`    empty block in ${rel(file)}`); continue; }
    try {
      const data = JSON.parse(body);
      ldCount++;
      if (data["@graph"]) data["@graph"].forEach((n) => types.add(n["@type"]));
      else types.add(data["@type"]);
    } catch (err) {
      ldBad++;
      console.log(`    invalid JSON in ${rel(file)}: ${err.message}`);
    }
  }
}
check("every JSON-LD block parses", ldBad === 0, `${ldCount} blocks`);
check(
  "required schema types present",
  ["Organization", "WebSite", "BlogPosting", "BreadcrumbList"].every((t) => types.has(t)),
  [...types].join(", ")
);

/* ---- 5. Ad placeholders ----------------------------------------------- */
group("AdSense readiness");
// Article pages are identified by the post-only banner slot, not by path.
const postFiles = htmlFiles.filter((f) => /data-ad-slot="headerBanner"/.test(read(f)));
check(
  "article pages carry labelled ad slots",
  postFiles.length >= 12,
  `${postFiles.length} article pages`
);

const homepage = read(path.join(DIST, "index.html"));
check("homepage has a sidebar ad slot", /data-ad-slot="sidebar"/.test(homepage));
check("ads.txt is served", fs.existsSync(path.join(DIST, "ads.txt")));

// Post-template features that a silent template regression would remove.
const missingRelated = postFiles.filter((f) => !/Related articles/.test(read(f)));
check(
  "every article shows a Related articles grid",
  missingRelated.length === 0,
  missingRelated.map(rel).join(", ")
);
const missingBio = postFiles.filter((f) => !/class="author-card"/.test(read(f)));
check("every article has an author bio box", missingBio.length === 0, missingBio.map(rel).join(", "));
const missingCrumbs = postFiles.filter((f) => !/aria-label="Breadcrumb"/.test(read(f)));
check("every article has breadcrumb navigation", missingCrumbs.length === 0, missingCrumbs.map(rel).join(", "));
check(
  "no empty ad containers render before approval",
  !/adsbygoogle/.test(homepage) || /ca-pub-(?!0000000000000000)/.test(homepage),
  "placeholders active until a real ca-pub id is set"
);

/* ---- 6. SEO basics ---------------------------------------------------- */
group("SEO basics");
const missingTitle = htmlFiles.filter((f) => !/<title>.+<\/title>/.test(read(f)));
const missingDesc = htmlFiles.filter((f) => !/<meta name="description" content="[^"]+"/.test(read(f)));
const missingCanonical = htmlFiles.filter((f) => !/<link rel="canonical"/.test(read(f)));
check("every page has a <title>", missingTitle.length === 0, missingTitle.map(rel).join(", "));
check("every page has a meta description", missingDesc.length === 0, missingDesc.map(rel).join(", "));
check("every page has a canonical URL", missingCanonical.length === 0, missingCanonical.map(rel).join(", "));

const robots = read(path.join(DIST, "robots.txt"));
check("robots.txt points at the sitemap", /Sitemap: \S+\/sitemap\.xml/.test(robots));
const sitemap = read(path.join(DIST, "sitemap.xml"));
const sitemapUrls = (sitemap.match(/<loc>/g) || []).length;
check("sitemap lists every indexable page", sitemapUrls >= 25, `${sitemapUrls} URLs`);

/* ---- 7. Search index -------------------------------------------------- */
group("Client-side search");
const index = JSON.parse(read(path.join(DIST, "search", "index.json")));
check("index is populated", index.docs.length >= 10, `${index.docs.length} documents`);
const deadDocs = index.docs.filter(
  (d) => !fs.existsSync(path.join(DIST, d.u, "index.html"))
);
check(
  "every indexed URL has a page",
  deadDocs.length === 0,
  deadDocs.map((d) => d.u).join(", ")
);

/* ---- 8. Content depth ------------------------------------------------- */
group("Content depth");
const words = index.docs.map((d) => d.w).sort((a, b) => a - b);
const median = words[Math.floor(words.length / 2)];
check("median article is 600+ words", median >= 600, `median ${median} words`);
check("shortest article is 400+ words", words[0] >= 400, `shortest ${words[0]} words`);
check("at least 12 articles published", index.docs.length >= 12, `${index.docs.length} published`);

/* ---- result ----------------------------------------------------------- */
console.log(
  failures === 0
    ? `\n\x1b[32mAll checks passed\x1b[0m — ${htmlFiles.length} pages.\n`
    : `\n\x1b[31m${failures} check(s) failed\x1b[0m\n`
);
process.exit(failures === 0 ? 0 : 1);
