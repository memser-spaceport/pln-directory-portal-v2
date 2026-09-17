'use client';

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
 */
export function RoleApplicantsLine({ teamId, roleUid, count }: Props) {
  const total = (count?.applicantCount ?? 0) + (count?.interestCount ?? 0);
  if (!count || total === 0) return null;

  const faces = count.newestAvatars.slice(0, 3);

  return (
    <Link className={s.root} href={`/teams/${teamId}/applicants?role=${encodeURIComponent(roleUid)}`}>
      {faces.length > 0 && (
        <span className={s.faces} aria-hidden="true">
          {faces.map((url) => (
            <img key={url} className={s.face} src={url} alt="" loading="lazy" />
          ))}
        </span>
      )}
      <span className={s.count}>
        <strong>{total}</strong> {total === 1 ? 'applicant' : 'applicants'}
      </span>
      {count.newCount > 0 && <span className={s.newBadge}>● {count.newCount} new</span>}
    </Link>
  );
}
