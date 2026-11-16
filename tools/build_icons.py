"""Draw the app icons (PNG) from the same shapes as site/img/favicon.svg.

    python tools/build_icons.py        needs Pillow (pip install pillow)

The favicon is a crescent (a disc with a smaller disc cut out of its right
side) and a lime dot, on a rounded near-black tile. Run this only when the
mark changes: the PNGs are committed.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "site" / "img"
INK, PURPLE, LIME = (17, 17, 19, 255), (163, 85, 255, 255), (227, 242, 108, 255)
SS = 4  # supersampling, for smooth edges


def icon(size: int, scale: float = 1.0, rounded: bool = True) -> Image.Image:
    """scale < 1 shrinks the mark inside the tile (maskable icons need a safe zone)."""
    n = size * SS
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=n * 14 / 64, fill=INK)
    else:
        d.rectangle([0, 0, n, n], fill=INK)

    def u(v: float) -> float:  # favicon units (64) -> pixels, scaled about the centre
        return (32 + (v - 32) * scale) * n / 64

    def disc(cx: float, cy: float, r: float, fill) -> None:
        d.ellipse([u(cx - r), u(cy - r), u(cx + r), u(cy + r)], fill=fill)

    disc(30.8, 32, 22, PURPLE)   # the outer arc of the favicon's crescent
    disc(40, 32, 20, INK)      # ... and the bite taken out of it
    disc(44, 22, 4, LIME)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    icon(192).save(OUT / "icon-192.png")
    icon(512).save(OUT / "icon-512.png")
    icon(512, scale=0.72, rounded=False).save(OUT / "icon-maskable-512.png")
    icon(180, rounded=False).save(OUT / "apple-touch-icon.png")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
