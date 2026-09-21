'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon, PencilSimpleLineIcon } from '@/components/icons';
// The feedback dialog's card (radius, shadow), header, close disc and footer —
// the same borrowings PinThread makes, so the editor reads as that dialog grown.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import s from './ShotEditor.module.scss';

type Tool = 'pen' | 'box' | 'blur';

interface Point {
  x: number;
  y: number;
}

/** Everything is in the picture's own pixels, so a mark lands where it was drawn at any display size. */
type Mark =
  | { kind: 'pen'; pts: Point[] }
  | { kind: 'box'; x: number; y: number; w: number; h: number }
  | { kind: 'blur'; x: number; y: number; w: number; h: number };

/** Smaller than this is a stray click, not a rectangle. */
const MIN_BOX = 6;
/** The mark's colour when the DS token isn't loaded — the error pair production writes everywhere. */
const MARK_FALLBACK = '#d21a0e';

function markColor(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--foreground-error-primary').trim();
  return v || MARK_FALLBACK;
}

function normalise(m: { x: number; y: number; w: number; h: number }, max: { w: number; h: number }) {
  const x = Math.max(0, Math.min(m.x, m.x + m.w));
  const y = Math.max(0, Math.min(m.y, m.y + m.h));
  const r = Math.min(max.w, Math.max(m.x, m.x + m.w));
  const b = Math.min(max.h, Math.max(m.y, m.y + m.h));
  return { x, y, w: r - x, h: b - y };
}

/**
 * Paints the picture and then the marks over it, in order. Blur is applied to
 * whatever is already painted under it, so a box drawn after it stays crisp and
 * one drawn before it is hidden with the rest — the order the person drew in.
 * The same routine paints the live canvas and the file that gets posted, so what
 * you see is what is sent.
 */
