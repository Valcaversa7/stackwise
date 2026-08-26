/**
 * Client-side search index, built at compile time.
 *
 * Eleventy collections cannot read `templateContent` (it does not exist yet
 * while the collection map is being built), so this global data file reads
 * the Markdown sources from disk directly and reduces them to plain text.
 * Good enough for search ranking; the reading-time filter on rendered HTML
 * stays the source of truth for "X min read" on the page itself.
 *
 * Consumed by src/search/index.json.njk and /assets/js/main.js.
 */
const fs = require("node:fs");
const path = require("node:path");

const POSTS_DIR = path.join(__dirname, "..", "posts");

/* ---- minimal front matter parser (avoids a YAML dependency) ----------- */
function parseFrontMatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();

    if (/^\[.*\]$/.test(value)) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      continue;
    }
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else value = value.replace(/^["']|["']$/g, "");

    data[key] = value;
  }
  return { data, body: raw.slice(match[0].length) };
}

/* ---- Markdown -> plain text ------------------------------------------ */
function toPlainText(md) {
  return (
    md
      // Code blocks count as content: in a tutorial they are the substance.
      // Only the fence markers and language tag are dropped.
      .replace(/```[a-zA-Z0-9+-]*\n?/g, " ")
      .replace(/^---[\s\S]*?^---\s*/m, " ") // front matter
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> label
      .replace(/^\s*>\s?/gm, " ") // blockquotes
      .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
      .replace(/^\s*([-*+]|\d+\.)\s+/gm, "") // list bullets
      .replace(/^\s*\|.*\|\s*$/gm, " ") // tables
      .replace(/^\s*([-*_])\s*(\1\s*){2,}$/gm, " ") // hr
      .replace(/[*_`~]+/g, "") // inline emphasis
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

module.exports = function () {
  let files = [];
  try {
    files = fs
      .readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_smoke"));
  } catch (err) {
    return { generated: new Date().toISOString(), count: 0, docs: [] };
  }

  const docs = files
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, body } = parseFrontMatter(raw);
      const slug = file.replace(/\.md$/, "");
      const text = toPlainText(body);
      return {
        t: data.title || slug,
        u: `/${slug}/`,
        d: (data.description || text).slice(0, 220),
        c: data.category || "Guides",
        k: data.categoryKey || "guides",
        g: (data.tags || []).filter((t) => t !== "post"),
        a: data.author || "mayacohen",
        dt: data.date ? new Date(data.date).toISOString().slice(0, 10) : "",
        w: text.split(/\s+/).filter(Boolean).length,
        draft: Boolean(data.draft),
      };
    })
    .filter((d) => !d.draft && d.dt)
    .sort((a, b) => (a.dt < b.dt ? 1 : -1))
    .map(({ draft, ...rest }) => rest);

  return {
    generated: new Date().toISOString(),
    count: docs.length,
    docs,
  };
};
