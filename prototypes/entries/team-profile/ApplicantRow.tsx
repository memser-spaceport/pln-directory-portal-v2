'use client';

import clsx from 'clsx';

import { formatRelativeDays } from '@/utils/jobs.utils';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

// The role row's own stylesheet, for the two marks this row repeats from the
// listing it belongs to: the green `● New` and the clock + relative date.
import row from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import rowTone from '../job-board/JobReferRoleRow.module.scss';
// The Members section's row: avatar, name over role, a right cluster. Imported
// as classes rather than as the component, because `MemberCardBase` takes an
// `IMember` and derives the role line from the member's teams — an
// applicant's line is "their role · their team", which that lookup cannot
// produce.
import mcb from '@/components/page/team-details/TeamMembers/components/MemberCardBase/MemberCardBase.module.scss';
import tmvc from '@/components/page/team-details/TeamMembers/components/TeamMembersView/components/TeamMembersViewCard/TeamMembersViewCard.module.scss';

import type { RoleApplicant } from './mocks';
import s from './ApplicantRow.module.scss';

interface Props {
  applicant: RoleApplicant;
  /**
   * Not looked at yet: the row is tinted and carries `● New`. Opening it
   * returns the row to the plain grey every other row wears — read is the row
   * at rest, not a state with a mark of its own (design-thinking lesson 21).
   */
  isNew: boolean;
  /** Stacked-card geometry: every row but the last draws the shared hairline. */
  last: boolean;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One application in the applicants page's list, as the Members row from the
 * team profile draws a member, plus the two facts the application adds: when
 * it came, and the first lines of what they said. Pressing it shows the person
 * in the pane beside the list; the link out to their full profile lives there.
 */
export function ApplicantRow({ applicant: a, isNew, last, selected, onSelect }: Props) {
  return (
    <button type="button" className={clsx(tmvc.root, s.selectable)} onClick={onSelect} aria-pressed={selected}>
      <div
        className={clsx(mcb.root, tmvc.member, s.row, {
          [tmvc.memberBorder]: !last,
          [s.unread]: isNew,
          [s.selected]: selected,
        })}
      >
        <div className={clsx(mcb.left, s.left)}>
          <div className={mcb.avatarContainer}>
            <img loading="lazy" className={mcb.avatar} alt={a.name} src={a.avatar} width={40} height={40} />
          </div>
          <div className={mcb.text}>
            <div className={mcb.nameRole}>
              <p className={mcb.name}>{a.name}</p>
              <p className={mcb.role}>{a.role}</p>
            </div>
            {/* The one thing this row knows that the profile does not: what they
                said when they applied. Two lines here; the whole note is on the
                pane. */}
            <p className={s.note}>“{a.note}”</p>
          </div>
        </div>

        <div className={clsx(mcb.right, s.right)}>
          {isNew && <span className={row.newBadge}>● New</span>}
          <span className={clsx(row.relative, rowTone.relativeTone)}>
            <ClockIcon />
            Applied {formatRelativeDays(a.appliedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
