#!/usr/bin/env python3
"""Generate a realistic Earth texture using PIL/Pillow"""

import math
import random
from PIL import Image, ImageDraw

def create_earth_texture(width=1024, height=512):
    """Create a simple but Earth-like texture"""

    # Create base image
    img = Image.new('RGB', (width, height), (0, 0, 128))  # Ocean blue
    draw = ImageDraw.Draw(img)

    # Generate continents using simple shapes and noise
    continent_color = (34, 139, 34)  # Forest green
    desert_color = (160, 82, 45)     # Saddle brown
    ice_color = (255, 255, 255)      # White

    # Draw large continent shapes
    continents = [
        # North America-like
        [(int(width * 0.15), int(height * 0.25)), (int(width * 0.35), int(height * 0.45))],
        # Europe/Asia-like
        [(int(width * 0.45), int(height * 0.2)), (int(width * 0.85), int(height * 0.5))],
        # Africa-like
        [(int(width * 0.45), int(height * 0.45)), (int(width * 0.65), int(height * 0.75))],
        # South America-like
        [(int(width * 0.25), int(height * 0.5)), (int(width * 0.4), int(height * 0.85))],
        # Australia-like
        [(int(width * 0.75), int(height * 0.65)), (int(width * 0.85), int(height * 0.75))],
    ]

    # Draw continents
    for (x1, y1), (x2, y2) in continents:
        # Create irregular continent shape
        points = []
        steps = 20
        for i in range(steps):
            angle = 2 * math.pi * i / steps
            # Add noise to make irregular coastlines
            noise = random.uniform(0.8, 1.2)
            x = x1 + (x2 - x1) * 0.5 + noise * (x2 - x1) * 0.4 * math.cos(angle)
            y = y1 + (y2 - y1) * 0.5 + noise * (y2 - y1) * 0.4 * math.sin(angle)
            points.append((int(x), int(y)))

        # Choose color based on latitude (approximate)
        if y1 < height * 0.3 or y1 > height * 0.7:
            color = ice_color if y1 < height * 0.15 or y1 > height * 0.85 else continent_color
        else:
            color = desert_color if random.random() < 0.3 else continent_color

        draw.polygon(points, fill=color)

    # Add polar ice caps
    draw.ellipse([0, 0, width, int(height * 0.15)], fill=ice_color)
    draw.ellipse([0, int(height * 0.85), width, height], fill=ice_color)

    # Add some cloud-like white patches
    for _ in range(50):
        x = random.randint(0, width - 50)
        y = random.randint(0, height - 50)
        w = random.randint(20, 80)
        h = random.randint(10, 40)
        alpha = random.randint(30, 100)

        # Create semi-transparent white overlay for clouds
        cloud = Image.new('RGBA', (w, h), (255, 255, 255, alpha))
        img.paste(cloud, (x, y), cloud)

    return img

if __name__ == "__main__":
    # Generate Earth day texture
    earth_texture = create_earth_texture(1024, 512)
    earth_texture.save("earth_day.jpg", "JPEG", quality=95)

    # Generate a simple normal map (just convert to grayscale and enhance contrast)
    normal_base = earth_texture.convert('L')
    normal_map = Image.new('RGB', normal_base.size)
    for x in range(normal_base.width):
        for y in range(normal_base.height):
            # Simple height-based normal mapping
            height_val = normal_base.getpixel((x, y))
            # Convert height to normal (simplified)
            r = 128 + (height_val - 128) // 4
            g = 128 - (height_val - 128) // 4
            b = 255  # Z component pointing up
            normal_map.putpixel((x, y), (r, g, b))

    normal_map.save("earth_normal.jpg", "JPEG", quality=95)

    # Generate specular map (water = shiny, land = rough)
    spec_map = Image.new('RGB', earth_texture.size)
    for x in range(earth_texture.width):
        for y in range(earth_texture.height):
            r, g, b = earth_texture.getpixel((x, y))
            # Water (blue) is shiny, land is rough
            if b > r and b > g and b > 100:  # Water
                spec_val = 255
            else:  # Land
                spec_val = 32
            spec_map.putpixel((x, y), (spec_val, spec_val, spec_val))

    spec_map.save("earth_spec.jpg", "JPEG", quality=95)

    print("Generated Earth textures: earth_day.jpg, earth_normal.jpg, earth_spec.jpg")
