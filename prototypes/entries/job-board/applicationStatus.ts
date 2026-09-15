import type { ListingStatus } from './listings';

/**
 * Where an application stands, as the person who sent it reads it.
 *
 * **Every state here is a fact the product already records. None is a stage
 * anyone sets.** The team's applicants page (`team-profile/TeamApplicantsPage`)
 * keeps exactly one thing per application beyond the application itself —
 * whether the team has opened it — and a listing has a life of its own
 * (`ListingStatus`). Those two facts are the whole of what the board can
 * honestly tell an applicant, and they answer the two questions an applicant
 * actually has: *has anyone looked?* and *is this still open?*
 *
 *  - `sent`    went, not yet opened by the team. The resting state: the row
 *              says "Applied 2d ago" in its clock and wears no pill, because a
 *              pill reading "Applied" beside a clock reading "Applied" is the
 *              same word twice (design-thinking lesson 21 — the resting state
 *              has no mark of its own).
 *  - `viewed`  the team opened it. Their applicants page tints an unread row
 *              and clears the tint on selection (`seenIds`); this is the same
 *              event read from the other side. LinkedIn's "Application viewed"
 *              and Wellfound's row status are the same fact.
 *  - `closed`  the listing stopped taking applications — taken down by the
 *              team (`inactive`), or gone from the board. The application
 *              itself does not change; the thing it was sent to did.
 *
 * `closed` outranks `viewed`: once a role is shut, whether the team looked
 * first is no longer the news.
 *
 * **What is not here, on purpose.** *Not selected*, *Interviewing*,
 * *Shortlisted* — anything the team would have to *decide*. The team replies
 * by email (the apply modal's own promise: `{team} can reply to you
 * directly`), and their applicants page has no Shortlist / Reject press — see
 * `applicantMocks.ts`. Drawing a decision the team has no way to make would be
 * a status that never changes. If that press is ever added there, it becomes
 * a fourth value here and one more Badge variant, and nothing else moves.
 */
export type ApplicationStatus = 'sent' | 'viewed' | 'closed';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  sent: 'Applied',
  /* "by team", not bare "Viewed": on a row you are reading, a bare "Viewed"
     could be about you. The team is the only other reader, and naming the
     reader is the whole of the news. */
  viewed: 'Viewed by team',
  /* "Role", not "Application": nothing happened to what you sent. */
  closed: 'Role closed',
};

/** The one place the two facts are combined, so the row, the drawer's masthead
 *  and the Applied tab cannot disagree about what an application's state is. */
export function applicationStatus(
  application: { viewedAt?: string },
  listingStatus: ListingStatus | 'gone',
): ApplicationStatus {
  if (listingStatus !== 'live' && listingStatus !== 'in-review') return 'closed';
  if (application.viewedAt) return 'viewed';
  return 'sent';
}