function paint(canvas: HTMLCanvasElement, img: HTMLImageElement, marks: Mark[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const line = Math.max(3, Math.round(canvas.width / 240));
  const color = markColor();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (const m of marks) {
    if (m.kind === 'blur') {
      const { x, y, w, h } = normalise(m, { w: canvas.width, h: canvas.height });
      if (w < 1 || h < 1) continue;
      // Pixelate rather than gaussian-blur: a coarse block grid cannot be
      // sharpened back into the text it hides, and it needs no filter support.
      const block = Math.max(8, Math.round(canvas.width / 60));
      const tmp = document.createElement('canvas');
      tmp.width = Math.max(1, Math.ceil(w / block));
      tmp.height = Math.max(1, Math.ceil(h / block));
      tmp.getContext('2d')?.drawImage(canvas, x, y, w, h, 0, 0, tmp.width, tmp.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
      continue;
    }

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = line;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (m.kind === 'box') {
      const { x, y, w, h } = normalise(m, { w: canvas.width, h: canvas.height });
      ctx.strokeRect(x, y, w, h);
    } else if (m.pts.length === 1) {
      ctx.beginPath();
      ctx.arc(m.pts[0].x, m.pts[0].y, line, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      m.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }
}

/* 16px stroked glyphs in currentColor, the weight of the DS icons beside them. */
const glyph = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true } as const;
const stroke = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function BoxGlyph() {
  return (
    <svg {...glyph}>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" {...stroke} />
    </svg>
  );
}

function BlurGlyph() {
  return (
    <svg {...glyph}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" {...stroke} />
      <path d="M2.5 8h11M8 2.5v11" {...stroke} />
    </svg>
  );
}

function UndoGlyph() {
  return (
    <svg {...glyph}>
      <path d="M6 3.5 3 6.5l3 3" {...stroke} />
      <path d="M3 6.5h6.5a3.5 3.5 0 0 1 0 7H7" {...stroke} />
    </svg>
  );
}

const TOOLS: { tool: Tool; label: string; icon: React.ReactNode }[] = [
  { tool: 'pen', label: 'Draw', icon: <PencilSimpleLineIcon width={16} height={16} /> },
  { tool: 'box', label: 'Box', icon: <BoxGlyph /> },
  { tool: 'blur', label: 'Hide', icon: <BlurGlyph /> },
];

interface Props {
  /** The captured picture. */
  src: string;
  /** `view` is the thread's read-only look; `edit` is the composer's, with the tools. */
  mode: 'view' | 'edit';
  onClose: () => void;
  /** Edit mode: the flattened picture, only when something was marked. */
  onDone?: (shot: string) => void;
}

/**
 * The screenshot at a size you can read, and — before a comment is posted — a
 * small set of marks to draw on it.
 *
 * One surface for both jobs, so there is one door on the picture: pressing it
 * opens this, and whether you can mark it depends on whether the comment has
 * been posted. The three marks answer the three things people do to a
 * screenshot before sending it: point at something (Draw, Box), and hide what
 * should not travel (Hide). Words belong in the comment, which is right beside
 * it. A posted picture is not editable — the author reads what was sent.
 *
 * Marks are flattened into the JPEG on Done, so nothing about them has to be
 * stored or migrated: a comment's `shot` is still one image.
 */
export function ShotEditor({ src, mode, onClose, onDone }: Props) {
  const titleId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [marks, setMarks] = useState<Mark[]>([]);
  // The mark being drawn right now; it joins `marks` on release.
  const [live, setLive] = useState<Mark | null>(null);
  const editing = mode === 'edit';

  useEffect(() => {
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = src;
  }, [src]);

  // The canvas takes the picture's own size once it has loaded; CSS scales it to the stage.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    if (canvas.width !== img.naturalWidth) canvas.width = img.naturalWidth;
    if (canvas.height !== img.naturalHeight) canvas.height = img.naturalHeight;
    paint(canvas, img, live ? [...marks, live] : marks);
  }, [img, marks, live]);

  const undo = useCallback(() => setMarks((prev) => prev.slice(0, -1)), []);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, undo]);

  /** Client coordinates → the picture's own pixels. */
  const pointOf = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = e.currentTarget;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
    };
  };

  const start = useRef<Point | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editing || !img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointOf(e);
    start.current = p;
    setLive(tool === 'pen' ? { kind: 'pen', pts: [p] } : { kind: tool, x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const from = start.current;
    if (!from) return;
    const p = pointOf(e);
    setLive((cur) => {
      if (!cur) return cur;
      if (cur.kind === 'pen') return { kind: 'pen', pts: [...cur.pts, p] };
      return { kind: cur.kind, x: from.x, y: from.y, w: p.x - from.x, h: p.y - from.y };
    });
  };

  const onPointerUp = () => {
    start.current = null;
    if (!live) return;
    const keep = live.kind === 'pen' || (Math.abs(live.w) >= MIN_BOX && Math.abs(live.h) >= MIN_BOX);
    if (keep) setMarks((prev) => [...prev, live]);
    setLive(null);
  };

  const done = () => {
    const canvas = canvasRef.current;
    if (canvas && img && marks.length > 0) {
      paint(canvas, img, marks);
      onDone?.(canvas.toDataURL('image/jpeg', 0.85));
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      // Backdrop presses close a picture you are only looking at. While you are
      // marking one, a slip past the canvas edge must not throw the marks away —
      // Cancel and Esc are the deliberate ways out.
      closeOnBackdropClick={!editing}
      ariaLabelledBy={titleId}
      inertBackground
      lockScroll
      overlayClassname={s.overlay}
      className={s.modal}
    >
      <div className={clsx(fd.root, s.card)}>
        <div className={clsx(fd.header, s.header)}>
          <h2 id={titleId} className={fd.title}>
            {editing ? 'Edit screenshot' : 'Screenshot'}
          </h2>
          <button type="button" className={fd.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {editing && (
          <div className={s.toolbar} role="toolbar" aria-label="Screenshot tools">
            <div className={s.tools}>
              {TOOLS.map((t) => (
                <button
                  key={t.tool}
                  type="button"
                  className={clsx(s.tool, tool === t.tool && s.toolOn)}
                  aria-pressed={tool === t.tool}
                  aria-label={t.label}
                  title={t.label}
                  onClick={() => setTool(t.tool)}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={s.tool}
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
              disabled={marks.length === 0}
              onClick={undo}
            >
              <UndoGlyph />
              <span>Undo</span>
            </button>
          </div>
        )}

        <div className={s.stage}>
          <canvas
            ref={canvasRef}
            className={clsx(s.canvas, editing && s.canvasEditing)}
            role="img"
            aria-label="The part of the app this comment points at"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        {editing && (
          <div className={clsx(fd.footer, s.footer)}>
            <Button style="border" variant="neutral" size="xs" onClick={onClose}>
              Cancel
            </Button>
            <Button size="xs" onClick={done}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
