import { useQuery } from '@tanstack/react-query';

import { MembersQueryKeys, SHOW_CV_IMPORT } from '@/services/members/constants';
import { getStoredCv } from '@/services/members/cv-import.service';
import { getCookiesFromClient } from '@/utils/third-party.helper';

/**
 * Whether this query may run at all.
 *
 * **The token check is load-bearing, not belt-and-braces.** `getStoredCv` goes
 * through `customFetch(..., true)`, and that wrapper does not merely fail when
 * there is no refresh token — it calls `logoutUser()` and then
 * `window.location.reload()`. A query that fires while signed out therefore
 * reloads the page, remounts, fires again, and the profile reloads forever. That
 * is not a hypothetical: it shipped, on every member profile, to every
 * signed-out visitor.
 *
 * Gating in the host alone was not enough to prevent it and would not prevent
 * the next one. `ExperienceDetails` *does* refuse to render any of this to a
 * signed-out reader — but its early return sits below the hook call, as the
 * Rules of Hooks require, so the request had already gone out. Any host that
 * decides in its body is the same trap, so the guard belongs here, where every
 * host inherits it.
 *
 * Exported as a plain function because the global jest setup stubs `useQuery`;
 * this is the part worth pinning and a hook test could not see it.
 */
export const storedCvQueryEnabled = (args: { uid: string | undefined; authToken: string | undefined }): boolean =>
  Boolean(args.uid) && Boolean(args.authToken) && SHOW_CV_IMPORT;

/**
 * The CV this profile is holding, or `null`.
 *
 * `null` is an answer, not an absence: it is what tells the section to draw the
 * upload offer instead of the resting card. `undefined` — still loading — is a
 * third state and hosts must not collapse it into "no CV", or the offer appears
 * for a beat on every profile that has one and then swaps under the reader. The
 * same mistake `pickCvImportHost` guards against with `experiencesLoading`.
 *
 * Gated on `SHOW_CV_IMPORT` so a dark flag makes no requests at all, rather than
 * fetching an answer nothing will render — and on a session, for the reason
 * above.
 */
export function useStoredCv(uid: string | undefined) {
  const { authToken } = getCookiesFromClient();

  return useQuery({
    queryKey: [MembersQueryKeys.GET_STORED_CV, uid],
    queryFn: ({ signal }) => getStoredCv(uid as string, signal),
    /* Coerced: `enabled` is validated by React Query v5 and *throws* on a falsy
       non-boolean, which is how a signed-out `''` has taken this app down
       before. */
    enabled: storedCvQueryEnabled({ uid, authToken }),
    /* The link inside is short-lived (10 minutes server-side). Re-asking on
       focus is what keeps a preview opened an hour later from 403ing on an
       expired signature. */
    staleTime: 5 * 60 * 1000,
  });
}
