/** The part of a Quill editor that the hard text limit uses. */
export interface LimitEditor {
  getSemanticHTML(): string;
  deleteText(index: number, length: number, source?: 'api' | 'user' | 'silent'): unknown;
}

/** The part of a Quill change delta that the hard text limit reads. */
export interface LimitDelta {
  ops: { insert?: unknown; retain?: unknown; delete?: number }[];
}

interface Range {
  index: number;
  length: number;
}

/** The text that a change inserted, as ranges in the document after the change, in document order. */
export function insertedTextRanges(delta: LimitDelta): Range[] {
  const ranges: Range[] = [];
  let index = 0;
  for (const op of delta.ops) {
    if (typeof op.retain === 'number') index += op.retain;
    else if (op.retain != null) index += 1;
    else if (typeof op.insert === 'string') {
      ranges.push({ index, length: op.insert.length });
      index += op.insert.length;
    } else if (op.insert != null) index += 1;
  }
  return ranges;
}

/**
 * Removes the end of the text that a change inserted until the editor's text length is at most `limit`. Text that was
 * already in the editor stays. Returns the text length after the trim.
 */
export function trimToTextLimit(
  editor: LimitEditor,
  delta: LimitDelta,
  limit: number,
  measure: (html: string) => number,
): number {
  const ranges = insertedTextRanges(delta);
  let length = measure(editor.getSemanticHTML());
  while (length > limit && ranges.length > 0) {
    const last = ranges[ranges.length - 1];
    const cut = Math.min(length - limit, last.length);
    editor.deleteText(last.index + last.length - cut, cut, 'api');
    last.length -= cut;
    if (last.length === 0) ranges.pop();
    length = measure(editor.getSemanticHTML());
  }
  return length;
}
