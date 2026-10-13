import { IMAGE_FLOATS } from '@/utils/richText/imageFloats';
import { imageFloatClass } from '@/utils/richText/imageFloatClass';

/**
 * Move an image to another index in the document, and report where it landed.
 *
 * An embed cannot be relocated by moving its DOM node: Quill would never hear
 * about it, so the new position would not reach the delta and would not
 * survive a save. It is deleted and re-inserted instead, which means Quill
 * builds a NEW `<img>` element — every caller holding the old one has to look
 * the replacement up again.
 *
 * The image's own formats are carried across by hand rather than through
 * `getFormat`, which would also report the formats of the block it is leaving
 * (its alignment, its heading level) — those belong to the paragraph, not to
 * the image.
 */
export function moveImageEmbed(editor: any, image: HTMLImageElement, fromIndex: number, toIndex: number): number {
  // Deleting the embed first shifts every later index down by one.
  const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
  if (insertAt === fromIndex) {
    return fromIndex;
  }

  const src = image.getAttribute('src') ?? '';
  const width = image.getAttribute('width');
  const float = IMAGE_FLOATS.find((value) => image.classList.contains(imageFloatClass(value)));

  editor.deleteText(fromIndex, 1, 'user');
  editor.insertEmbed(insertAt, 'image', src, 'user');
  if (width) {
    editor.formatText(insertAt, 1, 'width', width, 'user');
  }
  if (float) {
    editor.formatText(insertAt, 1, 'float', float, 'user');
  }
  editor.setSelection(insertAt + 1, 0, 'user');

  return insertAt;
}
