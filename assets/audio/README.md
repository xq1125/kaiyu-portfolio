# KAIYU.OS 95 audio

These files are original synthesized audio made for this portfolio. No samples, no third-party tracks.

- `os95-theme.mp3` — 42.7 s seamless-ish chiptune loop, A minor, 90 BPM, 160 kbps stereo.
- `boot.wav` — soft four-note power-on chime.
- `ui-click.wav` — short square-wave click.
- `ui-hover.wav` — quiet high tick for desktop hover.
- `ui-open.wav` / `ui-close.wav` — window open/close flourishes.
- `ui-copy.wav` — two-note copy confirmation.
- `ui-error.wav` — quiet low error buzz.

Playback rules live in `assets/js/audio.js`: no fetch before a gesture, loader entry starts the loop, the taskbar `♪` button mutes, and video playback ducks the music.
