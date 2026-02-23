import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

async function mutation(uid: string) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${uid}/image`,
    { method: 'DELETE' },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to delete profile image');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export function useDeleteMemberImage() {
  return useMutation({ mutationFn: mutation });
}
