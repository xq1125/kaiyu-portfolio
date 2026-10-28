# 郑铠妤 KAIYU — Portfolio

Live site: **https://xq1125.github.io/kaiyu-portfolio/**

A hand-built, dependency-free portfolio site for game visual, AIGC film, UI/UX, 3D, IP and experimental work.

30 artwork plates · 6 chapters · 1 generative playground.

## Run locally

```bash
python -m http.server 4180
```

Open <http://localhost:4180>.

Or simply double-click `index.html` — all assets use relative paths. The local server is recommended for the cleanest experience.

## Structure

```text
index.html                 Page shell
assets/css/style.css       All styling and responsive layout
assets/js/data.js          All portfolio copy, categories, captions
assets/js/main.js          Interactions, lightbox, generative playground
assets/img/thumb/          900px WebP plates (mobile gallery)
assets/img/wide/           1800px WebP plates (desktop gallery + srcset)
assets/img/full/           2800px WebP plates (lightbox)
assets/img/covers/         Hero and index crops
assets/img/about/          Portrait
```

## Interactions

- Draggable hero project deck
- Hovering work index with a floating preview
- Draggable / swipeable horizontal chapter galleries
- Full-screen lightbox with zoom, pan and keyboard navigation
- Generative canvas playground (TRAIL / BURST, three palettes, save as PNG)
- Dark / light theme, ambient Web Audio, custom cursor
- Responsive mobile menu
- Keyboard: `G` grain on/off, `T` theme toggle, `←` `→` in lightbox, `Esc` close

## GitHub Pages

1. Create a repository on GitHub, e.g. `portfolio`.
2. Upload the contents of this folder to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. The site will appear at `https://<username>.github.io/portfolio/`.

`.nojekyll` is included so GitHub Pages serves the files as-is.

## Adding video

Add MP4/WebM files under `assets/video/`, then either:
- replace a chapter plate with a video card, or
- add a `video` field to a plate in `data.js` and a `<video>` slot in the lightbox.

The initial site intentionally uses stills only. The AIGC works (`山海·一念`, `未发送`, 非遗系列) are natural candidates for a video reel.

## Notes

- All images were optimized from the supplied 7073 × 2500 portfolio boards.
- No third-party JS, no tracking, no external fonts.
- Text and contact details can be edited in `assets/js/data.js` and `index.html`.
