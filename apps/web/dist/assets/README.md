# Assets

Local textures used by the web app. Sources are public domain or permissive (NASA/USGS/SDO).

Folders:

- earth: Blue Marble day map (sRGB), shallow-topo as pseudo-normal (linear), water mask as specular (linear)
- moon: LROC color mosaic (sRGB). Optional displacement (linear) from NASA SVS 4720 browse or TIFF-converted PNG.
- mars: Viking MDIM color mosaic (sRGB). Optional displacement (linear) from USGS HRSC+MOLA blended DEM browse JPG.

Notes:

- Data maps (normal/displacement/specular) are treated as linear in the renderer (no sRGB transform).
- Displacement maps require sufficient mesh segments; we use 128x64 for Moon/Mars spheres and small displacementScale.
- The provided displacement JPGs are shaded-relief previews, not raw height. For scientific accuracy, fetch TIFFs and convert to 16-bit PNGs, then replace the preview files.

See `download-textures.sh` for automated fetching and tips for converting higher-precision TIFFs to PNG.
