# 郑铠妤 KAIYU — Nocturne Portfolio

Live site: **https://xq1125.github.io/kaiyu-portfolio/**

A hand-built, dependency-free portfolio for game visual, AIGC film, UI/UX, 3D, IP and personal experiments. The art direction is a black-and-deep-red private view: near-black rooms, bone Songti, vermilion accents, a matted game key-art print and full-bleed work sheets. No dark-neon template, no external fonts, no tracking.

**32 pieces · 6 chapters · 12 films · 1 fragment game.**

## Run locally

```bash
python -m http.server 4180
```

Open <http://localhost:4180>.

Or double-click `index.html`; every asset uses a relative path. A local server is recommended for the cleanest experience.

## Structure

```text
index.html                 Homepage: hero, one-page catalogue, about, contact
chapter.html               Chapter detail page: every plate first, then inline films
assets/css/style.css       Gallery styling and responsive layout
assets/js/data.js          Categories, plate captions, film sources, facts, contact data
assets/js/main.js          Homepage catalogue, fragment game, menu, copy, clocks
assets/js/chapter.js       Chapter renderer, native video cards, full-image lightbox
assets/img/thumb/          900px WebP plates (mobile / card thumbnails)
assets/img/wide/           1800px WebP plates (chapter grids + srcset)
assets/img/full/           1800–2800px WebP plates (chapter lightbox)
assets/img/covers/         Hero and chapter-cover crops
assets/img/video/          Video poster frames
assets/img/about/          Illustrated portrait and its transparent cutout
assets/img/loader-cover.webp  Duotone 0-1 cover for the opening screen
assets/img/og-cover.jpg    1200 × 630 social card
assets/resume/resume.pdf    Public CV opened from the about section
assets/video/              Compressed H.264 films (faststart)
```

## Interactions

- **Click gate** — the darkroom loader fills to 100%, then waits. It does not auto-enter: the visitor presses the red **点击进入 / ENTER** button (or clicks anywhere on the ready loader) to reveal the homepage. Keyboard focus lands on the button, and the loader is removed only after that click.
- **Hero poke board** — the hero’s single print is now six numbered red tickets in a dark frame, one for each chapter. The first click on a ticket peels it back to that chapter’s cover; a second click opens the chapter. A counter tracks how many are open, `全部盖上` resets them, and the final state shows all six catalogue covers at once.
- **One-page catalogue** — six wide flip cards in a 3 × 2 grid that still fits one desktop screen. At rest the cards show their backs: chapter number, title, counts and a ghosted English label. Hovering or keyboard-focusing one card flips only that card to its cover; touch screens show the covers directly. Each card states its film count and links to its chapter.
- **Chapter pages** — every catalogue row and every hero ticket open `chapter.html?c=…`. A chapter shows every plate at full width / two columns first, then its films as native HTML5 players, with previous/next chapter links. This is where the actual work and all videos live; there is no separate all-films page.
- **Artist card** — the about portrait is a deliberate flip card: the front is a smaller, transparent cutout of the drawn portrait with no paper backing, and the back is a short statement on black. Click to turn it over; the state is exposed with `aria-pressed`.
- **CV folder** — the small red card under the portrait opens the public PDF resume in a new tab; it replaces the old “currently” sticky note.
- **Opening reveal** — the hero headline masks up once the loader clears. A single transition, not a sequence of effects.
- **Work lightbox** — on chapter pages, clicking any plate opens the full-resolution image; `Esc`, the close button or the backdrop closes it. The link still falls back to the image file if JavaScript is unavailable.
- **Fragment game** — “这是哪一章的碎片？” A five-round game built from real close-ups of the 32 plates. Guess the chapter, reveal the full work, then open it directly in the lightbox. It opens from a small “猜碎片” tab in the header into a compact dark popup, not a page section.
- **Contact postcard** — the email is click-to-copy, phone opens the dialer, and QQ / WeChat copy with a toast. The “聊聊合作或实习” link in the about block jumps straight to this contact room.
- **Small things** — custom red cursor labels, live Hangzhou clock, scroll reveals, mobile menu, keyboard focus states.
- **Keyboard** — `Esc` closes the chapter lightbox; native video controls handle playback, seeking and volume.

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
- The opening cover reuses the **0-1** cover composition as a black / deep-red / bone duotone. The right-hand contact block is cropped out so phone / QQ / WeChat are never published.
- The site opens at the top unless a chapter hash is present; old `#contact` links and browser scroll restoration are reset so a fresh visit never lands on the contact section.
- No third-party JavaScript, build step, external font, analytics or cookies.
- The contact postcard publishes only the details the artist chose to share: email, phone, WeChat and QQ. The full profile-board image with other personal fields is intentionally not published.
- Edit portfolio copy in `assets/js/data.js`; edit the page-level manifesto and postcard copy in `index.html`.
