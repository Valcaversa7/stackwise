---
title: "Password managers compared: Bitwarden, 1Password and KeePassXC after six months"
description: "We ran all three in parallel across macOS, Linux, Android and iOS for six months. The security models are close; the differences that matter are sync reliability, autofill friction and what happens when you lose a device."
date: 2026-08-04
category: Reviews
categoryKey: reviews
author: mayacohen
tags: [post, security, software, password-managers]
image: /assets/img/password-manager.jpg
imageAlt: "Small padlocks and a hardware security key arranged on marble next to a phone"
imageCaption: "Six months, three vaults, four platforms. Autofill friction decided the winner."
toc:
  - heading: "How we tested"
  - heading: "Bitwarden"
  - heading: "1Password"
  - heading: "KeePassXC"
  - heading: "The decision that is not about the app"
schemaType: Review
---

## How we tested

Three vaults, four platforms, six months, real usage rather than a weekend trial. We logged autofill failures, sync conflicts, recovery attempts and export/import round-trips. Everything below is what happened, not what the marketing pages claim.

One caveat: all three are open source or audited, all three use strong encryption, and none of them has had a vault-compromising breach in the tested period. **If you are currently using browser-saved passwords or a spreadsheet, any of the three is an enormous upgrade.** The differences here are about friction.

## Bitwarden

**What is good:** it is free for genuinely useful functionality, the sync is reliable, and the self-hosted option (Vaultwarden) means your vault can live on hardware you own. The browser extensions are the best of the three at handling awkward login forms, including the ones that split email and password across two pages.

**What is not:** the desktop and mobile apps feel a generation behind. Everything works, nothing delights. The web vault is the interface you will actually use, and its TOTP generator and password health report are both a click deeper than they should be.

**Recovery:** a single 34-character recovery code. Store it offline and you are fine; lose it and there is no support path.

## 1Password

**What is good:** the fastest, most polished interface of the three by a clear margin, and Watchtower's breach reporting is genuinely actionable rather than alarmist. Travel mode — temporarily hiding designated vaults at a border — is a real feature that the others do not have.

**What is not:** subscription-only, and the price has risen twice in four years. It is closed source, so the client is audited but not inspectable, which matters to some people and not at all to others. Linux support arrived late and still trails the other platforms in features.

**Recovery:** an account key plus a secret key. The two-factor model is well designed, but it means 1Password holds one of your two factors — a deliberate trade of sovereignty for convenience.

<div class="callout">
  <span class="callout__label">Where the six months diverged</span>
  Autofill failures: Bitwarden 4, 1Password 2, KeePassXC 11. Sync conflicts: zero for all three. Time to unlock on a cold phone: 1Password fastest by roughly a second, which over six months is the difference between using it and typing the password.
</div>

## KeePassXC

**What is good:** total local control. Your database is a file; you decide where it lives and how it syncs. No subscription, no account, no vendor. The format is open and has thirty years of client implementations behind it, which is the strongest portability guarantee available.

**What is not:** you are the sync layer. Put the database in a synced folder and you will eventually hit a conflict; run your own Syncthing and you have a second system to maintain. Mobile is the weak point — the good clients are paid and the autofill integration is inconsistent across Android versions.

**Recovery:** there is nothing to recover. If you lose the file and the key, the data is gone. That is the point, and it is also the risk.

## The decision that is not about the app

Choose on two questions, not on features.

**Who holds the key?** 1Password holds one factor; Bitwarden self-hosted and KeePassXC hold none. If you want the vendor out of your trust model entirely, the answer is local-first and you accept the mobile friction.

**How much friction will you tolerate on a phone?** This decides more than anything else. If autofill fails three times, you will start reusing a memorable password, and the entire exercise is worthless. On the phones we tested, 1Password was the most reliable and KeePassXC the least.

Our pick for most readers: **Bitwarden** if you want free and self-hostable, **1Password** if you will pay for the smoothest daily experience. Choose KeePassXC if local control is a principle rather than a preference, and you are comfortable operating your own sync.

Whichever you pick, turn on a hardware security key as the second factor rather than an authenticator app. It is the one upgrade that meaningfully raises the ceiling.
