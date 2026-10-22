import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/core/ToastContainer';
import { MembersQueryKeys } from '@/services/members/constants';
import type { MemberPreferencesResponse } from '@/services/members/hooks/useGetMemberPreferences';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';
import type { TeamNewsEventType } from '@/types/team-news.types';

/**
 * Saves the News preferences categories (LAB-2941). The cached preference
 * changes at once so the chips follow before the request returns; a failure
 * restores the previous list and says so. Same shape as useSetShowFeedbackButton.
 */
export function useSetNewsCategories(uid: string | undefined) {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateMemberPreferences();

  return useCallback(
    (next: TeamNewsEventType[], options?: { onSuccess?: () => void; onError?: () => void }) => {
      if (!uid) return;
      const queryKey = [MembersQueryKeys.GET_MEMBER_PREFERENCES, uid];
      const previous = queryClient.getQueryData<MemberPreferencesResponse | null>(queryKey);
      queryClient.setQueryData<MemberPreferencesResponse | null>(queryKey, (prev) =>
        prev ? { ...prev, newsCategories: next } : prev,
      );
      mutate(
        { uid, payload: { newsCategories: next } },
        {
          onSuccess: () => options?.onSuccess?.(),
          onError: () => {
            queryClient.setQueryData(queryKey, previous);
            toast.error('Could not save your news categories. Please try again.');
            options?.onError?.();
          },
        },
      );
    },
    [uid, queryClient, mutate],
  );
}
