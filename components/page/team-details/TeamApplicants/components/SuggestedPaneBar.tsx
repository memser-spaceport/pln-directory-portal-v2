'use client';

import { format } from 'date-fns';

import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import { CaretRightIcon } from '@/components/icons/CaretRightIcon';
import { EnvelopeIcon, ReviewCheckIcon } from '@/components/icons';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';

import bar from './ApplicantsPaneBar.module.scss';
import s from './SuggestedPaneBar.module.scss';

interface Props {
  suggestion: SuggestedCandidate;
  /** Zero-based, within the list as it is currently filtered. */
  position: number;
  total: number;
  onStep: (delta: number) => void;
  onContact: () => void;
}

/** "Oct 13, 2026", or nothing for a date the server wrote that does not parse. */
const contactedDate = (contactedAt: string): string | null => {
  const date = new Date(contactedAt);
  return Number.isNaN(date.getTime()) ? null : format(date, 'MMM d, yyyy');
};

/**
 * The applicants bar for a suggested person (LAB-2771): where you are, how to
 * move, and Contact.
 *
 * **No Mark as reviewed.** The applicants' tick writes to an application or an
 * interest row, and a suggestion has neither — there is nothing on the server
 * to mark.
 *
 * **Contact, not a `mailto:` Email (LAB-2847).** The message goes through the
 * platform, so it is recorded and a co-lead does not write to the same person
 * twice. Once someone has, the button becomes a plain "Contacted · <date>"
 * from the server's `contactedAt` — a state, not a second way to send. The
 * Applied and Interested tabs keep their Email.
 */
export function SuggestedPaneBar({ suggestion, position, total, onStep, onContact }: Props) {
  const firstName = suggestion.name.split(' ')[0] || suggestion.name;
  const contactedOn = suggestion.contactedAt ? contactedDate(suggestion.contactedAt) : null;

  return (
    <div className={bar.root}>
      <div className={bar.nav}>
        <button
          type="button"
          className={bar.stepBtn}
          aria-label="Previous candidate"
          disabled={position <= 0}
          onClick={() => onStep(-1)}
        >
          <CaretLeftIcon width={16} height={16} />
        </button>
        <button
          type="button"
          className={bar.stepBtn}
          aria-label="Next candidate"
          disabled={position < 0 || position >= total - 1}
          onClick={() => onStep(1)}
        >
          <CaretRightIcon width={16} height={16} />
        </button>
        <span className={bar.position} role="status" aria-live="polite">
          {position + 1} of {total}
        </span>
      </div>

      <div className={bar.actions}>
        {suggestion.contactedAt ? (
          <span className={s.contacted} data-testid="suggested-contacted">
            <ReviewCheckIcon size={16} state="bare" />
            {contactedOn ? `Contacted · ${contactedOn}` : 'Contacted'}
          </span>
        ) : (
          <button type="button" className={s.contactBtn} onClick={onContact}>
            <EnvelopeIcon size={14} />
            Contact {firstName}
          </button>
        )}
      </div>
    </div>
  );
}
