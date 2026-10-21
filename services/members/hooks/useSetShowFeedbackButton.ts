import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/core/ToastContainer';
import { MembersQueryKeys } from '@/services/members/constants';
import type { MemberPreferencesResponse } from '@/services/members/hooks/useGetMemberPreferences';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';

/**
 * Shows or hides the LabOS-wide feedback button (the drawer's Hide button and
 * Settings). The cached preference changes at once, so the button follows
 * before the request returns.
 */
export function useSetShowFeedbackButton(uid: string | undefined) {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateMemberPreferences();

  return useCallback(
    (show: boolean) => {
      if (!uid) return;
      const queryKey = [MembersQueryKeys.GET_MEMBER_PREFERENCES, uid];
      queryClient.setQueryData<MemberPreferencesResponse | null>(queryKey, (prev) =>
        prev ? { ...prev, memberPreferences: { ...prev.memberPreferences, showFeedbackButton: show } } : prev,
      );
      mutate(
        { uid, payload: { showFeedbackButton: show } },
        {
          onError: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.error('Could not save your choice. Please try again.');
          },
        },
      );
    },
    [uid, queryClient, mutate],
  );
}
