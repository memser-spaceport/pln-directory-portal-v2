import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/core/ToastContainer';
import { MembersQueryKeys } from '@/services/members/constants';
import type { MemberPreferencesResponse } from '@/services/members/hooks/useGetMemberPreferences';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';

/**
 * Saves the member's news tags (LAB-3000). The cached preferences change at
 * once, no longer seeded, so the chips follow before the request returns; a
 * failure restores the previous preferences and says so.
 */
export function useSetNewsTags(uid: string | undefined) {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateMemberPreferences();

  return useCallback(
    (next: string[], options?: { onSuccess?: () => void; onError?: () => void }) => {
      if (!uid) return;
      const queryKey = [MembersQueryKeys.GET_MEMBER_PREFERENCES, uid];
      const previous = queryClient.getQueryData<MemberPreferencesResponse | null>(queryKey);
      queryClient.setQueryData<MemberPreferencesResponse | null>(queryKey, (prev) =>
        prev ? { ...prev, newsTags: next, newsTagsSeeded: false } : prev,
      );
      mutate(
        { uid, payload: { newsTags: next } },
        {
          onSuccess: () => options?.onSuccess?.(),
          onError: () => {
            queryClient.setQueryData(queryKey, previous);
            toast.error('Could not save your news tags. Please try again.');
            options?.onError?.();
          },
        },
      );
    },
    [uid, queryClient, mutate],
  );
}
