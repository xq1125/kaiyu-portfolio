# 郑铠妤 KAIYU — Paper Portfolio

Live site: **https://xq1125.github.io/kaiyu-portfolio/**

A hand-built, dependency-free portfolio for game visual, AIGC film, UI/UX, 3D, IP and personal experiments. The art direction is a paper scrapbook: warm stock, vermilion seals, torn tape, handwritten notes and a little Chinese editorial typography. No dark-neon template, no external fonts, no tracking.

**30 pieces · 6 chapters · 1 fragment game.**

## Run locally

```bash
python -m http.server 4180
```

Open <http://localhost:4180>.

Or double-click `index.html`; every asset uses a relative path. A local server is recommended for the cleanest experience.

## Structure

```text
index.html                 Page shell and static copy
assets/css/style.css       Paper-collage styling and responsive layout
assets/js/data.js          Categories, plate captions, facts, contact data
assets/js/main.js          Collage, fragment game, lightbox, menus, copy, clocks
assets/img/thumb/          900px WebP plates (mobile / card thumbnails)
assets/img/wide/           1800px WebP plates (desktop grid + srcset)
assets/img/full/           2800px WebP plates (lightbox)
assets/img/covers/         Hero and chapter-cover crops
assets/img/about/          Privacy-safe illustrated portrait
assets/img/og-cover.jpg    1200 × 630 social card
```

## Interactions

- **Paper collage** — drag the four hero cards, or press `S` / “把桌子弄乱” to shuffle the desk.
- **Chapter index** — six tilted paper cards that open the six chapters, with a hand-drawn active section tab.
- **Work sheets** — hover-lift plates open a paper lightbox with prev/next, zoom (`+` / `−` / `0`), drag-to-pan and arrow-key navigation.
- **Fragment game** — “这是哪一章的碎片？” A five-round game built from real close-ups of the 30 plates. Guess the chapter, reveal the full work, then open it directly in the lightbox. It lives inside the index, as a small paper invitation — not a separate section.
- **Contact postcard** — click the email to copy it, or use the mailto link.
- **Small things** — custom red cursor labels, live Hangzhou clock, scroll reveals, mobile paper menu, keyboard focus states.
- **Keyboard** — `S` shuffle; `←` `→` flip lightbox; `Esc` close; `+` `−` `0` zoom the lightbox.

## GitHub Pages

1. Push the repository root to `main`.
2. In **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://xq1125.github.io/kaiyu-portfolio/`.

`.nojekyll` is included so GitHub Pages serves the files as-is.

## Adding video

The current site is stills-only. When video files are ready:

1. Add MP4/WebM files under `assets/video/`.
2. Add a `video` field to a plate in `assets/js/data.js`.
3. Extend `updateLightboxImage()` in `assets/js/main.js` to swap the `<img>` for a `<video controls playsinline>` when that field exists.

The AIGC chapter — `山海 · 一念`, `未发送`, the intangible-cultural-heritage series — is the natural home for a video reel, with the existing stills as posters.

## Notes

- Plates were optimized from the supplied 7073 × 2500 portfolio boards.
- No third-party JavaScript, build step, external font, analytics or cookies.
- Public contact card uses the email only; the full profile board with phone/QQ is intentionally not published.
- Edit portfolio copy in `assets/js/data.js`; edit the page-level manifesto and postcard copy in `index.html`.
