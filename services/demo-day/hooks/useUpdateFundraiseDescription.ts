import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface UpdateFundraiseDescriptionData {
  description: string;
}

async function updateFundraiseDescription(data: UpdateFundraiseDescriptionData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/description`;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update fundraise description');
  }

  return true;
}

export function useUpdateFundraiseDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFundraiseDescription,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST] });
    },
    onError: (error) => {
      console.error('Failed to update fundraise description:', error);
    },
  });
}

