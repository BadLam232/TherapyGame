#!/usr/bin/env python3
from __future__ import annotations

import math
import os
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEVEL_ASSETS = ROOT / 'public' / 'assets' / 'levels'
CHAR_ASSETS = ROOT / 'public' / 'assets' / 'characters'


def png_chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, width: int, height: int, pixel_fn) -> None:
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            r, g, b, a = pixel_fn(x, y, width, height)
            row.extend((r & 255, g & 255, b & 255, a & 255))
        rows.append(bytes(row))

    raw = b''.join(rows)
    compressed = zlib.compress(raw, 9)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = png_chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + ihdr + idat + iend)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_color(c1, c2, t: float) -> tuple[int, int, int]:
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
    )


def gradient_pixel(c1, c2, x, y, w, h):
    tx = x / max(1, w - 1)
    ty = y / max(1, h - 1)
    t = tx * 0.35 + ty * 0.65
    r, g, b = lerp_color(c1, c2, t)
    return r, g, b, 255


def add_haze(base, x, y, w, h, tint, strength=0.45):
    r, g, b, a = base
    nx = (x - w * 0.3) / (w * 0.62)
    ny = (y - h * 0.4) / (h * 0.56)
    d = math.sqrt(nx * nx + ny * ny)
    glow = max(0.0, 1.0 - d)
    glow = glow * glow * strength
    return (
        int(min(255, r + tint[0] * glow)),
        int(min(255, g + tint[1] * glow)),
        int(min(255, b + tint[2] * glow)),
        a,
    )


def layer_pixel(c1, c2, tint, freq, amp, line_bias):
    def fn(x, y, w, h):
        base = gradient_pixel(c1, c2, x, y, w, h)
        base = add_haze(base, x, y, w, h, tint, strength=0.52)

        wave = math.sin((x / w) * freq + (y / h) * (freq * 0.4))
        ridge = math.sin((x / w) * (freq * 0.55) + line_bias) * 0.5 + 0.5
        lift = wave * amp + ridge * amp * 0.7

        r = int(max(0, min(255, base[0] + lift * 30)))
        g = int(max(0, min(255, base[1] + lift * 24)))
        b = int(max(0, min(255, base[2] + lift * 38)))

        if y > h * 0.72:
            shadow = (y - h * 0.72) / (h * 0.28)
            r = int(r * (1 - shadow * 0.12))
            g = int(g * (1 - shadow * 0.12))
            b = int(b * (1 - shadow * 0.1))

        return r, g, b, 255

    return fn


def inside_circle(x: int, y: int, cx: float, cy: float, r: float) -> bool:
    dx = x - cx
    dy = y - cy
    return dx * dx + dy * dy <= r * r


def inside_ellipse(x: int, y: int, cx: float, cy: float, rx: float, ry: float) -> bool:
    if rx <= 0 or ry <= 0:
        return False
    nx = (x - cx) / rx
    ny = (y - cy) / ry
    return nx * nx + ny * ny <= 1


def sign(px, py, ax, ay, bx, by):
    return (px - bx) * (ay - by) - (ax - bx) * (py - by)


def inside_triangle(x: int, y: int, p1: tuple[float, float], p2: tuple[float, float], p3: tuple[float, float]) -> bool:
    d1 = sign(x, y, p1[0], p1[1], p2[0], p2[1])
    d2 = sign(x, y, p2[0], p2[1], p3[0], p3[1])
    d3 = sign(x, y, p3[0], p3[1], p1[0], p1[1])
    has_neg = d1 < 0 or d2 < 0 or d3 < 0
    has_pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (has_neg and has_pos)


