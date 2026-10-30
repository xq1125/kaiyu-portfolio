/* Pixel desktop shell: wraps the main page blocks in OS windows and adds a taskbar. */
(() => {
  "use strict";

  const boot = () => {
    const isChapter = document.body.classList.contains("work-page");

    document.querySelectorAll(".px-window").forEach((section) => {
      if (section.closest(".px-frame")) return;
      const frame = document.createElement("div");
      frame.className = "px-frame";
      if (section.classList.contains("contact-section")) frame.classList.add("px-frame--contact");
      if (section.classList.contains("hero")) frame.classList.add("px-frame--hero");
      const titlebar = document.createElement("div");
      titlebar.className = "px-titlebar";
      titlebar.innerHTML = `
        <span class="px-title"><i class="px-title-mark" aria-hidden="true">▣</i>${section.dataset.pxTitle || "KAIYU.EXE"}</span>
        <span class="px-controls" aria-hidden="true"><b>_</b><b>□</b><b>×</b></span>
      `;
      const statusbar = document.createElement("div");
      statusbar.className = "px-windowbar";
      statusbar.innerHTML = `<span>${isChapter ? "C:\\KAIYU\\CHAPTERS" : "C:\\KAIYU\\PORTFOLIO"}</span><span>READY</span>`;
      section.parentNode.insertBefore(frame, section);
      frame.appendChild(titlebar);
      frame.appendChild(section);
      frame.appendChild(statusbar);
      frame.hidden = section.hidden;
      new MutationObserver(() => {
        frame.hidden = section.hidden;
      }).observe(section, { attributes: true, attributeFilter: ["hidden"] });
    });

    if (!document.querySelector(".px-taskbar")) {
      const taskbar = document.createElement("div");
      taskbar.className = "px-taskbar";
      taskbar.setAttribute("aria-label", "桌面任务栏");
      taskbar.innerHTML = `
        <a class="px-start" href="${isChapter ? "index.html" : "#top"}">
          <span class="px-start-flag" aria-hidden="true">▣</span><b>KAIYU</b><em>95</em>
        </a>
        <div class="px-tasklist">
          <a class="px-task is-active" href="${isChapter ? "#top" : "#top"}"><span aria-hidden="true">▤</span>${isChapter ? "CHAPTER.EXE" : "KAIYU.EXE"}</a>
          <a class="px-task" href="${isChapter ? "index.html#works" : "#works"}"><span aria-hidden="true">▥</span>${isChapter ? "目录" : "作品"}</a>
          <a class="px-task" href="${isChapter ? "index.html#about" : "#about"}"><span aria-hidden="true">▦</span>${isChapter ? "关于" : "关于"}</a>
          <a class="px-task" href="${isChapter ? "index.html#contact" : "#contact"}"><span aria-hidden="true">▧</span>${isChapter ? "联系" : "联系"}</a>
        </div>
        <div class="px-tray"><span class="px-tray-net" aria-hidden="true">▮▮</span><span data-px-clock>--:--</span></div>
      `;
      document.body.appendChild(taskbar);
    }

    const tick = () => {
      const value = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      document.querySelectorAll("[data-px-clock]").forEach((node) => {
        node.textContent = value;
      });
    };
    tick();
    window.setInterval(tick, 20000);

    document.body.classList.add("px-ready");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
