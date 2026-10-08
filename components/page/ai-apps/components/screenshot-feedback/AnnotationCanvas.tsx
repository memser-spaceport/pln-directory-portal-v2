'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';
import { isSendChord } from '@/components/page/ai-apps/shortcutKeys';
import {
  type AnnotationState,
  type PinComment,
  type Point,
  type Shape,
  type ShapeKind,
  type Stroke,
  type TextLabel,
} from './types';

import s from './AnnotationCanvas.module.scss';

export const DRAW_COLORS = ['#dc2626', '#1b4dff', '#0a9952', '#d97706', '#0a0c11'] as const;
export const DEFAULT_DRAW_COLOR = DRAW_COLORS[0];

const STROKE_WIDTH_RATIO = 0.006;
const DRAG_THRESHOLD_PX = 4;

export type AnnotatorTool = 'draw' | 'comment' | 'text' | ShapeKind;

const SHAPE_TOOLS: AnnotatorTool[] = ['rect', 'ellipse', 'arrow'];

/**
 * How much room a comment panel needs below and to the right of its pin.
 *
 * Mirrors `.bubble` / `.composer` in the stylesheet — 240px wide plus its 8px
 * offset, and roughly the tallest the composer gets with its textarea and
 * Remove link. Constants rather than a measurement because the flip has to be
 * decided before paint: measuring would mean rendering the panel in the wrong
 * place first and letting the user watch it jump.
 */
const PANEL_WIDTH = 248;
const PANEL_HEIGHT = 150;

/** Arrowhead length, as a fraction of the image's short side. */
const ARROW_HEAD_RATIO = 0.035;
/** How far the head is splayed from the shaft. */
const ARROW_HEAD_ANGLE = Math.PI / 7;

/* Label sizes are pixels of the saved image; the presets are a shortcut, any
   whole number in range can be typed. */
