#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
assets_dir="$root_dir/public/assets"
mkdir -p "$assets_dir/earth" "$assets_dir/mars" "$assets_dir/sun"

# Helper: curl with resume and fail on HTTP error
fetch() {
  local url="$1"; shift
  local out="$1"; shift
  echo "Downloading $(basename "$out")"
  curl -fL --retry 3 --retry-delay 2 --continue-at - "$url" -o "$out"
}

# Earth (Blue Marble / NASA Visible Earth) - 2K sized for web preview
# Day color (JPEG)
fetch "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74418/world.topo.200412.3x5400x2700.jpg" \
      "$assets_dir/earth/earth_day.jpg" || true

# Bump/Normal (use shaded relief or ETOPO1 shaded as pseudo-normal)
fetch "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/land_shallow_topo_2048.jpg" \
      "$assets_dir/earth/earth_normal.jpg" || true

# Specular (use a simple water mask style image as proxy)
fetch "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/water_2048.png" \
      "$assets_dir/earth/earth_spec.jpg" || true

# Mars (USGS / Viking color mosaic ~2K)
fetch "https://planetarymaps.usgs.gov/mosaic/mars_viking_mdim21_color/MDIM21_ClrMosaic_global_1024.jpg" \
      "$assets_dir/mars/mars_color.jpg" || true

# Mars normal (fallback: reuse color as placeholder if no normal)
cp -f "$assets_dir/mars/mars_color.jpg" "$assets_dir/mars/mars_normal.jpg" 2>/dev/null || true

# Sun (SDO AIA 4500Å visible light single frame, resized proxy)
fetch "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0171.jpg" \
      "$assets_dir/sun/sun_color.jpg" || true

# Report
ls -lh "$assets_dir/earth" "$assets_dir/mars" "$assets_dir/sun" || true

echo "Done. If any file failed to download, the app will use procedural fallbacks."
