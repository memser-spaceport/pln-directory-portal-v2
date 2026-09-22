export {
  requestTabCapture,
  grabVideoFrame,
  stopCaptureStream,
  CaptureDeniedError,
  CaptureUnavailableError,
} from './captureTabFrame';
export { RegionSelectOverlay } from './RegionSelectOverlay';
export { AnnotatorModal } from './AnnotatorModal';
export { AnnotationCanvas, DRAW_COLORS, DEFAULT_DRAW_COLOR } from './AnnotationCanvas';
export { appendScreenshots, annotatedScreenshotHtml } from './screenshotHtml';
export {
  ANNOTATED_SCREENSHOT_CLASS,
  ANNOTATION_ATTR,
  EMPTY_ANNOTATIONS,
  emptyAnnotations,
  parseAnnotations,
  serializeAnnotations,
  type AnnotationState,
  type ScreenshotAttachment,
} from './types';
