import { useMutation, useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { IMember } from '@/types/members.types';

interface OfficeHoursValidationResponse {
  isValid: boolean;
  error?: string;
}

async function mutation({ link }: { link: string }): Promise<OfficeHoursValidationResponse | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/office-hours/check-link`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to validate office hours link');
  }

  return response.json();
}

export function useValidateOfficeHours() {
  return useMutation({
    mutationFn: mutation,
  });
}
