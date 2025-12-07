/*
 * Simple Node script to create a favicon.ico containing a single PNG image (logo_blue.png)
 * This writes an ICO file that embeds a 32x32 PNG image.
 * Usage: node scripts/generate-favicon.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const src = path.join(__dirname, '..', 'public', 'logo_blue.png');
const dst = path.join(__dirname, '..', 'public', 'favicon.ico');

function writeIcoFromPng(pngBuffer, outPath) {
  // ICO header (6 bytes): 0, 0, 1, 0, count low, count high
  const count = 1;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type (1 for icon)
  header.writeUInt16LE(count, 4); // count

  // Directory entry (16 bytes)
  // Width (1), Height (1), ColorCount (1), Reserved(1), Planes(2), BitCount(2), BytesInRes(4), ImageOffset(4)
  const entry = Buffer.alloc(16);
  const pngSize = pngBuffer.length;
  const imageOffset = header.length + entry.length; // 6 + 16 = 22
  // width and height 32; if 256 use 0, but our png will be 32
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bitcount
  entry.writeUInt32LE(pngSize, 8); // bytes in resource
  entry.writeUInt32LE(imageOffset, 12); // image offset

  const out = Buffer.concat([header, entry, pngBuffer]);
  fs.writeFileSync(outPath, out);
}

async function main() {
  if (!fs.existsSync(src)) {
    console.error('Source image not found:', src);
    process.exit(1);
  }
  // Generate PNG sizes for favicon usage
  try {
    const png16 = await sharp(src).resize(16, 16, { fit: 'cover' }).png().toBuffer();
    const png32 = await sharp(src).resize(32, 32, { fit: 'cover' }).png().toBuffer();
    const png180 = await sharp(src).resize(180, 180, { fit: 'cover' }).png().toBuffer();
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon-16.png'), png16);
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon-32.png'), png32);
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon-180.png'), png180);

    // Use the 32x32 PNG as the single PNG entry for the ICO
    writeIcoFromPng(png32, dst);
    console.log('favicon.ico generated at', dst);
  } catch (err) {
    console.error('Failed to generate PNG variants or ICO:', err);
    process.exit(1);
  }
}

main();
