#!/usr/bin/env python3
"""Generate placeholder texture images for Earth, Mars, and Sun."""
import os
from PIL import Image, ImageDraw
import colorsys

def create_earth_texture(size=(512, 256)):
    """Create a simple Earth-like texture with blue oceans and green/brown landmasses."""
    img = Image.new('RGB', size, (30, 60, 120))  # Deep blue base
    draw = ImageDraw.Draw(img)

    # Add some continent-like shapes
    for i in range(8):
        x = (i * size[0] // 8) + (i * 20) % size[0]
        y = size[1] // 4 + (i * 30) % (size[1] // 2)
        w = 40 + (i * 15) % 80
        h = 20 + (i * 10) % 40
        color = (34, 85, 34) if i % 2 else (101, 67, 33)  # Green or brown
        draw.ellipse([x, y, x+w, y+h], fill=color)

    return img

def create_mars_texture(size=(512, 256)):
    """Create a Mars-like reddish texture."""
    img = Image.new('RGB', size, (160, 82, 45))  # Rusty base
    draw = ImageDraw.Draw(img)

    # Add crater-like features
    for i in range(12):
        x = (i * 47) % size[0]
        y = (i * 37) % size[1]
        r = 15 + (i * 7) % 25
        color = (120 + (i * 10) % 40, 60 + (i * 8) % 30, 30 + (i * 5) % 20)
        draw.ellipse([x-r, y-r, x+r, y+r], fill=color)

    return img

def create_sun_texture(size=(512, 512)):
    """Create a Sun-like bright yellow/orange texture with solar activity."""
    img = Image.new('RGB', size, (255, 200, 50))  # Bright yellow base
    draw = ImageDraw.Draw(img)

    # Add solar flare-like patterns
    center_x, center_y = size[0] // 2, size[1] // 2
    for i in range(20):
        angle = i * 18  # degrees
        r1 = 50 + (i * 13) % 100
        r2 = r1 + 30

        # Convert polar to cartesian
        import math
        x1 = center_x + r1 * math.cos(math.radians(angle))
        y1 = center_y + r1 * math.sin(math.radians(angle))
        x2 = center_x + r2 * math.cos(math.radians(angle))
        y2 = center_y + r2 * math.sin(math.radians(angle))

        color = (255, 150 + (i * 10) % 100, 20)
        draw.line([x1, y1, x2, y2], fill=color, width=3)

    return img

def main():
    # Create assets directories
    os.makedirs('earth', exist_ok=True)
    os.makedirs('mars', exist_ok=True)
    os.makedirs('sun', exist_ok=True)

    # Generate Earth textures
    earth_day = create_earth_texture()
    earth_day.save('earth/earth_day.jpg', 'JPEG', quality=85)

    # Earth normal (just a copy for now)
    earth_day.save('earth/earth_normal.jpg', 'JPEG', quality=85)

    # Earth specular (blue-dominated for water)
    earth_spec = Image.new('RGB', (512, 256), (20, 40, 100))
    earth_spec.save('earth/earth_spec.jpg', 'JPEG', quality=85)

    # Generate Mars textures
    mars_color = create_mars_texture()
    mars_color.save('mars/mars_color.jpg', 'JPEG', quality=85)
    mars_color.save('mars/mars_normal.jpg', 'JPEG', quality=85)

    # Generate Sun texture
    sun_color = create_sun_texture()
    sun_color.save('sun/sun_color.jpg', 'JPEG', quality=85)

    print("Generated placeholder textures:")
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.jpg'):
                path = os.path.join(root, file)
                size = os.path.getsize(path)
                print(f"  {path}: {size} bytes")

if __name__ == '__main__':
    main()
