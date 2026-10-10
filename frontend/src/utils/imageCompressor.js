/**
 * Mobile-First Client-Side Image Compressor
 * Resizes and compresses multi-megabyte mobile camera photos into lightweight WebP/JPEG files (<250KB)
 * directly in the browser before upload or offline queue storage.
 */

/**
 * Format bytes into human-readable string (e.g. "1.4 MB", "180 KB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Convert Data URL to binary Blob
 */
export function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Convert Blob to Data URL
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Load any image source into an HTMLImageElement
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
      return resolve(source);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for compression'));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      reject(new Error('Unsupported image source type'));
    }
  });
}

/**
 * Check if the browser supports canvas.toDataURL('image/webp')
 */
function isWebpSupported() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  } catch (e) {
    return false;
  }
}

/**
 * Compress an image from file, blob, or data URL
 *
 * @param {File|Blob|string|HTMLVideoElement} source
 * @param {Object} options
 * @param {number} [options.maxWidth=1280] - Maximum width constraint (e.g. 1280 for HD)
 * @param {number} [options.maxHeight=1280] - Maximum height constraint
 * @param {number} [options.quality=0.76] - Compression quality between 0.1 and 1.0
 * @param {string} [options.format='image/webp'] - 'image/webp' or 'image/jpeg'
 * @param {string} [options.fileName='photo.webp'] - Output filename if returning a File
 * @returns {Promise<{
 *   dataUrl: string,
 *   blob: Blob,
 *   file: File,
 *   originalBytes: number,
 *   compressedBytes: number,
 *   savingsPercent: number,
 *   width: number,
 *   height: number,
 *   format: string
 * }>}
 */
export async function compressImage(source, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.76,
    format = 'image/webp',
    fileName = 'capture.webp'
  } = options;

  let originalBytes = 0;
  if (source instanceof Blob || source instanceof File) {
    originalBytes = source.size;
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    originalBytes = Math.round((source.length * 3) / 4);
  }

  // Handle HTMLVideoElement directly (e.g. live camera snap)
  let imgWidth = 0;
  let imgHeight = 0;
  let drawSource = null;

  if (source instanceof HTMLVideoElement) {
    imgWidth = source.videoWidth || source.clientWidth || 1280;
    imgHeight = source.videoHeight || source.clientHeight || 720;
    drawSource = source;
    if (!originalBytes) originalBytes = imgWidth * imgHeight * 3; // uncompressed frame estimate
  } else {
    const loadedImg = await loadImage(source);
    imgWidth = loadedImg.naturalWidth || loadedImg.width;
    imgHeight = loadedImg.naturalHeight || loadedImg.height;
    drawSource = loadedImg;
  }

  // Calculate proportional dimensions
  let targetWidth = imgWidth;
  let targetHeight = imgHeight;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Draw to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Use crisp image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // White background for transparent PNG inputs converted to JPEG/WebP
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw scaled frame
  ctx.drawImage(drawSource, 0, 0, targetWidth, targetHeight);

  // Determine output MIME format
  const chosenFormat = format === 'image/webp' && isWebpSupported() ? 'image/webp' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(chosenFormat, quality);
  const blob = dataUrlToBlob(dataUrl);

  const cleanFileName = fileName.replace(/\.[^/.]+$/, '') + (chosenFormat === 'image/webp' ? '.webp' : '.jpg');
  const file = new File([blob], cleanFileName, { type: chosenFormat, lastModified: Date.now() });

  const compressedBytes = blob.size;
  const savingsPercent = originalBytes > compressedBytes 
    ? Math.round(((originalBytes - compressedBytes) / originalBytes) * 100) 
    : 0;

  // Clean object URL if created
  if (source instanceof Blob && drawSource?.src?.startsWith('blob:')) {
    URL.revokeObjectURL(drawSource.src);
  }

  return {
    dataUrl,
    blob,
    file,
    originalBytes,
    compressedBytes,
    savingsPercent,
    width: targetWidth,
    height: targetHeight,
    format: chosenFormat
  };
}

export default compressImage;
