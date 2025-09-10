import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInvestorProfile } from '@/services/members.service';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { MembersQueryKeys } from '@/services/members/constants';

interface InvestorProfilePayload {
  investorProfile: {
    investmentFocus: string[];
    typicalCheckSize: string;
  };
}

interface MutationParams {
  memberUid: string;
  payload: InvestorProfilePayload;
}

async function mutation({ memberUid, payload }: MutationParams) {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    throw new Error('Cannot get auth token');
  }

  return await updateInvestorProfile(memberUid, payload, authToken);
}

export function useUpdateInvestorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER],
      });

      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBERS_LIST],
      });
    },
  });
}
