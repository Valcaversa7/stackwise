---
title: "A zsh configuration that survives three years of daily use"
description: "Most dotfiles die within a year because they optimise for novelty. This one optimises for muscle memory: 12 plugins cut to 4, startup under 80ms, and nothing that changes behaviour between machines."
date: 2026-08-16
category: Guides
categoryKey: guides
author: mayacohen
tags: [post, shell, productivity, terminal]
featured: true
image: /assets/img/shell-config.jpg
imageAlt: "A dark terminal window with handwritten configuration notes beside it"
imageCaption: "The whole configuration is 140 lines. Everything else was removed for a reason."
toc:
  - heading: "Measure before you add"
  - heading: "The four plugins worth keeping"
  - heading: "Completion is the actual product"
  - heading: "Prompts should be quiet"
  - heading: "Making it portable"
---

## Measure before you add

Open a terminal and run this before you install anything:

```bash
for i in $(seq 1 5); do /usr/bin/time zsh -i -c exit; done
```

On a fresh macOS or Ubuntu install that prints roughly 0.02 seconds. After a year of adding frameworks, most people's shells take 400–900 ms. You open a terminal forty times a day; half a second each is twenty seconds of pure friction, and worse, it is the half second where you have already typed the command and are waiting.

The rule that keeps my configuration alive: **any plugin must justify itself against the millisecond cost.** That single rule removed six things I liked.

## The four plugins worth keeping

**1. `zsh-autosuggestions`** — grey ghost text from your history, accepted with →. This is the highest value-per-millisecond plugin that exists. Cost: about 4 ms.

**2. `zsh-syntax-highlighting`** — commands turn green when they resolve, red when they do not. It catches typos before you press enter, which is worth more than any completion system. Load it last.

**3. `fzf` key bindings** — `Ctrl-R` becomes a fuzzy history search with a preview, `Ctrl-T` a fuzzy file picker. Once you have used it, the built-in history search feels like guessing.

**4. `zsh-completions`** — additional completion definitions for tools the base system does not know. Pure data, no runtime cost until you press tab.

Everything else in the popular lists — themes, git status in the prompt, directory jumping wrappers, `nvm` — either duplicates these or can be replaced by a shell function.

Oh-my-zsh is not bad software; it is a distribution. It loads a directory of plugins you did not choose, and the framework cost is real. Clone the two or three repositories you actually want into `~/.zsh/plugins/` and source them directly:

```zsh
for plugin in zsh-autosuggestions zsh-syntax-highlighting zsh-completions; do
  source "$HOME/.zsh/plugins/$plugin/$plugin.zsh"
done
```

## Completion is the actual product

The completion system is what makes a shell feel fast, and it is almost always misconfigured. Three settings matter:

```zsh
zmodload zsh/complist
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}' 'r:|=*' 'l:|=* r:|=*'
zstyle ':completion:*' menu select
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}
zstyle ':completion:*' group-name ''
```

The `matcher-list` line is the important one. It gives you case-insensitive matching first, then partial-word matching: typing `dck` completes to `docker`, and `git ch ma` completes to `git checkout main`. After a week you stop typing full subcommands entirely.

Then generate completions for the tools that ship them but do not install them:

```bash
gh completion -s zsh > ~/.zsh/completions/_gh
docker completion zsh > ~/.zsh/completions/_docker
```

## Prompts should be quiet

A prompt showing your git branch, dirty state, exit code, virtualenv, Kubernetes context, Node version and the time is a prompt you stop reading. Within a week it becomes background noise, and then it is 60 ms of startup for decoration.

Show only what changes your next action:

```zsh
autoload -Uz vcs_info
zstyle ':vcs_info:git:*' formats ' %F{8}%b%f'
precmd() { vcs_info }
PROMPT='%F{8}%~%f${vcs_info_msg_0_} %# '
```

Directory, branch, prompt character. That is it. If you need the exit code, bind it to a key or use `setopt PRINT_EXIT_VALUE` — do not put it in the prompt where you will see it 4,000 times a day and read it zero.

<div class="callout">
  <span class="callout__label">The 80ms budget</span>
  Every line in your `.zshrc` is a trade between a feature and every future terminal window. When something feels sluggish, profile it rather than guessing: `zmodload zsh/zprof`, add `zprof` at the end of your config, and open a terminal. It prints the actual cost of every function.
</div>

## Making it portable

The failure mode is not a bad configuration; it is a configuration that only works on one machine. Three habits prevent that.

**Guard everything machine-specific.** `command -v` before you use a tool:

```zsh
if command -v fzf >/dev/null; then
  source /usr/share/doc/fzf/examples/key-bindings.zsh
fi
```

**Never hardcode paths that differ by OS.** macOS puts Homebrew in `/opt/homebrew`, Linux in `/usr/local` or `/usr`. Use `$(brew --prefix)` inside a guard, or better, add both to `$fpath` conditionally.

**Keep it in git, symlink it, and change it slowly.** A dotfiles repository you update twice a year beats a beautiful configuration you cannot reproduce on a new laptop. When you set up a machine, the test is not "does it work" — it is "did I have to edit anything". If you did, fix the config, not the machine.

The version I run today is 140 lines and has not changed meaningfully in three years. That is the goal. A shell you do not think about is a shell that is finished.
