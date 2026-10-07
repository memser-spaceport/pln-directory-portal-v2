'use client';

import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import { CaretRightIcon } from '@/components/icons/CaretRightIcon';
import { EnvelopeIcon } from '@/components/icons';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';

import { useCandidateMember } from './ApplicantPane';
import s from './ApplicantsPaneBar.module.scss';

interface Props {
  suggestion: SuggestedCandidate;
  roleTitle: string;
  isLoggedIn: boolean;
  /** Zero-based, within the list as it is currently filtered. */
  position: number;
  total: number;
  onStep: (delta: number) => void;
  onEmailClick: () => void;
}

/**
 * The applicants bar for a suggested person (LAB-2771): where you are, how to
 * move, and Email.
 *
 * **No Mark as reviewed.** The applicants' tick writes to an application or an
 * interest row, and a suggestion has neither — there is nothing on the server
 * to mark. **Email** reads the address off the member profile the pane below
 * already fetches (one query, shared by key), so a suggestion costs no extra
 * request; no address, no button, as on the other tabs.
 */
export function SuggestedPaneBar({ suggestion, roleTitle, isLoggedIn, position, total, onStep, onEmailClick }: Props) {
  const { data: member } = useCandidateMember(suggestion.memberUid, isLoggedIn);
  const email: string | null = member?.email || null;
  const firstName = suggestion.name.split(' ')[0] || suggestion.name;
  const subject = roleTitle ? `Your profile and our ${roleTitle} role` : 'Your profile';

  return (
    <div className={s.root}>
      <div className={s.nav}>
        <button
          type="button"
          className={s.stepBtn}
          aria-label="Previous candidate"
          disabled={position <= 0}
          onClick={() => onStep(-1)}
        >
          <CaretLeftIcon width={16} height={16} />
        </button>
        <button
          type="button"
          className={s.stepBtn}
          aria-label="Next candidate"
          disabled={position < 0 || position >= total - 1}
          onClick={() => onStep(1)}
        >
          <CaretRightIcon width={16} height={16} />
        </button>
        <span className={s.position} role="status" aria-live="polite">
          {position + 1} of {total}
        </span>
      </div>

      <div className={s.actions}>
        {email && (
          <a
            className={s.emailBtn}
            href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
            onClick={onEmailClick}
          >
            <EnvelopeIcon size={14} />
            Email {firstName}
          </a>
        )}
      </div>
    </div>
  );
}
