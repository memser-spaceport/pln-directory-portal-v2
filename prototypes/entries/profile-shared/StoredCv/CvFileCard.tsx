'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';

import { DocumentIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';

import { CvPreviewModal } from './CvPreviewModal';
import { fileKind, formatUploadedDate, isPdfName, withSampleUrl } from './mockCv';
import type { StoredCv } from './types';
import s from './CvFileCard.module.scss';

/* react-pdf touches `window` at import — see `CvPdfPage`. */
const CvPdfPage = dynamic(() => import('./CvPdfPage'), { ssr: false });

/**
 * The thumbnail's width, derived from the row it has to fit rather than picked.
 * The offer row holds 44px of content (`FileUploader`'s title over its
 * description) in 16px of padding; A4 is 1:1.414, so 31 wide paints ~44 tall and
 * the file row measures the same 78px the offer and reading rows do.
 */
const THUMB_WIDTH = 31;

interface CvFileCardProps {
  cv: StoredCv;
  /** Cuts the trailing "Preview" and the press — for a read-only quotation. */
  quiet?: boolean;
}

/**
 * The resting state of a kept CV: the file, in the box the offer stood in.
 *
 * **One box, three states.** The empty offer is `FileUploader.container` — a
 * 16px row with a 40px disc, a title and an Upload button. The reading state
 * (`ExperienceImportPanel.reading`) is deliberately that same row with a spinner
 * in the disc's place, "so the box shouldn't move when the file lands in it".
 * This is the third: same padding, radius and border, and the first page of the
 * document where the disc was. Offer → reading → file is one box changing what
 * it holds, not three components.
 *
 * **A thumbnail, not a full-width render.** Production's precedent for a kept
 * document is Demo Day's `MediaPreview`: a 16:9 card of the file with an expand
 * button, and its name and size in a row under it. That is right for a pitch
 * slide, which *is* a picture. A CV is an A4 page in a 720px column, so the same
 * treatment would spend ~1000px on page one of a document nobody reads on the
 * profile — they read it in the preview. The page is painted small, where the
 * disc was, and the press opens the full document in the same modal grammar
 * `MediaPreview` uses. Recognisable at a glance, readable on demand.
 *
 * **And small means the offer's size, not "small for a page".** The page is a
 * mark saying *a document is here*, so it is sized to the row rather than the
 * row to it — see `THUMB_WIDTH`. The first version let the page set the height
 * and the section quietly grew by 22px the moment someone gave it a file.
 *
 * **The whole row is the press.** One control, one job: open the file. The
 * trailing "Preview" is the affordance's name, not a second control — a bordered
 * row with a picture in it does not say it can be opened, and this is the one
 * question the resting state has to answer that nothing else on the card does.
 *
 * Replace and Remove are not here. They are actions on the *section* and live in
 * its header slot with every other section's controls — see `CvHeaderActions`.
 */
export function CvFileCard({ cv, quiet = false }: CvFileCardProps) {
  const [open, setOpen] = useState(false);
  const [painted, setPainted] = useState(false);
  const file = withSampleUrl(cv);
  const previewable = isPdfName(file.fileName) && !!file.url && !quiet;

  const meta = [fileKind(file.fileName), formatFileSize(file.size), `Uploaded ${formatUploadedDate(file.uploadedAt)}`]
    .filter(Boolean)
    .join(' · ');

  const thumb = (
    <div className={clsx(s.thumb, painted && s.thumbPainted)} aria-hidden="true">
      {/* The document glyph holds the slot until the page paints, and stays
          for a file pdf.js cannot open (DOC, DOCX) — the meta line already says
          which kind it is, so the glyph never has to. */}
      {!painted && <DocumentIcon width={16} height={16} className={s.thumbIcon} />}
      {isPdfName(file.fileName) && file.url && (
        <div className={s.thumbPage}>
          <CvPdfPage url={file.url} width={THUMB_WIDTH} onLoadSuccess={() => setPainted(true)} />
        </div>
      )}
    </div>
  );

  const text = (
    <div className={s.text}>
      <div className={s.name}>{file.fileName}</div>
      <div className={s.meta}>{meta}</div>
    </div>
  );

  return (
    <>
      {previewable ? (
        <button type="button" className={clsx(s.row, s.rowPressable)} onClick={() => setOpen(true)}>
          {thumb}
          {text}
          <span className={s.trailing}>Preview</span>
        </button>
      ) : (
        <div className={s.row}>
          {thumb}
          {text}
        </div>
      )}
      {previewable && <CvPreviewModal cv={file} isOpen={open} onClose={() => setOpen(false)} />}
    </>
  );
}
