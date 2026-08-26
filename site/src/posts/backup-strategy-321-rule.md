---
title: "The 3-2-1 backup rule, updated for 2026 hardware"
description: "Three copies, two media, one offsite is still right — but the media have changed. What to buy, what to automate, and the one restore test that tells you whether your backups are real."
date: 2026-08-12
category: Guides
categoryKey: guides
author: devanshnair
tags: [post, backups, hardware, storage]
image: /assets/img/backup-strategy.jpg
imageAlt: "External drives and a small NAS arranged in a row on a linen surface"
imageCaption: "A backup you have never restored is a hypothesis, not a backup."
toc:
  - heading: "The rule, restated"
  - heading: "Choosing the local copy"
  - heading: "The offsite copy in 2026"
  - heading: "Encryption is not optional"
  - heading: "The restore test"
---

## The rule, restated

**Three copies of your data, on two different media, with one copy offsite.** The rule is thirty years old and has survived every technology change since, because it is not about hardware — it is about independent failure modes.

A laptop drive and a Time Machine disk in the same drawer are not two media in any meaningful sense. They share a location, a power supply, a burglar and a fire. The rule only earns its keep when the failure modes are genuinely independent.

## Choosing the local copy

For the copy that lives next to the machine, you want speed and cheap capacity, in that order, because a backup you wait for is a backup you skip.

**A USB-C NVMe enclosure with a 2 TB drive** costs roughly what a decent external HDD did five years ago and is five times faster. Full-disk backups finish in minutes rather than hours, which means you can run them hourly instead of nightly.

**Spinning disks still win on cost per terabyte** and, importantly, on cold storage: an unpowered HDD holds data reliably for years, while an unpowered SSD can lose charge and leak data over a similar period. If you keep an archive of things you rarely touch, put it on spinning rust and power it twice a year.

**Avoid SMR drives for anything you write to regularly.** Shingled magnetic recording drives rewrite whole zones when data changes; in a NAS with several disks, a rebuild can take days instead of hours. Check the model number against the manufacturer's spec sheet before buying — CMR is the label you want.

<div class="callout">
  <span class="callout__label">Buy drives, not enclosures</span>
  Pre-built external drives use whatever mechanism is cheapest that quarter. Buy a bare drive and a separate enclosure: you can read the SMART health data, you can swap the enclosure when it fails (they fail more often than drives), and you can move the disk to a NAS later without reformatting.
</div>

## The offsite copy in 2026

Three options, and the honest trade-offs:

**Cloud backup with unlimited storage** — Backblaze B2, Wasabi, or a consumer service. The right answer for most people. Cost is predictable, the copy is genuinely offsite, and restore is a matter of bandwidth rather than logistics. The catch is egress: restoring 4 TB from a bucket store can cost as much as a year of storage. Read the egress pricing before you commit, not after.

**A second physical drive, rotated** — keep one at work or a relative's house, swap monthly. Free, fast to restore, no subscription. It only works if you actually rotate it; treat the swap like a bill you pay.

**A NAS at a second location with sync** — the best technical answer and the most expensive. A small two-bay unit with a scheduled rsync over Tailscale or WireGuard gives you a live offsite mirror. Budget for the second internet connection's upload speed, which is usually the bottleneck.

## Encryption is not optional

An offsite copy is a copy someone else can physically hold. Encrypt at rest, with a passphrase you store in your password manager and nowhere else:

```bash
# macOS APFS encrypted volume
diskutil apfs addVolume disk4 APFSX Backup -passphrase

# Linux, LUKS on a spare partition
cryptsetup luksFormat --type luks2 /dev/sdb1
cryptsetup open /dev/sdb1 backup
```

Then verify the backup tool encrypts too — a tool that writes plaintext into an encrypted container is fine, but a tool that uploads unencrypted chunks to a bucket is a leak waiting for a misconfigured permission.

## The restore test

Here is the part everyone skips. Pick one file at random — a photo from two years ago, a specific project folder — and restore it. Time yourself.

If the restore takes longer than you are willing to wait during an actual disaster, the backup is not sized correctly. If it fails, you have just learned something valuable for the cost of twenty minutes instead of a catastrophe.

Run this quarterly. Write the date and the result in a note. It is the only evidence that your backup strategy exists.
