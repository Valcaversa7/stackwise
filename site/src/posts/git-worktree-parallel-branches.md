---
title: "Git worktrees: the parallel-branch setup that ends context-switching pain"
description: "Stop stashing half-finished work every time a bug report lands. One clone, many working directories, zero stash archaeology — here is the layout we use and the three commands that make it safe."
date: 2026-08-24
updated: 2026-08-25
category: Guides
categoryKey: guides
author: mayacohen
tags: [post, git, workflow, version-control]
featured: true
image: /assets/img/git-worktree.jpg
imageAlt: "A developer desk with several code editor windows open side by side"
imageCaption: "One clone, five working copies. The cost is disk space; the saving is every interrupted thought you used to lose."
toc:
  - heading: "The problem worktrees actually solve"
  - heading: "The layout that scales"
  - heading: "Six commands you will use daily"
  - heading: "Hooks, environment files and node_modules"
  - heading: "Cleaning up without losing work"
schemaType: TechArticle
---

## The problem worktrees actually solve

Every developer has this moment. You are forty minutes into a refactor, the code is in a state that compiles but does not behave, and a message arrives: production is broken, can you look now.

The old answer is `git stash`. The old answer also means you will spend fifteen minutes tomorrow remembering what the stash was for, whether you already popped a version of it, and why `node_modules` disagrees with the branch you are suddenly standing on.

A **worktree** is a second working directory attached to the same repository. Same `.git` object store, same history, same remotes — different files on disk, checked out to a different branch. You can `cd` into it, and your unfinished refactor is untouched in the directory you just left.

```bash
git worktree add ../hotfix main
```

That is the whole feature. The rest of this article is the discipline around it.

## The layout that scales

The mistake people make first is creating worktrees inside the repository. Do not. Git will not stop you, and your editor's file watcher, your test runner's glob, and eventually a `rm -rf` will.

Keep a flat directory of siblings:

```text
~/work/
  api/            ← the "primary" worktree, stays on main
  api-hotfix/     ← emergency fixes, always branched from main
  api-feature-x/  ← long-running feature work
```

Two rules make this survivable:

1. **The primary clone never moves.** `~/work/api` is always on `main`, always clean. It is the directory you run `git fetch` in and the directory you trust.
2. **Name worktrees after the branch, not the task.** `api-feature-x` tells you what is checked out without opening it. `api-wip` tells you nothing at 9pm on a Thursday.

If you work on many repositories, wrap it in a shell function:

```bash
# ~/.zshrc
wt() {
  local repo="${PWD:t}"
  git -C "$HOME/work/$repo" worktree add "../$repo-$1" "$1" 2>/dev/null \
    || git -C "$HOME/work/$repo" worktree add -b "$1" "../$repo-$1"
  cd "$HOME/work/$repo-$1"
}
```

`wt fix-login` now either checks out the existing `fix-login` branch or creates it, and drops you in the directory.

## Six commands you will use daily

| Command | What it does |
| --- | --- |
| `git worktree add <path> <branch>` | New working directory on an existing branch |
| `git worktree add -b <new> <path> <base>` | New branch *and* new directory in one step |
| `git worktree list` | Every working copy, its path and its branch |
| `git worktree remove <path>` | Delete a worktree (refuses if dirty) |
| `git worktree prune` | Forget worktrees whose directory you deleted manually |
| `git worktree lock <path>` | Protect a worktree on a removable drive from pruning |

The one that surprises people: **a branch can only be checked out in one worktree at a time.** Git refuses, loudly, because two working copies writing to the same branch is a recipe for lost commits. If you genuinely need the same commit in two places, use a detached checkout:

```bash
git worktree add --detach ../api-inspect v2.4.1
```

## Hooks, environment files and node_modules

Worktrees share history but not working files. That means three things will bite you on the first run:

**`.env` files are not tracked**, so a fresh worktree has none. Keep a committed `.env.example` and copy it in the same motion as the checkout:

```bash
git worktree add ../api-hotfix main && cp ~/work/api/.env ../api-hotfix/.env
```

**Dependencies are per-directory.** `node_modules`, `.venv`, `target/` — each worktree needs its own. For Node projects, `pnpm` with a global store makes this nearly free because packages are hard-linked rather than copied; a second worktree installs in seconds instead of minutes. For Python, keep a `uv` or `pip-tools` lockfile so the second environment is reproducible rather than "whatever I installed last".

**Hooks live in `.git/hooks`, which is shared** — except that in a worktree the real hooks directory is `.git/worktrees/<name>/hooks`. Git resolves this for you, but tools that write hooks by path (Husky, pre-commit) sometimes do not. Run the hook installer once per worktree and verify:

```bash
git rev-parse --git-path hooks
```

If that prints a path containing `worktrees/`, your hook tool needs to be pointed at it explicitly.

<div class="callout">
  <span class="callout__label">Key takeaway</span>
  Worktrees trade disk space for attention. On a 2 GB repository with four worktrees you will use roughly 8 GB — cheap next to the cost of losing an afternoon to stash archaeology. The exception is monorepos with enormous generated trees; there, use worktrees for the source and symlink the build cache.
</div>

## Cleaning up without losing work

Worktrees accumulate the way browser tabs do. A weekly tidy takes thirty seconds:

```bash
git worktree list --porcelain | grep -E '^(worktree|branch)'
```

Read the list, then remove anything merged:

```bash
git worktree remove ../api-feature-x
git branch -d feature-x
```

`git worktree remove` refuses to delete a dirty directory, which is exactly the behaviour you want — it is the last line of defence between you and an uncommitted change. When you have deleted the folder with `rm -rf` first, `git worktree prune` cleans the bookkeeping.

The habit that makes this stick: **remove the worktree in the same terminal session where you merge the pull request.** Do it as part of the merge, not as separate housekeeping, and the directory tree stays legible for months instead of days.

Once it clicks, going back to a single working copy feels like having one browser tab. You will stash less, interrupt yourself less, and — the part nobody mentions — you will review other people's branches properly, because checking one out no longer costs you your own work.
