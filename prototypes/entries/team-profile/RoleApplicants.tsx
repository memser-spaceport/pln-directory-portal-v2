'use client';

import clsx from 'clsx';

// The role row's own stylesheet, for the green `● N new` on the count line.
import row from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// The page's own facepile — the follower stack in the header is the same
// gesture (faces + count), so the trigger is borrowed from it.
import local from './TeamProfile.module.scss';

import type { RoleApplicant, RoleSuggested } from './mocks';
import type { ApplicantsTab } from './TeamApplicantsPage';
import s from './RoleApplicants.module.scss';

interface Props {
  applicants: RoleApplicant[];
  /** Members the product proposes for this role — see `RoleSuggested`. */
  suggested?: RoleSuggested[];
  /**
   * Opens the team's applicants page on this role — see `TeamApplicantsPage`.
   * The suggested clause passes its tab, so the press lands on the list it
   * names.
   */
  onOpen: (tab?: ApplicantsTab) => void;
}

/**
 * Who applied to one of the team's roles, from that role, on the team's page.
 *
 * **Why here and not on the board.** A founder's relationship with hiring runs
 * through their team profile — it is where they posted the role (Submit a job
 * sits in this section's header) and where they take it down (the card's own
 * footer switch). They have no reason to visit the board, so the applicants
 * are reached from the section instead of the section sending them there. Care.com's "Your jobs" card is the
 * reference: a facepile plus "2 new applicants" on each job the owner posted,
 * the list one press away.
 *
 * **At rest: the count line, inside the role's card.** A facepile of the three
 * newest, the count, and `● 1 new` when any are unseen — the page's follower
 * stack worn as a footer, so a founder scanning the section knows which roles
 * have people waiting without opening anything. A role nobody has applied to
 * shows no line: the section must not charge every role for a fact about one.
 *
 * **One press: the applicants page.** Two destinations were built and compared
 * — an inline expander (sized to three mocked applicants; a real role draws
 * fifty), then a modal on the follower stack's own pattern, then a page with
 * the selected person's profile beside the list. The page won: the modal
 * answers "who applied?", the page answers "which of these do I write to?",
 * and at fifty people the second question is the whole job. See
 * `TeamApplicantsPage`.
 *
 * **"N suggested", the line's second clause.** Members the product proposes
 * for the role (`RoleSuggested`), as a quiet text press after the count, and
 * it opens the page on that tab. It is a second press rather than part of the
 * first because the two name different lists. No faces on it: a facepile says
 * "these people did something", and these people did nothing. It also changes
 * the rule above: a role nobody has applied to now shows the line when it has
 * suggestions, because that is the role that needs them most — "2 suggested
 * members", on its own. A role with neither still shows nothing.
 */
export function RoleApplicants({ applicants, suggested = [], onOpen }: Props) {
  if (!applicants.length && !suggested.length) return null;

  const newest = [...applicants].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  const newCount = applicants.filter((a) => a.unseen).length;

  return (
    <div className={s.root}>
      {applicants.length > 0 && (
        <button
          type="button"
          className={clsx(local.subStack, s.countLine)}
          data-tour="applicants-count"
          onClick={() => onOpen()}
        >
          <span className={local.subAvatars} aria-hidden="true">
            {newest.slice(0, 3).map((a) => (
              <img key={a.id} className={local.subAvatar} src={a.avatar} alt="" loading="lazy" />
            ))}
          </span>
          <span className={local.subCount}>
            <strong>{applicants.length}</strong> {applicants.length === 1 ? 'applicant' : 'applicants'}
          </span>
          {newCount > 0 && <span className={clsx(row.newBadge, s.newCount)}>● {newCount} new</span>}
        </button>
      )}
      {suggested.length > 0 && (
        <>
          {applicants.length > 0 && (
            <span className={s.sep} aria-hidden="true">
              ·
            </span>
          )}
          <button
            type="button"
            className={clsx(local.subStack, s.countLine, s.suggested, { [s.suggestedAlone]: !applicants.length })}
            onClick={() => onOpen('Suggested')}
          >
            <span className={local.subCount}>
              <strong>{suggested.length}</strong>{' '}
              {applicants.length ? 'suggested' : suggested.length === 1 ? 'suggested member' : 'suggested members'}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
