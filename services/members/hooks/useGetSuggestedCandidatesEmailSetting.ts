import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';

/**
 * A team lead's suggested candidates email setting (LAB-2849). The backend
 * stores an opt-out; this is its inverse, so `true` means "send it" and a member
 * with no stored row reads as `true`.
 */
export interface SuggestedCandidatesEmailSetting {
  memberUid?: string;
  suggestedCandidatesEmailEnabled: boolean;
}

export const suggestedCandidatesEmailSettingUrl = (uid: string) =>
  `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/suggested-candidates-email`;

async function fetcher(uid: string | undefined): Promise<SuggestedCandidatesEmailSetting | null> {
  if (!uid) {
    return null;
  }

  const response = await customFetch(suggestedCandidatesEmailSettingUrl(uid), { method: 'GET' }, true);

  if (!response?.ok) {
    throw new Error('Failed to fetch suggested candidates email setting');
  }

  return await response.json();
}

export function useGetSuggestedCandidatesEmailSetting(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_SUGGESTED_CANDIDATES_EMAIL, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
  });
}
