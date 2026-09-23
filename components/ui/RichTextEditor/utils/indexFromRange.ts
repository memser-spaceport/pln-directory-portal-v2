/**
 * The document index at a DOM range, or null when the range is not inside
 * this editor's text.
 *
 * `normalizeNative` and `normalizedToRange` are Quill's own way from a DOM
 * range to an index — its uploader module uses exactly this pair to work out
 * where a dropped file belongs — and normalizeNative is what rejects a node
 * that isn't inside the editor.
 */
export function indexFromRange(editor: any, range: Range | null): number | null {
  const normalized = range && editor.selection.normalizeNative(range);
  return normalized ? (editor.selection.normalizedToRange(normalized)?.index ?? null) : null;
}
