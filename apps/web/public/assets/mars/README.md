# Mars Assets

Mars surface textures and elevation data.

## Current files

- **mars_color.jpg**: Viking MDIM 2.1 colorized mosaic (2K preferred, 1K fallback)
- **mars_normal.jpg**: Copy of color map as placeholder normal
- **mars_displacement.jpg**: HRSC+MOLA DEM browse preview (shaded relief, not true elevation)

## Higher resolution

The download script now tries the 2K Viking color mosaic first:

- 2K: `mars_viking_mdim21_clrmosaic_1km.jpg` (~2000px, better detail)
- 1K fallback: Previous 1024px version

## Accurate displacement maps

For true elevation data:

1. The full HRSC+MOLA blended DEM is 11 GB (200m/pixel globally)
2. Consider extracting a region of interest from the TIF
3. Convert using:

   ```bash
   # Extract region (example: Olympus Mons area)
   gdal_translate -projwin -150 30 -110 -10 Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif mars_subset.tif

   # Convert to 16-bit PNG
   convert mars_subset.tif -auto-level -define png:bit-depth=16 mars_displacement.png
   ```

4. Or use the browse JPG with small displacement scale (current default)

## Files

- `mars_color.jpg` - Surface color texture (sRGB)
- `mars_normal.jpg` - Normal map placeholder
- `mars_displacement.jpg` - Browse preview (current)
- `mars_displacement.png` - Converted 16-bit elevation (when available)
