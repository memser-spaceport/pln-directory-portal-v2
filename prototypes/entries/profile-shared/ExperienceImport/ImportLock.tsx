'use client';

import type { ImportStatus } from './ExperienceImportPanel';
import s from './ImportLock.module.scss';

/**
 * **The fields a CV is about to fill are locked while it is read.**
 *
 * Every host of `ExperienceImportPanel` — the new-profile page, the job
 * board's profile step, the settings page — has fields under the panel that
 * the document will write into: role, location, skills, contact details, the
 * experience list. For the ten to thirty seconds a file is uploading and being
 * read, those are the wrong place to type: the import's merge rule is "fill
 * only a blank", so a field someone starts on mid-read is a field the CV then
 * declines to fill, and neither party finds out. So the hosts put the affected
 * cards behind `inert` (no clicks, no focus) and fade them, and say in each
 * card's own header slot — where its Edit normally sits — when it comes back.
 *
 * Two things this file fixes in one place, so three hosts cannot drift:
 *
 * - the fade and the note's type (`ImportLock.module.scss`);
 * - the note's words, which follow the panel's own two beats. The panel's
 *   reading row says "Uploading <file>…" and then "Reading <file>…"; a note
 *   under it promising "once your CV is uploaded" while the row says "Reading"
 *   would be promising something that has already happened. So the note says
 *   the beat the panel is in.
 *
 * Cards the import does *not* write to (Office Hours, Investor Details,
 * Project Contributions, Repositories) stay live — locking them would be
 * locking for the sake of a mood.
 */
export function isImportWaiting(status: ImportStatus): boolean {
  return status === 'uploading' || status === 'reading';
}

export function importLockCopy(status: ImportStatus): string {
  return status === 'uploading' ? 'Available once your CV is uploaded' : 'Available once your CV is read';
}

/**
 * **And the Experience card stays locked through the review.** Once the CV is
 * read, the review card (in the CV section, above) holds the positions it
 * found, ticked, behind a Save. Until that Save they are on no profile; an
 * Experience card that unlocked at this point would invite someone to type the
 * same positions in by hand while the parsed copies wait one card up, and the
 * review's Save would then append duplicates. So the card keeps its lock, and
 * the note stops talking about the read — that is over — and says what the
 * person now has to do, in the review card's own verb: Save.
 */
export const importReviewLockCopy = 'Save your CV results to add them here';

/** The note that stands in a locked card's header slot for the wait — or, with
 *  `reviewing`, for the review that follows it. */
export function ImportLockNote({ status, reviewing = false }: { status: ImportStatus; reviewing?: boolean }) {
  return (
    <span className={s.note} role="status">
      {reviewing ? importReviewLockCopy : importLockCopy(status)}
    </span>
  );
}

/** The class a locked card's wrapper wears — pair it with `inert`. */
export const importLockClass = s.muted;

/** The wrapper's resting class — full width, so wrapping a card costs it nothing. */
export const importLockWrapClass = s.wrap;
