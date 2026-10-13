import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';
import { toast } from '@/components/core/ToastContainer';
import {
  SuggestedCandidatesEmailSetting,
  suggestedCandidatesEmailSettingUrl,
} from '@/services/members/hooks/useGetSuggestedCandidatesEmailSetting';

interface MutationParams {
  uid: string;
  suggestedCandidatesEmailEnabled: boolean;
}

export const SUGGESTED_CANDIDATES_EMAIL_SAVE_ERROR =
  "Couldn't update your suggested candidates email setting. Please try again.";

async function mutation({ uid, suggestedCandidatesEmailEnabled }: MutationParams) {
  const response = await customFetch(
    suggestedCandidatesEmailSettingUrl(uid),
    {
      method: 'PUT',
      body: JSON.stringify({ suggestedCandidatesEmailEnabled }),
      // customFetch adds no Content-Type of its own; without it the body is not parsed as JSON.
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update suggested candidates email setting');
  }

  return (await response.json()) as SuggestedCandidatesEmailSetting;
}

export function useUpdateSuggestedCandidatesEmailSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ uid, suggestedCandidatesEmailEnabled }: MutationParams) => {
      const queryKey = [MembersQueryKeys.GET_SUGGESTED_CANDIDATES_EMAIL, uid];
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueryData<SuggestedCandidatesEmailSetting | null>(queryKey);

      queryClient.setQueryData<SuggestedCandidatesEmailSetting>(queryKey, (old) => ({
        ...old,
        suggestedCandidatesEmailEnabled,
      }));

      return { prev };
    },
    onError: (_error, { uid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([MembersQueryKeys.GET_SUGGESTED_CANDIDATES_EMAIL, uid], context.prev);
      }
      toast.error(SUGGESTED_CANDIDATES_EMAIL_SAVE_ERROR);
    },
    onSettled: (_data, _error, { uid }) => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_SUGGESTED_CANDIDATES_EMAIL, uid],
      });
    },
  });
}
