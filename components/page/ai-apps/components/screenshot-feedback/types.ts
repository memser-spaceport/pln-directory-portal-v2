export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  color: string;
  width: number;
  points: Point[];
};

export type ShapeKind = 'rect' | 'ellipse';

/**
 * A dragged outline. `x`/`y` are the top-left corner and `w`/`h` the extent,
 * all normalized to the image, all non-negative: a drag up-and-left is
 * normalized at commit so nothing downstream has to reason about a negative box.
 */
export type Shape = {
  kind: ShapeKind;
  color: string;
  width: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PinComment = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type AnnotationState = {
  /**
   * Deliberately NOT bumped when `shapes` was added.
   *
   * `parseAnnotations` rejects anything that isn't version 1, and every
   * annotation already stored on a feedback row says 1. Bumping would make the
   * whole back catalogue unparseable — no badge, no outline, no lightbox replay
   * — to announce a field that older payloads are allowed to omit anyway.
   */
  version: 1;
  strokes: Stroke[];
  shapes: Shape[];
  comments: PinComment[];
};

export type ScreenshotAttachment = {
  id: string;
  imageDataUrl: string;
  annotations: AnnotationState;
};

export const EMPTY_ANNOTATIONS: AnnotationState = {
  version: 1,
  strokes: [],
  shapes: [],
  comments: [],
};

export const ANNOTATED_SCREENSHOT_CLASS = 'ai-app-annotated-screenshot';
export const ANNOTATION_ATTR = 'data-annotations';

export function serializeAnnotations(state: AnnotationState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function parseAnnotations(raw: string | null | undefined): AnnotationState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as AnnotationState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.strokes) || !Array.isArray(parsed.comments)) {
      return null;
    }
    /* Strict on the two fields that have always been there, tolerant on the one
       that has not: every annotation saved before shapes existed omits the key,
       and rejecting those would erase them from the UI. */
    return { ...parsed, shapes: Array.isArray(parsed.shapes) ? parsed.shapes : [] };
  } catch {
    return null;
  }
}

export function emptyAnnotations(): AnnotationState {
  return { version: 1, strokes: [], shapes: [], comments: [] };
}

/** Whether there is anything on this screenshot worth flagging to a reviewer. */
export function hasAnyAnnotation(state: AnnotationState | null | undefined): boolean {
  return Boolean(state && (state.strokes.length > 0 || state.shapes.length > 0 || state.comments.length > 0));
}
