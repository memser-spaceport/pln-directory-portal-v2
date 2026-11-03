'use client';

import { RefObject, useEffect, useState } from 'react';

import { CloseIcon, PencilSimpleLineIcon } from '@/components/icons';
import { AnnotatedPreview } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotatedPreview';
import { hasAnyAnnotation, parseAnnotations } from '@/components/page/ai-apps/components/screenshot-feedback/types';

import { IMAGE_ANNOTATIONS_ATTR } from '../ImageBlot';

import s from './NoteImageChrome.module.scss';

interface Frame {
  image: HTMLImageElement;
  top: number;
  left: number;
  width: number;
  height: number;
  src: string;
  annotations: string | null;
}

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
  onAnnotate: (image: HTMLImageElement) => void;
  onRemove: (image: HTMLImageElement) => void;
}

/**
 * The Annotate control and the drawn marks for each image in a feedback note.
 *
 * Both sit outside the contenteditable, on top of Quill's own `<img>`, the same
 * way the screenshot list draws its marks and its Annotate button.
 */
export function NoteImageChrome({ containerRef, onAnnotate, onRemove }: Props) {
  const [frames, setFrames] = useState<Frame[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let raf = 0;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      const next: Frame[] = [];
      root.querySelectorAll<HTMLImageElement>('.ql-editor img').forEach((image) => {
        if (!image.complete) {
          image.addEventListener('load', schedule, { once: true });
        }
        const box = image.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return;
        next.push({
          image,
          top: box.top - origin.top,
          left: box.left - origin.left,
          width: box.width,
          height: box.height,
          src: image.getAttribute('src') ?? '',
          annotations: image.getAttribute(IMAGE_ANNOTATIONS_ATTR),
        });
      });
      setFrames(next);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    schedule();
    const editor = root.querySelector('.ql-editor');
    const observer = new MutationObserver(schedule);
    if (editor) {
      observer.observe(editor, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src', IMAGE_ANNOTATIONS_ATTR, 'width', 'class', 'style'],
      });
    }
    const resize = editor && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    resize?.observe(editor as Element);
    const scroller = root.querySelector('.ql-container');
    scroller?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resize?.disconnect();
      scroller?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [containerRef]);

  return (
    <>
      {frames.map((frame, index) => {
        const annotations = parseAnnotations(frame.annotations);
        return (
          <div
            key={`${frame.src}-${index}`}
            className={s.frame}
            style={{ top: frame.top, left: frame.left, width: frame.width, height: frame.height }}
          >
            {hasAnyAnnotation(annotations) && annotations && (
              <AnnotatedPreview className={s.preview} src={frame.src} alt="" annotations={annotations} />
            )}
            <div className={s.actions}>
              <button
                type="button"
                className={s.action}
                aria-label="Annotate image"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onAnnotate(frame.image)}
              >
                <PencilSimpleLineIcon width={12} height={12} />
                <span aria-hidden="true">Annotate</span>
              </button>
              <button
                type="button"
                className={s.action}
                aria-label="Remove image"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRemove(frame.image)}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
