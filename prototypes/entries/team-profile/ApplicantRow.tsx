'use client';

import clsx from 'clsx';

import { formatRelativeDays } from '@/utils/jobs.utils';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
// The reviewed mark, in its list state — the same drawing the pane bar's
// Reviewed button wears, so list and bar read as one thing.
import { ReviewCheckIcon } from './icons';

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

import { Badge } from '@/components/common/Badge';

import type { RoleApplicant, RoleInterested, RoleSuggested, SuggestionMatch } from './mocks';
import s from './ApplicantRow.module.scss';

interface Props {
  /** An application, or an "I'm interested" press — the Interested tab's row
   *  is this row with its own date. */
  applicant: RoleApplicant | RoleInterested | RoleSuggested;
  /**
   * Suggested rows only: when the team pressed **Invite to apply** (ISO).
   */
  invitedAt?: string;
  /** Suggested rows only: the percentage, at the row's right end. */
  match?: SuggestionMatch;
  /**
   * Not looked at yet: the row is tinted and carries `● New`. Opening it
   * returns the row to the plain grey every other row wears — read is the row
   * at rest, not a state with a mark of its own (design-thinking lesson 21).
   */
  isNew: boolean;
  /**
   * The team pressed **Mark as reviewed** on this person. Unlike read, this
   * is a state with a mark of its own — a green check beside the name —
   * because it is the founder's own press, not something the product inferred
   * from an open. It never meets `● New`: reviewing means having opened, and
   * opening clears New.
   */
  reviewed: boolean;
  /** Stacked-card geometry: every row but the last draws the shared hairline. */
  last: boolean;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One application in the applicants page's list, as the Members row from the
 * team profile draws a member, plus when it came. What they wrote is not on
 * the row; pressing it shows the person, and their note, in the pane beside
 * the list.
 */
export function ApplicantRow({ applicant: a, isNew, reviewed, last, selected, onSelect, invitedAt, match }: Props) {
  return (
    <button type="button" className={clsx(tmvc.root, s.selectable)} onClick={onSelect} aria-pressed={selected}>
      <div
        className={clsx(mcb.root, tmvc.member, s.row, {
          [tmvc.memberBorder]: !last,
          [s.unread]: isNew,
          [s.selected]: selected,
          [s.suggestedRow]: 'reasons' in a,
        })}
      >
        <div className={clsx(mcb.left, s.left)}>
          <div className={mcb.avatarContainer}>
            <img loading="lazy" className={mcb.avatar} alt={a.name} src={a.avatar} width={40} height={40} />
          </div>
          <div className={mcb.text}>
            <div className={mcb.nameRole}>
              {/* The mark rides the name, not the date cluster on the far side:
                  it is a fact about this person, and at the right-hand end it
                  read as one more of the row's meta glyphs. */}
              <div className={s.nameLine}>
                <p className={mcb.name}>{a.name}</p>
                {reviewed && (
                  <span className={s.reviewedMark} role="img" aria-label="Reviewed" title="Reviewed">
                    <ReviewCheckIcon size={16} state="bare" />
                  </span>
                )}
                {/* Invited: a fact about this person, so it rides the name like
                    the Reviewed tick. At the right end it shared 75px with the
                    percentage and ellipsised the role and the reason. */}
                {invitedAt && (
                  <span className={clsx(row.relative, rowTone.relativeTone, s.invitedMark)}>
                    <ClockIcon />
                    Invited {formatRelativeDays(invitedAt)}
                  </span>
                )}
              </div>
              {/* Role · team, and not their location. Wellfound's rows carry
                  "10 years of exp · Austin · Open to remote", and it was tried
                  here as a third clause: at the list's 440px the line then
                  ellipsised the team ("Protocol Engineer · Lattice Compute…"),
                  which is the half a founder scans for, and the location
                  itself survived on one row in three. The pane's header shows
                  it on the first frame. */}
              <p className={mcb.role}>{a.role}</p>
              {/* A suggested row's third line: the strongest network signal, in
                  words. Only this row needs one — an applicant is in the list
                  because they applied — and it is what the percentage at the
                  right cannot say (see `SuggestionReasonKind`). No tick: the
                  green check in this list already means Reviewed. */}
              {'reasons' in a && (
                <p className={s.reason}>
                  {a.reasons[0] ? (
                    <>
                      <span className={s.reasonText}>{a.reasons[0].text}</span>
                      {a.reasons.length > 1 && <span className={s.reasonMore}>+{a.reasons.length - 1}</span>}
                    </>
                  ) : (
                    /* No network signal: the line says what the percentage is
                       made of instead of leaving a gap under the role. */
                    match && (
                      <span className={s.reasonText}>
                        {match.met} of {match.total} requirements
                      </span>
                    )
                  )}
                </p>
              )}
            </div>
            {/* No excerpt of the application note. A two-line quote was here and
                was removed: the row is for finding the person, and the note is
                read whole in the pane's Application section, one press away. */}
          </div>
        </div>

        <div className={clsx(mcb.right, s.right)}>
          {isNew && <span className={row.newBadge}>● New</span>}
          {'reasons' in a ? (
            /* The number, in the slot a suggestion has no date for. One tone
               for every value: a hue would grade people, and the floor already
               means nobody here is a low match. */
            match && <Badge className={s.percent}>{match.percent}%</Badge>
          ) : (
            <span className={clsx(row.relative, rowTone.relativeTone)}>
              <ClockIcon />
              {'appliedAt' in a
                ? `Applied ${formatRelativeDays(a.appliedAt)}`
                : `Interested ${formatRelativeDays(a.interestedAt)}`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
