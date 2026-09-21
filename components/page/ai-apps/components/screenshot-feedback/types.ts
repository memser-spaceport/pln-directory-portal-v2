export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  color: string;
  width: number;
  points: Point[];
};

export type PinComment = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type AnnotationState = {
  version: 1;
  strokes: Stroke[];
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
    return parsed;
  } catch {
    return null;
  }
}

export function emptyAnnotations(): AnnotationState {
  return { version: 1, strokes: [], comments: [] };
}
