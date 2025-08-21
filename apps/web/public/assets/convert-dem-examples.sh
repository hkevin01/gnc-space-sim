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

echo "Displacement conversion examples:"
echo "================================="

# Moon (NASA SVS 4720) example:
echo "Moon example (after downloading a TIFF from https://svs.gsfc.nasa.gov/4720/):"
echo "  $CMD ldem_64ppd_uint16.tif -auto-level -define png:bit-depth=16 moon/moon_displacement.png"
echo

# Mars (USGS HRSC+MOLA blended DEM), if you obtain a manageable GeoTIFF subset:
echo "Mars example (after obtaining a manageable subset of the 11 GB HRSC+MOLA DEM):"
echo "  $CMD Mars_HRSC_MOLA_BlendDEM_subset.tif -auto-level -define png:bit-depth=16 mars/mars_displacement.png"
echo

echo "Tips:"
echo "- Use 16-bit PNG format to preserve elevation precision"
echo "- -auto-level normalizes the range for better visualization"
echo "- For large files, consider cropping to regions of interest first"
echo "- Adjust displacementScale in the live terrain controls after conversion"
echo
echo "Current displacement files are preview JPGs (shaded relief, not true elevation)."
echo "Replace with converted PNGs for accurate topography."
