/**
 * Turns a picked image file into the same thing a screen capture produces.
 *
 * The capture pipeline downstream — region select, annotate, submit — only ever
 * sees a data URL, so an uploaded picture can enter it at exactly the point a
 * captured frame does and reuse every stage unchanged. That is the whole point
 * of the fallback: somebody whose browser cannot screen-capture still gets the
 * pin-and-draw tools, not a lesser feature.
 */

/**
 * Longest edge we keep. The annotator draws into a viewport-sized canvas and
 * the region crop shows less than that, so beyond this there is nothing to
 * gain — and a modern phone photo (4000px+, 20 MB) would otherwise sit in React
 * state as a base64 string and be redrawn on every annotation.
 */
const MAX_EDGE = 2048;

/**
 * Refused outright. Not a quality bar — downscaling handles real photos — but a
 * floor against decoding something absurd into memory before we learn its size.
 */
const MAX_BYTES = 50 * 1024 * 1024;

export class AttachImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttachImageError';
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AttachImageError('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new AttachImageError('That file isn’t an image we can read.'));
    image.src = src;
  });
}

/**
 * Reads the file, downscales it to `MAX_EDGE`, and returns a PNG data URL ready
 * for `setFreezeSrc`. An image already within bounds is returned re-encoded
 * rather than passed through, so everything downstream sees one format.
 */
export async function attachImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new AttachImageError('Choose an image file.');
  }
  if (file.size > MAX_BYTES) {
    throw new AttachImageError('That image is too large. Choose one under 50 MB.');
  }

  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const { naturalWidth: width, naturalHeight: height } = image;
  if (!width || !height) {
    throw new AttachImageError('That file isn’t an image we can read.');
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new AttachImageError('Could not read that image.');
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
