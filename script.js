/* =============================================================
   atiaria.org - client script
   Init blocks:
     - initData             (single source of truth for content)
     - initSmoothScroll
     - initScrollProgress
     - initNavOnScroll
     - initReveal
     - initCarousels         (factory used by team/collab/gallery)
     - initLightbox          (native <dialog>)
     - initContactForm
     - initBackToTop
     - initCookieBanner
     - initCurrentYear
   ============================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     DATA - single source of truth
     ----------------------------------------------------------- */
  const TEAM = [
    { name: "Dr. Silvia Mihaela Ilie", role: "Medic Oncolog · Fondator" },
    { name: "Rodica Grancea",          role: "Economist · Fondator" },
    { name: "Alis Ilie",               role: "Biolog" },
    { name: "Octavia Voiculescu",      role: "Contabil" }
  ];

  const COLLAB = [
    { name: "Narcisa Diana Opriș",     role: "Farmacist" },
    { name: "Dr. Olimpia Moldoveanu",  role: "Medic Recuperare" },
    { name: "Dr. Lucia Neagoe",        role: "Psiholog" },
    { name: "Dragoș Marineață",        role: "Preot" },
    { name: "Alexandru Ilie",          role: "IT" }
  ];

  const GALLERY = [
    {
      title: "Sărbători împreună",
      src: "images/SARBATORI-IMPREUNA-1280.jpg",
      webp: "images/SARBATORI-IMPREUNA-1280.webp 1280w, images/SARBATORI-IMPREUNA-640.webp 640w",
      alt: "Membrii asociației la o sărbătoare comună"
    },
    {
      title: "Pelerinaj",
      src: "images/PELERINAJ-1280.jpg",
      webp: "images/PELERINAJ-1280.webp 1280w, images/PELERINAJ-640.webp 640w",
      alt: "Pelerinaj organizat de asociație"
    },
    {
      title: "Grup de suport",
      src: "images/GRUP-DE-SUPORT-1280.jpg",
      webp: "images/GRUP-DE-SUPORT-1280.webp 1280w, images/GRUP-DE-SUPORT-640.webp 640w",
      alt: "Întâlnire a grupului de suport"
    },
    {
      title: "Colaborări",
      src: "images/COLABORARI-1280.jpg",
      webp: "images/COLABORARI-1280.webp 1280w, images/COLABORARI-640.webp 640w",
      alt: "Activități în colaborare cu parteneri"
    }
  ];


  /* -----------------------------------------------------------
     SMOOTH SCROLL - custom eased animator (~900ms, ease-in-out
     cubic) so the click feels deliberate, not teleported.
     ----------------------------------------------------------- */

  // Eased scroll-to-Y. Exposed via closure so back-to-top reuses it.
  // Smooth scroll is *gentle* navigation, not vestibular motion, so we
  // run it even when prefers-reduced-motion is on (WCAG allows this).
  // We just shorten the duration so the trip feels brisk.
  function smoothScrollTo(targetY, duration) {
    duration = duration || 900;
    if (prefersReducedMotion) duration = Math.min(duration, 450);
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 4) { window.scrollTo(0, targetY); return; }
    let startTime = null;

    function step(now) {
      if (startTime === null) startTime = now;
      const t = Math.min((now - startTime) / duration, 1);
      // ease-in-out cubic
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, startY + distance * eased);
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  // Compute the offset so the section edge lands flush against the
  // bottom of the floating header pill.
  //
  // The header has TWO sizes: full (at scrollY < 60) and scrolled
  // (smaller padding once .is-scrolled is applied). When the user
  // clicks a nav link while at the top of the page, we're in the
  // full state but after the scroll completes we'll be in the
  // scrolled state. If we use the live (full) bottom for the
  // offset, the section lands too LOW - beneath the now-smaller
  // header - and a strip of the previous section peeks through.
  //
  // So: temporarily add .is-scrolled before measuring, then revert.
  // No paint happens between the two reads, so the user never sees
  // the flicker.
  function computeHeaderOffset() {
    const header = document.getElementById("site-header");
    if (!header) return 80;
    const wasScrolled = header.classList.contains("is-scrolled");
    if (wasScrolled) return header.getBoundingClientRect().bottom;

    // Both the header AND its nav links have padding/font transitions
    // (~400ms). To read the destination size synchronously, we need
    // to suppress transitions everywhere inside the header subtree.
    // We do this by temporarily attaching a stylesheet rule that
    // disables all transitions, take the measurement, then remove it.
    const killTransitions = document.createElement("style");
    killTransitions.textContent =
      "#site-header, #site-header * { transition: none !important; }";
    document.head.appendChild(killTransitions);

    header.classList.add("is-scrolled");
    void header.offsetHeight;  // force layout flush
    const bottom = header.getBoundingClientRect().bottom;
    header.classList.remove("is-scrolled");
    void header.offsetHeight;

    document.head.removeChild(killTransitions);
    return bottom;
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;

      link.addEventListener("click", (e) => {
        const id = href.slice(1).split("?")[0].split("&")[0];
        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();

        const offset = computeHeaderOffset();
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        smoothScrollTo(y, 900);

        // Keep the URL bar clean - don't append #anchor to the address.
        // If the user loaded a deep link like atiaria.org/#galerie the
        // browser handles the initial scroll, and we strip the hash so
        // subsequent navigation keeps the URL at its base form.
        if (location.hash) {
          history.replaceState(null, "", location.pathname + location.search);
        }

        // Move focus to the target for screen reader users
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      });
    });
  }

  // Re-expose for other init blocks
  window.__atiariaScroll = smoothScrollTo;


  /* -----------------------------------------------------------
     SCROLL PROGRESS BAR
     ----------------------------------------------------------- */
  function initScrollProgress() {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;

    let ticking = false;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + "%";
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }


  /* -----------------------------------------------------------
     MOBILE NAV TOGGLE
     ----------------------------------------------------------- */
  function initNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const nav    = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Închide meniul" : "Deschide meniul");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    // Close when any nav link is clicked
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close on viewport switch to desktop
    const mq = window.matchMedia("(min-width: 900px)");
    mq.addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }


  /* -----------------------------------------------------------
     NAV ON SCROLL - adds .is-scrolled
     ----------------------------------------------------------- */
  function initNavOnScroll() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }


  /* -----------------------------------------------------------
     STAGGER - tag children inside .reveal sections so they
     animate in sequence when the section becomes visible.
     Run BEFORE initReveal so CSS picks up --stagger-i on first
     paint and there's no flash of un-staggered content.
     ----------------------------------------------------------- */
  function initStagger() {
    const SELECTOR = [
      ".section__intro",
      ".about__grid > .card",
      ".about__grid > .card .people-block",
      ".activity__grid > .card",
      ".involve__grid > .card",
      ".gallery",
      ".contact__grid > .card"
    ].join(", ");

    document.querySelectorAll(".reveal").forEach((section) => {
      const children = section.querySelectorAll(SELECTOR);
      children.forEach((el, i) => {
        el.classList.add("stagger-child");
        el.style.setProperty("--stagger-i", String(i));
      });
    });
  }


  /* -----------------------------------------------------------
     REVEAL - IntersectionObserver
     ----------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    els.forEach((el) => io.observe(el));
  }


  /* -----------------------------------------------------------
     NAV SPY - highlight the section currently in view
     ----------------------------------------------------------- */
  function initNavSpy() {
    const sections = document.querySelectorAll("main section[id]");
    const links = document.querySelectorAll('.site-nav a[href^="#"]');
    if (!sections.length || !links.length) return;

    const linkMap = new Map();
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (href && href.length > 1) linkMap.set(href.slice(1), a);
    });

    function setActive(id) {
      links.forEach((a) => a.removeAttribute("aria-current"));
      const active = linkMap.get(id);
      if (active) active.setAttribute("aria-current", "true");
    }

    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver((entries) => {
      // Pick the most-intersecting section among current entries
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    }, {
      // A horizontal band roughly in the middle of the viewport
      rootMargin: "-45% 0px -45% 0px",
      threshold: [0, 0.25, 0.5, 1]
    });

    sections.forEach((s) => io.observe(s));
  }


  /* -----------------------------------------------------------
     CAROUSEL FACTORY
     ----------------------------------------------------------- */
  function createCarousel(root, items, opts) {
    if (!root || !items || !items.length) return;

    const config = Object.assign({
      autoplayMs: 6000,
      onRender: null,
      dotsContainer: null,
      labelFor: (i) => `Slide ${i + 1}`
    }, opts || {});

    const viewport  = root.querySelector(".carousel__viewport");
    const slide     = root.querySelector(".carousel__slide");
    const prevBtn   = root.querySelector(".carousel__btn--prev");
    const nextBtn   = root.querySelector(".carousel__btn--next");
    let index = 0;
    let timer = null;

    // Build dots
    const dots = [];
    if (config.dotsContainer) {
      items.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", config.labelFor(i));
        dot.addEventListener("click", () => go(i));
        config.dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function render() {
      const item = items[index];

      const apply = () => {
        if (config.onRender) {
          config.onRender(slide, item, index);
        } else if (slide) {
          slide.querySelectorAll("[data-slot]").forEach((el) => {
            const key = el.dataset.slot;
            if (key in item) el.textContent = item[key];
          });
        }
      };

      const isGallery = root.classList.contains("gallery");

      if (prefersReducedMotion) {
        apply();
      } else {
        if (slide) slide.classList.add("is-leaving");
        if (isGallery) {
          root.querySelectorAll(".gallery__img, .gallery__caption").forEach((n) => n.classList.add("is-leaving"));
        }
        window.setTimeout(() => {
          apply();
          if (slide) slide.classList.remove("is-leaving");
          if (isGallery) {
            root.querySelectorAll(".gallery__img, .gallery__caption").forEach((n) => n.classList.remove("is-leaving"));
          }
        }, 280);
      }

      dots.forEach((d, i) => d.setAttribute("aria-selected", i === index ? "true" : "false"));
    }

    function go(i, userInitiated) {
      index = ((i % items.length) + items.length) % items.length;
      render();
      if (userInitiated) restart();
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function start() {
      if (prefersReducedMotion) return;
      stop();
      timer = window.setInterval(next, config.autoplayMs);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (prevBtn) prevBtn.addEventListener("click", () => go(index - 1, true));
    if (nextBtn) nextBtn.addEventListener("click", () => go(index + 1, true));

    // Pause on hover / focus
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    // Pause when tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    });

    // Keyboard arrows when carousel has focus
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); go(index - 1, true); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1, true); }
    });

    render();
    start();

    return { go, next, prev, start, stop };
  }


  /* -----------------------------------------------------------
     INIT CAROUSELS
     ----------------------------------------------------------- */
  function initCarousels() {
    const teamRoot = document.querySelector('[data-carousel="team"]');
    const teamDots = document.querySelector('[data-dots="team"]');
    if (teamRoot) {
      createCarousel(teamRoot, TEAM, {
        dotsContainer: teamDots,
        labelFor: (i) => `Membru ${i + 1}: ${TEAM[i].name}`
      });
    }

    const collabRoot = document.querySelector('[data-carousel="collab"]');
    const collabDots = document.querySelector('[data-dots="collab"]');
    if (collabRoot) {
      createCarousel(collabRoot, COLLAB, {
        dotsContainer: collabDots,
        labelFor: (i) => `Colaborator ${i + 1}: ${COLLAB[i].name}`
      });
    }

    // Gallery is now a tile grid + lightbox (see initLightbox);
    // no carousel for gallery anymore.
  }


  /* -----------------------------------------------------------
     LIGHTBOX - modern photo viewer
     - Click any gallery tile to open at that image
     - Prev / Next buttons inside, arrow keys, Escape closes
     - Counter (1 / 4), caption with alt text
     ----------------------------------------------------------- */
  function initLightbox() {
    const dialog = document.getElementById("lightbox");
    if (!dialog) return;

    const imgEl       = dialog.querySelector(".lightbox__img");
    const captionEl   = dialog.querySelector("[data-lightbox-caption]");
    const counterEl   = dialog.querySelector("[data-lightbox-counter]");
    const prevBtn     = dialog.querySelector("[data-lightbox-prev]");
    const nextBtn     = dialog.querySelector("[data-lightbox-next]");
    const tiles       = [...document.querySelectorAll("[data-gallery-index]")];

    if (!tiles.length) return;

    let index = 0;

    function render() {
      const item = GALLERY[index];
      if (!item) return;
      // Brief fade while the new image loads
      imgEl.classList.add("is-swapping");
      const next = new Image();
      next.onload = () => {
        imgEl.src = next.src;
        imgEl.alt = item.alt || item.title || "";
        if (next.naturalWidth)  imgEl.setAttribute("width",  next.naturalWidth);
        if (next.naturalHeight) imgEl.setAttribute("height", next.naturalHeight);
        imgEl.classList.remove("is-swapping");
      };
      next.src = item.src;
      if (captionEl) captionEl.textContent = item.title || "";
      if (counterEl) counterEl.textContent = `${index + 1} / ${GALLERY.length}`;
    }

    function openAt(i) {
      index = ((i % GALLERY.length) + GALLERY.length) % GALLERY.length;
      render();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }

    function next() { index = (index + 1) % GALLERY.length; render(); }
    function prev() { index = (index - 1 + GALLERY.length) % GALLERY.length; render(); }

    // Tile clicks
    tiles.forEach((tile) => {
      tile.addEventListener("click", () => {
        const i = parseInt(tile.dataset.galleryIndex, 10);
        openAt(Number.isFinite(i) ? i : 0);
      });
    });

    // Nav buttons
    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);

    // Keyboard inside open dialog
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    });

    // Click outside the image (on the backdrop / figure padding) closes
    dialog.addEventListener("click", (e) => {
      // Don't close when clicking the image, caption, top bar, or nav buttons
      if (e.target.closest(".lightbox__img, .lightbox__caption, .lightbox__topbar, .lightbox__nav")) return;
      dialog.close();
    });

    // Basic touch swipe support
    let touchStartX = null;
    dialog.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0]?.clientX ?? null;
    }, { passive: true });
    dialog.addEventListener("touchend", (e) => {
      if (touchStartX === null) return;
      const dx = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) next(); else prev();
      }
      touchStartX = null;
    });
  }


  /* -----------------------------------------------------------
     CONTACT FORM
     ----------------------------------------------------------- */
  function initContactForm() {
    const form   = document.getElementById("contact-form");
    const status = document.getElementById("contact-status");
    if (!form || !status) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : "";

      status.textContent = "Se trimite mesajul…";
      status.className = "form__status";
      status.setAttribute("role", "status");
      form.setAttribute("aria-busy", "true");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Se trimite…"; }

      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        });
        const out = await res.json().catch(() => ({}));

        if (res.ok && out.success) {
          status.textContent = "Mesajul a fost trimis cu succes. Vă mulțumim!";
          status.className = "form__status is-success";
          status.setAttribute("role", "status");
          form.reset();
        } else {
          throw new Error(out.message || "Trimiterea mesajului a eșuat.");
        }
      } catch (err) {
        status.textContent = "Mesajul nu a putut fi trimis. Te rugăm să încerci din nou sau să ne scrii direct la contact@atiaria.org.";
        status.className = "form__status is-error";
        status.setAttribute("role", "alert");
      } finally {
        form.removeAttribute("aria-busy");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
      }
    });
  }


  /* -----------------------------------------------------------
     BACK TO TOP
     ----------------------------------------------------------- */
  function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // Slightly longer than nav scrolls - top-of-page is usually farther
      smoothScrollTo(0, 1100);
    });
  }


  /* -----------------------------------------------------------
     COOKIE BANNER
     ----------------------------------------------------------- */
  function initCookieBanner() {
    const banner = document.getElementById("cookie-banner");
    if (!banner) return;

    const KEY = "atiaria.consent.v1";
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { stored = null; }

    if (stored && typeof stored.analytics === "boolean") {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
    // Next frame: add .is-visible so the opacity/transform transition fires.
    // Without the double-rAF, the browser batches the visibility change
    // and the start state with the end state and skips the animation.
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add("is-visible")));

    function save(consent) {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          analytics: !!consent,
          ts: Date.now()
        }));
      } catch (_) { /* ignore */ }
      banner.classList.remove("is-visible");
      // Wait for the fade-out transition to finish before hiding
      window.setTimeout(() => { banner.hidden = true; }, 420);
    }

    banner.querySelectorAll("[data-cookie]").forEach((btn) => {
      btn.addEventListener("click", () => {
        save(btn.dataset.cookie === "accept");
      });
    });
  }


  /* -----------------------------------------------------------
     CURRENT YEAR
     ----------------------------------------------------------- */
  function initCurrentYear() {
    const el = document.getElementById("current-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }


  /* -----------------------------------------------------------
     BOOT
     ----------------------------------------------------------- */
  function boot() {
    initNavToggle();
    initSmoothScroll();
    initScrollProgress();
    initNavOnScroll();
    initStagger();      // tag children - must run before initReveal
    initReveal();
    initNavSpy();
    initCarousels();
    initLightbox();
    initContactForm();
    initBackToTop();
    initCookieBanner();
    initCurrentYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
