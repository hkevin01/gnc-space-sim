#!/usr/bin/env node
// Generate simple PPM texture files that can be converted to JPEG
const fs = require('fs');
const path = require('path');

// Create directories
const dirs = ['earth', 'mars', 'sun'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate PPM format (simple RGB format that browsers can handle)
function generatePPM(width, height, colorFn, filename) {
  const header = `P3\n${width} ${height}\n255\n`;
  let data = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorFn(x, y, width, height);
      data += `${r} ${g} ${b} `;
    }
    data += '\n';
  }

  fs.writeFileSync(filename, header + data);
  console.log(`Created ${filename} (${width}x${height})`);
}

// Earth: blue with some green continents
generatePPM(64, 32, (x, y, w, h) => {
  const isLand = (x + y) % 7 < 2 && Math.sin(x * 0.3) * Math.cos(y * 0.5) > 0.3;
  return isLand ? [34, 85, 34] : [30, 60, 120];
}, 'earth/earth_day.ppm');

generatePPM(64, 32, (x, y) => [64, 128, 64], 'earth/earth_normal.ppm');
generatePPM(64, 32, (x, y) => [20, 40, 100], 'earth/earth_spec.ppm');

// Mars: reddish with variations
generatePPM(64, 32, (x, y, w, h) => {
  const variation = Math.sin(x * 0.2) * Math.cos(y * 0.3) * 30;
  return [160 + variation, 82 + variation/2, 45 + variation/3];
}, 'mars/mars_color.ppm');

generatePPM(64, 32, (x, y, w, h) => {
  const variation = Math.sin(x * 0.2) * Math.cos(y * 0.3) * 20;
  return [140 + variation, 72 + variation/2, 35 + variation/3];
}, 'mars/mars_normal.ppm');

// Sun: bright yellow/orange
generatePPM(64, 64, (x, y, w, h) => {
  const centerX = w / 2, centerY = h / 2;
  const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const intensity = Math.max(0, 1 - dist / (w / 2));
  return [255, 200 - intensity * 50, 50 + intensity * 100];
}, 'sun/sun_color.ppm');

console.log('Generated PPM texture files.');
