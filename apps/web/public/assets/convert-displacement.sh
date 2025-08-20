#!/usr/bin/env bash
# Convert high-precision displacement TIFFs to web-ready 16-bit PNGs
# This script replaces the browse JPG previews with actual elevation data
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for ImageMagick
if ! command -v convert >/dev/null 2>&1 && ! command -v magick >/dev/null 2>&1; then
  echo "Error: ImageMagick not found. Install it:" >&2
  echo "  Ubuntu/Debian: sudo apt-get install imagemagick" >&2
  echo "  macOS: brew install imagemagick" >&2
  exit 1
fi

CMD=$(command -v convert >/dev/null 2>&1 && echo convert || echo magick)

echo "Looking for displacement TIFFs to convert..."

# Moon displacement conversion
if [ -f "moon/ldem_64ppd_uint16.tif" ] || [ -f "moon/ldem_16ppd_uint16.tif" ] || [ -f "moon/ldem_4ppd_uint16.tif" ]; then
  echo "Converting Moon displacement..."
  # Try highest resolution first
  for tif in moon/ldem_64ppd_uint16.tif moon/ldem_16ppd_uint16.tif moon/ldem_4ppd_uint16.tif; do
    if [ -f "$tif" ]; then
      echo "  Converting $tif to moon/moon_displacement.png"
      $CMD "$tif" -auto-level -define png:bit-depth=16 moon/moon_displacement.png
      echo "  ✓ Moon displacement converted (16-bit PNG)"
      break
    fi
  done
else
  echo "  No Moon TIFFs found. Download from https://svs.gsfc.nasa.gov/4720/"
  echo "  Place as moon/ldem_64ppd_uint16.tif or similar"
fi

# Mars displacement conversion
if [ -f "mars/Mars_HRSC_MOLA_BlendDEM_subset.tif" ] || [ -f "mars/mars_dem.tif" ]; then
  echo "Converting Mars displacement..."
  for tif in mars/Mars_HRSC_MOLA_BlendDEM_subset.tif mars/mars_dem.tif; do
    if [ -f "$tif" ]; then
      echo "  Converting $tif to mars/mars_displacement.png"
      $CMD "$tif" -auto-level -define png:bit-depth=16 mars/mars_displacement.png
      echo "  ✓ Mars displacement converted (16-bit PNG)"
      break
    fi
  done
else
  echo "  No Mars DEM TIFFs found. The full HRSC+MOLA dataset is 11 GB."
  echo "  Consider extracting a region of interest or use the browse JPG"
fi

echo
echo "Conversion complete. The app will now use 16-bit displacement maps."
echo "Use the live terrain controls (🏔️ button) to adjust displacement scale."
