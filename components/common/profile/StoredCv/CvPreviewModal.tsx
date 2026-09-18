'use client';

import dynamic from 'next/dynamic';
import { useMeasure } from 'react-use';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';

import { fileKind, formatUploadedDate } from './cvFile';
import type { StoredCv } from './types';
import s from './CvPreviewModal.module.scss';

/* The same wrapper the card's thumbnail uses, with every page stacked. See
   `CvPdfPage` for why the modal does not mount production's paged `PdfViewer`.
   Dynamic for the reason given there. */
const CvPdfPage = dynamic(() => import('./CvPdfPage'), { ssr: false });

/**
 * A4 at 96dpi — the page's true size, and the ceiling the canvas is rendered at.
 *
 * A cap rather than a width: the reader is measured, so on a narrower viewport
 * the page shrinks to fit instead of being clipped by its own scroller, and on a
 * wider one it stops here rather than upscaling a 794px document into a blurry
 * 900px one.
 *
 * It replaces a hardcoded 640 that had to agree by hand with a `max-width` in
 * the stylesheet. It did not: `Modal`'s container caps at 600, so the card was
 * 600 wide with a 640 canvas inside it.
 */
const A4_WIDTH = 794;

interface CvPreviewModalProps {
  cv: StoredCv;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The CV, readable — what the resting card's press opens.
 *
 * The chrome is the job board's refer modal (`ReferModal.module.scss`): the same
 * 24px radius, 20px padding, drop shadow and the 24px grey close disc every
 * dialog on the board wears. The body is production's `PdfViewer`, the component
 * Demo Day's `MediaPreview` opens a pitch deck in, so a CV and a deck read the
 * same way in the same product.
 *
 * Two things this modal deliberately is not. Not a lightbox: `MediaPreview`'s
 * overlay is a black sheet with a floating ✕, right for one 16:9 slide and wrong
 * for a multi-page document you scroll and page through — a document wants a
 * card with a name on it. And not a place to act: no Replace, no Remove. Those
 * are section actions and stay in the section header; a preview that also lets
 * you delete the thing you are previewing is two jobs behind one press.
 */
export function CvPreviewModal({ cv, isOpen, onClose }: CvPreviewModalProps) {
  /* One fact fewer when S3 would not report a size — see `StoredCv.size`. */
  const meta = [
    fileKind(cv.fileName),
    cv.size === undefined ? '' : formatFileSize(cv.size),
    `Uploaded ${formatUploadedDate(cv.uploadedAt)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  /* The space the page actually has, measured on a box with no padding of its
     own — see `.pageInner`. Zero until the first layout, which is why the
     fallback stands in below rather than a 0-width canvas being handed to
     react-pdf. */
  const [readerRef, { width: readerWidth }] = useMeasure<HTMLDivElement>();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="cv-preview-title"
      lockScroll
      /* Widens `Modal`'s 600px container — the card inside is `width: 100%` and
         cannot exceed it on its own. */
      className={s.container}
    >
      <div className={s.modal}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={onClose} aria-label="Close preview">
          <CloseIcon />
        </Button>
        <div className={s.head}>
          <h2 id="cv-preview-title" className={s.title}>
            {cv.fileName}
          </h2>
          <p className={s.meta}>{meta}</p>
        </div>
        <div className={s.page}>
          <div ref={readerRef} className={s.pageInner}>
            {cv.url &&
              (readerWidth > 0 ? (
                <CvPdfPage
                  url={cv.url}
                  width={Math.min(readerWidth, A4_WIDTH)}
                  pages="all"
                  fallback={<p className={s.loading}>Loading…</p>}
                />
              ) : (
                <p className={s.loading}>Loading…</p>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
