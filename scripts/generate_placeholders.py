#!/usr/bin/env python3
from __future__ import annotations

import math
import os
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'public' / 'assets' / 'levels'


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


def gradient_pixel(c1, c2, x, y, w, h):
    tx = x / max(1, w - 1)
    ty = y / max(1, h - 1)
    t = (tx * 0.35 + ty * 0.65)
    r = int(lerp(c1[0], c2[0], t))
    g = int(lerp(c1[1], c2[1], t))
    b = int(lerp(c1[2], c2[2], t))
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
        base = add_haze(base, x, y, w, h, tint, strength=0.55)

        wave = math.sin((x / w) * freq + (y / h) * (freq * 0.4))
        ridge = math.sin((x / w) * (freq * 0.55) + line_bias) * 0.5 + 0.5
        lift = (wave * amp + ridge * amp * 0.7)

        r = int(max(0, min(255, base[0] + lift * 38)))
        g = int(max(0, min(255, base[1] + lift * 28)))
        b = int(max(0, min(255, base[2] + lift * 48)))

        if y > h * 0.72:
            shadow = (y - h * 0.72) / (h * 0.28)
            r = int(r * (1 - shadow * 0.16))
            g = int(g * (1 - shadow * 0.16))
            b = int(b * (1 - shadow * 0.12))

        return r, g, b, 255

    return fn


def generate() -> None:
    palettes = {
        1: ((20, 35, 74), (38, 76, 140), (90, 140, 230)),
        2: ((28, 26, 66), (88, 42, 98), (255, 124, 84)),
        3: ((22, 28, 54), (43, 56, 97), (132, 167, 255)),
        4: ((16, 37, 68), (40, 91, 116), (128, 205, 183)),
        5: ((18, 46, 74), (36, 89, 138), (143, 228, 232)),
    }

    width = 1024
    height = 576

    for level in range(1, 6):
        c1, c2, accent = palettes[level]
        level_dir = ASSETS / f'level{level}'

        back = layer_pixel(c1, c2, accent, freq=4.2 + level, amp=0.22, line_bias=0.7 * level)
        mid = layer_pixel(c1, c2, accent, freq=7.4 + level, amp=0.36, line_bias=1.4 * level)
        front = layer_pixel(c1, c2, accent, freq=11.8 + level, amp=0.45, line_bias=2.1 * level)

        write_png(level_dir / 'back.png', width, height, back)
        write_png(level_dir / 'mid.png', width, height, mid)
        write_png(level_dir / 'front.png', width, height, front)


def main() -> None:
    os.makedirs(ASSETS, exist_ok=True)
    generate()
    print('Generated placeholder layers in', ASSETS)


if __name__ == '__main__':
    main()
