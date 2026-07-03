'use client';

import type { ReactNode } from 'react';

import s from './PrivacyNote.module.scss';

/**
 * Subtle "who can see this" footnote — copied from the production gantry boost
 * note (`components/page/gantry/shared/PinNotePopover.tsx`), where boosting an
 * idea shows "Anonymous to members · only the product team sees your name".
 *
 * Same eye-off icon + muted bar treatment. Reused here for follower visibility:
 * the follower list is team-only, so this explains that to whoever is looking.
 */
interface Props {
  children?: ReactNode;
  /** Bare icon + text, no border/background bar — for placing under the count in the header. */
  compact?: boolean;
}

export function PrivacyNote({ children, compact = false }: Props) {
  return (
    <div className={`${s.note} ${compact ? s.compact : ''}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children ?? 'Only your team can see who follows — this list is hidden from members.'}</span>
    </div>
  );
}
