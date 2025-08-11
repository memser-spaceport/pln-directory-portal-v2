import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { IMember } from '@/types/members.types';

interface OfficeHoursValidationResponse {
  isValid: boolean;
  error?: string;
}

async function fetcher(member: IMember | undefined): Promise<OfficeHoursValidationResponse | null> {
  if (!member?.officeHours) {
    return null;
  }

  return { isValid: true };

  // const response = await customFetch(
  //   `${process.env.DIRECTORY_API_URL}/v1/members/${member.id}/office-hours/validate`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ url: member.officeHours }),
  //   },
  //   true,
  // );
  //
  // if (!response?.ok) {
  //   throw new Error('Failed to validate office hours link');
  // }
  //
  // return response.json();
}

export function useValidateOfficeHours(member: IMember | undefined, isLoggedIn: boolean) {
  return useQuery({
    queryKey: [MembersQueryKeys.VALIDATE_OFFICE_HOURS, member?.id, member?.officeHours],
    queryFn: () => fetcher(member),
    enabled: !!member?.officeHours && isLoggedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
