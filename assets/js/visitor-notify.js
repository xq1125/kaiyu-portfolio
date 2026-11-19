/* KAIYU.OS 95 — optional visit notification.
   Paste the deployed Google Apps Script Web App URL below.
   It must look like https://script.google.com/macros/s/.../exec */
window.KAIYU_NOTIFY_URL = "https://script.google.com/macros/s/AKfycbx26uI8MHa51xn3vr-eMDSpyR2tjMJ8l-iK3J-yqoWLOdUUuSmXGcoiCr1DnOa-0o4PgA/exec";
window.KAIYU_NOTIFY_TOKEN = "kaiyu-95-visit-2026";

(() => {
  "use strict";

  const endpoint = window.KAIYU_NOTIFY_URL;
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\//.test(endpoint)) return;

  const readSession = () => {
    try {
      let id = sessionStorage.getItem("kaiyu-notify-session");
      if (!id) {
        id =
          window.crypto && typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem("kaiyu-notify-session", id);
      }
      return id;
    } catch (error) {
      return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };

  try {
    if (sessionStorage.getItem("kaiyu-notify-sent") === "1") return;
    sessionStorage.setItem("kaiyu-notify-sent", "1");
  } catch (error) {
    /* private mode may reject storage; still allow one send */
  }

  const payload = {
    token: window.KAIYU_NOTIFY_TOKEN,
    session: readSession(),
    page: window.location.href,
    referrer: document.referrer || "direct",
    lang: navigator.language || "unknown",
    screen: `${window.screen.width}x${window.screen.height}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown"
  };

  const send = () => {
    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {
      /* notification is best-effort */
    });
  };

  if (document.readyState === "complete") window.setTimeout(send, 350);
  else window.addEventListener("load", () => window.setTimeout(send, 350), { once: true });
})();

