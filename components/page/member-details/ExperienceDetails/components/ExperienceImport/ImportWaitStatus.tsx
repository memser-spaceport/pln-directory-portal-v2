'use client';

import { useId } from 'react';

import type { SectionImportWait } from '@/components/common/profile/SectionEditLock/SectionEditLockContext';
import { formatFileSize } from '@/utils/file.utils';

import { USUAL_READ_MS, useReadingBarProgress } from './useReadingProgress';
import p from './ExperienceImportPanel.module.scss';

function usualWaitHint(usualMs: number): string {
  const seconds = Math.round(usualMs / 1000 / 5) * 5;
  return `Usually takes about ${Math.max(seconds, 5)} seconds`;
}

/**
 * The wait's three lines — title, bar, size · hint — as the panel's reading
 * row draws them, in that row's own classes. The panel puts a spinner before
 * this and a Cancel after it; the floating status bar does the same. What
 * sits between is this, once, so the two rows are one row.
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
  const { progress, overdue } = useReadingBarProgress(wait);
  const labelId = useId();

  return (
    <div className={p.readingText}>
      <div className={p.readingTitle} id={labelId} role={live ? 'status' : undefined}>
        Reading {wait.fileName}…
      </div>
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
      <div className={p.readingMeta}>
        {wait.fileSize != null && <>{formatFileSize(wait.fileSize)} · </>}
        {overdue ? 'Taking longer than usual — still reading' : usualWaitHint(USUAL_READ_MS)}
      </div>
    </div>
  );
}
