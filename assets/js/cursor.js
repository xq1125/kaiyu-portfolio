(() => {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (!finePointer) return;

  const cursor = document.getElementById("chapterCursor");
  if (!cursor) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("chapter-cursor-ready");

  let visible = false;

  const setPosition = (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  };

  const show = () => {
    if (visible) return;
    visible = true;
    cursor.classList.add("is-visible");
  };

  const hide = () => {
    visible = false;
    cursor.classList.remove("is-visible", "is-hover", "is-pressing");
  };

  const burst = (event) => {
    if (reducedMotion) return;
    const ripple = document.createElement("span");
    ripple.className = "chapter-cursor-burst";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);

    const remove = () => ripple.remove();
    ripple.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, 700);
  };

  cursor.style.transform = `translate3d(${window.innerWidth / 2}px, ${window.innerHeight / 2}px, 0)`;
  show();

  window.addEventListener(
    "pointermove",
    (event) => {
      setPosition(event);
      show();
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(
        "a, button, [data-cursor], .chapter-work, .film-card, .chapter-pager"
      );
      cursor.classList.toggle("is-hover", Boolean(interactive));
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      setPosition(event);
      cursor.classList.add("is-pressing");
      burst(event);
    },
    { passive: true }
  );

  document.addEventListener("pointerup", () => cursor.classList.remove("is-pressing"));
  document.addEventListener("pointercancel", () => cursor.classList.remove("is-pressing"));
  document.addEventListener("pointerleave", hide);
  window.addEventListener("blur", hide);
})();
