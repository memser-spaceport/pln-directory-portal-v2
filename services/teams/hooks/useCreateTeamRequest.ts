import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';
import { MembersQueryKeys } from '@/services/members/constants';

interface CreateTeamRequestParams {
  requesterEmailId: string;
  teamName: string;
  websiteAddress?: string;
}

async function mutation({ requesterEmailId, teamName, websiteAddress }: CreateTeamRequestParams) {
  const { authToken } = getCookiesFromClient();

  const payload = {
    participantType: 'TEAM',
    requesterEmailId,
    newData: {
      name: teamName,
      ...(websiteAddress && { website: websiteAddress }),
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/participants-request/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response?.ok) {
    const data = await response.json();
    toast.success('Team request submitted successfully');
    return data;
  } else {
    const errorData = await response.json().catch(() => ({}));
    toast.error(errorData?.message || 'Failed to submit team request');
    throw new Error(errorData?.message || 'Failed to submit team request');
  }
}

export function useCreateTeamRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      // Invalidate member queries to refresh team data
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER],
      });
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_SKILLS_OPTIONS],
      });
    },
  });
}

