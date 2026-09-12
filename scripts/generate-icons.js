import fs from 'fs';
import { PNG } from 'pngjs';

function createIcon(size, filename, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark slate background #0b0f19
      png.data[idx] = 11;      // R
      png.data[idx + 1] = 15;  // G
      png.data[idx + 2] = 25;  // B
      png.data[idx + 3] = 255; // A

      // Outer boundary frame for non-maskable or inner safe zone
      const margin = isMaskable ? size * 0.15 : size * 0.08;
      if (x >= margin && x <= size - margin && y >= margin && y <= size - margin) {
        // Grid pattern
        if ((x % Math.round(size / 8) === 0) || (y % Math.round(size / 8) === 0)) {
          png.data[idx] = 30;
          png.data[idx + 1] = 41;
          png.data[idx + 2] = 59;
        }

        // Plotter gantry horizontal bar
        if (Math.abs(y - center) < size * 0.035) {
          png.data[idx] = 51;
          png.data[idx + 1] = 65;
          png.data[idx + 2] = 85;
        }

        // Pen carriage
        if (Math.abs(x - center) < size * 0.08 && Math.abs(y - center) < size * 0.08) {
          png.data[idx] = 6;
          png.data[idx + 1] = 182;
          png.data[idx + 2] = 212; // Cyan accent
        }

        // Pen needle glowing tip
        if (Math.abs(x - center) < size * 0.02 && Math.abs(y - center + size * 0.05) < size * 0.04) {
          png.data[idx] = 245;
          png.data[idx + 1] = 158;
          png.data[idx + 2] = 11; // Amber tip
        }

        // Diagonal vector drawn line
        const lineDist = Math.abs(dx - dy * 0.5);
        if (lineDist < size * 0.025 && dist < radius) {
          png.data[idx] = 56;
          png.data[idx + 1] = 189;
          png.data[idx + 2] = 248; // Sky blue
        }
      }

      // Rounded border highlight for standalone icon
      if (!isMaskable) {
        const borderDist = Math.abs(dist - radius);
        if (borderDist < 2) {
          png.data[idx] = 6;
          png.data[idx + 1] = 182;
          png.data[idx + 2] = 212;
        }
      }
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

createIcon(192, 'public/pwa-192x192.png', false);
createIcon(512, 'public/pwa-512x512.png', false);
createIcon(512, 'public/pwa-maskable-512x512.png', true);
createIcon(180, 'public/apple-touch-icon.png', false);
