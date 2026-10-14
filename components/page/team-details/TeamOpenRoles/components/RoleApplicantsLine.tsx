'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { ApplicantCount } from '@/schema/team-applicants';

import s from './RoleApplicantsLine.module.scss';

interface Props {
  teamId: string;
  roleUid: string;
  count: ApplicantCount | undefined;
}

/**
 * "Three faces, a count, and ● 2 new" under a role the team is hiring for —
 * the lead's way in to the applicants page, already on this role.
 *
 * **Nothing at all when nobody has answered.** Not "0 applicants": a role
 * posted yesterday with no applicants is normal, and a zero printed under every
 * row would turn the section into a scoreboard of a team's own postings. A role
 * with people gets a line; a role without one looks exactly as it did before
 * this feature existed.
 *
 * **Owner-only, decided by the caller.** This component draws what it is given;
 * the host decides whether a viewer may see any of it, because that same rule
 * gates the query that produces `count`. A line rendered from counts that were
 * never fetched would be a line that says "0" to everyone.
 *
 * A `Link`, not a button: it goes to a page, so it should middle-click, open in
 * a new tab, and show its destination on hover like anything else that does.
 *
 * Two links when the role has both (LAB-2853): the answers open the page as it
 * derives its tab, and "N suggested" opens it on the Suggested tab.
 */
/**
 * What the line calls these people.
 *
 * Both lists are on it, because both are the answer a role got — but they are
 * not the same act, and one noun for both is a lie the page behind it then
 * contradicts. A role with two interests and no applications read "2
 * applicants" here and then opened on "No one has applied to this role yet.",
 * which is the count line and the page calling each other wrong.
 *
 * Only what is there is named: no "0 interested" trailing a role nobody has
 * pressed interest on.
 */
function Tally({ applicants, interested }: { applicants: number; interested: number }) {
  return (
    <>
      {applicants > 0 && (
        <>
          <strong>{applicants}</strong> {applicants === 1 ? 'applicant' : 'applicants'}
        </>
      )}
      {applicants > 0 && interested > 0 && ' · '}
      {interested > 0 && (
        <>
          <strong>{interested}</strong> interested
        </>
      )}
    </>
  );
}

/**
 * The applicants page for one role, optionally on the Suggested tab
 * (LAB-2853). `tab=suggested` is the same param the founder email's links
 * carry.
 */
const applicantsHref = (teamId: string, roleUid: string, tab?: 'suggested') =>
  `/teams/${teamId}/applicants?role=${encodeURIComponent(roleUid)}${tab ? `&tab=${tab}` : ''}`;

export function RoleApplicantsLine({ teamId, roleUid, count }: Props) {
  const answered = (count?.applicantCount ?? 0) + (count?.interestCount ?? 0);
  const suggested = count?.suggestedCount ?? 0;
  if (!count || answered + suggested === 0) return null;

  const faces = count.newestAvatars.slice(0, 3);

  return (
    <div className={s.line}>
      {answered > 0 && (
        <Link className={s.root} href={applicantsHref(teamId, roleUid)}>
          {faces.length > 0 && (
            <span className={s.faces} aria-hidden="true">
              {faces.map((url) => (
                <img key={url} className={s.face} src={url} alt="" loading="lazy" />
              ))}
            </span>
          )}
          <span className={s.count}>
            <Tally applicants={count.applicantCount} interested={count.interestCount} />
          </span>
          {count.newCount > 0 && <span className={s.newBadge}>● {count.newCount} new</span>}
        </Link>
      )}
      {/* LAB-2853: "N suggested" is a link of its own, to the Suggested tab.
          It names a different list from the count before it, so one press for
          both would open on the wrong one. No faces: a facepile says "these
          people did something", and a suggested person did nothing. */}
      {suggested > 0 && (
        <>
          {answered > 0 && (
            <span className={s.sep} aria-hidden="true">
              {' · '}
            </span>
          )}
          <Link className={clsx(s.root, s.suggestedLink)} href={applicantsHref(teamId, roleUid, 'suggested')}>
            <span className={s.count}>
              <strong>{suggested}</strong> suggested
            </span>
          </Link>
        </>
      )}
    </div>
  );
}
