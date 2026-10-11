const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to decode/read uncompressed grayscale scanlines from PNG
function decodeGrayscalePng(pngBuffer) {
  // Find IHDR
  const ihdrIdx = pngBuffer.indexOf('IHDR');
  const width = pngBuffer.readUInt32BE(ihdrIdx + 4);
  const height = pngBuffer.readUInt32BE(ihdrIdx + 8);
  
  // Find IDAT
  let idatIdx = pngBuffer.indexOf('IDAT');
  const idatChunks = [];
  while (idatIdx !== -1) {
    const len = pngBuffer.readUInt32BE(idatIdx - 4);
    idatChunks.push(pngBuffer.slice(idatIdx + 4, idatIdx + 4 + len));
    idatIdx = pngBuffer.indexOf('IDAT', idatIdx + 4 + len);
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  
  // Remove 1 filter byte per line
  const raw = Buffer.alloc(width * height);
  const rowLen = width + 1;
  for (let y = 0; y < height; y++) {
    decompressed.copy(raw, y * width, y * rowLen + 1, (y + 1) * rowLen);
  }
  return { raw, width, height };
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function createPngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}
function encodeGrayscalePng(rawPixels, width, height) {
  const rowSize = width + 1;
  const scanlines = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * rowSize] = 0;
    rawPixels.copy(scanlines, y * rowSize + 1, y * width, (y + 1) * width);
  }
  const compressed = zlib.deflateSync(scanlines);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  return Buffer.concat([sig, createPngChunk('IHDR', ihdr), createPngChunk('IDAT', compressed), createPngChunk('IEND', Buffer.alloc(0))]);
}

function crop(src, sx, sy, sw, sh) {
  const out = Buffer.alloc(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcX = Math.min(src.width - 1, Math.max(0, sx + x));
      const srcY = Math.min(src.height - 1, Math.max(0, sy + y));
      out[y * sw + x] = src.raw[srcY * src.width + srcX];
    }
  }
  return encodeGrayscalePng(out, sw, sh);
}

const bandTrioPath = path.join(__dirname, 'public', 'band', 'band_rock_8_1254x1254.png');
const trioPng = fs.readFileSync(bandTrioPath);
const decoded = decodeGrayscalePng(trioPng);

// Member 1 (Left - Frontman/Long hair/Beanie): Arief (Guitar, Vocals)
const cropArief = crop(decoded, 120, 60, 420, 480);
fs.writeFileSync(path.join(__dirname, 'public', 'band', 'member_arief.png'), cropArief);

// Member 2 (Middle - Beanie, glasses): Ganjar (Bass)
const cropGanjar = crop(decoded, 490, 180, 270, 340);
fs.writeFileSync(path.join(__dirname, 'public', 'band', 'member_ganjar.png'), cropGanjar);

// Member 3 (Right - Flannel): Kimao (Drum - user!)
const cropKimao = crop(decoded, 730, 220, 320, 400);
fs.writeFileSync(path.join(__dirname, 'public', 'band', 'member_kimao.png'), cropKimao);

console.log('Member avatars cropped successfully!');
