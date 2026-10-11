const fs = require('fs');
const path = require('path');

const pdfPath = 'C:\\Users\\Maskeylick\\.gemini\\antigravity\\brain\\8c5118e6-54d7-4504-997a-49161eb95d54\\.user_uploaded\\media_1791684296924_859fb17d.pdf';
const outDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const buffer = fs.readFileSync(pdfPath);
console.log('PDF length:', buffer.length);

// Extract JPEG streams by searching for SOI (FF D8) and EOI (FF D9)
let count = 0;
let pos = 0;
while (pos < buffer.length - 4) {
  if (buffer[pos] === 0xFF && buffer[pos+1] === 0xD8 && buffer[pos+2] === 0xFF) {
    // Found JPEG SOI
    const start = pos;
    let end = start + 3;
    while (end < buffer.length - 1) {
      if (buffer[end] === 0xFF && buffer[end+1] === 0xD9) {
        // EOI found
        end += 2;
        break;
      }
      end++;
    }
    const jpegData = buffer.slice(start, end);
    // Ignore small thumbnails (under 5KB)
    if (jpegData.length > 5000) {
      count++;
      const fileName = `extracted_${count}_${jpegData.length}.jpg`;
      fs.writeFileSync(path.join(outDir, fileName), jpegData);
      console.log(`Saved ${fileName} (${jpegData.length} bytes)`);
    }
    pos = end;
  } else {
    pos++;
  }
}

console.log(`Extraction complete. Total JPEGs found: ${count}`);
