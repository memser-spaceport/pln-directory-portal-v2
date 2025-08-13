import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { IMember } from '@/types/members.types';
import { MembersQueryKeys } from '@/services/members/constants';
import { normalizeOfficeHoursUrl } from '@/utils/common.utils';

interface OfficeHoursValidationResponse {
  ohStatus: IMember['ohStatus'];
  uid: string;
}

async function fetcher(uid: string | undefined, link?: string): Promise<OfficeHoursValidationResponse | null> {
  if (!uid) {
    return null;
  }

  // Prepare request body - include normalized link if provided
  let requestBody = {};
  if (link) {
    // Normalize URL - add https:// if no protocol is provided
    const normalizedLink = normalizeOfficeHoursUrl(link);
    requestBody = { link: normalizedLink };
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${uid}/office-hours/check`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to validate office hours link');
  }

  return response.json();
}

export function useValidateOfficeHoursQuery(uid: string | undefined, isLoggedIn: boolean, link?: string) {
  return useQuery({
    queryKey: [MembersQueryKeys.VALIDATE_OFFICE_HOURS, uid, link],
    queryFn: () => fetcher(uid, link),
    enabled: !!uid && !!isLoggedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
