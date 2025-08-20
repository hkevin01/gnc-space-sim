#!/usr/bin/env bash
# Helper examples to convert high-precision DEM TIFFs to PNGs for three.js
# Requires ImageMagick's `convert` or `magick` command.
set -euo pipefail

if ! command -v convert >/dev/null 2>&1 && ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick not found. Install it (e.g., sudo apt-get install imagemagick)" >&2
  exit 1
fi

convert_cmd() {
  if command -v convert >/dev/null 2>&1; then echo convert; else echo magick; fi
}

CMD=$(convert_cmd)

# Moon (NASA SVS 4720) example:
# Download one of the displacement TIFFs (uint16 or float). Then convert and normalize to 16-bit PNG
# $CMD ldem_64ppd_uint16.tif -auto-level -define png:bit-depth=16 moon/moon_displacement.png

# Mars (USGS HRSC+MOLA blended DEM), if you obtain a manageable GeoTIFF subset:
# $CMD Mars_HRSC_MOLA_BlendDEM_subset.tif -auto-level -define png:bit-depth=16 mars/mars_displacement.png

echo "Examples emitted as comments. Edit and run the appropriate line for your files."
