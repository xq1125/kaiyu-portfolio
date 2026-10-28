/* ==========================================================================
   KAIYU ZHENG — PAPER PORTFOLIO
   Small interactions, big paper mess.
   ========================================================================== */

(() => {
  "use strict";

  const DATA = window.PORTFOLIO;
  if (!DATA) {
    console.warn("Portfolio data not found.");
    return;
  }

  const doc = document;
  const root = doc.documentElement;
  const $ = (selector, scope = doc) => scope.querySelector(selector);
  const $$ = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));
  const pad = (number) => String(number).padStart(2, "0");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const categories = DATA.categories;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totalPlates = categories.reduce((sum, category) => sum + category.plates.length, 0);

  let menuOpen = false;
  let lightboxOpen = false;
  let gameOpen = false;
  let lastFocusedElement = null;
  let toastTimer = 0;
  let collageZ = 10;

  root.classList.add("js");

  /* ------------------------------------------------------------------ */
  /* Clocks                                                             */
  /* ------------------------------------------------------------------ */

  const clockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  function updateClocks() {
    const time = clockFormatter.format(new Date());
    $$("[data-clock]").forEach((node) => {
      node.textContent = time;
    });
  }

  updateClocks();
  window.setInterval(updateClocks, 20000);

  /* ------------------------------------------------------------------ */
  /* Build index & chapters                                             */
  /* ------------------------------------------------------------------ */

  function buildIndex() {
    const grid = $("#indexGrid");
    if (!grid) return;

    grid.innerHTML = categories
      .map(
        (category) => `
          <a class="chapter-card" href="#${category.id}" data-reveal data-cursor="翻开"
             style="--accent:${category.accent};--soft:${category.soft}">
            <span class="card-tape" aria-hidden="true"></span>
            <span class="card-head">
              <span class="card-num">${category.num}</span>
              <span class="card-count">${pad(category.plates.length)} pieces</span>
            </span>
            <span class="card-photo">
              <img src="${category.cover}" alt="${category.title}章节封面" width="1200" height="800" loading="eager" decoding="async">
            </span>
            <span class="card-title"><b>${category.title}</b><em>${category.en}</em></span>
            <span class="card-open" aria-hidden="true">翻开 ↗</span>
          </a>
        `
      )
      .join("");
  }

  function buildChapters() {
    const container = $("#chapters");
    if (!container) return;

    container.innerHTML = categories
      .map((category) => {
        const total = category.plates.length;
        const plates = category.plates
          .map((plate, index) => {
            const number = pad(index + 1);
            const sizes =
              index === 0
                ? "(max-width: 600px) 92vw, (max-width: 900px) 88vw, 88vw"
                : "(max-width: 600px) 92vw, (max-width: 900px) 46vw, 56vw";
            return `
              <button class="work-card wc-${index + 1}" type="button"
                      data-cat="${category.id}" data-index="${index}" data-cursor="翻开"
                      aria-label="翻开作品：${plate.title}，${plate.role}" data-reveal>
                <span class="work-photo">
                  <img src="assets/img/thumb/${plate.id}.webp"
                       srcset="assets/img/thumb/${plate.id}.webp 900w, assets/img/wide/${plate.id}.webp 1800w"
                       sizes="${sizes}" width="1800" height="636"
                       alt="${plate.title} — ${plate.role}" loading="lazy" decoding="async">
                </span>
                <span class="work-caption">
                  <span class="work-num">${number}/${pad(total)}</span>
                  <span class="work-title"><b>${plate.title}</b><em>${plate.role}</em></span>
                  <span class="work-open" aria-hidden="true">↗</span>
                </span>
              </button>
            `;
          })
          .join("");

        const tags = category.tags.map((tag) => `<li>${tag}</li>`).join("");

        return `
          <section class="chapter" id="${category.id}" data-section="${category.id}"
                   style="--accent:${category.accent};--soft:${category.soft}">
            <header class="chapter-head">
              <div class="chapter-no" data-reveal>
                <span>${category.num}</span>
                <em>CHAPTER / ${category.num}</em>
              </div>
              <div class="chapter-title" data-reveal>
                <p class="eyebrow">${category.en} / ${pad(total)} PIECES</p>
                <h2>${category.title}</h2>
                <p class="chapter-hand">${category.noteTitle}</p>
              </div>
              <div class="chapter-side" data-reveal>
                <p>${category.desc}</p>
                <ul class="chapter-tags">${tags}</ul>
              </div>
            </header>

            <div class="chapter-gallery">
              <div class="chapter-grid">${plates}</div>

              <aside class="chapter-note" data-reveal>
                <span class="card-tape" aria-hidden="true"></span>
                <p class="note-kicker">NOTE / 随手记</p>
                <h3>${category.noteTitle}</h3>
                <p>${category.note}</p>
                <span class="note-sign">— KAIYU</span>
              </aside>

              <div class="chapter-foot">
                <a href="#works">← 回到索引</a>
                <span>${category.num} / 06 · ${pad(total)} pieces</span>
                <a href="#contact">喜欢这个方向？聊聊 ↗</a>
              </div>
            </div>
          </section>
        `;
      })
      .join("");
  }

  function buildFacts() {
    const container = $("#factList");
    if (!container) return;
    container.innerHTML = DATA.facts
      .map(
        (fact) => `
          <div class="fact">
            <span class="fact-label">${fact.label}</span>
            <span class="fact-value"><b>${fact.value}</b><span>${fact.detail}</span></span>
          </div>
        `
      )
      .join("");
  }

  /* ------------------------------------------------------------------ */
  /* Hero collage                                                       */
  /* ------------------------------------------------------------------ */

  const collageCards = $$(".collage-card");

  function readCollageBase(card) {
    return {
      dx: parseFloat(card.dataset.dx || "0"),
      dy: parseFloat(card.dataset.dy || "0"),
      rot: parseFloat(card.dataset.rot || card.style.getPropertyValue("--rot") || "0")
    };
  }

  function initCollage() {
    const board = $("#heroCollage");
    if (!board || !collageCards.length) return;

    collageCards.forEach((card) => {
      const base = readCollageBase(card);
      card.dataset.dx = String(base.dx);
      card.dataset.dy = String(base.dy);
      card.dataset.rot = String(base.rot);
      card.style.zIndex = String(++collageZ);

      let drag = null;
      let suppressClick = false;

      card.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const current = readCollageBase(card);
        drag = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          baseX: current.dx,
          baseY: current.dy,
          moved: false
        };
        card.style.zIndex = String(++collageZ);
        try {
          card.setPointerCapture?.(event.pointerId);
        } catch (error) {
          /* synthetic or already-released pointers */
        }
      });

      card.addEventListener("pointermove", (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        if (!drag.moved) return;

        if (event.cancelable) event.preventDefault();
        card.classList.add("is-dragging");
        const nextX = clamp(drag.baseX + dx, -52, 52);
        const nextY = clamp(drag.baseY + dy, -42, 42);
        card.style.setProperty("--dx", `${nextX}px`);
        card.style.setProperty("--dy", `${nextY}px`);
        card.dataset.dx = String(nextX);
        card.dataset.dy = String(nextY);
      });

      const finishDrag = () => {
        if (!drag) return;
        const wasMoved = drag.moved;
        drag = null;
        card.classList.remove("is-dragging");
        if (wasMoved) {
          suppressClick = true;
          window.setTimeout(() => {
            suppressClick = false;
          }, 80);
        }
      };

      card.addEventListener("pointerup", finishDrag);
      card.addEventListener("pointercancel", finishDrag);
      card.addEventListener("pointerleave", () => {
        if (drag && !drag.moved) finishDrag();
      });

      card.addEventListener("click", (event) => {
        if (suppressClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        const category = card.dataset.cat;
        if (category) {
          openLightbox(category, Number(card.dataset.index || 0));
          return;
        }
        const target = card.dataset.target;
        if (target) {
          doc.querySelector(target)?.scrollIntoView({
            behavior: prefersReduced ? "auto" : "smooth",
            block: "start"
          });
        }
      });
    });

    $("#collageShuffle")?.addEventListener("click", () => {
      const rotations = [-7, -5, -3, 2, 4, 6, 8];
      collageCards.forEach((card) => {
        const dx = Math.round((Math.random() - 0.5) * 48);
        const dy = Math.round((Math.random() - 0.5) * 36);
        const rot = rotations[Math.floor(Math.random() * rotations.length)];
        card.style.setProperty("--dx", `${dx}px`);
        card.style.setProperty("--dy", `${dy}px`);
        card.style.setProperty("--rot", `${rot}deg`);
        card.dataset.dx = String(dx);
        card.dataset.dy = String(dy);
        card.dataset.rot = String(rot);
        card.style.zIndex = String(++collageZ);
      });
      showToast("桌面已经弄乱 / messier is better");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                   */
  /* ------------------------------------------------------------------ */

  function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReduced) {
      items.forEach((item) => item.classList.add("is-in"));
      return;
    }

    $$(".chapter-grid").forEach((grid) => {
      $$(".work-card", grid).forEach((card, index) => {
        card.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -5% 0px" }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* ------------------------------------------------------------------ */
  /* Header, menu, clocks                                               */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    const header = $("#siteHeader");
    if (!header) return;
    let ticking = false;

    const update = () => {
      header.classList.toggle("is-stuck", window.scrollY > 18);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }

  function initScrollSpy() {
    const links = $$("[data-nav]");
    const sections = ["works", "about", "contact"]
      .map((id) => doc.getElementById(id))
      .filter(Boolean);
    if (!links.length || !sections.length) return;

    let ticking = false;
    const update = () => {
      let current = "";
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= 170) current = section.id;
      });
      links.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.nav === current);
      });
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  function initMenu() {
    const overlay = $("#menuOverlay");
    const toggle = $("#menuToggle");
    const close = $("#menuClose");
    if (!overlay || !toggle) return;

    const setMenu = (open) => {
      menuOpen = open;
      overlay.classList.toggle("is-open", open);
      overlay.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      doc.body.classList.toggle("menu-open", open);
      if (open) {
        window.setTimeout(() => close?.focus({ preventScroll: true }), 300);
      } else {
        toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener("click", () => setMenu(!menuOpen));
    close?.addEventListener("click", () => setMenu(false));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) setMenu(false);
    });
    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) setMenu(false);
      if (!menuOpen || event.key !== "Tab") return;
      const focusable = $$("a[href], button", overlay).filter(
        (node) => node.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.__closePaperMenu = () => {
      if (menuOpen) setMenu(false);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Cursor                                                             */
  /* ------------------------------------------------------------------ */

  function initCursor() {
    if (!isFinePointer) return;
    const cursor = $("#cursor");
    const tag = $("#cursorTag");
    if (!cursor || !tag) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tagX = x;
    let tagY = y;
    let rafId = 0;

    const moveTag = () => {
      tagX += (x - tagX) * 0.16;
      tagY += (y - tagY) * 0.16;
      tag.style.left = `${tagX}px`;
      tag.style.top = `${tagY}px`;
      rafId = window.requestAnimationFrame(moveTag);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        x = event.clientX;
        y = event.clientY;
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;

        const viewTarget = event.target.closest(
          ".work-card, .chapter-card, [data-cursor], .lightbox-stage"
        );
        const hoverTarget = event.target.closest("a, button, .collage-card");

        doc.body.classList.toggle("cursor-view", Boolean(viewTarget));
        doc.body.classList.toggle("cursor-hover", Boolean(hoverTarget) && !viewTarget);

        if (viewTarget) {
          tag.textContent =
            viewTarget.dataset.cursor ||
            (viewTarget.classList.contains("lightbox-stage") ? "放大" : "翻开");
        }
      },
      { passive: true }
    );

    tag.style.left = `${tagX}px`;
    tag.style.top = `${tagY}px`;
    moveTag();

    doc.addEventListener("pointerleave", () => {
      doc.body.classList.remove("cursor-hover", "cursor-view");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox                                                           */
  /* ------------------------------------------------------------------ */

  const lightbox = $("#lightbox");
  const lightboxSheet = $("#lightboxSheet");
  const lightboxImage = $("#lightboxImage");
  const lightboxStage = $("#lightboxStage");
  const lightboxCat = $("#lightboxCat");
  const lightboxCount = $("#lightboxCount");
  const lightboxTitle = $("#lightboxTitle");
  const lightboxRole = $("#lightboxRole");
  const lightboxFull = $("#lightboxFull");
  const lightboxClose = $("#lightboxClose");

  const lbState = {
    category: null,
    index: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    panStart: null,
    panned: false,
    loadToken: 0
  };

  function applyLightboxTransform() {
    if (!lightboxStage) return;
    lightboxStage.style.setProperty("--zoom", String(lbState.zoom));
    lightboxStage.style.setProperty("--pan-x", `${lbState.panX}px`);
    lightboxStage.style.setProperty("--pan-y", `${lbState.panY}px`);
    lightboxStage.classList.toggle("is-zoomed", lbState.zoom > 1.01);
  }

  function resetLightboxZoom() {
    lbState.zoom = 1;
    lbState.panX = 0;
    lbState.panY = 0;
    lbState.panned = false;
    applyLightboxTransform();
  }

  function setLightboxZoom(value) {
    const next = clamp(value, 1, 4);
    lbState.zoom = next;
    if (next <= 1.01) {
      lbState.panX = 0;
      lbState.panY = 0;
    }
    applyLightboxTransform();
  }

  function preloadNeighbors() {
    if (!lbState.category) return;
    const total = lbState.category.plates.length;
    [-1, 1].forEach((offset) => {
      const index = (lbState.index + offset + total) % total;
      const image = new Image();
      image.src = `assets/img/full/${lbState.category.plates[index].id}.webp`;
    });
  }

  function updateLightboxImage() {
    const category = lbState.category;
    if (!category) return;
    const plate = category.plates[lbState.index];
    const token = ++lbState.loadToken;

    resetLightboxZoom();
    lightboxStage?.classList.add("is-loading");
    if (lightboxImage) lightboxImage.alt = `${plate.title} — ${plate.role}`;
    if (lightboxCat) lightboxCat.textContent = `${category.num} / ${category.en}`;
    if (lightboxCount) lightboxCount.textContent = `${pad(lbState.index + 1)} / ${pad(category.plates.length)}`;
    if (lightboxTitle) lightboxTitle.textContent = plate.title;
    if (lightboxRole) lightboxRole.textContent = plate.role;
    if (lightboxFull) lightboxFull.href = `assets/img/full/${plate.id}.webp`;

    const loader = new Image();
    loader.onload = () => {
      if (token !== lbState.loadToken) return;
      if (lightboxImage) lightboxImage.src = loader.src;
      lightboxStage?.classList.remove("is-loading");
    };
    loader.onerror = () => {
      if (token !== lbState.loadToken) return;
      lightboxStage?.classList.remove("is-loading");
    };
    loader.src = `assets/img/full/${plate.id}.webp`;
    preloadNeighbors();
  }

  function openLightbox(categoryId, index) {
    if (!lightbox) return;
    const category = categoryById.get(categoryId);
    if (!category) return;

    lastFocusedElement = doc.activeElement;
    lbState.category = category;
    lbState.index = clamp(Number(index) || 0, 0, category.plates.length - 1);
    updateLightboxImage();

    lightbox.hidden = false;
    doc.body.classList.add("lightbox-open");
    window.requestAnimationFrame(() => lightbox.classList.add("is-open"));
    lightboxOpen = true;
    window.setTimeout(() => lightboxClose?.focus({ preventScroll: true }), 80);
  }

  function closeLightbox() {
    if (!lightboxOpen || !lightbox) return;
    lightboxOpen = false;
    lightbox.classList.remove("is-open");
    doc.body.classList.remove("lightbox-open");
    window.setTimeout(() => {
      if (!lightboxOpen) lightbox.hidden = true;
    }, 320);
    lastFocusedElement?.focus?.({ preventScroll: true });
  }

  function stepLightbox(direction) {
    if (!lbState.category) return;
    const total = lbState.category.plates.length;
    lbState.index = (lbState.index + direction + total) % total;
    updateLightboxImage();
  }

  function trapLightboxFocus(event) {
    if (!lightboxOpen || !lightbox || event.key !== "Tab") return;
    const focusable = $$("button:not([disabled]), a[href]", lightbox).filter(
      (node) => node.offsetParent !== null
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initLightbox() {
    if (!lightbox) return;

    doc.addEventListener("click", (event) => {
      const card = event.target.closest(".work-card");
      if (!card) return;
      openLightbox(card.dataset.cat, Number(card.dataset.index));
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    $("#lightboxPrev")?.addEventListener("click", () => stepLightbox(-1));
    $("#lightboxNext")?.addEventListener("click", () => stepLightbox(1));
    $("#zoomIn")?.addEventListener("click", () => setLightboxZoom(lbState.zoom + 0.5));
    $("#zoomOut")?.addEventListener("click", () => setLightboxZoom(lbState.zoom - 0.5));
    $("#zoomReset")?.addEventListener("click", resetLightboxZoom);

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightboxStage?.addEventListener("click", (event) => {
      if (!lightboxOpen || event.target.closest("button, a")) return;
      if (lbState.panned) {
        lbState.panned = false;
        return;
      }
      setLightboxZoom(lbState.zoom > 1.01 ? 1 : 2.1);
    });

    lightboxStage?.addEventListener(
      "wheel",
      (event) => {
        if (!lightboxOpen) return;
        event.preventDefault();
        setLightboxZoom(lbState.zoom * (event.deltaY < 0 ? 1.16 : 0.86));
      },
      { passive: false }
    );

    lightboxStage?.addEventListener("pointerdown", (event) => {
      if (!lightboxOpen || lbState.zoom <= 1.01 || event.button !== 0) return;
      lbState.dragging = true;
      lbState.panned = false;
      lbState.panStart = {
        x: event.clientX,
        y: event.clientY,
        panX: lbState.panX,
        panY: lbState.panY
      };
      lightboxStage.classList.add("is-dragging");
      try {
        lightboxStage.setPointerCapture?.(event.pointerId);
      } catch (error) {
        /* ignore an already-released pointer */
      }
    });

    lightboxStage?.addEventListener("pointermove", (event) => {
      if (!lbState.dragging || !lbState.panStart) return;
      const dx = event.clientX - lbState.panStart.x;
      const dy = event.clientY - lbState.panStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) lbState.panned = true;
      lbState.panX = lbState.panStart.panX + dx;
      lbState.panY = lbState.panStart.panY + dy;
      applyLightboxTransform();
    });

    const endPan = () => {
      if (!lbState.dragging) return;
      lbState.dragging = false;
      lbState.panStart = null;
      lightboxStage?.classList.remove("is-dragging");
    };
    lightboxStage?.addEventListener("pointerup", endPan);
    lightboxStage?.addEventListener("pointercancel", endPan);

    doc.addEventListener("keydown", (event) => {
      if (!lightboxOpen) return;
      trapLightboxFocus(event);
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setLightboxZoom(lbState.zoom + 0.5);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setLightboxZoom(lbState.zoom - 0.5);
      } else if (event.key === "0") {
        event.preventDefault();
        resetLightboxZoom();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */
  /* Work fragment game                                                 */
  /* ------------------------------------------------------------------ */

  function initFragmentGame() {
    const game = $("#fragmentGame");
    if (!game) return;

    const choices = $("#gameChoices");
    const crop = $("#gameCrop");
    const result = $("#gameResult");
    const summary = $("#gameSummary");
    const nextButton = $("#gameNext");
    const roundLabel = $("#gameRound");
    const scoreLabel = $("#gameScore");
    const fragmentNum = $("#gameFragmentNum");
    const prompt = $("#gamePrompt");
    const title = $("#gameTitle");
    const closeButton = $("#gameClose");
    const openButton = $("#gameOpen");
    const ROUNDS = 5;

    const state = {
      open: false,
      round: 0,
      score: 0,
      answered: false,
      finished: false,
      deck: [],
      current: null,
      lastFocus: null
    };

    const shuffle = (items) => {
      const next = items.slice();
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    };

    const makeDeck = () => {
      const deck = [];
      categories.forEach((category) => {
        category.plates.forEach((plate, index) => {
          deck.push({ category, plate, index });
        });
      });
      return shuffle(deck);
    };

    const renderRound = () => {
      if (!state.deck.length) state.deck = makeDeck();
      state.current = state.deck.pop();
      state.round += 1;
      state.answered = false;
      state.finished = false;

      const { category, plate } = state.current;

      result.hidden = true;
      summary.hidden = true;
      title.hidden = false;
      prompt.hidden = false;
      choices.hidden = false;
      nextButton.hidden = true;
      nextButton.innerHTML = "下一张 <span>→</span>";

      roundLabel.textContent = `ROUND ${pad(state.round)} / ${pad(ROUNDS)}`;
      scoreLabel.textContent = `SCORE ${state.score} / ${ROUNDS}`;
      fragmentNum.textContent = `FRAGMENT ${pad(state.round)}`;
      prompt.textContent = "从作品里裁下的一角。认得它属于哪个世界吗？";

      choices.innerHTML = categories
        .map(
          (item) => `
            <button type="button" class="game-choice" data-cat="${item.id}"
                    style="--choice:${item.accent}" aria-pressed="false">
              <span class="game-choice-num">${item.num}</span>
              <b>${item.title}</b>
              <em>${item.en}</em>
            </button>
          `
        )
        .join("");

      crop.classList.remove("is-revealed");
      crop.style.backgroundImage = `url("assets/img/thumb/${plate.id}.webp")`;
      crop.style.backgroundSize = `auto ${135 + Math.round(Math.random() * 55)}%`;
      crop.style.backgroundPosition = `${14 + Math.round(Math.random() * 72)}% ${14 + Math.round(Math.random() * 72)}%`;
      crop.setAttribute("aria-label", `作品局部，第 ${state.round} 题，请猜所属章节`);
      $("#gameWorkTitle").textContent = "";
      $("#gameWorkRole").textContent = "";
    };

    const answer = (pickedId) => {
      if (!state.open || state.answered || !state.current) return;

      state.answered = true;
      const { category, plate } = state.current;
      const correct = category.id === pickedId;
      if (correct) state.score += 1;

      scoreLabel.textContent = `SCORE ${state.score} / ${ROUNDS}`;
      $$(".game-choice", choices).forEach((button) => {
        const isCorrect = button.dataset.cat === category.id;
        const isPicked = button.dataset.cat === pickedId;
        button.disabled = true;
        button.setAttribute("aria-pressed", String(isPicked));
        button.classList.toggle("is-correct", isCorrect);
        button.classList.toggle("is-wrong", isPicked && !correct);
      });

      result.hidden = false;
      $("#gameVerdict").textContent = correct ? "猜对了，就是这一章。" : "差一点，这块碎片来自——";
      $("#gameWorkTitle").textContent = `《${plate.title}》`;
      $("#gameWorkRole").textContent = `${category.title} / ${plate.role}`;
      nextButton.hidden = false;
      nextButton.innerHTML =
        state.round >= ROUNDS ? "看看结果 <span>→</span>" : "下一张 <span>→</span>";

      crop.classList.add("is-revealed");
      crop.style.backgroundSize = "contain";
      crop.style.backgroundPosition = "center";
      prompt.textContent = correct ? "这块细节已经回到它的章节。" : "翻到全图，就认出来了。";

      window.setTimeout(() => nextButton.focus({ preventScroll: true }), 120);
    };

    const showSummary = () => {
      state.finished = true;
      choices.hidden = true;
      result.hidden = true;
      title.hidden = true;
      prompt.hidden = true;
      nextButton.hidden = true;
      summary.hidden = false;

      roundLabel.textContent = "COMPLETE";
      scoreLabel.textContent = `SCORE ${state.score} / ${ROUNDS}`;
      $("#gameSummaryScore").textContent = `${state.score} / ${ROUNDS}`;

      let message = "五个碎片，全部归位。你比索引更了解这些作品。";
      if (state.score <= 1) message = "没关系，好作品值得再多翻几遍。";
      else if (state.score === 2) message = "你认出了两个世界。有些章节，确实藏得很深。";
      else if (state.score === 3) message = "三个世界。再多看几眼，碎片就会有归属。";
      else if (state.score === 4) message = "只差一块。也许下一轮就能认全六章。";
      $("#gameSummaryText").textContent = message;

      window.setTimeout(() => $("#gameReplay")?.focus({ preventScroll: true }), 100);
    };

    const start = () => {
      state.score = 0;
      state.round = 0;
      state.answered = false;
      state.finished = false;
      state.deck = makeDeck();
      summary.hidden = true;
      renderRound();
    };

    const openGame = () => {
      if (state.open) return;
      state.lastFocus = doc.activeElement;
      state.open = true;
      gameOpen = true;
      game.hidden = false;
      doc.body.classList.add("game-open");
      window.requestAnimationFrame(() => game.classList.add("is-open"));
      start();
      window.setTimeout(() => closeButton?.focus({ preventScroll: true }), 100);
    };

    const closeGame = (restoreFocus = true) => {
      if (!state.open) return;
      state.open = false;
      gameOpen = false;
      game.classList.remove("is-open");
      doc.body.classList.remove("game-open");
      window.setTimeout(() => {
        if (!state.open) game.hidden = true;
      }, 320);
      if (restoreFocus) state.lastFocus?.focus?.({ preventScroll: true });
    };

    openButton?.addEventListener("click", openGame);
    closeButton?.addEventListener("click", () => closeGame());

    game.addEventListener("click", (event) => {
      if (event.target === game) closeGame();
    });

    choices.addEventListener("click", (event) => {
      const button = event.target.closest(".game-choice");
      if (!button || button.disabled) return;
      answer(button.dataset.cat);
    });

    nextButton?.addEventListener("click", () => {
      if (!state.answered) return;
      if (state.round >= ROUNDS) showSummary();
      else renderRound();
    });

    $("#gameReplay")?.addEventListener("click", start);

    $("#gameBack")?.addEventListener("click", () => {
      closeGame();
      doc.getElementById("works")?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start"
      });
    });

    $("#gameOpenWork")?.addEventListener("click", () => {
      if (!state.current) return;
      const { category, index } = state.current;
      closeGame(false);
      window.setTimeout(() => openLightbox(category.id, index), 300);
    });

    doc.addEventListener("keydown", (event) => {
      if (!state.open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeGame();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = $$("button:not([disabled]), a[href]", game).filter(
        (node) => node.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* Utilities                                                          */
  /* ------------------------------------------------------------------ */

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const textarea = doc.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      doc.body.appendChild(textarea);
      textarea.select();
      try {
        const successful = doc.execCommand("copy");
        textarea.remove();
        if (successful) resolve();
        else reject(new Error("copy failed"));
      } catch (error) {
        textarea.remove();
        reject(error);
      }
    });
  }

  function initEmailCopy() {
    const button = $("#emailCopy");
    if (!button) return;
    button.addEventListener("click", async () => {
      const email = button.dataset.email || DATA.meta.email;
      const note = $("em", button);
      try {
        await copyText(email);
        showToast("邮箱已复制 / email copied");
        if (note) note.textContent = "copied — see you in the inbox";
        window.setTimeout(() => {
          if (note) note.textContent = "点击复制 / click to copy";
        }, 2300);
      } catch (error) {
        window.location.href = `mailto:${email}`;
      }
    });
  }

  function initAnchors() {
    doc.addEventListener("click", (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = doc.querySelector(href);
      if (!target) return;
      event.preventDefault();
      if (menuOpen && window.__closePaperMenu) window.__closePaperMenu();
      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start"
      });
      try {
        history.replaceState(null, "", href);
      } catch (error) {
        /* file:// may restrict history */
      }
    });
  }

  function initKeyboard() {
    doc.addEventListener("keydown", (event) => {
      if (lightboxOpen || menuOpen || gameOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("input, textarea, select")) return;
      if (event.key.toLowerCase() === "s") {
        $("#collageShuffle")?.click();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Loader                                                             */
  /* ------------------------------------------------------------------ */

  function initLoader() {
    const loader = $("#loader");
    const number = $("#loadNumber");
    const bar = $("#loadBar");
    if (!loader) {
      doc.body.classList.remove("is-loading");
      doc.body.classList.add("is-ready");
      return;
    }

    const cover = $(".loader-bg img");
    if (cover) {
      cover.addEventListener("error", () => {
        cover.hidden = true;
      }, { once: true });
    }

    let progress = 0;
    let done = false;
    let loadFired = false;

    const paint = () => {
      if (number) number.textContent = pad(Math.min(99, Math.round(progress)));
      if (bar) bar.style.transform = `scaleX(${progress / 100})`;
    };

    const finish = () => {
      if (done) return;
      done = true;
      window.clearInterval(timer);
      progress = 100;
      if (number) number.textContent = "100";
      if (bar) bar.style.transform = "scaleX(1)";
      window.setTimeout(() => {
        loader.classList.add("is-done");
        doc.body.classList.remove("is-loading");
        doc.body.classList.add("is-ready");
        window.setTimeout(() => loader.remove(), 1100);
      }, 300);
    };

    const timer = window.setInterval(() => {
      if (done) return;
      progress = Math.min(loadFired ? 100 : 91, progress + 2.5 + Math.random() * 5);
      paint();
      if (loadFired && progress > 96) finish();
    }, 80);

    const onLoad = () => {
      loadFired = true;
      progress = Math.max(progress, 92);
      paint();
      window.setTimeout(finish, 450);
    };

    if (doc.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    window.setTimeout(() => {
      if (!done) {
        loadFired = true;
        finish();
      }
    }, 4800);

    paint();
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  buildIndex();
  buildChapters();
  buildFacts();

  initLoader();
  initHeader();
  initScrollSpy();
  initMenu();
  initCollage();
  initCursor();
  initLightbox();
  initFragmentGame();
  initEmailCopy();
  initAnchors();
  initKeyboard();
  initReveal();

  console.info(
    `%cKAIYU / PAPER PORTFOLIO%c  ${totalPlates} pieces · ${categories.length} chapters · 1 fragment game`,
    "background:#cf4b32;color:#fcf8ef;padding:3px 6px;font-weight:700",
    "color:#746c60"
  );
})();
