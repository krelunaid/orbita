#!/usr/bin/env python3
"""Generate Orbita icon, splash, and adaptive-icon assets.

Important content stays inside the iOS ~80% icon safe zone and the
Android adaptive 66% zone so the Earth is not cropped by the mask.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
BG = (5, 7, 15, 255)
OCEAN = (18, 52, 92)
LAND = (52, 110, 86)
ATMOS = (90, 200, 230)
GOLD = (255, 209, 102)
CYAN = (125, 211, 252)


def disc(draw: ImageDraw.ImageDraw, cx, cy, r, fill, outline=None, width=1):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill, outline=outline, width=width)


def paint_stars(draw, w, h, n, rng, inset_ratio=0.14):
    x0, y0 = int(w * inset_ratio), int(h * inset_ratio)
    x1, y1 = w - 1 - x0, h - 1 - y0
    if x1 <= x0 or y1 <= y0:
        return
    for _ in range(n):
        x, y = rng.randint(x0, x1), rng.randint(y0, y1)
        a = rng.randint(90, 220)
        s = rng.choice([1, 1, 1, 2])
        draw.ellipse((x, y, x + s, y + s), fill=(220, 230, 255, a))


def paint_earth(draw, cx, cy, r):
    disc(draw, cx, cy, int(r * 1.08), (*ATMOS, 50))
    disc(draw, cx, cy, r, (*OCEAN, 255))
    blobs = [
        (-0.22, 0.12, 0.38, 0.32),
        (0.18, -0.08, 0.22, 0.18),
        (0.42, 0.22, 0.16, 0.14),
        (-0.05, -0.42, 0.28, 0.16),
        (0.08, 0.48, 0.2, 0.12),
    ]
    for ox, oy, rw, rh in blobs:
        draw.ellipse(
            (
                cx + ox * r - rw * r,
                cy + oy * r - rh * r,
                cx + ox * r + rw * r,
                cy + oy * r + rh * r,
            ),
            fill=(*LAND, 255),
        )


def icon(size=1024) -> Image.Image:
    rng = random.Random(42)
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img, "RGBA")
    paint_stars(draw, size, size, 70, rng, inset_ratio=0.16)
    cx = cy = size // 2
    r = int(size * 0.22)
    paint_earth(draw, cx, cy, r)
    for t in range(0, 360, 2):
        a = math.radians(t)
        x = cx + int(math.cos(a) * size * 0.30)
        y = cy + int(math.sin(a) * size * 0.13)
        if t % 4 == 0:
            draw.point((x, y), fill=(*CYAN, 220))
    sx, sy = cx + int(size * 0.28), cy - int(size * 0.10)
    disc(draw, sx, sy, int(size * 0.016), (*GOLD, 255))
    draw.rectangle(
        (sx - int(size * 0.032), sy - 2, sx + int(size * 0.032), sy + 2),
        fill=(*CYAN, 200),
    )
    return img


def splash(size=512) -> Image.Image:
    rng = random.Random(7)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    paint_stars(draw, size, size, 36, rng, inset_ratio=0.16)
    paint_earth(draw, size // 2, size // 2, int(size * 0.22))
    return img


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    ico = icon(1024)
    ico.save(ROOT / "icon.png")
    ico.resize((192, 192), Image.Resampling.LANCZOS).save(ROOT / "favicon.png")
    splash(512).save(ROOT / "splash-icon.png")
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    d = ImageDraw.Draw(fg, "RGBA")
    paint_earth(d, 512, 512, 200)
    d.ellipse((512 - 11, 300, 512 + 11, 322), fill=(*GOLD, 255))
    fg.save(ROOT / "android-icon-foreground.png")
    Image.new("RGBA", (1024, 1024), BG).save(ROOT / "android-icon-background.png")
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    md = ImageDraw.Draw(mono)
    md.ellipse((352, 352, 672, 672), fill=(255, 255, 255, 255))
    mono.save(ROOT / "android-icon-monochrome.png")
    print("wrote icons to", ROOT)


if __name__ == "__main__":
    main()
