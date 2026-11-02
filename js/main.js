/* =========================================================
   WanderLux — shared site behaviour (loaded on every page)
   1. Mobile navigation toggle
   2. Footer year
   3. Scroll-reveal animations (IntersectionObserver)
   4. Home page rotating banner
   5. Services filter
   ========================================================= */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile navigation ---------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      toggle.querySelector(".nav-toggle-text").textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close with Escape and return focus to the toggle button
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when resizing up to desktop width
    window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- 2. Footer year ---------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- 3. Scroll-reveal ---------- */
  function initReveal() {
    const targets = document.querySelectorAll(".reveal, .journey");
    if (!targets.length) return;

    // Without IntersectionObserver (very old browsers) or with reduced motion, show everything at once
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Stagger siblings inside a group, e.g. cards in a grid
    document.querySelectorAll("[data-stagger]").forEach((group) => {
      const step = Number(group.dataset.stagger) || 90;
      group.querySelectorAll(".reveal").forEach((child, i) => {
        child.style.setProperty("--delay", i * step + "ms");
      });
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // animate once only
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
  }

  /* ---------- 4. Rotating banner ---------- */
  function initCarousel() {
    const hero = document.querySelector("[data-carousel]");
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dotsWrap = hero.querySelector(".hero-dots");
    const prevBtn = hero.querySelector("[data-prev]");
    const nextBtn = hero.querySelector("[data-next]");
    const pauseBtn = hero.querySelector("[data-pause]");
    const live = hero.querySelector("[data-live]");
    const INTERVAL = 6000;
    let index = 0;
    let timer = null;
    let paused = prefersReducedMotion; // never auto-rotate for users who ask for less motion

    // Build a labelled button per slide
    const dots = slides.map((slide, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hero-dot";
      btn.textContent = slide.dataset.name;
      btn.setAttribute("aria-label", "Show " + slide.dataset.name);
      btn.addEventListener("click", () => { goTo(i); restart(); });
      li.appendChild(btn);
      dotsWrap.appendChild(li);
      return btn;
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const active = n === index;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", String(!active));
        // keep links in hidden slides out of the tab order
        s.querySelectorAll("a, button").forEach((el) => (el.tabIndex = active ? 0 : -1));
      });
      dots.forEach((d, n) => d.setAttribute("aria-current", String(n === index)));
      if (live) live.textContent = "Slide " + (index + 1) + " of " + slides.length + ": " + slides[index].dataset.name;
    }

    function start() {
      if (paused) return;
      stop();
      timer = window.setInterval(() => goTo(index + 1), INTERVAL);
    }
    function stop() { window.clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    function setPaused(p) {
      paused = p;
      pauseBtn.setAttribute("aria-pressed", String(p));
      pauseBtn.setAttribute("aria-label", p ? "Play slideshow" : "Pause slideshow");
      pauseBtn.innerHTML = p
        ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h4v12H3zM9 2h4v12H9z" fill="currentColor"/></svg>';
      p ? stop() : start();
    }

    prevBtn.addEventListener("click", () => { goTo(index - 1); restart(); });
    nextBtn.addEventListener("click", () => { goTo(index + 1); restart(); });
    pauseBtn.addEventListener("click", () => setPaused(!paused));

    // Pause while the pointer or keyboard focus is inside the banner (WCAG 2.2.2)
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    hero.addEventListener("focusin", stop);
    hero.addEventListener("focusout", (e) => { if (!hero.contains(e.relatedTarget)) start(); });

    // Arrow keys move between slides when the controls have focus
    hero.querySelector(".hero-controls").addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { goTo(index + 1); dots[index].focus(); }
      if (e.key === "ArrowLeft") { goTo(index - 1); dots[index].focus(); }
    });

    // Pause when the tab is hidden to save battery
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    goTo(0);
    setPaused(paused);
  }

  /* ---------- 5. Services filter ---------- */
  function initServiceFilter() {
    const bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;
    const items = document.querySelectorAll("[data-category]");
    const status = document.querySelector("[data-filter-status]");
    const chips = bar.querySelectorAll("[data-filter]");

    function apply(filter) {
      let shown = 0;
      items.forEach((item) => {
        const match = filter === "all" || item.dataset.category === filter;
        item.hidden = !match;
        if (match) shown++;
      });
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));
      if (status) {
        const label = bar.querySelector('[data-filter="' + filter + '"]').textContent.trim();
        status.textContent = filter === "all"
          ? "Showing all " + shown + " services"
          : "Showing " + shown + " of " + items.length + " services: " + label;
      }
    }

    chips.forEach((chip) => chip.addEventListener("click", () => {
      apply(chip.dataset.filter);
      history.replaceState(null, "", chip.dataset.filter === "all" ? location.pathname : "#" + chip.dataset.filter);
    }));

    // Allow deep links such as services.html#honeymoon
    const fromHash = location.hash.slice(1);
    apply(bar.querySelector('[data-filter="' + fromHash + '"]') ? fromHash : "all");
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initYear();
    initReveal();
    initCarousel();
    initServiceFilter();
  });
})();
