/**
 * Client-Side Image Compression Utility (Webpage)
 * High-performance, browser-native image optimization using HTML Canvas.
 */

export async function compressImage(file, options = {}) {
  if (!file) return file;

  const mimeType = file.type || '';
  if (!mimeType.startsWith('image/')) {
    return file;
  }

  if (mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
    return file;
  }

  if (file.size && file.size < 120 * 1024) {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    outputType = 'image/webp',
  } = options;

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => resolve(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => resolve(file);
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (!width || !height) return resolve(file);

            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) return resolve(file);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const isWebpSupported =
              canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            const targetFormat =
              outputType === 'image/webp' && isWebpSupported
                ? 'image/webp'
                : 'image/jpeg';
            const targetExt = targetFormat === 'image/webp' ? '.webp' : '.jpg';

            canvas.toBlob(
              (blob) => {
                if (!blob || (file.size && blob.size >= file.size)) {
                  return resolve(file);
                }

                const originalName = file.name || 'image.jpg';
                const baseName = originalName.replace(/\.[^/.]+$/, '');
                const compressedName = `${baseName}${targetExt}`;

                const optimizedFile = new File([blob], compressedName, {
                  type: targetFormat,
                  lastModified: Date.now(),
                });

                resolve(optimizedFile);
              },
              targetFormat,
              quality
            );
          } catch (_) {
            resolve(file);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (_) {
      resolve(file);
    }
  });
}

export async function compressMultipleImages(files, options = {}) {
  if (!files || !files.length) return [];
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map((f) => compressImage(f, options)));
}
