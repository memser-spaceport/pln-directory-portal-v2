import { indexFromRange } from './indexFromRange';

/** The document index at a point on the screen, or null when the point is not
 *  over this editor's text. */
export function indexFromPoint(editor: any, x: number, y: number): number | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };

  let native: Range | null = null;
  if (doc.caretRangeFromPoint) {
    native = doc.caretRangeFromPoint(x, y);
  } else {
    const position = doc.caretPositionFromPoint?.(x, y);
    if (position) {
      native = document.createRange();
      native.setStart(position.offsetNode, position.offset);
      native.collapse(true);
    }
  }

  return indexFromRange(editor, native);
}
