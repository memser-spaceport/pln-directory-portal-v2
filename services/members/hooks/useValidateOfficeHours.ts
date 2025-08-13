import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { IMember } from '@/types/members.types';

interface OfficeHoursValidationResponse {
  status: IMember['ohStatus'];
  error?: string;
}

async function mutation({ link }: { link: string }): Promise<OfficeHoursValidationResponse | null> {
  // Normalize URL - add https:// if no protocol is provided
  let normalizedLink = link;
  if (!link.match(/^https?:\/\//i)) {
    normalizedLink = `https://${link}`;
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/office-hours/check-link`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link: normalizedLink }),
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
