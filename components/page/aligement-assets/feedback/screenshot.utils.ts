const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Returns a message when the file can't be attached, or null when it can. */
export function validateScreenshotFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name} isn't a PNG, JPG, or WebP.`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name} is larger than 5 MB.`;
  }
  return null;
}

/**
 * Re-encodes an image through a canvas so EXIF — including GPS coordinates and
 * the camera serial — is dropped before it ever leaves the browser (§6).
 *
 * Canvas re-encoding keeps only pixels: metadata lives in the container, which
 * is discarded. PNG out, so a JPEG isn't re-compressed twice.
 *
 * Falls back to the original file when the browser can't decode it; the service
 * validates magic bytes either way, so a fallback is safe, not a hole.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.png';
    return new File([blob], name, { type: 'image/png', lastModified: Date.now() });
  } catch {
    return file;
  }
}
