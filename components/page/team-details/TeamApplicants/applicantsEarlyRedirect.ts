import { PAGE_ROUTES } from '@/utils/constants';

/** The link fields the Candidates page reads. Nothing else survives sign-in. */
const KEPT_FIELDS = ['role', 'candidate', 'suggested'] as const;

export type CandidatesLinkFields = Partial<Record<(typeof KEPT_FIELDS)[number], string>>;

/**
 * Where the Candidates page sends a reader before it fetches the team, or
 * `null` to go on to the full check.
 *
 * With the flag off the route does not exist, so everyone goes to the team
 * profile. With the flag on, a signed-out reader goes to sign-in and comes
 * back to this page, because the weekly email links leads here and the page is
 * only for signed-in readers. A profile redirect would drop the role and the
 * person the link names.
 *
 * The return link is the same `/members?backlink=...#login` form that
 * `proxy.ts` builds for protected routes. It is rebuilt from the three fields
 * the page reads, not copied from the request, so a link cannot carry anything
 * else (a second `backlink`, tracking fields) through sign-in.
 *
 * `isLoggedIn` is `unknown` for the reason given in `canReadApplicants`: it is
 * `''`, not `false`, for a signed-out request.
 */
export function applicantsEarlyRedirect({
  flagOn,
  isLoggedIn,
  teamId,
  searchParams,
}: {
  flagOn: boolean;
  isLoggedIn: unknown;
  teamId: string;
  searchParams?: CandidatesLinkFields;
}): string | null {
  const teamProfile = `${PAGE_ROUTES.TEAMS}/${teamId}`;

  if (!flagOn) {
    return teamProfile;
  }

  if (isLoggedIn) {
    return null;
  }

  const kept = new URLSearchParams();
  for (const field of KEPT_FIELDS) {
    const value = searchParams?.[field];
    /* A repeated field arrives as an array. Picking one would guess which role
       the link meant, so it is dropped and the page opens on its default. */
    if (typeof value === 'string' && value) {
      kept.set(field, value);
    }
  }

  const query = kept.toString();
  /* Encoded here, unlike the profile path: Next hands the page a decoded id, and
     a `?` or `#` in it would end the return path early. */
  const returnTo = `${PAGE_ROUTES.TEAMS}/${encodeURIComponent(teamId)}/applicants${query ? `?${query}` : ''}`;

  return `/members?backlink=${encodeURIComponent(returnTo)}#login`;
}
