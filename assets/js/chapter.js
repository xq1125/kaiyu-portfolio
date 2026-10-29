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
  set("#chapterNoteTitle", category.noteTitle);
  set("#chapterNote", category.note);

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
      .map(
        (plate, index) => `
          <a class="chapter-work" href="assets/img/full/${esc(plate.id)}.webp"
             target="_blank" rel="noopener"
             data-lightbox
             data-title="${esc(plate.title)}"
             data-role="${esc(plate.role)}"
             data-index="${pad(index + 1)} / ${pad(category.plates.length)}"
             aria-label="查看大图：${esc(plate.title)}，${esc(plate.role)}">
            <figure>
              <span class="chapter-work-photo">
                <img src="assets/img/wide/${esc(plate.id)}.webp"
                     srcset="assets/img/thumb/${esc(plate.id)}.webp 900w, assets/img/wide/${esc(plate.id)}.webp 1800w"
                     sizes="(max-width: 720px) 94vw, 1180px"
                     width="1800" height="636"
                     alt="${esc(plate.title)} — ${esc(plate.role)}"
                     loading="lazy" decoding="async">
              </span>
              <figcaption>
                <span class="work-index">${pad(index + 1)} / ${pad(category.plates.length)}</span>
                <span class="work-title"><b>${esc(plate.title)}</b><em>${esc(plate.role)}</em></span>
                <span class="work-open" aria-hidden="true">↗</span>
              </figcaption>
            </figure>
          </a>
        `
      )
      .join("");
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

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lightboxImage) lightboxImage.src = "";
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  };

  const openLightbox = (link) => {
    if (!lightbox || !lightboxImage) return;
    const image = link.querySelector("img");
    lightboxImage.src = link.href;
    lightboxImage.alt = image ? image.alt : "";
    if (lightboxIndex) lightboxIndex.textContent = link.dataset.index || "";
    if (lightboxTitle) {
      lightboxTitle.textContent = `${link.dataset.title || ""} — ${link.dataset.role || ""}`;
    }
    lastTrigger = link;
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
})();
