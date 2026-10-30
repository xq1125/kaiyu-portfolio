/* ==========================================================================
   KAIYU ZHENG — NOCTURNE PORTFOLIO
   Small interactions, a darkroom of work.
   ========================================================================== */

(() => {
  "use strict";

  const DATA = window.PORTFOLIO;
  if (!DATA) {
    console.warn("Portfolio data not found.");
    return;
  }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const doc = document;
  const root = doc.documentElement;
  const $ = (selector, scope = doc) => scope.querySelector(selector);
  const $$ = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));
  const pad = (number) => String(number).padStart(2, "0");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isNarrowViewport = () => window.matchMedia("(max-width: 720px)").matches;
  const fullImagePath = (id) => `assets/img/${isNarrowViewport() ? "wide" : "full"}/${id}.webp`;
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

  function resetInitialPosition() {
    const initialHash = window.location.hash.slice(1);
    const isChapter = categoryById.has(initialHash);

    if (isChapter) return;

    if (initialHash === "contact" || initialHash === "about") {
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch (error) {
        /* file:// may restrict history */
      }
    }

    if (initialHash !== "works") window.scrollTo(0, 0);
    window.addEventListener(
      "load",
      () => {
        const hash = window.location.hash.slice(1);
        if (!categoryById.has(hash) && hash !== "works") window.scrollTo(0, 0);
      },
      { once: true }
    );
  }

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
      .map((category) => {
        const filmCount = category.plates.reduce(
          (sum, plate) => sum + (Array.isArray(plate.videos) ? plate.videos.length : 0),
          0
        );
        const filmWord = filmCount === 1 ? "FILM" : "FILMS";
        const mobileCover = category.cover.replace("/covers/", "/covers/mobile/");
        return `
          <div class="catalogue-item" data-reveal>
            <a class="catalogue-card" href="chapter.html?c=${category.id}"
               aria-label="打开章节：${category.title}${filmCount ? `，含 ${filmCount} 部影像` : ""}">
              <span class="catalogue-inner">
                <span class="catalogue-face catalogue-face--back" aria-hidden="true">
                  <span class="catalogue-top">
                    <span>CHAPTER ${category.num}</span>
                    <span>${pad(category.plates.length)} PIECES${filmCount ? ` / ${filmCount} ${filmWord}` : ""}</span>
                  </span>
                  <span class="catalogue-back-main">
                    <span class="catalogue-num">${category.num}</span>
                    <span class="catalogue-name"><b>${category.title}</b><em>${category.en}</em></span>
                  </span>
                  <span class="catalogue-watermark" aria-hidden="true">${category.en}</span>
                  <span class="catalogue-bottom"><span>点击进入 · ENTER</span><span>↗</span></span>
                </span>
                <span class="catalogue-face catalogue-face--front" aria-hidden="true">
                  <span class="catalogue-front-bar">C:\KAIYU\WORKS · COVER</span>
                  <img src="${category.cover}?v=cards"
                       srcset="${mobileCover}?v=cards 720w, ${category.cover}?v=cards 1200w"
                       sizes="(max-width: 620px) 92vw, (max-width: 900px) 46vw, 31vw"
                       alt="" width="1200" height="800" loading="lazy" decoding="async" fetchpriority="low">
                  <span class="catalogue-front-shade"></span>
                  <span class="catalogue-front-meta">
                    <span>${category.num} / ${category.en}</span>
                    <b>${category.title}</b>
                    <em>${pad(category.plates.length)} PIECES${filmCount ? ` · ${filmCount} ${filmWord}` : ""}</em>
                    <span class="catalogue-open">进入章节 ↗</span>
                  </span>
                </span>
              </span>
            </a>
            <button class="catalogue-turn" type="button" data-title="${category.title}"
                    aria-label="翻到《${category.title}》的封面" aria-pressed="false">
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        `;
      })
      .join("");

    grid.addEventListener("click", (event) => {
      const turn = event.target.closest(".catalogue-turn");
      if (!turn || !grid.contains(turn)) return;
      event.preventDefault();
      event.stopPropagation();
      const item = turn.closest(".catalogue-item");
      if (!item) return;
      const flipped = item.classList.toggle("is-flipped");
      turn.setAttribute("aria-pressed", String(flipped));
      const title = turn.dataset.title || "这一本";
      turn.setAttribute("aria-label", flipped ? `翻回《${title}》的章节卡` : `翻到《${title}》的封面`);
    });
  }

  let peek = null;
  let peekTrigger = null;
  let peekTimer = 0;

  function ensureChapterPeek() {
    if (peek) return peek;
    peek = document.createElement("div");
    peek.className = "chapter-peek";
    peek.id = "chapterPeek";
    peek.setAttribute("role", "dialog");
    peek.setAttribute("aria-modal", "true");
    peek.setAttribute("aria-labelledby", "peekTitle");
    peek.hidden = true;
    peek.innerHTML = `
      <div class="peek-scrim" data-peek-close></div>
      <div class="peek-sheet">
        <div class="peek-bar">
          <span class="peek-bar-title">PREVIEW.EXE — CHAPTER PEEK</span>
          <span class="peek-bar-actions">
            <button class="peek-close" type="button" data-peek-close>合上 <span>×</span></button>
          </span>
        </div>
        <div class="peek-scroll" id="peekContent"></div>
      </div>
    `;
    document.body.appendChild(peek);

    peek.addEventListener("click", (event) => {
      if (event.target.closest("[data-peek-close]")) closeChapterPeek();
    });

    peek.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeChapterPeek();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        peek.querySelectorAll("a[href], button:not([disabled])")
      ).filter((node) => node.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    return peek;
  }

  function peekMarkup(category) {
    const filmCount = category.plates.reduce(
      (sum, plate) => sum + (Array.isArray(plate.videos) ? plate.videos.length : 0),
      0
    );
    const home = category.plates[0];

    return `
      <header class="peek-head">
        <span class="peek-index">${category.num}</span>
        <div class="peek-heading">
          <p class="peek-kicker">${category.en} / ${pad(category.plates.length)} PIECES${filmCount ? ` / ${pad(filmCount)} FILMS` : ""}</p>
          <h2 id="peekTitle">${category.title}</h2>
          <p class="peek-desc">${category.desc}</p>
          <ul class="peek-tags">${category.tags.slice(0, 5).map((tag) => `<li>${tag}</li>`).join("")}</ul>
        </div>
      </header>

      <figure class="peek-home">
        <picture>
          <source media="(max-width: 600px)" srcset="assets/img/thumb/${home.id}.webp">
          <img src="assets/img/full/${home.id}.webp" alt="${category.title}首页：${home.title}" width="2800" height="991"
               loading="eager" decoding="async">
        </picture>
        <figcaption>
          <span>CHAPTER HOME / ${category.num}</span>
          <b>${home.title}</b>
          <em>${home.role}</em>
        </figcaption>
      </figure>
    `;
  }

  function openChapterPeek(category, trigger) {
    if (!category) return;
    const dialog = ensureChapterPeek();
    if (dialog.classList.contains("is-open")) return;
    window.clearTimeout(peekTimer);
    peekTrigger = trigger || null;
    const content = $("#peekContent", dialog);
    if (content) content.innerHTML = peekMarkup(category);
    dialog.hidden = false;
    document.body.classList.add("peek-open");
    window.requestAnimationFrame(() => dialog.classList.add("is-open"));
    const close = dialog.querySelector(".peek-close");
    if (close) window.setTimeout(() => close.focus({ preventScroll: true }), 60);
    document.dispatchEvent(new CustomEvent("kaiyu:ui", { detail: { sound: "open" } }));
  }

  function closeChapterPeek() {
    if (!peek || peek.hidden) return;
    peek.classList.remove("is-open");
    document.body.classList.remove("peek-open");
    document.dispatchEvent(new CustomEvent("kaiyu:ui", { detail: { sound: "close" } }));
    const trigger = peekTrigger;
    peekTrigger = null;
    window.clearTimeout(peekTimer);
    peekTimer = window.setTimeout(() => {
      if (!peek.classList.contains("is-open")) peek.hidden = true;
      if (trigger && typeof trigger.focus === "function") trigger.focus({ preventScroll: true });
    }, 180);
  }

  function initHeroBoard() {
    const board = $("#heroBoard");
    const grid = $("#heroBoardGrid");
    if (!board || !grid) return;

    grid.innerHTML = categories
      .map((category) => {
        const filmCount = category.plates.reduce(
          (sum, plate) => sum + (Array.isArray(plate.videos) ? plate.videos.length : 0),
          0
        );
        const filmWord = filmCount === 1 ? "FILM" : "FILMS";
        const count = `${pad(category.plates.length)} P${filmCount ? ` · ${filmCount} F` : ""}`;
        const mobileCover = category.cover.replace("/covers/", "/covers/mobile/");
        return `
          <a class="hero-cell" href="chapter.html?c=${category.id}"
             data-hero-cell data-chapter="${category.id}" data-title="${category.title}"
             aria-label="揭开章节预览：${category.title}">
            <span class="hero-cell-back" aria-hidden="true">
              <span class="hero-cell-top"><span>CH. ${category.num}</span><span>${count}</span></span>
              <span class="hero-cell-name">${category.title}</span>
              <span class="hero-cell-poke">戳开 <i>↗</i></span>
            </span>
            <span class="hero-cell-front" aria-hidden="true">
              <img src="${category.cover}?v=cards"
                   srcset="${mobileCover}?v=cards 720w, ${category.cover}?v=cards 1200w"
                   sizes="(max-width: 620px) 46vw, 31vw"
                   alt="" width="1200" height="800" loading="lazy" decoding="async" fetchpriority="low">
              <span class="hero-cell-shade"></span>
              <span class="hero-cell-meta">
                <b>${category.title}</b>
                <em>${pad(category.plates.length)} PIECES${filmCount ? ` · ${filmCount} ${filmWord}` : ""}</em>
                <span>查看预览 ↗</span>
              </span>
            </span>
          </a>
        `;
      })
      .join("");

    const cells = Array.from(grid.querySelectorAll("[data-hero-cell]"));
    const count = $("#heroBoardCount");
    const note = $("#heroBoardNote");
    const reset = $("#heroBoardReset");
    const compactBoard = isNarrowViewport();
    const openCells = [];

    const closeCell = (cell) => {
      cell.classList.remove("is-revealed", "is-opening");
      cell.setAttribute(
        "aria-label",
        compactBoard ? `揭开章节：${cell.dataset.title}` : `揭开章节预览：${cell.dataset.title}`
      );
      const index = openCells.indexOf(cell);
      if (index !== -1) openCells.splice(index, 1);
    };

    const paint = () => {
      const open = openCells.length;
      if (count) count.textContent = `${pad(open)} / 02`;
      if (note) {
        note.textContent = compactBoard
          ? open
            ? "再点一次，直接进入章节"
            : "点开一张，再点进入章节"
          : open === 2
            ? "再点一张，切换章节预览"
            : open === 1
              ? "再点一次，打开章节切片"
              : "最多同时翻开两张";
      }
      if (reset) reset.disabled = open === 0;
      board.classList.toggle("is-pair", open === 2);
    };

    grid.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-hero-cell]");
      if (!cell) return;
      if (!cell.classList.contains("is-revealed")) {
        event.preventDefault();
        if (openCells.length >= 2) closeCell(openCells[0]);
        cell.classList.add("is-revealed", "is-opening");
        cell.setAttribute(
          "aria-label",
          compactBoard
            ? `再次点击进入《${cell.dataset.title}》章节`
            : `打开《${cell.dataset.title}》章节预览`
        );
        openCells.push(cell);
        window.setTimeout(() => cell.classList.remove("is-opening"), 650);
        paint();
        return;
      }
      if (compactBoard) {
        /* Second tap follows the anchor into the full chapter. */
        return;
      }
      event.preventDefault();
      openChapterPeek(categoryById.get(cell.dataset.chapter), cell);
    });

    if (reset) {
      reset.addEventListener("click", () => {
        cells.forEach((cell) => closeCell(cell));
        openCells.length = 0;
        paint();
      });
    }

    paint();
  }

  /* ------------------------------------------------------------------ */
  /* Chapter reader                                                     */
  /* ------------------------------------------------------------------ */

  let readerIndex = -1;
  let chapterReaderOpen = false;
  let readerLastFocus = null;

  function readerCardMarkup(category, plate, index, total) {
    const number = pad(index + 1);
    const videoCount = Array.isArray(plate.videos) ? plate.videos.length : 0;
    const sizes = index === 0
      ? "(max-width: 620px) 92vw, (max-width: 1100px) 88vw, 1060px"
      : "(max-width: 620px) 92vw, (max-width: 1100px) 44vw, 500px";
    return `
      <button class="work-card wc-${index + 1}" type="button"
              data-cat="${category.id}" data-index="${index}" data-cursor="翻开"
              aria-label="翻开作品：${plate.title}，${plate.role}">
        <span class="work-photo">
          <img src="assets/img/thumb/${plate.id}.webp"
               srcset="assets/img/thumb/${plate.id}.webp 900w, assets/img/wide/${plate.id}.webp 1800w"
               sizes="${sizes}" width="1800" height="636"
               alt="${plate.title} — ${plate.role}" loading="lazy" decoding="async">
          ${videoCount ? `<span class="work-film-badge" aria-hidden="true"><i>▶</i> FILM${videoCount > 1 ? ` × ${videoCount}` : ""}</span>` : ""}
        </span>
        <span class="work-caption">
          <span class="work-num">${number}/${pad(total)}</span>
          <span class="work-title"><b>${plate.title}</b><em>${plate.role}</em></span>
          <span class="work-open" aria-hidden="true">↗</span>
        </span>
      </button>
    `;
  }

  function renderChapterReader(index) {
    const category = categories[index];
    if (!category) return;
    const total = category.plates.length;
    const sheet = $("#readerSheet");
    const set = (selector, value) => {
      const node = $(selector);
      if (node) node.textContent = value;
    };

    if (sheet) sheet.style.setProperty("--accent", category.accent);
    set("#readerKicker", `CHAPTER ${category.num} / ${category.en}`);
    set("#readerNum", category.num);
    set("#readerEyebrow", `${category.en} / ${pad(total)} PIECES`);
    set("#readerTitle", category.title);
    set("#readerHand", category.noteTitle);
    set("#readerDesc", category.desc);
    set("#readerCount", `${pad(index + 1)} / ${pad(categories.length)}`);

    const tags = $("#readerTags");
    if (tags) {
      tags.innerHTML = category.tags.map((tag) => `<li>${tag}</li>`).join("");
    }
    const grid = $("#readerGrid");
    if (grid) {
      grid.innerHTML = category.plates
        .map((plate, plateIndex) => readerCardMarkup(category, plate, plateIndex, total))
        .join("");
    }
    const scroll = $("#readerScroll");
    if (scroll) scroll.scrollTop = 0;
  }

  function setReaderBackgroundInert(value) {
    const background = [
      doc.querySelector("main"),
      doc.querySelector(".site-header"),
      doc.querySelector(".site-footer")
    ].filter(Boolean);
    background.forEach((node) => {
      try {
        node.inert = value;
      } catch (error) {
        /* older browsers simply keep the body scroll lock */
      }
    });
  }

  function openChapterReader(id) {
    const index = categories.findIndex((category) => category.id === id);
    if (index < 0) return;
    const reader = $("#chapterReader");
    if (!reader) return;

    const wasOpen = chapterReaderOpen;
    if (!wasOpen) readerLastFocus = doc.activeElement;
    readerIndex = index;
    renderChapterReader(index);
    reader.hidden = false;
    chapterReaderOpen = true;
    setReaderBackgroundInert(true);
    doc.body.classList.add("chapter-reader-open");
    window.requestAnimationFrame(() => reader.classList.add("is-open"));
    window.setTimeout(() => $("#readerClose")?.focus({ preventScroll: true }), 80);
    try {
      history.replaceState(null, "", `#${id}`);
    } catch (error) {
      /* file:// may restrict history */
    }
  }

  function closeChapterReader() {
    const reader = $("#chapterReader");
    if (!reader || !chapterReaderOpen) return;
    chapterReaderOpen = false;
    reader.classList.remove("is-open");
    setReaderBackgroundInert(false);
    doc.body.classList.remove("chapter-reader-open");
    window.setTimeout(() => {
      if (!chapterReaderOpen) reader.hidden = true;
    }, 680);
    readerLastFocus?.focus?.({ preventScroll: true });
    try {
      history.replaceState(null, "", "#works");
    } catch (error) {
      /* ignore */
    }
  }

  function stepChapterReader(direction) {
    if (!chapterReaderOpen) return;
    readerIndex = (readerIndex + direction + categories.length) % categories.length;
    renderChapterReader(readerIndex);
  }

  function initChapterReader() {
    const reader = $("#chapterReader");
    if (!reader) return;

    doc.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-chapter-open]");
      if (!trigger) return;
      event.preventDefault();
      openChapterReader(trigger.dataset.chapterOpen);
    });

    $("#readerClose")?.addEventListener("click", closeChapterReader);
    $("#readerPrev")?.addEventListener("click", () => stepChapterReader(-1));
    $("#readerNext")?.addEventListener("click", () => stepChapterReader(1));

    reader.addEventListener("click", (event) => {
      if (event.target === reader) closeChapterReader();
    });

    doc.addEventListener("keydown", (event) => {
      if (!chapterReaderOpen || lightboxOpen || gameOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeChapterReader();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepChapterReader(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepChapterReader(1);
      }
    });

    const initial = window.location.hash.slice(1);
    if (categoryById.has(initial)) openChapterReader(initial);
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
            const videoCount = Array.isArray(plate.videos) ? plate.videos.length : 0;
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
                  ${videoCount ? `<span class="work-film-badge" aria-hidden="true"><i>▶</i> FILM${videoCount > 1 ? ` × ${videoCount}` : ""}</span>` : ""}
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
  const lightboxVideo = $("#lightboxVideo");
  const lightboxStage = $("#lightboxStage");
  const lightboxCat = $("#lightboxCat");
  const lightboxKicker = $("#lightboxKicker");
  const lightboxCount = $("#lightboxCount");
  const lightboxTitle = $("#lightboxTitle");
  const lightboxRole = $("#lightboxRole");
  const lightboxFull = $("#lightboxFull");
  const lightboxHint = $("#lightboxHint");
  const lightboxFilm = $("#lightboxFilm");
  const lightboxFilmStrip = $("#lightboxFilmStrip");
  const lightboxClose = $("#lightboxClose");

  const lbState = {
    category: null,
    index: 0,
    mode: "image",
    videoIndex: 0,
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
      image.src = fullImagePath(lbState.category.plates[index].id);
    });
  }

  function activePlate() {
    return lbState.category?.plates[lbState.index] || null;
  }

  function plateVideos(plate) {
    if (!plate || !Array.isArray(plate.videos)) return [];
    return plate.videos.filter((video) => video && video.src);
  }

  function stopLightboxVideo() {
    if (!lightboxVideo) return;
    lightboxVideo.pause();
  }

  function clearLightboxVideo() {
    if (!lightboxVideo) return;
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.removeAttribute("poster");
    lightboxVideo.load();
  }

  function renderFilmStrip(videos) {
    if (!lightboxFilmStrip) return;
    lightboxFilmStrip.replaceChildren();
    if (videos.length < 2) {
      lightboxFilmStrip.hidden = true;
      return;
    }
    videos.forEach((video, index) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "lightbox-film-chip";
      button.textContent = `${video.label || `影像 ${index + 1}`}${video.duration ? ` · ${video.duration}` : ""}`;
      button.classList.toggle("is-active", index === lbState.videoIndex);
      button.addEventListener("click", () => showFilmMode(index));
      lightboxFilmStrip.append(button);
    });
    lightboxFilmStrip.hidden = false;
  }

  function updateFilmButton(videos) {
    if (!lightboxFilm) return;
    lightboxFilm.hidden = !videos.length;
    lightboxFilm.classList.remove("is-playing");
    lightboxFilm.innerHTML = `<span aria-hidden="true">▶</span> 看影像${videos.length > 1 ? ` · ${videos.length}` : ""}`;
  }

  function resetFilmUi() {
    lbState.mode = "image";
    lbState.videoIndex = 0;
    stopLightboxVideo();
    clearLightboxVideo();
    lightboxStage?.classList.remove("is-film");
    lightboxSheet?.classList.remove("is-film");
    if (lightboxVideo) lightboxVideo.hidden = true;
    if (lightboxFilmStrip) {
      lightboxFilmStrip.hidden = true;
      lightboxFilmStrip.replaceChildren();
    }
    if (lightboxKicker) lightboxKicker.textContent = "WORK SHEET / 作品页";
    if (lightboxHint) {
      lightboxHint.textContent = "点击图片放大 · 拖动平移 · ← → 翻页 · ESC 合上";
    }
  }

  function showFilmMode(index = 0) {
    const videos = plateVideos(activePlate());
    if (!videos.length) return;
    const active = clamp(Number(index) || 0, 0, videos.length - 1);
    const video = videos[active];
    lbState.mode = "film";
    lbState.videoIndex = active;
    resetLightboxZoom();

    lightboxStage?.classList.add("is-film");
    lightboxSheet?.classList.add("is-film");
    if (lightboxImage) lightboxImage.hidden = true;
    if (lightboxVideo) {
      lightboxVideo.hidden = false;
      lightboxVideo.poster = video.poster || "";
      lightboxVideo.src = video.src;
      lightboxVideo.setAttribute("aria-label", `${activePlate()?.title || "作品"} — ${video.label || "影像"}`);
      const playAttempt = lightboxVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          /* Native controls remain available if autoplay is blocked. */
        });
      }
    }

    if (lightboxFilm) {
      lightboxFilm.hidden = false;
      lightboxFilm.classList.add("is-playing");
      lightboxFilm.innerHTML = '<span aria-hidden="true">❚❚</span> 回到静帧';
    }
    if (lightboxKicker) lightboxKicker.textContent = "FILM / 影像";
    if (lightboxFull) {
      lightboxFull.href = video.src;
      lightboxFull.textContent = "OPEN VIDEO ↗";
    }
    if (lightboxHint) {
      lightboxHint.textContent = `按播放器开始「${video.label || "影像"}」 · 可控制音量 · ESC 合上`;
    }
    renderFilmStrip(videos);
  }

  function hideFilmMode() {
    const videos = plateVideos(activePlate());
    resetFilmUi();
    resetLightboxZoom();
    updateFilmButton(videos);
    if (lightboxImage) lightboxImage.hidden = false;
    if (lightboxFull) {
      const plate = activePlate();
      lightboxFull.href = plate ? fullImagePath(plate.id) : "#";
      lightboxFull.textContent = "OPEN FULL IMAGE ↗";
    }
  }

  function updateLightboxImage() {
    const category = lbState.category;
    if (!category) return;
    const plate = category.plates[lbState.index];
    const token = ++lbState.loadToken;
    const videos = plateVideos(plate);

    resetFilmUi();
    updateFilmButton(videos);
    resetLightboxZoom();
    lightboxStage?.classList.add("is-loading");
    if (lightboxImage) {
      lightboxImage.hidden = false;
      lightboxImage.alt = `${plate.title} — ${plate.role}`;
    }
    if (lightboxCat) lightboxCat.textContent = `${category.num} / ${category.en}`;
    if (lightboxCount) lightboxCount.textContent = `${pad(lbState.index + 1)} / ${pad(category.plates.length)}`;
    if (lightboxTitle) lightboxTitle.textContent = plate.title;
    if (lightboxRole) lightboxRole.textContent = plate.role;
    if (lightboxFull) {
      lightboxFull.href = fullImagePath(plate.id);
      lightboxFull.textContent = "OPEN FULL IMAGE ↗";
    }

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
    loader.src = fullImagePath(plate.id);
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
    stopLightboxVideo();
    lightbox.classList.remove("is-open");
    doc.body.classList.remove("lightbox-open");
    window.setTimeout(() => {
      if (!lightboxOpen) {
        lightbox.hidden = true;
        resetFilmUi();
      }
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
    lightboxFilm?.addEventListener("click", () => {
      if (lbState.mode === "film") hideFilmMode();
      else showFilmMode(0);
    });
    lightboxVideo?.addEventListener("play", () => {
      if (lbState.mode !== "film" || !lightboxHint) return;
      const video = plateVideos(activePlate())[lbState.videoIndex];
      lightboxHint.textContent = `正在播放「${video?.label || "影像"}」 · 可控制音量 · ESC 合上`;
    });
    lightboxVideo?.addEventListener("pause", () => {
      if (lbState.mode !== "film" || !lightboxHint) return;
      lightboxHint.textContent = "影像已暂停 · 按播放器继续 · ESC 合上";
    });
    lightboxVideo?.addEventListener("ended", () => {
      if (lbState.mode !== "film" || !lightboxHint) return;
      lightboxHint.textContent = "播放完毕 · 可重播或回到静帧 · ESC 合上";
    });
    $("#lightboxPrev")?.addEventListener("click", () => stepLightbox(-1));
    $("#lightboxNext")?.addEventListener("click", () => stepLightbox(1));
    $("#zoomIn")?.addEventListener("click", () => setLightboxZoom(lbState.zoom + 0.5));
    $("#zoomOut")?.addEventListener("click", () => setLightboxZoom(lbState.zoom - 0.5));
    $("#zoomReset")?.addEventListener("click", resetLightboxZoom);

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightboxStage?.addEventListener("click", (event) => {
      if (!lightboxOpen || lbState.mode === "film" || event.target.closest("button, a, video")) return;
      if (lbState.panned) {
        lbState.panned = false;
        return;
      }
      setLightboxZoom(lbState.zoom > 1.01 ? 1 : 2.1);
    });

    lightboxStage?.addEventListener(
      "wheel",
      (event) => {
        if (!lightboxOpen || lbState.mode === "film") return;
        event.preventDefault();
        setLightboxZoom(lbState.zoom * (event.deltaY < 0 ? 1.16 : 0.86));
      },
      { passive: false }
    );

    lightboxStage?.addEventListener("pointerdown", (event) => {
      if (!lightboxOpen || lbState.mode === "film" || lbState.zoom <= 1.01 || event.button !== 0) return;
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
      if (lbState.mode === "film") {
        if (event.key === "Escape") {
          event.preventDefault();
          closeLightbox();
        }
        return;
      }
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

  function initPortraitScratch() {
    const flip = $("#aboutFlip");
    if (!flip) return;
    const card = flip.closest(".about-card") || flip;
    const face = flip.querySelector(".about-face--front");
    const canvas = flip.querySelector(".about-scratch");
    const ink = flip.querySelector(".about-ink");
    if (!face || !canvas || !ink) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hint = $(".about-flip-copy");
    if (hint && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hint.textContent = "手指擦除 · 轻点复原";
    }

    let width = 1;
    let height = 1;
    let dpr = 1;
    let ready = false;
    let last = null;
    let resizeTimer = 0;
    let touchScratch = null;
    let suppressClickUntil = 0;

    const brushSize = () => Math.max(20, Math.min(52, width * 0.105));

    const paperColor = () => {
      const color = getComputedStyle(card).backgroundColor;
      return color && color !== "rgba(0, 0, 0, 0)" ? color : "#d7ceb3";
    };

    const paint = () => {
      if (!ink.complete || !ink.naturalWidth) return false;
      const rect = face.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      const paper = paperColor();
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(0, 0, 0, .028)";
      for (let y = 2; y < height; y += 3) ctx.fillRect(0, y, width, 1);

      const inkX = ink.offsetLeft;
      const inkY = ink.offsetTop;
      const inkW = ink.offsetWidth;
      const inkH = ink.offsetHeight;
      const naturalW = ink.naturalWidth || inkW;
      const naturalH = ink.naturalHeight || inkH;
      const fit = Math.min(inkW / naturalW, inkH / naturalH);
      const drawW = naturalW * fit;
      const drawH = naturalH * fit;
      const drawX = inkX + (inkW - drawW) / 2;
      const drawY = inkY + (inkH - drawH);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = "rgba(0, 0, 0, .52)";
      ctx.shadowBlur = Math.max(10, width * 0.05);
      ctx.shadowOffsetY = Math.max(8, width * 0.035);
      ctx.drawImage(ink, drawX, drawY, drawW, drawH);
      ctx.restore();

      const rgb = paper.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const fade = Math.min(drawH * 0.13, 42);
        const gradient = ctx.createLinearGradient(0, drawY + drawH - fade, 0, drawY + drawH);
        gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
        gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(drawX, drawY + drawH - fade, drawW, fade);
      }

      canvas.classList.add("is-painted");
      card.classList.add("is-scratch-ready");
      ready = true;
      return true;
    };

    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const stamp = (x, y) => {
      const radius = brushSize();
      const gradient = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius);
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.7, "rgba(0, 0, 0, .96)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const eraseTo = (x, y) => {
      if (!last) {
        stamp(x, y);
        last = { x, y };
        return;
      }
      const radius = brushSize();
      const dx = x - last.x;
      const dy = y - last.y;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (radius * 0.35)));
      for (let step = 1; step <= steps; step += 1) {
        stamp(last.x + (dx * step) / steps, last.y + (dy * step) / steps);
      }
      last = { x, y };
    };

    const isFinePointer = (event) =>
      !event.pointerType || event.pointerType === "mouse" || event.pointerType === "pen";

    face.addEventListener("pointerdown", (event) => {
      if (!ready || isFinePointer(event) || flip.classList.contains("is-flipped")) return;
      touchScratch = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false
      };
      last = null;
      if (typeof face.setPointerCapture === "function") {
        face.setPointerCapture(event.pointerId);
      }
    });

    face.addEventListener("pointerenter", (event) => {
      if (!ready || !isFinePointer(event) || flip.classList.contains("is-flipped")) return;
      last = null;
      const { x, y } = point(event);
      eraseTo(x, y);
    });

    face.addEventListener("pointermove", (event) => {
      if (!ready || flip.classList.contains("is-flipped")) return;

      if (isFinePointer(event)) {
        const { x, y } = point(event);
        eraseTo(x, y);
        return;
      }

      if (!touchScratch || touchScratch.id !== event.pointerId) return;
      const dx = event.clientX - touchScratch.x;
      const dy = event.clientY - touchScratch.y;
      if (!touchScratch.moved && Math.hypot(dx, dy) < 6) return;

      touchScratch.moved = true;
      suppressClickUntil = Date.now() + 350;
      if (event.cancelable) event.preventDefault();
      const { x, y } = point(event);
      eraseTo(x, y);
    });

    const endTouchScratch = (event) => {
      if (!touchScratch || touchScratch.id !== event.pointerId) return;
      if (touchScratch.moved) suppressClickUntil = Date.now() + 350;
      touchScratch = null;
      last = null;
      if (typeof face.releasePointerCapture === "function") {
        try {
          face.releasePointerCapture(event.pointerId);
        } catch (error) {
          /* pointer capture may already be released */
        }
      }
    };

    face.addEventListener("pointerup", endTouchScratch);
    face.addEventListener("pointercancel", endTouchScratch);

    flip.addEventListener(
      "click",
      (event) => {
        if (Date.now() >= suppressClickUntil) return;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );

    face.addEventListener("pointerleave", (event) => {
      if (!isFinePointer(event)) return;
      last = null;
      if (ready) paint();
    });

    flip.addEventListener("click", () => {
      window.setTimeout(() => {
        if (ready) paint();
      }, 360);
    });

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (ready) paint();
      }, 160);
    });

    if (ink.complete && ink.naturalWidth) paint();
    else ink.addEventListener("load", paint, { once: true });
  }

  function initTouchFeedback() {
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!coarse) return;

    const interactive = "a, button, [role='button'], .catalogue-card, .hero-cell, .chapter-work, .resume-card, .site-experience-card, .loader.is-ready";
    const haptic = (duration = 8) => {
      if (typeof navigator.vibrate === "function") navigator.vibrate(duration);
    };

    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType && event.pointerType !== "touch") return;
      const target = event.target.closest(interactive);
      if (!target) return;

      haptic(12);

      const ring = document.createElement("span");
      ring.className = "tap-ring";
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    }, { passive: true });
  }

  function initLoaderGames() {
    $$(".loader-level").forEach((level) => {
      const score = level.querySelector(".level-score");
      let coins = 0;
      let celebrated = false;

      const celebrate = () => {
        level.classList.add("is-99");
        const banner = document.createElement("span");
        banner.className = "level-99";
        banner.innerHTML = "<b>★</b> 星邱99";
        level.appendChild(banner);

        const colors = ["#f4c744", "#f2e7d5", "#9cc8f5", "#ef8a7c"];
        for (let index = 0; index < 18; index += 1) {
          const star = document.createElement("i");
          star.className = "level-star";
          star.style.left = `${Math.random() * 16}%`;
          star.style.top = `${Math.random() * 7}%`;
          star.style.setProperty("--dx", `${-30 + Math.random() * 170}px`);
          star.style.setProperty("--dy", `${-45 - Math.random() * 100}px`);
          star.style.setProperty("--star", colors[index % colors.length]);
          star.style.animationDelay = `${Math.random() * 220}ms`;
          level.appendChild(star);
          window.setTimeout(() => star.remove(), 1900);
        }
      };

      const paintScore = (amount) => {
        coins = Math.min(99, coins + amount);
        if (score) {
          score.textContent = `COINS ${String(coins).padStart(2, "0")}`;
          score.classList.remove("is-scored");
          void score.offsetWidth;
          score.classList.add("is-scored");
        }
        if (coins >= 99 && !celebrated) {
          celebrated = true;
          celebrate();
        }
      };

      level.querySelectorAll(".level-block--q, .level-coin, .level-goomba").forEach((item) => {
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        if (item.classList.contains("level-block--q")) item.setAttribute("aria-label", "顶一下问号方块");
        else if (item.classList.contains("level-coin")) item.setAttribute("aria-label", "收集金币");
        else item.setAttribute("aria-label", "踩一下小怪");
      });

      const hitBlock = (block) => {
        if (!block || block.classList.contains("is-hit")) return;
        block.classList.add("is-hit");
        paintScore(1);
        window.setTimeout(() => block.classList.remove("is-hit"), 340);
      };

      const takeCoin = (coin) => {
        if (!coin || coin.classList.contains("is-collected")) return;
        coin.classList.add("is-collected");
        paintScore(1);
        window.setTimeout(() => coin.classList.remove("is-collected"), 620);
      };

      const stompGoomba = (goomba) => {
        if (!goomba || goomba.classList.contains("is-stomped")) return;
        goomba.classList.add("is-stomped");
        paintScore(2);
        window.setTimeout(() => goomba.classList.add("is-dead"), 460);
      };

      level.addEventListener("click", (event) => {
        event.stopPropagation();
        const block = event.target.closest(".level-block--q");
        const coin = event.target.closest(".level-coin");
        const goomba = event.target.closest(".level-goomba");
        if (block) hitBlock(block);
        else if (goomba) stompGoomba(goomba);
        else if (coin) takeCoin(coin);
      });

      level.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const item = event.target.closest(".level-block--q, .level-coin, .level-goomba");
        if (!item) return;
        event.preventDefault();
        event.stopPropagation();
        item.click();
      });
    });
  }

  function initLoaderPlayers() {
    const loader = $("#loader");
    if (!loader || !window.matchMedia("(min-width: 1200px)").matches) return;

    const levels = Array.from(document.querySelectorAll(".loader-level"));
    if (!levels.length) return;

    const states = levels.map((level, index) => {
      const player = level.querySelector(".level-player");
      if (!player) return null;
      return {
        level,
        player,
        index,
        platforms: Array.from(level.querySelectorAll(".level-platform")),
        x: 0,
        y: 16,
        vy: 0,
        onGround: true,
        won: false,
        left: false,
        right: false
      };
    }).filter(Boolean);

    if (!states.length) return;

    const place = (state) => {
      const width = state.level.clientWidth;
      const playerWidth = state.player.offsetWidth || 24;
      const ratio = state.index === 0 ? 0.72 : 0.48;
      state.x = Math.max(0, Math.min(width - playerWidth, width * ratio - playerWidth / 2));
      state.player.style.left = `${state.x}px`;
      state.player.style.bottom = "16px";
    };

    states.forEach(place);
    window.addEventListener("resize", () => states.forEach(place), { passive: true });

    const winLevel = (state) => {
      if (state.won) return;
      state.won = true;
      state.player.classList.add("is-pipe");
      state.level.classList.add("is-won");
      window.setTimeout(() => $("#loaderEnter")?.click(), 720);
    };

    const input = new Map([
      ["a", [0, "left"]],
      ["A", [0, "left"]],
      ["d", [0, "right"]],
      ["D", [0, "right"]],
      ["w", [0, "jump"]],
      ["W", [0, "jump"]],
      ["ArrowLeft", [1, "left"]],
      ["ArrowRight", [1, "right"]],
      ["ArrowUp", [1, "jump"]]
    ]);

    document.addEventListener("keydown", (event) => {
      if (!loader.isConnected || loader.classList.contains("is-done")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const action = input.get(event.key);
      if (!action) return;
      const state = states.find((item) => item.index === action[0]);
      if (!state) return;
      event.preventDefault();
      if (action[1] === "jump") {
        if (!event.repeat && state.onGround) {
          state.vy = 530;
          state.onGround = false;
        }
        return;
      }
      state[action[1]] = true;
    });

    document.addEventListener("keyup", (event) => {
      const action = input.get(event.key);
      if (!action || action[1] === "jump") return;
      const state = states.find((item) => item.index === action[0]);
      if (state) state[action[1]] = false;
    });

    const release = () => states.forEach((state) => {
      state.left = false;
      state.right = false;
    });
    window.addEventListener("blur", release);

    const overlaps = (a, b) => (
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    );

    const checkPickups = (state) => {
      const playerBox = state.player.getBoundingClientRect();
      state.level.querySelectorAll(".level-coin").forEach((coin) => {
        if (!coin.classList.contains("is-collected") && overlaps(playerBox, coin.getBoundingClientRect())) {
          coin.click();
        }
      });
      state.level.querySelectorAll(".level-block--q").forEach((block) => {
        if (state.vy <= 0 || block.classList.contains("is-hit")) return;
        if (overlaps(playerBox, block.getBoundingClientRect())) block.click();
      });
      state.level.querySelectorAll(".level-goomba").forEach((goomba) => {
        if (state.vy > 0 || goomba.classList.contains("is-stomped")) return;
        const goombaBox = goomba.getBoundingClientRect();
        if (playerBox.bottom <= goombaBox.top + 10 && overlaps(playerBox, goombaBox)) {
          goomba.click();
        }
      });
    };

    let last = performance.now();
    const step = (now) => {
      if (!loader.isConnected || loader.classList.contains("is-done")) return;
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      states.forEach((state) => {
        if (state.won) return;
        const width = state.level.clientWidth;
        const playerWidth = state.player.offsetWidth || 24;
        const direction = (state.right ? 1 : 0) - (state.left ? 1 : 0);

        state.x = Math.max(0, Math.min(width - playerWidth, state.x + direction * 92 * dt));
        const previousY = state.y;
        state.y += state.vy * dt;
        state.vy -= 1000 * dt;
        state.onGround = false;

        const levelBox = state.level.getBoundingClientRect();
        const playerCenter = state.x + playerWidth / 2;
        state.platforms.forEach((platform) => {
          const box = platform.getBoundingClientRect();
          const top = levelBox.bottom - box.top;
          const left = box.left - levelBox.left;
          const right = box.right - levelBox.left;
          if (
            state.vy <= 0 &&
            playerCenter >= left &&
            playerCenter <= right &&
            previousY >= top &&
            state.y <= top
          ) {
            state.y = top;
            state.vy = 0;
            state.onGround = true;
          }
        });

        if (state.y <= 16) {
          state.y = 16;
          state.vy = 0;
          state.onGround = true;
        }

        state.player.style.left = `${state.x}px`;
        state.player.style.bottom = `${state.y}px`;
        state.player.classList.toggle("is-walking", direction !== 0 && state.onGround);

        const pipe = state.level.querySelector(".level-pipe--goal");
        if (pipe && state.vy <= 0) {
          const playerBox = state.player.getBoundingClientRect();
          const pipeBox = pipe.getBoundingClientRect();
          if (
            playerBox.right > pipeBox.left + 5 &&
            playerBox.left < pipeBox.right - 5 &&
            playerBox.bottom >= pipeBox.top - 2 &&
            playerBox.bottom <= pipeBox.top + 16
          ) {
            winLevel(state);
            return;
          }
        }

        checkPickups(state);
      });

      window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }

  function initDesktopMascot() {
    const mascot = $("#desktopMascot");
    if (!mascot) return;
    mascot.classList.add("is-visible");
  }

  function initMascotHearts() {
    const bubble = $("#mascotBubble");
    if (!bubble) return;

    const colors = ["#dd5b4b", "#ef8a7c", "#f0c35a", "#f6e3c4"];
    bubble.addEventListener("click", (event) => {
      event.stopPropagation();
      bubble.classList.remove("is-loved");
      void bubble.offsetWidth;
      bubble.classList.add("is-loved");
      window.setTimeout(() => bubble.classList.remove("is-loved"), 360);
      if (prefersReduced) return;

      const count = 7 + Math.floor(Math.random() * 5);
      for (let index = 0; index < count; index += 1) {
        const heart = document.createElement("i");
        heart.className = "mascot-heart";
        heart.style.left = `${8 + Math.random() * 82}%`;
        heart.style.setProperty("--drift", `${(Math.random() * 2 - 1) * 28}px`);
        heart.style.setProperty("--heart", colors[index % colors.length]);
        heart.style.animationDelay = `${index * 38 + Math.random() * 40}ms`;
        bubble.appendChild(heart);
        window.setTimeout(() => heart.remove(), 1600);
      }
    });
  }

  function initResumeEnvelope() {
    const card = $("#resumeCard");
    const modal = $("#resumeModal");
    if (!card || !modal) return;

    const closeButtons = Array.from(modal.querySelectorAll("[data-resume-close]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isOpen = false;
    let lastFocus = null;
    let openTimer = 0;
    let closeTimer = 0;

    const showModal = () => {
      modal.hidden = false;
      window.requestAnimationFrame(() => {
        modal.classList.add("is-open");
        document.body.classList.add("resume-open");
        const closeButton = modal.querySelector(".resume-sheet-close");
        if (closeButton) closeButton.focus({ preventScroll: true });
      });
    };

    const openModal = () => {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      const resumeImage = modal.querySelector(".resume-sheet-preview img[data-src]");
      if (resumeImage && !resumeImage.hasAttribute("src")) {
        resumeImage.src = resumeImage.dataset.src;
      }
      card.classList.add("is-opening");
      if (reducedMotion) {
        showModal();
      } else {
        openTimer = window.setTimeout(showModal, 520);
      }
    };

    const closeModal = () => {
      if (!isOpen) return;
      isOpen = false;
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
      modal.classList.remove("is-open");
      document.body.classList.remove("resume-open");
      card.classList.remove("is-opening");

      const finish = () => {
        modal.hidden = true;
        if (lastFocus && typeof lastFocus.focus === "function") {
          lastFocus.focus({ preventScroll: true });
        }
      };

      if (reducedMotion) finish();
      else closeTimer = window.setTimeout(finish, 220);
    };

    card.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      openModal();
    });

    closeButtons.forEach((button) => button.addEventListener("click", closeModal));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeModal();
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

  function initContactCopy() {
    $$("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const value = button.dataset.copy;
        const label = button.dataset.copyLabel || "内容";
        const action = $(".cm-action", button);
        if (!value) return;
        try {
          await copyText(value);
          showToast(`${label} 已复制 / copied`);
          if (action) {
            const original = action.textContent;
            action.textContent = "已复制";
            window.setTimeout(() => {
              action.textContent = original;
            }, 2200);
          }
        } catch (error) {
          showToast("复制失败，请手动选择");
        }
      });
    });
  }

  function initAnchors() {
    doc.addEventListener("click", (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor || anchor.hasAttribute("data-chapter-open")) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const isContactJump = anchor.hasAttribute("data-contact-jump");
      let target = (isContactJump && $(".postcard")) || doc.querySelector(href);
      if (href === "#works" && isNarrowViewport()) {
        target = $("#heroBoard") || target;
      }
      if (!target) return;
      event.preventDefault();
      if (menuOpen && window.__closePaperMenu) window.__closePaperMenu();
      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: isContactJump ? "center" : "start"
      });
      try {
        history.replaceState(null, "", isContactJump ? "#contact" : href);
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

  function initFamiliarPlay() {
    const loader = $("#loader");
    const figures = Array.from(document.querySelectorAll(".loader-familiar"));
    if (!loader || !figures.length || prefersReduced) return;
    if (window.matchMedia("(max-width: 760px)").matches) return;

    let stopped = false;
    const timers = new Set();
    const after = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };
    const stop = () => {
      if (stopped) return;
      stopped = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      figures.forEach((figure) => figure.classList.remove("is-hopping", "is-bumped"));
    };

    figures.forEach((figure, index) => {
      const goomba = figure.querySelector(".familiar-goomba");
      if (goomba) {
        goomba.style.animationDuration = `${(3.4 + Math.random() * 2.4).toFixed(2)}s`;
        goomba.style.animationDelay = `${(-Math.random() * 2).toFixed(2)}s`;
      }
      const star = figure.querySelector(".familiar-star");
      if (star) star.style.animationDelay = `${(-Math.random() * 2).toFixed(2)}s`;

      const jump = () => {
        if (stopped || !document.body.contains(loader) || loader.classList.contains("is-done")) {
          stop();
          return;
        }
        figure.classList.remove("is-hopping", "is-bumped");
        void figure.offsetWidth;
        figure.classList.add("is-hopping");
        after(() => figure.classList.add("is-bumped"), 70);
        after(() => figure.classList.remove("is-hopping", "is-bumped"), 900);
        after(jump, 1600 + Math.random() * 2400);
      };
      after(jump, 500 + index * 380 + Math.random() * 500);
    });

    loader.addEventListener("click", stop, true);
  }

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
    let ready = false;
    let exiting = false;
    let loadFired = false;
    const enterButton = $("#loaderEnter");
    const status = $(".loader-status");

    const paint = () => {
      if (number) number.textContent = pad(Math.min(99, Math.round(progress)));
      if (bar) bar.style.transform = `scaleX(${progress / 100})`;
    };

    const revealEntry = () => {
      if (ready || exiting) return;
      ready = true;
      window.clearInterval(timer);
      progress = 100;
      if (number) number.textContent = "100";
      if (bar) bar.style.transform = "scaleX(1)";
      loader.classList.add("is-ready");
      loader.setAttribute("aria-label", "加载完成，点击进入作品集");
      if (status) {
        status.childNodes[0].nodeValue = "欢迎翻阅我的作品集…";
        const label = $("em", status);
        if (label) label.textContent = "WELCOME TO MY PORTFOLIO";
      }
      if (enterButton) {
        enterButton.disabled = false;
        window.setTimeout(() => enterButton.focus({ preventScroll: true }), 220);
      }
    };

    const enter = () => {
      if (!ready || exiting) return;
      exiting = true;
      if (enterButton) enterButton.disabled = true;
      loader.classList.add("is-done");
      loader.setAttribute("aria-label", "正在进入作品集");
      doc.body.classList.remove("is-loading");
      doc.body.classList.add("is-ready");
      window.setTimeout(() => loader.remove(), 1100);
    };

    enterButton?.addEventListener("click", enter);
    loader.addEventListener("click", (event) => {
      if (!ready || exiting) return;
      if (event.target.closest("button, a")) return;
      enter();
    });

    const timer = window.setInterval(() => {
      if (ready) return;
      progress = Math.min(loadFired ? 100 : 91, progress + 2.5 + Math.random() * 5);
      paint();
      if (loadFired && progress > 96) revealEntry();
    }, 80);

    const onLoad = () => {
      loadFired = true;
      progress = Math.max(progress, 92);
      paint();
      window.setTimeout(revealEntry, 450);
    };

    if (doc.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    window.setTimeout(() => {
      if (!ready) {
        loadFired = true;
        revealEntry();
      }
    }, 4800);

    paint();
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  resetInitialPosition();
  buildIndex();
  initHeroBoard();
  buildFacts();

  initLoader();
  initLoaderGames();
  initLoaderPlayers();
  initFamiliarPlay();
  initHeader();
  initScrollSpy();
  initMenu();
  initCollage();
  initCursor();
  initLightbox();
  initFragmentGame();
  initChapterReader();
  initPortraitScratch();
  initDesktopMascot();
  initMascotHearts();
  initResumeEnvelope();
  initTouchFeedback();
  initEmailCopy();
  initContactCopy();
  initAnchors();
  initKeyboard();
  initReveal();

  console.info(
    `%cKAIYU / PAPER PORTFOLIO%c  ${totalPlates} pieces · ${categories.length} chapters · 1 fragment game`,
    "background:#cf4b32;color:#fcf8ef;padding:3px 6px;font-weight:700",
    "color:#746c60"
  );
})();
