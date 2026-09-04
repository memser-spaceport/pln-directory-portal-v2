'use client';

import dynamic from 'next/dynamic';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';

import { fileKind, formatUploadedDate } from './mockCv';
import type { StoredCv } from './types';
import s from './CvPreviewModal.module.scss';

/* The same wrapper the card's thumbnail uses, with every page stacked. See
   `CvPdfPage` for why the modal does not mount production's paged `PdfViewer`.
   Dynamic for the reason given there. */
const CvPdfPage = dynamic(() => import('./CvPdfPage'), { ssr: false });

/** An A4 page at readable scale; the card is 720 wide with 20px padding and a 16px inset. */
const PAGE_WIDTH = 640;

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
  const meta = [fileKind(cv.fileName), formatFileSize(cv.size), `Uploaded ${formatUploadedDate(cv.uploadedAt)}`].join(
    ' · ',
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="cv-preview-title" lockScroll>
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
          {cv.url && <CvPdfPage url={cv.url} width={PAGE_WIDTH} pages="all" fallback={<p className={s.loading}>Loading…</p>} />}
        </div>
      </div>
    </Modal>
  );
}
