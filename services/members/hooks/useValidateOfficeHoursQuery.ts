import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { IMember } from '@/types/members.types';
import { MembersQueryKeys } from '@/services/members/constants';

interface OfficeHoursValidationResponse {
  ohStatus: IMember['ohStatus'];
  uid: string;
}

async function fetcher(uid: string | undefined): Promise<OfficeHoursValidationResponse | null> {
  if (!uid) {
    return null;
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${uid}/office-hours/check`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to validate office hours link');
  }

  return response.json();
}

export function useValidateOfficeHoursQuery(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.VALIDATE_OFFICE_HOURS, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
