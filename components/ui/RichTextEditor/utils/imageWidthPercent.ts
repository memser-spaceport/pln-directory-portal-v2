const MIN_PERCENT = 5;
const MAX_PERCENT = 100;

/**
 * An image's size is stored as a percentage of the block it sits in rather
 * than in pixels: the read-only views that render this HTML are narrower than
 * the composer in places and wider in others, and a pixel width would show the
 * image at a different relative size there — or get clamped by
 * `max-width: 100%` — instead of the size its author set.
 */
export function imageWidthPercent(widthPx: number, referenceWidthPx: number): number {
  if (referenceWidthPx <= 0) {
    return MAX_PERCENT;
  }

  const percent = Math.round((widthPx / referenceWidthPx) * 100);
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent));
}
