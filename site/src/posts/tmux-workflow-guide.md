---
title: "A tmux workflow that survives remote work"
description: "Sessions that persist across SSH drops, a keybinding scheme that does not fight your editor, and the copy-mode setup that makes working over a slow connection tolerable."
date: 2026-06-24
category: Guides
categoryKey: guides
author: mayacohen
tags: [post, shell, terminal, remote-work]
image: /assets/img/placeholder-g.svg
toc:
  - heading: "Why tmux and not your terminal app"
  - heading: "The configuration that matters"
  - heading: "A layout for real work"
  - heading: "Copy mode over a slow link"
  - heading: "Reattaching without thinking"
---

## Why tmux and not your terminal app

Modern terminal emulators have tabs, splits and profiles. They do not survive the thing that actually interrupts remote work: the connection dropping.

A tmux session runs on the remote machine. When your laptop sleeps, the Wi-Fi changes or the VPN reconnects, the session and everything in it keeps running. You reattach and your editor is exactly where you left it, mid-keystroke.

That single property is worth the learning cost. Everything else is comfort.

## The configuration that matters

```tmux
# ~/.tmux.conf
set -g prefix C-a
unbind C-b
bind C-a send-prefix

set -g mouse on
set -g history-limit 50000
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on

# Reload config without restarting
bind r source-file ~/.tmux.conf \; display "Reloaded"

# Splits that open in the current path
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# Vim-style pane navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# True colour
set -g default-terminal "tmux-256color"
set -ga terminal-overrides ",*256col*:Tc"
```

The two settings people forget: `renumber-windows on` closes gaps when you kill a window, and `history-limit 50000` means scrolling back through a long build log actually works. The default 2,000 lines disappears in seconds.

`prefix C-a` is a preference, not a rule — but `C-b` collides with shell line-editing bindings in ways you will hit constantly.

<div class="callout">
  <span class="callout__label">True colour or nothing</span>
  Without the `Tc` override, editors inside tmux fall back to 256 colours and your carefully chosen theme looks wrong. If colours look off inside tmux but fine outside, this is almost always the cause.
</div>

## A layout for real work

Name your sessions after the project, not the day:

```bash
tmux new-session -s api -c ~/work/api
tmux new-session -s infra -c ~/work/infra
```

Inside a project session, a layout that has survived years: window 1 is the editor, window 2 is the server logs, window 3 is a scratch shell, window 4 is git. Consistency across sessions means you never look at the status bar to find something.

## Copy mode over a slow link

Selecting text with a mouse over SSH drags the selection through the network. Copy mode keeps it local:

```tmux
setw -g mode-keys vi
bind -T copy-mode-vi v send -X begin-selection
bind -T copy-mode-vi y send -X copy-pipe-and-cancel "pbcopy"
```

On Linux, replace `pbcopy` with `wl-copy` for Wayland or `xclip -selection clipboard` for X11. Then `prefix [`, `v` to select, `y` to copy — and the selection never leaves the machine.

## Reattaching without thinking

Put this in your shell config so `ssh host` always lands you in the right place:

```bash
ssht() {
  ssh -t "$1" "tmux attach -t ${2:-main} || tmux new-session -s ${2:-main}"
}
```

`ssht prod api` attaches to the `api` session on `prod`, creating it if this is the first time. The `-t` flag forces a TTY, which tmux requires.

The last habit that makes this stick: never run long commands directly in an SSH session. Start a session first, even for a two-minute task. The cost is one keystroke, and the day your connection drops mid-migration you will be glad you did.


## Sharing a session

The feature that surprises people: two people can attach to the same session and see the same thing, live. For pair debugging over SSH it beats screen sharing, because both people can type.

```bash
tmux new-session -s pair -A
```

`-A` attaches if the session exists and creates it if not, which makes the command idempotent and safe to put in an alias. Whoever attaches second sees the same panes and can move the cursor.

For read-only observation — useful when someone is demonstrating on a production host — create a grouped session that follows the window layout but has its own cursor:

```bash
tmux new-session -t pair -s watch
```

## Keeping sessions alive across reboots

tmux does not survive a reboot by default, and for a dev server that is usually fine. If you want it to, `tmux-resurrect` and `tmux-continuum` save and restore window layout, working directories and running programs:

```tmux
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @continuum-restore 'on'
```

Be selective about what gets restored. Resurrect can restart commands on restore, which is convenient until it restarts a migration against the wrong database. The default — layout and directories only, nothing running — is the right setting for most people.

## The one habit worth building

Name your sessions after the project and never close them. `ssht prod` in the morning puts you back in yesterday's context — same panes, same tail, same half-written query — and that continuity is worth more than any keybinding in this article.
