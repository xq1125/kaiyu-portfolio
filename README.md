# 郑铠妤 KAIYU — Paper Portfolio

Live site: **https://xq1125.github.io/kaiyu-portfolio/**

A hand-built, dependency-free portfolio for game visual, AIGC film, UI/UX, 3D, IP and personal experiments. The art direction is a quiet Chinese editorial spread: warm paper, oversized Songti, vermilion accents, generous white space and full-bleed work plates. No dark-neon template, no external fonts, no tracking.

**32 pieces · 6 chapters · 12 films · 1 fragment game.**

## Run locally

```bash
python -m http.server 4180
```

Open <http://localhost:4180>.

Or double-click `index.html`; every asset uses a relative path. A local server is recommended for the cleanest experience.

## Structure

```text
index.html                 Page shell and static copy
assets/css/style.css       Editorial styling and responsive layout
assets/js/data.js          Categories, plate captions, film sources, facts, contact data
assets/js/main.js          Chapter reader, fragment game, lightbox, film mode, menus, copy, clocks
assets/img/thumb/          900px WebP plates (mobile / card thumbnails)
assets/img/wide/           1800px WebP plates (desktop grid + srcset)
assets/img/full/           1800–2800px WebP plates (lightbox)
assets/img/covers/         Hero and chapter-cover crops
assets/img/video/          Video poster frames
assets/img/about/          Privacy-safe illustrated portrait
assets/img/loader-cover.webp  Recoloured 0-1 cover for the opening screen
assets/img/og-cover.jpg    1200 × 630 social card
assets/video/              Compressed H.264 films (faststart)
```

## Interactions

- **Opening spread** — one large IP artwork against a quiet editorial hero, with a short statement and a single link into the work.
- **One-page catalogue** — six compact rows in two columns; no stacked chapter sections and no page-length growth. Hovering a row flips its small cover to a second plate and draws a vermilion rule.
- **Chapter reader** — clicking a catalogue row opens one chapter at a time in a compact overlay that reveals like a paper curtain: three-column work grid, chapter note, previous/next chapter, `Esc` or backdrop to close.
- **Artist card** — the about portrait is a deliberate flip card: front is the drawn portrait, back is a short statement on ink-black stock. Click to turn it over; the state is exposed with `aria-pressed`.
- **Opening reveal** — the hero headline masks up once the loader clears. A single transition, not a sequence of effects.
- **Work sheets** — hover-lift plates open a paper lightbox with prev/next, zoom (`+` / `−` / `0`), drag-to-pan and arrow-key navigation.
- **Film mode** — plates with a film show a small `▶ FILM` badge. In the lightbox, `▶ 看影像` swaps the still for a native HTML5 player; `非遗系列短片` has a two-film chip switch (剪纸 / 打铁花). Videos are compressed H.264 MP4 with separate poster frames.
- **Fragment game** — “这是哪一章的碎片？” A five-round game built from real close-ups of the 32 plates. Guess the chapter, reveal the full work, then open it directly in the lightbox. It opens from a small “猜碎片” tab in the header into a compact paper popup, not a page section.
- **Contact postcard** — click the email to copy it, or use the mailto link.
- **Small things** — custom red cursor labels, live Hangzhou clock, scroll reveals, mobile paper menu, keyboard focus states.
- **Keyboard** — `←` `→` flip lightbox; `Esc` close; `+` `−` `0` zoom the lightbox. In film mode, the native player handles seeking and volume.

## GitHub Pages

1. Push the repository root to `main`.
2. In **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://xq1125.github.io/kaiyu-portfolio/`.

`.nojekyll` is included so GitHub Pages serves the files as-is.

## Video map

The twelve films from the Feishu `视频作品集` are placed as follows:

| Feishu position | Site plate | Local film |
| --- | --- | --- |
| 游戏设计 / unity游戏demo | 01 · 深渊恶魔：狱界破笼 | `unity-demo.mp4` |
| 游戏设计 / 游戏特效视频 | 01 · 游戏视觉企划 | `game-vfx.mp4` |
| AIGC / 山海 · 一念 | 02 · 山海 · 一念 | `shanhai.mp4` |
| AIGC / 未发送 | 02 · 未发送 | `weifasong.mp4` |
| AIGC / 非遗剪纸 | 02 · 非遗系列短片 | `jianzhi.mp4` |
| AIGC / 非遗打铁花 | 02 · 非遗系列短片 | `datiehua.mp4` |
| AIGC / ai漫剧 | 02 · AI 漫剧 | `aimanju.mp4` |
| UI&UX / 交互部分展示 | 03 · 星承 HRM SaaS | `uiux-demo.mp4` |
| 3D建模 / 视频1 | 04 · 3D 课堂练习 | `three-d.mp4` |
| 动画研讨会 / 动画作品集 | 06 · 动画研讨会 | `animation-reel.mp4` |
| AE动效视频 / 二十四节气 | 06 · 二十四节气 | `solar-terms.mp4` |
| TouchDesigner / 交互设计衍生 | 06 · TouchDesigner 交互衍生 | `touchdesigner.mp4` |

The Feishu `开始动画（东方纹章录）` entry is the same 224 MB `unity游戏demo.mp4` as the demo entry, so it is represented once rather than uploading a duplicate file.

To add another film, put a compressed MP4 in `assets/video/`, add a poster in `assets/img/video/`, then add a `videos` array to the relevant plate in `assets/js/data.js`:

```js
videos: [
  { label: "正片", src: "assets/video/example.mp4", poster: "assets/img/video/example.webp", duration: "1:20" }
]
```

## Notes

- Plates were optimized from the supplied 7073 × 2500 portfolio boards.
- The opening cover reuses the **0-1** cover composition, recoloured into the paper palette. The right-hand contact block is cropped out so phone / QQ / WeChat are never published.
- No third-party JavaScript, build step, external font, analytics or cookies.
- Public contact card uses the email only; the full profile board with phone/QQ is intentionally not published.
- Edit portfolio copy in `assets/js/data.js`; edit the page-level manifesto and postcard copy in `index.html`.
