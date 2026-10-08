const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function encodePNG(width, height, rgbaBuffer) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const stride = 1 + width * 4;
  const rawScanlines = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    rawScanlines[y * stride] = 0;
    rgbaBuffer.copy(rawScanlines, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcInput = Buffer.alloc(4 + len);
  crcInput.write(type, 0, 4, 'ascii');
  data.copy(crcInput, 4);
  const crcVal = crc32(crcInput);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8, idatChunks = [], width = 0, height = 0, colorType = 2;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      colorType = buf[pos + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = 1 + width * bytesPerPixel;
  const raw = Buffer.alloc(width * height * bytesPerPixel);

  for (let y = 0; y < height; y++) {
    const filter = decomp[y * stride];
    const rowStart = y * stride + 1;
    for (let x = 0; x < width * bytesPerPixel; x++) {
      let val = decomp[rowStart + x];
      let a = x >= bytesPerPixel ? raw[y * width * bytesPerPixel + x - bytesPerPixel] : 0;
      let b = y > 0 ? raw[(y - 1) * width * bytesPerPixel + x] : 0;
      let c = (x >= bytesPerPixel && y > 0) ? raw[(y - 1) * width * bytesPerPixel + x - bytesPerPixel] : 0;
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (val + pr) & 0xff;
      }
      raw[y * width * bytesPerPixel + x] = val;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * bytesPerPixel;
      const dstIdx = (y * width + x) * 4;
      rgba[dstIdx] = raw[srcIdx];
      rgba[dstIdx + 1] = raw[srcIdx + 1];
      rgba[dstIdx + 2] = raw[srcIdx + 2];
      rgba[dstIdx + 3] = bytesPerPixel === 4 ? raw[srcIdx + 3] : 255;
    }
  }
  return { width, height, rgba };
}

module.exports = { decodePNG, encodePNG };
