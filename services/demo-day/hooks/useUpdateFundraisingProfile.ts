import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface UpdateFundraisingProfileData {
  logo?: string;
  name: string;
  shortDescription: string;
  industryTags: string[];
  fundingStage: string;
}

async function updateFundraisingProfile(data: UpdateFundraisingProfileData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/team`;

  const response = await customFetch(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update fundraising profile');
  }

  return true;
}

export function useUpdateFundraisingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFundraisingProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
    },
    onError: (error) => {
      console.error('Failed to update fundraising profile:', error);
    },
  });
}
