const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG encoder helper
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
  const typeAndData = chunk.slice(4, 8 + len);
  const crc = crc32(typeAndData);
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

  const compressedData = zlib.deflateSync(scanlines);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 0;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  const idatChunk = createPngChunk('IDAT', compressedData);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pdfPath = 'C:\\Users\\Maskeylick\\.gemini\\antigravity\\brain\\8c5118e6-54d7-4504-997a-49161eb95d54\\.user_uploaded\\media_1791684296924_859fb17d.pdf';
const outDir = path.join(__dirname, 'public', 'band');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const buf = fs.readFileSync(pdfPath);
const str = buf.toString('latin1');
const objRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
let match;
let count = 0;

while ((match = objRegex.exec(str)) !== null) {
  const objNum = match[1];
  const body = match[3];

  if (body.includes('/Subtype /Image') || body.includes('/Subtype/Image')) {
    const widthMatch = body.match(/\/Width\s+(\d+)/);
    const heightMatch = body.match(/\/Height\s+(\d+)/);
    const filterMatch = body.match(/\/Filter\s*(\/[A-Za-z0-9]+|\[[^\]]+\])/);

    const streamStart = body.indexOf('stream');
    const streamEnd = body.lastIndexOf('endstream');

    if (streamStart !== -1 && streamEnd !== -1) {
      let dataStart = streamStart + 6;
      if (body[dataStart] === '\r') dataStart++;
      if (body[dataStart] === '\n') dataStart++;

      let dataEnd = streamEnd;
      if (body[dataEnd - 1] === '\n') dataEnd--;
      if (body[dataEnd - 1] === '\r') dataEnd--;

      const streamBuffer = Buffer.from(body.substring(dataStart, dataEnd), 'latin1');
      const filter = filterMatch ? filterMatch[1] : '';
      const w = widthMatch ? parseInt(widthMatch[1]) : 0;
      const h = heightMatch ? parseInt(heightMatch[1]) : 0;

      if (w < 400 || h < 400) continue;

      if (filter.includes('FlateDecode')) {
        try {
          const decompressed = zlib.inflateSync(streamBuffer);
          if (decompressed.length === w * h) {
            // INVERT pixels: In PDF decode [0 255] or [1 0], 255 - val turns negative into positive!
            const inverted = Buffer.alloc(decompressed.length);
            for (let i = 0; i < decompressed.length; i++) {
              inverted[i] = 255 - decompressed[i];
            }
            count++;
            const png = encodeGrayscalePng(inverted, w, h);
            fs.writeFileSync(path.join(outDir, `band_rock_${count}_${w}x${h}.png`), png);
            console.log(`Saved inverted positive photo: band_rock_${count}_${w}x${h}.png`);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
