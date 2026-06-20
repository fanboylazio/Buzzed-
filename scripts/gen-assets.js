/**
 * Genera PNGs placeholder de marca (fondo negro, círculo azul) para que la app
 * tenga icono/splash válidos sin depender de librerías externas.
 * Uso: node scripts/gen-assets.js
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Paleta de marca.
const BG = [10, 10, 11]; // negro (#0A0A0B)
const ACCENT = [56, 189, 248]; // azul claro (#38BDF8)

/** Crea un buffer PNG RGBA de tamaño size con un círculo central de color accent. */
function makePng(size, withCircle) {
  const channels = 4;
  const raw = Buffer.alloc((size * channels + 1) * size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.28;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * channels + 1);
    raw[rowStart] = 0; // filtro "none" por fila
    for (let x = 0; x < size; x++) {
      const i = rowStart + 1 + x * channels;
      const inside = withCircle && (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      const [rr, gg, bb] = inside ? ACCENT : BG;
      raw[i] = rr;
      raw[i + 1] = gg;
      raw[i + 2] = bb;
      raw[i + 3] = 255;
    }
  }

  const idat = zlib.deflateSync(raw);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// CRC32 (tabla estándar PNG).
const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const outputs = [
  ['icon.png', 1024, true],
  ['adaptive-icon.png', 1024, true],
  ['splash.png', 1284, true],
  ['favicon.png', 48, true],
];

for (const [name, size, circle] of outputs) {
  fs.writeFileSync(path.join(assetsDir, name), makePng(size, circle));
  console.log('Generado assets/' + name + ' (' + size + 'px)');
}
