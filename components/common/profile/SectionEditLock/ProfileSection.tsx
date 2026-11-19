'use client';

import { PropsWithChildren, useId, useMemo, useRef } from 'react';
import clsx from 'clsx';

import type { SectionVisibility } from '../SectionVisibility/types/sectionVisibility';

import { SectionVisibilityContext } from '../SectionVisibility/SectionVisibilityContext';
import { SectionSlotProvider, useSectionEditLock } from './SectionEditLockContext';

import s from './ProfileSection.module.scss';

/**
 * One card's wrapper on a profile column.
 *
 * `inert` is the whole mechanism for "the other sections are disabled": the
 * browser drops every click, focus and tab stop inside it, and assistive tech
 * skips it — so a stray press on another card's Edit cannot open a second
 * editor. The class only paints what `inert` already did.
 *
 * The ref lands here rather than on the card because the section components
 * forward none, and the wrapper is the card's outline in every way that matters
 * to the status bar that watches it.
 */
interface Props {
  name: string;
  className?: string;
  visibility?: SectionVisibility;
}

export function ProfileSection({ name, className, visibility, children }: PropsWithChildren<Props>) {
  const lock = useSectionEditLock();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  const slot = useMemo(() => ({ id, name, getElement: () => ref.current }), [id, name]);
  const muted = !!lock?.open && lock.open.id !== id;

  return (
    <SectionSlotProvider value={slot}>
      <div
        ref={ref}
        className={clsx(s.section, className, muted && s.muted)}
        inert={muted}
        aria-disabled={muted || undefined}
      >
        <SectionVisibilityContext.Provider value={visibility ?? null}>{children}</SectionVisibilityContext.Provider>
      </div>
    </SectionSlotProvider>
  );
}
