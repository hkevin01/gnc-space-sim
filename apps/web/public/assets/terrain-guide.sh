#!/bin/bash
# Terrain Enhancement Quick Start Guide
echo "🏔️  Terrain Enhancement Features"
echo "=================================="
echo

echo "✅ Live Displacement Controls:"
echo "   • Toggle displacement on/off"
echo "   • Adjust Moon relief scale (0-0.1)"
echo "   • Adjust Mars relief scale (0-0.2)"
echo "   • Click 🏔️ button in the app UI"
echo

echo "✅ Enhanced Asset Downloads:"
echo "   • Mars: 2K color mosaic (fallback to 1K)"
echo "   • Moon: 4K color + displacement preview"
echo "   • Mars: DEM browse preview"
echo "   • Run: bash download-textures.sh"
echo

echo "✅ High-Precision Displacement Support:"
echo "   • NASA SVS Moon Kit TIFFs → 16-bit PNG"
echo "   • USGS Mars HRSC+MOLA DEM → 16-bit PNG"
echo "   • Run: bash convert-displacement.sh"
echo

echo "✅ Linear vs sRGB Color Handling:"
echo "   • Color maps: sRGB space (Earth/Moon/Mars surfaces)"
echo "   • Data maps: Linear space (normal/displacement/specular)"
echo "   • Automatic based on texture type"
echo

echo "🚀 Getting Started:"
echo "   1. bash download-textures.sh      # Get assets"
echo "   2. Open app → Click 🏔️ button     # Live controls"
echo "   3. bash convert-displacement.sh   # Optional: 16-bit"
echo

echo "📁 Asset Structure:"
echo "   public/assets/"
echo "   ├── earth/    (Blue Marble + spec/normal)"
echo "   ├── moon/     (LROC color + displacement)"
echo "   ├── mars/     (Viking 2K + DEM preview)"
echo "   └── sun/      (SDO imagery)"
