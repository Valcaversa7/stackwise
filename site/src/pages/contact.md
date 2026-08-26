---
layout: layouts/page.njk
title: "Contact Us"
description: "Get in touch with the Stackwise team — tips, corrections, privacy requests, or a pitch."
permalink: /contact/
updated: 2026-08-01
eyebrow: Contact
showNewsletter: false
---

We read everything that arrives. Most messages get a reply within a few days.

<div class="contact-grid">
  <div class="contact-card">
    <h3>General &amp; tips</h3>
    <p>Questions about an article, a tool we should test, or something you think we missed.</p>
    <p><a href="mailto:hello@stackwise.example">hello@stackwise.example</a></p>
  </div>
  <div class="contact-card">
    <h3>Corrections</h3>
    <p>Spotted a factual error? Send the URL and what you believe is wrong. We verify and fix.</p>
    <p><a href="mailto:corrections@stackwise.example">corrections@stackwise.example</a></p>
  </div>
  <div class="contact-card">
    <h3>Privacy requests</h3>
    <p>Access, deletion, or questions about advertising cookies and your data.</p>
    <p><a href="mailto:privacy@stackwise.example">privacy@stackwise.example</a></p>
  </div>
  <div class="contact-card">
    <h3>Pitches</h3>
    <p>Written something you think belongs here? Tell us the finding, not just the topic.</p>
    <p><a href="mailto:hello@stackwise.example">hello@stackwise.example</a></p>
  </div>
</div>

## Send a message

<form action="https://formspree.io/f/yourformid" method="POST" class="form-grid">
  <div class="field">
    <label for="c-name">Your name</label>
    <input id="c-name" type="text" name="name" required autocomplete="name">
  </div>
  <div class="field">
    <label for="c-email">Email address</label>
    <input id="c-email" type="email" name="email" required autocomplete="email">
  </div>
  <div class="field">
    <label for="c-topic">What is this about?</label>
    <select id="c-topic" name="topic">
      <option>General question</option>
      <option>A correction</option>
      <option>A pitch</option>
      <option>Privacy request</option>
      <option>Advertising</option>
    </select>
  </div>
  <div class="field">
    <label for="c-message">Message</label>
    <textarea id="c-message" name="message" required></textarea>
  </div>
  <input class="hp-field" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div>
    <button class="btn" type="submit">Send message</button>
  </div>
</form>

<p style="font-size:.85rem;color:var(--muted);margin-top:1.5rem">
  The form is handled by our form provider and stores only what you send.
  See the <a href="/privacy-policy/">Privacy Policy</a> for how long we keep it
  (24 months) and how to ask for deletion.
</p>

## Response times

| Type | Typical reply |
| --- | --- |
| Corrections | 3 working days |
| General questions | 5 working days |
| Privacy requests | 30 days maximum, usually far less |
| Pitches | 10 working days |

We are a small team and this is not our only job, but we would rather reply slowly than not at all.
