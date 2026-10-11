const fs = require('fs');
const path = require('path');

const pdfPath = 'C:\\Users\\Maskeylick\\.gemini\\antigravity\\brain\\8c5118e6-54d7-4504-997a-49161eb95d54\\.user_uploaded\\media_1791684296924_859fb17d.pdf';
const outDir = path.join(__dirname, 'public', 'singles');

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

      if (filter.includes('DCTDecode')) {
        count++;
        const outPath = path.join(outDir, `single_obj_${objNum}_${w}x${h}.jpg`);
        fs.writeFileSync(outPath, streamBuffer);
        console.log(`Saved single JPEG: obj ${objNum} (${w}x${h}) -> single_obj_${objNum}_${w}x${h}.jpg`);
      }
    }
  }
}
