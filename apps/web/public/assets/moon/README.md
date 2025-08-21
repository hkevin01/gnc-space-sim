# Moon Displacement

This folder will contain Moon displacement/elevation maps.

## Current status

- **moon_color.jpg**: LROC color mosaic (sRGB)
- **moon_displacement.jpg**: Browse image from NASA SVS (8-bit preview, not true elevation)

## For accurate displacement

1. Download a TIFF from [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/):
   - `ldem_64ppd_uint16.tif` (highest resolution, ~200 MB)
   - `ldem_16ppd_uint16.tif` or `ldem_4ppd_uint16.tif` (smaller files)

2. Place the TIFF in this folder

3. Run the conversion script:

   ```bash
   bash ../convert-displacement.sh
   ```

This will create **moon_displacement.png** (16-bit) with true elevation data.

## Files

- `moon_color.jpg` - Surface color texture (sRGB)
- `moon_displacement.jpg` - Browse preview (current)
- `moon_displacement.png` - Converted 16-bit elevation (when available)
