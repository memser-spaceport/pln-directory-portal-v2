'use client';

import { useId } from 'react';

import type { SectionImportWait } from '@/components/common/profile/SectionEditLock/SectionEditLockContext';
import { formatFileSize } from '@/utils/file.utils';

import { useReadingBarProgress } from './useReadingProgress';
import p from './ExperienceImportPanel.module.scss';

/**
 * The wait's three lines — title, bar, size — as the panel's reading row draws
 * them, in that row's own classes. The panel puts a spinner before this and a
 * Cancel after it; the floating status bar does the same. What sits between is
 * this, once, so the two rows are one row.
 *
 * `live` makes the title a status region. Only the floating bar asks for it:
 * both rows are mounted at once while the bar stands, and one announcement per
 * beat is enough.
 */
export function ImportWaitStatus({
  wait,
  live = false,
}: {
  wait: Pick<SectionImportWait, 'fileName' | 'fileSize' | 'startedAt' | 'settled'>;
  live?: boolean;
}) {
  const progress = useReadingBarProgress(wait);
  const labelId = useId();

  return (
    <div className={p.readingText}>
      <div className={p.readingTitle} id={labelId} role={live ? 'status' : undefined}>
        Reading {wait.fileName}…
      </div>
      {wait.fileSize != null && <div className={p.readingMeta}>{formatFileSize(wait.fileSize)}</div>}
      <div
        className={p.progressTrack}
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={p.progressFill} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
