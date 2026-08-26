---
title: "CSS dark mode done right: one variable layer, no flash, no duplication"
description: "Implementing a theme with custom properties, respecting prefers-color-scheme, avoiding the white flash on load, and the contrast mistakes that make dark themes unreadable."
date: 2026-06-28
category: Tutorials
categoryKey: tutorials
author: inesalvarez
tags: [post, css, web-development, accessibility]
image: /assets/img/placeholder-f.svg
toc:
  - heading: "One layer of variables"
  - heading: "Following the system preference"
  - heading: "Killing the white flash"
  - heading: "The contrast mistakes"
---

## One layer of variables

The implementation that scales defines colour once, in variables, and never references a hex code in a component rule again:

```css
:root {
  --ink: #0d1117;
  --body: #3d454f;
  --muted: #69707a;
  --line: #e5e8ec;
  --bg: #ffffff;
  --surface: #f6f7f9;
  --accent: #1f4fd8;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ink: #f0f2f5;
    --body: #b9c0c8;
    --muted: #98a0a9;
    --line: #262b32;
    --bg: #0d1117;
    --surface: #151a21;
    --accent: #7ba3ff;
  }
}
```

Every component uses `var(--body)`. Adding a third theme later is a third variable block and nothing else. The mistake to avoid is duplicating rules — `.dark .card { ... }` — because then every new component needs two definitions and one of them will be forgotten.

## Following the system preference

`prefers-color-scheme` alone is correct for most sites. It respects what the reader already chose at the OS level, requires no JavaScript, and has no stored state to get out of sync.

Add a manual toggle only if users ask for it, and when you do, make the toggle override rather than replace the media query:

```css
:root[data-theme="dark"] { /* dark values */ }
:root[data-theme="light"] { /* light values */ }
```

Because attribute selectors have higher specificity than a bare `:root`, the toggle wins when set and the media query applies when it is not. No JavaScript logic to determine "which is active".

## Killing the white flash

The classic bug: a dark-preference user loads the page, sees a white screen for 200 ms, then it flips. The cause is that the theme script runs after the first paint.

Two ways to fix it. If the stylesheet is inlined in `<head>`, the media query applies before first paint and there is no flash at all — this is the cleanest fix and it is free if your CSS is small.

If you store a manual preference, set the attribute before the body renders, with a tiny blocking script in `<head>`:

```html
<script>
  try {
    var t = localStorage.getItem("theme");
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

Three lines, blocking, and it must run before any CSS that depends on the attribute. This is the one place a render-blocking script is justified.

<div class="callout">
  <span class="callout__label">Do not invert images</span>
  Screenshots, diagrams and photographs look wrong inverted. If you need theme-aware imagery, use `<picture>` with a `prefers-color-scheme` media query on the source, and always ship a sensible default for readers with no preference set.
</div>

## The contrast mistakes

**Pure black on pure white is too harsh.** `#000` on `#fff` in a dark theme causes halation for many readers — the text appears to glow. Use a very dark grey background (`#0d1117`) and a very light grey text (`#f0f2f5`).

**Do not reuse your light-theme accent colour.** A saturated blue that reads well on white often fails contrast on a dark background. Lighten and desaturate it — `#1f4fd8` becomes something closer to `#7ba3ff`.

**Test at every text size.** WCAG requires 4.5:1 for body text and 3:1 for large text, and the failures are almost always in the muted and faint tiers: captions, timestamps, placeholder text. Run a contrast checker over each variable pair, not just the headline ones.

**Elevation must come from lightness, not shadows.** On a dark background a drop shadow is invisible. Raise surfaces by making them slightly lighter, in 3–5% steps, and reserve shadows for overlays that float above the page.

The result should be a theme you cannot tell is a theme: same hierarchy, same rhythm, different values.
