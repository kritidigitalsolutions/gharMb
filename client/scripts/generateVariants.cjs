const fs = require('fs');
const path = require('path');
const { decodePNG, encodePNG } = require('./pngHelper.cjs');

const imgPath = path.join(__dirname, '../public/favicon.png');
const { width, height, rgba } = decodePNG(imgPath);

const cx = 815;
const cy = 800;
const ringRadius = 604;

// 1. Light logo: Original colors, transparent outside the circular ring
const lightRgba = Buffer.from(rgba);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (d > ringRadius + 1.5) {
      lightRgba[idx + 3] = 0;
    } else if (d > ringRadius - 1.5) {
      const alphaFactor = Math.max(0, Math.min(1, (ringRadius + 1.5 - d) / 3));
      lightRgba[idx + 3] = Math.round(255 * alphaFactor);
    }
  }
}

// 2. Dark mode logo with dark disc (#111111, matching sidebar and admin dark theme)
// Inside: #111111 background, vibrant orange ring & roof & 'MB', crisp white 'G' and 'GHAR', light silver tagline
const darkBadgeRgba = Buffer.from(rgba);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

    if (d > ringRadius + 1.5) {
      darkBadgeRgba[idx + 3] = 0;
      continue;
    } else if (d > ringRadius - 1.5) {
      const alphaFactor = Math.max(0, Math.min(1, (ringRadius + 1.5 - d) / 3));
      darkBadgeRgba[idx + 3] = Math.round(255 * alphaFactor);
    }

    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];

    const isBackground = (r >= 236 && g >= 236 && b >= 236);
    const isOrange = (r > 160 && r > g + 30 && r > b + 40);
    const isDarkNavy = (r < 115 && g < 135 && b > r);
    const isDarkText = (r < 95 && g < 95 && b < 95 && !isDarkNavy);
    const isShadow = (r < 75 && g >= 50 && g <= 105 && b >= 70 && b <= 125);

    if (isBackground) {
      // #111111 matches exact --bg-surface in dark mode
      darkBadgeRgba[idx] = 17;
      darkBadgeRgba[idx + 1] = 17;
      darkBadgeRgba[idx + 2] = 17;
      darkBadgeRgba[idx + 3] = 255;
    } else if (isOrange) {
      darkBadgeRgba[idx] = Math.min(255, Math.round(r * 1.06));
      darkBadgeRgba[idx + 1] = Math.min(255, Math.round(g * 1.05));
      darkBadgeRgba[idx + 2] = Math.min(255, Math.round(b * 1.05));
    } else if (isDarkNavy) {
      const brightness = 255 - Math.round((r + g + b) / 3 * 0.25);
      darkBadgeRgba[idx] = Math.min(255, brightness);
      darkBadgeRgba[idx + 1] = Math.min(255, brightness);
      darkBadgeRgba[idx + 2] = Math.min(255, brightness + 5);
    } else if (isShadow) {
      darkBadgeRgba[idx] = 148;
      darkBadgeRgba[idx + 1] = 163;
      darkBadgeRgba[idx + 2] = 184;
    } else if (isDarkText) {
      darkBadgeRgba[idx] = 226;
      darkBadgeRgba[idx + 1] = 232;
      darkBadgeRgba[idx + 2] = 240;
    }
  }
}

// 3. Dark mode logo with transparent background inside and antialiased edges
const darkTransRgba = Buffer.from(rgba);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

    if (d > ringRadius + 1.5) {
      darkTransRgba[idx + 3] = 0;
      continue;
    } else if (d > ringRadius - 1.5) {
      const alphaFactor = Math.max(0, Math.min(1, (ringRadius + 1.5 - d) / 3));
      darkTransRgba[idx + 3] = Math.round(255 * alphaFactor);
    }

    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];

    const isBackground = (r >= 236 && g >= 236 && b >= 236);
    const isOrange = (r > 160 && r > g + 30 && r > b + 40);
    const isDarkNavy = (r < 115 && g < 135 && b > r);
    const isDarkText = (r < 95 && g < 95 && b < 95 && !isDarkNavy);
    const isShadow = (r < 75 && g >= 50 && g <= 105 && b >= 70 && b <= 125);

    if (isBackground) {
      darkTransRgba[idx + 3] = 0;
    } else if (isOrange) {
      darkTransRgba[idx] = Math.min(255, Math.round(r * 1.06));
      darkTransRgba[idx + 1] = Math.min(255, Math.round(g * 1.05));
      darkTransRgba[idx + 2] = Math.min(255, Math.round(b * 1.05));
    } else if (isDarkNavy) {
      const brightness = 255 - Math.round((r + g + b) / 3 * 0.25);
      darkTransRgba[idx] = Math.min(255, brightness);
      darkTransRgba[idx + 1] = Math.min(255, brightness);
      darkTransRgba[idx + 2] = Math.min(255, brightness + 5);
    } else if (isShadow) {
      darkTransRgba[idx] = 148;
      darkTransRgba[idx + 1] = 163;
      darkTransRgba[idx + 2] = 184;
    } else if (isDarkText) {
      darkTransRgba[idx] = 226;
      darkTransRgba[idx + 1] = 232;
      darkTransRgba[idx + 2] = 240;
    } else {
      // Transitional edge pixels: clean blend against dark
      const lum = (r + g + b) / 3;
      if (lum > 210) {
        darkTransRgba[idx + 3] = Math.max(0, Math.min(255, Math.round((255 - lum) * 3)));
      }
    }
  }
}

// Write the primary and dark variants
fs.writeFileSync(path.join(__dirname, '../public/favicon.png'), encodePNG(width, height, lightRgba));
fs.writeFileSync(path.join(__dirname, '../public/favicon-light.png'), encodePNG(width, height, lightRgba));
fs.writeFileSync(path.join(__dirname, '../public/favicon-dark.png'), encodePNG(width, height, darkBadgeRgba));
fs.writeFileSync(path.join(__dirname, '../public/favicon-dark-badge.png'), encodePNG(width, height, darkBadgeRgba));
fs.writeFileSync(path.join(__dirname, '../public/favicon-dark-trans.png'), encodePNG(width, height, darkTransRgba));

fs.writeFileSync(path.join(__dirname, '../public/logo.png'), encodePNG(width, height, lightRgba));
fs.writeFileSync(path.join(__dirname, '../public/logo-light.png'), encodePNG(width, height, lightRgba));
fs.writeFileSync(path.join(__dirname, '../public/logo-dark.png'), encodePNG(width, height, darkBadgeRgba));

console.log('Successfully generated all logo files with high precision!');
