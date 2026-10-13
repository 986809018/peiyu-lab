#!/usr/bin/env python3
"""Generate Peiyu Lab brand assets (social card + iOS touch icon).

    python3 scripts/make-brand-assets.py

Writes public/og-image.png (1200x630) and public/apple-touch-icon.png (180x180).
Re-run after changing the palette in src/index.css.
"""
from __future__ import annotations

import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

BG = (8, 9, 16)
TEXT = (244, 244, 251)
TEXT_DIM = (162, 162, 183)
TEXT_FAINT = (119, 119, 140)
ACCENT = (157, 139, 255)
HAIRLINE = (164, 154, 255, 10)

SANS = "/System/Library/Fonts/SFNS.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"
CJK = "/System/Library/Fonts/Hiragino Sans GB.ttc"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def glow(width: int, height: int, cx: float, cy: float, radius: float,
         colour: tuple[int, int, int], strength: float) -> Image.Image:
    """Radial falloff rendered numerically so the falloff stays smooth."""
    ys, xs = np.mgrid[0:height, 0:width]
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / radius
    falloff = np.clip(1.0 - dist, 0.0, 1.0) ** 2 * strength
    layer = np.zeros((height, width, 4), dtype=np.uint8)
    layer[..., 0], layer[..., 1], layer[..., 2] = colour
    layer[..., 3] = (falloff * 255).astype(np.uint8)
    return Image.fromarray(layer, "RGBA")


def grid(width: int, height: int, step: int) -> Image.Image:
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=HAIRLINE, width=1)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=HAIRLINE, width=1)
    return layer


def tracked(draw: ImageDraw.ImageDraw, xy: tuple[float, float], text: str,
            fnt: ImageFont.FreeTypeFont, fill, tracking: float) -> float:
    """Draw text with letter-spacing; returns the advance width."""
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=fnt, fill=fill)
        x += draw.textlength(char, font=fnt) + tracking
    return x - xy[0]


def gradient_text(base: Image.Image, xy: tuple[int, int], text: str,
                  fnt: ImageFont.FreeTypeFont, stops: list[tuple[float, tuple[int, int, int]]]) -> None:
    """Composite text filled with a horizontal gradient onto `base`."""
    mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(mask).text(xy, text, font=fnt, fill=255)

    width = base.size[0]
    ramp = np.zeros((1, width, 3), dtype=np.uint8)
    for channel in range(3):
        ramp[0, :, channel] = np.interp(
            np.linspace(0, 1, width),
            [stop[0] for stop in stops],
            [stop[1][channel] for stop in stops],
        ).astype(np.uint8)
    base.paste(Image.fromarray(ramp, "RGB").resize(base.size), (0, 0), mask)


def brand_mark(size: int) -> Image.Image:
    """The site's rounded-square 'P.' mark, drawn at 4x then downsampled."""
    scale = 4
    side = size * scale
    mark = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(mark)
    radius = int(side * 0.24)
    draw.rounded_rectangle(
        [(0, 0), (side - 1, side - 1)], radius=radius,
        fill=(120, 96, 255, 46),
    )
    draw.rounded_rectangle(
        [(side * 0.03, side * 0.03), (side * 0.97, side * 0.97)],
        radius=int(radius * 0.86), outline=(163, 148, 255, 115), width=max(2, scale),
    )
    glyph = font(SANS, int(side * 0.44))
    draw.text((side / 2, side * 0.53), "P.", font=glyph, fill=(198, 188, 255),
              anchor="mm")
    return mark.resize((size, size), Image.LANCZOS)


def social_card() -> Image.Image:
    width, height = 1200, 630
    card = Image.new("RGB", (width, height), BG)
    card = Image.alpha_composite(card.convert("RGBA"), grid(width, height, 48))
    card = Image.alpha_composite(card, glow(width, height, width * 0.5, -120, 780, (79, 60, 165), 0.55))
    card = Image.alpha_composite(card, glow(width, height, width * 0.88, height * 0.62, 620, (51, 74, 196), 0.22))

    draw = ImageDraw.Draw(card)
    mark = brand_mark(64)
    card.paste(mark, (88, 78), mark)

    tracked(draw, (172, 100), "PEIYU LAB", font(SANS, 23), TEXT, 3.4)

    headline = font(SANS, 84)
    draw.text((88, 252), "Stay Curious.", font=headline, fill=TEXT)
    gradient_text(card, (88, 352), "Build Things.", headline,
                  [(0.0, (242, 239, 255)), (0.46, (168, 154, 255)), (0.95, (112, 153, 255))])

    cjk = font(CJK, 27)
    draw.text((92, 486), "AI · 软件开发 · 数字产品", font=cjk, fill=TEXT_DIM)

    draw.line([(88, 552), (width - 88, 552)], fill=(255, 255, 255, 26), width=1)
    tracked(draw, (88, 574), "PEIYULAB.TOP", font(MONO, 21), TEXT_FAINT, 3.0)
    label = "个人技术实验室"
    draw.text((width - 88 - draw.textlength(label, font=cjk), 574), label,
              font=cjk, fill=TEXT_FAINT)

    return card.convert("RGB")


def touch_icon() -> Image.Image:
    size = 180
    icon = Image.new("RGB", (size, size), BG)
    icon = Image.alpha_composite(icon.convert("RGBA"), glow(size, size, size / 2, -20, 200, (79, 60, 165), 0.6))
    mark = brand_mark(132)
    icon.paste(mark, ((size - 132) // 2, (size - 132) // 2), mark)
    return icon.convert("RGB")


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    card = social_card()
    card.save(PUBLIC / "og-image.png", optimize=True)
    touch_icon().save(PUBLIC / "apple-touch-icon.png", optimize=True)
    print(f"og-image.png         {card.size[0]}x{card.size[1]}")
    print("apple-touch-icon.png 180x180")


if __name__ == "__main__":
    main()
