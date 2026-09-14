'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * "One section at a time, and a way back to it."
 *
 * A profile page is a column of cards that each swap themselves for an editor.
 * Nothing stopped two being open at once, and a Save that scrolled out of view
 * was a Save nobody pressed — which is how edits were being lost.
 *
 * The registry answers both: while one editor is open every other card is
 * `inert` and faded (`ProfileSection`), and the page can draw a status bar for
 * the open one (`SectionStatusBar`).
 *
 * **Why a registry rather than props.** Same reason `UnsavedEdits` next door is
 * one: each section owns its edit state privately (`ProfileDetails` has
 * `useState(editView)`, `ExperienceDetails` has `useState<ExperienceView>`) and
 * they are shared between `/members/[id]` and the job drawers. What they all
 * have is the controls row every edit form renders, which mounts only while an
 * editor is open — so that is what claims the lock.
 *
 * **Absent by default.** Both hooks are inert without a provider, which is
 * everywhere except the member profile page and the two job drawers.
 */

/**
 * A CV being read in the open section — facts only, not the progress figure.
 * Each place that draws the wait runs its own clock against these timestamps
 * so a tick cannot re-render the whole profile column. See `ImportWaitStatus`.
 */
export interface SectionImportWait {
  fileName: string;
  fileSize: number | null;
  /** When the current read began. Null once the bar has been settled at 100%. */
  startedAt: number | null;
  /** The read came back; the bar holds at 100% until the review opens. */
  settled: boolean;
  /** The row's own Cancel, so the bar backs out of the same read. */
  cancel: () => void;
}

/** The one section whose editor is open, as the page around it sees it. */
export interface OpenSectionEdit {
  id: string;
  /** The card's name as its own header spells it — what the status bar reports. */
  name: string;
  /** The card's outer element: what the bar observes, scrolls back to, and submits. */
  getElement: () => HTMLElement | null;
  /** Whether the open form has something to save — the bar's Save appears with it. */
  dirty: boolean;
  /** Whether that save is in flight — the bar's Save says so and stops taking presses. */
  submitting: boolean;
  /** Set while a CV is being read — the bar draws the wait instead of Keep editing / Save. */
  importWait?: SectionImportWait | null;
}

export interface SectionEditLockApi {
  open: OpenSectionEdit | null;
  /** Stable across renders, so claiming cannot re-trigger itself — see `useSectionEditClaim`. */
  claim: (entry: OpenSectionEdit) => void;
  release: (id: string) => void;
}

const SectionEditLockContext = createContext<SectionEditLockApi | null>(null);

export const SectionEditLockProvider = SectionEditLockContext.Provider;

/** For the sections and the status bar. `null` outside a provider — never throws. */
export function useSectionEditLock(): SectionEditLockApi | null {
  return useContext(SectionEditLockContext);
}

/** Builds the lock. For the **host** — the page or drawer that renders the provider. */
export function useSectionEditLockRegistry(): SectionEditLockApi {
  const [open, setOpen] = useState<OpenSectionEdit | null>(null);

  /* Bails when nothing about the open section has changed. The claim effect
     re-runs whenever dirtiness flips and hands over a fresh object each time;
     without the comparison every flip would be a new state value and a new
     observer on the same card. */
  const claim = useCallback((entry: OpenSectionEdit) => {
    setOpen((prev) => (prev && sameOpen(prev, entry) ? prev : entry));
  }, []);

  /* Keyed, so a form unmounting after another has already claimed the lock
     cannot clear the one that is actually open. */
  const release = useCallback((id: string) => {
    setOpen((prev) => (prev && prev.id === id ? null : prev));
  }, []);

  return useMemo(() => ({ open, claim, release }), [open, claim, release]);
}

/** Which section a form is inside, provided by `ProfileSection`. */
export type SectionSlot = Omit<OpenSectionEdit, 'dirty' | 'submitting' | 'importWait'>;

const SectionSlotContext = createContext<SectionSlot | null>(null);

export const SectionSlotProvider = SectionSlotContext.Provider;

/**
 * Hold the lock for as long as this editor is open, and keep it told whether
 * there is anything to save.
 *
 * Called from the two controls rows every edit form in the app is built from —
 * `EditFormControls` and `EditOfficeHoursFormControls` — for the same reason
 * `useUnsavedEditRegistration` is: they mount only while an editor is open, and
 * one form picks between them by variant, so registering in only one of them
 * would cover half the sections on the same screen. A CV read claims through
 * `useSectionImportWaitClaim` instead — there is no form yet.
 */
export function useSectionEditClaim(isDirty: boolean, isSubmitting: boolean) {
  const slot = useContext(SectionSlotContext);
  const lock = useContext(SectionEditLockContext);
  /* The two stable halves of the api, not the api object — that one changes
     identity with `open`, and an effect depending on it would release the lock
     it had just claimed, every time. */
  const claim = lock?.claim;
  const release = lock?.release;

  useEffect(() => {
    if (!claim || !release || !slot) return;
    claim({ ...slot, dirty: isDirty, submitting: isSubmitting });
    return () => release(slot.id);
  }, [claim, release, slot, isDirty, isSubmitting]);
}

/**
 * Hold the lock for as long as a CV is being read in this section, so other
 * cards mute and the status bar can draw the wait once the card is off-screen.
 *
 * The wait's progress must not live on the lock: a tick would be a new `open`
 * and a new observer on the same card. Timestamps only — see `SectionImportWait`.
 */
export function useSectionImportWaitClaim(wait: SectionImportWait | null) {
  const slot = useContext(SectionSlotContext);
  const lock = useContext(SectionEditLockContext);
  const claim = lock?.claim;
  const release = lock?.release;
  const waitRef = useRef(wait);
  useEffect(() => {
    waitRef.current = wait;
  });
  /* Primitive facts, not the wait object: `cancel` identity must not release
     and re-claim the lock (that loop is what crashed CV upload). */
  const fileName = wait?.fileName;
  const fileSize = wait?.fileSize;
  const startedAt = wait?.startedAt;
  const settled = wait?.settled;
  const active = wait !== null;

  useEffect(() => {
    const current = waitRef.current;
    if (!claim || !release || !slot || !current) return;
    claim({ ...slot, dirty: false, submitting: false, importWait: current });
    return () => release(slot.id);
  }, [claim, release, slot, active, fileName, fileSize, startedAt, settled]);
}

function sameOpen(prev: OpenSectionEdit, entry: OpenSectionEdit) {
  return (
    prev.id === entry.id &&
    prev.name === entry.name &&
    prev.dirty === entry.dirty &&
    prev.submitting === entry.submitting &&
    sameImportWait(prev.importWait, entry.importWait)
  );
}

function sameImportWait(a?: SectionImportWait | null, b?: SectionImportWait | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.fileName === b.fileName && a.fileSize === b.fileSize && a.startedAt === b.startedAt && a.settled === b.settled
  );
}