def character_pixel(stage: int):
    t = stage / 5.0
    body = lerp_color((28, 30, 36), (247, 214, 188), t)
    eye = lerp_color((255, 70, 70), (118, 190, 255), t)
    mouth = lerp_color((255, 88, 88), (132, 184, 255), t)
    horn = (238, 74, 74)
    wing_dark = (24, 24, 28)
    wing_red = (173, 54, 54)
    hair = (66, 47, 35)

    def fn(x: int, y: int, w: int, h: int):
        r = g = b = 0
        a = 0

        def paint(color: tuple[int, int, int], alpha: int = 255):
            nonlocal r, g, b, a
            r, g, b, a = color[0], color[1], color[2], alpha

        if stage <= 1:
            if inside_triangle(x, y, (92, 198), (56, 208), (92, 228)):
                paint(wing_dark)
            if inside_triangle(x, y, (420, 198), (456, 208), (420, 228)):
                paint(wing_dark)
            if inside_triangle(x, y, (92, 200), (68, 208), (92, 222)):
                paint(wing_red)
            if inside_triangle(x, y, (420, 200), (444, 208), (420, 222)):
                paint(wing_red)

        if stage <= 2:
            if inside_triangle(x, y, (224, 96), (246, 36), (268, 96)):
                paint(horn)
            if inside_triangle(x, y, (288, 96), (310, 36), (332, 96)):
                paint(horn)

        if inside_circle(x, y, 256, 278, 110):
            paint(body)
        if inside_circle(x, y, 256, 158, 100):
            paint(body)

        if stage == 3 and inside_ellipse(x, y, 256, 250, 118, 22):
            paint((212, 58, 58))

        if stage >= 4 and inside_ellipse(x, y, 256, 86, 102, 32):
            paint(hair)
        if stage == 5 and inside_ellipse(x, y, 178, 170, 46, 118):
            paint(hair)
        if stage == 5 and inside_ellipse(x, y, 334, 170, 46, 118):
            paint(hair)

        if inside_circle(x, y, 224, 154, 30):
            paint(eye)
        if inside_circle(x, y, 288, 154, 30):
            paint(eye)
        if inside_circle(x, y, 224, 158, 12):
            paint((16, 20, 28))
        if inside_circle(x, y, 288, 158, 12):
            paint((16, 20, 28))
        if inside_ellipse(x, y, 256, 202, 38, 14):
            paint(mouth)

        return r, g, b, a

    return fn


def generate_levels() -> None:
    palettes = {
        1: ((95, 124, 174), (146, 174, 220), (214, 231, 255)),
        2: ((112, 115, 172), (164, 141, 192), (246, 188, 192)),
        3: ((104, 130, 178), (147, 164, 208), (204, 221, 255)),
        4: ((108, 145, 172), (146, 183, 198), (197, 232, 222)),
        5: ((105, 151, 182), (141, 186, 208), (196, 235, 232)),
    }

    width = 1024
    height = 576

    for level in range(1, 6):
        c1, c2, accent = palettes[level]
        level_dir = LEVEL_ASSETS / f'level{level}'

        back = layer_pixel(c1, c2, accent, freq=4.2 + level, amp=0.22, line_bias=0.7 * level)
        mid = layer_pixel(c1, c2, accent, freq=7.4 + level, amp=0.34, line_bias=1.4 * level)
        front = layer_pixel(c1, c2, accent, freq=11.8 + level, amp=0.43, line_bias=2.1 * level)

        write_png(level_dir / 'back.png', width, height, back)
        write_png(level_dir / 'mid.png', width, height, mid)
        write_png(level_dir / 'front.png', width, height, front)


def generate_characters() -> None:
    for stage in range(0, 6):
        write_png(CHAR_ASSETS / f'stage{stage}.png', 512, 512, character_pixel(stage))


def main() -> None:
    os.makedirs(LEVEL_ASSETS, exist_ok=True)
    os.makedirs(CHAR_ASSETS, exist_ok=True)
    generate_levels()
    generate_characters()
    print('Generated level placeholders in', LEVEL_ASSETS)
    print('Generated character placeholders in', CHAR_ASSETS)


if __name__ == '__main__':
    main()
