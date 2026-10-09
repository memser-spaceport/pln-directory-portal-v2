'use client';

import clsx from 'clsx';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';

import { metCount } from './suggestionBand';
import { SuggestionBadge } from './SuggestionBadge';
import row from './ApplicantRow.module.scss';
import s from './SuggestedRow.module.scss';

interface Props {
  suggestion: SuggestedCandidate;
  last: boolean;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One suggested person in the list (LAB-2771).
 *
 * The applicant row's geometry, with the band where an applicant has a date:
 * nothing happened, so there is no "when". Under the role, the band's working
 * as a count ("4 of 5 requirements"); the requirements themselves are the
 * pane's, where each one can be checked.
 */
export function SuggestedRow({ suggestion, last, selected, onSelect }: Props) {
  const met = metCount(suggestion.criteria);
  const total = suggestion.criteria.length;

  return (
    <button
      type="button"
      className={clsx(row.root, !last && row.bordered, selected && row.selected)}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={row.left}>
        <img
          className={row.avatar}
          src={suggestion.imageUrl || getDefaultAvatar(suggestion.memberUid)}
          alt=""
          loading="lazy"
        />
        <span className={row.text}>
          <span className={row.nameLine}>
            <span className={row.name}>{suggestion.name}</span>
          </span>
          {suggestion.role && <span className={row.role}>{suggestion.role}</span>}
          {total > 0 && (
            <span className={s.working}>
              {met === total ? `All ${total} requirements` : `${met} of ${total} requirements`}
            </span>
          )}
        </span>
      </span>

      <span className={row.right}>
        <SuggestionBadge label={suggestion.label} />
      </span>
    </button>
  );
}
