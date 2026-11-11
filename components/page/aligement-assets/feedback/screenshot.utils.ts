const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateScreenshotFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name} isn't a PNG, JPG, or WebP.`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name} is larger than 5 MB.`;
  }
  return null;
}

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
