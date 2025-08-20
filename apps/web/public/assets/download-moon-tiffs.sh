#!/bin/bash
# Download high-precision NASA SVS Moon Kit displacement TIFFs
# Based on NASA SVS CGI Moon Kit: https://svs.gsfc.nasa.gov/4720/
# Available in 64, 16, and 4 pixels per degree

set -e

echo "🌙 Downloading NASA SVS Moon Kit high-precision displacement TIFFs..."
echo "Note: These are large files (100MB+ each) for maximum terrain accuracy"

mkdir -p moon/high-precision

# Try to download various resolutions of Moon displacement TIFFs
# Format: ldem_[ppd]_[bits].tif where ppd = pixels per degree

echo "Trying 64 pixels per degree (highest resolution)..."
wget -O moon/high-precision/ldem_64ppd_16bit.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_64ppd_16bit.tif" || \
curl -L -o moon/high-precision/ldem_64ppd_16bit.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_64ppd_16bit.tif" || \
echo "❌ 64ppd TIFF failed"

echo "Trying 16 pixels per degree (medium resolution)..."
wget -O moon/high-precision/ldem_16ppd_16bit.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16ppd_16bit.tif" || \
curl -L -o moon/high-precision/ldem_16ppd_16bit.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16ppd_16bit.tif" || \
echo "❌ 16ppd TIFF failed"

echo "Trying 4 pixels per degree (manageable resolution)..."
wget -O moon/high-precision/ldem_4ppd_16bit.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4ppd_16bit.tif" || \
curl -L -o moon/high-precision/ldem_4ppd_16bit.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4ppd_16bit.tif" || \
echo "❌ 4ppd TIFF failed"

# Also try floating-point versions
echo "Trying floating-point 16ppd version..."
wget -O moon/high-precision/ldem_16ppd_float.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16ppd_float.tif" || \
curl -L -o moon/high-precision/ldem_16ppd_float.tif "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16ppd_float.tif" || \
echo "❌ 16ppd float TIFF failed"

echo "High-precision downloads complete. Listing files:"
ls -lh moon/high-precision/ 2>/dev/null || echo "No high-precision files downloaded"

echo ""
echo "📋 Next steps:"
echo "1. Convert any successful TIFF downloads to 16-bit PNGs:"
echo "   convert ldem_16ppd_16bit.tif -auto-level moon_displacement.png"
echo "2. Move the PNG to public/assets/moon/moon_displacement.png"
echo "3. Use live terrain controls to adjust displacement scale"
echo "4. The converted PNG will provide true elevation detail vs preview JPG"
