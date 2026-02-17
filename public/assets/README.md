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

## Character evolution images

Replace these files with your real character renders (the images you attached can be mapped here):

- `/assets/characters/stage0.png` - starting devil form
- `/assets/characters/stage1.png`
- `/assets/characters/stage2.png`
- `/assets/characters/stage3.png`
- `/assets/characters/stage4.png`
- `/assets/characters/stage5.png` - final humanized form

Recommendations:

- PNG with transparent background
- `512x512` or higher square export
- centered character with consistent scale and pose

The game auto-picks stage by progress after each successfully completed level.

## Recommended mapping for your current 5 references

Use this order for the images you shared:

1. Devil with horns/wings/tail -> `stage0.png`
2. Devil with hair + wings/tail -> `stage1.png`
3. Devil with red scarf -> `stage2.png`
4. Human boy -> `stage3.png`
5. Human girl -> `stage5.png`

If `stage4.png` is missing, the app now auto-copies the previous available stage so progression still works smoothly.
