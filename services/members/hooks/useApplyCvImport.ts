import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { applyCvImport, type CvImportApplyPayload } from '@/services/members/cv-import.service';

/**
 * Commits a reviewed CV import, then makes the profile show it.
 *
 * **The invalidation is the feature, not the housekeeping.** The existing
 * single-entry path (`MemberExperienceFormAction`) only calls `router.refresh()`
 * after writing, which does not re-run a client `useQuery` — inside an open
 * drawer that already relies on a remount to show a new entry. An import writes
 * several rows at once, so without this the person presses Save, the card
 * closes, and the section looks exactly as it did. That reads as "Save did
 * nothing", which is the worst possible outcome for a write that succeeded.
 */
export function useApplyCvImport(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CvImportApplyPayload) => applyCvImport(uid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MembersQueryKeys.GET_MEMBER_EXPERIENCE, uid] });

      /* By PREFIX, deliberately. The drawer's key is
         `[GET_MEMBER, memberUid, isLoggedIn, userInfo?.uid]` and the member page
         builds its own — anything narrower than the prefix misses the cache
         entry the drawer is actually reading, and the footer's role gate would
         go on quoting a profile without the role this import just filled.
         Matches `useUpdateMemberParams`. */
      queryClient.invalidateQueries({ queryKey: [MembersQueryKeys.GET_MEMBER] });

      /* Cards in the directory listing quote role, location and skills — all
         three of which an import can change. */
      queryClient.invalidateQueries({ queryKey: [MembersQueryKeys.GET_MEMBERS_LIST] });

      /* Only matters if the server mints skills it didn't already know, which is
         still an open question on the endpoint. Harmless if it doesn't, and a
         stale catalogue if it does and this is missing. */
      queryClient.invalidateQueries({ queryKey: [MembersQueryKeys.GET_SKILLS_OPTIONS] });
    },
  });
}
