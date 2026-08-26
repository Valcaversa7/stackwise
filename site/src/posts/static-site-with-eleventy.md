---
title: "Build a static site with Eleventy: from empty folder to deploy in an afternoon"
description: "A complete walkthrough of the static site generator behind this site — content collections, layouts, a zero-dependency search index, and the build settings that keep a Lighthouse score above 95."
date: 2026-07-26
category: Tutorials
categoryKey: tutorials
author: mayacohen
tags: [post, web-development, static-sites, eleventy]
image: /assets/img/eleventy-tutorial.jpg
imageAlt: "A laptop showing a clean article layout with printed page proofs beside it"
imageCaption: "The finished site builds in under a second and ships 21 KB of CSS, inlined."
toc:
  - heading: "Why static, and why Eleventy"
  - heading: "Project setup"
  - heading: "Content collections"
  - heading: "Layouts that compose"
  - heading: "Search without a service"
  - heading: "Deploying"
---

## Why static, and why Eleventy

A content site has no database-shaped problem. Posts change a few times a week, they are read far more often than they are written, and every millisecond of server round-trip is a millisecond a reader waits.

Static generation inverts that: build HTML at commit time, serve it from a CDN, and let the only JavaScript be the little that genuinely needs it. Eleventy is the right tool for this because it does not impose a component model. Your templates are templates; your data is data; there is no client-side runtime to ship.

## Project setup

```bash
mkdir my-site && cd my-site
npm init -y
npm install --save-dev @11ty/eleventy
```

Create the configuration file. Everything here is optional, but these four settings cover 90% of projects:

```js
// .eleventy.js
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md")
       .sort((a, b) => b.date - a.date)
  );

  return {
    dir: { input: "src", output: "dist", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
  };
};
```

Add the scripts and run the dev server:

```json
"scripts": {
  "build": "eleventy",
  "start": "eleventy --serve"
}
```

## Content collections

A collection is any list of content you want to loop over. Front matter supplies the metadata; the filename supplies the URL:

```markdown
---
title: "Shipping a static site"
date: 2026-07-20
category: Tutorials
tags: [post, web-development]
---

Body text here, with **Markdown** that becomes HTML.
```

Then loop over it in a template. Note that `templateContent` is only available at render time, not inside a collection callback — a trap that costs most people an hour:

```njk
{%- for post in collections.posts | limit(6) %}
<article>
  <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
  <time datetime="{{ post.date | isoDate }}">{{ post.date | readableDate }}</time>
</article>
{%- endfor %}
```

## Layouts that compose

Layouts chain. A post template declares `layout: layouts/post.njk`, and `post.njk` declares `layout: layouts/base.njk`. Content flows upward through `{{ content | safe }}`, so your `<head>`, header and footer live in exactly one file:

```njk
{# layouts/base.njk #}
<!doctype html>
<html lang="en">
<head>
  <title>{{ title }} · {{ site.name }}</title>
  <meta name="description" content="{{ description }}">
  <link rel="canonical" href="{{ site.url }}{{ page.url }}">
</head>
<body>
  {% include "partials/header.njk" %}
  <main>{{ content | safe }}</main>
  {% include "partials/footer.njk" %}
</body>
</html>
```

One performance decision worth making early: **inline the stylesheet.** For a site with a single 20 KB CSS file, `{% include %}`-ing it into `<head>` removes a render-blocking request entirely. That single change is usually worth 10–20 points of Lighthouse performance on mobile.

<div class="callout">
  <span class="callout__label">Two gotchas that cost us an afternoon</span>
  First, `pagination.filter` is an **exclusion** list, not an inclusion list — values you name are removed from the paged data. Second, function-style collections do not receive a usable `this.ctx` when called from Nunjucks; expose them as filters instead.
</div>

## Search without a service

Client-side search needs an index, and the index can be built at compile time. Generate JSON from the collection, then rank it in the browser:

```njk
---
permalink: /search/index.json
---
{{ { docs: searchDocs } | dump | safe }}
```

Keep the documents small — title, URL, description, category, date. A 200-post index is roughly 40 KB gzipped, which loads faster than most search widgets' scripts alone. Score title matches higher than body matches and you get results that feel server-side.

## Deploying

Any static host works. The build output is a folder of HTML, so the deployment is a file copy:

```yaml
# .github/workflows/deploy.yml
- run: npm ci
- run: npm run build
- uses: actions/upload-pages-artifact@v3
  with: { path: dist }
```

Add the three files a content site needs and most tutorials skip: `sitemap.xml` (a template looping over `collections.all`), `robots.txt` pointing at it, and `feed.xml` for RSS. Together they are forty lines of template and they are what makes the site discoverable.

Total build time for this site, with eighteen posts and inlined CSS: 0.25 seconds.


## The settings that keep Core Web Vitals green

Three build decisions do most of the work, and none of them are clever.

**Inline the CSS, defer the fonts.** A single render-blocking stylesheet request is usually 150–400 ms on a mobile connection. Inlining 20 KB removes the request entirely. Fonts are the opposite: load them with `media="print" onload="this.media='all'"` so they never block, and keep a system-font stack as the fallback so text is never invisible.

**Reserve space for every image.** Cumulative Layout Shift on a content site is almost always images loading without dimensions. Put `width` and `height` on every `<img>` and let the browser compute the aspect ratio:

```html
<img src="/assets/img/hero.jpg" alt="" width="1600" height="900"
     loading="lazy" decoding="async" style="aspect-ratio:16/9">
```

**Lazy-load below the fold, eager-load the hero.** `loading="lazy"` on everything is a mistake — it delays the largest contentful paint. Mark the first image `loading="eager" fetchpriority="high"` and lazy-load the rest.

## Debugging the two traps

Both of these cost me an afternoon, so here is the short version.

**`pagination.filter` excludes.** The name suggests inclusion; the behaviour is removal. Values you list are taken *out* of the paged data. If you want one item, do not use `filter` at all — import the data and index it.

**`eleventyImport.collections` does not create a variable.** It only declares a build-order dependency. You still read the collection as `collections.myCollection`. Assuming otherwise produces silently empty templates rather than an error.

## Where to go next

Once the basics work, the additions in rough order of value: an RSS feed, a sitemap, Open Graph images, related-posts by shared tags, and a reading-time filter. All five together are under a hundred lines of configuration, and they are the difference between a blog and a publication.
