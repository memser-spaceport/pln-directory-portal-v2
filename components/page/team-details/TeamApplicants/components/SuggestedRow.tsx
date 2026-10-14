'use client';

import clsx from 'clsx';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';
import { formatRelativeDays } from '@/utils/jobs.utils';

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
 * It uses the applicant row's layout, with the band where an applicant has a
 * date: a suggested person did nothing, so there is no "when".
 *
 * Three lines (LAB-2853): name, role, and how many of the role's requirements
 * the profile meets. The count always reads "N of M", "5 of 5" included,
 * because the numbers are what a lead compares down the list. Once a lead of
 * the team has contacted the person, the count line ends with
 * "· Contacted <relative>".
 *
 * No Interested mark and no note here. The note was cut to two lines at the
 * list's width, so the pane shows both instead, in full.
 */
export function SuggestedRow({ suggestion, last, selected, onSelect }: Props) {
  const met = metCount(suggestion.criteria);
  const total = suggestion.criteria.length;
  const contacted = suggestion.contactedAt ? formatRelativeDays(suggestion.contactedAt) : '';

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
          {(total > 0 || contacted) && (
            <span className={s.working} data-testid="suggested-row-working">
              {total > 0 && `${met} of ${total} requirements`}
              {total > 0 && contacted && ' · '}
              {contacted && `Contacted ${contacted}`}
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
