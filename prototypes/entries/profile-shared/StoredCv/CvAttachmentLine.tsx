'use client';

import clsx from 'clsx';

import { DocumentIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';

import type { StoredCv } from './types';
import s from './CvAttachmentLine.module.scss';

interface CvAttachmentLineProps {
  cv: StoredCv;
  /**
   * `inline` — one quiet line inside a card that is quoting a profile (the
   * application step's read-back). `chip` — a bordered attachment, the way a
   * mail client shows a file under a message (the email the team gets).
   */
  variant?: 'inline' | 'chip';
  className?: string;
}

/**
 * The CV as it appears *on an application*: a name and a size, no controls.
 *
 * The read-back on the application step quotes the profile that is about to be
 * sent — name, role line, dates, skills — and the CV now goes with it, so it is
 * quoted too, one line under the skills. A quotation, not the resting card: the
 * card's thumbnail and Preview answer "what is this file", which the person
 * settled a step ago; here the question is "is it going", and a name answers
 * that. `Edit profile` beside the read-back is how you get back to the card.
 *
 * The email variant is the same line in a chip, because that is how every mail
 * client renders an attachment, and the preview's job is to look like the mail
 * a lead will actually open.
 *
 * **No line when there is no CV.** An application without one is not an
 * application with something missing — the CV is optional on every surface
 * that offers it — so an empty row here would be the read-back apologising for
 * a gap that isn't one (lesson 14).
 */
export function CvAttachmentLine({ cv, variant = 'inline', className }: CvAttachmentLineProps) {
  return (
    <div className={clsx(s.line, variant === 'chip' && s.chip, className)}>
      <DocumentIcon width={14} height={14} className={s.icon} aria-hidden="true" />
      <span className={s.name}>{cv.fileName}</span>
      <span className={s.size}>{formatFileSize(cv.size)}</span>
    </div>
  );
}
