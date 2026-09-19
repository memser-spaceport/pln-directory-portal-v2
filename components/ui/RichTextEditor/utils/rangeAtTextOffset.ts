/**
 * A collapsed range at a character offset into an element's text, counting
 * only text and so unaffected by an image sitting among it.
 */
export function rangeAtTextOffset(root: HTMLElement, offset: number): Range {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  let seen = 0;
  let node = walker.nextNode() as Text | null;
  let last: Text | null = null;

  while (node) {
    if (seen + node.length >= offset) {
      range.setStart(node, offset - seen);
      range.collapse(true);
      return range;
    }
    seen += node.length;
    last = node;
    node = walker.nextNode() as Text | null;
  }

  if (last) {
    range.setStart(last, last.length);
  } else {
    range.setStart(root, root.childNodes.length);
  }
  range.collapse(true);
  return range;
}
