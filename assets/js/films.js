/* All films — one visible index of the twelve video works. */
(() => {
  "use strict";

  const DATA = window.PORTFOLIO;
  if (!DATA) return;

  const pad = (value) => String(value).padStart(2, "0");
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const list = document.getElementById("filmsList");
  if (!list) return;

  const films = [];
  DATA.categories.forEach((category) => {
    category.plates.forEach((plate) => {
      (plate.videos || []).forEach((video) => {
        films.push({ category, plate, video });
      });
    });
  });

  list.innerHTML = films
    .map(
      ({ category, plate, video }, index) => `
        <article class="films-entry">
          <div class="film-frame">
            <video controls playsinline preload="metadata" poster="${esc(video.poster)}"
                   aria-label="${esc(plate.title)} ${esc(video.label)}">
              <source src="${esc(video.src)}" type="video/mp4">
              你的浏览器不支持 HTML5 视频。
            </video>
          </div>
          <div class="films-entry-meta">
            <div class="films-entry-top">
              <span class="film-label">FILM ${pad(index + 1)} / ${pad(films.length)}</span>
              <span class="films-entry-chapter">${esc(category.num)} / ${esc(category.en)}</span>
            </div>
            <h2>${esc(plate.title)} <small>${esc(video.label)}</small></h2>
            <p>${esc(plate.role)}${video.duration ? ` · ${esc(video.duration)}` : ""}</p>
            <a class="films-entry-link" href="chapter.html?c=${esc(category.id)}">进入本章 ↗</a>
          </div>
        </article>
      `
    )
    .join("");
})();
