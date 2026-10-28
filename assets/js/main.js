/* ==========================================================================
   KAIYU ZHENG — PORTFOLIO
   Vanilla JS. No dependencies, no build step.
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
  const pad = (num) => String(num).padStart(2, "0");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js");

  const categories = DATA.categories;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totalPlates = categories.reduce((sum, category) => sum + category.plates.length, 0);
  const allPlateNodes = [];

  let menuOpen = false;
  let lightboxOpen = false;
  let lastFocusedElement = null;
  let toastTimer = 0;

  /* ------------------------------------------------------------------ */
  /* Theme                                                              */
  /* ------------------------------------------------------------------ */

  const themeToggle = $("#themeToggle");

  function storedTheme() {
    try {
      return window.localStorage.getItem("kaiyu-theme");
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme, persist = false) {
    root.dataset.theme = theme;
    if (persist) {
      try {
        window.localStorage.setItem("kaiyu-theme", theme);
      } catch (error) {
        /* private mode */
      }
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "切换到浅色模式" : "切换到深色模式"
      );
    }
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "dark" ? "#090909" : "#f1ede4");
    }
    doc.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  applyTheme(storedTheme() === "light" ? "light" : "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }

  function toggleTheme() {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  }

  /* ------------------------------------------------------------------ */
  /* Clocks                                                             */
  /* ------------------------------------------------------------------ */

  const clockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  function updateClocks() {
    const time = clockFormatter.format(new Date());
    $$("[data-clock]").forEach((node) => {
      node.textContent = time;
    });
  }

  updateClocks();
  window.setInterval(updateClocks, 1000);

  /* ------------------------------------------------------------------ */
  /* Build: hero deck                                                   */
  /* ------------------------------------------------------------------ */

  const deckStage = $("#deckStage");
  const deckCounter = $("#deckCounter");
  const deckCaption = $("#deckCaption");
  const deckStatus = $("#deckStatus");
  let deckIndex = 0;
  let deckDragStart = null;
  let deckDragged = false;
  let deckSuppressClick = false;

  function buildHeroDeck() {
    if (!deckStage) return;
    deckStage.innerHTML = DATA.hero
      .map(
        (item, index) => `
          <button class="deck-card" type="button" data-index="${index}" data-cat="${item.cat}" aria-label="查看精选作品：${item.title}">
            <img src="${item.cover}" alt="${item.title}" width="1000" height="1250" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" draggable="false">
            <span class="deck-card__label"><i></i>${item.label}</span>
            <span class="deck-card__title"><span>FEATURED PROJECT / 精选</span>${item.title}</span>
          </button>
        `
      )
      .join("");

    const cards = $$(".deck-card", deckStage);
    cards.forEach((card) => {
      card.style.transformOrigin = "80% 88%";
    });
    renderDeck();
  }

  function renderDeck() {
    if (!deckStage) return;
    const cards = $$(".deck-card", deckStage);
    const total = cards.length;
    cards.forEach((card, index) => {
      const position = (index - deckIndex + total) % total;
      card.style.zIndex = String(total - position + 10);
      card.style.transform = `translate3d(${-position * 16}px, ${position * 15}px, 0) rotate(${
        position * -3.1 + 2.2
      }deg) scale(${1 - position * 0.035})`;
      card.classList.toggle("is-active", position === 0);
      card.setAttribute("aria-current", position === 0 ? "true" : "false");
      card.style.pointerEvents = position > 2 ? "none" : "auto";
    });
    const active = DATA.hero[deckIndex];
    if (deckCounter) deckCounter.textContent = `${pad(deckIndex + 1)} / ${pad(total)}`;
    if (deckCaption) deckCaption.innerHTML = `${active.label}<br><b>${active.title}</b>`;
    if (deckStatus) deckStatus.textContent = `精选作品 ${deckIndex + 1} / ${total}：${active.title}`;
  }

  function cycleDeck(direction) {
    deckIndex = (deckIndex + direction + DATA.hero.length) % DATA.hero.length;
    renderDeck();
  }

  function initDeck() {
    if (!deckStage) return;
    const deck = $("#heroDeck");

    $$("[data-deck-prev]").forEach((button) => {
      button.addEventListener("click", () => cycleDeck(-1));
    });
    $$("[data-deck-next]").forEach((button) => {
      button.addEventListener("click", () => cycleDeck(1));
    });

    deckStage.addEventListener("pointerdown", (event) => {
      const card = event.target.closest(".deck-card");
      if (!card || (event.pointerType === "mouse" && event.button !== 0)) return;
      deckDragStart = { x: event.clientX, y: event.clientY };
      deckDragged = false;
      deckStage.setPointerCapture?.(event.pointerId);
    });

    deckStage.addEventListener("pointermove", (event) => {
      if (!deckDragStart) return;
      const dx = event.clientX - deckDragStart.x;
      const dy = event.clientY - deckDragStart.y;
      if (Math.abs(dx) > 7 || Math.abs(dy) > 7) deckDragged = true;
      if (Math.abs(dx) > 8) {
        if (event.cancelable) event.preventDefault();
        deckStage.classList.add("is-dragging");
        if (deck) {
          deck.style.transform = `translate3d(${clamp(dx * 0.16, -38, 38)}px, 0, 0) rotate(${clamp(
            dx * 0.012,
            -2.5,
            2.5
          )}deg)`;
        }
      }
    });

    const finishDeckDrag = (event) => {
      if (!deckDragStart) return;
      const dx = event.clientX - deckDragStart.x;
      const dy = event.clientY - deckDragStart.y;
      const wasDrag = deckDragged;
      deckDragStart = null;
      deckDragged = false;
      deckStage.classList.remove("is-dragging");
      if (deck) deck.style.transform = "";
      if (wasDrag && Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
        cycleDeck(dx < 0 ? 1 : -1);
        deckSuppressClick = true;
        window.setTimeout(() => {
          deckSuppressClick = false;
        }, 80);
      }
    };

    deckStage.addEventListener("pointerup", finishDeckDrag);
    deckStage.addEventListener("pointercancel", () => {
      deckDragStart = null;
      deckDragged = false;
      deckStage.classList.remove("is-dragging");
      if (deck) deck.style.transform = "";
    });

    deckStage.addEventListener("click", (event) => {
      const card = event.target.closest(".deck-card");
      if (!card) return;
      if (deckSuppressClick) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const index = Number(card.dataset.index);
      if (index !== deckIndex) {
        deckIndex = index;
        renderDeck();
        return;
      }
      const target = categoryById.get(card.dataset.cat);
      if (target) {
        document.getElementById(target.id)?.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Build: menu, rail, index, chapters, facts                          */
  /* ------------------------------------------------------------------ */

  function buildMenu() {
    const container = $("#menuLinks");
    if (!container) return;
    const chapterLinks = categories
      .map(
        (category) => `
          <a href="#${category.id}" data-menu-link>
            <span>${category.num}</span>${category.title}<em>${category.en}</em>
          </a>
        `
      )
      .join("");
    container.innerHTML = `
      ${chapterLinks}
      <a href="#play" data-menu-link><span>06.5</span>互动实验<em>PLAYGROUND</em></a>
      <a href="#about" data-menu-link><span>07</span>关于我<em>ABOUT</em></a>
      <a href="#contact" data-menu-link><span>08</span>联系<em>CONTACT</em></a>
    `;
  }

  function buildPageRail() {
    const container = $("#pageRail");
    if (!container) return;
    container.innerHTML = categories
      .map(
        (category) =>
          `<a href="#${category.id}" data-rail-link="${category.id}" aria-label="${category.title}">${category.num}</a>`
      )
      .join("");
  }

  function buildIndex() {
    const list = $("#indexList");
    const preview = $("#indexPreview");
    if (!list) return;

    list.innerHTML = categories
      .map((category) => {
        const count = pad(category.plates.length);
        return `
          <a class="work-row" href="#${category.id}" data-cover="${category.cover}" data-cat="${category.id}">
            <span class="work-no">${category.num}</span>
            <span class="work-title"><b>${category.title}</b><em>${category.en}</em></span>
            <span class="work-tags">${category.tags.slice(0, 3).join(" / ")}</span>
            <span class="work-count">${count}<i>PLATES</i></span>
            <span class="work-arrow" aria-hidden="true">↗</span>
          </a>
        `;
      })
      .join("");

    if (!preview || !isFinePointer) return;
    const previewImage = $("img", preview);
    let activeRow = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const animatePreview = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      preview.style.left = `${currentX}px`;
      preview.style.top = `${currentY}px`;
      rafId = window.requestAnimationFrame(animatePreview);
    };

    const movePreview = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!rafId) {
        currentX = targetX;
        currentY = targetY;
        animatePreview();
      }
    };

    $$(".work-row", list).forEach((row) => {
      row.addEventListener("pointerenter", (event) => {
        activeRow = row;
        if (previewImage) {
          previewImage.src = row.dataset.cover;
          previewImage.alt = `${row.querySelector(".work-title b")?.textContent || ""} 预览`;
        }
        preview.classList.add("is-visible");
        movePreview(event);
      });
      row.addEventListener("pointerleave", () => {
        activeRow = null;
        preview.classList.remove("is-visible");
      });
    });

    list.addEventListener("pointermove", (event) => {
      if (activeRow) movePreview(event);
    });

    list.addEventListener("pointerleave", () => {
      activeRow = null;
      preview.classList.remove("is-visible");
    });

    window.setTimeout(() => {
      categories.forEach((category) => {
        const image = new Image();
        image.src = category.cover;
      });
    }, 1200);
  }

  function buildChapters() {
    const container = $("#workChapters");
    if (!container) return;

    container.innerHTML = categories
      .map((category) => {
        const total = category.plates.length;
        const plates = category.plates
          .map((plate, index) => {
            const number = pad(index + 1);
            return `
              <button class="plate" type="button" data-plate-id="${plate.id}" data-plate-index="${index}" aria-label="查看作品：${plate.title}，${plate.role}">
                <span class="plate-media">
                  <img
                    src="assets/img/thumb/${plate.id}.webp"
                    srcset="assets/img/thumb/${plate.id}.webp 900w, assets/img/wide/${plate.id}.webp 1800w"
                    sizes="(max-width: 900px) 84vw, 75vw"
                    width="1800" height="636"
                    alt="${plate.title} — ${plate.role}"
                    loading="lazy" decoding="async">
                  <span class="plate-view" aria-hidden="true">VIEW<br>↗</span>
                </span>
                <span class="plate-info">
                  <span class="plate-num">${number} / ${pad(total)}</span>
                  <span class="plate-copy"><b>${plate.title}</b><em>${plate.role}</em></span>
                  <span class="plate-plus" aria-hidden="true">+</span>
                </span>
              </button>
            `;
          })
          .join("");

        const tags = category.tags
          .map((tag) => `<li>${tag}</li>`)
          .join("");

        return `
          <section class="chapter" id="${category.id}" data-section="${category.id}" style="--cat:${category.color}">
            <header class="chapter-head">
              <div class="chapter-index" data-reveal>
                <span>${category.num}</span>
                <i>CHAPTER / ${category.num}</i>
              </div>
              <div class="chapter-name" data-reveal>
                <p class="eyebrow">${category.en} / ${pad(total)} PLATES</p>
                <h2>${category.title}</h2>
                <p class="chapter-en">${category.en}</p>
              </div>
              <div class="chapter-copy" data-reveal>
                <p>${category.desc}</p>
                <ul class="chapter-tags">${tags}</ul>
              </div>
            </header>
            <div class="chapter-rail" data-reveal>
              <div class="rail-track" data-rail-track="${category.id}" role="region" aria-label="${category.title}作品横向画廊" tabindex="0">
                ${plates}
              </div>
              <div class="rail-ui">
                <div class="rail-progress" aria-hidden="true"><i data-rail-progress></i></div>
                <span class="rail-current"><b data-rail-current>01</b> / ${pad(total)}</span>
                <span class="rail-hint">DRAG / SCROLL</span>
                <div class="rail-controls">
                  <button type="button" data-rail-prev aria-label="上一张${category.title}作品">←</button>
                  <button type="button" data-rail-next aria-label="下一张${category.title}作品">→</button>
                </div>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    allPlateNodes.push(...$$(".plate", container));
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
  /* Hero field                                                         */
  /* ------------------------------------------------------------------ */

  function initHeroField() {
    const canvas = $("#heroField");
    const hero = $(".hero");
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let dots = [];
    let raf = 0;
    let visible = true;
    const pointer = { x: -999, y: -999, active: false };

    const makeDots = () => {
      const count = width < 760 ? 54 : 108;
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.2 + 0.45,
        alpha: Math.random() * 0.5 + 0.15
      }));
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeDots();
      if (prefersReduced) drawFrame(true);
    };

    const drawFrame = (staticFrame = false) => {
      ctx.clearRect(0, 0, width, height);
      const dark = root.dataset.theme === "dark";
      const ink = dark ? "243, 239, 229" : "12, 12, 11";
      const lineInk = dark ? "217, 255, 63" : "255, 77, 46";

      dots.forEach((dot) => {
        if (!staticFrame) {
          if (pointer.active) {
            const dx = dot.x - pointer.x;
            const dy = dot.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 170 && distance > 0.1) {
              const force = (1 - distance / 170) * 0.2;
              dot.vx += (dx / distance) * force;
              dot.vy += (dy / distance) * force;
            }
          }
          dot.x += dot.vx;
          dot.y += dot.vy;
          dot.vx *= 0.992;
          dot.vy *= 0.992;
          if (dot.x < -10) dot.x = width + 10;
          if (dot.x > width + 10) dot.x = -10;
          if (dot.y < -10) dot.y = height + 10;
          if (dot.y > height + 10) dot.y = -10;

          if (pointer.active) {
            const distance = Math.hypot(dot.x - pointer.x, dot.y - pointer.y);
            if (distance < 210) {
              ctx.beginPath();
              ctx.moveTo(dot.x, dot.y);
              ctx.lineTo(pointer.x, pointer.y);
              ctx.strokeStyle = `rgba(${lineInk}, ${0.16 * (1 - distance / 210)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ink}, ${dot.alpha})`;
        ctx.fill();
      });

      if (pointer.active) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 42, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${lineInk}, .14)`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lineInk}, .6)`;
        ctx.fill();
      }
    };

    const animate = () => {
      if (visible && !prefersReduced) drawFrame();
      raf = window.requestAnimationFrame(animate);
    };

    hero.addEventListener("pointermove", (event) => {
      if (!isFinePointer || prefersReduced) return;
      const rect = hero.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    hero.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    root.addEventListener("themechange", () => {
      if (prefersReduced) drawFrame(true);
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(hero);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01 }
      ).observe(hero);
    }

    resize();
    if (!prefersReduced) animate();
  }

  /* ------------------------------------------------------------------ */
  /* Header, scroll, reveal                                             */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    const header = $("#siteHeader");
    if (!header) return;
    let ticking = false;

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
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

  function initScrollProgress() {
    const bar = $("#scrollProgress");
    if (!bar) return;
    let ticking = false;

    const update = () => {
      const max = doc.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      bar.style.transform = `scaleX(${value})`;
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
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function initScrollSpy() {
    const railLinks = $$("[data-rail-link]");
    const railCurrent = $("#railCurrent");
    if (!railLinks.length) return;
    let ticking = false;

    const update = () => {
      const sections = $$("[data-section]");
      let current = null;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.38) current = section;
      });

      const currentId = current?.id || "";
      const isChapter = categoryById.has(currentId);
      railLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.railLink === currentId);
      });
      if (railCurrent) {
        railCurrent.textContent = isChapter ? categoryById.get(currentId).num : "00";
      }
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

  function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReduced) {
      items.forEach((item) => item.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" }
    );

    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 60}ms`;
      observer.observe(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Custom cursor                                                      */
  /* ------------------------------------------------------------------ */

  function initCursor() {
    if (!isFinePointer) return;
    const cursor = $("#cursor");
    const label = $("#cursorLabel");
    if (!cursor || !label) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let labelX = x;
    let labelY = y;

    window.addEventListener(
      "pointermove",
      (event) => {
        x = event.clientX;
        y = event.clientY;
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;

        const viewTarget = event.target.closest(
          ".plate, .deck-card.is-active, [data-cursor='view']"
        );
        const hoverTarget = event.target.closest(
          "a, button, [role='button'], .work-row, .lightbox-stage"
        );
        doc.body.classList.toggle("cursor-view", Boolean(viewTarget));
        doc.body.classList.toggle("cursor-hover", Boolean(hoverTarget) && !viewTarget);
        if (viewTarget) {
          label.textContent = viewTarget.dataset.cursor || "VIEW";
        }
      },
      { passive: true }
    );

    label.style.left = `${labelX}px`;
    label.style.top = `${labelY}px`;

    const animateCursor = () => {
      labelX += (x - labelX) * 0.16;
      labelY += (y - labelY) * 0.16;
      label.style.left = `${labelX}px`;
      label.style.top = `${labelY}px`;
      window.requestAnimationFrame(animateCursor);
    };
    animateCursor();

    doc.addEventListener("pointerleave", () => {
      doc.body.classList.remove("cursor-hover", "cursor-view");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero title parallax                                                */
  /* ------------------------------------------------------------------ */

  function initTitleParallax() {
    if (!isFinePointer || prefersReduced) return;
    const hero = $(".hero");
    const letters = $$(".hero-letter");
    if (!hero || !letters.length) return;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;

    const render = () => {
      letters.forEach((letter, index) => {
        const weight = 2.2 + index * 0.85;
        letter.style.setProperty("--lx", `${targetX * weight}px`);
        letter.style.setProperty("--ly", `${targetY * weight * 0.7}px`);
      });
      raf = 0;
    };

    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        targetX = (event.clientX - rect.left) / rect.width - 0.5;
        targetY = (event.clientY - rect.top) / rect.height - 0.5;
        if (!raf) raf = window.requestAnimationFrame(render);
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = window.requestAnimationFrame(render);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Rails                                                              */
  /* ------------------------------------------------------------------ */

  function initRails() {
    $$("[data-rail-track]").forEach((track) => {
      const section = track.closest(".chapter");
      if (!section) return;
      const progress = $("[data-rail-progress]", section);
      const current = $("[data-rail-current]", section);
      const total = $$(".plate", track).length;
      let ticking = false;

      const update = () => {
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        const ratio = max > 0 ? track.scrollLeft / max : 0;
        if (progress) progress.style.transform = `scaleX(${ratio})`;
        const firstPlate = $(".plate", track);
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap) || 24;
        const step = (firstPlate?.getBoundingClientRect().width || 1) + gap;
        const visible = clamp(Math.round(track.scrollLeft / step) + 1, 1, total);
        if (current) current.textContent = pad(visible);
        ticking = false;
      };

      track.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
          }
        },
        { passive: true }
      );

      $("[data-rail-prev]", section)?.addEventListener("click", () => {
        track.scrollBy({ left: -track.clientWidth * 0.76, behavior: "smooth" });
      });
      $("[data-rail-next]", section)?.addEventListener("click", () => {
        track.scrollBy({ left: track.clientWidth * 0.76, behavior: "smooth" });
      });

      let startX = 0;
      let startScroll = 0;
      let down = false;
      let moved = false;

      track.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        down = true;
        moved = false;
        startX = event.clientX;
        startScroll = track.scrollLeft;
      });

      track.addEventListener("pointermove", (event) => {
        if (!down) return;
        const dx = event.clientX - startX;
        if (Math.abs(dx) > 5) {
          if (!moved) {
            moved = true;
            track.classList.add("is-dragging");
            track.setPointerCapture?.(event.pointerId);
          }
          track.scrollLeft = startScroll - dx;
        }
      });

      const endDrag = () => {
        if (!down) return;
        down = false;
        track.classList.remove("is-dragging");
        window.setTimeout(() => {
          moved = false;
        }, 0);
      };

      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);

      track.addEventListener(
        "click",
        (event) => {
          if (!moved) return;
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );

      track.addEventListener("keydown", (event) => {
        if (event.target !== track) return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          track.scrollBy({ left: track.clientWidth * 0.76, behavior: "smooth" });
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          track.scrollBy({ left: -track.clientWidth * 0.76, behavior: "smooth" });
        } else if (event.key === "Home") {
          event.preventDefault();
          track.scrollTo({ left: 0, behavior: "smooth" });
        } else if (event.key === "End") {
          event.preventDefault();
          track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
        }
      });

      window.addEventListener("resize", update, { passive: true });
      update();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox                                                           */
  /* ------------------------------------------------------------------ */

  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxStage = $("#lightboxStage");
  const lightboxCat = $("#lightboxCat");
  const lightboxCount = $("#lightboxCount");
  const lightboxTitle = $("#lightboxTitle");
  const lightboxRole = $("#lightboxRole");
  const lightboxFull = $("#lightboxFull");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");

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
    lightboxImage.alt = `${plate.title} — ${plate.role}`;
    if (lightboxCat) lightboxCat.textContent = `${category.num} ${category.en}`;
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
    lbState.index = clamp(index, 0, category.plates.length - 1);
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
    }, 360);
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
    const focusable = $$('button:not([disabled]), a[href]', lightbox).filter(
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
      const plate = event.target.closest(".plate");
      if (!plate) return;
      const chapter = plate.closest(".chapter");
      if (!chapter) return;
      openLightbox(chapter.id, Number(plate.dataset.plateIndex));
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrev?.addEventListener("click", () => stepLightbox(-1));
    lightboxNext?.addEventListener("click", () => stepLightbox(1));

    $("#zoomIn")?.addEventListener("click", () => setLightboxZoom(lbState.zoom + 0.5));
    $("#zoomOut")?.addEventListener("click", () => setLightboxZoom(lbState.zoom - 0.5));
    $("#zoomReset")?.addEventListener("click", resetLightboxZoom);

    lightboxStage?.addEventListener("click", (event) => {
      if (!lightboxOpen || event.target.closest("button, a")) return;
      if (lbState.panned) {
        lbState.panned = false;
        return;
      }
      setLightboxZoom(lbState.zoom > 1.01 ? 1 : 2.2);
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
      lightboxStage.setPointerCapture?.(event.pointerId);
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
  /* Menu                                                               */
  /* ------------------------------------------------------------------ */

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
        window.setTimeout(() => close?.focus({ preventScroll: true }), 400);
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
    });
    window.__closePortfolioMenu = () => {
      if (menuOpen) setMenu(false);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Playground                                                         */
  /* ------------------------------------------------------------------ */

  function initPlayground() {
    const canvas = $("#playCanvas");
    const stage = $(".play-stage");
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hint = $("#playHint");
    const countNode = $("#particleCount");
    const modeNode = $("#playModeReadout");
    const palettes = {
      acid: ["#d9ff3f", "#ff5235", "#5b78ff", "#f3efe5"],
      riso: ["#ff4f8b", "#ffb21a", "#2d5bff", "#f3efe5"],
      ghost: ["#9fe7ff", "#d7c6ff", "#8affc1", "#f3efe5"]
    };
    let palette = palettes.acid;
    let mode = "trail";
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let raf = 0;
    let lastFrame = 0;
    let visible = true;
    let hintHidden = false;
    let pointerInside = false;
    let pointerDown = false;
    const pointer = { x: 0, y: 0, px: 0, py: 0, moved: false };

    const random = (min, max) => min + Math.random() * (max - min);

    function rgba(hex, alpha) {
      const value = hex.replace("#", "");
      const bigint = parseInt(value, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function paintBackdrop() {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#060606";
      ctx.fillRect(0, 0, width, height);

      const gap = 44;
      ctx.fillStyle = "rgba(243, 239, 229, .08)";
      for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    function resize() {
      const rect = stage.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = [];
      paintBackdrop();
    }

    function hideHint() {
      if (hintHidden) return;
      hintHidden = true;
      hint?.classList.add("is-hidden");
    }

    function spawn(x, y, burst = false) {
      const count = burst ? 46 : mode === "burst" ? 5 : 2;
      const px = pointer.px || x;
      const py = pointer.py || y;
      const velocityX = (x - px) * 0.055;
      const velocityY = (y - py) * 0.055;

      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = burst ? random(0.7, 4.8) : random(0.1, 1.2);
        const color = palette[Math.floor(Math.random() * palette.length)];
        particles.push({
          x: x + random(-4, 4),
          y: y + random(-4, 4),
          px: x,
          py: y,
          vx: Math.cos(angle) * speed + velocityX,
          vy: Math.sin(angle) * speed + velocityY,
          life: burst ? random(44, 90) : random(55, 130),
          maxLife: 130,
          size: random(0.7, burst ? 3.4 : 2.2),
          color
        });
      }

      if (particles.length > 950) {
        particles.splice(0, particles.length - 950);
      }
    }

    function animate(timestamp) {
      if (!visible) {
        raf = window.requestAnimationFrame(animate);
        return;
      }
      if (timestamp - lastFrame < 16 && !prefersReduced) {
        raf = window.requestAnimationFrame(animate);
        return;
      }
      lastFrame = timestamp;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(6, 6, 6, .085)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        particle.px = particle.x;
        particle.py = particle.y;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.994;
        particle.vy *= 0.994;
        if (mode === "burst") particle.vy += 0.012;
        particle.life -= 1;

        if (
          particle.life <= 0 ||
          particle.x < -30 ||
          particle.x > width + 30 ||
          particle.y < -30 ||
          particle.y > height + 30
        ) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = clamp(particle.life / particle.maxLife, 0, 1) * 0.78;
        ctx.beginPath();
        ctx.moveTo(particle.px, particle.py);
        ctx.lineTo(particle.x, particle.y);
        ctx.strokeStyle = rgba(particle.color, alpha);
        ctx.lineWidth = particle.size;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.font = '7px "Consolas", monospace';
      ctx.fillStyle = "rgba(243, 239, 229, .38)";
      ctx.fillText("KAIYU / PLAYGROUND", 14, height - 14);

      if (pointerInside) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(217, 255, 63, .55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      countNode.textContent = String(particles.length).padStart(3, "0");
      raf = window.requestAnimationFrame(animate);
    }

    function positionFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.px = pointer.x || event.clientX - rect.left;
      pointer.py = pointer.y || event.clientY - rect.top;
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }

    canvas.addEventListener("pointerenter", (event) => {
      pointerInside = true;
      positionFromEvent(event);
    });

    canvas.addEventListener("pointermove", (event) => {
      positionFromEvent(event);
      pointerInside = true;
      hideHint();
      if (pointerDown || mode === "burst") {
        spawn(pointer.x, pointer.y);
      } else {
        spawn(pointer.x, pointer.y);
      }
    });

    canvas.addEventListener("pointerdown", (event) => {
      pointerDown = true;
      pointerInside = true;
      positionFromEvent(event);
      hideHint();
      spawn(pointer.x, pointer.y, true);
      canvas.setPointerCapture?.(event.pointerId);
      if (event.cancelable) event.preventDefault();
    });

    const release = () => {
      pointerDown = false;
    };
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("pointerleave", () => {
      pointerInside = false;
      pointerDown = false;
    });

    $$("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        mode = button.dataset.mode || "trail";
        $$("[data-mode]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        if (modeNode) modeNode.textContent = `${mode.toUpperCase()} MODE`;
      });
    });

    $$("[data-palette]").forEach((button) => {
      button.addEventListener("click", () => {
        palette = palettes[button.dataset.palette] || palettes.acid;
        $$("[data-palette]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
      });
    });

    $("#playClear")?.addEventListener("click", () => {
      particles = [];
      paintBackdrop();
      countNode.textContent = "000";
      showToast("画布已清空 / CLEARED");
    });

    $("#playSave")?.addEventListener("click", () => {
      const filename = `kaiyu-playground-${new Date().toISOString().slice(0, 10)}.png`;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = doc.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        doc.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showToast("画布已保存 / IMAGE SAVED");
      }, "image/png");
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(stage);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01 }
      ).observe(stage);
    }

    resize();
    raf = window.requestAnimationFrame(animate);
  }

  /* ------------------------------------------------------------------ */
  /* Sound                                                              */
  /* ------------------------------------------------------------------ */

  function initSound() {
    const button = $("#soundToggle");
    if (!button) return;
    const label = $(".sound-label", button);
    let audioContext = null;
    let master = null;
    let soundOn = false;

    const createAudio = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
      master = audioContext.createGain();
      master.gain.value = 0;
      const filter = audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      filter.Q.value = 0.8;
      filter.connect(master);
      master.connect(audioContext.destination);

      const notes = [
        { frequency: 55, gain: 0.13, type: "sine", pan: -0.35 },
        { frequency: 82.41, gain: 0.07, type: "triangle", pan: 0.25 },
        { frequency: 110, gain: 0.05, type: "sine", pan: -0.05 },
        { frequency: 164.81, gain: 0.024, type: "sine", pan: 0.45 }
      ];

      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = note.type;
        oscillator.frequency.value = note.frequency;
        gain.gain.value = note.gain;
        const panner = audioContext.createStereoPanner
          ? audioContext.createStereoPanner()
          : null;
        if (panner) {
          panner.pan.value = note.pan;
          oscillator.connect(gain).connect(panner).connect(filter);
        } else {
          oscillator.connect(gain).connect(filter);
        }
        oscillator.start();
      });

      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 0.055;
      lfoGain.gain.value = 90;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      return audioContext;
    };

    button.addEventListener("click", async () => {
      if (!audioContext) createAudio();
      if (!audioContext || !master) return;
      try {
        await audioContext.resume();
        soundOn = !soundOn;
        master.gain.setTargetAtTime(soundOn ? 0.07 : 0, audioContext.currentTime, 0.55);
        button.classList.toggle("is-on", soundOn);
        button.setAttribute("aria-pressed", String(soundOn));
        button.setAttribute("aria-label", soundOn ? "关闭环境声音" : "开启环境声音");
        if (label) label.innerHTML = soundOn ? "SOUND <b>ON</b>" : "SOUND <b>OFF</b>";
        showToast(soundOn ? "环境声音已开启 / SOUND ON" : "环境声音已关闭 / SOUND OFF");
      } catch (error) {
        /* Audio can be blocked; ignore. */
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Utility interactions                                               */
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
      try {
        await copyText(email);
        showToast("邮箱已复制 / EMAIL COPIED");
        button.querySelector("em").textContent = "COPIED — SEE YOU IN THE INBOX";
        window.setTimeout(() => {
          button.querySelector("em").textContent = "CLICK TO COPY / 点击复制";
        }, 2200);
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
      if (menuOpen && window.__closePortfolioMenu) window.__closePortfolioMenu();
      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start"
      });
      try {
        history.replaceState(null, "", href);
      } catch (error) {
        /* file:// can restrict history */
      }
    });
  }

  function initKeyboard() {
    doc.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("input, textarea, select")) return;
      if (lightboxOpen) return;
      const key = event.key.toLowerCase();
      if (key === "g") {
        doc.body.classList.toggle("no-grain");
        showToast(doc.body.classList.contains("no-grain") ? "颗粒已关闭 / GRAIN OFF" : "颗粒已开启 / GRAIN ON");
      } else if (key === "t") {
        toggleTheme();
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

    let progress = 0;
    let done = false;
    let loadEventFired = false;
    const started = performance.now();

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
        window.setTimeout(() => loader.remove(), 1200);
      }, 320);
    };

    const timer = window.setInterval(() => {
      if (done) return;
      const elapsed = performance.now() - started;
      const ceiling = loadEventFired ? 100 : 91;
      progress = Math.min(ceiling, progress + Math.max(0.8, (ceiling - progress) * 0.08));
      if (elapsed > 1300) progress = Math.min(ceiling, progress + 0.4);
      paint();
      if (progress >= 99.5 && loadEventFired) {
        window.clearInterval(timer);
        finish();
      }
    }, 80);

    const onLoad = () => {
      loadEventFired = true;
      progress = Math.max(progress, 94);
      paint();
      window.setTimeout(finish, 520);
    };

    if (doc.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    window.setTimeout(() => {
      if (!done) {
        loadEventFired = true;
        finish();
      }
    }, 5200);

    paint();
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  buildHeroDeck();
  buildMenu();
  buildPageRail();
  buildIndex();
  buildChapters();
  buildFacts();

  initDeck();
  initMenu();
  initHeroField();
  initTitleParallax();
  initHeader();
  initScrollProgress();
  initRails();
  initLightbox();
  initPlayground();
  initSound();
  initEmailCopy();
  initAnchors();
  initKeyboard();
  initCursor();
  initReveal();
  initScrollSpy();
  initLoader();

  // A small helper for anyone opening the console.
  console.info(
    `%cKAIYU / PORTFOLIO%c  ${totalPlates} plates · ${categories.length} chapters · 1 playground`,
    "background:#d9ff3f;color:#080808;padding:3px 6px;font-weight:700",
    "color:#8b877d"
  );
})();
