import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, getPixel) {
  // RGBA buffer with 1 filter byte per scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
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

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Emerald Neighborhood Community icon
function neighborhoodIconPixel(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);

  // Background: rich emerald green gradient (#16a34a to #0f766e)
  const bgR = Math.round(22 - (ny * 7));
  const bgG = Math.round(163 - (ny * 45));
  const bgB = Math.round(74 + (ny * 36));

  // If not maskable, rounded square mask with subtle border
  if (!isMaskable) {
    const rx = Math.abs(nx - 0.5) * 2;
    const ry = Math.abs(ny - 0.5) * 2;
    const cornerDist = Math.max(rx - 0.6, 0) ** 2 + Math.max(ry - 0.6, 0) ** 2;
    if (cornerDist > 0.16) {
      return [0, 0, 0, 0];
    }
  }

  // Pond wave at bottom (y: 0.7 to 0.85)
  if (ny > 0.72 && ny < 0.84) {
    const wave = Math.sin(nx * Math.PI * 2) * 0.03 + 0.78;
    if (Math.abs(ny - wave) < 0.04 && nx > 0.2 && nx < 0.8) {
      return [56, 189, 248, 255]; // Light blue pond water
    }
  }

  // Center house roof (triangle)
  const roofPeakX = 0.5;
  const roofPeakY = 0.28;
  const roofSlope = 0.8;
  const inRoof = (ny >= roofPeakY && ny <= 0.48 && Math.abs(nx - roofPeakX) <= (ny - roofPeakY) * roofSlope);
  if (inRoof) {
    return [255, 255, 255, 255]; // Crisp white roof
  }

  // Center house body
  if (ny >= 0.48 && ny <= 0.72 && Math.abs(nx - 0.5) <= 0.15) {
    // Doorway
    if (ny >= 0.58 && Math.abs(nx - 0.5) <= 0.05) {
      return [21, 128, 61, 255]; // Dark emerald door
    }
    // Window
    if (ny >= 0.50 && ny <= 0.55 && Math.abs(nx - 0.5) <= 0.05) {
      return [254, 240, 138, 255]; // Warm glowing light
    }
    return [248, 250, 252, 255]; // Light wall
  }

  // Left house
  const lRoofIn = (ny >= 0.40 && ny <= 0.52 && Math.abs(nx - 0.28) <= (ny - 0.40) * 0.9);
  if (lRoofIn) {
    return [241, 245, 249, 240];
  }
  if (ny >= 0.52 && ny <= 0.72 && Math.abs(nx - 0.28) <= 0.10) {
    if (ny >= 0.56 && ny <= 0.62 && Math.abs(nx - 0.28) <= 0.04) {
      return [15, 118, 110, 255]; // Window
    }
    return [226, 232, 240, 240];
  }

  // Right house
  const rRoofIn = (ny >= 0.40 && ny <= 0.52 && Math.abs(nx - 0.72) <= (ny - 0.40) * 0.9);
  if (rRoofIn) {
    return [241, 245, 249, 240];
  }
  if (ny >= 0.52 && ny <= 0.72 && Math.abs(nx - 0.72) <= 0.10) {
    if (ny >= 0.56 && ny <= 0.62 && Math.abs(nx - 0.72) <= 0.04) {
      return [15, 118, 110, 255]; // Window
    }
    return [226, 232, 240, 240];
  }

  // Heart badge at top right
  const hdist = Math.sqrt((nx - 0.74) ** 2 + (ny - 0.24) ** 2);
  if (hdist < 0.065) {
    return [239, 68, 68, 255]; // Warm red badge
  }

  return [bgR, bgG, bgB, 255];
}

console.log('Generating PNG icons...');
const p192 = createPng(192, 192, (x, y, w, h) => neighborhoodIconPixel(x, y, w, h, false));
const p512 = createPng(512, 512, (x, y, w, h) => neighborhoodIconPixel(x, y, w, h, false));
const pMask = createPng(512, 512, (x, y, w, h) => neighborhoodIconPixel(x, y, w, h, true));
const appleIcon = createPng(180, 180, (x, y, w, h) => neighborhoodIconPixel(x, y, w, h, false));

fs.writeFileSync('public/pwa-192x192.png', p192);
fs.writeFileSync('public/pwa-512x512.png', p512);
fs.writeFileSync('public/pwa-maskable-512x512.png', pMask);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);
fs.writeFileSync('public/favicon.ico', appleIcon);

console.log('PWA icons successfully written to public/');
