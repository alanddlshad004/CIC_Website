/* Home hero slider + animated counters */
document.addEventListener("DOMContentLoaded", function () {
  var items = document.querySelectorAll(".first-item");
  var dots = document.querySelector(".first-section .dots");
  var progressBar = document.querySelector(".first-section .progress-bar");
  var nextArrow = document.querySelector(".first-section .next");
  var prevArrow = document.querySelector(".first-section .prev");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (items.length && dots && progressBar) {
    var current = 0;
    var timer = null;
    var interval = function () { return window.innerWidth <= 768 ? 7000 : 6000; };

    var resetProgress = function () {
      progressBar.style.transition = "none";
      progressBar.style.width = "0%";
      void progressBar.offsetWidth; // restart
      progressBar.style.transition = "width " + interval() / 1000 + "s linear";
      progressBar.style.width = "100%";
    };

    var go = function (index) {
      if (index === current) return;
      var prev = items[current];
      prev.classList.add("leaving");
      prev.classList.remove("active");
      current = (index + items.length) % items.length;
      items[current].classList.add("active");
      setTimeout(function () { prev.classList.remove("leaving"); }, 1300);
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.classList.toggle("active", i === current);
        dot.setAttribute("aria-selected", i === current ? "true" : "false");
      });
      restart();
    };

    var restart = function () {
      clearInterval(timer);
      resetProgress();
      if (!reduce) timer = setInterval(function () { go(current + 1); }, interval());
    };

    var bind = function (el, fn) {
      if (!el) return;
      el.addEventListener("click", fn);
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
    };
    bind(nextArrow, function () { go(current + 1); });
    bind(prevArrow, function () { go(current - 1); });
    dots.addEventListener("click", function (e) {
      if (e.target.classList.contains("dot")) go(Array.prototype.indexOf.call(dots.children, e.target));
    });

    // swipe support
    var startX = null;
    var hero = document.querySelector(".first-section");
    hero.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
      startX = null;
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(timer); else restart();
    });

    restart();
  }

  /* ---------- Counters ---------- */
  var counters = document.querySelectorAll(".counter");
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };
  var run = function (el) {
    var target = +el.getAttribute("data-count");
    if (reduce) { el.textContent = target; return; }
    var dur = 2200, t0 = null;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round(target * easeOut(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  } else {
    counters.forEach(run);
  }
});
