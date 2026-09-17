'use client';

import clsx from 'clsx';

import { ReviewCheckIcon } from '@/components/icons';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { TeamApplicant } from '@/schema/team-applicants';
import { formatRelativeDays } from '@/utils/jobs.utils';

import s from './ApplicantRow.module.scss';

interface Props {
  applicant: TeamApplicant;
  /** Stacked-card geometry: every row but the last draws the shared hairline. */
  last: boolean;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One person in the list.
 *
 * **No excerpt of what they wrote.** Three lines of a cover letter in a 440px
 * column is enough to form an impression and not enough to be right about it,
 * and the pane beside this is one press away. The row answers "who is here",
 * the pane answers "are they any good".
 *
 * `aria-pressed` rather than a link: pressing this does not navigate, it changes
 * what the pane shows. The row a lead is reading is a selection, and a selection
 * is a pressed state.
 */
export function ApplicantRow({ applicant, last, selected, onSelect }: Props) {
  const roleLine = [applicant.headline, applicant.currentCompany].filter(Boolean).join(' · ');
  const acted = applicant.kind === 'application' ? 'Applied' : 'Interested';

  return (
    <button
      type="button"
      className={clsx(s.root, !last && s.bordered, selected && s.selected, applicant.unseen && s.unseen)}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={s.left}>
        <img
          className={s.avatar}
          src={applicant.avatarUrl || getDefaultAvatar(applicant.memberUid)}
          alt=""
          loading="lazy"
        />
        <span className={s.text}>
          <span className={s.name}>{applicant.name}</span>
          {roleLine && <span className={s.role}>{roleLine}</span>}
        </span>
      </span>

      <span className={s.right}>
        {applicant.unseen && <span className={s.newBadge}>● New</span>}
        {applicant.reviewed && (
          <ReviewCheckIcon size={16} state="soft" className={s.reviewed} role="img" aria-label="Reviewed" />
        )}
        <span className={s.when}>
          <ClockIcon />
          {acted} {formatRelativeDays(applicant.createdAt)}
        </span>
      </span>
    </button>
  );
}
