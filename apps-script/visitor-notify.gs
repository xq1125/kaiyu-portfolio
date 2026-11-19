/* KAIYU.OS 95 — sends one email when a visitor opens the site.
   Deploy this file as a Google Apps Script Web App:
   1. script.google.com → New project
   2. Paste this file, set NOTIFY_TO
   3. Deploy → New deployment → Web app
      Execute as: Me
      Who has access: Anyone
   4. Copy the /exec URL into assets/js/visitor-notify.js
*/

const NOTIFY_TO = "13554191868@163.com";
const TOKEN = "kaiyu-95-visit-2026";

function doPost(e) {
  try {
    const raw = (e.postData && e.postData.contents) || "{}";
    const data = JSON.parse(raw);
    if (String(data.token || "") !== TOKEN) return json({ ok: false, error: "bad token" });

    const session = String(data.session || "").slice(0, 80);
    if (!session) return json({ ok: false, error: "missing session" });

    const cache = CacheService.getScriptCache();
    const key = `visit_${session}`;
    if (cache.get(key)) return json({ ok: true, skipped: true });
    cache.put(key, "1", 21600);

    const now = new Date();
    const when = Utilities.formatDate(now, "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
    const clean = (value, fallback) =>
      String(value || fallback).replace(/[\r\n]+/g, " ").slice(0, 300);

    const subject = `[KAIYU.OS 95] 有人打开了作品集 · ${when}`;
    const body = [
      "有人打开了 KAIYU.OS 95 作品集。",
      "",
      `时间：${when}（Asia/Shanghai）`,
      `页面：${clean(data.page, "unknown")}`,
      `来源：${clean(data.referrer, "direct")}`,
      `语言：${clean(data.lang, "unknown")}`,
      `屏幕：${clean(data.screen, "unknown")}`,
      `时区：${clean(data.tz, "unknown")}`,
      `会话：${session}`,
      "",
      "这是一封自动通知，只记录页面、来源、时间与设备尺寸，不记录 IP。"
    ].join("\n");

    MailApp.sendEmail(NOTIFY_TO, subject, body);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json({ ok: true, app: "kaiyu-visitor-notify" });
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON
  );
}
