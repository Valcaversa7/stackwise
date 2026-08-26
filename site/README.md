# Stackwise

An editorial tech & productivity publication built on [Eleventy](https://www.11ty.dev/) 3.
Static HTML, inlined CSS, no framework, no client-side runtime beyond ~4 KB of
progressive enhancement.

Built for three things, in this order: **readability**, **SEO**, and **Google AdSense
approval**.

---

## Quick start

```bash
npm install
npm start          # dev server with live reload → http://localhost:8080
npm run build      # production build → dist/
npm test           # post-build verification (run after every build)
```

Node 18 or newer. The full build takes about 0.6 seconds for 70 pages.

---

## What is here

| Area | Implementation |
| --- | --- |
| **Header** | Sticky, blurred, shadow on scroll. Brand left, nav centre, search right. Hamburger below 52rem. |
| **Homepage** | 3-card featured hero (lead tile spans two rows), 3-column responsive post grid, category strips, sidebar. |
| **Sidebar** | About-the-author box, popular categories with live counts, newsletter, sidebar ad, latest posts, topic cloud. Sticky on wide viewports. |
| **Post template** | 750px measure, breadcrumbs, hero image, TOC, banner + in-article + in-feed ad slots, callouts, author bio, related grid, prev/next, newsletter. |
| **Archives** | `/guides/`, `/tutorials/`, `/reviews/`, `/blog/` (paginated at 9 per page), `/topic/<tag>/`. |
| **Footer** | 4-column dark footer: brand, browse, company, legal. |
| **Legal** | Privacy Policy (full AdSense cookie clause), Terms, Disclaimer, Cookie Policy, Affiliate Disclosure, Editorial Policy. |
| **Search** | Zero-dependency client-side search over a compile-time JSON index. |
| **SEO** | JSON-LD (Organization, WebSite + SearchAction, BlogPosting/TechArticle/Review, BreadcrumbList, AboutPage, ContactPage), canonical URLs, Open Graph, Twitter cards, sitemap, RSS, robots.txt. |
| **Performance** | CSS inlined (no render-blocking stylesheet), HTML minified, lazy images with explicit dimensions, deferred JS, non-blocking font load. |
| **Accessibility** | Skip link, semantic landmarks, `aria-current`, focus-visible rings, reduced-motion support, print stylesheet, automatic dark mode. |

---

## Project layout

```
src/
├── _data/
│   ├── site.js           ← ★ the one file you must edit before deploying
│   ├── authors.js        author registry (posts reference by key)
│   ├── categories.js     category hubs (drives nav, sidebar counts, archives)
│   ├── primaryAuthor.js  whose bio appears in the sidebar
│   ├── searchIndex.js    builds the client-side search index at compile time
│   └── style.js          exposes the stylesheet for inlining into <head>
├── _includes/
│   ├── layouts/
│   │   ├── base.njk      the shell; block-based (see "Why block inheritance")
│   │   ├── post.njk      article template
│   │   ├── hub.njk       category / archive template
│   │   └── page.njk      static page template
│   ├── partials/         header, footer, sidebar, cards, ad-slot, consent…
│   └── icons/            inline SVG icons
├── assets/
│   ├── css/style.css     ← the single source of truth for design tokens
│   ├── img/              article photography + SVG placeholders
│   └── js/main.js        nav, progress bar, search, consent, newsletter
├── pages/                static + archive templates, legal copy
└── posts/                Markdown articles
```

---

## Adding an article

Drop a Markdown file in `src/posts/`. The filename becomes the URL.

```markdown
---
title: "The article title"
description: "One sentence. This becomes the meta description and the card excerpt."
date: 2026-09-01
updated: 2026-09-05          # optional — emits dateModified + a visible note
category: Guides             # display name
categoryKey: guides          # must match a key in _data/categories.js
author: mayacohen            # must match a key in _data/authors.js
tags: [post, git, workflow]  # "post" is added automatically; the rest drive /topic/
featured: true               # optional — pins to the homepage hero
image: /assets/img/hero.jpg
imageAlt: "Describe the image for screen readers"
imageCaption: "Optional caption under the hero image"
schemaType: TechArticle      # optional — defaults to BlogPosting. Review for reviews.
adPosition: 5                # optional — inject the in-article ad after this paragraph
toc:
  - heading: "First section"   # quote headings that contain a colon
  - heading: "Second section"
---

Write in Markdown. Code fences, tables and blockquotes all render.
Use `<div class="callout"><span class="callout__label">Key takeaway</span>…</div>`
for a highlighted box.
```

**Do not use `{{ }}` in a post body.** Markdown is deliberately rendered with no
template engine, so GitHub Actions / Vue / Handlebars snippets render literally
instead of breaking the build. Interpolation (`{{ site.name }}`) works in
`src/pages/` only, where it is useful for legal copy.

---

## AdSense checklist

The site renders **labelled placeholder boxes** until you set a real publisher ID,
so a reviewer never sees an empty ad container and your layout never shifts when
ads start filling.

1. In `src/_data/site.js`, set `adSense.client` to your `ca-pub-…` ID and
   `adSense.publisherId` to your `pub-…` ID.
2. Set `adSense.adsTxtLine` to the exact line Google gives you
   (`google.com, pub-…, DIRECT, f08c47fec0942fa0`). It is served at `/ads.txt`.
3. Fill `adSense.slots` with your ad unit IDs (`headerBanner`, `inArticle`,
   `sidebar`, `inFeed`, `footer`).
4. Set `site.url` to your real domain. Canonical URLs, sitemap, RSS and all
   JSON-LD are derived from it.
5. Set `newsletter.action` and `newsletter.provider` (`buttondown`, `formspree`,
   `mailchimp` or `custom`). Until then the form shows an honest "not wired up"
   message rather than faking success.
6. Set the contact form's Formspree ID in `src/pages/contact.md`.
7. Optionally set `analytics.googleTagId` or `analytics.plausibleDomain`.
8. `npm run build && npm test`.

Consent: `site.consent.region` is `"eu"` by default — the banner appears for
EU/UK visitors using a timezone + language heuristic with no geolocation service.
Set it to `"all"` for a global banner or `"off"` to disable.

**Before you submit for review**, replace the placeholder copy: author names,
email addresses, social links and the "12,400+ readers" figure in
`partials/newsletter.njk` are all invented.

---

## Why block inheritance instead of Eleventy layouts

`layouts/base.njk` is a Nunjucks shell with two blocks (`main`, `structuredData`)
that templates `{% extends %}` into. Eleventy's own layout chain would work for
the page body, but a variable set inside a content template is **not** visible to
its layout — which makes it impossible for a post template to emit its own
`BlogPosting` JSON-LD into `<head>`. Block contents do travel up, so they can.

The trade-off: templates use `{% extends %}` rather than `layout:` front matter.
Markdown posts still use `layout: layouts/post.njk` (set in `src/posts/posts.11tydata.js`),
because `post.njk` is itself a template that extends the base.

### Other Eleventy 3 behaviours worth knowing

- **Front matter is not merged onto `page`.** `page.title` is undefined in a post
  layout. Use the variable directly, or pass it to a filter.
- **Data files never receive `page`.** `src/_data/*.js` functions get global data
  only. Per-template values must come from `eleventyComputed` or filters.
- **`pagination.filter` excludes.** Values you list are removed from the paged
  data, not selected.
- **`eleventyImport.collections` declares build order only.** You still read the
  collection as `collections.myCollection`.
- **This Nunjucks build has no `split`, `map`, `keys` or `first` filter**, and no
  context filters. `splitOn`, `limit`, `sliceFrom`, `where`, `countIn`, `recent`,
  `neighbours` and `relatedTo` are defined in `.eleventy.js` to cover it.
- **`{% set obj.prop = value %}` crashes the compiler.** Build a new object instead.

---

## Design tokens

Everything lives in `:root` at the top of `src/assets/css/style.css`. Change
`--ink`, `--accent` and `--serif`/`--sans` and the whole site follows, including
the dark theme (which overrides the same variables inside
`@media (prefers-color-scheme: dark)`).

The fonts are Fraunces (headings) and Inter (body), loaded non-blocking from
Google Fonts with a full system-font fallback stack — so the site renders
correctly offline or with fonts blocked, it just falls back to Palatino/Georgia
and the system sans. To self-host, drop the files in `src/assets/fonts/`, add a
passthrough copy, and replace the two `<link>` tags with `@font-face` rules.

---

## Deployment

`dist/` is a folder of static files. Any host works.

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

Netlify / Vercel / Cloudflare Pages: build command `npm run build`, publish
directory `dist`. Set the 404 page to `/404.html`.

---

## Verification

`npm test` runs `scripts/verify.mjs` against the built output and fails the build
on any of: missing required pages, broken internal links, missing image files,
`<img>` without `alt`, unparseable JSON-LD, missing schema types, missing ad
slots or author boxes on article pages, missing title/description/canonical,
sitemap gaps, search-index URLs that do not resolve, and articles below the
content-depth thresholds. Run it in CI.
