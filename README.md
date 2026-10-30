# 郑铠妤 KAIYU — KAIYU.OS 95

Live site: **https://xq1125.github.io/kaiyu-portfolio/**

A hand-built, dependency-free portfolio for game visual, AIGC film, UI/UX, 3D, IP and personal experiments. The art direction is now **KAIYU.OS 95**: a teal pixel desktop, beige and navy computer windows, a fixed taskbar, dotted dither, CRT scanlines and real 12 px Chinese pixel type. The work itself stays full-bleed inside image-viewer windows, so the old computer frame never gets in the way of the pictures.

**33 pieces · 6 chapters · 14 films · 1 fragment game.**

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
assets/css/pixel.css       KAIYU.OS 95 desktop skin, windows, taskbar, boot screen
assets/js/data.js          Categories, plate captions, film sources, facts, contact data
assets/js/main.js          Homepage catalogue, fragment game, menu, copy, clocks
assets/js/chapter.js       Chapter renderer, native video cards, full-image lightbox
assets/js/pixel.js         Window wrappers, title bars and the fixed taskbar
assets/js/audio.js         Original chiptune loop, UI sounds and taskbar mute
assets/js/cursor.js        Legacy drawn cursor (hidden by the pixel theme on desktop)
assets/fonts/              Self-hosted Fusion Pixel 12 px subset + Press Start 2P
assets/audio/              Original chiptune loop and short UI sound effects
assets/img/thumb/          900px WebP plates (mobile / card thumbnails)
assets/img/wide/           1800px WebP plates (chapter grids + srcset)
assets/img/full/           1800–2800px WebP plates (desktop chapter lightbox)
assets/img/covers/         Hero and chapter-cover crops
assets/img/covers/mobile/  720 px cover crops served to phones
assets/img/video/          Video poster frames
assets/img/about/          Illustrated portrait and its transparent cutout
assets/img/loader-cover.webp  Original opening cover, framed as a CRT on desktop
assets/img/loader-cover-mobile.webp  Portrait crop of the original cover for phones
assets/img/og-cover.jpg    1200 × 630 social card
assets/resume/resume.webp   Public CV image opened from the about section
assets/video/              Compressed H.264 films (faststart)
```

## Interactions

- **Boot gate** — the opening screen is the original portfolio cover displayed inside a beige CRT monitor: navy status strip, black screen with scanlines, power LED and a pixel chin. Desktop shows the full 2000 × 1162 cover; phones show a portrait crop of the same artwork so the type stays readable. A segmented progress bar and the red **点击进入 / ENTER** button sit below. It does not auto-enter; the visitor presses the button (or clicks anywhere on the ready boot screen). Keyboard focus lands on the button, and the boot screen is removed only after that click.
- **Hero folder shortcuts** — the six numbered chapter shortcuts are beige desktop folders in a small explorer window. Hovering reveals the cover; touch taps reveal it briefly and then open the chapter directly. At most two folders stay open, and `全部盖上` resets the set.
- **One-page catalogue** — six cover cards are framed as file windows with a `C:\KAIYU\WORKS` title strip. Hovering or keyboard-focusing a card turns it over with a stepped 3D flip and a red scanline sweep, revealing a beige chapter card on the back. Touch layouts get a small `↻` window button on each card; tapping it pins the back, and tapping the card itself still opens the chapter.
- **Chapter pages** — every catalogue card and every hero folder opens `chapter.html?c=…`. A chapter shows every plate as an image-viewer window, then its films as beveled video players, with previous/next chapter buttons. This is where the actual work and all videos live; there is no separate all-films page. Chapter 06 also has two live-site windows: the screenshot itself links to the live URL, with a small `访问网站` badge, and each site has a silent demo reel in the film strip.
- **Artist card** — the about portrait is still a flip card, but framed as a computer monitor; the front is the drawn portrait and the back is a short statement. Click to turn it over; the state is exposed with `aria-pressed`.
- **CV dialog** — the small red CV card opens the actual CV image in a `RESUME.PNG` window. There is no PDF link and no download button. The image is loaded only when the dialog opens.
- **Opening reveal** — the hero headline unmasks in a short stepped animation once the boot screen clears.
- **Work lightbox** — on chapter pages, clicking any plate opens the full-resolution image in a viewer window; `Esc`, the close button or the backdrop closes it. The link still falls back to the image file if JavaScript is unavailable.
- **Fragment game** — “这是哪一章的碎片？” A five-round game built from real close-ups of the 33 plates. It opens from the `猜碎片` tab as a beige guessing-game window, not a page section.
- **Contact postcard** — a red `MAIL.EXE` window with a beige postcard. Email is click-to-copy, phone opens the dialer, and QQ / WeChat copy with a toast.
- **Desktop cursor** — the old drawn cursor is disabled; desktop uses a small pixel arrow. All interactive controls keep a visible focus ring.
- **Touch layout** — phones get stacked windows, a compact taskbar, tap ripples, pressed-card scaling and a short vibration on supported Android browsers. Hover-only behaviours are disabled on touch.
- **Image weight** — desktop keeps the 2800 px full-resolution lightbox files. Phones request 720 px covers through `srcset`, use the 1800 px wide files for the lightbox, and defer the CV image. The opening cover is the one deliberate exception: desktop loads the 2000 px original, phones a 37 KB portrait crop.
- **Soundtrack** — an original 42-second chiptune loop (`os95-theme.mp3`) and tiny synthesized UI sounds. Music is off until the first real gesture; the **点击进入** click starts it with a soft boot chime. The taskbar `♪` control mutes or resumes it, the preference is remembered, and a best-effort timestamp is carried between index and chapter pages.
- **Small things** — live Hangzhou clock in the taskbar, scroll reveals, mobile start menu, window chrome and keyboard focus states.
- **Keyboard** — `Esc` closes the chapter lightbox; native video controls handle playback, seeking and volume.

## GitHub Pages

1. Push the repository root to `main`.
2. In **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://xq1125.github.io/kaiyu-portfolio/`.

