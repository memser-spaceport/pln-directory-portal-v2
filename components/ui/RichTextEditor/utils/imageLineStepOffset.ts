import { rangeAtTextOffset } from './rangeAtTextOffset';

// Enough to cross a line in any realistic paragraph — a line of prose is a
// dozen or so words — while keeping a pathological block from laying itself
// out thousands of times.
const MAX_PROBES = 400;

/**
 * The character offset to move an image to so that it sits exactly one
 * rendered line up or down, or null when there is no such line.
 *
 * It is measured rather than calculated, because where a float lands cannot be
 * worked out from the text in front of it. A float is pulled up to the top of
 * the line it occurs on, and the text before it then re-flows into the
 * narrower space beside it — so putting one line's worth of words in front of
 * an image typically moves nothing at all, and the number of words that DO
 * move it down a line changes from line to line. Measuring a paragraph of 140
 * words found the image had only seven possible tops, at words 0, 12, 36, 60,
 * 83, 107 and 131.
 *
 * So each word boundary is tried in an offscreen copy of the block, in the
 * direction asked for, and the first one that puts the image on a different
 * line wins. The copy carries the block's real markup and the editor's own
 * width and classes, so it wraps exactly as the original does.
 */
export function imageLineStepOffset(options: {
  editorRoot: HTMLElement;
  block: HTMLElement;
  image: HTMLImageElement;
  direction: 1 | -1;
}): number | null {
  const { editorRoot, block, image, direction } = options;

  const text = block.textContent ?? '';
  const from = textOffsetOf(block, image);
  const candidates = wordBoundaries(text, from, direction).slice(0, MAX_PROBES);
  if (candidates.length === 0) {
    return null;
  }

  // Mounted beside the editor body rather than on <body>: the editor's own
  // font comes from a CSS-module class on an ancestor, so a copy parked at the
  // top of the document wraps at a different width and reports lines the real
  // paragraph does not have. Beside it — but outside the contenteditable, so
  // Quill's mutation observer never sees this — the copy inherits everything.
  const host = document.createElement('div');
  host.className = editorRoot.className;
  host.setAttribute(
    'style',
    `position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;width:${editorRoot.clientWidth}px`,
  );
  (editorRoot.parentElement ?? document.body).appendChild(host);

  try {
    const baseline = topAtOffset(host, block, from);
    if (baseline == null) {
      return null;
    }

    for (const candidate of candidates) {
      const top = topAtOffset(host, block, candidate);
      if (top != null && Math.abs(top - baseline) > 1) {
        return candidate;
      }
    }

    return null;
  } finally {
    host.remove();
  }
}

/** How much text of the block comes before the image. */
function textOffsetOf(block: HTMLElement, image: HTMLImageElement): number {
  const range = document.createRange();
  range.setStart(block, 0);
  range.setEndBefore(image);
  return range.toString().length;
}

/** Word starts on the far side of `from`, nearest first. */
function wordBoundaries(text: string, from: number, direction: 1 | -1): number[] {
  const starts = [0];
  for (let i = 1; i < text.length; i++) {
    if (/\s/.test(text[i - 1]) && !/\s/.test(text[i])) {
      starts.push(i);
    }
  }
  starts.push(text.length);

  return direction === 1 ? starts.filter((start) => start > from) : starts.filter((start) => start < from).reverse();
}

/** Where the image would sit, relative to the block, at this offset. */
function topAtOffset(host: HTMLElement, block: HTMLElement, offset: number): number | null {
  host.replaceChildren();

  const clone = block.cloneNode(true) as HTMLElement;
  host.appendChild(clone);

  const image = clone.querySelector('img');
  if (!image) {
    return null;
  }

  image.remove();
  rangeAtTextOffset(clone, offset).insertNode(image);

  return image.getBoundingClientRect().top - clone.getBoundingClientRect().top;
}
