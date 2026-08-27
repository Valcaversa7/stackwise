/**
 * Author registry. Posts reference an author with `author: mayacohen`
 * in front matter; templates resolve the full profile from here.
 *
 * Avatars are inline data-URI SVG monograms so the site ships with zero
 * binary assets. Swap `avatar` for a real 160×160 photo path when you have one.
 */
const monogram = (initials, from, to) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="160" height="160" fill="url(#g)"/>` +
      `<text x="80" y="82" font-family="Georgia,serif" font-size="62" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>` +
      `</svg>`
  );

module.exports = {
  mayacohen: {
    name: "Belsso",
    role: "Editor-in-chief",
    avatar: monogram("B", "#0d1117", "#374151"),
    bio: "Belsso has shipped developer tooling for eleven years and writes about the parts nobody documents: build systems, hardware that survives a backpack, and workflows that survive a deadline.",
    url: "/about/",
    social: [
      { label: "X / Twitter", url: "https://x.com/stackwise" },
      { label: "GitHub", url: "https://github.com/stackwise" },
    ],
  },
  devanshnair: {
    name: "Devan Nair",
    role: "Hardware editor",
    avatar: monogram("DN", "#1f4fd8", "#0ea5b7"),
    bio: "Devan reviews laptops, monitors and desk hardware with a stopwatch and a power meter, and refuses to recommend anything he would not buy himself.",
    url: "/about/",
    social: [{ label: "X / Twitter", url: "https://x.com/stackwise" }],
  },
  inesalvarez: {
    name: "Inés Álvarez",
    role: "Contributing writer",
    avatar: monogram("IA", "#7c3aed", "#c026d3"),
    bio: "Inés covers productivity systems and note-taking. She has rebuilt her personal knowledge base four times and will tell you which rebuild was a mistake.",
    url: "/about/",
    social: [{ label: "GitHub", url: "https://github.com/stackwise" }],
  },
};
