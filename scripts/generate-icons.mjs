// One-off generator for Daymark's PWA icons. Pure Node (zlib only), no deps.
// Draws the daymark mark (ink ground, rust beacon, paper baseline and light)
// per-pixel with 3x3 supersampling and encodes RGBA PNGs by hand.
//
//   node scripts/generate-icons.mjs
//
// Writes: public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png,
//         app/apple-icon.png (180px, for the iOS home screen).

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── Minimal PNG encoder ─────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ── The mark ────────────────────────────────────────────────────────────────
// Same design as app/icon.svg, in logo space 0..32.
const INK = [0x16, 0x30, 0x2b];
const PAPER = [0xf7, 0xf5, 0xf0];
const STAMP = [0xb3, 0x49, 0x1d];

function inRoundedSquare(x, y) {
  const r = 7;
  if (x < r && y < r) return (x - r) ** 2 + (y - r) ** 2 <= r * r;
  if (x > 32 - r && y < r) return (x - (32 - r)) ** 2 + (y - r) ** 2 <= r * r;
  if (x < r && y > 32 - r) return (x - r) ** 2 + (y - (32 - r)) ** 2 <= r * r;
  if (x > 32 - r && y > 32 - r) return (x - (32 - r)) ** 2 + (y - (32 - r)) ** 2 <= r * r;
  return x >= 0 && x <= 32 && y >= 0 && y <= 32;
}

function inTriangle(x, y) {
  if (y < 6.5 || y > 22.5) return false;
  const half = (9 * (y - 6.5)) / 16; // apex (16,6.5), base half-width 9 at y=22.5
  return Math.abs(x - 16) <= half;
}

function inBaseline(x, y) {
  return x >= 6.5 && x <= 25.5 && y >= 24 && y <= 26.6;
}

function inLight(x, y) {
  return (x - 16) ** 2 + (y - 4.6) ** 2 <= 1.6 * 1.6;
}

function colorAt(x, y) {
  if (inLight(x, y)) return PAPER;
  if (inTriangle(x, y)) return STAMP;
  if (inBaseline(x, y)) return PAPER;
  return INK;
}

function drawIcon(size, { maskable = false } = {}) {
  const img = Buffer.alloc(size * size * 4);
  const SS = 3; // 3x3 supersampling
  // Maskable artwork must sit in the inner 80% safe zone.
  const box = maskable ? { x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.9 } : { x0: 0, y0: 0, x1: 1, y1: 1 };
  const span = box.x1 - box.x0;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const lx = (((px + (sx + 0.5) / SS) / size) - box.x0) / span * 32;
          const ly = (((py + (sy + 0.5) / SS) / size) - box.y0) / span * 32;
          if (lx < 0 || lx > 32 || ly < 0 || ly > 32) continue;
          if (!maskable && !inRoundedSquare(lx, ly)) continue;
          const c = colorAt(lx, ly);
          r += c[0]; g += c[1]; b += c[2]; n++;
        }
      }
      const i = (py * size + px) * 4;
      if (n === 0) {
        img[i + 3] = 0; // transparent corner outside the rounded square
      } else {
        img[i] = Math.round(r / n);
        img[i + 1] = Math.round(g / n);
        img[i + 2] = Math.round(b / n);
        img[i + 3] = 255;
      }
    }
  }
  return encodePNG(size, size, img);
}

// ── Write everything ────────────────────────────────────────────────────────
mkdirSync(join(root, "public"), { recursive: true });

const outputs = [
  ["public/icon-192.png", 192, {}],
  ["public/icon-512.png", 512, {}],
  ["public/icon-maskable-512.png", 512, { maskable: true }],
  ["app/apple-icon.png", 180, {}],
];

for (const [rel, size, opts] of outputs) {
  const png = drawIcon(size, opts);
  writeFileSync(join(root, rel), png);
  console.log(`${rel}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`);
}
