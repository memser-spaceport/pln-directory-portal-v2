'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef } from 'react';
import { renderAnnotations } from './AnnotationCanvas';
import type { AnnotationState } from './types';

import ac from './AnnotationCanvas.module.scss';
import s from './AnnotatedPreview.module.scss';

type Props = {
  src: string;
  alt: string;
  annotations: AnnotationState;
  className?: string;
};

/**
 * A screenshot with its marks drawn on, for a preview: nothing to click (it
 * sits inside the preview's own button, so its comment pins are plain
 * numbered markers, not AnnotationCanvas's buttons).
 *
 * The picture keeps its proportions at full width and the canvas covers
 * exactly the picture, so the marks stay where they were drawn; a fixed-height
 * frame around it crops from the top, as the plain preview does.
 */
export function AnnotatedPreview({ src, alt, annotations, className }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const width = img.clientWidth;
    const height = img.clientHeight;
    if (width === 0 || height === 0) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) renderAnnotations(ctx, annotations, width, height);
  }, [annotations]);

  useEffect(() => {
    draw();
    const img = imgRef.current;
    if (!img || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(draw);
    observer.observe(img);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <span className={clsx(s.root, className)}>
      <img ref={imgRef} className={s.image} src={src} alt={alt} onLoad={draw} draggable={false} />
      <canvas ref={canvasRef} className={s.canvas} aria-hidden />
      {annotations.comments.map((comment, index) => (
        <span
          key={comment.id}
          className={clsx(ac.pin, s.pin)}
          style={{ left: `${comment.x * 100}%`, top: `${comment.y * 100}%` }}
          aria-hidden
        >
          {index + 1}
        </span>
      ))}
    </span>
  );
}
