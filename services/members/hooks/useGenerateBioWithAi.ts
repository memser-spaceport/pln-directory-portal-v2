import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

async function mutation() {
  const response = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/husky/generation/bio`, {}, true);

  if (!response?.ok) {
    throw new Error('Failed to generate bio');
  }

  return (await response.json()) as { bio: string };
}

export function useGenerateBioWithAi() {
  return useMutation({
    mutationFn: mutation,
  });
}
