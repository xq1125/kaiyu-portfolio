/* KAIYU.OS 95 — one original chiptune loop and tiny UI sounds.
   No third-party audio, no autoplay before a real gesture. */
(() => {
  "use strict";

  const BGM_SRC = "assets/audio/os95-theme.mp3";
  const STORE = "kaiyu-os95-sound";
  const POSITION = "kaiyu-os95-time";
  const ACTIVE = "kaiyu-os95-active";
  const SFX = {
    click: { src: "assets/audio/ui-click.wav", volume: 0.26 },
    hover: { src: "assets/audio/ui-hover.wav", volume: 0.10 },
    open: { src: "assets/audio/ui-open.wav", volume: 0.24 },
    close: { src: "assets/audio/ui-close.wav", volume: 0.22 },
    boot: { src: "assets/audio/boot.wav", volume: 0.30 },
    copy: { src: "assets/audio/ui-copy.wav", volume: 0.24 },
    error: { src: "assets/audio/ui-error.wav", volume: 0.22 },
  };

  let enabled = true;
  try {
    enabled = localStorage.getItem(STORE) !== "off";
  } catch (_) {
    enabled = true;
  }

  const bgm = new Audio(BGM_SRC);
  bgm.id = "kaiyuBgm";
  bgm.loop = true;
  bgm.preload = "none";
  bgm.volume = 0;
  bgm.hidden = true;
  bgm.setAttribute("playsinline", "");

  let started = false;
  let bootPlayed = false;
  let waiting = false;
  let resumed = false;
  let ducked = false;
  let lastHover = 0;
  let lastToast = "";
  let fadeTimer = 0;
  let saveTimer = 0;
  let button = null;

  const isNarrow = () => window.matchMedia("(max-width: 600px)").matches;
  const baseVolume = () => (isNarrow() ? 0.18 : 0.22);
  const targetVolume = () => (enabled && !ducked ? baseVolume() : 0);

  const readNumber = (key) => {
    try {
      return parseFloat(sessionStorage.getItem(key) || "0") || 0;
    } catch (_) {
      return 0;
    }
  };
  const readFlag = (key) => {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch (_) {
      return false;
    }
  };
  const write = (key, value) => {
    try {
      sessionStorage.setItem(key, String(value));
    } catch (_) {}
  };

  const fadeTo = (target, duration = 500) => {
    window.clearInterval(fadeTimer);
    const from = Number.isFinite(bgm.volume) ? bgm.volume : 0;
    const startedAt = performance.now();
    if (Math.abs(from - target) < 0.01) {
      bgm.volume = target;
      return;
    }
    fadeTimer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - startedAt) / duration);
      bgm.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (t >= 1) window.clearInterval(fadeTimer);
    }, 32);
  };

  const updateButton = () => {
    if (!button) return;
    button.classList.toggle("is-muted", !enabled);
    button.classList.toggle("is-waiting", enabled && !started);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute(
      "aria-label",
      enabled ? (started ? "关闭背景音乐" : "开启背景音乐") : "开启背景音乐"
    );
    button.title = enabled
      ? started
        ? "BGM ON / 点击静音"
        : "点击开启 BGM"
      : "BGM OFF / 点击开启";
  };

  const savePosition = () => {
    if (!started || !Number.isFinite(bgm.currentTime) || bgm.currentTime <= 0) return;
    write(POSITION, bgm.currentTime.toFixed(2));
  };

  const restorePosition = () => {
    if (resumed || !Number.isFinite(bgm.duration) || bgm.duration <= 0) return;
    const saved = readNumber(POSITION);
    if (saved > 0 && saved < bgm.duration - 1) {
      try {
        bgm.currentTime = saved % bgm.duration;
      } catch (_) {
        return;
      }
    }
    resumed = true;
  };

  const armGesture = () => {
    if (waiting) return;
    waiting = true;
    updateButton();

    const unlock = () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      waiting = false;
      updateButton();
      tryPlay(true);
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    window.setTimeout(() => {
      /* A timer is not a gesture, but it lets a resumed tab try again later. */
      if (waiting && !document.hidden) updateButton();
    }, 2500);
  };

  const tryPlay = (fromGesture = false) => {
    if (!enabled) return;
    if (!bgm.paused) {
      started = true;
      updateButton();
      return;
    }
    bgm.volume = 0;
    const promise = bgm.play();
    if (promise && typeof promise.then === "function") {
      promise
        .then(() => {
          if (!enabled) {
            bgm.pause();
            bgm.volume = 0;
            updateButton();
            return;
          }
          started = true;
          waiting = false;
          write(ACTIVE, 1);
          fadeTo(targetVolume(), 700);
          updateButton();
        })
        .catch(() => {
          armGesture();
          updateButton();
        });
    } else {
      started = true;
      fadeTo(targetVolume(), 700);
      updateButton();
    }
  };

  const playSfx = (name, volume) => {
    if (!enabled) return;
    const item = SFX[name];
    if (!item) return;
    const audio = new Audio(item.src);
    audio.preload = "auto";
    audio.volume = volume == null ? item.volume : volume;
    const result = audio.play();
    if (result && typeof result.catch === "function") result.catch(() => {});
  };

  const setDucked = () => {
    const playing = Array.from(document.querySelectorAll("video")).some(
      (video) => !video.paused && !video.ended
    );
    if (playing === ducked) return;
    ducked = playing;
    if (started && enabled) fadeTo(targetVolume(), 280);
  };

  const installButton = () => {
    const tray = document.querySelector(".px-taskbar .px-tray");
    if (!tray) {
      window.setTimeout(installButton, 80);
      return;
    }
    if (tray.querySelector(".px-sound")) {
      button = tray.querySelector(".px-sound");
      updateButton();
      return;
    }
    button = document.createElement("button");
    button.type = "button";
    button.className = "px-sound";
    button.textContent = "♪";
    button.setAttribute("aria-pressed", "true");
    tray.insertBefore(button, tray.firstChild);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (enabled && !started) {
        playSfx("click", 0.24);
        tryPlay(true);
        updateButton();
        return;
      }
      enabled = !enabled;
      try {
        localStorage.setItem(STORE, enabled ? "on" : "off");
      } catch (_) {}
      if (enabled) {
        playSfx("click", 0.24);
        tryPlay(true);
      } else {
        playSfx("close", 0.20);
        window.clearInterval(fadeTimer);
        bgm.pause();
        bgm.volume = 0;
        write(ACTIVE, 0);
        savePosition();
      }
      updateButton();
    });
    updateButton();
    if (enabled) {
      const shouldResume = readFlag(ACTIVE);
      if (shouldResume) tryPlay(false);
      else armGesture();
    }
  };

  const installEvents = () => {
    document.addEventListener("kaiyu:ui", (event) => {
      const sound = event.detail && event.detail.sound;
      if (sound === "open") playSfx("open", 0.22);
      else if (sound === "close") playSfx("close", 0.20);
    });

    const toast = document.querySelector("#toast");
    if (toast) {
      new MutationObserver(() => {
        const text = toast.textContent.trim();
        if (!text || text === lastToast) return;
        lastToast = text;
        if (/已复制|已拷贝|copied/i.test(text)) playSfx("copy", 0.24);
        else if (/失败|error|未复制/i.test(text)) playSfx("error", 0.20);
      }).observe(toast, { childList: true, characterData: true, subtree: true });
    }

    document.addEventListener(
      "click",
      (event) => {
        const target = event.target.closest(
          "a, button, [role='button'], .hero-cell, .catalogue-card, .chapter-work, .site-experience-card, .resume-card"
        );
        if (!target) return;
        if (target.closest(".px-sound")) return;

        if (target.closest("#loaderEnter, #loader")) {
          if (enabled && !started) tryPlay(true);
          if (!bootPlayed) {
            bootPlayed = true;
            window.setTimeout(() => playSfx("boot", 0.30), 60);
          }
          return;
        }

        if (target.closest(".menu-toggle, .menu-close")) {
          const overlay = document.querySelector("#menuOverlay");
          const opening =
            target.classList.contains("menu-toggle") && overlay && !overlay.classList.contains("is-open");
          playSfx(opening ? "open" : "close", opening ? 0.22 : 0.20);
          return;
        }

        if (
          target.closest(
            ".resume-card, .game-tab, .chapter-work[data-lightbox], [data-chapter-open], .catalogue-card"
          )
        ) {
          playSfx("open", 0.22);
          return;
        }

        if (
          target.closest(
            ".resume-sheet-close, .game-close, .reader-close, .lightbox-close, .chapter-lightbox-close"
          )
        ) {
          playSfx("close", 0.20);
          return;
        }

        playSfx("click", 0.24);
      },
      true
    );

    document.addEventListener(
      "pointerover",
      (event) => {
        if (event.pointerType && event.pointerType !== "mouse") return;
        if (!window.matchMedia("(hover: hover)").matches) return;
        const target = event.target.closest("a, button, [role='button']");
        if (!target || target.closest(".px-sound")) return;
        if (event.relatedTarget && target.contains(event.relatedTarget)) return;
        const now = performance.now();
        if (now - lastHover < 65) return;
        lastHover = now;
        playSfx("hover", 0.08);
      },
      true
    );

    document.addEventListener(
      "play",
      (event) => {
        if (event.target && event.target.tagName === "VIDEO") setDucked();
      },
      true
    );
    document.addEventListener(
      "pause",
      (event) => {
        if (event.target && event.target.tagName === "VIDEO") setDucked();
      },
      true
    );
    document.addEventListener(
      "ended",
      (event) => {
        if (event.target && event.target.tagName === "VIDEO") setDucked();
      },
      true
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        savePosition();
        if (!bgm.paused) {
          bgm.pause();
          write(ACTIVE, 1);
        }
      } else if (enabled && readFlag(ACTIVE)) {
        tryPlay(false);
      }
    });

    window.addEventListener("pagehide", savePosition);

    bgm.addEventListener("loadedmetadata", restorePosition);
    bgm.addEventListener("canplay", restorePosition);
    bgm.addEventListener("timeupdate", () => {
      if (performance.now() - saveTimer < 2200) return;
      saveTimer = performance.now();
      savePosition();
    });
    bgm.addEventListener("play", () => {
      started = true;
      waiting = false;
      updateButton();
    });
    bgm.addEventListener("pause", updateButton);
  };

  const start = () => {
    if (!bgm.isConnected) document.body.appendChild(bgm);
    installEvents();
    installButton();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
