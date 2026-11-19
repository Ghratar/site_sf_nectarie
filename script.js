/* =============================================================
   atiaria.org - client script
   Init blocks:
     - initData             (single source of truth for content)
     - initSmoothScroll
     - initScrollProgress
     - initNavOnScroll
     - initReveal
     - initLightbox          (native <dialog>)
     - initContactForm
     - initContactCategory   (CTA buttons preselect the form category)
     - initMap               (Google Maps loads only on request)
     - initTaxDeadline       (Formular 230 badge/note follow the calendar)
     - initBackToTop
     - initCurrentYear
   ============================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     DATA - single source of truth
     ----------------------------------------------------------- */
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

        // Keep the section in the address bar so the link can be copied,
        // shared or bookmarked. replaceState (not pushState) so menu
        // clicks don't pile up behind the Back button.
        history.replaceState(null, "", id === "home" ? location.pathname + location.search : "#" + id);

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

    // The full-size pill exists to float over the hero image. On
    // pages without a hero (evenimente, live, legal) it would grow/
    // shrink around the 60px scroll boundary over plain background,
    // which reads as a glitch - keep the compact state permanently.
    // (CSS paints these pages compact from the first frame; adding
    // the class here just keeps measurements consistent.)
    if (!document.querySelector(".hero")) {
      header.classList.add("is-scrolled");
      document.documentElement.classList.remove("landed-scrolled");
      return;
    }

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    // Hand over from the first-paint CSS state (set by the inline
    // <head> script on hash landings) to the scroll-driven class.
    document.documentElement.classList.remove("landed-scrolled");
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
      ".opinie__grid > .card",
      ".about__grid > .card",
      ".about__grid > .card .people-block",
      ".activity__grid > .card",
      ".involve__grid > .card",
      ".events__grid > .card",
      ".resources__grid > .card",
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
     CONTACT CATEGORY - buttons that lead to the contact form can
     carry data-category="..." so the visitor lands on a form that
     already knows what they came for.
     ----------------------------------------------------------- */
  function initContactCategory() {
    const select = document.getElementById("category");
    if (!select) return;
    document.querySelectorAll("a[data-category]").forEach((link) => {
      link.addEventListener("click", () => {
        const wanted = link.dataset.category;
        const match = [...select.options].find((o) => o.value === wanted);
        if (match) select.value = wanted;
      });
    });
  }


  /* -----------------------------------------------------------
     MAP - the Google Maps embed is only requested after the
     visitor asks for it, so nothing is sent to Google on a
     normal page view (same approach as the YouTube player).
     ----------------------------------------------------------- */
  function initMap() {
    const box = document.querySelector("[data-map]");
    if (!box) return;
    const btn = box.querySelector("[data-map-load]");
    const src = box.dataset.mapSrc;
    if (!btn || !src) return;

    btn.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = box.dataset.mapTitle || "Hartă";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      iframe.setAttribute("tabindex", "0");
      box.textContent = "";
      box.classList.add("is-loaded");
      box.appendChild(iframe);
      iframe.focus({ preventScroll: true });
    });
  }


  /* -----------------------------------------------------------
     TAX DEADLINE - Formularul 230 is filed until 25 May each
     year for the previous year's income. The badge and note
     follow the calendar so the card never shows last year's
     dates. Without JS the HTML keeps a neutral, always-true text.
     ----------------------------------------------------------- */
  function initTaxDeadline() {
    const badge = document.querySelector("[data-tax230-badge]");
    const note  = document.querySelector("[data-tax230-note]");
    if (!badge && !note) return;

    const now = new Date();
    const y = now.getFullYear();
    const open = now < new Date(y, 4, 26);   // through 25 May inclusive

    if (badge) {
      badge.textContent = open ? `Până la 25 mai ${y}` : `Revine în ${y + 1}`;
      badge.classList.toggle("involve-card__badge--muted", !open);
    }
    if (note) {
      note.textContent = open
        ? `Formularul 230 pentru veniturile realizate în ${y - 1} se depune la ANAF până la 25 mai ${y}.`
        : `Termenul de depunere a Formularului 230 pentru veniturile din ${y - 1} a trecut (25 mai ${y}). ` +
          `Formularul pentru veniturile realizate în ${y} se va putea depune la ANAF începând cu anul ${y + 1}, ` +
          `până la termenul-limită de 25 mai ${y + 1}.`;
    }
  }


  /* -----------------------------------------------------------
     LEGACY CLEANUP - the cookie banner was removed (the site sets
     no optional cookies), so drop the preference it used to store.
     ----------------------------------------------------------- */
  function clearLegacyConsent() {
    try { localStorage.removeItem("atiaria.consent.v1"); } catch (_) { /* ignore */ }
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
    initLightbox();
    initContactForm();
    initContactCategory();
    initMap();
    initTaxDeadline();
    initBackToTop();
    clearLegacyConsent();
    initCurrentYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
