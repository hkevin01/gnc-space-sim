#!/bin/bash
# Create minimal placeholder textures using base64-encoded 1x1 pixel images

# Create directories
mkdir -p earth mars sun

# Base64 for a 1x1 blue pixel (Earth day)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==" | base64 -d > earth/earth_day.jpg

# Base64 for a 1x1 green pixel (Earth normal)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > earth/earth_normal.jpg

# Base64 for a 1x1 dark blue pixel (Earth spec)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGhgYAAABQABHb3AHQAAAABJRU5ErkJggg==" | base64 -d > earth/earth_spec.jpg

# Base64 for a 1x1 red pixel (Mars)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==" | base64 -d > mars/mars_color.jpg
cp mars/mars_color.jpg mars/mars_normal.jpg

# Base64 for a 1x1 yellow pixel (Sun)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==" | base64 -d > sun/sun_color.jpg

echo "Created placeholder texture files:"
ls -la earth/ mars/ sun/ 2>/dev/null || echo "No directories found"
