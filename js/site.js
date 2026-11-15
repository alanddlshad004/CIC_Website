/* CIC — shared site behaviour (navigation, scroll states, reveal animations) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");
  var body = document.body;

  /* ---------- Header: solid / hide-on-scroll / reading progress ---------- */
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    var overlay = body.classList.contains("header-overlay");

    var update = function () {
      var y = window.scrollY;
      var h = header.offsetHeight;
      var docH = document.documentElement.scrollHeight - window.innerHeight;

      header.classList.add("is-solid");
      header.classList.toggle("is-scrolled", y > 8);
      header.style.setProperty("--progress", docH > 0 ? Math.min(y / docH, 1) : 0);
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("menu-header");
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("activemenu", open);
      body.classList.toggle("menuopen", open);
      toggle.classList.toggle("menuopen", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    };
    toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("activemenu")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  }

  /* ---------- Language dropdown: dock into header + tap support ---------- */
  var slot = document.querySelector(".site-header .lang-slot");
  var selector = document.querySelector(".language-selector");
  if (slot && selector) slot.appendChild(selector);
  var langBtn = document.getElementById("languageBtn");
  if (langBtn) {
    var dd = langBtn.closest(".language-dropdown");
    langBtn.addEventListener("click", function (e) { e.stopPropagation(); dd.classList.toggle("open"); });
    document.addEventListener("click", function () { dd.classList.remove("open"); });
  }

  /* ---------- Reveal on scroll ----------
     Position-based (no IntersectionObserver), so clipped images, smooth
     scrolling and slow networks can never leave content hidden. */
  var revealQueue = [];
  var revealTick = false;
  var checkReveals = function () {
    revealTick = false;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    revealQueue = revealQueue.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0 || r.bottom < 0) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
    if (!revealQueue.length) {
      window.removeEventListener("scroll", onRevealScroll);
      window.removeEventListener("resize", onRevealScroll);
    }
  };
  var onRevealScroll = function () {
    if (!revealTick) { revealTick = true; requestAnimationFrame(checkReveals); }
  };
  var startReveals = function () {
    if (startReveals.done) return;
    startReveals.done = true;
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
        child.style.setProperty("--d", i % 6);
      });
    });
    var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal], [data-aos]"));
    if (reduceMotion) { targets.forEach(function (el) { el.classList.add("is-in"); }); return; }
    revealQueue = targets;
    window.addEventListener("scroll", onRevealScroll, { passive: true });
    window.addEventListener("resize", onRevealScroll);
    checkReveals();
    setTimeout(checkReveals, 300);
  };

  // Start after the intro loader (if any) — but never wait more than 4s.
  if (document.getElementById("loading-container") && body.classList.contains("loading")) {
    document.addEventListener("cic:loaded", startReveals, { once: true });
    setTimeout(startReveals, 4000);
  } else {
    startReveals();
  }
  // Last-resort safety net: if scripts stall, show everything.
  setTimeout(function () {
    if (!startReveals.done) document.documentElement.classList.remove("js");
  }, 8000);

  /* ---------- Smooth in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  });

  /* ---------- Table of contents (legal pages) ---------- */
  var toc = document.querySelector("[data-toc]");
  if (toc) {
    var heads = Array.prototype.slice.call(document.querySelectorAll(".prose h2, .prose h3"));
    var build = function () {
      var lng = document.documentElement.lang;
      var title = lng === "ar" ? "المحتويات" : lng === "ckb" ? "ناوەڕۆک" : "Contents";
      var html = '<span class="toc-title">' + title + '</span><ol>';
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "sec-" + (i + 1);
        html += '<li><a href="#' + h.id + '"></a></li>';
      });
      toc.innerHTML = html + "</ol>";
      var links = toc.querySelectorAll("a");
      heads.forEach(function (h, i) { links[i].textContent = h.textContent.trim(); });
      links.forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          document.getElementById(a.getAttribute("href").slice(1)).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        });
      });
      return links;
    };
    var tocLinks = build();
    // rebuild labels after a language switch
    if (typeof window.changeLanguage === "function") {
      var origChange = window.changeLanguage;
      window.changeLanguage = function (lang) { origChange(lang); tocLinks = build(); };
    }
    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var idx = heads.indexOf(en.target);
            tocLinks.forEach(function (l, i) { l.classList.toggle("active", i === idx); });
          }
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      heads.forEach(function (h) { spy.observe(h); });
    }
  }

  /* ---------- Toast helper (contact form) ---------- */
  window.showToast = window.showToast || function (message, type) {
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "success");
    toast.setAttribute("role", "status");
    toast.innerHTML = "<p></p><button class=\"close-toast\" aria-label=\"Close\">&times;</button>";
    toast.querySelector("p").textContent = message;
    body.appendChild(toast);
    toast.querySelector(".close-toast").addEventListener("click", function () { toast.remove(); });
    setTimeout(function () { toast.remove(); }, 5000);
  };

  /* ======================================================================
     Motion layer v2
     ====================================================================== */

  /* ---------- Word splitting (re-runs after every language change) ---------- */
  var splitEl = function (el) {
    if (el.querySelector(".w")) return;
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var wi = document.createElement("span"); wi.className = "wi"; wi.style.setProperty("--i", i++);
            wi.textContent = part; w.appendChild(wi); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          walk(n);
        }
      });
    };
    walk(el);
  };
  var splitAll = function () {
    document.querySelectorAll('[data-reveal="split"], [data-split]').forEach(splitEl);
  };
  if (typeof window.changeLanguage === "function") {
    var baseChange = window.changeLanguage;
    window.changeLanguage = function (lang) {
      baseChange(lang);
      splitAll();
      if (window.__cicLenis) window.__cicLenis.resize();
    };
  } else {
    splitAll();
  }

  /* ---------- Smooth scrolling ---------- */
  var startLenis = function () {
    if (reduceMotion || !window.Lenis || window.__cicLenis) return;
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1 });
    window.__cicLenis = lenis;
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id === "#") { e.preventDefault(); lenis.scrollTo(0); return; }
        var t = document.querySelector(id);
        if (t) { e.preventDefault(); e.stopImmediatePropagation(); lenis.scrollTo(t, { offset: -(header ? header.offsetHeight : 0) - 16 }); }
      }, true);
    });
  };
  if (window.Lenis) startLenis(); else window.addEventListener("load", startLenis);

  /* ---------- Hero scroll-away + back-to-top ring ---------- */
  var hero = document.querySelector(".first-section");
  var toTop = document.querySelector(".to-top");
  var onScroll2 = function () {
    var y = window.scrollY;
    if (hero) hero.style.setProperty("--hero-p", Math.min(Math.max(y / hero.offsetHeight, 0), 1).toFixed(3));
    if (toTop) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      toTop.classList.toggle("show", y > window.innerHeight * 0.8);
      toTop.style.setProperty("--progress", max > 0 ? (y / max).toFixed(3) : 0);
    }
  };
  if (!reduceMotion) { window.addEventListener("scroll", onScroll2, { passive: true }); onScroll2(); }
  else if (toTop) { window.addEventListener("scroll", function () { toTop.classList.toggle("show", window.scrollY > 600); }, { passive: true }); }
  if (toTop) toTop.addEventListener("click", function (e) {
    e.preventDefault();
    if (window.__cicLenis) window.__cicLenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Spotlight + tilt (pointer devices only) ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".service-item, .doctor-card .card-image, .vacancy-card, .info-list > *").forEach(function (el) {
      el.classList.add("spot");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
    document.querySelectorAll(".cards-container .card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add("tilting");
        card.style.transform = "rotateX(" + (-py * 8).toFixed(2) + "deg) rotateY(" + (px * 8).toFixed(2) + "deg) translateZ(0)";
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("tilting");
        card.style.transform = "";
      });
    });
  }

  /* ---------- Brand curves draw-in ---------- */
  document.querySelectorAll(".has-curves").forEach(function (c) {
    c.setAttribute("data-reveal-curves", "");
    var check = function () {
      var r = c.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.8) { c.classList.add("is-in"); window.removeEventListener("scroll", check); }
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
  });
})();
