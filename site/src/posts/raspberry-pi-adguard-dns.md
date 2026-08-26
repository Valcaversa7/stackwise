---
title: "Pi-hole on a Raspberry Pi 5: network-wide ad blocking in 30 minutes"
description: "A step-by-step setup for Pi-hole v6 on Raspberry Pi OS, including the unbound recursive resolver, DNS-over-HTTPS upstream, DHCP handover, and the two settings that stop smart devices breaking."
date: 2026-07-22
category: Tutorials
categoryKey: tutorials
author: devanshnair
tags: [post, networking, raspberry-pi, self-hosting]
image: /assets/img/placeholder-c.svg
toc:
  - heading: "What you need"
  - heading: "Prepare the system"
  - heading: "Install Pi-hole"
  - heading: "Add a recursive resolver"
  - heading: "Hand over DHCP"
  - heading: "The two settings that break devices"
---

## What you need

A Raspberry Pi 5 with 4 GB is comfortably over-specced; a Pi 4 or a used thin client works. You also want a wired Ethernet connection — Wi-Fi adds latency to every DNS lookup on your network, and DNS is the one query that happens before anything else loads.

Everything below assumes Raspberry Pi OS (64-bit, Lite is fine) flashed with Raspberry Pi Imager.

## Prepare the system

Set a static address before anything else. A DNS server that changes address will take your network down on the next lease renewal:

```bash
sudo raspi-config nonint do_hostname pihole
sudo ip route show default   # note the gateway
```

Then edit the netplan or dhcpcd config for your release, and confirm the address survives a reboot:

```bash
sudo reboot
ip -4 addr show eth0
```

Update the system and give the Pi a little more entropy, which matters for DNSSEC validation:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl git unbound
```

## Install Pi-hole

The official installer is one command. Answer the prompts as follows: static address confirmed, DNS-over-HTTPS upstream set to `127.0.0.1#5335` (unbound, configured below), blocklists at default, web interface yes:

```bash
curl -sSL https://install.pi-hole.net | bash
```

At the end it prints a web password. Store it in your password manager immediately — the admin interface is how you will diagnose every "the internet is broken" report from your household.

## Add a recursive resolver

By default Pi-hole forwards queries to a public resolver such as Cloudflare or Google. That is fine, but it means one third party sees every domain your household queries. Running **unbound** locally removes that:

```bash
sudo tee /etc/unbound/unbound.conf.d/pi-hole.conf > /dev/null <<'CONF'
server:
  interface: 127.0.0.1
  port: 5335
  do-ip4: yes
  do-udp: yes
  do-tcp: yes
  access-control: 127.0.0.0/8 allow
  hide-identity: yes
  hide-version: yes
  prefetch: yes
  qname-minimisation: yes
forward-zone:
  name: "."
  forward-addr: 1.1.1.1@853#cloudflare-dns.com
  forward-addr: 9.9.9.9@853#dns.quad9.net
CONF

sudo systemctl enable --now unbound
dig @127.0.0.1 -p 5335 example.com +short
```

The `forward-addr` lines use port 853, which is DNS-over-TLS. If your network blocks outbound 853 — some corporate and hotel networks do — fall back to plain `1.1.1.1` and `9.9.9.9` without the `@853` suffix.

<div class="callout">
  <span class="callout__label">Warm-up</span>
  The first dozen queries after enabling unbound are slow, because it is fetching root and TLD records itself rather than asking a cache. Give it two minutes before you judge the latency, and enable `prefetch: yes` so popular records refresh before they expire.
</div>

## Hand over DHCP

For the whole network to use Pi-hole without configuring every device, the Pi must hand out addresses. Disable DHCP on your router first, then:

```bash
sudo pihole -a -d          # enable DHCP in the admin UI, or edit /etc/pihole/pihole.toml
sudo systemctl restart pihole-FTL
```

Set the range to match what your router was using, and set the router address as the gateway. Confirm from another device that it received a lease and that DNS points at the Pi.

## The two settings that break devices

**1. DNS rebinding protection.** Pi-hole refuses to resolve private IP addresses by default, which breaks local device discovery — printers, smart TVs, Home Assistant. Add your local domain to the permit list in Settings → DNS → Permitted Domains, for example `local`, `lan`, `home`.

**2. Query logging and privacy.** Full query logging is enormously useful for debugging and is also a complete record of your household's browsing. Set log retention to 24 hours in Settings → Privacy unless you are actively diagnosing something.

Once it is running for a week, check the dashboard's blocked-percentage figure. A typical household network sits between 8% and 18%. Much higher usually means a device in a retry loop rather than exceptional blocking.


## Blocklists without breaking the internet

The default Pi-hole blocklist is conservative and a good starting point. Adding aggressive lists is where things go wrong, because they block telemetry domains that some devices use for legitimate connectivity checks — a smart TV that cannot reach its captive-portal check will report "no internet" while working perfectly.

Add lists one at a time, live with each for a week, and check the query log before blaming anything else. When something breaks, the log tells you exactly which domain was blocked, and whitelisting one domain is nearly always the right fix rather than removing a whole list.

```bash
pihole -q netflix.com          # find out what matched
```

## Keeping it available

A DNS server that goes down takes the whole network with it, so give it a second upstream. In the Pi-hole admin interface, set a fallback resolver alongside unbound, so a failure in your local resolver does not become a household outage.

Two more habits:

- **Back up the config.** `/etc/pihole/pihole.toml` and the gravity database. A five-line cron to a synced directory means a failed SD card costs ten minutes rather than an evening.
- **Use a good SD card, or none at all.** Consumer SD cards fail under constant small writes. Boot from a USB SSD, or set up `log2ram` so the query log lives in memory and is flushed periodically.

The last thing worth knowing: when the network "breaks" and you are sure it is not the Pi, check the Pi first anyway. It is the DNS server. It is almost always the DNS server.
