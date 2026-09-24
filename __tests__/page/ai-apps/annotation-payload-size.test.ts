import {
  serializeAnnotations,
  type AnnotationState,
  type Stroke,
} from '@/components/page/ai-apps/components/screenshot-feedback/types';

/**
 * The size of what a drawing serializes to, which is what the server's cap
 * measures.
 *
 * A member hit "String must contain at most 50000 character(s)" on feedback
 * whose visible text was one line. The cap is on the serialized string, and
 * that string is mostly `data-annotations`: a freehand stroke is hundreds of
 * points, and an unrounded `point.x / width` is eighteen characters of float.
 *
 * These are characterisation tests. They exist so that a change which inflates
 * the payload — dropping the rounding, adding a field per point, switching the
 * encoding — shows up as a number here instead of as a rejected submission.
 */

/** A stroke as `toNorm` produces it: coordinates rounded to four places. */
const roundedStroke = (points: number): Stroke => ({
  color: '#dc2626',
  width: 0.006,
  points: Array.from({ length: points }, (_, i) => ({
    x: Math.round(((120 + i * 1.7) / 1512) * 1e4) / 1e4,
    y: Math.round(((200 + i * 0.9) / 982) * 1e4) / 1e4,
  })),
});

/** The same drag before rounding — what the old code stored. */
const rawStroke = (points: number): Stroke => ({
  color: '#dc2626',
  width: 0.006,
  points: Array.from({ length: points }, (_, i) => ({
    x: (120 + i * 1.7) / 1512,
    y: (200 + i * 0.9) / 982,
  })),
});

const drawing = (make: (n: number) => Stroke, strokes: number, points: number): AnnotationState => ({
  version: 1,
  strokes: Array.from({ length: strokes }, () => make(points)),
  shapes: [],
  comments: [],
});

const encodedLength = (state: AnnotationState) => serializeAnnotations(state).length;

describe('annotation payload size', () => {
  /**
   * The submission that prompted the fix: one screenshot, drawn on heavily,
   * with a single line of text.
   *
   * Rounding alone does NOT rescue it — 5x250 lands around 55k, still over the
   * old 50000. That is the point: the coordinate precision and the server cap
   * were two separate mistakes, and fixing only one would have moved the wall
   * rather than removed it.
   */
  it('is still over the old 50k cap after rounding, which is why the cap moved too', () => {
    const raw = encodedLength(drawing(rawStroke, 5, 250));
    const rounded = encodedLength(drawing(roundedStroke, 5, 250));

    expect(raw).toBeGreaterThan(50_000);
    expect(rounded).toBeGreaterThan(50_000);
    expect(rounded).toBeLessThan(raw);
  });

  /* A more ordinary drawing does fit under the old cap once rounded — so the
     rounding is what keeps everyday submissions far from either limit. */
  it('brings an ordinary drawing well under the old cap', () => {
    expect(encodedLength(drawing(rawStroke, 3, 200))).toBeGreaterThan(40_000);
    expect(encodedLength(drawing(roundedStroke, 3, 200))).toBeLessThan(30_000);
  });

  it('takes at least a quarter off a freehand payload', () => {
    const raw = encodedLength(drawing(rawStroke, 3, 200));
    const rounded = encodedLength(drawing(roundedStroke, 3, 200));

    expect(rounded / raw).toBeLessThan(0.75);
  });

  /* The ceiling the server now allows. A drawing this heavy is already well
     past what anyone produces by hand; if this ever fails, the cap moved or the
     format grew. */
  it('leaves room under the 200k server cap for an extreme drawing', () => {
    expect(encodedLength(drawing(roundedStroke, 8, 300))).toBeLessThan(200_000);
  });

  /* Four decimal places on a normalized coordinate is a third of a pixel at 4K.
     If someone widens this, the payload grows with it. */
  it('never writes a coordinate longer than six characters', () => {
    const state = drawing(roundedStroke, 2, 120);
    const longest = state.strokes
      .flatMap((stroke) => stroke.points)
      .flatMap((point) => [String(point.x), String(point.y)])
      .reduce((max, s) => Math.max(max, s.length), 0);

    expect(longest).toBeLessThanOrEqual(6);
  });
});
