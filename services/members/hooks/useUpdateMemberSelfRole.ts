import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';
import { MembersQueryKeys } from '@/services/members/constants';

interface UpdateMemberSelfRoleParams {
  memberUid: string;
  role: string;
}

async function mutation({ memberUid, role }: UpdateMemberSelfRoleParams) {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    throw new Error('Cannot get auth token');
  }

  const payload = {
    role,
  };

  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${memberUid}/self-role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response?.ok) {
    const data = await response.json();
    toast.success('Role updated successfully');
    return data;
  } else {
    const errorData = await response.json().catch(() => ({}));
    toast.error(errorData?.message || 'Failed to update role');
    throw new Error(errorData?.message || 'Failed to update role');
  }
}

export function useUpdateMemberSelfRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      // Invalidate member queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER],
      });
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBERS_LIST],
      });
    },
  });
}

