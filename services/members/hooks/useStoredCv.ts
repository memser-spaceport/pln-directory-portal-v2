import { useQuery } from '@tanstack/react-query';

import { MembersQueryKeys, SHOW_CV_IMPORT } from '@/services/members/constants';
import { getStoredCv } from '@/services/members/cv-import.service';

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
 * fetching an answer nothing will render.
 */
export function useStoredCv(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_STORED_CV, uid],
    queryFn: ({ signal }) => getStoredCv(uid as string, signal),
    /* Coerced: `enabled` is validated by React Query v5 and *throws* on a falsy
       non-boolean, which is how a signed-out `''` has taken this app down
       before. */
    enabled: !!uid && SHOW_CV_IMPORT,
    /* The link inside is short-lived (10 minutes server-side). Re-asking on
       focus is what keeps a preview opened an hour later from 403ing on an
       expired signature. */
    staleTime: 5 * 60 * 1000,
  });
}
