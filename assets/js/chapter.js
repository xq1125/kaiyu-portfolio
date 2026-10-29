/* Chapter page — renders one chapter with its films first, then every plate. */
(() => {
  "use strict";

  const DATA = window.PORTFOLIO;
  if (!DATA) return;

  const categories = DATA.categories;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("c");
  let categoryIndex = categories.findIndex((category) => category.id === requested);
  if (categoryIndex < 0) categoryIndex = 0;
  const category = categories[categoryIndex];

  const $ = (selector) => document.querySelector(selector);
  const pad = (value) => String(value).padStart(2, "0");
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const set = (selector, value) => {
    const node = $(selector);
    if (node) node.textContent = value;
  };

  document.title = `${category.title} — 郑铠妤 KAIYU`;
  document.body.dataset.chapter = category.id;

  set("#chapterKicker", `CHAPTER ${category.num} / ${category.en}`);
  set("#chapterCount", `${pad(categoryIndex + 1)} / ${pad(categories.length)}`);
  set("#chapterNum", category.num);
  set("#chapterTitle", category.title);
  set("#chapterHand", category.noteTitle);
  set("#chapterDesc", category.desc);
  set("#workCount", `${pad(category.plates.length)} PIECES`);

  const tags = $("#chapterTags");
  if (tags) {
    tags.innerHTML = category.tags.map((tag) => `<li>${esc(tag)}</li>`).join("");
  }

  const films = [];
  category.plates.forEach((plate, plateIndex) => {
    (plate.videos || []).forEach((video) => {
      films.push({ plate, video, plateIndex });
    });
  });

  const filmSection = $("#filmSection");
  const filmGrid = $("#filmGrid");
  if (filmSection && filmGrid) {
    if (films.length) {
      filmSection.hidden = false;
      const filmWord = films.length === 1 ? "FILM" : "FILMS";
      set("#filmCount", `${pad(films.length)} ${filmWord} / ${pad(category.plates.length)} PIECES`);
      filmGrid.innerHTML = films
        .map(
          ({ plate, video }, index) => `
            <article class="film-card">
              <div class="film-frame">
                <video controls playsinline preload="metadata" poster="${esc(video.poster)}"
                       aria-label="${esc(plate.title)} ${esc(video.label)}">
                  <source src="${esc(video.src)}" type="video/mp4">
                  你的浏览器不支持 HTML5 视频。
                </video>
              </div>
              <div class="film-meta">
                <span class="film-label">FILM ${pad(index + 1)} / ${esc(category.en)}</span>
                <h3>${esc(plate.title)} <small>${esc(video.label)}</small></h3>
                <p>${esc(plate.role)}${video.duration ? ` · ${esc(video.duration)}` : ""}</p>
              </div>
            </article>
          `
        )
        .join("");
    } else {
      filmSection.hidden = true;
    }
  }

  const workGrid = $("#workGrid");
  if (workGrid) {
    const workTotal = category.plates.length;
    workGrid.classList.toggle("is-even-grid", workTotal > 2 && workTotal % 2 === 0);
    workGrid.innerHTML = category.plates
      .map((plate, index) => {
        const isSite = Boolean(plate.site);
        const cardHref = isSite ? esc(plate.site) : `assets/img/full/${esc(plate.id)}.webp`;
        return `
          <a class="chapter-work${isSite ? " chapter-work--site" : ""}" href="${cardHref}"
             target="_blank" rel="noopener"
             ${isSite ? "" : "data-lightbox"}
             data-title="${esc(plate.title)}"
             data-role="${esc(plate.role)}"
             data-index="${pad(index + 1)} / ${pad(category.plates.length)}"
             aria-label="${isSite ? "访问网站" : "查看大图"}：${esc(plate.title)}，${esc(plate.role)}">
            <figure>
              <span class="chapter-work-photo">
                <img src="assets/img/wide/${esc(plate.id)}.webp"
                     srcset="assets/img/thumb/${esc(plate.id)}.webp 900w, assets/img/wide/${esc(plate.id)}.webp 1800w"
                     sizes="(max-width: 720px) 94vw, 1180px"
                     width="1800" height="636"
                     alt="${esc(plate.title)} — ${esc(plate.role)}"
                     loading="lazy" decoding="async">
                ${isSite ? '<span class="site-badge">访问网站 ↗</span>' : ""}
              </span>
              <figcaption>
                <span class="work-index">${pad(index + 1)} / ${pad(category.plates.length)}</span>
                <span class="work-title"><b>${esc(plate.title)}</b><em>${esc(plate.role)}</em></span>
                <span class="work-open" aria-hidden="true">↗</span>
              </figcaption>
            </figure>
          </a>
        `;
      })
      .join("");
  }

  const siteSection = $("#siteLinks");
  const siteGrid = $("#siteLinkGrid");
  if (siteSection && siteGrid) {
    const sites = category.plates.filter((plate) => plate.site);
    if (sites.length) {
      siteSection.hidden = false;
      set("#siteCount", `${pad(sites.length)} SITES`);
      siteGrid.innerHTML = sites
        .map((plate, index) => {
          let displayUrl = plate.site;
          try {
            const parsed = new URL(plate.site);
            displayUrl = `${parsed.host}${parsed.pathname.replace(/\/$/, "")}`;
          } catch (error) {
            displayUrl = plate.site;
          }
          return `
            <a class="site-experience-card" href="${esc(plate.site)}" target="_blank" rel="noopener"
               aria-label="打开 ${esc(plate.title)}：${esc(displayUrl)}">
              <span class="site-experience-index">${pad(index + 1)}</span>
              <span class="site-experience-body">
                <span class="site-experience-kicker">LIVE WEBSITE / 线上体验</span>
                <strong>${esc(plate.title)}</strong>
                <em>${esc(plate.role)}</em>
                <span class="site-experience-url">${esc(displayUrl)}</span>
              </span>
              <span class="site-experience-arrow">打开 ↗</span>
            </a>
          `;
        })
        .join("");
    } else {
      siteSection.hidden = true;
    }
  }

  const prev = categories[(categoryIndex - 1 + categories.length) % categories.length];
  const next = categories[(categoryIndex + 1) % categories.length];
  const prevLink = $("#prevChapter");
  const nextLink = $("#nextChapter");
  if (prevLink) {
    prevLink.href = `chapter.html?c=${prev.id}`;
    const label = prevLink.querySelector("strong");
    if (label) label.textContent = prev.title;
  }
  if (nextLink) {
    nextLink.href = `chapter.html?c=${next.id}`;
    const label = nextLink.querySelector("strong");
    if (label) label.textContent = next.title;
  }

  const lightbox = $("#chapterLightbox");
  const lightboxImage = $("#chapterLightboxImage");
  const lightboxClose = $("#chapterLightboxClose");
  const lightboxIndex = $("#chapterLightboxIndex");
  const lightboxTitle = $("#chapterLightboxTitle");
  let lastTrigger = null;
  let lightboxZoom = 1;

  const setLightboxZoom = (next) => {
    if (!lightbox || !lightboxImage) return;
    const target = next < 1.02 ? 1 : next;
    lightboxZoom = Math.min(3.5, Math.max(1, target));
    lightboxImage.style.transform = `scale(${lightboxZoom})`;
    lightbox.classList.toggle("is-zoomed", lightboxZoom > 1.01);
  };

  const resetLightboxZoom = () => {
    lightboxZoom = 1;
    if (lightboxImage) {
      lightboxImage.style.transform = "";
      lightboxImage.style.transformOrigin = "center center";
    }
    lightbox?.classList.remove("is-zoomed");
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lightboxImage) lightboxImage.src = "";
    resetLightboxZoom();
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  };

  const openLightbox = (link) => {
    if (!lightbox || !lightboxImage) return;
    const image = link.querySelector("img");
    const narrow = window.matchMedia("(max-width: 720px)").matches;
    lightboxImage.src = narrow ? link.href.replace("/full/", "/wide/") : link.href;
    lightboxImage.alt = image ? image.alt : "";
    if (lightboxIndex) lightboxIndex.textContent = link.dataset.index || "";
    if (lightboxTitle) {
      lightboxTitle.textContent = `${link.dataset.title || ""} — ${link.dataset.role || ""}`;
    }
    lastTrigger = link;
    resetLightboxZoom();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightboxClose?.focus({ preventScroll: true });
  };

  if (workGrid && lightbox) {
    workGrid.addEventListener("click", (event) => {
      const link = event.target.closest("[data-lightbox]");
      if (!link) return;
      event.preventDefault();
      openLightbox(link);
    });
  }

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightbox?.addEventListener("wheel", (event) => {
    if (!lightbox || lightbox.hidden || !lightboxImage) return;
    event.preventDefault();

    const rect = lightboxImage.getBoundingClientRect();
    if (rect.width && rect.height) {
      const originX = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      const originY = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
      lightboxImage.style.transformOrigin = `${originX}% ${originY}%`;
    }

    setLightboxZoom(lightboxZoom * (event.deltaY < 0 ? 1.14 : 0.88));
  }, { passive: false });

  lightboxImage?.addEventListener("dblclick", () => {
    setLightboxZoom(lightboxZoom > 1.01 ? 1 : 2);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (coarsePointer) {
    const interactive = "a, button, [role='button'], .chapter-work, .site-experience-card, .chapter-pager-link";
    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType && event.pointerType !== "touch") return;
      const target = event.target.closest(interactive);
      if (!target) return;

      if (typeof navigator.vibrate === "function") navigator.vibrate(12);

      const ring = document.createElement("span");
      ring.className = "tap-ring";
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    }, { passive: true });
  }
})();
