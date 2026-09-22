'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';
import { type AnnotationState, type PinComment, type Point, type Shape, type ShapeKind, type Stroke } from './types';

import s from './AnnotationCanvas.module.scss';

export const DRAW_COLORS = ['#dc2626', '#1b4dff', '#0a9952', '#d97706', '#0a0c11'] as const;
export const DEFAULT_DRAW_COLOR = DRAW_COLORS[0];

const STROKE_WIDTH_RATIO = 0.006;
const DRAG_THRESHOLD_PX = 4;

export type AnnotatorTool = 'draw' | 'comment' | ShapeKind;

const SHAPE_TOOLS: AnnotatorTool[] = ['rect', 'ellipse'];

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
  className?: string;
}

type DraftComment = PinComment & { input: string };

type ShapeDrag = {
  kind: ShapeKind;
  from: Point;
  to: Point;
};

type PinDrag = {
  id: string;
  isDraft: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

function toNorm(point: Point, width: number, height: number): Point {
  return { x: point.x / width, y: point.y / height };
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
  if (shape.kind === 'ellipse') {
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
function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Pick<AnnotationState, 'strokes' | 'shapes'>,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of annotations.strokes) traceStroke(ctx, stroke, width, height);
  for (const shape of annotations.shapes ?? []) traceShape(ctx, shape, width, height);
}

/** Normalizes a drag in any direction to a non-negative box. */
function shapeFromDrag(kind: ShapeKind, color: string, from: Point, to: Point, width: number, height: number): Shape {
  const a = toNorm(from, width, height);
  const b = toNorm(to, width, height);
  return {
    kind,
    color,
    width: STROKE_WIDTH_RATIO,
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

export function AnnotationCanvas({
  imageSrc,
  annotations,
  onChange,
  tool = 'draw',
  strokeColor = DEFAULT_DRAW_COLOR,
  readOnly = false,
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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<DraftComment | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const inputId = useId();

  const syncSize = () => {
    const img = imgRef.current;
    if (!img) return;
    const width = img.clientWidth;
    const height = img.clientHeight;
    if (width === 0 || height === 0) return;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
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
      x: point.x / width,
      y: point.y / height,
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
    if (tool === 'comment') {
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
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const beginPinDrag = (event: React.PointerEvent<HTMLElement>, id: string, isDraft: boolean) => {
    if (readOnly || event.button > 0) return;
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
        if (comment && !readOnly) {
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

  const canvasCursor = readOnly ? 'default' : 'crosshair';

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
  const pinKeepsCrosshair = !readOnly && tool === 'comment';
  const isEditingExisting = Boolean(draft && annotations.comments.some((comment) => comment.id === draft.id));

  const cancelDraft = () => {
    draftRef.current = null;
    setDraft(null);
  };

  return (
    <div ref={wrapRef} className={clsx(s.wrap, className)}>
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
        }}
      />
      {annotations.comments.map((comment, index) => {
        const pos = pinPosition(comment);
        return (
          <button
            key={comment.id}
            type="button"
            className={clsx(
              s.pin,
              !readOnly && !pinKeepsCrosshair && s.pinMove,
              pinKeepsCrosshair && s.pinCrosshair,
              draggingId === comment.id && s.pinDragging,
            )}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
            aria-label={`Comment ${index + 1}`}
            onClick={
              readOnly
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
          <div
            key={`${comment.id}-body`}
            className={s.bubble}
            style={{
              left: `${pinPosition(comment).x * 100}%`,
              top: `${pinPosition(comment).y * 100}%`,
            }}
          >
            {!readOnly && (
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
          <div
            className={s.composer}
            style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
            onPointerDown={(event) => event.stopPropagation()}
          >
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