`.nojekyll` is included so GitHub Pages serves the files as-is.

## Video map

The twelve films from the Feishu `视频作品集` are placed as follows, plus two interactive player-view reels recorded from the live websites:

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
| TouchDesigner / 交互设计衍生 | 06 · 情绪可视化 | `touchdesigner.mp4` |
| Self-designed site | 06 · 黑洞便利店 | `blackhole-demo.mp4` |
| Self-designed site | 06 · 豆季 · 手工精品咖啡 | `coffee-demo.mp4` |

The Feishu `开始动画（东方纹章录）` entry is the same 224 MB `unity游戏demo.mp4` as the demo entry, so it is represented once rather than uploading a duplicate file.

To add another film, put a compressed MP4 in `assets/video/`, add a poster in `assets/img/video/`, then add a `videos` array to the relevant plate in `assets/js/data.js`:

```js
videos: [
  { label: "正片", src: "assets/video/example.mp4", poster: "assets/img/video/example.webp", duration: "1:20" }
]
```

## Notes

- Plates were optimized from the supplied 7073 × 2500 portfolio boards.
- The boot screen uses the original portfolio cover inside a CSS CRT frame. Desktop loads the 2000 px image; phones load a 1170 px portrait crop of the same cover.
- The type is self-hosted: a site-text subset of **Fusion Pixel 12 px** (OFL) for Chinese and **Press Start 2P** (OFL, Reserved Font Name) for machine labels. Licenses live in `assets/fonts/`.
- The soundtrack and UI effects are original synthesized audio, generated for this site. No samples, no third-party music and no licensing dependencies.
- The site opens at the top unless a chapter hash is present; old `#contact` links and browser scroll restoration are reset so a fresh visit never lands on the contact section.
- No third-party JavaScript, build step, external font, third-party audio, analytics or cookies.
- The contact postcard publishes only the details the artist chose to share: email, phone, WeChat and QQ. The full profile-board image with other personal fields is intentionally not published.
- Edit portfolio copy in `assets/js/data.js`; edit the page-level manifesto and postcard copy in `index.html`.
