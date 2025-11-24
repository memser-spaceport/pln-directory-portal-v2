import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface AcceptConfidentialityData {
  accepted: boolean;
}

async function acceptConfidentiality(demoDayId: string, data: AcceptConfidentialityData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/confidentiality-policy`;

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
    throw new Error('Failed to accept confidentiality policy');
  }

  return true;
}

export function useAcceptConfidentiality() {
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation<boolean, Error, AcceptConfidentialityData>({
    mutationFn: (data: AcceptConfidentialityData) => acceptConfidentiality(demoDayId, data),
    onSuccess: () => {
      // Invalidate demo day state to refetch and close the modal
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE] });
    },
    onError: (error) => {
      console.error('Failed to accept confidentiality policy:', error);
    },
  });
}
