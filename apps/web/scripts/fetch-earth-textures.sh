#!/usr/bin/env bash
set -euo pipefail

# Downloads sample Earth textures into apps/web/public/textures/earth
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT_DIR/public/textures/earth"
mkdir -p "$DEST"

echo "Downloading sample textures to $DEST"

# Public domain or permissive mirrors; update as needed
# Note: URLs may change; if a download fails, please place your own assets with the expected filenames.

curl -L -o "$DEST/earth_daymap_4k.jpg" \
  https://raw.githubusercontent.com/ArthurFDLR/3D-earth/master/public/2k_earth_daymap.jpg || true

curl -L -o "$DEST/earth_normal_map_4k.jpg" \
  https://raw.githubusercontent.com/pmndrs/drei-assets/master/normalmap.png || true

curl -L -o "$DEST/earth_specular_map_4k.jpg" \
  https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_1_M_Normal.jpg || true

curl -L -o "$DEST/earth_clouds_4k.png" \
  https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthcloudmap.jpg || true

echo "Done. If files are missing, add your own textures named as in README.md."
