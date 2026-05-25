#!/usr/bin/env python3
"""
Resize screenshots to App Store dimensions.

Usage:
    python3 scripts/resize-appstore-screenshots.py <image1> [image2] ...

Examples:
    python3 scripts/resize-appstore-screenshots.py ~/Desktop/screen1.png ~/Desktop/screen2.png
    python3 scripts/resize-appstore-screenshots.py ~/Desktop/*.png

Output: files saved next to originals with _appstore suffix, e.g. screen1_appstore.png
"""

import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow -q")
    from PIL import Image

# App Store required dimensions (iPhone 6.5")
TARGET_W, TARGET_H = 1284, 2778
BG_COLOR = (238, 240, 245)  # matches app light theme background #EEF0F5


def resize(path):
    img = Image.open(path).convert("RGB")

    # Scale to fit within target, preserving aspect ratio
    img.thumbnail((TARGET_W, TARGET_H), Image.LANCZOS)

    # Center on background
    bg = Image.new("RGB", (TARGET_W, TARGET_H), BG_COLOR)
    x = (TARGET_W - img.width) // 2
    y = (TARGET_H - img.height) // 2
    bg.paste(img, (x, y))

    base, ext = os.path.splitext(path)
    out = f"{base}_appstore.png"
    bg.save(out, "PNG")
    print(f"✓ {os.path.basename(path)} → {os.path.basename(out)} ({TARGET_W}×{TARGET_H})")
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    paths = sys.argv[1:]
    for path in paths:
        path = os.path.expanduser(path)
        if not os.path.exists(path):
            print(f"✗ Not found: {path}")
            continue
        resize(path)

    print(f"\nDone. {len(paths)} screenshot(s) processed.")
