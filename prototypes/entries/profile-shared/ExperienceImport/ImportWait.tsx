'use client';

import { useEffect, useState } from 'react';

import { formatFileSize } from '@/utils/file.utils';

import { USUAL_READ_MS, USUAL_UPLOAD_MS } from './parseMocks';
import p from './ExperienceImportPanel.module.scss';

/**
 * **One wait, told in two places.**
 *
 * The importer's long-wait row — "Uploading <file>…", the bar under it, the
 * "usually takes…" line — is read in the panel's card *and*, once that card is
 * scrolled away, in the floating status bar at the bottom of the viewport
 * (`FloatingEditorControls`). Two readers of one wait must never disagree: a
 * bar at 60% in the card and 40% in the floating bar would be two claims about
 * one read. So the wait is one value, made by the panel and handed to whoever
 * draws it, and everything derived from it — where the bar is, whether the
 * read is overdue, what the sentences say — is computed here, by one function
 * each, from that value alone.
 *
 * **What the value carries, and what it does not.** `ImportWait` is the wait's
 * *facts*: which beat, which file, when the clock started, when the upload
 * landed, and the row's own Cancel. Not the progress figure. The panel could
 * have reported `{ progress, overdue }` up on every tick instead, and that was
 * the smaller change to write — but a tick is ten times a second, and each one
 * would have re-rendered the whole host page (the new-member page is eight
 * cards) to move a 6px bar. Reporting the timestamps once per beat and letting
 * each reader run its own clock against them costs the host one render per
 * beat, and the two readers still cannot drift: same timestamps, same
 * `useImportProgress`, same `Date.now()` to within a tick.
 */
export interface ImportWait {
  /** Which half of the wait — the post, or the poll that follows it. */
  status: 'uploading' | 'reading';
  /** What the row names. */
  fileName: string;
  /** Stated in the meta line; null for a frame the design canvas pinned, where no file was dropped. */
  fileSize: number | null;
  /**
   * When the wait began and when the upload landed. Both null for a canvas
   * frame — no clock is running, and the bar paints a resting mid-read.
   */
  startedAt: number | null;
  uploadedAt: number | null;
  /**
   * The row's Cancel — the same function its own button calls, so the floating
   * bar's Cancel backs out of exactly what the card's would.
   */
  cancel: () => void;
}

/**
 * The progress bar's shape. Where the upload's share ends, where the bar stops
 * and waits for the result, and how often a reader re-reads the clock.
 *
 * **An estimate, drawn against the usual case, and it says so.** Production's
 * poll reports a status and nothing else — `PROCESSING` until it isn't — so
 * there is no true percentage to show, and the product's other long wait (the
 * AI Apps deploy) sweeps an indeterminate bar for exactly that reason. This
 * row does something slightly different, on purpose: the wait is a few tens of
 * seconds with a known typical length, and the thing the person actually
 * wants to know is *roughly how much of that is left*. A bar that fills over
 * the usual duration answers that; a sweep answers only "still going". The
 * honesty is in the hold — the bar never reaches the end on the clock alone.
 * It stops at `HOLD` and stays there until the result lands, and the hint
 * under it changes to say the read is taking longer than usual. What the bar
 * claims is "this far into a usual read", never "this far into yours".
 *
 * The upload's share is real: the post returning is a boundary the client
 * observes, so the bar snaps to `UPLOAD_SHARE` the moment it does. Everything
 * after is the clock.
 */
const UPLOAD_SHARE = 0.2;
const HOLD = 0.92;
const TICK_MS = 100;

/** Front-loaded, like a real read: most of the movement early, then slowing. */
const easeOut = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 2;

/**
 * "Usually takes about 10 seconds" — derived from the constants the bar is
 * drawn against, so the sentence cannot drift from the bar once the frontend
 * tunes the numbers to what the import row measures.
 */
function usuallyTakes(ms: number): string {
  const seconds = Math.round(ms / 1000 / 5) * 5;
  if (seconds >= 45) return 'Usually takes under a minute';
  return `Usually takes about ${Math.max(seconds, 5)} seconds`;
}

/** The row's title: which beat, and which file. */
export function importWaitTitle(wait: ImportWait): string {
  return `${wait.status === 'uploading' ? 'Uploading' : 'Reading'} ${wait.fileName}…`;
}

/**
 * Where the bar is, 0–1, and whether the read has outrun the usual case.
 *
 * Runs the clock: ten times a second while there is a wait with a start time,
 * and not otherwise — enough for a 6px bar to move smoothly and far too slow
 * to matter. Every reader of a wait calls this; none computes its own.
 */
export function useImportProgress(wait: ImportWait | null): { progress: number; overdue: boolean } {
  const [now, setNow] = useState(0);
  const running = wait !== null && wait.startedAt !== null;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  if (!wait) return { progress: 0, overdue: false };
  const { status, startedAt, uploadedAt } = wait;
  if (startedAt === null) return { progress: status === 'reading' ? 0.55 : UPLOAD_SHARE / 2, overdue: false };
  const readElapsed = uploadedAt === null ? 0 : now - uploadedAt;
  const overdue = status === 'reading' && readElapsed > USUAL_READ_MS;
  const progress =
    status === 'uploading'
      ? UPLOAD_SHARE * 0.9 * easeOut((now - startedAt) / USUAL_UPLOAD_MS)
      : UPLOAD_SHARE + (HOLD - UPLOAD_SHARE) * easeOut(readElapsed / USUAL_READ_MS);
  return { progress, overdue };
}

/**
 * The wait's three lines — title, bar, meta — as the panel's reading row draws
 * them, in that row's own classes. The panel puts a spinner before this and a
 * Cancel after it; the floating bar does the same with its own Cancel. What
 * sits between is this, once, so the two rows are one row.
 *
 * `live` makes the title a status region. Only the floating bar asks for it:
 * both rows are mounted at once while the bar stands, and one announcement per
 * beat is enough.
 */
export function ImportWaitStatus({ wait, live = false }: { wait: ImportWait; live?: boolean }) {
  const { progress, overdue } = useImportProgress(wait);
  return (
    <div className={p.readingText}>
      <div className={p.readingTitle} role={live ? 'status' : undefined}>
        {importWaitTitle(wait)}
      </div>
      <div
        className={p.progressTrack}
        role="progressbar"
        aria-label={wait.status === 'uploading' ? 'Uploading your CV' : 'Reading your CV'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className={p.progressFill} style={{ transform: `scaleX(${progress})` }} />
      </div>
      {/* The size stays — it was here before the bar and it is still the one
          fact about the file the row can state. The second half is the
          expectation, and it changes exactly once: when the clock passes the
          usual case, so that a person looking at a bar that has stopped moving
          is told why, in the same breath as being told it hasn't died. */}
      <div className={p.readingMeta}>
        {wait.fileSize !== null && <>{formatFileSize(wait.fileSize)} · </>}
        {overdue ? 'Taking longer than usual — still reading' : usuallyTakes(USUAL_UPLOAD_MS + USUAL_READ_MS)}
      </div>
    </div>
  );
}
