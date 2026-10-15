// Genera los recursos de marca a partir del logo original (public/photos/logo.jpeg):
//
//   node scripts/brand-assets.mjs
//
//   src/assets/marca/logo.png     → logo recortado en círculo, fondo transparente (header, pie, admin). Astro lo optimiza.
//   public/icon-192.png, -512.png → iconos de la app (círculo transparente)
//   public/icon-maskable-512.png  → icono "maskable" para Android: logo dentro de la zona segura, fondo blanco
//   public/apple-touch-icon.png   → icono de iPhone (180 px, fondo blanco: iOS no admite transparencia)
//   public/favicon.ico            → favicon 16, 32 y 48 px
//   public/og-logo.png            → logo para compartir y JSON-LD (512 px, fondo blanco)

import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'public/photos/logo.jpeg';
const meta = await sharp(SRC).metadata();
const size = Math.min(meta.width, meta.height);

// El logo es un círculo sobre fondo blanco: una máscara circular quita las esquinas.
const mask = Buffer.from(
  `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
);
const circle = await sharp(SRC)
  .resize(size, size, { fit: 'cover' })
  .ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

// Paleta de 256 colores con difuminado: en una ilustración plana no se nota y pesa varias veces menos.
const PNG = { compressionLevel: 9, palette: true, quality: 90, effort: 10 };

const png = (px) => sharp(circle).resize(px, px).png(PNG).toBuffer();

/** El logo a `ratio` del lienzo, centrado sobre fondo blanco. */
async function onWhite(px, ratio) {
  const inner = Math.round(px * ratio);
  return sharp({ create: { width: px, height: px, channels: 4, background: '#ffffff' } })
    .composite([{ input: await png(inner), gravity: 'center' }])
    .png(PNG)
    .toBuffer();
}

/** ICO con varias imágenes PNG dentro (formato admitido por todos los navegadores actuales). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { px, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(px >= 256 ? 0 : px, 0);
    e.writeUInt8(px >= 256 ? 0 : px, 1);
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

mkdirSync('src/assets/marca', { recursive: true });
const out = {
  'src/assets/marca/logo.png': await png(512),
  'public/icon-192.png': await png(192),
  'public/icon-512.png': await png(512),
  'public/icon-maskable-512.png': await onWhite(512, 0.8),
  'public/apple-touch-icon.png': await onWhite(180, 0.92),
  'public/og-logo.png': await onWhite(512, 0.94),
  'public/favicon.ico': ico([
    { px: 16, data: await png(16) },
    { px: 32, data: await png(32) },
    { px: 48, data: await png(48) },
  ]),
};
for (const [file, data] of Object.entries(out)) {
  writeFileSync(file, data);
  console.log(`✓ ${file.padEnd(32)} ${(data.length / 1024).toFixed(1)} KB`);
}
