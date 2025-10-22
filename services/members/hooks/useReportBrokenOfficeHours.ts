import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

interface OfficeHoursValidationResponse {
  success: boolean;
  error?: string;
}

async function mutation({ memberId }: { memberId: string }): Promise<OfficeHoursValidationResponse | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${memberId}/interactions/broken-oh-attempt`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to report broken office hours link');
  }

  return response.json();
}

export function useReportBrokenOfficeHours() {
  return useMutation({
    mutationFn: mutation,
  });
}
