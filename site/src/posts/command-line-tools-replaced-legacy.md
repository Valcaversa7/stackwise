---
title: "Nine command-line tools that replaced the ones I grew up with"
description: "ripgrep, fd, bat, delta, zoxide and friends. Each one is a drop-in replacement with a real speed or usability gain — and each one has a fallback for machines you do not control."
date: 2026-06-20
category: Tutorials
categoryKey: tutorials
author: mayacohen
tags: [post, shell, tooling, productivity]
image: /assets/img/placeholder-h.svg
toc:
  - heading: "The rule for adopting new tools"
  - heading: "The replacements"
  - heading: "Making them work on machines you do not own"
---

## The rule for adopting new tools

A replacement tool has to pass two tests: it must be meaningfully better in a way you notice daily, and it must degrade gracefully when it is not installed. The second test is the one people skip, and it is why a beautiful dotfiles setup becomes a liability on a new server.

Every tool below is wrapped in an alias with a fallback:

```zsh
if command -v rg >/dev/null; then alias grep='rg'; fi
```

## The replacements

**`ripgrep` instead of `grep -r`.** Recursively searches a codebase respecting `.gitignore`, in parallel. On our 400k-line test repository it finds a string in about 90 ms where `grep -r` takes 4.2 seconds. The `.gitignore` awareness is the real win: no more results from `node_modules`.

```bash
rg "TODO" --type ts -C 2
```

**`fd` instead of `find`.** Sane syntax, coloured output, parallel traversal, and it skips hidden and ignored files by default — which is what you want 95% of the time.

```bash
fd -e md --changed-within 7d      # markdown files edited this week
```

**`bat` instead of `cat`.** Syntax highlighting, line numbers and git diff markers in the gutter, with automatic paging for long files. `bat -p` gives plain output when you are piping.

**`delta` instead of raw `git diff`.** This is the biggest quality-of-life change on the list. Side-by-side diffs, syntax highlighting, and word-level change markers that make a one-character edit obvious:

```gitconfig
[core]
    pager = delta
[delta]
    side-by-side = true
    line-numbers = true
```

**`zoxide` instead of `cd`.** Learns which directories you visit and lets you jump by fragment: `z api` from anywhere lands in `~/work/api`. After a week it is faster than any autocompletion.

**`eza` instead of `ls`.** Git status per file, tree view, proper human-readable sizes. `eza --git --tree --level 2` replaced a workflow I did not know I had.

**`fzf` for interactive selection.** Not a replacement so much as a layer over everything else. `Ctrl-R` for history, `Ctrl-T` for files, and a `kill` picker that ends the era of `ps aux | grep`:

```bash
ps aux | fzf | awk '{print $2}' | xargs kill -9
```

**`tldr` instead of `man` for the first five minutes.** Community-written examples for common commands. `man` is still the authority; `tldr` is how you remember the flag you used last month.

**`jq` for anything JSON.** Not new, but non-negotiable. Parsing JSON with grep is how you get a production incident at 2am.

```bash
curl -s api/status | jq '.services[] | select(.healthy == false) | .name'
```

<div class="callout">
  <span class="callout__label">The one I would not give up</span>
  If you install exactly one thing from this list, install `delta`. Diff review is something you do dozens of times a day, and the difference between a wall of red and green and a readable side-by-side comparison is the difference between reviewing code and skimming it.
</div>

## Making them work on machines you do not own

Three habits keep a modern toolset portable.

**Guard every alias.** As above — `command -v` before you assume. An unguarded alias to a missing binary turns `grep` into "command not found" at the worst possible moment.

**Keep a static binary kit.** `ripgrep`, `fd`, `bat` and `delta` all ship single static binaries. A 30 MB tarball in your home directory covers any Linux machine you can SSH into, no package manager required.

**Learn the originals anyway.** You will end up on a minimal container with nothing but `grep`, `find` and `cat`. The modern tools make you faster; the classics keep you from being helpless. Know both, prefer the fast ones where you can install them.
