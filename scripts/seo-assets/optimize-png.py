"""Recompress a PNG in place with Pillow (used by make-assets.mjs).

    python optimize-png.py file.png              lossless: re-encode at maximum compression
    python optimize-png.py file.png --quantize   lossy: 256-colour palette with error-diffusion dithering

Lossless recompression is tried first by the caller; the palette pass only runs when a card
is still over its size budget. Alpha is kept (quantised with the fast-octree method).
"""
import os
import sys

from PIL import Image


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: optimize-png.py file.png [--quantize]", file=sys.stderr)
        return 2
    path = sys.argv[1]
    quantize = "--quantize" in sys.argv[2:]
    before = os.path.getsize(path)

    with Image.open(path) as im:
        im.load()
        has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
        if quantize:
            if has_alpha:
                out = im.convert("RGBA").quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
            else:
                out = im.convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        else:
            out = im.convert("RGBA" if has_alpha else "RGB")
        tmp = path + ".tmp"
        out.save(tmp, format="PNG", optimize=True, compress_level=9)

    if quantize or os.path.getsize(tmp) < before:
        os.replace(tmp, path)
    else:
        os.remove(tmp)
    return 0


if __name__ == "__main__":
    sys.exit(main())
