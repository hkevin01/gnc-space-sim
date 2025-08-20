#!/bin/bash
# Download NASA/USGS/SDO textures to local assets folder
set -e

echo "Downloading Earth/Moon/Mars textures..."
mkdir -p earth mars moon sun

# Earth Day texture (NASA Blue Marble: December, 5400x2700)
wget -O earth/earth_day.jpg "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74218/world.200412.3x5400x2700.jpg" || \
curl -L -o earth/earth_day.jpg "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74218/world.200412.3x5400x2700.jpg" || \
echo "Failed to download Earth day texture (Blue Marble)"

# Earth Normal/topography (used as pseudo-normal)
wget -O earth/earth_normal.jpg "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/land_shallow_topo_2048.jpg" || \
curl -L -o earth/earth_normal.jpg "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/land_shallow_topo_2048.jpg" || \
echo "Failed to download Earth normal texture"

# Earth Specular/water mask (PNG); code supports .png fallback
wget -O earth/earth_spec.png "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/water_2048.png" || \
curl -L -o earth/earth_spec.png "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/water_2048.png" || \
echo "Failed to download Earth specular texture"

echo "Downloading Mars textures..."
# Mars color (USGS Viking mosaic) - try 2K first, fallback to 1K
echo "Trying Mars 2K color texture..."
wget -O mars/mars_color.jpg "https://astrogeology.usgs.gov/ckan/dataset/7131d503-cdc9-45a5-8f83-5126c0fd397e/resource/5ea881c6-01b3-41fa-a7af-42d2131b54f1/download/mars_viking_mdim21_clrmosaic_1km.jpg" || \
curl -L -o mars/mars_color.jpg "https://astrogeology.usgs.gov/ckan/dataset/7131d503-cdc9-45a5-8f83-5126c0fd397e/resource/5ea881c6-01b3-41fa-a7af-42d2131b54f1/download/mars_viking_mdim21_clrmosaic_1km.jpg" || \
{
  echo "2K failed, trying 1K fallback..."
  wget -O mars/mars_color.jpg "https://planetarymaps.usgs.gov/mosaic/mars_viking_mdim21_color/MDIM21_ClrMosaic_global_1024.jpg" || \
  curl -L -o mars/mars_color.jpg "https://planetarymaps.usgs.gov/mosaic/mars_viking_mdim21_color/MDIM21_ClrMosaic_global_1024.jpg" || \
  echo "Failed to download Mars color texture"
}

# Copy Mars color as normal placeholder
cp mars/mars_color.jpg mars/mars_normal.jpg 2>/dev/null || true

# Mars displacement (USGS HRSC+MOLA blended DEM) use browse 1024 jpg as preview displacement
wget -O mars/mars_displacement.jpg "https://astrogeology.usgs.gov/ckan/dataset/6c177b5f-97af-4d70-adc3-92cf362b9890/resource/71f58b51-861b-4fe9-a096-5cb0bcf52c72/download/mars_hrsc_mola_blenddem_global_200mp_1024.jpg" || \
curl -L -o mars/mars_displacement.jpg "https://astrogeology.usgs.gov/ckan/dataset/6c177b5f-97af-4d70-adc3-92cf362b9890/resource/71f58b51-861b-4fe9-a096-5cb0bcf52c72/download/mars_hrsc_mola_blenddem_global_200mp_1024.jpg" || \
echo "Failed to download Mars displacement preview"

echo "Downloading Moon textures..."
# Moon color map (NASA SVS LROC Color Mosaic). Try 4k then 1k as fallback.
wget -O moon/moon_color.jpg "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.jpg" || \
curl -L -o moon/moon_color.jpg "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.jpg" || \
wget -O moon/moon_color.jpg "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg" || \
curl -L -o moon/moon_color.jpg "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg" || \
echo "Failed to download Moon color texture"

# Moon displacement preview (NASA SVS LOLA browse image). For true elevation, fetch TIFFs from the page and convert.
wget -O moon/moon_displacement.jpg "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg" || \
curl -L -o moon/moon_displacement.jpg "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg" || \
echo "Failed to download Moon displacement preview"

echo "Downloading Sun texture..."
# Sun (SDO AIA)
wget -O sun/sun_color.jpg "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0171.jpg" || \
curl -L -o sun/sun_color.jpg "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0171.jpg" || \
echo "Failed to download Sun texture"

echo "Download complete. Listing files:"
ls -lh earth/ mars/ moon/ sun/ 2>/dev/null || echo "No files downloaded"

cat << 'EOS'

Notes:
- Mars color: tries 2K (~1000px) from USGS, falls back to 1K if needed. The ~1000px version has better detail than the 1024px fallback.
- The Mars displacement here uses a 1024px browse JPG as a lightweight stand-in for the 11 GB GeoTIFF DEM. It encodes shaded relief, not raw elevation; use small displacementScale.
- For the Moon, the ldem_3_8bit.jpg is a browse image. For accurate displacement, download one of the TIFFs from https://svs.gsfc.nasa.gov/4720/ (ldem_4, 16 or 64 ppd), then convert to PNG:
    # Requires ImageMagick
    convert ldem_64ppd_16bit.tif -auto-level -gamma 1.0 moon/moon_displacement.png
  Then place it at public/assets/moon/moon_displacement.png. Use the live terrain controls to adjust displacementScale.

For high-precision displacement maps:
- Download NASA SVS Moon Kit TIFFs (16-bit or float) and convert using convert-dem-examples.sh
- Convert Mars HRSC+MOLA blended DEM subset using the same approach
- These provide true elevation data vs the browse images

EOS