const LABEL_SIZE_PRESETS = [12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
const LABEL_SIZE_MIN = 8;
const LABEL_SIZE_MAX = 400;
const LABEL_MIN_WIDTH_PX = 24;
const LABEL_PLACEHOLDER = 'Type. Return makes a new line.';

/** Scales with the capture, so a first label reads the same on a phone shot and a 4K one. */
function defaultLabelSize(naturalWidth: number): number {
  return Math.max(14, Math.round((naturalWidth || 1400) / 58));
}

/**
 * Where and how big a label is drawn. `--label-scale`, set on the picture's
 * box, is screen pixels per image pixel.
 *
 * Shared with AnnotatedPreview: the type and the wrap width both scale with the
 * picture, so a label wraps on the same words in the editor and in a thumbnail.
 */
export function labelStyle(label: TextLabel): CSSProperties {
  return {
    left: `${label.x * 100}%`,
    top: `${label.y * 100}%`,
    width: label.width ? `${label.width * 100}%` : undefined,
    maxWidth: `${(1 - label.x) * 100}%`,
    color: label.color,
    fontSize: `calc(${label.size}px * var(--label-scale, 1))`,
    fontWeight: label.bold ? 700 : 400,
  };
}

function isShapeTool(tool: AnnotatorTool): tool is ShapeKind {
  return SHAPE_TOOLS.includes(tool);
}

interface Props {
  imageSrc: string;
  annotations: AnnotationState;
  onChange?: (next: AnnotationState) => void;
  tool?: AnnotatorTool;
  strokeColor?: string;
  readOnly?: boolean;
  /**
   * Whether comment pins can be placed, edited, moved or removed. Default false.
   *
   * Production leaves it off (LAB-2766): comments live in the feedback popup's
   * Comments option now, so pins saved before that only show their note on a
   * press. Only the prototypes under `prototypes/`, which still use the comment
   * tool, turn it on.
   */
  commentsEditable?: boolean;
  className?: string;
}

type DraftComment = PinComment & { input: string };

type ShapeDrag = {
  kind: ShapeKind;
  from: Point;
  to: Point;
};

type LabelDrag = {
  pointerId: number;
  mode: 'move' | 'size';
  startX: number;
  startY: number;
  origin: TextLabel;
  originWidthPx: number;
  latest: TextLabel | null;
};

type PinDrag = {
  id: string;
  isDraft: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

/**
 * Decimal places kept on a normalized coordinate.
 *
 * A raw `point.x / width` carries full float precision — `0.08498677248677249`,
 * eighteen characters — and a freehand stroke is hundreds of those. Serialized
 * into `data-annotations` and URL-encoded, five strokes of 250 points reach
 * roughly 87,000 characters, which is most of a feedback submission's entire
 * size budget spent on digits nobody can see.
 *
 * Four places is 1/10000 of the image's width: a third of a pixel on a 4K
 * display, well under the width of the line being drawn. It costs the drawing
 * nothing and takes about a third off the payload.
 */
const COORD_DP = 4;
const COORD_SCALE = 10 ** COORD_DP;

/** Rounds a 0..1 coordinate to `COORD_DP`, dropping precision that cannot be seen. */
function roundNorm(value: number): number {
  return Math.round(value * COORD_SCALE) / COORD_SCALE;
}

/** Keeps a moved label's corner on the picture, with room left for at least a letter. */
function clampLabelCorner(value: number): number {
  return roundNorm(Math.min(0.95, Math.max(0, value)));
}

function toNorm(point: Point, width: number, height: number): Point {
  return { x: roundNorm(point.x / width), y: roundNorm(point.y / height) };
}

function fromNorm(point: Point, width: number, height: number): Point {
  return { x: point.x * width, y: point.y * height };
}

function lineWidthFor(width: number, canvasWidth: number, canvasHeight: number): number {
  return Math.max(1.5, width * Math.min(canvasWidth, canvasHeight));
}

function traceStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number) {
  if (stroke.points.length === 0) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = lineWidthFor(stroke.width, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const first = fromNorm(stroke.points[0], width, height);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < stroke.points.length; i++) {
    const p = fromNorm(stroke.points[i], width, height);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

/** Outline only: a filled callout hides the very thing it is pointing at. */
function traceShape(ctx: CanvasRenderingContext2D, shape: Shape, width: number, height: number) {
  const x = shape.x * width;
  const y = shape.y * height;
  const w = shape.w * width;
  const h = shape.h * height;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = lineWidthFor(shape.width, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (shape.kind === 'arrow') {
    /* x/y is the tail and w/h a signed delta, so the head is simply the far end
       of that delta — no min/abs anywhere, or the arrow loses its direction. */
    const tipX = x + w;
    const tipY = y + h;
    const angle = Math.atan2(h, w);
    /* Scaled to the image rather than fixed in pixels, so an arrow drawn on a
       full-size capture still looks like an arrow in the strip's 120px tile.
       Capped at a third of the shaft: a short arrow whose head outruns it reads
       as a blob. */
    const shaft = Math.hypot(w, h);
    const head = Math.min(ARROW_HEAD_RATIO * Math.min(width, height), shaft / 3);
    ctx.moveTo(x, y);
    ctx.lineTo(tipX, tipY);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - head * Math.cos(angle - ARROW_HEAD_ANGLE), tipY - head * Math.sin(angle - ARROW_HEAD_ANGLE));
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - head * Math.cos(angle + ARROW_HEAD_ANGLE), tipY - head * Math.sin(angle + ARROW_HEAD_ANGLE));
  } else if (shape.kind === 'ellipse') {
    ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.stroke();
}

/**
 * One clear, then everything.
 *
 * Strokes and shapes share a canvas, so each must NOT clear on its own: a second
 * clearing pass wipes whatever the first one drew, and on the live-preview path
 * it wipes the in-progress line every frame.
 */
export function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Pick<AnnotationState, 'strokes' | 'shapes'>,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of annotations.strokes) traceStroke(ctx, stroke, width, height);
  for (const shape of annotations.shapes ?? []) traceShape(ctx, shape, width, height);
}

function shapeFromDrag(kind: ShapeKind, color: string, from: Point, to: Point, width: number, height: number): Shape {
  const a = toNorm(from, width, height);
  const b = toNorm(to, width, height);
  const base = { kind, color, width: STROKE_WIDTH_RATIO };

  /* An arrow keeps the drag as it was made — tail, then signed delta. Folding it
     into a positive box the way the outlines below are folded would point every
     up-left arrow down-right, at whatever happens to sit in the opposite corner. */
  /* Rounded again after the arithmetic: subtracting two rounded values puts the
     noise straight back (0.4127 - 0.085 is 0.32769999999999994), and an extent
     is just as unreadable at that precision as a coordinate. */
  if (kind === 'arrow') {
    return { ...base, x: a.x, y: a.y, w: roundNorm(b.x - a.x), h: roundNorm(b.y - a.y) };
  }

  /* Outlines have no direction to lose, so a drag in any direction collapses to
     the same non-negative box and every reader gets one shape to handle. */
  return {
    ...base,
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: roundNorm(Math.abs(b.x - a.x)),
    h: roundNorm(Math.abs(b.y - a.y)),
  };
}

export function AnnotationCanvas({
  imageSrc,
  annotations,
  onChange,
  tool = 'draw',
  strokeColor = DEFAULT_DRAW_COLOR,
  readOnly = false,
  commentsEditable = false,
  className,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef<Point[] | null>(null);
  const shaping = useRef<ShapeDrag | null>(null);
  const pendingComment = useRef<Point | null>(null);
  const ignoreBlur = useRef(false);
  const annotationsRef = useRef(annotations);
  const draftRef = useRef<DraftComment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<PinDrag | null>(null);
  const dragPosRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const nextCommentId = useRef(0);
  const pendingLabel = useRef<Point | null>(null);
  const nextLabelId = useRef(0);
  const labelDraftRef = useRef<TextLabel | null>(null);
  const labelFieldRef = useRef<HTMLTextAreaElement>(null);
  const labelFocusing = useRef(false);
  const labelDragRef = useRef<LabelDrag | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0, naturalWidth: 0 });
  /* The label being typed in. Kept out of `annotations` until the field is left,
     so a sentence is one step of undo rather than one per keystroke. */
  const [labelDraft, setLabelDraft] = useState<TextLabel | null>(null);
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [labelDrag, setLabelDrag] = useState<TextLabel | null>(null);
  const [lastLabelSize, setLastLabelSize] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftComment | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const inputId = useId();
  /* Pins that only show their note: in a read-only view, or wherever comments are switched off. */
  const pinsLocked = readOnly || !commentsEditable;

  const syncSize = () => {
    const img = imgRef.current;
    if (!img) return;
    const width = img.clientWidth;
    const height = img.clientHeight;
    if (width === 0 || height === 0) return;
    const naturalWidth = img.naturalWidth || width;
    setSize((prev) =>
      prev.width === width && prev.height === height && prev.naturalWidth === naturalWidth
        ? prev
        : { width, height, naturalWidth },
    );
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) renderAnnotations(ctx, annotationsRef.current, width, height);
  };

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const draftId = draft?.id;
  useLayoutEffect(() => {
    if (!draftId) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const id = window.setTimeout(() => {
      ignoreBlur.current = false;
      el.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [draftId]);

  const labelDraftId = labelDraft?.id;
  useLayoutEffect(() => {
    if (!labelDraftId) return;
    const focusField = () => {
      const el = labelFieldRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    };
    focusField();
    /* Again after the click that opened it has finished, which can take the focus
       back to whatever it landed on. */
    const id = window.setTimeout(() => {
      labelFocusing.current = false;
      focusField();
    }, 0);
    return () => window.clearTimeout(id);
  }, [labelDraftId]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (typeof ResizeObserver === 'undefined') {
      if (img.complete) syncSize();
      return;
    }
    const observer = new ResizeObserver(syncSize);
    observer.observe(img);
    if (img.complete) syncSize();
    return () => observer.disconnect();
  }, [imageSrc]);

  /* Destructured so the effect depends on exactly the two arrays it paints,
     rather than on every identity change of the whole annotation object. */
  const { strokes, shapes } = annotations;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (ctx) renderAnnotations(ctx, { strokes, shapes }, canvas.width, canvas.height);
  }, [strokes, shapes, size]);

  const savedLabels = annotations.labels ?? [];
  const showLabel = (label: TextLabel) =>
    labelDrag?.id === label.id ? labelDrag : labelDraft?.id === label.id ? labelDraft : label;
  const shownLabels = [
    ...savedLabels.map(showLabel),
    ...(labelDraft && !savedLabels.some((label) => label.id === labelDraft.id) ? [showLabel(labelDraft)] : []),
  ];
  const labelScale = size.naturalWidth ? size.width / size.naturalWidth : 1;

  /** Adds, replaces or — once its text is gone — drops a label, as one step of undo. */
  const writeLabel = (label: TextLabel) => {
    if (!onChange) return;
    const base = annotationsRef.current;
    const labels = base.labels ?? [];
    const existing = labels.find((item) => item.id === label.id);
    const keep = label.text.trim() !== '';
    if (!keep && !existing) return;
    if (keep && existing && JSON.stringify(existing) === JSON.stringify(label)) return;
    let nextLabels = labels.filter((item) => item.id !== label.id);
    if (keep) nextLabels = existing ? labels.map((item) => (item.id === label.id ? label : item)) : [...labels, label];
    const next = { ...base, labels: nextLabels };
    /* Leaving a field and then changing the size are two writes before the
       parent re-renders; the second must build on the first. */
    annotationsRef.current = next;
    onChange(next);
  };

  const editLabel = (label: TextLabel) => {
    labelFocusing.current = true;
    labelDraftRef.current = label;
    setLabelDraft(label);
    setActiveLabelId(label.id);
  };

  /** Keeps what was typed; only a label left empty disappears. */
  const leaveLabelField = () => {
    const current = labelDraftRef.current;
    if (!current) return;
    labelDraftRef.current = null;
    setLabelDraft(null);
    writeLabel(current);
    if (!current.text.trim()) setActiveLabelId(null);
  };

  /* While a label is being typed in, a change to it waits to be saved with the
     text; otherwise it is saved at once. */
  const updateLabel = (next: TextLabel) => {
    if (labelDraftRef.current?.id === next.id) {
      labelDraftRef.current = next;
      setLabelDraft(next);
      return;
    }
    writeLabel(next);
  };

  const removeLabel = (label: TextLabel) => {
    if (labelDraftRef.current?.id === label.id) {
      labelDraftRef.current = null;
      setLabelDraft(null);
    }
    setActiveLabelId(null);
    writeLabel({ ...label, text: '' });
  };

  const placeLabel = (point: Point, width: number, height: number) => {
    if (width === 0 || height === 0) return;
    /* A reopened screenshot already carries labels numbered from 1. */
    let id = '';
    do id = `l-${++nextLabelId.current}`;
    while (annotationsRef.current.labels?.some((label) => label.id === id));
    editLabel({
      id,
      x: roundNorm(point.x / width),
      y: roundNorm(point.y / height),
      text: '',
      color: strokeColor,
      size: lastLabelSize ?? defaultLabelSize(size.naturalWidth),
      bold: true,
    });
  };

  const beginLabelDrag = (event: React.PointerEvent<HTMLElement>, label: TextLabel, mode: LabelDrag['mode']) => {
    if (readOnly || event.button > 0) return;
    /* In the field being typed in, a press places the caret. */
    if (mode === 'move' && labelDraftRef.current?.id === label.id) return;
    event.stopPropagation();
    event.preventDefault();
    if (labelDraftRef.current && labelDraftRef.current.id !== label.id) leaveLabelField();
    setActiveLabelId(label.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = mode === 'size' ? event.currentTarget.parentElement : event.currentTarget;
    labelDragRef.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: label,
      originWidthPx: box?.getBoundingClientRect().width ?? 0,
      latest: null,
    };
  };

  const moveLabelDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = labelDragRef.current;
    const bounds = wrapRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !bounds?.width || !bounds.height) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.latest && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
    const { origin } = drag;
    const next =
      drag.mode === 'move'
        ? {
            ...origin,
            x: clampLabelCorner(origin.x + dx / bounds.width),
            y: clampLabelCorner(origin.y + dy / bounds.height),
          }
        : {
            ...origin,
            width: roundNorm(
              Math.min(1 - origin.x, Math.max(LABEL_MIN_WIDTH_PX, drag.originWidthPx + dx) / bounds.width),
            ),
          };
    drag.latest = next;
    setLabelDrag(next);
  };

  const endLabelDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = labelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    labelDragRef.current = null;
    setLabelDrag(null);
    if (drag.latest) updateLabel(drag.latest);
  };

  const cancelLabelDrag = () => {
    labelDragRef.current = null;
    setLabelDrag(null);
  };

  /**
   * Esc one step at a time: leave the field, then deselect the label, and only
   * then let the editor close. ⌘↩ / Ctrl+Enter in a label leaves the field too.
   *
   * On `window` in the capture phase, ahead of the annotator's own handler on
   * `document`, which would otherwise discard the screenshot or add it.
   */
  useEffect(() => {
    if (readOnly || !activeLabelId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      const target = event.target;
      if (target === labelFieldRef.current && (event.key === 'Escape' || isSendChord(event))) {
        event.preventDefault();
        event.stopPropagation();
        leaveLabelField();
        return;
      }
      if (event.key !== 'Escape' || !(target instanceof Element)) return;
      if (target.closest(`.${s.labelBar}`)) {
        event.preventDefault();
        event.stopPropagation();
        (target as HTMLElement).blur();
        return;
      }
      if (target.closest('textarea, input, select, [contenteditable="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      setActiveLabelId(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [readOnly, activeLabelId, leaveLabelField]);

  const localPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const commitStroke = (points: Point[]) => {
    if (points.length < 2 || !onChange || size.width === 0) return;
    const stroke: Stroke = {
      color: strokeColor,
      width: STROKE_WIDTH_RATIO,
      points: points.map((p) => toNorm(p, size.width, size.height)),
    };
    onChange({ ...annotations, strokes: [...annotations.strokes, stroke] });
  };

  const commitShape = (drag: ShapeDrag, canvas: HTMLCanvasElement) => {
    if (!onChange) return;
    /* A click that never became a drag is not a shape. Left in, every stray tap
       with a shape tool active would push a zero-size box onto the history,
       drawing nothing and giving undo something invisible to walk back through. */
    const dx = drag.to.x - drag.from.x;
    const dy = drag.to.y - drag.from.y;
    if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
      /* Wipe whatever preview the drag painted; no state changed, so the redraw
         effect will not run on its own. */
      const ctx = canvas.getContext('2d');
      if (ctx) renderAnnotations(ctx, annotations, canvas.width, canvas.height);
      return;
    }
    const width = canvas.width || size.width;
    const height = canvas.height || size.height;
    if (width === 0 || height === 0) return;
    onChange({
      ...annotations,
      shapes: [...annotations.shapes, shapeFromDrag(drag.kind, strokeColor, drag.from, drag.to, width, height)],
    });
  };

  const openCommentAt = (point: Point, width: number, height: number) => {
    if (width === 0 || height === 0) return;
    ignoreBlur.current = true;
    setActiveCommentId(null);
    const next = {
      id: `c-${++nextCommentId.current}`,
      x: roundNorm(point.x / width),
      y: roundNorm(point.y / height),
      text: '',
      input: '',
    };
    draftRef.current = next;
    setDraft(next);
  };

  const openEdit = (comment: PinComment) => {
    ignoreBlur.current = true;
    setActiveCommentId(null);
    const next = { ...comment, input: comment.text };
    draftRef.current = next;
    setDraft(next);
  };

  const saveDraft = (fromBlur = false) => {
    const current = draftRef.current;
    if (fromBlur && ignoreBlur.current && !current?.input.trim()) return false;
    if (!current || !onChange) return false;
    const text = current.input.trim();
    if (!text) {
      if (!fromBlur) setDraft(null);
      return false;
    }
    setDraft(null);
    const base = annotationsRef.current;
    const existing = base.comments.some((comment) => comment.id === current.id);
    onChange({
      ...base,
      comments: existing
        ? base.comments.map((comment) =>
            comment.id === current.id ? { ...comment, x: current.x, y: current.y, text } : comment,
          )
        : [...base.comments, { id: current.id, x: current.x, y: current.y, text }],
    });
    return true;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || event.button > 0) return;
    const point = localPoint(event);
    leaveLabelField();
    setActiveLabelId(null);
    if (tool === 'text') {
      event.preventDefault();
      pendingLabel.current = point;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === 'draw') {
      event.currentTarget.setPointerCapture(event.pointerId);
      drawing.current = [point];
      return;
    }
    if (isShapeTool(tool)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      shaping.current = { kind: tool, from: point, to: point };
      return;
    }
    if (tool === 'comment' && commentsEditable) {
      if (draftRef.current) {
        event.preventDefault();
        saveDraft(true);
        return;
      }
      event.preventDefault();
      pendingComment.current = point;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (shaping.current) {
      shaping.current.to = localPoint(event);
      if (!ctx || !canvas) return;
      /* The preview is the committed state plus one more shape, rendered in the
         same single-clear pass — never a second clear of its own. */
      renderAnnotations(
        ctx,
        {
          strokes: annotations.strokes,
          shapes: [
            ...annotations.shapes,
            shapeFromDrag(
              shaping.current.kind,
              strokeColor,
              shaping.current.from,
              shaping.current.to,
              canvas.width,
              canvas.height,
            ),
          ],
        },
        canvas.width,
        canvas.height,
      );
      return;
    }

    if (!drawing.current) return;
    drawing.current.push(localPoint(event));
    if (!ctx || !canvas) return;
    renderAnnotations(ctx, annotations, canvas.width, canvas.height);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1.5, STROKE_WIDTH_RATIO * Math.min(canvas.width, canvas.height));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(drawing.current[0].x, drawing.current[0].y);
    for (let i = 1; i < drawing.current.length; i++) {
      ctx.lineTo(drawing.current[i].x, drawing.current[i].y);
    }
    ctx.stroke();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (shaping.current) {
      const drag = shaping.current;
      shaping.current = null;
      commitShape(drag, event.currentTarget);
      return;
    }
    if (pendingLabel.current) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const point = pendingLabel.current;
      pendingLabel.current = null;
      placeLabel(point, bounds.width || size.width, bounds.height || size.height);
      return;
    }
    if (pendingComment.current) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const img = imgRef.current;
      const width = bounds.width || size.width || img?.clientWidth || 0;
      const height = bounds.height || size.height || img?.clientHeight || 0;
      const point = pendingComment.current;
      pendingComment.current = null;
      openCommentAt(point, width, height);
      return;
    }
    if (!drawing.current) return;
    const points = drawing.current;
    drawing.current = null;
    commitStroke(points);
  };

  const removeComment = (id: string) => {
    if (!onChange) return;
    if (draftRef.current?.id === id) {
      draftRef.current = null;
      setDraft(null);
    }
    onChange({
      ...annotationsRef.current,
      comments: annotationsRef.current.comments.filter((comment) => comment.id !== id),
    });
    setActiveCommentId((current) => (current === id ? null : current));
  };

  const commentPointFromEvent = (event: React.PointerEvent): Point | null => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const bounds = wrap.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return null;
    return {
      x: roundNorm(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))),
      y: roundNorm(Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))),
    };
  };

  const beginPinDrag = (event: React.PointerEvent<HTMLElement>, id: string, isDraft: boolean) => {
    if (pinsLocked || event.button > 0) return;
    event.stopPropagation();
    event.preventDefault();
    ignoreBlur.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      isDraft,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    setDraggingId(id);
  };

  const movePinDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
      drag.moved = true;
    }
    const point = commentPointFromEvent(event);
    if (!point) return;
    dragPosRef.current = { id: drag.id, ...point };
    setDragPos({ id: drag.id, ...point });
    const current = draftRef.current;
    if (current && (drag.isDraft || current.id === drag.id)) {
      const next = { ...current, x: point.x, y: point.y };
      draftRef.current = next;
      setDraft(next);
    }
  };

  const endPinDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDraggingId(null);
    const pos = dragPosRef.current;
    dragPosRef.current = null;
    setDragPos(null);

    if (!drag.moved) {
      if (!drag.isDraft) {
        const comment = annotationsRef.current.comments.find((item) => item.id === drag.id);
        if (comment && !pinsLocked) {
          if (draftRef.current && draftRef.current.id !== comment.id) saveDraft(true);
          openEdit(comment);
        } else {
          setActiveCommentId((id) => (id === drag.id ? null : drag.id));
        }
      }
      window.setTimeout(() => {
        ignoreBlur.current = false;
      }, 0);
      return;
    }

    if (drag.isDraft) {
      window.setTimeout(() => {
        ignoreBlur.current = false;
        textareaRef.current?.focus();
      }, 0);
      return;
    }

    if (pos && onChange) {
      onChange({
        ...annotations,
        comments: annotations.comments.map((comment) =>
          comment.id === drag.id ? { ...comment, x: pos.x, y: pos.y } : comment,
        ),
      });
    }
  };

  const pinPosition = (comment: Pick<PinComment, 'id' | 'x' | 'y'>) => (dragPos?.id === comment.id ? dragPos : comment);

  /**
   * Where a comment panel should sit relative to its pin, as CSS variables.
   *
   * A pin near the right edge would otherwise push its panel past the image and
   * give the whole editor a horizontal scrollbar, since `.stage` scrolls. The
   * guards keep an image narrower than the panel itself from flipping, where
   * both sides overflow and the default at least stays predictable.
   */
  const panelPlacement = (point: { x: number; y: number }): CSSProperties => {
    const flipX = size.width > PANEL_WIDTH && point.x * size.width + PANEL_WIDTH > size.width;
    const flipY = size.height > PANEL_HEIGHT && point.y * size.height + PANEL_HEIGHT > size.height;
    return {
      left: `${point.x * 100}%`,
      top: `${point.y * 100}%`,
      '--flip-x': flipX ? 1 : 0,
      '--flip-y': flipY ? 1 : 0,
    } as CSSProperties;
  };

  const canvasCursor = readOnly ? 'default' : tool === 'text' ? 'text' : 'crosshair';

  /**
   * The comment tool owns the cursor, pins included.
   *
   * A pin is a `<button>`, so its own `pointer` / `grab` beats the canvas's
   * crosshair underneath it — and while someone is placing comments, crossing an
   * existing pin flipped the cursor to "press me" over a surface whose whole job
   * at that moment is "click to place". The mode is the thing being expressed,
   * so the mode wins.
   *
   * Only while the comment tool is active: with the draw tool the pins are
   * ordinary draggable objects and keep saying so.
   */
  const pinKeepsCrosshair = !pinsLocked && tool === 'comment';
  const isEditingExisting = Boolean(draft && annotations.comments.some((comment) => comment.id === draft.id));

  const cancelDraft = () => {
    draftRef.current = null;
    setDraft(null);
  };

  return (
    <div ref={wrapRef} className={clsx(s.wrap, className)} style={{ '--label-scale': labelScale } as CSSProperties}>
      <img ref={imgRef} className={s.image} src={imageSrc} alt="" onLoad={syncSize} draggable={false} />
      <canvas
        ref={canvasRef}
        className={s.canvas}
        style={{
          cursor: canvasCursor,
          pointerEvents: readOnly ? 'none' : 'auto',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drawing.current = null;
          shaping.current = null;
          pendingComment.current = null;
          pendingLabel.current = null;
        }}
      />
      {shownLabels.map((label) => {
        const isActive = !readOnly && label.id === activeLabelId;
        const isTyping = !readOnly && label.id === labelDraft?.id;
        return (
          <div
            key={label.id}
            className={clsx(s.label, !readOnly && s.labelMove, isActive && s.labelActive, isTyping && s.labelTyping)}
            style={labelStyle(label)}
            onPointerDown={(event) => beginLabelDrag(event, label, 'move')}
            onPointerMove={moveLabelDrag}
            onPointerUp={endLabelDrag}
            onPointerCancel={cancelLabelDrag}
            onDoubleClick={(event) => {
              event.stopPropagation();
              if (!readOnly && !isTyping) editLabel(label);
            }}
          >
            {/* While typing, the text underneath is invisible and only sizes the box,
                so the box grows with what is typed. The trailing space holds open a
                last line that is still empty. */}
            <span className={s.labelText} aria-hidden={isTyping || undefined}>
              {isTyping ? `${label.text || LABEL_PLACEHOLDER} ` : label.text}
            </span>
            {isTyping && (
              <textarea
                ref={labelFieldRef}
                className={s.labelField}
                value={label.text}
                placeholder={LABEL_PLACEHOLDER}
                aria-label="Label text"
                onChange={(event) => updateLabel({ ...label, text: event.target.value })}
                onBlur={() => {
                  if (!labelFocusing.current) leaveLabelField();
                }}
              />
            )}
            {isActive && (
              <>
                <span
                  className={s.labelGrip}
                  aria-hidden
                  onPointerDown={(event) => beginLabelDrag(event, label, 'size')}
                />
                <div
                  className={clsx(
                    s.labelBar,
                    label.y * size.height < 48 && s.labelBarBelow,
                    label.x > 0.5 && s.labelBarEnd,
                  )}
                  onPointerDown={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => {
                    /* Buttons here must not take the caret out of the label; the size
                       field and its presets need the focus they are clicked for. */
                    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <LabelSizeField
                    value={label.size}
                    onChange={(next) => {
                      setLastLabelSize(next);
                      updateLabel({ ...label, size: next });
                    }}
                  />
                  <button
                    type="button"
                    className={clsx(s.labelBarButton, s.labelBold, label.bold && s.labelBarButtonOn)}
                    aria-label="Bold"
                    aria-pressed={label.bold}
                    onClick={() => updateLabel({ ...label, bold: !label.bold })}
                  >
                    B
                  </button>
                  {!isTyping && (
                    <button type="button" className={s.labelBarButton} onClick={() => editLabel(label)}>
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className={s.labelBarButton}
                    aria-label="Delete label"
                    onClick={() => removeLabel(label)}
                  >
                    <CloseIcon width={12} height={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
      {annotations.comments.map((comment, index) => {
        const pos = pinPosition(comment);
        return (
          <button
            key={comment.id}
            type="button"
            className={clsx(
              s.pin,
              !pinsLocked && !pinKeepsCrosshair && s.pinMove,
              pinKeepsCrosshair && s.pinCrosshair,
              draggingId === comment.id && s.pinDragging,
            )}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
            aria-label={`Comment ${index + 1}`}
            onClick={
              pinsLocked
                ? (event) => {
                    event.stopPropagation();
                    setActiveCommentId((id) => (id === comment.id ? null : comment.id));
                  }
                : undefined
            }
            onPointerDown={(event) => beginPinDrag(event, comment.id, false)}
            onPointerMove={movePinDrag}
            onPointerUp={endPinDrag}
            onPointerCancel={() => {
              dragRef.current = null;
              dragPosRef.current = null;
              setDragPos(null);
              setDraggingId(null);
            }}
          >
            {index + 1}
          </button>
        );
      })}
      {annotations.comments.map((comment) =>
        activeCommentId === comment.id ? (
          <div key={`${comment.id}-body`} className={s.bubble} style={panelPlacement(pinPosition(comment))}>
            {!pinsLocked && (
              <button
                type="button"
                className={s.remove}
                aria-label="Remove comment"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  removeComment(comment.id);
                }}
              >
                <CloseIcon width={12} height={12} />
              </button>
            )}
            {comment.text}
          </div>
        ) : null,
      )}
      {draft && (
        <>
          {!isEditingExisting && (
            <span
              className={clsx(
                s.pin,
                !pinKeepsCrosshair && s.pinMove,
                pinKeepsCrosshair && s.pinCrosshair,
                draggingId === draft.id && s.pinDragging,
              )}
              style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
              aria-hidden
              onPointerDown={(event) => beginPinDrag(event, draft.id, true)}
              onPointerMove={movePinDrag}
              onPointerUp={endPinDrag}
            >
              +
            </span>
          )}
          <div className={s.composer} style={panelPlacement(draft)} onPointerDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={s.remove}
              aria-label="Cancel comment"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                cancelDraft();
              }}
            >
              <CloseIcon width={12} height={12} />
            </button>
            <label className={s.visuallyHidden} htmlFor={inputId}>
              Comment
            </label>
            <textarea
              ref={textareaRef}
              id={inputId}
              className={s.composerInput}
              value={draft.input}
              rows={3}
              placeholder={isEditingExisting ? 'Edit comment' : 'Add a comment'}
              onChange={(event) => {
                const next = { ...draft, input: event.target.value };
                draftRef.current = next;
                setDraft(next);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onBlur={() => saveDraft(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  saveDraft();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  cancelDraft();
                }
              }}
            />
            {isEditingExisting && (
              <button
                type="button"
                className={s.removeText}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  removeComment(draft.id);
                }}
              >
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * A label's size, typed or picked.
 *
 * The field keeps a draft of its own so a half-typed number is not clamped out
 * from under the typist: on the way to 120, "1" is simply left alone. A number
 * in range applies as it is typed; leaving the field or pressing Return settles
 * anything else to the nearest size there is.
 */
function LabelSizeField({ value, onChange }: { value: number; onChange: (size: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [shownValue, setShownValue] = useState(value);
  if (shownValue !== value) {
    setShownValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    const typed = Number(draft);
    const next =
      draft.trim() && Number.isFinite(typed)
        ? Math.min(LABEL_SIZE_MAX, Math.max(LABEL_SIZE_MIN, Math.round(typed)))
        : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const options = Array.from(new Set([...LABEL_SIZE_PRESETS, value])).sort((a, b) => a - b);

  return (
    <span className={s.labelSize}>
      <input
        type="number"
        min={LABEL_SIZE_MIN}
        max={LABEL_SIZE_MAX}
        step={1}
        value={draft}
        aria-label="Text size in pixels"
        onChange={(event) => {
          setDraft(event.target.value);
          const typed = Number(event.target.value);
          if (Number.isInteger(typed) && typed >= LABEL_SIZE_MIN && typed <= LABEL_SIZE_MAX) onChange(typed);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          commit();
        }}
      />
      <span aria-hidden>px</span>
      <select
        value={String(value)}
        aria-label="Text size presets"
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} px
          </option>
        ))}
      </select>
    </span>
  );
}
