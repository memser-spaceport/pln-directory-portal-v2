export {
  requestTabCapture,
  grabVideoFrame,
  stopCaptureStream,
  isCaptureSupported,
  isPersistentReason,
  CaptureError,
  type CaptureFailureReason,
  type PersistentCaptureReason,
} from './captureTabFrame';
export { attachImageFile, AttachImageError } from './attachImageFile';
export { RegionSelectOverlay } from './RegionSelectOverlay';
export { AnnotatorModal } from './AnnotatorModal';
export { ConfirmLayer } from './ConfirmLayer';
export { AnnotationCanvas, DRAW_COLORS, DEFAULT_DRAW_COLOR } from './AnnotationCanvas';
export { appendScreenshots, annotatedScreenshotHtml } from './screenshotHtml';
export {
  ANNOTATED_SCREENSHOT_CLASS,
  ANNOTATION_ATTR,
  EMPTY_ANNOTATIONS,
  emptyAnnotations,
  hasAnyAnnotation,
  parseAnnotations,
  serializeAnnotations,
  type AnnotationState,
  type ScreenshotAttachment,
  type Shape,
  type ShapeKind,
} from './types';
