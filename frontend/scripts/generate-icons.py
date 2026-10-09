"""Render the SyncLife app icons from the same geometry as src/components/BrandLogo.tsx.

    python scripts/generate-icons.py

Writes assets/icon.png, assets/adaptive-icon.png (transparent foreground),
assets/adaptive-icon-bg.png (gradient background) and assets/splash.png.
Only needs Pillow + numpy. Everything is drawn at 4x and downsampled for clean edges.
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')
SS = 4  # supersampling factor

STOPS = [(0.0, (0xFF, 0x45, 0x1A)), (0.5, (0xFF, 0x6A, 0x1F)), (1.0, (0xFF, 0xB8, 0x1F))]
SPARKLE = (0xFF, 0xF6, 0xD6, 255)
WHITE = (255, 255, 255, 255)
SPLASH_BG = (0x0F, 0x0D, 0x12)


def gradient(size):
    """Diagonal 3-stop gradient, top-left â†’ bottom-right."""
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    t = (xx + yy) / (2 * (size - 1))
    out = np.zeros((size, size, 3), np.float32)
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        mask = (t >= t0) & (t <= t1)
        local = ((t - t0) / (t1 - t0))[mask][:, None]
        out[mask] = np.array(c0) * (1 - local) + np.array(c1) * local
    img = Image.fromarray(out.astype(np.uint8), 'RGB').convert('RGBA')
    # Soft highlight in the top-left corner, like the in-app Circle.
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [(22 - 30) * size / 100, (18 - 30) * size / 100, (22 + 30) * size / 100, (18 + 30) * size / 100],
        fill=(255, 255, 255, 16),
    )
    return Image.alpha_composite(img, glow)


def arc_points(cx, cy, r, start_deg, sweep_deg, steps=160):
    return [
        (cx + r * math.cos(math.radians(start_deg + sweep_deg * i / steps)),
         cy + r * math.sin(math.radians(start_deg + sweep_deg * i / steps)))
        for i in range(steps + 1)
    ]


def draw_mark(draw, scale, ox=0.0, oy=0.0):
    """Draws the S + dot + sparkle. Coordinates are in the 100-unit logo box."""
    p = lambda x, y: (ox + x * scale, oy + y * scale)
    half = 11 / 2
    # Each arc is filled as a ring segment (outer edge + reversed inner edge) —
    # PIL's wide lines leave jagged spokes on curves. Round caps are circles.
    # Upper arc: from -40° counter-clockwise to 90° (screen coords), lower: -90° clockwise to 140°.
    for cx, cy, start, sweep in ((50, 36, -40, -230), (50, 64, -90, 230)):
        ring = arc_points(cx, cy, 14 + half, start, sweep) + arc_points(cx, cy, 14 - half, start, sweep)[::-1]
        draw.polygon([p(x, y) for x, y in ring], fill=WHITE)
    for x, y in ((60.72, 27.0), (50, 50), (39.28, 73.0)):
        (x0, y0), (x1, y1) = p(x - half, y - half), p(x + half, y + half)
        draw.ellipse([x0, y0, x1, y1], fill=WHITE)
    cx, cy = p(25, 81)
    draw.ellipse([cx - 4 * scale, cy - 4 * scale, cx + 4 * scale, cy + 4 * scale], fill=(255, 255, 255, 217))
    # Sparkle: four quadratic curves pulled into the center.
    sx, sy, s = 79, 21, 11
    corners = [(sx, sy - s), (sx + s, sy), (sx, sy + s), (sx - s, sy), (sx, sy - s)]
    star = []
    for (x0, y0), (x1, y1) in zip(corners, corners[1:]):
        for i in range(24):
            t = i / 24
            star.append(p((1 - t) ** 2 * x0 + 2 * (1 - t) * t * sx + t * t * x1,
                          (1 - t) ** 2 * y0 + 2 * (1 - t) * t * sy + t * t * y1))
    draw.polygon(star, fill=SPARKLE)


def rounded_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


WORDMARK = 'SyncLife'
FONT_CANDIDATES = ['seguibl.ttf', 'ariblk.ttf', 'segoeuib.ttf', 'arialbd.ttf']


def load_font(px):
    for name in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(name, round(px))
        except OSError:
            continue
    return ImageFont.load_default(px)


def draw_badge(img, scale, ox=0.0, oy=0.0):
    """Mark on top, "SyncLife" underneath, all inside one 100-unit box at (ox, oy)."""
    draw = ImageDraw.Draw(img)
    mark = 0.66
    # The mark's visual centre is ~(52, 48); park it at (50, 37) of the badge.
    draw_mark(draw, scale * mark, ox + (50 - 52 * mark) * scale, oy + (37 - 48 * mark) * scale)
    # Size the word to span ~70 units, then centre it on y = 77.
    target = 70 * scale
    font = load_font(18 * scale)
    width = draw.textlength(WORDMARK, font=font)
    font = load_font(18 * scale * target / width)
    draw.text((ox + 50 * scale, oy + 77 * scale), WORDMARK, font=font, fill=WHITE, anchor='mm')


def icon(size=1024, rounded=True):
    big = size * SS
    img = gradient(big)
    draw_badge(img, big / 100)
    if rounded:
        img.putalpha(rounded_mask(big, big * 0.28))
    return img.resize((size, size), Image.LANCZOS)


def adaptive_foreground(size=1024):
    # Android masks to the centre ~66%; keep the badge inside it.
    big = size * SS
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    inner = big * 0.68
    draw_badge(img, inner / 100, (big - inner) / 2, (big - inner) / 2)
    return img.resize((size, size), Image.LANCZOS)


def splash(size=1284, logo=360):
    canvas = Image.new('RGBA', (size, size), SPLASH_BG + (255,))
    # Blurred brand glow behind the logo.
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    r = logo * 0.9
    ImageDraw.Draw(glow).ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r], fill=(0xFF, 0x6A, 0x1F, 90))
    canvas = Image.alpha_composite(canvas, glow.filter(ImageFilter.GaussianBlur(logo * 0.35)))
    mark = icon(logo)
    canvas.alpha_composite(mark, ((size - logo) // 2, (size - logo) // 2))
    return canvas.convert('RGB')


if __name__ == '__main__':
    icon().save(os.path.join(ASSETS, 'icon.png'))
    adaptive_foreground().save(os.path.join(ASSETS, 'adaptive-icon.png'))
    gradient(1024).save(os.path.join(ASSETS, 'adaptive-icon-bg.png'))
    splash().save(os.path.join(ASSETS, 'splash.png'))
    print('icons written to', os.path.abspath(ASSETS))
