/* =========================================================================
   Stackwise — progressive enhancement layer.
   Everything here is optional: the site is fully readable and navigable
   with JavaScript disabled. No dependencies, no build step, ~4 KB gzipped.
   ========================================================================= */
(function () {
  "use strict";

  var doc = document;
  var win = window;

  /* ---------- 1. Sticky header shadow --------------------------------- */
  (function stickyHeader() {
    var header = doc.getElementById("siteHeader");
    if (!header) return;
    var stuck = false;
    function onScroll() {
      var next = win.scrollY > 8;
      if (next !== stuck) {
        stuck = next;
        header.classList.toggle("is-stuck", stuck);
      }
    }
    onScroll();
    win.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ---------- 2. Mobile navigation ------------------------------------ */
  (function mobileNav() {
    var toggle = doc.querySelector(".nav-toggle");
    var nav = doc.getElementById("siteNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    doc.addEventListener("click", function (e) {
      if (
        nav.classList.contains("is-open") &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        setOpen(false);
      }
    });

    // Close the drawer when it is no longer needed.
    var mq = win.matchMedia("(min-width: 52rem)");
    var sync = function () {
      if (mq.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener("change", sync);
  })();

  /* ---------- 3. Reading progress bar --------------------------------- */
  (function readingProgress() {
    var bar = doc.getElementById("readingProgress");
    var article = doc.querySelector(".article");
    if (!bar || !article) return;

    var ticking = false;
    function update() {
      ticking = false;
      var rect = article.getBoundingClientRect();
      var total = rect.height - win.innerHeight;
      var done = total > 0 ? (-rect.top / total) * 100 : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, done / 100)) + ")";
    }
    win.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          win.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  })();

  /* ---------- 4. Copy-link buttons ------------------------------------ */
  (function copyLink() {
    var buttons = doc.querySelectorAll("[data-copy-link]");
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var original = btn.textContent || "Copy link";
        var done = function () {
          btn.textContent = "Link copied ✓";
          win.setTimeout(function () {
            btn.textContent = original;
          }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(win.location.href).then(done, function () {});
        } else {
          // Fallback for older browsers / insecure contexts.
          var field = doc.createElement("textarea");
          field.value = win.location.href;
          field.setAttribute("readonly", "");
          field.style.position = "absolute";
          field.style.left = "-9999px";
          doc.body.appendChild(field);
          field.select();
          try {
            doc.execCommand("copy");
            done();
          } catch (err) {
            /* no-op */
          }
          doc.body.removeChild(field);
        }
      });
    });
  })();

  /* ---------- 5. Newsletter forms ------------------------------------- */
  (function newsletter() {
    var forms = doc.querySelectorAll("form.js-newsletter");
    if (!forms.length) return;

    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    forms.forEach(function (form) {
      var status = form.querySelector(".newsletter__status");
      var input = form.querySelector('input[type="email"]');
      var button = form.querySelector('button[type="submit"]');

      function say(message, isError) {
        if (!status) return;
        status.hidden = false;
        status.textContent = message;
        status.setAttribute("data-error", isError ? "true" : "false");
      }

      form.addEventListener("submit", function (e) {
        // Honeypot filled => almost certainly a bot. Fail silently.
        var honey = form.querySelector('input[name="company"]');
        if (honey && honey.value) {
          e.preventDefault();
          return;
        }

        var email = (input && input.value || "").trim();
        if (!EMAIL.test(email)) {
          e.preventDefault();
          say("Please enter a valid email address.", true);
          if (input) input.focus();
          return;
        }

        // Without a real endpoint configured, let the form post normally
        // (or do nothing) instead of faking success.
        var action = form.getAttribute("action") || "";
        if (!action || action.indexOf("example") !== -1) {
          e.preventDefault();
          say(
            "Subscriptions are not wired up yet — set site.newsletter.action to your provider endpoint.",
            true
          );
          return;
        }

        e.preventDefault();
        if (button) {
          button.disabled = true;
          button.textContent = "Sending…";
        }

        var provider = form.getAttribute("data-provider") || "custom";
        var body =
          provider === "buttondown"
            ? new URLSearchParams({ email: email })
            : new FormData(form);

        win
          .fetch(action, {
            method: "POST",
            body: body,
            mode: provider === "formspree" ? "cors" : "no-cors",
            headers:
              provider === "buttondown"
                ? { "Content-Type": "application/x-www-form-urlencoded" }
                : {},
          })
          .then(function () {
            form.reset();
            say("You're on the list — check your inbox to confirm.", false);
            if (button) button.textContent = "Subscribed ✓";
          })
          .catch(function () {
            say("That did not go through. Please try again in a moment.", true);
            if (button) {
              button.disabled = false;
              button.textContent = "Subscribe";
            }
          });
      });
    });
  })();

  /* ---------- 6. Cookie consent banner -------------------------------- */
  (function consent() {
    var banner = doc.getElementById("consentBanner");
    if (!banner) return;

    var KEY = "sw-consent";
    var region = banner.getAttribute("data-region") || "eu";

    // Cheap, dependency-free EU/UK heuristic. Swap for a geo-IP service or
    // your CMP's signal if you need something authoritative.
    function likelyEU() {
      if (region === "all") return true;
      try {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        if (tz.indexOf("Europe/") === 0) return true;
        var lang = (navigator.language || "").toLowerCase();
        var euLangs = ["de", "fr", "es", "it", "nl", "pt", "pl", "sv", "da", "fi", "cs", "el", "hu", "ro", "bg", "sk", "sl", "hr", "et", "lv", "lt", "mt", "ga"];
        return euLangs.indexOf(lang.split("-")[0]) !== -1;
      } catch (err) {
        return false;
      }
    }

    function read() {
      try {
        return win.localStorage.getItem(KEY);
      } catch (err) {
        return null;
      }
    }

    function write(value) {
      try {
        win.localStorage.setItem(KEY, value);
      } catch (err) {
        /* private mode */
      }
      doc.cookie =
        "sw-consent=" + value + "; path=/; max-age=31536000; SameSite=Lax";
      win.dispatchEvent(new CustomEvent("sw:consent", { detail: value }));
    }

    if (!read() && likelyEU()) banner.hidden = false;

    banner.addEventListener("click", function (e) {
      var choice = e.target.getAttribute && e.target.getAttribute("data-consent");
      if (choice) {
        write(choice);
        banner.hidden = true;
      }
    });
  })();

  /* ---------- 7. Client-side search ----------------------------------- */
  (function search() {
    var input = doc.getElementById("searchInput");
    var list = doc.getElementById("searchResults");
    var status = doc.getElementById("searchStatus");
    var fallback = doc.getElementById("searchFallback");
    if (!input || !list) return;

    var docs = null;
    var loading = null;

    function load() {
      if (docs) return Promise.resolve(docs);
      if (loading) return loading;
      loading = win
        .fetch("/search/index.json", { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("index unavailable");
          return r.json();
        })
        .then(function (json) {
          docs = json.docs || [];
          return docs;
        })
        .catch(function () {
          docs = [];
          return docs;
        });
      return loading;
    }

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    function highlight(text, terms) {
      var safe = esc(text);
      terms.forEach(function (t) {
        if (!t) return;
        var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
        safe = safe.replace(re, "<mark>$1</mark>");
      });
      return safe;
    }

    function score(doc, terms) {
      var title = (doc.t || "").toLowerCase();
      var desc = (doc.d || "").toLowerCase();
      var tags = (doc.g || []).join(" ").toLowerCase();
      var total = 0;
      terms.forEach(function (t) {
        if (!t) return;
        if (title.indexOf(t) === 0) total += 12;
        else if (title.indexOf(t) > 0) total += 8;
        if (tags.indexOf(t) !== -1) total += 5;
        if (desc.indexOf(t) !== -1) total += 3;
        if ((doc.c || "").toLowerCase().indexOf(t) !== -1) total += 4;
        if ((doc.a || "").toLowerCase().indexOf(t) !== -1) total += 1;
      });
      return total;
    }

    function snippetFor(doc, terms) {
      var desc = doc.d || "";
      var lower = desc.toLowerCase();
      var at = -1;
      terms.forEach(function (t) {
        var i = t ? lower.indexOf(t) : -1;
        if (i !== -1 && (at === -1 || i < at)) at = i;
      });
      if (at === -1) return desc.slice(0, 180);
      var from = Math.max(0, at - 60);
      return (from > 0 ? "…" : "") + desc.slice(from, from + 200);
    }

    function render(query) {
      var terms = query.toLowerCase().split(/\s+/).filter(Boolean);

      if (!terms.length) {
        list.innerHTML = "";
        status.textContent = "";
        if (fallback) fallback.hidden = false;
        return;
      }
      if (fallback) fallback.hidden = true;
      status.textContent = "Searching…";

      load().then(function (all) {
        var hits = all
          .map(function (d) {
            return { d: d, s: score(d, terms) };
          })
          .filter(function (r) {
            return r.s > 0;
          })
          .sort(function (a, b) {
            return b.s - a.s || (a.d.dt < b.d.dt ? 1 : -1);
          });

        status.innerHTML =
          hits.length === 0
            ? 'No articles match <mark>' + esc(query) + "</mark>. Try a broader term."
            : hits.length +
              " result" +
              (hits.length === 1 ? "" : "s") +
              ' for <mark>' +
              esc(query) +
              "</mark>";

        list.innerHTML = hits
          .slice(0, 30)
          .map(function (r) {
            var d = r.d;
            return (
              '<li>' +
              '<p class="eyebrow" style="margin:0 0 .3rem">' +
              esc(d.c) +
              " · " +
              esc(d.dt) +
              " · " +
              Math.max(1, Math.round(d.w / 225)) +
              " min read</p>" +
              '<h3><a href="' +
              esc(d.u) +
              '">' +
              highlight(d.t, terms) +
              "</a></h3>" +
              "<p>" +
              highlight(snippetFor(d, terms), terms) +
              "</p>" +
              "</li>"
            );
          })
          .join("");
      });
    }

    doc.getElementById("searchForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      try {
        win.history.replaceState(null, "", q ? "/search/?q=" + encodeURIComponent(q) : "/search/");
      } catch (err) {
        /* no-op */
      }
      render(q);
    });

    var debounce;
    input.addEventListener("input", function () {
      win.clearTimeout(debounce);
      debounce = win.setTimeout(function () {
        render(input.value.trim());
      }, 180);
    });

    // Deep link: /search/?q=monitor
    var initial = new URLSearchParams(win.location.search).get("q");
    if (initial) {
      input.value = initial;
      render(initial);
    }
  })();

  /* ---------- 8. AdSense lazy loading --------------------------------- */
  // Optional: only engages when a slot is explicitly marked `data-lazy`, so
  // it never double-pushes units that ad-slot.njk already pushed inline.
  (function ads() {
    if (!("IntersectionObserver" in win)) return;
    var lazy = doc.querySelectorAll("ins.adsbygoogle[data-lazy]");
    if (!lazy.length) return;

    var observer = new win.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          try {
            (win.adsbygoogle = win.adsbygoogle || []).push({});
          } catch (err) {
            /* already pushed */
          }
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "400px 0px" }
    );

    lazy.forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* ---------- 9. Theme toggle ------------------------------------------ */
  // The initial theme is applied pre-paint by an inline script in
  // base.njk (stored choice, else the OS preference) so there is never a
  // flash of the wrong theme. This owns interaction: click to flip,
  // persist to localStorage, and follow OS changes live until the reader
  // makes an explicit choice.
  (function themeToggle() {
    var btn = doc.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var root = doc.documentElement;
    var KEY = "sw-theme";
    var meta = doc.querySelector('meta[name="theme-color"]');

    function readStored() {
      try { return win.localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function writeStored(v) {
      try { win.localStorage.setItem(KEY, v); } catch (e) { /* private mode */ }
    }
    function current() {
      return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function system() {
      return win.matchMedia && win.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light";
    }
    function apply(theme, animate) {
      root.setAttribute("data-theme", theme);
      btn.setAttribute("aria-checked", String(theme === "dark"));
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0d1117" : "#ffffff");
      if (animate) {
        // Whole-page colour crossfade (CSS: html.theme-anim). Removed after
        // the transition window so normal paint stays instant afterwards.
        root.classList.add("theme-anim");
        win.clearTimeout(apply._t);
        apply._t = win.setTimeout(function () {
          root.classList.remove("theme-anim");
        }, 500);
      }
    }

    // Sync ARIA state with the pre-paint value (no animation on load).
    apply(current(), false);

    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      writeStored(next);
      apply(next, true);
    });

    // Until the reader chooses explicitly, keep mirroring the OS setting
    // (e.g. the OS flips to dark at sunset while a page is open).
    var mq = win.matchMedia && win.matchMedia("(prefers-color-scheme: dark)");
    if (mq) {
      var onSystemChange = function () {
        if (!readStored()) apply(system(), true);
      };
      if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    }
  })();

  /* ---------- 10. Feedback / complaints form --------------------------- */
  // Bottom-of-page form (base.njk). Submissions go to the Formspree form
  // /f/xaeywdgd, which emails the destination address set in the
  // Formspree dashboard. We post JSON with Accept: application/json so
  // Formspree answers with a JSON body (no redirect) and the success
  // popup can be shown without a page reload. Without JavaScript the
  // form still works — it posts normally to Formspree.
  (function feedbackForm() {
    var form = doc.getElementById("feedbackForm");
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    var toast = doc.getElementById("feedbackToast");
    var msg = toast && toast.querySelector(".toast__msg");

    function say(text, isError) {
      if (!msg) return;
      msg.textContent = text;
      toast.setAttribute("data-error", String(Boolean(isError)));
      toast.classList.add("is-visible");
      win.clearTimeout(say._t);
      say._t = win.setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 6500);
    }

    if (toast) {
      var close = toast.querySelector("[data-toast-close]");
      if (close) {
        close.addEventListener("click", function () {
          toast.classList.remove("is-visible");
          win.clearTimeout(say._t);
        });
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot filled => almost certainly a bot. Fail silently.
      var honey = form.querySelector('input[name="company"]');
      if (honey && honey.value) return;

      var email = form.querySelector('input[name="email"]');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value)) {
        say("Please enter a valid email address so we can reply.", true);
        email.focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = "Sending…";

      // Serialize the form to a plain object for the JSON payload.
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.type !== "submit") data[el.name] = el.value;
      });

      win
        .fetch("https://formspree.io/f/xaeywdgd", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
        .then(function (r) {
          return r.json().then(function (json) {
            return { ok: r.ok, status: r.status, data: json };
          });
        })
        .then(function (res) {
          if (res.ok && res.data && String(res.data.success).toLowerCase() === "true") {
            form.reset();
            say("Complaint sent ✓ We will get back to you within 5 working days.", false);
          } else {
            var detail =
              res.data && (res.data.error || res.data.message)
                ? " — " + (res.data.error || res.data.message)
                : " (HTTP " + res.status + ")";
            say("That did not go through" + detail + ". Please email stackwiseorg@gmail.com directly.", true);
          }
        })
        .catch(function () {
          say("That did not go through — please email stackwiseorg@gmail.com directly.", true);
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = "Send feedback";
        });
    });
  })();
})();
