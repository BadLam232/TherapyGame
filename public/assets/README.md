# Asset Replacement Guide

This MVP ships with generated placeholders so gameplay works immediately in Telegram WebView.

## Level background layers

For each level folder:

- `/assets/levels/level1/back.png`
- `/assets/levels/level1/mid.png`
- `/assets/levels/level1/front.png`
- ... repeat for `level2` to `level5`

Replace each file with your pre-rendered 2.5D layer image.

Recommended export:

- Resolution: `1024x576` or larger in same ratio.
- Format: PNG with soft alpha edges for depth stacking.
- Keep composition horizontally tile-friendly for parallax.

## Optional video overlay

You can add loop overlays per level:

- `/assets/levels/level1/overlay.mp4`
- ... repeat for each level

If missing, the game skips video overlay automatically.

Recommended video settings:

- H.264 MP4
- 8-12 seconds seamless loop
- muted
- lightweight bitrate for Telegram mobile WebView
