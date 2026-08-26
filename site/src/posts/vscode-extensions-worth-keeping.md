---
title: "The VS Code extensions actually worth keeping in 2026"
description: "After auditing 47 installed extensions, 9 survived. Here is what stayed, what got removed, and the startup cost each one was charging."
date: 2026-07-10
category: Guides
categoryKey: guides
author: mayacohen
tags: [post, tooling, editors, productivity]
image: /assets/img/placeholder-a.svg
toc:
  - heading: "Why audit at all"
  - heading: "The nine that stayed"
  - heading: "What got removed"
  - heading: "Keeping it lean"
---

## Why audit at all

Run the built-in profiler and look at the output:

```text
Ctrl+Shift+P → Startup Performance
```

On my machine before the audit, extension activation was 1.9 seconds. That is not the window appearing — that is the delay between the window appearing and the editor being usable. It happens every single time you open the editor.

The same command after the audit: 340 ms.

## The nine that stayed

**GitLens** — blame annotations inline. The one extension I would reinstall first on a new machine. Configure it to show only the current line, or the annotations become noise.

**Error Lens** — renders diagnostics inline instead of in the problems panel. It changes how quickly you notice a type error from "when I look down" to "immediately".

**EditorConfig for VS Code** — enforces per-project indentation and line endings. Zero cost, prevents entire categories of diff noise in pull requests.

**Prettier** — with format-on-save scoped to specific languages, not globally. Formatting the wrong file type silently is worse than not formatting.

**TODO Highlight** — because you will write `TODO: fix this` and forget it exists.

**Code Spell Checker** — catches typos in identifiers and comments. Embarrassing typos in public APIs are expensive.

**Docker** — if you use containers at all. Otherwise skip it; it activates eagerly.

**Remote Development** — if you develop over SSH or in containers. Non-negotiable in that case, useless otherwise.

**Vim** — the one extension that changes how you edit rather than what you see. Worth the two-week learning cost if you have never tried modal editing.

<div class="callout">
  <span class="callout__label">The workspace rule</span>
  Install language-specific extensions per workspace, not globally. A Python extension you activate in a JavaScript project is 200 ms you pay for nothing, every time, in every window.
</div>

## What got removed

- **Themes I no longer use.** They are cheap, but four of them registered activation events.
- **Anything that duplicates a built-in feature.** VS Code now has bracket pair colorization, sticky scroll, inline suggest and a decent diff viewer natively. Three extensions I kept out of habit were doing work the editor already does.
- **AI assistants I had installed twice.** Two different providers, both activating on every file open, both sending the same context.
- **Icon themes.** Genuinely free, but I had four.

The pattern in every removal: the extension was not bad. It was redundant, or it was solving a problem I no longer had, and it was still charging startup time.

## Keeping it lean

Once a quarter, disable every extension and re-enable them one at a time over the following week. Anything you do not miss stays off.

Then check the actual cost rather than guessing:

```text
Ctrl+Shift+P → Developer: Show Running Extensions
```

It lists activation time per extension, live. Sort by the number, look at the top three, and ask whether each one is worth what it costs. For me, the answer was no about a third of the time.


## The settings that matter more than extensions

After the audit, I spent the reclaimed startup budget on editor settings instead. Four of them changed how the editor feels more than any extension did.

```json
{
  "editor.stickyScroll.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  "editor.formatOnSave": true,
  "[markdown]": { "editor.formatOnSave": false },
  "files.trimTrailingWhitespace": true,
  "editor.wordWrap": "on",
  "workbench.editor.limit.enabled": true,
  "workbench.editor.limit.value": 8
}
```

`stickyScroll` replaces the "which function am I in" extension. `bracketPairColorization` with `guides.bracketPairs: "active"` replaces the rainbow-brackets extension and is faster. Scoping `formatOnSave` off for Markdown stops Prettier from reflowing prose mid-sentence, which is the single most annoying default behaviour in the editor.

The editor limit is the quiet one. Eight open tabs is plenty; thirty is how you end up with a 900 MB window and no idea which file you were editing.

## Rebuilding the setup on a new machine

The test of any configuration is whether it reproduces. Keep three things in a repository:

1. `settings.json` and `keybindings.json`, symlinked into the user config directory
2. A `extensions.txt` from `code --list-extensions`
3. A one-line installer: `cat extensions.txt | xargs -L 1 code --install-extension`

Then, once a year, regenerate the extension list on a machine you have just set up and diff it against the repository. The difference is a year of things you installed "just to try" and never removed — which is exactly how the 47 became 47.
