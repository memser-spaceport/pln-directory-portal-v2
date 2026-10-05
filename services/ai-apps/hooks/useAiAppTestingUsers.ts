'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import {
  AiAppTestingUser,
  AiAppTestingUsersResult,
  createAiAppTestingUsers,
  fetchAiAppTestingUsers,
  revokeAiAppTestingUser,
} from '@/services/ai-apps/testing-users.service';

/** Testing users of one app's Preview (creator or directory admin only). */
export function useAiAppTestingUsers(appUid: string, options?: { enabled?: boolean }) {
  const { data, isLoading } = useQuery<AiAppTestingUsersResult<AiAppTestingUser[]>>({
    queryKey: [AiAppsQueryKeys.AI_APP_TESTING_USERS, appUid],
    queryFn: () => fetchAiAppTestingUsers(appUid),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  return {
    testingUsers: data?.data ?? null,
    error: data?.error ?? null,
    isLoading,
  };
}

/** Create and revoke update the cached list in place, so the section changes without a reload. */
export function useCreateAiAppTestingUsers(appUid: string) {
  const queryClient = useQueryClient();
  const queryKey = [AiAppsQueryKeys.AI_APP_TESTING_USERS, appUid];

  return useMutation({
    mutationFn: (count: number) => createAiAppTestingUsers(appUid, count),
    onSuccess: (result) => {
      // Failures come back as data, so onSuccess fires either way.
      if (result.error || !result.data) return;
      const created = result.data;
      queryClient.setQueryData<AiAppTestingUsersResult<AiAppTestingUser[]>>(queryKey, (current) => ({
        data: [...(current?.data ?? []), ...created],
        error: null,
      }));
    },
  });
}

export function useRevokeAiAppTestingUser(appUid: string) {
  const queryClient = useQueryClient();
  const queryKey = [AiAppsQueryKeys.AI_APP_TESTING_USERS, appUid];

  return useMutation({
    mutationFn: (testingUserUid: string) => revokeAiAppTestingUser(appUid, testingUserUid),
    onSuccess: (result) => {
      if (result.error || !result.data) return;
      const { uid, revokedAt } = result.data;
      queryClient.setQueryData<AiAppTestingUsersResult<AiAppTestingUser[]>>(queryKey, (current) => ({
        data: (current?.data ?? []).map((user) => (user.uid === uid ? { ...user, revokedAt } : user)),
        error: null,
      }));
    },
  });
}
