/**
 * Image Optimization Utility
 * High-performance, production-grade image compression using Sharp.
 * - Resizes large images (max 1920x1920) preserving aspect ratio
 * - Auto-orients photos using EXIF data (fixes rotated phone camera pictures)
 * - Converts to optimized WebP format (smaller file size, high visual fidelity)
 * - Strips bulky EXIF metadata
 * - Safely passes through documents (PDF, DOCX) and vector/animated graphics (SVG, GIF)
 */

const sharp = require('sharp');
const path = require('path');

/**
 * Optimizes an image buffer using Sharp.
 * 
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} originalname - Original file name (e.g. 'photo.jpg')
 * @param {string} mimetype - Original MIME type (e.g. 'image/jpeg')
 * @param {Object} options - Custom resize & quality options
 * @returns {Promise<{ buffer: Buffer, mimetype: string, filename: string, wasOptimized: boolean, originalSize: number, optimizedSize: number }>}
 */
async function optimizeImage(buffer, originalname = 'image.jpg', mimetype = 'image/jpeg', options = {}) {
  const isImage = (mimetype && mimetype.startsWith('image/')) || /\.(jpe?g|png|webp|avif|tiff)$/i.test(originalname);
  const isSvgOrGif = mimetype === 'image/svg+xml' || mimetype === 'image/gif' || /\.(svg|gif)$/i.test(originalname);

  // Pass through non-optimizable files directly (PDF, DOC, SVG, GIF, etc.)
  if (!isImage || isSvgOrGif || !buffer || !Buffer.isBuffer(buffer)) {
    return {
      buffer,
      mimetype: mimetype || 'application/octet-stream',
      filename: originalname,
      wasOptimized: false,
      originalSize: buffer ? buffer.length : 0,
      optimizedSize: buffer ? buffer.length : 0,
    };
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 82,
    effort = 4,
    convertToWebp = true,
  } = options;

  try {
    const pipeline = sharp(buffer, { failOn: 'none' })
      .rotate() // Automatically rotate according to EXIF Orientation tag
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });

    let optimizedBuffer;
    let outMimetype;
    let outExt;

    if (convertToWebp) {
      optimizedBuffer = await pipeline
        .webp({ quality, effort, smartSubsample: true })
        .toBuffer();
      outMimetype = 'image/webp';
      outExt = '.webp';
    } else {
      optimizedBuffer = await pipeline
        .jpeg({ quality, mozjpeg: true, progressive: true })
        .toBuffer();
      outMimetype = 'image/jpeg';
      outExt = '.jpg';
    }

    // Replace extension in filename if converted
    const parsed = path.parse(originalname);
    const newFilename = `${parsed.name}${outExt}`;

    console.log(
      `⚡ Optimized "${originalname}" (${(buffer.length / 1024).toFixed(1)} KB) -> "${newFilename}" (${(optimizedBuffer.length / 1024).toFixed(1)} KB) [${Math.round((1 - optimizedBuffer.length / buffer.length) * 100)}% smaller]`
    );

    return {
      buffer: optimizedBuffer,
      mimetype: outMimetype,
      filename: newFilename,
      wasOptimized: true,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
    };
  } catch (err) {
    console.warn(`⚠️ Image optimization bypassed for "${originalname}":`, err.message);
    return {
      buffer,
      mimetype,
      filename: originalname,
      wasOptimized: false,
      originalSize: buffer.length,
      optimizedSize: buffer.length,
    };
  }
}

module.exports = {
  optimizeImage,
};
